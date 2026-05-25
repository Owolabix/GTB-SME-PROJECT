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
};

function envPresent(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
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
  if (!cxUrl || !cxSecret) {
    services.cxAssistant.detail =
      "Set CX_ASSISTANT_URL and CX_ASSISTANT_INTERNAL_SECRET, then run npm run dev:cx";
  } else {
    try {
      const res = await fetch(`${cxUrl}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        services.cxAssistant = {
          ok: true,
          label: "CX-Assistant (AI replies)",
          detail: `Connected at ${cxUrl}`,
        };
      } else {
        services.cxAssistant.detail = `CX-Assistant returned ${res.status} — run npm run dev:cx`;
      }
    } catch {
      services.cxAssistant.detail = `Cannot reach ${cxUrl} — start CX-Assistant with npm run dev:cx`;
    }
  }

  const ready =
    services.supabase.ok &&
    services.meta.ok &&
    services.webhook.ok &&
    services.cxAssistant.ok;

  return {
    ready,
    checkedAt: new Date().toISOString(),
    services,
  };
}
