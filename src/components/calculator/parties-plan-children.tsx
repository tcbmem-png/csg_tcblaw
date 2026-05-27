import { useEffect } from "react";
import type { CalcInputs } from "@/lib/calc/types";
import type { CaseCaption, ChildEntry, ParentRole } from "@/lib/calc/share";
import { setParentRole, defaultChildEntry } from "@/lib/calc/share";

/**
 * Combined "Parties, parenting plan & children" section.
 *
 * Replaces three former top-of-form sections (Parents / Children / Parenting
 * time) plus the deleted Filing Details intake. Order matters: the parenting
 * plan choice in 2b pre-seeds each child's per-day allocation in 2c.
 *
 * Engine math is unchanged. Per-child day overrides are recorded for the AOC
 * form only — the calc still uses parent-level totals from 2b.
 */
export function PartiesPlanChildren({
  inputs,
  setInputs,
  caption,
  setCaption,
}: {
  inputs: CalcInputs;
  setInputs: (next: CalcInputs) => void;
  caption: CaseCaption;
  setCaption: (next: CaseCaption) => void;
}) {
  const u = (patch: Partial<CalcInputs>) => setInputs({ ...inputs, ...patch });

  // ---- Derived display labels ----
  const aRole = caption.parentARole;
  const bRole = caption.parentBRole;
  const rolesSet = !!aRole && !!bRole;
  const labelA = inputs.parentALabel || "Parent A";
  const labelB = inputs.parentBLabel || "Parent B";
  const tag = (role: ParentRole, fallback: string): string =>
    role ? `${fallback} / ${role === "mother" ? "Mother" : "Father"}` : fallback;
  const tagA = tag(aRole, labelA);
  const tagB = tag(bRole, labelB);

  // ---- Days seed from plan ----
  const plannedDays = (() => {
    if (inputs.parentingType === "equal") return { a: 183, b: 182 };
    if (inputs.parentingType === "custom") {
      return { a: inputs.parentADays ?? 0, b: inputs.parentBDays ?? 0 };
    }
    // standard
    if (inputs.arpForStandard === "parent_a") return { a: 80, b: 285 };
    return { a: 285, b: 80 };
  })();

  // Keep caption.children length in sync with inputs.numChildren AND re-seed
  // days from the current parenting plan. Existing per-child *names/DOBs* are
  // preserved; per-child days are re-seeded from the plan whenever the plan
  // changes (user can re-override per child afterward).
  useEffect(() => {
    const current = caption.children ?? [];
    const next: ChildEntry[] = Array.from({ length: inputs.numChildren }, (_, i) => {
      const existing = current[i] ?? defaultChildEntry();
      return {
        ...existing,
        daysWithA: plannedDays.a,
        daysWithB: plannedDays.b,
      };
    });
    // Avoid no-op state updates.
    const same =
      current.length === next.length &&
      current.every(
        (c, i) =>
          c.name === next[i].name &&
          c.dob === next[i].dob &&
          c.daysWithA === next[i].daysWithA &&
          c.daysWithB === next[i].daysWithB,
      );
    if (!same) setCaption({ ...caption, children: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inputs.numChildren,
    inputs.parentingType,
    inputs.arpForStandard,
    inputs.parentADays,
    inputs.parentBDays,
  ]);

  const updateChild = (idx: number, patch: Partial<ChildEntry>) => {
    const next = [...(caption.children ?? [])];
    next[idx] = { ...(next[idx] ?? defaultChildEntry()), ...patch };
    setCaption({ ...caption, children: next });
  };

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring";

  return (
    <section className="mb-6 rounded-lg border border-rule bg-card p-6">
      <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-rule pb-3">
        <h2 className="font-serif text-lg text-ink">
          Parties, parenting plan & children
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Rule .04(3) · .04(7) · .09
        </span>
      </header>

      {/* ---------- 2a. Parties + role ---------- */}
      <div className="mb-6">
        <div className="mb-2 text-sm font-medium text-ink">Parents</div>
        <div className="grid gap-3 md:grid-cols-2">
          <ParentRow
            label="Parent A"
            name={inputs.parentALabel}
            onNameChange={(v) => u({ parentALabel: v })}
            role={aRole}
            onRoleChange={(r) => setCaption(setParentRole(caption, "A", r))}
            inputCls={inputCls}
          />
          <ParentRow
            label="Parent B"
            name={inputs.parentBLabel}
            onNameChange={(v) => u({ parentBLabel: v })}
            role={bRole}
            onRoleChange={(r) => setCaption(setParentRole(caption, "B", r))}
            inputCls={inputCls}
          />
        </div>
        {!rolesSet && (
          <p className="mt-2 text-xs text-amber-700">
            Pick which parent is the Mother — required for the AOC form.
            Selecting one parent's role auto-sets the other.
          </p>
        )}
      </div>

      {/* ---------- 2b. Parenting plan + ARP/PRP ---------- */}
      <div className="mb-6 border-t border-rule pt-4">
        <div className="mb-2 text-sm font-medium text-ink">Parenting plan</div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { v: "standard", lbl: "Standard schedule" },
              { v: "equal", lbl: "Equal 50/50" },
              { v: "custom", lbl: "Custom days" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => u({ parentingType: o.v })}
              className={
                "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                (inputs.parentingType === o.v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-ink hover:bg-accent/40")
              }
            >
              {o.lbl}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Tennessee labels the parent the children live with most as the{" "}
          <strong>PRP</strong> (Primary Residential Parent). The other parent
          is the <strong>ARP</strong> (Alternate Residential Parent). Support
          generally flows from ARP to PRP.
        </p>

        {/* Standard / Custom: paired ARP toggle */}
        {(inputs.parentingType === "standard" ||
          inputs.parentingType === "custom") && (
          <div className="mt-4 rounded-md border border-rule bg-cream/50 p-3">
            <div className="mb-2 text-sm font-medium text-ink">
              Who is the ARP (paying parent)?
            </div>
            <ArpPairedToggle
              tagA={tagA}
              tagB={tagB}
              arp={inputs.arpForStandard ?? "parent_b"}
              onChange={(v) => {
                // For custom, also seed days so the toggle has a visible effect.
                if (inputs.parentingType === "custom") {
                  u({
                    arpForStandard: v,
                    parentADays: v === "parent_a" ? 80 : 285,
                    parentBDays: v === "parent_a" ? 285 : 80,
                  });
                } else {
                  u({ arpForStandard: v });
                }
              }}
            />
          </div>
        )}

        {/* Equal 50/50: read-only note */}
        {inputs.parentingType === "equal" && (
          <div className="mt-3 rounded-md border border-rule bg-cream/50 p-3 text-xs text-ink">
            50/50 — neither parent is the ARP; cross-credit applies per Rule
            .04(7)(b)(2)(i).
          </div>
        )}

        {/* Custom: editable day inputs */}
        {inputs.parentingType === "custom" && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-xs text-muted-foreground">
                {tagA} days/year
              </div>
              <input
                type="number"
                min={0}
                max={365}
                value={inputs.parentADays ?? 0}
                onChange={(e) => {
                  const n = parseInt(e.target.value || "0", 10) || 0;
                  u({ parentADays: n, parentBDays: Math.max(0, 365 - n) });
                }}
                className={inputCls + " text-right font-mono"}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-xs text-muted-foreground">
                {tagB} days/year
              </div>
              <input
                type="number"
                min={0}
                max={365}
                value={inputs.parentBDays ?? 0}
                onChange={(e) => {
                  const n = parseInt(e.target.value || "0", 10) || 0;
                  u({ parentBDays: n, parentADays: Math.max(0, 365 - n) });
                }}
                className={inputCls + " text-right font-mono"}
              />
            </label>
          </div>
        )}
      </div>

      {/* ---------- 2c. Children ---------- */}
      <div className="border-t border-rule pt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-sm font-medium text-ink">Children</div>
          <span className="text-xs text-muted-foreground">
            Days pre-fill from the plan; override per child only if their
            schedule actually differs.
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Number:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => u({ numChildren: n })}
              className={
                "rounded-md border px-3 py-1 text-sm transition-colors " +
                (inputs.numChildren === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-ink hover:bg-accent/40")
              }
            >
              {n}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {(caption.children ?? []).map((c, i) => {
            const overridden =
              c.daysWithA !== plannedDays.a || c.daysWithB !== plannedDays.b;
            return (
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
                    Days w/ {tagA.split(" / ")[1] ?? "A"}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={c.daysWithA || ""}
                    onChange={(e) =>
                      updateChild(i, {
                        daysWithA: parseInt(e.target.value || "0", 10) || 0,
                      })
                    }
                    className={inputCls + " text-right font-mono"}
                  />
                </label>
                <label className="md:col-span-2">
                  <div className="mb-1 text-xs text-muted-foreground">
                    Days w/ {tagB.split(" / ")[1] ?? "B"}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={c.daysWithB || ""}
                    onChange={(e) =>
                      updateChild(i, {
                        daysWithB: parseInt(e.target.value || "0", 10) || 0,
                      })
                    }
                    className={inputCls + " text-right font-mono"}
                  />
                </label>
                <div className="md:col-span-1 flex items-end justify-end">
                  {overridden && (
                    <span
                      title="This child's days differ from the parenting plan above."
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                    >
                      differs
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Per-child schedules that differ from the overall plan are recorded
          on the AOC form but do not change the math — the calculator still
          uses the parent-level totals above. Consult counsel for genuinely
          split per-child schedules.
        </p>
      </div>
    </section>
  );
}

function ParentRow({
  label,
  name,
  onNameChange,
  role,
  onRoleChange,
  inputCls,
}: {
  label: string;
  name: string;
  onNameChange: (v: string) => void;
  role: ParentRole;
  onRoleChange: (r: Exclude<ParentRole, null>) => void;
  inputCls: string;
}) {
  return (
    <div className="rounded-md border border-input p-3">
      <div className="mb-1 text-xs text-muted-foreground">{label} label</div>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className={inputCls}
        placeholder={label}
      />
      <div className="mt-2 flex gap-1">
        {(["mother", "father"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRoleChange(r)}
            className={
              "flex-1 rounded-md border px-2 py-1 text-xs capitalize transition-colors " +
              (role === r
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-ink hover:bg-accent/40")
            }
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

function ArpPairedToggle({
  tagA,
  tagB,
  arp,
  onChange,
}: {
  tagA: string;
  tagB: string;
  arp: "parent_a" | "parent_b";
  onChange: (v: "parent_a" | "parent_b") => void;
}) {
  const Btn = ({
    value,
    tag,
  }: {
    value: "parent_a" | "parent_b";
    tag: string;
  }) => {
    const active = arp === value;
    return (
      <button
        type="button"
        onClick={() => onChange(value)}
        className={
          "flex-1 rounded-md border px-3 py-2 text-sm transition-colors " +
          (active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background text-ink hover:bg-accent/40")
        }
      >
        <div className="font-medium">{tag}</div>
        <div
          className={
            "mt-0.5 text-[10px] font-mono uppercase tracking-widest " +
            (active ? "text-primary-foreground/80" : "text-muted-foreground")
          }
        >
          {active ? "ARP (pays)" : "PRP (receives)"}
        </div>
      </button>
    );
  };
  return (
    <div className="flex gap-2">
      <Btn value="parent_a" tag={tagA} />
      <Btn value="parent_b" tag={tagB} />
    </div>
  );
}
