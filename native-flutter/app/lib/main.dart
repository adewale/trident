import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:developer' as developer;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/foundation.dart';
import 'package:mermaid_flutter/mermaid_flutter.dart';

final root = Platform.environment['BENCH_ROOT'] ?? Directory.current.path;
final output = Platform.environment['OUT'] ?? '$root/results/flutter';
final key = GlobalKey();
final frames = <Map<String, dynamic>>[];
const protocol = 'native-entrypoints-v2';
final injectFrameworkError =
    Platform.environment['BENCH_INJECT_FRAMEWORK_ERROR'] == '1';
late final IOSink sampleSink;
late final File errorFile;
String? active;
String? activeStage;
List<Map<String, dynamic>>? activeErrors;

void recordUnhandledError(String origin, Object error, StackTrace? stack) {
  final entry = <String, dynamic>{
    'protocol': protocol,
    'active_sample': active,
    'stage': activeStage,
    'timeline_us': developer.Timeline.now,
    'origin': origin,
    'error': error.toString(),
    'stack': stack?.toString(),
  };
  activeErrors?.add(entry);
  // Keep startup, preparation and between-sample errors even without a row.
  errorFile.writeAsStringSync(
    '${jsonEncode(entry)}\n',
    mode: FileMode.append,
    flush: true,
  );
}

String? sourceHash(String? source) {
  if (source == null) return null;
  var h = 2166136261;
  for (final byte in utf8.encode(source)) {
    h = ((h ^ byte) * 16777619) & 0xffffffff;
  }
  return h.toRadixString(16).padLeft(8, '0');
}

double ms(Stopwatch s) => s.elapsedMicroseconds / 1000;
void reserveOutput() {
  Directory(output).createSync(recursive: true);
  final sampleFile = File('$output/samples.jsonl');
  // O_EXCL reserves this run before any metadata or samples can be overwritten.
  sampleFile.createSync(exclusive: true);
  final runtimeFile = File('$output/runtime.json');
  runtimeFile.createSync(exclusive: true);
  runtimeFile.writeAsStringSync(
    jsonEncode({
      'protocol': protocol,
      'started_at_utc': DateTime.now().toUtc().toIso8601String(),
      'pid': pid,
      'release': kReleaseMode,
      'profile': kProfileMode,
      'dart': Platform.version,
      'os': Platform.operatingSystemVersion,
      'executable': Platform.resolvedExecutable,
      'source_hash_algorithm': 'fnv1a32-utf8',
      'error_association': 'active sample/stage at error delivery',
      'inject_framework_error': injectFrameworkError,
    }),
    flush: true,
  );
  errorFile = File('$output/framework-errors.jsonl');
  errorFile.createSync(exclusive: true);
  sampleSink = sampleFile.openWrite(mode: FileMode.append);
}

void main() {
  if (!kReleaseMode && !kProfileMode)
    throw StateError('Requires native release/profile');
  try {
    reserveOutput();
  } catch (error) {
    stderr.writeln('Cannot reserve benchmark output $output: $error');
    exit(1);
  }
  final previousFlutterError = FlutterError.onError;
  FlutterError.onError = (details) {
    recordUnhandledError('FlutterError', details.exception, details.stack);
    previousFlutterError?.call(details);
  };
  final previousPlatformError = ui.PlatformDispatcher.instance.onError;
  ui.PlatformDispatcher.instance.onError = (error, stack) {
    recordUnhandledError('PlatformDispatcher', error, stack);
    previousPlatformError?.call(error, stack);
    return true; // Retain the failure and allow the campaign to record its row.
  };
  WidgetsFlutterBinding.ensureInitialized();
  WidgetsBinding.instance.addTimingsCallback((list) {
    for (final f in list) {
      frames.add({
        'activeAtDelivery': active,
        'frameNumber': f.frameNumber,
        'build_us': f.buildDuration.inMicroseconds,
        'raster_us': f.rasterDuration.inMicroseconds,
        'total_us': f.totalSpan.inMicroseconds,
        'vsyncStart_us': f.timestampInMicroseconds(ui.FramePhase.vsyncStart),
        'buildStart_us': f.timestampInMicroseconds(ui.FramePhase.buildStart),
      });
    }
  });
  runApp(const MaterialApp(debugShowCheckedModeBanner: false, home: Bench()));
}

class Bench extends StatefulWidget {
  const Bench({super.key});
  @override
  State<Bench> createState() => _Bench();
}

class _Bench extends State<Bench> {
  Widget child = const SizedBox();
  Object? failure;
  int generation = 0;
  String? installedApi;
  String? installedSource;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      run().catchError((Object error, StackTrace stack) {
        stderr.writeln(error);
        stderr.writeln(stack);
        exit(1);
      });
    });
  }

  Future<void> frame() async {
    WidgetsBinding.instance.scheduleFrame();
    await WidgetsBinding.instance.endOfFrame;
  }

  Future<void> install(String api, String source, {bool fresh = false}) async {
    failure = null;
    if (fresh) generation++;
    Widget w = api == 'MermaidDiagram'
        ? MermaidDiagram(
            key: ValueKey(generation),
            source: source,
            errorBuilder: (c, e) {
              failure = e;
              return Text('ERROR: $e');
            },
          )
        : MermaidView(
            key: ValueKey(generation),
            source: source,
            errorBuilder: (c, e) {
              failure = e;
              return Text('ERROR: $e');
            },
          );
    setState(() => child = w);
    installedApi = api;
    installedSource = source;
    await WidgetsBinding.instance.endOfFrame;
  }

  Future<void> run() async {
    final sink = sampleSink;
    final cases =
        jsonDecode(File('$root/cases.json').readAsStringSync()) as List;
    final only = Platform.environment['ONLY_CASE'];
    final rounds = int.parse(Platform.environment['ROUNDS'] ?? '3'),
        samples = int.parse(Platform.environment['SAMPLES'] ?? '5');
    for (int round = 0; round < rounds; round++)
      for (final c in cases.where((c) => only == null || c['id'] == only))
        for (final api
            in ['MermaidDiagram', 'MermaidView', 'renderToPng'].where(
              (a) =>
                  Platform.environment['ONLY_API'] == null ||
                  a == Platform.environment['ONLY_API'],
            ))
          for (final phase in ['fresh', 'repeat', 'update'].where(
            (a) =>
                Platform.environment['ONLY_PHASE'] == null ||
                a == Platform.environment['ONLY_PHASE'],
          )) {
            final preparationErrors = <Map<String, dynamic>>[];
            if (api != 'renderToPng' && phase != 'fresh') {
              active = '${c['id']}/$api/$phase/$round/preparation';
              activeStage = 'preparation';
              activeErrors = preparationErrors;
              try {
                await install(api, c['source'], fresh: true);
                // Finish initial fit outside repeat/update timing, even with no warmup.
                if (api == 'MermaidView') await frame();
              } finally {
                active = null;
                activeStage = null;
                activeErrors = null;
              }
            }
            for (
              int i = -int.parse(Platform.environment['WARMUPS'] ?? '2');
              i < samples;
              i++
            ) {
              active = '${c['id']}/$api/$phase/$round/$i';
              activeStage = 'measured_call';
              final sampleErrors = <Map<String, dynamic>>[...preparationErrors];
              activeErrors = sampleErrors;
              final source = phase == 'update' && i.isEven
                  ? c['updatedSource'] as String
                  : c['source'] as String;
              final before = api != 'renderToPng' && installedApi == api
                  ? installedSource
                  : null;
              final needsFit =
                  api == 'MermaidView' &&
                  (phase == 'fresh' || before != source);
              final row = <String, dynamic>{
                'protocol': protocol,
                'sample_id': active,
                'id': c['id'],
                'api': api,
                'phase': phase,
                'round': round,
                'sample': i,
                'release': kReleaseMode,
                'source_hash_algorithm': 'fnv1a32-utf8',
                'source_before_hash': sourceHash(before),
                'source_after_hash': sourceHash(source),
                // Exact string equality drives the workload, never hash equality.
                'source_changed': before == null ? null : before != source,
                'needs_fit': needsFit,
                'awaited_frames': 0,
                'measured_call_started': false,
                'failure_stage': null,
                'framework_errors': sampleErrors,
              };
              row['sourceUpdated'] = source != c['source'];
              void checkErrors() {
                if (sampleErrors.isNotEmpty) {
                  throw StateError(
                    'Framework/platform errors associated with sample',
                  );
                }
                if (api != 'renderToPng' && failure != null) throw failure!;
              }

              void injectErrorForVerification() {
                if (injectFrameworkError) {
                  FlutterError.reportError(
                    FlutterErrorDetails(
                      exception: StateError('BENCH_INJECT_FRAMEWORK_ERROR'),
                      stack: StackTrace.current,
                      library: 'native-entrypoints-v2 benchmark harness',
                      context: ErrorDescription(
                        'verifying active sample errors',
                      ),
                    ),
                  );
                }
              }

              row['timeline_start_us'] = developer.Timeline.now;
              final sw = Stopwatch()..start();
              try {
                if (preparationErrors.isNotEmpty) {
                  activeStage = 'preparation';
                  checkErrors();
                }
                row['measured_call_started'] = true;
                if (api == 'renderToPng') {
                  final png = await renderToPng(source, pixelRatio: 1);
                  row['render_png_ms'] = ms(sw);
                  activeStage = 'validation';
                  injectErrorForVerification();
                  checkErrors();
                  row['png_bytes'] = png.length;
                  // Decode outside public API clock to prove PNG pixels exist.
                  final codec = await ui.instantiateImageCodec(png);
                  try {
                    final image = (await codec.getNextFrame()).image;
                    try {
                      row['width'] = image.width;
                      row['height'] = image.height;
                      final read = Stopwatch()..start();
                      final data = await image.toByteData(
                        format: ui.ImageByteFormat.rawRgba,
                      );
                      row['validation_readback_ms'] = ms(read);
                      row['painted_pixels'] = painted(data!);
                      row['pixel_hash'] = hash(data);
                      checkErrors();
                      row['status'] = row['painted_pixels'] > 0
                          ? 'painted'
                          : 'blank';
                    } finally {
                      image.dispose();
                    }
                  } finally {
                    codec.dispose();
                  }
                  if (round == 0 &&
                      i == 0 &&
                      (phase == 'fresh' || phase == 'update'))
                    File(
                      '$output/${c['id'].replaceAll(':', '_')}_${api}_$phase.png',
                    ).writeAsBytesSync(png);
                } else {
                  await install(api, source, fresh: phase == 'fresh');
                  row['awaited_frames'] = 1;
                  row['ui_frame_ms'] = ms(sw);
                  row['ui_end_us'] = developer.Timeline.now;
                  // Only a fresh or changed View needs the post-frame fit painted.
                  if (needsFit) {
                    await frame();
                    row['awaited_frames'] = 2;
                  }
                  row['settled_ui_ms'] = ms(sw);
                  row['settled_ui_end_us'] = developer.Timeline.now;
                  activeStage = 'validation';
                  injectErrorForVerification();
                  checkErrors();
                  final b =
                      key.currentContext!.findRenderObject()
                          as RenderRepaintBoundary;
                  activeStage = 'capture';
                  final capture = Stopwatch()..start();
                  final image = await b.toImage(pixelRatio: 1);
                  row['capture_raster_ms'] = ms(capture);
                  try {
                    checkErrors();
                    activeStage = 'validation';
                    final read = Stopwatch()..start();
                    final pixels = await image.toByteData(
                      format: ui.ImageByteFormat.rawRgba,
                    );
                    row['pixel_readback_ms'] = ms(read);
                    row['width'] = image.width;
                    row['height'] = image.height;
                    row['painted_pixels'] = painted(pixels!);
                    row['pixel_hash'] = hash(pixels);
                    final enc = Stopwatch()..start();
                    final png = await image.toByteData(
                      format: ui.ImageByteFormat.png,
                    );
                    row['png_encode_and_readback_ms'] = ms(enc);
                    row['png_bytes'] = png!.lengthInBytes;
                    checkErrors();
                    row['status'] = row['painted_pixels'] > 0
                        ? 'painted'
                        : 'blank';
                    if (round == 0 &&
                        i == 0 &&
                        (phase == 'fresh' || phase == 'update'))
                      File(
                        '$output/${c['id'].replaceAll(':', '_')}_${api}_$phase.png',
                      ).writeAsBytesSync(png.buffer.asUint8List());
                  } finally {
                    image.dispose();
                  }
                }
                // Catch errors delivered during decode, readback, encoding or capture.
                checkErrors();
              } catch (e, st) {
                row['status'] = 'error';
                row['failure_stage'] = sampleErrors.isNotEmpty
                    ? sampleErrors.first['stage']
                    : activeStage;
                row['error'] = e.toString();
                row['stack'] = st.toString();
                row['failed_after_ms'] = ms(sw);
              } finally {
                active = null;
                activeStage = null;
                activeErrors = null;
              }
              sink.writeln(jsonEncode(row));
            }
            await sink.flush();
            print('done $round ${c['id']} $api $phase');
          }
    await Future<void>.delayed(const Duration(seconds: 2));
    File('$output/frames.json').writeAsStringSync(jsonEncode(frames));
    await sink.close();
    exit(0);
  }

  int hash(dynamic bytes) {
    final p = bytes.buffer.asUint8List();
    int h = 2166136261;
    for (int j = 0; j < p.length; j++) {
      h = ((h ^ p[j]) * 16777619) & 0xffffffff;
    }
    return h;
  }

  int painted(dynamic bytes) {
    final p = bytes.buffer.asUint8List();
    int n = 0;
    for (int j = 0; j < p.length; j += 4) {
      if (p[j + 3] > 0 && (p[j] < 240 || p[j + 1] < 240 || p[j + 2] < 240)) n++;
    }
    return n;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: RepaintBoundary(
      key: key,
      child: ColoredBox(
        color: Colors.white,
        child: SizedBox.expand(child: Center(child: child)),
      ),
    ),
  );
}
