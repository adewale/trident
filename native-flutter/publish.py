"""Publish retained native-entrypoint evidence without running or upgrading it.

python3 native-flutter/publish.py --evidence-root /archive/native-flutter --out /publication
Only the Python standard library is required. The evidence root contains cases.json
and results/. Publication output must be fresh and outside the source/evidence trees.
"""

import argparse
import collections
import csv
import datetime
import hashlib
import html
import json
import math
from pathlib import Path
import re
import shutil
import statistics
from urllib.parse import quote


INTERFACES = (
    ("flutter", "MermaidDiagram", "Native Linux Flutter", "mermaid_flutter"),
    ("flutter", "MermaidView", "Native Linux Flutter", "mermaid_flutter"),
    ("flutter", "renderToPng", "Native Linux Flutter", "mermaid_flutter"),
    ("pele", "mount", "Chromium", "Pele"),
    ("pele", "render", "Chromium", "Pele"),
)
PHASES = ("fresh", "repeat", "update")
QUALIFICATION = "nonblank only; semantic/fidelity qualification unavailable"
ISSUES = """Historical protocol qualifications:

- Pele render UPDATE is invalid as an alternating-transition workload: the harness
  restores the original baseline before each call. Its costs describe calls after
  that preparation, not alternating transitions or persistent mounted updates.
- MermaidView repeat includes a forced second frame. Report legacy two-frame cost
  only; it does not establish that an unchanged rebuild requires two render frames.
- Preparation failures are observations, not measured entrypoint calls. In particular,
  Pele render repeat/update can throw while preparing the original negative source.
- Pele nonblank counts and update hashes describe offscreen SVG rasterization.
  Retained DOM screenshots validate selected samples separately, not every call.
  Native widget counts use repaint-boundary captures; PNG counts use decoded output.
- Manual artifact/clipping findings qualify inspected captures. They are not full
  passes, automated per-sample assertions, or proof of a library-wide defect.
- Semantic/model fidelity, A/A calibration and confidence intervals are unavailable.
  This publication does not upgrade the historical campaign to the current portable
  protocol. Missing resources and observers are unavailable, never zero or passes.
"""


def read_json(path, default=None):
    return json.loads(path.read_text()) if path.is_file() else default


def read_rows(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def digest(path):
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def link(label, path):
    return f"[{cell(label)}]({quote(str(path), safe='/.-_')})"


def cell(value):
    return str(value).replace("|", "\\|").replace("\n", " ")


def table(headers, rows):
    return "\n".join(
        [
            "| " + " | ".join(map(cell, headers)) + " |",
            "| " + " | ".join("---" for _ in headers) + " |",
            *("| " + " | ".join(map(cell, row)) + " |" for row in rows),
        ]
    )


def negative(case):
    return case.startswith(("invalid:", "unsupported:"))


def preparation_failure(row):
    # A historical outer page.evaluate rejection has no timed failure boundary.
    return (
        row["engine"] == "pele"
        and row["api"] == "render"
        and row["phase"] in ("repeat", "update")
        and row["status"] == "error"
        and "failed_after_ms" not in row
    )


def flags(engine, api, phase, rows):
    result = []
    if engine == "pele" and api == "render" and phase == "update":
        result.append("alternating_transition_invalid_original_baseline_per_call")
    if engine == "flutter" and api == "MermaidView" and phase == "repeat":
        result.append("legacy_forced_second_frame_no_required_render_inference")
    if any(preparation_failure(row) for row in rows):
        result.append("preparation_failure_not_measured_entrypoint_call")
    return "; ".join(result) or "historical descriptive cost only"


def key(row):
    return tuple(
        row.get(k)
        for k in (
            "campaign",
            "engine",
            "id",
            "api",
            "phase",
            "round",
            "sample",
            "trial",
        )
    )


def enrich(rows, retained):
    """Reuse historical frame joins, but never overwrite or contradict raw fields."""
    indexed = {}
    for row in retained:
        if key(row) in indexed:
            raise ValueError("Duplicate retained join identity")
        indexed[key(row)] = row
    for row in rows:
        joined = indexed.get(key(row))
        if joined is None:
            continue
        for name, value in row.items():
            if name != "raw_path" and joined.get(name) != value:
                raise ValueError(
                    f"Retained join contradicts raw field {name}: {key(row)}"
                )
        for name in (
            "matched_frames",
            "raster_complete_ms",
            "engine_build_sum_ms",
            "engine_raster_sum_ms",
        ):
            if name in joined:
                row[name] = joined[name]


def load(root):
    inventory = read_json(root / "cases.json")
    if not isinstance(inventory, list) or not inventory:
        raise ValueError("Evidence root must contain a nonempty cases.json")
    supplemental = read_json(root / "visible-edit/cases.json", [])
    for case in inventory + supplemental:
        if hashlib.sha256(case["source"].encode()).hexdigest() != case["sha256"]:
            raise ValueError(f"Source hash mismatch: {case['id']}")
    rows = []
    for engine, campaign in (
        ("flutter", "flutter"),
        ("pele", "pele"),
        ("flutter", "visible-edit-flutter"),
        ("pele", "visible-edit-pele"),
    ):
        path = root / "results" / campaign / "samples.jsonl"
        if not path.exists():
            if campaign in ("flutter", "pele"):
                raise ValueError(f"Missing main raw samples: {path}")
            continue
        for raw in read_rows(path):
            rows.append(
                dict(
                    raw,
                    engine=engine,
                    campaign=campaign,
                    raw_path=path.relative_to(root).as_posix(),
                )
            )
    joined_path = root / "results/joined-samples.jsonl"
    if joined_path.exists():
        enrich(rows, read_rows(joined_path))
    first = []
    for engine in ("flutter", "pele"):
        for path in sorted(
            (root / f"results/first-use-{engine}").glob("*/*/samples.jsonl")
        ):
            for raw in read_rows(path):
                first.append(
                    dict(
                        raw,
                        engine=engine,
                        trial=int(path.parent.name),
                        raw_path=path.relative_to(root).as_posix(),
                    )
                )
    first_path = root / "results/first-use.jsonl"
    if first_path.exists():
        enrich(first, read_rows(first_path))
    return inventory, supplemental, rows, first


def stats(values):
    values = sorted(values)
    if not values:
        return {
            "n": 0,
            "median_ms": "unavailable",
            "p95_ms": "unavailable",
            "min_ms": "unavailable",
            "max_ms": "unavailable",
        }
    k = (len(values) - 1) * 0.95
    lo = int(k)
    return {
        "n": len(values),
        "median_ms": statistics.median(values),
        "p95_ms": values[lo]
        + (values[min(lo + 1, len(values) - 1)] - values[lo]) * (k - lo),
        "min_ms": values[0],
        "max_ms": values[-1],
    }


def stage_name(stage, api, phase):
    if (
        api == "MermaidView"
        and phase == "repeat"
        and stage in ("settled_ui_ms", "raster_complete_ms")
    ):
        return stage + " (legacy forced two-frame cost)"
    return stage


def qualification(root, engine, api, case):
    notes = [QUALIFICATION]
    for finding in read_json(root / "results/visual-findings.json", []):
        if (
            finding.get("engine") == engine
            and api in finding.get("apis", [])
            and case in finding.get("ids", [finding.get("id")])
        ):
            notes.append(
                "manual finding on representative captures: " + finding["finding"]
            )
    return "; ".join(notes)


def summaries(root, rows):
    groups = collections.defaultdict(list)
    for row in rows:
        if row["sample"] >= 0:
            groups[
                (
                    row.get("campaign", "first-use"),
                    row["engine"],
                    row["api"],
                    row["id"],
                    row["phase"],
                )
            ].append(row)
    result = []
    for (campaign, engine, api, case, phase), values in sorted(groups.items()):
        good = [
            row
            for row in values
            if row["status"] == "painted" and not preparation_failure(row)
        ]
        stages = sorted(
            {
                name
                for row in good
                for name, value in row.items()
                if name.endswith("_ms")
                and isinstance(value, (int, float))
                and math.isfinite(value)
            }
        )
        png = root / values[0]["raw_path"]
        witness = png.parent / f"{case.replace(':', '_')}_{api}_{phase}.png"
        for stage in stages or ["unavailable"]:
            result.append(
                {
                    "campaign": campaign,
                    "engine": engine,
                    "api": api,
                    "id": case,
                    "phase": phase,
                    "stage": stage,
                    **stats([row[stage] for row in good if stage in row]),
                    "measured_records": len(values),
                    "nonblank_records": len(good),
                    "error_records": sum(row["status"] == "error" for row in values),
                    "blank_records": sum(row["status"] == "blank" for row in values),
                    "preparation_failures": sum(
                        preparation_failure(row) for row in values
                    ),
                    "negative_input": negative(case),
                    "pixel_observer": (
                        "offscreen SVG raster; DOM screenshot validation only for selected samples"
                        if engine == "pele"
                        else (
                            "decoded public PNG"
                            if api == "renderToPng"
                            else "repaint-boundary capture; View controls included"
                        )
                    ),
                    "protocol_flags": flags(engine, api, phase, values),
                    "qualification": qualification(root, engine, api, case),
                    "dimensions": "; ".join(
                        sorted(
                            {
                                f"{r['width']}x{r['height']}"
                                for r in good
                                if "width" in r and "height" in r
                            }
                        )
                    )
                    or "unavailable",
                    "raw_samples": "; ".join(
                        sorted({"evidence/" + row["raw_path"] for row in values})
                    ),
                    "witness": (
                        "evidence/" + witness.relative_to(root).as_posix()
                        if witness.is_file()
                        else "unavailable"
                    ),
                }
            )
    return result


def write_csv(path, rows):
    if not rows:
        path.write_text("availability\nunavailable\n")
        return
    with path.open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def counts(rows):
    measured = [r for r in rows if r["sample"] >= 0]
    return {
        "raw": len(rows),
        "measured": len(measured),
        "warmups": len(rows) - len(measured),
        "nonblank_measured": sum(r["status"] == "painted" for r in measured),
        "errors_measured": sum(r["status"] == "error" for r in measured),
        "blank_measured": sum(r["status"] == "blank" for r in measured),
        "preparation_raw": sum(preparation_failure(r) for r in rows),
        "preparation_measured": sum(preparation_failure(r) for r in measured),
    }


def metadata(root):
    env = root / "results/environment.txt"
    text = env.read_text() if env.exists() else ""
    # Preserve the recorded date text; an environment receipt is not a run window.
    date = text.splitlines()[0] if text else "unavailable"
    revisions = re.findall(r"^[0-9a-f]{40}$", text, re.M)
    return {
        "environment_receipt_date": date,
        "measurement_window": "unavailable; no start/end campaign receipt",
        "recorded_revision_references": revisions,
        "flutter_version": read_json(
            root / "results/mermaid_flutter-0.3.2.metadata.json", {}
        ).get("version", "unavailable"),
        "pele_version": read_json(root / "results/pele-package.json", {}).get(
            "version", "unavailable"
        ),
        "native_runtime": read_json(
            root / "results/flutter/runtime.json", "unavailable"
        ),
        "browser_runtime": read_json(root / "results/pele/browser.json", "unavailable"),
    }


def evidence_links(root, prefix=""):
    paths = (
        "cases.json",
        "visible-edit/cases.json",
        "README.md",
        "app/lib/main.dart",
        "pele.mjs",
        "results/environment.txt",
        "results/artifacts.sha256",
        "app/pubspec.lock",
        "results/pele-package-lock.json",
        "results/fonts.sha256",
        "results/font-resolution.txt",
        "results/visual-findings.json",
        "results/updates.csv",
        "results/failures.jsonl",
        "results/setup-failures.json",
        "results/validation.txt",
        "results/joined-samples.jsonl",
        "results/first-use.jsonl",
        "results/summary.csv",
        "results/coverage.csv",
    )
    return "\n".join(
        "- "
        + (
            link(p, prefix + "evidence/" + p)
            if (root / p).is_file()
            else f"{p}: unavailable"
        )
        for p in paths
    )


def cost_table(rows):
    return table(
        (
            "Case",
            "Phase",
            "Stage",
            "Samples (calls)",
            "Median (ms)",
            "p95 (ms)",
            "Protocol qualification",
        ),
        (
            (
                r["id"],
                r["phase"],
                stage_name(r["stage"], r["api"], r["phase"]),
                r["n"],
                f"{r['median_ms']:.4f}" if r["n"] else "unavailable",
                f"{r['p95_ms']:.4f}" if r["n"] else "unavailable",
                r["protocol_flags"],
            )
            for r in rows
        ),
    )


def card(
    root,
    out,
    interface,
    inventory,
    supplemental,
    rows,
    first,
    summary,
    first_summary,
    meta,
):
    engine, api, runtime, package = interface
    name = f"{engine}-{api}"
    selected = [r for r in rows if r["engine"] == engine and r["api"] == api]
    main = [r for r in selected if r["campaign"] == engine]
    supplemental_rows = [r for r in selected if r["campaign"] != engine]
    first_rows = [r for r in first if r["engine"] == engine and r["api"] == api]
    costs = [r for r in summary if r["engine"] == engine and r["api"] == api]
    fc = [r for r in first_summary if r["engine"] == engine and r["api"] == api]
    boundary = (
        "api_dom_ms"
        if engine == "pele"
        else "render_png_ms" if api == "renderToPng" else "raster_complete_ms"
    )
    primary = [r for r in costs if r["stage"] == boundary]
    version = meta["flutter_version" if engine == "flutter" else "pele_version"]
    write_csv(out / "scorecards" / f"{name}.csv", costs)
    attempted = {r["id"] for r in main}
    outcomes = []
    for case in inventory + supplemental:
        group = [r for r in selected if r["id"] == case["id"] and r["sample"] >= 0]
        c = counts(group)
        outcomes.append(
            (
                case["id"],
                case.get("family", "unavailable"),
                len(group),
                c["nonblank_measured"],
                c["errors_measured"],
                c["blank_measured"],
                c["preparation_measured"],
                qualification(root, engine, api, case["id"]),
            )
        )
    native_mode = (
        "release"
        if main and all(r.get("release") is True for r in main)
        else "unavailable"
    )
    mode = (
        native_mode
        if engine == "flutter"
        else (
            "headed"
            if isinstance(meta["browser_runtime"], dict)
            and meta["browser_runtime"].get("headless") is False
            else "unavailable"
        )
    )
    md = [
        f"# {package} {version}: {api} / {runtime}",
        "",
        "Suite: historical native-entrypoint campaign; current portable protocol qualification unavailable.",
        f"Environment receipt date: {meta['environment_receipt_date']}. Mode: {mode}.",
        "",
        "## Coverage",
        "",
        f"Main inventory: {len(inventory)} inputs ({sum(not negative(c['id']) for c in inventory)} positive, "
        f"{sum(negative(c['id']) for c in inventory)} negative/unavailable-support probes). "
        f"Attempted distinct main inputs: {len(attempted)}. Unattempted: "
        + (", ".join(c["id"] for c in inventory if c["id"] not in attempted) or "none")
        + ".",
        f"Supplemental inventory: {len(supplemental)}; attempted distinct supplemental inputs: {len({r['id'] for r in supplemental_rows})}.",
        f"Planned main input/phase cells: {len(inventory) * len(PHASES)}; recorded main cells: "
        f"{len({(r['id'], r['phase']) for r in main})}. Sampling counts are printed below and in the per-case CSV.",
        "The scope is public development fixtures, not exhaustive family support or a production holdout. "
        "Lineage/branding selection receipt unavailable; this was an explicit two-package investigation.",
        "",
        table(
            (
                "Population",
                "Raw",
                "Measured records",
                "Warmups",
                "Preparation failures (raw/measured)",
            ),
            (
                (
                    label,
                    counts(rs)["raw"],
                    counts(rs)["measured"],
                    counts(rs)["warmups"],
                    f"{counts(rs)['preparation_raw']}/{counts(rs)['preparation_measured']}",
                )
                for label, rs in (
                    ("main", main),
                    ("supplemental edit", supplemental_rows),
                    ("first use", first_rows),
                )
            ),
        ),
        "",
        "## Outcomes",
        "",
        "Counts below are records, not semantic passes. Errors include preparation failures; do not add those columns. "
        "An unattempted case has unavailable outcome. Unsupported ZenUML and malformed-source rejection are different observations.",
        "",
        table(
            (
                "Input",
                "Family",
                "Measured",
                "Nonblank",
                "Errors",
                "Blank",
                "Preparation failures",
                "Qualification",
            ),
            outcomes,
        ),
        "",
        "Native nonblank pixels come from widget capture or decoded PNG. Chromium nonblank pixels and hashes "
        "come from offscreen SVG rasterization; DOM screenshots cover selected fresh/update samples only. "
        "Manual findings apply to representative captures, not every recorded round/phase.",
        "",
        "## Cost",
        "",
        ISSUES,
        "",
        "Costs use only nonblank non-warmup records, including manually qualified clipped/artifact-bearing output. "
        "They do not imply complete-diagram delivery. Retained frame joins supply native raster-completion estimates; "
        "UI completion, capture raster, pixel readback and PNG conversion remain separate. "
        "renderToPng is an opaque combined export cost; Flutter PNG conversion includes another readback. "
        "Browser two-rAF is a paint opportunity, not compositor presentation. Canvas draw may defer work to readback.",
        "",
        f"Full per-case/phase/stage costs: {link('CSV', name + '.csv')}. "
        "Sampling is derived per cell; n counts observations, not independent processes or rounds. "
        "p95 uses linear interpolation and is descriptive, not a confidence bound.",
        "",
        "### Family representatives and scaling within this entrypoint",
        "",
        "Each input retains its own row; no aggregate across families or other interfaces. "
        f"Primary recorded boundary: {boundary}.",
        "",
        (
            cost_table(primary)
            if primary
            else "Primary boundary unavailable in supplied evidence; inspect the stage CSV."
        ),
        "",
        "### Small-flowchart stage detail",
        "",
        cost_table([r for r in costs if r["id"] == "core:flow5"]),
        "",
        "### First use (separate population)",
        "",
        "New processes after runtime startup; launch/import excluded and OS/font/graphics caches retained. "
        "No pooling with initialized-runtime calls.",
        "",
        cost_table(fc),
        "",
        "## Evidence",
        "",
        link("Publication index", "../README.md"),
        "",
        "Raw sample files for this interface (shared files retain API/phase/round/sample identities):",
        "",
        *[
            "- " + link(p, "../evidence/" + p)
            for p in sorted({r["raw_path"] for r in selected + first_rows})
        ],
        "",
        evidence_links(root, "../"),
        "",
    ]
    (out / "scorecards" / f"{name}.md").write_text("\n".join(md))
    return name


def contact_sheet(root, out):
    """An HTML contact sheet links original PNGs without resampling their pixels."""
    images = sorted(
        p
        for folder in ("flutter", "pele", "visible-edit-flutter", "visible-edit-pele")
        for p in (root / "results" / folder).glob("*.png")
    )
    figures = []
    for path in images:
        rel = path.relative_to(root).as_posix()
        caption = (
            f"{rel}; retained representative sample, not a complete fidelity check"
        )
        url = quote("evidence/" + rel, safe="/.-_")
        figures.append(
            f'<figure><a href="{url}"><img loading="lazy" src="{url}" alt="{html.escape(caption)}"></a>'
            f"<figcaption>{html.escape(caption)}</figcaption></figure>"
        )
    (out / "contact-sheet.html").write_text(
        '<!doctype html><meta charset="utf-8"><title>Historical representative captures</title>'
        "<style>main{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}"
        "figure{margin:12px}img{max-width:100%;max-height:360px}figcaption{overflow-wrap:anywhere}</style>"
        '<h1>Historical representative captures</h1><p><a href="README.md">Publication index</a></p>'
        "<p>Inspect pie corner marks and large native viewport clipping. DOM screenshots and native captures "
        "use different sizing/font/layout controls. These are library/interface examples, not source-revision "
        "before/after images. Blank/error captures are retained. Manual findings remain in the evidence.</p>"
        "<main>" + "".join(figures) + "</main>"
    )


def publish(evidence_root, output):
    root, out = Path(evidence_root).resolve(), Path(output).resolve()
    source = Path(__file__).resolve().parent.parent
    if out.exists():
        raise ValueError("Publication output must not exist")
    if out.is_relative_to(root) or out.is_relative_to(source):
        raise ValueError("Publication output must be outside evidence and source trees")
    # Copy ordinary files only: no external references or recursive symlink trees.
    for path in root.rglob("*"):
        if path.is_symlink() or not (path.is_file() or path.is_dir()):
            raise ValueError(
                f"Evidence must contain ordinary files/directories: {path}"
            )
    inventory, supplemental, rows, first = load(root)
    summary, first_summary = summaries(root, rows), summaries(root, first)
    meta = metadata(root)
    out.mkdir(parents=True)
    shutil.copytree(root, out / "evidence")
    (out / "scorecards").mkdir()
    write_csv(out / "per-case.csv", summary)
    write_csv(out / "first-use.csv", first_summary)
    cards = [
        card(
            root,
            out,
            interface,
            inventory,
            supplemental,
            rows,
            first,
            summary,
            first_summary,
            meta,
        )
        for interface in INTERFACES
    ]
    contact_sheet(root, out)
    main = [r for r in rows if r["campaign"] in ("flutter", "pele")]
    extra = [r for r in rows if r["campaign"] not in ("flutter", "pele")]
    totals = counts(rows)
    provenance = {
        "published_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "protocol": "historical native-entrypoint evidence; no protocol upgrade",
        "metadata": meta,
        "main": counts(main),
        "supplemental": counts(extra),
        "first_use": counts(first),
        "total_campaign_observations": len(rows) + len(first),
        "source_snapshot": "Copied evidence/app/lib/main.dart and evidence/pele.mjs; PR HEAD is not the measured snapshot",
        "publisher_sha256": digest(Path(__file__)),
        "copied_evidence_sha256": {
            p.relative_to(out / "evidence").as_posix(): digest(p)
            for p in sorted((out / "evidence").rglob("*"))
            if p.is_file()
        },
    }
    (out / "publication.json").write_text(json.dumps(provenance, indent=2) + "\n")
    md = [
        "# Historical native Flutter and Chromium entrypoint results",
        "",
        f"Environment receipt date: **{meta['environment_receipt_date']}**. "
        f"Measurement window: {meta['measurement_window']}. Publication time is separate in publication.json.",
        "",
        "## Coverage",
        "",
        f"Main selection: {len(inventory)} inputs; {sum(not negative(c['id']) for c in inventory)} positive, "
        f"{sum(negative(c['id']) for c in inventory)} negative/unavailable-support probes. "
        f"Supplemental selection: {len(supplemental)} corrected edit inputs. "
        "Inputs are frozen public development fixtures, not a production holdout or exhaustive compatibility suite.",
        "",
        table(
            ("Population", "Raw observations", "Measured records", "Warmups"),
            (
                (
                    label,
                    counts(rs)["raw"],
                    counts(rs)["measured"],
                    counts(rs)["warmups"],
                )
                for label, rs in (
                    ("main", main),
                    ("supplemental edit", extra),
                    ("first use", first),
                )
            ),
        ),
        "",
        f"Campaign total: **{len(rows) + len(first)} observations**, including warmups and negative cases. "
        "This is a count of recorded observations, not entrypoint calls: "
        f"the main campaign includes {counts(main)['preparation_raw']} preparation failures "
        f"({counts(main)['preparation_measured']} non-warmup negative records) that did not reach the timed call. "
        "Other copied folders such as smoke checks are retained but excluded from these counts.",
        "",
        "Five separate version/interface/runtime scorecards (no combined score):",
        "",
        *["- " + link(name, f"scorecards/{name}.md") for name in cards],
        "",
        "## Outcomes",
        "",
        f"Initialized-runtime populations contain {totals['nonblank_measured']} nonblank measured records, "
        f"{totals['errors_measured']} error records and {totals['blank_measured']} blank records. "
        f"Of the errors, **{totals['preparation_raw']} preparation failures / "
        f"{totals['preparation_measured']} measured negative records** did not reach the timed entrypoint. "
        "Those are not measured entrypoint calls or negative assertion passes.",
        "",
        "Nonblank output, malformed-source errors, unavailable ZenUML support, manual visual findings and "
        "unavailable semantic checks remain separate. Per-input dispositions and missing attempts appear in each card.",
        "",
        ISSUES,
        "",
        "## Cost",
        "",
        "This campaign answers how each advertised entrypoint behaves and scales on the selected inputs "
        "on this cloud machine. Compare fresh, repeated and edited-source costs within an entrypoint, "
        "alongside its capabilities, visible limitations and stage boundary. Read the invalid render UPDATE "
        "and forced View repeat qualifications before drawing lifecycle conclusions.",
        "",
        "A matched-work ratio is unavailable pending common raster/PNG, font and viewport controls and "
        "calibrated sampling. There is no cross-runtime latency table, ratio, overall winner, or semantic/fidelity pass. "
        "Software graphics is not a forecast of mobile GPU performance. Resources are unavailable.",
        "",
        link("Full per-case/stage CSV", "per-case.csv")
        + " · "
        + link("Separate first-use CSV", "first-use.csv"),
        "",
        "Observed sample counts per nonempty initialized-runtime timing cell: "
        + (
            ", ".join(map(str, sorted({r["n"] for r in summary if r["n"]})))
            or "unavailable"
        )
        + "; first-use timing cell counts: "
        + (
            ", ".join(map(str, sorted({r["n"] for r in first_summary if r["n"]})))
            or "unavailable"
        )
        + ". "
        "Medians and interpolated p95 are recomputed from retained non-warmup raw records. "
        "No A/A calibration or confidence interval is inferred from these counts.",
        "",
        "## Evidence",
        "",
        link("Contact sheet with original captures", "contact-sheet.html"),
        "",
        "The entire supplied campaign is copied byte-for-byte under evidence/. Its original reports are "
        "historical records; the qualifications above govern this publication. Recorded absolute paths remain "
        "provenance, while publication links use portable copies. No collection, rerendering or input mutation occurred.",
        "",
        "Recorded revision references (as listed in the environment receipt): "
        + (", ".join(meta["recorded_revision_references"]) or "unavailable")
        + ". "
        "These do not identify a committed adapter snapshot: use the copied measured source files and their hashes. "
        "Current PR source must not be substituted for that snapshot.",
        "",
        link("Publication metadata and copied evidence hashes", "publication.json"),
        "",
        evidence_links(root),
        "",
    ]
    representative = root / "results/representative-images.jpg"
    if representative.is_file():
        md.extend(
            [
                "![Retained contact sheet: native and browser flowchart/sequence examples; native pie shows corner marks](evidence/results/representative-images.jpg)",
                "",
            ]
        )
    (out / "README.md").write_text("\n".join(md))
    files = sorted(p for p in out.rglob("*") if p.is_file())
    (out / "MANIFEST.sha256").write_text(
        "".join(f"{digest(p)}  {p.relative_to(out).as_posix()}\n" for p in files)
    )
    return provenance


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence-root", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    try:
        result = publish(args.evidence_root, args.out)
    except (ValueError, OSError, KeyError) as error:
        parser.exit(2, f"Publication failed: {error}\n")
    print(
        f"Published {result['total_campaign_observations']} retained observations to {args.out}"
    )


if __name__ == "__main__":
    main()
