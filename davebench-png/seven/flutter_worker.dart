// Persistent native Flutter release worker for a fixed, no-scaling PNG contract.
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mermaid_core/mermaid_core.dart' as core;
import 'package:mermaid_flutter/mermaid_flutter.dart';

void main() {
  if (!kReleaseMode) throw StateError('Native release mode required');
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MaterialApp(home: SizedBox()));
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    try {
      await serve();
      exit(0);
    } catch (error, stack) {
      stderr.writeln('$error\n$stack');
      exit(1);
    }
  });
}

Future<void> serve() async {
  final fontFile = File(Platform.environment['CONTROLLED_FONT']!);
  await ui.loadFontFromList(fontFile.readAsBytesSync(), fontFamily: 'Inter');
  final probe = (ui.ParagraphBuilder(
    ui.ParagraphStyle(fontFamily: 'Inter', fontSize: 14),
  )..addText('MMMM1111iiii')).build();
  probe.layout(const ui.ParagraphConstraints(width: 10000));
  stdout.writeln(
    '@@READY@@${jsonEncode({'release': kReleaseMode, 'dart': Platform.version, 'font': fontFile.path, 'fontProbeWidth': probe.longestLine, 'api': 'renderToPng'})}',
  );
  probe.dispose();
  final theme = core.MermaidTheme.defaultTheme.copyWith(
    fontFamily: 'Inter',
    fontSize: 14,
    background: const core.Color(0xffffffff),
    primaryColor: const core.Color(0xffffffff),
    primaryTextColor: const core.Color(0xff222222),
    primaryBorderColor: const core.Color(0xff444444),
    secondaryColor: const core.Color(0xffffffff),
    lineColor: const core.Color(0xff222222),
    arrowheadColor: const core.Color(0xff222222),
    textColor: const core.Color(0xff222222),
    nodeBorder: const core.Color(0xff444444),
    mainBkg: const core.Color(0xffffffff),
    clusterBkg: const core.Color(0xffffffff),
    clusterBorder: const core.Color(0xff444444),
    titleColor: const core.Color(0xff222222),
    edgeLabelBackground: const core.Color(0xffffffff),
  );
  await for (final line
      in stdin.transform(utf8.decoder).transform(const LineSplitter())) {
    final job = jsonDecode(line) as Map<String, dynamic>;
    final row = <String, dynamic>{'id': job['id'], 'release': kReleaseMode};
    if (job['stop'] == true) break;
    Uint8List? intrinsic, encoded;
    ui.Codec? codec;
    ui.Image? image;
    ui.Image? finalImage;
    ui.Picture? picture;
    final errors = <String>[];
    final previous = FlutterError.onError;
    FlutterError.onError = (details) {
      errors.add(details.exceptionAsString());
      previous?.call(details);
    };
    var stage = 'public-api';
    final total = Stopwatch()..start();
    try {
      intrinsic = await renderToPng(
        job['source'] as String,
        pixelRatio: 1,
        theme: theme,
      );
      final consumed = intrinsic.length;
      row['apiMs'] = total.elapsedMicroseconds / 1000;
      stage = 'fixed-canvas';
      codec = await ui.instantiateImageCodec(intrinsic);
      image = (await codec.getNextFrame()).image;
      final decodedAt = total.elapsedMicroseconds / 1000;
      row['decodeMs'] = decodedAt - (row['apiMs'] as double);
      row['naturalWidth'] = image.width;
      row['naturalHeight'] = image.height;
      if (image.width > 1140 || image.height > 840)
        throw StateError(
          'contract-fit: intrinsic image exceeds fixed canvas with margin; resizing prohibited',
        );
      final recorder = ui.PictureRecorder();
      final canvas = ui.Canvas(recorder);
      canvas.drawRect(
        const ui.Rect.fromLTWH(0, 0, 1200, 900),
        ui.Paint()..color = const ui.Color(0xffffffff),
      );
      canvas.drawImage(
        image,
        ui.Offset(
          ((1200 - image.width) / 2).floorToDouble(),
          ((900 - image.height) / 2).floorToDouble(),
        ),
        ui.Paint()..filterQuality = ui.FilterQuality.none,
      );
      picture = recorder.endRecording();
      final recordedAt = total.elapsedMicroseconds / 1000;
      row['pictureRecordMs'] = recordedAt - decodedAt;
      finalImage = await picture.toImage(1200, 900);
      final rasterAt = total.elapsedMicroseconds / 1000;
      row['rasterImageMs'] = rasterAt - recordedAt;
      final data = await finalImage.toByteData(format: ui.ImageByteFormat.png);
      if (data == null) throw StateError('No final encoded PNG');
      encoded = data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);
      row['bytes'] = encoded.length;
      row['totalMs'] = total.elapsedMicroseconds / 1000;
      row['pngReadbackEncodeMs'] = (row['totalMs'] as double) - rasterAt;
      row['normalizationMs'] =
          (row['totalMs'] as double) - (row['apiMs'] as double);
      row['intrinsicBytes'] = consumed;
      if (errors.isNotEmpty) throw StateError(errors.join('\n'));
      row['status'] = 'ok';
    } catch (error, stack) {
      row.addAll({
        'status': error.toString().contains('contract-fit:')
            ? 'contract-failed'
            : 'error',
        'stage': stage,
        'detail': error.toString(),
        'stack': stack.toString(),
        'frameworkErrors': errors,
      });
    } finally {
      FlutterError.onError = previous;
      finalImage?.dispose();
      picture?.dispose();
      image?.dispose();
      codec?.dispose();
    }
    // The client clock includes Base64 serialization, IPC and binary consumption.
    // Files are retained by the driver only after the client clock stops.
    if (encoded != null) row['pngBase64'] = base64Encode(encoded);
    if (intrinsic != null && row['status'] != 'ok') {
      row['intrinsicPngBase64'] = base64Encode(intrinsic);
    }
    stdout.writeln('@@RESULT@@${jsonEncode(row)}');
    await stdout.flush();
  }
}
