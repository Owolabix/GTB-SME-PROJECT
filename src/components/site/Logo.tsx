import { LogoMark } from "@/components/site/LogoMark";

export function Logo({
  compact = false,
  onLight = false,
}: {
  compact?: boolean;
  /** Logo sits on a white pill (hero nav) — force dark text */
  onLight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark />
      {!compact && (
        <div className="leading-tight">
          <div
            className={
              onLight
                ? "font-display text-[16px] font-bold tracking-tight text-neutral-900"
                : "font-display text-[16px] font-bold tracking-tight"
            }
          >
            Lynk Assistant
          </div>
          <div
            className={
              onLight
                ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500"
                : "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            }
          >
            GTCO SME Storefront
          </div>
        </div>
      )}
    </div>
  );
}