import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Lynk turns Instagram comments and DMs into automatic replies that book sales while you sleep.
          </p>
        </div>
        {[
          { title: "Product", items: ["Features", "Pricing", "How it works", "Changelog"] },
          { title: "Resources", items: ["Help center", "Templates", "Best practices", "Community"] },
          { title: "Company", items: ["About", "Privacy", "Terms", "Contact"] },
        ].map((c) => (
          <div key={c.title}>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{c.title}</div>
            <ul className="mt-3 space-y-2 text-sm">
              {c.items.map((i) => (
                <li key={i}><a href="#" className="text-foreground/80 hover:text-primary">{i}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Lynk. All rights reserved.</span>
          <span>Made for creators and small storefronts.</span>
        </div>
      </div>
    </footer>
  );
}