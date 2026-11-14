# Contributing

Report a problem or propose a change in
[GitHub issues](https://github.com/adewale/trident/issues). To add an
implementation, follow [Add an implementation](README.md#add-an-implementation).

## Working on the benchmarks

The collectors reuse existing readers, drivers and checks; most remaining work is
closing the assessment and adapter gaps the results report. Freeze versions once
per campaign, check a changed invocation on a few known cases, then run the
affected workload. When a project is blocked, record it and continue with the
others. Missing results stay explicit.

During development, run the affected tests. Full timing repeats belong after the
invocation works. A report needs the actual results and a readable table; extra
manifests, duplicate archives and publication checks are optional release work.

## Evidence

DaveBench keeps counts and times and discards rendered outputs. Drawing
Correctness retains compressed SVG and terminal outputs with source and ownership
bindings, so a changed observer can reassess them without invoking renderers.
Re-running frozen versions and pinned inputs reproduces the collection; retained
Drawing outputs also support assessment replay
([evidence rule](docs/benchmark-results-details.md#evidence-and-verification)).

## Dispute a result

If you maintain an implementation and think one of its rows is wrong, open a
[GitHub issue](https://github.com/adewale/trident/issues) that names:

- the project and the version shown in [RESULTS.md](RESULTS.md);
- the benchmark and output format (DaveBench SVG, PNG or terminal text; Drawing
  Correctness SVG or terminal text; Mermaid Fidelity);
- the case: a Drawing case id such as `drawing:…` or `regression:…`, a Fidelity
  test file and test name, or a DaveBench documentation file;
- what you observe when you run that case through your public interface, and
  what Trident recorded.

Trident's maintainer will re-check the case against the retained evidence: the
frozen version list, the pinned input and, for Drawing Correctness, the retained
output. If the observer, adapter, schema view or bridge is wrong, the fix goes in
Trident and the affected rows are reassessed or recollected under the same rule
for every project. If the recorded outcome stands, the issue gets the evidence
that supports it. Either way, the outcome is recorded in
[CHANGELOG.md](CHANGELOG.md).

You do not need the maintainer to check a Drawing verdict. The captured SVG and
terminal outputs are published, and anyone can replay the current observer on
them without running any renderer, following
[the retained Drawing capture instructions](results/release/README.md#retained-drawing-capture).
DaveBench keeps no outputs, so a DaveBench dispute is checked by rendering the
input again at the frozen version.

## Before a pull request

Run `bun commands.ts lint`, `bun commands.ts typecheck` and the tests you
affected. If you changed a result file, run `bun commands.ts results:snapshot` so
`RESULTS.md` and every generated number in the docs match it.
