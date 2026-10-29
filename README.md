# B0 preparation and pilot — 29 October 2026

**B0 has not been collected.** This archive fixes the selection, artifacts and input ledgers, records public invocation checks, and adopts sampling/budgets for the collection campaign. No pilot observation is a B0 or rolling-results score.

Download [the evidence archive](trident-b0-preparation.tar.gz), verify [SHA256SUMS](SHA256SUMS), then extract it and run `sha256sum -c CONTENTS.sha256`. Paths below refer to the extracted archive. The sampling decision and pilot summary also have JSON previews alongside this page.

## Freeze

Release cutoff: **2026-10-29T18:42:38Z**. The catalog has 89 entries, 40 core brands and 39 normally selected projects. Rusty Mermaid 0.42.0 stays skipped for its missing published runtime. All 39 selected artifact identities and browser dispositions verify; 17 browser bindings are prepared.

The plan retains 273 cells: 91 configured/conditional, 78 missing Trident bindings, and 104 unsupported/reference-only. Configured counts are Compatibility 39, DaveBench 17, Diagram Meaning 17, Model and Editing Contracts 3, Assertion Replay 3, Reference Tests 1, Render Cost and Scaling 11. These are planned invocations, not measured support scores.

The seven-suite inputs include 1,081 feature workloads (724 render, 357 parser-only), six legacy diagnostics (42 retained reference-expectation gaps), 548 docs occurrences (546 distinct sources), 100 authored fidelity cases with 1,927 criteria, 54 portable cases and the pinned original-test inventory (368 files, 3,995 declarations, 15 disabled/todo). The separately frozen external cohort contains 172 occurrences from eight repository selections with a 20-file cap; repositories with no extracted examples remain visible.

## What preparation found

- The hard-coded peer version check rejected selected Pele 1.12.0. [PR #57](https://github.com/adewale/trident/pull/57) admits each peer’s owning version while retaining reference/tool pins.
- OpenCode’s unused workspace-only dependency prevented dependency sealing. [PR #58](https://github.com/adewale/trident/pull/58) seals its actual 13-package renderer closure; its real public witness output is byte-identical before and after. Its bounded terminal check passes 3/6 positives and rejects 2/2 invalid controls.
- Mermaid Rust Renderer’s actual release archive stores `./mmdr`; Mermaid ASCII’s actual binary has no version flag. [PR #59](https://github.com/adewale/trident/pull/59) admits reviewed member names and records explicit tag-based version provenance, retaining checksums and binding checks. Both now use published executables. The renderer passes 6/6 SVG and 6/6 PNG checks; Mermaid ASCII passes 3/6 terminal checks. The renderer rejects 2/2 invalid controls; Mermaid ASCII rejects 1/2.
- Native Flutter initially lacked a graphics library; a fresh check with the recorded runtime passes 6/6 positives and rejects 2/2 invalid controls. The existing compiled bundle is reused by byte identity, with unchanged Dart source/locks. The final common runtime exposes only the missing GLES library, avoiding a Canvas library collision from exporting the entire Flutter build sysroot.
- Crafter’s fresh companion installation fixes preparation, but its Node SVG boundary still has no positive witness. Browser SVG, parser and terminal checks pass 5/6 each. Merman’s selected Node target exposes no public PNG operation. Those limits remain findings.

The authoritative receipt map is `freeze/admission-index.json`; it replaces selected old attempts for current admission without deleting them. Six-positive/two-negative checks establish bounded invocation only.

## Pilot and collection decision

The proposed five-cold-process profile cannot satisfy the existing first-use calibration minimum. Its raw trial remains in `pilot/`; it was stopped and the remaining collection budget transferred to `pilot-standard/`. No calibration gate was relaxed.

The adopted profile is the existing full protocol: **five rounds, 31 warm means, 20 fresh processes per A0/A1/B replica per round/case**. Across 11 projects and 54 cases this plans 178,200 first-use launch slots before admission exclusions. Five rounds provide no finite two-sided 95% median-ratio interval under the current method; the raw reports keep that interval unavailable. No cold-tail or speed-ranking claim is made.

The pilot used at most 30 minutes of active collection. It finished all 11 small-case boundaries; ten passed SVG output admission. Crafter failed. One class-128 scaling boundary was cancelled at exhaustion and ten were never started. **No small case has complete semantic qualification.** Output calibration alone does not supply that evidence.

The table ranks successful projects by the wall time spent collecting the same one-case diagnostic, lower first. This is campaign cost, including workers and checks; it is not public render-call latency. Crafter’s failed output is unranked. Runtime/order effects and one input prevent forecasting full-portfolio cost from these values.

| Cost rank | Project | Collection seconds | Output-calibrated tracks / 3 |
|---:|---|---:|---:|
| 1 | sandyyst/dsh-plugin-mermaid-gb-svg | 54.3 | 1/3 |
| 2 | KlangHaus/vitepress-plugin-diagram | 62.9 | 1/3 |
| 3 | Latias94/merman | 67.5 | 2/3 |
| 4 | obsidianmd/pele | 77.7 | 1/3 |
| 5 | wevm/ondine | 90.9 | 1/3 |
| 6 | emtyty/merslim | 107.7 | 0/3 |
| 7 | lukilabs/beautiful-mermaid | 158.8 | 3/3 |
| 7 | zhenhuaa/mdv | 158.8 | 1/3 |
| 9 | adewale/agentic-mermaid | 193.6 | 1/3 |
| 10 | dfadler/zombie-mermaid | 207.1 | 1/3 |
| — | crafter-station/mermaid | 68.6 | 0/3 |

Adopt a **24-hour initial collection allowance**, checked at suite/project boundaries. An active boundary retains its worker deadlines and can carry the controller beyond that allowance. Leave exhausted work incomplete; resume the same frozen campaign or record a named release exception. The budget is not a completion estimate. The static plan’s wide planning range (381–32,115 minutes) and unfinished scaling pilot cannot establish that 24 hours will finish the workload.

The original 60-minute preparation allowance covers initial acquisition; subsequent harness repairs, verification and publication are additional work. The archive makes no claim that all release preparation fit that allowance.

## Read or reproduce

Start with `freeze/sampling-decision.json`, `freeze/plan.json`, `freeze/artifact-identities/adopted-index.json` and `freeze/admission-index.json`. `preparation-published/` contains the adopted artifact/browser snapshots. Original acquisition manifests, failures, logs and both pilot schedules remain in the archive. Scripts retain the actual commands and local paths; they require the named toolchains and sources, rather than forming a portable benchmark kit.

`retained-builds/` keeps exact compiled CLI, Dart and WASM bytes and reviewed public CLI archives, keyed by SHA-256. Registry package/dependency identities and locks remain in `freeze/`. Native Flutter’s existing bundle is retained separately at [immutable evidence](https://github.com/adewale/trident/tree/1a3be2b6bddde6d4d5cd9f5fa1ad525d77e9c30f). This is a preparation archive, not the final runnable B0 distribution.

The original runner passes fresh read-only closure and real Canvas/jsdom pixel checks; its readiness receipt is in `freeze/original-runner/`. Before collection, reverify the final producer head and runtime, confirm every workload hash, and use a fresh evidence store. Collect the AM-origin corpus and external examples as separate cohorts. Reconcile every applicable cell after collection, retain missing bindings and failures, then publish immutable B0 evidence before release.

Release packaging, copied-kit smoke verification, final release-head checks and an unused version tag remain after B0. The existing `v0.1.0` tag must stay unchanged.
