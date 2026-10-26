# Methodology

Trident compares Mermaid renderers, terminal renderers and parsers: tools that read
Mermaid's diagram language. It is for two audiences: maintainers of those tools, who
need failures they can act on, and people choosing one, who need to know what each
tool draws correctly and how fast. The [league table](results/README.md) is built
from the records described here.

## Disclosure

Trident was extracted from [Agentic Mermaid](https://github.com/adewale/agentic-mermaid)'s
benchmark harness, and its author maintains Agentic Mermaid. To keep that from
shaping the results:

- Agentic Mermaid is an ordinary row. It is measured from its published npm package,
  through the same lanes, checks and corpus as every other tool.
- Mermaid, not Agentic Mermaid, is the reference: it defines valid input.
- Every record is published with its inputs, checks, versions and machine, and every
  row can be reproduced with one command (below).
- The workload corpus was written for Agentic Mermaid's own testing. It is frozen in
  [`corpus/community-corpus.json`](corpus/community-corpus.json) with its source
  commit, and it mostly consists of Mermaid's own documentation and test inputs.

## The pinned Mermaid oracle

One installed Mermaid release is the oracle for everything: `mermaid` 12.2.0 with
`@mermaid-js/parser` 2.0.1 and `jsdom` 26.1.0, pinned in
[`tool-versions.json`](tool-versions.json). Every benchmark run and test run refuses
to start without exactly that install (`node commands.ts mermaid:install`). The oracle:

- confirms that every authored source and family probe has the accept/reject outcome
  its case claims, before any clock starts; a disagreement stops the run;
- supplies each case's expected labels, read from its own diagram databases;
- is Mermaid's row in the comparison, and Dave's Mermaid comparator.

Benchmarking another project uses the oracle without benchmarking Mermaid.

## Inputs and checks

The corpus has 968 workloads: 6 fixed-core inputs used for speed, and 962 feature
inputs drawn from Mermaid's documentation, Mermaid's own test suites, the Agentic
family registry and generated scaling cases. A case passes when the tool returns
output in the requested format that contains the case's authored labels as visible
text, on a positive canvas, and is not an echo of the source. Label presence is
existence evidence, not a full visual or semantic fidelity check.

Two rules read a label the way a renderer draws it. Both apply to every tool:

- Markdown markers are optional. A markdown string such as ``"`The **cat** in the hat`"``
  is drawn with bold or italic text, not asterisks, so `The cat in the hat` satisfies the
  label, as does the literal `The cat in **the** hat`. Only the strong and emphasis
  delimiters Mermaid renders (`**`, `__`, `*`, `_`, in pairs around non-space text, with
  underscores never inside a word) are dropped; every word, and any other character such
  as a code-span backtick, is still required. This applies to SVG and terminal output.
- A wrapped label is read across its lines. Inside one `<text>`, line-positioned
  `<tspan>`s are joined with a space, and inside one `foreignObject` a `<br>` is a space.
  Mermaid also draws a wrapped sequence message or actor as separate `<text>` rows, so
  adjacent sibling `<text>` elements are joined in document order when they have the
  same x, class, style, anchor and font attributes, each row is below the previous one,
  and, where a font size is declared, no more than two font sizes below it. Anything
  between two rows (another element, or text) ends the label. Terminal output is not
  joined across lines.

The whole label must still appear in one place: matching is by whole tokens, never a
partial label, and the source-echo check reads each text element on its own.

SVG output must be well-formed XML in the SVG namespace, with one exception: HTML's
void elements written unclosed (Mermaid serializes its `foreignObject` labels as HTML,
so a line break is `<br>`). Those are closed before parsing, and the observation records
that the output was not well-formed XML, which matters if you save it as a standalone
`.svg` file. Nothing else is relaxed.

## Family support

Before a tool's corpus runs, each family is probed once, untimed, with one canonical
source from the portable family cohort. If the tool rejects that source (an error, a
nonzero exit or no output), the family is unsupported: its cases are recorded as
unsupported, naming the probe, and are not run. If the tool returns output, the family
counts as supported, and every later failure in it is a failure, even when the probe's
own output fails a check. A case's error message never makes it unsupported.

Trident probes 23 families. Mermaid 12.2.0 also documents venn, wardley, cynefin,
treeview, railroad, agentflow, usecase, eventmodeling, swimlane and zenuml, which have
no Trident cases yet, so no tool is scored on them.

## Statuses

| Status | Meaning |
|---|---|
| passed | The tool's output met every declared check. |
| failed | The tool supports the family but rejected the input or its output failed a check. |
| unsupported | The tool rejected the family's canonical source, so the case was not run. A coverage gap, not a failure. |
| blocked | Trident could not measure: a prerequisite was missing or a worker crashed. Never a pass. |
| not-applicable | The case or output does not apply to this tool or surface. |

## The league table

There is one table per kind of output (SVG, terminal text, PNG, parser), because those
are different products, and one row per tool and public surface. Rows are ordered by
correctness first, lexicographically, with no weighted score:

1. families supported, out of the 23 probed;
2. pass rate on cases in those families;
3. first-call fixed-core time, only when calibrated.

Mermaid's row is the reference: it is measured with the same checks, shown first and
not ranked. Speed ratios are against Mermaid on the same surface and output, where
Mermaid has one.

## Speed and calibration

Speed comes only from the six fixed-core inputs, and only when every required core
case passes in every round. The ranked time is the **first-call fixed core**: for each
input, its first call in its process, median over the rounds, summed over the inputs.
A first call cannot be answered from a result cache. The table also shows the
**repeated-source** time, the median of repeated calls on identical input: a tool that
caches results by source answers those from its cache (Pele's repeats are about 12×
faster than its first calls, Mermaid's are not), so that column is not a fair
comparison on its own. CLI samples are fresh processes, so they are first calls.

Records with fewer than five rounds show no speed at all; the timings exist in the
record, but they are not calibrated. Feature cases are qualified once, in round one,
and never contribute speed.

## Reference machine

Published numbers come from one machine, recorded in every record: an Apple M2 Ultra
(24 cores), macOS 27.0.1 (Darwin 27.0.0), Node 26.12.1, Bun 1.4.4, Playwright's
Chromium and GNU time 1.10. Numbers from other machines are valid records, but are
not comparable with these. Measurements never run in CI, where shared runners make
timings unreliable.

## Reproduce a row

```sh
node commands.ts mermaid:install
bun commands.ts community:update --projects OWNER/TOOL --profile full --rounds 5 \
  --records RECORDS --out EVIDENCE
bun commands.ts results:publish --records RECORDS --out results
```

An unchanged project, input and protocol reuses its record; `--force` re-measures it.

## Adding a tool

A tool is one entry in [`catalog/mermaid-community.json`](catalog/mermaid-community.json).
An npm package whose public API renders a Mermaid source string can be declared without
any code; see [Adding a tool](README.md#adding-a-tool).

## Candidates

A record of an unreleased build is never a league row: the table shows published
releases only. Today, only Agentic Mermaid's lanes accept an unreleased candidate
(a checkout with `--package-root`, or a packed tarball with its SHA-256). For every
other tool, the catalog's version pin refuses an artifact that differs from the pinned
release, so a maintainer cannot yet benchmark a branch through Trident.

## What is not measured

Layout quality, visual fidelity beyond label presence, interactivity, accessibility
output, theming and memory beyond the recorded scopes. The detailed rules for each lane
are in [MEASUREMENT.md](MEASUREMENT.md) and [OVERVIEW.md](OVERVIEW.md).
