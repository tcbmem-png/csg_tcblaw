import { useState } from "react";
import type { CalcInputs } from "@/lib/calc/types";
import {
  composeDeviationNarrative,
  type CaseCaption,
} from "@/lib/calc/share";

export function NarrativeOverridePanel({
  inputs,
  caption,
  setCaption,
}: {
  inputs: CalcInputs;
  caption: CaseCaption;
  setCaption: (c: CaseCaption) => void;
}) {
  const [expanded, setExpanded] = useState(
    () => caption.narrativeOverride.trim().length > 0,
  );
  // Compose the auto-built narrative against an empty override so the user
  // sees what would be generated if they cleared the override.
  const composed = composeDeviationNarrative(inputs, {
    ...caption,
    narrativeOverride: "",
  });
  const hasOverride = caption.narrativeOverride.trim().length > 0;

  return (
    <section className="mb-6 rounded-lg border border-rule bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left"
        aria-expanded={expanded}
      >
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
            AOC Part VI · Auto-composed
          </div>
          <h2 className="mt-1 font-serif text-lg text-ink">
            Deviation narrative
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Built automatically from the "why is this a deviation?" notes on
            each toggle above. Expand to preview or override the composed
            text.
            {hasOverride && (
              <span className="ml-1 font-medium text-accent-foreground">
                Override active.
              </span>
            )}
          </p>
        </div>
        <span
          aria-hidden
          className="mt-1 shrink-0 rounded-md border border-rule px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
        >
          {expanded ? "Collapse ▲" : "Expand ▼"}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-rule px-6 py-5">
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Auto-composed (preview)
            </div>
            <pre className="whitespace-pre-wrap rounded-md border border-rule bg-background p-3 font-mono text-xs text-ink">
              {composed || "(empty — add a 'why' note to a deviation toggle to populate this)"}
            </pre>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Override (optional)
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Anything entered here replaces the auto-composed text on the
              AOC PDF. Leave blank to keep the composed version.
            </p>
            <textarea
              value={caption.narrativeOverride}
              onChange={(e) =>
                setCaption({ ...caption, narrativeOverride: e.target.value })
              }
              placeholder="(optional) Write your own Part VI narrative here."
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-ring"
            />
            {hasOverride && (
              <button
                type="button"
                onClick={() =>
                  setCaption({ ...caption, narrativeOverride: "" })
                }
                className="mt-2 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/40"
              >
                Clear override
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
