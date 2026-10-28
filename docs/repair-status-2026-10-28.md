# Follow-up benchmark repairs — 28 October 2026

These repairs do not replace the dated campaign results or qualify new speedup claims. Published rankings retain their original source, artifact and collection identities.

## Reference browser producer

The browser baseline now binds the pinned first-party ZenUML addon when selected cases require it. Import and registration happen inside the first ZenUML workflow clock; unrelated Flowchart startup does not load the addon. The record includes the addon inventory and identity. The protocol is `pinned-browser-public-svg-v2`.

Explicit case and stage selection use a separate `pinned-browser-baseline-subset` record lane. Selecting only Mermaid no longer requires Agentic or Pele package directories. Optional browser launch arguments are validated and recorded, so a constrained-host rerun cannot silently share the original browser cohort. The extracted policy path and standalone runner root were also corrected.

Validation: Trident typecheck passed. Independent Node checks passed eight lazy-binding assertions and six selection/argument-admission assertions. Bun aborted before running the focused regression tests on this host. The attempted pinned-addon browser collection did not complete; the old ZenUML observations remain unrequalified. Stub-module checks establish adapter behavior, not the real addon's rendering fidelity.

## Archived source-suite producer

Three fixes remain separate from Trident's maintained, artifact-based core. Their source-only producer is published at [`636c194`](https://github.com/adewale/trident/commit/636c1944efbb3ad1b1df07c61f4baaf5e6f0235b), on `benchmarks/source-harness-repairs-2026-10-28`. Its tree was checked against the local repair commit before publication; no campaign archives or package artifacts were uploaded.

- Release planning prefers an exact baseline tarball and requires its digest, even when a baseline directory is supplied for another diagnostic.
- Endpoint-marker planning accepts explicit `--baseline-checkout` and `--candidate-checkout` inputs. It rejects nested package directories, dirty production inputs and missing built agent entries before measurement.
- Revision extraction copies the current harness's `eval/shared` closure as well as `eval/benchmark`, while production source still comes from the requested revision.

Independent checks passed six assertions using real Git repositories and executable shared-fixture imports, plus seven assertions for release selection, missing-digest admission and checkout flags. Regression tests were added for these boundaries. Biome passed the eight changed files. These checks do not claim that the historical source suites have completed successfully. The archived producer must run in its documented Agentic source layout; its flat archival checkout is not a standalone typecheck target.

## Product attribution and PR comparison

The reduced historical five-node Flowchart witness renders on current Agentic main `ceca964f1a4aa4b3e748edbbce8728abd65ce632` through both ELK and Agentic public layout selectors. Main also contains that exact graph among its structural-fuzz regression examples. This is a render check, not a completed independent route audit or attribution to a particular fixing commit.

The diagnostic runtime was built directly with esbuild because the normal nested build exhausted the host's thread capacity. It omits declarations and browser distributions, so it cannot support npm package-size comparisons or replace the canonical build cohort.

PR #571 advanced to `d0be0df6ddbb51e5fbfa8d12ff162f245844bd89` during this work. Its new head was fetched, checked out and built with the same direct runtime build command and dependency pins as main. Twelve untimed canonical Class/ER backend-receipt checks passed: both families on both backends for historical PR #449, current main and the new #571 head. [The inputs, options and actual decisions are retained here](evidence/harness-repairs-2026-10-28/current-head-backend-replay.json). They verify requested backend selection without fallback on these witnesses. They do not reproduce the other failing strict cases, establish full native semantics, or provide a performance score. The old head's CI and measurements must not be assigned to the new head.

## Still required

1. Run the complete suite and the focused regressions on a healthy host.
2. Complete actual pinned Mermaid + ZenUML browser qualification in the separately identified subset cohort.
3. Rerun the repaired historical suites and attribute remaining route, strict Class/ER and installed-tarball failures against their original bases and current main.
4. Build and measure the current PR #571 head; publish it only in compatible comparison cohorts.
5. Configure the chosen live-agent provider/model and supply genuine external transcripts. This environment has neither provider credentials nor those transcripts.

The host accumulated approximately 20,000 zombie processes and repeatedly refused process or thread creation (`EAGAIN`). Full parallel and serial suite attempts did not pass. Infrastructure aborts remain failures to collect evidence; they are not renderer regressions, benchmark successes, or grounds to lower sample and qualification requirements. Raw campaign archives and package trees have not been added to this PR.
