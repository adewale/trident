# Native invocation and family startup artifacts

The complete invocation suite accepts `--native-executable /absolute/path/to/am`.
It uses that exact canonical executable, independently of an npm package's files.
Without an explicit selection it looks for `dist/am` under the measured
`packageRoot` (or target `root`). A missing, empty, unreadable or non-executable
explicit path blocks the lane; it never substitutes another binary.

`native-executable.json` records the selected path, canonical path, SHA-256 and
size. Every native observation carries that identity. A second byte check after
execution rejects observations if the executable changed. These checks run
outside the individual invocation latency windows. They do not establish that a
binary was built from the selected package source: retain the independent build
receipt alongside the campaign. The executable is not counted as npm-owned
payload. Its embedded runtime version remains unreported unless independently
established by that receipt.

The full profile runs the same installed/native CLI protocol: actual discovery,
input modes, output formats, watch, batch, Markdown and helper verbs. Smoke
runs the public SVG stdin operation and independently qualifies its consumed
output. Failed output earns no accepted latency sample. Entrypoint startup is a
separate fresh-process campaign and also accepts the explicit executable.

Startup family routing uses the reviewed portable family stimuli for diagram
registration exports, including the additional beta families. `treeView` maps
to the reviewed `treeview` source. The public Pele `info` entry uses an
independently authored `StartupInfo` title against its published parse/render
title contract. That title must actually appear; nonempty XML alone cannot
qualify it. Pinned Mermaid's Info renderer draws only its own version and ignores
caller titles. This is explicitly a Pele entry extension, with no shared Info
fidelity criterion or cross-tool ratio. Unrecognized
families retain import-readiness evidence and an explicit missing-render-fixture
gap. A first complete labeled artifact qualifies transport and startup readiness;
it does not certify full family semantics or visual fidelity.

These changes do not rewrite earlier attempts. In the historical source61 run,
the native invocation lane ignored the explicit executable while the separate
startup lane successfully measured it. That blocked invocation observation
remains evidence of a harness defect. The nine extra Pele startup registrations
previously recorded import readiness only; new render evidence requires a fresh
startup attempt under the changed producer identity. Benchmarks remain local
and excluded from CI.


The startup campaign also enrolls pinned Mermaid 12.2.0 from the configured
reference package. Its public `dist/mermaid.esm.min.mjs` browser distribution
runs in a fresh real Chromium instance, using the same two-node authored source,
public initialization, first complete SVG/JSON consumption and separate resource
pass as the other browser entries. Package and installed dependency bytes are
bound to its retained record. The root `mermaid.core.mjs` export is a different
public entry: its bare package imports are appropriate to Node, while the shipped
browser distribution resolves its actual browser chunks without a synthetic
bundle. Neither entry substitutes for the other in delivery measurements.

Mermaid's returned `bindFunctions` callback remains retained with the result but
is not invoked or assigned a serialized byte cost. This baseline measures a
usable SVG return, not interactive event binding or screenshot paint.
Node/Bun import readiness is measured under its actual root export. Node/Bun SVG
render remains explicitly blocked because no genuine SVG geometry environment
is admitted; a real Canvas 2D preflight does not provide SVG `getBBox`. No
synthetic bounding boxes qualify a startup baseline. Browser and Node startup
measurements therefore remain distinct environment panels. The Mermaid package
declares no CLI/MCP/native executable, so those interfaces are not applicable.

Watch artifact observation combines directory events with a 10 ms readback
fallback. A truncate/write event can expose a partial SVG and a later complete
write may produce no second directory notification. The fallback accepts only
actual current-marker bytes ending in a complete SVG, retains the original
30 second deadline, and closes on success, failure or cancellation. Watch
latency includes this consumer observation cadence; it is not an isolated API
or filesystem publication timestamp. Earlier timeouts remain historical.
The product's separate readiness announcement can still precede source watcher
installation; this harness change does not sleep through or conceal that race.
