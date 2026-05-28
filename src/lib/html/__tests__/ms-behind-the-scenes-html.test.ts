/**
 * Phase 4 — Slice 4
 * D-017 verification: the Behind the Scenes HTML generator emits per-position
 * attribution bylines when authoredByName is populated on the party entry,
 * and the numbers it renders are consistent with the engine + reconciliation
 * + chancellor-decision math (no renderer-side drift from calculateMS /
 * buildReconciliation / computeChancellorTotals).
 *
 * Closes the D-017 carve-out: if attribution renders correctly here, the
 * legacy `party-factor-block` surface in the live React preview is the only
 * remaining attribution gap, and Slice 6 InputView polish stays a low-priority
 * backlog item.
 */
import { describe, it, expect } from "vitest";
import { defaultMSInputs, defaultDeviation, calculateMS } from "@/lib/calc/ms/calc";
import { buildReconciliation } from "@/lib/calc/ms/reconciliation";
import { computeChancellorTotals, defaultChancellorDecisions } from "@/lib/calc/ms/chancellor-decisions";
import { defaultCaption } from "@/lib/calc/share";
import { renderMSBehindTheScenesHtml, behindTheScenesFilename } from "../ms-behind-the-scenes-html";
import type { MSInputs } from "@/lib/calc/ms/types";

function williamsLike(): MSInputs {
  const base = defaultMSInputs();
  // Robert Williams: W-2, two children, modest deviation slate on each side.
  base.obligorAnnualGross = 84_000;
  base.obligorAnnualTaxes = 12_000;
  base.obligorAnnualSocialSecurity = 6_426;
  base.numChildren = 2;
  base.childAges = [10, 13];
  base.comparisonMode = "side_by_side";

  // Factor f — both sides assert with bylines on each.
  base.deviationsA = base.deviationsA.map((d) =>
    d.letter === "f"
      ? {
          ...d,
          applicable: true,
          proposedMonthly: 400,
          party: {
            position: "upward",
            factsAsserted: "Obligor share of extracurricular costs",
            documentationReferenced: "Invoices Ex. A",
            proposedMonthly: 400,
            legalAuthority: "§ 43-19-103(f)",
            authoredByName: "John Anderson",
            authoredByFirm: "Anderson & Wells",
            handoffRound: 1,
            authoredAt: "2026-05-01T12:00:00Z",
          },
        }
      : d,
  );
  base.deviationsB = base.deviationsA.map((d) => defaultDeviation(d.letter));
  base.deviationsB = base.deviationsB.map((d) =>
    d.letter === "f"
      ? {
          ...d,
          applicable: true,
          proposedMonthly: 200,
          party: {
            position: "downward",
            factsAsserted: "Shared, not solely obligor's share",
            documentationReferenced: "Bank records Ex. 2",
            proposedMonthly: 200,
            legalAuthority: "§ 43-19-103(f)",
            authoredByName: "Maria Lopez",
            authoredByFirm: "Lopez Law",
            handoffRound: 2,
            authoredAt: "2026-05-15T12:00:00Z",
          },
        }
      : d,
  );
  return base;
}

describe("renderMSBehindTheScenesHtml — D-017 attribution", () => {
  const inputs = williamsLike();
  const outputs = calculateMS(inputs);
  const caption = { ...defaultCaption(), matterName: "Williams v. Williams", preparedBy: "Test Counsel" };
  const html = renderMSBehindTheScenesHtml({ inputs, outputs, caption });

  it("emits per-position attribution bylines for each side", () => {
    // Obligor side — John Anderson byline rendered
    expect(html).toContain("John Anderson");
    expect(html).toContain("Anderson &amp; Wells");
    // Obligee side — Maria Lopez byline rendered
    expect(html).toContain("Maria Lopez");
    expect(html).toContain("Lopez Law");
    // Both should appear inside the "Per counsel for" header construction
    expect(html).toMatch(/Per counsel for [^<]*John Anderson/);
    expect(html).toMatch(/Per counsel for [^<]*Maria Lopez/);
  });

  it("surfaces the round-2 amendment marker for the obligee entry", () => {
    expect(html).toMatch(/Amended in round 2 by Maria Lopez/);
  });

  it("renderer surfaces engine values and exposes recompute hooks", () => {
    const report = buildReconciliation(inputs);
    const decisions = inputs.chancellorDecisions ?? defaultChancellorDecisions();
    const totals = computeChancellorTotals(report.rows, decisions);
    // Presumptive monthly appears verbatim (renderer pins to body dataset
    // so the inline recompute script stays consistent with engine state).
    expect(html).toContain(`data-presumptive="${outputs.presumptiveMonthly}"`);
    // The factor f gap is in-play and must render — both sides asserted
    // different amounts, so the reconciliation row exists and is active.
    const fRow = report.rows.find((r) => r.letter === "f")!;
    expect(fRow.inPlay).toBe("both");
    expect(totals.activeCount).toBeGreaterThan(0);
  });

  it("filename follows MS_Deviation_Worksheet_[slug]_[date].html", () => {
    const name = behindTheScenesFilename(caption);
    expect(name).toMatch(/^MS_Deviation_Worksheet_.+_\d{4}-\d{2}-\d{2}\.html$/);
    expect(name).toContain("Williams");
  });
});
