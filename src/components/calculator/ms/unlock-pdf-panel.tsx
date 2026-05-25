import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { MSInputs, MSOutputs } from "@/lib/calc/ms/types";
import type { CaseCaption } from "@/lib/calc/share";
import { requestFreeWorksheet } from "@/lib/free-unlock.functions";
import { setStoredUnlock, useIsUnlocked } from "@/lib/calc/unlock";

interface Props {
  inputs?: MSInputs;
  outputs?: MSOutputs;
  caption?: CaseCaption;
}

export function MSUnlockPdfPanel({ inputs, outputs, caption }: Props) {
  const unlocked = useIsUnlocked();
  const submit = useServerFn(requestFreeWorksheet);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const ready = !!inputs && !!outputs && !!caption;

  if (unlocked && status !== "sent") {
    return (
      <div
        id="unlock-pdf-panel"
        className="mt-8 rounded-lg border border-rule bg-cream p-5 no-print"
      >
        <h2 className="font-serif text-lg text-ink">Your worksheet is unlocked</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the <strong>Print / Save PDF</strong> button on the Mississippi
          worksheet above to save a filing-ready copy.
        </p>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div
        id="unlock-pdf-panel"
        className="mt-8 rounded-lg border border-rule bg-cream p-5 no-print"
      >
        <h2 className="font-serif text-lg text-ink">Sent — check your inbox</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your Mississippi worksheet was emailed to <strong>{sentTo}</strong>.
          You can also use the <strong>Print / Save PDF</strong> button on the
          worksheet above.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ready) {
      setError("Worksheet isn't ready yet. Fill in the inputs above first.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setStatus("sending");
    try {
      const res = await submit({
        data: {
          name: name.trim(),
          email: email.trim(),
          state: "MS",
          payload: {
            inputs: inputs as unknown as Record<string, unknown>,
            outputs: outputs as unknown as Record<string, unknown>,
            caption: caption as CaseCaption,
          },
        },
      });
      setStoredUnlock(res.unlockToken, email.trim().toLowerCase());
      setSentTo(email.trim().toLowerCase());
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div
      id="unlock-pdf-panel"
      className="mt-8 rounded-lg border border-rule bg-cream p-5 no-print"
    >
      <h2 className="font-serif text-lg text-ink">
        Free during beta — get your worksheet
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us who you are and we'll email you a filing-ready PDF. We'll only
        use your email to send your worksheet and occasional product updates.
        Unsubscribe anytime.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <label className="text-sm">
          <span className="block text-ink">Full name</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            autoComplete="name"
            className="mt-1 w-full rounded-md border border-rule bg-background px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ink">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={320}
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-rule bg-background px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </label>

        {error && (
          <p className="sm:col-span-2 text-sm text-destructive">{error}</p>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={status === "sending" || !ready}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Email me my worksheet"}
          </button>
          {!ready && (
            <span className="ml-3 text-xs text-muted-foreground">
              Finish entering the worksheet inputs above first.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
