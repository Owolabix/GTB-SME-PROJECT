import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { DmTrendChart } from "@/components/analytics/DmTrendChart";
import { DmOutcomeBreakdown } from "@/components/analytics/DmOutcomeBreakdown";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import { useAnalyticsMetrics } from "@/hooks/use-analytics-metrics";
import type { AnalyticsPeriod } from "@/lib/analyticsPeriod";
import { analyticsPeriodLabel } from "@/lib/analyticsPeriod";
import { downloadAnalyticsCsv } from "@/lib/analyticsExport";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Workflow,
  Plug,
  MessageCircle,
  BellRing,
  Inbox,
  Sparkles,
  Bot,
  AlertTriangle,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Lynk Assistant — Analytics" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d");
  const { metrics, trend, loading, error, live } = useAnalyticsMetrics(period);

  const periodLabel = analyticsPeriodLabel(period);
  const { period: stats } = metrics;
  const trendTotal = trend.reduce((sum, d) => sum + d.sent, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            KPIs and trends for your Instagram automations.
            {live && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" aria-hidden />
                Live
              </span>
            )}
            {loading && !error && (
              <span className="ml-2 text-xs text-muted-foreground">Updating…</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-full"
            disabled={loading || Boolean(error)}
            onClick={() =>
              downloadAnalyticsCsv({
                period,
                periodLabel,
                metrics,
                trend,
              })
            }
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not load analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Overview
        </h2>
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<Workflow className="h-5 w-5" />}
            label="Active automations"
            value={metrics.activeAutomations}
            sublabel={`${metrics.totalAutomations} total`}
          />
          <KpiCard
            icon={<Plug className="h-5 w-5" />}
            label="IG accounts connected"
            value={metrics.igAccounts}
          />
          <KpiCard
            icon={<MessageCircle className="h-5 w-5" />}
            label={`DMs sent (${periodLabel})`}
            value={stats.sent}
            sublabel={metrics.sentToday > 0 ? `${metrics.sentToday} today` : undefined}
          />
          <KpiCard
            icon={<BellRing className="h-5 w-5" />}
            label="Open follow-ups"
            value={metrics.openFollowUps}
            sublabel={
              stats.followUpsCreated > 0
                ? `${stats.followUpsCreated} created in ${periodLabel.toLowerCase()}`
                : undefined
            }
            highlight={metrics.openFollowUps > 0}
            to="/dashboard"
            search={{ focus: "follow-ups" }}
            actionHint="View on Home →"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Volume — {periodLabel}
        </h2>
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<Inbox className="h-5 w-5" />}
            label="Inbound triggers"
            value={stats.totalEvents}
          />
          <KpiCard icon={<Sparkles className="h-5 w-5" />} label="Auto-replied" value={stats.autoReplied} />
          <KpiCard icon={<Bot className="h-5 w-5" />} label="AI replied" value={stats.aiReplied} />
          <KpiCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Needs you + failed"
            value={stats.needsYou + stats.failed}
            sublabel={`${stats.needsYou} skipped · ${stats.failed} failed`}
            highlight={stats.needsYou + stats.failed > 0}
            to="/dashboard"
            search={{
              focus: "activity",
              status: stats.failed > 0 && stats.needsYou === 0 ? "failed" : "needs_you",
            }}
            actionHint="View in activity →"
          />
        </div>
      </section>

      <section className="grid items-stretch gap-4 lg:grid-cols-5">
        <div className="h-full lg:col-span-3">
          <DmTrendChart
            data={trend}
            title={`DMs sent — ${periodLabel}`}
            description={`${trendTotal} outbound ${trendTotal === 1 ? "reply" : "replies"} in this period.`}
          />
        </div>
        <div className="h-full lg:col-span-2">
          <DmOutcomeBreakdown periodLabel={periodLabel} period={stats} />
        </div>
      </section>
    </div>
  );
}
