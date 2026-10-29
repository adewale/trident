"""Validate recorded identities separately from measured-operation admission."""

import argparse
import collections
import hashlib
import itertools
import json
from pathlib import Path

PHASES = ("fresh", "repeat", "update")


def validate_identities(rows, case_ids, apis, rounds=3, samples=5, warmups=2):
    """Reject duplicates, missing observations and out-of-profile identities."""
    if len(case_ids) != len(set(case_ids)) or len(apis) != len(set(apis)):
        raise ValueError("duplicate case/API declarations")
    expected = set(
        itertools.product(
            case_ids, apis, PHASES, range(rounds), range(-warmups, samples)
        )
    )
    observed = []
    for row in rows:
        if type(row.get("round")) is not int or type(row.get("sample")) is not int:
            raise ValueError("round and sample identities must be integers")
        observed.append(
            (row["id"], row["api"], row["phase"], row["round"], row["sample"])
        )
    counts = collections.Counter(observed)
    duplicates = [identity for identity, count in counts.items() if count != 1]
    missing, unexpected = expected - counts.keys(), counts.keys() - expected
    if duplicates or missing or unexpected:
        raise ValueError(
            f"invalid sample identities: duplicates={duplicates[:3]}, missing={list(missing)[:3]}, unexpected={list(unexpected)[:3]}"
        )


def operation_attempted(row):
    if "measured_call_started" in row:
        return row["measured_call_started"] is True
    # Legacy browser preparation exceptions escaped before the timed try block.
    return "failed_after_ms" in row or row.get("status") in {"painted", "blank"}


def validate(evidence_root, report_path):
    b = evidence_root
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
            json.loads(x)
            for x in (o / engine / "samples.jsonl").read_text().splitlines()
        ]
        validate_identities(rows, [c["id"] for c in cases], apis)
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
        attempted = sum(operation_attempted(r) for r in rows)
        notes.append(
            f"{engine}: {len(rows)} unique recorded observations; {attempted} measured operations started; {len(rows)-attempted} preparation failures; {len(cells)} identity-complete cells; positive pixels and negative rejection evidence verified."
        )
    joined = [
        json.loads(x) for x in (o / "joined-samples.jsonl").read_text().splitlines()
    ]
    for r in joined:
        if r["engine"] == "flutter" and r["sample"] >= 0 and "ui_end_us" in r:
            assert r["matched_frames"] == r.get(
                "awaited_frames", 2 if r["api"] == "MermaidView" else 1
            )
            assert r["raster_complete_ms"] >= r["settled_ui_ms"] - 0.01
    notes.append(
        "Native monotonic-clock frame joins verified against each protocol's recorded frame boundary; legacy View repeats include a forced second frame."
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
                    len(rs) == 1
                    and rs[0]["sample"] == 0
                    and rs[0]["round"] == 0
                    and rs[0]["status"] == "painted"
                    and rs[0]["api"] == api
                    and rs[0]["phase"] == "fresh"
                    and rs[0]["id"] == "core:flow5"
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
        validate_identities(rs, ["core:tree50-visible-edit"], apis)
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
    report_path.write_text("\n".join(notes) + "\n")
    print("\n".join(notes))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence-root", type=Path, default=Path(__file__).parent)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    validate(
        args.evidence_root, args.report or args.evidence_root / "results/validation.txt"
    )
