# crafter-station/mermaid benchmark case study

Version: 0.0.3. Measured 2026-10-30T09:06:35.818Z through 2026-10-30T09:06:50.369Z. Fresh retained observations.

Cases: 54; families: 25; positive: 51; negative: 3. Failed workers: 32; blocked workers: 1.

Timing calibration: 0/95 rows calibrated. Format/text output admission: 0/51 positive cases; missing legacy evidence is not a failure. Declared native-plus-painted correspondence: 0/51 positive cases. Output admission, optional model APIs, painted correspondence and timing calibration are separate observations. No full-semantic performance claim is admitted without all its evidence.

A0, A1 and B use the same admitted artifact. Their differences diagnose measurement variation; they cannot establish a product speedup. Cold imports may prepare in batches, but first API calls execute one at a time after the complete idle barrier. Timings exclude import and qualification. Cases with a prelude report first-final-source timing after that prelude.

Calibration reports a descriptive A/A envelope separately from an exact median round-ratio uncertainty interval. Thousands of calls within five rounds are still only five independent rounds: a finite two-sided 95% sign interval needs at least six. Intervals require independent representative rounds and do not remove systematic host/workload differences. Repeated-source p95 values describe batch means, not individual tail latency.

Unsupported families: timeline, journey, architecture, xychart, quadrant, gitgraph, radar, sankey, c4, packet, kanban, requirement, treemap, ishikawa, block, eventmodeling, zenuml. The renderer rejected each family's canonical source, so their 20 cases were not run; they are coverage gaps, not failures.

## Family representatives

| Family | Warm repeated API median (ms) | Format/text-only calibrated | Full-check calibrated | Native + painted criteria |
|---|---:|---|---|---|
| flowchart | unavailable | false | false | partial; see case scopes |
| sequence | unavailable | false | false | partial; see case scopes |
| state | unavailable | false | false | partial; see case scopes |
| class | unavailable | false | false | partial; see case scopes |
| er | unavailable | false | false | partial; see case scopes |
| timeline | unsupported | false | false | partial; see case scopes |
| journey | unsupported | false | false | partial; see case scopes |
| architecture | unsupported | false | false | partial; see case scopes |
| xychart | unsupported | false | false | partial; see case scopes |
| pie | unavailable | false | false | partial; see case scopes |
| quadrant | unsupported | false | false | partial; see case scopes |
| gantt | unavailable | false | false | partial; see case scopes |
| mindmap | unavailable | false | false | partial; see case scopes |
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
| flowchart | 8 | unavailable | false | unavailable | false |
| flowchart | 32 | unavailable | false | unavailable | false |
| flowchart | 128 | unavailable | false | unavailable | false |
| sequence | 8 | unavailable | false | unavailable | false |
| sequence | 32 | unavailable | false | unavailable | false |
| sequence | 128 | unavailable | false | unavailable | false |
| class | 8 | unavailable | false | unavailable | false |
| class | 32 | unavailable | false | unavailable | false |
| class | 128 | unavailable | false | unavailable | false |
| state | 8 | unavailable | false | unavailable | false |
| state | 32 | unavailable | false | unavailable | false |
| state | 128 | unavailable | false | unavailable | false |
| er | 8 | unavailable | false | unavailable | false |
| er | 32 | unavailable | false | unavailable | false |
| er | 128 | unavailable | false | unavailable | false |

## Individual cases and fidelity

| Case | Acceptance matches | Format/text admission | Failed / blocked workers | Semantic scope |
|---|---|---|---:|---|
| family:flowchart | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:sequence | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:state | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:class | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:er | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:timeline | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:journey | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:architecture | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:xychart | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:pie | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:quadrant | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| family:gantt | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:mindmap | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
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
| scaling:flowchart:8 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:32 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:128 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:8 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:32 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:128 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:8 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:32 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:128 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:8 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:32 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:128 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:8 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:32 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:128 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:8 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:architecture:32 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| scaling:architecture:128 | false | unavailable in retained protocol | 0 / 0 | Family unsupported; not run |
| adversarial:label-edit | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:parallel-reciprocal | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:nested-groups | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:wide-unicode | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:generated-looking-ids | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:quoted-labels | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:invalid-recovery | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:configuration-reset | false | unavailable in retained protocol | 0 / 1 | Paint/native projection incomplete; never a full fidelity pass |
| invalid:unknown-header | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:missing-endpoints | false | unavailable in retained protocol | 1 / 0 | Negative-source rejection only |
| invalid:unfinished-sequence | false | unavailable in retained protocol | 1 / 0 | Negative-source rejection only |

## Memory and cost

API RSS/heap snapshots are read before output qualification, at return and after dropping the output and requesting GC. Signed deltas remain signed. Independent import/prelude-only baseline processes are retained. These snapshots do not measure peak native/WASM/GPU allocation. GNU time peaks and CPU, when available, describe the whole worker, including import, driver, GC and later qualification; they are not API-only peaks or provider invoices.

| Family representative | Median API-return RSS change (MiB) | Median post-GC heap change (KiB) | Median whole-worker peak RSS (MiB) |
|---|---:|---:|---:|
| flowchart | unavailable | unavailable | unavailable |
| sequence | unavailable | unavailable | unavailable |
| state | unavailable | unavailable | unavailable |
| class | unavailable | unavailable | unavailable |
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

- family:flowchart / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:flowchart / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:flowchart / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:sequence / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:sequence / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:sequence / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:state / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:state / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:state / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:class / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:class / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:class / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:er / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:er / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:er / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:pie / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:pie / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:pie / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:gantt / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:gantt / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:gantt / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:mindmap / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:mindmap / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:mindmap / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:8 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:8 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:8 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:32 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:32 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:32 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:128 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:128 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:128 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:8 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:8 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:8 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:32 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:32 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:32 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:128 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:128 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:128 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:8 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:8 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:8 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:32 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:32 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:32 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:128 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:128 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:128 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:state:8 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:state:8 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:state:8 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:state:32 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:state:32 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:state:32 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:state:128 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:state:128 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:state:128 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:8 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:8 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:8 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:32 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:32 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:32 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:128 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:128 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:128 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:label-edit / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:label-edit / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:label-edit / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:label-edit / warm-label-edit: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:parallel-reciprocal / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:parallel-reciprocal / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:parallel-reciprocal / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:nested-groups / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:nested-groups / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:nested-groups / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:wide-unicode / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:wide-unicode / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:wide-unicode / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:generated-looking-ids / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:generated-looking-ids / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:generated-looking-ids / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
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

Evidence directory: /workspace/trident-ecosystem-b0-2026-10-30/campaign/portable/crafter-station%2Fmermaid/attempts/653d8961-8dfc-4410-81b3-b92eec0609ae

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
