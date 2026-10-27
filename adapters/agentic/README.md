# Optional Agentic Mermaid source adapter

This adapter retains inherited experiments that import Agentic source, drive its product/editor contracts, or use a fixed candidate/peer protocol. It is separate from Trident's public artifact benchmarks. It does not make Agentic a reference, inject its checkout into the community league, or award its owning tests to other projects.

## Setup

Install both checkouts and the independent oracle. Build the selected product and site before choosing a workload that needs them. Git and tar are required; browser/product tests have their own real runtime prerequisites.

```sh
export TRIDENT_AGENTIC_ROOT=/checkouts/agentic-mermaid
bun commands.ts adapter agentic --help
bun commands.ts adapter agentic run --list --profile full
bun commands.ts adapter agentic run --profile full --suites dave \
  --rounds 3 --out /evidence/dave --executable /path/to/chromium
bun commands.ts adapter agentic test
bun commands.ts adapter agentic typecheck
```

A source run assembles public tracked source and Trident's owning protocols into an explicit disposable workspace under `.cache`. Both checkouts must be committed for measurements; checks/listing can exercise working files. `TRIDENT_CACHE_DIR` chooses another cache. Only an owned generated workspace may be replaced. An interrupted lock requires checking that its processes stopped. The workspace records both original revisions and leaves the product source unchanged.

Paths passed to the adapter are resolved before entering that workspace. Site, installed package, native executable, external application and baseline inputs stay explicit. `--target` does not redirect static source imports or product-owned tests. Direct scripts use `bun commands.ts adapter agentic source SCRIPT [options]`; the [declared shortcuts](agentic-scripts.json) and [inventory](INVENTORY.md) identify them. Corpus refresh is an explicit `adapter agentic corpus:import` operation; the frozen public corpus retains its origin rather than silently following the product.

`test`/`typecheck` here deliberately cover the source-dependent files. The public `commands.ts test` and `typecheck` always cover standalone Trident, even if `TRIDENT_AGENTIC_ROOT` happens to be set. Public help does not list source-only commands.

## Scope and migration limits

The source family's balanced portfolio is owned by Trident's
`unified/family-portfolio.ts`; the assembled workspace supplies its explicit
product registry and historical source inputs. Event Modeling and ZenUML each
have four independently authored feature witnesses with expected drawn labels.
This producer and its public-SVG admission test belong to the source adapter,
outside standalone checks. Event Modeling also uses the pinned grammar oracle.
ZenUML's upstream Node parser is a no-op: it cannot establish DSL validity.
The four ZenUML inputs follow the pinned documentation, but require actual
published-addon browser rendering before baseline admission can be claimed.
Other families retain the historical
selection priority and exact-source deduplication. A four-input quota provides
balanced workload coverage, not exhaustive language or painted fidelity.

Native blank builds exercise three connected Event Modeling frames and two
ZenUML participants with a call and reply. The operation matrix reads nested
ZenUML AST messages and Event Modeling frame/data/note fields, rather than
looking for messages in a nonexistent flat collection. Each advertised
operation without an authored positive recipe remains blocked; the separate
single metadata mutation witness does not certify all operations.

Dave and some meaning/startup/release runners still have fixed engines or Agentic-derived fixtures/imports. Source-only files remain in their inherited modules while their entry, workspace and launcher definitions live here. Moving those files alone would not make their workloads neutral. [The benchmark guide](../../BENCHMARKS.md) states which experiments have general value and which are local diagnostics.

Only the public `community:update --projects OWNER/TOOL` path supplies ordinary community rows. All npm candidates use `--candidate-dir` or verified tarballs, and all supported source candidates use the same explicit revision mechanism. Local `--package-root` selection, local native executable discovery and product compatibility policy cannot privilege this project in those rows.

Existing pinned product launchers can still call the legacy `agentic`, `source`, `bench`, `prs` and `corpus:import` aliases. They require explicit source selection and are not advertised as public benchmarks. New integrations should use `adapter agentic …`. Source `community`/`prs` orchestration is distinct from the public `community` alias for `community:update`.
