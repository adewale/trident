# Fixed PNG export: reviewed DaveBench profile

The separately declared Pele/native Flutter follow-up passes calibration on
20 reviewed inputs. Native Flutter takes **6.31× as long** in this application
task, using the geometric mean of paired per-input medians; the case-bootstrap
range is **6.09–6.54×**. This is a warm, headless export to an opaque 1200×900 PNG.
It does not establish native widget performance or isolated renderer/encoder speed.

| Participant | Median input median | Median PNG size | A/A estimate | 95% case-bootstrap range |
|---|---:|---:|---:|---:|
| Pele 1.9.0 / Chromium | 13.37 ms | 33.07 KiB | 0.996 | 0.974–1.017 |
| mermaid_flutter 0.3.2 / native Flutter release | 87.62 ms | 13.76 KiB | 1.030 | 1.012–1.047 |

Each input contributes its median across 50 calls, then the table takes the
median across 20 inputs. The paired geometric ratio is a different statistic
from dividing the two table medians. Both A/A ranges fit inside the unchanged
0.90–1.10 gate. There are **2,000 measurements and 160 warmups**.

Pele calls public `render()` and a shared Chromium PNG adapter. Native Flutter
calls actual public `renderToPng()` in a Linux release app. Its intrinsic PNG must
be decoded, padded and encoded again to meet the required dimensions; that work
is inside its total. The native API-stage median is **14.58 ms**, while the
normalization-stage median is **70.68 ms**. These separately aggregated medians
are not additive. The fixed-output requirement accounts for much of the native
cost; an application accepting intrinsic PNG bounds has a different task.

All candidates passed both implementations' source-fact and legibility checks.
The collapsed-group negative control remains excluded: Flutter paints internal
A/B/C nodes while Pele hides them. Sources, control outputs and failures remain
retained. All 42 qualification PNGs exactly match the earlier visual review.
Layouts, palettes, role font sizes and compression differ; encoded size is
reported alongside time. There is no downscaling or clipping.

## Wider comparison remains uncalibrated

The preceding four-library campaign used 18 common inputs. It has a different
case mix and active-process load and must remain separate from the pair follow-up.

| Participant | Observed median input median | A/A 95% range | Gate |
|---|---:|---:|---|
| Agentic Mermaid 0.4.1 / Chromium | 39.13 ms | 1.189–1.327 | Fail |
| Mermaid 12.2.0 / Chromium | 55.58 ms | 0.931–1.003 | Pass |
| mermaid_flutter 0.3.2 / native release | 87.21 ms | 0.955–1.008 | Pass |
| Pele 1.9.0 / Chromium | 14.43 ms | 0.914–1.011 | Pass |

**Four-way ratios and ranking remain withheld.** Agentic's replica difference is
unresolved. A focus probe found all six browser documents focused and visible,
which does not support focus as the explanation. Agentic also fails group
membership in two of the 20 candidates, leaving 18 common inputs for that campaign.
Its collapsed-group control exposes hidden nodes as Flutter's does.

## What changed in Trident

The earlier [controlled campaign](controlled-png-results.md) failed calibration.
The follow-up adds an enforced cgroup: CPU2, one-CPU quota, 16 GiB, private PID
namespace and no external network. Every live thread is checked after startup,
after warmup and at completion. In the primary pair those snapshots cover
173, 174 and 167 threads, all constrained to CPU2. Unlike inherited `taskset`
masks, the kernel limit constrains renderer attempts to reset affinity.

Browser export now uses synchronous `canvas.toDataURL('image/png')` followed by
Base64 decoding into binary PNG bytes before stopping the clock. This blocks the
browser main thread and is appropriate to this headless task, not a UI latency
claim. The [version-tagged Chromium source](https://chromium.googlesource.com/chromium/src/+/refs/tags/154.0.8037.57/third_party/blink/renderer/core/html/canvas/canvas_async_blob_creator.cc#289) uses idle tasks for main-thread asynchronous
PNG encoding. In a diagnostic with real SVG calls, `toBlob()` had 25 PNG-stage
samples over 30 ms out of 120; the synchronous variant had none. All 240 PNGs
matched reviewed pixels. A simpler cached-bitmap probe did not reproduce the delay.
These diagnostics support the adapter change without proving every earlier
replica discrepancy had that cause.

Untimed validation decodes each reference, hashes every returned PNG and reuses
that decoding only for exact encoded-byte matches. New streams are decoded;
every input/participant must match its reviewed pixels. Untimed transport sends
a Base64 string instead of individual byte objects. Both changes affect cadence,
so older campaigns are retained separately. Stage clocks keep SVG return, drawing,
raster-image creation and combined PNG readback/encoding distinct; public APIs
do not expose isolated encoder CPU costs.

## Environment, evidence and reproduction

The primary campaign ran 2026-10-29T02:40:39.268Z–02:42:48.944Z, with source
`d4a4f84ebbf66ca8ef98d21ab3e6de24db762740`. The native release bundle was built
at `7e45a65304a37cd212b8e1790e5b9067939cb5f8`; later changes affect the browser
adapter, transport and participant ownership.

The same cloud host uses AMD EPYC 9V74, Debian 13.6/Linux 6.18.55. All participants
in each campaign run in one container under the same enforced CPU/memory limits.
Versions: Chromium 154.0.8037.57, Playwright 1.58.2, Node 24.19.0, Flutter 3.47.8,
Dart 3.13.7, mermaid_flutter/core 0.3.2. Software GL and `LP_NUM_THREADS=1` are
requested. The image supplies directory structure; readonly host userland mounts
supply the installed binaries. Its rootfs hash is not a complete userland digest.

[Immutable evidence index and archive downloads](https://github.com/adewale/trident/blob/9e82d936e17b35af60ee9823083d3b591bab032d/README.md)
retain the pair, both wider campaigns and all probes. Archive SHA256:
`46580fe55c4863047c18bd75706b69a7ab9931c2458e68b8ef04751cf1c4945c`.

- [Primary raw samples](https://raw.githubusercontent.com/adewale/trident/9e82d936e17b35af60ee9823083d3b591bab032d/samples.jsonl)
- [Calibrated primary summary](https://github.com/adewale/trident/blob/9e82d936e17b35af60ee9823083d3b591bab032d/summary.json)
- [Source-fact decisions and pixel hashes](https://github.com/adewale/trident/blob/9e82d936e17b35af60ee9823083d3b591bab032d/review.json)
- [Exact environment and artifacts](https://github.com/adewale/trident/blob/9e82d936e17b35af60ee9823083d3b591bab032d/context.json)
- [Independent primary audit](https://github.com/adewale/trident/blob/9e82d936e17b35af60ee9823083d3b591bab032d/result-audit.json)
- [Uncalibrated four-library summary](https://github.com/adewale/trident/blob/9e82d936e17b35af60ee9823083d3b591bab032d/four-library-summary.json)

![Actual Pele and native Flutter decision-loop PNGs from the primary pair, cropped without resizing](https://raw.githubusercontent.com/adewale/trident/9e82d936e17b35af60ee9823083d3b591bab032d/representative/primary-contact.png)

Inspect all five labels, Yes/No branches and the return edge. Both pass. Open at
1×; unedited 1200×900 originals remain beside the contact sheet.

![Four-library collapsed-group control: Agentic and native Flutter expose hidden A/B/C](https://raw.githubusercontent.com/adewale/trident/9e82d936e17b35af60ee9823083d3b591bab032d/representative/collapsed-control-contact.png)

The control contributes no timing to either admitted cohort.


Independent Python implementations reproduce the primary pair and wider campaign
reductions. The primary audit agrees in 37,274 checks and verifies its 42 actual
qualification images, 2,160 output files and all isolation snapshots. The earlier
campaigns' failed gates remain unchanged.

Use the [reproduction guide](../davebench-png/controlled/README.md), including
`--participants pele,flutter` for the primary pair. Participant selection, source,
runtime configuration and actual reference pixels are bound to the review.
The 20-input pair and 18-input wider profile cover six families; neither is the
full 548-input DaveBench suite or an unseen production sample. No new cold-start,
source-update, widget-frame or DOM-mount results are claimed.
