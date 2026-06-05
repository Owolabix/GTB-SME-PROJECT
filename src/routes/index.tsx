import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageSquare,
  Bot,
  Hash,
  Instagram,
  Play,
  Zap,
  ShieldCheck,
  Layers,
} from "lucide-react";
import heroBg from "@/assets/hero-sme-bot-partners.jpg";

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
  const featurePills = [
    { icon: Bot, label: "AI teammate" },
    { icon: MessageSquare, label: "Comment triggers" },
    { icon: Zap, label: "Replies in ~1s" },
  ];

  return (
    <section
      data-hero-section
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
    >
      <img
        src={heroBg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_0%,rgba(0,0,0,0.35)_100%)]"
        aria-hidden
      />

      <SiteHeader variant="hero" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-28 text-center sm:pt-32">
        <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          You run the business.
          <br />
          <span className="text-primary">Lynk</span> handles the DMs.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg md:text-xl">
          Your AI teammate watches Instagram for keywords, then replies to every commenter in seconds — day
          or night. Simple setup. No inbox chaos.
        </p>

        <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-2">
          <Button
            asChild
            size="lg"
            className="h-12 w-full rounded-full bg-[image:var(--gradient-primary)] px-7 text-base font-semibold shadow-[var(--shadow-glow)] hover:opacity-95"
          >
            <Link to="/signup">
              Start free <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 w-full rounded-full border-white/25 bg-white/10 px-7 text-base text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
          >
            <Link to="/how-it-works">
              <Play className="mr-2 h-4 w-4 fill-current" />
              See how it works
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {featurePills.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3.5 py-2 text-xs font-medium text-white/90 backdrop-blur-md sm:text-sm"
            >
              <Icon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <a
        href="#features"
        className="relative z-10 mx-auto mb-8 flex h-9 w-5 items-start justify-center rounded-full border-2 border-white/50 pt-1.5 transition hover:border-white"
        aria-label="Scroll to features"
      >
        <span className="h-1.5 w-1 rounded-full bg-white/80" />
      </a>
    </section>
  );
}

function Marquee() {
  const items = ["@urban_nest", "@luxe_interiors", "@studio_m", "@design_daily", "@curated_home", "@oak.studio"];
  return (
    <div
      data-landing-marquee
      className="border-y border-border/60 bg-secondary/40 py-6"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Loved by creators &amp; storefront owners
        </div>
        <ul className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-x-6 gap-y-4 sm:max-w-none sm:grid-cols-3 sm:gap-x-6 md:flex md:flex-row md:flex-wrap md:justify-center md:gap-x-10 md:gap-y-3">
          {items.map((i) => (
            <li
              key={i}
              className="flex min-w-0 items-center justify-start gap-1.5 text-sm font-semibold text-foreground/70 md:text-base"
            >
              <Instagram className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
              <span className="truncate">{i}</span>
            </li>
          ))}
        </ul>
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
              <div key={s.l} className="text-center">
                <div className="font-display text-5xl font-bold">{s.v}</div>
                <div className="mx-auto mt-1 max-w-[11rem] text-sm text-primary-foreground/80">{s.l}</div>
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
          <div className="mx-auto mt-7 grid w-full max-w-md grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-2">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-[image:var(--gradient-primary)] px-7 text-base shadow-[var(--shadow-glow)] hover:opacity-95"
            >
              <Link to="/signup">
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-full px-7 text-base">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
