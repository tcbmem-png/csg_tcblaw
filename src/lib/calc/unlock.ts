// Free during beta: no gate. PDF generation and worksheet access are
// unconditionally unlocked. The lead-capture server function and beta_leads
// table remain in place (dormant) so a separate, optional footer opt-in can
// reuse them later without a re-migration. Do NOT call them from the
// worksheet flow — the worksheet is free to use, including PDF, with no
// input required.

export function getStoredUnlock(): { token: string; email?: string } | null {
  return { token: "free-beta" };
}

export function setStoredUnlock(_token: string, _email?: string) {
  // no-op; everything is unlocked
}

export function useIsUnlocked(): boolean {
  return true;
}
