import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const nav = [
  { to: "/#features", label: "Features", external: true },
  { to: "/how-it-works", label: "How it works", external: false },
  { to: "/pricing", label: "Pricing", external: false },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center"><Logo /></Link>
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
            )
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)] hover:opacity-95">
            <Link to="/signup">Sign up <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </header>
  );
}