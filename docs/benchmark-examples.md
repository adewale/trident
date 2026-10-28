# Worked benchmark results

These are small extracts from recorded local runs, chosen to explain the reports. They are not a current leaderboard. The 27 October snapshots used older observers; PR #21 introduced portable protocol v6 and requires fresh qualification. Do not combine these rows into a score or compare their timings across protocols.

The provenance link for DaveBench was supplied by the project maintainer. Trident inherits AM’s implementation and records its own pinned documentation inventory.

## Mermaid Compatibility

Merslim: browser SVG **4/6**, browser PNG **6/6**, Node SVG **3/6**, terminal **4/6**, parser **4/6**. These are the same six authored inputs on separate interfaces, not a combined score. Recorded 28 October 2026 with the PR #21 harness.

## DaveBench: Documentation Examples

Pele 1.9.0 returned SVG for **532/548 documentation occurrences (97.1%)** and failed 16 in each of five rounds. The first flowchart example (`flowchart.md:23`) took a median **0.60 ms** across five browser calls after warmup. This historical 27 October run reports SVG return and call time; it does not establish correct paint or a calibrated speed comparison.

## Diagram Meaning

Pele 1.9.0 failed the controlled-image case: its SVG omitted the independently required embedded image. The historical 27 October run also recorded four architecture relationship failures; those are observations under that run's observer, not a claim that the current observer reproduces every finding.

## Model and Editing Contracts

Pele 1.9.0: **555 structured-model criteria passed; 6 were unsupported** in the 27 October campaign. Flowchart identities, relationships and configuration-reset criteria passed. These are individual model criteria, not 561 diagrams or a complete editing-API certificate.

## Mermaid Assertion Replay

Pele 1.9.0: **4,908/5,113 executed assertions passed** in the 27 October replay. Expanded callbacks were **1,452 passed, 16 failed, 1,220 unavailable and 12 skipped**. Assertions and callbacks have different denominators; unavailable tests cannot be silently dropped from the report.

## Mermaid Reference Tests

Mermaid 12.2.0: **6,677 callbacks passed, zero failed, 16 pending and two todo**, across **331 files**, on 28 October. The sealed npm environment completed the genuine original core runner. Docs-site and browser/e2e tests were outside this run.

## Render Cost and Scaling

Pele 1.9.0, authored flowchart: historical median **17.06 ms** for a first API call in a fresh process (import excluded), versus **0.350 ms** for repeated calls. The 27 October protocol-v3 report was **uncalibrated overall**. These numbers illustrate separate workloads; they are not current protocol-v6 scores or evidence of an improvement.

## Sources

The receipt below records the exact raw-file digests and extraction scope. Full raw artifacts remain outside the source repository. These examples preserve their original dates; the current results directory remains empty.

- Community: PR #21 native-verification report, six authored cases per output.
- DaveBench, Diagram Meaning, Model and Editing, Render Cost and Scaling: retained `2026-10-27/trident-corrected` campaign.
- Mermaid Assertion Replay: retained `2026-10-27/trident-verified` replay.
- Mermaid Reference Tests: PR #21 fresh sealed original-runtime campaign.

See [description edits and reasoning](benchmark-description-review.md) and [the receipt](evidence/benchmark-examples.json).
