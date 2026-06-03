import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

/** Orange gradient icon mark (matches public/favicon.svg). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]",
        className,
      )}
    >
      <Send className="h-4 w-4 -rotate-12" strokeWidth={2.6} aria-hidden />
    </div>
  );
}
