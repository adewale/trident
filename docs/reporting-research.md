# What Trident can learn from comparative benchmarks

Reviewed 28 October 2026. These are official descriptions and published result
examples, not measurements made by Trident. We inspected the source documents
and reporting HTML; this is not a review of every live leaderboard.

| Benchmark | How it describes its task | How it presents results | What to use in Trident |
|---|---|---|---|
| [Speedometer](https://github.com/WebKit/Speedometer/blob/b0bc16efc667dc8ded72397a29c903468dc279e0/README.md) | Browser responsiveness, measured through simulated user interactions. | Its [results UI](https://github.com/WebKit/Speedometer/blob/b0bc16efc667dc8ded72397a29c903468dc279e0/index.html) separates a score/confidence summary from detailed test metrics, nonstandard parameters and JSON downloads. | Put the task first in the description. Keep a short results view, with protocol details and raw data one link away. |
| [TechEmpower Framework Benchmarks](https://github.com/TechEmpower/FrameworkBenchmarks/blob/57d92fbec6f8fd7431bc77326dd0484e60c96e20/README.md) | Representative framework performance across concrete web workloads. | Its [test requirements](https://github.com/TechEmpower/FrameworkBenchmarks/wiki/Project-Information-Framework-Tests-Overview) distinguish JSON serialization, database queries, updates, templates and plaintext, and define the work each implementation must perform. | Give each table a named workload and public interface. A browser render, Node call and native CLI are different work, just as different database tests are. |
| [pyperformance](https://github.com/python/pyperformance/blob/ccc0aeb7ad46d65b6dcd4160e0fdda4d885852dd/README.rst) | Python implementation benchmarks, using whole applications where possible. | A [published comparison](https://github.com/python/pyperformance/blob/ccc0aeb7ad46d65b6dcd4160e0fdda4d885852dd/doc/cpython_results_2017.rst) uses workloads as rows, dated revisions as columns, time units and relative change. Its [comparison command](https://github.com/python/pyperformance/blob/ccc0aeb7ad46d65b6dcd4160e0fdda4d885852dd/doc/usage.rst#compare) supports table and CSV output. | Use names, versions, explicit units and a named baseline. Explain the reduction in the methods; do not narrate every numeric cell. |
| [MLPerf Inference](https://github.com/mlcommons/inference) | How fast systems run models in different deployment scenarios. | An [MLPerf 5.1 submitted summary](https://github.com/mlcommons/inference_results_v5.1/blob/5ea4f62ef62536e6bf4d78a9b440fb9035ddfb4a/closed/AMD/results/8xMI300X_2xEPYC_9575F/summary.html) places accuracy targets beside performance and gives Server, Interactive and Offline separate columns with metric units and explicit N/A cells. | Show output qualification beside performance. Separate runtime/call scenarios, and display missing or inapplicable values explicitly. This is a presentation example, not an endorsement of that submission's measurements. |

The common writing pattern is a concrete task followed by a named measurement.
It does not require a repeated “Which…?” opening, “Use it for…” advice or a short
essay explaining each row. Trident's README now has separate **What it tests**
and **Results table** columns.

## Choices we should not copy automatically

Speedometer defines a composite score within its browser workload. Trident's
coverage, meaning, callbacks, latency and memory are different quantities; they
cannot become a comparable composite by copying that formula.

The historical pyperformance page selects changes above a threshold in some
sections. A Trident publication should retain its full planned population and
failures. Likewise, another suite's statistical procedure cannot replace
Trident's output prerequisites, paired inputs and noise controls.

The reviewed MLPerf example makes its scenarios and accuracy targets visible.
That does not establish equivalent work between our own interfaces. We still
need the declared SVG, terminal, parser, conversion or application contract.

These choices also follow [Benchpocalypse](https://danluu.com/benchpocalypse/):
equivalent interfaces, workload shapes and selection matter more than a neat
aggregate or extra decimal places.

## Changes to Trident's examples

| Reporting problem | Change |
|---|---|
| Numbers were embedded in paragraphs about one project. | Twelve tables cover all seven benchmarks, with 42 rows from retained observations. |
| Different successful subsets could produce misleading timing summaries. | DaveBench shows complete output coverage and a separate timing table for one named input; failed output withholds its time. |
| Model reports contained different numbers of checks. | Compare the same 561 criterion identities, and show 118 additional Agentic Mermaid serializer/readback checks separately. The same rule applies to any project's optional APIs. |
| Raw replay matcher totals looked like a success rate. | Headline tables use declaration and callback dispositions. Matcher observations in unavailable callbacks remain diagnostic details. |
| Old timings might be read as a new performance result. | Keep the original date, protocol, call mode, sample count and incomplete qualification visible. Do not add an unqualified speed ratio or confidence interval. |
| A missing counter could look like zero cost. | The resource example says CPU is unavailable and gives process RSS and JS heap separate columns. |

The [worked tables](benchmark-examples.md) show the presentation. Their
[receipt](evidence/benchmark-examples.json) records numeric rows and source digests.
The changes are to documentation and example reductions, not benchmark collection
or runtime publication code.
