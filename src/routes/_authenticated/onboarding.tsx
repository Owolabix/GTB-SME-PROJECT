import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type StoreInfoFields,
  EMPTY_STORE,
  loadStoreInfo,
  saveStoreInfo,
  validateStoreInfoFields,
  getConnectedInstagramHandle,
} from "@/lib/storeInfo";
import { StoreCurrencySelect } from "@/components/site/StoreCurrencySelect";
import { OwnerAvailabilityHoursField } from "@/components/site/OwnerAvailabilityHoursField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notifyStoreSetupChanged } from "@/lib/storeSetup";
import { SetupStepIndicator } from "@/components/onboarding/SetupStepIndicator";
import { ArrowRight, Instagram, Loader2, Store } from "lucide-react";

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
  const [connectedIgHandle, setConnectedIgHandle] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;

      const existing = await loadStoreInfo(uid);
      const connected = await getConnectedInstagramHandle();
      if (!connected) {
        navigate({ to: "/integrations" });
        return;
      }
      setConnectedIgHandle(connected);
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

  useEffect(() => {
    const refreshConnected = () => {
      void getConnectedInstagramHandle().then(setConnectedIgHandle);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshConnected();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  function update(key: keyof StoreInfoFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    const payload: StoreInfoFields = {
      ...fields,
      instagram_handle: connectedIgHandle ?? fields.instagram_handle,
    };

    if (!connectedIgHandle) {
      setError("Connect Instagram under Integrations before continuing.");
      return;
    }

    const validationError = validateStoreInfoFields(payload, {
      requireAll: true,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    const result = await saveStoreInfo(userId, payload);
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Could not save store info.");
      return;
    }

    notifyStoreSetupChanged();
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
    <div className="mx-auto w-full max-w-xl py-2 md:py-4">
      <SetupStepIndicator currentStep={2} />
      <div className="app-panel rounded-2xl border p-6 shadow-[var(--shadow-card)] sm:p-8">
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
          Core store details for the AI assistant. After this, add returns, delivery, and payment
          answers on the{" "}
          <Link to="/faqs" className="font-medium text-primary hover:underline">
            FAQs
          </Link>{" "}
          page — then create your first automation from{" "}
          <Link to="/automations" className="font-medium text-primary hover:underline">
            Automations
          </Link>
          .
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

          <Alert className="flex gap-3 border-success/30 bg-success/5 [&>svg]:static [&>svg]:left-auto [&>svg]:top-auto [&>svg~*]:pl-0">
            <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <AlertDescription className="leading-relaxed">
              Instagram connected as{" "}
              <span className="font-medium text-foreground">@{connectedIgHandle}</span>. Manage
              your connection under{" "}
              <Link to="/integrations" className="font-medium text-primary hover:underline">
                Integrations
              </Link>
              .
            </AlertDescription>
          </Alert>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ob-currency">
                Currency <span className="text-destructive">*</span>
              </Label>
              <StoreCurrencySelect
                id="ob-currency"
                required
                value={fields.currency}
                onChange={(v) => update("currency", v)}
              />
            </div>
            <OwnerAvailabilityHoursField
              id="ob-hours"
              required
              value={fields.hours}
              onChange={(v) => update("hours", v)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ob-address">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ob-address"
              required
              placeholder="e.g. 12 Broad St, Lagos"
              value={fields.address}
              onChange={(e) => update("address", e.target.value)}
              maxLength={250}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving || !connectedIgHandle}
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
