/** Extract customer identity + message preview from dm_events.trigger_payload (Meta webhook JSON). */
export function parseDmEventPayload(payload: unknown): {
  senderId: string | null;
  handle: string | null;
  messagePreview: string | null;
} {
  if (!payload || typeof payload !== "object") {
    return { senderId: null, handle: null, messagePreview: null };
  }

  const p = payload as Record<string, unknown>;

  // Instagram DM (messaging webhook object)
  const sender = p.sender as { id?: string; username?: string } | undefined;
  const message = p.message as { text?: string } | undefined;
  if (sender?.id) {
    const username = typeof sender.username === "string" ? sender.username : null;
    return {
      senderId: sender.id,
      handle: username ? `@${username}` : null,
      messagePreview: typeof message?.text === "string" ? message.text : null,
    };
  }

  // Comment trigger (change.value shape)
  const from = p.from as { id?: string; username?: string } | undefined;
  if (from?.id) {
    const username = typeof from.username === "string" ? from.username : null;
    const text = typeof p.text === "string" ? p.text : null;
    return {
      senderId: from.id,
      handle: username ? `@${username}` : null,
      messagePreview: text,
    };
  }

  return { senderId: null, handle: null, messagePreview: null };
}

export function formatRecipientLabel(handle: string | null, senderId: string | null): string {
  if (handle) return handle.startsWith("@") ? handle : `@${handle}`;
  if (senderId) return `Customer ${senderId}`;
  return "Unknown customer";
}

/** Owner follow-ups: prefer @handle; never show raw PSID in the UI. */
export function formatCustomerLabel(handle: string | null): string {
  if (handle) return handle.startsWith("@") ? handle : `@${handle}`;
  return "Instagram customer";
}

function errorLower(error: string | null | undefined): string {
  return error?.toLowerCase() ?? "";
}

/** Legacy CX/Lynk row logged before AI outcome was written back to dm_events. */
export function isLegacyAutomationSkip(error: string | null): boolean {
  return errorLower(error).includes("no matching active dm automation");
}

export function isAiPendingError(error: string | null): boolean {
  const err = errorLower(error);
  return (
    err.includes("forwarded to ai") ||
    err.includes("ai assistant handling") ||
    err.includes("picked up")
  );
}

export function canPickUpDmEvent(status: string, error: string | null, hasSenderId: boolean): boolean {
  if (status !== "skipped" || !hasSenderId) return false;
  const err = errorLower(error);
  if (err.includes("ai reply sent")) return false;
  return (
    err.includes("needs human") ||
    err.includes("ai assistant unavailable") ||
    isLegacyAutomationSkip(error) ||
    isAiPendingError(error)
  );
}

export function dmActivityHeadline(
  status: string,
  error: string | null,
  recipientLabel: string,
): string {
  if (status === "sent") {
    return errorLower(error).includes("ai reply")
      ? `AI reply sent to ${recipientLabel}`
      : `Auto-reply sent to ${recipientLabel}`;
  }
  if (status === "skipped") {
    if (isLegacyAutomationSkip(error) || isAiPendingError(error)) {
      return `AI handling — ${recipientLabel}`;
    }
    return `Needs you — ${recipientLabel}`;
  }
  return `Status: ${status} — ${recipientLabel}`;
}

export function dmActivityStatusLabel(status: string, error: string | null): string {
  if (status === "skipped" && (isLegacyAutomationSkip(error) || isAiPendingError(error))) {
    return "ai pending";
  }
  return status;
}
