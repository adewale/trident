# Releasing Trident

Trident 0.1 is a local research tool distributed as a GitHub source tag and a
portable Node kit. The repository package is private; this is not an npm publish.
Support claims describe the tested public interface and actual artifact version.
A renderer failure is a benchmark finding; a wrong invocation is a harness defect.

[Scope](SCOPE.md) keeps editor/IDE drivers, product-specific campaigns, missing
upstream features, a Pages site and version alerts outside release prerequisites.

Before tagging:

1. Check the exact intended source head with the complete harness tests,
   typecheck and lint, including browser opt-ins where Chromium is available.
2. Run a bounded correctness smoke check with real SVG and terminal artifacts
   through collection and report publication. Inspect planned/observed counts,
   failures, artifact receipts and evidence links. Separately exercise the copied
   portable kit from an empty directory. Smoke sampling does not qualify timing.
3. Verify configuration-reset seed/edit behavior through the actual public APIs.
   Missing mappings must be blocked, with no fabricated renderer failure or pass.
4. Build the kit, verify its version/manifest, archive it with its license and
   generate SHA-256 checksums. Record the tested source revision and the precise
   scope and limits of the smoke check in the release notes.

```sh
bun install --frozen-lockfile
AM_BROWSER_TESTS=1 AM_CHROMIUM_EXECUTABLE=/path/to/chromium bun run test
bun run typecheck
bun run lint
node commands.ts --version
bun scripts/package-release.ts --out /evidence/trident-release
```

`docs/images/lineage.svg` is a documentation artifact, not a benchmark score.
Regenerate it with an explicitly installed Agentic Mermaid public renderer:

```sh
bun scripts/render-lineage.ts --renderer-entry /installed/agentic-mermaid/dist/agent.js \
  --out /evidence/lineage.svg
```

Use `CHANGELOG.md` as the release-note basis. State known adapter and observer
limits. Keep raw benchmark records outside tracked source and link their owning
publication when publishing results. No all-suite timing campaign is required
for a release that makes no new comparative timing claim.

After the reviewed release changes are merged and exact-head evidence is ready,
tag that source revision as `v0.1.0` and publish the portable archive and checksum
file on its GitHub release. Do not move an existing release tag to newer code.
