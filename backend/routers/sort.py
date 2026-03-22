import asyncio
import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException

from backend.models import ScanRequest, SortRequest, ManualSearchRequest
from backend.services.powershell import run_pwsh, run_pwsh_json, SETTINGS_PATH

router = APIRouter()

# Active sort jobs: job_id -> {status, progress, total, results, error}
_jobs: dict[str, dict] = {}


@router.post("/scan")
async def scan_directory(req: ScanRequest):
    """Scan a directory/file for movies and return scraped metadata."""
    recurse_flag = "-Recurse" if req.recurse else ""
    strict_flag = "-Strict" if req.strict else ""
    cmd = (
        f"Javinizer -Path '{req.path}' {recurse_flag} {strict_flag} "
        f"-HideProgress -IsWeb -IsWebType 'Search'"
    )
    try:
        result = await run_pwsh_json(cmd, timeout=600)
    except RuntimeError as e:
        raise HTTPException(500, f"Scan failed: {e}")
    if result is None:
        return []
    # Ensure we always return a list
    if isinstance(result, dict):
        result = [result]
    return result


@router.post("/search")
async def manual_search(req: ManualSearchRequest):
    """Search for a movie by ID with optional scraper overrides."""
    scraper_flags = ""
    if req.scrapers:
        for key, enabled in req.scrapers.items():
            if enabled:
                scraper_flags += f" -{key}"
    cmd = f"Get-JVData -Id '{req.id}'{scraper_flags} -Settings (Get-Content '{SETTINGS_PATH}' | ConvertFrom-Json)"
    try:
        result = await run_pwsh_json(cmd, timeout=300)
    except RuntimeError as e:
        raise HTTPException(500, f"Search failed: {e}")
    return result


@router.post("/execute")
async def sort_single(req: SortRequest):
    """Sort a single movie file."""
    strict_flag = "-Strict" if req.strict else ""
    update_flag = "-Update" if req.update else ""
    force_flag = "-Force" if req.force else ""
    cmd = (
        f"Javinizer -Path '{req.path}' {strict_flag} {update_flag} {force_flag} "
        f"-HideProgress -IsWeb -IsWebType 'Sort'"
    )
    try:
        result = await run_pwsh_json(cmd, timeout=600)
    except RuntimeError as e:
        raise HTTPException(500, f"Sort failed: {e}")
    return result or {"status": "ok"}


@router.post("/batch")
async def sort_batch(req: SortRequest):
    """Start a batch sort job. Returns a job_id to track progress via WebSocket."""
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "running", "completed": 0, "total": 0, "current": None, "error": None}

    recurse_flag = "-Recurse" if req.recurse else ""
    strict_flag = "-Strict" if req.strict else ""
    update_flag = "-Update" if req.update else ""
    force_flag = "-Force" if req.force else ""

    async def run_batch():
        try:
            cmd = (
                f"Javinizer -Path '{req.path}' {recurse_flag} {strict_flag} "
                f"{update_flag} {force_flag} -HideProgress -IsWeb -IsWebType 'Sort'"
            )
            await run_pwsh(cmd, timeout=3600)
            _jobs[job_id]["status"] = "completed"
        except RuntimeError as e:
            _jobs[job_id]["status"] = "failed"
            _jobs[job_id]["error"] = str(e)

    asyncio.create_task(run_batch())
    return {"job_id": job_id}


@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a batch sort job."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.websocket("/ws/progress")
async def sort_progress(websocket: WebSocket):
    """WebSocket endpoint for real-time sort progress updates."""
    await websocket.accept()
    try:
        while True:
            # Client sends job_id to subscribe
            data = await websocket.receive_text()
            msg = json.loads(data)
            job_id = msg.get("job_id")
            if not job_id or job_id not in _jobs:
                await websocket.send_json({"error": "Invalid job_id"})
                continue

            # Stream updates until job completes
            while True:
                job = _jobs.get(job_id, {})
                await websocket.send_json(job)
                if job.get("status") in ("completed", "failed"):
                    break
                await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
