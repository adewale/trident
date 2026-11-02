# What Trident measures

DaveBench, Terminal Rendering and Mermaid Behaviour Tests remain the main workloads. Their usefulness does not depend on a universal drawing judge. A fixed corpus can measure several different things; none is a substitute for the others. The executable definitions are in `unified/measurement-contracts.ts`.

| Measurement | Existing workload | Required evidence and claim |
|---|---|---|
| Output production | DaveBench SVG/PNG; terminal transports | Actual public output return. Wrong-format output still counts as a return; transport loss is unknown. No drawing or input-acceptance claim. |
| Mechanical output validity | DaveBench; terminal transports | Format-only checks on the retained bytes. SVG parsing, PNG decoding and terminal string/display checks have their own scopes. No semantic correctness. |
| Input rejection | DaveBench and terminal invalid controls; behaviour/API cases | Independently invalid source plus typed rejection from the actual public operation. Timeouts, adapter errors and crashes cannot earn rejection credit. |
| Public behaviours | The 49-case Mermaid Behaviour Tests | Every required assertion in the selected whole case, including family detection and structural SVG naming; actual reference controls. No whole-suite compatibility or accessibility certification. |
| API compatibility | The 154-callback diagnostic | Exact selected Mermaid API assertions, original and public-reference controls. Useful for substitutability; optional APIs are not mandatory renderer capabilities. |
| Specified drawing facts | DaveBench and terminal assessment | Independently reviewed source facts and validated observers for the actual output representation. Missing observer support remains an assessment gap. PNG matching reuses a review; it does not assess unseen images. |
| Rendering time | Strict browser, terminal and PNG collectors | Fixed inputs, artifact, configuration, boundary and cache policy. Comparable correctly completed rendering additionally requires every sampled output and A/A controls to qualify. |
| Returned bytes | Fresh DaveBench and terminal captures | Actual uncompressed UTF-8 SVG/terminal or encoded PNG byte lengths, with measured returns and planned calls. Partial-population totals are descriptive, not comparative size ranks. |
| Resources | Existing counter-specific cost machinery | A named counter, unit, process/time boundary, sampling method and resolution. CPU, RSS, peak RSS and browser heap are distinct. No new resource ranking is introduced by measurement contracts. |

## Plan, collect and inspect

```sh
bun commands.ts measurements --list
bun commands.ts bench --projects OWNER/TOOL --suites docs --plan
bun commands.ts bench --projects OWNER/TOOL --suites docs --out FRESH_CAMPAIGN
bun commands.ts measurements --campaign FRESH_CAMPAIGN --out FRESH_AUDIT
bun commands.ts measurements --snapshot results/latest.json --out FRESH_AUDIT
```

Plans bind each supported question to its definition hash. Fresh controller reports retain those bindings; newly reduced tables bind one measurement each. Snapshot validation rejects a changed contract, a different table schema or a ranking outside that measurement. Legacy tables remain readable with explicitly inferred scopes; a new description does not upgrade their evidence.

Preparation also seals `docs-selection.json`: selected literal source IDs and SVG/PNG formats. Loading a preparation restores those values from its hash-bound archive, even after the original selection file disappears. Collection rejects conflicting source/format overrides. Plans expose selected versus full occurrences and requested output coordinates. These checks prevent a partial workload from silently expanding to the full documentation corpus.

The audit emits machine-readable `measurements.json` and a readable report containing actual values, units, scope, evidence provenance and assessment coverage. Local campaign inputs are identified by real file paths and hashes; they do not receive invented publication URLs. `resolved` counts implementation outcomes; `unresolved` includes assessment gaps, harness failures and unrun work. `assessmentComplete` refers only to stored outcomes. It is not observer qualification. Attempted calls are deliberately unavailable when they cannot be established from the table. A snapshot audit neither collects nor regrades output; campaign audit reruns ordinary table reducers and keeps their existing evidence requirements.

Invocation-outcome tables distinguish causal returns, completed errors, interruptions and missing proof. Completed errors establish no returned value, but provide neither grammar-rejection credit nor fault attribution. Interrupted calls leave return disposition unknown. The report exposes a known-attempted lower bound; it supplies an exact attempted count only when every planned call has a causal frame. Original suite-level collection outcomes remain visible even if mechanical reduction succeeds.

An attempt is a recorded controller request; an interrupted start alone does not prove entry into the renderer's public API. Source-rejection credit and qualified timing retain their stronger public-boundary requirements.

Fresh SVG capture preserves wrong-format returned strings before assessment. Fresh SVG and PNG render observations record `publicOutputReturned`, `formatValid` and `returnedBytes` independently of drawing grades. Reducers retain the fixed planned denominator, reject duplicate coordinates and contradictory evidence, and keep unavailable metrics unknown. Documentation reduction reopens source-bound causal start/return frames and retained bytes before measuring production, validity and size. Duplicate invocation reuse, different sources, changed bytes, mixed artifacts and foreign paths are rejected. Summary flags alone supply no credit. Relative proof paths allow moved captures to be reduced without reading former-machine paths. Older campaigns without this evidence remain unknown. Terminal production, strict UTF-8 validity and byte size are reconstructed from source-bound, owned raw witnesses, including valid empty returns. Stored admission or drawing flags cannot supply those facts. Missing witnesses remain unknown; changed bytes, wrong source populations and escaping paths are rejected.

Time to return output is a legitimate descriptive latency measurement. It becomes a comparison of correctly completed rendering only with the strict per-call qualification. First use, repeated source, changed source, CLI startup and SVG-to-PNG conversion stay separate. A/A control stability does not prove correctness. Batch means are not individual-call p95/p99. Resource counters cannot be inferred from latency or byte size.

## Replay actual evidence

Mechanical SVG validity checks the SVG root namespace and parseable host serialization, including the existing HTML-void-element normalization for browser `foreignObject` output. It does not require an explicit finite canvas, inspect source echoes, require labels or assert nonblank output. Those belong to the stricter admission/content checks. Terminal string validity admits a legitimate empty return. These separate scopes prevent a content or canvas policy from being reported as invalid format.

```sh
bun commands.ts measurements:replay --kind docs --campaign CAPTURE --formats svg --out FRESH_REPLAY
bun commands.ts measurements:replay --kind terminal --campaign TERMINAL_CAPTURE --out FRESH_REPLAY
bun commands.ts measurements:replay --kind behaviour --campaign BEHAVIOUR_REPORT --out FRESH_REPLAY
bun commands.ts measurements:replay --kind timing --campaign TIMING_CAPTURE --out FRESH_REPLAY
```

This entrypoint delegates to the existing source-bound SVG/PNG regrader, saved terminal regrader, actual public-behaviour replay, or exhaustive raw timing reducer. No artifact acquisition, renderer call or reference-parser call is permitted by these modes. Docs replay accepts the existing `--png-reviews`, `--png-raster-profile` and `--executable` options. Behaviour input is a previously generated behaviour report containing its owned parent or native capture/reference. Timing input must contain one unambiguous native capture; provisional/final summaries of the same capture remain one attempt. Results and the new `measurement-replay.json` retain their original source identity. Unqualified timing writes explicit withheld values. The wrapper rejects outputs inside the source even through symlinks; it never overwrites a previous run.

Changed source bytes, missing calls, changed artifacts or a different timing boundary require new collection. A changed observer can regrade retained bytes, preserving old grades, IDs and clocks. Replay completion does not imply that every observer or drawing qualified.

## Qualify the measurement instruments

Trident seals executable measurement producers from Git. Commit changes to those producers before running collection, retained-evidence reuse or the qualification command. Focused unit tests can run while editing. CI uploads the qualification receipts and logs as the `measurement-verification` artifact, including failed runs.

```sh
bun commands.ts verify:measurements --plan
bun commands.ts verify:measurements --out /tmp/FRESH_VERIFICATION
```

The bounded matrix exercises Node and CLI public boundaries, native-worker/PNG ownership, immutable replay and strict timing controls using independent fixtures. It is included in Linux CI; individual regression files also run in the normal Linux/macOS fixture suite. `tests.log` and `verification.json` record the executed test count, exit status and input/log hashes. An empty, failed or incomplete run cannot pass. The verification receipt separates `harnessVerified` from `qualifiedInstrumentScopes`; it does not issue a blanket qualification for Trident, all catalogue adapters or renderer accuracy.

Public-release integration is a separate opt-in acceptance workflow:

```sh
bun commands.ts verify:measurements:live --plan
bun commands.ts verify:measurements:live --out /tmp/FRESH_PUBLIC_ACCEPTANCE
```

The checked-in `qualification/measurement-smoke.json` predeclares Mermaid, Pele and Beautiful Mermaid, three literal documentation sources and SVG/PNG output. It also exercises Beautiful Mermaid on the active terminal corpus. Preparation freezes catalogue releases before collection. The workflow retains command exit statuses and logs, audits actual output facts, replays retained SVG/PNG/terminal evidence without renderer calls, and checks that mechanical measurements and original evidence remain unchanged. `acceptance.json` contains the actual values and scope. The full documentation denominator stays planned, so this partial integration exercise cannot become a complete DaveBench accuracy result. Renderer assessment failures remain recorded outcomes; a successful process or fixture suite cannot substitute for an actual verified return on each selected public output transport.

`observer-controls.json` records observations of 18 independent controls in `qualification/measurement-controls.json`: static SVG validity, decoded PNG validity, SVG/terminal literal-label admission, static accessible names/descriptions and a terminal 2x2 block-grid property. Each scope includes positive, deliberately wrong and equivalent-valid output. The receipt binds the producer dependency closure and actual byte hashes, including decoded base64 fixtures. These finite scopes do not qualify arbitrary SVG topology, all terminal geometry or unseen PNG semantics. Existing broader independent controls remain necessary.

`qualifyObserverControls` requires positive, deliberately wrong-output and equivalent-valid controls for **each property and representation**. It executes the observer on the actual controls and retains source/output hashes, expected/observed verdicts and scope. Missing controls, false passes, false failures, unknown representations and observer exceptions withhold qualification. Expanding an instrument requires independently reviewed control provenance and new scopes; a saved qualified flag cannot supply them. The mechanism cannot establish reviewer independence by itself.

Adapters must continue to prove argument/configuration mapping, awaited completion, output consumption, lifecycle, errors and interruption handling independently of renderer correctness. The fixture matrix verifies its listed mechanisms, not every catalogue binding. Use `support:verify` and the existing six-project harness profile when a real transport changes; record missing external toolchains or credentials instead of substituting fixture success for public invocation evidence.

## Comparable work

Freeze corpus membership, source and expectation hashes, artifact/configuration/dependency bytes, runtime, fonts/resources, execution boundary and sampling policy before collecting. Use the same required facts for every enrolled participant. Observer support and renderer support are separate axes. Establish a named assessment-qualified workload before a comparative performance collection; do not select successful cases afterwards. Report assessment coverage beside implementation outcomes and stratify mixed families/origins instead of claiming a production-frequency sample.

Harness/observer regressions test Trident. Public model operations retain their optional API scope. Legacy adaptive performance records remain historical diagnostics. No contract or replay silently promotes any of these to a general renderer-quality benchmark.
