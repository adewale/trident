#!/usr/bin/env python3
"""Read a completed DaveBench PNG run; never render or change raw records."""
import collections
import csv
import json
import math
from pathlib import Path
from statistics import median
import sys

run, out = map(Path, sys.argv[1:])
out.mkdir(parents=True, exist_ok=False)
result = json.loads((run / 'result.json').read_text())
context = json.loads((run / 'context.json').read_text())
inventory = json.loads((run / 'inventory.json').read_text())
rows = result['observations']
participants = sorted(context['participants'], key=lambda p: p['id'])
expected = len(inventory['cases'])
rounds = context['rounds']
assert len(rows) == len(participants) * rounds * expected
ids = {c['id'] for c in inventory['cases']}
inputs = {c['id']: c for c in inventory['cases']}
by_project = {p['id']: collections.defaultdict(list) for p in participants}
for row in rows:
    by_project[row['metrics']['project']][row['caseId']].append(row)
for groups in by_project.values():
    assert set(groups) == ids
    assert all(len(values) == rounds and len({r['metrics']['round'] for r in values}) == rounds for values in groups.values())
common = sorted(set.intersection(*({case for case, values in groups.items() if all(r['status'] == 'passed' for r in values)} for groups in by_project.values())))
round_rows, timing_rows, dispositions, nonpasses, failures = [], [], [], [], []
lines = ['# DaveBench PNG export', '', f"Protocol `{result['protocol']}`; measured {result['startedAt']} to {result['finishedAt']}.", '', f"{expected} documentation occurrences; {inventory['distinct']} distinct trimmed sources; {len(inventory['pages'])} pinned pages. {rounds} rounds, 30 warmup attempts, one export per occurrence. No input is filtered by reference acceptance.", '', 'PNG qualification decodes actual bytes and checks nonuniform visible content. It does not check labels, topology, clipping or equivalent quality. Timers end at encoded bytes, before validation and file writes.', '', '## Outcomes', '', '| Project / version / runtime | Round | PNG bytes returned | Qualified | Failed | Observer/infrastructure blocked |', '|---|---:|---:|---:|---:|---:|---:|']
for p in participants:
    project = p['id']
    own = [r for r in rows if r['metrics']['project'] == project]
    for n in range(1, rounds + 1):
        group = [r for r in own if r['metrics']['round'] == n]
        counts = collections.Counter(r['status'] for r in group)
        record = dict(project=project, version=p['version'], runtime=p['runtime'], round=n, planned=expected, returned=sum(bool(r['metrics']['pngReturned']) for r in group), passed=counts['passed'], failed=counts['failed'], blocked=counts['blocked'])
        round_rows.append(record)
        lines.append(f"| {project} {p['version']} / {p['runtime']} | {n} | {record['returned']} | {record['passed']} | {record['failed']} | {record['blocked']} |")
    for case, values in sorted(by_project[project].items()):
        counts = dict(collections.Counter(r['status'] for r in values))
        status = max(counts, key={'passed': 0, 'blocked': 1, 'failed': 2}.__getitem__)
        dispositions.append(dict(project=project, case=case, family=inputs[case]['family'], status=status, roundCounts=json.dumps(counts, sort_keys=True), commonQualified=case in common))
        if status != 'passed':
            nonpasses.append(dict(project=project, case=case, source=inputs[case]['source'], observations=values))
            failures.append(dict(project=project, case=case, status=status, stages=dict(collections.Counter(r['metrics'].get('failureStage') for r in values if r['status'] != 'passed')), details=list(dict.fromkeys(r.get('detail') for r in values if r.get('detail')))))
    for case in common:
        group = by_project[project][case]
        times = [r['samplesMs'][0] for r in group]
        widths = [r['metrics']['width'] for r in group]
        heights = [r['metrics']['height'] for r in group]
        timing_rows.append(dict(project=project, case=case, medianMs=median(times), minMs=min(times), maxMs=max(times), calls=len(times), medianPixels=median(w*h for w,h in zip(widths, heights)), medianBytes=median(r['metrics']['outputBytes'] for r in group)))
lines += ['', '## Costs on common qualified occurrences', '', f"All four qualify the same {len(common)} occurrences in every round. Each input contributes its median across {rounds} calls. The table reports the median/p95 across these input medians and their sum. This p95 is a workload distribution, not single-call tail latency.", '', '| Project / version | Common occurrences | Median input median (ms) | P95 input median (ms) | Sum of input medians (ms) | Median output pixels | Median encoded bytes |', '|---|---:|---:|---:|---:|---:|---:|']
summary_cost = []
for p in participants:
    data = [r for r in timing_rows if r['project'] == p['id']]
    if not data: continue
    times = sorted(r['medianMs'] for r in data)
    item = dict(project=p['id'], version=p['version'], commonOccurrences=len(data), medianMs=median(times), p95InputMedianMs=times[math.ceil(.95*len(times))-1], sumInputMedianMs=sum(times), medianPixels=median(r['medianPixels'] for r in data), medianBytes=median(r['medianBytes'] for r in data))
    summary_cost.append(item)
    lines.append(f"| {p['id']} {p['version']} | {len(data)} | {item['medianMs']:.3f} | {item['p95InputMedianMs']:.3f} | {item['sumInputMedianMs']:.3f} | {item['medianPixels']:.0f} | {item['medianBytes']:.0f} |")
lines += ['', 'Intrinsic bounds, themes/fonts, backgrounds, output pixels and runtime backends differ. These are practical public PNG export costs, not equal-pixel throughput or a calibrated renderer speed ranking. Native/Agentic API stages are opaque; the browser raw rows keep SVG return, preparation/decode, canvas draw and PNG production separate. No A/A calibration, cold-start or source-update claim.', '', '## Failures and evidence', '', '[Every nonpass with source](nonpasses.json), [per-input dispositions](input-dispositions.csv), [raw per-input timings](common-timings.csv), [per-round outcomes](outcomes.csv) and [machine-readable summary](summary.json). Owning raw samples, PNGs, SVGs, warmups, exact artifacts and environment remain in the adjacent retained run.', '', f"Collection status: {result['status']}; completion never implies qualification passed. Public documentation is development-exposed, not a production holdout."]

def write_csv(name, data):
    if not data: return
    with (out/name).open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(data[0]))
        writer.writeheader(); writer.writerows(data)
write_csv('outcomes.csv', round_rows)
write_csv('input-dispositions.csv', dispositions)
write_csv('common-timings.csv', timing_rows)
(out/'nonpasses.json').write_text(json.dumps(nonpasses, indent=2)+'\n')
(out/'summary.json').write_text(json.dumps(dict(protocol=result['protocol'], measuredFrom=result['startedAt'], measuredTo=result['finishedAt'], plannedOccurrences=expected, distinctSources=inventory['distinct'], pages=len(inventory['pages']), rounds=rounds, commonOccurrences=len(common), outcomes=round_rows, costs=summary_cost, failures=failures), indent=2)+'\n')
(out/'README.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'out':str(out),'commonOccurrences':len(common),'outcomes':round_rows,'costs':summary_cost}))
