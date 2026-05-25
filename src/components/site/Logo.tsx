import { Send } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
        <Send className="h-4 w-4 -rotate-12" strokeWidth={2.6} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[16px] font-bold tracking-tight">Lynk Assistant</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">GTCO SME Storefront</div>
        </div>
      )}
    </div>
  );
}