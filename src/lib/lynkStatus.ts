export type LynkServiceStatus = {
  ok: boolean;
  label: string;
  detail?: string;
};

export type LynkSystemStatus = {
  ready: boolean;
  checkedAt: string;
  services: {
    supabase: LynkServiceStatus;
    meta: LynkServiceStatus;
    webhook: LynkServiceStatus;
    cxAssistant: LynkServiceStatus;
  };
  /** Merchant dashboard: only surface AI offline when production CX is configured but unreachable. */
  merchant: {
    monitorsAiAssistant: boolean;
    aiAssistantOffline: boolean;
  };
};

function envPresent(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

function isLocalDevCxUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return true;
  }
}

export async function getLynkSystemStatus(): Promise<LynkSystemStatus> {
  const services: LynkSystemStatus["services"] = {
    supabase: { ok: false, label: "Supabase" },
    meta: { ok: false, label: "Meta / Instagram" },
    webhook: { ok: false, label: "Instagram webhook" },
    cxAssistant: { ok: false, label: "CX-Assistant (AI replies)" },
  };

  if (envPresent("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")) {
    services.supabase = { ok: true, label: "Supabase", detail: "Service role configured" };
  } else {
    services.supabase.detail = "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env";
  }

  if (envPresent("META_APP_ID", "META_APP_SECRET", "META_WEBHOOK_VERIFY_TOKEN")) {
    services.meta = { ok: true, label: "Meta / Instagram", detail: "OAuth + webhook secrets configured" };
  } else {
    services.meta.detail = "Set META_APP_ID, META_APP_SECRET, and META_WEBHOOK_VERIFY_TOKEN";
  }

  if (services.meta.ok) {
    services.webhook = {
      ok: true,
      label: "Instagram webhook",
      detail: "Route: /api/public/webhooks/instagram",
    };
  } else {
    services.webhook.detail = "Requires Meta env vars";
  }

  const cxUrl = process.env.CX_ASSISTANT_URL?.replace(/\/$/, "");
  const cxSecret = process.env.CX_ASSISTANT_INTERNAL_SECRET?.trim();
  const cxConfigured = Boolean(cxUrl && cxSecret);
  const cxLocalDev = cxUrl ? isLocalDevCxUrl(cxUrl) : true;

  if (!cxConfigured) {
    services.cxAssistant.detail =
      "Set CX_ASSISTANT_URL and CX_ASSISTANT_INTERNAL_SECRET, then run npm run dev:cx";
  } else if (cxLocalDev) {
    services.cxAssistant.detail = `Local CX at ${cxUrl} (not monitored on merchant dashboard)`;
  } else {
    try {
      const res = await fetch(`${cxUrl}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        services.cxAssistant = {
          ok: true,
          label: "CX-Assistant (AI replies)",
          detail: "Connected",
        };
      } else {
        services.cxAssistant.detail = `CX-Assistant returned HTTP ${res.status}`;
      }
    } catch {
      services.cxAssistant.detail = "CX-Assistant health check failed";
    }
  }

  const monitorsAiAssistant = cxConfigured && !cxLocalDev;
  const merchant = {
    monitorsAiAssistant,
    aiAssistantOffline: monitorsAiAssistant && !services.cxAssistant.ok,
  };

  const ready =
    services.supabase.ok &&
    services.meta.ok &&
    services.webhook.ok &&
    services.cxAssistant.ok;

  return {
    ready,
    checkedAt: new Date().toISOString(),
    services,
    merchant,
  };
}
