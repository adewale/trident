"""Reconcile the five candidate tables against the retained owning observations.

python3 docs/evidence/am-zm-2026-10-29/reduce.py EXTRACTED_EVIDENCE --check results/latest.json
No acquisition, project execution, or timing occurs here.
"""
import argparse
import collections
import gzip
import json
import math
from pathlib import Path
import statistics

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('evidence', type=Path)
parser.add_argument('--check', type=Path)
args = parser.parse_args()
root = args.evidence
load = lambda path: json.loads((root / path).read_text())
projects = load('artifacts.json')['receipts']
identities = {entry['project']: entry for entry in projects if 'artifact' in entry}
projects = list(identities)
versions = {project: identities[project]['artifact']['version'] + ' @ ' + identities[project]['revision'][:8] for project in projects}
results = {}
def retain(key, columns, rows):
    results['am-zm-' + key + '-2026-10-29'] = {'columns': ['Version'] + columns, 'rows': [{'project': project, 'values': [versions[project]] + rows[project]} for project in projects]}
def counts(rows):
    assert len({row['caseId'] for row in rows}) == len(rows), 'Duplicate criterion/input'
    return collections.Counter(row['status'] for row in rows)

inventory = load('docs/inventory.json')
case_ids = {case['id'] for case in inventory['cases']}
assert len(case_ids) == inventory['occurrences']
blocks = [load('docs-result.json'), load('docs-reverse-result.json')]
groups = {}
returned = {}
for project in projects:
    groups[project] = {case: [] for case in case_ids}
    round_counts = []
    for block in blocks:
        rows = [row for row in block['observations'] if row['metrics'].get('project') == project and row['operation'] == 'render']
        for round_id in range(1, 6):
            own = [row for row in rows if row['metrics']['round'] == round_id]
            assert {row['caseId'] for row in own} == case_ids
            round_counts.append(counts(own))
        for row in rows:
            groups[project][row['caseId']].append(row)
    assert all(value == round_counts[0] for value in round_counts)
    passed = sum(len(rows) == 10 and all(row['status'] == 'passed' for row in rows) for rows in groups[project].values())
    assert passed == round_counts[0]['passed']
    returned[project] = [passed, inventory['occurrences'] - passed, inventory['occurrences']]
retain('docs', ['Returned', 'No SVG', 'Planned'], returned)
common = sorted(case for case in case_ids if all(len(groups[p][case]) == 10 and all(row['status'] == 'passed' for row in groups[p][case]) for p in projects))
assert common
costs = {}
for project in projects:
    medians = [statistics.median(row['samplesMs'][0] for row in groups[project][case]) for case in common]
    assert all(math.isfinite(value) and value >= 0 for value in medians)
    costs[project] = [len(common), 10, round(statistics.median(medians), 2), round(sorted(medians)[math.ceil(.95 * len(medians)) - 1], 2), round(sum(medians), 2)]
retain('docs-call-cost', ['Common inputs', 'Calls per input', 'Median input (ms)', 'p95 input medians (ms)', 'Sum input medians (ms)'], costs)

meaning = load('fidelity-result.json')['observations']
meaning_rows = {}
criterion_sets = []
for project in projects:
    rows = [row for row in meaning if row['metrics'].get('implementation') == project and row['surface'] == 'browser-owned-ink']
    c = counts(rows)
    assert set(c) <= {'passed', 'failed', 'blocked'}
    criterion_sets.append({row['caseId'] for row in rows})
    meaning_rows[project] = [c['passed'], c['failed'], c['blocked'], len(rows)]
assert all(ids == criterion_sets[0] for ids in criterion_sets)
retain('meaning', ['Passed', 'Failed', 'Unavailable', 'Planned'], meaning_rows)

populations = []
compatibility = {'svg': {}, 'terminal': {}}
for project, short in zip(projects, ['am', 'zm']):
    with gzip.open(root / ('community-' + short + '-corrected/community-inputs.json.gz')) as handle:
        inputs = json.load(handle)['workloads']
    eligible = {item['id'] for item in inputs if item.get('intent') == 'render' and item.get('referenceAdmission', {}).get('accepted') is True and not item['id'].startswith('core:')}
    populations.append(eligible)
    observations = load('community-' + short + '-corrected-result.json')['observations']
    assert not any(row['caseId'] == '*' for row in observations), 'Setup failure is not coverage'
    def selected(surface, output):
        rows = [row for row in observations if row['surface'] == surface and row['format'] == output and row['caseId'] in eligible and row['mode'].startswith('feature-corpus-')]
        assert {row['caseId'] for row in rows} == eligible
        counts(rows)
        return rows
    for output in compatibility:
        rows = selected('node:public-api', output)
        c = counts(rows)
        assert set(c) <= {'passed', 'failed', 'unsupported'}
        compatibility[output][project] = [c['passed'], c['failed'], c['unsupported'], len(eligible)]
        if output == 'svg':
            browser = selected('browser:public-api', output)
            assert {row['caseId']: row['status'] for row in browser} == {row['caseId']: row['status'] for row in rows}
assert all(ids == populations[0] for ids in populations)
for output, rows in compatibility.items():
    retain('compatibility-' + output, ['Passed', 'Failed', 'Unsupported', 'Planned'], rows)
if args.check:
    snapshot = json.loads(args.check.read_text())
    actual = {table['id']: {'columns': table['columns'], 'rows': sorted(table['rows'], key=lambda row: row['project'])} for table in snapshot['tables'] if table['id'] in results}
    expected = {key: {**table, 'rows': sorted(table['rows'], key=lambda row: row['project'])} for key, table in results.items()}
    assert actual == expected, 'Snapshot differs from raw evidence reduction'
    print('Five candidate tables reconcile with owning inputs, observations and samples.')
else:
    print(json.dumps(results, indent=2))
