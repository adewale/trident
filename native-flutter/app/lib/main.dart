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
String? active;
double ms(Stopwatch s) => s.elapsedMicroseconds / 1000;
void main() {
  if (!kReleaseMode && !kProfileMode)
    throw StateError('Requires native release/profile');
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
    await WidgetsBinding.instance.endOfFrame;
  }

  Future<void> run() async {
    Directory(output).createSync(recursive: true);
    final sampleFile = File('$output/samples.jsonl');
    if (sampleFile.existsSync()) {
      throw StateError('Output already contains samples: $output');
    }
    final sink = sampleFile.openWrite();
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
            if (api != 'renderToPng' && phase != 'fresh')
              await install(api, c['source'], fresh: true);
            for (
              int i = -int.parse(Platform.environment['WARMUPS'] ?? '2');
              i < samples;
              i++
            ) {
              active = '${c['id']}/$api/$phase/$round/$i';
              final row = <String, dynamic>{
                'id': c['id'],
                'api': api,
                'phase': phase,
                'round': round,
                'sample': i,
                'release': kReleaseMode,
              };
              final source = phase == 'update' && i.isEven
                  ? c['updatedSource']
                  : c['source'];
              row['sourceUpdated'] = source != c['source'];
              row['timeline_start_us'] = developer.Timeline.now;
              final sw = Stopwatch()..start();
              try {
                if (api == 'renderToPng') {
                  final png = await renderToPng(source, pixelRatio: 1);
                  row['render_png_ms'] = ms(sw);
                  row['png_bytes'] = png.length;
                  // Decode outside public API clock to prove PNG pixels exist.
                  final codec = await ui.instantiateImageCodec(png);
                  final image = (await codec.getNextFrame()).image;
                  row['width'] = image.width;
                  row['height'] = image.height;
                  final read = Stopwatch()..start();
                  final data = await image.toByteData(
                    format: ui.ImageByteFormat.rawRgba,
                  );
                  row['validation_readback_ms'] = ms(read);
                  row['painted_pixels'] = painted(data!);
                  row['pixel_hash'] = hash(data);
                  row['status'] = row['painted_pixels'] > 0
                      ? 'painted'
                      : 'blank';
                  image.dispose();
                  codec.dispose();
                  if (round == 0 &&
                      i == 0 &&
                      (phase == 'fresh' || phase == 'update'))
                    File(
                      '$output/${c['id'].replaceAll(':', '_')}_${api}_$phase.png',
                    ).writeAsBytesSync(png);
                } else {
                  await install(api, source, fresh: phase == 'fresh');
                  row['ui_frame_ms'] = ms(sw);
                  row['ui_end_us'] = developer.Timeline.now;
                  // MermaidView fits in a post-frame callback, so let the fit paint too.
                  if (api == 'MermaidView') await frame();
                  row['settled_ui_ms'] = ms(sw);
                  row['settled_ui_end_us'] = developer.Timeline.now;
                  if (failure != null) throw failure!;
                  final b =
                      key.currentContext!.findRenderObject()
                          as RenderRepaintBoundary;
                  final capture = Stopwatch()..start();
                  final image = await b.toImage(pixelRatio: 1);
                  row['capture_raster_ms'] = ms(capture);
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
                  row['status'] = row['painted_pixels'] > 0
                      ? 'painted'
                      : 'blank';
                  if (round == 0 &&
                      i == 0 &&
                      (phase == 'fresh' || phase == 'update'))
                    File(
                      '$output/${c['id'].replaceAll(':', '_')}_${api}_$phase.png',
                    ).writeAsBytesSync(png.buffer.asUint8List());
                  image.dispose();
                }
              } catch (e, st) {
                row['status'] = 'error';
                row['error'] = e.toString();
                row['stack'] = st.toString();
                row['failed_after_ms'] = ms(sw);
              }
              sink.writeln(jsonEncode(row));
            }
            await sink.flush();
            print('done $round ${c['id']} $api $phase');
          }
    await Future<void>.delayed(const Duration(seconds: 2));
    File('$output/frames.json').writeAsStringSync(jsonEncode(frames));
    File('$output/runtime.json').writeAsStringSync(
      jsonEncode({
        'release': kReleaseMode,
        'profile': kProfileMode,
        'dart': Platform.version,
        'os': Platform.operatingSystemVersion,
        'executable': Platform.resolvedExecutable,
      }),
    );
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
