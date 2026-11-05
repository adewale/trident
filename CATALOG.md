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
has a separately verified native PNG binding. Those historical labels are not
verification results.
The current normal selection has **27 renderers**. The earlier 39-project freeze
also included twelve projects now marked catalogue-only. Parser, validator,
formatter and conversion-only tools cannot enter renderer campaigns; Rusty
Mermaid's diagnostics-only entry is excluded by this rule as well as retaining
its broken-release record. Whole-editor applications remain discovery-only.
The catalogue preserves all 89 identities, including the **62 current exclusions**.
Historical receipts retain their original project counts and measured evidence.

Of the 45 forks, 25 were recorded with zero commits ahead of their parent; four
were also zero behind. A fork name therefore cannot establish another distinct
engine. Conversely, identical Git pins do not alone permit measurement reuse:
build recipes, shipped bytes, runtime and invocation evidence must match.
See `unified/catalog-eligibility.ts`.

## Lineage

[The complete lineage tree](LINEAGE.md) labels forks, ports and bindings, with
dependencies kept separate (`lineageMarkdown` in `unified/lineage.ts` renders it). Non-renderers, catalogue-only entries, whole applications, unbranded descendants, zero-ahead forks and bindings are excluded from normal comparisons; scores still
require artifact/protocol proof before reuse. [Report reading](REPORTING.md)
explains how to interpret the resulting tables.

Mermaid Dart (`orestesgaolin/mermaid`, `mermaid_core`) and Mermaid Flutter
(`pub:mermaid_flutter`, `mermaid_flutter`) have distinct branding. The lineage
records Flutter's native-renderer relationship to the Dart core. They remain
separate comparison projects without claiming independent parser/layout engines.
Historical combined-ID observations retain their original identity and protocol.
