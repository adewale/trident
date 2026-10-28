# Benchmarks: questions, results and value

Trident compares public artifacts. No project source tree, editor or release
policy is treated as the harness. There is no overall winner or validated holdout.
The old published snapshots have been removed; new evidence is generated outside
tracked source files.

```sh
bun commands.ts bench --projects OWNER/TOOL,... --profile full --rounds 5 --out /evidence/full
bun commands.ts bench --list
bun commands.ts support
bun commands.ts bench --projects OWNER/TOOL,... --profile full --plan
```

The campaign runs the following suites serially and records unsupported adapters,
blocked setup and observed failures. Full means all applicable suites and their
full sampling protocols; it does not mean every project has every capability.
`community:update` runs only the community/CLI portion. `run` executes the portable
Node kit independently. See [setup](README.md).

| Benchmark / command ID | What it tests | Results table | Value |
|---|---|---|---|
| Mermaid Compatibility (`community`) | Shared Mermaid inputs through public output interfaces. | Passed, failed, unsupported, blocked and missing inputs, grouped by format/runtime. | High for finding syntax, interface and output failures; narrow for speed. |
| DaveBench: Documentation Examples (`docs`) | SVG generation for every documentation occurrence at the pinned source commit. | Full-inventory return counts/rate; render time on matched inputs, with sampling and qualification. | High as a broad docs workload; returned SVG alone is weak fidelity evidence. |
| Diagram Meaning (`fidelity`) | Expected labels, relationships, values, visibility and geometry in actual SVG. | Outcomes for the same planned criteria, with failed-input/output links. | High for diagnosing missing or incorrect drawn meaning; not an aesthetic score. |
| Model and Editing Contracts (`native-fidelity`) | Public diagram models and edit/configuration behavior. | Shared criterion outcomes; additional API contracts separately. | High within a reviewed projection's scope; a missing Trident binding is not a missing project capability. |
| Mermaid Assertion Replay (`upstream-fidelity`) | Original Mermaid tests through public parser/model projections. | Declaration dispositions and expanded callbacks, with unavailable/excluded work visible. | Useful for compatibility; private-API and diagnostic differences need interpretation. |
| Mermaid Reference Tests (`upstream-original`) | The pinned Mermaid source running its own original core tests. | Original files and callbacks: passed, failed, pending and todo. | High for checking the reference environment; not a peer-project score. |
| Render Cost and Scaling (`portable`) | Public Node SVG calls across families, sizes, edits and cache states. | Latency, CPU and memory by case/mode; output and calibration status. | High for controlled regressions; not a production forecast. |

See the [worked comparison tables](docs/benchmark-examples.md) for recorded examples
and [table conventions](REPORTING.md) for units, populations and missing values.

## Methods behind the tables

Compatibility checks include namespace/XML, canvas and authored-text admission
for SVG, source-echo/text checks for terminal output, and bounded pixel decoding
for PNG. PNG content is not OCR or diagram-meaning evidence. Public parser results
have their own contracts. Six-input API costs, CLI process costs, browser delivery
and heap are separate diagnostics, not a combined performance number.

DaveBench uses `public-docs-svg-return-v1`: the inventory records pages, repeated
occurrences and distinct sources, with 30 warmup attempts, rotated/reversed project
order and five rounds in the full profile. Public docs are development-exposed.
Returning SVG does not prove faithful paint. Show full output coverage alongside
timing on the same successful inputs.

Diagram Meaning uses one observer and a shared planned criterion ledger for
prepared SVG projects. Public-model facts and SVG paint remain separate; terminal
meaning has a different boundary. Reviewed model/replay bindings currently exist
for Mermaid, Pele and Agentic Mermaid. Other bindings remain missing, without
withholding otherwise valid SVG evidence. Replay leaves unsupported imports,
matchers, private representation and exact diagnostic wording visible as their
own compatibility limits. Callback workflow time is not render latency; raw
matcher counters are diagnostic details rather than a headline success rate.

The original reference tests require the actual runner and dependencies, one
worker and read-only snapshots. Original JSON supplies callbacks rather than
invented expect() counts. Browser/e2e and docs-site workspace exclusions remain
explicit.

Portable full sampling uses five rounds, 31 warm sample means and 20 fresh
processes per replica/round/case. The worker budget defaults to 300,000 ms and
includes samples and qualification, not one API call. Current bindings include
Pele, Agentic Mermaid, Beautiful-compatible APIs, Ondine, MDV, the VitePress plugin,
the DSH engine, Merman, Crafter and Merslim. Public factory setup is recorded with
import preparation; API clocks and complete-process resources have distinct
scopes. Missing browser, terminal or WASM bindings are not zero-cost results.

Configuration intent is translated through reviewed public option paths. An
unknown mapping blocks that case instead of timing an ignored option. Font checks
inspect authored label text, including inherited declarations, rather than
requiring a specific root style. Incomplete semantics or noisy A/A controls cannot
qualify performance. Per-case and per-family results stay available so an
aggregate cannot hide workload-shape differences.

## DaveBench provenance and product diagnostics

Inspired by [Dave Kiss's documentation benchmark](https://x.com/davekiss/status/2111512440106078554),
`docs` preserves the official-document workload as a public-artifact
experiment. It has a new explicit protocol and inventories the pinned upstream
syntax directory directly. Historical AM DaveBench used AM's vendored page set
and a build/pack wrapper around fixed comparators; its input count and timing
boundary must not be silently substituted for this runner's. The AM wrapper and
its detailed original methods now live in
[Agentic Mermaid](https://github.com/adewale/agentic-mermaid/tree/main/eval/benchmark).

AM also owns its family/operation test orchestration, invocation and MCP matrix,
editor/session/ownership/delivery probes, stage/profile/micro experiments, release
budgets, semantic peer tracks, PR campaigns, palette diagnostics, private corpus
export and Modern Mermaid application experiment. Product test counts are not
additional neutral benchmark scores. Trident supplies shared measurement and
observer code through an explicit pinned library dependency.

## Read evidence before comparing

- Keep acceptance, native meaning, painted criteria, latency, resources and
  delivery in their own units. No equal-weight aggregate across unrelated axes.
- Check actual package/version/bytes, public interface and completed work before
  comparing calls. A cached SVG return, rich model and DOM-hosted parse are
  different tasks. See [methodology](METHODOLOGY.md).
- Keep explicit artifact variants separate, including repeated suite and case
  names. Reports show each admitted version and its owning receipt; source
  candidates and catalog releases are different comparisons.
- Catalog-only declarations remain coverage gaps, without claiming a measured
  artifact version. Execution rows and owning receipts supply versions for the
  same tool and artifact role; missing receipts and conflicting versions fail
  report admission. Rejections and memory checkpoints keep their actual status.
- Inspect literal case and criterion denominators. Missing adapters, failures,
  unavailable counters, partial rounds and reference failures stay visible.
- A p95 of batch means is not a single-call tail. Document heap, process RSS,
  retained JS objects, native/WASM memory and network bytes cannot be added.
- A/A controls detect some measurement noise. They do not detect shape overfitting
  or establish representative production workloads. No hidden holdout exists.

These restrictions follow the failure modes discussed in
[Benchpocalypse](https://danluu.com/benchpocalypse/): equivalent interfaces, easy
shape overfitting and misleading aggregates matter more than the apparent
precision of a single chart.

See [report reading](REPORTING.md) for scorecard units and reading order.

See [comparison contracts](FAIRNESS.md) for explicit selection, runtime budgets, optional model evidence, frozen external inputs and unranked publication. [Catalog support](CATALOG.md) distinguishes configuration from actual execution.
