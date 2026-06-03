import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/#features", label: "Features", external: true },
  { to: "/how-it-works", label: "How it works", external: false },
  { to: "/pricing", label: "Pricing", external: false },
];

const pill =
  "rounded-full bg-white/95 px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-3 sm:py-2";

type SiteHeaderProps = {
  variant?: "default" | "hero";
};

export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  if (variant === "hero") {
    return (
      <header className="absolute inset-x-0 top-0 z-50 px-4 pt-5 sm:px-6 sm:pt-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link to="/" className={cn(pill, "shrink-0")}>
            <Logo onLight />
          </Link>

          <nav className={cn(pill, "hidden items-center gap-0.5 md:flex")}>
            {nav.map((n) =>
              n.external ? (
                <a
                  key={n.label}
                  href={n.to}
                  className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
                >
                  {n.label}
                </a>
              ) : (
                <Link
                  key={n.label}
                  to={n.to}
                  className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
                  activeProps={{ className: "text-neutral-900" }}
                >
                  {n.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden rounded-full text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link to="/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-full bg-[image:var(--gradient-primary)] px-4 text-sm shadow-[var(--shadow-glow)] hover:opacity-95 sm:h-11 sm:px-5"
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
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground">
            <Link to="/login">Log in</Link>
          </Button>
          <Button
            asChild
            className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)] hover:opacity-95"
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
