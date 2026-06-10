import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { DmActivityRow } from "@/lib/dmActivity";
import {
  parseDmEventPayload,
  formatRecipientLabel,
  formatCustomerLabel,
  canPickUpDmEvent,
  dmActivityHeadline,
  dmActivityStatusLabel,
  dmFailureReason,
} from "@/lib/dmEventDisplay";
import { normalizeInstagramUsername } from "@/lib/instagramLinks";
import {
  loadOwnerFollowUps,
  markOwnerFollowUpDone,
  type OwnerFollowUp,
} from "@/lib/ownerFollowUps";
import { useDashboardRealtime } from "@/hooks/use-dashboard-realtime";
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
import { OpenInInstagramButton } from "@/components/dashboard/OpenInInstagramButton";
import { ActivationChecklist } from "@/components/dashboard/ActivationChecklist";
import { AiAssistantStatusBanner } from "@/components/dashboard/AiAssistantStatusBanner";
import { useActivationChecklist } from "@/hooks/use-activation-checklist";
import { useStoreSetupComplete } from "@/hooks/use-store-setup-complete";
import { useLynkSystemStatus } from "@/hooks/use-lynk-system-status";
import {
  BarChart3,
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
const FOLLOW_UP_PAGE_SIZE = 5;

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

type FollowUpDisplay = OwnerFollowUp & { customerLabel: string; customerUsername: string | null };

function mapDmEventRow(
  e: {
    id: string;
    status: string;
    error: string | null;
    created_at: string;
    trigger_payload: unknown;
  },
  handleBySenderId: Record<string, string>,
): DmActivityRow {
  const parsed = parseDmEventPayload(e.trigger_payload);
  const handle =
    parsed.handle ?? (parsed.senderId ? handleBySenderId[parsed.senderId] ?? null : null);
  return {
    id: e.id,
    status: e.status,
    error: e.error,
    created_at: e.created_at,
    recipientLabel: formatRecipientLabel(handle, parsed.senderId),
    instagramUsername: normalizeInstagramUsername(handle),
    messagePreview: parsed.messagePreview,
    canPickUp: canPickUpDmEvent(e.status, e.error, Boolean(parsed.senderId)),
  };
}

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

const dashboardSearchSchema = z.object({
  focus: z.enum(["follow-ups", "activity"]).optional(),
  status: z.enum(["all", "auto_replied", "ai_replied", "needs_you", "failed"]).optional(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (raw) =>
    dashboardSearchSchema.parse(typeof raw === "object" && raw !== null ? raw : {}),
  head: () => ({ meta: [{ title: "Lynk Assistant — Dashboard" }] }),
  component: DashboardHome,
});

function DashboardHome() {
  const { focus, status: statusFromUrl } = Route.useSearch();
  const scrolledRef = useRef<string | null>(null);
  const [events, setEvents] = useState<DmActivityRow[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalCount, setActivityTotalCount] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [pickUpId, setPickUpId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(statusFromUrl ?? "all");
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
  const [followUpPage, setFollowUpPage] = useState(1);
  const [followUpsExpanded, setFollowUpsExpanded] = useState(false);
  const [openFollowUpCount, setOpenFollowUpCount] = useState(0);
  const [displayName, setDisplayName] = useState("");

  const {
    state: activationState,
    prefs: activationPrefs,
    visible: showActivationChecklist,
    refresh: refreshActivation,
    dismiss: dismissActivationChecklist,
    skipTestStep: skipActivationTestStep,
  } = useActivationChecklist();

  const { storeSetupComplete } = useStoreSetupComplete();

  const {
    loading: systemStatusLoading,
    monitorsAiAssistant,
    aiAssistantOffline,
    refresh: refreshSystemStatus,
  } = useLynkSystemStatus();

  useEffect(() => {
    if (statusFromUrl) setStatusFilter(statusFromUrl);
  }, [statusFromUrl]);

  useEffect(() => {
    if (!focus) return;
    const key = `${focus}:${statusFromUrl ?? ""}`;
    if (scrolledRef.current === key) return;
    scrolledRef.current = key;

    if (focus === "follow-ups") setFollowUpsExpanded(true);

    const targetId = focus === "follow-ups" ? "owner-follow-ups" : "dm-activity";
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [focus, statusFromUrl]);

  const followUpTotalCount = followUps.length;
  const followUpPageItems = followUps.slice(
    (followUpPage - 1) * FOLLOW_UP_PAGE_SIZE,
    followUpPage * FOLLOW_UP_PAGE_SIZE,
  );
  const visibleFollowUpItems = followUpsExpanded ? followUps : followUpPageItems;

  useEffect(() => {
    if (followUpsExpanded) return;
    const totalPages = Math.max(1, Math.ceil(followUpTotalCount / FOLLOW_UP_PAGE_SIZE));
    if (followUpPage > totalPages) setFollowUpPage(totalPages);
  }, [followUpTotalCount, followUpPage, followUpsExpanded]);

  useEffect(() => {
    if (openFollowUpCount === 0) setFollowUpsExpanded(false);
  }, [openFollowUpCount]);

  function scrollToFollowUps() {
    document.getElementById("owner-follow-ups")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openAllFollowUps() {
    setFollowUpsExpanded(true);
    window.setTimeout(scrollToFollowUps, 50);
  }

  function collapseFollowUps() {
    setFollowUpsExpanded(false);
    setFollowUpPage(1);
  }

  useEffect(() => {
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userData.user.id)
        .maybeSingle();
      setDisplayName(profile?.full_name?.trim() ?? "");
    })();
  }, []);

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
        rows.map((r) => {
          const rawHandle = handleByCustomerId[r.instagram_customer_id] ?? null;
          return {
            ...r,
            customerLabel: formatCustomerLabel(rawHandle),
            customerUsername: normalizeInstagramUsername(rawHandle),
          };
        }),
      );
      setOpenFollowUpCount(rows.length);

      if (rows.length === 0 && (igCount ?? 0) === 0) {
        setFollowUpsHint("Connect Instagram under Integrations so follow-ups link to your account.");
      } else if (rows.length === 0) {
        setFollowUpsHint("No open follow-ups right now.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFollowUpsError(msg);
      setFollowUps([]);
      setOpenFollowUpCount(0);
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

      const mapped = all.map((e) => mapDmEventRow(e, handleBySenderId));

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

      const rows = slice.map((e) => mapDmEventRow(e, handleBySenderId));
      setEvents(rows);
    }

    setEventsLoading(false);
  }, [activityPage, statusFilter, dateFilter, specificDate, keywordFilter, usernameFilter]);

  const refreshActivity = useCallback(async () => {
    await refreshEvents();
    void refreshActivation();
  }, [refreshEvents, refreshActivation]);

  const { live: dashboardLive } = useDashboardRealtime({
    onRefreshActivity: refreshActivity,
    onRefreshFollowUps: refreshFollowUps,
  });

  useEffect(() => {
    void refreshFollowUps();
    void refreshEvents();
    void refreshActivation();
  }, [refreshFollowUps, refreshEvents, refreshActivation]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshFollowUps();
        void refreshEvents();
        void refreshActivation();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshFollowUps, refreshEvents, refreshActivation]);

  async function resolveFollowUp(id: string) {
    setResolvingId(id);
    try {
      await markOwnerFollowUpDone(id);
      setFollowUps((prev) => prev.filter((f) => f.id !== id));
      setOpenFollowUpCount((n) => Math.max(0, n - 1));
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
    await refreshActivity();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back{displayName ? `, ${displayName.split(/\s+/)[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's what Lynk Assistant handled for you.
            {dashboardLive && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" aria-hidden />
                Live
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {openFollowUpCount > 0 && (
            <Button
              type="button"
              variant="outline"
              className="relative h-10 rounded-full px-3"
              onClick={openAllFollowUps}
              aria-label={`View all ${openFollowUpCount} open follow-up${openFollowUpCount === 1 ? "" : "s"}`}
            >
              <BellRing className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Follow-ups</span>
              <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-warning-foreground sm:ml-2">
                {openFollowUpCount > 99 ? "99+" : openFollowUpCount}
              </span>
            </Button>
          )}
          <Button asChild variant="outline" className="h-10 rounded-full">
            <Link to="/analytics">
              <BarChart3 className="mr-1 h-4 w-4" /> Analytics
            </Link>
          </Button>
        </div>
      </header>

      {monitorsAiAssistant && (
        <AiAssistantStatusBanner
          loading={systemStatusLoading}
          showOffline={aiAssistantOffline}
          onRefresh={() => void refreshSystemStatus()}
        />
      )}

      {storeSetupComplete && showActivationChecklist && (
        <ActivationChecklist
          state={activationState}
          testStepSkipped={activationPrefs.testStepSkipped}
          onDismiss={dismissActivationChecklist}
          onSkipTestStep={skipActivationTestStep}
        />
      )}

      <section id="owner-follow-ups" className="app-panel scroll-mt-6 rounded-2xl border p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Owner follow-ups</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When the AI cannot fully help, or a customer needs a human, tasks appear here (from Instagram DMs).
              {openFollowUpCount > 0 && (
                <span className="ml-1 font-medium text-warning">{openFollowUpCount} open</span>
              )}
            </p>
          </div>
          {followUpTotalCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {followUpsExpanded
                  ? `Showing all ${followUpTotalCount}`
                  : (() => {
                      const from = (followUpPage - 1) * FOLLOW_UP_PAGE_SIZE + 1;
                      const to = Math.min(followUpPage * FOLLOW_UP_PAGE_SIZE, followUpTotalCount);
                      return `Showing ${from}–${to} of ${followUpTotalCount}`;
                    })()}
              </p>
              {!followUpsExpanded && followUpTotalCount > FOLLOW_UP_PAGE_SIZE && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setFollowUpsExpanded(true)}
                >
                  View all
                </Button>
              )}
              {followUpsExpanded && followUpTotalCount > FOLLOW_UP_PAGE_SIZE && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={collapseFollowUps}
                >
                  Show less
                </Button>
              )}
            </div>
          )}
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

        {visibleFollowUpItems.length > 0 ? (
          <>
          <ul className="mt-4 divide-y divide-border">
            {visibleFollowUpItems.map((f) => (
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
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <OpenInInstagramButton username={f.customerUsername} />
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
                </div>
              </li>
            ))}
          </ul>
          {!followUpsExpanded && (
            <ListPagination
              page={followUpPage}
              totalCount={followUpTotalCount}
              pageSize={FOLLOW_UP_PAGE_SIZE}
              ariaLabel="Owner follow-up pages"
              onPageChange={setFollowUpPage}
            />
          )}
          </>
        ) : (
          !followUpsError &&
          !followUpsHint && (
            <p className="mt-4 text-sm text-muted-foreground">No open follow-ups right now.</p>
          )
        )}
      </section>

      <section id="dm-activity" className="app-panel scroll-mt-6 rounded-2xl border p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer messages, replies, and status — open a thread in Instagram when a handle is known.
            </p>
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

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setActivityPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full shrink-0 rounded-full text-xs sm:w-[140px]">
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

          <div className="flex w-full shrink-0 items-center gap-0.5 rounded-full border border-input p-0.5 sm:w-auto">
            {(["all", "today", "7d", "30d"] as DateFilter[]).map((d) => (
              <button
                key={d}
                type="button"
                className={cn(
                  "flex-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:flex-none sm:px-3",
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

          <div className="grid grid-cols-2 gap-2 sm:contents">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter === "specific" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 w-full shrink-0 gap-1.5 rounded-full text-xs font-medium sm:w-auto",
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

            <div className="relative min-w-0 sm:w-[130px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Keyword…"
                className="h-9 w-full rounded-full pl-8 pr-8 text-xs"
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

            <div className="relative col-span-2 min-w-0 sm:col-span-1 sm:w-[140px]">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                @
              </span>
              <Input
                placeholder="username…"
                className="h-9 w-full rounded-full pl-7 pr-8 text-xs"
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
                className="col-span-2 h-9 shrink-0 rounded-full text-xs text-muted-foreground sm:col-span-1"
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
                      <div className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Customer message
                        </p>
                        <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words line-clamp-4">
                          {e.messagePreview}
                        </p>
                      </div>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground">
                      {e.recipientLabel} · {new Date(e.created_at).toLocaleString()}
                    </div>
                    {e.error && e.status === "failed" && (
                      <div className="mt-1 text-xs text-destructive">
                        {dmFailureReason(e.error) ?? e.error}
                      </div>
                    )}
                    {e.error && e.status === "skipped" && (
                      <div className="mt-1 text-xs text-muted-foreground">{e.error}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        e.status === "sent"
                          ? "bg-success/10 text-success"
                          : e.status === "skipped"
                            ? "bg-warning/15 text-warning"
                            : e.status === "failed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {dmActivityStatusLabel(e.status, e.error)}
                    </span>
                    <OpenInInstagramButton username={e.instagramUsername} />
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
            <ListPagination
              page={activityPage}
              totalCount={activityTotalCount}
              pageSize={ACTIVITY_PAGE_SIZE}
              loading={eventsLoading}
              ariaLabel="Recent activity pages"
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

function ListPagination({
  page,
  totalCount,
  pageSize,
  loading = false,
  ariaLabel,
  onPageChange,
}: {
  page: number;
  totalCount: number;
  pageSize: number;
  loading?: boolean;
  ariaLabel: string;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  const items = buildActivityPageList(page, totalPages);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-center gap-1"
      aria-label={ariaLabel}
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
