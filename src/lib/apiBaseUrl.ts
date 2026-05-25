/** Public Lynk API origin (ngrok in dev). Empty = same origin as the UI. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return raw?.trim().replace(/\/$/, "") ?? "";
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
