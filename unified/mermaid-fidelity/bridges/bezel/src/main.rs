// crabtalk/bezel parser bridge: calls bezel-mermaid's public
// `mermaid::parse(source, &Options::default())` and prints the `model` it
// returns through the crate's own Serialize impls. It parses nothing itself.
// A database request (database.rs) runs a test's Mermaid database calls on that
// model through the model types' own public methods.
// See ../../bridges.ts for the reply protocol.
#[macro_use]
mod protocol;
mod database;

use mermaid::{Code, Options};
use protocol::{Reply, family_matches};
use serde_json::Value;

fn run(family: &str, source: &str) -> Reply {
    match mermaid::parse(source, &Options::default()) {
        Err(error) => match error.code {
            Code::Syntax | Code::Semantic => Reply::ParseError(error.message),
            Code::UnsupportedDiagram => Reply::Unsupported(error.message),
            Code::Limit => Reply::AdapterGap(format!("bezel limit: {}", error.message)),
        },
        Ok(parsed) if !family_matches(parsed.kind.name(), family) => {
            Reply::Unsupported(format!("bezel detected this source as {}, not {family}", parsed.kind.name()))
        }
        Ok(parsed) => match serde_json::to_value(&parsed.model) {
            Ok(value) => Reply::Value(value),
            Err(error) => Reply::AdapterGap(format!("bezel model did not serialize: {error}")),
        },
    }
}

fn handle(request: &Value) -> Reply {
    if request["describe"].as_str() == Some("database") {
        return Reply::Value(database::describe());
    }
    match (request["family"].as_str(), request["source"].as_str(), request["database"].as_array()) {
        (Some(family), _, Some(ops)) => database::run(family, ops),
        (Some(family), Some(source), None) => run(family, source),
        _ => Reply::AdapterGap("request lacks string family and source or database".into()),
    }
}

fn main() {
    protocol::serve_request(handle);
}
