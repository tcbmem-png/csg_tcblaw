import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { requestWorksheetResend } from "@/lib/resend.functions";

export const Route = createFileRoute("/resend")({
  head: () => ({
    meta: [
      { title: "Resend my worksheet — TN Child Support Helper" },
      {
        name: "description",
        content:
          "Lost your download link? Enter the email you used at checkout and we'll send your worksheet PDF again.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: ResendPage,
});

function ResendPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await requestWorksheetResend({
        data: { email, origin: window.location.origin },
      });
      setMessage(res.message);
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">Resend my worksheet</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Lost the download link? Enter the email you used at checkout and
        we'll send your worksheet PDF again.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Resend my worksheet"}
        </button>
      </form>

      {message && (
        <p className="mt-6 rounded-md bg-muted px-4 py-3 text-sm text-ink">
          {message}
        </p>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        Haven't bought one yet?{" "}
        <Link to="/" className="underline">
          Go to the calculator
        </Link>
        .
      </p>
    </div>
  );
}
