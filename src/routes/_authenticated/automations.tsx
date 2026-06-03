import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, Plus, Workflow, Info, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/automations")({
  head: () => ({ meta: [{ title: "Lynk Assistant — Automations" }] }),
  component: AutomationsPage,
});

type Automation = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused";
  trigger_type: "comment" | "dm";
  keywords: string[];
  post_scope: "all" | "specific";
  replyPreview: string | null;
  replyMessageId: string | null;
};

function AutomationsPage() {
  const [items, setItems] = useState<Automation[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("automations")
      .select("id,name,status,trigger_type,keywords,post_scope")
      .order("created_at", { ascending: false });

    const automations = (rows ?? []) as Omit<Automation, "replyPreview" | "replyMessageId">[];
    const ids = automations.map((a) => a.id);
    const replyByAutomation = new Map<string, { body: string; id: string }>();

    if (ids.length > 0) {
      const { data: messages } = await supabase
        .from("automation_messages")
        .select("id,automation_id,body,position")
        .in("automation_id", ids)
        .order("position", { ascending: true });
      for (const m of messages ?? []) {
        if (!replyByAutomation.has(m.automation_id)) {
          replyByAutomation.set(m.automation_id, { body: m.body, id: m.id });
        }
      }
    }

    setItems(
      automations.map((a) => {
        const reply = replyByAutomation.get(a.id);
        return {
          ...a,
          replyPreview: reply?.body ?? null,
          replyMessageId: reply?.id ?? null,
        };
      }),
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    await supabase.from("automations").delete().eq("id", id);
    void load();
  }

  async function toggle(a: Automation) {
    const next = a.status === "active" ? "paused" : "active";
    await supabase.from("automations").update({ status: next }).eq("id", a.id);
    void load();
  }

  function handleSaved() {
    setCreateOpen(false);
    setEditing(null);
    void load();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
          <p className="text-sm text-muted-foreground">Trigger-based replies for Instagram comments and DMs.</p>
        </div>
        <Button
          type="button"
          className="rounded-full bg-[image:var(--gradient-primary)]"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" /> New automation
        </Button>
      </header>

      <AutomationDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={handleSaved} />

      <AutomationDialog
        automation={editing}
        open={editing != null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSaved={handleSaved}
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How your automations work</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Rules are saved to your account and applied when Instagram messages arrive. If keywords match (or you
            leave keywords blank for “any”), your <strong>saved reply</strong> is sent as a DM. Otherwise the AI
            assistant handles the message.
          </p>
          <ul className="list-inside list-disc text-sm">
            <li>
              <strong>Active</strong> — rule is on; <strong>Paused</strong> — saved but will not fire.
            </li>
            <li>
              Keyword rules run first; unmatched DMs go to the AI assistant, which pulls your product
              catalogue from AISLE Storefront.
            </li>
            <li>Comment triggers need comment permissions on your Meta app; DM triggers need messaging permission.</li>
            <li>When a reply is sent, it appears on <strong>Home → Recent activity</strong>.</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="app-panel rounded-2xl border shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Workflow className="h-8 w-8 text-muted-foreground" />
            <h3 className="font-semibold">No automations yet</h3>
            <p className="text-sm text-muted-foreground">Create one to start auto-replying to comments and DMs.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        a.status === "active"
                          ? "bg-success/10 text-success"
                          : a.status === "paused"
                            ? "bg-warning/10 text-warning-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    Trigger: {a.trigger_type} · Keywords: {a.keywords.length ? a.keywords.join(", ") : "any"} · Scope:{" "}
                    {a.post_scope}
                  </div>
                  {a.replyPreview ? (
                    <p className="mt-2 line-clamp-2 text-xs text-foreground/80">Reply: “{a.replyPreview}”</p>
                  ) : (
                    <p className="mt-2 text-xs text-destructive">No reply saved — edit this automation to add a reply.</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void toggle(a)}>
                    {a.status === "active" ? "Pause" : "Activate"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void remove(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AutomationDialog({
  automation,
  open,
  onOpenChange,
  onSaved,
}: {
  automation?: Automation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = automation != null;
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<"comment" | "dm">("comment");
  const [keywords, setKeywords] = useState("");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (automation) {
      setName(automation.name);
      setTriggerType(automation.trigger_type);
      setKeywords(automation.keywords.join(", "));
      setReply(automation.replyPreview ?? "");
    } else {
      setName("");
      setTriggerType("comment");
      setKeywords("");
      setReply("");
    }
    setFormError(null);
  }, [open, automation]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!reply.trim()) {
      setFormError("Reply message is required.");
      return;
    }

    setSaving(true);
    const keywordList = keywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (isEdit && automation) {
      const { error: autoErr } = await supabase
        .from("automations")
        .update({
          name: name.trim() || "Untitled automation",
          trigger_type: triggerType,
          keywords: keywordList,
        })
        .eq("id", automation.id);

      if (autoErr) {
        setFormError(autoErr.message);
        setSaving(false);
        return;
      }

      if (automation.replyMessageId) {
        const { error: msgErr } = await supabase
          .from("automation_messages")
          .update({ body: reply.trim() })
          .eq("id", automation.replyMessageId);
        if (msgErr) {
          setFormError(msgErr.message);
          setSaving(false);
          return;
        }
      } else {
        const { error: msgErr } = await supabase.from("automation_messages").insert({
          automation_id: automation.id,
          body: reply.trim(),
          position: 0,
        });
        if (msgErr) {
          setFormError(msgErr.message);
          setSaving(false);
          return;
        }
      }

      setSaving(false);
      onSaved();
      return;
    }

    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }

    const { data: created, error } = await supabase
      .from("automations")
      .insert({
        user_id: u.user.id,
        name: name.trim() || "Untitled automation",
        trigger_type: triggerType,
        keywords: keywordList,
        status: "active",
        post_scope: "all",
      })
      .select()
      .single();

    if (error || !created) {
      setFormError(error?.message ?? "Could not create automation.");
      setSaving(false);
      return;
    }

    const { error: msgErr } = await supabase.from("automation_messages").insert({
      automation_id: created.id,
      body: reply.trim(),
      position: 0,
    });
    setSaving(false);
    if (msgErr) {
      setFormError(msgErr.message);
      return;
    }
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit automation" : "New automation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void save(e)} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="auto-name">Name</Label>
          <Input
            id="auto-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Welcome new comments"
          />
        </div>
        <div className="grid gap-2">
          <Label>Trigger</Label>
          <Select value={triggerType} onValueChange={(v) => setTriggerType(v as "comment" | "dm")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comment">Instagram comment</SelectItem>
              <SelectItem value="dm">Instagram DM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="auto-keywords">Keywords (comma separated, leave blank for any)</Label>
          <Input
            id="auto-keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="price, shipping, info"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="auto-reply">Reply message</Label>
          <textarea
            id="auto-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Hi! Thanks for reaching out — here's the link…"
          />
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <DialogFooter>
          <Button type="submit" disabled={saving} className="rounded-full bg-[image:var(--gradient-primary)]">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create automation"}
          </Button>
        </DialogFooter>
      </form>
      </DialogContent>
    </Dialog>
  );
}
