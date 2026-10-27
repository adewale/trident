"""Rebuild the compact charts from sibling comparison.json; no benchmark runtime needed."""
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

root = Path(__file__).resolve().parent
data = json.loads((root / 'comparison.json').read_text())
records = data['records']
reference = next(r for r in records if r['project'] == 'mermaid-js/mermaid')
plt.rcParams.update({'svg.fonttype': 'none', 'svg.hashsalt': 'review-20261027', 'font.size': 10, 'axes.spines.top': False,
                     'axes.spines.right': False, 'figure.facecolor': 'white'})
names = {'mermaid-js/mermaid': 'Mermaid', 'obsidianmd/pele': 'Pele',
         'adewale/agentic-mermaid': 'Agentic', 'orestesgaolin/mermaid': 'Mermaid Dart',
         'AlexanderGrooff/mermaid-ascii': 'Mermaid ASCII'}

def name(r):
    if r.get('label'):
        return r['label'] + ' ' + r['version']
    text = names[r['project']] + ' ' + r['version']
    if r['project'] == 'adewale/agentic-mermaid':
        text += ' (candidate)' if r['lane'] == 'candidate' else ' (release)'
    return text

def browser_lane(r):
    return next((lane for lane in r['lanes'] if lane['surface'] == 'browser:public-api'
                 and lane['format'] == 'svg'), None)

browser = [r for r in records if browser_lane(r)
           and r['browserComparison'] == reference['browserComparison']]
colors = lambda r: '#127c9e' if r['lane'] == 'candidate' else ('#676b73' if r == reference else '#7550a0')

def save(fig, stem):
    svg = root / (stem + '.svg')
    fig.savefig(svg, bbox_inches='tight', metadata={'Date': None})
    svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines()) + '\n')
    fig.savefig(root / (stem + '.png'), dpi=160, bbox_inches='tight')
    plt.close(fig)

timed = sorted([r for r in browser if browser_lane(r)['coreFirstMs'] is not None],
               key=lambda r: browser_lane(r)['coreFirstMs'])
fig, ax = plt.subplots(figsize=(11, max(4, len(timed) * .45 + 1.6)))
values = [browser_lane(r)['coreFirstMs'] for r in timed]
ax.barh([name(r) for r in timed], values, color=[colors(r) for r in timed])
ax.invert_yaxis()
ax.set_xscale('log')
ax.set_xlabel('Milliseconds, logarithmic scale; lower costs less API time')
ax.set_title('Browser SVG: six first calls, sum of per-input medians over five rounds')
for i, value in enumerate(values):
    ax.annotate(f'{value:,.1f} ms', (value, i), xytext=(5, 0), textcoords='offset points', va='center')
ax.set_xlim(right=max(values) * 2.5)
fig.text(0, -.035, 'Only complete, qualified core portfolios. Five rounds do not establish small performance differences.\n'
         'API time excludes loading and qualification; repeated-source/cache-hit costs are separate.')
save(fig, 'browser-first-call')

fig, axes = plt.subplots(1, 3, figsize=(15, max(4.5, len(browser) * .48 + 1.5)), sharey=True)
specs = [('startupMs', 1, 'Fresh-realm library load/init (ms)'),
         ('coreGzipBytes', 1048576, 'Observed delivery after core (MiB gzip)'),
         ('coreJsHeapUsedBytes', 1048576, 'Retained V8 heap after core (MiB)')]
for ax, (field, unit, title) in zip(axes, specs):
    for i, record in enumerate(browser):
        value = record['browserResources'][field]
        if value is not None:
            ax.barh(i, value / unit, color=colors(record))
            ax.annotate(f'{value / unit:,.2f}', (value / unit, i), xytext=(3, 0), textcoords='offset points', va='center', fontsize=9)
    ax.set_yticks(range(len(browser)), [name(r) for r in browser])
    ax.set_title(title, fontsize=10)
    ax.set_xlim(right=ax.get_xlim()[1] * 1.25)
axes[0].invert_yaxis()
fig.suptitle('Different costs, different units; browser SVG on one machine', y=1.01)
fig.text(0, -.05, 'Delivery and heap: same six core inputs, fresh realms, medians over rounds 2–5. Heap is forced-GC V8 only; excludes native/WASM/GPU.\n'
         'Mermaid includes the required pinned ZenUML addon. Initialization: median over all five fresh realms. Missing measurements are unavailable.')
save(fig, 'browser-resources')

selected = [(r, browser_lane(r)) for r in browser]
for record in records:
    if record['project'] == 'AlexanderGrooff/mermaid-ascii':
        lane = next((lane for lane in record['lanes'] if lane['format'] == 'terminal'), None)
        if lane:
            selected.append((record, lane))
families = data['currentFamilies']
matrix = np.full((len(selected), len(families)), np.nan)
for i, (record, lane) in enumerate(selected):
    for j, family in enumerate(families):
        stats = lane['families'][family]
        count = stats['passed'] + stats['failed']
        if not stats['unsupported'] and count:
            matrix[i, j] = stats['passed'] / count
fig, ax = plt.subplots(figsize=(15, max(4.5, len(selected) * .45 + 1.3)))
cmap = plt.get_cmap('YlGnBu').copy()
cmap.set_bad('#d7d7d7')
image = ax.imshow(matrix, cmap=cmap, vmin=0, vmax=1, aspect='auto')
ax.set_yticks(range(len(selected)), [name(r) + (' [terminal CLI]' if lane['format'] == 'terminal' else ' [browser SVG]') for r, lane in selected])
ax.set_xticks(range(len(families)), families, rotation=55, ha='right')
ax.set_title('Raw output admission by family: format and available label checks')
fig.colorbar(image, ax=ax, label='Passed / (passed + failed) in measured cases', shrink=.8)
fig.text(0, -.13, 'Gray: unsupported or no admitted measurement. Rows use their own outputs; the terminal row is not a browser performance comparison.\n'
         'Raw checks include parser-only, rejected-input and format-only cases. Painted topology, relationships and perceptual quality are not established.')
save(fig, 'family-admission')

fig, ax = plt.subplots(figsize=(11, max(4.5, len(browser) * .5 + 1.5)))
y = np.arange(len(browser))
ax.barh(y - .17, [r['browserResources']['coreGzipBytes'] / 1048576 for r in browser], height=.32, label='Six core inputs')
ax.barh(y + .17, [(r['browserResources']['fullPortfolioGzipBytes'] or 0) / 1048576 for r in browser], height=.32, label='Full attempted portfolio (coverage differs)')
ax.set_yticks(y, [name(r) for r in browser])
ax.invert_yaxis()
ax.set_xlabel('MiB gzip equivalents of observed responses, not measured wire packets')
ax.set_title('Observe consumed resources as well as the initial path')
ax.legend(loc='lower right')
fig.text(0, -.035, 'The full portfolio can load optional backends, including ZenUML in Mermaid. Unsupported families consume less work.\n'
         'This is observed delivery for a named workload, not a static bundle inventory or an equal-functionality claim.')
save(fig, 'browser-delivery')

def lane_rate(lane):
    total = lane['passed'] + lane['failed']
    return lane['passed'] / total if total else 0

def raw(lane):
    return f"{lane['passed']}/{lane['passed'] + lane['failed']} ({100 * lane_rate(lane):.1f}%)"

def labels(lane):
    a = lane.get('authoredLabels')
    if a is None:
        return 'unavailable'
    total = a['passed'] + a['failed']
    return f"{a['passed']}/{total}" + (f" ({100 * a['passed'] / total:.1f}%)" if total else '')

def ms(value):
    return '—' if value is None else f'{value:,.1f} ms'

def order(r):
    lane = browser_lane(r)
    return (-len(lane['supported']), -lane_rate(lane), lane['coreFirstMs'] if lane['coreFirstMs'] is not None else float('inf'))

base_ms = browser_lane(reference)['coreFirstMs']
def ratio(r):
    value = browser_lane(r)['coreFirstMs']
    return 'reference' if r == reference else ('—' if value is None else f'{base_ms / value:.2f}×')

releases = [reference] + sorted([r for r in browser if r['lane'] == 'community' and r != reference], key=order)
candidates = sorted([r for r in browser if r['lane'] == 'candidate'], key=order)
lines = ['# Community and open-PR benchmark snapshot', '',
         f"Measured {min(r['startedAt'] for r in records)} through {max(r['finishedAt'] for r in records)}. Five rounds, 1,087 fixed inputs across 33 families; 25 in the current mark and eight supplementary. Pinned Mermaid **12.2.0** is the reference; Pele is uniformly **1.9.0**. This snapshot covers five community projects, current Agentic and the five open Agentic PR heads captured in `runs.json`. It is the community suite, not a rerun of all 62 source suites or the full 88-project catalog.", '',
         'These are matched protocols on one Linux machine. The other community records retain their earlier protocols and dates; they are not silently mixed into these ranks. Candidate builds stay outside the release league. Every raw record has retained failures; collection completed successfully, but these runs do not pass a complete-fidelity gate.', '',
         '## Released tools: browser SVG', '',
         'Order: supported families, then raw admission rate, then qualified fixed-core API time. Mermaid defines the reference and is unranked. `vs Mermaid` is reference time / tool time; values above one cost less API time.', '',
         '| Rank | Tool | Families | Raw admission | Accepted-input format + labels | First-call core | vs Mermaid |',
         '|---:|---|---:|---:|---:|---:|---:|']
for i, r in enumerate(releases):
    lane = browser_lane(r)
    lines.append(f"| {'reference' if r == reference else i} | {name(r)} | {len(lane['supported'])}/25 | {raw(lane)} | {labels(lane)} | {ms(lane['coreFirstMs'])} | {ratio(r)} |")
lines += ['', '## Captured PR heads and main snapshots: browser SVG', '',
          'This separate candidate rank uses the same ordering and protocol. It compares exact artifact snapshots, including their base and resolved dependencies; it does not isolate a PR’s causal impact. #393 changes documentation only relative to its own base; #487 changes assertion tooling. This community lane does not validate those PRs’ specific features. #449 is measured through the default public API, without selecting its optional layout engine. #532 fixes architecture geometry; architecture is covered by feature admission but is outside the six timed core inputs. These figures cannot certify that geometry fix. The documentation-only #533 does not change renderer inputs and is not retimed.', '',
          '| Rank | Candidate | Source head | Families | Raw admission | Accepted-input format + labels | First-call core | vs Mermaid |',
          '|---:|---|---|---:|---:|---:|---:|---:|']
for i, r in enumerate(candidates, 1):
    lane = browser_lane(r)
    lines.append(f"| {i} | [{name(r)}](candidate-{r['key']}.md) | `{r['head'][:8]}` | {len(lane['supported'])}/25 | {raw(lane)} | {labels(lane)} | {ms(lane['coreFirstMs'])} | {ratio(r)} |")
lines += ['', 'The earlier-main row is the initial local 0.4.2 capture at renderer base `b33e9efc5e3a6ade516148cc45d138af3dcfaa02`. The latest-main row retains the actual #532 measurement at `d3dd8adf`; #532 subsequently merged. A fresh build of public main `e8cb92ec` plus the launcher-only pin has **all 99 executable assets byte-identical**, each verified against the measured record, with equal exports and runtime declarations. [Equivalence proof](execution-equivalence.json). No new clocks or rewritten record claim that docs, tarballs or arbitrary dependency resolution are identical. The recorded npm consumer closure still applies. Exact source heads, archive digests and dates remain in `runs.json`.', '',
          '![Browser SVG first-call API costs](browser-first-call.svg)', '',
          'First-call cost sums the six inputs’ per-input median first calls over five fresh realms. It excludes loading and qualification. Repeated-source/cache-hit costs are retained separately in the JSON and individual candidate reports. Five rounds do not establish small performance differences.', '',
          '## Costs, delivery and memory', '',
          '![Browser resource costs in distinct units](browser-resources.svg)', '',
          'Heap is retained V8 heap after forced GC on the same six core inputs, medians over rounds 2–5. It excludes native, WASM and GPU memory; it is not total process memory. Startup is fresh-realm library load/init, not browser-process startup or complete entry-point time. CLI CPU/peak RSS diagnostics remain separate in `comparison.json`; no matching Mermaid CLI baseline was measured. Dollar costs are unavailable, not zero.', '',
          '![Core and full-portfolio observed delivery](browser-delivery.svg)', '',
          'Gzip equivalents are computed from resources actually requested, rather than a static count of all files on disk. Full-portfolio delivery includes optional backend loading and varies with supported families. It is not an equal-functionality comparison.', '',
          '## Admission across families and outputs', '',
          '![Raw admission by family and measured output](family-admission.svg)', '',
          'Mermaid ASCII is a terminal CLI and does not enter a browser-SVG speed rank. The chart keeps its output distinct. Raw admission combines format checks, available label expectations, parser-only fixtures and legacy rejected inputs. The secondary accepted-input format-and-label view excludes oracle-rejected and unlabeled cases and exposes its unavailable/blocked counts in the JSON. Unsupported coverage is a gap, not a failure or zero-cost render.', '',
          '| Build | Surface | Output | Families | Raw admission | Accepted-input format + labels |',
          '|---|---|---|---:|---:|---:|']
for r in records:
    for lane in r['lanes']:
        if lane['format'] == 'terminal':
            lines.append(f"| {name(r)} | {lane['surface']} | terminal | {len(lane['supported'])}/25 | {raw(lane)} | {labels(lane)} |")
current = next(r for r in records if r['key'] == data.get('currentRendererKey', 'current'))
released = next(r for r in records if r['key'] == 'release')
cur, old = browser_lane(current), browser_lane(released)
lines += ['', '## Evidence retention', '',
          'Local cleanup removed 640,114 obsolete historical files and archives (28.5 GB logical bytes), plus five reproducible source-build dependency trees (5.8 GB). Compact historical summaries (73.7 MB), original source edits, current owning records, measured runtime closures and exact candidate artifacts remain. The committed snapshot is about 2 MB; no large archives or raw render directories were uploaded. [Cleanup summary](cleanup-summary.json).', '',
          '## What improved and what became more expensive', '',
          f"Current Agentic uses **{100 * (1 - cur['coreFirstMs'] / old['coreFirstMs']):.1f}% less first-call browser API time** than published 0.4.1 in this portfolio ({ms(old['coreFirstMs'])} → {ms(cur['coreFirstMs'])}). Measured family support rises from {len(old['supported'])} to {len(cur['supported'])} of 25. Coverage and raw denominators differ, so the pass-rate change is not a paired all-functionality score.", '',
          f"The core browser payload is **{100 * (current['browserResources']['coreGzipBytes'] / released['browserResources']['coreGzipBytes'] - 1):.1f}% larger**, and retained V8 heap is **{100 * (current['browserResources']['coreJsHeapUsedBytes'] / released['browserResources']['coreJsHeapUsedBytes'] - 1):.1f}% higher**. Node parser cost also rises in the candidate report. These tradeoffs matter: the benchmark does not collapse speed, memory, coverage and delivery into one score. Many source/dependency changes separate these artifacts; these measurements do not assign causal credit to one optimization.", '',
          '## Remaining limits', '',
          '- The pinned Mermaid control has 67 raw failed observations: 18 rejection observations from nine legacy inputs, 24 renderer exceptions, 19 standalone-XML portability failures and six label-retention failures. Twenty-two exceptions are axis/title-only XY parser fixtures without drawable series. This is evidence about different boundaries, not 67 equivalent fidelity bugs.',
          '- Forty-two preparation caveats are retained in each record’s input ledger: nine rejected sources, 32 without nonempty getter-derived label expectations and ZenUML without a public model getter. Independent authored ZenUML labels remain checked. Parser-only and renderable feature cases still need a stronger distinction at corpus import.',
          '- Label admission does not establish identities, multiplicity, connectivity, painted routes, styling or perceptual fidelity. Event Modeling inline data/relationships and ZenUML native models remain gaps. Required family representatives are not exhaustive feature coverage.',
          '- PNG admission checks signature and dimensions, not rendered text, semantic correspondence or perceptual quality.',
          '- This run does not exercise every Agentic entry point or API-option combination. Dave, original pinned-Mermaid assertions, complete invocation, family-functionality and other source suites remain separate; see the overview and inventory.',
          '- Total browser/native/WASM/GPU memory, statistically tight performance differences, production workloads and model-provider dollar prices remain outside this comparison.', '',
          '## Reproduce and update', '',
          'The figures and Markdown can be rebuilt from the committed aggregate data alone with Python, Matplotlib and NumPy:', '',
          '```sh', 'python3 results/review-20261027/plot.py', '```', '',
          'To refresh this exact snapshot from its retained owning records in a Trident checkout:', '',
          '```sh', 'bun results/review-20261027/update.ts RECORD_STORE', 'python3 results/review-20261027/plot.py', '```', '',
          'The updater verifies the exact record owners and candidate archive digests in `runs.json`; it does not render or collect timings. The committed snapshot contains compact aggregates, caveats and case-change reports. Full raw owning records and native artifacts remain local; they were not uploaded. The chart rebuild has no dependency on session paths or benchmark runtimes.', '',
          'For a new measurement, install the pinned Mermaid oracle/addon with `node commands.ts mermaid:install`, prepare or bind any native artifact the catalog requires, then use `community:update --projects OWNER/TOOL --profile full --rounds 5 --records STORE --out RUN`. For an unreleased package, select one project and add `--candidate-tarball FILE --candidate-sha256 HEX`. Keep the same input, runtime and protocol settings for comparisons. `--plan` proves whether matching records will be reused; omit `--force` to avoid repeating unchanged clocks. Update `runs.json` only to select intentionally changed records and retain their new measurement dates.', '',
          'The cache dry run returned reuse for all 11 exact records with zero timing lanes under the frozen producer identity. [Reuse proof](reuse-proof.json). Subsequent source-candidate code changes are a new measurement protocol; these historical timings retain their recorded producer set rather than being silently upgraded.', '',
          '[Benchmark overview](../../OVERVIEW.md) · [Inventory](../../INVENTORY.md) · [Methodology](../../METHODOLOGY.md) · [Exact records and source heads](runs.json) · [Data](comparison.json)', '']
(root / 'README.md').write_text('\n'.join(lines))
