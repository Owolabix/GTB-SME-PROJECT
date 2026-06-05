import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type StoreInfoFields,
  EMPTY_STORE,
  loadStoreInfo,
  saveStoreInfo,
  getConnectedInstagramHandle,
} from "@/lib/storeInfo";
import { StoreInstagramHandleField } from "@/components/site/StoreInstagramHandleField";
import { StoreCurrencySelect } from "@/components/site/StoreCurrencySelect";
import { OwnerAvailabilityHoursField } from "@/components/site/OwnerAvailabilityHoursField";
import { westAfricaCurrencyLabel } from "@/lib/westAfricaCurrencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, Check, Store, Pencil } from "lucide-react";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Lynk Assistant — Settings" }] }),
  component: SettingsPage,
});

function ReadOnlyValue({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-foreground">{value.trim() || "—"}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [savedDisplayName, setSavedDisplayName] = useState("");
  const [profileEditing, setProfileEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [storeFields, setStoreFields] = useState<StoreInfoFields>(EMPTY_STORE);
  const [savedStoreFields, setSavedStoreFields] = useState<StoreInfoFields>(EMPTY_STORE);
  const [storeEditing, setStoreEditing] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storeSavedAt, setStoreSavedAt] = useState<number | null>(null);
  const [connectedIgHandle, setConnectedIgHandle] = useState<string | null>(null);

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
      const name = profile?.full_name?.trim() ?? "";
      setDisplayName(name);
      setSavedDisplayName(name);

      const info = await loadStoreInfo(uid);
      const connected = await getConnectedInstagramHandle();
      setConnectedIgHandle(connected);
      const fields = info ?? EMPTY_STORE;
      if (connected) {
        fields.instagram_handle = connected;
      }
      setStoreFields(fields);
      setSavedStoreFields(fields);
    })();
  }, []);

  useEffect(() => {
    const refreshIgHandle = () => {
      void getConnectedInstagramHandle().then((connected) => {
        setConnectedIgHandle(connected);
        if (!connected) return;
        setSavedStoreFields((prev) => ({ ...prev, instagram_handle: connected }));
        if (!storeEditing) {
          setStoreFields((prev) => ({ ...prev, instagram_handle: connected }));
        }
      });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshIgHandle();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [storeEditing]);

  function cancelProfileEdit() {
    setDisplayName(savedDisplayName);
    setSaveError(null);
    setSavedAt(null);
    setProfileEditing(false);
  }

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
    setSavedDisplayName(trimmed);
    setSavedAt(Date.now());
    setProfileEditing(false);
  }

  function startStoreEdit() {
    setStoreFields(savedStoreFields);
    setStoreError(null);
    setStoreSavedAt(null);
    setStoreEditing(true);
  }

  function cancelStoreEdit() {
    setStoreFields(savedStoreFields);
    setStoreError(null);
    setStoreSavedAt(null);
    setStoreEditing(false);
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
    setSavedStoreFields(storeFields);
    setStoreSavedAt(Date.now());
    setStoreEditing(false);
  }

  const igDisplay =
    connectedIgHandle?.replace(/^@/, "") ||
    storeFields.instagram_handle?.replace(/^@/, "") ||
    "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Account details and store configuration for your Lynk Assistant workspace.
        </p>
      </header>

      <div className="app-panel rounded-2xl border p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Profile</h2>
          {!profileEditing ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setSaveError(null);
                setSavedAt(null);
                setProfileEditing(true);
              }}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full"
                disabled={saving}
                onClick={cancelProfileEdit}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
                onClick={() => void saveDisplayName()}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-6 text-sm">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <ReadOnlyValue
                label="Email"
                value={email ?? ""}
                hint="Email is managed by your login provider and cannot be changed here."
              />
            </div>
          </div>

          {profileEditing ? (
            <div className="max-w-md space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <p className="text-xs text-muted-foreground">Used in your dashboard welcome message.</p>
              <Input
                id="display-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Amara"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setSavedAt(null);
                  setSaveError(null);
                }}
                maxLength={120}
              />
              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              {savedAt != null && !saveError && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-success" /> Saved
                </p>
              )}
            </div>
          ) : (
            <ReadOnlyValue
              label="Display name"
              value={savedDisplayName}
              hint="Used in your dashboard welcome message."
            />
          )}
        </div>
      </div>

      <div className="app-panel rounded-2xl border p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Store details</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              The AI assistant uses these details to answer customer DMs in your store&apos;s voice.
            </p>
          </div>
          {!storeEditing ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 rounded-full"
              onClick={startStoreEdit}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          ) : (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full"
                disabled={storeSaving}
                onClick={cancelStoreEdit}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={storeSaving}
                className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
                onClick={() => void handleSaveStore()}
              >
                {storeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          )}
        </div>

        {storeEditing ? (
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

            <StoreInstagramHandleField
              id="st-handle"
              connectedHandle={connectedIgHandle}
              value={storeFields.instagram_handle}
              onChange={(v) => updateStore("instagram_handle", v)}
              editable
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="st-currency">Currency</Label>
                <StoreCurrencySelect
                  id="st-currency"
                  value={storeFields.currency}
                  onChange={(v) => updateStore("currency", v)}
                />
              </div>
              <OwnerAvailabilityHoursField
                id="st-hours"
                compactLabel
                value={storeFields.hours}
                onChange={(v) => updateStore("hours", v)}
              />
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
              <Label htmlFor="st-other">Additional details (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Short catch-all notes for the assistant (tone, policies in one place). For
                specific customer questions, use{" "}
                <Link to="/faqs" className="font-medium text-primary hover:underline">
                  FAQs
                </Link>{" "}
                instead.
              </p>
              <Textarea
                id="st-other"
                rows={4}
                placeholder="e.g. 7-day returns on unworn items. We deliver within Lagos only."
                value={storeFields.other_info}
                onChange={(e) => updateStore("other_info", e.target.value)}
              />
            </div>

            {storeError && <p className="text-sm text-destructive">{storeError}</p>}
            {storeSavedAt != null && !storeError && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-success" /> Store details saved
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 max-w-lg space-y-5 text-sm">
            <ReadOnlyValue label="Store name" value={savedStoreFields.store_name} />
            <ReadOnlyValue
              label="Instagram handle"
              value={igDisplay ? `@${igDisplay}` : ""}
              hint={
                connectedIgHandle
                  ? "Synced from your connected Instagram account under Integrations."
                  : undefined
              }
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ReadOnlyValue
                label="Currency"
                value={
                  savedStoreFields.currency
                    ? westAfricaCurrencyLabel(savedStoreFields.currency)
                    : ""
                }
              />
              <ReadOnlyValue
                label="Your availability for escalations"
                value={savedStoreFields.hours}
              />
            </div>
            <ReadOnlyValue label="Address" value={savedStoreFields.address} />
            <ReadOnlyValue label="Additional details" value={savedStoreFields.other_info} />
          </div>
        )}
      </div>

      <DeleteAccountSection email={email} />
    </div>
  );
}
