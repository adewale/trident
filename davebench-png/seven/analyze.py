"""Rank the common reviewed profile; bootstrap independent launch blocks.

No calibration gate suppresses unrelated observed ratios. Timing failures and
unsupported diagrams stay in coverage and exclusions, never become zero times.
"""
import collections
import hashlib
import json
import math
from pathlib import Path
import random
from statistics import median, pstdev, mean
import sys

BASE = Path(sys.argv[1]).resolve()
RUN = BASE / 'measurement'
context = json.loads((RUN / 'context.json').read_text())
assert json.loads((RUN / 'completed.json').read_text())['complete']
rows = [json.loads(line) for line in (RUN / 'rows.jsonl').open()]
review = json.loads((RUN / 'review.json').read_text())
participants = [p['id'] for p in context['participants']]
blocks = list(range(1, context['blocks'] + 1))
measured = [r for r in rows if r['phase'] == 'measure']
assert not any(r['status'] == 'timeout' for r in measured), 'Timeout changed process history; retain evidence and report incomplete timing'
warmups = [r for r in rows if r['phase'] == 'warmup']
grouped = collections.defaultdict(list)
for r in measured:
    grouped[r['participant'], r['case'], r['block']].append(r)
eligible, excluded = [], []
for case in context['inputs']:
    failures = []
    for participant in participants:
        for block in blocks:
            own = grouped[participant, case, block]
            if len(own) != context['repetitions'] or any(r['status'] != 'ok' for r in own):
                failures.append({'participant': participant, 'block': block,
                                 'statuses': [r['status'] for r in own]})
    if failures:
        excluded.append({'case': case, 'failures': failures})
    else:
        eligible.append(case)
assert eligible, 'No complete common reviewed cases'
log_scores, per_case = {}, {}
for participant in participants:
    per_case[participant] = [{
        'case': case,
        'launches': [{'block': block,
                      **{metric: median(r[metric] for r in grouped[participant, case, block])
                         for metric in ['totalMs', 'apiMs', 'normalizationMs', 'renderWorkMs', 'bytes']}}
                     for block in blocks]
    } for case in eligible]
    log_scores[participant] = [mean(math.log(c['launches'][i]['totalMs'])
                                    for c in per_case[participant])
                               for i, block in enumerate(blocks)]

def interval(values):
    ordered = sorted(values)
    return [ordered[int(len(ordered) * .025)], ordered[int(len(ordered) * .975)]]

rng = random.Random(20261029)
draws = [[rng.randrange(len(blocks)) for _ in blocks] for _ in range(10000)]
boot = {p: [mean(log_scores[p][i] for i in draw) for draw in draws]
        for p in participants}
order = sorted(participants, key=lambda p: mean(log_scores[p]))
fastest = order[0]
ranked = []
for rank, participant in enumerate(order, 1):
    meta = next(p for p in context['participants'] if p['id'] == participant)
    score = math.exp(mean(log_scores[participant]))
    ratios = [math.exp(a - b) for a, b in zip(boot[participant], boot[fastest])]
    a, b = log_scores[participant][::2], log_scores[participant][1::2]
    split_rng = random.Random(20261029)
    split = [math.exp(mean(split_rng.choice(a) for _ in a) -
                      mean(split_rng.choice(b) for _ in b)) for _ in range(10000)]
    aa = {'estimate': math.exp(mean(a) - mean(b)), 'ci95': interval(split),
          'scope': 'Odd/even independently launched blocks; diagnostic only'}
    aa['warning'] = aa['ci95'][0] < .90 or aa['ci95'][1] > 1.10
    launch_values = [math.exp(value) for value in log_scores[participant]]
    ranked.append({
        'rank': rank, 'participant': participant, 'name': meta['name'],
        'version': meta['version'], 'runtime': meta['runtime'],
        'geometricMs': score,
        'geometricMsCi95': [math.exp(x) for x in interval(boot[participant])],
        'relativeToFastest': score / math.exp(mean(log_scores[fastest])),
        'relativeToFastestCi95': interval(ratios), 'repeatability': aa,
        'launchScoreCv': pstdev(launch_values) / mean(launch_values),
        'medianPngBytes': median(r['bytes'] for r in measured if r['participant'] == participant and r['case'] in eligible),
        'medianApiMs': median(r['apiMs'] for r in measured if r['participant'] == participant and r['case'] in eligible),
        'medianNormalizationMs': median(r['normalizationMs'] for r in measured if r['participant'] == participant and r['case'] in eligible),
        'medianClientOverheadMs': median(r['totalMs'] - r['renderWorkMs'] for r in measured if r['participant'] == participant and r['case'] in eligible),
    })
comparisons = []
for i, a in enumerate(order):
    for b in order[i+1:]:
        comparisons.append({'numerator': b, 'denominator': a,
                            'estimate': math.exp(mean(log_scores[b]) - mean(log_scores[a])),
                            'ci95': interval([math.exp(x-y) for x,y in zip(boot[b],boot[a])])})
coverage_context = json.loads((BASE / 'coverage-final/context.json').read_text())
coverage_rows = [json.loads(line) for line in (BASE / 'coverage-final/rows.jsonl').open()]
assert json.loads((BASE / 'coverage-final/completed.json').read_text())['complete']
coverage = []
for participant in participants:
    own = [r for r in coverage_rows if r['participant'] == participant and r['phase'] == 'coverage']
    assert len(own) == 548 and len({r['case'] for r in own}) == 548
    counts = dict(collections.Counter(r['status'] for r in own))
    coverage.append({'participant': participant, 'attempted': len(own), 'statuses': counts,
                     'pngContractSuccesses': counts.get('ok', 0),
                     'semanticScope': 'Mechanical PNG contract coverage, not whole-corpus semantic validation'})
summary = {
    'protocol': context['protocol'], 'metric': context['metric'],
    'scope': 'Observed ordering on one fixed reviewed common DaveBench profile; not all-input or renderer-only speed. Fixed 1200x900 task includes required normalization and binary delivery.',
    'score': 'Geometric mean across independent launches and fixed common inputs of each three-call median client elapsed time.',
    'uncertainty': '10000 paired launch-block bootstrap draws; fixed input profile. Pairwise 95% ranges unadjusted; observed ranks do not establish a simultaneous statistical ordering. Fastest reference selected by observed score.',
    'blocks': len(blocks), 'repetitions': context['repetitions'],
    'commonCases': eligible, 'excludedAfterTiming': excluded,
    'measuredRows': len(measured), 'warmupRows': len(warmups),
    'ranked': ranked, 'comparisons': comparisons, 'coverage': coverage,
    'reviewExclusions': {case: value for case, value in review['cases'].items() if not value['eligible']},
    'perCase': per_case,
    'measurementContextSha256': hashlib.sha256((RUN / 'context.json').read_bytes()).hexdigest(),
}
(BASE / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps({k: summary[k] for k in ['blocks', 'commonCases', 'measuredRows', 'ranked', 'coverage']}, indent=2))
