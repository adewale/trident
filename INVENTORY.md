# Benchmark inventory

Use [BENCHMARKS.md](BENCHMARKS.md) for descriptions, value judgments and run paths. The inventory has two boundaries:

- **Public artifact benchmarks:** `community:update`, compiled `run`, and the records/reports they produce. They need actual project artifacts and the independent Mermaid oracle, not an Agentic source checkout.
- **Optional source experiments:** explicit source-adapter suites, owning product tests, preparation, orchestration and report readers. List their exact current IDs with `bun commands.ts adapter agentic run --list --profile full` after source setup. See [adapter inventory](adapters/agentic/INVENTORY.md).

A test file, record reducer, corpus builder or campaign controller is not an additional independent benchmark. A callable runner is not evidence that all prerequisites exist, all tools are supported, or a completed score has been published. Old snapshots have been removed.
