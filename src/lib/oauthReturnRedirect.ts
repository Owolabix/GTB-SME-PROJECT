/**
 * After Meta OAuth, only allow internal resume URLs (hardening against open redirects).
 * Allows success (`code` + `state`) or Meta error (`error` + optional `error_description`).
 */
export function isSafeIntegrationsOAuthReturn(href: string): boolean {
  if (!href.startsWith("/integrations")) return false;
  if (href.length > 8192) return false;
  try {
    const u = new URL(href, "https://placeholder.local");
    if (u.pathname !== "/integrations") return false;
    if (u.searchParams.get("error")) return true;
    return !!(u.searchParams.get("code")?.trim() && u.searchParams.get("state")?.trim());
  } catch {
    return false;
  }
}
