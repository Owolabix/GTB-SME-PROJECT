import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

type FooterLink = { label: string; to?: string; href?: string };

const columns: { title: string; items: FooterLink[] }[] = [
  {
    title: "Product",
    items: [
      { label: "Pricing", to: "/pricing" },
      { label: "How it works", to: "/how-it-works" },
    ],
  },
  {
    title: "Legal",
    items: [{ label: "Privacy Policy", to: "/privacy" }],
  },
];

function FooterLinkItem({ item }: { item: FooterLink }) {
  const className = "text-foreground/80 hover:text-primary";
  if (item.to) {
    return (
      <Link to={item.to} className={className}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={item.href ?? "#"} className={className}>
      {item.label}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Lynk turns Instagram comments and DMs into automatic replies that book sales while you sleep.
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {c.title}
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {c.items.map((item) => (
                <li key={item.label}>
                  <FooterLinkItem item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Lynk. All rights reserved.</span>
          <Link to="/privacy" className="hover:text-primary">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
