import asyncio
import json
import subprocess
from typing import Any


SETTINGS_PATH = "/home/jvSettings.json"
HISTORY_CSV_PATH = None  # resolved from settings
LOG_PATH = None  # resolved from settings


async def run_pwsh(command: str, timeout: int = 300) -> str:
    """Run a PowerShell command asynchronously and return stdout."""
    proc = await asyncio.create_subprocess_exec(
        "pwsh", "-NoProfile", "-NonInteractive", "-Command", command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    if proc.returncode != 0:
        error_msg = stderr.decode().strip() if stderr else f"Exit code {proc.returncode}"
        raise RuntimeError(error_msg)
    return stdout.decode().strip()


async def run_pwsh_json(command: str, timeout: int = 300) -> Any:
    """Run a PowerShell command and parse JSON output."""
    json_cmd = f"{command} | ConvertTo-Json -Depth 32 -Compress"
    output = await run_pwsh(json_cmd, timeout=timeout)
    if not output:
        return None
    return json.loads(output)


def run_pwsh_sync(command: str, timeout: int = 300) -> str:
    """Run a PowerShell command synchronously."""
    result = subprocess.run(
        ["pwsh", "-NoProfile", "-NonInteractive", "-Command", command],
        capture_output=True, text=True, timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"Exit code {result.returncode}")
    return result.stdout.strip()


def run_pwsh_json_sync(command: str, timeout: int = 300) -> Any:
    """Run a PowerShell command synchronously and parse JSON output."""
    output = run_pwsh_sync(f"{command} | ConvertTo-Json -Depth 32 -Compress", timeout=timeout)
    if not output:
        return None
    return json.loads(output)
