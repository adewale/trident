# Editor and conversion workflows

Editors and converters run application contracts. They do not inherit their rendering dependency's benchmark results. These checks are separate from the seven engine benchmarks.

## Browser editors

Mermaid Live Editor and Modern Mermaid use the same four-step contract on one independently authored flowchart:

1. Enter `flowchart LR` followed by `A[Alpha] --> B[Beta]`. Require both labels in the visible SVG preview.
2. Change the labels to Gamma and Delta through the editor UI. Require the new labels and absence of the old labels.
3. Enter `flowchart LR` followed by ` --> -->`. Require a visible application error.
4. Restore Alpha and Beta. Require the valid preview and a cleared error.

The checker uses real Chromium, DOM geometry and visible text. It retains screenshots and the actual DOM SVG fragment for each valid step. A live preview may have its viewBox removed by pan/zoom code, so a DOM fragment is not classified as a standalone SVG export. Exported files, persistence, diagram families beyond this flowchart, collaboration and full visual correctness are outside this contract.

Source HEAD must match the catalog and the checkout must be clean apart from declared generated build paths. Reports bind the source manifest, pnpm lock, actual build files, Trident producer objects and runtime versions. Build-file digests identify the observed application; they are not a reproducible-build proof. External browser requests are blocked and recorded. Neither application's underlying Mermaid version is silently replaced.

Prepare dependencies and build the pinned checkout before checking it. The executed preparation used pnpm 10.34.7, frozen locks and ignored install scripts. Live Editor also needed `pnpm exec svelte-kit sync` before `pnpm run build`. Modern Mermaid used `pnpm run build`. The ordinary editor check never installs dependencies or builds source.

```sh
bun commands.ts editor:verify --project gotoailab/modern_mermaid \
  --source /checkouts/modern-mermaid --dist /checkouts/modern-mermaid/dist \
  --out /evidence/modern-editor --executable /usr/bin/chromium

bun commands.ts editor:verify --project mermaid-js/mermaid-live-editor \
  --source /checkouts/live-editor --dist /checkouts/live-editor/docs \
  --out /evidence/live-editor --executable /usr/bin/chromium
```

Allow three minutes per functional workflow after preparation. Each preview/error wait is capped at 25 seconds; preparation and build time are separate. These checks report behavior, not a performance score. Future UI timing needs settled-preview criteria and repeat controls on the same host.

## Mermaid to Excalidraw

The converter's public `parseMermaidToExcalidraw` API runs in a real browser. Checks inspect its editable element model: finite positions and shape sizes, route points, endpoint identities, authored labels and explicitly declared relationships. The common six inputs retain their full denominator. Two independently invalid sources are recorded as separate controls.

Flowcharts and sequence diagrams have editable positive witnesses. Class, state, ER and pie inputs returned image fallbacks in the exercised 2.3.0 artifact; these are blocked for editable-model qualification. An image fallback does not earn editable-node or relationship credit. Drawing those elements in the Excalidraw canvas is a separate unmeasured integration.

Use `support:verify` with explicitly prepared Node/browser artifacts for this format, or select this project in the Mermaid Compatibility campaign. Its output is reported as `excalidraw`, with operation `convert`, rather than as another SVG renderer. The docs, native-model and portable Node SVG benchmarks do not silently score Mermaid.js on its behalf.

## VS Code Mermaid Editor

The input/action/output contract is the same preview/edit/error/recovery sequence inside a real VS Code extension host and webview, using a document opened by the user-facing extension. The prerequisite is a pinned VS Code desktop build plus the extension built from catalog commit `594128149e0146c4221c3720356a300436e6144f`. That host/webview driver is not implemented. Importing the extension's Mermaid dependency or treating a webpage as VS Code cannot satisfy it.

[Issue #30](https://github.com/adewale/trident/issues/30) remains open for this driver, remaining output/runtime bindings, broader independent meaning checks and calibrated runtime-appropriate campaigns.

## Evidence

[Modern Mermaid input](evidence/editor-workflows/modern-input.png) →
[edited preview](evidence/editor-workflows/modern-edit.png) →
[invalid-source error](evidence/editor-workflows/modern-invalid.png) →
[recovered preview](evidence/editor-workflows/modern-recovery.png).

[Live Editor input](evidence/editor-workflows/live-input.png) →
[edited preview](evidence/editor-workflows/live-edit.png) →
[invalid-source error](evidence/editor-workflows/live-invalid.png) →
[recovered preview](evidence/editor-workflows/live-recovery.png).

The [receipt](evidence/support-issue30.json) records the owning source pins, build files,
Trident producers and actual step dispositions. The screenshots show application
behavior; they do not compare rendering aesthetics.
