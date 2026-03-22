import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from backend.services.powershell import SETTINGS_PATH

router = APIRouter()


def _settings_path() -> Path:
    return Path(SETTINGS_PATH)


@router.get("")
async def get_settings():
    """Return the full jvSettings.json."""
    p = _settings_path()
    if not p.exists():
        raise HTTPException(404, "Settings file not found")
    with open(p) as f:
        return json.load(f)


@router.put("")
async def update_settings(settings: dict):
    """Overwrite jvSettings.json with the provided object."""
    p = _settings_path()
    try:
        # Validate it's serializable
        content = json.dumps(settings, indent=2)
    except (TypeError, ValueError) as e:
        raise HTTPException(400, f"Invalid settings JSON: {e}")
    with open(p, "w") as f:
        f.write(content)
    return {"status": "ok"}


@router.get("/raw")
async def get_settings_raw():
    """Return raw settings file content as a string (for JSON editor)."""
    p = _settings_path()
    if not p.exists():
        raise HTTPException(404, "Settings file not found")
    return {"content": p.read_text()}


@router.put("/raw")
async def update_settings_raw(body: dict):
    """Save raw JSON string to settings file."""
    content = body.get("content", "")
    try:
        json.loads(content)  # validate
    except json.JSONDecodeError as e:
        raise HTTPException(400, f"Invalid JSON: {e}")
    p = _settings_path()
    p.write_text(content)
    return {"status": "ok"}
