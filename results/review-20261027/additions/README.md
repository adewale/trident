# Beautiful, Zombie and Frankenmermaid additions

## Added projects: separate matched host cohort

Beautiful Mermaid, Zombie Mermaid and Frankenmermaid were measured here with fresh Mermaid 12.2.0 and Pele 1.9.0 controls. This is a **different machine cohort** from the [parent snapshot](../README.md). The older records, dates and ranks are preserved; do not pool absolute timings or ranks across the two cohorts. The complete declared corpus is unchanged: 1,081 feature inputs plus six fixed-core inputs, five rounds, 33 enrolled families with 25 in the current mark.

All five owning records were collected successfully and retain failures. The collection command returned exit 1 because of those measured failures, not an acquisition failure. Families admitted below describe the public SVG/label probes, not complete native models, topology, painted correspondence or perceptual fidelity. The accepted-input view excludes rejected and unlabeled inputs and still includes format/runtime failures.

| Addition | Actual version | SVG families admitted | Raw admission | Accepted-input format + labels |
|---|---|---:|---:|---:|
| Frankenmermaid | 0.4.0 | 25/25 | 837/945 (88.6%) | 807/915 (88.2%) |
| Zombie Mermaid | 5.10.2 | 9/25 | 485/610 (79.5%) | 481/592 (81.2%) |
| Beautiful Mermaid | 1.1.3 | 6/25 | 243/565 (43.0%) | 239/554 (43.1%) |

Frankenmermaid is the reviewed 0.4.0 checked-in JS/WASM distribution, not a build of current Rust source or the live website. Its expected WASM SHA-256 was verified during acquisition. Beautiful Mermaid and Zombie Mermaid were acquired from their actual npm packages and retain installed artifact identities.

The [run summary](run-summary.json) binds the exact record IDs, measurement dates, source revision, project versions, observations and checks. The audit verified one compatible browser comparison key for all five records, five rounds, 1,087 frozen input IDs, preserved raw statuses and all retained oracle caveats. Original full evidence remains in the local record store; the compressed records and complete failure summaries below are portable review evidence. Raw SVG/text outputs remain in the local owning evidence and are omitted from this compact Git snapshot; no raw observation or failure entry was removed.

Measured 2026-10-27 by [Trident](../../../README.md) against the pinned Mermaid 12.2.0 oracle, on the corpus frozen from Agentic Mermaid de612cc0, with the newer families' examples from Mermaid's mermaid@12.2.0 syntax docs. 

How to read it: one table per kind of output, because SVG, terminal and parser tools are different products. Tables group each output by public invocation surface and compatible protocol/runtime settings; costs and ranks never cross these boundaries. Rolling records are not paired same-session experiments. Rows within each group are ordered by correctness first: how many of the 25 currently scored families the tool supports, then the share of cases it passes in those families, then first-call fixed-core time. That time sums the first call of each of the six fixed-core inputs in its process (median over rounds), so it cannot be a cache hit; the repeated-source column repeats identical input, which a tool that caches results by source answers from its cache. Mermaid is the reference row: it defines valid input, so it is measured with the same checks but not ranked. An unsupported family is a coverage gap, never a failure. The legacy 23-family column preserves the original mark; the current mark also includes stable Event Modeling and required first-party ZenUML. "Newer families" counts how many of Mermaid's 8 newest families the tool supports, with its pass rate in them; it never changes a rank or the other columns. See the [methodology](../../../METHODOLOGY.md).

## SVG

### Node API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Legacy 23-family mark | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | [Dicklesworthstone/frankenmermaid](https://github.com/Dicklesworthstone/frankenmermaid) | 0.4.0 | Node API | 25/25 | 88.6% (837/945) | 8/8, 63.2% | 69.16 ms | — | 10.73 ms | 23/23, 88.4% (824/932) | [record](records/dicklesworthstone-frankenmermaid.json.gz) · [failures](failures/dicklesworthstone-frankenmermaid.md) |
| 2 | [obsidianmd/pele](https://github.com/obsidianmd/pele) | 1.9.0 | Node API | 24/25 | 96.0% (906/944) | 8/8, 99.1% | 62.00 ms | — | 7.60 ms | 23/23, 95.9% (894/932) | [record](records/obsidianmd-pele.json.gz) · [failures](failures/obsidianmd-pele.md) |
| 3 | [dfadler/zombie-mermaid](https://github.com/dfadler/zombie-mermaid) | 5.10.2 | Node API | 9/25 | 79.5% (485/610) | 0/8 | 517.72 ms | — | 202.49 ms | 9/23, 79.5% (485/610) | [record](records/dfadler-zombie-mermaid.json.gz) · [failures](failures/dfadler-zombie-mermaid.md) |
| 4 | [lukilabs/beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | 1.1.3 | Node API | 6/25 | 43.0% (243/565) | 0/8 | 584.11 ms | — | 256.56 ms | 6/23, 43.0% (243/565) | [record](records/lukilabs-beautiful-mermaid.json.gz) · [failures](failures/lukilabs-beautiful-mermaid.md) |

### browser API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Legacy 23-family mark | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| — | *[mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) (reference)* | 12.2.0 | browser API | 25/25 | 93.9% (887/945) | 8/8, 100.0% | 4734.00 ms | reference | 3942.60 ms | 23/23, 94.2% (878/932) | [record](records/mermaid-js-mermaid.json.gz) · [failures](failures/mermaid-js-mermaid.md) |
| 1 | [Dicklesworthstone/frankenmermaid](https://github.com/Dicklesworthstone/frankenmermaid) | 0.4.0 | browser API | 25/25 | 88.6% (837/945) | 8/8, 63.2% | 95.80 ms | 49× faster | 16.29 ms | 23/23, 88.4% (824/932) | [record](records/dicklesworthstone-frankenmermaid.json.gz) · [failures](failures/dicklesworthstone-frankenmermaid.md) |
| 2 | [obsidianmd/pele](https://github.com/obsidianmd/pele) | 1.9.0 | browser API | 24/25 | 96.0% (906/944) | 8/8, 99.1% | 107.60 ms | 44× faster | 13.57 ms | 23/23, 95.9% (894/932) | [record](records/obsidianmd-pele.json.gz) · [failures](failures/obsidianmd-pele.md) |
| 3 | [dfadler/zombie-mermaid](https://github.com/dfadler/zombie-mermaid) | 5.10.2 | browser API | 9/25 | 79.5% (485/610) | 0/8 | 451.60 ms | 10× faster | 213.70 ms | 9/23, 79.5% (485/610) | [record](records/dfadler-zombie-mermaid.json.gz) · [failures](failures/dfadler-zombie-mermaid.md) |
| 4 | [lukilabs/beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | 1.1.3 | browser API | 6/25 | 43.0% (243/565) | 0/8 | 548.60 ms | 8.6× faster | 275.50 ms | 6/23, 43.0% (243/565) | [record](records/lukilabs-beautiful-mermaid.json.gz) · [failures](failures/lukilabs-beautiful-mermaid.md) |

## Terminal text

### Node API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Legacy 23-family mark | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | [dfadler/zombie-mermaid](https://github.com/dfadler/zombie-mermaid) | 5.10.2 | Node API | 9/25 | 75.2% (459/610) | 0/8 | 73.49 ms | — | 26.01 ms | 9/23, 75.2% (459/610) | [record](records/dfadler-zombie-mermaid.json.gz) · [failures](failures/dfadler-zombie-mermaid.md) |
| 2 | [lukilabs/beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | 1.1.3 | Node API | 6/25 | 37.7% (213/565) | 0/8 | 307.48 ms | — | 214.88 ms | 6/23, 37.7% (213/565) | [record](records/lukilabs-beautiful-mermaid.json.gz) · [failures](failures/lukilabs-beautiful-mermaid.md) |

## Parser

### Node API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Legacy 23-family mark | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | [Dicklesworthstone/frankenmermaid](https://github.com/Dicklesworthstone/frankenmermaid) | 0.4.0 | Node API | 25/25 | 84.6% (825/975) | 8/8, 25.5% | 39.68 ms | — | 5.98 ms | 23/23, 84.8% (816/962) | [record](records/dicklesworthstone-frankenmermaid.json.gz) · [failures](failures/dicklesworthstone-frankenmermaid.md) |

### Node parser API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Legacy 23-family mark | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| — | *[mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) (reference)* | 12.2.0 | Node parser API | 24/25 | 99.1% (965/974) | 8/8, 100.0% | 1786.08 ms | reference | 1726.91 ms | 23/23, 99.1% (953/962) | [record](records/mermaid-js-mermaid.json.gz) · [failures](failures/mermaid-js-mermaid.md) |

## Input oracle caveats

Raw current and legacy marks and ranks above remain unchanged. They include retained legacy/parser fixtures and unlabeled format-only checks; their pass rates are not a complete Mermaid-fidelity score. Caveats come from each record’s frozen input context, never from a peer’s output. Counts below describe the input ledger, not executed cases; rejected and unlabeled sets may overlap.

| Tool | Retained oracle warnings | Pinned-rejected inputs | Inputs without authored labels |
|---|---:|---:|---:|
| Dicklesworthstone/frankenmermaid | 42 | 9 | 41 |
| dfadler/zombie-mermaid | 42 | 9 | 41 |
| lukilabs/beautiful-mermaid | 42 | 9 | 41 |
| obsidianmd/pele | 42 | 9 | 41 |
| mermaid-js/mermaid | 42 | 9 | 41 |

All input warnings are retained in each portable record’s `inputEvidence.gaps` and merged into its published `gaps`. SVG XML portability is distinct from browser drawing behavior: an unbound namespace prefix or HTML named entity can fail standalone XML admission even when an HTML page can display the drawing.

## Pinned-accepted format-and-label admission

Secondary SVG/terminal view for the 25 current families, restricted to cases with nonempty recorded labels and no pinned-oracle rejection. This does not replace the raw mark or affect ranks. This view still retains runtime and standalone-XML failures, even when a browser can display readable labels; it is format-and-label admission, not a count of label defects. It does not establish topology, multiplicity, painted visibility, native-model coverage or complete fidelity. Explicit authored labels remain checkable when a DB getter is unavailable; a no-op parser such as ZenUML’s does not prove syntax validation. Parser-only fixtures may still fail rendering, so this is not a ledger of independently certified complete diagrams.

| Tool | Surface | Output | Passed / checked | Blocked / unavailable | Excluded rejected / unlabeled | Unmapped inputs |
|---|---|---|---:|---:|---:|---:|
| Dicklesworthstone/frankenmermaid | Node API | SVG | 88.2% (807/915) | 0 / 0 | 9 / 21 | 0 |
| Dicklesworthstone/frankenmermaid | browser API | SVG | 88.2% (807/915) | 0 / 0 | 9 / 21 | 0 |
| dfadler/zombie-mermaid | Node API | SVG | 81.3% (481/592) | 0 / 323 | 9 / 21 | 0 |
| dfadler/zombie-mermaid | Node API | Terminal text | 77.2% (457/592) | 0 / 323 | 9 / 21 | 0 |
| dfadler/zombie-mermaid | browser API | SVG | 81.3% (481/592) | 0 / 323 | 9 / 21 | 0 |
| lukilabs/beautiful-mermaid | Node API | SVG | 43.1% (239/554) | 0 / 361 | 9 / 21 | 0 |
| lukilabs/beautiful-mermaid | Node API | Terminal text | 38.1% (211/554) | 0 / 361 | 9 / 21 | 0 |
| lukilabs/beautiful-mermaid | browser API | SVG | 43.1% (239/554) | 0 / 361 | 9 / 21 | 0 |
| obsidianmd/pele | Node API | SVG | 97.0% (887/914) | 0 / 1 | 9 / 21 | 0 |
| obsidianmd/pele | browser API | SVG | 97.0% (887/914) | 0 / 1 | 9 / 21 | 0 |
| mermaid-js/mermaid | browser API | SVG | 94.9% (868/915) | 0 / 0 | 9 / 21 | 0 |

## Families

Pass rate per family, for each tool's SVG and terminal surfaces. "—" means the tool does not support the family. These are the 25 scored families.

| Family | mermaid (browser API, SVG) | frankenmermaid (Node API, SVG) | frankenmermaid (browser API, SVG) | pele (Node API, SVG) | pele (browser API, SVG) | zombie-mermaid (browser API, SVG) | zombie-mermaid (Node API, SVG) | zombie-mermaid (Node API, Terminal text) | beautiful-mermaid (browser API, SVG) | beautiful-mermaid (Node API, SVG) | beautiful-mermaid (Node API, Terminal text) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| flowchart | 94.4% | 92.9% | 92.9% | 99.0% | 99.0% | 87.9% | 87.9% | 85.4% | 17.7% | 17.7% | 16.2% |
| sequence | 96.1% | 94.6% | 94.6% | 99.2% | 99.2% | 93.0% | 93.0% | 90.7% | 74.4% | 74.4% | 72.1% |
| state | 96.3% | 91.4% | 91.4% | 97.5% | 97.5% | 70.4% | 70.4% | 63.0% | 60.5% | 60.5% | 50.6% |
| class | 97.6% | 95.2% | 95.2% | 100.0% | 100.0% | 78.6% | 78.6% | 78.6% | 31.0% | 31.0% | 28.6% |
| er | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 76.5% | 76.5% | 76.5% | 48.5% | 48.5% | 42.6% |
| timeline | 100.0% | 68.8% | 68.8% | 100.0% | 100.0% | — | — | — | — | — | — |
| journey | 87.5% | 87.5% | 87.5% | 87.5% | 87.5% | — | — | — | — | — | — |
| architecture | 90.9% | 77.3% | 77.3% | 100.0% | 100.0% | 54.5% | 54.5% | 54.5% | — | — | — |
| xychart | 53.2% | 34.0% | 34.0% | 51.1% | 51.1% | 34.0% | 34.0% | 12.8% | 36.2% | 36.2% | 12.8% |
| pie | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 88.9% | 88.9% | 88.9% | — | — | — |
| quadrant | 96.6% | 93.1% | 93.1% | 96.6% | 96.6% | — | — | — | — | — | — |
| gantt | 100.0% | 97.8% | 97.8% | 100.0% | 100.0% | — | — | — | — | — | — |
| mindmap | 66.7% | 83.3% | 83.3% | 66.7% | 66.7% | — | — | — | — | — | — |
| gitgraph | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| radar | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| sankey | 100.0% | 84.6% | 84.6% | 100.0% | 100.0% | — | — | — | — | — | — |
| c4 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 60.0% | — | — | — |
| packet | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| kanban | 95.7% | 42.6% | 42.6% | 97.9% | 97.9% | — | — | — | — | — | — |
| requirement | 100.0% | 92.9% | 92.9% | 100.0% | 100.0% | — | — | — | — | — | — |
| treemap | 94.9% | 97.4% | 97.4% | 87.2% | 87.2% | — | — | — | — | — | — |
| ishikawa | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| block | 94.3% | 97.1% | 97.1% | 100.0% | 100.0% | — | — | — | — | — | — |
| eventmodeling | 66.7% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| zenuml | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — | — |

### Newer families

Mermaid's 8 newest families, added from 11.12.3 to 12.0.0; all use a `-beta` keyword. They are reported here and never scored. Event Modeling is scored above; its authored frame identities come from the independently pinned parser because its layout getter needs browser SVG measurements. Inline data and relationships remain unchecked. ZenUML is scored above using one explicitly labelled representative and the independently pinned first-party addon; its no-op parser supplies no syntax-validation or native-model proof.

| Family | mermaid (browser API, SVG) | frankenmermaid (Node API, SVG) | frankenmermaid (browser API, SVG) | pele (Node API, SVG) | pele (browser API, SVG) | zombie-mermaid (browser API, SVG) | zombie-mermaid (Node API, SVG) | zombie-mermaid (Node API, Terminal text) | beautiful-mermaid (browser API, SVG) | beautiful-mermaid (Node API, SVG) | beautiful-mermaid (Node API, Terminal text) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| venn | 100.0% | 100.0% | 100.0% | 87.5% | 87.5% | — | — | — | — | — | — |
| treeview | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| wardley | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| cynefin | 100.0% | 0.0% | 0.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| railroad | 100.0% | 50.0% | 50.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| swimlane | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — |
| agentflow | 100.0% | 16.7% | 16.7% | 100.0% | 100.0% | — | — | — | — | — | — |
| usecase | 100.0% | 20.8% | 20.8% | 100.0% | 100.0% | — | — | — | — | — | — |

## Reproduce a row

Every row is one project record. With the pinned Mermaid oracle installed (`node commands.ts mermaid:install`), this re-measures one project; unchanged projects are reused:

```sh
bun commands.ts community:update --projects OWNER/TOOL --profile full --rounds 5 --records RECORDS --out EVIDENCE
bun commands.ts results:publish --records RECORDS --out results
```

Each record (gzipped JSON) names its machine, runtimes, oracle pin, corpus commit and the tool version measured, and holds every observation.
