/**
 * Receiving-side save-and-resume for MS handoff.
 *
 *   The receiving attorney's edits exist only in their browser session.
 *   Closing the tab without sending back or downloading loses the work.
 *   This module persists an in-progress receiving slate keyed by caseId,
 *   along with a `baseShareHash` of the URL state the receiver was
 *   editing against. On reopen, the caller compares the URL's current
 *   share hash to the saved baseShareHash:
 *
 *     equal    → "resumable" — same URL, same case, safe to restore
 *     differ   → "diverged"  — originator sent a new URL since the save;
 *                              receiver must pick continue vs. accept-new
 *
 *   Purely client-side localStorage. No server-state commitment.
 */
import type { HandoffState, MSInputs } from "./types";

const KEY_PREFIX = "ms.handoff.draft.";

export interface ReceivingDraft {
  inputs: MSInputs;
  handoff: HandoffState;
  baseShareHash: string;
  savedAt: string;
}

export interface ResumeProbe {
  status: "none" | "resumable" | "diverged";
  draft: ReceivingDraft | null;
}

function key(caseId: string): string {
  return KEY_PREFIX + caseId;
}

export function saveReceivingDraft(
  caseId: string,
  draft: Omit<ReceivingDraft, "savedAt">,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const payload: ReceivingDraft = { ...draft, savedAt: new Date().toISOString() };
    localStorage.setItem(key(caseId), JSON.stringify(payload));
  } catch {
    /* quota / privacy mode */
  }
}

export function loadReceivingDraft(caseId: string): ReceivingDraft | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(caseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.baseShareHash !== "string" ||
      !parsed.inputs ||
      !parsed.handoff
    ) {
      return null;
    }
    return parsed as ReceivingDraft;
  } catch {
    return null;
  }
}

export function clearReceivingDraft(caseId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key(caseId));
  } catch {
    /* ignore */
  }
}

/**
 * State-divergence probe. Does NOT compare timestamps — timestamps
 * produce false positives when the originator sends a fresh URL while
 * the receiver's old draft sits in localStorage. The right question is:
 * "Was the URL I'm looking at now the same URL my draft was based on?"
 */
export function probeResume(
  caseId: string | null,
  currentShareHash: string,
): ResumeProbe {
  if (!caseId) return { status: "none", draft: null };
  const draft = loadReceivingDraft(caseId);
  if (!draft) return { status: "none", draft: null };
  if (draft.baseShareHash === currentShareHash) {
    return { status: "resumable", draft };
  }
  return { status: "diverged", draft };
}
