import type { CaseCaption } from "@/lib/calc/share";

export function CaseCaptionForm({
  caption,
  setCaption,
}: {
  caption: CaseCaption;
  setCaption: (c: CaseCaption) => void;
}) {
  const u = (patch: Partial<CaseCaption>) =>
    setCaption({ ...caption, ...patch });

  const cls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring";

  return (
    <section className="mb-6 rounded-lg border border-rule bg-card p-6 no-print">
      <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-rule pb-3">
        <h2 className="font-serif text-lg text-ink">Case caption</h2>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Printed on worksheet
        </span>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Matter (style of case)">
          <input
            type="text"
            value={caption.matterName}
            onChange={(e) => u({ matterName: e.target.value })}
            placeholder="In re: Smith v. Smith"
            className={cls}
          />
        </Field>
        <Field label="Docket / case no.">
          <input
            type="text"
            value={caption.docketNumber}
            onChange={(e) => u({ docketNumber: e.target.value })}
            placeholder="No. 2026-DR-001234"
            className={cls}
          />
        </Field>
        <Field label="Court">
          <input
            type="text"
            value={caption.court}
            onChange={(e) => u({ court: e.target.value })}
            placeholder="Chancery Court for Davidson County, TN"
            className={cls}
          />
        </Field>
        <Field label="Client represented">
          <input
            type="text"
            value={caption.client}
            onChange={(e) => u({ client: e.target.value })}
            placeholder="Representing Mother / Father"
            className={cls}
          />
        </Field>
        <Field label="Prepared by">
          <input
            type="text"
            value={caption.preparedBy}
            onChange={(e) => u({ preparedBy: e.target.value })}
            placeholder="J. Doe, Esq. — TCB Law"
            className={cls}
          />
        </Field>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-ink">{label}</div>
      {children}
    </label>
  );
}
