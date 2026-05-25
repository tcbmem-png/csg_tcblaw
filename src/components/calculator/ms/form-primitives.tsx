/**
 * Shared input primitives for the MS calculator UI. Extracted from
 * inputs.tsx so the deviation walkthrough, structured sub-forms, and
 * comparison renderer can share the same look.
 */
import type * as React from "react";

export function fmt$(n: number): string {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function NumInput({
  value,
  onChange,
  placeholder,
  allowNegative,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  allowNegative?: boolean;
}) {
  const display = value === 0 ? "" : fmt$(value);
  return (
    <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
      <span className="mr-1 text-muted-foreground">$</span>
      <input
        type="text"
        inputMode="decimal"
        className="w-full bg-transparent text-right font-mono text-sm text-ink outline-none"
        value={display}
        placeholder={placeholder ?? "0"}
        onChange={(e) => {
          const cleaned = e.target.value.replace(
            allowNegative ? /[^0-9.\-]/g : /[^0-9.]/g,
            "",
          );
          const n = parseFloat(cleaned);
          onChange(isNaN(n) ? 0 : n);
        }}
      />
    </div>
  );
}

export function PlainNumInput({
  value,
  onChange,
  placeholder,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  max?: number;
}) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value === 0 ? "" : value}
      placeholder={placeholder ?? "0"}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        onChange(isNaN(n) ? 0 : n);
      }}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

export function Section({
  title,
  cite,
  children,
}: {
  title: string;
  cite?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-lg border border-rule bg-card p-6">
      <header className="mb-4 flex items-baseline justify-between gap-4 border-b border-rule pb-3">
        <h2 className="font-serif text-lg text-ink">{title}</h2>
        {cite && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {cite}
          </span>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-ink">{label}</div>
      {children}
      {help && <div className="mt-1 text-xs text-muted-foreground">{help}</div>}
    </label>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "relative h-5 w-9 shrink-0 rounded-full border transition-colors " +
          (checked
            ? "border-primary bg-primary"
            : "border-input bg-background")
        }
      >
        <span
          className={
            "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform " +
            (checked ? "translate-x-4" : "translate-x-0.5")
          }
        />
      </button>
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

export function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}

export function Radio<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            "rounded-md border px-3 py-1.5 text-sm transition-colors " +
            (value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-ink hover:bg-accent/40")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function RadioStack<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; help?: string }[];
}) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={
            "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors " +
            (value === o.value
              ? "border-primary bg-primary/5"
              : "border-input hover:bg-accent/30")
          }
        >
          <input
            type="radio"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink">{o.label}</div>
            {o.help && (
              <div className="mt-0.5 text-xs text-muted-foreground">{o.help}</div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
