# Benchmark breadth review — 2 November 2026

Retire a standalone benchmark if a reviewed eligibility census shows that **at most two projects can meaningfully participate**, and no Trident limitation explains the ceiling. Keep the historical evidence. A small collected cohort alone does not establish a small eligible population.

Count **recorded**, **rankable** and **passing** projects separately. A verified failure or zero score is a measured result. Missing bindings, missing collection and unresolved assessment are not proof that a project cannot participate. Reference projects count once; two paired comparisons may contain three distinct projects.

## Current decisions

| Comparison | What the current evidence establishes | Gap owner | Decision |
|---|---|---|---|
| Mermaid API Compatibility | Two projects were collected. This is not an eligibility census. Trident's campaign support reports missing enrollment for public-test bindings. | Trident enrollment and bindings; wider eligibility remains unestablished. | Keep as a coverage-repair diagnostic, not a mature ecosystem benchmark. Enroll and measure additional public APIs before deciding whether to retain a standalone comparison. |
| Terminal Invalid-input Rejection | 18 recorded projects; three have rankable outcomes, one has a passing rejection, and 15 remain unresolved. | Trident's retained public-outcome capture and classification are incomplete. Unknown does not establish either correct rejection or renderer failure. | Keep the four controls as terminal robustness diagnostics during capture repair. Do not present the sparse table as a mature standalone benchmark. |
| Matched-workload Rendering Time | Two latest SVG pairs qualify: Mermaid/Ondine and Mermaid/Bezel. That is three distinct projects. Seven projects appear in the latest paired attempts. | Trident collection/qualification: reference noise withholds the latest Pele SVG, PNG and terminal pairs; earlier native PNG captures also failed because the display was unavailable. Broader adapter and assessment coverage remains incomplete. | Keep the stricter comparisons as coverage-repair diagnostics. DaveBench already provides completion-and-time rankings for 15 projects. Repair and extend matched collection before claiming a broad speed benchmark. |

No evidence reviewed here establishes an inherent two-project ceiling for any of these tasks. The exception is therefore **documented Trident work**, not an assumption that every unmeasured project supports the operation.

## Evidence and specific repairs

**API compatibility.** [Campaign support](../unified/support.ts) explicitly assigns `adapter-missing`: public-test campaign bindings, pinned source and original runtime have not been enrolled. The [public-test method](mermaid-public-conformance.md) states that the campaign scheduler does not enroll the suite. [The collector](../unified/public-conformance.ts) accepts an explicit binding list; only Mermaid and Agentic Mermaid appear in the recorded 154-callback table. Other projects already expose public parser, detector or renderer operations, but exact callback compatibility still needs reviewed bindings and actual collection. A genuinely missing or incompatible API should become an observed nonpass, not an invented pass or a permanent adapter gap.

**Invalid-input rejection.** [Terminal assessment](../fidelity/terminal-assessment.ts) requires a retained classified public outcome. [The terminal collector](../unified/terminal-profile.ts) passes `retained?.typedSourceOutcome` to it; if no such record exists, the outcome stays unknown. A generic exception, CLI exit or absent output cannot establish a syntax rejection. Complete capture of actual returned acceptance, explicit rejection and transport failure across Node, CLI, Python and worker paths, then regrade or collect missing controls. Do not relabel all 15 unknown projects as failures to make the table broader.

**Matched timing.** [The recorded snapshot](../results/latest.json) retains exact qualification gaps. The latest Pele SVG, Mermaid/Flutter PNG and Mermaid ASCII/Termaid terminal pairs failed the repeated-reference noise check. Earlier PNG attempts also record `cannot open display: :99` and an incomplete schedule. These are measurement/capture limitations, not evidence of a two-renderer ecosystem. Preserve the valid qualified pairs while repairing runtime setup, repeatability and broader workload/adapter coverage. Different paired runs still do not share a global speed rank.

## Portfolio and retirement rule

The main comparisons remain **DaveBench**, **Terminal Drawing Facts** and **Mermaid Behaviour Tests**. API compatibility, invalid-input rejection and stricter matched timing stay in the diagnostics/repair lane until their coverage is established.

For each repair, publish an eligibility census and actual outcomes. If the census confirms at most two applicable projects after Trident gaps are resolved, retire the standalone benchmark and retain its cases or results as diagnostics. Do not keep an ecosystem benchmark alive solely because two projects happen to have measurements.

The [generated scoreboards](benchmark-scoreboards.md) now state participation counts, repair status and next steps. No renderer measurements were collected or changed during this review.
