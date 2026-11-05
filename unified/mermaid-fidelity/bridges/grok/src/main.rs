// xai-org/grok-build parser bridge. grok's Mermaid parser is the private module
// crates/codegen/xai-grok-markdown/src/mermaid.rs, which no public API exposes.
// build.rs copies that file unmodified (minus `//!` doc lines) and it is
// include!d below, so the bridge calls grok's own parse_graph / parse_state /
// parse_class / parse_er / parse_sequence and maps the values they return by
// hand, with their native field names. It parses nothing itself. See
// ../../bridges.ts for the reply protocol.
#[macro_use]
mod protocol;

#[allow(dead_code, unused)]
mod mermaid {
    include!(concat!(env!("OUT_DIR"), "/mermaid_inc.rs"));

    use crate::protocol::{Reply, ToJson, object};
    use serde_json::{Value, json};

    variants!(Shape { Rect, Round, Diamond });
    variants!(Head { None, Arrow, Circle, Cross, Triangle, DiamondFill, DiamondOpen });
    variants!(LineKind { Solid, Dotted, Thick });
    variants!(Dir { Down, Up, Right, Left });
    variants!(SeqHead { Arrow, Cross });
    record!(Node { label, shape });
    record!(Edge { from, to, label, head_to, head_from, line });
    // Group.parent is an index into Graph.groups, not a back-reference, so it is kept.
    record!(Group { id, label, parent });
    record!(Graph { nodes, edges, index, groups, node_group, cur_group, over_cap, dir });
    record!(ClassInfo { annotation, attrs, methods });
    record!(Sequence { labels, index, items });

    // Data-carrying enums use serde's default (externally tagged) shape.
    impl ToJson for NoteAnchor {
        fn to_json(&self) -> Value {
            match self {
                NoteAnchor::Over(a, b) => json!({ "Over": [a, b] }),
                NoteAnchor::Left(a) => json!({ "Left": a }),
                NoteAnchor::Right(a) => json!({ "Right": a }),
            }
        }
    }
    impl ToJson for SeqItem {
        fn to_json(&self) -> Value {
            match self {
                SeqItem::Message { from, to, text, dashed, head } => json!({ "Message": object(vec![
                    ("from", from.to_json()), ("to", to.to_json()), ("text", text.to_json()),
                    ("dashed", dashed.to_json()), ("head", head.to_json()),
                ]) }),
                SeqItem::Note { anchor, text } => json!({ "Note": object(vec![("anchor", anchor.to_json()), ("text", text.to_json())]) }),
                SeqItem::Divider { text } => json!({ "Divider": object(vec![("text", text.to_json())]) }),
            }
        }
    }

    fn answer<T: ToJson>(parsed: Option<T>, function: &str) -> Reply {
        match parsed {
            Some(model) => Reply::Value(model.to_json()),
            None => Reply::Unsupported(format!("grok's {function} returned None (not a diagram it parses)")),
        }
    }

    /// grok's `render` tries these parsers in turn; the bridge calls the one for the
    /// requested family. (Graph, Vec<ClassInfo>) tuples print as two-element arrays.
    pub fn run(family: &str, source: &str) -> Reply {
        match family {
            "flowchart" => answer(parse_graph(source), "parse_graph"),
            "state" => answer(parse_state(source), "parse_state"),
            "class" => answer(parse_class(source), "parse_class"),
            "er" => answer(parse_er(source), "parse_er"),
            "sequence" => answer(parse_sequence(source), "parse_sequence"),
            other => Reply::Unsupported(format!("grok has no {other} parser (it parses flowchart, state, class, er, sequence)")),
        }
    }
}

fn main() {
    protocol::serve(mermaid::run);
}
