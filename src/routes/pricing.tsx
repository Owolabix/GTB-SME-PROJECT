import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Check, LogIn } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Lynk Assistant is included with GTCO SME" },
      {
        name: "description",
        content:
          "Lynk Assistant ships free with every GTCO SME current account. No add-on fees, no per-message charges.",
      },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Starter",
    eligibility: "Any GTCO SME current account",
    features: [
      "1 connected Instagram account",
      "Up to 3 active automations",
      "Comment + DM keyword triggers",
      "Basic delivery analytics",
    ],
  },
  {
    name: "Growth",
    eligibility: "GTCO SME Plus / Premium tier",
    highlight: true,
    features: [
      "3 connected Instagram accounts",
      "Unlimited automations",
      "Multi-step DM flows + delays",
      "Order-status replies via your GTCO data",
      "Priority webhook delivery",
    ],
  },
  {
    name: "Scale",
    eligibility: "GTCO Corporate SME",
    features: [
      "Unlimited IG accounts + teammates",
      "Custom keyword routing per post",
      "Audit log + role-based controls",
      "Dedicated relationship manager",
    ],
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Included with your account
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            No add-on fees. Lynk Assistant rides on your GTCO SME plan.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Your tier is set by the SME account you already hold with GTCO.
            Upgrade your account at the bank to unlock more capacity in Lynk Assistant.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-3xl border p-8 ${
                t.highlight
                  ? "border-primary bg-card shadow-[var(--shadow-glow)]"
                  : "border-border bg-card shadow-[var(--shadow-card)]"
              }`}
            >
              <h3 className="text-xl font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.eligibility}</p>
              <div className="mt-6 text-3xl font-semibold">₦0<span className="text-base font-normal text-muted-foreground">/mo</span></div>
              <ul className="mt-6 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-secondary/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">Already a GTCO SME customer?</p>
          <Button asChild className="mt-4 rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Link to="/login"><LogIn className="mr-1 h-4 w-4" /> Log in to Lynk Assistant</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}