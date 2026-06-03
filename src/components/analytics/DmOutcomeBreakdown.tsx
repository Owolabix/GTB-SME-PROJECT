import type { PeriodMetrics } from "@/hooks/use-analytics-metrics";
import { cn } from "@/lib/utils";

type OutcomeRow = {
  label: string;
  value: number;
  tone: "success" | "primary" | "warning" | "destructive" | "muted";
};

const toneBar: Record<OutcomeRow["tone"], string> = {
  success: "bg-success",
  primary: "bg-primary",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground/40",
};

export function DmOutcomeBreakdown({
  periodLabel,
  period,
}: {
  periodLabel: string;
  period: PeriodMetrics;
}) {
  const rows: OutcomeRow[] = [
    { label: "Auto-replied (keyword)", value: period.autoReplied, tone: "success" },
    { label: "AI replied", value: period.aiReplied, tone: "primary" },
    { label: "Needs you (skipped)", value: period.needsYou, tone: "warning" },
    { label: "Failed to send", value: period.failed, tone: "destructive" },
  ];

  const max = Math.max(1, ...rows.map((r) => r.value));
  const replyRate =
    period.totalEvents > 0 ? Math.round((period.sent / period.totalEvents) * 100) : 0;

  return (
    <div className="app-panel rounded-2xl border p-6">
      <div>
        <h2 className="text-base font-semibold">DM outcomes — {periodLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {period.totalEvents} inbound triggers · {replyRate}% got an outbound reply
        </p>
      </div>
      <ul className="mt-5 space-y-4">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium tabular-nums">{row.value}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", toneBar[row.tone])}
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
