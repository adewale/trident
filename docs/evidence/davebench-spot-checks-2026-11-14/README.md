# DaveBench completion: reference-rejected inputs and semantic spot-checks (2026-11-14)

Evidence for the 0.4.0 DaveBench results in `results/release/report.json` (1,342 documentation
occurrences of Mermaid commit `370c4af5`, three runs per lane). These files hold evidence only.
They change no count.

## 1. Inputs the Mermaid reference rejects

`reference.json` holds the verdict of the pinned Mermaid oracle (mermaid 12.3.0,
@mermaid-js/parser 2.0.1, jsdom 26.1.0, `mermaid.parse` through `portable/mermaid-oracle.ts`) on
every input. It accepts 1,338 and rejects four:

| Position | Input | Mermaid error |
|---:|---|---|
| 11 | docs/config/8.6.0_docs.md:82 | Parse error on line 10: (dangling `g-->`) |
| 12 | docs/config/8.6.0_docs.md:94 | Parse error on line 10: (same source) |
| 41 | docs/config/directives.md:100 | No diagram type detected matching given configuration for text: (directives followed by `...`) |
| 42 | docs/config/directives.md:106 | No diagram type detected … (same source) |

These are the inputs that every recorded SVG run of Mermaid failed with a parser or detection
error, which is the rule `referenceRejectedInputs` in `unified/davebench-report.ts` applies to the
published report. Replaying them through DaveBench's browser path with the prepared Mermaid
artifact gives the same errors (`reference.json`, `replays`).

The reference's other two recorded failures, docs/syntax/flowchart.md:1129 and :1135 (one source
with `A@{ img: "https://mermaid.js.org/favicon.svg", … }`), are not rejections. Mermaid parses the
source. Its render then fails with "The source image cannot be decoded." because the DaveBench
browser host aborts every request outside the artifact's own origin. With the image request
answered locally, Mermaid completes both (`replays`). They stay accepted inputs that the
reference failed. That failure is caused by the harness, so the reference loses 2 completions it
would otherwise have.

## 2. Spot-check sample

`sample.ts` draws the sample from the published report with a fixed rule:

- Projects: the top 6 SVG projects and the top 3 terminal projects, ranked by completed
  reference-accepted inputs (`acceptedCompletion`), each on its counted run.
- For each project, in priority order, deduplicated by source text, with families not yet
  sampled taken first inside a tier:
  - T1: up to 2 reference-rejected inputs the project rendered.
  - T2: up to 2 accepted inputs the project completed and the reference (Mermaid SVG) failed.
  - T3: up to 3 accepted inputs that only this project completed within its top-N group.
  - T4: up to 3 accepted inputs it completed that other group members failed, most failures
    first.
  - T5: inputs from new families, in sha256(id) order, to fill the sample to 6.
- At most 8 inputs per project. This gives 55 renders (36 SVG, 19 terminal).

`render.ts` renders each sampled input through DaveBench's own call paths with the prepared
artifacts of the 0.4.0 campaign. Browser projects use `browserHost` and `davebenchBrowserCall`
with `keepOutput`. CLI projects use `davebenchCliCall` or `terminalCliCall` with `onOutput`.
termaid uses `TerminalCallWorker` with an admission hook that captures the text. Every render was
admitted again as `completed`, which agrees with the published runs. The outputs are in
`outputs/`, and two runs produced byte-identical files.

Each output was inspected by eye: the SVG rasterised in Chromium, the terminal text read
directly. It was compared with the source and, for SVG, with the reference's drawing. The
verdicts are:

- **draws the source**: every labelled element of the source (nodes, messages, sets, frames,
  titles) is present and the structure roughly matches.
- **partial**: something is drawn from the source, but a labelled element is missing or
  mis-drawn. For reference-rejected inputs, a drawing of the valid part also counts as partial.
- **placeholder or wrong**: the output does not represent the source. Examples are raw source
  lines in boxes, raw attribute text as a label, or a mis-parsed structure.
- **undecidable**: not used.

`spot-checks.json` holds one row per render: project, format, input, selection tier, verdict, a
one-line reason and the output file.

## 3. Results

| Project | Format | Draws the source | Partial | Placeholder or wrong |
|---|---|---:|---:|---:|
| Latias94/merman 0.10.0 | SVG | 6 | 0 | 0 |
| mermaid-js/mermaid 12.3.0 (reference control) | SVG | 6 | 0 | 0 |
| crabtalk/bezel 0.2.26 | SVG | 6 | 0 | 0 |
| obsidianmd/pele 1.13.0 | SVG | 6 | 0 | 0 |
| wevm/ondine 0.0.3 | SVG | 6 | 0 | 0 |
| 1jehuang/mermaid-rs-renderer 0.3.1 | SVG | 1 | 4 | 1 |
| Dicklesworthstone/frankenmermaid 0.5.0 | terminal | 2 | 3 | 2 |
| wevm/ondine 0.0.3 | terminal | 5 | 1 | 0 |
| fasouto/termaid 0.12.0 | terminal | 1 | 2 | 3 |
| **Total (55)** | | **39** | **10** | **6** |

### What the sample shows

- **Completion beyond the reference on accepted inputs is an artefact of the harness.** Merman
  1,338 against Mermaid 1,336, and every SVG candidate's "+2 over the reference", come from
  flowchart.md:1129/:1135. Mermaid fails those only because the sandbox blocks the external
  image. The candidates that pass emit an `<image>` pointing at the same URL, which is just as
  unfetchable, and mermaid-rs-renderer draws a diamond with the raw attribute text.
- **Rendering a reference-rejected input is not a success.** frankenmermaid draws a box labelled
  `...` for a source that has no diagram. For the dangling-edge source it adds a node that shows
  an internal token (`__fm_dangling_line_9_placeholder`). termaid silently drops the bad edge.
  Under the old count, these earned completion credit.
- **Equal or near-equal completion counts hide different drawing quality.** bezel, pele and ondine
  (1,306) and mermaid-rs-renderer (1,304) each complete about 32 inputs the others fail. The
  inputs only the bezel group completes (eventmodeling, a flowchart with an `initialize`
  directive) draw correctly. The inputs only mermaid-rs-renderer completes (zenuml) are partial:
  method calls, loops and titles are dropped. Their SVGs carry ~99% the same text with the same
  commit hashes, so bezel and pele are near-identical outputs, and their tie is not independent
  evidence. ondine draws the same structures in its own theme.
- **Terminal admission lets fallbacks through.** termaid's zenuml completions, the inputs only it
  or few others complete, are raw source lines drawn as boxes. The terminal fallback rule needs
  the header, or at least three statements, shown verbatim, so short sources and sources wrapped
  line by line pass. frankenmermaid's terminal lead (1,334 against 1,306 and 1,286) includes a
  mis-parsed zenuml drawing.
- Where the top projects agree, on inputs most of them complete, every sampled output draws the
  source.

Completion is a necessary condition for drawing: a failed input draws nothing. It is not a
measure of drawing. In this sample, 25 of the 40 completions that give one project an advantage
over another (T1–T4) draw the source. Every sampled zenuml advantage of mermaid-rs-renderer
(3) and termaid (3) is partial or wrong. Mechanical admission catches empty output, error text and
header echoes, but not structural loss. The sample is small and chosen to target advantages, so
these proportions do not estimate corpus-wide correctness. Drawing Correctness is the measure
for that.

## Reproduce

From this directory, with the 0.4.0 prepared artifacts (`community-browser-prepared.json`,
`community-prepared.json`) and frozen catalog, `TRIDENT_CHROMIUM_EXECUTABLE` set, and the pinned
oracle installed:

```sh
bun sample.ts ../../../results/release/report.json ../../../../mermaid sample.json
bun render.ts sample.json outputs PREPARED_DIR FROZEN_CATALOG ../../../../mermaid
bun reference-check.ts ../../../../mermaid PREPARED_DIR FROZEN_CATALOG reference.json
```
