// Completion and API timing only. PNG bytes are never written or inspected.
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
      try { await renderToPng(job['source'] as String, pixelRatio: 1); }
      catch (_) { outcome = 'error'; }
      final ms = clock.elapsedMicroseconds / 1000;
      stdout.writeln(jsonEncode({'type': 'result', 'id': job['id'], 'outcome': outcome, 'ms': ms}));
    }
    exit(0);
  });
}
