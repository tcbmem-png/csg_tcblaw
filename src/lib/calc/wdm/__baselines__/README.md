# Worksheet Visual-Regression Baselines

This directory contains **locked baseline snapshots** of the on-screen
worksheet (`OfficialWorksheet`) rendered for each fixture in
`../__tests__/fixtures.ts`. They are produced by
`../__tests__/worksheet-baselines.test.ts` and asserted byte-for-byte on
every test run.

## What a baseline file represents

Each `*.html` file is the deterministic, server-rendered HTML output of
`OfficialWorksheet` for one fixture, captured *before* the WDM rewire
(Phase B). It is the reference the rewired component must reproduce.

Determinism is enforced by construction:

- `renderToStaticMarkup` — no hooks fire after render, no `useEffect`,
  no animation frames, no client-side state, no font loading, no network.
- `preparedOnDisplay` is hard-coded to a fixed date in the test setup.
- The fixture inputs are frozen at definition time; in-place edits are
  forbidden (add a new fixture instead — see `fixtures.ts`).

Same inputs → byte-identical baseline, on any machine, any OS, any time.

## When a baseline file changes

A baseline diff is **never** an automatic shadow update. It is a signal
that the rendered worksheet has materially changed for that fixture.

There are exactly two legitimate reasons for a baseline to change:

1. **An intentional UI change** — e.g. you reworded a label, restructured
   a section, or shipped a deliberate visual refinement.
2. **A regression** — an unintended change in render output. **Fix the
   code, not the baseline.**

### The update protocol

When a baseline test fails:

1. **Read the diff.** Vitest prints the exact byte difference. Confirm
   whether the change is intentional.
2. **If unintentional → fix the code** and re-run. Do not regenerate.
3. **If intentional → human approval required.** A baseline regeneration
   is a deliberate decision logged in the PR description. Document:
   - Which fixtures changed and why.
   - Who approved the visual change (initials + date).
   - Whether the change requires re-running the C1 AOC side-by-side
     review (any layout/section/value change does).
4. **Regenerate** with:
   ```bash
   bunx vitest run src/lib/calc/wdm/__tests__/worksheet-baselines.test.ts -u
   ```
5. **Commit the new baselines** in the same change as the code that
   produced them. Never commit baselines without the corresponding code
   change.

### What this is not

- It is **not** an auto-snapshot shadow that updates on every CI run.
- It is **not** a pixel-screenshot comparison. The artifact under test
  is rendered HTML structure; that's the surface that matters for a
  worksheet whose value is informational, not aesthetic. Pixel diffs
  would add font-rasterization flake without catching any failure mode
  that HTML diffs miss.
- It is **not** a substitute for the per-fixture unit assertions in
  `build.test.ts` (which lock data-model behavior). These baselines
  lock *rendered output*; the unit tests lock *computed values*.

## Adding a new fixture

1. Add an entry to `FIXTURES` in `../__tests__/fixtures.ts` (do not edit
   existing entries in place).
2. Run the baseline test once with `-u` to seed the new baseline file.
3. Visually inspect the new `.html` file before committing.
4. Commit both the fixture entry and its baseline in one change.

## Phase B note

These baselines are seeded against the **pre-WDM-rewire** worksheet.
After the Phase B rewire, the baseline assertion is the regression
gate: the rewired component must reproduce these exact bytes for every
fixture, or the rewire is not faithful.
