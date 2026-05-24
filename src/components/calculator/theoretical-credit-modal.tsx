import { useState } from "react";
import { lookupBcso } from "@/lib/calc/bcso";

type Mode = "inhome" | "notinhome";

export function TheoreticalCreditHelper({
  mode,
  parentLabel,
  parentGrossMonthly,
  onApply,
}: {
  mode: Mode;
  parentLabel: string;
  parentGrossMonthly: number;
  onApply: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [numKids, setNumKids] = useState(1);
  const [documented, setDocumented] = useState(0);

  // Theoretical = 75% of BCSO for THIS parent's income alone with those kids.
  const bcso = parentGrossMonthly > 0 && numKids >= 1 && numKids <= 5
    ? lookupBcso(parentGrossMonthly, numKids).bcso
    : 0;
  const theoretical = Math.round(bcso * 0.75);
  const result =
    mode === "notinhome"
      ? Math.min(theoretical, documented || 0)
      : theoretical;

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 text-xs text-primary underline-offset-2 hover:underline"
      >
        Calculate from theoretical CS →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-lg border border-rule bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg text-ink">
              {mode === "inhome"
                ? "In-home children credit calculator"
                : "Not-in-home children credit calculator"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === "inhome"
                ? "Line 1d: 75% of the theoretical BCSO for qualified children living in " +
                  parentLabel +
                  "'s home (not before the court), based on " +
                  parentLabel +
                  "'s income alone."
                : "Line 1e: lesser of (a) 75% of theoretical BCSO for qualified not-in-home children using " +
                  parentLabel +
                  "'s income alone, and (b) documented monthly support actually provided over the last 12 months."}
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-md border border-rule bg-background px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  {parentLabel}'s gross monthly income:
                </span>{" "}
                <span className="font-mono text-ink">
                  ${parentGrossMonthly.toLocaleString()}
                </span>
              </div>

              <label className="block">
                <div className="mb-1 text-sm font-medium text-ink">
                  Number of qualified{" "}
                  {mode === "inhome" ? "in-home" : "not-in-home"} children
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumKids(n)}
                      className={
                        "rounded-md border px-3 py-1.5 text-sm " +
                        (numKids === n
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-ink")
                      }
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </label>

              {mode === "notinhome" && (
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-ink">
                    Avg documented monthly support (last 12 mo)
                  </div>
                  <div className="flex items-center rounded-md border border-input bg-background px-3 py-2">
                    <span className="mr-1 text-muted-foreground">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full bg-transparent text-right font-mono text-sm text-ink outline-none"
                      value={documented === 0 ? "" : documented}
                      onChange={(e) => {
                        const n = parseFloat(
                          e.target.value.replace(/[^0-9.]/g, ""),
                        );
                        setDocumented(isNaN(n) ? 0 : n);
                      }}
                    />
                  </div>
                </label>
              )}

              <div className="rounded-md border border-accent/40 bg-accent/10 p-3 text-xs text-ink">
                <div>
                  Theoretical BCSO: ${bcso.toFixed(0)} × 75% ={" "}
                  <strong>${theoretical}</strong>
                </div>
                {mode === "notinhome" && (
                  <div className="mt-1">
                    Lesser of theoretical (${theoretical}) and documented ($
                    {documented || 0}) = <strong>${result}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(result);
                  close();
                }}
                disabled={parentGrossMonthly <= 0}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                Use ${result}
              </button>
            </div>
            {parentGrossMonthly <= 0 && (
              <p className="mt-2 text-right text-xs text-muted-foreground">
                Enter {parentLabel}'s gross monthly income first.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
