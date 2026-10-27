# Mermaid derivatives league table

[All benchmark scorecards, including Davebench](SCORECARDS.md) · [Benchmark guides](../BENCHMARKS.md)

The [Beautiful/Zombie/Frankenmermaid additions](review-20261027/additions/README.md) use a separate matched host cohort with their own fresh controls.

For the current 25-family comparison, charts, exact PR snapshots and limitations, see the [2026-10-27 review snapshot](review-20261027/README.md). The tables below retain the earlier measurements without mixing protocols.

This historical snapshot predates the current 25-family mark and corrected label checks. Its original observations are retained; newer rows do not prove complete Event Modeling or ZenUML functionality. Re-run affected projects before making current coverage or performance claims.

Measured 2026-10-26 by [Trident](../README.md) against the pinned Mermaid 12.2.0 oracle, on the corpus frozen from Agentic Mermaid de612cc0, with the newer families' examples from Mermaid's mermaid@12.2.0 syntax docs. 

How to read it: one table per kind of output, because SVG, terminal and parser tools are different products. Tables group each output by public invocation surface and compatible protocol/runtime settings; costs and ranks never cross these boundaries. Rolling records are not paired same-session experiments. Rows within each group are ordered by correctness first: how many of the 23 scored families the tool supports, then the share of cases it passes in those families, then first-call fixed-core time. That time sums the first call of each of the six fixed-core inputs in its process (median over rounds), so it cannot be a cache hit; the repeated-source column repeats identical input, which a tool that caches results by source answers from its cache. Mermaid is the reference row: it defines valid input, so it is measured with the same checks but not ranked. An unsupported family is a coverage gap, never a failure. "Newer families" counts how many of Mermaid's 9 newest families the tool supports, with its pass rate in them; it never changes a rank or the other columns. See the [methodology](../METHODOLOGY.md).

## SVG

### Node API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | [obsidianmd/pele](https://github.com/obsidianmd/pele) | 1.9.0 | Node API | 23/23 | 94.2% (878/932) | 9/9, 96.6% | 21.69 ms | — | 1.90 ms | [record](records/obsidianmd-pele.json.gz) · [failures](failures/obsidianmd-pele.md) |
| 2 | [adewale/agentic-mermaid](https://github.com/adewale/agentic-mermaid) | 0.4.1 | Node API | 15/23 | 85.8% (628/732) | 0/9 | 699.78 ms | — | 546.69 ms | [record](records/adewale-agentic-mermaid.json.gz) · [failures](failures/adewale-agentic-mermaid.md) |
| 3 | [lukilabs/beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | 1.1.3 | Node API | 6/23 | 43.0% (243/565) | 0/9 | 175.02 ms | — | 75.85 ms | [record](records/lukilabs-beautiful-mermaid.json.gz) · [failures](failures/lukilabs-beautiful-mermaid.md) |

### browser API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|
| — | *[mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) (reference)* | 12.2.0 | browser API | 23/23 | 93.0% (867/932) | 9/9, 94.1% | 1313.20 ms | reference | 1163.10 ms | [record](records/mermaid-js-mermaid.json.gz) · [failures](failures/mermaid-js-mermaid.md) |
| 1 | [obsidianmd/pele](https://github.com/obsidianmd/pele) | 1.9.0 | browser API | 23/23 | 94.2% (878/932) | 9/9, 96.6% | 25.70 ms | 51× faster | 1.74 ms | [record](records/obsidianmd-pele.json.gz) · [failures](failures/obsidianmd-pele.md) |
| 2 | [adewale/agentic-mermaid](https://github.com/adewale/agentic-mermaid) | 0.4.1 | browser API | 15/23 | 85.8% (628/732) | 0/9 | 665.20 ms | 2.0× faster | 540.05 ms | [record](records/adewale-agentic-mermaid.json.gz) · [failures](failures/adewale-agentic-mermaid.md) |
| 3 | [lukilabs/beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | 1.1.3 | browser API | 6/23 | 43.0% (243/565) | 0/9 | 153.50 ms | 8.6× faster | 78.21 ms | [record](records/lukilabs-beautiful-mermaid.json.gz) · [failures](failures/lukilabs-beautiful-mermaid.md) |

## Terminal text

### Node API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | [adewale/agentic-mermaid](https://github.com/adewale/agentic-mermaid) | 0.4.1 | Node API | 15/23 | 77.9% (570/732) | 0/9 | 270.14 ms | — | 161.66 ms | [record](records/adewale-agentic-mermaid.json.gz) · [failures](failures/adewale-agentic-mermaid.md) |
| 2 | [lukilabs/beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) | 1.1.3 | Node API | 6/23 | 37.7% (213/565) | 0/9 | 107.54 ms | — | 88.32 ms | [record](records/lukilabs-beautiful-mermaid.json.gz) · [failures](failures/lukilabs-beautiful-mermaid.md) |

### CLI

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | [AlexanderGrooff/mermaid-ascii](https://github.com/AlexanderGrooff/mermaid-ascii) | 1.6.1 | CLI | 3/23 | 59.2% (234/395) | 0/9 | 94.04 ms | — | 94.36 ms | [record](records/alexandergrooff-mermaid-ascii.json.gz) · [failures](failures/alexandergrooff-mermaid-ascii.md) |

## PNG

### Node API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | [adewale/agentic-mermaid](https://github.com/adewale/agentic-mermaid) | 0.4.1 | Node API | 15/23 | 93.6% (685/732) | 0/9 | — | — | — | [record](records/adewale-agentic-mermaid.json.gz) · [failures](failures/adewale-agentic-mermaid.md) |

## Parser

### Node API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | [adewale/agentic-mermaid](https://github.com/adewale/agentic-mermaid) | 0.4.1 | Node API | 15/23 | 80.8% (616/762) | 0/9 | 19.62 ms | — | 2.80 ms | [record](records/adewale-agentic-mermaid.json.gz) · [failures](failures/adewale-agentic-mermaid.md) |

### Node parser API

| Rank | Tool | Version | Surface | Families supported | Pass rate in supported families | Newer families | First-call fixed core | vs Mermaid | Repeated-source fixed core | Record |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|
| — | *[mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) (reference)* | 12.2.0 | Node parser API | 23/23 | 99.1% (953/962) | 9/9, 100.0% | 563.66 ms | reference | 535.93 ms | [record](records/mermaid-js-mermaid.json.gz) · [failures](failures/mermaid-js-mermaid.md) |

## Families

Pass rate per family, for each tool's SVG and terminal surfaces. "—" means the tool does not support the family. These are the 23 scored families.

| Family | pele (Node API, SVG) | pele (browser API, SVG) | mermaid (browser API, SVG) | agentic-mermaid (browser API, SVG) | agentic-mermaid (Node API, SVG) | agentic-mermaid (Node API, Terminal text) | beautiful-mermaid (browser API, SVG) | beautiful-mermaid (Node API, SVG) | beautiful-mermaid (Node API, Terminal text) | mermaid-ascii (CLI, Terminal text) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| flowchart | 98.0% | 98.0% | 93.4% | 97.0% | 97.0% | 86.4% | 17.7% | 17.7% | 16.2% | 43.9% |
| sequence | 99.2% | 99.2% | 90.7% | 85.3% | 85.3% | 82.9% | 74.4% | 74.4% | 72.1% | 70.5% |
| state | 97.5% | 97.5% | 96.3% | 81.5% | 81.5% | 67.9% | 60.5% | 60.5% | 50.6% | — |
| class | 100.0% | 100.0% | 97.6% | 81.0% | 81.0% | 76.2% | 31.0% | 31.0% | 28.6% | — |
| er | 100.0% | 100.0% | 100.0% | 75.0% | 75.0% | 70.6% | 48.5% | 48.5% | 42.6% | 82.4% |
| timeline | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — |
| journey | 87.5% | 87.5% | 87.5% | 100.0% | 100.0% | 100.0% | — | — | — | — |
| architecture | 100.0% | 100.0% | 90.9% | 63.6% | 63.6% | 63.6% | — | — | — | — |
| xychart | 51.1% | 51.1% | 53.2% | 57.4% | 57.4% | 17.0% | 36.2% | 36.2% | 12.8% | — |
| pie | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | — | — | — | — |
| quadrant | 96.6% | 96.6% | 96.6% | 96.6% | 96.6% | 100.0% | — | — | — | — |
| gantt | 100.0% | 100.0% | 100.0% | 95.6% | 95.6% | 97.8% | — | — | — | — |
| mindmap | 50.0% | 50.0% | 50.0% | 83.3% | 83.3% | 83.3% | — | — | — | — |
| gitgraph | 100.0% | 100.0% | 100.0% | 14.3% | 14.3% | 0.0% | — | — | — | — |
| radar | 100.0% | 100.0% | 100.0% | 93.8% | 93.8% | 93.8% | — | — | — | — |
| sankey | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| c4 | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| packet | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| kanban | 72.3% | 72.3% | 95.7% | — | — | — | — | — | — | — |
| requirement | 92.9% | 92.9% | 92.9% | — | — | — | — | — | — | — |
| treemap | 87.2% | 87.2% | 94.9% | — | — | — | — | — | — | — |
| ishikawa | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| block | 100.0% | 100.0% | 94.3% | — | — | — | — | — | — | — |

### Newer families

Mermaid's 9 newest families, added from 11.12.3 to 12.0.0; all but eventmodeling still use a `-beta` keyword. They are reported here and never scored. Eventmodeling exposes no labels to the oracle, so its cases check output format only. ZenUML, an external plugin, is not covered.

| Family | pele (Node API, SVG) | pele (browser API, SVG) | mermaid (browser API, SVG) | agentic-mermaid (browser API, SVG) | agentic-mermaid (Node API, SVG) | agentic-mermaid (Node API, Terminal text) | beautiful-mermaid (browser API, SVG) | beautiful-mermaid (Node API, SVG) | beautiful-mermaid (Node API, Terminal text) | mermaid-ascii (CLI, Terminal text) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| venn | 87.5% | 87.5% | 100.0% | — | — | — | — | — | — | — |
| treeview | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| wardley | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| eventmodeling | 100.0% | 100.0% | 66.7% | — | — | — | — | — | — | — |
| cynefin | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| railroad | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| swimlane | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| agentflow | 100.0% | 100.0% | 100.0% | — | — | — | — | — | — | — |
| usecase | 87.5% | 87.5% | 87.5% | — | — | — | — | — | — | — |

## Reproduce a row

Every row is one project record. With the pinned Mermaid oracle installed (`node commands.ts mermaid:install`), this re-measures one project; unchanged projects are reused:

```sh
bun commands.ts community:update --projects OWNER/TOOL --profile full --rounds 5 --records RECORDS --out EVIDENCE
bun commands.ts results:publish --records RECORDS --out results
```

Each record (gzipped JSON) names its machine, runtimes, oracle pin, corpus commit and the tool version measured, and holds every observation.
