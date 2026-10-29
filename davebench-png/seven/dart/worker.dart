import 'dart:convert';
import 'dart:io';
import 'package:mermaid_core/mermaid_core.dart';

// Mermaid Dart is a distinct native Dart participant, never a Flutter substitute.
Future<void> main() async {
  if (!const bool.fromEnvironment('dart.vm.product')) {
    throw StateError('Compile this worker with dart compile exe');
  }
  final theme = MermaidTheme.defaultTheme.copyWith(
    fontFamily: 'Inter', fontSize: 14,
    background: const Color(0xffffffff),
    primaryColor: const Color(0xffffffff),
    primaryTextColor: const Color(0xff222222),
    primaryBorderColor: const Color(0xff444444),
    secondaryColor: const Color(0xffffffff),
    lineColor: const Color(0xff222222),
    arrowheadColor: const Color(0xff222222),
    textColor: const Color(0xff222222),
    nodeBorder: const Color(0xff444444),
    mainBkg: const Color(0xffffffff),
    clusterBkg: const Color(0xffffffff),
    clusterBorder: const Color(0xff444444),
    titleColor: const Color(0xff222222),
    edgeLabelBackground: const Color(0xffffffff),
  );
  final engine = Mermaid(measurer: const ApproximateTextMeasurer(), theme: theme);
  stdout.writeln('@@READY@@${jsonEncode({'runtime': Platform.version, 'aot': true, 'api': 'Mermaid.render + renderSceneToSvg', 'measurer': 'ApproximateTextMeasurer'})}');
  await for (final line in stdin.transform(utf8.decoder).transform(const LineSplitter())) {
    final job = jsonDecode(line) as Map<String, dynamic>;
    final row = <String, dynamic>{'id': job['id']};
    try {
      final timer = Stopwatch()..start();
      final svg = renderSceneToSvg(engine.render(job['source'] as String));
      final consumed = svg.length;
      row.addAll({'status': 'ok', 'apiMs': timer.elapsedMicroseconds / 1000, 'svg': svg, 'characters': consumed});
    } catch (error) {
      row.addAll({'status': 'error', 'stage': 'public-api', 'detail': error.toString()});
    }
    stdout.writeln('@@RESULT@@${jsonEncode(row)}');
    await stdout.flush();
  }
}
