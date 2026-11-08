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

## Before a pull request

Run `bun commands.ts lint`, `bun commands.ts typecheck` and the tests you
affected. If you changed a result file, run `bun commands.ts results:snapshot` so
`RESULTS.md` and every generated number in the docs match it.
