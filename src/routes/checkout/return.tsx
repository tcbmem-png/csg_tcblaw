import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getOrderStatus } from "@/lib/checkout.functions";
import { setStoredUnlock } from "@/lib/calc/unlock";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({ meta: [{ title: "Worksheet ready — TN Child Support" }] }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = useSearch({ from: "/checkout/return" });
  const [status, setStatus] = useState<"loading" | "delivered" | "paid" | "pending" | "missing">(
    "loading",
  );
  const [unlockToken, setUnlockToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!session_id) {
      setStatus("missing");
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      try {
        const res = await getOrderStatus({ data: { sessionId: session_id } });
        if (cancelled) return;
        if (!res.found) {
          setStatus("missing");
          return;
        }
        setEmail(res.email);
        setUnlockToken(res.unlockToken);
        if (res.status === "delivered") {
          if (res.unlockToken) setStoredUnlock(res.unlockToken, res.email ?? undefined);
          setStatus("delivered");
          return;
        }
        setStatus(res.status === "paid" ? "paid" : "pending");
        if (++attempts < 40) setTimeout(poll, 2000);
      } catch (e) {
        console.error(e);
        if (++attempts < 40) setTimeout(poll, 2000);
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [session_id]);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">
        {status === "delivered" ? "Your worksheet is ready" : "Finalizing your worksheet…"}
      </h1>

      {status === "missing" && (
        <p className="mt-4 text-sm text-muted-foreground">
          We could not find your order. Please check your email for the download link, or{" "}
          <Link to="/calculator" className="underline">
            return to the calculator
          </Link>
          .
        </p>
      )}

      {(status === "loading" || status === "paid" || status === "pending") && (
        <p className="mt-4 text-sm text-muted-foreground">
          Payment received. We're generating your PDF and sending it to{" "}
          <span className="font-medium text-ink">{email ?? "your email"}</span>. This
          usually takes just a few seconds.
        </p>
      )}

      {status === "delivered" && unlockToken && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            We've emailed a copy to{" "}
            <span className="font-medium text-ink">{email}</span>. You can also
            download it right here.
          </p>
          <a
            href={`/api/public/unlock/${unlockToken}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            download="tn-child-support-worksheet.pdf"
          >
            Download PDF
          </a>
          <div>
            <Link to="/calculator" className="text-sm underline text-muted-foreground">
              Back to calculator
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
