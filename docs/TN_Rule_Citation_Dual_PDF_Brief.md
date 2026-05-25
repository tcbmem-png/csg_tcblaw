# TN Rule Citation & Dual PDF Output — Build Brief

*For Lovable. The Tennessee article makes a load-bearing claim: “Every formula is annotated with the rule that authorizes it.” This brief verifies that the deployed calculator delivers on that claim across every field and computation, surfaces any gaps, and adds a dual-PDF output that lets practitioners file a clean AOC-format worksheet alongside our annotated explanatory version. The backend implementation is left to Lovable’s judgment.*

## What This Is and Why It Matters

The article describes our calculator as transparent in a specific, structural way: every dollar number on the worksheet, every threshold engaged, every rule applied, traces back to a visible citation. A practitioner reading the worksheet can see not just *what* the calculation produced but *why* — which rule, which paragraph, which case authority. A chancellor reviewing the worksheet can audit the calculator’s interpretation against the actual rule text. A pro se litigant who wants to understand their order can follow the citation chain back to the source.

This is the article’s central credibility claim. If a practitioner opens the calculator, generates a worksheet, and finds an unattributed number anywhere on the page, the claim fails.

The testing agent’s audit confirmed that the citation framework exists in `src/lib/calc/citations.ts` and covers most of the major computational lines. But it confirmed this by code inspection, not by inspecting a generated PDF. The worksheet output itself has not been visually verified for citation density. There may be fields the citation file covers correctly. There may be fields it covers superficially. There may be fields it does not cover at all. We need to know which.

Beyond verification, the brief adds a deliverable the article also references: a dual PDF output. Practitioners filing in chancery court need a clean worksheet that matches what the chancellor expects to see — the AOC-recognized format. Practitioners using the calculator for mediation or negotiation need our richer annotated version that shows every rule and every derivation. The same calculation should produce both, with the numbers reconciling line-by-line between them.

## Part One — Verify and Complete the Citation Framework

### The Standard

Every dollar number, threshold, percentage, or categorical determination on the worksheet must have a visible citation. The citation should appear next to the number or in a way that’s unmistakably linked to it. The citation must be specific enough that a practitioner can verify the rule text — not just “Rule .04” but “Rule .04(7)(b)(2)(i)” or “Rule .04(3)(a)(2)(iii)” with the exact paragraph that authorizes the determination.

### Audit and Inventory

Walk through the worksheet output and produce, for each computed line, an inventory entry showing:

1. The line label (e.g., “Line 4 — Basic Child Support Obligation”)
1. The computation rule the calculator applies (e.g., “Schedule lookup at combined AGI; above-cap formula engages above $28,250”)
1. The rule citation currently displayed (e.g., “Rule .09” or whatever the citation file currently provides)
1. The correct citation (e.g., “Rule .09(2)(a) for schedule lookup; Rule .09(2)(d) for above-cap formula with rates verified against SCHEDULEEXTENSION cells H4:L8”)
1. Whether the current citation matches the correct citation

For each line where the citations differ, fix the citation. For each line where no citation currently appears, add one.

The lines that must have citations include but are not limited to:

- **Line 1 — Monthly Gross Income.** Rule .04(3) generally; sub-citation depends on the source. W-2 employees: .04(3)(a). Self-employment: .04(3)(a) with .04(5) for self-employment tax credit. Variable income: .04(3)(a). Federal benefits to child: .04(3)(b). Imputed income: .04(3)(a)(2) with sub-paragraph depending on the imputation basis. Carve-outs: .04(3)(a)(2)(iii) for incarceration, .04(3)(a)(2)(iv) for means-tested.
- **Line 2 — Adjustments to Gross Income.** Self-employment tax credit at .04(5)(a). Credits for other in-home children at .04(5)(b)(1). Credits for not-in-home children at .04(5)(b)(2).
- **Line 3 — Adjusted Gross Income.** Pro-rata percentage at .04(6)(b).
- **Line 4 — Basic Child Support Obligation.** Schedule lookup at .09 generally; .09(2)(a) for within-schedule; .09(2)(c) for combined AGI table reading; .09(2)(d) for above-cap with the rate table (6.81/7.22/7.77/8.05/8.66%).
- **Line 5a/5b — Parenting Time Adjustment.** Rule .04(7)(a) for ≤68-day threshold (downward adjustment, ARP). Rule .04(7)(b) for ≥92-day threshold (variable multiplier). Rule .04(7)(b)(2)(i) for 50/50 cross-credit formula. The 68/92/182.5-day constants per .04(7)(h)-(i).
- **Line 6 — Adjusted BCSO.**
- **Line 7 — Pro-Rata BCSO per parent.**
- **Line 8 — Additional Expenses (Add-ons).** Health insurance at .04(8)(b). Work-related childcare at .04(8)(c). Recurring medical at .04(8)(d). Special expenses with 7% threshold at .07(2)(d). Extraordinary educational expenses at .07(2)(d).
- **Line 9 — Presumptive Child Support Order.**
- **Line 10 — Statutory PCSO Cap Check.** § 36-5-101(e)(1)(B) for the statutory presumptive maximum with the $2,100/$3,200/$4,100/$4,600/$5,000 table for 1-5 children. Cross-reference to Rule .07(2)(b). Case law citations: *Nash v. Mulle*, 846 S.W.2d 803 (Tenn. 1993); *Richardson v. Spanos*, 189 S.W.3d 720 (Tenn. Ct. App. 2005); *Smallman v. Smallman*, 689 S.W.3d 845 (Tenn. Ct. App. 2023). When the cap is exceeded, the worksheet should display both the rule citation and a brief note about the case-law standard for upward deviation.
- **Line 11 — Self-Support Reserve.** Rule .04(12) with the 90% of FPL standard. The SSR-shaded area of the schedule is encoded in the seventh column of each schedule row; when the SSR engages, the worksheet should note both the rule citation and that the row was shaded.
- **Line 12 — Final Child Support Order.** Citation depends on what’s been applied. If no deviations, the FCSO equals the PCSO (no additional citation needed). If a deviation has been applied, cite Rule .07 with the specific sub-paragraph for the deviation basis (.07(2)(a) through .07(2)(d) as applicable).

### Categorical Determinations Also Need Citations

Beyond dollar numbers, the worksheet displays categorical choices that need rule support:

- **The income basis selected** (W-2 Box 5, monthly gross direct entry, imputed, etc.). Cite the rule paragraph that defines the chosen basis.
- **The parenting time mode** (standard, 50/50, split parenting, non-parent caretaker). Cite the rule paragraph defining the applicable mode.
- **Whether SSR is engaged** (yes/no). Cite Rule .04(12) and note the shaded-area determination.
- **Whether the statutory cap is exceeded** (yes/no). Cite § 36-5-101(e)(1)(B).
- **Whether means-tested income produces a zero order** (when applicable). Cite Rule .04(3)(a)(2)(iv).
- **Whether incarceration or military carve-outs apply** (when applicable). Cite Rule .04(3)(a)(2)(iii).
- **Each add-on type displayed** (health insurance, childcare, medical, special expenses). Cite the rule paragraph for that add-on.

### The User-Facing Citation Display

Two places where citations appear:

**On the worksheet PDF.** Each computed line displays its citation immediately to the right of the dollar number, in a smaller font. Format: *“Line 4 BCSO: $6,043 — Tenn. Comp. R. & Regs. 1240-02-04-.09(2)(d) (above-cap formula).”* The reader sees both the number and the rule basis in one glance.

**Hyperlink policy.** Each rule citation links to the TN Secretary of State’s hosted chapter PDF at the chapter level (current URL: <https://publications.tnsosfiles.com/rules/1240/1240-02/1240-02-04.20231215.pdf>, or whatever the current published version URL is at implementation time). Do not attempt to deep-link to individual paragraphs — the URL structure doesn’t support stable paragraph-level anchoring. Case citations (Nash, Richardson, Spanos, Smallman) display as plain text; if a stable, free-to-access source (Justia, Google Scholar) is available, link there, otherwise plain text is fine.

**In the interactive UI.** Each computed value in the result sidebar and the worksheet view should have a small “ⓘ rule” indicator next to it. Clicking or hovering the indicator surfaces a tooltip with the full citation text and a link to the rule. For mobile users where hover is unavailable, the indicator becomes a tap target.

The interactive UI citation indicator is small (testing agent’s nit D-2). It doesn’t compete with the dollar number for visual weight. It rewards the user who wants to verify without distracting the user who just wants the answer.

### What This Pass Should Produce

By the end of this work:

1. A complete inventory of every computed line on the worksheet, with the citation it currently displays and the citation it should display, saved as `docs/TN_Citation_Inventory.md` in the repo. If any line has no rule basis (it’s practitioner input, not a rule application), label it explicitly — don’t fabricate a citation.
1. The citation file (`src/lib/calc/citations.ts`) updated to ensure every line has its correct, specific citation
1. The worksheet rendering updated so every citation appears next to its corresponding number
1. The interactive UI updated so every result has a citation indicator with the chapter-PDF hyperlink behavior described above
1. A programmatic test (`src/lib/calc/tn/__tests__/citations.test.ts`) that walks the structured worksheet output and asserts every numeric cell has an associated entry in `citations.ts`. This is the test that mechanically enforces the article’s “every formula annotated” claim — and the test that would have caught the MS factor letter regression two cycles ago, where the regressed labeling passed code review because the verification was a human reading a PDF. CI should fail if a new line is added without a citation.

**Share-URL stability.** Citation changes (e.g., upgrading `.04` to `.04(7)(b)(2)(i)`) are annotation-only and do not affect math. Existing share URLs must remain valid. Do NOT write a `migrateCitations` function or any state-rewriting migration. If a stored share URL was generated with citation format `.04` and the new code displays `.04(7)(b)(2)(i)`, the displayed citation just upgrades on render — no state mutation, no migration, no risk of destroying past worksheets the way the MS `migrateSlate` did. The Phase 2 share schema’s `v: 1`/`v: 2` round-trip discipline is the pattern to follow.

If any line cannot be cited because no rule supports it, that’s its own finding — flag the line and we’ll decide whether to remove it from the worksheet, label it as practitioner-supplied, or research further.

## Part Two — Dual PDF Output

### The Standard

A practitioner using our calculator should be able to generate two PDFs from the same calculation:

1. **The AOC-format worksheet.** Clean, no annotations, mirrors the structure and labels of the official AOC Child Support Worksheet (forms CS-101 / CS-102) that gets filed in chancery court. (“Form 1240-2-4-.08” is the rule citation that requires a worksheet, not the form itself — the AOC’s actual filing forms are CS-101 and CS-102.) Suitable for filing as-is, attached to a motion or temporary support order.
1. **The annotated TCB Law worksheet.** The richer version that the calculator currently produces, with rule citations on every line, the methodology appendix, the income source line, the deviation narrative, the imputation comparison appendix, and any other explanatory content the calculator generates.

The numbers must reconcile line-by-line between the two. Line 4 BCSO on the AOC version equals Line 4 BCSO on the annotated version. Line 10 PCSO matches. Final order matches. A chancellor comparing the two documents should see the same case in two presentations.

### Why Dual Output

A practitioner filing a chancery court motion needs the AOC format because that’s what the court expects. The clerk’s office checks the form against the AOC’s recognized template. A custom worksheet with extra commentary may not be accepted as the filing-form worksheet.

A practitioner preparing a mediation packet, briefing a client, or arguing a deviation needs the annotated version because that’s where the value is. The rule citations let the parties verify the calculation. The methodology appendix documents the income determination. The imputation comparison quantifies the dispute.

Currently the calculator produces only one PDF, which is a hybrid — close to the AOC format but with additional explanatory content that may not be appropriate for filing. The hybrid is acceptable for mediation but creates friction for filing. The dual-output structure solves both use cases.

### What the User Experiences

In the worksheet view, two buttons:

- **“Download AOC-format worksheet (filing-ready)”** — generates the clean version
- **“Download annotated worksheet (full analysis)”** — generates the richer version

Both buttons are equally prominent. Neither is gated behind anything. Both are free.

A small note next to the buttons: *“Both worksheets reflect the same calculation. The AOC-format version matches the official Tennessee Child Support Worksheet for court filing. The annotated version adds rule citations, methodology documentation, and explanatory analysis suitable for mediation, negotiation, or client briefing.”*

### What Goes in the AOC-Format Version

The AOC Child Support Worksheet has a specific structure:

- **Part I — Identification.** Case number, court, parties’ names, attorneys, children with dates of birth.
- **Part II — Adjusted Gross Income.** Lines 1-3 with parent A and parent B columns.
- **Part III — Parents’ Share of BCSO.** Lines 4-7.
- **Part IV — Additional Expenses.** Line 8 sub-lines.
- **Part V — Presumptive Child Support.** Line 9.
- **Part VI — Deviations and Final Order.** Line 10-12 with signature block.

The AOC format uses specific column headers (“Column A — Parent A,” “Column B — Parent B,” “Column C — Combined”), specific line numbering, and specific terminology. The PDF should match these exactly.

Citations on the AOC-format version: minimal. The form does have small rule-citation footnotes next to certain line labels in the official version; we should match those exactly. We should NOT add the rich citation density that goes on the annotated version. The AOC form’s restraint on citations is intentional — it’s a filing form, not an explanatory document.

The AOC-format version should be ready to print, sign, and file in a chancery district. Letter size, standard margins, signature lines at the bottom, no marketing footer.

### What Goes in the Annotated Version

Everything in the AOC version PLUS:

- **Rule citations on every computed line** per Part One above
- **The methodology appendix** documenting the income determination per parent (Path 1-6 of the income router)
- **The source line** under Line 3 (“Source: entered directly” / “W-2 Box 5 (annual ÷ 12)” / “monthly gross (Income Helper)”)
- **The deviation narrative auto-stub** when the statutory cap binds, with the practitioner’s free-text edits
- **The imputation comparison appendix** when imputation is engaged, showing the actual-income and imputed-income calculations side by side with the dollar magnitude quantified
- **The MS deviation analysis section** (for MS calculator) when factors are asserted, showing the two-party comparison
- **An explanatory header** noting that this is the annotated version produced by the TCB Law open-source calculator at csg.tcblaw.org/tn
- **A standard footer** noting the open-source repo at github.com/tcbmem-png/csg_tcblaw and the disclaimer (“Not legal advice. For estimates only. Consult a licensed Tennessee attorney.”)

The annotated version may run longer than the AOC version (3-5 pages versus 2 pages) because the citation column and the appendices take space. That’s fine. The PDF is for review, not for shoehorning into a court file.

### The Reconciliation Standard

The two PDFs must reconcile. A chancellor or opposing counsel comparing them must be able to see that the same calculation produced both.

This is achievable by ensuring:

- Both PDFs are generated from the same underlying calculation state at the same moment
- The line numbers and labels match exactly where they appear in both
- The dollar values are identical to the cent

A footer note on the annotated version says something like: *“This annotated worksheet reflects the same calculation as the AOC-format worksheet generated from this case. All line values match.”*

### What This Pass Should Produce

By the end of this work:

1. The “Download AOC-format worksheet” button shipped, producing a clean filing-ready PDF
1. The existing PDF generator preserved and rebranded as the “Download annotated worksheet” button
1. Visual verification that both PDFs reconcile line-by-line for at least the five Stories from the article
1. The MS calculator gets the same dual-output treatment — clean filing version (where the MS court conventions are looser, but a clean version still has value) and annotated version with deviation analysis per the separate MS Deviation Worksheet brief
1. Updated help text and labels making the two-button choice clear to practitioners

## What Should NOT Be in This Module

This brief does not:

- Add new substantive calculation logic. The math doesn’t change.
- Change the citation framework’s underlying structure if it works. If `citations.ts` already covers most lines correctly, we update it rather than rewriting it.
- Replace the AOC’s form. The AOC-format version mirrors the AOC’s structure; it doesn’t try to improve on the AOC’s design choices.
- Add citations beyond what each rule actually supports. If a line is the product of practitioner input rather than rule application, it shouldn’t pretend to have a citation.

## Acceptance Criteria

A practitioner using the calculator should be able to:

- Generate two PDFs from the same calculation, one clean for filing and one annotated for analysis
- File the AOC-format version in chancery court without modification
- Use the annotated version in mediation, client briefings, or deviation argument with full rule citation context
- See, on the annotated version, the rule citation for every dollar number on the worksheet
- Verify any single number against the cited rule by looking up the rule text

A chancellor receiving the worksheet should be able to:

- Recognize the AOC-format version as the standard worksheet they’re used to seeing
- Optionally review the annotated version for the deeper analysis when the case warrants
- Verify that the two documents reconcile line-by-line

A pro se litigant who wants to understand the calculation should be able to:

- Generate the annotated version
- Follow the citation chain from any number back to the rule that produced it

When all three of these can happen reliably, this module has done its job. The article’s “every formula annotated” claim becomes a routine fact of the calculator’s output rather than an aspiration the practitioner has to take on faith.

— TCB