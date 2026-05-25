# Contributing

Thanks for your interest in improving the TN Child Support Guidelines Calculator.

## Ground rules

1. **Math correctness > everything else.** Every calculation change must ship
   with a Vitest fixture in `src/lib/calc/__tests__/` that locks in the
   expected number and cites the controlling subsection.
2. **Cite the rule.** New computed values or branches must add an entry in
   `src/lib/calc/citations.ts` pointing to the controlling subsection
   (e.g. `1240-02-04-.04(6)(b)`).
3. **No legal advice in copy.** UI text, tooltips, and the PDF must describe
   what the calculator does, not what a litigant should do.

## Bug reports for the math

Open an issue with:
- The exact inputs (gross incomes, # of children, parenting type, days, add-ons).
- The output your version produced.
- The output you expected, with a citation or worked example.

Stories 1–5 from the launch article are codified in
`src/lib/calc/__tests__/stories.test.ts` — if your bug overlaps one of those
scenarios, reference it by name.

## Local development

```bash
bun install
bun run dev
bunx vitest run             # full engine suite
bunx vitest run stories     # just the article scenarios
```

## Pull-request checklist

- [ ] `bunx vitest run` passes
- [ ] New math has a fixture + citation
- [ ] UI copy avoids "you should" / "the court will" phrasing
- [ ] No secrets, customer data, or production env values committed

## Reporting a security issue

Please email security@tcblaw.org rather than opening a public issue.
