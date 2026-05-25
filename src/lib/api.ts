import { apiUrl } from "@/lib/apiBaseUrl";

/** Browser fetch to Lynk API (uses VITE_API_BASE_URL when set). */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("ngrok-skip-browser-warning")) {
    headers.set("ngrok-skip-browser-warning", "1");
  }

  return fetch(apiUrl(path), { ...init, headers });
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const health = await apiGet("/api/health");
console.log("health", health);

  const res = await apiFetch(path);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `API ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
