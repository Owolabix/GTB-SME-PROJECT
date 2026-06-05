import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_MIN_LENGTH_HINT,
  validatePassword,
} from "@/lib/passwordPolicy";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Check, KeyRound, Loader2, Pencil } from "lucide-react";

type ChangePasswordSectionProps = {
  email: string | null;
};

export function ChangePasswordSection({ email }: ChangePasswordSectionProps) {
  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSavedAt(null);
    setEditing(false);
  }

  async function handleSave() {
    setError(null);
    setSavedAt(null);

    if (!email) {
      setError("Sign in again to change your password.");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("Choose a different password from your current one.");
      return;
    }

    setSaving(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setSaving(false);
      setError("Current password is incorrect.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSavedAt(Date.now());
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEditing(false);
  }

  return (
    <div className="app-panel rounded-2xl border p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Password</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Change the password you use to sign in to Lynk Assistant.
          </p>
        </div>
        {!editing ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 rounded-full"
            onClick={() => {
              setError(null);
              setSavedAt(null);
              setEditing(true);
            }}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Change password
          </Button>
        ) : (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              disabled={saving}
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-6 max-w-md space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current password</Label>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={PASSWORD_MIN_LENGTH_HINT}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-new-password">Confirm new password</Label>
            <PasswordInput
              id="confirm-new-password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="mt-4 text-sm text-muted-foreground">
          {savedAt != null && !error && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-success" /> Password updated
            </p>
          )}
          {!savedAt && <p>Use a strong password you don&apos;t reuse on other sites.</p>}
        </div>
      )}
    </div>
  );
}
