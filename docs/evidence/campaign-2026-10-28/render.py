#!/usr/bin/env python3
"""Render this dated report from its published projections, without benchmarks.

python3 docs/evidence/campaign-2026-10-28/render.py --out /fresh/charts
Requires the repository's existing matplotlib/numpy reporting dependencies.
Three historical Dave SVGs are copied and hash-checked, not reconstructed.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import sys
import tempfile

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=False)
    load = lambda name: json.loads((HERE / name).read_text())
    manifest = load('manifest.json')
    for entry in manifest['files']:
        if entry['path'].startswith('dave-') and entry['path'].endswith('.svg'):
            source = HERE / entry['path']
            assert hashlib.sha256(source.read_bytes()).hexdigest() == entry['sha256']
            shutil.copyfile(source, args.out / source.name)

    sys.path.insert(0, str(REPO))
    spec = importlib.util.spec_from_file_location('trident_charts', REPO / 'unified/charts.py')
    charts = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(charts)
    with tempfile.TemporaryDirectory(prefix='dated-pr-charts-') as temporary:
        figures = charts.Figures(Path(temporary))
        plt = figures.plt
        plt.rcParams.update({'svg.fonttype': 'none', 'svg.hashsalt': 'trident-2026-10-28'})
        # Same published ratio/band cells, shaped for the maintained PR plotter.
        pr = load('pr-metrics.json')
        selected = {'import', 'firstSvg', 'svg', 'ascii'}
        ranks = []
        for target in pr['targets']:
            if target['integration'] not in {'main', 'integrated'} or target['sourceEvidence'] != target['id']:
                continue
            rank = dict(target, label=target['id'] + ' @' + target['head'][:8], draft=False)
            rank['metricsByCache'] = {cache: {r['metric']: r for r in pr['rows'] if r['target'] == target['id'] and r['cache'] == cache and r['metric'] in selected} for cache in ['0', '1']}
            rank['metrics'] = rank['metricsByCache']['1']
            ranks.append(rank)
        save_pr = figures.save
        figures.save = lambda fig, name, title, note, rows: save_pr(fig, name, 'Frozen 27 October heads; costs measured 28 October', note, rows)
        figures.prs(dict(pr, ranks=ranks))
        shutil.copyfile(Path(temporary) / 'prs-cache-0-1.svg', args.out / 'pr-paired-costs.svg')

    def save(fig, name):
        fig.savefig(args.out / name, metadata={'Date': None})
        plt.close(fig)

    wanted = {'adewale/agentic-mermaid', 'mermaid-js/mermaid', 'obsidianmd/pele', 'Dicklesworthstone/frankenmermaid', 'Latias94/merman'}
    paint = [(r, next(c for c in r['cells'] if c['surface'] == 'browser-owned-ink')) for r in load('fidelity.json')['rows'] if r['project'] in wanted]
    paint.sort(key=lambda item: (-item[1]['passed'], item[0]['project']))
    fig, ax = plt.subplots(figsize=(12, 3.7))
    for y, (r, c) in enumerate(paint):
        ax.barh(y, c['passed'] / 920 * 100, color='#167c80')
        ax.text(102, y, f"{c['passed']}/920; {c['failed']} failed, {c['unavailable']} unavailable", va='center', fontsize=9, clip_on=False)
    ax.set_yticks(range(len(paint)), [r['project'] + ' ' + r['version'] for r, c in paint])
    ax.invert_yaxis(); ax.set_xlim(0, 100)
    ax.set_xlabel('Passed / 920 Mermaid-qualified paint criteria (%)')
    fig.suptitle('Authored paint fidelity — fixed denominator, selected implementations')
    fig.subplots_adjust(left=.33, right=.75, top=.86, bottom=.20)
    save(fig, 'paint-fidelity.svg')

    groups = load('startup.json')['groups']
    resources = [r for r in groups if r['phase'].startswith('resources-') and r['runtime'] == 'node' and r['surface'] == 'library:.' and r['operation'] in ['render:svg', 'renderMermaidSVG:svg'] and r['qualified'] == r['attempted'] and r['resources'].get('peakRssBytes')]
    resources.sort(key=lambda r: r['resources']['peakRssBytes']['median'])
    fig, ax = plt.subplots(figsize=(10, 3.7))
    for y, r in enumerate(resources):
        v = r['resources']['peakRssBytes']
        ax.barh(y, v['median'] / 1048576, color='#167c80')
        ax.errorbar(v['median'] / 1048576, y, xerr=[[(v['median'] - v['min']) / 1048576], [(v['max'] - v['median']) / 1048576]], color='#333', capsize=4)
        ax.text(v['median'] / 1048576 + 2, y, f"n={v['n']}", va='center')
    ax.set_yticks(range(len(resources)), [r['project'] + ' / ' + r['operation'] for r in resources]); ax.invert_yaxis()
    ax.set_xlim(0, max(r['resources']['peakRssBytes']['max'] for r in resources) / 1048576 * 1.16)
    ax.set_xlabel('Whole child-lifetime peak RSS (MiB), median and observed range')
    ax.set_title('Node SVG resource diagnostics — Mermaid geometry unavailable')
    fig.text(.02, .01, 'Includes runtime, import, consumption, storage and GC; not API allocation. No Mermaid bar is invented.', fontsize=8)
    fig.tight_layout(rect=(0, .05, 1, 1)); save(fig, 'node-svg-memory.svg')

    latency = [r for r in groups if r['selected'] and r['mode'] == 'process-to-first-consumed' and r['runtime'] == 'node' and r['surface'] == 'library:.' and r['operation'] in ['render:svg', 'renderMermaidSVG:svg', 'renderResolvedScene:svg'] and r['elapsedMs']['n'] >= 20 and r['qualified'] == r['attempted']]
    fig, ax = plt.subplots(figsize=(10, 4))
    for y, r in enumerate(latency):
        v = r['elapsedMs']; ax.barh(y, v['median'], color='#485ea8'); ax.scatter(v['p95'], y, marker='D', color='#b77816')
        ax.text(max(v['p95'], v['median']) + 7, y, f"n={v['n']}", va='center')
    ax.set_yticks(range(len(latency)), [r['project'] + ' / ' + r['operation'] for r in latency]); ax.invert_yaxis()
    ax.set_xlim(0, max(r['elapsedMs']['p95'] for r in latency) * 1.2)
    ax.set_xlabel('Spawn through first fully consumed artifact (ms); dot = p95')
    ax.set_title('Node public-entry startup — exact operations stay separate')
    fig.text(.02, .01, 'Original 665 and scoped 7d observations are separate methods. Descriptive; no paired speedup or cold-filesystem claim.', fontsize=8)
    fig.tight_layout(rect=(0, .05, 1, 1)); save(fig, 'node-svg-startup.svg')
    for path in args.out.glob('*.svg'):
        svg = re.sub(r'\s*<dc:date>[^<]+</dc:date>', '', path.read_text())
        path.write_text('\n'.join(line.rstrip() for line in svg.splitlines()) + '\n')
    print('Rendered seven SVGs from published inputs; no target implementation was invoked.')


if __name__ == '__main__':
    main()
