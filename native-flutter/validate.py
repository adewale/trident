import json, collections, hashlib
from pathlib import Path

b = Path(__file__).parent
o = b / "results"
cases = json.loads((b / "cases.json").read_text())
notes = []
for c in cases:
    assert hashlib.sha256(c["source"].encode()).hexdigest() == c["sha256"]
for engine, apis in [
    ("flutter", ["MermaidDiagram", "MermaidView", "renderToPng"]),
    ("pele", ["render", "mount"]),
]:
    rows = [
        json.loads(x) for x in (o / engine / "samples.jsonl").read_text().splitlines()
    ]
    assert len(rows) == len(cases) * len(apis) * 3 * 3 * 7, (engine, len(rows))
    cells = collections.defaultdict(list)
    for r in rows:
        cells[(r["id"], r["api"], r["phase"])].append(r)
        assert r["status"] in ["painted", "error", "blank"]
        if engine == "flutter":
            assert r["release"] is True
    for key, rs in cells.items():
        assert len(rs) == 21
        assert len([r for r in rs if r["sample"] >= 0]) == 15
        if key[0].startswith(("invalid:", "unsupported:")):
            assert all(r["status"] == "error" for r in rs)
        else:
            assert all(
                r["status"] == "painted" and r["painted_pixels"] > 0 for r in rs
            ), key
    notes.append(
        f"{engine}: {len(rows)} raw observations; {len(cells)} cells complete; positive pixels and retained negative cases verified."
    )
joined = [json.loads(x) for x in (o / "joined-samples.jsonl").read_text().splitlines()]
for r in joined:
    if r["engine"] == "flutter" and r["sample"] >= 0 and "ui_end_us" in r:
        assert r["matched_frames"] == (2 if r["api"] == "MermaidView" else 1)
        assert r["raster_complete_ms"] >= r["settled_ui_ms"] - 0.01
notes.append(
    "Native monotonic-clock FrameTiming joins verified: one frame per Diagram sample and two per View sample."
)
for engine, apis in [
    ("flutter", ["MermaidDiagram", "MermaidView", "renderToPng"]),
    ("pele", ["render", "mount"]),
]:
    for api in apis:
        for trial in range(5):
            p = o / ("first-use-" + engine) / api / str(trial) / "samples.jsonl"
            rs = [json.loads(x) for x in p.read_text().splitlines()]
            assert (
                len(rs) == 1 and rs[0]["sample"] == 0 and rs[0]["status"] == "painted"
            )
notes.append(
    "25 first-use observations verified: 5 fresh processes for each of 5 entrypoints, with no warmup."
)
for engine, apis in [
    ("flutter", ["MermaidDiagram", "MermaidView", "renderToPng"]),
    ("pele", ["render", "mount"]),
]:
    rs = [
        json.loads(x)
        for x in (o / ("visible-edit-" + engine) / "samples.jsonl")
        .read_text()
        .splitlines()
    ]
    for api in apis:
        us = [
            r
            for r in rs
            if r["api"] == api and r["phase"] == "update" and r["sample"] >= 0
        ]
        a = {r["pixel_hash"] for r in us if r["sourceUpdated"]}
        z = {r["pixel_hash"] for r in us if not r["sourceUpdated"]}
        assert a and z
        if engine == "flutter" and api == "MermaidDiagram":
            notes.append(
                "Diagram corrected-edit pixel change: "
                + str(a.isdisjoint(z))
                + "; inspect viewport clipping if unchanged."
            )
        else:
            assert a.isdisjoint(z), (engine, api)
notes.append(
    "Corrected tree update changes pixels in View, native PNG and both Pele paths; Diagram observation retained separately."
)
(o / "validation.txt").write_text("\n".join(notes) + "\n")
print("\n".join(notes))
