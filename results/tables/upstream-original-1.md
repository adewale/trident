# Mermaid Reference Tests · part 1

[Ecosystem overview](../../RESULTS.md) · [All parts](upstream-original.md)

<a id="original-runner"></a>

**original-runner** · 2026-10-28 · Historical · unit: original callbacks · [evidence](../../docs/evidence/benchmark-examples.json)

Mermaid reference only; 331 files through the genuine original core Vitest runner in a sealed npm environment. Docs-site and browser/e2e tests are outside this table.

Ranked by **Passed callbacks / Total callbacks**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Files | Passed callbacks | Failed | Pending | Todo | Total callbacks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid.js | 1 | 12.2.0 | 331 | 6677 | 0 | 16 | 2 | 6695 |

<a id="run-7f4437d59ba8ba2c2abd9301"></a>

**run-7f4437d59ba8ba2c2abd9301** · 2026-10-30 · unit: observations · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

core; default; mermaid:original-source-vitest; Node + Vitest + jsdom; assertions; original-upstream-native-callback. Compared rows have the same recorded check coordinates. Counts are observations, not inferred diagram passes or full-inventory coverage. Missing bindings remain in campaign attempts.

Ranked by **Passed**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Passed | Failed | Unsupported | Blocked | Not applicable | Skipped | Unavailable | Recorded | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid.js | 1 | 12.2.0 | 6677 | 0 | 0 | 0 | 18 | 0 | 0 | 6695 | 2026-10-30T05:25:18.185Z |

<a id="run-d1c2716fe7342c3989f39a06"></a>

**run-d1c2716fe7342c3989f39a06** · 2026-10-30 · unit: observations · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

core; default; mermaid:original-source-vitest; Node + Vitest + jsdom; assertions; upstream-test-runner-workflow. Compared rows have the same recorded check coordinates. Counts are observations, not inferred diagram passes or full-inventory coverage. Missing bindings remain in campaign attempts.

Ranked by **Passed**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Passed | Failed | Unsupported | Blocked | Not applicable | Skipped | Unavailable | Recorded | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid.js | 1 | 12.2.0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 2026-10-30T05:25:18.185Z |
<a id="attempt-ee9027dee20ff64867a864e7"></a>

### Mermaid.js: Mermaid Reference Tests (core)

Campaign invocation: 2026-10-30T03:05:19.681Z → 2026-10-30T11:37:15.317Z · **recorded** · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json) · [owning results and failures](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/upstream-original/)

Actual Vitest execution of pinned Mermaid source and unmodified original core vite.config.ts. Core project includes its discovered package/unit suites; docs-site Vite workspace and browser rendering/e2e suites are not executed here. No public-parser facade, expectation rewriting or snapshot updating.; Exact selected pinned-source importer versions plus its selected required jsdom Canvas adapter; remaining npm transitive/peer resolution is recorded separately. This is not the stock pnpm workspace closure.; Individual expect() counts are unavailable in native Vitest JSON; callback counts are never presented as assertions.; Browser rendering/e2e and docs-site workspace require separate original runners and their actual prerequisites.; Campaign process status: passed; Recorded observation dispositions; process completion does not establish benchmark qualification.

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12.2.0 / default | mermaid:original-source-vitest / Node + Vitest + jsdom | assertions / original-upstream-native-callback | original-runner-functionality / not round-based | 6695 | 6677 | 0 | 0 | 0 | {"not-applicable":18} | 6695 |
| 12.2.0 / default | mermaid:original-source-vitest / Node + Vitest + jsdom | assertions / upstream-test-runner-workflow | unpaired-workflow-diagnostic / not round-based | 1 | 1 | 0 | 0 | 0 | {} | 1 |

