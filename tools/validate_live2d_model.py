"""Preflight a Luna Cubism export. Does not replace Core or visual validation."""
import argparse
import json
import math
from pathlib import Path
import struct
from urllib.parse import unquote, urlsplit

CONTRACT = Path(__file__).resolve().parents[1] / "docs/live2d/rig-contract.json"


def read_json(path):
    def invalid(value):
        raise ValueError(f"Non-finite JSON number: {value}")
    return json.loads(path.read_text(encoding="utf-8-sig"), parse_constant=invalid)


def local_asset(root, name):
    """Keep every reference inside the exported model directory, including symlinks."""
    if not isinstance(name, str) or not name or "\\" in name:
        raise ValueError(f"Invalid asset reference: {name!r}")
    decoded = unquote(name)
    url = urlsplit(decoded)
    if url.scheme or url.netloc or url.query or url.fragment or decoded.startswith("/"):
        raise ValueError(f"Asset must be a relative file: {name!r}")
    path = (root / decoded).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise ValueError(f"Missing or out-of-directory asset: {name!r}")
    return path


def validate(model_path, contract_path=CONTRACT):
    model_path = Path(model_path).resolve()
    spec = read_json(contract_path)
    model = read_json(model_path)
    if not isinstance(model, dict) or model.get("Version") != 3:
        raise ValueError("Expected Cubism Version 3 model3.json")
    refs = model.get("FileReferences")
    if not isinstance(refs, dict):
        raise ValueError("Missing FileReferences")
    for name in spec["required_file_references"]:
        if not refs.get(name):
            raise ValueError(f"Missing FileReferences.{name}")
    root = model_path.parent
    checked = set()

    def asset(name, suffix):
        path = local_asset(root, name)
        if not path.name.lower().endswith(suffix):
            raise ValueError(f"Wrong file type: {name!r}; expected {suffix}")
        checked.add(path)
        return path

    moc = asset(refs["Moc"], ".moc3")
    with moc.open("rb") as stream:
        if stream.read(4) != b"MOC3":
            raise ValueError("Moc does not have a MOC3 header")
    textures = refs["Textures"]
    if not isinstance(textures, list) or not textures:
        raise ValueError("Textures must be a nonempty list")
    for name in textures:
        with asset(name, ".png").open("rb") as stream:
            header = stream.read(24)
        if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
            raise ValueError(f"Invalid PNG header: {name}")
        width, height = struct.unpack(">II", header[16:24])
        if not 0 < width <= 8192 or not 0 < height <= 8192:
            raise ValueError(f"Unsupported texture size: {width} x {height}")

    display = read_json(asset(refs["DisplayInfo"], ".cdi3.json"))
    ids = {p["Id"] for p in display.get("Parameters", [])}
    missing = set(spec["required_parameters"]) - ids
    if missing:
        raise ValueError("Missing parameter IDs: " + ", ".join(sorted(missing)))
    for key, suffix in [("Physics", ".physics3.json"), ("MotionSync", ".motionsync3.json"),
                        ("Pose", ".pose3.json"), ("UserData", ".userdata3.json")]:
        if refs.get(key):
            data = read_json(asset(refs[key], suffix))
            if not isinstance(data, dict) or not data:
                raise ValueError(f"Empty or invalid {key}")

    expressions = refs.get("Expressions", [])
    names = [entry["Name"] for entry in expressions]
    if len(set(names)) != len(names):
        raise ValueError("Duplicate expression names")
    missing = set(spec["required_expressions"]) - set(names)
    if missing:
        raise ValueError("Missing expressions: " + ", ".join(sorted(missing)))
    for entry in expressions:
        data = read_json(asset(entry["File"], ".exp3.json"))
        if data.get("Type") != "Live2D Expression" or not isinstance(data.get("Parameters"), list):
            raise ValueError(f"Invalid expression: {entry['Name']}")
        for p in data["Parameters"]:
            value = p.get("Value")
            if p.get("Id") not in ids or type(value) not in (int, float) or not math.isfinite(value):
                raise ValueError(f"Invalid expression parameter: {entry['Name']}")
            if p.get("Blend", "Add") not in ("Add", "Multiply", "Overwrite"):
                raise ValueError(f"Invalid expression blend: {entry['Name']}")

    motions = refs.get("Motions", {})
    for name in spec["required_motion_groups"]:
        if not motions.get(name):
            raise ValueError(f"Missing motion group: {name}")
    for entries in motions.values():
        for entry in entries:
            data = read_json(asset(entry["File"], ".motion3.json"))
            if data.get("Version") != 3 or not isinstance(data.get("Curves"), list) or not data["Curves"]:
                raise ValueError(f"Invalid or empty motion: {entry['File']}")
            if entry.get("Sound"):
                raise ValueError("Luna motions must not contain Sound; speech belongs to LunaSession")
    return {"files": len(checked), "parameters": len(ids), "expressions": len(names),
            "result": "File preflight passed; Core consistency, MotionSync mapping and visual QA still required"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model", type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(validate(args.model), ensure_ascii=False, indent=2))
    except (ValueError, OSError, KeyError, TypeError, AttributeError) as error:
        parser.exit(1, f"Live2D preflight failed: {error}\n")


if __name__ == "__main__":
    main()
