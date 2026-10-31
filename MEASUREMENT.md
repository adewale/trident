# Measurement boundaries

A comparable time requires a complete correctness verdict for **every actual
measured output**, not just a successful first render. The frozen plan names the
source contracts, artifact and binding identities, runtime, output format,
public-call boundary, cache/prelude policy and sampling population. See
[benchmark definitions](BENCHMARKS.md) and [release prerequisites](RELEASE.md).

The strict timing reducer requires the exhaustive durable invocation journal,
matching causal start/return pairs, actual API and controller clocks, retained
output bytes and complete checks by the declared observer. Calls must be serial;
independent replicas and rounds must use independent execution instances. Missing,
extra, interrupted or unchecked calls withhold comparison. A/A calibration measures
noise; it cannot supply missing correctness or establish an effect by itself.
`timing:qualify` validates retained evidence offline and makes no renderer calls.

API clocks stop after consuming the requested return. Whole CLI clocks include
process startup. Preparation, acquisition, independent output inspection and
cleanup stay outside the API clock. First use, repeated source, changed source,
configuration and edits are different tasks and keep separate tables. A percentile
of batch means is not an individual-call latency percentile.

The legacy community fixed core and `portable-svg-processes-v7` collectors retain
their original descriptive methods. The portable profile uses six rounds, 31 warm
adaptive sample means and five fresh workers per replica/round/positive input.
Those summaries do not contain the strict per-call proof above. Passing initial
output admission or A/A controls does not upgrade them to qualified performance.
Dated studies keep their original claims and limits.

Whole-child CPU/RSS, instantaneous process RSS/PSS, document V8 heap, retained
output and delivered bytes have different units and scopes. Browser heap is not
native/GPU/WASM memory; instantaneous samples are not peaks. Missing counters stay
unavailable. Coarse zero CPU measurements are censored, not evidence of free work.

Product stage instrumentation, editor completion boundaries and product release
budgets belong to their owning projects.
