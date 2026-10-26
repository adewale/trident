# Retained fidelity report, 26 October 2026

This is the dated comparison document for 43 project rows and 91 authored cases.
It preserves measured versions, original dates, aliases, missing evidence and
reference qualification. It contains no new timings or new renderer executions.

From a fresh Trident checkout with its declared dependencies installed:

```sh
node commands.ts export --input examples/fidelity-2026-10-26/comparison.json.gz --out /tmp/trident-comparison.json
python3 -m pip install -r requirements.txt
python3 fidelity/charts.py --report examples/fidelity-2026-10-26/comparison.json.gz --out bench-report/example-charts
```

The gzip contains the derived comparison ledger, not a reusable project-record
store. Actual SVG/PNG witnesses, tool installations and owning raw records are
not bundled. Their historical absolute paths remain provenance only; chart and
export commands do not open them. This example cannot validate the original
rendered witnesses or stand in for new measurements of current tools. The
original measurement scope and unqualified reference criteria remain in the
document. To collect new evidence, follow the fidelity guide and supply actual
built artifacts and a browser.
