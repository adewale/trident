# Trident qualification evidence — 31 October 2026

These are checks of Trident's execution and evidence machinery. The initial accuracy baseline and the 0.1 release remain unqualified. The [implementation](https://github.com/adewale/trident/pull/72) records the remaining SVG, PNG, terminal and public-test work.

## Six-project execution check

[The fixed profile](https://github.com/adewale/trident/blob/cad4c3eca815200ad5fbaf6beb7f1649cbc36881/qualification/harness-profile.json) uses Mermaid 12.2.0, Mermaid ASCII 1.6.1, Agentic Mermaid 0.4.1, Mermaid Flutter 0.3.2, Latias Merman 0.9.2 and Termaid 0.10.0. These cover browser SVG, SVG-to-PNG conversion, Node, package/native CLIs, WASM, a PNG-only worker, Python and public models. They are a mechanism coverage set.

The corpus is independently authored: Alpha→Beta, Alpha→Gamma, a malformed header, then Alpha→Beta again. The exact sources and selection are in [the saved plan](six-project-run/plan.json).

All 14 output paths verified label or decoded-pixel propagation in [the original run](six-project-run/result.json), preserving 56 output calls. Both model paths initially stopped before calling a project because Node 24 could not import a TypeScript parameter property. After the compatibility fix, [only those two paths were retried](model-path-repair/runner.ts). The [combined receipt](model-path-repair/result.json) records all 16 paths verified across the two explicit phases. Original errors and producer identities remain intact.

This establishes invocation, retention, input propagation and five scoped public-model postconditions. It does not establish full drawing accuracy or comparative performance.

## Production timing-path check

[Exact source](browser-first-use/sources.json): one independent Trident-authored flowchart, `meaning:family:flowchart`. This is a bounded mechanism check, not the DaveBench corpus. The two projects use the same first-use public SVG boundary: fresh browser contexts, controller/page RPC and shared adapter cleanup included; imports, initialization, retention and grading excluded.

| Rank by observed median time | Project | Actual calls | Correct checked outputs | Median ms |
|---:|---|---:|---:|---:|
| 1 | Agentic Mermaid 0.4.1 | 6 | 6 | 328.443 |
| 2 | Mermaid 12.2.0, pooled A0/A1 controls | 12 | 12 | 611.265 |

Six predeclared balanced rounds produced 18 actual calls and 18 checked outputs. A/A calibration passed its predeclared 25% control bound. The matched median round ratio B/A was 0.578; its sign/order-statistic interval was 0.461–0.872 under the stated independent-round assumption. This interval does not remove workload or host effects. These times describe this one case and boundary.

[The final bundle](browser-first-use/timing-bundle-b52ef522ebc07b1b41eb7a5c.json), [driver finalization](browser-first-use/driver-finalization.json) and [offline qualification of this copied directory](browser-first-use/portable-offline-qualification.json) are retained. Source/expectation/observer hashes, actual monotonic clocks, every start/return receipt, artifact inputs and frozen resource identities are included. System font bytes are identified, not redistributed; fresh grading on another host needs those same inputs or must remain unknown.

Run without invoking a project:

```sh
bun commands.ts timing:qualify \
  --bundle PATH/qualification-evidence/browser-first-use/timing-bundle-b52ef522ebc07b1b41eb7a5c.json \
  --out FRESH_FILE.json
```

## Source versus extracted kit

The [development archive](package-check/trident-0.1.0-node24.tar.gz) was built from `0df0170a1ddadf407872fcb4240d7077e4644306`; [its original checksum](package-check/SHA256SUMS) still matches. It is verification evidence, not a product release.

The actual source and extracted kit completed the same four frozen workflows: plain flowchart, label edit, configuration reset and invalid-input recovery. They preserve 33 worker jobs and four retained SVG witnesses per side. The first comparison rejected identical target files because Bun and Node estimated different gzip sizes. The [narrow comparison fix](https://github.com/adewale/trident/commit/4b2fec0c9531df45174a8cf406243a027e85e7bb) excludes only that diagnostic; complete file inventories, paths, raw sizes, SHA-256s and every other artifact field remain checked.

[The original log](package-check/original-run.log), original records and [offline policy repair](package-check/package-policy-repair.json) are preserved. The repair made zero new project calls or builds. Its [runner](package-check/policy-repair.ts) and [parity details](package-check/verification/source-kit-parity-repaired.json) are included. Packaging preservation does not establish complete source semantics, corpus accuracy or speed.

## Verification history

The full local run at the final production-code revision completed 924 tests: 918 passed and six old fixture expectations crossed the new glyph-uncertainty boundary. [That run](full-suite-v5.log) is preserved. Only the two affected test files changed afterward: potential glyph representations remain unknown, and independent DOM-only wrong/hidden-content controls still fail. [All 19 affected tests pass](glyph-boundary-recheck.log). Earlier full runs and their fixes remain visible. Linux and macOS fixture CI both passed at `cad4c3eca815200ad5fbaf6beb7f1649cbc36881`.

[manifest.json](manifest.json) hashes every published evidence file except itself. Absolute paths in original receipts identify the collection machine; the copied timing bundle resolves its own content-addressed output bytes without reading those old paths. No historical receipt was rewritten to look like a new measurement. The commands require ordinary Bun/Node and the documented dependencies; they do not require Codex at runtime.

The evidence branch also retains the exact [terminal observer source](https://github.com/adewale/trident/tree/325c6f8024307d95c1e32287bc282a311789f2a9) and [original terminal collection source](https://github.com/adewale/trident/tree/bc95ac7a721a8f12c2abe96ea990a6dcbc6da91b) as archival Git parents. Those source revisions are historical evidence, not release candidates.
