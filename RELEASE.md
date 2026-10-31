# Releasing Trident

Trident ships a GitHub source tag and portable Node kit. The package is private;
there is no npm publish. Release qualification means checking the claims and
shipped bytes at the intended revision. It does not mean rerunning every project.

The 0.1 release remains blocked on the initial [baseline](BASELINE.md) and its
bounded accuracy claims. The [current qualification report](docs/qualification-results-2026-10-31.md)
records active v3 terminal results, the 154-callback API diagnostic, retained SVG
regrading and the minimum PNG cohort. PNG has 951 current content decisions,
42 actual-image holds and 99 native no-image outcomes; the [summary](docs/evidence/png-full-corpus-2026-10-31/current-content-summary.json)
and [all grades](docs/evidence/png-full-corpus-2026-10-31/current-content-grades.json.gz)
preserve those separate populations. Full drawing accuracy and whole-suite
conformance remain unresolved.

Runtime revision `8aa1238a1a7b487fae42ff5c39a3f80dbe976bf2` passed the actual
source/extracted-kit `package-parity-verified` check. Its archive SHA-256 is
`d80afdf89ce70b10d232cb2880fc650e5048ab1604de7a8f3c6f192f5c43dbe9`.
[Linux and macOS fixture CI](https://github.com/adewale/trident/actions/runs/41252220020)
passed for that revision. Its browser-enabled full suite passed 1,243 tests with
zero failures and 9,738 assertions across 167 files. Lint, typecheck, source/public
manifest regeneration and snapshot checks also passed. Final evidence
publication and the initial baseline remain open. These runtime checks
do not assert CI for a later documentation revision or declare the 0.1 release
ready. Earlier `1ba6f812` checks and the [published `79777b7` foundation](https://github.com/adewale/trident/blob/79777b738e4bb5292a31b11dc405c42f6c90d323/qualification-evidence/README.md)
remain historical evidence with their original producers. The development
archives were not released.
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
receipts and checked output, equivalent work and a passing A/A calibration.
[First-use browser collection](BENCHMARKS.md#qualification-and-collection) uses a
sealed artifact pair, Chromium and frozen fontconfig inputs. Run
`bun commands.ts timing:qualify --bundle FILE --out FRESH_FILE` on the retained
bundle. No new timing collection is needed to discover that an existing bundle
lacks those prerequisites. No overall speed rank is published for such a bundle.

Before the first release, resolve or explicitly bound each advertised claim:

| Claim | Concrete prerequisite |
|---|---|
| Full DaveBench accuracy | Keep all 548 occurrences: 546 drawings, one invalid control and one configuration-only input. The [source census](docs/docs-source-expectations.md) has 547 complete contracts and one held duplicate-commit interpretation. Regrade every required fact against exact retained outputs; the held drawing stays planned and unknown. |
| Mermaid test compatibility | Publish the exact 154-callback/37-declaration diagnostic and all nonpasses, with original/public-reference controls and owned `expanded-154-bundle-v2` parents. Preserve historical 41-callback evidence separately. Broader assertions require independent source and reference qualification. |
| Terminal accuracy | Use the named active v3 manifest: 116 drawings and four typed invalid controls; preserve the ambiguous original separately in 121 research entries. All active source profiles have bounded observers; missing or uninspectable outputs still supply no correctness pass. Original v1/v2 saved cohorts keep their original IDs. |
| PNG correctness | Bind independent actual-image reviews to current source/format contracts, exact image bytes and inspection evidence; keep held facts unknown. Strict SVG-to-PNG preservation is a separate certificate. Same-call PNG-to-SVG transfer fills only unavailable planned painted checks and preserves contrary observations; it supplies no structural/font/resource/motion proof. A decoded image or correct SVG alone is insufficient. |
| Comparative performance | Qualify the same matched successful tasks and every actual timed sample; retain intervals, A/A controls, runtime and call boundary. |

A narrower supported claim must be stated as that exact scope in the README,
results and release notes. It cannot be described as full-corpus support. The
current gaps remain visible in the owning reports rather than being waived by
another campaign or a passing packaging check. Historical checks remain bound
to their original revisions; current runtime checks are identified above.

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

This builds once, extracts the kit and runs it from an empty directory. The same
label-change, configuration-reset and invalid-input-recovery workflows run from
source against the same frozen target artifact. Choose the portable SVG project
first and a distinct terminal project second; the preparation must contain both
reviewed bindings. Target artifacts and the pinned reference are installed
separately from the kit. Owning worker inventories, inputs, expectations,
outcomes and rejection controls must agree; a new failure
or lost evidence in the kit fails packaging. Retained SVG admission is rechecked
with the source observer and output hashes are recorded. An unchanged failed
workflow needs an independently confirmed violation in its actual returned SVG;
unclassified host/public-call errors fail packaging. Unavailable option mappings
remain gaps. The `package-parity-verified` receipt
establishes preservation of those source outcomes. It does not certify that
every workflow passed or supply missing harness, accuracy or timing proof.
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
