# Reading Trident results

Start with the question: compatibility, painted meaning, model behavior or cost.
Use one scorecard per project, artifact version and public interface. Its heading
should name the suite, protocol, measured date, input inventory and sampling
profile. The owning receipt identifies actual bytes, runtime and invocation.
Catalog declarations describe planned coverage; they never supply measured passes.

Read each card in this order:

1. **Coverage:** show lineage/branding selection exclusions, planned cases or criteria, attempted work, unsupported
   families and missing adapters. Keep repeated docs occurrences separate from
   distinct sources and callback declarations separate from assertions.
2. **Outcome:** show passed, failed, blocked and unavailable counts using that
   same denominator. Link failures to their input and SVG/PNG or diagnostic
   witness. Process completion does not mean qualification passed.
3. **Cost:** show first result, repeated calls and resources only for their named
   interface. Compare time on the common successful inputs, alongside each
   project's full coverage. Retain A/A controls, sample counts and uncertainty.
4. **Evidence:** link the input inventory, artifact receipt, raw samples and
   observer results. Print limitations next to the claim they restrict.

The suites use different units. A docs SVG-return pass is weaker than a painted
criterion pass. A parser callback is not a rendered diagram. Format/text
admission, native model facts and painted meaning have separate columns; an
unavailable model observer does not erase valid SVG admission. A failed model
check remains visible even when output-only timing is calibrated.

Compare projects within the same runtime, surface, mode and protocol. Tables
are alphabetical inside those groups. There is no combined league score that
adds coverage, correctness and speed. The [support ranking](SUPPORT-QUALITY.md)
measures integration depth and evidence; it does not rank renderer performance.

The `results:campaign` index preserves measurement dates and links each suite to
its owning evidence. Its observation tables retain project, version/artifact
role, surface/runtime, mode/round and dispositions. Those counts are recorded
observations, not reconstructed acceptance rates. Complete denominators live in
the owning inventories. Suite selections used to publish corrected attempts are
printed; the copied original reports remain unchanged.

For a portable local bundle:

```sh
bun commands.ts results:campaign --campaign /evidence/campaign \
  --out /evidence/publication --copy-evidence
```

Community scorecards also show their narrow legacy-core diagnostics. Their six
inputs cannot support an overall speed claim. For portable timing, a p95 of
batch means is not a single-call tail; RSS, JS heap and browser document heap
are different measurements. Missing counters read unavailable, never zero.
Older protocols retain their original fields and qualification: publishing them
again does not create a current-protocol run.

A useful reading order is the dated index, the applicable suite's scorecards,
then the failed cases and raw evidence. [BENCHMARKS.md](BENCHMARKS.md) explains
what each suite can establish; [FAIRNESS.md](FAIRNESS.md) describes admission and
comparison rules. Public docs and repository examples are development-exposed;
no validated production holdout or overall winner is claimed.
