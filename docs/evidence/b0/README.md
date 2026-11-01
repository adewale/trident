# Frozen baseline B0

[B0 tables](../../../results/baseline.json) · [Readable results](../../qualification-results-2026-10-31.md) · [Input/outcome receipt](receipt.json) · [Release process](../../../RELEASE.md)

B0 freezes verified outcomes and explicit limits from the minimum qualification
cohorts. The rolling results retain their own history and pin B0's checksum.
`bun commands.ts results:snapshot --check` verifies the snapshot, table values
and actual frozen input/outcome files. It runs no renderer or model API.

| Workload | Corpus provenance and scope |
| --- | --- |
| DaveBench SVG and PNG | All 548 literal occurrences from 34 Mermaid syntax-documentation pages at commit `1fb7869866dd619168d840291c9c54b4f129758b`: 546 drawings, one invalid source and one configuration-only input. Each format has separate outcomes. |
| Terminal Rendering | The pinned 18-repository research corpus preserves 120 original sources and one independently reviewed adaptation. Active v3 has 116 drawings and four invalid controls; the ambiguous original remains diagnostic. Repository, issue/example, commit, extraction and license provenance is retained per source. |
| Mermaid Public API Tests | 154 unchanged callbacks from 37 declarations at the same Mermaid pin. Original and public-reference controls qualify this selected API diagnostic; the full census has 4,060 declarations. |
| SVG rendering cost | Six documentation examples, Mermaid/Pele; every timed return checked, with matched controls and six balanced rounds. |
| PNG export cost | Three documentation edge examples, Mermaid/Flutter; complete cold export, with checked returns and matched controls. |
| Terminal CLI cost | Six literal project-corpus examples, Mermaid ASCII/Termaid; fresh public CLI startup through complete output, with checked returns and matched controls. |

The 100 AM/Trident-authored feature/edit cases are unscored harness regressions.
They supply no B0 renderer rank. The six-project, 16-path transport verification
is a separate execution check, preserved in [BASELINE.md](../../../BASELINE.md).

## Read the limits

Ranks order the named verified metric, best first. Unknowns remain planned and
receive no credit. The SVG lane has 165 unknown drawings: one unresolved source
interpretation and 164 whose complete facts the current observers cannot
establish. [The per-case census](observer-limits.json) retains those predicates;
this baseline does not claim they are all inherently unobservable.

PNG has 17 returned-image holds, plus 99 native no-image outcomes. The latter
come from actual Flutter public calls: 78 unsupported diagram inputs and 21
public rendering/parsing failures, with no host failure in that retained set.
Unsupported syntax inside a recognized family is a compatibility limitation;
it is not automatically a claim that the upstream project promised that feature.
Missing images supply no drawing-content verdict. Actual invalid-source
acceptance and rejection are separate controls.

SVG and PNG also have distinct format contracts. [The cross-format census](cross-format-census.json)
identifies 23 SVG failures alongside correct PNG drawings: malformed standalone
XML or duplicate identifiers. It found no unexplained contrary visible-content
verdict. A correct PNG does not repair the returned SVG document.

The terminal minimum cohort retains 28 present-output gaps. These concern
ambiguous route/group ownership, overwritten caption spaces, unexposed diagram
kinds, noninjective status encodings and occluded Git stems. Artifact-bound
public encodings may prove visible facts; expected source operations cannot
supply hidden paths. The full 18-project regrade preserves missing outputs,
unsupported inputs and the four invalid controls separately.

Timing tables compare only their named sources, versions and public boundaries.
They retain the original call dates, checked samples, A/A calibration and
uncertainty. Future speed comparisons need a fresh matched reference in the same
window; B0 clocks are not a cross-machine denominator. These public development
inputs are not a validated holdout, usage-frequency sample or aesthetics test.

## Evidence

- `inputs/`: exact frozen corpora, contracts, source-policy, catalog and harness profile.
- `normal/`: ordinary SVG, PNG and terminal outcomes and their inventories; the PNG reporting ledger reconciles to its exact owning result.
- [contract-epochs.json](contract-epochs.json): actual source and observer epochs. Unchanged PNG reviews retain their original producers; affected contracts and corrected false positives have fresh admissions.
- `evidence/`: raw SVG/text archives, public API receipts, PNG review identities and independently checked metadata. Original PNG bytes and journals remain in the [immutable owning archive](https://github.com/adewale/trident/blob/586bc66045cf4f1400b2d2d4aef40b525387b27f/qualification-evidence/completion-2026-10-31/README.md).
- The three timing archives and manifests remain at their original paths, pinned by the receipt. Their README files contain offline qualification commands.

Extract the raw SVG and terminal archives to inspect their content-addressed
witnesses. The normal records retain source/output/expectation hashes and each
actual producer. The SVGs are original public companions of owned PNG-export
calls; they have no invented independent SVG invocation or timing.

The receipt records the finite reporting generator and its inputs. Publication
used ordinary reducers and the shared ranker, with zero new renderer/API calls.
Later runs update `results/latest.json` while keeping this baseline unchanged.
