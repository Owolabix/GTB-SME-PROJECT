import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Instagram,
  Sparkles,
  Bot,
  Hash,
  Settings2,
  PlugZap,
  Layers,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Lynk Assistant works — Instagram DM automations explained" },
      {
        name: "description",
        content:
          "From connecting your Instagram to your first auto-reply: a step-by-step walkthrough of how Lynk Assistant turns comments and DMs into automatic conversations.",
      },
      { property: "og:title", content: "How Lynk Assistant works — Instagram DM automations explained" },
      { property: "og:description", content: "Lynk Assistant listens to Instagram comments and DMs, then auto-replies with the message you wrote — in seconds." },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHero />
      <Steps />
      <DeepDive />
      <FAQ />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

function PageHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(50% 40% at 80% 0%, oklch(0.95 0.08 55 / 0.7), transparent 60%), radial-gradient(45% 35% at 0% 20%, oklch(0.97 0.04 60 / 0.9), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-5xl px-6 py-20 lg:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> A 5-minute walkthrough
        </div>
        <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          How Lynk Assistant <span className="text-primary">works.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          From the moment you connect Instagram to your first auto-reply — here's exactly what
          happens, step by step.
        </p>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "01",
    icon: Instagram,
    t: "Connect your Instagram",
    d: "Sign in with Instagram in one tap. Lynk Assistant gets permission to read comments + DMs and to send messages on your behalf — nothing else.",
  },
  {
    n: "02",
    icon: Settings2,
    t: "Pick a trigger",
    d: "Choose a comment trigger (someone comments on your post) or a DM trigger (someone DMs you a keyword).",
  },
  {
    n: "03",
    icon: Hash,
    t: "Add keywords",
    d: "List the words that should fire the automation: “price”, “link”, “available”, anything you want. Lynk Assistant does fuzzy matching.",
  },
  {
    n: "04",
    icon: Layers,
    t: "Write the reply",
    d: "Compose a single DM or a sequence of messages with delays — opener, link, follow-up — for a natural feel.",
  },
  {
    n: "05",
    icon: Bot,
    t: "Activate",
    d: "Flip the toggle. Lynk Assistant subscribes to Instagram's webhook and reacts to the next matching event in seconds.",
  },
  {
    n: "06",
    icon: ShieldCheck,
    t: "Stay in control",
    d: "Every reply Lynk Assistant sends shows up in your dashboard. Pause, edit, or take over an automation any time.",
  },
];

function Steps() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {steps.map((s) => (
            <div
              key={s.n}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-5xl font-bold text-primary/20">{s.n}</div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeepDive() {
  const items = [
    {
      icon: PlugZap,
      t: "Real-time, not polling",
      d: "Lynk Assistant uses Instagram's official webhook so events arrive the instant they happen — no 5-minute delay, no missed comments.",
    },
    {
      icon: Bot,
      t: "Per-post targeting",
      d: "Run a launch automation on one reel and a sale automation on another, without any crossover or duplicate replies.",
    },
    {
      icon: ShieldCheck,
      t: "You own every word",
      d: "Lynk Assistant doesn't generate replies. You write them, Lynk Assistant just delivers — so the brand voice always sounds like you.",
    },
  ];
  return (
    <section className="bg-secondary/40 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Under the hood</div>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Designed for creators, not engineers.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((i) => (
            <div key={i.t} className="rounded-3xl border border-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <i.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{i.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Do I need an Instagram business account?",
      a: "Yes — Lynk Assistant uses Instagram's Graph API, which requires a Business or Creator account linked to a Facebook Page. The connection takes about 60 seconds.",
    },
    {
      q: "Will Instagram flag automated replies?",
      a: "No. Lynk Assistant uses Instagram's official Messaging API, the same one Meta builds for businesses. Replies are sent through approved channels with proper rate limits.",
    },
    {
      q: "What data does Lynk Assistant access?",
      a: "Only the comments on your posts, DMs sent to your account, and the ability to send DMs back. Lynk Assistant never reads followers' private data, your camera roll, or anything outside the conversations you opt in to automate.",
    },
    {
      q: "Can I still take over a conversation manually?",
      a: "Always. Every automation has a pause toggle, and you can jump into Instagram and reply manually any time — Lynk Assistant will defer to you and stop sending follow-ups in that thread.",
    },
    {
      q: "What does the dashboard show?",
      a: "A live feed of every automation that fired, who it replied to, and the message it sent. You can sort by automation, post, or status (sent / failed) and re-run any draft.",
    },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">FAQ</div>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Questions creators ask first.
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 rounded-3xl border border-border bg-card px-2 shadow-[var(--shadow-soft)]">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/60 px-4 last:border-b-0">
              <AccordionTrigger className="text-left font-display text-base font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-10 text-center shadow-[var(--shadow-card)] sm:p-14">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Ready in 5 minutes. Replying forever.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Create a free account, connect Instagram, and ship your first automation today.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full bg-[image:var(--gradient-primary)] px-7 text-base shadow-[var(--shadow-glow)] hover:opacity-95">
              <Link to="/signup">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
