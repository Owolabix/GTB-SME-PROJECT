import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type RefreshFn = () => void | Promise<void>;

function debounce(fn: RefreshFn, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void fn();
    }, ms);
  };
}

/**
 * Subscribes to Supabase Realtime for dm_events + owner_follow_ups (RLS-scoped).
 * Requires tables in publication `supabase_realtime` (see migration).
 */
export function useDashboardRealtime(opts: {
  onRefreshActivity: RefreshFn;
  onRefreshFollowUps: RefreshFn;
  debounceMs?: number;
}) {
  const { onRefreshActivity, onRefreshFollowUps, debounceMs = 600 } = opts;
  const activityRef = useRef(onRefreshActivity);
  const followUpsRef = useRef(onRefreshFollowUps);
  activityRef.current = onRefreshActivity;
  followUpsRef.current = onRefreshFollowUps;

  const [userId, setUserId] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const scheduleActivity = debounce(() => activityRef.current(), debounceMs);
    const scheduleFollowUps = debounce(() => followUpsRef.current(), debounceMs);

    const channel = supabase
      .channel(`dashboard-live:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dm_events",
          filter: `user_id=eq.${userId}`,
        },
        () => scheduleActivity(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "owner_follow_ups",
        },
        () => scheduleFollowUps(),
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [userId, debounceMs]);

  return { live };
}
