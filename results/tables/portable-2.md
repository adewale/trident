# Render Cost and Scaling · part 2

[Ecosystem overview](../../RESULTS.md) · [All parts](portable.md)

<a id="run-c6676de838c6a9ce8c043e31"></a>

**run-c6676de838c6a9ce8c043e31** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:flowchart:8; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 2.6649245023727417 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Zombie Mermaid | 2 | 5.11.2 | 9.850111499428749 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-0f506e4ee6fd069b955edb21"></a>

**run-0f506e4ee6fd069b955edb21** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:flowchart:8; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 17.341318503022194 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-41ba12e08d4e7029e863fb69"></a>

**run-41ba12e08d4e7029e863fb69** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:flowchart:32; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.12.0 | 28.98131549730897 | 30 | complete for this case | calibrated | 2026-10-30T11:25:08.707Z |
| Ondine | 2 | 0.0.3 | 50.11745100095868 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 3 | 0.5.1 | 230.24569700285792 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-a7c72ccaa51dd80c1a236d8b"></a>

**run-a7c72ccaa51dd80c1a236d8b** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:flowchart:32; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 4.317437499761581 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| emtyty/merslim | 2 | 0.2.3 | 13.779611002653837 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-75eb753a51279383ff408194"></a>

**run-75eb753a51279383ff408194** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:flowchart:32; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.12.0 | 1.0314665002127488 | 186 | complete for this case | calibrated | 2026-10-30T11:25:08.707Z |
| Beautiful Mermaid | 2 | 1.1.3 | 18.64630999788642 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | 3 | 0.5.1 | 48.892365500330925 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-7f604c042b4c05ff59068ea2"></a>

**run-7f604c042b4c05ff59068ea2** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:flowchart:128; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 56.159598503261805 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-76673f5328d49127481a40bb"></a>

**run-76673f5328d49127481a40bb** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:flowchart:128; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 12.97850950062275 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-a4f65944d659145ff5a6049a"></a>

**run-a4f65944d659145ff5a6049a** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:flowchart:128; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-89d60cdcebc7156860f4a9e5"></a>

**run-89d60cdcebc7156860f4a9e5** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:sequence:8; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 29.99837699905038 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 2 | 0.5.1 | 123.85407599806786 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-b997dd43b0e2f2fd8cf7ecfd"></a>

**run-b997dd43b0e2f2fd8cf7ecfd** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:sequence:8; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

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

<a id="run-e852cebb2f5d330fcf96f0d3"></a>

**run-e852cebb2f5d330fcf96f0d3** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:sequence:8; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Beautiful Mermaid | 1 | 1.1.3 | 0.0807398208975792 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-74d4a52b360c37834a8698e6"></a>

**run-74d4a52b360c37834a8698e6** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:sequence:32; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 29.3745025023818 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 2 | 0.5.1 | 157.28053750097752 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-3a4dd19471baef7d6c8cdf7b"></a>

**run-3a4dd19471baef7d6c8cdf7b** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:sequence:32; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

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

<a id="run-3f78fb6cb7a7abe958ca6320"></a>

**run-3f78fb6cb7a7abe958ca6320** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:sequence:32; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.18757668572167557 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Latias94/merman | 2 | 0.9.2 | 2.9163680002093315 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-6a4e10026e0fc6ebd66078b9"></a>

**run-6a4e10026e0fc6ebd66078b9** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:sequence:128; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-78c15175738a50117015771e"></a>

**run-78c15175738a50117015771e** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:sequence:128; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

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

<a id="run-04896e542e44b1839f381d21"></a>

**run-04896e542e44b1839f381d21** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:sequence:128; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.38121233383814496 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-afba92782980d0e4ef289b31"></a>

**run-afba92782980d0e4ef289b31** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:class:8; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 44.08297549933195 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Zombie Mermaid | 2 | 5.11.2 | 298.0635185018182 | 30 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-c08d0b98d455a43c232e1b9f"></a>

**run-c08d0b98d455a43c232e1b9f** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:class:8; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-d107015e9a5d3ccaca19af2b"></a>

**run-d107015e9a5d3ccaca19af2b** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:class:8; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-c9158f8e895240b70c60f1f3"></a>

**run-c9158f8e895240b70c60f1f3** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:class:32; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 44.57159300148487 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Zombie Mermaid | 2 | 5.11.2 | 351.45676700025797 | 30 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-a4ba955328cb0f8acddda1be"></a>

**run-a4ba955328cb0f8acddda1be** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:class:32; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| emtyty/merslim | 1 | 0.2.3 | 4.220847003161907 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Zombie Mermaid | 2 | 5.11.2 | 17.65284350141883 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | 3 | 0.5.1 | 43.99125750362873 | 186 | complete for this case | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-d5dc58f87036a499a592f231"></a>

**run-d5dc58f87036a499a592f231** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:class:32; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Beautiful Mermaid | 1 | 1.1.3 | 12.616562496870756 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Zombie Mermaid | 2 | 5.11.2 | 13.013424500823021 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | 3 | 0.5.1 | 49.840987000614405 | 186 | complete for this case | calibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-cec01ced224d56191311744e"></a>

**run-cec01ced224d56191311744e** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:class:128; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KlangHaus/vitepress-plugin-diagram | 1 | 0.3.2 | 30.80443899706006 | 30 | partial | calibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | 2 | 0.9.2 | 32.785617999732494 | 30 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | 3 | 0.5.1 | 861.5388524979353 | 30 | complete for this case | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-d42fbaa7f8353370880ca3c5"></a>

**run-d42fbaa7f8353370880ca3c5** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:class:128; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 178.0982124991715 | 186 | complete for this case | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-3cde69b1782a67d0cd7b0940"></a>

**run-3cde69b1782a67d0cd7b0940** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:class:128; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 197.4664629995823 | 186 | complete for this case | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-8f1163564ddaf7d1419411f6"></a>

**run-8f1163564ddaf7d1419411f6** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:state:8; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-cf59af8b8bc0fc45b95a7c60"></a>

**run-cf59af8b8bc0fc45b95a7c60** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:state:8; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 3.096858497709036 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-016e442912110c79ce191e3b"></a>

**run-016e442912110c79ce191e3b** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:state:8; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 2.4991077464073896 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Beautiful Mermaid | 2 | 1.1.3 | 6.983391001820564 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-8e3ac16478a5c7b83045d4df"></a>

**run-8e3ac16478a5c7b83045d4df** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:state:32; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 10.363053999841213 | 30 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Ondine | 2 | 0.0.3 | 54.34275499731302 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Beautiful Mermaid | 3 | 1.1.3 | 266.6084720008075 | 30 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | 4 | 0.5.1 | 592.5621435008943 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-0707cb7252ac7eb9c66096dd"></a>

**run-0707cb7252ac7eb9c66096dd** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:state:32; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-398b1ce964da631d81e7f4e0"></a>

**run-398b1ce964da631d81e7f4e0** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:state:32; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-76434310abf11ad155864884"></a>

**run-76434310abf11ad155864884** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:state:128; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 23.382426500320435 | 30 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-cbde4a7c431d252b9521953f"></a>

**run-cbde4a7c431d252b9521953f** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:state:128; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 2.8145930022001266 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Latias94/merman | 2 | 0.9.2 | 12.410011500120163 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Zombie Mermaid | 3 | 5.11.2 | 60.43716149777174 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-443550ad0bcf3408d44dff69"></a>

**run-443550ad0bcf3408d44dff69** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:state:128; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 1.1320474985986948 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Pele | 2 | 1.12.0 | 2.2985684983432293 | 186 | complete for this case | calibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | 3 | 0.1.4 | 7.860127501189709 | 186 | partial | calibrated | 2026-10-30T11:37:00.901Z |
| Latias94/merman | 4 | 0.9.2 | 13.106544502079487 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Zombie Mermaid | 5 | 5.11.2 | 48.72443049773574 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Beautiful Mermaid | 6 | 1.1.3 | 59.20924550294876 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |

<a id="run-0d90dce32756d5061c519412"></a>

**run-0d90dce32756d5061c519412** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:er:8; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Beautiful Mermaid | 1 | 1.1.3 | 215.13417650014162 | 30 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-e587ef9fb1605ff10e13287e"></a>

**run-e587ef9fb1605ff10e13287e** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:er:8; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-f4401525a0e84794cdeb778d"></a>

**run-f4401525a0e84794cdeb778d** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:er:8; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Beautiful Mermaid | 1 | 1.1.3 | 8.158384997397661 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-70489725848eaf1d3d7e5982"></a>

**run-70489725848eaf1d3d7e5982** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:er:32; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

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

<a id="run-b0751bf07ca54a432793f859"></a>

**run-b0751bf07ca54a432793f859** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:er:32; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| emtyty/merslim | 1 | 0.2.3 | 14.828199498355389 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Agentic Mermaid | 2 | 0.5.1 | 62.27999649941921 | 186 | complete for this case | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-a7c8dbea1e5f5145b63b6d50"></a>

**run-a7c8dbea1e5f5145b63b6d50** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:er:32; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 5.14614300057292 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-19cf0d4e81adb4067f636704"></a>

**run-19cf0d4e81adb4067f636704** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:er:128; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 25.396026503294706 | 30 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Ondine | 2 | 0.0.3 | 55.380910504609346 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| emtyty/merslim | 3 | 0.2.3 | 161.90987350046635 | 30 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 0 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-058ab6567b9a3c8d59a5ecb7"></a>

**run-058ab6567b9a3c8d59a5ecb7** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:er:128; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 17.301233500242233 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| emtyty/merslim | 2 | 0.2.3 | 63.392276003956795 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Zombie Mermaid | 3 | 5.11.2 | 80.38674299791455 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 0 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-e97cffc64c0063360c04ec1c"></a>

**run-e97cffc64c0063360c04ec1c** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:er:128; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.12.0 | 2.7306529991328716 | 186 | complete for this case | calibrated | 2026-10-30T11:25:08.707Z |
| Latias94/merman | 2 | 0.9.2 | 17.263363998383284 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 0 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-ebfd1b976c72653943b6e6ba"></a>

**run-ebfd1b976c72653943b6e6ba** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:architecture:8; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 31.002699498087168 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 2 | 0.5.1 | 501.9576765038073 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-1309fae22d49880237afa39c"></a>

**run-1309fae22d49880237afa39c** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:architecture:8; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| emtyty/merslim | 1 | 0.2.3 | 4.43639650195837 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-e414f95401f28f90f772a202"></a>

**run-e414f95401f28f90f772a202** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:architecture:8; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 2.475093998014927 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| emtyty/merslim | 2 | 0.2.3 | 4.070713497698307 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-36b67593e246f1a06cd22602"></a>

**run-36b67593e246f1a06cd22602** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:architecture:32; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pele | 1 | 1.12.0 | 14.508934997022152 | 30 | partial | calibrated | 2026-10-30T11:25:08.707Z |
| Ondine | 2 | 0.0.3 | 32.34427749738097 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 3 | 0.5.1 | 646.355710003525 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-af213cca6f625c982767317e"></a>

**run-af213cca6f625c982767317e** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:architecture:32; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.861085000137488 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Latias94/merman | 2 | 0.9.2 | 7.152949497103691 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| emtyty/merslim | 3 | 0.2.3 | 15.52954450249672 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-1eaf34643543b23c41af0efa"></a>

**run-1eaf34643543b23c41af0efa** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:architecture:32; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.4299700014293194 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Latias94/merman | 2 | 0.9.2 | 7.148344501852989 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| emtyty/merslim | 3 | 0.2.3 | 14.387166500091553 | 186 | partial | calibrated | 2026-10-30T09:29:12.603Z |
| Zombie Mermaid | 4 | 5.11.2 | 22.128933001309633 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-060c898a46861ea3fb7c97e8"></a>

**run-060c898a46861ea3fb7c97e8** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:architecture:128; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-963e9b88ffcf2c6259e26aa2"></a>

**run-963e9b88ffcf2c6259e26aa2** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:architecture:128; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-b5222e1fc4e0e038fbebdb7a"></a>

**run-b5222e1fc4e0e038fbebdb7a** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

scaling:architecture:128; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 212.91976500302553 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-63dc96bd36625bef2a272d6e"></a>

**run-63dc96bd36625bef2a272d6e** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:label-edit; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KlangHaus/vitepress-plugin-diagram | 1 | 0.3.2 | 6.7829005010426044 | 30 | partial | calibrated | 2026-10-30T09:38:07.169Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | 2 | 0.1.4 | 7.356731001287699 | 30 | partial | calibrated | 2026-10-30T11:37:00.901Z |
| Pele | 3 | 1.12.0 | 18.73209799826145 | 30 | complete for this case | calibrated | 2026-10-30T11:25:08.707Z |
| Agentic Mermaid | 4 | 0.5.1 | 145.2243175022304 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-70cdc9735cc7ceb438ac4958"></a>

**run-70cdc9735cc7ceb438ac4958** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:label-edit; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Zombie Mermaid | 1 | 5.11.2 | 5.62822600081563 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-78a248711835956c2a439ce6"></a>

**run-78a248711835956c2a439ce6** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:label-edit; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 2.2745299972593784 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Beautiful Mermaid | 2 | 1.1.3 | 4.780586499720812 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | 3 | 0.5.1 | 7.5227870009839535 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-61aceae1bf7185af71ae33b2"></a>

**run-61aceae1bf7185af71ae33b2** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:label-edit; warm-label-edit. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Zombie Mermaid | 1 | 5.11.2 | 3.3228904977440834 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-7c141bb2ded2f9c91b1566e6"></a>

**run-7c141bb2ded2f9c91b1566e6** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:parallel-reciprocal; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 48.354073502123356 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-cd7004a49c1518221573548c"></a>

**run-cd7004a49c1518221573548c** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:parallel-reciprocal; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | 1 | 0.5.1 | 2.6405677516013384 | 186 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | 2 | 1.1.3 | 8.580634500831366 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-039058132563b60884483388"></a>

**run-039058132563b60884483388** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:parallel-reciprocal; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 0.21559069976210593 | 186 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 186 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-7c7c80cf409956d9dc11c0fb"></a>

**run-7c7c80cf409956d9dc11c0fb** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:nested-groups; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic Mermaid | — | 0.5.1 | withheld | 30 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | — | 1.1.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-965a744f30d6bdb66bcc5cf9"></a>

**run-965a744f30d6bdb66bcc5cf9** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:nested-groups; warm-repeat. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Latias94/merman | 1 | 0.9.2 | 2.592188999056816 | 186 | partial | calibrated | 2026-10-30T10:07:26.363Z |
| Zombie Mermaid | 2 | 5.11.2 | 11.526700999587774 | 186 | partial | calibrated | 2026-10-30T08:29:41.608Z |
| Beautiful Mermaid | 3 | 1.1.3 | 12.791041001677513 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |

<a id="run-acd6dbc69fbf7640a6b4ee00"></a>

**run-acd6dbc69fbf7640a6b4ee00** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:nested-groups; warm-new-source. Comment-varied source bytes with the same semantic graph; cache-key diagnostic, not proof of uncached layout. Distribution of per-call means from bounded adaptive batches; p95 of sample means is not a single-call tail latency. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Beautiful Mermaid | 1 | 1.1.3 | 9.31563350185752 | 186 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| Agentic Mermaid | — | 0.5.1 | withheld | 186 | partial | uncalibrated | 2026-10-30T07:38:46.927Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Ondine | — | 0.0.3 | withheld | 186 | partial | uncalibrated | 2026-10-30T05:55:32.434Z |
| Pele | — | 1.12.0 | withheld | 186 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 0 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 186 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

<a id="run-dffa6e9296df041be0e42400"></a>

**run-dffa6e9296df041be0e42400** · 2026-10-30 · unit: ms · [evidence](https://github.com/adewale/trident/tree/7d8c71a8a1307ba2834b803be24cee0270591ccf/evidence/1/report.json)

adversarial:wide-unicode; first-use. First API call in each fresh process; module import and declared factory setup excluded. SVG-return cost requires output admission and A/A calibration; declared semantic scope is reported separately. Unqualified latency is withheld.

Ranked by **Median ms**, lowest first. Equal values share a rank; unavailable values are unranked. Timing ranks describe the displayed samples and retain their qualification limits.

| Project | Rank | Version | Median ms | Samples | Declared semantics | Output calibration | Measured |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ondine | 1 | 0.0.3 | 50.929643496870995 | 30 | partial | calibrated | 2026-10-30T05:55:32.434Z |
| Agentic Mermaid | 2 | 0.5.1 | 139.4860025011003 | 30 | partial | calibrated | 2026-10-30T07:38:46.927Z |
| Beautiful Mermaid | 3 | 1.1.3 | 198.30049600079656 | 30 | partial | calibrated | 2026-10-30T10:46:37.723Z |
| crafter-station/mermaid | — | 0.0.3 | withheld | 0 | partial | uncalibrated | 2026-10-30T09:06:50.369Z |
| emtyty/merslim | — | 0.2.3 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:29:12.603Z |
| KlangHaus/vitepress-plugin-diagram | — | 0.3.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T09:38:07.169Z |
| Latias94/merman | — | 0.9.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T10:07:26.363Z |
| Pele | — | 1.12.0 | withheld | 30 | complete for this case | uncalibrated | 2026-10-30T11:25:08.707Z |
| sandyyst/dsh-plugin-mermaid-gb-svg | — | 0.1.4 | withheld | 30 | partial | uncalibrated | 2026-10-30T11:37:00.901Z |
| Zombie Mermaid | — | 5.11.2 | withheld | 30 | partial | uncalibrated | 2026-10-30T08:29:41.608Z |

