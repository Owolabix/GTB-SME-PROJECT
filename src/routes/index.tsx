import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageSquare,
  Bot,
  Sparkles,
  Hash,
  Instagram,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Layers,
} from "lucide-react";
import heroImg from "@/assets/hero-illustration.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lynk Assistant — Instagram DM automations that close sales 24/7" },
      {
        name: "description",
        content:
          "Lynk Assistant auto-replies to Instagram comments and DMs the second they happen. Set keyword triggers, design message flows, and turn followers into customers — without lifting a finger.",
      },
      { property: "og:title", content: "Lynk Assistant — Instagram DM automations that close sales 24/7" },
      { property: "og:description", content: "Turn Instagram comments and DMs into automatic conversations that convert." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <Marquee />
      <Features />
      <FlowSection />
      <Stats />
      <CTASection />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, oklch(0.95 0.08 55 / 0.7), transparent 60%), radial-gradient(50% 40% at 0% 30%, oklch(0.97 0.04 60 / 0.9), transparent 60%)",
        }}
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> New • Instagram comment + DM triggers
          </div>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Turn comments into <span className="text-primary">customers.</span><br />
            Automatically.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Lynk Assistant watches your Instagram for keywords, then slides into the DMs of every commenter
            with a reply you wrote — in seconds, day or night. No agency, no inbox chaos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full bg-[image:var(--gradient-primary)] px-6 text-base shadow-[var(--shadow-glow)] hover:opacity-95">
              <Link to="/signup">
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-border bg-card px-6 text-base">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Comment triggers", "DM keyword triggers", "Multi-step flows"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[image:var(--gradient-primary)] opacity-25 blur-3xl" />
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
            <img
              src={heroImg}
              alt="Lynk Assistant automatically replying to Instagram messages"
              width={1280}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
          <FloatingCard
            className="absolute -left-6 top-10 hidden sm:block"
            icon={<Bot className="h-4 w-4" />}
            title="DMs sent today"
            value="2,481"
            tone="primary"
          />
          <FloatingCard
            className="absolute -right-4 bottom-8 hidden sm:block"
            icon={<Zap className="h-4 w-4" />}
            title="Avg trigger speed"
            value="1.2 sec"
            tone="success"
          />
        </div>
      </div>
    </section>
  );
}

function FloatingCard({
  className = "",
  icon,
  title,
  value,
  tone,
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
  value: string;
  tone: "primary" | "success";
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur ${className}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone === "primary" ? "bg-primary-soft text-primary" : "bg-success/15 text-success"}`}>
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="font-display text-base font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Marquee() {
  const items = ["@urban_nest", "@luxe_interiors", "@studio_m", "@design_daily", "@curated_home", "@oak.studio"];
  return (
    <div className="border-y border-border/60 bg-secondary/40 py-6">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Loved by creators &amp; storefront owners
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-base font-semibold text-foreground/70">
          {items.map((i) => (
            <span key={i} className="flex items-center gap-1.5"><Instagram className="h-4 w-4 text-primary/70" /> {i}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: MessageSquare,
    title: "Comment triggers",
    desc: "When someone comments your keyword on a post or reel, Lynk Assistant DMs them instantly with the reply you set.",
  },
  {
    icon: Hash,
    title: "DM keyword triggers",
    desc: "Reply automatically when a customer DMs words like “price”, “link”, or “available?”.",
  },
  {
    icon: Layers,
    title: "Multi-step message flows",
    desc: "Send a sequence — opener, link, follow-up — with delays between messages, so it feels like a real conversation.",
  },
  {
    icon: Bot,
    title: "Per-post targeting",
    desc: "Run different automations on different posts — a launch, a giveaway, a sale — without crossover.",
  },
  {
    icon: ShieldCheck,
    title: "You stay in control",
    desc: "Pause, edit, or take over any automation in one tap. Your dashboard shows every reply Lynk Assistant sent.",
  },
  {
    icon: Zap,
    title: "Fires in seconds",
    desc: "Powered by Instagram's native webhooks, so Lynk Assistant sees the comment and replies before you even refresh.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Why Lynk Assistant</div>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Built for creators who hate babysitting their DMs.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three ingredients: a trigger, a keyword, and the message you want sent. Lynk Assistant handles
            the rest in real time.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowSection() {
  const steps = [
    { n: "01", t: "Connect Instagram", d: "One-tap OAuth links your business account. We never ask for your password." },
    { n: "02", t: "Pick a trigger", d: "Choose comment or DM, add the keywords, target a post or all posts." },
    { n: "03", t: "Write the reply", d: "Compose a message — or a sequence with delays — in your own words." },
    { n: "04", t: "Activate", d: "Flip the switch. Lynk Assistant listens for the next event and replies in seconds." },
  ];
  return (
    <section className="bg-secondary/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</div>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Live in under 5 minutes.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-3xl border border-border bg-card p-7">
              <div className="font-display text-5xl font-bold text-primary/20">{s.n}</div>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "12×", l: "More replies sent per day" },
    { v: "1.2s", l: "Median trigger-to-DM time" },
    { v: "94%", l: "Open rate on triggered DMs" },
    { v: "0", l: "Tabs you need to leave open" },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-[2rem] border border-primary/20 bg-[image:var(--gradient-primary)] p-10 text-primary-foreground shadow-[var(--shadow-glow)]">
          <div className="grid gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l}>
                <div className="font-display text-5xl font-bold">{s.v}</div>
                <div className="mt-1 text-sm text-primary-foreground/80">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="pb-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-10 text-center shadow-[var(--shadow-card)] sm:p-14">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Stop missing customers in your DMs.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Set up your first automation in minutes. Free to start, scales as you grow.
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
