# All community surface scorecards

[Campaign and qualifications](README.md) · [All benchmark scorecards](../SCORECARDS.md)

These are the 42 recorded surface/output rows from the original 27 October host cohort. Each section retains a different public boundary; costs are never ranked across sections. Candidate builds retain their qualifiers and are not additional independent projects. The separate [addition cohort](additions/README.md) has its own full surface tables and fresh controls.

Raw admission is passed / (passed + failed) in supported families. Blocked observations are shown separately; unsupported families are coverage gaps. Accepted-input format/label checks apply only to SVG and terminal output. Parser and PNG admission do not certify native models, rendered text or painted fidelity. First-call and repeated-source costs are sums of per-input medians on the six fixed-core inputs, only when that complete portfolio qualifies; a dash is unavailable, never zero.

## browser:public-api / svg

| Build | Families | Raw admission | Blocked | Accepted-input format + labels | First-call core | Repeated-source core |
|---|---:|---:|---:|---:|---:|---:|
| Mermaid reference 12.2.0 | 25/25 | 887/945 (93.9%) | 0 | 868/915 (94.9%) | 2,983.5 ms | 2,532.5 ms |
| Pele 1.9.0 | 24/25 | 906/944 (96.0%) | 0 | 887/914 (97.0%) | 58.5 ms | 4.6 ms |
| Mermaid Dart 0.3.2 | 24/25 | 806/944 (85.4%) | 0 | 793/914 (86.8%) | 82.1 ms | 21.9 ms |
| Agentic Mermaid 0.4.1 | 15/25 | 632/732 (86.3%) | 0 | 624/711 (87.8%) | 1,312.9 ms | 949.0 ms |
| Agentic Mermaid 0.4.2 (earlier main) | 23/25 | 912/932 (97.9%) | 0 | 888/902 (98.4%) | 739.9 ms | 84.4 ms |
| Agentic Mermaid 0.4.2 (PR #487) | 23/25 | 911/932 (97.7%) | 0 | 887/902 (98.3%) | 758.1 ms | 109.6 ms |
| Agentic Mermaid 0.4.2 (PR #449) | 23/25 | 912/932 (97.9%) | 0 | 888/902 (98.4%) | 769.0 ms | 81.2 ms |
| Agentic Mermaid 0.4.2 (PR #393) | 16/25 | 709/745 (95.2%) | 0 | 700/724 (96.7%) | 1,323.0 ms | 974.1 ms |
| Agentic Mermaid 0.4.2 (PR #374) | 17/25 | 716/750 (95.5%) | 0 | 707/729 (97.0%) | 905.3 ms | 541.1 ms |
| Agentic Mermaid 0.4.2 (main / #532) | 23/25 | 912/932 (97.9%) | 0 | 888/902 (98.4%) | 711.5 ms | 74.1 ms |

## cli:end-to-end / terminal

| Build | Families | Raw admission | Blocked | Accepted-input format + labels | First-call core | Repeated-source core |
|---|---:|---:|---:|---:|---:|---:|
| Mermaid ASCII 1.6.1 | 3/25 | 234/395 (59.2%) | 0 | 234/392 (59.7%) | 210.3 ms | 209.2 ms |

## node:public-api / parse

| Build | Families | Raw admission | Blocked | Accepted-input format + labels | First-call core | Repeated-source core |
|---|---:|---:|---:|---:|---:|---:|
| Agentic Mermaid 0.4.1 | 15/25 | 616/762 (80.8%) | 0 | not applicable | 33.7 ms | 5.6 ms |
| Agentic Mermaid 0.4.2 (earlier main) | 23/25 | 873/962 (90.7%) | 0 | not applicable | 72.0 ms | 13.5 ms |
| Agentic Mermaid 0.4.2 (PR #487) | 23/25 | 873/962 (90.7%) | 0 | not applicable | 68.3 ms | 12.0 ms |
| Agentic Mermaid 0.4.2 (PR #449) | 23/25 | 873/962 (90.7%) | 0 | not applicable | 69.9 ms | 12.2 ms |
| Agentic Mermaid 0.4.2 (PR #393) | 16/25 | 671/775 (86.6%) | 0 | not applicable | 45.8 ms | 7.4 ms |
| Agentic Mermaid 0.4.2 (PR #374) | 17/25 | 675/780 (86.5%) | 0 | not applicable | 53.8 ms | 12.0 ms |
| Agentic Mermaid 0.4.2 (main / #532) | 23/25 | 873/962 (90.7%) | 0 | not applicable | 73.6 ms | 12.6 ms |

## node:public-api / png

| Build | Families | Raw admission | Blocked | Accepted-input format + labels | First-call core | Repeated-source core |
|---|---:|---:|---:|---:|---:|---:|
| Agentic Mermaid 0.4.1 | 15/25 | 685/732 (93.6%) | 0 | not applicable | — | — |
| Agentic Mermaid 0.4.2 (earlier main) | 23/25 | 912/932 (97.9%) | 0 | not applicable | — | — |
| Agentic Mermaid 0.4.2 (PR #487) | 23/25 | 911/932 (97.7%) | 0 | not applicable | — | — |
| Agentic Mermaid 0.4.2 (PR #449) | 23/25 | 912/932 (97.9%) | 0 | not applicable | — | — |
| Agentic Mermaid 0.4.2 (PR #393) | 16/25 | 711/745 (95.4%) | 0 | not applicable | — | — |
| Agentic Mermaid 0.4.2 (PR #374) | 17/25 | 716/750 (95.5%) | 0 | not applicable | — | — |
| Agentic Mermaid 0.4.2 (main / #532) | 23/25 | 912/932 (97.9%) | 0 | not applicable | — | — |

## node:public-api / svg

| Build | Families | Raw admission | Blocked | Accepted-input format + labels | First-call core | Repeated-source core |
|---|---:|---:|---:|---:|---:|---:|
| Pele 1.9.0 | 24/25 | 906/944 (96.0%) | 0 | 887/914 (97.0%) | 40.2 ms | 4.0 ms |
| Mermaid Dart 0.3.2 | 24/25 | 806/944 (85.4%) | 0 | 793/914 (86.8%) | 89.3 ms | 29.6 ms |
| Agentic Mermaid 0.4.1 | 15/25 | 632/732 (86.3%) | 0 | 624/711 (87.8%) | 1,664.7 ms | 1,349.1 ms |
| Agentic Mermaid 0.4.2 (earlier main) | 23/25 | 912/932 (97.9%) | 0 | 888/902 (98.4%) | 792.7 ms | 65.6 ms |
| Agentic Mermaid 0.4.2 (PR #487) | 23/25 | 911/932 (97.7%) | 0 | 887/902 (98.3%) | 821.2 ms | 100.8 ms |
| Agentic Mermaid 0.4.2 (PR #449) | 23/25 | 912/932 (97.9%) | 0 | 888/902 (98.4%) | 897.7 ms | 77.1 ms |
| Agentic Mermaid 0.4.2 (PR #393) | 16/25 | 709/745 (95.2%) | 0 | 700/724 (96.7%) | 1,628.3 ms | 1,358.7 ms |
| Agentic Mermaid 0.4.2 (PR #374) | 17/25 | 716/750 (95.5%) | 0 | 707/729 (97.0%) | 961.4 ms | 576.6 ms |
| Agentic Mermaid 0.4.2 (main / #532) | 23/25 | 912/932 (97.9%) | 0 | 888/902 (98.4%) | 830.1 ms | 66.3 ms |

## node:public-api / terminal

| Build | Families | Raw admission | Blocked | Accepted-input format + labels | First-call core | Repeated-source core |
|---|---:|---:|---:|---:|---:|---:|
| Agentic Mermaid 0.4.1 | 15/25 | 570/732 (77.9%) | 0 | 564/711 (79.3%) | 552.6 ms | 315.0 ms |
| Agentic Mermaid 0.4.2 (earlier main) | 23/25 | 869/932 (93.2%) | 0 | 853/902 (94.6%) | 419.7 ms | 278.5 ms |
| Agentic Mermaid 0.4.2 (PR #487) | 23/25 | 869/932 (93.2%) | 0 | 853/902 (94.6%) | 132.8 ms | 52.4 ms |
| Agentic Mermaid 0.4.2 (PR #449) | 23/25 | 869/932 (93.2%) | 0 | 853/902 (94.6%) | 438.7 ms | 290.4 ms |
| Agentic Mermaid 0.4.2 (PR #393) | 16/25 | 624/745 (83.8%) | 0 | 617/724 (85.2%) | 556.5 ms | 285.9 ms |
| Agentic Mermaid 0.4.2 (PR #374) | 17/25 | 693/750 (92.4%) | 0 | 684/729 (93.8%) | 134.2 ms | 58.7 ms |
| Agentic Mermaid 0.4.2 (main / #532) | 23/25 | 869/932 (93.2%) | 0 | 853/902 (94.6%) | 437.7 ms | 275.8 ms |

## node:public-parse-validation / parse

| Build | Families | Raw admission | Blocked | Accepted-input format + labels | First-call core | Repeated-source core |
|---|---:|---:|---:|---:|---:|---:|
| Mermaid reference 12.2.0 | 24/25 | 965/974 (99.1%) | 0 | not applicable | 875.7 ms | 849.6 ms |

Exact record IDs, artifact/source identities, original dates, oracle caveats and per-family results remain in [comparison.json](comparison.json) and [runs.json](runs.json). Regenerate with `python3 results/review-20261027/plot.py`; this reader starts no benchmark workers.
