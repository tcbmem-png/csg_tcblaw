/**
 * Regression guard for the § 43-19-103 factor letter remapping (g/h/i).
 *
 * Pre-fix the calculator had the letters scrambled: (g) showed the parental
 * arrangement text, (h) showed assets, (i) showed childcare. After the fix
 * the mapping matches the statute:
 *   (g) Total available assets of obligee, obligor, and child
 *   (h) Payment by obligee of child care expenses
 *   (i) The particular shared parental arrangement
 *
 * Every surface that renders factor titles to the user (worksheet PDF,
 * deviation PDF, on-screen worksheet preview) must agree.
 */
import { describe, it, expect } from "vitest";
import {
  FACTOR_TITLES,
  FACTOR_STATUTORY_TEXT,
} from "../reconciliation";

describe("§ 43-19-103 factor letter mapping (g/h/i)", () => {
  it("FACTOR_TITLES (g) describes available assets", () => {
    expect(FACTOR_TITLES.g.toLowerCase()).toContain("assets");
    expect(FACTOR_TITLES.g.toLowerCase()).not.toContain("shared parental");
    expect(FACTOR_TITLES.g.toLowerCase()).not.toContain("child care");
  });

  it("FACTOR_TITLES (h) describes child care", () => {
    expect(FACTOR_TITLES.h.toLowerCase()).toContain("child care");
    expect(FACTOR_TITLES.h.toLowerCase()).not.toContain("assets");
  });

  it("FACTOR_TITLES (i) describes the shared parental arrangement", () => {
    expect(FACTOR_TITLES.i.toLowerCase()).toContain("parental arrangement");
    expect(FACTOR_TITLES.i.toLowerCase()).not.toContain("assets");
  });

  it("FACTOR_STATUTORY_TEXT (g) describes assets", () => {
    expect(FACTOR_STATUTORY_TEXT.g.toLowerCase()).toContain("assets");
  });

  it("FACTOR_STATUTORY_TEXT (h) describes child care", () => {
    expect(FACTOR_STATUTORY_TEXT.h.toLowerCase()).toContain("child care");
  });

  it("FACTOR_STATUTORY_TEXT (i) describes shared parental arrangement", () => {
    expect(FACTOR_STATUTORY_TEXT.i.toLowerCase()).toContain("shared");
    expect(FACTOR_STATUTORY_TEXT.i.toLowerCase()).toContain("parental");
  });

  it("(a)-(f) and (j) are unchanged by the remap", () => {
    expect(FACTOR_TITLES.a.toLowerCase()).toContain("medical");
    expect(FACTOR_TITLES.b.toLowerCase()).toContain("independent income");
    expect(FACTOR_TITLES.c.toLowerCase()).toContain("spousal");
    expect(FACTOR_TITLES.d.toLowerCase()).toContain("seasonal");
    expect(FACTOR_TITLES.e.toLowerCase()).toContain("age");
    expect(FACTOR_TITLES.f.toLowerCase()).toContain("special needs");
    expect(FACTOR_TITLES.j.toLowerCase()).toContain("equitable");
  });
});
