# KlangHaus/vitepress-plugin-diagram benchmark case study

Version: 0.3.2. Measured 2026-10-30T09:29:36.746Z through 2026-10-30T09:38:07.169Z. Fresh retained observations.

Cases: 54; families: 25; positive: 51; negative: 3. Failed workers: 6; blocked workers: 0.

Timing calibration: 5/62 rows calibrated. Format/text output admission: 17/51 positive cases; missing legacy evidence is not a failure. Declared native-plus-painted correspondence: 0/51 positive cases. Output admission, optional model APIs, painted correspondence and timing calibration are separate observations. No full-semantic performance claim is admitted without all its evidence.

A0, A1 and B use the same admitted artifact. Their differences diagnose measurement variation; they cannot establish a product speedup. Cold imports may prepare in batches, but first API calls execute one at a time after the complete idle barrier. Timings exclude import and qualification. Cases with a prelude report first-final-source timing after that prelude.

Calibration reports a descriptive A/A envelope separately from an exact median round-ratio uncertainty interval. Thousands of calls within five rounds are still only five independent rounds: a finite two-sided 95% sign interval needs at least six. Intervals require independent representative rounds and do not remove systematic host/workload differences. Repeated-source p95 values describe batch means, not individual tail latency.

Unsupported families: state, er, timeline, journey, architecture, xychart, pie, quadrant, gantt, mindmap, gitgraph, radar, sankey, c4, packet, kanban, requirement, treemap, ishikawa, block, eventmodeling, zenuml. The renderer rejected each family's canonical source, so their 31 cases were not run; they are coverage gaps, not failures.

## Family representatives

| Family | Warm repeated API median (ms) | Format/text-only calibrated | Full-check calibrated | Native + painted criteria |
|---|---:|---|---|---|
| flowchart | 0.4067 | false | false | partial; see case scopes |
| sequence | 0.1184 | false | false | partial; see case scopes |
| state | unsupported | false | false | partial; see case scopes |
| class | 0.2494 | false | false | partial; see case scopes |
| er | unsupported | false | false | partial; see case scopes |
| timeline | unsupported | false | false | partial; see case scopes |
| journey | unsupported | false | false | partial; see case scopes |
| architecture | unsupported | false | false | partial; see case scopes |
| xychart | unsupported | false | false | partial; see case scopes |
| pie | unsupported | false | false | partial; see case scopes |
| quadrant | unsupported | false | false | partial; see case scopes |
| gantt | unsupported | false | false | partial; see case scopes |
| mindmap | unsupported | false | false | partial; see case scopes |
| gitgraph | unsupported | false | false | partial; see case scopes |
| radar | unsupported | false | false | partial; see case scopes |
| sankey | unsupported | false | false | partial; see case scopes |
| c4 | unsupported | false | false | partial; see case scopes |
| packet | unsupported | false | false | partial; see case scopes |
| kanban | unsupported | false | false | partial; see case scopes |
| requirement | unsupported | false | false | partial; see case scopes |
| treemap | unsupported | false | false | partial; see case scopes |
| ishikawa | unsupported | false | false | partial; see case scopes |
| block | unsupported | false | false | partial; see case scopes |
| eventmodeling | unsupported | false | false | partial; see case scopes |
| zenuml | unsupported | false | false | partial; see case scopes |

## Scaling

| Family | Size | Warm repeat median (ms) | Warm calibrated | First-use p95 (ms) | First-use calibrated |
|---|---:|---:|---|---:|---|
| flowchart | 8 | 0.8649 | false | 16.3211 | true |
| flowchart | 32 | 2.4559 | false | 28.9428 | false |
| flowchart | 128 | 7.8369 | false | 40.6117 | false |
| sequence | 8 | 0.1841 | false | 12.5324 | false |
| sequence | 32 | 0.5247 | false | 11.5982 | false |
| sequence | 128 | 1.8760 | false | 19.4446 | false |
| class | 8 | 0.8173 | false | 20.7721 | false |
| class | 32 | 2.7259 | false | 26.3442 | false |
| class | 128 | 8.9639 | false | 55.1703 | true |

## Individual cases and fidelity

| Case | Acceptance matches | Format/text admission | Failed / blocked workers | Semantic scope |
|---|---|---|---:|---|
| family:flowchart | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:sequence | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:state | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:class | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:er | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:timeline | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:journey | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:architecture | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:xychart | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:pie | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:quadrant | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:gantt | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:mindmap | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:gitgraph | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:radar | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:sankey | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:c4 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:packet | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:kanban | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:requirement | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:treemap | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:ishikawa | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:block | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:eventmodeling | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:zenuml | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:flowchart:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:8 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:state:32 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:state:128 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:er:8 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:er:32 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:er:128 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:architecture:8 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:architecture:32 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:architecture:128 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| adversarial:label-edit | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:parallel-reciprocal | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:nested-groups | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:wide-unicode | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:generated-looking-ids | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:quoted-labels | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:invalid-recovery | false | passed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:configuration-reset | false | unavailable in retained protocol | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| invalid:unknown-header | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:missing-endpoints | false | unavailable in retained protocol | 1 / 0 | Negative-source rejection only |
| invalid:unfinished-sequence | false | unavailable in retained protocol | 1 / 0 | Negative-source rejection only |

## Memory and cost

API RSS/heap snapshots are read before output qualification, at return and after dropping the output and requesting GC. Signed deltas remain signed. Independent import/prelude-only baseline processes are retained. These snapshots do not measure peak native/WASM/GPU allocation. GNU time peaks and CPU, when available, describe the whole worker, including import, driver, GC and later qualification; they are not API-only peaks or provider invoices.

| Family representative | Median API-return RSS change (MiB) | Median post-GC heap change (KiB) | Median whole-worker peak RSS (MiB) |
|---|---:|---:|---:|
| flowchart | 0.188 | 146.156 | 65.119 |
| sequence | 0.125 | 56.539 | 65.072 |
| state | unavailable | unavailable | unavailable |
| class | 0.125 | 112.141 | 64.926 |
| er | unavailable | unavailable | unavailable |
| timeline | unavailable | unavailable | unavailable |
| journey | unavailable | unavailable | unavailable |
| architecture | unavailable | unavailable | unavailable |
| xychart | unavailable | unavailable | unavailable |
| pie | unavailable | unavailable | unavailable |
| quadrant | unavailable | unavailable | unavailable |
| gantt | unavailable | unavailable | unavailable |
| mindmap | unavailable | unavailable | unavailable |
| gitgraph | unavailable | unavailable | unavailable |
| radar | unavailable | unavailable | unavailable |
| sankey | unavailable | unavailable | unavailable |
| c4 | unavailable | unavailable | unavailable |
| packet | unavailable | unavailable | unavailable |
| kanban | unavailable | unavailable | unavailable |
| requirement | unavailable | unavailable | unavailable |
| treemap | unavailable | unavailable | unavailable |
| ishikawa | unavailable | unavailable | unavailable |
| block | unavailable | unavailable | unavailable |
| eventmodeling | unavailable | unavailable | unavailable |
| zenuml | unavailable | unavailable | unavailable |

Live model cost: unavailable. No provider call is made by this runner. CPU cost needs an explicit rate; zero coarse CPU counters are censored, not free. Retention checkpoints at 0/10/100/1000 comment-varied calls of the same semantic graph are available for the declared small flowchart case, not all families or a leak proof.

## Uncalibrated or failed timing rows

- family:flowchart / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:class / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:class / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:class / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-label-edit: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:nested-groups / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:nested-groups / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:wide-unicode / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:wide-unicode / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:quoted-labels / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:quoted-labels / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:invalid-recovery / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:invalid-recovery / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:invalid-recovery / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-label-edit: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated

## Reproduction and raw evidence

Evidence directory: /workspace/trident-ecosystem-b0-2026-10-30/campaign/portable/KlangHaus%2Fvitepress-plugin-diagram/attempts/4e424bb7-064d-46ec-9753-da06fe9b1968

Sampling:
```json
{
  "rounds": 6,
  "samples": 31,
  "coldSamples": 5,
  "minSampleMs": 2,
  "workerTimeoutMs": 300000,
  "preparationConcurrency": 8,
  "maximumControlSpread": 0.25,
  "order": "rotate A0/A1/B by round and case; all warm jobs, then all cold jobs, then serial memory/baseline jobs",
  "controls": "A0/A1/B are the exact same admitted artifact, not three tool versions",
  "caseAdmission": "All selected cases remain in scope. A rejected family probe marks its cases unsupported. Invalid controls run once; cases failing or blocking admission retain their outcome but receive no further timing/resource jobs.",
  "warmScope": "Per-call means from batches bounded by minSampleMs or256calls; every distinct immutable SVG is checked outside clocks, byte-identical admitted returns reuse qualification; individual first-use samples are fresh processes",
  "commentVariantScope": "Trailing comment changes only source bytes, never semantic graph; this is a cache-key diagnostic",
  "coldScope": "Concurrent import preparation behind an idle barrier; one measured API call at a time and complete child exit before the next",
  "memoryScope": "Separate serial fresh processes; API snapshots precede qualification, GNU time describes the whole worker",
  "retentionCalls": [
    0,
    10,
    100,
    1000
  ]
}
```

Every individual first-use sample and every warm batch mean is retained. Representative SVG and full qualification payloads accompany raw results; repeated passing payloads are compacted. Dave, the historical fixed core and pinned-Mermaid scores are unchanged. Curves, clipping, full shape boundaries, computed fonts and perceptual quality need separate reviewed evidence.
