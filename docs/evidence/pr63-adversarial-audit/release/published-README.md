# Trident benchmark evidence

Published 2026-10-30T02:57:40.270Z. Measurement dates below belong to the original campaigns.

Suite evidence index. Comparative result tables stack-rank their named measure within compatible cohorts. Coverage, output correctness, optional model evidence, time and resources have different units. Missing adapters and unavailable observers receive no pass credit. No global winner or validated production holdout is claimed.

This local index links the original evidence in place. It is not a self-contained web publication; use --copy-evidence to create a portable evidence bundle.

| Campaign | Measured from | Last recorded update | Profile / rounds | Projects | Completion |
|---|---|---|---|---:|---|
| [1](../source/report.json) | 2026-10-30T02:57:30.204Z | 2026-10-30T02:57:40.253Z | smoke / 1 | 2 | collection completed; qualification may fail |

## Campaign 1

Selected projects: AlexanderGrooff/mermaid-ascii, obsidianmd/pele.

| Suite | Project scope | Status / disposition | Counts and limits | Owning evidence |
|---|---|---|---|---|
| community | AlexanderGrooff/mermaid-ascii, obsidianmd/pele | passed | {"not-applicable":8,"passed":40}; Bounded release smoke; six legacy cases, one common flowchart and two invalid controls. No deep coverage or qualified timing claim.; SVG XML/canvas and authored-label checks do not establish complete semantic identity, multiplicity, route geometry or visual fidelity. Dedicated family feature assertions remain separate.; Core repeat cases calibrate to20ms/256iterations. With communityCoverageOnce, feature-corpus inputs qualify one actual call in round1 without warm/repeated speed samples; later rounds contain core only. These protocols never share a speed aggregate. API clocks exclude validation/cleanup; internal DOM measurement belongs to the API. JS heap excludes native/WASM/process memory.; Supplemental fixed-core CLI comparison only; deep feature coverage is unmeasured for these variants.; Rolling per-project records: original observation dates are retained in project-update-manifest.json. This is not a paired same-session comparison.; Bounded release smoke; six legacy cases, one common flowchart and two invalid controls. No deep coverage or qualified timing claim.; SVG XML/canvas and authored-label checks do not establish complete semantic identity, multiplicity, route geometry or visual fidelity. Dedicated family feature assertions remain separate.; Core repeat cases calibrate to20ms/256iterations. With communityCoverageOnce, feature-corpus inputs qualify one actual call in round1 without warm/repeated speed samples; later rounds contain core only. These protocols never share a speed aggregate. API clocks exclude validation/cleanup; internal DOM measurement belongs to the API. JS heap excludes native/WASM/process memory.; Supplemental fixed-core CLI comparison only; deep feature coverage is unmeasured for these variants.; Rolling per-project records: original observation dates are retained in project-update-manifest.json. This is not a paired same-session comparison. | [owning directory](../source/community/) |

### community observations

Counts are recorded observations within each public surface/mode/round. Unexecuted inputs and planned denominators remain in the owning inventory; no acceptance percentage is inferred.

| Project | Version / artifact role | Surface / runtime | Format / operation | Mode / round | Distinct case IDs | Recorded observations | Dispositions |
|---|---|---|---|---|---:|---:|---|
| AlexanderGrooff/mermaid-ascii | 1.6.1 / default | browser:public-api / chromium | svg / capability | capability / not round-based | 1 | 1 | {"not-applicable":1} |
| AlexanderGrooff/mermaid-ascii | 1.6.1 / default | cli:end-to-end / linux-x64 public native CLI | terminal / family-support | family-support-probe / 1 | 2 | 2 | {"passed":2} |
| AlexanderGrooff/mermaid-ascii | 1.6.1 / default | cli:end-to-end / linux-x64 public native CLI | terminal / render | feature-corpus-qualification / 1 | 1 | 1 | {"passed":1} |
| AlexanderGrooff/mermaid-ascii | 1.6.1 / default | cli:end-to-end / linux-x64 public native CLI | terminal / render | fresh-process / 1 | 3 | 3 | {"passed":3} |
| AlexanderGrooff/mermaid-ascii | 1.6.1 / public-cli | cli:end-to-end / linux-x64 public native CLI | terminal / render | fresh-process / 1 | 3 | 3 | {"passed":3} |
| AlexanderGrooff/mermaid-ascii | 1.6.1 / public-cli | cli:end-to-end / linux-x64 public native CLI | terminal / resource-diagnostic | instrumented-resource-only / not round-based | 3 | 3 | {"passed":3} |
| AlexanderGrooff/mermaid-ascii | 1.6.1 / default | node:public-api / Node | terminal / render | feature-corpus-attempt / 1 | 2 | 2 | {"not-applicable":2} |
| obsidianmd/pele | 1.12.0 / default | browser:public-api / chromium-v8 | svg / memory | after-round-1 / 1 | 1 | 1 | {"passed":1} |
| obsidianmd/pele | 1.12.0 / default | browser:public-api / chromium-processes | svg / process-memory | after-round-1 / 1 | 1 | 1 | {"passed":1} |
| obsidianmd/pele | 1.12.0 / default | browser:public-api / chromium | svg / load-and-initialize | cold-round-1 / not round-based | 1 | 1 | {"passed":1} |
| obsidianmd/pele | 1.12.0 / default | browser:public-api / chromium | svg / render | core-api-repeat / 1 | 6 | 6 | {"passed":6} |
| obsidianmd/pele | 1.12.0 / default | browser:public-api / chromium | svg / family-support | family-support-probe / 1 | 5 | 5 | {"passed":5} |
| obsidianmd/pele | 1.12.0 / default | browser:public-api / chromium | svg / render | feature-corpus-attempt / 0 | 2 | 2 | {"not-applicable":2} |
| obsidianmd/pele | 1.12.0 / default | browser:public-api / chromium | svg / render | feature-corpus-qualification / 1 | 1 | 1 | {"passed":1} |
| obsidianmd/pele | 1.12.0 / default | browser:public-api / chromium | js-wasm-fonts / delivery | round-1 / 1 | 1 | 1 | {"passed":1} |
| obsidianmd/pele | 1.12.0 / default | node:public-api / Node 24.19.0 | svg / render | core-api-repeat / 1 | 6 | 6 | {"passed":6} |
| obsidianmd/pele | 1.12.0 / default | node:public-api / Node 24.19.0 | svg / family-support | family-support-probe / 1 | 5 | 5 | {"passed":5} |
| obsidianmd/pele | 1.12.0 / default | node:public-api / Node | svg / render | feature-corpus-attempt / 1 | 2 | 2 | {"not-applicable":2} |
| obsidianmd/pele | 1.12.0 / default | node:public-api / Node 24.19.0 | svg / render | feature-corpus-qualification / 1 | 1 | 1 | {"passed":1} |
| unattributed | 1.12.0 / default | cli:end-to-end / unmeasured | mixed / capability | capability / not round-based | 1 | 1 | {"not-applicable":1} |

Raw samples, input inventories, versions and failure outputs remain in the owning evidence; no denominator or speed comparison is reconstructed from process completion.
