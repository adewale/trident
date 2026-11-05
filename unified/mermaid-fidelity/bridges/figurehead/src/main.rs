// Mootikins/figurehead-rs parser bridge: calls figurehead's own public parser
// for the requested family and prints the database it fills, mapped by hand
// (figurehead has no serde derives) with its native field names. The database
// fields are private, so each one is read through its public getter. It parses
// nothing itself. See ../../bridges.ts for the reply protocol.
#[macro_use]
mod protocol;

use figurehead::core::{Color, Database, Direction, EdgeData, EdgeType, NodeData, NodeShape, Parser, StyleDefinition};
use figurehead::plugins::class::{Class, ClassDatabase, ClassParser, Classifier, Member, Relationship, RelationshipKind, Visibility};
use figurehead::plugins::flowchart::{FlowchartDatabase, Subgraph};
use figurehead::plugins::gitgraph::{GitGraphDatabase, GitGraphParser};
use figurehead::plugins::sequence::{SequenceDatabase, SequenceParser};
use figurehead::plugins::state::{StateDatabase, StateParser};
use protocol::{Reply, ToJson, object};
use serde_json::{Map, Value, json};

variants!(Direction { TopDown, LeftRight, RightLeft, BottomUp });
variants!(NodeShape { Rectangle, RoundedRect, Circle, Diamond, Hexagon, Subroutine, Cylinder, Asymmetric, Parallelogram, Trapezoid, Terminal });
variants!(EdgeType { Arrow, Line, DottedArrow, DottedLine, ThickArrow, ThickLine, Invisible, OpenArrow, CrossArrow });
impl ToJson for Color {
    fn to_json(&self) -> Value {
        match self {
            Color::Hex(value) => json!({ "Hex": value }),
            Color::Named(value) => json!({ "Named": value }),
        }
    }
}
record!(StyleDefinition { fill, stroke, text_color, stroke_width, stroke_dasharray });
record!(NodeData { id, label, shape, classes, inline_style });
record!(EdgeData { from, to, edge_type, label, style });
record!(Subgraph { id, title, members });
variants!(Visibility { Public, Private, Protected, Package });
variants!(Classifier { Abstract, Static });
variants!(RelationshipKind { Inheritance, Composition, Aggregation, Association, Dependency, Realization, Link, DashedLink });
record!(Member { visibility, name, member_type, classifier, is_method });
record!(Class { name, attributes, methods, annotation });
record!(Relationship { from, to, kind, label, from_cardinality, to_cardinality });

fn sorted_map(entries: Vec<(String, Value)>) -> Value {
    let mut entries = entries;
    entries.sort_by(|a, b| a.0.cmp(&b.0));
    Value::Object(entries.into_iter().collect::<Map<_, _>>())
}

fn flowchart(db: &FlowchartDatabase) -> Value {
    // `nodes` is a HashMap natively; Database::nodes() yields it in `node_order`.
    let nodes: Map<String, Value> = db.nodes().map(|n| (n.id.clone(), n.to_json())).collect();
    let node_order: Vec<Value> = db.nodes().map(|n| Value::String(n.id.clone())).collect();
    object(vec![
        ("direction", db.direction().to_json()),
        ("nodes", Value::Object(nodes)),
        ("edges", db.edges().collect::<Vec<_>>().to_json()),
        ("node_order", Value::Array(node_order)),
        ("subgraphs", db.subgraphs().collect::<Vec<_>>().to_json()),
        ("class_defs", sorted_map(db.class_definitions().map(|(k, v)| (k.to_string(), v.to_json())).collect())),
    ])
}

fn class(db: &ClassDatabase) -> Value {
    object(vec![("classes", db.classes().to_json()), ("relationships", db.relationships().to_json())])
}

fn state(db: &StateDatabase) -> Value {
    object(vec![
        ("states", db.states().to_json()),
        ("transitions", db.transitions().to_json()),
        ("has_start", db.has_start_terminal().to_json()),
        ("has_end", db.has_end_terminal().to_json()),
    ])
}

fn gitgraph(db: &GitGraphDatabase) -> Value {
    object(vec![
        ("nodes", sorted_map(db.nodes().map(|n| (n.id.clone(), n.to_json())).collect())),
        ("edges", db.edges().collect::<Vec<_>>().to_json()),
        ("direction", db.direction().to_json()),
    ])
}

// figurehead exports SequenceDatabase but not its item types (Participant,
// Message, SequenceItem, ArrowType and the enums live in a private module), so
// they cannot be named here. Their pub fields are read directly, and fieldless
// enums print their variant name through their derived Debug. Message items are
// read through SequenceDatabase::messages(); figurehead's SequenceParser never
// creates the BlockStart/BlockEnd items, so meeting one is reported as a gap.
fn variant<T: std::fmt::Debug>(value: &T) -> Value {
    Value::String(format!("{value:?}"))
}

fn sequence(db: &SequenceDatabase) -> Result<Value, String> {
    let participants: Vec<Value> = db
        .participants()
        .iter()
        .map(|p| object(vec![("id", p.id.to_json()), ("label", p.label.to_json())]))
        .collect();
    let mut messages = db.messages();
    let mut items = Vec::new();
    for item in db.items() {
        let debug = format!("{item:?}");
        if debug.starts_with("Message(") {
            let m = messages.next().ok_or("SequenceDatabase::messages() ended before items()")?;
            let arrow = object(vec![("line", variant(&m.arrow.line)), ("head", variant(&m.arrow.head))]);
            let message = object(vec![
                ("from", m.from.to_json()),
                ("to", m.to.to_json()),
                ("label", m.label.to_json()),
                ("arrow", arrow),
                ("depth", m.depth.to_json()),
            ]);
            items.push(json!({ "Message": message }));
        } else {
            return Err(format!("SequenceItem without a public accessor: {debug}"));
        }
    }
    Ok(object(vec![("participants", Value::Array(participants)), ("items", Value::Array(items))]))
}

fn run(family: &str, source: &str) -> Reply {
    let fail = |error: anyhow::Error| Reply::ParseError(format!("{error:#}"));
    match family {
        // The crate's top-level `figurehead::parse` is its flowchart parser.
        "flowchart" => figurehead::parse(source).map_or_else(fail, |db| Reply::Value(flowchart(&db))),
        // ClassParser is the class parser figurehead's Orchestrator uses.
        "class" => {
            let mut db = ClassDatabase::new();
            ClassParser::new().parse(source, &mut db).map_or_else(fail, |_| Reply::Value(class(&db)))
        }
        "sequence" => {
            let mut db = SequenceDatabase::new();
            match SequenceParser::new().parse(source, &mut db) {
                Err(error) => fail(error),
                Ok(()) => sequence(&db).map_or_else(Reply::AdapterGap, Reply::Value),
            }
        }
        "state" => {
            let mut db = StateDatabase::new();
            StateParser::new().parse(source, &mut db).map_or_else(fail, |_| Reply::Value(state(&db)))
        }
        "gitgraph" => {
            let mut db = GitGraphDatabase::new();
            GitGraphParser::new().parse(source, &mut db).map_or_else(fail, |_| Reply::Value(gitgraph(&db)))
        }
        other => Reply::Unsupported(format!("figurehead has no {other} parser (it parses flowchart, class, sequence, state, gitgraph)")),
    }
}

fn main() {
    protocol::serve(run);
}
