import { Link } from "@tanstack/react-router";
import {
  activationProgress,
  requiredActivationStepsDone,
  type ActivationChecklistState,
} from "@/lib/activationChecklist";
import { instagramProfileUrl } from "@/lib/instagramLinks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Instagram,
  HelpCircle,
  MessageCircle,
  Plug,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";

type Step = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  optional?: boolean;
  action?: React.ReactNode;
};

export function ActivationChecklist({
  state,
  testStepSkipped,
  onDismiss,
  onSkipTestStep,
}: {
  state: ActivationChecklistState;
  testStepSkipped: boolean;
  onDismiss: () => void;
  onSkipTestStep: () => void;
}) {
  const profileUrl = instagramProfileUrl(state.instagramUsername);
  const testDone = state.hasDmActivity || testStepSkipped;

  const steps: Step[] = [
    {
      id: "instagram",
      title: "Connect Instagram",
      description: "Link your business account so Lynk can read DMs and comments.",
      done: state.instagramConnected,
      action: !state.instagramConnected ? (
        <Button asChild size="sm" className="rounded-full bg-[image:var(--gradient-primary)]">
          <Link to="/integrations">
            <Plug className="mr-1 h-4 w-4" /> Connect now
          </Link>
        </Button>
      ) : undefined,
    },
    {
      id: "automation",
      title: "Create your first automation",
      description: "Set a keyword (e.g. “price”) and the reply Lynk sends automatically.",
      done: state.hasAutomation,
      action: !state.hasAutomation ? (
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link to="/automations">
            <Workflow className="mr-1 h-4 w-4" /> Create automation
          </Link>
        </Button>
      ) : undefined,
    },
    {
      id: "faqs",
      title: "Add store FAQs",
      description: "Returns, delivery, and payment answers help the AI reply accurately when keywords don’t match.",
      done: state.hasFaqs,
      action: !state.hasFaqs ? (
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link to="/faqs">
            <HelpCircle className="mr-1 h-4 w-4" /> Add FAQs
          </Link>
        </Button>
      ) : undefined,
    },
    {
      id: "test",
      title: "Send yourself a test DM",
      description: state.hasAutomation
        ? "From a personal account, DM your business page or comment your keyword on a post — activity will show below."
        : "After your first automation is live, trigger it with a DM or comment.",
      done: testDone,
      optional: true,
      action:
        !testDone && state.instagramConnected ? (
          <div className="flex flex-wrap items-center gap-2">
            {profileUrl && (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                  <Instagram className="mr-1 h-4 w-4" /> Open Instagram
                </a>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full text-muted-foreground"
              onClick={onSkipTestStep}
            >
              Skip for now
            </Button>
          </div>
        ) : undefined,
    },
  ];

  const { done, total } = activationProgress(state, { dismissed: false, testStepSkipped });
  const requiredDone = requiredActivationStepsDone(state);

  return (
    <section className="app-panel overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Get Lynk working</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {requiredDone
              ? "Almost there — trigger a test message to see your first activity."
              : "Complete these steps so customer messages start flowing."}
          </p>
        </div>
        {requiredDone && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            aria-label="Hide checklist"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{done} of {total} complete</span>
          <span>{Math.round((done / total) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-all duration-500"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      </div>

      <ol className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "flex gap-3 rounded-xl border p-4 transition",
              step.done ? "border-success/25 bg-success/5" : "border-border bg-card/60",
            )}
          >
            <div className="mt-0.5 shrink-0">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{step.title}</span>
                {step.optional && !step.done && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Optional
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              {step.action && <div className="mt-3">{step.action}</div>}
            </div>
            <span className="sr-only">
              Step {index + 1}: {step.done ? "complete" : "incomplete"}
            </span>
          </li>
        ))}
      </ol>

      {requiredDone && !testDone && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
            First customer activity will appear in Recent activity below.
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={onDismiss}
          >
            Hide checklist <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
