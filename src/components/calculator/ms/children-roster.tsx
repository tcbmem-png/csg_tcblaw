/**
 * § 93-11-65(8) per-child early-emancipation roster.
 *
 * Supersedes the legacy comma-separated `childAges` input. Each row captures:
 *   - age
 *   - emancipationStatus (none / marriage / military_service /
 *     qualifying_felony / school_discontinuance)
 *   - optional projectedEmancipationDate (only when the event is on the
 *     horizon — empty means "already occurred")
 *   - single-line citation note (cap 120 chars)
 *
 * `inputs.childAges` is kept in sync so reconciliation back-compat code
 * paths keep working.
 */
import type { MSChild, MSEmancipationStatus, MSInputs } from "@/lib/calc/ms/types";
import { defaultMSChild } from "@/lib/calc/ms/types";
import { Field, PlainNumInput, TextInput } from "./form-primitives";

type Setter = (next: MSInputs) => void;

const STATUS_OPTIONS: { value: MSEmancipationStatus; label: string }[] = [
  { value: "none", label: "Age 21 default applies" },
  { value: "marriage", label: "Marriage" },
  { value: "military_service", label: "Military service" },
  { value: "qualifying_felony", label: "Qualifying felony (≥ 2-yr sentence)" },
  { value: "school_discontinuance", label: "Full-time school discontinued" },
];

const NOTE_MAX = 120;

/** ISO date string for `today + 6 months` (per Phase 2.5 ergonomics call). */
function defaultProjectedDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}

function syncChildAges(children: MSChild[]): number[] {
  return children.map((c) => c.age).filter((n) => Number.isFinite(n) && n >= 0);
}

export function MSChildrenRoster({
  inputs,
  setInputs,
}: {
  inputs: MSInputs;
  setInputs: Setter;
}) {
  const children: MSChild[] =
    inputs.children && inputs.children.length > 0
      ? inputs.children
      : (inputs.childAges ?? []).map((age) => defaultMSChild(age));

  const commit = (next: MSChild[]) =>
    setInputs({ ...inputs, children: next, childAges: syncChildAges(next) });

  const addChild = () => commit([...children, defaultMSChild(0)]);
  const removeChild = (idx: number) =>
    commit(children.filter((_, i) => i !== idx));

  const updateChild = (idx: number, patch: Partial<MSChild>) => {
    const next = children.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    commit(next);
  };

  return (
    <div className="rounded-md border border-rule bg-background p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h4 className="font-serif text-sm text-ink">
          Children before the court
        </h4>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          § 93-11-65(8)
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Optional. Add each child to power the reconciliation view's cumulative
        projection and to capture any asserted early-emancipation carve-out
        (marriage, military service, qualifying felony, or full-time school
        discontinuance).
      </p>

      {children.length === 0 ? (
        <div className="rounded-md border border-dashed border-rule p-3 text-xs text-muted-foreground">
          No children added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((child, idx) => (
            <ChildRow
              key={idx}
              idx={idx}
              child={child}
              onChange={(patch) => updateChild(idx, patch)}
              onRemove={() => removeChild(idx)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addChild}
        className="mt-3 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-ink hover:bg-muted"
      >
        + Add child
      </button>
    </div>
  );
}

function ChildRow({
  idx,
  child,
  onChange,
  onRemove,
}: {
  idx: number;
  child: MSChild;
  onChange: (patch: Partial<MSChild>) => void;
  onRemove: () => void;
}) {
  const needsDate =
    child.emancipationStatus !== "none" && child.emancipationStatus.length > 0;

  const onStatusChange = (status: MSEmancipationStatus) => {
    // Default the projected date to today + 6 months when transitioning from
    // "none" to an asserted-but-future status. Most users tweak from there;
    // an empty default is friction. Leaving it empty signals "already
    // occurred" downstream (§1.6 reconciliation treats no-date as 0 months
    // remaining for that child).
    if (status !== "none" && !child.projectedEmancipationDate) {
      onChange({
        emancipationStatus: status,
        projectedEmancipationDate: defaultProjectedDate(),
      });
    } else if (status === "none") {
      onChange({ emancipationStatus: status, projectedEmancipationDate: "" });
    } else {
      onChange({ emancipationStatus: status });
    }
  };

  return (
    <div className="rounded-md border border-rule p-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Child {idx + 1}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[100px_1fr]">
        <Field label="Age">
          <PlainNumInput
            value={child.age}
            onChange={(n) => onChange({ age: Math.max(0, Math.min(21, n)) })}
            max={21}
          />
        </Field>
        <Field label="Emancipation status">
          <select
            value={child.emancipationStatus}
            onChange={(e) =>
              onStatusChange(e.target.value as MSEmancipationStatus)
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {needsDate && (
        <div className="mt-3 grid gap-3 md:grid-cols-[200px_1fr]">
          <Field
            label="Projected date"
            help="Leave blank if the event has already occurred."
          >
            <input
              type="date"
              value={child.projectedEmancipationDate ?? ""}
              onChange={(e) =>
                onChange({ projectedEmancipationDate: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field
            label="Citation / note (optional)"
            help={`Brief support — e.g. "enlisting Aug 2026 per recruiter letter Exh. R-22". ${NOTE_MAX}-char cap.`}
          >
            <TextInput
              value={(child.note ?? "").slice(0, NOTE_MAX)}
              onChange={(s) => onChange({ note: s.slice(0, NOTE_MAX) })}
              placeholder="Short citation or rationale"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
