from pydantic import BaseModel
from typing import Optional


class ScanRequest(BaseModel):
    path: str
    recurse: bool = False
    strict: bool = False


class SortRequest(BaseModel):
    path: str
    id: Optional[str] = None
    url: Optional[str] = None
    recurse: bool = False
    strict: bool = False
    update: bool = False
    force: bool = False


class ManualSearchRequest(BaseModel):
    id: str
    scrapers: Optional[dict] = None


class EmbyThumbsRequest(BaseModel):
    url: str
    api_key: str


class AdminCommandRequest(BaseModel):
    command: str
