import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  createMerchantFaq,
  deleteMerchantFaq,
  loadMerchantFaqs,
  updateMerchantFaq,
  type MerchantFaq,
} from "@/lib/faqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HelpCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/faqs")({
  head: () => ({ meta: [{ title: "Lynk Assistant — FAQs" }] }),
  component: FaqsPage,
});

type FaqForm = { question: string; answer: string; category: string };

const emptyForm: FaqForm = { question: "", answer: "", category: "" };

function FaqsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<MerchantFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MerchantFaq | null>(null);
  const [form, setForm] = useState<FaqForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MerchantFaq | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await loadMerchantFaqs(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(faq: MerchantFaq) {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    const payload = {
      question: form.question,
      answer: form.answer,
      category: form.category,
    };
    const result = editing
      ? await updateMerchantFaq(userId, editing.id, payload)
      : await createMerchantFaq(userId, payload);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save FAQ.");
      return;
    }
    setDialogOpen(false);
    await load();
  }

  async function confirmDelete() {
    if (!userId || !deleteTarget) return;
    setDeleting(true);
    setError(null);
    const result = await deleteMerchantFaq(userId, deleteTarget.id);
    setDeleting(false);
    if (!result.ok) {
      setError(result.error ?? "Could not delete FAQ.");
      return;
    }
    setDeleteTarget(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
          <p className="text-sm text-muted-foreground">
            Answers the AI assistant can use when customers ask common questions in Instagram DMs.
            Product details still come from your AISLE catalogue.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]"
          onClick={openCreate}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add FAQ
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="app-panel rounded-2xl border p-6 shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <HelpCircle className="mx-auto mb-3 h-8 w-8 text-primary/60" />
            <p className="font-medium text-foreground">No FAQs yet</p>
            <p className="mt-1">Add returns, delivery, payment, and hours questions your customers ask often.</p>
            <Button type="button" className="mt-4 rounded-full" variant="outline" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              Add your first FAQ
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((faq) => (
              <li key={faq.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{faq.question}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{faq.answer}</p>
                  {faq.category?.trim() && (
                    <p className="mt-2 text-xs text-muted-foreground">Category: {faq.category}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => openEdit(faq)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(faq)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="faq-q">Customer question</Label>
              <Input
                id="faq-q"
                placeholder="e.g. Do you deliver outside Lagos?"
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                maxLength={300}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faq-a">Your answer</Label>
              <Textarea
                id="faq-a"
                rows={4}
                placeholder="e.g. We deliver within Lagos only. Pickup is available at our store."
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faq-cat">Category (optional)</Label>
              <Input
                id="faq-cat"
                placeholder="e.g. Delivery"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                maxLength={80}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              className="rounded-full bg-[image:var(--gradient-primary)]"
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Update" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              {deleteTarget && (
                <>
                  <span className="block">
                    The AI assistant will no longer use this answer for customer questions.
                  </span>
                  <span className="block font-medium text-foreground">&ldquo;{deleteTarget.question}&rdquo;</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete FAQ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
