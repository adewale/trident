# Retained benchmark readiness evidence

These files support the [readiness report](../../measurement-readiness.md). They record a bounded public-release integration exercise and instrument controls, not an ecosystem accuracy or speed ranking.

* `acceptance.json`: predeclared public-release selection, command statuses, log hashes and actual measurements. The docs assessment exited 1; integration and immutable mechanical replay passed.
* `docs-measurements.json`, `terminal-measurements.json`: actual reductions, full planned denominators, output formats, collection outcomes and unresolved assessments.
* `verification.json`, `verification-tests.log`, `observer-controls.json`: 96 fixture tests and 18 executed controls across six finite property/representation scopes.
* `existing-benchmarks.json`: scope audit of the 42 original snapshot tables; it does not upgrade legacy evidence.
* `raw-manifest.json`: relative paths, byte lengths and SHA-256 hashes of the full retained acceptance and instrument files.
* `receipt.json`: collection/report revisions, exact source identities, replay and relocation comparisons, canonical-result preservation, and the local archive hash.
* `full-suite.log`: final complete fixture run, 1,120 tests across 137 files and zero failures; its hash and separate static-check results are in the receipt.

The raw archive is retained in this workspace at `.cache/measurement-readiness-2026-11-02/public-evidence.tar.gz` (about 5.9 MB). It includes captures, causal journals, preparation, replays, reports and command logs. It has **not** been remotely published. Original absolute paths in saved metadata describe collection provenance; relocated reduction resolves owned evidence under the new campaign root.

To inspect the packaged bytes without collecting again, choose fresh directories:

```sh
sha256sum .cache/measurement-readiness-2026-11-02/public-evidence.tar.gz
# Compare with receipt.json before extracting.
mkdir /tmp/trident-retained-evidence
tar -xzf .cache/measurement-readiness-2026-11-02/public-evidence.tar.gz -C /tmp/trident-retained-evidence
bun commands.ts measurements --campaign /tmp/trident-retained-evidence/public-acceptance/docs --out /tmp/trident-retained-docs-audit
bun commands.ts measurements --campaign /tmp/trident-retained-evidence/public-acceptance/terminal --out /tmp/trident-retained-terminal-audit
```

Both reductions were exercised after relocation and reproduced call outcomes, production, mechanical validity and returned byte size with no renderer calls. To reproduce collection or instrument verification on a new machine, use the commands and prerequisites in [measurement contracts](../../measurement-contracts.md); fresh captures will have new invocation IDs, clocks and potentially different serialized byte sizes.
