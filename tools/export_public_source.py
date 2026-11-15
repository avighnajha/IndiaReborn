"""Export a committed source snapshot without the restricted historical map layer."""
import argparse
from io import BytesIO
import json
from pathlib import Path, PurePosixPath
from subprocess import check_output
from zipfile import ZipFile


OUTLINE_LABEL = "Historical outline unavailable in this build"
DESIGN_DOCUMENT = "design/India_Alternate_Futures_Game_Design.docx"
PUBLIC_NOTE = (
    "> This source build includes the campaigns, terrain, settlements and rivers. "
    "The digitized historical boundaries are held locally while redistribution "
    "rights are verified. The atlas, map and territory previews identify the "
    "unavailable outlines. See the [production map notes](design/map-production.md)."
)


def outline(record, *, neighbors=True):
    result = {"year": record["year"], "label": OUTLINE_LABEL, "polygons": []}
    if neighbors:
        result["neighbors"] = []
    return result


def public_geography(name, payload):
    data = json.loads(payload)
    if name == "founding.json":
        return {year: [] for year in data}
    if name == "bihar-successor.json":
        return {**outline(data), "successor": []}
    if name == "mayurbhanj.json":
        return {"points": data["points"], "boundary": outline(data["boundary"], neighbors=False)}
    result = {key: data[key] for key in ("points", "rivers", "labels", "reservoir")}
    result["boundaries"] = [outline(record) for record in data["boundaries"]]
    if "successors" in data:
        result["successors"] = {key: outline(record) for key, record in data["successors"].items()}
    return result


def export_source(project, destination):
    if destination.exists():
        raise FileExistsError(f"Export destination already exists: {destination}")
    archive = check_output(["git", "archive", "--format=zip", "HEAD"], cwd=project)
    destination.mkdir()
    with ZipFile(BytesIO(archive)) as source:
        for entry in source.infolist():
            name = PurePosixPath(entry.filename)
            if entry.is_dir() or name.as_posix() == DESIGN_DOCUMENT:
                continue
            if name.is_absolute() or ".." in name.parts or "\\" in entry.filename or ":" in entry.filename:
                raise ValueError(f"Unexpected archive path: {name}")
            path = destination.joinpath(*name.parts)
            path.parent.mkdir(parents=True, exist_ok=True)
            payload = source.read(entry)
            if name.parts[:2] == ("src", "geography") and name.suffix != ".webp":
                if name.suffix != ".json":
                    raise ValueError(f"Unexpected map asset: {name}")
                data = public_geography(name.name, payload)
                payload = (json.dumps(data, separators=(",", ":"), ensure_ascii=False) + "\n").encode()
            if name.as_posix() == "README.md":
                title, remainder = payload.decode("utf-8-sig").split("\n", 1)
                payload = (title.rstrip() + "\n\n" + PUBLIC_NOTE + "\n" + remainder).encode()
                payload = payload.replace(b"[Word design](design/India_Alternate_Futures_Game_Design.docx)", b"Word design")
            if name.as_posix() == "design/current-design.md":
                payload = payload.replace(b"[original design](India_Alternate_Futures_Game_Design.docx)", b"original design")
            path.write_bytes(payload)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", type=Path, help="Playable Git checkout to export from")
    parser.add_argument("destination", type=Path, help="New directory to receive the public source")
    args = parser.parse_args()
    export_source(args.project.resolve(strict=True), args.destination.resolve())
