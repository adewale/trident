# Checking Trident

[Benchmark results](../docs/qualification-results-2026-10-31.md) state the corpus,
project versions, verified outcomes and remaining gaps. [Benchmark definitions](../BENCHMARKS.md)
explain what each score measures. The initial accuracy baseline and 0.1 release
remain unfinished.

Use the [six-project harness profile](harness-profile.json) when changing how
Trident invokes a renderer. It covers 16 public execution paths with 56 output
calls and two separate model workflows. Collection is capped at five minutes
after preparation. Invocation checks do not establish drawing correctness.

When changing a correctness check, use retained output first. Check independently
specified correct and deliberately broken drawings, then regrade affected outputs.
Retain the literal source, expected facts, actual output and checker identity.
Missing evidence earns no pass. Collect a new output only when its source,
artifact, required resource or original witness makes that necessary.

Measure speed only for equivalent public calls with checked outputs and passing
control runs. State the workload, boundary and uncertainty alongside the numbers.
A one-source timing check verifies machinery; it cannot establish general speed.

[Release instructions](../RELEASE.md) contain the actual commands and packaging
checks. [Source provenance](source-audits/) and the
[published evidence](https://github.com/adewale/trident/blob/586bc66045cf4f1400b2d2d4aef40b525387b27f/qualification-evidence/completion-2026-10-31/README.md)
retain the original inputs, outputs and earlier verification. Ordinary commands
need no Codex or model API.
