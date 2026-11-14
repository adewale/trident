// Drawing Correctness output only: the same public call as the DaveBench counter,
// renderToPng(source, pixelRatio: 1), with the same mechanical PNG admission.
// Admitted bytes are returned base64-encoded for retention and assessment. No
// clock is read: Drawing measures what is drawn, not how long it took.
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mermaid_flutter/mermaid_flutter.dart';
import 'package:native_bench/png_admission.dart';

void main(List<String> arguments) {
  if (arguments.isNotEmpty && (arguments.length != 1 || arguments.single != '--smoke')) throw ArgumentError('Use --smoke or no arguments');
  if (!kReleaseMode) throw StateError('Drawing output requires native release mode');
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MaterialApp(home: SizedBox()));
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    stdout.writeln(jsonEncode({'type': 'ready', 'package': 'mermaid_flutter', 'version': '0.3.2', 'runtime': {'dart': Platform.version, 'platform': Platform.operatingSystem}, 'mode': 'release', 'target': 'drawing', 'pixelRatio': 1}));
    if (arguments.isNotEmpty) {
      final checks = await nativePngAdmissionControls();
      stdout.writeln(jsonEncode({'type': 'admission-smoke', 'checks': checks}));
    }
    await for (final line in stdin.transform(utf8.decoder).transform(const LineSplitter())) {
      final job = jsonDecode(line) as Map<String, dynamic>;
      Uint8List? bytes;
      String? error;
      try { bytes = await renderToPng(job['source'] as String, pixelRatio: 1); }
      catch (thrown) { error = thrown.toString(); }
      if (error != null) {
        stdout.writeln(jsonEncode({'type': 'result', 'id': job['id'], 'outcome': 'error', 'error': error.length > 400 ? error.substring(0, 400) : error}));
        continue;
      }
      final invalid = await nativePngAdmission(bytes);
      stdout.writeln(jsonEncode({'type': 'result', 'id': job['id'], 'outcome': invalid == null ? 'completed' : 'invalid', if (invalid != null) 'invalid': invalid, if (invalid == null) 'png': base64Encode(bytes!)}));
    }
    exit(0);
  });
}
