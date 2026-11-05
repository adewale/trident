# Rusty Mermaid artifact admission

The published `rusty-mermaid@0.42.0` npm tarball contains its README and package
metadata, but omits `pkg/rusty_mermaid.js` and its WASM runtime. Trident retains
that release as blocked and skips it before acquisition in normal campaigns.
Its catalog `benchmark.skip` names version `0.42.0` and the packaging defect.
The descendant override cannot enable a disabled release. A new pinned version
is not covered by this skip; verify its package before updating the pin.
The npm metadata's Git head `5028e40c` could not be
fetched during this assessment; no source equivalence is asserted.

A separate public source revision,
`ce95d8ddb8323006b6dd8ddbc616c2478c3827aa`, identifies its package as **0.1.0**.
In October 2026 it built with Rust 1.99.1 and wasm-bindgen 0.2.100 and was exercised
once through Trident's former candidate workflow (since removed): 70 passed, four
failed and two not-applicable smoke observations, with no timing claim. Rebuilding
this source does not repair or replace the published 0.42.0 artifact. Public
diagnostics retain `is_valid: false` as a rejection even when the returned error
list is empty.
