export type AutomationRow = {
  id: string;
  user_id: string;
  trigger_type: "comment" | "dm";
  keywords: string[];
  post_scope: "all" | "specific";
  status: "draft" | "active" | "paused";
};

export type AutomationMessageRow = {
  automation_id: string;
  body: string;
  position: number;
};

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

export function textMatchesKeywords(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const hay = normalizeText(text);
  return keywords.some((k) => hay.includes(normalizeText(k)));
}

export function postMatchesScope(
  postScope: "all" | "specific",
  allowedPostIds: Set<string> | undefined,
  igMediaId: string | undefined,
): boolean {
  if (postScope === "all") return true;
  if (!igMediaId || !allowedPostIds?.size) return false;
  return allowedPostIds.has(igMediaId);
}

export function pickMatchingAutomation(
  automations: AutomationRow[],
  messages: AutomationMessageRow[],
  opts: {
    triggerType: "comment" | "dm";
    text: string;
    igMediaId?: string;
    postsByAutomation: Map<string, Set<string>>;
  },
): { automation: AutomationRow; replyBody: string } | null {
  const active = automations.filter((a) => a.status === "active" && a.trigger_type === opts.triggerType);
  const messagesByAutomation = new Map<string, AutomationMessageRow[]>();
  for (const m of messages) {
    const list = messagesByAutomation.get(m.automation_id) ?? [];
    list.push(m);
    messagesByAutomation.set(m.automation_id, list);
  }

  for (const automation of active) {
    if (!textMatchesKeywords(opts.text, automation.keywords ?? [])) continue;
    if (
      !postMatchesScope(
        automation.post_scope,
        opts.postsByAutomation.get(automation.id),
        opts.igMediaId,
      )
    ) {
      continue;
    }

    const msgs = (messagesByAutomation.get(automation.id) ?? []).sort((a, b) => a.position - b.position);
    const first = msgs[0];
    if (!first?.body?.trim()) continue;

    return { automation, replyBody: first.body.trim() };
  }

  return null;
}
