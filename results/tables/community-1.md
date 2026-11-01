# Terminal Rendering · part 1

[Ecosystem overview](../../RESULTS.md) · [All parts](community.md)

<a id="run-f713bed5d1748b27fd042e31"></a>

**run-f713bed5d1748b27fd042e31** · 2026-11-01 · unit: terminal input cases · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Full planned terminal drawing corpus, retaining unmeasured and unreviewed inputs. Corpus: 116 drawings from 120 selected source inputs in pinned terminal-project research, without selection on renderer outcomes. Any authored adaptations have separate content identities and independent source review. 1 source diagnostics are retained separately and receive no drawing score. Invalid-source controls are separate from drawing accuracy. Source/review hashes and all origins remain in the owning receipt. Ranks order verified correct counts only; unknown work prevents a complete accuracy claim. Mermaid source reference is unscored; no speed or aesthetics score.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked.

Ranks order verified correct counts once an outcome is resolved; observed zero remains ranked and fully unresolved rows are unranked. Observer coverage counts drawing and format verdicts. Correctness bounds include unresolved cases; overlapping bounds establish no accuracy winner. Unsupported inputs and proven renderer failures remain explicit non-successes on this corpus.

Comparisons claim superiority only when correctness bounds are disjoint; otherwise they describe verified-count differences. Mermaid has no terminal output; Mermaid ASCII is the terminal baseline.

| Project | Verified-count rank | Version | Correct | Incorrect drawing | Invalid format | Unsupported | Renderer failure | Unassessed | Unrun | Harness failure | Planned | Observer coverage (%) | Correctness lower (%) | Correctness upper (%) | Measured | vs Mermaid ASCII | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Termaid | 1 | 0.10.0 | 65 | 33 | 0 | 0 | 0 | 18 | 0 | 0 | 116 | 84.5 | 56.0 | 71.6 | 2026-11-01T14:29:58.883195Z | More verified (+23); bounds overlap |  |
| Zombie Mermaid | 2 | 5.10.2 | 60 | 12 | 0 | 0 | 0 | 44 | 0 | 0 | 116 | 62.1 | 51.7 | 89.7 | 2026-11-01T14:29:19.193Z | More verified (+18); bounds overlap |  |
| Agentic Mermaid | 3 | 0.4.1 | 58 | 16 | 0 | 0 | 0 | 42 | 0 | 0 | 116 | 63.8 | 50.0 | 86.2 | 2026-11-01T14:29:14.153Z | More verified (+16); bounds overlap |  |
| Loom renderer | 4 | 0.10.0 | 43 | 27 | 0 | 0 | 0 | 46 | 0 | 0 | 116 | 60.3 | 37.1 | 76.7 | 2026-11-01T14:32:15.801Z | More verified (+1); bounds overlap |  |
| Mermaid ASCII | 5 | 1.6.1 | 42 | 24 | 0 | 0 | 0 | 50 | 0 | 0 | 116 | 56.9 | 36.2 | 79.3 | 2026-11-01T14:29:35.499Z | Baseline |  |
| MermaidText | 6 | git-a6b0c7657b94 | 40 | 24 | 0 | 0 | 0 | 52 | 0 | 0 | 116 | 55.2 | 34.5 | 79.3 | 2026-11-01T14:32:40.995Z | Fewer verified (-2); bounds overlap |  |
| Beautiful Mermaid | 7 | 1.1.3 | 35 | 23 | 0 | 0 | 0 | 58 | 0 | 0 | 116 | 50.0 | 30.2 | 80.2 | 2026-11-01T14:30:04.267Z | Fewer verified (-7); bounds overlap |  |
| Ondine | 8 | 0.0.3 | 31 | 26 | 0 | 0 | 0 | 59 | 0 | 0 | 116 | 49.1 | 26.7 | 77.6 | 2026-11-01T14:29:05.470Z | Fewer verified (-11); bounds overlap |  |
| ASCII Mermaid | 9 | 0.1.0 | 28 | 38 | 0 | 0 | 0 | 50 | 0 | 0 | 116 | 56.9 | 24.1 | 67.2 | 2026-11-01T14:32:20.022Z | Fewer verified (-14); bounds overlap |  |
| OpenCode Merman | 10 | 2.0.26 | 20 | 33 | 0 | 0 | 0 | 63 | 0 | 0 | 116 | 45.7 | 17.2 | 71.6 | 2026-11-01T14:29:46.058Z | Fewer verified (-22); bounds overlap |  |
| Figurehead | 11 | v0.4.3 | 18 | 28 | 0 | 0 | 0 | 70 | 0 | 0 | 116 | 39.7 | 15.5 | 75.9 | 2026-11-01T14:31:52.214Z | Fewer verified (-24); bounds overlap |  |
| Kitlangton Merman | 12 | 0.2.1 | 17 | 32 | 0 | 0 | 0 | 67 | 0 | 0 | 116 | 42.2 | 14.7 | 72.4 | 2026-11-01T14:30:01.505Z | Fewer verified (-25); bounds overlap |  |
| Merslim | 13 | 0.2.3 | 16 | 48 | 0 | 0 | 0 | 52 | 0 | 0 | 116 | 55.2 | 13.8 | 58.6 | 2026-11-01T14:29:52.222Z | Fewer verified (-26); bounds overlap |  |
| MermaidTUI | 14 | 0.0.6 | 7 | 6 | 0 | 0 | 0 | 103 | 0 | 0 | 116 | 11.2 | 6.0 | 94.8 | 2026-11-01T14:31:56.373Z | Fewer verified (-35); bounds overlap |  |
| Frankenmermaid | 15 | 0.4.0 | 0 | 1 | 0 | 0 | 0 | 115 | 0 | 0 | 116 | 0.9 | 0.0 | 99.1 | 2026-11-01T14:28:13.951Z | Fewer verified (-42); bounds overlap |  |
| Grok renderer | 15 | git-2bdd1d6a6369 | 0 | 24 | 0 | 0 | 0 | 92 | 0 | 0 | 116 | 20.7 | 0.0 | 79.3 | 2026-11-01T14:32:11.278Z | Fewer verified (-42); bounds overlap |  |
| Crafter Mermaid | — | 0.0.3 | 0 | 0 | 0 | 0 | 0 | 116 | 0 | 0 | 116 | 0.0 | 0.0 | 100.0 | Unknown; recovered text, see receipt | Fewer verified (-42); bounds overlap | No verified terminal drawing observations |
| Latias Merman | — | 0.9.2 | 0 | 0 | 0 | 0 | 0 | 116 | 0 | 0 | 116 | 0.0 | 0.0 | 100.0 | Unknown; recovered text, see receipt | Fewer verified (-42); bounds overlap | No verified terminal drawing observations |

<a id="run-cfd32885f5059ffe15d60844"></a>

**run-cfd32885f5059ffe15d60844** · 2026-11-01 · unit: invalid-source controls · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Independently invalid sources in the full terminal inventory, checked for typed public grammar rejection. Process exits, missing ink and transport failures remain unknown. This is separate from drawing correctness and supplies no speed score.

Ranked by **Correct**, highest first. Equal values share a rank; unavailable values are unranked.

Comparisons use **Correct** counts. “More verified” and “Fewer verified” mean accuracy is unresolved because either project has unknown outcomes. Mermaid has no terminal output; Mermaid ASCII is the terminal baseline.

| Project | Rank | Version | Correct | Incorrect | Unknown | Planned | vs Mermaid ASCII | Ranking note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mermaid ASCII | 1 | 1.6.1 | 2 | 0 | 2 | 4 | Baseline |  |
| Agentic Mermaid | — | 0.4.1 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| ASCII Mermaid | — | 0.1.0 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Beautiful Mermaid | — | 1.1.3 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Crafter Mermaid | — | 0.0.3 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Figurehead | 2 | v0.4.3 | 0 | 1 | 3 | 4 | Fewer verified (-2); accuracy unresolved |  |
| Frankenmermaid | — | 0.4.0 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Grok renderer | — | git-2bdd1d6a6369 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Kitlangton Merman | — | 0.2.1 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Latias Merman | — | 0.9.2 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Loom renderer | — | 0.10.0 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| MermaidText | — | git-a6b0c7657b94 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| MermaidTUI | — | 0.0.6 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Merslim | — | 0.2.3 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Ondine | — | 0.0.3 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| OpenCode Merman | — | 2.0.26 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
| Termaid | 2 | 0.10.0 | 0 | 4 | 0 | 4 | Fewer verified (-2); accuracy unresolved |  |
| Zombie Mermaid | — | 5.10.2 | 0 | 0 | 4 | 4 | Unresolved | No typed source-rejection observations |
<a id="attempt-21fb994abe97b0276a97d05e"></a>

### Agentic Mermaid: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.4.1 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 58 | 16 | 0 | 42 | {} | 116 |
| 0.4.1 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-399ed20a19b54b0f0a1a533f"></a>

### OpenCode Merman: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2.0.26 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 20 | 33 | 0 | 63 | {} | 116 |
| 2.0.26 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-46a93f81a3dfc4b10757e115"></a>

### Ondine: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.0.3 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 31 | 26 | 0 | 59 | {} | 116 |
| 0.0.3 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-4b02747221fb7523a76e5ad9"></a>

### Mermaid ASCII: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.6.1 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 42 | 24 | 0 | 50 | {} | 116 |
| 1.6.1 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 2 | 0 | 0 | 2 | {} | 4 |

<a id="attempt-4d52b86f0377dc325319af42"></a>

### ASCII Mermaid: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.1.0 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 28 | 38 | 0 | 50 | {} | 116 |
| 0.1.0 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-5b76c98356d27f8e4a5d584e"></a>

### Beautiful Mermaid: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1.3 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 35 | 23 | 0 | 58 | {} | 116 |
| 1.1.3 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-5e844782349716584850e71b"></a>

### Figurehead: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| v0.4.3 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 18 | 28 | 0 | 70 | {} | 116 |
| v0.4.3 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 1 | 0 | 3 | {} | 4 |

<a id="attempt-6b28887f31203b8832b7d54f"></a>

### Latias Merman: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **blocked** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.9.2 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 0 | 0 | 0 | 116 | {} | 116 |
| 0.9.2 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-6e6ce3fa05e7c899b0d03f1c"></a>

### Termaid: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.10.0 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 65 | 33 | 0 | 18 | {} | 116 |
| 0.10.0 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 4 | 0 | 0 | {} | 4 |

<a id="attempt-728775342450b6ecaa702c18"></a>

### Frankenmermaid: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.4.0 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 0 | 1 | 0 | 115 | {} | 116 |
| 0.4.0 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-77d0d918424e0e01e6bb5704"></a>

### Merslim: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.2.3 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 16 | 48 | 0 | 52 | {} | 116 |
| 0.2.3 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-7d132dfb6ce9d8fffe4887e7"></a>

### Grok renderer: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| git-2bdd1d6a6369 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 0 | 24 | 0 | 92 | {} | 116 |
| git-2bdd1d6a6369 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-84516cba1a27b2c4e6c55e2e"></a>

### Crafter Mermaid: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **blocked** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.0.3 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 0 | 0 | 0 | 116 | {} | 116 |
| 0.0.3 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-99fdbeed6c7a86c9c30f7947"></a>

### Kitlangton Merman: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.2.1 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 17 | 32 | 0 | 67 | {} | 116 |
| 0.2.1 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-b6be17b97103e91145c45655"></a>

### MermaidText: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| git-a6b0c7657b94 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 40 | 24 | 0 | 52 | {} | 116 |
| git-a6b0c7657b94 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-b83ac09a010b4ebffd4f477e"></a>

### Zombie Mermaid: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5.10.2 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 60 | 12 | 0 | 44 | {} | 116 |
| 5.10.2 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-d46e032bd2316d077c69198b"></a>

### Loom renderer: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.10.0 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 43 | 27 | 0 | 46 | {} | 116 |
| 0.10.0 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

<a id="attempt-dde8ba9ff1867cc35a183719"></a>

### MermaidTUI: Terminal Rendering (terminal-project-corpus-v3)

Campaign invocation: 2026-11-01T14:28:03.387Z → 2026-11-01T14:40:31.374Z · **failed** · [evidence](https://raw.githubusercontent.com/adewale/trident/2c464366c5f05c01b29e41993a64e1eddb77be58/evidence/3/report.json)

Campaign process status: blocked; Recorded observation dispositions; process completion does not establish benchmark qualification.; Owning raw results are in the downloadable archive at evidence/3/terminal/

| Version / artifact role | Interface / runtime | Format / operation | Mode / round | Distinct case IDs | Passed observations | Failed | Unsupported | Blocked | Other dispositions | Recorded observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.0.6 / default | terminal:cell-grid / retained terminal text | terminal / graph-correctness | terminal-project-corpus-v3 / not round-based | 116 | 7 | 6 | 0 | 103 | {} | 116 |
| 0.0.6 / default | terminal:public-rejection / retained typed public outcome | terminal / typed-source-rejection | terminal-project-corpus-v3 / not round-based | 4 | 0 | 0 | 0 | 4 | {} | 4 |

