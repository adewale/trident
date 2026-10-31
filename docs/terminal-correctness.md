# Terminal Flowcharts: correctness prototype

Terminal correctness can be tested on the drawing's cell grid. Finding the source
labels is insufficient: the old admission check accepts the retained chain after
its arrow is reversed, its stem is broken, or its node labels exchange positions.
The [prototype observer](../fidelity/terminal.ts) rejects all three mutations.

The minimum terminal participant is **Mermaid ASCII**. Mermaid is also present as
a source-reference participant: its public parser must agree with the independently
authored graph. It receives no terminal score. Termaid supplies a second rendering
implementation with different routing and label placement.

## Task and current evidence

Draw four independently declared rectangular flowcharts: a chain, a branch, a
labelled edge and a vertical edge. Each renderer runs once per case. The pinned
artifacts are Mermaid ASCII 1.6.1, Termaid 0.10.0 and Mermaid 12.2.0. No packages
were acquired and no performance samples were collected.

| Rank within this profile | Project | Correct | Incorrect | Unknown | Planned |
|---:|---|---:|---:|---:|---:|
| 1 | Mermaid ASCII 1.6.1 | 4 | 0 | 0 | 4 |
| — | Termaid 0.10.0 | 3 | 0 | 1 | 4 |

Termaid's rounded, shared-stem branch is unknown to this observer. Its labelled
edge is correct: the caption sits above the route. An initial observer incorrectly
required an inline caption; that assumption was fixed and the identical saved
output rechecked. No renderer was invoked again for that correction.
Mermaid accepted all four sources and matched the declared graphs. It has no
terminal result or inherited renderer score.

| Perturbation of actual Mermaid ASCII output | Existing label admission | New topology observer |
|---|---|---|
| Reverse an arrow | Pass | Incorrect |
| Break its connecting stem | Pass | Incorrect |
| Exchange node labels, changing topology | Pass | Incorrect |
| Remove a node label | Fail | Incorrect |

The [retained fixtures and tests](../tests/terminal-meaning.test.ts) reproduce these
checks without installing either renderer. Run `bun test tests/terminal-meaning.test.ts`.

## What the observer establishes

It finds node boxes, binds their visible text to the declared identities, locates
arrowheads and traces connected orthogonal routes back to source nodes. It checks
the exact directed-edge multiset and binds inline or uniquely adjacent horizontal
captions to their actual routes. Extra unassigned ink, ambiguous ownership and
unsupported layouts cannot earn a pass. Indentation and ASCII versus Unicode
box-drawing characters do not change the declared graph.

The current profile is deliberately bounded: up to 32 nodes, 512 columns and 256
rows, with single-cell ASCII labels. ANSI controls, cursor movement, wide or
combining text, groups, round corners and ambiguous junctions remain unknown.
The observer does not strip concealment escapes and guess that hidden text was
visible. A general profile will need real terminal-state and display-width handling.

## Whether to add a benchmark

Add a small **Terminal Flowcharts** output profile to Mermaid Feature Cases once
shared-stem ownership has positive and negative controls. Keep Mermaid ASCII
mandatory and Mermaid's reference role explicit. Extend the input set only for
named features, including reciprocal edges, crossings, wrapping and Unicode cells.

Report correct, incorrect, unsupported and unknown cases against the same planned
inventory. Unknown observations withhold a correctness rank. Measure speed only
on matched, verified output through equivalent API/CLI boundaries, with process
startup identified. Four passing cases establish this prototype's scope, not broad
language support, aesthetic quality or general rendering speed.

This adds an output observer and a small workload to existing machinery. It needs
no terminal application host, editor integration, separate league framework or
new recurring all-project campaign. The [repair receipt](evidence/benchmark-repair-2026-10-30/receipt.json)
links raw outputs, exact source facts, artifact seals and the observer-only recheck.
