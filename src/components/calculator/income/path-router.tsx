import { PATH_LABELS } from "./shared";

export type PathKey = keyof typeof PATH_LABELS;

const DESCRIPTIONS: Record<PathKey, string> = {
  simple: "W-2 employee with stable pay. 30 seconds.",
  variable: "Income varies year to year. 2–3 minutes.",
  self_employed: "Schedule C / K-1 with depreciation and other add-backs. 3–5 minutes.",
  multi_source: "Mix of W-2, 1099, rentals, etc. 3–5 minutes.",
  imputed: "The other parent disputes earnings, or income must be assigned. 3–5 minutes.",
  special: "SSI, incarceration, active military, or federal benefits paid to the child.",
};

export function PathRouter({
  label,
  onPick,
}: {
  label: string;
  onPick: (path: PathKey) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Pick the path that fits {label}
      </div>
      <div className="grid gap-2">
        {(Object.keys(PATH_LABELS) as PathKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onPick(k)}
            className="rounded-md border border-input bg-background px-3 py-2 text-left text-sm text-ink transition-colors hover:border-primary hover:bg-accent/30"
          >
            <div className="font-medium">{PATH_LABELS[k]}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {DESCRIPTIONS[k]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
