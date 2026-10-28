# Executable inventory

`bun commands.ts bench --list` lists the public-artifact suites and selected catalog
projects. [BENCHMARKS.md](BENCHMARKS.md) explains their questions and limits.

`community:update`, portable `run`, `results:publish`, `results:compare`,
`fidelity:report` and `export` remain independent public entry points. Preparation
and report readers do not create additional benchmark scores.

Product source/editor/release orchestration lives in its owning repository.
Agentic Mermaid lists its local diagnostics with `bun run bench --list --profile full`.
