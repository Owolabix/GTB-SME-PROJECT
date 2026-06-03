import { useCallback, useEffect, useState } from "react";
import type { LynkSystemStatus } from "@/lib/lynkStatus";

const POLL_MS = 45_000;

export function useLynkSystemStatus(enabled = true) {
  const [status, setStatus] = useState<LynkSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const body = (await res.json()) as LynkSystemStatus;
      setStatus(body);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const shouldPoll = enabled && (status == null || status.merchant.monitorsAiAssistant);

  useEffect(() => {
    if (!shouldPoll) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [shouldPoll, refresh]);

  const monitorsAiAssistant = status?.merchant.monitorsAiAssistant ?? false;
  const aiAssistantOffline = status?.merchant.aiAssistantOffline ?? false;

  return { status, loading, error, monitorsAiAssistant, aiAssistantOffline, refresh };
}
