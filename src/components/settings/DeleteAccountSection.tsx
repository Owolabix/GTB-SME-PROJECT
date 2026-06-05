import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  ACCOUNT_DELETION_DATA_CATEGORIES,
  clearLocalAccountData,
  requestAccountDeletion,
} from "@/lib/accountDeletion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

type DeleteAccountSectionProps = {
  email: string | null;
};

export function DeleteAccountSection({ email }: DeleteAccountSectionProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setConfirmEmail("");
    setPassword("");
    setError(null);
  }

  async function handleDelete() {
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("Session expired. Log in again.");
      return;
    }

    setDeleting(true);
    const result = await requestAccountDeletion({
      accessToken: token,
      confirmEmail,
      password,
    });
    setDeleting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    clearLocalAccountData();
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/" });
  }

  const emailMatches =
    email != null && confirmEmail.trim().toLowerCase() === email.trim().toLowerCase();

  return (
    <div className="app-panel rounded-2xl border border-destructive/25 p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">Delete account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Under the Nigeria Data Protection Act (NDPR) and EU GDPR, you can request erasure of
            your personal data. Deletion is permanent and cannot be undone. See our{" "}
            <Link to="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {ACCOUNT_DELETION_DATA_CATEGORIES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            We process deletion within this session. Backup systems, if any, are purged according
            to our retention schedule. Message content already delivered on Instagram remains on
            Meta&apos;s systems — disconnecting here stops Lynk from processing new data. You can
            sign up again later with the same email if you change your mind.
          </p>

          <AlertDialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) resetForm();
            }}
          >
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your Lynk account?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4 text-left text-sm text-muted-foreground">
                    <p>
                      This removes your profile, store data, Instagram connection, automations, and
                      activity history from Lynk. You will be signed out immediately. You can create
                      a new account with this email later.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="del-email">Type your email to confirm</Label>
                      <Input
                        id="del-email"
                        type="email"
                        autoComplete="email"
                        placeholder={email ?? "you@example.com"}
                        value={confirmEmail}
                        onChange={(e) => {
                          setConfirmEmail(e.target.value);
                          setError(null);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="del-password">Your password</Label>
                      <PasswordInput
                        id="del-password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleting || !emailMatches || !password.trim()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => {
                    e.preventDefault();
                    void handleDelete();
                  }}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Permanently delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
