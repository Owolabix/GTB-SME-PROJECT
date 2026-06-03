import { cn } from "@/lib/utils";

export function KpiCard({
  icon,
  label,
  value,
  sublabel,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[8.5rem] flex-col rounded-2xl border p-5 shadow-[var(--shadow-card)]",
        highlight
          ? "border-warning/40 bg-gradient-to-br from-warning/10 to-warning/5"
          : "app-kpi",
      )}
    >
      <div className="flex h-12 shrink-0 items-start gap-2 text-xs font-medium uppercase leading-snug tracking-wider text-muted-foreground">
        <span className={cn("mt-0.5 shrink-0", !highlight && "app-kpi-icon")}>{icon}</span>
        <span className="line-clamp-2">{label}</span>
      </div>
      <div className="flex h-10 shrink-0 items-end">
        <div className="text-3xl font-semibold tabular-nums leading-none tracking-tight">{value}</div>
      </div>
      <p
        className={cn(
          "mt-2 min-h-[2.25rem] text-xs leading-snug text-muted-foreground",
          !sublabel && "invisible",
        )}
        aria-hidden={!sublabel}
      >
        {sublabel ?? "\u00a0"}
      </p>
    </div>
  );
}
