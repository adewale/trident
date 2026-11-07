// Completion and API timing only. PNG bytes are never written; after the clock
// stops they receive the same mechanical admission as every DaveBench PNG:
// a PNG signature, positive IHDR dimensions and a successfully decoded image.
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mermaid_flutter/mermaid_flutter.dart';
import 'png_admission.dart';

void main(List<String> arguments) {
  if (arguments.isNotEmpty && (arguments.length != 1 || arguments.single != '--smoke')) throw ArgumentError('Use --smoke or no arguments');
  if (!kReleaseMode) throw StateError('DaveBench requires native release mode');
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MaterialApp(home: SizedBox()));
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    stdout.writeln(jsonEncode({'type': 'ready', 'package': 'mermaid_flutter', 'version': '0.3.2', 'runtime': {'dart': Platform.version, 'platform': Platform.operatingSystem}, 'mode': 'release'}));
    if (arguments.isNotEmpty) {
      final checks = await nativePngAdmissionControls();
      stdout.writeln(jsonEncode({'type': 'admission-smoke', 'checks': checks}));
    }
    await for (final line in stdin.transform(utf8.decoder).transform(const LineSplitter())) {
      final job = jsonDecode(line) as Map<String, dynamic>;
      final clock = Stopwatch()..start();
      var outcome = 'completed';
      Uint8List? bytes;
      try { bytes = await renderToPng(job['source'] as String, pixelRatio: 1); }
      catch (_) { outcome = 'error'; }
      final ms = clock.elapsedMicroseconds / 1000;
      String? invalid;
      if (outcome == 'completed') invalid = await nativePngAdmission(bytes);
      if (invalid != null) outcome = 'invalid';
      stdout.writeln(jsonEncode({'type': 'result', 'id': job['id'], 'outcome': outcome, 'ms': ms, if (invalid != null) 'invalid': invalid}));
    }
    exit(0);
  });
}

