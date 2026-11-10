# Agentic public source parser follow-up

Trident was using Agentic's source-preserving editing model for observations
that its public source parsers can answer. This follow-up changes the binding;
the measured Agentic package is unchanged.

| Same Agentic 0.5.7 package | Passed | Assertion failures | Unsupported | Trident gaps |
| --- | ---: | ---: | ---: | ---: |
| Before, Trident `81b939b` | 2,669 | 75 | 1,000 | 3,602 |
| Public source bindings | 2,839 | 132 | 775 | 3,600 |

Both runs attempt the same 352 files and retain all 7,346 reference-qualified
callbacks, 18 upstream skips and 19 candidate collection-gap files. No previously
passing callback regresses. Of 226 formerly unsupported callbacks, 163 pass and
63 fail. Six former assertion failures and one former Trident gap also pass;
one other gap becomes an explicit unsupported observation.

The three final runs share the exact sealed control identity:

| Agentic artifact under final Trident bindings | Passed | Assertion failures | Unsupported | Trident gaps |
| --- | ---: | ---: | ---: | ---: |
| Original 0.5.7 source, `e7cb05b` | 2,809 | 162 | 775 | 3,600 |
| Repaired 0.5.7 source, `9543330` | 2,839 | 132 | 775 | 3,600 |
| Frozen published 0.5.6 | 2,244 | 106 | 1,449 | 3,547 |

Exactly 30 native assertion failures become passes between the two 0.5.7
artifacts, with no other status transitions. The 0.5.6 totals are unchanged,
confirming that capability fallback preserves the older package's assessment.

The 63 newly assessed failures comprise 50 class error-wording assertions,
seven AgentFlow diagnostic format/position assertions, three sequence HTML-break
representation assertions and three generous ER quoted-name reads. The ER
reader deliberately accepts empty names, percent signs and backslashes and
reports portability through verification (`src/er/text.ts`). Diagnostic wording
and newline normalization remain strict-reference nonpasses; these counts do
not establish product rendering defects.

Trident now selects `parseClassDiagram`, `parseSequenceDiagram`, `parseErDiagram`,
`parseUsecaseModel` and `parseAgentflowModel` by exported capability. It retains
editing-model declaration evidence where needed, and never retries a rejected
source through the editing parser. It also binds cross-family imports separately,
preserves UseCase's asynchronous rejection protocol, clears rejected publication
state, and withholds complete AST comparisons where native tables are absent.
Missing wrap configuration, ambiguous sequence statement order and class-style
mutation order remain explicit unsupported observations.

The audit of all 236 formerly opaque assertions finds:

- 128 have a public source parser rejection.
- Four have a public semantic model.
- 104 have no alternative public source parser in the reviewed entry point.

Three of the last group observe private block database helpers using a cached
header-only seed, rather than invoking a parser themselves. The receipt records
that provenance instead of inventing a callback input.

[`audit.json.gz`](audit.json.gz) retains every opaque assertion's captured
source and native public API outcome, the full before/after transition list,
all remaining strict assertion nonpasses, package identity, raw-result hashes
and the sealed control identity. The opaque-input wrapper run is diagnostic
only; the scored run uses the untouched installed package.

The package is built from Agentic commit
`9543330cc46ad7f1805fe035826c764006540d0b`, SHA-256
`b0337b26116d50e077eb28c802a21e7b9beacff4ca0be03036df393828cf87f5`.
The reference is Mermaid 12.3.0 at
`2086904e76c692331e34a45d7cc3bc30860d040e`. Agentic main was fetched and
remained at `e7cb05baa7f68154942a9ce9c6e9aaaee163dc94`; the measured repair
candidate is the separate PR #609 head.

The parser/model slice now has 2,561 passes, 117 failures, 564 unsupported
observations and 263 Trident gaps across 3,505 callbacks. Source-path rendering
coverage is unchanged; these bindings do not measure rendered layout. The
independent drawing-structure observer remains a separate diagnostic profile.

Reproduction, after preparing the same immutable package and reference:

```sh
bun commands.ts mermaid:fidelity --upstream MERMAID_SOURCE \
  --reference MERMAID_REFERENCE --runtime VITEST_RUNTIME \
  --prepared PREPARED_JSON --catalog CATALOG_JSON \
  --projects adewale/agentic-mermaid --out FRESH_OUTPUT --workers 4
bun commands.ts fidelity:coverage --run FRESH_OUTPUT --out FRESH_COVERAGE
```

Validation: the full local CI-safe suite passed 1,105 tests with eight deliberate
oracle-dependent skips and no failures. Final affected suites passed 49 tests;
runtime dependency and binding suites passed 21 tests. Lint, typecheck, the
frozen results snapshot and `git diff --check` passed. The focused original
UseCase selection passed 73 callbacks, with zero assertion failures, six
unsupported observations and 76 Trident gaps.
