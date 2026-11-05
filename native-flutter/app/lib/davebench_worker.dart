// Completion and API timing only. PNG bytes are never written; after the clock
// stops they receive the same mechanical admission as every DaveBench PNG:
// a PNG signature and an IHDR chunk with positive width and height.
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mermaid_flutter/mermaid_flutter.dart';

void main() {
  if (!kReleaseMode) throw StateError('DaveBench requires native release mode');
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MaterialApp(home: SizedBox()));
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    stdout.writeln(jsonEncode({'type': 'ready', 'package': 'mermaid_flutter', 'version': '0.3.2'}));
    await for (final line in stdin.transform(utf8.decoder).transform(const LineSplitter())) {
      final job = jsonDecode(line) as Map<String, dynamic>;
      final clock = Stopwatch()..start();
      var outcome = 'completed';
      Uint8List? bytes;
      try { bytes = await renderToPng(job['source'] as String, pixelRatio: 1); }
      catch (_) { outcome = 'error'; }
      final ms = clock.elapsedMicroseconds / 1000;
      String? invalid;
      if (outcome == 'completed') invalid = _pngAdmission(bytes);
      if (invalid != null) outcome = 'invalid';
      stdout.writeln(jsonEncode({'type': 'result', 'id': job['id'], 'outcome': outcome, 'ms': ms, if (invalid != null) 'invalid': invalid}));
    }
    exit(0);
  });
}

const _signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
String? _pngAdmission(Uint8List? bytes) {
  if (bytes == null || bytes.length < 24) return 'not a PNG';
  for (var i = 0; i < _signature.length; i++) { if (bytes[i] != _signature[i]) return 'not a PNG'; }
  if (String.fromCharCodes(bytes.sublist(12, 16)) != 'IHDR') return 'PNG has no IHDR';
  final view = ByteData.sublistView(bytes);
  if (view.getUint32(16) == 0 || view.getUint32(20) == 0) return 'zero-size PNG';
  return null;
}
