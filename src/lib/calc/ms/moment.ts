/**
 * Moment derivation for the MS two-attorney handoff UX.
 *
 *   1. drafting             — status="none"; originator drafting
 *   2. sent_awaiting        — status="originated", originator browser,
 *                             not the receiver session
 *   3. your_turn_receiver   — receiver session (?side != originatingSide)
 *   4. returned_for_review  — status="in_progress"|"completed", originator
 *                             browser, not the receiver session
 *   5. complete             — status="completed", either side
 */
import type { HandoffSide, HandoffState } from "@/lib/calc/ms/types";

export type HandoffMoment =
  | "drafting"
  | "sent_awaiting"
  | "your_turn_receiver"
  | "returned_for_review"
  | "complete";

export interface MomentContext {
  moment: HandoffMoment;
  /** Display name of the OTHER attorney from this viewer's perspective. */
  counterpartyLabel: string;
  /** Relevant ISO timestamp for the moment ("sent" / "received" / "completed"). */
  timestamp: string | null;
}

function attorneyLabel(
  who: { name?: string; firm?: string } | null,
  fallback: string,
): string {
  if (!who) return fallback;
  const name = who.name?.trim();
  const firm = who.firm?.trim();
  if (name && firm) return `${name} (${firm})`;
  return name || firm || fallback;
}

export function deriveMoment(
  handoff: HandoffState,
  activeSide: HandoffSide | null,
  isOriginator: boolean,
): MomentContext {
  const origLabel = attorneyLabel(handoff.originatingAttorney, "opposing counsel");
  const rcvLabel = attorneyLabel(handoff.receivingAttorney, "opposing counsel");
  const isReceivingSession =
    activeSide !== null &&
    handoff.status !== "none" &&
    activeSide !== handoff.originatingSide;

  if (handoff.status === "completed") {
    return {
      moment: "complete",
      counterpartyLabel: isReceivingSession ? origLabel : rcvLabel,
      timestamp: handoff.completedAt,
    };
  }
  if (handoff.status === "none") {
    return { moment: "drafting", counterpartyLabel: "", timestamp: null };
  }
  if (isReceivingSession) {
    return {
      moment: "your_turn_receiver",
      counterpartyLabel: origLabel,
      timestamp: handoff.createdAt,
    };
  }
  // Originator-side view from here on. Distinguish "sent, waiting" from
  // "received back".
  if (handoff.status === "in_progress" && isOriginator) {
    return {
      moment: "returned_for_review",
      counterpartyLabel: rcvLabel,
      timestamp: handoff.lastReceivingEditAt,
    };
  }
  if (handoff.status === "originated" && isOriginator) {
    return {
      moment: "sent_awaiting",
      counterpartyLabel: rcvLabel,
      timestamp: handoff.createdAt,
    };
  }
  // Foreign browser opening a sent URL without ?side= (rare) — treat
  // as drafting; no banner.
  return { moment: "drafting", counterpartyLabel: "", timestamp: null };
}
