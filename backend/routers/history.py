import csv
from io import StringIO
from pathlib import Path

from fastapi import APIRouter, HTTPException

from backend.services import powershell

router = APIRouter()


def _history_path() -> Path:
    path = powershell.HISTORY_CSV_PATH
    if not path:
        raise HTTPException(500, "History CSV path not configured")
    return Path(path)


@router.get("")
async def get_history():
    """Return sort history as a list of objects."""
    p = _history_path()
    if not p.exists():
        return []
    text = p.read_text(encoding="utf-8")
    if not text.strip():
        return []
    reader = csv.DictReader(StringIO(text))
    return list(reader)


@router.delete("")
async def clear_history():
    """Clear the history CSV file (keep header if present)."""
    p = _history_path()
    if p.exists():
        text = p.read_text(encoding="utf-8")
        lines = text.strip().split("\n")
        if lines:
            # Keep the header row
            p.write_text(lines[0] + "\n", encoding="utf-8")
    return {"status": "ok"}
