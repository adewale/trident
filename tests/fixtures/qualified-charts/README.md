# Retained chart observer controls

These are actual Mermaid12.2.0 SVG outputs from the 2026-10-31 ecosystem campaign. Tests inspect these files in Chromium and mutate their painted content; they never call a project renderer. The expected facts were authored from the Mermaid input text, not inferred from the SVGs or Mermaid's model API.

| Fixture | Source | SVG SHA-256 |
| --- | --- | --- |
| xychart.svg | Trident `meaning:family:xychart`: Series; One/Two/Three; numeric range0..10; bars3/7/5; line2/6/4 | `6fa59d69da250c93576969dfe1e7a64ef6721200f5fd5b7ac4382695fd9c8be2` |
| quadrant.svg | Trident `meaning:family:quadrant`: Alpha[0.2,0.8], Beta[0.8,0.2]; Low/High effort and Low/High value | `03cf7a86338ffd052a40b7f7192c35d00e4f02183bf2cdbd33c63567a055fecc` |
| radar.svg | Trident `meaning:family:radar`: Speed/Power/Range; Current[3,4,2]; max5 | `6015fde962091c5978a881fce981123c34836f2d483c0d0b3926bce4189838a4` |
| multiline.svg | Mermaid documentation `packages/mermaid/src/docs/syntax/xyChart.md:93`, pinned source `1fb7869866dd619168d840291c9c54b4f129758b`: avg/p50/p95 named lines | `64e0543986c4fdcdd7653aab9fa268a11e16f61e6f8be3a985ffd048ed8d63df` |

The first three files were retained under campaign `fidelity/bWVybWFpZC1qcy9tZXJtYWlk/attempts/b3c67d52-d1c1-43c0-b2a4-939814d70f00/` as cases8,10,14. The fourth is the documentation drawing's retained SVG.

The observer uses visible labels, tick calibration, legend colors and actual SVG geometry. It does not use the fixtures' CSS class names or IDs to assign meaning. Negative controls change values, point positions, label roles, series inventory, visibility, clipping and opaque covers. These fixtures qualify bounded observation profiles, not every chart implementation or the full documentation corpus.

Remaining obligations are explicit: numeric/category XY axes without this profile, per-point annotations, authored configuration, noncircular radar grids and numeric radar min/max labels need further observers. The multiline SVG does not print its requested198.2 upper bound: its series can be checked against visible numeric ticks, while its range fact stays unknown. Unlabelled radar rings similarly do not independently attest a numeric range.
