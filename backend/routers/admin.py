from pathlib import Path

from fastapi import APIRouter, HTTPException

from backend.models import AdminCommandRequest
from backend.services.powershell import run_pwsh, LOG_PATH

router = APIRouter()


@router.post("/execute")
async def execute_command(body: AdminCommandRequest):
    """Execute a PowerShell command and return its output."""
    command = body.command.strip()
    if not command:
        raise HTTPException(400, "Command cannot be empty")
    try:
        output = await run_pwsh(command, timeout=120)
    except RuntimeError as e:
        output = str(e)
    return {"output": output}


@router.get("/log")
async def get_log():
    """Return the current log file contents."""
    path = LOG_PATH
    if not path:
        raise HTTPException(500, "Log path not configured")
    p = Path(path)
    if not p.exists():
        return {"content": ""}
    return {"content": p.read_text(encoding="utf-8", errors="replace")}


@router.delete("/log")
async def clear_log():
    """Clear the log file."""
    path = LOG_PATH
    if not path:
        raise HTTPException(500, "Log path not configured")
    p = Path(path)
    if p.exists():
        p.write_text("", encoding="utf-8")
    return {"status": "ok"}
