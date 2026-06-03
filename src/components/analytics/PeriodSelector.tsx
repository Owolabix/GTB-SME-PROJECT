import type { AnalyticsPeriod } from "@/lib/analyticsPeriod";
import { ANALYTICS_PERIOD_OPTIONS } from "@/lib/analyticsPeriod";
import { cn } from "@/lib/utils";

export function PeriodSelector({
  value,
  onChange,
  className,
}: {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 rounded-full border border-input bg-background p-0.5",
        className,
      )}
      role="group"
      aria-label="Analytics date range"
    >
      {ANALYTICS_PERIOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-4",
            value === option.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
