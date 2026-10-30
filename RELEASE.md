# Releasing Trident

Trident ships as a GitHub source tag and portable Node kit. The repository package
is private; there is no npm publish. Renderer failures are findings. Incorrect
invocation or reporting is a harness defect.

The first public 0.1 release requires the reconciled [B0 baseline](BASELINE.md).
Collection is still pending. Later releases assess retained evidence and collect
only measurements affected by changed artifacts or contracts. Missing upstream
features, editor drivers, Pages and version alerts remain outside release gates.

## Checks and packaging

Choose the release version and commit the intended source. Run the full harness
suite once on that code, static checks, result consistency and final-head CI:

```sh
bun install --frozen-lockfile
AM_BROWSER_TESTS=1 AM_CHROMIUM_EXECUTABLE=/path/to/chromium bun run test
bun run typecheck
bun run lint
bun commands.ts results:snapshot --check
```

Then build and verify the shipped archive in one command, selecting actual
reviewed SVG and terminal artifacts from the prepared manifest:

```sh
bun commands.ts release:check --prepared /evidence/b0/preparation.json \
  --projects SVG_PROJECT,TERMINAL_PROJECT --executable /path/to/chromium \
  --out /evidence/trident-release
```

This builds once, exercises bounded source collection/reporting, extracts that
archive and runs its Node kit from an empty directory. It checks version and file
hashes, public SVG invocation, label edits, configuration seed/reset and invalid
recovery. It writes the archive, SHA256SUMS and one `release-check.json` linking
owning reports. Blocked option mappings and renderer failures remain findings.
The selected projects must supply SVG and terminal output respectively, and each
kit case must have an owning worker attempt. Unrun cases fail the smoke check.
The smoke supplies no B0, full-support or timing qualification claim. Inspect the
receipt and actual failed/blocked outputs before publishing.

Fixture tests remain useful for regressions. The release check additionally
exercises the bytes users will download. Documentation-only edits need their
relevant consistency checks; they do not require repeating benchmark collection.
A changed production path needs its affected checks before the final release check.

## Publish

- Reconcile B0, or complete the later release's baseline assessment.
- Confirm the full harness checks, final-head CI and shipped-archive receipt.
- Refresh the changelog and release notes. Link B0, evidence, checksums and limits;
  keep planned work distinct from measured results.
- Create an unused version tag at the reviewed revision. Upload the verified kit
  and checksums, publish the release, and verify downloaded hashes and links.

The existing `v0.1.0` tag records the older preparation snapshot
`f255b6845da0d327ecc071cc86ef53a6fb809736`; keep it unchanged. Align the unused
version with package.json, source CLI, kit and release notes. The current GitHub
release remains a draft without assets.

Lineage artwork belongs to documentation maintenance. Regenerate it when its
source changes using the explicit renderer command in [README.md](README.md);
it is not another release qualification step.
