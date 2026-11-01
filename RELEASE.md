# Releasing Trident

Trident ships a GitHub source tag and portable Node kit. The package is private;
there is no npm publish. Release qualification means checking the claims and
shipped bytes at the intended revision. It does not mean rerunning every project.

The initial [baseline](BASELINE.md) freezes bounded verified counts and their
explicit observation limits. Release claims must stay within that scope. The [current qualification report](docs/qualification-results-2026-10-31.md)
records active v3 terminal results, the 154-callback API diagnostic, retained SVG
regrading and the minimum PNG cohort, with each current score linked to its source/output evidence. Full drawing accuracy and whole-suite conformance remain unresolved.

Run the checks below on the intended release revision. Keep their actual commit,
archive checksum and CI results with the release evidence. Earlier development
archive and restoration checks remain [historical evidence](https://github.com/adewale/trident/blob/586bc66045cf4f1400b2d2d4aef40b525387b27f/qualification-evidence/completion-2026-10-31/README.md);
they do not qualify later revisions. Development archives were not released.
Renderer failures are findings; a missing or incorrect Trident observer is a
harness limitation and must not be reported as a renderer defect.

The three qualified cost workloads remain separate:
six documentation SVGs (Pele/Mermaid), six terminal examples (ASCII/Termaid), and
three documentation edge examples exported to PNG (Mermaid/Flutter). Each keeps
its own artifact, source, call boundary and actual producer identity; later
reporting changes do not restamp captured measurements.

## Validate the changed claims

Use the frozen [six-project profile](qualification/harness-profile.json) for
transport changes. It covers 16 paths and 56 output calls within a five-minute
collection budget, after preparation. It is an unscored invocation check. Reuse
its existing witnesses when their artifact, inputs and producer remain applicable.

For correctness changes, independently review a small stratified sample of retained
outputs against explicit source facts, including existing positives, failures and
unknowns. Include equivalent representations and meaningful wrong-output controls.
Record disagreements and unresolved limits; sample agreement does not establish
whole-corpus accuracy. Recheck retained outputs with the changed observer. Each correct verdict must bind
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

The 100 AM/Trident-authored feature/edit cases are unscored harness/observer
regressions. Preserve their sources, raw outputs and historical reports; use
focused regression controls for changed harness behavior. Their old scores or
new collection are not a comparative benchmark or release prerequisite.

Before a release, check each advertised claim against its actual evidence:

| Claim | Concrete prerequisite |
|---|---|
| Full DaveBench accuracy | Keep all 548 occurrences: 546 drawings, one invalid control and one configuration-only input. The [source census](docs/docs-source-expectations.md) has 547 complete contracts and one held duplicate-commit interpretation. Regrade every required fact against exact retained outputs; the held drawing stays planned and unknown. |
| Portable Mermaid behaviours | Keep the 49-case adapted scope and all 154 origin dispositions; qualify every selected assertion on actual Mermaid reference returns. Reopen raw peer returns when publishing; show unavailable and unrun cases, never copied exact-API verdicts. |
| Mermaid test compatibility — diagnostic | Publish the exact 154-callback/37-declaration diagnostic and all nonpasses, with original/public-reference controls and owned `expanded-154-bundle-v2` parents. Preserve historical 41-callback evidence separately. Broader assertions require independent source and reference qualification. |
| Terminal accuracy | Use the named active v3 manifest: 116 drawings and four typed invalid controls; preserve the ambiguous original separately in 121 research entries. All active source profiles have bounded observers; missing or uninspectable outputs still supply no correctness pass. Original v1/v2 saved cohorts keep their original IDs. |
| PNG correctness | Bind independent actual-image reviews to current source/format contracts, exact image bytes and inspection evidence; keep held facts unknown. Strict SVG-to-PNG preservation is a separate certificate. Grade each output format directly; historical PNG-to-SVG transfer supplies no new scoring credit. A decoded image or correct SVG alone is insufficient. |
| Comparative performance | Qualify the same matched successful tasks and every actual timed sample; retain intervals, A/A controls, runtime and call boundary. |

A narrower supported claim must be stated as that exact scope in the README,
results and release notes. It cannot be described as full-corpus support. The
current gaps remain visible in the owning reports rather than being waived by
another campaign or a passing packaging check. Historical checks remain bound
to their original revisions; current runtime checks are identified above.

Use affected checks while implementing; run the full suite once the runtime is
frozen. Recollect only missing or unusable output. Keep raw returns, source
provenance, failed attempts and A/A controls; no repair-report chain or broad
renderer campaign is required for an observer-only change.

## Check and package the intended revision

Keep the frozen B0 bytes and receipt unchanged. Regrade affected retained outputs
when their observer or source contract changes; retain the original call dates,
raw evidence and any old verdict as history. Compare counts only under the same
qualified scope. New timings require a matched reference in the same run, rather
than a ratio against B0 clocks from another machine or date.

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
