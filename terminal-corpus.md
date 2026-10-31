# Terminal project corpus

This is a representative **development-exposed** source corpus for terminal
renderer qualification. It replaces the four invented demonstration graphs as
the proposed real-input workload. Checker mutations remain separate tests.
It is a coverage sample of project documentation, regressions and new features;
it makes no claim about production traffic or feature frequency.

The [committed inventory](../corpus/terminal-project-examples.json) has **120 distinct
source byte strings** selected from **488 extracted candidates**. Exact-source
repetitions retain all their origins. All participating renderers receive the same
inventory; contributing a case supplies no project credit.

## Discovery and selection

Research covers the 18 catalog-selected projects advertising terminal output,
at each recorded catalog commit. `crafter-station/mermaid` is one contributor;
Mermaid.js supplies the independently pinned source-reference role, not terminal
output. Excluded descendants were not enrolled as additional benchmark projects.

Each repository received the same caps:

- Up to 13 files: canonical README, two named Unicode/CJK/width/multiline/escaping
  or invalid-input regression files, then family/path round-robin. Concrete `.mmd`
  inputs and input sections of golden `.txt` files precede static test literals
  and other documentation. Files larger than 128 KiB remain explicit gaps.
- Latest 30 open and 30 closed issue/PR entries; retain up to five issues and five
  PRs per state. A uniform `mermaid in:title,body` search separately retains up to
  five issue and five PR hits per repository to reach renderer work in monorepos.
- For at most two retained PRs per repository, retain up to six changed-file
  patches, each at most 64 KiB. Full diff/source identities remain in the snapshots.

The corpus records repository commits, file/blob hashes, issue/PR URLs, author,
state, timestamps, body/patch hashes, selection caps and discovery gaps. Full
research bodies are retained as content-addressed gzip snapshots in
[terminal-research](../corpus/terminal-research). Issue/PR URLs are mutable;
the stored body hashes and snapshot bytes identify what was actually read.
A cap that finds no example is not evidence that a project has no examples.

Static extraction preserves literal Mermaid bytes. It does not execute target
code or interpolate dynamic templates. String decoding and selecting the input
portion before a golden-output separator are labelled extraction steps. One real
Termaid issue constructs a source with literal concatenation and `chr(27)`; its
exact materialization is separately labelled as a minimal adaptation. Documentation
syntax schemas containing placeholder fields are excluded with their origins,
not treated as concrete renderer failures. Malformed concrete examples remain.

Selection first covers each observed family and static feature, then performs
at most eight contributor rounds up to 120 sources, allowing at most three sources
per family/feature/line-count stratum. It never selects on renderer success.
Source-derived feature tags support selection only; they are not drawing oracles.

## What is covered

| Family/input stratum | Sources |
|---|---:|
| flowchart | 64 |
| er | 10 |
| state | 8 |
| pie | 5 |
| class | 4 |
| sequence | 4 |
| block | 3 |
| c4 | 3 |
| gitgraph | 3 |
| architecture | 2 |
| gantt | 2 |
| invalid | 2 |
| xychart | 2 |
| journey | 1 |
| kanban | 1 |
| mindmap | 1 |
| packet | 1 |
| quadrant | 1 |
| timeline | 1 |
| treemap | 1 |
| zenuml | 1 |

The source set covers all five flowchart directions, branching, merging, cycles,
self-edges, labels and edge styles, groups, multiline labels, Unicode/CJK and
combining characters, escaping, terminal controls, width pressure and large
inputs. Real negative/dialect inputs are retained; source-reference rejection
will be reported separately from an independently reviewed invalid-input intent.

| Origin channel | Retained origin occurrences |
|---|---:|
| project-regression-fixture | 64 |
| project-docs-example | 34 |
| issue-reproducer | 16 |
| pull-added-source | 11 |
| pull-request-body | 2 |

Counts are provenance occurrences, not project scores or usage frequencies.
A single source may have multiple origins. Documentation examples, issue
reproducers and PR-added features provide different kinds of coverage.

## Project discovery receipt

| Repository | Frozen commit | Files | Extracted occurrences | Selected distinct inputs with this origin |
|---|---|---:|---:|---:|
| AlexanderGrooff/mermaid-ascii | `5f00e3d9ac9f` | 13 | 33 | 8 |
| Dicklesworthstone/frankenmermaid | `29536a1308ac` | 13 | 16 | 10 |
| Latias94/merman | `252752f7029b` | 13 | 16 | 10 |
| Mootikins/figurehead-rs | `ba20125c6dde` | 13 | 17 | 7 |
| Yassimba/loom | `32c82fb90478` | 13 | 4 | 4 |
| adewale/agentic-mermaid | `d18c718d0253` | 13 | 21 | 8 |
| anomalyco/opencode | `4617210822bd` | 13 | 2 | 2 |
| crafter-station/mermaid | `1bac24116826` | 13 | 98 | 11 |
| dfadler/zombie-mermaid | `8cc982128bed` | 13 | 83 | 9 |
| emtyty/merslim | `746ddb4e71d7` | 9 | 5 | 4 |
| fasouto/termaid | `a10dfd506ec6` | 13 | 40 | 11 |
| kais-radwan/ascii-mermaid | `a91a0c7baec6` | 13 | 20 | 6 |
| kitlangton/merman | `0158eeac3542` | 3 | 12 | 5 |
| lukilabs/beautiful-mermaid | `2ac8bbbb060c` | 13 | 158 | 11 |
| spacedock-dev/mermaidtext | `a6b0c7657b94` | 13 | 12 | 7 |
| tariqshams/mermaidtui | `ca59dd9115c2` | 4 | 8 | 5 |
| wevm/ondine | `439fc64aefdb` | 12 | 6 | 4 |
| xai-org/grok-build | `2bdd1d6a6369` | 13 | 0 | 0 |

## Correctness is a separate review

The initial freeze deliberately marks drawing expectations **unreviewed**.
Neither labels, source tags, a research origin nor Mermaid reference agreement
can supply a drawing pass. Independently reviewed facts must bind the exact
source hash, identify observer gaps and distinguish valid, invalid and dialect
inputs. Unsupported families/layouts remain unknown against the full planned
inventory. An unknown is a Trident measurement gap, not proof of a renderer defect.

The small Mermaid ASCII/Termaid cohort remains sufficient to improve observers.
Mermaid is mandatory for source validation and has no terminal renderer score.
A broad all-project rerun is unnecessary while expected facts and observers are
incomplete. There is no comprehensive correctness league table from this freeze.

To reproduce source extraction without network or renderer invocations, expand
the project snapshots into `RESEARCH/projects/OWNER--REPO/receipt.json`, write
`policy.json` from the inventory's `policy` member, and copy the retained
`terminal-research/adaptations.json` alongside it. Then run:

```sh
bun scripts/freeze-terminal-corpus.ts RESEARCH FRESH_CORPUS_DIRECTORY
bun test tests/terminal-corpus.test.ts
```

The snapshots make this an auditable dated corpus rather than a request to
rediscover examples before every benchmark run.
