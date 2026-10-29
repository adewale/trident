# Agentic Mermaid versus Zombie Mermaid, 29 October 2026

The five [source-candidate tables](../RESULTS.md#source-candidate-comparisons)
compare builds from Agentic Mermaid main at
`c4a8eeb8a3c472fd73e6654c0efa151b8f19a7f5` (package version 0.5.1) and Zombie
Mermaid main at `51ed1cdf4ee47351090adfa00bdee2baff2c52ee` (5.11.3).
They are source candidates, so the release overview keeps its existing evidence.

[Raw evidence and methods](https://github.com/adewale/trident/blob/824cea4b29c3bfd0e31e1d824314bc5fc26e7159/README.md)
include both documentation blocks, fidelity outputs, corrected compatibility
runs and the original setup failures. The [receipt](evidence/am-zm-2026-10-29/receipt.json)
binds the archive, raw input hashes and canonical table values. No new
measurement was made to publish these tables.

AM covers more of the documentation and compatibility inputs and passes more
planned meaning criteria. ZM's observed public SVG call costs are lower on the
shared successful documentation inputs. The common-success subset leaves out
inputs either renderer could not handle, and returning SVG does not establish
equivalent painted output. Neither result supplies an overall winner.

## What AM's two named failures mean

The Gantt example at pinned Mermaid `gantt.md:519` sets raw `config.themeCSS`,
including selectors that alter marker geometry. AM rejects it under default
security with `RenderConfigError`: selectors can escape an SVG embedded in a
host page, so it requires a declarative `StyleSpec`. This is an intentional
security-policy restriction under the tested public API. It contributes a
no-SVG result; it does not demonstrate a broken Gantt layout. Trident passes the
original example unchanged rather than weakening security for one project.

The controlled-image case contains an inline opaque-red PNG and asks for an
image node linked to a labelled target. AM returns a diagram and retains the
labels, but its SVG contains no `image` element. AM's
[unsupported-syntax diagnostic](https://github.com/adewale/agentic-mermaid/blob/c4a8eeb8a3c472fd73e6654c0efa151b8f19a7f5/src/agent/flowchart-unsupported.ts#L52)
explains that it preserves image metadata and renders a deterministic placeholder
instead of fetching the authored URL. The observer requires the authored image
to be emitted, decoded and visible, so the image criterion fails. It is a
fidelity limit of this policy, rather than evidence of a network request failing.
ZM's retained SVG also omits the image; its cause was not established here.

## What the call-cost result measures

Each shared documentation input contributes the median of ten public calls,
then the table reports the median, p95 and sum across those input medians.
The clock stops when the awaited SVG call returns. Initialization, transport,
post-call checks, cleanup and browser paint are outside that clock.

The project order was reversed for a second five-round block because Trident's
original rotation-plus-reversal policy kept the same project first with two
projects. Both original blocks are retained. The PR fixes future scheduling;
it does not relabel these observations as measurements of the fixed producer.

The ordering is consistent in both blocks, but there was no independent A/A
qualification. The run does not identify which AM stages account for the cost.
Profiling parse, layout, text measurement and SVG generation would be a separate
investigation, followed by a matched rerun if a performance claim is needed.

## Recheck the published tables

Download `campaign.tar.gz` from the immutable evidence commit linked in the
receipt, verify its SHA-256 and extract it into a fresh directory. Then run:

```sh
python3 docs/evidence/am-zm-2026-10-29/reduce.py EXTRACTED_EVIDENCE \
  --check results/latest.json
bun commands.ts results:snapshot --check
```

The reducer checks full case populations, repeated-call counts, common-success
selection, Node/browser SVG outcome agreement and criterion identities. It
rejects setup failures as coverage and recomputes all five table rows from raw
observations. Source archives and installed dependencies are identified in the
owning evidence; they are not bundled into this small results snapshot.
