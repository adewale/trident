# Native Flutter and Pele evidence: 28 October 2026

[Read the audited result tables](https://github.com/adewale/trident/blob/26ad0f91f2f2f6e530f3c23177011e2fa3ce76b9/docs/native-flutter-comparison.md) and the [adversarial audit](AUDIT.md).

| Download | Contents |
|---|---|
| [Audited publication](native-flutter-audited-publication-2026-10-28.tar.gz) | Five interface scorecards, per-case CSV, complete copied historical evidence, audit, and separate revised-runner verification records. Extract and open publication-final/README.md. |
| [Original frozen campaign](trident-native-flutter-pele-benchmark.tar.gz) | Original measured adapter, corpus, raw samples, images, environment details and reproduction instructions, unchanged. |
| [Checksums](SHA256SUMS) | SHA-256 identities for the downloads and retained review files. |

The original 10,105 records include warmups and negative probes. Eighty-four main records fail in preparation and do not reach the timed operation. The legacy View repeat and Pele render-update columns are qualified diagnostics; they do not establish their intended editing workloads. Both libraries produced nonblank output for the 29 selected positive inputs, but semantic correctness was not measured. Native pie corner marks and large-widget clipping remain visible in the retained captures.

The results are useful as separate entrypoint/scaling observations. A cross-runtime relative-cost result is withheld because completion boundaries, output dimensions/fonts and calibration prerequisites differ.

This isolated evidence commit is not part of the source PR and must not be merged into main. The corrected source is a8b8db13c5242b52076b0f05edb60d3ba742896c; the invocation-witness commit is 26ad0f91f2f2f6e530f3c23177011e2fa3ce76b9. Historical measurements belong to the earlier content-addressed source snapshot in the original archive.
