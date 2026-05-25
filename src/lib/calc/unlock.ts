import { useEffect, useState } from "react";

const KEY = "tncsg.unlock";

export function getStoredUnlock(): { token: string; email?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.token === "string") return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function setStoredUnlock(token: string, email?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify({ token, email }));
  window.dispatchEvent(new Event("tncsg:unlock-changed"));
}

export function useIsUnlocked(): boolean {
  // Free beta: PDF downloads are unlocked for all testers.
  // Re-enable the paywall by restoring the previous implementation that
  // read from getStoredUnlock() / tncsg:unlock-changed events.
  void useState;
  void useEffect;
  return true;
}
