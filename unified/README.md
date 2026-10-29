# Public-artifact campaigns

`benchmark.ts` runs all applicable [benchmark suites](../BENCHMARKS.md) serially.
`project-update.ts` acquires catalog releases or explicit candidates and retains
per-project community/CLI records. Shared qualification, resource, statistics and
report modules stay here; product source controllers live in the product repo.

## Retained pinned-browser baseline

The retained public SVG runner accepts named cases and stages. For example, on
a prepared pinned reference, collect only the two ZenUML witnesses through both
same-artifact Mermaid control roles:

```sh
bun unified/baseline-browser.ts --mode full \
  --projects mermaid-js/mermaid \
  --reference-root /reference/node_modules/mermaid \
  --upstream-root /pinned-mermaid-source \
  --cases family:zenuml,required:zenuml --stages renderer \
  --out /fresh/zenuml --records /external/records
```

Case IDs must exist, be unique and nonempty; selection preserves corpus order.
Stages are `renderer`, `startup` and `resource`. Explicit case or stage
selection writes to `pinned-browser-baseline-subset`, so it cannot replace a
full-portfolio record. Unselected Agentic or Pele packages are not required.
The selected project's artifact identity and protocol still determine reuse.
Case selection controls the renderer stage. Startup and resource stages keep
their fixed Flowchart witness, whose full input is retained in protocol settings
when those stages are selected.

Protocol `pinned-browser-public-svg-v2` admits the existing pinned first-party
ZenUML addon when the selected corpus needs it. Its manifest and distribution
inventory join the artifact fingerprint. The first ZenUML public workflow
includes addon import and registration; unrelated Flowchart startup does not
load it. Delivery accounting includes requested addon files. Use
`--zenuml-root /installed/addon` for an explicit pinned installation.

Optional `--browser-args '["--example-flag"]'` values must be a JSON array of
strings and are retained in the measured settings. These settings define a
different cohort; do not silently reuse constrained-host clocks as default
browser measurements.

Positive SVG admission checks XML, canvas and authored labels. It does not
certify native relationships, CSS or pixel paint. An overall blocked result
retains those limits even when its selected SVG observations pass. No old
observations or timings are upgraded by a runner fix.
