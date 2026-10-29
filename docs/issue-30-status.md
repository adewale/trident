# Public bindings and qualification: issue 30

[Issue 30](https://github.com/adewale/trident/issues/30) covers public artifact
bindings and the evidence needed for individual claims. It does not require an
all-project timing campaign or editor automation before a harness release.

| Requirement | Implementation and evidence | Limit |
|---|---|---|
| Terminal and conversion bindings | [PR 36](https://github.com/adewale/trident/pull/36); [public output contracts](application-contracts.md) | Excalidraw image fallbacks supply no editable-model credit. |
| Native Flutter PNG through the shared collector | [PR 37](https://github.com/adewale/trident/pull/37) supplied real `renderToPng` evidence; [PR 51](https://github.com/adewale/trident/pull/51) sealed normal-CLI launches; the [real native verification](#native-png-verification) exercised the merged code. | PNG retains raster-only qualification. Default catalog selection remains Dart SVG. |
| Applicable checks and bounded invalid controls | [Shared invocation check](application-contracts.md#shared-invocation-check): six positives, two separately counted invalid inputs, preserved format-specific qualification. | Raster content supplies no label/topology claim. Optional public models remain optional. Six inputs do not establish complete family support. |
| Claim-specific timing prerequisites | [Measurement rules](../MEASUREMENT.md); [calibrated Pele/Flutter comparison](isolated-png-results.md); [seven-implementation export campaign](davebench-png-seven-results.md) with uncertainty and repeatability diagnostics. | Each campaign retains its own task, selection and calibration policy. Standard compatibility clocks have no A/A calibration and cannot supply equivalent-work speed ratios. |

## Native PNG verification

The merged launcher was exercised on 29 October 2026 at Trident
`5867f424f5048e364be65b1ac1fdf6feb8a25301`, using a fresh Linux release build of
`community_worker.dart`, Flutter 3.47.8 and Dart 3.13.7. The public package lock
retained `mermaid_flutter` and `mermaid_core` 0.3.2.

Ranked by positive-input pass rate; one project was selected:

| Rank | Project and runtime | Positive PNG inputs | Invalid inputs rejected |
|---:|---|---:|---:|
| 1 | Mermaid Dart / native Linux Flutter release 0.3.2 | 6/6 | 2/2 |

Replaying the saved binding from `/tmp` without an ambient executable selector
produced the same dispositions. A conflicting executable override was blocked
before native launch. Independent Pillow inspection decoded all 24 first/final
PNG files across the two runs; 182 archive checks passed. These establish working
invocation, bounded raster content and rejection of the two controls. They do not
qualify labels, topology, editable models, every family or comparative speed.

[Immutable evidence, original PNGs and reproduction](https://github.com/adewale/trident/blob/1a3be2b6bddde6d4d5cd9f5fa1ad525d77e9c30f/README.md)
retain the actual release bundle, lockfiles, runtime receipts, frozen manifests,
producer source, raw outputs and file hashes. Historical benchmark campaigns keep
their original dates and scores. This invocation check adds no timing comparison
or ecosystem score.

Rusty Mermaid 0.42.0 stays skipped for missing published runtime files. Franken's
unavailable source serializer and Merman's unbound exporters need actual public
targets before binding work. These are recorded artifact limits, not instructions
to implement upstream features. Whole-editor workflows stay outside core scope.
