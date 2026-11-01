# Targeted completion of retained PNG holds

Twelve actual-image holds are resolved by fresh direct source/image reviews: eleven
correct and one incorrect. One existing native Kanban failure was newly reviewed
under the corrected source contract. The normal PNG assessor ran only these 13
newly admitted rows and three source-changed unknown/no-image rows. The old 951
reviews and the 174 MB evidence archive remain unchanged.

| Project | Correct | Incorrect | Unknown | Actual-image holds | No image | Drawings |
|---|---:|---:|---:|---:|---:|---:|
| Mermaid 12.2.0 | 492 | 42 | 12 | 12 | 0 | 546 |
| `mermaid_flutter` 0.3.2 | 293 | 136 | 117 | 18 | 99 | 546 |

The [summary](summary.json) pins the base normal result, current source contracts
and [normal affected-row delta](normal-delta.json.gz). A metadata-only hash census
retains 950 unchanged historical admissions, excludes the one source-stale native
Kanban decision, and adds the 13 freshly admitted decisions: 963 current image
judgments. It decodes none of the old images. All 548 literal occurrences and the
separate configuration/invalid-source controls remain in each project.

| Case index | Project | Fresh decision | Evidence |
|---|---|---|---|
| 10 | Mermaid | correct | Two rounded nodes and the owned arrow; independently approved source policy retains undefined spacing anchors as advisory provenance. |
| 298, 299 | Mermaid | correct | Actual glyph pixels uniquely select the authored 16px commit/tag font; all topology, labels, tags, highlight and explicit paints separately inspected. |
| 318 | both | correct | Complete owned hierarchy and authored shapes; undefined host CSS classes have no invented standalone paint effect. |
| 328 | both | correct | Complete 400×400 quadrant/axis layout; invalid bare `ff0000` is retained without repairing it to `#ff0000`. |
| 332 | Mermaid | correct | Independent grayscale frame plus literal values and fixed, explicitly versioned `.1` Bézier coefficient reproduce every owned curve, with bounded crossing coverage and wrong-coefficient/range controls. |
| 392, 396 | native | correct | Exact nested message intervals, captions, colors and lifecycle facts; unspecified horizontal padding overhang is retained as a diagnostic. |
| 463 | Mermaid | incorrect | The authored 80px level distance is visibly 85px. Actual 20px glyphs and 3px green strokes match; padding does not authorize adding 5px to the explicit level distance. |
| 492 | Mermaid | correct | Independently matched 16px Arial bold / 14px Georgia normal glyphs, complete actor/ellipse/arrow/role palette and all four minimum 24px geometry margins. Responsive CSS behavior remains excluded from the single-frame claim. |
| 304 | native | incorrect, refreshed | Actual PNG has only the Todo header and omits the required task, ticket and assignee. No removed flat `High` label is used as a fault. |

[The actual-image ledger](pending-image-ledger.json.gz) retains 30 unknown images:
28 source-complete measurement/ownership gaps and the two Boston source-incomplete
outputs. It separates the [99 unchanged typed no-image outcomes](no-image-outcomes.json.gz).
Current reasons remove superseded spacing/flat-label requirements and correct the
old native-C4 proof attribution. Ambiguous ink is not relabeled incorrect.

`reviews.jsonl.gz` contains the 13 untouched authored JSONL lines. Their original
file/line identities are in `receipt-origins.json.gz`; each inspection packet is a
byte-identical original PNG. The `drawings/` symlinks are aliases for those same
bytes, used by the existing importer. All seven full official bound-review outputs
are retained compressed under `admissions/`, with their unchanged import receipts
and uncompressed hashes. The probes retain source mapping, fixed hypotheses,
actual pixel samples and measured errors; no SVG style declaration alone proves
a font or curve, and no baseline renderer agreement supplies image meaning.

For radar, the profile is explicitly
`mermaid-radar-cubic-coefficient-1fb7869-v1`: public schema plus the pinned public
coefficient definition, independently checked mathematically. It imposes neither
a default `.17` nor a universal Catmull–Rom convention. Actual curve coordinates
and tension are not fitted. Range and values are observed jointly: unchanged
values with range 0..10 fail; doubling values and range together preserves the
unprinted normalized geometry. Every crossing exemption requires both predicted
and actual later-curve ink; no tolerance is enlarged for the hard points.

To replay only the 13 direct image admissions, create a relocated selection
manifest from the unchanged lines, then run the existing importer. From the code
repository root:

```sh
python3 - <<'PY'
from pathlib import Path
import gzip,hashlib,json
file=Path('docs/evidence/png-holds-2026-11-01/reviews.jsonl.gz').resolve()
rows=[]
for number,line in enumerate(gzip.decompress(file.read_bytes()).decode().splitlines(),1):
    rows.append({'origin':{'file':str(file),'directory':str(file.parent),'line':number},
                 'receiptSha256':hashlib.sha256(line.encode()).hexdigest(),
                 'receipt':json.loads(line)})
Path('/tmp/png-hold-origins.jsonl').write_text(''.join(json.dumps(row)+'\n' for row in rows))
PY
bun unified/import-png-review-selection.ts \
  --inventory corpus/docs-source-inventory.json.gz \
  --contracts corpus/docs-reviewed.json \
  --origins /tmp/png-hold-origins.jsonl \
  --image-root docs/evidence/png-holds-2026-11-01 \
  --out /tmp/fresh-png-hold-reviews.json
```

This recomputes admission against the current source/format/image and packet
hashes. It authors no verdict, requires no Codex/API and invokes no project
renderer. Raw absolute paths remain historical provenance. Actual call ownership
and original public dates/clocks remain bound to the unchanged
[base archive](../png-full-corpus-2026-10-31/publication-manifest.json); regrading
creates no new call or timing sample. Native PNG requires no SVG capability.
