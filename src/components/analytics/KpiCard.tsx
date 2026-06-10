import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sublabel?: string;
  highlight?: boolean;
  /** When set, the card links to Home with optional query params. */
  to?: "/dashboard";
  search?: Record<string, string>;
  actionHint?: string;
};

export function KpiCard({
  icon,
  label,
  value,
  sublabel,
  highlight,
  to,
  search,
  actionHint,
}: KpiCardProps) {
  const interactive = Boolean(to);

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              highlight
                ? "bg-warning/20 text-warning"
                : "bg-primary/12 text-primary",
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 text-[0.7rem] font-semibold uppercase leading-snug tracking-wider text-muted-foreground">
            {label}
          </div>
        </div>
        {interactive && (
          <ArrowRight
            className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          />
        )}
      </div>

      <div className="mt-4 text-4xl font-bold tabular-nums leading-none tracking-tight">{value}</div>

      <p
        className={cn(
          "mt-2 min-h-[2.25rem] text-xs leading-snug",
          sublabel ? "text-muted-foreground" : "invisible",
        )}
        aria-hidden={!sublabel}
      >
        {sublabel ?? "\u00a0"}
      </p>

      {interactive && actionHint && (
        <p className="mt-auto pt-1 text-xs font-medium text-primary">{actionHint}</p>
      )}
    </>
  );

  const className = cn(
    "group flex h-full min-h-[9.5rem] flex-col rounded-2xl border p-5 shadow-[var(--shadow-card)] transition-all",
    highlight
      ? "border-warning/50 bg-gradient-to-br from-warning/14 via-warning/8 to-card"
      : "border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.04]",
    interactive &&
      "cursor-pointer hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    highlight && interactive && "hover:border-warning/60",
  );

  if (to) {
    return (
      <Link to={to} search={search} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
