# Recover startup resource measurements independently

`--startup-passes all|latency|resources` selects the work to execute. The default
is `all`. Selection is recorded in retained settings and every observation.
Latency uses the requested samples per round; resource collection retains one
independent checkpoint per round. Resource observations contain no latency
samples, and their returned artifacts are qualified independently.

With `all` or `resources`, selected library/CLI/MCP workflows require verified
GNU time. Preparation checks its version and numeric output using an empty
runtime before discovering or invoking the target. A missing observer stops
collection with a prerequisite error. Use `--startup-passes latency` explicitly
when process resources are outside scope. A browser-only campaign uses native
Chromium CDP heap/RSS/PSS measurements and does not require GNU time.

To repair missing process resources, select one unchanged project, use a verified
`--startup-observer`, choose `--startup-passes resources`, and restrict
`--startup-surfaces` to the missing interfaces. Write to fresh output and record
store directories. Preserve the completed latency records and any already valid
browser diagnostics. Retained pass/source/observer identities distinguish the
new resource attempt; resource-only success does not certify historical failed
latency attempts or imply a complete replacement run.

Programmatic browser campaigns may set `startupOperations` to public operation
names, such as `['resolved-scene']`. Selection is written to an artifact and
observations before collection. Unselected website surfaces are not started;
unavailable requested methods stay blocked. Library consumers may explicitly
filter prepared jobs, retaining that scope in their campaign receipt. These
controls permit an invalid qualifier's owning operation to be rerun without
repeating unaffected entry points. Raw historical failures remain immutable.

CPU and RSS scopes remain whole-process diagnostics. Paired empty library
controls do not isolate API allocations. Native executables and MCP servers
retain their declared resource boundaries; browser device GPU memory and
individual native/WASM allocations are not attributed. Benchmarks remain
excluded from CI.
