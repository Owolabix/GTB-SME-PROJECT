import type { AnalyticsMetrics } from "@/hooks/use-analytics-metrics";
import type { AnalyticsPeriod } from "@/lib/analyticsPeriod";
import type { DmTrendDay } from "@/lib/dmTrend";

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

export function downloadAnalyticsCsv(opts: {
  period: AnalyticsPeriod;
  periodLabel: string;
  metrics: AnalyticsMetrics;
  trend: DmTrendDay[];
}): void {
  const { period, periodLabel, metrics, trend } = opts;
  const { period: stats } = metrics;
  const replyRate =
    stats.totalEvents > 0 ? Math.round((stats.sent / stats.totalEvents) * 100) : 0;
  const exportedAt = new Date().toISOString();
  const dateStamp = exportedAt.slice(0, 10);

  const lines: string[] = [
    csvRow(["Lynk Assistant analytics export"]),
    csvRow(["Period", periodLabel]),
    csvRow(["Exported at", exportedAt]),
    "",
    csvRow(["Overview"]),
    csvRow(["Metric", "Value"]),
    csvRow(["Active automations", metrics.activeAutomations]),
    csvRow(["Total automations", metrics.totalAutomations]),
    csvRow(["Instagram accounts connected", metrics.igAccounts]),
    csvRow([`DMs sent (${periodLabel})`, stats.sent]),
    csvRow(["DMs sent today", metrics.sentToday]),
    csvRow(["Open follow-ups", metrics.openFollowUps]),
    "",
    csvRow(["Volume"]),
    csvRow(["Inbound triggers", stats.totalEvents]),
    csvRow(["Auto-replied (keyword)", stats.autoReplied]),
    csvRow(["AI replied", stats.aiReplied]),
    csvRow(["Needs you (skipped)", stats.needsYou]),
    csvRow(["Failed to send", stats.failed]),
    csvRow(["Follow-ups created in period", stats.followUpsCreated]),
    csvRow(["Reply rate (%)", replyRate]),
    "",
    csvRow(["DM outcomes"]),
    csvRow(["Outcome", "Count"]),
    csvRow(["Auto-replied (keyword)", stats.autoReplied]),
    csvRow(["AI replied", stats.aiReplied]),
    csvRow(["Needs you (skipped)", stats.needsYou]),
    csvRow(["Failed to send", stats.failed]),
    "",
    csvRow(["DMs sent by day"]),
    csvRow(["Day", "DMs sent"]),
    ...trend.map((d) => csvRow([d.label, d.sent])),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lynk-analytics-${period}-${dateStamp}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
