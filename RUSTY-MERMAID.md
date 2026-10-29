# Rusty Mermaid artifact admission

The published `rusty-mermaid@0.42.0` npm tarball contains its README and package
metadata, but omits `pkg/rusty_mermaid.js` and its WASM runtime. Trident retains
that release as blocked and skips it before acquisition in normal campaigns.
Its catalog `benchmark.skip` names version `0.42.0` and the packaging defect.
The descendant override cannot enable a disabled release. A new pinned version
is not covered by this skip; verify its package before updating the pin.
Explicit `community:update --candidate-dir` or tarball runs remain available
through the separate candidate lane. The npm metadata's Git head `5028e40c` could not be
fetched during this assessment; no source equivalence is asserted.

A separate public source revision,
`ce95d8ddb8323006b6dd8ddbc616c2478c3827aa`, identifies its package as **0.1.0**.
It can be built and benchmarked through the existing candidate workflow:

```sh
git clone https://github.com/justsml/rusty-mermaid.git /artifacts/rusty-source
git -C /artifacts/rusty-source checkout ce95d8ddb8323006b6dd8ddbc616c2478c3827aa
cd /artifacts/rusty-source
rustup target add wasm32-unknown-unknown
cargo build --locked --release --target wasm32-unknown-unknown \
  --features wasm --no-default-features
# Install wasm-bindgen-cli 0.2.100, matching this source's Cargo.lock.
wasm-bindgen --target nodejs --out-dir pkg --out-name rusty_mermaid \
  target/wasm32-unknown-unknown/release/rusty_mermaid.wasm
cd /path/to/trident
bun commands.ts community:update --projects justsml/rusty-mermaid \
  --candidate-dir /artifacts/rusty-source --profile smoke --rounds 1 \
  --records /evidence/rusty-records --out /evidence/rusty-candidate
```

This was exercised with Rust 1.99.1 and wasm-bindgen 0.2.100. The build succeeded;
the smoke record retained 70 passed, four failed and two not-applicable
observations. A failed observation is not a build failure. No calibrated timing
claim follows from a one-round smoke check.

Trident packs and hashes the supplied candidate, records its actual version and
keeps it out of the release league. Rebuilding this source does not repair or
replace the published 0.42.0 artifact. Public diagnostics retain `is_valid: false`
as a rejection even when the returned error list is empty.
