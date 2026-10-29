# Seven-implementation DaveBench PNG evidence — 2026-10-29

[Report](REPORT.md) · [Raw samples](samples.jsonl) · [Summary](summary.json) · [Coverage calls](coverage.jsonl) · [Reproduction](REPRODUCE.md)

Timing producer: `f2045b56b662231b9432937c8ed2201f0c5efb06`. Coverage producer: `bd8e9b3fe933e4a9262dace5dd3d86700b12aa0f`.

The canonical campaign contains 5,460 measurements and 3,640 warmups on 13 reviewed common inputs, plus all 548 coverage attempts for each of seven participants. Coverage is mechanical PNG-contract coverage; only the common profile has source-fact review. Every implementation uses a fresh process block. Ratios are observed task estimates with pointwise launch-round bootstrap intervals; the two closest pairs have unresolved ordering.

`measurement`, `coverage-final` and `qualification-client` own canonical images, SVGs, source snapshots, errors and runtime receipts. Root copies provide convenient raw access. `excluded-history` retains earlier setup/adapter failures and the partial redundant-decode run without admitting their timings. Historical absolute paths in receipts keep their original values; resolve relative artifact paths under each owning run. No output resizing or clipping is used. `representative` contains full PNGs and labelled unscaled crops; the plot is a statistical chart, not a renderer output.

The archive download is split into parts below. Concatenate parts in numeric order and verify `archive.sha256`; `parts.sha256` checks each part. The extracted capsule's `SHA256SUMS` covers every retained file except that manifest itself. Native binaries, build receipts, public browser distributions, supplied font and generator scripts are included; SDK/toolchain installation requirements remain explicit in REPRODUCE.md. Public distribution source maps and type declarations are omitted from the archive; exact locked packages can be reacquired.

Independent reviews: [statistics](reviewer-statistics.md), [outputs](reviewer-output.md). Main independent audit: [audit.json](audit.json), 110,342 checks, zero differences, 11,872 canonical PNG files reconciled and 2,311 distinct streams decoded.

## Archive parts

- [seven-png-evidence-2026-10-29.tar.gz.part-00](seven-png-evidence-2026-10-29.tar.gz.part-00)
- [seven-png-evidence-2026-10-29.tar.gz.part-01](seven-png-evidence-2026-10-29.tar.gz.part-01)
- [seven-png-evidence-2026-10-29.tar.gz.part-02](seven-png-evidence-2026-10-29.tar.gz.part-02)
- [seven-png-evidence-2026-10-29.tar.gz.part-03](seven-png-evidence-2026-10-29.tar.gz.part-03)
- [seven-png-evidence-2026-10-29.tar.gz.part-04](seven-png-evidence-2026-10-29.tar.gz.part-04)
- [seven-png-evidence-2026-10-29.tar.gz.part-05](seven-png-evidence-2026-10-29.tar.gz.part-05)
- [seven-png-evidence-2026-10-29.tar.gz.part-06](seven-png-evidence-2026-10-29.tar.gz.part-06)

```sh
cat seven-png-evidence-2026-10-29.tar.gz.part-* > seven-png-evidence-2026-10-29.tar.gz
sha256sum --check archive.sha256
tar -xzf seven-png-evidence-2026-10-29.tar.gz
```
