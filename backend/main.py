import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routers import sort, settings, history, emby, admin
from backend.services import powershell


SETTINGS_PATH = os.environ.get("JV_SETTINGS_PATH", "/home/jvSettings.json")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load settings on startup to resolve paths
    if Path(SETTINGS_PATH).exists():
        with open(SETTINGS_PATH) as f:
            cfg = json.load(f)
        powershell.SETTINGS_PATH = SETTINGS_PATH

        module_dir = powershell.run_pwsh_sync(
            "(Get-InstalledModule Javinizer).InstalledLocation"
        )
        powershell.HISTORY_CSV_PATH = (
            cfg.get("location.historycsv")
            or os.path.join(module_dir, "jvHistory.csv")
        )
        powershell.LOG_PATH = (
            cfg.get("location.log")
            or os.path.join(module_dir, "jvLog.log")
        )
    yield


app = FastAPI(title="Javinizer NGX", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sort.router, prefix="/api/sort", tags=["sort"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(emby.router, prefix="/api/emby", tags=["emby"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Serve React static build (must be last so API routes take priority)
static_dir = Path(__file__).parent.parent / "frontend" / "dist"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
