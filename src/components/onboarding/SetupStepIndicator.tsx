import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { n: 1, label: "Connect Instagram" },
  { n: 2, label: "Store details" },
] as const;

export function SetupStepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-2 text-xs font-medium">
        {STEPS.map((step, index) => {
          const done = currentStep > step.n;
          const active = currentStep === step.n;
          return (
            <div key={step.n} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition",
                  done && "border-success bg-success text-success-foreground",
                  active && !done && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : step.n}
              </div>
              <span
                className={cn(
                  "truncate",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 hidden h-px min-w-[1rem] flex-1 sm:block",
                    done ? "bg-success/50" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Step {currentStep} of {STEPS.length}
      </p>
    </div>
  );
}
