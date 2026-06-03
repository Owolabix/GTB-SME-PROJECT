import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AnalyticsPeriod } from "@/lib/analyticsPeriod";
import { analyticsPeriodDays } from "@/lib/analyticsPeriod";
import {
  buildDmTrendFromTimestamps,
  emptyDmTrendDays,
  periodStartIso,
  todayStartIso,
  type DmTrendDay,
} from "@/lib/dmTrend";
import { useDashboardRealtime } from "@/hooks/use-dashboard-realtime";

export type PeriodMetrics = {
  sent: number;
  totalEvents: number;
  autoReplied: number;
  aiReplied: number;
  needsYou: number;
  failed: number;
  followUpsCreated: number;
};

export type AnalyticsMetrics = {
  activeAutomations: number;
  totalAutomations: number;
  igAccounts: number;
  sentToday: number;
  openFollowUps: number;
  period: PeriodMetrics;
};

const emptyPeriodMetrics: PeriodMetrics = {
  sent: 0,
  totalEvents: 0,
  autoReplied: 0,
  aiReplied: 0,
  needsYou: 0,
  failed: 0,
  followUpsCreated: 0,
};

const emptyMetrics: AnalyticsMetrics = {
  activeAutomations: 0,
  totalAutomations: 0,
  igAccounts: 0,
  sentToday: 0,
  openFollowUps: 0,
  period: emptyPeriodMetrics,
};

function applyPeriodFilter<T extends { gte: (col: string, val: string) => T }>(
  query: T,
  periodStart: string | null,
): T {
  return periodStart ? query.gte("created_at", periodStart) : query;
}

export function useAnalyticsMetrics(period: AnalyticsPeriod) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>(emptyMetrics);
  const [trend, setTrend] = useState<DmTrendDay[]>(() => emptyDmTrendDays(7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const dayCount = analyticsPeriodDays(period);
    const periodStart = dayCount != null ? periodStartIso(dayCount) : null;
    const dayStart = todayStartIso();

    try {
      const [
        { count: activeAutomations, error: e1 },
        { count: totalAutomations, error: e2 },
        { count: igAccounts, error: e3 },
        { count: sent, error: e4 },
        { count: sentToday, error: e5 },
        { count: totalEvents, error: e6 },
        { count: autoReplied, error: e7 },
        { count: aiReplied, error: e8 },
        { count: needsYou, error: e9 },
        { count: failed, error: e10 },
        { count: openFollowUps, error: e11 },
        { count: followUpsCreated, error: e12 },
        { data: trendRows, error: e13 },
      ] = await Promise.all([
        supabase
          .from("automations")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase.from("automations").select("id", { count: "exact", head: true }),
        supabase.from("instagram_accounts").select("id", { count: "exact", head: true }),
        applyPeriodFilter(
          supabase
            .from("dm_events")
            .select("id", { count: "exact", head: true })
            .eq("status", "sent"),
          periodStart,
        ),
        supabase
          .from("dm_events")
          .select("id", { count: "exact", head: true })
          .eq("status", "sent")
          .gte("created_at", dayStart),
        applyPeriodFilter(
          supabase.from("dm_events").select("id", { count: "exact", head: true }),
          periodStart,
        ),
        applyPeriodFilter(
          supabase
            .from("dm_events")
            .select("id", { count: "exact", head: true })
            .eq("status", "sent")
            .not("error", "ilike", "%ai reply%"),
          periodStart,
        ),
        applyPeriodFilter(
          supabase
            .from("dm_events")
            .select("id", { count: "exact", head: true })
            .eq("status", "sent")
            .ilike("error", "%ai reply%"),
          periodStart,
        ),
        applyPeriodFilter(
          supabase
            .from("dm_events")
            .select("id", { count: "exact", head: true })
            .eq("status", "skipped"),
          periodStart,
        ),
        applyPeriodFilter(
          supabase
            .from("dm_events")
            .select("id", { count: "exact", head: true })
            .eq("status", "failed"),
          periodStart,
        ),
        supabase
          .from("owner_follow_ups")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        applyPeriodFilter(
          supabase.from("owner_follow_ups").select("id", { count: "exact", head: true }),
          periodStart,
        ),
        applyPeriodFilter(
          supabase.from("dm_events").select("created_at").eq("status", "sent"),
          periodStart,
        ),
      ]);

      const firstError =
        e1 ?? e2 ?? e3 ?? e4 ?? e5 ?? e6 ?? e7 ?? e8 ?? e9 ?? e10 ?? e11 ?? e12 ?? e13;
      if (firstError) throw firstError;

      setMetrics({
        activeAutomations: activeAutomations ?? 0,
        totalAutomations: totalAutomations ?? 0,
        igAccounts: igAccounts ?? 0,
        sentToday: sentToday ?? 0,
        openFollowUps: openFollowUps ?? 0,
        period: {
          sent: sent ?? 0,
          totalEvents: totalEvents ?? 0,
          autoReplied: autoReplied ?? 0,
          aiReplied: aiReplied ?? 0,
          needsYou: needsYou ?? 0,
          failed: failed ?? 0,
          followUpsCreated: followUpsCreated ?? 0,
        },
      });
      setTrend(
        buildDmTrendFromTimestamps(
          (trendRows ?? []).map((r) => r.created_at),
          dayCount,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  const { live } = useDashboardRealtime({
    onRefreshActivity: refresh,
    onRefreshFollowUps: refresh,
  });

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return { metrics, trend, loading, error, live, refresh };
}
