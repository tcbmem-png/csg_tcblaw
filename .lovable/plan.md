## Goal

Swap the two-card state grid on `/` for an interactive US tile-grid map driven by a single state registry. Keep hero, "Why this exists", footer, and existing design tokens unchanged. No live deploy — preview only.

## 1. Single source of truth: `src/lib/states.ts`

New file. Exports:

- `StateStatus = "available" | "coming_soon" | "planned"`
- `StateEntry { code, name, model?, cite?, status, route?, tile: [col, row] }`
- `STATES: StateEntry[]` — all 50 + DC? (DC omitted unless asked; 50 only per spec)
- Initial statuses:
  - `available`: TN (`/tn`, Income Shares, `Tenn. Comp. R. & Regs. 1240-02-04`), MS (`/ms`, Statutory percentage, `Miss. Code Ann. § 43-19-101`)
  - `coming_soon`: AR, LA, AL, GA, FL (with model + cite text from forthcoming work; AR already has a stub at `/ar` — see Open question)
  - `planned`: the other 43
- Tile coordinates exactly as specified in the prompt
- Helpers: `getStateByCode`, `getStateByRoute`, `detectState(pathname): StateEntry | null` (replaces the hardcoded TN/MS switch in `site-chrome.tsx`)
- `STATE_SITEMAP_ENTRIES`: derived list of `{ path, priority }` for every `available` state, consumed by `sitemap[.]xml.ts`

## 2. Tile-grid map component: `src/components/home/state-tile-map.tsx`

- Inline SVG, 11 cols × 8 rows, computed from `STATES[*].tile`. No mapping library.
- Each tile: rounded `<rect>` + centered mono `<text>` (2-letter code).
- Fills via new semantic tokens added to `src/styles.css` (so they stay in the design system, not hex-in-component):
  - `--state-available` (muted earthy green, tuned against cream — start `#3E6B4F`, verify WCAG AA for the white code text)
  - `--state-coming` (warm ochre — start `#C68A3C`; reuse existing `--accent` if contrast holds)
  - `--state-planned` (`#DAD5CA`-equivalent on cream)
  - Plus `-foreground` pair for each
- Available/coming tiles render as focusable `<a>` (SVG `<a xlink:href>`) with `aria-label="Tennessee — open calculator"` etc.; planned tiles render as inert `<g aria-hidden>` with the code visible.
- Hover/focus on available + coming → `transform: scale(1.15)` with `transform-origin: center`, transition ~120ms; planned tiles do not transform.
- Detail panel: a fixed-height region next to/under the map (so layout doesn't jump) showing the focused/hovered state's name, model, cite, and action:
  - available → "Open calculator →" linking `route`
  - coming_soon → "Coming soon — file an issue" → GitHub issues URL (or `/ar`-style stub route if one exists; see Open question)
  - planned → "Planned."
- Status conveyed beyond color: small status glyph or label in the detail panel + the legend, so screen readers and color-blind users get the state without relying on fill alone.
- Legend below the map: three swatches with text (Available now / Coming soon / Planned).

## 3. Accessible + crawlable list: `src/components/home/state-list.tsx`

- Real text list generated from `STATES`, grouped by status (Available / Coming soon / Planned).
- Available rows: `<a href="/xx">State name</a>` + model + cite.
- Coming/planned rows: text with cite where known.
- Always rendered. On viewports `< md`, list appears first and the map is hidden or shown below; on `md+`, map first, list second. (Both stay in the DOM for SEO + screen readers.)

## 4. Wire the homepage: edit `src/routes/index.tsx`

- Keep the hero section and "Why this exists" section verbatim.
- Replace the `<section>` containing the two `StateCard`s with `<StateTileMap />` + `<StateList />`.
- Delete the now-unused `StateCard` component from this file.
- Update `head()` description to reflect 50-state direction (TN + MS live, Southeast in progress) while staying under 160 chars.

## 5. Thread the registry through existing surfaces

- `src/components/site-chrome.tsx`: replace inline `detectState` with the registry helper. Header state links continue to show TN + MS only (the only `available` states with routes today); when a new state flips to `available`, decide whether to list it in the header — for v1, keep the header static (TN, MS, About) to avoid overflow; the map is the discovery surface. *(Confirm in Open questions.)*
- `src/routes/sitemap[.]xml.ts`: replace the hardcoded TN/MS path block with `STATE_SITEMAP_ENTRIES` (keeps the `/tn/how-it-works` etc. sub-paths static — those don't belong in the state registry).

## 6. Tests

- `src/lib/__tests__/states.test.ts`:
  - Exactly 50 entries, codes unique, tiles unique
  - Every `available` has `route` + `model` + `cite`
  - `detectState("/tn")`, `detectState("/tn/how-it-works")`, `detectState("/ms")`, `detectState("/")`, `detectState("/ar")` behave correctly
  - Sitemap entries include `/tn` + `/ms` and exclude `coming_soon`/`planned`

## 7. Out of scope (explicit)

- No "notify me" / email capture.
- No changes to TN or MS calculator code, routes, PDFs, or tests.
- No new dependencies.
- No Publish — preview only; report URL back.

---

## Open questions

1. **AR already has a stub route at `/ar`.** For `coming_soon` tiles, should the detail panel's CTA link to that stub when present (so AR opens its existing roadmap page, others link to GitHub issues), or uniformly go to GitHub issues per the spec? Default if you don't answer: link to the stub route when one exists, GitHub issues otherwise.
2. **Header nav.** Keep header at "Tennessee / Mississippi / About / Open source / TCB.Law" for v1, or add the 5 coming-soon Southeast links? Default: keep as-is; the map is the discovery surface.
3. **DC + territories.** Spec says "50 states." Default: 50 only, no DC, no PR/GU/etc.
