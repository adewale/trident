# Benchmark validation, 7 November 2026

The harness corrections replace format-header checks, serialized SVG text scans
and supplied summary counts with validated output and per-case evidence.
The frozen product selections remain those in
[`benchmark-campaign-2026-11-07/catalog.json`](../benchmark-campaign-2026-11-07/catalog.json).

## Discriminating checks

Copying the updated regression tests into an isolated checkout of
`49947d539cb9d04deed24608d2e9bd220810b17f` fails regressions for descendant process termination, duplicate drawing cases,
partial project merges, caught candidate exceptions, JavaScript bridge fault
classification, malformed SVG and truncated PNG admission. The same tests pass with the fixes. A separate Latin-1 clipping test
also fails against that checkout and passes with the extended glyph profile.
The clipping tests compare independent browser raster ink with the observer's
verdict; they do not use a renderer's layout as the expected result.

## Native PNG verification

[`verification.json`](verification.json) records the tested source hashes,
SDK distribution, AOT artifact hash and native-engine probe output. The worker
compiled to a Linux release AOT library with Flutter 3.44.0 / Dart 3.12.0. A
separate post-frame probe executed its unchanged private admission function in
that SDK's native Flutter test engine. All eight controls passed: null, empty,
non-PNG, a complete independently generated PNG, a truncated IHDR prefix,
excessive dimensions, maximum 32-bit dimensions and zero dimensions. The
pixel budget uses division so the dimension check cannot overflow. The original function accepts the
truncated prefix and fails that control.

This build used an untracked copy of the application. Its dependency resolver
required three transitive versions to differ from the committed lockfile; those
versions are recorded in the JSON. The repository lockfile remains unchanged.
The documented Flutter 3.47.8 build and the complete GTK release bundle have not
been verified: the environment blocks `storage.googleapis.com`, which serves the
SDK and Linux desktop artifacts. These checks establish compilation and decoder
behavior with the available engine. They do not establish native DaveBench
completion counts or timings.

## SVG scope

Drawing verdicts also require the observer's paint-opacity/color check. A filter
that erases every label produces an unassessed result. The regression fails
against the earlier three-check implementation, which gave it credit.

ASCII and Latin-1 text now share the existing measured-font, advance and
font-box qualification. Independent positive and clipping controls cover
accented text. Combining marks, glyph outlines, embedded images, masks,
unsupported clip paths and partial occlusion still require evidence the
observer does not provide. Such outputs remain unassessed; they receive no
correctness credit. A real quadrant output in this collection has circles
partly covering its labels, so a text bounding box alone cannot settle it.
