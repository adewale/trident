// The mermaid_core 0.3.2 parser for each Mermaid test family, called exactly as
// mermaid_core's own Mermaid facade calls it (src/mermaid.dart). Families whose
// parser the package's public library does not re-export are imported from the
// package's own src library that defines them; the code is the same.
import 'package:mermaid_core/mermaid_core.dart';
import 'package:mermaid_core/src/diagrams/architecture/architecture.dart';
import 'package:mermaid_core/src/diagrams/block/block.dart';
import 'package:mermaid_core/src/diagrams/cynefin/cynefin.dart';
import 'package:mermaid_core/src/diagrams/eventmodeling/eventmodeling.dart';
import 'package:mermaid_core/src/diagrams/git/git_graph.dart';
import 'package:mermaid_core/src/diagrams/ishikawa/ishikawa.dart';
import 'package:mermaid_core/src/diagrams/kanban/kanban.dart';
import 'package:mermaid_core/src/diagrams/radar/radar.dart';
import 'package:mermaid_core/src/diagrams/railroad/railroad.dart';
import 'package:mermaid_core/src/diagrams/treemap/treemap.dart';
import 'package:mermaid_core/src/diagrams/venn/venn.dart';
import 'package:mermaid_core/src/diagrams/wardley/wardley.dart';

/// Family -> (parser name as reported, parser). Keys are Trident's canonical
/// Mermaid test family names.
final Map<String, (String, Object Function(String))> parsers = {
  'flowchart': ('parseFlowchart', parseFlowchart),
  'sequence': ('parseSequence', parseSequence),
  'class': ('parseClassDiagram', parseClassDiagram),
  'state': ('parseStateDiagram', parseStateDiagram),
  'er': ('parseErDiagram', parseErDiagram),
  'pie': ('parsePieChart', parsePieChart),
  'gantt': ('parseGanttChart', parseGanttChart),
  'quadrant': ('parseQuadrantChart', parseQuadrantChart),
  'journey': ('parseJourney', parseJourney),
  'timeline': ('parseTimeline', parseTimeline),
  'xychart': ('parseXyChart', parseXyChart),
  'mindmap': ('parseMindmap', parseMindmap),
  'requirement': ('parseRequirementDiagram', parseRequirementDiagram),
  'c4': ('parseC4Diagram', parseC4Diagram),
  'gitgraph': ('parseGitGraph', parseGitGraph),
  'sankey': ('parseSankey', parseSankey),
  'packet': ('parsePacket', parsePacket),
  'block': ('parseBlock', parseBlock),
  'radar': ('parseRadar', parseRadar),
  'treemap': ('parseTreemap', parseTreemap),
  'kanban': ('parseKanban', parseKanban),
  'architecture': ('parseArchitecture', parseArchitecture),
  'cynefin': ('parseCynefin', parseCynefin),
  'venn': ('parseVenn', parseVenn),
  'ishikawa': ('parseIshikawa', parseIshikawa),
  'wardley': ('parseWardley', parseWardley),
  'eventmodeling': ('parseEventModeling', parseEventModeling),
  'railroad': ('parseRailroad', parseRailroad),
};
