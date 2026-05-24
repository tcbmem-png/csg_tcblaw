# TN Child Support Calculator

An open-source implementation of the **Tennessee Child Support Guidelines**
(Tenn. Comp. R. & Regs. Chapter 1240-02-04 — Income Shares Model), built by
**TCB Law, PLLC**. Produces an official-style worksheet suitable for
negotiation or filing, plus an Imputed-vs-Actual comparison for cases where
income imputation is in dispute.

> **Schedule effective:** 2021-10-01 (current TN DHS schedule)
> **Status:** v1.0 — calculator only, no auth, no persistence beyond the URL.

---

## What it does

- **Full Income Shares calculation** under Rule 1240-02-04, including:
  - AGI with self-employment-tax, prior-support, and in-home-children credits
  - Schedule lookup (rounded up per rule) and **above-cap formula** for
    combined AGI above $28,250/mo
  - Parenting-time bands: standard (80 days), equal (182.5/182.5 cross-credit),
    and the variable-multiplier reduction/increase bands
  - Mandatory add-ons: health insurance, recurring uninsured medical (pro-rata),
    work-related childcare
  - Deviations: private-school tuition and the **special-expenses 7% rule**
  - Self-Support Reserve floor
  - Statutory PCSO ceiling warning per T.C.A. § 36-5-101(e)(1)(B)
- **Official-style worksheet** with case caption, line numbers, rule citations,
  print-to-PDF.
- **Imputed vs Actual comparison** with cumulative-through-age-18 projection,
  plus a printable appendix on the worksheet PDF.
- **Shareable URL** — full inputs + caption are encoded into `?s=…` so any
  scenario can be emailed or pasted into a brief.

## What it deliberately does not do

- No login, accounts, or saved cases. The URL is the document.
- No fee estimates, payment processing, or attorney directory.
- No advice. This is a calculator. Consult a licensed Tennessee attorney.

---

## Tech stack

- **TanStack Start v1** (React 19, SSR, file-based routing) on Vite 7
- **Tailwind v4** via `src/styles.css` with OKLCH design tokens
- **shadcn/ui** primitives
- **Recharts** for the cumulative-support chart
- Cloudflare Worker runtime (no Node backend); fully static for v1

## Project layout

```
src/
├── lib/calc/                Pure calculation engine (no React imports)
│   ├── calc.ts              Top-level calculate(inputs) -> outputs
│   ├── bcso.ts              Schedule lookup + above-cap formula
│   ├── scenarios.ts         Imputed-vs-Actual scenario pair
│   ├── share.ts             URL encode/decode for shareable links
│   ├── data/
│   │   ├── constants.ts     Versioned constants (effective date, caps, SSR…)
│   │   └── schedule-2022.ts Official TN DHS schedule
│   └── __tests__/calc.test.ts
├── components/calculator/   UI: inputs, sidebar, worksheet, comparison
├── components/site-chrome.tsx
└── routes/                  index, calculator, how-it-works, about
```

The calc engine in `src/lib/calc/` has zero React dependencies — it is unit-
tested against the TN DHS Excel worksheet within $1.

## Development

```bash
bun install
bun run dev     # http://localhost:8080
bun run test    # vitest — runs the rule-conformance suite
bun run build
```

## Updating the schedule

The schedule and constants are versioned in `src/lib/calc/data/`. When TN DHS
publishes a new schedule:

1. Replace `schedule-2022.ts` with the new rows (keep the same shape).
2. Bump `CONSTANTS_EFFECTIVE_DATE` in `constants.ts` and any changed caps,
   percentages, or SSR amounts.
3. Run `bun run test` — the conformance suite will surface any rows that no
   longer match expected outputs.
4. The footer badge and worksheet header pick up the new date automatically.

## License & disclaimer

MIT-licensed. Provided as-is, **not legal advice**, and **not a substitute for
counsel**. TCB Law, PLLC offers no warranty that the calculation matches the
result a Tennessee court will reach in any specific case.
