// Copies grok-build's private parser module (crates/codegen/xai-grok-markdown/src/mermaid.rs)
// byte for byte into OUT_DIR, dropping only its `//!` inner doc lines, which may not
// appear inside the inline module that src/main.rs include!s it into. build.ts writes
// the path of the verified source checkout's mermaid.rs to grok-mermaid-path.txt.
fn main() {
    let manifest = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let pointer = format!("{manifest}/grok-mermaid-path.txt");
    println!("cargo:rerun-if-changed={pointer}");
    let path = std::fs::read_to_string(&pointer).unwrap_or_else(|e| panic!("{pointer}: {e} (written by build.ts)"));
    let path = path.trim();
    println!("cargo:rerun-if-changed={path}");
    let source = std::fs::read_to_string(path).unwrap_or_else(|e| panic!("{path}: {e}"));
    let kept: String = source.split_inclusive('\n').filter(|line| !line.starts_with("//!")).collect();
    std::fs::write(format!("{}/mermaid_inc.rs", std::env::var("OUT_DIR").unwrap()), kept).unwrap();
}
