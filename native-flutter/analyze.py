import json, csv, statistics, collections, math
from pathlib import Path

b = Path(__file__).parent
out = b / "results"
rows = []
for engine, folder in [
    ("flutter", "flutter"),
    ("pele", "pele"),
    ("flutter", "visible-edit-flutter"),
    ("pele", "visible-edit-pele"),
]:
    p = out / folder / "samples.jsonl"
    if p.exists():
        for line in p.read_text().splitlines():
            r = json.loads(line)
            r["engine"] = engine
            r["campaign"] = folder
            rows.append(r)


def percentile(xs, p):
    xs = sorted(xs)
    k = (len(xs) - 1) * p
    a = int(k)
    return xs[a] + (xs[min(a + 1, len(xs) - 1)] - xs[a]) * (k - a)


# Native FrameTiming uses the same monotonic microsecond clock as Timeline.now.
frame_sets = {
    folder: json.loads((out / folder / "frames.json").read_text())
    for folder in ["flutter", "visible-edit-flutter"]
    if (out / folder / "frames.json").exists()
}
for r in rows:
    if "ui_end_us" in r:
        f = [
            f
            for f in frame_sets.get(r["campaign"], [])
            if r["timeline_start_us"] <= f["buildStart_us"] <= r["settled_ui_end_us"]
        ]
        r["matched_frames"] = len(f)
        if f:
            r["raster_complete_ms"] = (
                max(x["vsyncStart_us"] + x["total_us"] for x in f)
                - r["timeline_start_us"]
            ) / 1000
            r["engine_raster_sum_ms"] = sum(x["raster_us"] for x in f) / 1000
            r["engine_build_sum_ms"] = sum(x["build_us"] for x in f) / 1000
(out / "joined-samples.jsonl").write_text("".join(json.dumps(r) + "\n" for r in rows))
groups = collections.defaultdict(list)
for r in rows:
    if r["sample"] >= 0:
        groups[(r["engine"], r["id"], r["api"], r["phase"])].append(r)
summary = []
coverage = []
updates = []
for key, rs in sorted(groups.items()):
    good = [r for r in rs if r["status"] == "painted"]
    coverage.append(
        dict(zip(["engine", "id", "api", "phase"], key))
        | {
            "n": len(rs),
            "painted": len(good),
            "errors": len(rs) - len(good),
            "first_error": next(
                (r.get("error", r["status"]) for r in rs if r["status"] != "painted"),
                "",
            ),
        }
    )
    stages = sorted({k for r in good for k in r if k.endswith("_ms")})
    for stage in stages:
        xs = [r[stage] for r in good if stage in r]
        summary.append(
            dict(zip(["engine", "id", "api", "phase"], key))
            | {
                "stage": stage,
                "n": len(xs),
                "p50_ms": statistics.median(xs),
                "p95_ms": percentile(xs, 0.95),
                "min_ms": min(xs),
                "max_ms": max(xs),
            }
        )
    if key[-1] == "update":
        a = {r.get("pixel_hash") for r in good if r.get("sourceUpdated")}
        z = {r.get("pixel_hash") for r in good if not r.get("sourceUpdated")}
        updates.append(
            dict(zip(["engine", "id", "api", "phase"], key))
            | {
                "changed_hashes": bool(a and z and a.isdisjoint(z)),
                "base_hashes": str(z),
                "updated_hashes": str(a),
            }
        )
# Visual findings belong to the inspected run, never to an unreviewed rerun.
findings_path = out / "visual-findings.json"
findings = json.loads(findings_path.read_text()) if findings_path.exists() else []
for r in coverage:
    r["visual_qualification"] = "nonblank-only; semantic fidelity not established"
    for finding in findings:
        ids = finding.get("ids", [finding.get("id")])
        if (
            r["engine"] == finding["engine"]
            and r["id"] in ids
            and r["api"] in finding["apis"]
        ):
            r["visual_qualification"] = (
                finding["qualification"] + ": " + finding["finding"]
            )
for name, data in [("summary", summary), ("coverage", coverage), ("updates", updates)]:
    with (out / (name + ".csv")).open("w") as f:
        w = csv.DictWriter(f, fieldnames=list(data[0]))
        w.writeheader()
        w.writerows(data)
errors = [r for r in rows if r["status"] != "painted"]
(out / "failures.jsonl").write_text("".join(json.dumps(r) + "\n" for r in errors))
print(
    "rows",
    len(rows),
    "measured",
    sum(r["sample"] >= 0 for r in rows),
    "failed",
    len(errors),
)
for engine in ["flutter", "pele"]:
    for api in sorted({r["api"] for r in rows if r["engine"] == engine}):
        fresh = [
            r
            for r in coverage
            if r["engine"] == engine and r["api"] == api and r["phase"] == "fresh"
        ]
        print(
            engine,
            api,
            "painted cases",
            sum(r["painted"] > 0 for r in fresh),
            "of",
            len(fresh),
            "failures",
            [(r["id"], r["first_error"][:100]) for r in fresh if r["errors"]],
        )
print(
    "No visible pixel change",
    [(r["engine"], r["api"], r["id"]) for r in updates if not r["changed_hashes"]],
)

first = []
for engine in ["flutter", "pele"]:
    for p in (out / ("first-use-" + engine)).glob("*/*/samples.jsonl"):
        for line in p.read_text().splitlines():
            r = json.loads(line)
            r["engine"] = engine
            r["trial"] = int(p.parent.name)
            if engine == "flutter" and "ui_end_us" in r:
                fs = json.loads((p.parent / "frames.json").read_text())
                fs = [
                    f
                    for f in fs
                    if r["timeline_start_us"]
                    <= f["buildStart_us"]
                    <= r["settled_ui_end_us"]
                ]
                r["matched_frames"] = len(fs)
                if fs:
                    r["raster_complete_ms"] = (
                        max(f["vsyncStart_us"] + f["total_us"] for f in fs)
                        - r["timeline_start_us"]
                    ) / 1000
            first.append(r)
(out / "first-use.jsonl").write_text("".join(json.dumps(r) + "\n" for r in first))
fg = collections.defaultdict(list)
for r in first:
    fg[(r["engine"], r["api"])].append(r)
fc = []
for (engine, api), rs in sorted(fg.items()):
    for stage in sorted({k for r in rs for k in r if k.endswith("_ms")}):
        xs = [r[stage] for r in rs if stage in r]
        fc.append(
            {
                "engine": engine,
                "api": api,
                "stage": stage,
                "n": len(xs),
                "p50_ms": statistics.median(xs),
                "p95_ms": percentile(xs, 0.95),
            }
        )
if fc:
    with (out / "first-use-summary.csv").open("w") as f:
        w = csv.DictWriter(f, fieldnames=list(fc[0]))
        w.writeheader()
        w.writerows(fc)
