import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Unsubscribe — TN Child Support" },
      {
        name: "description",
        content:
          "Unsubscribe from TN Child Support Calculator transactional and notification emails.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/unsubscribe" }],
  }),
  component: UnsubscribePage,
});

type State =
  | { kind: "loading" }
  | { kind: "valid"; email: string }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "done" }
  | { kind: "error"; message: string };

function UnsubscribePage() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (!t) {
      setState({ kind: "invalid" });
      return;
    }
    setToken(t);
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          setState({ kind: "invalid" });
          return;
        }
        if (body.used) setState({ kind: "already" });
        else setState({ kind: "valid", email: body.email ?? "" });
      })
      .catch(() => setState({ kind: "invalid" }));
  }, []);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        setState({ kind: "error", message: body.error ?? "Failed to unsubscribe" });
        return;
      }
      setState({ kind: "done" });
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ?? "Failed to unsubscribe" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">Email preferences</h1>
      {state.kind === "loading" && (
        <p className="mt-4 text-sm text-muted-foreground">Checking your link…</p>
      )}
      {state.kind === "invalid" && (
        <p className="mt-4 text-sm text-muted-foreground">
          This unsubscribe link is invalid or has expired.
        </p>
      )}
      {state.kind === "already" && (
        <p className="mt-4 text-sm text-muted-foreground">
          You are already unsubscribed.
        </p>
      )}
      {state.kind === "valid" && (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Click below to stop receiving emails at{" "}
            <span className="font-medium text-ink">{state.email}</span>.
          </p>
          <button
            onClick={confirm}
            disabled={submitting}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Working…" : "Confirm unsubscribe"}
          </button>
        </>
      )}
      {state.kind === "done" && (
        <p className="mt-4 text-sm text-muted-foreground">
          Done — you've been unsubscribed. You won't receive further emails.
        </p>
      )}
      {state.kind === "error" && (
        <p className="mt-4 text-sm text-destructive">{state.message}</p>
      )}
    </div>
  );
}
