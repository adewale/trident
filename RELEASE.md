# Releasing Trident

Trident ships a GitHub source tag and portable Node kit. The package is private;
there is no npm publish. Release qualification means checking the claims and
shipped bytes at the intended revision. It does not mean rerunning every project.

The 0.1 release remains blocked on the accuracy gaps in [the baseline](BASELINE.md).
All 16 paths in the first six-project harness run were invoked successfully.
That receipt alone does not establish correct input propagation or semantics. Full
DaveBench drawing accuracy, full native-PNG correctness, broader original-test
conformance and complete terminal accuracy have not thereby been established.
Renderer failures are findings; a missing or incorrect Trident observer is a
harness limitation and must not be reported as a renderer defect.

## Validate the changed claims

Use the frozen [six-project profile](qualification/harness-profile.json) for
transport changes. It covers 16 paths and 56 output calls within a five-minute
collection budget, after preparation. It is an unscored invocation check. Reuse
its existing witnesses when their artifact, inputs and producer remain applicable.

For correctness changes, recheck retained outputs with the new observer and its
independent positive and broken-output controls. Each correct verdict must bind
all required facts to the actual source, output bytes and producer. Unsupported
facts stay unknown. Source extraction coverage and a passing reference renderer
are not independent correctness proof.

For performance claims, the actual timed samples must have matching invocation
receipts and checked output, equivalent work and a passing A/A calibration. Run
`bun commands.ts timing:qualify --bundle FILE --out FRESH_FILE` on the retained
bundle. No new timing collection is needed to discover that an existing bundle
lacks those prerequisites. No overall speed rank is published for such a bundle.

Before the first release, resolve or explicitly bound each advertised claim:

| Claim | Concrete prerequisite |
|---|---|
| Full DaveBench accuracy | Settle the three pending source interpretations; qualify every required drawing fact on actual SVG/PNG output. Keep the configuration-only example separate. |
| Mermaid test compatibility | Publish the exact qualified 22-callback parse/detector scope and all nonpasses. Broader assertions require their own original-source contract and reference qualification. |
| Terminal accuracy | Qualify every required fact for the 116 positive drawings, with four typed invalid controls separate. An unavailable family observer supplies no correctness pass. |
| PNG correctness | Independently review exact decoded pixels against complete source facts, or satisfy the strict exact-SVG conversion proof. A decoded image or correct SVG alone is insufficient. |
| Comparative performance | Qualify the same matched successful tasks and every actual timed sample; retain intervals, A/A controls, runtime and call boundary. |

A narrower supported claim must be stated as that exact scope in the README,
results and release notes. It cannot be described as full-corpus support. The
current gaps remain visible in the owning reports rather than being waived by
another campaign or a passing packaging check.

## Check and package the intended revision

Run the full harness suite once on the final source, the static checks and result
consistency. Obtain CI results for the actual release head:

```sh
bun install --frozen-lockfile
AM_BROWSER_TESTS=1 AM_CHROMIUM_EXECUTABLE=/path/to/chromium bun run test
bun run typecheck
bun run lint
bun commands.ts results:snapshot --check
```

Verify the actual archive users will download, selecting reviewed SVG and terminal
artifacts from the frozen preparation:

```sh
bun commands.ts release:check --prepared PREPARATION.json \
  --projects SVG_PROJECT,TERMINAL_PROJECT --executable /path/to/chromium \
  --out FRESH_DIRECTORY
```

This builds once, extracts the kit and runs it from an empty directory. The owning
receipt must include the archive hashes, actual worker attempts and output. Its
public invocation, label change, configuration reset and invalid-input recovery
checks are packaging evidence, not corpus accuracy or timing qualification.
Documentation-only edits need their relevant consistency checks, not collection.

## Publish

Link the immutable B0 evidence, supported scopes, unresolved limits, archive and
checksums from the changelog and release notes. Publish only after the final-head
checks, claimed benchmark qualifications and shipped-archive receipt are complete.
Create an unused version tag at that reviewed revision, upload the verified kit
and checksums, then verify downloaded hashes and links.

The existing `v0.1.0` tag records preparation snapshot
`f255b6845da0d327ecc071cc86ef53a6fb809736`; keep it unchanged. The unused release
version must agree with package.json, source CLI, kit and release notes. The
GitHub release remains a draft without assets.

Lineage artwork, editor drivers, Pages and version alerts are outside benchmark
release qualification. They do not justify repeating an ecosystem campaign.
