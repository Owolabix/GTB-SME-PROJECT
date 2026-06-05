import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  loadActivationChecklistPrefs,
  saveActivationChecklistPrefs,
  shouldShowActivationChecklist,
  type ActivationChecklistPrefs,
  type ActivationChecklistState,
} from "@/lib/activationChecklist";

const emptyState: ActivationChecklistState = {
  instagramConnected: false,
  hasAutomation: false,
  hasFaqs: false,
  hasDmActivity: false,
  instagramUsername: null,
};

export function useActivationChecklist() {
  const [state, setState] = useState<ActivationChecklistState>(emptyState);
  const [prefs, setPrefs] = useState<ActivationChecklistPrefs>(() => loadActivationChecklistPrefs());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const [{ data: igRows }, { count: autoCount }, { count: eventCount }, { count: faqCount }] =
      await Promise.all([
        supabase
          .from("instagram_accounts")
          .select("username")
          .order("connected_at", { ascending: false })
          .limit(1),
        supabase.from("automations").select("id", { count: "exact", head: true }),
        supabase.from("dm_events").select("id", { count: "exact", head: true }).limit(1),
        userId
          ? supabase
              .from("faqs")
              .select("id", { count: "exact", head: true })
              .eq("merchant_scoped_id", userId)
          : Promise.resolve({ count: 0, error: null }),
      ]);

    const igRow = igRows?.[0];
    setState({
      instagramConnected: (igRows?.length ?? 0) > 0,
      hasAutomation: (autoCount ?? 0) > 0,
      hasFaqs: (faqCount ?? 0) > 0,
      hasDmActivity: (eventCount ?? 0) > 0,
      instagramUsername: igRow?.username?.trim() ?? null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const visible = !loading && shouldShowActivationChecklist(state, prefs);

  function dismiss() {
    const next = { ...prefs, dismissed: true };
    setPrefs(next);
    saveActivationChecklistPrefs(next);
  }

  function skipTestStep() {
    const next = { ...prefs, testStepSkipped: true };
    setPrefs(next);
    saveActivationChecklistPrefs(next);
  }

  return { state, prefs, loading, visible, refresh, dismiss, skipTestStep };
}
