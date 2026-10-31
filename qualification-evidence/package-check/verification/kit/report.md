# adewale/agentic-mermaid benchmark case study

Version: 0.4.1. Measured 2026-10-31T15:11:39.471Z through 2026-10-31T15:12:28.302Z. Fresh retained observations.

Cases: 4; families: 1; positive: 4; negative: 0. Failed workers: 0; blocked workers: 0.

Timing calibration: 0/14 rows calibrated. Format/text output admission: 4/4 positive cases; missing legacy evidence is not a failure. Declared native-plus-painted correspondence: 0/4 positive cases. Output admission, optional model APIs, painted correspondence and timing calibration are separate observations. No full-semantic performance claim is admitted without all its evidence.

A0, A1 and B use the same admitted artifact. Their differences diagnose measurement variation; they cannot establish a product speedup. Cold imports may prepare in batches, but first API calls execute one at a time after the complete idle barrier. Timings exclude import and qualification. Cases with a prelude report first-final-source timing after that prelude.

Calibration reports a descriptive A/A envelope separately from an exact median round-ratio uncertainty interval. Thousands of calls within five rounds are still only five independent rounds: a finite two-sided 95% sign interval needs at least six. Intervals require independent representative rounds and do not remove systematic host/workload differences. Repeated-source p95 values describe batch means, not individual tail latency.

## Family representatives

| Family | Warm repeated API median (ms) | Format/text-only calibrated | Full-check calibrated | Native + painted criteria |
|---|---:|---|---|---|
| flowchart | 37.7186 | false | false | partial; see case scopes |

## Scaling

| Family | Size | Warm repeat median (ms) | Warm calibrated | First-use p95 (ms) | First-use calibrated |
|---|---:|---:|---|---:|---|

## Individual cases and fidelity

| Case | Acceptance matches | Format/text admission | Failed / blocked workers | Semantic scope |
|---|---|---|---:|---|
| family:flowchart | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:label-edit | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:invalid-recovery | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |
| adversarial:configuration-reset | true | passed | 0 / 0 | Paint/native projection incomplete; never a full fidelity pass |

## Memory and cost

API RSS/heap snapshots are read before output qualification, at return and after dropping the output and requesting GC. Signed deltas remain signed. Independent import/prelude-only baseline processes are retained. These snapshots do not measure peak native/WASM/GPU allocation. GNU time peaks and CPU, when available, describe the whole worker, including import, driver, GC and later qualification; they are not API-only peaks or provider invoices.

| Family representative | Median API-return RSS change (MiB) | Median post-GC heap change (KiB) | Median whole-worker peak RSS (MiB) |
|---|---:|---:|---:|
| flowchart | 13.586 | 9812.789 | 92.734 |

Live model cost: unavailable. No provider call is made by this runner. CPU cost needs an explicit rate; zero coarse CPU counters are censored, not free. Retention checkpoints at 0/10/100/1000 comment-varied calls of the same semantic graph are available for the declared small flowchart case, not all families or a leak proof.

## Uncalibrated or failed timing rows

- family:flowchart / first-use: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- family:flowchart / warm-repeat: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- family:flowchart / warm-new-source: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:label-edit / first-use: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:label-edit / warm-repeat: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:label-edit / warm-new-source: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:label-edit / warm-label-edit: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:invalid-recovery / first-use: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:invalid-recovery / warm-repeat: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:invalid-recovery / warm-new-source: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:configuration-reset / first-use: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:configuration-reset / warm-repeat: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:configuration-reset / warm-new-source: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count
- adversarial:configuration-reset / warm-label-edit: At least five independent rounds are required; Every replica/round needs the declared finite positive sample count

## Reproduction and raw evidence

Evidence directory: /workspace/trident-qualification-package-check-2026-10-31/verification/kit/attempts/a6e3bc21-248a-4f18-9601-e3a904db9acd

Sampling:
```json
{
  "caseSelection": {
    "scope": "explicit subset; no whole-portfolio score",
    "requestedIds": [
      "family:flowchart",
      "adversarial:label-edit",
      "adversarial:configuration-reset",
      "adversarial:invalid-recovery"
    ],
    "selectedIds": [
      "family:flowchart",
      "adversarial:label-edit",
      "adversarial:invalid-recovery",
      "adversarial:configuration-reset"
    ]
  },
  "rounds": 1,
  "samples": 1,
  "coldSamples": 1,
  "minSampleMs": 0,
  "workerTimeoutMs": 15000,
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
