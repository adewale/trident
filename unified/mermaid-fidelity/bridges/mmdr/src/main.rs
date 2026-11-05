// 1jehuang/mermaid-rs-renderer (mmdr) parser bridge: calls the crate's public
// `parse_mermaid` (the entry point the mmdr CLI itself uses) and prints the
// ParseOutput's graph with its init_config beside it, mapped by hand (the IR has no Serialize) with its
// native field names. It parses nothing itself. See ../../bridges.ts for the
// reply protocol.
#[macro_use]
mod protocol;

use protocol::{Reply, ToJson, family_matches};

variants!(mermaid_rs_renderer::ir::Direction { TopDown, LeftRight, BottomTop, RightLeft });
variants!(mermaid_rs_renderer::ir::DiagramKind {
    Flowchart, Class, State, Sequence, Er, Pie, Mindmap, Journey, Timeline, Gantt, Requirement, GitGraph, C4,
    Sankey, Quadrant, ZenUML, Block, Packet, Kanban, Architecture, Radar, Treemap, XYChart,
});
variants!(mermaid_rs_renderer::ir::SequenceFrameKind { Alt, Opt, Loop, Par, Rect, Critical, Break });
variants!(mermaid_rs_renderer::ir::SequenceNotePosition { LeftOf, RightOf, Over });
variants!(mermaid_rs_renderer::ir::StateNotePosition { LeftOf, RightOf });
variants!(mermaid_rs_renderer::ir::SequenceActivationKind { Activate, Deactivate });
variants!(mermaid_rs_renderer::ir::GanttStatus { Done, Active, Crit, Milestone });
variants!(mermaid_rs_renderer::ir::GitGraphCommitType { Normal, Reverse, Highlight, Merge, CherryPick });
variants!(mermaid_rs_renderer::ir::C4ShapeKind {
    Person, ExternalPerson, System, SystemDb, SystemQueue, ExternalSystem, ExternalSystemDb, ExternalSystemQueue,
    Container, ContainerDb, ContainerQueue, ExternalContainer, ExternalContainerDb, ExternalContainerQueue,
    Component, ComponentDb, ComponentQueue, ExternalComponent, ExternalComponentDb, ExternalComponentQueue,
});
variants!(mermaid_rs_renderer::ir::C4RelKind { Rel, BiRel, RelUp, RelDown, RelLeft, RelRight, RelBack });
variants!(mermaid_rs_renderer::ir::ArchDir { Left, Right, Top, Bottom });
variants!(mermaid_rs_renderer::ir::EdgeStyle { Solid, Dotted, Thick });
variants!(mermaid_rs_renderer::ir::EdgeDecoration {
    Circle, Cross, Diamond, DiamondFilled, CrowsFootOne, CrowsFootZeroOne, CrowsFootMany, CrowsFootZeroMany,
});
variants!(mermaid_rs_renderer::ir::EdgeArrowhead { OpenTriangle, ClassDependency });
variants!(mermaid_rs_renderer::ir::NodeShape {
    Rectangle, ForkJoin, RoundRect, Stadium, Subroutine, Cylinder, ActorBox, Circle, DoubleCircle, Diamond,
    Hexagon, Parallelogram, ParallelogramAlt, Trapezoid, TrapezoidAlt, Asymmetric, MindmapDefault, Text,
});
variants!(mermaid_rs_renderer::ir::MindmapNodeType { Default, RoundedRect, Rect, Circle, Cloud, Bang, Hexagon });
variants!(mermaid_rs_renderer::ir::XYSeriesKind { Bar, Line });

record!(mermaid_rs_renderer::ir::SequenceActivation { participant, index, kind });
record!(mermaid_rs_renderer::ir::SequenceNote { position, participants, label, index });
record!(mermaid_rs_renderer::ir::PieSlice { label, value });
record!(mermaid_rs_renderer::ir::QuadrantPoint { label, x, y });
record!(mermaid_rs_renderer::ir::QuadrantData { title, x_axis_left, x_axis_right, y_axis_bottom, y_axis_top, quadrant_labels, points });
record!(mermaid_rs_renderer::ir::GanttTask { id, label, start, duration, after, section, status });
record!(mermaid_rs_renderer::ir::GitGraphCommit { id, message, seq, commit_type, custom_type, tags, parents, branch, custom_id });
record!(mermaid_rs_renderer::ir::GitGraphBranch { name, order, insertion_index });
record!(mermaid_rs_renderer::ir::GitGraphData { main_branch, commits, branches });
record!(mermaid_rs_renderer::ir::C4Shape {
    id, label, type_label, techn, descr, sprite, tags, link, parent_boundary, kind, bg_color, border_color, font_color,
});
record!(mermaid_rs_renderer::ir::C4Boundary {
    id, label, boundary_type, descr, sprite, tags, link, parent_boundary, bg_color, border_color, font_color,
});
record!(mermaid_rs_renderer::ir::C4Rel {
    kind, from, to, label, techn, descr, sprite, tags, link, offset_x, offset_y, line_color, text_color,
});
record!(mermaid_rs_renderer::ir::C4Data { shapes, boundaries, rels, c4_type, c4_shape_in_row_override, c4_boundary_in_row_override });
record!(mermaid_rs_renderer::ir::SequenceBox { label, color, participants });
record!(mermaid_rs_renderer::ir::StateNote { position, target, label });
record!(mermaid_rs_renderer::ir::SequenceFrameSection { label, start_idx, end_idx });
record!(mermaid_rs_renderer::ir::SequenceFrame { kind, sections, start_idx, end_idx });
record!(mermaid_rs_renderer::ir::Node { id, label, shape, value, icon });
record!(mermaid_rs_renderer::ir::NodeLink { url, title, target });
record!(mermaid_rs_renderer::ir::Edge {
    from, to, label, start_label, end_label, directed, arrow_start, arrow_end, arrow_start_kind, arrow_end_kind,
    start_decoration, end_decoration, style,
});
record!(mermaid_rs_renderer::ir::Subgraph { id, label, nodes, direction, icon });
record!(mermaid_rs_renderer::ir::MindmapNode { id, label, level, section, node_type, icon, class, children });
record!(mermaid_rs_renderer::ir::MindmapData { nodes, root_id });
record!(mermaid_rs_renderer::ir::XYSeries { kind, label, values });
record!(mermaid_rs_renderer::ir::XYChartData { title, x_axis_label, x_axis_categories, y_axis_label, y_axis_min, y_axis_max, series });
record!(mermaid_rs_renderer::ir::TimelineEvent { time, events, section });
record!(mermaid_rs_renderer::ir::TimelineData { title, events, sections, direction });
record!(mermaid_rs_renderer::ir::BlockDiagram { columns, nodes });
record!(mermaid_rs_renderer::ir::BlockNode { id, span, is_space });
record!(mermaid_rs_renderer::ir::NodeStyle { fill, stroke, text_color, stroke_width, stroke_dasharray, line_color });
record!(mermaid_rs_renderer::ir::EdgeStyleOverride { stroke, stroke_width, dasharray, label_color });
record!(mermaid_rs_renderer::ir::Graph {
    kind, direction, nodes, node_order, edges, subgraphs, sequence_participants, sequence_frames, sequence_notes,
    sequence_activations, sequence_autonumber, sequence_boxes, state_notes, pie_slices, pie_title, pie_show_data,
    quadrant, gantt_tasks, gantt_title, gantt_sections, gantt_display_mode, journey_title, gitgraph, class_defs,
    node_classes, node_styles, subgraph_styles, subgraph_classes, node_links, edge_styles, edge_style_default, c4,
    mindmap, xychart, timeline, block, arch_edge_ports,
});
record!(mermaid_rs_renderer::parser::ParseOutput { graph, init_config });

/// Every DiagramKind, to tell a family mmdr has no parser for from a detection mismatch.
const KINDS: [&str; 23] = [
    "Flowchart", "Class", "State", "Sequence", "Er", "Pie", "Mindmap", "Journey", "Timeline", "Gantt", "Requirement",
    "GitGraph", "C4", "Sankey", "Quadrant", "ZenUML", "Block", "Packet", "Kanban", "Architecture", "Radar", "Treemap",
    "XYChart",
];
/// The message parse_mermaid bails with when its detector finds no diagram header.
const NO_HEADER: &str = "unknown or missing Mermaid diagram header";

fn run(family: &str, source: &str) -> Reply {
    if !KINDS.iter().any(|kind| family_matches(kind, family)) {
        return Reply::Unsupported(format!("mmdr has no {family} parser (its DiagramKind has no such variant)"));
    }
    match mermaid_rs_renderer::parse_mermaid(source) {
        Err(error) => {
            let message = format!("{error:#}");
            if message == NO_HEADER { Reply::Unsupported(message) } else { Reply::ParseError(message) }
        }
        Ok(output) => {
            let kind = output.graph.kind.to_json();
            let kind = kind.as_str().unwrap_or_default();
            if family_matches(kind, family) {
                // The model is the graph; init_config is a sibling field of the
                // same ParseOutput, kept beside the graph's own fields.
                let mut value = output.graph.to_json();
                if let serde_json::Value::Object(map) = &mut value {
                    map.insert("init_config".to_string(), output.init_config.to_json());
                }
                Reply::Value(value)
            } else {
                Reply::Unsupported(format!("mmdr detected this source as {kind}, not {family}"))
            }
        }
    }
}

fn main() {
    protocol::serve(run);
}
