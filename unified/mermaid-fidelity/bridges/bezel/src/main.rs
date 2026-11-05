// crabtalk/bezel parser bridge: calls bezel-mermaid's public
// `mermaid::parse(source, &Options::default())` and prints the `model` it
// returns through the crate's own Serialize impls. It parses nothing itself.
// See ../../bridges.ts for the reply protocol.
#[macro_use]
mod protocol;

use mermaid::{Code, Options};
use protocol::{Reply, family_matches};

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

fn main() {
    protocol::serve(run);
}
