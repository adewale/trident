// The mermaid_core parser for each Mermaid test family, called exactly as mermaid_core's
// own Mermaid facade calls it (src/mermaid.dart). Mermaid Fidelity compares public
// interfaces only, so every parser comes from the package's public library
// (package:mermaid_core/mermaid_core.dart). The families whose parser that library does
// not export (its src/ libraries are implementation files by Dart convention) are listed
// in `privateFamilies`; the bridge reports them as operations the public interface does
// not offer, without calling them.
import 'package:mermaid_core/mermaid_core.dart';

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
  'sankey': ('parseSankey', parseSankey),
  'packet': ('parsePacket', parsePacket),
};

/// Families whose mermaid_core 0.3.2 parser exists only in a src/ library that the
/// public library does not export (family -> that parser's name).
const Map<String, String> privateFamilies = {
  'gitgraph': 'parseGitGraph',
  'block': 'parseBlock',
  'radar': 'parseRadar',
  'treemap': 'parseTreemap',
  'kanban': 'parseKanban',
  'architecture': 'parseArchitecture',
  'cynefin': 'parseCynefin',
  'venn': 'parseVenn',
  'ishikawa': 'parseIshikawa',
  'wardley': 'parseWardley',
  'eventmodeling': 'parseEventModeling',
  'railroad': 'parseRailroad',
};
