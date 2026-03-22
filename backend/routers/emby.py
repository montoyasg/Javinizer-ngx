import json

from fastapi import APIRouter, HTTPException

from backend.services.powershell import run_pwsh_json, SETTINGS_PATH

router = APIRouter()


@router.get("/actors")
async def get_actors():
    """Retrieve actors from Emby/Jellyfin server using settings."""
    with open(SETTINGS_PATH) as f:
        cfg = json.load(f)
    url = cfg.get("emby.url", "")
    api_key = cfg.get("emby.apikey", "")
    if not url or not api_key:
        raise HTTPException(400, "Emby URL and API key must be configured in settings")
    try:
        result = await run_pwsh_json(
            f"(Invoke-RestMethod -Method Get -Uri '{url}/emby/Persons/?api_key={api_key}' "
            f"-ErrorAction Stop).Items | Select-Object Name, Id, "
            f"@{{Name='Thumb'; Expression={{if ($null -ne $_.ImageTags.Thumb) {{'Exists'}} else {{'NULL'}}}}}}, "
            f"@{{Name='Primary'; Expression={{if ($null -ne $_.ImageTags.Primary) {{'Exists'}} else {{'NULL'}}}}}}"
        )
    except RuntimeError as e:
        raise HTTPException(502, f"Failed to connect to Emby: {e}")
    return result or []


@router.post("/thumbs")
async def set_thumbs():
    """Set Emby/Jellyfin actor thumbnails from thumb CSV."""
    try:
        await run_pwsh_json(
            "Javinizer -SetEmbyThumbs | ConvertTo-Json -Depth 10",
            timeout=600,
        )
    except RuntimeError as e:
        raise HTTPException(500, f"Failed to set thumbs: {e}")
    return {"status": "ok"}
