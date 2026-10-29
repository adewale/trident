#!/usr/bin/env python3
"""Independent raw-result audit; does not import or execute the producer reducer."""
import collections
import hashlib
import json
import math
from pathlib import Path

BASE = Path('/workspace/davebench-png-v2')
RUN = BASE / 'measurement-2'
SCRIPT = Path(__file__).resolve()
DIFFS = []
CHECKS = 0


def read(name):
    return json.loads((RUN / name).read_text())


def check(label, actual, expected, numeric=False):
    global CHECKS
    CHECKS += 1
    good = (isinstance(actual, (int, float)) and not isinstance(actual, bool)
            and math.isfinite(actual) and math.isclose(actual, expected,
                                                       rel_tol=1e-12, abs_tol=1e-12)) if numeric else actual == expected
    if not good:
        DIFFS.append({'field': label, 'actual': actual, 'expected': expected})


def middle(values):
    ordered = sorted(values)
    n = len(ordered)
    if not n:
        raise ValueError('Empty sample group')
    return ordered[n // 2] if n % 2 else (ordered[n // 2 - 1] + ordered[n // 2]) / 2


def mulberry32(seed):
    mask = (1 << 32) - 1
    state = seed & mask
    while True:
        state = (state + 0x6D2B79F5) & mask
        mixed = ((state ^ (state >> 15)) * (state | 1)) & mask
        product = ((mixed ^ (mixed >> 7)) * (mixed | 61)) & mask
        mixed = ((mixed + product) & mask) ^ mixed
        yield ((mixed ^ (mixed >> 14)) & mask) / (1 << 32)


def bootstrap(case_results):
    logs = [math.log(c['A'] / c['B']) for c in case_results]
    # Explicit sequential addition matches the declared arithmetic order.
    total = 0.0
    for value in logs:
        total += value
    estimate = math.exp(total / len(logs))
    generator = mulberry32(20261029)  # Reset independently for each library.
    draws = []
    for _ in range(10000):
        accumulated = 0.0
        for _ in logs:
            accumulated += logs[int(next(generator) * len(logs))]
        draws.append(math.exp(accumulated / len(logs)))
    draws.sort()
    interval = [draws[250], draws[9750]]
    return {'estimate': estimate, 'ci95': interval,
            'pass': interval[0] >= 0.90 and interval[1] <= 1.10}


def audit():
    context, summary, complete = read('context.json'), read('summary.json'), read('completed.json')
    rows = [json.loads(line) for line in (RUN / 'rows.jsonl').read_text().splitlines() if line.strip()]
    measured = [r for r in rows if r['phase'] == 'measure']
    warmed = [r for r in rows if r['phase'] == 'warmup']
    cases = context['commonCases']
    participants = [p['id'] for p in context['participants']]
    check('sourceCommit', context['sourceCommit'], '219535c3575dffd79d1e028636cedf7ab2583006')
    check('completed.complete', complete['complete'], True)
    check('completed.preflight', complete['preflight'], False)
    check('context.preflight', context['preflight'], False)
    check('context.rounds', context['rounds'], 5)
    check('context.repetitions', context['repetitions'], 5)
    check('context.seed', context['seed'], 20261029)
    check('cases.count', len(cases), 18)
    check('cases.unique', len(set(cases)), 18)
    check('participants', sorted(participants), ['agentic', 'flutter', 'mermaid', 'pele'])
    check('rows.total', len(rows), 3888)
    check('rows.measured', len(measured), 3600)
    check('rows.warmup', len(warmed), 288)
    check('rows.ids.unique', len({r['id'] for r in rows}), len(rows))
    check('rows.status', dict(collections.Counter(r['status'] for r in rows)), {'ok': 3888})
    check('rows.phase', dict(collections.Counter(r['phase'] for r in rows)), {'measure': 3600, 'warmup': 288})
    check('rows.cases', sorted({r['case'] for r in rows}), sorted(cases))
    check('rows.participants', sorted({r['participant'] for r in rows}), sorted(participants))
    check('rows.variants', sorted({r['variant'] for r in rows}), ['A', 'B'])
    expected_slots = {(round_, rep) for round_ in range(1, 6) for rep in range(1, 6)}
    grouped = collections.defaultdict(list)
    warmgroups = collections.Counter()
    review = read('review.json') if (RUN / 'review.json').exists() else None
    for row in rows:
        for field in ['totalMs', 'apiMs', 'normalizationMs']:
            value = row.get(field)
            check(f"rows.{row['id']}.{field}.finite_nonnegative",
                  isinstance(value, (int, float)) and not isinstance(value, bool)
                  and math.isfinite(value) and value >= 0, True)
        check(f"rows.{row['id']}.stage_sum", row['apiMs'] + row['normalizationMs'], row['totalMs'], True)
        check(f"rows.{row['id']}.dimensions", [row['inspection']['width'], row['inspection']['height']], [1200, 900])
        if review:
            check(f"rows.{row['id']}.reviewed_pixels", row['inspection']['pixelSha256'],
                  review['cases'][row['case']]['pixels'][row['participant']])
        if row['phase'] == 'measure':
            grouped[(row['participant'], row['case'], row['variant'])].append(row)
        elif row['phase'] == 'warmup':
            warmgroups[(row['participant'], row['case'], row['variant'])] += 1
            check(f"rows.{row['id']}.warmup_slot", [row['round'], row['rep']], [0, 0])
    recomputed = {}
    versions = {p['id']: p['version'] for p in context['participants']}
    check('summary.library_keys', sorted(summary['byLibrary']), sorted(participants))
    for participant in participants:
        reported = summary['byLibrary'][participant]
        reported_cases = {c['id']: c for c in reported['perCase']}
        check(f'{participant}.perCase.count', len(reported['perCase']), 18)
        check(f'{participant}.perCase.ids', sorted(reported_cases), sorted(cases))
        results = []
        for case in cases:
            replicas = {}
            for alias in ['A', 'B']:
                key = (participant, case, alias)
                replicas[alias] = grouped[key]
                label = f'{participant}.{case}.{alias}'
                check(label + '.measure_count', len(replicas[alias]), 25)
                check(label + '.unique_round_rep_count', len({(r['round'], r['rep']) for r in replicas[alias]}), 25)
                check(label + '.round_rep_coverage', sorted({(r['round'], r['rep']) for r in replicas[alias]}), sorted(expected_slots))
                check(label + '.warmup_count', warmgroups[key], 2)
            samples = replicas['A'] + replicas['B']
            result = {'id': case, 'A': middle([r['totalMs'] for r in replicas['A']]),
                      'B': middle([r['totalMs'] for r in replicas['B']]), 'samples': len(samples)}
            for field in ['totalMs', 'apiMs', 'normalizationMs']:
                result[field] = middle([r[field] for r in samples])
            for field in ['A', 'B', 'totalMs', 'apiMs', 'normalizationMs', 'samples']:
                check(f'{participant}.{case}.{field}', reported_cases.get(case, {}).get(field), result[field], True)
            results.append(result)
        aa = bootstrap(results)
        median_case = middle([c['totalMs'] for c in results])
        for field, value in [('version', versions[participant]), ('cases', 18), ('samples', 900)]:
            check(f'{participant}.{field}', reported.get(field), value)
        check(f'{participant}.medianCaseMs', reported['medianCaseMs'], median_case, True)
        check(f'{participant}.aa.estimate', reported['aa']['estimate'], aa['estimate'], True)
        for index in [0, 1]:
            check(f'{participant}.aa.ci95.{index}', reported['aa']['ci95'][index], aa['ci95'][index], True)
        check(f'{participant}.aa.pass', reported['aa']['pass'], aa['pass'])
        recomputed[participant] = {'cases': 18, 'measured': 900, 'warmups': 72,
                                   'samplesPerCaseAlias': 25, 'medianCaseMs': median_case,
                                   'aa': aa, 'perCase': results}
    calibrated = all(p['aa']['pass'] for p in recomputed.values())
    check('independent.calibrated', calibrated, False)
    check('summary.calibrated', summary['calibrated'], calibrated)
    check('summary.measured', summary['measured'], len(measured))
    check('summary.warmups', summary['warmups'], len(warmed))
    check('summary.protocol', summary['protocol'], context['protocol'])
    check('summary.scope', summary['scope'], context['contract']['scope'])
    check('summary.aaPolicy', summary['aaPolicy'], context['aaPolicy'])
    ratio_fields = {key: summary[key] for key in ['ratios', 'comparisons'] if key in summary}
    check('summary.relative_comparison_field_present', bool(ratio_fields), True)
    for key, value in ratio_fields.items():
        check('summary.' + key, value, [])
    inputs = {name: hashlib.sha256((RUN / name).read_bytes()).hexdigest()
              for name in ['context.json', 'rows.jsonl', 'summary.json', 'completed.json']}
    return {'verdict': 'PASS' if not DIFFS else 'FAIL',
            'meaning': 'Raw-result/summary agreement; performance calibration failed, so all relative performance claims must be withheld.',
            'scriptPath': str(SCRIPT), 'scriptSha256': hashlib.sha256(SCRIPT.read_bytes()).hexdigest(),
            'runPath': str(RUN), 'sourceCommit': context['sourceCommit'],
            'method': {'implementation': 'Independent Python; no reducer imports', 'bootstrap': 'paired case bootstrap of log(A-median/B-median), geometric mean',
                       'rng': 'Mulberry32', 'seed': 20261029, 'draws': 10000,
                       'ciSortedIndicesZeroBased': [250, 9750], 'acceptanceInterval': [0.90, 1.10],
                       'numericRelativeTolerance': 1e-12, 'numericAbsoluteTolerance': 1e-12},
            'counts': {'total': len(rows), 'measure': len(measured), 'warmup': len(warmed),
                       'cases': len(cases), 'libraries': len(participants), 'aliases': 2,
                       'measurePerCaseAliasLibrary': 25, 'warmupPerCaseAliasLibrary': 2},
            'checks': CHECKS, 'diffs': DIFFS, 'recomputed': recomputed,
            'calibrated': calibrated, 'relativeClaimsWithheld': not calibrated,
            'summaryRelativeComparisonFields': ratio_fields,
            'affinityAttempt': {'admitted': False, 'analyzed': False, 'timingRowsRead': 0,
                                'reason': 'User-reported NOT-ADMITTED setup; no files from that attempt were opened.'},
            'inputSha256': inputs}


if __name__ == '__main__':
    try:
        result = audit()
    except Exception as error:
        result = {'verdict': 'FAIL', 'scriptPath': str(SCRIPT), 'checks': CHECKS,
                  'diffs': DIFFS, 'error': f'{type(error).__name__}: {error}'}
    destination = BASE / 'result-audit.json'
    destination.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    print(json.dumps({key: result.get(key) for key in ['verdict', 'counts', 'checks', 'diffs', 'calibrated', 'relativeClaimsWithheld', 'error']}, indent=2))
