# Comparison contracts

Trident compares named public work. SVG return, terminal output, parsing,
optional model APIs and original upstream tests answer different questions.
The required evidence is chosen before measuring any candidate.

## Plan before collecting

```sh
bun commands.ts support --out /evidence/support.md
bun commands.ts bench --projects OWNER/TOOL,... --profile full --plan
bun commands.ts bench --projects OWNER/TOOL,... --profile full \
  --rounds 5 --budget-minutes 720 --out /evidence/run
```

Execution requires `--projects` or the explicit `--all-projects` option. Listing
and planning acquire nothing and render nothing. The plan shows each selected
suite's binding, prerequisites, missing local tools, fresh-worker population and
a broad runtime allowance. Acquisition, downloads and source builds have unknown duration and are excluded from that range. It does not predict a project's speed or prove that
a build succeeds. Toolchain/version/network admission still happens at execution.

The optional runtime budget is checked between suite/project boundaries. It does
not interrupt an active boundary or reduce requested sampling; each portable
worker retains its own deadline. An overrun therefore remains possible. Unstarted
boundaries are recorded as `budget-exhausted`, and the campaign writes an
incomplete receipt rather than a completion claim. Use a smaller project/suite
selection when the planning range exceeds the available window.

## Observe output independently of optional APIs

Every admitted SVG receives the same format/text admission checks. Optional
public parse-model evidence and reviewed painted-meaning projections have their
own dispositions. A renderer without a model API can pass output admission;
that does not establish topology or full painted fidelity. Model failures cannot
be hidden by correct labels, and model facts never substitute for missing ink.

Portable protocol v5 records these dimensions separately. Complete semantic
qualification still requires all the declared model and paint checks. A/A
calibration measures timing noise and never supplies missing correctness proof.
The report reads old evidence as unavailable where a dimension was not recorded;
it does not backfill or relabel historical measurements.

A catalog project can bind the portable SVG API without a bespoke runner:

```json
{
  "adapter": "declared",
  "package": "example-renderer",
  "outputs": ["svg"],
  "api": { "svg": { "export": "draw", "result": "image" } }
}
```

Configuration cases express semantic intent. Reviewed option translations currently cover Pele and Agentic font sizes. Other adapters need a verified mapping; a declared binding can supply `fontSizePath`. A missing mapping blocks that case before its clock, rather than passing an ignored option or blaming the renderer. Label font checks admit explicit/inherited presentation and inline declarations; stylesheet overrides and relative units remain unmeasured.

The worker awaits the public return and consumes the declared field. The standalone
CLI accepts the same binding as `--adapter declared --binding JSON`. Preparation,
fonts, plugin loading, import costs and option mappings must remain explicit.
Different public APIs require translations while the output admission rules stay fixed. Format/text-only timing calibration is reported independently, so an optional model failure cannot erase an otherwise admitted SVG-only measurement. Full semantic qualification remains strict.

## Freeze external inputs before examining output

`corpus/external-sources.json` records full Git pins, licenses and the same
20-file selection cap for each of the eight primary repositories. License and notice texts at those pins travel with the frozen inputs. Fetch those
pins into `.cache/corpus-sources/OWNER--REPO` (a bare repository is sufficient),
then freeze the inputs:

```sh
bun commands.ts corpus:freeze --policy corpus/external-sources.json \
  --out /evidence/external-inputs.json
bun commands.ts bench --projects OWNER/TOOL,... \
  --community-inputs /evidence/external-inputs.json --plan
```

Selection reads the root README first, then `.mmd` files, then other README and
`docs/`/`examples/` Markdown, sorted within each class. It keeps explicit Mermaid
fences, diagram-headed text fences and static diagram string literals in
JavaScript/TypeScript examples. It never executes example code or interpolates
programs. Duplicate examples, excluded files and repositories contributing no
inputs remain visible. Invalid/reference-rejected cases are retained.

The pinned language reference supplies family classification and label
expectations; those are compatibility checks, not an independent visual oracle.
Per-repository contributions must be shown separately. An aggregate over all
occurrences would give prolific repositories and related forks extra influence.
No such overall score is defined. The historical six-case core stays a named
legacy timing diagnostic. The old AM-derived corpus remains available for
regression diagnosis; the external corpus does not silently replace its records.

These examples and fixtures are public development inputs. They are neither
representative production traffic nor a validated holdout. Additional independent
workload contributors and review are still needed. Observers and adapters also
need independent review before any claim of complete neutrality.

## Publish evidence without ranking projects

```sh
bun commands.ts results:publish --records RECORDS --out /evidence/community-report
bun commands.ts results:campaign --campaign /evidence/run \
  --out /evidence/publication --copy-evidence
```

Community scorecards sort projects alphabetically within compatible public
surface/runtime groups. Coverage, conditional acceptance, legacy first-call
costs and repeated-source costs stay separate; there is no rank column.

The campaign index shows original measurement windows, selected artifacts,
suite dispositions and per-project/surface/mode/round observation counts. It
links the owning scorecards, raw results and failure outputs. `--copy-evidence`
copies campaign evidence into a portable directory; without it, the output is
explicitly a local index. It never collects new timings or claims that earlier
runs used this revised protocol. Publication time is separate from measurement
time. Compare latency only on declared shared successful inputs, alongside the
full acceptance denominator; old six-case ratios are narrow diagnostics.

The semantic contract tests give identical SVG the same generic admission under
different adapter labels, reject lost labels, retain bad model evidence and
exercise an async declared API through a real Node worker. These protect specific
failure modes; they do not certify absence of selection or observer bias.

When combining corrected attempts, a `--suites ID,...` option after each `--campaign` selects that campaign's suites for the report view. The selected scope is printed; raw campaign evidence is never edited or silently superseded.

## Descendant selection

Normal public campaigns exclude descendants without an established distinct
product brand, including changed forks. An owner prefix, npm scope, runtime
suffix or branch rename alone does not establish a brand. Decisions and their
evidence are explicit `comparisonBranding` catalog metadata; unreviewed brands
stay excluded. This applies to ports as well as source forks. Zero-ahead fork
versions and shared-engine runtime bindings are also excluded.

`support --lineage` shows all entries and the reasons. `bench --plan` retains
requested exclusions and the actual included selection. Both public collection
CLIs apply the rule before preparation. `--include-excluded-descendants` is an
explicit override for a named fork, version or runtime investigation. Existing
results and support assessments remain attached to their original entities.
Exclusion supplies no inherited score or claim of behavioral equivalence.

Beautiful Mermaid is a derivative of Mermaid, not a Git fork. It ports only
Mermaid ASCII's ASCII component; its SVG renderer is independently implemented.
Mermaid Dart has a distinctive brand and remains eligible. The lineage tree retains that component scope.

## Public Node bindings and lifecycle

Community and portable bindings are separate declarations. A project can declare
`benchmark.portable` with a public SVG export, an optional zero-argument public
factory and its disposal method. The worker preserves method receivers, awaits
factory initialization before the first-call barrier and disposes the instance
after its measured work. Import/factory preparation is excluded from render-call
latency and remains included in complete-worker costs.

A `public-package` portable adapter reuses the reviewed community pipeline for
packages that need several public calls, such as parsing, layout and SVG output.
The installed package name must match the binding. Separate companion packages
are pinned and their actual payload/dependency bytes join the artifact identity;
a changed parser cannot reuse a previous renderer timing record. This does not
permit Node substitution for a browser-only API.

`support:verify --prepared FILE --browser-prepared FILE --out FRESH_DIRECTORY`
checks six authored inputs against supplied admitted output transports. It makes
no acquisition or timing-comparison claim. Input observations, parser controls
and other evidence have separate counts, and duplicate input rows receive no
pass credit. Successful calls establish narrow invocation evidence, not complete
family, model, paint or highest-level support. Product failures remain failures.
