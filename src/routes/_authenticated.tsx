import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClientSession, isBrowserAuthContext } from "@/lib/authSession";
import { metaOAuthParamsFromLocationSearch } from "@/lib/metaOAuthResume";
import {
  isInstagramConnectedForUser,
  isOnboardingSetupPath,
  isStoreSetupCompleteForUser,
  SETUP_ENTRY_PATH,
} from "@/lib/storeSetup";
import { useStoreSetupComplete } from "@/hooks/use-store-setup-complete";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BarChart3,
  Workflow,
  Plug,
  ShoppingBag,
  Settings as SettingsIcon,
  HelpCircle,
  Store,
  LogOut,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (!isBrowserAuthContext()) return;

    const session = await getClientSession();
    if (!session?.user) {
      const meta = metaOAuthParamsFromLocationSearch(location.searchStr ?? "");
      if (location.pathname === "/integrations" && meta) {
        throw redirect({
          to: "/login",
          search: { oauth: "meta", code: meta.code, state: meta.state },
        });
      }
      throw redirect({ to: "/login" });
    }

    const setupComplete = await isStoreSetupCompleteForUser(session.user.id);
    const onSetupPath = isOnboardingSetupPath(location.pathname);

    if (!setupComplete && !onSetupPath) {
      throw redirect({ to: SETUP_ENTRY_PATH });
    }

    if (!setupComplete && location.pathname === "/onboarding") {
      const igConnected = await isInstagramConnectedForUser(session.user.id);
      if (!igConnected) {
        throw redirect({ to: SETUP_ENTRY_PATH });
      }
    }

    if (setupComplete && location.pathname === "/onboarding") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AuthLayout,
});

const fullNav = [
  { to: "/dashboard" as const, label: "Home", icon: LayoutDashboard },
  { to: "/analytics" as const, label: "Analytics", icon: BarChart3 },
  { to: "/automations" as const, label: "Automations", icon: Workflow },
  { to: "/faqs" as const, label: "FAQs", icon: HelpCircle },
  { to: "/integrations" as const, label: "Integrations", icon: Plug },
  { to: "/products" as const, label: "Products", icon: ShoppingBag },
  { to: "/settings" as const, label: "Settings", icon: SettingsIcon },
];

const setupNav = [
  { to: "/integrations" as const, label: "Integrations", icon: Plug },
  { to: "/onboarding" as const, label: "Store setup", icon: Store },
];

function AuthLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { storeSetupComplete, setupLoading } = useStoreSetupComplete();

  useEffect(() => {
    void (async () => {
      const session = await getClientSession();
      if (!session?.user) {
        navigate({ to: "/login" });
        return;
      }
      setEmail(session.user.email ?? null);
    })();
  }, [navigate]);

  /**
   * Restricted nav during onboarding only. On other routes, beforeLoad already
   * requires setup complete — so we can show full nav while the hook loads.
   */
  const onSetupOnlyRoute = isOnboardingSetupPath(location.pathname);
  const showFullNav =
    storeSetupComplete || (setupLoading && !onSetupOnlyRoute);
  const nav = showFullNav ? fullNav : setupNav;
  const homeTo = showFullNav ? "/dashboard" : SETUP_ENTRY_PATH;

  async function signOut() {
    setMobileNavOpen(false);
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-primary/10 bg-card/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link to={homeTo} onClick={closeMobileNav} className="min-w-0 shrink">
          <Logo />
        </Link>
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[min(100%,20rem)] flex-col gap-0 p-4 pt-12">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="px-2 pb-4">
              <Logo />
            </div>
            <nav className="flex-1 space-y-1">
              {nav.map((n) => {
                const active = location.pathname.startsWith(n.to);
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={closeMobileNav}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-primary-soft text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 rounded-xl border border-primary/15 bg-primary-soft/35 p-3 text-xs">
              <div className="font-medium text-foreground truncate">{email ?? "Loading…"}</div>
              <div className="text-muted-foreground">GTCO SME customer</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="mt-2 w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="app-sidebar sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-2xl border p-4 md:flex">
          <div className="px-2 pb-4">
            <Link to={homeTo}>
              <Logo />
            </Link>
          </div>
          <nav className="flex-1 space-y-1">
            {nav.map((n) => {
              const active = location.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 rounded-xl border border-primary/15 bg-primary-soft/35 p-3 text-xs">
            <div className="font-medium text-foreground truncate">{email ?? "Loading…"}</div>
            <div className="text-muted-foreground">GTCO SME customer</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="mt-2 w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}