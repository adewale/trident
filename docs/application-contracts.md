# Public output bindings

These bindings exercise public APIs and release CLIs. Whole-editor workflows remain outside [core scope](../SCOPE.md).

## Mermaid to Excalidraw

The converter's public `parseMermaidToExcalidraw` API runs in a real browser. Checks inspect its editable element model: finite positions and shape sizes, route points, endpoint identities, authored labels and explicitly declared relationships. The common six inputs retain their full denominator. Two independently invalid sources are recorded as separate controls.

Flowcharts and sequence diagrams have editable positive witnesses. Class, state, ER and pie inputs returned image fallbacks in the exercised 2.3.0 artifact; these are blocked for editable-model qualification. An image fallback does not earn editable-node or relationship credit. Drawing those elements in the Excalidraw canvas is a separate unmeasured integration.

Use `support:verify` with explicitly prepared Node/browser artifacts for this format, or select this project in the Mermaid Compatibility campaign. Its output is reported as `excalidraw`, with operation `convert`, rather than as another SVG renderer. The docs, native-model and portable Node SVG benchmarks do not silently score Mermaid.js on its behalf.

## Evidence

The [dated output receipt](evidence/support-issue30.json) retains the original artifact identities and results. Its historical source includes separate editor experiments; those experiments do not contribute to core support totals.
