import { useEffect } from "react";
import type { CaseCaption, ChildEntry } from "@/lib/calc/share";
import { defaultChildEntry } from "@/lib/calc/share";

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring";

export function FilingDetailsForm({
  caption,
  setCaption,
  numChildren,
  parentALabel,
  parentBLabel,
}: {
  caption: CaseCaption;
  setCaption: (c: CaseCaption) => void;
  numChildren: number;
  parentALabel: string;
  parentBLabel: string;
}) {
  // Keep children array length in sync with numChildren.
  useEffect(() => {
    const current = caption.children ?? [];
    if (current.length === numChildren) return;
    const next: ChildEntry[] = Array.from({ length: numChildren }, (_, i) =>
      current[i] ?? defaultChildEntry(),
    );
    setCaption({ ...caption, children: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numChildren]);

  const u = (patch: Partial<CaseCaption>) => setCaption({ ...caption, ...patch });
  const updateChild = (idx: number, patch: Partial<ChildEntry>) => {
    const next = [...(caption.children ?? [])];
    next[idx] = { ...(next[idx] ?? defaultChildEntry()), ...patch };
    u({ children: next });
  };

  const motherLabel = caption.parentARole === "father" ? parentBLabel : parentALabel;
  const fatherLabel = caption.parentARole === "father" ? parentALabel : parentBLabel;
  const motherIsA = caption.parentARole !== "father";

  const children = caption.children ?? [];

  return (
    <section className="mb-6 rounded-lg border border-rule bg-card p-6 no-print">
      <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-rule pb-3">
        <h2 className="font-serif text-lg text-ink">Filing details (AOC form)</h2>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Printed on official worksheet
        </span>
      </header>

      <div className="space-y-6">
        <div>
          <div className="mb-2 text-sm font-medium text-ink">Mother / Father designation</div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { v: "mother", lbl: `${parentALabel} is the Mother` },
                { v: "father", lbl: `${parentALabel} is the Father` },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => u({ parentARole: o.v })}
                className={
                  "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                  (caption.parentARole === o.v
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-ink hover:bg-accent/40")
                }
              >
                {o.lbl}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Controls which calculator parent appears in the AOC's "Mother /
            Column A" row vs. "Father / Column B" row. Math is unchanged.
          </p>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-ink">
            Children ({numChildren})
          </div>
          {children.length === 0 && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}
          <div className="space-y-3">
            {children.map((c, i) => (
              <div
                key={i}
                className="grid gap-2 rounded-md border border-input p-3 md:grid-cols-12"
              >
                <label className="md:col-span-4">
                  <div className="mb-1 text-xs text-muted-foreground">
                    Child #{i + 1} name
                  </div>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateChild(i, { name: e.target.value })}
                    className={inputCls}
                    placeholder="Full name"
                  />
                </label>
                <label className="md:col-span-3">
                  <div className="mb-1 text-xs text-muted-foreground">
                    Date of birth
                  </div>
                  <input
                    type="text"
                    value={c.dob}
                    onChange={(e) => updateChild(i, { dob: e.target.value })}
                    className={inputCls}
                    placeholder="MM/DD/YYYY"
                  />
                </label>
                <label className="md:col-span-2">
                  <div className="mb-1 text-xs text-muted-foreground">
                    Days w/ {motherLabel}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={(motherIsA ? c.daysWithA : c.daysWithB) || ""}
                    onChange={(e) => {
                      const n = parseInt(e.target.value || "0", 10) || 0;
                      updateChild(i, motherIsA ? { daysWithA: n } : { daysWithB: n });
                    }}
                    className={inputCls + " text-right font-mono"}
                  />
                </label>
                <label className="md:col-span-2">
                  <div className="mb-1 text-xs text-muted-foreground">
                    Days w/ {fatherLabel}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={(motherIsA ? c.daysWithB : c.daysWithA) || ""}
                    onChange={(e) => {
                      const n = parseInt(e.target.value || "0", 10) || 0;
                      updateChild(i, motherIsA ? { daysWithB: n } : { daysWithA: n });
                    }}
                    className={inputCls + " text-right font-mono"}
                  />
                </label>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Per-child days should total 365. Calculation still uses the
            parent-level days you set under "Parenting time."
          </p>
        </div>

        <label className="block">
          <div className="mb-1 text-sm font-medium text-ink">
            Deviation narrative (Part VI)
          </div>
          <textarea
            value={caption.deviationNarrative}
            onChange={(e) => u({ deviationNarrative: e.target.value })}
            placeholder="e.g. Upward deviation for private-school tuition at Westminster School; parties stipulate."
            rows={4}
            className={inputCls + " font-mono text-xs"}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Printed verbatim in Part VI's deviation rows. Required if Line 14
            shows a non-zero amount.
          </p>
        </label>
      </div>
    </section>
  );
}
