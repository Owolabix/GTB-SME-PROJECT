import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type StoreInfoFields,
  EMPTY_STORE,
  loadStoreInfo,
  saveStoreInfo,
} from "@/lib/storeInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your store — Lynk Assistant" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [fields, setFields] = useState<StoreInfoFields>(EMPTY_STORE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;

      const existing = await loadStoreInfo(uid);
      if (existing) {
        if (existing.store_name) {
          navigate({ to: "/dashboard" });
          return;
        }
        setFields(existing);
      }
      setLoaded(true);
    })();
  }, [navigate]);

  function update(key: keyof StoreInfoFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    if (!fields.store_name.trim()) {
      setError("Store name is required.");
      return;
    }

    setError(null);
    setSaving(true);
    const result = await saveStoreInfo(userId, fields);
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Could not save store info.");
      return;
    }

    navigate({ to: "/dashboard" });
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 text-sm font-medium text-primary">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
            <Store className="h-4 w-4" />
          </span>
          Welcome to Lynk
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Tell us about your store
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This helps the AI assistant reply to your customers in your store's
          voice. You can update these details any time in Settings.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="ob-store-name">
              Store name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ob-store-name"
              required
              placeholder="e.g. Amara Fashion"
              value={fields.store_name}
              onChange={(e) => update("store_name", e.target.value)}
              maxLength={150}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ob-handle">Instagram handle</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="ob-handle"
                className="pl-7"
                placeholder="your_store"
                value={fields.instagram_handle}
                onChange={(e) => update("instagram_handle", e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ob-currency">Currency</Label>
              <Input
                id="ob-currency"
                placeholder="e.g. NGN"
                value={fields.currency}
                onChange={(e) => update("currency", e.target.value)}
                maxLength={10}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ob-hours">Business hours</Label>
              <Input
                id="ob-hours"
                placeholder="e.g. Mon–Sat 9am–6pm"
                value={fields.hours}
                onChange={(e) => update("hours", e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ob-address">Address</Label>
            <Input
              id="ob-address"
              placeholder="e.g. 12 Broad St, Lagos"
              value={fields.address}
              onChange={(e) => update("address", e.target.value)}
              maxLength={250}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ob-other">
              Other info{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (return policy, delivery notes, etc. — JSON)
              </span>
            </Label>
            <Textarea
              id="ob-other"
              rows={3}
              placeholder={'e.g. {"return_policy": "7-day returns", "delivery": "Lagos only"}'}
              value={fields.other_info}
              onChange={(e) => update("other_info", e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-muted-foreground"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
