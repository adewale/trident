// Native Flutter transport for Trident's existing external-community protocol.
// Only the advertised mermaid_flutter renderToPng API renders the source.
import 'dart:convert';
import 'dart:io';
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
  for (final workload in job['workloads']) {
    final source = workload['source'] as String;
    final row = <String, dynamic>{'workload': workload['id'], 'release': kReleaseMode};
    final errors = <String>[];
    final previous = FlutterError.onError;
    FlutterError.onError = (details) { errors.add(details.exceptionAsString()); previous?.call(details); };
    var stage = 'public-api';
    final total = Stopwatch()..start();
    try {
      final first = Stopwatch()..start();
      var bytes = await renderToPng(source, pixelRatio: 1);
      final firstBytes = bytes;
      final byteCount = bytes.length; // Consume the actual encoded result before stopping.
      row['firstMs'] = first.elapsedMicroseconds / 1000;
      if (errors.isNotEmpty) throw StateError(errors.join('\n'));
      final samples = <double>[];
      final sampleIterations = <int>[];
      if (!coverage) {
        final warm = Stopwatch()..start();
        var calls = 0;
        while (calls < (timing['warmCalls'] as num).toInt() || warm.elapsedMilliseconds < (timing['warmupMs'] as num)) {
          bytes = await renderToPng(source, pixelRatio: 1); calls++;
          if (bytes.isEmpty || errors.isNotEmpty) throw StateError('Warm render returned no PNG or framework error');
          if (total.elapsedMilliseconds > (timing['maxCaseMs'] as num)) throw StateError('Declared maxCaseMs exceeded');
        }
        for (var sample = 0; sample < (timing['samples'] as num); sample++) {
          final clock = Stopwatch()..start(); var count = 0;
          do {
            bytes = await renderToPng(source, pixelRatio: 1); count++;
            if (bytes.isEmpty || errors.isNotEmpty) throw StateError('Repeated render returned no PNG or framework error');
            if (total.elapsedMilliseconds > (timing['maxCaseMs'] as num)) throw StateError('Declared maxCaseMs exceeded');
          } while (count < 256 && clock.elapsedMicroseconds / 1000 < (timing['minSampleMs'] as num));
          samples.add(clock.elapsedMicroseconds / 1000 / count);
          sampleIterations.add(count);
        }
      }
      // Raw pixels are qualification only, outside all reported API clocks.
      stage = 'qualification';
      final codec = await ui.instantiateImageCodec(bytes);
      final image = (await codec.getNextFrame()).image;
      row['width'] = image.width; row['height'] = image.height;
      image.dispose(); codec.dispose();
      if (errors.isNotEmpty) throw StateError(errors.join('\n'));
      final file = File('${directory.path}/case-${outputIndex++}.png');
      file.writeAsBytesSync(bytes);
      final firstFile = File('${file.path}.first.png');
      firstFile.writeAsBytesSync(firstBytes);
      row.addAll({'status': 'ok', 'png': file.path, 'firstPng': firstFile.path, 'outputBytes': bytes.length, 'firstOutputBytes': byteCount, 'samplesMs': samples, 'sampleIterations': sampleIterations, 'timingProtocol': 'native-png-api-5-batch-means-min10ms-max256-v1', 'qualifiedOutputs': 'first and final; intermediate repeated outputs are consumed but not individually qualified'});
    } catch (error, stack) {
      row.addAll({'status': 'error', 'rejected': stage == 'public-api' && (error is UnsupportedError || error.runtimeType.toString() == 'MermaidParseException'), 'failureStage': stage, 'detail': error.toString(), 'stack': stack.toString(), 'frameworkErrors': errors});
    } finally { FlutterError.onError = previous; }
    sink.writeln(jsonEncode(row)); await sink.flush();
    stdout.writeln('completed ${row['workload']} ${row['status']}');
  }
  await sink.close();
}
