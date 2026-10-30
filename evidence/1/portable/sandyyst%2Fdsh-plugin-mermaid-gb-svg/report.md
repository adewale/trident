# sandyyst/dsh-plugin-mermaid-gb-svg benchmark case study

Version: 0.1.4. Measured 2026-10-30T11:25:50.034Z through 2026-10-30T11:37:00.901Z. Fresh retained observations.

Cases: 54; families: 25; positive: 51; negative: 3. Failed workers: 32; blocked workers: 1.

Timing calibration: 2/155 rows calibrated. Format/text output admission: 20/51 positive cases; missing legacy evidence is not a failure. Declared native-plus-painted correspondence: 0/51 positive cases. Output admission, optional model APIs, painted correspondence and timing calibration are separate observations. No full-semantic performance claim is admitted without all its evidence.

A0, A1 and B use the same admitted artifact. Their differences diagnose measurement variation; they cannot establish a product speedup. Cold imports may prepare in batches, but first API calls execute one at a time after the complete idle barrier. Timings exclude import and qualification. Cases with a prelude report first-final-source timing after that prelude.

Calibration reports a descriptive A/A envelope separately from an exact median round-ratio uncertainty interval. Thousands of calls within five rounds are still only five independent rounds: a finite two-sided 95% sign interval needs at least six. Intervals require independent representative rounds and do not remove systematic host/workload differences. Repeated-source p95 values describe batch means, not individual tail latency.

## Family representatives

| Family | Warm repeated API median (ms) | Format/text-only calibrated | Full-check calibrated | Native + painted criteria |
|---|---:|---|---|---|
| flowchart | 0.1994 | false | false | partial; see case scopes |
| sequence | unavailable | false | false | partial; see case scopes |
| state | unavailable | false | false | partial; see case scopes |
| class | unavailable | false | false | partial; see case scopes |
| er | unavailable | false | false | partial; see case scopes |
| timeline | unavailable | false | false | partial; see case scopes |
| journey | unavailable | false | false | partial; see case scopes |
| architecture | unavailable | false | false | partial; see case scopes |
| xychart | unavailable | false | false | partial; see case scopes |
| pie | unavailable | false | false | partial; see case scopes |
| quadrant | unavailable | false | false | partial; see case scopes |
| gantt | unavailable | false | false | partial; see case scopes |
| mindmap | 0.1595 | false | false | partial; see case scopes |
| gitgraph | unavailable | false | false | partial; see case scopes |
| radar | unavailable | false | false | partial; see case scopes |
| sankey | unavailable | false | false | partial; see case scopes |
| c4 | 0.1303 | false | false | partial; see case scopes |
| packet | unavailable | false | false | partial; see case scopes |
| kanban | 0.1546 | false | false | partial; see case scopes |
| requirement | unavailable | false | false | partial; see case scopes |
| treemap | unavailable | false | false | partial; see case scopes |
| ishikawa | 0.1967 | false | false | partial; see case scopes |
| block | 0.2242 | false | false | partial; see case scopes |
| eventmodeling | unavailable | false | false | partial; see case scopes |
| zenuml | unavailable | false | false | partial; see case scopes |

## Scaling

| Family | Size | Warm repeat median (ms) | Warm calibrated | First-use p95 (ms) | First-use calibrated |
|---|---:|---:|---|---:|---|
| flowchart | 8 | 0.4559 | false | 17.0501 | false |
| flowchart | 32 | 2.1005 | false | 38.8980 | false |
| flowchart | 128 | 8.3043 | false | 96.2123 | false |
| sequence | 8 | unavailable | false | unavailable | false |
| sequence | 32 | unavailable | false | unavailable | false |
| sequence | 128 | unavailable | false | unavailable | false |
| class | 8 | 0.5503 | false | 18.4243 | false |
| class | 32 | 2.2051 | false | 48.7892 | false |
| class | 128 | 10.9239 | false | 198.0494 | false |
| state | 8 | 0.5774 | false | 52.7394 | false |
| state | 32 | 2.5846 | false | 61.6640 | false |
| state | 128 | 10.3675 | false | 67.2483 | false |
| er | 8 | unavailable | false | unavailable | false |
| er | 32 | unavailable | false | unavailable | false |
| er | 128 | unavailable | false | unavailable | false |
| architecture | 8 | unavailable | false | unavailable | false |
| architecture | 32 | unavailable | false | unavailable | false |
| architecture | 128 | unavailable | false | unavailable | false |

## Individual cases and fidelity

| Case | Acceptance matches | Format/text admission | Failed / blocked workers | Semantic scope |
|---|---|---|---:|---|
| family:flowchart | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:sequence | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:state | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:class | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:er | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:timeline | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:journey | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:architecture | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:xychart | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:pie | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:quadrant | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:gantt | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:mindmap | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:gitgraph | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:radar | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:sankey | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:c4 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:packet | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:kanban | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:requirement | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:treemap | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:ishikawa | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:block | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:eventmodeling | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| family:zenuml | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:flowchart:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:8 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:32 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:sequence:128 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:class:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:8 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:32 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:state:128 | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:8 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:32 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:er:128 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:8 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:32 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| scaling:architecture:128 | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:label-edit | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:parallel-reciprocal | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:nested-groups | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:wide-unicode | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:generated-looking-ids | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:quoted-labels | false | failed | 1 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:invalid-recovery | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:configuration-reset | false | unavailable in retained protocol | 0 / 1 | Paint/native projection incomplete; never a full fidelity pass |
| invalid:unknown-header | false | unavailable in retained protocol | 1 / 0 | Negative-source rejection only |
| invalid:missing-endpoints | true | unavailable in retained protocol | 0 / 0 | Negative-source rejection only |
| invalid:unfinished-sequence | false | unavailable in retained protocol | 1 / 0 | Negative-source rejection only |

## Memory and cost

API RSS/heap snapshots are read before output qualification, at return and after dropping the output and requesting GC. Signed deltas remain signed. Independent import/prelude-only baseline processes are retained. These snapshots do not measure peak native/WASM/GPU allocation. GNU time peaks and CPU, when available, describe the whole worker, including import, driver, GC and later qualification; they are not API-only peaks or provider invoices.

| Family representative | Median API-return RSS change (MiB) | Median post-GC heap change (KiB) | Median whole-worker peak RSS (MiB) |
|---|---:|---:|---:|
| flowchart | 0.188 | 153.336 | 65.039 |
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
| mindmap | 0.313 | 154.586 | 64.469 |
| gitgraph | unavailable | unavailable | unavailable |
| radar | unavailable | unavailable | unavailable |
| sankey | unavailable | unavailable | unavailable |
| c4 | 0.250 | 114.859 | 64.535 |
| packet | unavailable | unavailable | unavailable |
| kanban | 0.188 | 155.609 | 64.023 |
| requirement | unavailable | unavailable | unavailable |
| treemap | unavailable | unavailable | unavailable |
| ishikawa | 0.125 | 156.148 | 64.598 |
| block | 0.125 | 165.023 | 64.619 |
| eventmodeling | unavailable | unavailable | unavailable |
| zenuml | unavailable | unavailable | unavailable |

Live model cost: unavailable. No provider call is made by this runner. CPU cost needs an explicit rate; zero coarse CPU counters are censored, not free. Retention checkpoints at 0/10/100/1000 comment-varied calls of the same semantic graph are available for the declared small flowchart case, not all families or a leak proof.

## Uncalibrated or failed timing rows

- family:flowchart / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:flowchart / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
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
- family:timeline / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:timeline / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:timeline / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:journey / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:journey / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:journey / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:architecture / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:architecture / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:architecture / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:xychart / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:xychart / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:xychart / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:pie / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:pie / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:pie / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:quadrant / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:quadrant / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:quadrant / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:gantt / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:gantt / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:gantt / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:mindmap / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:mindmap / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:mindmap / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:gitgraph / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:gitgraph / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:gitgraph / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:radar / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:radar / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:radar / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:sankey / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:sankey / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:sankey / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:c4 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:c4 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:packet / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:packet / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:packet / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:kanban / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:kanban / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:requirement / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:requirement / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:requirement / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:treemap / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:treemap / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:treemap / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:ishikawa / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:ishikawa / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:block / first-use: Observed A/A control spread exceeds the declared noise ceiling
- family:block / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- family:block / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- family:eventmodeling / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:eventmodeling / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:eventmodeling / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:zenuml / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:zenuml / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- family:zenuml / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:flowchart:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:flowchart:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:sequence:8 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:8 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:8 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:32 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:32 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:32 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:128 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:128 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:sequence:128 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:class:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:class:128 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:8 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:32 / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:128 / first-use: Observed A/A control spread exceeds the declared noise ceiling
- scaling:state:128 / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- scaling:er:8 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:8 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:8 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:32 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:32 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:32 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:128 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:128 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:er:128 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:8 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:8 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:8 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:32 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:32 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:32 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:128 / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:128 / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- scaling:architecture:128 / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
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
- adversarial:wide-unicode / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:generated-looking-ids / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:quoted-labels / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:quoted-labels / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:quoted-labels / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:invalid-recovery / first-use: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / warm-repeat: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:invalid-recovery / warm-new-source: Observed A/A control spread exceeds the declared noise ceiling
- adversarial:configuration-reset / first-use: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-repeat: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-new-source: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated
- adversarial:configuration-reset / warm-label-edit: Every replica/round needs the declared finite positive sample count; Expected worker identities are missing or duplicated

## Reproduction and raw evidence

Evidence directory: /workspace/trident-ecosystem-b0-2026-10-30/campaign/portable/sandyyst%2Fdsh-plugin-mermaid-gb-svg/attempts/28818a9c-ccea-45c4-90de-2d3367e9e038

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
