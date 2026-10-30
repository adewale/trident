# Render Cost and Scaling · part 1

[Ecosystem overview](../../RESULTS.md) · [All parts](portable.md)

<a id="portable-times"></a>

**portable-times** · 2026-10-27 · Historical · unit: milliseconds · [evidence](../../docs/evidence/benchmark-examples.json)

Public Node SVG; authored family:flowchart; protocol portable-svg-processes-v3; five rounds. First calls exclude import (100 samples); repeat and new-source medians use 155 batch means each. Failed or uncalibrated campaigns: no qualified speed comparison or ratios.

Ranked by **Repeat median (ms)**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | First call median (ms) | Repeat median (ms) | New-source median (ms) | Declared flowchart checks | Campaign qualification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.9.0 | 17.1 | 0.35 | 0.11 | Complete | Uncalibrated |
| Beautiful Mermaid | 2 | 1.1.3 | 206 | 7.46 | 4.78 | Incomplete | Failed |
| Zombie Mermaid | 3 | 5.10.2 | 326 | 8.96 | 5.72 | Incomplete | Failed |
| Agentic Mermaid | 4 | 0.4.1 | 330 | 30.5 | 20.3 | Incomplete | Failed |

<a id="portable-resources"></a>

**portable-resources** · 2026-10-27 · Historical · unit: MiB; CPU unavailable · [evidence](../../docs/evidence/benchmark-examples.json)

Same historical Pele flowchart; round 1; API-return checkpoint. Process RSS and JS heap have different scopes. CPU was unavailable; it is not zero.

Ranked by **Process RSS (MiB)**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Checkpoint | Process RSS (MiB) | JS heap used (MiB) | CPU (ms) |
| --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.9.0 | At API return | 67.61 | 11.48 | Unavailable |

<a id="run-f5960d5e8660a8475b931ee6"></a>

**run-f5960d5e8660a8475b931ee6** · 2026-10-30 · unit: cases · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

Public Node SVG output admission on the same planned cases and sampling. Invalid rejection and declared semantics remain separate from SVG return; no overall quality score is inferred.

Ranked by **Admitted / Planned positive**, highest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Admitted | Failed | Unsupported | Blocked | Unmeasured | Planned positive | Invalid rejected | Planned invalid | Declared semantics complete | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 50 | 1 | 0 | 0 | 0 | 51 | 3 | 3 | 7 | 2026-10-30T07:38:46.927Z |
| Pele | 1 | 1.12.0 | 50 | 0 | 1 | 0 | 0 | 51 | 3 | 3 | 28 | 2026-10-30T11:25:08.707Z |
| Latias94/merman | 3 | 0.9.2 | 49 | 1 | 0 | 1 | 0 | 51 | 3 | 3 | 0 | 2026-10-30T10:07:26.363Z |
| Ondine | 3 | 0.0.3 | 49 | 0 | 1 | 1 | 0 | 51 | 3 | 3 | 0 | 2026-10-30T05:55:32.434Z |
| Zombie Mermaid | 5 | 5.11.2 | 34 | 0 | 16 | 1 | 0 | 51 | 2 | 3 | 0 | 2026-10-30T08:29:41.608Z |
| Beautiful Mermaid | 6 | 1.1.3 | 27 | 1 | 22 | 1 | 0 | 51 | 1 | 3 | 0 | 2026-10-30T10:46:37.723Z |
| emtyty/merslim | 7 | 0.2.3 | 25 | 5 | 20 | 1 | 0 | 51 | 1 | 3 | 0 | 2026-10-30T09:29:12.603Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | 8 | 0.1.4 | 20 | 30 | 0 | 1 | 0 | 51 | 1 | 3 | 0 | 2026-10-30T11:37:00.901Z |
| KlangHaus/vitepress-plugin-diagram | 9 | 0.3.2 | 17 | 3 | 31 | 0 | 0 | 51 | 1 | 3 | 0 | 2026-10-30T09:38:07.169Z |
| crafter-station/mermaid | 10 | 0.0.3 | 0 | 30 | 20 | 1 | 0 | 51 | 1 | 3 | 0 | 2026-10-30T09:06:50.369Z |

<a id="run-3029033d342f3b9d7f137e79"></a>

**run-3029033d342f3b9d7f137e79** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:flowchart; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 48.91829450055957 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-2af1f410ce942aa26b45cc29"></a>

**run-2af1f410ce942aa26b45cc29** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:flowchart; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Zombie Mermaid | 1 | 5.11.2 | 6.90234300121665 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Beautiful Mermaid | 2 | 1.1.3 | 7.729245498776436 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-a452a11ffb7a8350996712dd"></a>

**run-a452a11ffb7a8350996712dd** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:flowchart; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Zombie Mermaid | 1 | 5.11.2 | 4.661975000053644 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-93ebe3ca37ebc4d0cc06850e"></a>

**run-93ebe3ca37ebc4d0cc06850e** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:sequence; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 111.53169349953532 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-2f0f08ad1ef4a8c002e9f6b5"></a>

**run-2f0f08ad1ef4a8c002e9f6b5** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:sequence; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-879c3be8e91adfd4c6c9fd28"></a>

**run-879c3be8e91adfd4c6c9fd28** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:sequence; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KlangHaus/vitepress-plugin-diagram | 1 | 0.3.2 | 0.12014155922567143 | 186 | partial | calibrated | 2026-10-30T09:38:07.169Z |
| Agentic Mermaid | 2 | 0.5.1 | 8.854563500732183 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-0de93d35f483dbf11c63af73"></a>

**run-0de93d35f483dbf11c63af73** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:state; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 47.008698999881744 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Beautiful Mermaid | 2 | 1.1.3 | 205.00789699703455 | 30 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-4b80933c99e6e884eb9c51d2"></a>

**run-4b80933c99e6e884eb9c51d2** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:state; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-b1099ba782ee5af5d3a43ecd"></a>

**run-b1099ba782ee5af5d3a43ecd** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:state; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 9.841447498649359 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-d5076fdbc2b4776de396c3b6"></a>

**run-d5076fdbc2b4776de396c3b6** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:class; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 8.645946498960257 | 30 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Zombie Mermaid | 2 | 5.11.2 | 279.25406849756837 | 30 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-3da539e3164ad0785d218852"></a>

**run-3da539e3164ad0785d218852** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:class; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-c293e743cf78ef093987f4be"></a>

**run-c293e743cf78ef093987f4be** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:class; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-b5d6ce3fa8cb9228f6a6a558"></a>

**run-b5d6ce3fa8cb9228f6a6a558** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:er; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-95a1df044821827e084db63b"></a>

**run-95a1df044821827e084db63b** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:er; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Beautiful Mermaid | 1 | 1.1.3 | 6.976931996643543 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-09f3c3c747b855b61d5583df"></a>

**run-09f3c3c747b855b61d5583df** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:er; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Zombie Mermaid | 1 | 5.11.2 | 3.9707125015556812 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | 2 | 0.5.1 | 7.373287498950958 | 186 | complete for this case | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-47c20225805dc54c5915b141"></a>

**run-47c20225805dc54c5915b141** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:timeline; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-706e555b3442d274a182431b"></a>

**run-706e555b3442d274a182431b** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:timeline; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-afad699882ec1db92d7c450e"></a>

**run-afad699882ec1db92d7c450e** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:timeline; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| emtyty/merslim | 1 | 0.2.3 | 0.0166787548437645 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-fdbd28b2343416c79a6608fd"></a>

**run-fdbd28b2343416c79a6608fd** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:journey; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| emtyty/merslim | 1 | 0.2.3 | 1.5313710011541843 | 30 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-5d9b0d333b18975fe44917b8"></a>

**run-5d9b0d333b18975fe44917b8** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:journey; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| emtyty/merslim | 1 | 0.2.3 | 0.01584985973060246 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-eadccd278cf88c9976c38dc2"></a>

**run-eadccd278cf88c9976c38dc2** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:journey; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.04179515228701794 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-3f66991262c3b0c04a86b878"></a>

**run-3f66991262c3b0c04a86b878** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:architecture; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.12.0 | 9.30401000007987 | 30 | partial | calibrated | 2026-10-30T11:25:08.707Z |
| Ondine | 2 | 0.0.3 | 27.61006200313568 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Zombie Mermaid | 3 | 5.11.2 | 290.00024699792266 | 30 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-dc939a7c6e377a470d4cf28d"></a>

**run-dc939a7c6e377a470d4cf28d** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:architecture; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 9.05221850052476 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-44169b36daefde1032294b2e"></a>

**run-44169b36daefde1032294b2e** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:architecture; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Zombie Mermaid | 1 | 5.11.2 | 5.706645000725985 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | 2 | 0.5.1 | 10.372573498636484 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-b72950965905cfe6be45de61"></a>

**run-b72950965905cfe6be45de61** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:xychart; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.12.0 | 6.567418996244669 | 30 | partial | calibrated | 2026-10-30T11:25:08.707Z |
| Ondine | 2 | 0.0.3 | 25.787640001624823 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-df1af806718ea29ec8e46b61"></a>

**run-df1af806718ea29ec8e46b61** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:xychart; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Zombie Mermaid | 1 | 5.11.2 | 0.37658024951815605 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-68cabdff9f00a0eca75f77f8"></a>

**run-68cabdff9f00a0eca75f77f8** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:xychart; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 1.0213170827676854 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | 2 | 0.5.1 | 12.593646500259638 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-47dc7c7a76e15a48ac0e8b16"></a>

**run-47dc7c7a76e15a48ac0e8b16** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:pie; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 4.275284498929977 | 30 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Pele | 2 | 1.12.0 | 5.486898500472307 | 30 | partial | calibrated | 2026-10-30T11:25:08.707Z |
| Zombie Mermaid | 3 | 5.11.2 | 5.548773001879454 | 30 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-fcfaee6569df250508d27bec"></a>

**run-fcfaee6569df250508d27bec** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:pie; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-5b7142fec61fbeb6e7a3b967"></a>

**run-5b7142fec61fbeb6e7a3b967** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:pie; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-00ebef7bf20ecc4810539fd2"></a>

**run-00ebef7bf20ecc4810539fd2** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:quadrant; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 24.614666998386383 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-045f37b622f5424759d81ec1"></a>

**run-045f37b622f5424759d81ec1** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:quadrant; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-2840ba522f274b7ba0c4aabd"></a>

**run-2840ba522f274b7ba0c4aabd** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:quadrant; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 5.889788001775742 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-49c0091d831ac69ff5d7b6b7"></a>

**run-49c0091d831ac69ff5d7b6b7** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:gantt; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 96.99467599764466 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-d51a6078e53bec7697f851af"></a>

**run-d51a6078e53bec7697f851af** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:gantt; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.11414846173591084 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 2 | 0.5.1 | 7.209881495684385 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-eb972c77530d1193dadc51bb"></a>

**run-eb972c77530d1193dadc51bb** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:gantt; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-018c5e733dc70bf3269d0a03"></a>

**run-018c5e733dc70bf3269d0a03** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:mindmap; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 26.751246497035027 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 0 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-25732b7aa88161db85d88ec9"></a>

**run-25732b7aa88161db85d88ec9** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:mindmap; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 7.060350000858307 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 0 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-4000fd562e458f391704ec0b"></a>

**run-4000fd562e458f391704ec0b** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:mindmap; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 7.120561998337507 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 0 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-4fc96a329d74601bd89bae33"></a>

**run-4fc96a329d74601bd89bae33** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:gitgraph; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 25.61353849992156 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 2 | 0.5.1 | 105.71030600368977 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-75ab36d923e7c9dd9ab71f9d"></a>

**run-75ab36d923e7c9dd9ab71f9d** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:gitgraph; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-ce88ba952a6e570cbc5fbb31"></a>

**run-ce88ba952a6e570cbc5fbb31** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:gitgraph; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.07311723248234817 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-1dad4d272023e034a108c7e7"></a>

**run-1dad4d272023e034a108c7e7** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:radar; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.12.0 | 6.843511499464512 | 30 | partial | calibrated | 2026-10-30T11:25:08.707Z |
| Agentic Mermaid | 2 | 0.5.1 | 101.05815950036049 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-8983d566f07582a6b4df645a"></a>

**run-8983d566f07582a6b4df645a** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:radar; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-9ad6e0a0404163b5418f33ce"></a>

**run-9ad6e0a0404163b5418f33ce** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:radar; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-ae7c9f86f2cf5e764a98466b"></a>

**run-ae7c9f86f2cf5e764a98466b** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:sankey; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 26.464122500270605 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 2 | 0.5.1 | 101.23259999975562 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-fcd167de381041d0deda8de9"></a>

**run-fcd167de381041d0deda8de9** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:sankey; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 6.455815497785807 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-2a22e708234f12525f947344"></a>

**run-2a22e708234f12525f947344** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:sankey; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-610710d158316c2e08fcdff9"></a>

**run-610710d158316c2e08fcdff9** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:c4; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 31.4561680033803 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-d6f19cafad4f581de412cdff"></a>

**run-d6f19cafad4f581de412cdff** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:c4; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-234e076621f8bd65ef08b989"></a>

**run-234e076621f8bd65ef08b989** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:c4; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 1.5151772499084473 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | 2 | 0.5.1 | 10.441479001194239 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-0ad7361c1d9a1e1c5859c3a6"></a>

**run-0ad7361c1d9a1e1c5859c3a6** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:packet; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 25.639984499663115 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-010d68e19620273cda899a9d"></a>

**run-010d68e19620273cda899a9d** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:packet; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 5.61421849951148 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-94bb973fc228c4d1bef337f0"></a>

**run-94bb973fc228c4d1bef337f0** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:packet; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.02069903719686511 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Pele | 2 | 1.12.0 | 0.02516496768334835 | 186 | partial | calibrated | 2026-10-30T11:25:08.707Z |
| Agentic Mermaid | 3 | 0.5.1 | 5.092470001429319 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-913925bb90eb6e78a0a6ab24"></a>

**run-913925bb90eb6e78a0a6ab24** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:kanban; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-5477ba1dc3af686eba6f5164"></a>

**run-5477ba1dc3af686eba6f5164** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:kanban; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-14096f36374458829d2bc36a"></a>

**run-14096f36374458829d2bc36a** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:kanban; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-75aa1b532cc8ffbeeb3ca645"></a>

**run-75aa1b532cc8ffbeeb3ca645** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:requirement; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 8.463759500533342 | 30 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | 2 | 0.5.1 | 362.6990445032716 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-12abca5efd03010e517c411e"></a>

**run-12abca5efd03010e517c411e** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:requirement; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 2.2075399979948997 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-027062932b234f67a6e78369"></a>

**run-027062932b234f67a6e78369** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:requirement; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 2.323481000959873 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-1e36b6d7946f2587adab518c"></a>

**run-1e36b6d7946f2587adab518c** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:treemap; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 26.596238501369953 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 2 | 0.5.1 | 93.37577449902892 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-72d82bfb5eeadd73ab8cf4ac"></a>

**run-72d82bfb5eeadd73ab8cf4ac** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:treemap; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.04663422881259094 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-b64e02a6ad5a7e61c340139a"></a>

**run-b64e02a6ad5a7e61c340139a** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:treemap; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.02881120446537222 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Latias94/merman | 2 | 0.9.2 | 0.7489668329556782 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-62211412eb68dce6767e9ce3"></a>

**run-62211412eb68dce6767e9ce3** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:ishikawa; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-3efd814d1a1a93986dcc0d73"></a>

**run-3efd814d1a1a93986dcc0d73** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:ishikawa; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 7.669112000614405 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-fc1e2991028909033a4fd659"></a>

**run-fc1e2991028909033a4fd659** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:ishikawa; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.03136513306526467 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 2 | 0.5.1 | 7.109284996986389 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-ef73bbdf473f207bb33beb9a"></a>

**run-ef73bbdf473f207bb33beb9a** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:block; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-458259815c2d31192cc4fa06"></a>

**run-458259815c2d31192cc4fa06** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:block; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-ad0ea55fa1e7727c43d648b8"></a>

**run-ad0ea55fa1e7727c43d648b8** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:block; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 5.971195999532938 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-588d27be2d85e4ebe53e264c"></a>

**run-588d27be2d85e4ebe53e264c** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:eventmodeling; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-1fa8f745b62d8d476b55b205"></a>

**run-1fa8f745b62d8d476b55b205** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:eventmodeling; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 9.068286500871181 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-47901358db5d95c055a662be"></a>

**run-47901358db5d95c055a662be** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

family:eventmodeling; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 0.5919040003791451 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | 2 | 0.5.1 | 8.986936997622252 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-60aac5fc62b09bf2b436c1dc"></a>

**run-60aac5fc62b09bf2b436c1dc** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:flowchart:8; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KlangHaus/vitepress-plugin-diagram | 1 | 0.3.2 | 9.874097499996424 | 30 | partial | calibrated | 2026-10-30T09:38:07.169Z |
| Ondine | 2 | 0.0.3 | 48.12440649420023 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Beautiful Mermaid | 3 | 1.1.3 | 219.21647500246763 | 30 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

