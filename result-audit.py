#!/usr/bin/env python3
"""Independent raw-result audit; does not import or execute the producer reducer."""
import collections
import hashlib
import json
import math
import subprocess
import datetime
from pathlib import Path
from PIL import Image

BASE = Path('/workspace/png-primary-pair')
RUN = BASE / 'measurement'
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
    check('sourceCommit', context['sourceCommit'], 'd4a4f84ebbf66ca8ef98d21ab3e6de24db762740')
    check('completed.complete', complete['complete'], True)
    check('completed.preflight', complete['preflight'], False)
    check('context.preflight', context['preflight'], False)
    check('context.rounds', context['rounds'], 5)
    check('context.repetitions', context['repetitions'], 5)
    check('context.seed', context['seed'], 20261029)
    check('cases.count', len(cases), 20)
    check('cases.unique', len(set(cases)), 20)
    check('participants', sorted(participants), ['flutter', 'pele'])
    check('rows.total', len(rows), 2160)
    check('rows.measured', len(measured), 2000)
    check('rows.warmup', len(warmed), 160)
    check('rows.ids.unique', len({r['id'] for r in rows}), len(rows))
    check('rows.status', dict(collections.Counter(r['status'] for r in rows)), {'ok': 2160})
    check('rows.phase', dict(collections.Counter(r['phase'] for r in rows)), {'measure': 2000, 'warmup': 160})
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
        check(f'{participant}.perCase.count', len(reported['perCase']), 20)
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
        for field, value in [('version', versions[participant]), ('cases', 20), ('samples', 1000)]:
            check(f'{participant}.{field}', reported.get(field), value)
        check(f'{participant}.medianCaseMs', reported['medianCaseMs'], median_case, True)
        check(f'{participant}.aa.estimate', reported['aa']['estimate'], aa['estimate'], True)
        for index in [0, 1]:
            check(f'{participant}.aa.ci95.{index}', reported['aa']['ci95'][index], aa['ci95'][index], True)
        check(f'{participant}.aa.pass', reported['aa']['pass'], aa['pass'])
        recomputed[participant] = {'cases': 20, 'measured': 1000, 'warmups': 80,
                                   'samplesPerCaseAlias': 25, 'medianCaseMs': median_case,
                                   'aa': aa, 'perCase': results}
    calibrated = all(p['aa']['pass'] for p in recomputed.values())
    check('summary.calibrated', summary['calibrated'], calibrated)
    check('summary.measured', summary['measured'], len(measured))
    check('summary.warmups', summary['warmups'], len(warmed))
    check('summary.protocol', summary['protocol'], context['protocol'])
    check('summary.scope', summary['scope'], context['contract']['scope'])
    check('summary.aaPolicy', summary['aaPolicy'], context['aaPolicy'])
    ratio_fields = {key: summary[key] for key in ['ratios', 'comparisons'] if key in summary}
    check('summary.comparisons.count', len(summary['comparisons']), 1 if calibrated else 0)
    comparisons_audited = []
    for reported in summary['comparisons']:
        numerator, denominator = reported['numerator'], reported['denominator']
        check('comparison.participants', [numerator, denominator], ['pele', 'flutter'])
        a = {c['id']: c for c in recomputed[numerator]['perCase']}
        b = {c['id']: c for c in recomputed[denominator]['perCase']}
        independent = bootstrap([{'A': a[c]['totalMs'], 'B': b[c]['totalMs']} for c in cases])
        check('comparison.estimate', reported['estimate'], independent['estimate'], True)
        for index in [0, 1]:
            check('comparison.ci95.' + str(index), reported['ci95'][index], independent['ci95'][index], True)
        reciprocal_estimate = 1 / independent['estimate']
        reciprocal_ci = [1 / independent['ci95'][1], 1 / independent['ci95'][0]]
        reverse_estimate = bootstrap([{'A': b[c]['totalMs'], 'B': a[c]['totalMs']} for c in cases])['estimate']
        check('comparison.reciprocal.estimate', reciprocal_estimate, reverse_estimate, True)
        check('comparison.reciprocal.ordered', reciprocal_ci[0] <= reciprocal_estimate <= reciprocal_ci[1], True)
        comparisons_audited.append({'numerator': numerator, 'denominator': denominator,
                                    'estimate': independent['estimate'], 'ci95': independent['ci95'],
                                    'reciprocal': {'numerator': denominator, 'denominator': numerator,
                                                   'estimate': reciprocal_estimate, 'ci95': reciprocal_ci,
                                                   'method': 'Algebraic inversion of independently audited forward interval: [1/upper, 1/lower].'}})
    extended = audit_isolation_and_pixels(context, rows, review)
    wider_audits = []
    for filename in ['/workspace/png-calibration-v3/result-audit.json',
                     '/workspace/png-calibration-v4/result-audit.json']:
        previous_path = Path(filename)
        previous_bytes = previous_path.read_bytes()
        previous = json.loads(previous_bytes)
        check('wider.' + filename + '.auditVerdict', previous['verdict'], 'PASS')
        check('wider.' + filename + '.calibrated', previous['calibrated'], False)
        check('wider.' + filename + '.relativeClaimsWithheld', previous['relativeClaimsWithheld'], True)
        wider_audits.append({'path': filename,
                             'sha256': hashlib.sha256(previous_bytes).hexdigest(),
                             'sourceCommit': previous['sourceCommit'],
                             'calibrated': previous['calibrated'],
                             'relativeClaimsWithheld': previous['relativeClaimsWithheld']})
    inputs = {name: hashlib.sha256((RUN / name).read_bytes()).hexdigest()
              for name in ['context.json', 'rows.jsonl', 'summary.json', 'completed.json']}
    return {'verdict': 'PASS' if not DIFFS else 'FAIL',
            'meaning': 'Independent pair-campaign audit. Both selected participants pass A/A; comparisons apply only to this separate 20-case pair campaign. Prior four-library campaigns remain failed and globally withheld.',
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
            'summaryRelativeComparisonFields': ratio_fields, 'independentComparisons': comparisons_audited,
            'scope': 'Separate prospectively specified Pele/native 20-case follow-up; no pooling or rehabilitation of wider four-library gates.',
            'widerFourLibraryCampaigns': {'auditsUnchanged': True, 'calibrated': False, 'relativeClaimsWithheld': True, 'audits': wider_audits},
            'isolationAndPixelValidation': extended,
            'affinityAttempt': {'admitted': False, 'analyzed': False, 'timingRowsRead': 0,
                                'reason': 'User-reported NOT-ADMITTED setup; no files from that attempt were opened.'},
            'inputSha256': inputs}


def audit_isolation_and_pixels(context, rows, review):
    plan_path = BASE / 'campaign-plan.json'
    plan = json.loads(plan_path.read_text())
    check('plan.participants', plan['participants'], [p['id'] for p in context['participants']])
    check('plan.eligibleCandidates', plan['eligibleCandidates'], 20)
    check('plan.sampling', plan['sampling'], '5rounds5callspercase/replica,independentA/B,2warmuppasses;seed20261029')
    check('plan.calibration', plan['calibration'], 'Unchanged95%casebootstrap10000drawsseed20261029 geometricmeanAmedian/Bmedian;eachselectedparticipantCIentirely0.90..1.10required')
    policy = ('Independent A/B replicas, identical bytes. Geometric mean of per-case A-median/B-median ratios; '
              '10000 paired case-bootstrap draws, seed20261029. 95% interval must stay within0.90..1.10. '
              'No relative performance claim if any participant fails. This interval describes sensitivity '
              'to the fixed case mix, not population inference.')
    check('policy.unchanged', context['aaPolicy'], policy)
    check('plan.declared_before_campaign', datetime.datetime.fromisoformat(plan['declaredAt']) <
          datetime.datetime.fromisoformat(context['startedAt'].replace('Z', '+00:00')), True)
    runtime = read('runtime.json')
    check('runtime.matches_context', runtime, context['runtime'])
    config = runtime['config']
    for key, value in [('cpuset', '2'), ('nanoCpus', 1000000000), ('memory', 17179869184),
                       ('network', 'none'), ('capDrop', ['ALL'])]:
        check('runtime.' + key, config.get(key), value)
    for key, value in [('LIBGL_ALWAYS_SOFTWARE', '1'), ('LP_NUM_THREADS', '1')]:
        check('runtime.environment.' + key, config['environment'].get(key), value)
    check('runtime.user.nonroot', config['user'].split(':')[0] != '0', True)
    check('runtime.mounts.usr', ['/usr', '/usr', True] in config['mounts'], True)
    check('runtime.mounts.opt', ['/opt', '/opt', True] in config['mounts'], True)
    check('runtime.mounts.workspace', ['/workspace', '/workspace', False] in config['mounts'], True)
    for key, value in [('softwareGL', '1'), ('softwareRasterThreads', '1'), ('cpuAffinity', '2')]:
        check('nativeEnvironment.' + key, context['nativeEnvironment'].get(key), value)
    snapshots = [json.loads(line) for line in (RUN / 'isolation.jsonl').read_text().splitlines() if line.strip()]
    check('isolation.snapshot_phases', [s['phase'] for s in snapshots],
          ['actors-ready', 'warmup-complete', 'complete'])
    snapshot_report = []
    for index, snapshot in enumerate([context['isolation']] + snapshots):
        label = f'isolation.{index}'
        for key, value in [('cpuset', '2'), ('quota', '100000 100000'), ('memory', '17179869184')]:
            check(label + '.' + key, snapshot.get(key), value)
        threads = snapshot['threads']
        check(label + '.nonempty', bool(threads), True)
        check(label + '.thread_ids.unique', len({(t['pid'], t['tid']) for t in threads}), len(threads))
        for thread in threads:
            check(f"{label}.thread.{thread['pid']}.{thread['tid']}.affinity", thread['affinity'], '2')
        snapshot_report.append({'phase': snapshot.get('phase', 'initial'),
                                'capturedAt': snapshot['capturedAt'], 'threadCount': len(threads),
                                'cpuset': snapshot['cpuset'], 'quota': snapshot['quota'],
                                'memory': snapshot['memory']})
    timestamps = [s['capturedAt'] for s in snapshots]
    check('isolation.chronological', timestamps, sorted(timestamps))
    check('isolation.complete_before_completed', timestamps[-1] <= read('completed.json')['finishedAt'], True)
    # Match the stored producer identities against the named committed source,
    # rather than importing or executing any producer code.
    stored = context['producers']
    paths = [line.split('\t', 1)[1] for line in stored]
    tree = subprocess.check_output(['git', '-C', '/workspace/trident', 'ls-tree', '-r',
                                    context['sourceCommit'], '--', *paths], text=True)
    check('producers.committed_tree', sorted(stored), sorted(tree.strip().splitlines()))
    for required in ['davebench-png/controlled/validator.mjs', 'davebench-png/controlled/isolation.mjs',
                     'davebench-png/controlled/run-container.py', 'native-flutter/env.sh']:
        check('producers.contains.' + required, required in paths, True)
    qualification = BASE / 'qualification-owned'
    qualified_context = json.loads((qualification / 'context.json').read_text())
    qualified_review = json.loads((qualification / 'review.json').read_text())
    qualified_complete = json.loads((qualification / 'completed.json').read_text())
    check('qualification.complete', qualified_complete['complete'], True)
    check('qualification.preflight', qualified_complete['preflight'], True)
    check('qualification.renderIdentity', qualified_context['renderIdentity'], context['renderIdentity'])
    check('review.renderIdentity', review['renderIdentity'], context['renderIdentity'])
    check('review.matches_qualification', review, qualified_review)
    check('review.manifestSha256', review['manifestSha256'], context['manifestSha256'])
    check('review.fontSha256', review['fontSha256'], context['font']['sha256'])
    check('qualification.runtimeConfig', qualified_context['runtime']['config'], config)
    check('qualification.sourceCommit', qualified_context['sourceCommit'], context['sourceCommit'])
    check('qualification.participants', qualified_context['participants'], context['participants'])
    eligible = sorted(c for c, v in review['cases'].items() if v.get('eligible') is True)
    check('review.eligible_cases', eligible, sorted(context['commonCases']))
    manifest = read('cases.json')
    roles = {c['id']: c['role'] for c in manifest['cases']}
    for case in eligible:
        check('eligible.role.' + case, roles[case], 'candidate')
        for participant in context['participants']:
            check('eligible.review.' + case + '.' + participant['id'],
                  review['cases'][case]['checks'][participant['id']]['pass'], True)
    qualified_rows = [json.loads(line) for line in (qualification / 'rows.jsonl').read_text().splitlines()
                      if line.strip()]
    qualified_rows = [r for r in qualified_rows if r['phase'] == 'qualification']
    check('qualification.rows.count', len(qualified_rows), 42)
    check('qualification.rows.unique', len({(r['case'], r['participant']) for r in qualified_rows}), 42)
    reference_encoded = {}
    for row in qualified_rows:
        label = 'qualification.' + row['case'] + '.' + row['participant']
        check(label + '.status', row['status'], 'ok')
        image_path = qualification / 'png' / Path(row['png']).name
        encoded = image_path.read_bytes()
        encoded_hash = hashlib.sha256(encoded).hexdigest()
        with Image.open(image_path) as image:
            check(label + '.size', list(image.size), [1200, 900])
            rgba = image.convert('RGBA')
            check(label + '.opaque', list(rgba.getchannel('A').getextrema()), [255, 255])
            decoded_hash = hashlib.sha256(rgba.tobytes()).hexdigest()
        check(label + '.decoded_review_pixels', decoded_hash,
              review['cases'][row['case']]['pixels'][row['participant']])
        check(label + '.recorded_pixels', row['inspection']['pixelSha256'], decoded_hash)
        reference_encoded[(row['case'], row['participant'])] = (encoded_hash, decoded_hash)
    validation_counts = collections.Counter()
    for row in rows:
        label = 'output.' + row['id']
        encoded = (RUN / 'png' / Path(row['png']).name).read_bytes()
        encoded_hash = hashlib.sha256(encoded).hexdigest()
        expected_encoded, expected_pixels = reference_encoded[(row['case'], row['participant'])]
        check(label + '.bytes', len(encoded), row['bytes'])
        check(label + '.recorded_encoded_sha256', row['inspection']['encodedSha256'], encoded_hash)
        check(label + '.exact_reference_bytes_sha256', encoded_hash, expected_encoded)
        check(label + '.expected_pixels', row['inspection']['pixelSha256'], expected_pixels)
        check(label + '.validation', row['inspection']['validation'], 'exact-encoded-match')
        validation_counts[(row['phase'], row['inspection']['validation'])] += 1
        stage_fields = (['decodeMs', 'pictureRecordMs', 'rasterImageMs', 'pngReadbackEncodeMs']
                        if row['participant'] == 'flutter' else
                        ['svgPreparationMs', 'svgDecodeMs', 'canvasDrawMs',
                         'pngRasterReadbackEncodeMs', 'encodedByteReadMs'])
        for field in stage_fields:
            check(label + '.' + field + '.finite_nonnegative',
                  isinstance(row.get(field), (int, float)) and math.isfinite(row[field]) and row[field] >= 0, True)
        check(label + '.normalization_stage_sum', sum(row[field] for field in stage_fields),
              row['normalizationMs'], True)
    return {'snapshots': snapshot_report, 'allRecordedThreadsOnCPU2': True,
            'limits': {'cpuset': '2', 'quota': '100000 100000', 'memoryBytes': 17179869184},
            'sourceMatchesCommittedProducerTree': True,
            'qualificationPNGsIndependentlyDecodedWithPillow': len(qualified_rows),
            'allOutputFilesIndependentlyEncodedHashed': len(rows),
            'allOutputsMatchCorrespondingDecodedReference': True,
            'validationCounts': {phase + '/' + kind: n for (phase, kind), n in validation_counts.items()},
            'stageSumsVerified': True,
            'planSha256': hashlib.sha256(plan_path.read_bytes()).hexdigest(),
            'isolationJsonlSha256': hashlib.sha256((RUN / 'isolation.jsonl').read_bytes()).hexdigest(),
            'runtimeJsonSha256': hashlib.sha256((RUN / 'runtime.json').read_bytes()).hexdigest(),
            'qualificationContextSha256': hashlib.sha256((qualification / 'context.json').read_bytes()).hexdigest(),
            'qualificationReviewSha256': hashlib.sha256((qualification / 'review.json').read_bytes()).hexdigest(),
            'qualificationRowsSha256': hashlib.sha256((qualification / 'rows.jsonl').read_bytes()).hexdigest(),
            'limitsOfAttestation': 'Recorded snapshots and immutable inputs verified; this audit did not observe the historical live container or decode each repeated identical output anew.'}


if __name__ == '__main__':
    try:
        result = audit()
    except Exception as error:
        result = {'verdict': 'FAIL', 'scriptPath': str(SCRIPT), 'checks': CHECKS,
                  'diffs': DIFFS, 'error': f'{type(error).__name__}: {error}'}
    destination = BASE / 'result-audit.json'
    destination.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    print(json.dumps({key: result.get(key) for key in ['verdict', 'counts', 'checks', 'diffs', 'calibrated', 'relativeClaimsWithheld', 'error']}, indent=2))
