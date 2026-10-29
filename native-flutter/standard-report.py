#!/usr/bin/env python3
"""Reduce retained standard collectors without rendering or changing observations."""
import csv
import gzip
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from statistics import median
import sys


def read(path):
    value = json.loads(path.read_text())
    if value.get('kind') == 'benchmark-result-reference':
        payload = value['payload']
        packed = (path.parent / payload['path']).read_bytes()
        assert hashlib.sha256(packed).hexdigest() == payload['sha256']
        return json.loads(gzip.decompress(packed))
    return value


def write_csv(path, rows):
    with path.open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def native_project_id(observations):
    identities = {row.get('metrics', {}).get('implementation') for row in observations
                  if row.get('format') == 'png' and row.get('metrics', {}).get('implementation') in ('pub:mermaid_flutter', 'orestesgaolin/mermaid')}
    if len(identities) != 1:
        raise ValueError('Expected one recorded native project identity; do not combine or relabel old and new campaigns')
    return identities.pop()


def main():
    run, out = map(Path, sys.argv[1:3])
    other = Path(sys.argv[3]) if len(sys.argv) == 4 else run
    out.mkdir(parents=True, exist_ok=False)
    workloads = read(run / 'community/community-inputs.json')['workloads']
    inputs = {row['id']: row for row in workloads}
    assert len(inputs) == len(workloads)
    observations = read(run / 'community/result.json')['observations']
    dispositions, costs, failures, coverage = [], [], [], []
    priority = {'failed': 6, 'blocked': 5, 'unsupported': 4, 'not-applicable': 3, 'passed': 1}
    # Historical reports retain their recorded combined project ID.
    native = native_project_id(observations)
    for project, runtime, output in [(native, None, 'png'), ('obsidianmd/pele', 'chromium', 'svg')]:
        groups = defaultdict(list)
        for row in observations:
            if (row.get('metrics', {}).get('implementation') == project and row['format'] == output
                    and row['caseId'] in inputs and (runtime is None or row['runtime'].lower() == runtime)):
                groups[row['caseId']].append(row)
        assert set(groups) == set(inputs), 'Do not silently reduce a partial inventory'
        for case, rows in sorted(groups.items()):
            status = max((row['status'] for row in rows), key=priority.__getitem__)
            dispositions.append(dict(project=project, output=output, case=case, family=inputs[case]['family'], status=status, recordedObservations=len(rows)))
            if status in ('failed', 'blocked', 'unsupported'):
                failures.append(dict(project=project, case=case, status=status, source=inputs[case]['source'], observations=rows))
            timed = [row for row in rows if row['mode'] == 'core-api-repeat' and row['status'] == 'passed']
            if timed:
                first = [row['metrics']['firstMs'] for row in timed]
                repeated = [sample for row in timed for sample in row['samplesMs']]
                costs.append(dict(project=project, output=output, case=case, firstMedianMs=median(first), firstMinMs=min(first), firstMaxMs=max(first), firstN=len(first), repeatBatchMeanMedianMs=median(repeated), repeatMinMs=min(repeated), repeatMaxMs=max(repeated), repeatN=len(repeated)))
        counts = Counter(row['status'] for row in dispositions if row['project'] == project)
        coverage.append(dict(project=project, output=output, inventory=len(inputs), eligible=len(inputs)-counts['not-applicable'], counts=dict(counts)))
    docs = read(other / 'docs/result.json')['observations']
    docs_rounds = []
    for round_number in range(1, 6):
        rows = [r for r in docs if r.get('metrics', {}).get('project') == 'obsidianmd/pele' and r['metrics'].get('round') == round_number]
        docs_rounds.append(dict(round=round_number, counts=dict(Counter(r['status'] for r in rows)), occurrences=len(rows)))
    meaning = read(other / 'fidelity/result.json')['observations']
    surfaces = sorted({r['surface'] for r in meaning})
    summary = dict(measured=read(run / 'report.json'), otherSuitesMeasured=read(other / 'report.json'), compatibility=coverage,
                   docs=dict(inventory={k: v for k, v in read(other / 'docs/inventory.json').items() if k in ('pin', 'pages', 'occurrences', 'distinct', 'protocol')}, rounds=docs_rounds,
                             failures=[r for r in docs if r['status'] == 'failed']),
                   meaning={surface: dict(Counter(r['status'] for r in meaning if r['surface'] == surface)) for surface in surfaces},
                   meaningFailures=[r for r in meaning if r['status'] == 'failed'],
                   limitation='PNG decoded raster content, SVG admission/labels, painted criteria and model facts have separate evidence contracts. No cross-format speed ratio.')
    (out / 'summary.json').write_text(json.dumps(summary, indent=2)+'\n')
    (out / 'nonpasses.json').write_text(json.dumps(failures, indent=2)+'\n')
    write_csv(out / 'input-dispositions.csv', dispositions)
    write_csv(out / 'core-timings.csv', costs)
    print(json.dumps({'out': str(out), 'coverage': coverage}))


if __name__ == '__main__':
    main()
