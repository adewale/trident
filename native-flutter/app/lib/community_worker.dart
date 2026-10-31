// Native Flutter transport for Trident's existing external-community protocol.
// Only the advertised mermaid_flutter renderToPng API renders the source.
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mermaid_flutter/mermaid_flutter.dart';

void main() {
  if (!kReleaseMode) throw StateError('Community worker requires native release mode');
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MaterialApp(home: SizedBox()));
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    try { await runJob(); exit(0); }
    catch (error, stack) { stderr.writeln('$error\n$stack'); exit(1); }
  });
}

Future<void> runJob() async {
  final env = Platform.environment;
  final job = jsonDecode(File(env['FLUTTER_COMMUNITY_JOB']!).readAsStringSync());
  final directory = Directory(env['FLUTTER_COMMUNITY_DIR']!);
  final sink = File(env['FLUTTER_COMMUNITY_RAW']!).openWrite();
  final timing = job['timing'] as Map<String, dynamic>;
  final coverage = job['coverageOnly'] == true;
  File('${directory.path}/runtime.json').writeAsStringSync(jsonEncode({
    'runtime': 'native Linux Flutter', 'release': kReleaseMode,
    'dart': Platform.version, 'os': Platform.operatingSystemVersion,
    'entrypoint': 'mermaid_flutter.renderToPng', 'packageVersion': '0.3.2',
    'pixelRatio': 1, 'startupExcludedFromApiClocks': true,
  }));
  var outputIndex = 0;
  var sequence = 0;
  for (final workload in job['workloads']) {
    final source = workload['source'] as String;
    final row = <String, dynamic>{'workload': workload['id'], 'release': kReleaseMode, 'sequence': sequence};
    final errors = <String>[];
    final previous = FlutterError.onError;
    FlutterError.onError = (details) { errors.add(details.exceptionAsString()); previous?.call(details); };
    var stage = 'public-api';
    var callIndex = 0;
    var lastDuration = 0.0;
    final callLedger = File('${directory.path}/public-invocations.jsonl');
    void record(Map<String, dynamic> value) {
      callLedger.writeAsStringSync('${jsonEncode(value)}\n', mode: FileMode.append, flush: true);
    }
    Future<Uint8List> invoke() async {
      final attemptId = '${job['invocationRunId']}:${sequence}:${callIndex++}';
      final frame = <String, dynamic>{
        'schema': 'trident-invocation-evidence-v1', 'attemptId': attemptId,
        'identity': workload['invocationIdentity'], 'state': 'started',
        'startedAt': DateTime.now().toUtc().toIso8601String(), 'finishedAt': null,
        'recordedAt': DateTime.now().toUtc().toIso8601String(),
        'durationMs': null, 'output': null, 'detail': 'Scheduled public call; no return inferred',
      };
      record(frame);
      final clock = Stopwatch()..start();
      Uint8List bytes;
      try { bytes = await renderToPng(source, pixelRatio: 1); }
      catch (error) {
        final duration = clock.elapsedMicroseconds / 1000;
        record({...frame, 'state': 'public-error', 'durationMs': duration,
          'finishedAt': DateTime.now().toUtc().toIso8601String(),
          'recordedAt': DateTime.now().toUtc().toIso8601String(), 'detail': error.toString()});
        rethrow;
      }
      final byteCount = bytes.length;
      lastDuration = clock.elapsedMicroseconds / 1000;
      final finishedAt = DateTime.now().toUtc().toIso8601String();
      final file = File('${directory.path}/return-$sequence-${callIndex - 1}.png');
      file.writeAsBytesSync(bytes, flush: true);
      record({...frame, 'state': 'returned', 'durationMs': lastDuration,
        'finishedAt': finishedAt, 'recordedAt': DateTime.now().toUtc().toIso8601String(),
        'outputPath': file.path, 'outputBytes': byteCount,
        'detail': 'Exact native public return persisted before observers; duration excludes retention'});
      if (callIndex == 1) row['invocationId'] = attemptId;
      return bytes;
    }

    final total = Stopwatch()..start();
    try {
      var bytes = await invoke();
      final firstBytes = bytes;
      final byteCount = bytes.length; // Consume the actual encoded result before stopping.
      row['firstMs'] = lastDuration;
      if (errors.isNotEmpty) throw StateError(errors.join('\n'));
      final samples = <double>[];
      final sampleIterations = <int>[];
      if (!coverage) {
        final warm = Stopwatch()..start();
        var calls = 0;
        while (calls < (timing['warmCalls'] as num).toInt() || warm.elapsedMilliseconds < (timing['warmupMs'] as num)) {
          bytes = await invoke(); calls++;
          if (bytes.isEmpty || errors.isNotEmpty) throw StateError('Warm render returned no PNG or framework error');
          if (total.elapsedMilliseconds > (timing['maxCaseMs'] as num)) throw StateError('Declared maxCaseMs exceeded');
        }
        for (var sample = 0; sample < (timing['samples'] as num); sample++) {
          final clock = Stopwatch()..start(); var count = 0; var duration = 0.0;
          do {
            bytes = await invoke(); count++; duration += lastDuration;
            if (bytes.isEmpty || errors.isNotEmpty) throw StateError('Repeated render returned no PNG or framework error');
            if (total.elapsedMilliseconds > (timing['maxCaseMs'] as num)) throw StateError('Declared maxCaseMs exceeded');
          } while (count < 256 && clock.elapsedMicroseconds / 1000 < (timing['minSampleMs'] as num));
          samples.add(duration / count);
          sampleIterations.add(count);
        }
      }
      // Preserve returned bytes before any observer or file operation can fail.
      row['pngReturned'] = true;
      stage = 'evidence';
      final file = File('${directory.path}/case-${outputIndex++}.png');
      final firstFile = File('${file.path}.first.png');
      row.addAll({'png': file.path, 'firstPng': firstFile.path, 'outputBytes': bytes.length, 'firstOutputBytes': byteCount, 'samplesMs': samples, 'sampleIterations': sampleIterations, 'timingProtocol': coverage ? 'native-png-api-one-call-qualification-v1' : 'legacy-adaptive-individually-retained-unqualified-v1', 'qualifiedOutputs': 'first and final; intermediate repeated outputs are consumed but not individually qualified'});
      file.writeAsBytesSync(bytes, flush: true);
      firstFile.writeAsBytesSync(firstBytes, flush: true);
      // Raw pixels are qualification only, outside all reported API clocks.
      stage = 'qualification';
      final codec = await ui.instantiateImageCodec(bytes);
      final image = (await codec.getNextFrame()).image;
      row['width'] = image.width; row['height'] = image.height;
      image.dispose(); codec.dispose();
      if (errors.isNotEmpty) throw StateError(errors.join('\n'));
      row['status'] = 'ok';
    } catch (error, stack) {
      row.addAll({'status': stage == 'public-api' ? 'error' : 'blocked', 'rejected': stage == 'public-api' && (error is UnsupportedError || error.runtimeType.toString() == 'MermaidParseException'), 'failureStage': stage, 'detail': error.toString(), 'stack': stack.toString(), 'frameworkErrors': errors});
    } finally { FlutterError.onError = previous; }
    sink.writeln(jsonEncode(row)); await sink.flush();
    stdout.writeln('completed ${row['workload']} ${row['status']}');
    // Parent qualification must finish before the next API clock starts.
    final acknowledgement = File('${directory.path}/ack-$sequence');
    final waiting = Stopwatch()..start();
    while (!acknowledgement.existsSync()) {
      if (waiting.elapsedMilliseconds > 120000) throw StateError('PNG qualification acknowledgement timed out');
      await Future<void>.delayed(const Duration(milliseconds: 5));
    }
    sequence++;
  }
  await sink.close();
}
