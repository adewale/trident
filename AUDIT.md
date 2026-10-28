# Adversarial audit of the standard run

Two independent agents reviewed the result reduction and native transport. Their
first pass used the completed exploratory collection. The publisher retained
that attempt and corrected the following issues before the replacement run.

1. **Executable/bundle binding (P1):** the original driver hashed one bundle while
   the launcher could independently select another. The recorded invocation
   selected the intended binary, but the source did not enforce that relationship.
   The final driver rejects a mismatched executable and every native launch
   records executable and libapp.so hashes. Final receipts were reconciled with
   the preparation manifest before publication.
2. **Qualification strength (P1 reporting constraint):** PNG content checks do
   not establish labels or semantics. SVG admission/labels and painted criteria
   have separate tables. Native pass counts receive no semantic credit.
3. **Timing description (P2):** native follows the existing external job's five
   batch means, 10 ms minimum/256-call cap. Browser has three batch means after
   20 ms calibration. The worker now records actual native call counts and a
   named timing protocol. The report does not compare these unlike clocks.
4. **First-output validation (P2):** the exploratory worker retained only its
   final repeated PNG while recording a first-result time. The final worker
   preserves and qualifies both first and final PNGs outside the clocks.
   Intermediate repeat returns are consumed but are not independently qualified.

The second agent independently confirmed the 1,087-input denominator, 724 eligible
render inputs, and the 363 scope exclusions per project. It confirmed the docs
548-occurrence/546-distinct-source denominator, stable ZenUML failures, and that
all Meaning criterion observations belong to Pele. It identified two important
interpretations: SVG label culling and quote policy can produce compatibility
findings; architecture output retains edge groups even though the paint observer
binds only one geometrically. These limits are printed with the corresponding
results rather than described as confirmed renderer defects.

The final report retains unsupported family skips, native API errors, blank
outputs, observer-budget blocks and unavailable model mappings. Neither the audit
nor the image inspection is a complete semantic equivalence proof or an A/A
performance calibration.

The final transport review also found parent PNG qualification could contend with
the next native timed case. Source 2a3d439ecafdaab20bd7fd1d71abe35e4a7bb6ce adds a
sequence-numbered acknowledgement barrier: Dart waits after committing each row;
the parent qualifies both outputs, commits the classified row, then acknowledges
it. The Mermaid Compatibility suite was rerun in `community-run/`. Docs and Meaning
are unaffected and retain their earlier `measured-run/` dates and producer. The
normal publisher explicitly selects community from the corrected campaign and
docs/fidelity from the earlier one; no superseded compatibility timing is used.

Two further fixes prioritize a definite first/final qualification failure over the
other image's unavailable observer (no original row showed this combination), and
distinguish one-call feature coverage metadata from repeated-core sampling. The
report also corrects the raster qualification wording: inputs without declared
labels can pass successful decoding without the nonuniform-content requirement.
Other unexecuted suites are described as unexecuted, rather than fabricated suite
records. These findings narrow the claims without deleting any prior output.

A final failure-path fix in the PR conservatively marks an unreported JSONL case
blocked after an unexpected transport exit, rather than assigning a renderer
failure without case-start proof. Completed API-error rows remain failures. A
real child regression emits a success, an explicit API rejection, then exits 7
before its third case; the third case must remain blocked. Reverting this guard
fails that regression. All seven measured native attempts exited zero without
timeout, so this later failure-path change does not require remeasurement. The
measurement producer remains 2a3d; its exact source is archived separately.
Final relevant validation: 23 tests pass, TypeScript checking passes, native release
compilation and Dart analysis pass. The full-suite limitation remains explicit.
