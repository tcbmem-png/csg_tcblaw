import {
  STATES,
  modelLabel,
  type StateEntry,
  type StateModel,
} from "@/lib/states";

function group(status: StateEntry["status"]) {
  return STATES.filter((s) => s.status === status).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

const MODEL_ORDER: StateModel[] = ["income_shares", "percentage", "melson"];
const MODEL_HEADER: Record<StateModel, string> = {
  income_shares: "Income shares",
  percentage: "Percentage of income",
  melson: "Melson formula",
};

export function StateList() {
  const available = group("available");
  const coming = group("coming_soon");
  const planned = group("planned");

  return (
    <div className="space-y-8">
      <Section title="Available now" count={available.length}>
        <ul className="space-y-3">
          {available.map((s) => {
            const corrected = !!s.correction;
            const inVerification = s.verifyStatus === "in_verification";
            return (
              <li key={s.code} className="text-sm">
                <a
                  href={s.route!}
                  className="font-medium text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
                >
                  {s.name}
                </a>
                <span className="text-ink/80"> — {modelLabel(s)}</span>
                {s.cite && (
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    ({s.cite})
                  </span>
                )}
                {inVerification && (
                  <span className="ml-2 inline-flex items-center gap-1 align-middle font-mono text-[10px] uppercase tracking-widest text-primary">
                    In verification
                  </span>
                )}
                {corrected && (
                  <>
                    <span className="ml-2 inline-flex items-center gap-1 align-middle font-mono text-[10px] uppercase tracking-widest text-primary">
                      Recently corrected
                    </span>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {s.correction}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      {coming.length > 0 && (
        <Section title="Coming soon" count={coming.length}>
          <ul className="space-y-3">
            {coming.map((s) => (
              <li key={s.code} className="text-sm">
                <span className="font-medium text-ink">{s.name}</span>
                <span className="text-muted-foreground"> — {modelLabel(s)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Planned" count={planned.length}>
        <div className="space-y-4">
          {MODEL_ORDER.map((m) => {
            const list = planned.filter((s) => s.modelKey === m);
            if (list.length === 0) return null;
            return (
              <div key={m}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {MODEL_HEADER[m]}{" "}
                  <span className="text-muted-foreground/70">({list.length})</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {list.map((s) => s.name).join(", ")}.
                </p>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary">
        {title}{" "}
        <span className="text-muted-foreground">({count})</span>
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
