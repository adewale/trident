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

| Suite | Question and output | Value and limits |
|---|---|---|
| `community` | Which frozen inputs return the requested SVG, terminal, PNG or parser result? Per-case dispositions, family coverage, six-input API costs, browser delivery/heap and CLI process costs. | **High for compatibility triage; narrow for speed.** XML/labels are weak fidelity evidence. PNG checks only the binary envelope. Different supported subsets are not comparable percentages. |
| `docs` | Does a public browser artifact return SVG for **every occurrence in every syntax page at the pinned Mermaid commit**? `inventory.json` records the exact pages, repeated occurrences and distinct source count; observations retain round, acceptance and public call time. | **High as an external workload; moderate for speed.** Protocol `public-docs-svg-return-v1`,30 warm-up attempts, rotated/reversed project order, full profile5 rounds. SVG return does not prove correct paint. Compare time only on pairwise common successful occurrences, retaining the complete acceptance denominator. Public docs are development-exposed. |
| `fidelity` | Does the actual frozen public SVG draw independently authored identities, relationships, values, visibility and geometry? Shared planned criterion ledger and SVG/PNG witnesses. | **High for meaning and paint.** Same observer for every prepared SVG project. Missing model APIs remain unavailable; paint is not an aesthetic or accessibility judgment. Terminal-only tools have an explicit boundary. |
| `native-fidelity` | Do reviewed public model/operation APIs preserve the same authored meaning and real edit/configuration workflows? Criterion-level facts and owned-ink evidence stay separate. | **High within a reviewed adapter's scope.** Current model bindings are Mermaid, Pele and Agentic; all other bindings are explicitly unsupported here, while SVG paint still runs. A reviewed adapter is a capability boundary, not a preferred project. |
| `upstream-fidelity` | Which unchanged original Mermaid callbacks can be executed through reviewed public parser/model projections? Declaration, callback and individual assertion counts remain distinct. | **Medium for cross-project compatibility.** Private database/API and diagnostic wording differences can fail without proving wrong drawings. Unsupported imports/matchers remain unavailable. Callback workflow time is not rendering latency. |
| `upstream-original` | Does the pinned Mermaid source pass its own genuine original core Vitest runner? Original JSON plus complete declaration/callback accounting. | **High for reference setup; limited as a peer score.** Requires the actual runner/dependencies, one worker and read-only snapshots. This is Mermaid's own runner, so it does not execute another project's private tests. Browser/e2e and docs-site workspace exclusions stay explicit. |
| `portable` | How do family, scaling, interacting-feature and invalid-input cases behave under fresh and warm public Node SVG calls? Reports separate fidelity, first result, batch means, CPU, RSS, heap and A/A calibration. | **High for controlled regressions; not a production forecast.** Full sampling uses5 rounds,31 warm sample means and20 fresh processes per replica/round/case. The complete worker budget defaults to300000ms and is configurable in the portable CLI; it includes all samples and qualification, not one API call. Current bindings: Pele, Agentic, Beautiful-compatible and Ondine. Configuration intent is translated through reviewed public option paths; unknown mappings block that case. Font changes are checked on authored label text, including inherited declarations, rather than requiring a particular root style. Missing browser/terminal/WASM bindings remain unsupported, not zero-cost. Incomplete semantics or noisy A/A controls cannot qualify performance. |

## Davebench and product diagnostics

`docs` preserves the useful official-document workload as a public-artifact
experiment. It has a new explicit protocol and inventories the pinned upstream
syntax directory directly. Historical AM Davebench used AM's vendored page set
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
