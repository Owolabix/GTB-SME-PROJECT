import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, Plus, Workflow, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
};

function AutomationsPage() {
  const [items, setItems] = useState<Automation[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("automations")
      .select("id,name,status,trigger_type,keywords,post_scope")
      .order("created_at", { ascending: false });

    const automations = (rows ?? []) as Omit<Automation, "replyPreview">[];
    const ids = automations.map((a) => a.id);
    const replyByAutomation = new Map<string, string>();

    if (ids.length > 0) {
      const { data: messages } = await supabase
        .from("automation_messages")
        .select("automation_id,body,position")
        .in("automation_id", ids)
        .order("position", { ascending: true });
      for (const m of messages ?? []) {
        if (!replyByAutomation.has(m.automation_id)) {
          replyByAutomation.set(m.automation_id, m.body);
        }
      }
    }

    setItems(
      automations.map((a) => ({
        ...a,
        replyPreview: replyByAutomation.get(a.id) ?? null,
      })),
    );
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    await supabase.from("automations").delete().eq("id", id);
    load();
  }

  async function toggle(a: Automation) {
    const next = a.status === "active" ? "paused" : "active";
    await supabase.from("automations").update({ status: next }).eq("id", a.id);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
          <p className="text-sm text-muted-foreground">Trigger-based replies for Instagram comments and DMs.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-[image:var(--gradient-primary)]"><Plus className="mr-1 h-4 w-4" /> New automation</Button>
          </DialogTrigger>
          <NewAutomationDialog onCreated={() => { setOpen(false); load(); }} />
        </Dialog>
      </header>

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
            <li>Keyword rules run first; unmatched DMs go to the AI assistant (catalogue from your store data).</li>
            <li>Comment triggers need comment permissions on your Meta app; DM triggers need messaging permission.</li>
            <li>When a reply is sent, it appears on <strong>Home → Recent activity</strong>.</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
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
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      a.status === "active" ? "bg-success/10 text-success" :
                      a.status === "paused" ? "bg-warning/10 text-warning-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>{a.status}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    Trigger: {a.trigger_type} · Keywords: {a.keywords.length ? a.keywords.join(", ") : "any"} · Scope: {a.post_scope}
                  </div>
                  {a.replyPreview ? (
                    <p className="mt-2 line-clamp-2 text-xs text-foreground/80">Reply: “{a.replyPreview}”</p>
                  ) : (
                    <p className="mt-2 text-xs text-destructive">No reply saved — add a new automation with a reply message.</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggle(a)}>
                    {a.status === "active" ? "Pause" : "Activate"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
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

function NewAutomationDialog({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<"comment" | "dm">("comment");
  const [keywords, setKeywords] = useState("");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!reply.trim()) {
      setFormError("Reply message is required.");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }
    const { data: a, error } = await supabase
      .from("automations")
      .insert({
        user_id: u.user.id,
        name: name || "Untitled automation",
        trigger_type: triggerType,
        keywords: keywords.split(",").map((s) => s.trim()).filter(Boolean),
        status: "active",
        post_scope: "all",
      })
      .select()
      .single();
    if (error || !a) {
      setFormError(error?.message ?? "Could not create automation.");
      setSaving(false);
      return;
    }
    const { error: msgErr } = await supabase.from("automation_messages").insert({
      automation_id: a.id,
      body: reply.trim(),
      position: 0,
    });
    setSaving(false);
    if (msgErr) {
      setFormError(msgErr.message);
      return;
    }
    onCreated();
    setName(""); setKeywords(""); setReply("");
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New automation</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="n">Name</Label>
          <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Welcome new comments" />
        </div>
        <div className="grid gap-2">
          <Label>Trigger</Label>
          <Select value={triggerType} onValueChange={(v) => setTriggerType(v as "comment" | "dm")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comment">Instagram comment</SelectItem>
              <SelectItem value="dm">Instagram DM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="k">Keywords (comma separated, leave blank for any)</Label>
          <Input id="k" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="price, shipping, info" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="r">Reply message</Label>
          <textarea
            id="r"
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
            {saving ? "Saving…" : "Create automation"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}