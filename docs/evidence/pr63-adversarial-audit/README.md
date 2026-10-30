# PR 63 adversarial audit

Four agents independently audited collection/resume, preparation, reporting and release verification, then cross-reviewed the fixes. Final source: `61e611471b143601b25976d89e3301fd6a2bb316`. The original workflow comparison and receipts remain unchanged in `../workflow-cleanup`.

| Finding | Result after the fix |
|---|---|
| A forced resume could reuse another campaign's cached work or lose its own work behind an interleaved campaign | Search record history by campaign identity; preserve matching completed records and original measurement dates. |
| Budget checks could prevent completed metadata from publishing; resumed elapsed time excluded prior active windows | Gate actual new work and accumulate active time across windows. |
| First-worker and later-round failures could lose the SVG needed to explain rejection | Retain representative and failing SVGs after measured calls, creating their directories at the write boundary. |
| The fresh resolver crashed on observed-only catalogue members or source projects without published releases | Retain observations and reviewed source revisions; do not replace metadata errors with guessed releases. |
| A stale browser package could be paired with a newer primary artifact | Reconcile project/configuration selectors and artifact identities, reject stale ownership and enforce complete primary sealing. |
| A newly imported table could hide itself; failed rows became zeroes, percentages used counts, and one cohort could hide another | Bind imports to their owning publication, keep unavailable rows unranked, divide by denominators and show both cohort states. |
| Candidate attempts could mask release evidence; extracted pilots depended on old absolute paths | Isolate candidate publication and resolve evidence relative to its owning controller. |
| Release smoke could pass with the wrong format, declared case names or summaries without actual workers | Require distinct SVG/terminal observations and owning worker evidence for each shipped case. Stage the build outside the checkout. |

Validation on the final source:

- Full suite: **508 passed, zero failed**, including browser checks (`full-suite-final.log`).
- CI fixture environment without source/oracle checkouts: **90 passed, four intentionally skipped, zero failed** (`ci-fixtures-final.log`). The skipped tests require local rendering artifacts; the full suite executed them.
- Type checking, lint and tracked results consistency passed. The final commit after those checks adds only the missing directory creation in the JavaScript worker; final CI and the full suite include it.
- Preparation retained **39 actual artifacts**, zero admission errors, **17 prepared browser interfaces and 22 inapplicable**, all 54 portable cases and 1,089 compatibility inputs. See `ecosystem-preparation-summary.json`. Fresh default registry acquisition also passed for Pele and Mermaid ASCII, without legacy prepared inputs (`fresh-preparation-summary.json`).
- The actual `release:check` completed on final committed source: **40 passed source observations, eight inapplicable and zero failed**; the extracted Node kit passed output admission and declared semantic checks for flowchart, label edit, configuration reset and invalid recovery. `release-check.json` records the archive hash, commands and original local paths. Portable output retains its stated unmeasured scopes.
- Regression logs include deliberate removals/reintroductions of the faulty conditions. The full final suite is the acceptance result; red logs are evidence that the targeted tests detect their defects.

Reproduce the acceptance runs from the final source with `AM_BROWSER_TESTS=1 AM_CHROMIUM_EXECUTABLE=/usr/bin/chromium bun run test` and `CI=true GITHUB_ACTIONS=true MERMAID_REFERENCE_DIR=/nonexistent/trident-ci-oracle MERMAID_UPSTREAM_DIR=/nonexistent/trident-ci-upstream bun run test:ci`. Local artifact and browser prerequisites are documented in the repository. The release receipt includes its exact invocation and installed artifact paths.

Raw source observations and the owning kit record are retained under `release/`. These are bounded harness checks on two brands, not a comparative score campaign. No B0 collection or release publication was performed.
