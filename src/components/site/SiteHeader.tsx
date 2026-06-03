import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/#features", label: "Features", external: true },
  { to: "/how-it-works", label: "How it works", external: false },
  { to: "/pricing", label: "Pricing", external: false },
];

const heroNavGlass =
  "border border-white/25 bg-white/10 backdrop-blur-md";

const heroNavSolid =
  "border border-border/20 bg-white/95";

type SiteHeaderProps = {
  variant?: "default" | "hero";
};

type MobileNavProps = {
  variant: "hero" | "default";
  heroScrolled?: boolean;
};

function MobileSiteNav({ variant, heroScrolled = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const menuLinkClass =
    variant === "hero"
      ? heroScrolled
        ? "flex rounded-xl px-4 py-3 text-base font-medium text-foreground transition hover:bg-accent"
        : "flex rounded-xl px-4 py-3 text-base font-medium text-foreground transition hover:bg-neutral-100"
      : "flex rounded-xl px-4 py-3 text-base font-medium text-foreground transition hover:bg-accent";

  const triggerClass =
    variant === "hero"
      ? cn(
          "rounded-full md:hidden",
          heroScrolled
            ? "text-white hover:bg-white/20 hover:text-white"
            : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
        )
      : "rounded-full text-muted-foreground hover:text-foreground md:hidden";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={triggerClass} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-xs">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-lg">Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {nav.map((n) =>
            n.external ? (
              <a key={n.label} href={n.to} className={menuLinkClass} onClick={close}>
                {n.label}
              </a>
            ) : (
              <Link key={n.label} to={n.to} className={menuLinkClass} onClick={close}>
                {n.label}
              </Link>
            ),
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-6">
          <Button asChild variant="outline" className="h-11 w-full rounded-full">
            <Link to="/login" onClick={close}>
              Log in
            </Link>
          </Button>
          <Button
            asChild
            className="h-11 w-full rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)] hover:opacity-95"
          >
            <Link to="/signup" onClick={close}>
              Sign up <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HeroSiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-hero-section]");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinkClass = scrolled
    ? "rounded-full px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/20 hover:text-white"
    : "rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 px-4 pt-4 transition-[transform,opacity] duration-300 ease-out sm:px-6 sm:pt-5",
        pastHero && "-translate-y-full opacity-0 pointer-events-none",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:px-4 sm:py-2.5",
          scrolled ? heroNavGlass : heroNavSolid,
        )}
      >
        <Link
          to="/"
          className={cn(
            "shrink-0 rounded-full px-2 py-1 transition",
            scrolled && "text-white hover:bg-white/10 [&_.text-muted-foreground]:text-white/70",
          )}
        >
          <Logo onLight={!scrolled} />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {nav.map((n) =>
            n.external ? (
              <a key={n.label} href={n.to} className={navLinkClass}>
                {n.label}
              </a>
            ) : (
              <Link
                key={n.label}
                to={n.to}
                className={navLinkClass}
                activeProps={{ className: scrolled ? "text-white" : "text-neutral-900" }}
              >
                {n.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <MobileSiteNav variant="hero" heroScrolled={scrolled} />
          <Button
            asChild
            variant="ghost"
            className={cn(
              "hidden rounded-full md:inline-flex",
              scrolled
                ? "text-white hover:bg-white/20 hover:text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Link to="/login">Log in</Link>
          </Button>
          <Button
            asChild
            className="hidden h-10 rounded-full bg-[image:var(--gradient-primary)] px-4 text-sm shadow-[var(--shadow-glow)] hover:opacity-95 md:inline-flex sm:h-11 sm:px-5"
          >
            <Link to="/signup">
              Sign up <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  if (variant === "hero") {
    return <HeroSiteHeader />;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) =>
            n.external ? (
              <a
                key={n.label}
                href={n.to}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {n.label}
              </a>
            ) : (
              <Link
                key={n.label}
                to={n.to}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <MobileSiteNav variant="default" />
          <Button
            asChild
            variant="ghost"
            className="hidden rounded-full text-muted-foreground hover:text-foreground md:inline-flex"
          >
            <Link to="/login">Log in</Link>
          </Button>
          <Button
            asChild
            className="hidden rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)] hover:opacity-95 md:inline-flex"
          >
            <Link to="/signup">
              Sign up <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
