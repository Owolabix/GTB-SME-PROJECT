import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DmActivityRow } from "@/lib/dmActivity";
import {
  parseDmEventPayload,
  formatRecipientLabel,
  formatCustomerLabel,
  canPickUpDmEvent,
  dmActivityHeadline,
  dmActivityStatusLabel,
} from "@/lib/dmEventDisplay";
import {
  loadOwnerFollowUps,
  markOwnerFollowUpDone,
  type OwnerFollowUp,
} from "@/lib/ownerFollowUps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Workflow,
  Plug,
  MessageCircle,
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";

const ACTIVITY_PAGE_SIZE = 5;

type StatusFilter = "all" | "auto_replied" | "ai_replied" | "needs_you" | "failed";
type DateFilter = "all" | "today" | "7d" | "30d" | "specific";

function dateFilterStart(filter: DateFilter, specificDate?: Date): string | null {
  if (filter === "all") return null;
  if (filter === "specific" && specificDate) {
    const d = new Date(specificDate);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  const now = new Date();
  if (filter === "today") {
    now.setHours(0, 0, 0, 0);
  } else if (filter === "7d") {
    now.setDate(now.getDate() - 7);
  } else {
    now.setDate(now.getDate() - 30);
  }
  return now.toISOString();
}

function dateFilterEnd(filter: DateFilter, specificDate?: Date): string | null {
  if (filter !== "specific" || !specificDate) return null;
  const d = new Date(specificDate);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

type FollowUpDisplay = OwnerFollowUp & { customerLabel: string };

async function fetchInstagramHandles(
  token: string,
  opts: { payloads?: unknown[]; customerIds?: string[] },
): Promise<Record<string, string>> {
  try {
    const res = await fetch("/api/dm/resolve-handles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(opts),
    });
    const body = (await res.json()) as { ok?: boolean; handles?: Record<string, string> };
    return body.ok && body.handles ? body.handles : {};
  } catch {
    return {};
  }
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Lynk Assistant — Dashboard" }] }),
  component: DashboardHome,
});

function DashboardHome() {
  const [events, setEvents] = useState<DmActivityRow[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalCount, setActivityTotalCount] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [pickUpId, setPickUpId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [specificDate, setSpecificDate] = useState<Date | undefined>();
  const [keywordFilter, setKeywordFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [followUps, setFollowUps] = useState<FollowUpDisplay[]>([]);
  const [followUpsError, setFollowUpsError] = useState<string | null>(null);
  const [followUpsHint, setFollowUpsHint] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    automations: 0,
    integrations: 0,
    sent: 0,
    openFollowUps: 0,
  });

  const refreshFollowUps = useCallback(async () => {
    setFollowUpsError(null);
    setFollowUpsHint(null);
    try {
      const { count: igCount } = await supabase
        .from("instagram_accounts")
        .select("id", { count: "exact", head: true });

      const rows = await loadOwnerFollowUps({ openOnly: true });

      let handleByCustomerId: Record<string, string> = {};
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (token && rows.length > 0) {
        handleByCustomerId = await fetchInstagramHandles(token, {
          customerIds: rows.map((r) => r.instagram_customer_id),
        });
      }

      setFollowUps(
        rows.map((r) => ({
          ...r,
          customerLabel: formatCustomerLabel(handleByCustomerId[r.instagram_customer_id] ?? null),
        })),
      );
      setCounts((c) => ({ ...c, openFollowUps: rows.length }));

      if (rows.length === 0 && (igCount ?? 0) === 0) {
        setFollowUpsHint("Connect Instagram under Integrations so follow-ups link to your account.");
      } else if (rows.length === 0) {
        setFollowUpsHint("No open follow-ups right now.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFollowUpsError(msg);
      setFollowUps([]);
      setCounts((c) => ({ ...c, openFollowUps: 0 }));
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    setEventsError(null);
    setEventsLoading(true);

    const needsClientFilter = keywordFilter.trim() !== "" || usernameFilter.trim() !== "";
    const fetchLimit = needsClientFilter ? 200 : undefined;

    function applyServerFilters(
      q: ReturnType<ReturnType<typeof supabase.from>["select"]>,
    ) {
      let query = q;
      if (statusFilter === "auto_replied") {
        query = query.eq("status", "sent").not("error", "ilike", "%ai reply%");
      } else if (statusFilter === "ai_replied") {
        query = query.eq("status", "sent").ilike("error", "%ai reply%");
      } else if (statusFilter === "needs_you") {
        query = query.eq("status", "skipped");
      } else if (statusFilter === "failed") {
        query = query.eq("status", "failed");
      }
      const after = dateFilterStart(dateFilter, specificDate);
      if (after) query = query.gte("created_at", after);
      const before = dateFilterEnd(dateFilter, specificDate);
      if (before) query = query.lte("created_at", before);
      return query;
    }

    if (needsClientFilter) {
      let query = supabase
        .from("dm_events")
        .select("id,status,error,created_at,trigger_payload")
        .order("created_at", { ascending: false })
        .limit(fetchLimit!);
      query = applyServerFilters(query);
      const { data: raw, error } = await query;
      if (error) {
        setEventsError(error.message);
        setEvents([]);
        setEventsLoading(false);
        return;
      }

      const all = raw ?? [];
      let handleBySenderId: Record<string, string> = {};
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (token && all.length > 0) {
        handleBySenderId = await fetchInstagramHandles(token, {
          payloads: all.map((e) => e.trigger_payload),
        });
      }

      const kwLower = keywordFilter.trim().toLowerCase();
      const userLower = usernameFilter.trim().toLowerCase().replace(/^@/, "");

      const mapped = all.map((e) => {
        const parsed = parseDmEventPayload(e.trigger_payload);
        const handle =
          parsed.handle ??
          (parsed.senderId ? handleBySenderId[parsed.senderId] ?? null : null);
        return {
          id: e.id,
          status: e.status,
          error: e.error,
          created_at: e.created_at,
          recipientLabel: formatRecipientLabel(handle, parsed.senderId),
          messagePreview: parsed.messagePreview,
          canPickUp: canPickUpDmEvent(e.status, e.error, Boolean(parsed.senderId)),
        } satisfies DmActivityRow;
      });

      const filtered = mapped.filter((row) => {
        if (kwLower && !(row.messagePreview?.toLowerCase().includes(kwLower))) return false;
        if (userLower && !row.recipientLabel.toLowerCase().replace(/^@/, "").includes(userLower)) return false;
        return true;
      });

      setActivityTotalCount(filtered.length);
      const totalPages = Math.max(1, Math.ceil(filtered.length / ACTIVITY_PAGE_SIZE));
      const page = Math.min(Math.max(1, activityPage), totalPages);
      if (page !== activityPage) setActivityPage(page);
      const start = (page - 1) * ACTIVITY_PAGE_SIZE;
      setEvents(filtered.slice(start, start + ACTIVITY_PAGE_SIZE));
    } else {
      let countQuery = supabase
        .from("dm_events")
        .select("id", { count: "exact", head: true });
      countQuery = applyServerFilters(countQuery);
      const { count: totalCount } = await countQuery;

      const total = totalCount ?? 0;
      setActivityTotalCount(total);
      const totalPages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));
      const page = Math.min(Math.max(1, activityPage), totalPages);
      if (page !== activityPage) setActivityPage(page);

      const from = (page - 1) * ACTIVITY_PAGE_SIZE;
      const to = from + ACTIVITY_PAGE_SIZE - 1;

      let dataQuery = supabase
        .from("dm_events")
        .select("id,status,error,created_at,trigger_payload")
        .order("created_at", { ascending: false })
        .range(from, to);
      dataQuery = applyServerFilters(dataQuery);
      const { data: raw, error } = await dataQuery;

      if (error) {
        setEventsError(error.message);
        setEvents([]);
        setEventsLoading(false);
        return;
      }

      const slice = raw ?? [];
      let handleBySenderId: Record<string, string> = {};
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (token && slice.length > 0) {
        handleBySenderId = await fetchInstagramHandles(token, {
          payloads: slice.map((e) => e.trigger_payload),
        });
      }

      const rows = slice.map((e) => {
        const parsed = parseDmEventPayload(e.trigger_payload);
        const handle =
          parsed.handle ??
          (parsed.senderId ? handleBySenderId[parsed.senderId] ?? null : null);
        return {
          id: e.id,
          status: e.status,
          error: e.error,
          created_at: e.created_at,
          recipientLabel: formatRecipientLabel(handle, parsed.senderId),
          messagePreview: parsed.messagePreview,
          canPickUp: canPickUpDmEvent(e.status, e.error, Boolean(parsed.senderId)),
        } satisfies DmActivityRow;
      });
      setEvents(rows);
    }

    const { count: sentCount } = await supabase
      .from("dm_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent");
    setCounts((c) => ({ ...c, sent: sentCount ?? 0 }));
    setEventsLoading(false);
  }, [activityPage, statusFilter, dateFilter, specificDate, keywordFilter, usernameFilter]);

  useEffect(() => {
    void (async () => {
      const { count: autoCount } = await supabase
        .from("automations")
        .select("id", { count: "exact", head: true });
      const { count: igCount } = await supabase
        .from("instagram_accounts")
        .select("id", { count: "exact", head: true });
      setCounts((c) => ({
        ...c,
        automations: autoCount ?? 0,
        integrations: igCount ?? 0,
      }));
    })();
    void refreshFollowUps();
    void refreshEvents();
  }, [refreshFollowUps, refreshEvents]);

  async function resolveFollowUp(id: string) {
    setResolvingId(id);
    try {
      await markOwnerFollowUpDone(id);
      setFollowUps((prev) => prev.filter((f) => f.id !== id));
      setCounts((c) => ({ ...c, openFollowUps: Math.max(0, c.openFollowUps - 1) }));
    } catch (e) {
      setFollowUpsError(e instanceof Error ? e.message : String(e));
    } finally {
      setResolvingId(null);
    }
  }

  async function handlePickUp(eventId: string) {
    setPickUpId(eventId);
    setEventsError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setEventsError("Session expired. Log in again.");
      setPickUpId(null);
      return;
    }
    const res = await fetch("/api/dm/pick-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventId }),
    });
    let result: { ok: boolean; message?: string };
    try {
      result = (await res.json()) as { ok: boolean; message?: string };
    } catch {
      result = { ok: false, message: "Invalid response from server." };
    }
    setPickUpId(null);
    if (!res.ok || !result.ok) {
      setEventsError(result.message ?? `Pick up failed (${res.status})`);
      return;
    }
    await refreshEvents();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Here's what Lynk Assistant handled for you.</p>
        </div>
        <Button asChild className="rounded-full bg-[image:var(--gradient-primary)]">
          <Link to="/automations">New automation <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </header>

      <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Workflow className="h-4 w-4" />} label="Active automations" value={counts.automations} />
        <Kpi icon={<Plug className="h-4 w-4" />} label="IG accounts connected" value={counts.integrations} />
        <Kpi icon={<MessageCircle className="h-4 w-4" />} label="DMs sent (recent)" value={counts.sent} />
        <Kpi
          icon={<BellRing className="h-4 w-4" />}
          label="Needs your attention"
          value={counts.openFollowUps}
          highlight={counts.openFollowUps > 0}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Owner follow-ups</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When the AI cannot fully help, or a customer needs a human, tasks appear here (from Instagram DMs).
            </p>
          </div>
        </div>

        {followUpsError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Could not load follow-ups</AlertTitle>
            <AlertDescription>{followUpsError}</AlertDescription>
          </Alert>
        )}

        {followUpsHint && !followUpsError && (
          <p className="mt-4 text-sm text-muted-foreground">{followUpsHint}</p>
        )}

        {followUps.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {followUps.map((f) => (
              <li key={f.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 shrink-0 text-warning" />
                    <span className="font-medium">{f.summary}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {f.customerLabel} · {new Date(f.created_at).toLocaleString()}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={resolvingId === f.id}
                  onClick={() => void resolveFollowUp(f.id)}
                >
                  {resolvingId === f.id ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                  )}
                  Mark done
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          !followUpsError &&
          !followUpsHint && (
            <p className="mt-4 text-sm text-muted-foreground">No open follow-ups right now.</p>
          )
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Keyword automations and send status.</p>
          </div>
          {activityTotalCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {eventsLoading
                ? "Loading…"
                : (() => {
                    const from = (activityPage - 1) * ACTIVITY_PAGE_SIZE + 1;
                    const to = Math.min(activityPage * ACTIVITY_PAGE_SIZE, activityTotalCount);
                    return `Showing ${from}–${to} of ${activityTotalCount}`;
                  })()}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setActivityPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-auto min-w-[130px] rounded-full text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="auto_replied">Auto-replied</SelectItem>
              <SelectItem value="ai_replied">AI replied</SelectItem>
              <SelectItem value="needs_you">Needs you</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-0.5 rounded-full border border-input p-0.5">
            {(["all", "today", "7d", "30d"] as DateFilter[]).map((d) => (
              <button
                key={d}
                type="button"
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  dateFilter === d
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent",
                )}
                onClick={() => {
                  setDateFilter(d);
                  setSpecificDate(undefined);
                  setActivityPage(1);
                }}
              >
                {d === "all" ? "All time" : d === "today" ? "Today" : d === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateFilter === "specific" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 gap-1.5 rounded-full text-xs font-medium",
                  dateFilter === "specific" && "bg-primary text-primary-foreground",
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {specificDate
                  ? specificDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                  : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={specificDate}
                onSelect={(day) => {
                  setSpecificDate(day);
                  setDateFilter(day ? "specific" : "all");
                  setActivityPage(1);
                }}
                disabled={{ after: new Date() }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Keyword…"
              className="h-8 w-[130px] rounded-full pl-8 text-xs"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setKeywordFilter(keywordInput);
                  setActivityPage(1);
                }
              }}
              onBlur={() => {
                if (keywordInput !== keywordFilter) {
                  setKeywordFilter(keywordInput);
                  setActivityPage(1);
                }
              }}
            />
            {keywordFilter && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setKeywordInput("");
                  setKeywordFilter("");
                  setActivityPage(1);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
            <Input
              placeholder="username…"
              className="h-8 w-[140px] rounded-full pl-7 text-xs"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                setUsernameFilter(e.target.value);
                setActivityPage(1);
              }}
            />
            {usernameFilter && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setUsernameInput("");
                  setUsernameFilter("");
                  setActivityPage(1);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {(statusFilter !== "all" || dateFilter !== "all" || keywordFilter || usernameFilter) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs text-muted-foreground"
              onClick={() => {
                setStatusFilter("all");
                setDateFilter("all");
                setSpecificDate(undefined);
                setKeywordInput("");
                setKeywordFilter("");
                setUsernameInput("");
                setUsernameFilter("");
                setActivityPage(1);
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        {eventsError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{eventsError}</AlertDescription>
          </Alert>
        )}

        {activityTotalCount === 0 && !eventsLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No DMs yet. Once a customer comments or messages a triggered post, it'll show up here.
          </p>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-border">
              {events.map((e) => (
                <li key={e.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {dmActivityHeadline(e.status, e.error, e.recipientLabel)}
                    </div>
                    {e.messagePreview && (
                      <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
                        “{e.messagePreview}”
                      </p>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()}
                    </div>
                    {e.error && <div className="mt-1 text-xs text-destructive">{e.error}</div>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        e.status === "sent"
                          ? "bg-success/10 text-success"
                          : e.status === "skipped"
                            ? "bg-warning/15 text-warning"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {dmActivityStatusLabel(e.status, e.error)}
                    </span>
                    {e.canPickUp && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pickUpId === e.id}
                        onClick={() => void handlePickUp(e.id)}
                      >
                        {pickUpId === e.id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-4 w-4" />
                        )}
                        Pick up (AI reply)
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <ActivityPagination
              page={activityPage}
              totalCount={activityTotalCount}
              pageSize={ACTIVITY_PAGE_SIZE}
              loading={eventsLoading}
              onPageChange={setActivityPage}
            />
          </>
        )}
      </section>
    </div>
  );
}

const VISIBLE_PAGE_BUTTONS = 3;

/** At most 3 page numbers; ellipses hide the rest until arrows move the window. */
function buildActivityPageList(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= VISIBLE_PAGE_BUTTONS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let start: number;
  let end: number;

  if (current <= 2) {
    start = 1;
    end = VISIBLE_PAGE_BUTTONS;
  } else if (current >= totalPages - 1) {
    end = totalPages;
    start = totalPages - VISIBLE_PAGE_BUTTONS + 1;
  } else {
    start = current;
    end = current + VISIBLE_PAGE_BUTTONS - 1;
  }

  const items: (number | "ellipsis")[] = [];
  if (start > 1) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages) items.push("ellipsis");
  return items;
}

function ActivityPagination({
  page,
  totalCount,
  pageSize,
  loading,
  onPageChange,
}: {
  page: number;
  totalCount: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  const items = buildActivityPageList(page, totalPages);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-center gap-1"
      aria-label="Recent activity pages"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-full px-2.5"
        disabled={page <= 1 || loading}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {items.map((item, idx) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="px-1.5 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={item === page ? "default" : "outline"}
            className={cn(
              "h-8 min-w-8 rounded-full px-2",
              item === page && "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-sm",
            )}
            disabled={loading}
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-full px-2.5"
        disabled={page >= totalPages || loading}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

function Kpi({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[7.25rem] flex-col rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]",
        highlight ? "border-warning/40 bg-warning/5" : "border-border",
      )}
    >
      <div className="flex min-h-[2.75rem] items-start gap-2 text-xs font-medium uppercase leading-snug tracking-wider text-muted-foreground">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className="line-clamp-2">{label}</span>
      </div>
      <div className="mt-auto pt-3 text-3xl font-semibold tabular-nums leading-none tracking-tight">
        {value}
      </div>
    </div>
  );
}
