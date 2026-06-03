import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { AisleCatalogueResponse } from "@/integrations/aisle/types";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, RefreshCw, ShoppingBag } from "lucide-react";

const aisleAdminUrl = import.meta.env.VITE_STOREFRONT_ADMIN_URL?.trim() || "";

export function ProductCataloguePanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogue, setCatalogue] = useState<(AisleCatalogueResponse & { instagram_query: string }) | null>(
    null,
  );

  const loadCatalogue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setCatalogue(null);
        return;
      }
      const res = await fetch("/api/storefront/catalogue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as {
        ok?: boolean;
        message?: string;
        catalogue?: AisleCatalogueResponse & { instagram_query: string };
      };
      if (!res.ok || !body.ok || !body.catalogue) {
        throw new Error(body.message ?? `Could not load catalogue (${res.status})`);
      }
      setCatalogue(body.catalogue);
    } catch (e) {
      setCatalogue(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalogue();
  }, [loadCatalogue]);

  return (
    <div className="app-panel rounded-2xl border p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Product catalogue</h2>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={loading}
          onClick={() => void loadCatalogue()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        These are the products Lynk Assistant can mention when customers ask in Instagram DMs. Add or
        update items in your AISLE storefront — changes appear here after you refresh.
      </p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {catalogue && !error && (
        <div className="mt-4 rounded-xl border border-success/25 bg-success/5 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            {catalogue.store.business_name}{" "}
            <span className="font-normal text-muted-foreground">
              @{catalogue.store.instagram_handle}
            </span>
          </p>
          <p className="mt-1 text-muted-foreground">
            {catalogue.total} product{catalogue.total === 1 ? "" : "s"} ready for AI replies.
          </p>
          {catalogue.products.length > 0 && (
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm text-foreground/90">
              {catalogue.products.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{p.name}</span>
                    {p.description?.trim() && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-medium text-muted-foreground">{p.price}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!catalogue && !loading && !error && (
        <p className="mt-4 text-sm text-muted-foreground">
          No catalogue found yet. Connect Instagram under{" "}
          <Link to="/integrations" className="font-medium text-primary hover:underline">
            Integrations
          </Link>{" "}
          and use the same @handle as your AISLE store.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {aisleAdminUrl ? (
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <a href={aisleAdminUrl} target="_blank" rel="noopener noreferrer">
              Manage products in AISLE
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Currency, escalation availability, and policies are set in{" "}
          <Link to="/settings" className="font-medium text-primary hover:underline">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
