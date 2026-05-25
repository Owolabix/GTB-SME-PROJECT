const INTEGRATIONS_PATH = "/integrations";

/** OAuth redirect path Meta must allow (must match token exchange redirect_uri). */
export function metaOAuthRedirectPath(): string {
  return INTEGRATIONS_PATH;
}

/**
 * Redirect URI sent to Meta. In dev, use the current browser origin so port matches Vite
 * (e.g. https://localhost:8080 vs a stale 5173 in .env).
 */
export function getMetaOAuthRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_META_REDIRECT_URI as string | undefined;
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}${INTEGRATIONS_PATH}`;
  }
  return fromEnv?.trim() ?? "";
}

/**
 * Server-side: accept redirect_uri from the client in dev (localhost only), else require env.
 */
export function resolveMetaRedirectUriForTokenExchange(clientRedirect?: string): string | null {
  const envUri = process.env.META_REDIRECT_URI?.trim();
  const candidate = clientRedirect?.trim();

  if (candidate) {
    try {
      const u = new URL(candidate);
      if (u.pathname !== INTEGRATIONS_PATH) return null;
      if (u.protocol !== "https:" && u.protocol !== "http:") return null;

      const isLocal =
        u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]";
      const isDevTunnel =
        u.hostname.endsWith(".ngrok-free.app") ||
        u.hostname.endsWith(".ngrok.io") ||
        u.hostname.endsWith(".ngrok.app");
      if (process.env.NODE_ENV !== "production" && (isLocal || isDevTunnel)) {
        return candidate;
      }
      if (envUri && candidate === envUri) {
        return candidate;
      }
    } catch {
      return null;
    }
  }

  return envUri || null;
}
