const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

// ── Settings ──

export const settingsApi = {
  get: () => request<Record<string, unknown>>("/settings"),
  update: (settings: Record<string, unknown>) =>
    request("/settings", { method: "PUT", body: JSON.stringify(settings) }),
  getRaw: () => request<{ content: string }>("/settings/raw"),
  updateRaw: (content: string) =>
    request("/settings/raw", {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
};

// ── Sort ──

export interface ScanResult {
  Data: Record<string, unknown> | null;
  [key: string]: unknown;
}

export const sortApi = {
  scan: (path: string, recurse = false, strict = false) =>
    request<ScanResult[]>("/sort/scan", {
      method: "POST",
      body: JSON.stringify({ path, recurse, strict }),
    }),
  search: (id: string, scrapers?: Record<string, boolean>) =>
    request<unknown>("/sort/search", {
      method: "POST",
      body: JSON.stringify({ id, scrapers }),
    }),
  execute: (params: {
    path: string;
    recurse?: boolean;
    strict?: boolean;
    update?: boolean;
    force?: boolean;
  }) =>
    request<unknown>("/sort/execute", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  batch: (params: {
    path: string;
    recurse?: boolean;
    strict?: boolean;
    update?: boolean;
    force?: boolean;
  }) =>
    request<{ job_id: string }>("/sort/batch", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  jobStatus: (jobId: string) =>
    request<{
      status: string;
      completed: number;
      total: number;
      current: string | null;
      error: string | null;
    }>(`/sort/job/${jobId}`),
};

// ── History ──

export interface HistoryRecord {
  Timestamp: string;
  Id: string;
  DisplayName: string;
  Title: string;
  Maker: string;
  Actress: string;
  Path: string;
  DestinationPath: string;
  [key: string]: string;
}

export const historyApi = {
  get: () => request<HistoryRecord[]>("/history"),
  clear: () => request("/history", { method: "DELETE" }),
};

// ── Emby ──

export interface EmbyActor {
  Name: string;
  Id: string;
  Thumb: string;
  Primary: string;
}

export const embyApi = {
  getActors: () => request<EmbyActor[]>("/emby/actors"),
  setThumbs: () => request("/emby/thumbs", { method: "POST" }),
};

// ── Admin ──

export const adminApi = {
  execute: (command: string) =>
    request<{ output: string }>("/admin/execute", {
      method: "POST",
      body: JSON.stringify({ command }),
    }),
  getLog: () => request<{ content: string }>("/admin/log"),
  clearLog: () => request("/admin/log", { method: "DELETE" }),
};
