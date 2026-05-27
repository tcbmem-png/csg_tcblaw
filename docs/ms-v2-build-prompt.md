# csg.tcblaw.org/ms — v2 Build Prompt for Lovable (Testing Mode)

You are building **v2** of the Mississippi Child Support Calculator at `csg.tcblaw.org/ms`. v1 is already deployed with the asynchronous two-attorney handoff machinery and the basic § 43-19-101 percentage calculation. v2 turns the deviation analysis into the centerpiece of the tool — a structured § 43-19-103 worksheet with side-by-side party positions, a chancellor's decision surface, and a cumulative-through-emancipation projection that makes the dollar magnitude of every disagreement visible.

The TN v2 build you just completed established the chassis (TanStack Start + Vite + Cloudflare Workers + shadcn + the database-first / audit-trail / template-render output pattern). MS v2 reuses that chassis. The differences are at the calculation model and at the UI of the deviation worksheet — not at the framework, the styling tokens, the route structure, or the operational posture.

Work in **testing mode**. Do not promote to production. Do not break v1's live deployment. Build v2 in a parallel branch / preview environment.

---

## 0. Sources of truth (read these first, in order)

1. **`/docs/ms-canonical-spec.md`** — the MS Canonical Spec (TCB Law DHS Guide for MS, `MS_Canonical_Spec_TCB_Law.md` attached). Eight sections covering the project charter, ten conventions §1.1–§1.10, the database schema, per-factor treatment for all ten § 43-19-103 factors, the calculation procedure, the output generation pipeline, validation notes, and source authorities. **This is the canonical for MS. Where v2 implementation differs from canonical, canonical wins.**

2. **`/docs/ms-williams-reference.html`** — the working reference for the Behind-the-Scenes output document (`MS_Deviation_Worksheet_Williams.html` attached). A fictional but realistic case showing exactly what the v2 deviation worksheet should look like and behave like when populated. The visual design, the interaction model, and the information hierarchy of this file are the target — the calculator should produce indistinguishable output with case-specific data substituted.

3. **`/docs/tn-calculator-v1-audit.md`** — the TN v1 audit from the prior cycle. Lovable should still have this. It confirms the shared chassis (stack, design tokens, route patterns, backward compatibility surface). Cross-reference for anything MS inherits from the shared codebase.

4. **The existing v1 repository** — including `src/lib/calc/ms/*`, `src/routes/ms*`, the existing MS test suite. Read but do not modify; v2 work happens in a new branch.

5. *(Optional, if you find it referenced in `.lovable/plan.md`)* the MS Deviation Handoff UX redesign spec from the prior cycle, which covers the workflow-side UX changes (5 moments, case-ID identity fix, receiving-side localStorage save-and-resume).

If any of (1), (2), or (3) is missing, stop and report. Do not invent values.

---

## 1. Phase 0 — MS-specific audit addendum (do this before any code)

Before writing v2 code, produce a brief MS-specific audit addendum at `/docs/ms-v1-audit-addendum.md`. This is shorter than the TN v1 audit was because most of the chassis is documented there already. Focus on what's MS-specific.

Cover:

1. **MS calc engine inventory.** Read `src/lib/calc/ms/*` and list every file with one-line summary. Identify which conventions in the MS canonical (§1.1–§1.10) are already implemented vs new vs partially implemented.

2. **MS UI inventory.** Read `src/routes/ms*` and the MS-specific components (if any exist under `src/components/calculator/ms/*` or co-mingled in `src/components/calculator/*`). What does the existing MS calculator look like today? Where does it diverge from the Williams reference HTML?

3. **MS share-link v3 schema, verbatim.** Dump the `MSSharePayloadV2 | MSSharePayloadV3` types from `src/lib/calc/ms/share.ts` exactly as written. Include the `s: "MS"` discriminator, the `h: HandoffState` field, any case-ID work already in flight.

4. **MS localStorage shapes, verbatim.** Confirm the `ms.handoff.origins` and `ms.handoff.draft.<caseId>` shapes from the TN v1 audit §9.4 are still accurate. Note any drift.

5. **MS test fixtures, verbatim.** Dump every test story from `src/lib/calc/ms/__tests__/calc.test.ts`, `handoff.test.ts`, `caseid-origin.test.ts`, `letter-mapping.test.ts`, `reconciliation.test.ts`, `share.test.ts` — inputs, expected line-by-line outputs, rationale comments preserved exactly. These become v2's math-equivalence acceptance criteria.

6. **Anything surprising.** Specifically: constants in `src/lib/calc/ms/data/constants.ts` (if it exists) — confirm the percentage table is 14/20/22/24/26%; confirm any thresholds, defaults, or carve-outs. Flag anything that contradicts the MS canonical's §1.1–§1.10 conventions.

After producing this addendum, **stop and confirm** before proceeding to v2 implementation. If everything is as expected and the canonical's conventions can be implemented without breaking v1's tests, proceed. If there's a surprise (a constant that doesn't match, an existing pattern that conflicts with a convention, a test fixture that v2's new mechanics would break), surface it for review.

---

## 2. v2 deltas vs v1 — at convention name level

The MS canonical spec details each convention. This section names them so the build prompt is complete on its own, with cross-references for the detail.

### Additions (net-new in v2)

| ID | Addition | Source |
|---|---|---|
| A1 | **Four-state factor classifier (§1.4)** | Each of the ten § 43-19-103 factors carries a status: `not_asserted`, `obligor_only`, `obligee_only`, `both_agreed`, `both_disagreed`. Drives the UI and the disagreement-gap calculation. See canonical §1.4. |
| A2 | **Verbatim position capture per factor (§1.5)** | Six fields per asserting party: narrative (verbatim), supporting facts, documentation refs, proposed monthly adjustment (signed), legal authority, attribution. Stored as authored; no paraphrase. See canonical §1.5. |
| A3 | **Cumulative-through-emancipation projection (§1.6)** | Average remaining months across all minor children, against the § 93-11-65 age-21 default with the four early-emancipation carve-outs. Sticky live-bar at top of document and reconciliation panel show this number. See canonical §1.6. |
| A4 | **Imputation as user-controlled scenario tool (§1.7)** | Twelve-factor structured form per § 43-19-101(5) (HB 1067, 2022). Toggle + imputed amount + 0–100% application percentage. Calculator never produces a "default imputed amount" — statutorily prohibited. See canonical §1.7. |
| A5 | **Incarceration suspension as first-class flow (§1.8)** | Auto-suspension by operation of law for 180+ day incarceration per § 43-19-36 (SB 2082, 2023). Three statutory carve-outs (§ 97-3-7, § 97-5-39, § 97-5-3). Means-to-pay exception. 60-day post-release resumption window. See canonical §1.8. |
| A6 | **Chancellor's decision surface per factor (§1.9)** | Per-factor button row: adopt obligor, adopt obligee, split difference, custom amount, decline. Live recalculation across sticky live-bar, reconciliation table, final order. See canonical §1.9. |
| A7 | **MS Deviation Worksheet PDF output** | Template-rendered "Statement of Child Support and § 43-19-103 Deviations" memorandum, with both parties' positions verbatim, factor-by-factor reconciliation, and chancellor's decisions (if any). Not an AOC fillable form — MS doesn't have an equivalent — so this is HTML-to-PDF via Puppeteer or similar. See canonical §5.1. |
| A8 | **MS Behind the Scenes HTML output** | Interactive companion document; the working reference is `ms-williams-reference.html`. Sticky live-bar, side-by-side party columns with statute verbatim, four-state status badges, per-factor decision surfaces, reconciliation table, authority footer. See canonical §5.2. |
| A9 | **MS Sensitivity HTML output** | Multi-column rendering for imputation application percentage (and optionally chancellor's-decision configurations). Transaction-and-rollback to keep canonical case state unpolluted. See canonical §5.3. |

### Modifications (v2 changes v1 behavior)

| ID | Modification | Source |
|---|---|---|
| M1 | **Case-ID identity for asynchronous handoff (§1.10)** | Add `caseId: string` to share payload root. Generated at first Send (UUID). Change `recordOriginatedHandoff` and `isOriginatorBrowser` to key off `caseId` rather than `fingerprint(inputs + caption)`. Existing share URLs without caseId fall back to fingerprint check. Required for round-trip flow to work when receiving attorney edits content. |
| M2 | **Receiving-side localStorage save-and-resume** | `ms.handoff.draft.<caseId>` shape captures in-progress receiving slate. On returning to URL in same browser, prompt "Continue from where you left off?". Removes "I closed the tab and lost my work" failure mode without breaking no-server-state. See canonical §1.10. |
| M3 | **AGI deduction enumeration (§1.1)** | Capture voluntary retirement separately from mandatory; only mandatory deducts. Capture in-home other children discretionary as user-entered with rationale (purely judicial discretion under (3)(d)). See canonical §1.1. |
| M4 | **Annual reading of the $10k/$100k thresholds (§1.2)** | Annual AGI, not monthly. Threshold triggers a required-finding flag on the output document. See canonical §1.2. |

### Removals / preservations

- **No removals.** v1 behavior is preserved everywhere v2 doesn't explicitly modify it.
- **Preserve the existing handoff state machine** (`none / originated / in_progress / completed`). The UX redesign from the prior cycle drives plain-English language from these states; the new conventions add to the document content without changing the state machine.
- **Preserve all design tokens, route patterns, and operational posture from the shared chassis.** No migration, no telemetry, no auth.
- **Preserve every passing MS test from v1.** New tests are added for the §1.4–§1.10 conventions; old tests must still pass unchanged.

---

## 3. Backward compatibility contract

v2 must read existing v1 user state without loss. Specifically:

1. **v1 MS share-link payloads (`?s=…`, `s: "MS"` discriminator, `v: 2 | 3`)** must decode and load into v2's UI. v2 bumps to `v: 4` on encode to add `caseId` and the new factor-position fields with explicit defaults. v3 readers will reject `v: 4` payloads — acceptable, but v2 must emit a `v: 3`-compatible projection when no new fields are populated, so existing bookmarks continue to work.

2. **v1 MS localStorage keys** (`ms.handoff.origins` legacy `fp:<fingerprint>` shape) continue to be readable by v2. v2 writes new entries under `case:<caseId>` keys. On read, v2 tries `case:<caseId>` first, falls back to `fp:<fingerprint>` for legacy URLs.

3. **v1 MS test suite** must continue to pass unchanged. Add new tests; do not modify existing fixtures unless an existing test reflects a bug v2 is fixing (rare; surface for review before doing this).

4. **Cross-state isolation.** TN routes (`/tn`, `/tn/about`, etc.) must continue to behave identically. The TN v2 build that just landed must not regress. Run TN tests after MS v2 work; confirm zero TN regressions.

5. **Email / unsubscribe infrastructure** under `src/routes/email/*` and `src/routes/unsubscribe.tsx` is out of MS v2 scope. Do not touch.

---

## 4. Implementation order (recommended)

Build in this order so the project compiles and tests pass at every checkpoint:

1. **Constants and percentage table (§1.1, §1.2).** Confirm or add `src/lib/calc/ms/data/constants.ts` with the 14/20/22/24/26% percentage table. Confirm the AGI deduction enumeration handles voluntary-vs-mandatory retirement and the discretionary in-home other children. Add tests covering the Williams reference case ($23,000 AGI × 20% = $4,600 presumptive; $100,000 annual threshold triggers required-finding).

2. **Four-state factor classifier (§1.4).** Add `factor_status` enum, `ms_factor_assertion` table (or equivalent in-memory shape), and the UI primitive that renders the four states with the visual treatment from the Williams reference. Existing tests must still pass.

3. **Per-factor position capture (§1.5).** Add `ms_factor_position` table/shape with the six fields per asserting party. Add the side-by-side column UI for the factor card (obligor on left, obligee on right, statute verbatim in the middle). The statute text comes from the `ms_factor_statute_text` reference table in canonical §2.

4. **Cumulative-through-emancipation projection (§1.6).** Add the `ms_child` table with emancipation status enum and the `ms_cumulative_months` function. Wire to the sticky live-bar at the top of the document.

5. **Chancellor's decision surface (§1.9).** Add the five-option decision row per factor. Wire the live recalculation: every decision change updates the live-bar, the reconciliation table, the final order. The Williams reference shows exactly how this looks and behaves.

6. **Imputation framework (§1.7).** Add `ms_imputation_override` table with the twelve § 43-19-101(5) factor fields. Add the toggle + amount + application-percentage slider UI. Render the twelve-factor structured form when imputation is active.

7. **Incarceration suspension (§1.8).** Add `ms_incarceration_status` table with the carve-out enum and means-to-pay flag. Add the `ms_suspension_applies` function and wire the gate into the calculation procedure. When active, the obligation is $0 with the statutory finding language auto-generated.

8. **Case-ID identity fix (§1.10 / M1).** Add `caseId` to share payload v4 schema. Update `recordOriginatedHandoff` and `isOriginatorBrowser` to key off caseId. Add the legacy fingerprint fallback. Add a test that verifies round-trip detection survives content changes.

9. **Receiving-side localStorage save-and-resume (§1.10 / M2).** Add `ms.handoff.draft.<caseId>` write on every edit (debounced). Add the "Continue from where you left off?" prompt on URL re-open. Add a test verifying save and resume.

10. **MS Deviation Worksheet PDF output.** Build the HTML-to-PDF template and the render function. Match the structure from the Williams reference. Render against a stipulated test case (Williams) and verify the PDF contains the expected positions, statute texts, and final order.

11. **MS Behind the Scenes HTML output.** The Williams reference is the target. Render it against the Williams test data via the template engine and verify it matches the reference visually and behaviorally.

12. **MS Sensitivity HTML output.** Optional output; produces the imputation sensitivity table when § 1.7 is active.

13. **Run the full test suite** — MS tests new and old, TN tests, shared chassis tests. Confirm zero regressions on TN.

14. **Document v2-changelog and v2-decisions** under `/docs/ms-v2-changelog.md` and `/docs/ms-v2-decisions.md`.

15. **Promote out of testing mode** — only after acceptance criteria below all pass.

---

## 5. Acceptance criteria (testing-mode promotion gate)

v2 may not be promoted out of testing mode until all of the following pass:

1. **Phase 0 audit addendum produced and approved.** No surprises that would invalidate the canonical's conventions.

2. **MS math equivalence with v1.** Every test story from v1's MS test suite passes against v2's engine. No fixture modifications unless explicitly flagged.

3. **New convention tests pass.** Coverage for §1.1 (voluntary-retirement non-deduction; in-home discretionary), §1.2 (annual threshold flag), §1.4 (four-state classifier), §1.6 (cumulative-through-emancipation with multi-child average), §1.7 (twelve-factor imputation; application-percentage blend), §1.8 (incarceration suspension; carve-outs; means-to-pay), §1.9 (decision surface; live recalculation), §1.10 (case-ID identity; legacy fingerprint fallback; localStorage save-and-resume).

4. **Williams reference case verification.** With the inputs documented in the canonical §6.1 / the Williams HTML (obligor $35k/mo, obligee school counselor, 2 children ages 14 and 10, 50/50, factors a/e/g/h/i/j as documented), v2 produces:
   - Presumptive: $4,600/month
   - Final order under default chancellor decisions (split a, adopt obligee e, split g, adopt obligee h, accept agreed i, decline j): $2,800/month
   - Cumulative through emancipation at default decisions: $302,400 (108 months avg × $2,800)
   - Final order at all-decline (no deviations): $4,600/month
   - Final order at all-adopt-obligor (maximum reductions): $1,000/month
   - The 0/25/50/75/100% imputation sensitivity range matches the Williams reference (no imputation in baseline; sensitivity shown only if § 1.7 is engaged)

5. **Backward compatibility holds.** An existing v1 MS share link (`?s=...` with v2 or v3 payload) loads into v2 correctly. localStorage state from v1 (`ms.handoff.origins` legacy `fp:<fingerprint>` keys) restores correctly. v1 → v2 → v1 round trip preserves all v1 fields.

6. **TN regression check passes.** Every TN test, every TN reference case (Berger), every TN deployment artifact still works.

7. **Output triplet renders.** PDF, Behind-the-Scenes HTML, and (where applicable) Sensitivity HTML produced for the Williams reference case. PDF visually mirrors the Williams HTML structure; HTML interactive controls work; Sensitivity HTML reflects realistic ranges.

8. **Performance budget.** Initial page load on `/ms` under 2.5s on throttled 4G; subsequent route transitions under 500ms; calculator response (input change → updated result) under 100ms.

9. **Accessibility AA on every MS route.** axe-core run produces zero AA violations on `/ms`, `/ms/about`, `/ms/how-it-works`, `/ms/how-it-works/income`.

10. **Zero analytics / zero telemetry baseline preserved.** No new external integrations introduced.

---

## 6. Operational notes

- **Convention versioning.** The canonical spec is "TCB Law MS Canonical v1.0" per canonical §0. If v2 implementation requires deviating from a canonical convention, that deviation must be documented as a v1.1 (or v2.0) of the canonical spec, not as a v2 implementation quirk. Canonical first; implementation tracks it.

- **Statute version stamps.** The current relevant statutes are pinned in canonical §0: § 43-19-101 (HB 1067 active 2022-07-01), § 43-19-36 (SB 2082 active 2023-07-01), § 93-11-65 (age-21 default). If a statute amends during v2 work, surface for review.

- **Multi-state symmetry where applicable.** v2's `produce_outputs()` pipeline (PDF + Behind-the-Scenes + Sensitivity) should mirror the TN v2 architecture as closely as the calculation difference allows. Shared chassis means shared output infrastructure; the templates differ but the rendering pipeline is the same.

- **Do not modify TN code.** MS v2 is in a parallel branch from TN v2. Any shared-chassis change (styles.css, site-chrome, etc.) requires both TN and MS regression checks.

- **The user's prior MS Handoff UX redesign spec** (if you find it referenced) covers the workflow-side UX changes — the 5 moments, the rewritten dialog copy, the action panel that swaps content by state. Those changes complement this build prompt; do them in the same v2 cycle.

---

## 7. Expected deliverables

When you finish, produce:

1. **A working MS v2 deployment** at a preview URL (Cloudflare Workers preview / Pages preview).
2. **`/docs/ms-v1-audit-addendum.md`** — the Phase 0 audit from §1.
3. **`/docs/ms-v2-changelog.md`** — every change vs v1, organized by addition / modification / preservation taxonomy from §2.
4. **`/docs/ms-v2-decisions.md`** — every place v2 made a judgment call (especially where the audit was undetermined or where canonical was silent).
5. **A passing test run** — full MS suite (existing + new §1.4–§1.10 tests) + full TN regression.
6. **A side-by-side demo of the Williams reference case** showing the deviation worksheet output (HTML), the deviation worksheet PDF, and the final order at the default decisions matching the canonical's §6.1 verification numbers.

---

*This prompt + the MS canonical spec + the Williams reference HTML + the TN v1 audit (cross-reference) are the complete MS v2 specification. Anything not in these documents is implementation discretion. Where implementation discretion conflicts with the spec, the spec wins; where the spec is silent, judgment is yours; where judgment is exercised, document it under `/docs/ms-v2-decisions.md`.*

*The chancellor's discretion under Mississippi law is preserved at every step. The calculator structures the analysis; the chancellor rules. v2's job is to make the analysis structured enough that the chancellor's discretion can be exercised on a clean record.*
