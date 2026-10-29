# Seven-library PNG campaign: adversarial statistical review

Reviewed 2026-10-29. Bounded, read-only audit of the requested runner, completion adapter, analyzer, README, prospective plan, summary and retained measurement evidence. Only this report was written. No renderer, benchmark, experiment, publication or external message was run. This is the statistical/completion review within the requested adversarial audit; no separate agent execution is claimed.

**Verdict: no blocking defect found in the reported fixed-profile estimates or their implemented bootstrap arithmetic.** The result supports an observed ordering for this warm, fixed-canvas export task on these 13 inputs and this host. It does not establish a unique fastest implementation, a simultaneous seven-way ordering, statistical independence merely from fresh processes, or performance over the documentation corpus. Two latent failure-handling defects deserve repair before relying on this machinery for campaigns containing failures; neither is triggered here.

## Findings, ordered by consequence

### 1. Medium: warmup failures can silently change the measured process history

The measured source restarts an actor after a warmup timeout and then continues the remaining warmup loop; it does not restart the complete two-pass warmup for the replacement actor. The analyzer rejects timeouts only in `measured`, and merely counts `warmups`. Consequently a campaign can report a complete score after a warmup timeout with fewer than two full passes in the actual measured process. Other warmup correctness/stability failures are also ignored by eligibility selection, despite the plan's general correctness/stability exclusion rule.

Evidence: retained `source/davebench-png__seven__run.mjs:138–141`; `source/davebench-png__seven__analyze.py:23–37`. `completed.json` means collection finished, not that process-history eligibility passed.

Disposition: **not a blocker for this dataset**: all 3,640 warmup rows and all 5,460 measured rows are `ok`, with complete unique cells. Before future use, invalidate affected campaigns or require a fresh actor with the complete prescribed warmup, retain the failure, and make the analysis enforce that policy. A measured timeout is correctly rejected by the existing analyzer even though collection continues after restarting.

### 2. Medium: review-pixel enforcement fails open if an expected hash is absent

The runtime checks `if (expected && expected !== inspection.pixelSha256)`. It validates the review's identity and participant list, but does not require every eligible participant/input pixel hash. A malformed review can therefore admit an input without its stability check. The analyzer trusts statuses and does not independently enforce review-hash completeness or compare inspection hashes.

Evidence: retained `run.mjs:51–53,115–118`; analyzer eligibility loop. Require a complete participant-by-eligible-input review matrix before collection and assert it again during analysis.

Disposition: **not a blocker here**: every retained row's inspection pixel hash matches its expected participant/input review hash, with zero missing/mismatched comparisons. This audit checked recorded hashes against review evidence; it did not independently decode all 9,100 PNGs or redo the semantic image review. Fourteen sampled files, the first and last measured PNG for each participant, match their recorded encoded SHA-256 values.

### 3. Inferential limit: fresh launches are the right sampling unit, but do not prove independent rounds

Three calls within one launch are dependent observations; the code correctly reduces them to one input median and resamples entire launch rounds. The effective bootstrap sample size is 20 rounds, not 5,460 calls or 260 independent input/launch cells. Keeping all participants and inputs together in each bootstrap draw preserves their observed within-round covariance. A round is a sequential set of seven launches, not simultaneous measurement under identical host conditions.

All participants share one host, Node driver, container/cgroup and continuing OS state. CPU affinity/quota prevents competing benchmark engines from using extra cores; it does not reserve the host CPU or reset kernel caches, frequency, external host load or other persistent state. Deterministic rotation/reversal balances position reasonably, but is not randomized assignment in every round: each participant appears twice in one position and three times in each other position. Exchangeability across rounds remains an assumption of the ordinary bootstrap; serial environmental drift is not modeled.

Evidence supports fresh actors rather than concurrent engines: 140 actor receipts, 20 per participant; 420 isolation snapshots all report CPU2, `100000 100000` quota and 16 GiB, with every recorded thread affinity equal to CPU2. The runner closes actors and checks for surviving renderer/native processes. This does not establish mathematical independence.

A descriptive check on existing data gives second-half/first-half geometric score ratios of 0.9424 for Mermaid and 1.0507 for Beautiful; the other participants range from 0.9718 to 1.0301. These are observations, not drift tests. They reinforce caution about sub-percent point gaps. No independence failure was demonstrated, and no extra experiment is warranted to retain the qualified descriptive result. Call the units “fresh launch rounds” and retain the conditional nature of the intervals.

### 4. Inferential limit: selection, multiplicity and practical equivalence

The fastest reference is selected from the same observations. Its ratio to itself is necessarily 1 with a degenerate interval; that conveys no uncertainty about which implementation is fastest. Other reference intervals condition on that selected identity and do not account for selection. There are 21 unadjusted pairwise intervals, so 95% coverage is pointwise, not a familywise rank guarantee. The summary and README disclose these limits appropriately.

Pele/Dart is **1.008409 [0.959401, 1.059676]**; Beautiful/Zombie is **1.008542 [0.968064, 1.047568]**. Both include 1. Neither a directional winner nor practical equivalence is established for either pair. Equivalence would require a prespecified meaningful margin and corresponding inference. Preserve observed ranks as descriptive labels. A unique-winner or simultaneous-rank claim would be a reporting blocker; the supplied result explicitly avoids those claims.

Odd/even A/A warnings are diagnostic interval-width/tolerance flags: the code warns if either endpoint leaves [0.90, 1.10], rather than testing whether the interval excludes 1. Dart, Beautiful, Agentic and Mermaid warn. They do not demonstrate bias or invalidate all ratios. Alternating halves also cannot diagnose every kind of monotonic drift or order effect. The current decision not to suppress unrelated comparisons is reasonable.

### 5. Task equivalence is defensible; renderer-only equivalence would not be

The primary timer starts immediately before `a.render`, includes response serialization/IPC and exactly one final Base64-to-binary decode in Node, and stops before witness retrieval, file writes and PNG inspection (`run.mjs:100–124`). The browser completion function computes byte length arithmetically and does not call `atob`. The older `controlledExport` function still contains `atob`, but this campaign calls `completedPng`; the presence of unused legacy code is not evidence of a second decode. The partial `measurement-redundant-decode` directory is outside the analyzer's selected `measurement` input and was not pooled into these calculations.

Browser implementations produce SVG and use the same Chromium converter. Native Dart pays for native SVG, its bridge and the same converter. Flutter pays for public intrinsic PNG generation, PNG decoding, fixed-canvas padding and a second encoding. Successful responses include completed PNG readback/encoding, not merely queued drawing. Browser cleanup and native disposal before response delivery also fall within client wall time. The API/work-stage clocks omit some transport/cleanup and must remain secondary metrics.

This measures the cost of completing the declared 1200×900 binary export through each chosen public path. It is not a comparison of isolated renderer, encoder, widget or native-only CPU speed. Differing layout, intrinsic image area, output size/compression and text measurement are part of the configured task. Pixel stability is within each participant/input against reviewed pixels, not pixel equality across participants. That distinction is necessary for the completion-equivalence claim and is honestly stated in the supplied scope.

### 6. Selection and provenance limits are disclosed; integrity checks passed

Thirteen cases are a prespecified common-success subset of 20 reviewed candidates, not a random or held-out sample of 548 occurrences. Intersection selection conditions on every implementation's capability and semantics and can remove difficult features disproportionately. Geometric averaging weights input occurrences equally, not diagram families or realistic workload frequencies. Bootstrap resampling only rounds is correct for the declared fixed inputs and provides no uncertainty over arbitrary diagrams. The full-corpus contract-success table must remain separate from semantic correctness and timing generalization.

The prospective plan precedes collection by about two seconds and specifies the same 13 inputs, review hash and render identity as the retained context. This establishes local recorded ordering, not externally authenticated preregistration. No post-timing exclusions occurred. A future campaign with correctness exclusions would estimate a changed common-success subset; it should prominently disclose that change. The analyzer does not enforce the prospective plan itself or strictly validate every warmup/rep/index cell, so retain an explicit integrity check as part of review rather than relying on `complete: true` alone.

All 18 retained source snapshots match both their context SHA-256 values and commit `f2045b56b662231b9432937c8ed2201f0c5efb06`. Context and review hashes match summary/plan bindings. Current `completed.ts` and `analyze.py` equal their measured snapshots. The current runner differs for the ZenUML loader/build sealing fix; the diff inspected introduces no change to measurement clocks or sampling loops. Coverage comes from `bd8e9b3fe933e4a9262dace5dd3d86700b12aa0f`, so coverage and timing have distinct producer provenance and should keep their separate receipts. The 13 timed cases contain no ZenUML case. This is not grounds to relabel timing as measured at the newer commit.

## Independently checked arithmetic and completeness

Without executing the analyzer or overwriting the summary, a separate calculation parsed raw JSONL, formed each three-call median, averaged logs equally across the 13 inputs and 20 rounds, and reproduced the seeded 10,000 paired bootstrap draws. All seven scores, their score intervals and all 21 pairwise intervals matched the supplied summary exactly. The percentile convention uses sorted indices 250 and 9750 of 10,000 draws; its small finite-grid convention difference from interpolated quantiles is immaterial here.

| Participant | Geometric client ms |
|---|---:|
| Mermaid Dart | 12.12023247 |
| Pele | 12.22214556 |
| Zombie Mermaid | 20.45869058 |
| Beautiful Mermaid | 20.63344664 |
| Agentic Mermaid | 30.35345541 |
| Mermaid | 53.08462242 |
| Mermaid Flutter | 87.11061289 |

The raw measurement has 9,100 unique row IDs and 9,100 unique participant/block/input/phase/rep cells, all positive-time successes: 5,460 measured plus 3,640 warmups. With every expected cell present, no failure substitution, trimming or observed post-timing input removal is apparent. Coverage-final raw status counts independently match the summary: contract successes are Mermaid 492, Agentic 320, Beautiful 218, Zombie 228, Dart 414, Flutter 414 and Pele 510 out of 548 each. These are mechanical contract counts, not 548-case semantic review results.

**Acceptance boundary:** retain the fixed-profile task description, pointwise uncertainty, close-pair ambiguity, distinct measurement/coverage commits and A/A warnings. The two implementation findings above are future failure-path hardening, not reasons to discard this all-success campaign. Stronger population, independence or winner claims would exceed the retained evidence.

## Guard resolution — commit 32f76392963eaf63c999bf82fe2f11085f132fce

Scoped follow-up: reviewed only the guard commit against `bd8e9b3`, including new `admission.mjs`, its two focused tests, runner integration, analyzer assertions and README changes. **Both latent findings above are resolved by inspection; no new blocking finding in this patch.** No tests, reducer, benchmarks or broad data audit were rerun for this follow-up.

`validateReview` runs before actor launch and requires matching identity/participants, candidate eligibility, a successful source-fact check and a 64-character lowercase hexadecimal pixel hash for every admitted input/participant. The helper is included in source sealing. Thus the existing conditional pixel comparison can no longer silently skip an absent expected hash in an admitted measurement. `requireWarmupSuccess` throws on every non-`ok` measured-run warmup before either restart or measurement; existing cleanup/failure handling closes the actor and records failure. This closes the shortened-warmup history path.

The reducer independently requires successful warmups, review identity/participant agreement and a complete eligible candidate review matrix. Its expected-cell set plus row-ID/cell uniqueness and cardinality assertions reject missing, duplicate and unexpected phase/block/input/rep cells. Every successful warmup or measured row must match the reviewed pixel hash; unsuccessful measured rows remain subject to the existing failure/exclusion policy. The focused test source covers missing pixel admission, failed source-fact admission, a noncandidate input, and timeout/error/stability/contract warmup failures.

The reported passing tests, byte-identical guarded-reducer summary and separate independent audit totals (110,342 checks, zero differences; 11,872 canonical PNG files and 2,311 PIL stream decodes) are supplied follow-up evidence, not checks repeated here. This patch adds prospective guards and retrospective validation; the measured producer remains `f2045b56b662231b9432937c8ed2201f0c5efb06`. The original inference and task-scope limits remain applicable.
