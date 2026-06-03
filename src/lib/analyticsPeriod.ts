export type AnalyticsPeriod = "7d" | "30d" | "90d" | "365d" | "all";

export const ANALYTICS_PERIOD_OPTIONS: {
  value: AnalyticsPeriod;
  label: string;
  days: number | null;
}[] = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "365d", label: "12 months", days: 365 },
  { value: "all", label: "All time", days: null },
];

export function analyticsPeriodDays(period: AnalyticsPeriod): number | null {
  return ANALYTICS_PERIOD_OPTIONS.find((o) => o.value === period)?.days ?? null;
}

export function analyticsPeriodLabel(period: AnalyticsPeriod): string {
  return ANALYTICS_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;
}
