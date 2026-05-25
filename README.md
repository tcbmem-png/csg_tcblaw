# Tennessee Child Support Guidelines Calculator

An open-source, web-based presumptive child-support calculator implementing the
**Tennessee Child Support Guidelines** (Tenn. Comp. R. & Regs. ch. 1240-02-04)
and a companion **Mississippi** statutory-percentage worksheet
(Miss. Code Ann. § 43-19-101).

**Live calculator:** https://csg.tcblaw.org

Built and maintained by [The Carter Bowman Firm, PLLC](https://tcblaw.org).
Free to use, including downloadable PDF worksheets. No login, no gate.

---

## What it does

- Computes the **Basic Child Support Obligation (BCSO)** from the 2022 DHS
  schedule, including the above-cap formula for combined AGI > $28,250/mo.
- Applies the **Parenting-Time (PT) adjustment** for standard and 50/50
  arrangements, including the cross-credit method for equal parenting.
- Adds **health insurance, work-related child care, recurring medical,** and
  **private school** as additional expenses with the correct pro-rata split.
- Flags the **statutory maximum PCSO** by number of children
  (1240-02-04-.07(2)(c)) and surfaces deviation language when exceeded.
- Generates a printable **PDF worksheet** matching the structure of the
  official TN CS-101 / CS-102.

Every line of math cites the controlling regulation in
[`src/lib/calc/citations.ts`](src/lib/calc/citations.ts).

## Disclaimer

This is an **informational tool, not legal advice.** The output is a
presumptive estimate; actual orders depend on findings of fact, deviations,
and trial-court discretion. Use of this calculator does not create an
attorney-client relationship.

---

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7) on
  Cloudflare Workers
- TypeScript (strict), Tailwind CSS v4, shadcn/ui
- Vitest for the calculation engine
- Supabase (managed via Lovable Cloud) for optional opt-in features

## Run locally

```bash
bun install
bun run dev          # http://localhost:8080
bunx vitest run      # run the calculation test suite
```

The calculator engine in `src/lib/calc/` runs entirely in the browser; no
backend is required to compute or print a worksheet.

## Deploy

The project deploys to Cloudflare Workers via the TanStack Start Vite plugin:

```bash
bun run build
```

To self-host, point any static/edge host that supports `@cloudflare/vite-plugin`
output at the build artifact, or fork and deploy via Lovable / Cloudflare /
your platform of choice.

## Repository layout

```
src/lib/calc/             Pure calculation engine (TN)
  bcso.ts                 2022 DHS schedule + above-cap formula
  calc.ts                 PT adjustment, cross-credit, add-ons, PCSO cap
  citations.ts            Rule citations for every line of math
  __tests__/              Vitest fixtures (Stories 1–5 + edge cases)
src/lib/calc/ms/          Mississippi statutory-percentage worksheet
src/components/calculator/ React UI + PDF rendering
src/routes/                File-based routes (TanStack Router)
```

## Rule-citation framework

Every computed value carries a citation to its controlling rule
(`src/lib/calc/citations.ts`). When the guidelines change, edit the citation
constant and the BCSO table in `src/lib/calc/data/` — the UI and PDF inherit
the update automatically. The test suite locks the math at named scenarios
(see `__tests__/calc.test.ts` and `__tests__/stories.test.ts`).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports for the math are especially
welcome — please include the exact inputs and the expected vs. actual result.

## License

[MIT](LICENSE). Includes a non-legal-advice disclaimer.
