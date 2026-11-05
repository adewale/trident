# Pre-campaign version audit

Checked 2026-11-02T14:35:41.361Z. All 27 comparison projects resolved. This preserves the earlier preparation audit. The subsequent measured campaign refreshed and froze selections at **2026-11-02T15:09:38.022Z**, including Agentic Mermaid **0.5.6**. Its [37-component ledger](evidence/benchmark-campaign-2026-11-02/versions.json) records the versions actually selected for the measurements.

Registry current stable latest; latest stable version tag for native releases; current default-branch HEAD for source-only components and repository-hosted distributions. Freeze exact selections before preparation. No fallback to stale artifacts.

| Project | Selected version or revision | Additional rendering distributions |
|---|---|---|
| [1jehuang/mermaid-rs-renderer](https://github.com/1jehuang/mermaid-rs-renderer) | 0.3.1 | native-cli 0.3.1 |
| [adewale/agentic-mermaid](https://registry.npmjs.org/agentic-mermaid) | 0.5.5 | — |
| [AlexanderGrooff/mermaid-ascii](https://github.com/AlexanderGrooff/mermaid-ascii) | 1.6.1 | native-cli 1.6.1 |
| [anomalyco/opencode](https://github.com/anomalyco/opencode) | git-67139d6827af | — |
| [crabtalk/bezel](https://crates.io/api/v1/crates/bezel-mermaid) | 0.2.24 | — |
| [crafter-station/mermaid](https://registry.npmjs.org/%40crafter%2Fmermaid-renderer) | 0.0.3 | — |
| [dfadler/zombie-mermaid](https://registry.npmjs.org/zombie-mermaid) | 5.14.1 | — |
| [Dicklesworthstone/frankenmermaid](https://raw.githubusercontent.com/Dicklesworthstone/frankenmermaid/3d338ff26022e448a26e6a9d5a4127a315d27fe7/pkg/package.json) | 0.4.0 | native-cli 0.4.0 |
| [emtyty/merslim](https://registry.npmjs.org/merslim) | 0.2.3 | — |
| [evangwt/xmermaid](https://registry.npmjs.org/%40evangwt%2Fxmermaid) | 0.4.2 | — |
| [fasouto/termaid](https://pypi.org/pypi/termaid/json) | 0.10.0 | — |
| [kais-radwan/ascii-mermaid](https://github.com/kais-radwan/ascii-mermaid) | git-a91a0c7baec6 | — |
| [kitlangton/merman](https://registry.npmjs.org/%40kitlangton%2Fmerman) | 0.2.1 | — |
| [KlangHaus/vitepress-plugin-diagram](https://registry.npmjs.org/vitepress-plugin-mermaid-diagram) | 0.3.2 | — |
| [Latias94/merman](https://registry.npmjs.org/%40mermanjs%2Fnode) | 0.9.3 native CLI (selected for rendering); npm SDK 0.9.2 | browser-sdk 0.9.2, native-cli 0.9.3 |
| [lukilabs/beautiful-mermaid](https://registry.npmjs.org/beautiful-mermaid) | 1.1.3 | — |
| [mermaid-js/mermaid](https://registry.npmjs.org/mermaid) | 12.2.0 | — |
| [Mootikins/figurehead-rs](https://github.com/Mootikins/figurehead-rs) | 0.4.3 | — |
| [obsidianmd/pele](https://registry.npmjs.org/pele) | 1.13.0 | — |
| [orestesgaolin/mermaid](https://pub.dev/api/packages/mermaid_core) | 0.3.2 | — |
| [pub:mermaid_flutter](https://pub.dev/api/packages/mermaid_flutter) | 0.3.2 | — |
| [sandyyst/dsh-plugin-mermaid-gb-svg](https://registry.npmjs.org/dsh-plugin-mermaid-gb-svg) | 0.1.5 | — |
| [spacedock-dev/mermaidtext](https://github.com/spacedock-dev/mermaidtext) | git-a6b0c7657b94 | — |
| [tariqshams/mermaidtui](https://registry.npmjs.org/mermaidtui) | 0.0.6 | — |
| [wevm/ondine](https://registry.npmjs.org/ondine) | 0.0.3 | — |
| [xai-org/grok-build](https://github.com/xai-org/grok-build) | git-2bdd1d6a6369 | — |
| [Yassimba/loom](https://registry.npmjs.org/%40yassimba%2Fpi-loom-mermaid) | 0.10.0 | — |

## Changes from the previous benchmark preparation

- Agentic Mermaid: 0.4.1 → **0.5.5**.
- Pele: 1.9.0 → **1.13.0**.
- DSH Mermaid GB SVG: 0.1.4 → **0.1.5**.
- Bezel: 0.2.23 → **0.2.24** (the older catalog still recorded 0.2.19).
- Merman native CLI: 0.9.2 → **0.9.3**. The independently published Node/web SDKs remain at 0.9.2. DaveBench selects the newer native rendering release and reports its CLI boundary; an unavailable new CLI cannot fall back to the older SDK.
- Crafter layout and themes: 0.0.3 → **0.0.4**. The renderer remains 0.0.3; parser and CLI remain 0.0.4. The preparation recipe now uses the selected companion versions.
- OpenCode source: `4617210822bd` → **`67139d6827af`**.
- Frankenmermaid remains 0.4.0. Its WASM operand follows the current shipped repository distribution at an immutable revision; its native CLI separately follows the latest stable version tag. An older CLI release must not replace newer shipped WASM files merely because both use the same version number.

## Checks before collection

`bun commands.ts versions --out FRESH_DIRECTORY` resolves all selected projects and writes a frozen `catalog.json` and `versions.json`. Registry failures or a newer native release without an updated archive binding leave selection incomplete. Source-only components and repository-hosted distributions use an immutable current default-branch revision; stable version tags identify native releases.

The simple DaveBench command performs the refresh automatically before preparation. Provided cached artifacts must match the selected package version, source revision and declared pipeline companions. Changed native CLI releases require their archive hashes and bindings to be updated. No version lookup happens inside a timed run.

Merman 0.9.3 Linux x64 was checked against its downloaded public archive (`e93dbf741319190d53107c4277b373d357dcdad3f4f7e50f114a51c9b682109b`), its archive member path and actual `merman-cli 0.9.3` output.

Mermaid’s latest npm release is still 12.2.0; the separately pinned syntax/test oracle and existing measurements keep their original identities. Latest selection for a participant does not silently upgrade the upstream test-suite pin.

The [complete version ledger](evidence/benchmark-versions-2026-11-02.json) includes 37 component selections, registry URLs, npm integrity fields, source revisions and the check time. The historical benchmark results retain their actual measured versions.

The live DaveBench preflight was also exercised with the previous DSH 0.1.4 preparation: it rejected that cached artifact against latest 0.1.5 before starting Chromium or rendering any examples.
