# Latias94/merman benchmark case study

Version: 0.9.2. Measured 2026-10-30T09:38:24.319Z through 2026-10-30T10:07:26.363Z. Fresh retained observations.

Cases: 54; families: 25; positive: 51; negative: 3. Failed workers: 1; blocked workers: 1.

Timing calibration: 32/155 rows calibrated. Format/text output admission: 49/51 positive cases; missing legacy evidence is not a failure. Declared native-plus-painted correspondence: 0/51 positive cases. Output admission, optional model APIs, painted correspondence and timing calibration are separate observations. No full-semantic performance claim is admitted without all its evidence.

A0, A1 and B use the same admitted artifact. Their differences diagnose measurement variation; they cannot establish a product speedup. Cold imports may prepare in batches, but first API calls execute one at a time after the complete idle barrier. Timings exclude import and qualification. Cases with a prelude report first-final-source timing after that prelude.

Calibration reports a descriptive A/A envelope separately from an exact median round-ratio uncertainty interval. Thousands of calls within five rounds are still only five independent rounds: a finite two-sided 95% sign interval needs at least six. Intervals require independent representative rounds and do not remove systematic host/workload differences. Repeated-source p95 values describe batch means, not individual tail latency.

## Family representatives

| Family | Warm repeated API median (ms) | Format/text-only calibrated | Full-check calibrated | Native + painted criteria |
|---|---:|---|---|---|
| flowchart | 2.4739 | false | false | partial; see case scopes |
| sequence | 2.2769 | false | false | partial; see case scopes |
| state | 2.0182 | false | false | partial; see case scopes |
| class | 2.4566 | false | false | partial; see case scopes |
| er | 1.6073 | false | false | partial; see case scopes |
| timeline | 0.7698 | false | false | partial; see case scopes |
| journey | 0.5947 | false | false | partial; see case scopes |
| architecture | 1.2136 | false | false | partial; see case scopes |
| xychart | 1.0171 | false | false | partial; see case scopes |
| pie | 0.4307 | false | false | partial; see case scopes |
| quadrant | 0.7076 | false | false | partial; see case scopes |
| gantt | 0.7823 | false | false | partial; see case scopes |
| mindmap | unavailable | false | false | partial; see case scopes |
| gitgraph | 0.8540 | false | false | partial; see case scopes |
| radar | 0.5984 | false | false | partial; see case scopes |
| sankey | 0.5039 | false | false | partial; see case scopes |
| c4 | 1.4796 | false | false | partial; see case scopes |
| packet | 0.3319 | false | false | partial; see case scopes |
| kanban | 0.9838 | false | false | partial; see case scopes |
| requirement | 2.2075 | true | true | partial; see case scopes |
| treemap | 0.6616 | false | false | partial; see case scopes |
| ishikawa | 0.4983 | false | false | partial; see case scopes |
| block | 0.7075 | false | false | partial; see case scopes |
| eventmodeling | 0.5104 | false | false | partial; see case scopes |
| zenuml | 0.5514 | false | false | partial; see case scopes |

## Scaling

| Family | Size | Warm repeat median (ms) | Warm calibrated | First-use p95 (ms) | First-use calibrated |
|---|---:|---:|---|---:|---|
| flowchart | 8 | 2.6649 | true | 15.8254 | false |
| flowchart | 32 | 4.3174 | true | 18.1208 | false |
| flowchart | 128 | 12.9785 | true | 27.1138 | false |
| sequence | 8 | 2.2640 | false | 15.6955 | false |
| sequence | 32 | 2.9146 | false | 11.2009 | false |
| sequence | 128 | 6.1944 | false | 28.0631 | false |
| class | 8 | 3.4368 | false | 17.0426 | false |
| class | 32 | 7.3699 | false | 21.3424 | false |
| class | 128 | 25.2823 | false | 42.0316 | true |
| state | 8 | 2.4040 | false | 15.2945 | false |
| state | 32 | 4.7225 | false | 22.1856 | true |
| state | 128 | 12.4100 | true | 36.3110 | true |
| er | 8 | 2.3864 | false | 15.6682 | false |
| er | 32 | 4.9117 | false | 20.4230 | false |
| er | 128 | 17.3012 | true | 38.1829 | true |
| architecture | 8 | 2.4186 | false | 11.8114 | false |
| architecture | 32 | 7.1529 | true | 18.4747 | false |
| architecture | 128 | 28.2912 | false | 150.4633 | false |

## Individual cases and fidelity

| Case | Acceptance matches | Format/text admission | Failed / blocked workers | Semantic scope |
|---|---|---|---:|---|
| family:flowchart | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:sequence | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:state | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:class | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:er | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:timeline | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:journey | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:architecture | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:xychart | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:pie | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:quadrant | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:gantt | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:mindmap | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:gitgraph | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:radar | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:sankey | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:c4 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:packet | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:kanban | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:requirement | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:treemap | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:ishikawa | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:block | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:eventmodeling | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:zenuml | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:label-edit | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:parallel-reciprocal | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:nested-groups | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:wide-unicode | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:generated-looking-ids | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:quoted-labels | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:invalid-recovery | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:configuration-reset | false | unavailable in retained protocol | 0 / 1 | Paint/native projection incomplete; never a full fidelity pass |
| invalid:unknown-header | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:missing-endpoints | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:unfinished-sequence | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |

## Memory and cost

API RSS/heap snapshots are read before output qualification, at return and after dropping the output and requesting GC. Signed deltas remain signed. Independent import/prelude-only baseline processes are retained. These snapshots do not measure peak native/WASM/GPU allocation. GNU time peaks and CPU, when available, describe the whole worker, including import, driver, GC and later qualification; they are not API-only peaks or provider invoices.

| Family representative | Median API-return RSS change (MiB) | Median post-GC heap change (KiB) | Median whole-worker peak RSS (MiB) |
|---|---:|---:|---:|
| flowchart | 3.250 | 22.734 | 73.756 |
| sequence | 1.875 | 18.461 | 72.068 |
| state | 2.875 | 18.461 | 73.795 |
| class | 3.125 | 18.461 | 73.705 |
| er | 2.625 | 18.461 | 72.797 |
| timeline | 1.125 | 18.461 | 71.719 |
| journey | 1.125 | 18.461 | 71.613 |
| architecture | 2.000 | 18.461 | 72.758 |
| xychart | 1.125 | 18.461 | 71.830 |
| pie | 1.000 | 18.461 | 71.662 |
| quadrant | 1.000 | 18.461 | 71.732 |
| gantt | 1.375 | 19.523 | 71.990 |
| mindmap | unavailable | unavailable | unavailable |
| gitgraph | 1.375 | 18.461 | 71.590 |
| radar | 1.125 | 18.461 | 71.098 |
| sankey | 1.125 | 19.555 | 71.658 |
| c4 | 1.500 | 18.461 | 72.396 |
| packet | 0.750 | 18.461 | 70.787 |
| kanban | 1.250 | 18.461 | 71.229 |
| requirement | 2.938 | 18.492 | 73.248 |
| treemap | 1.125 | 18.695 | 71.725 |
| ishikawa | 0.875 | 18.461 | 70.982 |
| block | 1.250 | 18.461 | 71.502 |
| eventmodeling | 1.125 | 18.496 | 71.094 |
| zenuml | 1.313 | 18.461 | 71.293 |

Live model cost: unavailable. No provider call is made by this runner. CPU cost needs an explicit rate; zero coarse CPU counters are censored, not free. Retention checkpoints at 0/10/100/1000 comment-varied calls of the same semantic graph are available for the declared small flowchart case, not all families or a leak proof.

## Uncalibrated or failed timing rows

- family:flowchart / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:sequence / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:state / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:state / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:state / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:class / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:class / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:er / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:er / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:er / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:timeline / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:timeline / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:timeline / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:journey / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:journey / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:journey / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:architecture / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:architecture / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:architecture / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:xychart / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:xychart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:pie / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:quadrant / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:gantt / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:gantt / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:gantt / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:mindmap / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:mindmap / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:mindmap / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:gitgraph / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:gitgraph / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:gitgraph / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:radar / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:sankey / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:sankey / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:sankey / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:packet / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:packet / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:packet / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:treemap / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:treemap / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:block / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:block / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:block / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:zenuml / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:zenuml / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:zenuml / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
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
- scaling:state:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:architecture:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:label-edit / warm-label-edit: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:parallel-reciprocal / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:nested-groups / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:wide-unicode / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-label-edit: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated

## Reproduction and raw evidence

Evidence directory: /workspace/trident-ecosystem-b0-2026-10-30/campaign/portable/Latias94%2Fmerman/attempts/ded3adb4-2b7b-45db-833e-66d158728624

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
