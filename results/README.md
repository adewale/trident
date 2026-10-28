# Results

Old snapshots have been removed. This checkout has no current published benchmark scores.

Collect fresh evidence with the current qualifier and publish outside the source tree:

```sh
bun commands.ts community:update --projects OWNER/TOOL --profile full --rounds 5 \
  --records /evidence/records --out /evidence/run
bun commands.ts results:publish --records /evidence/records --out /evidence/report
```

Keep the owning records, failure outputs, artifact identities and actual measurement dates. Different workloads, qualifiers or machines do not make one matched experiment. Generated scores, raw render outputs and records are ignored by Git; only these instructions belong here.

[Choose a benchmark](../BENCHMARKS.md) · [Measurement rules](../MEASUREMENT.md)

For a dated index across the seven suites, use `bun commands.ts results:campaign --campaign EVIDENCE --out FRESH_DIRECTORY --copy-evidence`. It retains the original measurement dates and links/copies owning scorecards and raw observations. Without `--copy-evidence` it produces a local index only. New report code never upgrades old evidence to a new measurement protocol. See [comparison contracts](../FAIRNESS.md).
