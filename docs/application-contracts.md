# Public output bindings

These bindings exercise public APIs and release CLIs. Whole-editor workflows remain outside [core scope](../SCOPE.md).

## Mermaid to Excalidraw

The converter's public `parseMermaidToExcalidraw` API runs in a real browser. Checks inspect its editable element model: finite positions and shape sizes, route points, endpoint identities, authored labels and explicitly declared relationships. The common six inputs retain their full denominator. Two independently invalid sources are recorded as separate controls.

Flowcharts and sequence diagrams have editable positive witnesses. Class, state, ER and pie inputs returned image fallbacks in the exercised 2.3.0 artifact; these are blocked for editable-model qualification. An image fallback does not earn editable-node or relationship credit. Drawing those elements in the Excalidraw canvas is a separate unmeasured integration.

Use `support:verify` with explicitly prepared Node/browser artifacts for this format, or select this project in the Mermaid Compatibility campaign. Its output is reported as `excalidraw`, with operation `convert`, rather than as another SVG renderer. The docs, native-model and portable Node SVG benchmarks do not silently score Mermaid.js on its behalf.

## Native Flutter PNG

Mermaid Dart's `mermaid_flutter` 0.3.2 binding calls the published
`renderToPng(source, pixelRatio: 1)` API in a native Linux Flutter release app.
[Prepare a native bundle](../native-flutter/STANDARD.md#use-the-normal-cli-with-an-existing-native-bundle)
for the normal shared collector. A saved launch manifest identifies the executable
and seals its whole bundle; an environment variable cannot select a replacement.
The default catalog continues to select Dart SVG. These are two entrypoints of
one project, with different runtime and output contracts.

PNG checks decode the first and final returned images, require positive dimensions
and bounded raster content, and retain the `decoded-raster-content` scope. They
supply no SVG-label, relationship, editable-model or painted-meaning credit.
[Existing native PNG results](native-flutter-standard-benchmarks.md) retain their
original producer and date; transport fixture tests are not new Flutter results.

## Shared invocation check

`support:verify` protocol v2 sends six positive examples and two independently
invalid sources through each supplied public binding. The pinned Mermaid parser
must agree with the positive and negative expectations before collection starts.
Positive results remain successful inputs / six. Negative controls have separate
passed, failed, blocked and missing counts plus a `controlState`; they cannot
increase positive coverage. Duplicate control rows earn no pass credit.

A thrown public API error, documented rejection result or normal nonzero CLI exit
can establish rejection at that interface. A successful return or zero CLI exit
means the invalid input was accepted, even if later output checks fail. Missing
executables, signals, timeouts, worker exits without a completed row and unavailable
observers leave rejection unestablished. This check does not infer a parser's reason
for rejecting an input or require optional model APIs from image-only renderers.

The report preserves the actual output qualification and removes timing samples.
`invocation-verified` means at least one positive witness, so read `controlState`
and the six-input fraction beside it. Complete semantic and performance claims
require their own benchmark prerequisites, as described in
[issue 30's status](issue-30-status.md).

## Evidence

The [dated output receipt](evidence/support-issue30.json) retains the original artifact identities and results. Its historical source includes separate editor experiments; those experiments do not contribute to core support totals.
