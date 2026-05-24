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
  const [unlocked, setUnlocked] = useState<boolean>(() => !!getStoredUnlock());
  useEffect(() => {
    const update = () => setUnlocked(!!getStoredUnlock());
    update();
    window.addEventListener("storage", update);
    window.addEventListener("tncsg:unlock-changed", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("tncsg:unlock-changed", update);
    };
  }, []);
  return unlocked;
}
