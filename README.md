# Trident #54 qualification replay

Observer: `31a0519660127fca5107da838723c95fc8e3e2b4`.
Renderer: Agentic Mermaid `53319dbb976dae1865e19f7faca49464ee8e8557`.
Authored inputs/backend check: Trident `2401d09f1c73b1c650445858e5640127368b21c6`.
Runtime: Node 24.19.0, Bun 1.4.2, Linux x64.

All 16 Class/ER cases passed output admission, native-model and painted-relationship checks, the renderer's native certificate and strict backend selection. Each case/backend ran in a fresh Node process through `renderMermaidSVGWithReceipt`; the full SVG and every enumerable sidecar were consumed. The independent public parse model was then inspected with qualification observer `portable-owned-topology-v3-agentic-class-er`.

This is an untimed correctness replay. It makes no latency or memory claim and changes no historical result. All 16 SVG hashes match the preceding v2 replay at <https://github.com/adewale/agentic-mermaid/blob/42d7778e78b93a6a279fcc0e3dd8ca87154dc15d/evidence/pr580-limits/qualification-replay.json>.

The summary is `qualification-replay.json`. `replay.tar.gz` contains the raw jobs, SVGs, native models, complete enumerable receipts and detailed qualifications. Tests/logs are under `logs/`.

## Reproduce

Use a local measurement session with the pinned Mermaid oracle prepared as described in Trident's README. CI collection remains disabled. From this directory:

```sh
git clone https://github.com/adewale/trident trident-observer
git -C trident-observer checkout 31a0519660127fca5107da838723c95fc8e3e2b4
(cd trident-observer && bun install --frozen-lockfile)
git clone https://github.com/adewale/agentic-mermaid agentic-renderer
git -C agentic-renderer checkout 53319dbb976dae1865e19f7faca49464ee8e8557
(cd agentic-renderer && bun install --frozen-lockfile && bun run generate:sdk && bun x --no-install tsup)
QUALIFICATION_NODE="$(command -v node)" bun requalify.ts replay agentic-renderer/dist/index.js
```

The historical cohort/backend helpers are copied unchanged from their recorded Trident revision. The scripts reuse those frozen inputs and Trident's current qualifier. The build produces the public Node/library entries; browser bundles are outside this replay.

## Regression evidence

The final head passes 456 full-suite tests, 78 focused tests, 55 offline CI fixtures, typecheck, lint and snapshot freshness. Changed family-paint tests fail 11 cases against main's production code. Before/after logs also show the added marker-override and stylesheet-dash regressions failing before their fixes. The real replay caught a conservative guard rejecting harmless stylesheet comments; those comments now preserve qualification without allowing hidden marker overrides.

No renderer pixels changed in this PR. Unsupported CSS cascade, fonts, clipping, Class members, ER attributes and other marker profiles remain unmeasured. This replay qualifies only the authored criteria and reviewed SVG profiles; it does not establish general visual quality or release readiness.
