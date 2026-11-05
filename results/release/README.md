# Campaign evidence — 4 November 2026

A complete re-collection of all three benchmarks with the frozen 2 November catalog
and artifact versions. No rendered output is retained.

- `images.json`, `terminal.json`, `flutter.json`: the DaveBench SVG/PNG, terminal and
  native Flutter PNG collections, each run alone on the machine. The three Flutter runs
  are appended to `images.json`, as on 3 November.
- `report.json`, `report.md`: the DaveBench rankings built from them by `campaign:results`.
- Drawing Correctness: [`drawing-correctness.json`](drawing-correctness.json).
- Mermaid Fidelity: [`mermaid-fidelity.json`](mermaid-fidelity.json),
  scored against the 4 November control run (3,602 qualified of 5,737 expanded callbacks).

## What reproduced

Every DaveBench completion count and rank in all 51 project/format rows, and every
Drawing Correctness row, equals the 3 November collection. Fidelity changed where the
adapters changed: the reference fixes, unsupported operations, reviewed schema views
and parser bridges for the six JavaScript projects (Zombie Mermaid, XMermaid,
VitePress Plugin Diagram, DSH Mermaid GB SVG, OpenCode Merman, MermaidTUI). Beautiful
Mermaid and Frankenmermaid were re-run afterwards with their new bindings and merged
with `merge-fidelity-runs --base`, which checks that the control run is the same.

## Environment

This collection ran on a different virtual machine from 3 November. The same software
ran about 1.2–1.5× slower throughout, and Latias Merman's per-call PNG CLI about 4.3×
slower, so absolute DaveBench times are not comparable with 3 November; ranks within
this collection are.
