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
          "Lynk Assistant ships free with every GTCO SME current account. Starter is available now; Growth and Scale are on the roadmap.",
      },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Starter",
    eligibility: "Any GTCO SME current account",
    availability: "available" as const,
    highlight: true,
    features: [
      "1 connected Instagram account",
      "Keyword automations + AI replies for unmatched DMs",
      "Merchant FAQs and store context for the assistant",
      "AISLE product catalogue sync",
      "Dashboard activity + basic analytics",
    ],
  },
  {
    name: "Growth",
    eligibility: "GTCO SME Plus / Premium tier",
    availability: "soon" as const,
    features: [
      "Multiple Instagram accounts",
      "Unlimited automations + multi-step DM flows",
      "Order-status replies via your GTCO data",
      "Priority webhook delivery",
    ],
  },
  {
    name: "Scale",
    eligibility: "GTCO Corporate SME",
    availability: "soon" as const,
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
            <strong className="font-medium text-foreground">Starter</strong> is what we ship in v1 today.
            Growth and Scale are planned tiers as we scale the product — same ₦0 add-on pricing model,
            more capacity when your bank tier unlocks them.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => {
            const available = t.availability === "available";
            return (
              <div
                key={t.name}
                className={`relative rounded-3xl border p-8 ${
                  t.highlight
                    ? "border-primary bg-card shadow-[var(--shadow-glow)]"
                    : "border-border bg-card shadow-[var(--shadow-card)]"
                } ${!available ? "opacity-80" : ""}`}
              >
                <span
                  className={`absolute right-6 top-6 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    available
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {available ? "Available now" : "Coming soon"}
                </span>
                <h3 className="text-xl font-semibold pr-24">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.eligibility}</p>
                <div className="mt-6 text-3xl font-semibold">
                  ₦0<span className="text-base font-normal text-muted-foreground">/mo</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
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
