# Qualified PNG timing: three documentation edge styles

All **54 fresh exports passed**, with zero timing qualification gaps. The same three literal Mermaid sources were exported through Mermaid 12.2.0 and native `mermaid_flutter` 0.3.2. Every timed PNG exactly matches its independently reviewed original bytes; no SVG assessment supplies native PNG correctness.

| Rank | Renderer | Correct returns | Median three-example corpus ms |
|---:|---|---:|---:|
|1|Mermaid 12.2.0|36/36|4518.160|
|2|mermaid_flutter 0.3.2|18/18|19669.129|

Ranks use the shared ascending ranker and median sum of three separately timed exports per replica-round. Mermaid has twelve A0/A1 control replica-rounds; native has six B replica-rounds. Native's median paired ratio to the geometric mean of the two Mermaid controls is **4.365×**, with the exact six-round **96.875% median-ratio interval 4.237–4.626×**. The A/A envelope is 0.820–1.219, inside the predeclared 25% ceiling. Paired ratios and ratios of displayed medians are distinct statistics. Medians of individual cases are not additive.

The unchanged pinned cases are `flowchart.md:686`(solid arrow),`:728`(dotted arrow), and`:742`(thick arrow), each A→B. Source pin: `1fb7869866dd619168d840291c9c54b4f129758b`, under `packages/mermaid/src/docs/syntax/`. Both renderers had correct retained PNGs before collection. The actual capture ran **2026-11-01T01:49:27.760Z–01:52:50.914Z**, with 54 distinct owned forks and one controller clock domain. Six balanced rounds retain every planned return; all 54 engine teardown receipts and artifact/producer/font/browser/display/SDK postchecks passed.

This measures a **cold complete export workflow**, not an isolated rendering API. The common host clock starts with source RPC into a fresh owned fork and ends when complete PNG bytes return. Engine/process startup is included. Mermaid uses the existing public SVG render→XML serialization→Image.decode→white canvas→PNG export. Native uses public `renderToPng(source,pixelRatio:1)` plus its existing durable PNG byte bridge. Required bridge/hash/receipt writes and IPC are included; common worker module initialization, artifact verification, controller retention, content grading and engine teardown are excluded. Display infrastructure was initialized outside the clocks. Public default canvas sizes differ; this is not resolution-matched pixel throughput. Filesystem/OS caches remain uncontrolled.

An initial attempt stopped after two actual Mermaid returns when native startup could not dlopen `libGLESv2.so.2`, before entering the native public API. That entire incomplete capture remains **unqualified**, with its raw frames, error and outputs preserved. The existing native setup's 71832-byte GLES library was then supplied identically to BOTH bindings through a shared `LD_LIBRARY_PATH`, with exact before/after hashes bound in the new environment. No renderer or candidate bundle was changed. The corrected full 54-call campaign has its own plan, clock domain and filename; it does not resume or borrow successful cells from the incomplete run.

The scope is an exposed, correctness-conditioned **three-source flowchart edge-style cohort**. It supports the displayed host/workflow/version comparison. It does not establish multi-family PNG representativeness, isolated API speed, steady-state latency, percentiles, memory use or aesthetics. The six-round interval assumes independent representative rounds and does not remove systematic host, workload, transport or artifact effects.

## Retained proof

- [result.json](result.json): every count, source hash, fixed boundary, identities, per-case measurements, full per-round totals, A/A controls and uncertainty.
- [capture.tar.gz](capture.tar.gz): both complete and incomplete captures; 54 fresh start/return pairs, lifecycle data, per-return checks, all source-owned PNG references, native public-call ledgers, original image review bytes/receipts, input snapshots and the 90-file committed producer closure. Content-addressed raw PNG blobs are deduplicated; each actual invocation remains separate. Frozen renderer/font/runtime bodies remain in the original workspace capture inputs; their identities are retained here.
- [archive-manifest.json](archive-manifest.json): portable archive hash and retained-file hashes.
- [reproduce.ts](reproduce.ts): fixed report using the ordinary qualifier and shared ranker, with no rendering or model calls.

Extract the archive to a fresh directory, then run from this repository:

```sh
bun commands.ts timing:qualify --bundle /ABS/EXTRACT/collection-runtime-bound/timing-bundle-1e276f38a6fe762180fe3167.json --out /ABS/EXTRACT/qualification.json
bun docs/evidence/qualified-png-timing-2026-11-01/reproduce.ts /ABS/EXTRACT/collection-runtime-bound/timing-bundle-1e276f38a6fe762180fe3167.json /ABS/EXTRACT
```

Both commands are offline. Runtime producer commit: `503ba33`(driver 227a483, public addon 231d267, graphics environment 944d8a6, explicit runtime bytes 503ba33). The ordinary qualifier reports 54 planned, 54 checked, zero gaps. The extracted fixed report reproduces `result.json` byte for byte.
