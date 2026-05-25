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
import { LogOut, Mail, Loader2, Check, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Lynk Assistant — Settings" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [storeFields, setStoreFields] = useState<StoreInfoFields>(EMPTY_STORE);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storeSavedAt, setStoreSavedAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setUserId(uid);
      setEmail(userData.user?.email ?? null);
      if (!uid) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", uid)
        .maybeSingle();
      setDisplayName(profile?.full_name?.trim() ?? "");

      const info = await loadStoreInfo(uid);
      if (info) setStoreFields(info);
    })();
  }, []);

  async function saveDisplayName() {
    if (!userId) return;
    setSaveError(null);
    setSaving(true);
    const trimmed = displayName.trim();
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: trimmed.length > 0 ? trimmed : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    setSavedAt(Date.now());
  }

  function updateStore(key: keyof StoreInfoFields, value: string) {
    setStoreFields((prev) => ({ ...prev, [key]: value }));
    setStoreSavedAt(null);
    setStoreError(null);
  }

  async function handleSaveStore() {
    if (!userId) return;
    setStoreError(null);
    setStoreSaving(true);
    const result = await saveStoreInfo(userId, storeFields);
    setStoreSaving(false);
    if (!result.ok) {
      setStoreError(result.error ?? "Could not save.");
      return;
    }
    setStoreSavedAt(Date.now());
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Account details and store configuration for your Lynk Assistant
          workspace.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-base font-semibold">Profile</h2>
        <div className="mt-4 space-y-6 text-sm">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </div>
              <p className="mt-1 text-foreground">{email ?? "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Email is managed by your login provider and cannot be changed
                here.
              </p>
            </div>
          </div>

          <div className="max-w-md space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              type="text"
              autoComplete="name"
              placeholder="How we greet you in the app"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setSavedAt(null);
                setSaveError(null);
              }}
              maxLength={120}
            />
            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
            {savedAt != null && !saveError && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-success" /> Saved
              </p>
            )}
            <Button
              type="button"
              size="sm"
              disabled={saving}
              className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
              onClick={saveDisplayName}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save display name"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Store details</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          The AI assistant uses these details to answer customer DMs in your
          store's voice.
        </p>

        <div className="mt-6 max-w-lg space-y-5 text-sm">
          <div className="grid gap-2">
            <Label htmlFor="st-name">Store name</Label>
            <Input
              id="st-name"
              placeholder="e.g. Amara Fashion"
              value={storeFields.store_name}
              onChange={(e) => updateStore("store_name", e.target.value)}
              maxLength={150}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="st-handle">Instagram handle</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="st-handle"
                className="pl-7"
                placeholder="your_store"
                value={storeFields.instagram_handle}
                onChange={(e) =>
                  updateStore("instagram_handle", e.target.value)
                }
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="st-currency">Currency</Label>
              <Input
                id="st-currency"
                placeholder="e.g. NGN"
                value={storeFields.currency}
                onChange={(e) => updateStore("currency", e.target.value)}
                maxLength={10}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="st-hours">Business hours</Label>
              <Input
                id="st-hours"
                placeholder="e.g. Mon–Sat 9am–6pm"
                value={storeFields.hours}
                onChange={(e) => updateStore("hours", e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="st-address">Address</Label>
            <Input
              id="st-address"
              placeholder="e.g. 12 Broad St, Lagos"
              value={storeFields.address}
              onChange={(e) => updateStore("address", e.target.value)}
              maxLength={250}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="st-other">
              Other info{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (return policy, delivery, etc. — JSON)
              </span>
            </Label>
            <Textarea
              id="st-other"
              rows={3}
              placeholder='e.g. {"return_policy": "7-day returns", "delivery": "Lagos only"}'
              value={storeFields.other_info}
              onChange={(e) => updateStore("other_info", e.target.value)}
            />
          </div>

          {storeError && (
            <p className="text-sm text-destructive">{storeError}</p>
          )}
          {storeSavedAt != null && !storeError && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-success" /> Store details saved
            </p>
          )}
          <Button
            type="button"
            size="sm"
            disabled={storeSaving}
            className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
            onClick={handleSaveStore}
          >
            {storeSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save store details"
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
