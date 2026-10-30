# What the catalog contains

The catalog is a discovery and lineage inventory. An entry can be an independent
implementation, a port, a fork at a historical revision, a runtime binding or an
integration. Listing a repository does not prove a working adapter, supported
families or correct output.

At the catalog snapshot used for this change, its 89 entities have these lineage
classifications:

| Relation | Entities | Meaning |
|---|---:|---|
| Fork | 45 | Shares source ancestry with its recorded parent. Some have changes; others preserve an older parent revision. |
| Independent | 26 | Recorded as independently rooted. This does not prove independent implementation of every component. |
| Derivative | 1 | Beautiful Mermaid derives from Mermaid without a Git-fork claim. |
| Port | 9 | Reimplements a project in another language or runtime. |
| Native renderer | 1 | Mermaid Flutter uses Mermaid Dart parsing/layout with its own native painting and PNG output. |
| Binding | 3 | Exposes another engine through a different runtime/package boundary. |
| Unverified | 3 | Ancestry has not been established. |
| Root | 1 | The pinned Mermaid language reference. |

Categories such as renderer, parser, editor and integration overlap and describe
responsibilities, so their counts should not be added to infer a project total.
The snapshot also records unresolved discoveries and exclusions separately;
those are not additional measured entries.

There are 85 declared transport adapters: 20 retain existing-adapter labels and
64 retain candidate labels from the original catalog snapshot; Mermaid Flutter
has a separately verified native PNG binding. Those historical labels
are separate from the [0.1 verification](SUPPORT-QUALITY.md), which exercised
37 release artifacts among 42 eligible entries and retained five blockers.
The current core selection has 40 entries. The original receipt keeps its dated
42-entry scope; three full editors are now discovery-only applications: Mermaid
Live Editor, VS Code Mermaid Editor and Modern Mermaid. They have no core driver
requirement and are not missing renderer scores. Mermaid-to-Excalidraw retains
a directly exercised public conversion binding; image fallbacks remain blocked for editable-model credit. See [scope](https://github.com/adewale/trident/blob/f764f2ab653f1fb6998b0fd8ca014b16d034a921/SCOPE.md).

Of the 45 forks, 25 were recorded with zero commits ahead of their parent; four
were also zero behind. A fork name therefore cannot establish another distinct
engine. Conversely, identical Git pins do not alone permit measurement reuse:
build recipes, shipped bytes, runtime and invocation evidence must match.
See `unified/catalog-eligibility.ts`.

## Inspect every project's support

```sh
bun commands.ts support
bun commands.ts support --out /evidence/support.md
bun commands.ts support --out /evidence/support.json
```

The matrix is generated from the catalog and the actual suite admission rules.
It includes declared/bound outputs, adapter review status, lineage, parent and a
reason for each suite cell. It is configuration evidence, not a fresh runtime
validation of 89 projects.

The reviewed native-model integrations currently belong to Agentic Mermaid,
Pele and the pinned Mermaid reference. Fifteen catalog entries have configured
portable Node SVG bindings: Agentic Mermaid, Pele, Ondine and six
Beautiful-compatible entries (Beautiful Mermaid, Zombie Mermaid, ktrysmt,
theletterf, thepanax and vercel-labs). Additional bindings cover mdv, the VitePress plugin, the DSH engine, Merman,
Crafter and Merslim through declared exports, a public factory or the same
reviewed package pipeline used by community collection.
A new project can instead declare its
public SVG export and returned field; it does not need a project-specific
portable runner. Historical Mermaid forks do not inherit the pinned reference's
model evidence merely by sharing its transport adapter.

For browser SVG checks, configuration remains conditional on actual artifact,
build and browser admission. Missing PNG/terminal/model bindings remain visible
beside available SVG evidence. Family support always requires an actual probe.

## Reading a gap

- `configured`: Trident has a reviewed invocation contract; a run can still fail.
- `conditional`: a declared browser SVG binding needs artifact/browser admission.
- `adapter-missing`: Trident lacks the binding or observer. This is not proof
  that the project lacks the capability.
- `project-unsupported`: the catalog does not declare the requested output.
- `reference-only`: the suite validates the pinned reference's own runner.
- `out-of-scope`: the catalog entry is a whole application, outside core benchmarks.

Campaign preflight also reports missing local prerequisites. Those are
environment blockers, not renderer defects. Completed records retain their
original statuses and dates; a new vocabulary never rewrites old results.

## Lineage and support assessment

[The complete lineage tree](LINEAGE.md) labels forks, ports and bindings, with
dependencies kept separate. Generate a fresh view with `bun commands.ts support
--lineage`. Whole-application workflows, unbranded descendants, zero-ahead forks and bindings are excluded from normal comparisons; scores still
require artifact/protocol proof before reuse. [The dated support stack rank](SUPPORT-QUALITY.md)
shows integration evidence and gaps for all 89 entries. [Report reading](REPORTING.md)
explains how to interpret the resulting scorecards.

Mermaid Dart (`orestesgaolin/mermaid`, `mermaid_core`) and Mermaid Flutter
(`pub:mermaid_flutter`, `mermaid_flutter`) have distinct branding. The lineage
records Flutter's native-renderer relationship to the Dart core. They remain
separate comparison projects without claiming independent parser/layout engines.
Historical combined-ID observations retain their original identity and protocol.
