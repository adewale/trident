# Releasing Trident

Trident is a local research tool distributed as a GitHub source tag and a portable
Node kit. The repository package is private; this is not an npm publish. Support
claims identify the tested public interface and artifact version. A renderer
failure is a benchmark finding; a wrong invocation is a harness defect.

## Required baseline evidence

**Publish and reconcile [B0](BASELINE.md) before the first public 0.1 release.**
B0 covers all normally selected brands and applicable benchmarks, with owning
attempts, failures, gaps, skips and qualification retained. It has not been
collected yet. A six-input support check, bounded smoke campaign or the historical
results overview does not satisfy this requirement.

The [dated preparation record](https://github.com/adewale/trident/tree/a43c75361a99e41fa337a477602eaaa3b30bfc70) seals the selected artifacts and inputs,
records public-call checks and the pilot, and adopts the full sampling profile and
initial collection allowance. It does not satisfy the B0 collection gate.

Before collection, verify that the frozen artifacts, inputs and sampling decision
still match the intended harness head. Resolve pending observer changes or
explicitly defer them. Follow BASELINE.md for the complete applicability, evidence
and acceptance rules. No new benchmark collection runs in CI.

Every later release includes a baseline assessment: identify compatible retained
evidence, required new measurements and any bridge run for changed producers,
inputs, sampling, runtimes or observers. Reuse keeps original dates. An unchanged
measurement contract does not require a fresh full ecosystem campaign.

[Scope](SCOPE.md) keeps editor/IDE drivers, product-specific campaigns, missing
upstream features, a Pages site and version alerts outside release prerequisites.
Baseline collection records unavailable bindings and broken artifacts; it does
not require implementing upstream features or making every project pass.

## Before publishing

- [ ] Choose the exact release revision and version. Resolve or explicitly defer
  pending measurement/qualification fixes before freezing evidence.
- [ ] For the first public 0.1 release, publish B0 and verify its manifest,
  applicability ledger, owning attempts, exceptions, evidence links, checksums and
  reductions. For later releases, complete the baseline assessment and any required
  new measurements or bridge runs.
- [ ] Run the complete harness tests, typecheck and lint on the intended source
  head, including browser opt-ins where Chromium is available. Confirm final-head CI.
- [ ] Run a bounded correctness smoke check with real SVG and terminal artifacts
  through collection and report publication. Inspect planned/observed counts,
  failures, artifact receipts and evidence links. Smoke sampling qualifies no timing.
- [ ] Exercise a copied portable kit from an empty directory. Verify its actual
  public APIs, configuration seed/edit/reset behavior and report paths. Missing
  mappings stay blocked, with no fabricated renderer failure or pass.
- [ ] Build the kit, verify its version and manifest, include its license, archive
  it and generate SHA-256 checksums. Record the tested revision and precise limits
  of the smoke check in the release notes.
- [ ] Refresh CHANGELOG.md and the draft release from the final implementation.
  Link B0 and its baseline assessment, artifact/evidence archives, checksums and
  known limitations. Confirm that planned work is not described as completed data.
- [ ] Create an unused version tag at the reviewed source revision, upload the kit
  and checksums, and publish the GitHub release. Verify downloadable asset hashes
  and installation links after publication.

The existing `v0.1.0` tag points to the earlier preparation snapshot
`f255b6845da0d327ecc071cc86ef53a6fb809736`; it must not be moved to newer code.
Choose an unused version/tag and keep the package version, source CLI, portable
kit, changelog and release notes aligned. The current GitHub release remains a
draft with no assets; its older notes are not evidence for current main.

## Commands

Run these locally from the exact source revision. They check and package the
harness; they do not collect or publish B0, test the copied kit, or publish a release.

```sh
bun install --frozen-lockfile
AM_BROWSER_TESTS=1 AM_CHROMIUM_EXECUTABLE=/path/to/chromium bun run test
bun run typecheck
bun run lint
bun commands.ts results:snapshot --check
node commands.ts --version
bun scripts/package-release.ts --out /evidence/trident-release
```

`docs/images/lineage.svg` is documentation, not a benchmark score. Regenerate it
with an explicitly installed Agentic Mermaid public renderer when its source changes:

```sh
bun scripts/render-lineage.ts --renderer-entry /installed/agentic-mermaid/dist/agent.js \
  --out /evidence/lineage.svg
```
