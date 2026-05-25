/**
 * Regression guard for the § 43-19-103 factor letter mapping (g/h/i).
 *
 * Authoritative source: Miss. Code Ann. § 43-19-103 (2024 codification),
 * cross-checked against the MDHS-published statute, Justia 2024 / 2016 /
 * 2013, FindLaw, and the Mississippi legislature's bill history. The
 * statute reads:
 *
 *   (g) The particular shared parental arrangement...
 *   (h) Total available assets of the obligee, obligor and the child.
 *   (i) Payment by the obligee of child care expenses in order that the
 *       obligee may seek or retain employment, or because of the
 *       disability of the obligee.
 *
 * A brief v6 release inverted this ordering (assets at g, childcare at h,
 * parental at i) based on a manual review that was not cross-checked
 * against the statute itself. This test guards against that exact
 * inversion ever shipping again. Every surface that renders factor
 * titles to the user (worksheet PDF, deviation PDF, on-screen worksheet
 * preview) must agree with the statute.
 */
import { describe, it, expect } from "vitest";
import {
  FACTOR_TITLES,
  FACTOR_STATUTORY_TEXT,
} from "../reconciliation";

describe("§ 43-19-103 factor letter mapping (g/h/i)", () => {
  it("FACTOR_TITLES (g) describes the shared parental arrangement", () => {
    expect(FACTOR_TITLES.g.toLowerCase()).toContain("parental arrangement");
    expect(FACTOR_TITLES.g.toLowerCase()).not.toContain("assets");
    expect(FACTOR_TITLES.g.toLowerCase()).not.toContain("child care");
  });

  it("FACTOR_TITLES (h) describes total available assets", () => {
    expect(FACTOR_TITLES.h.toLowerCase()).toContain("assets");
    expect(FACTOR_TITLES.h.toLowerCase()).not.toContain("parental");
    expect(FACTOR_TITLES.h.toLowerCase()).not.toContain("child care");
  });

  it("FACTOR_TITLES (i) describes obligee child-care expenses", () => {
    expect(FACTOR_TITLES.i.toLowerCase()).toContain("child care");
    expect(FACTOR_TITLES.i.toLowerCase()).not.toContain("assets");
    expect(FACTOR_TITLES.i.toLowerCase()).not.toContain("parental");
  });

  it("FACTOR_STATUTORY_TEXT (g) describes the shared parental arrangement", () => {
    expect(FACTOR_STATUTORY_TEXT.g.toLowerCase()).toContain("shared");
    expect(FACTOR_STATUTORY_TEXT.g.toLowerCase()).toContain("parental");
  });

  it("FACTOR_STATUTORY_TEXT (h) describes assets", () => {
    expect(FACTOR_STATUTORY_TEXT.h.toLowerCase()).toContain("assets");
  });

  it("FACTOR_STATUTORY_TEXT (i) describes obligee child-care expenses", () => {
    expect(FACTOR_STATUTORY_TEXT.i.toLowerCase()).toContain("child care");
    expect(FACTOR_STATUTORY_TEXT.i.toLowerCase()).toContain("obligee");
  });

  it("rejects the v6 inversion: (g) is NOT assets, (h) is NOT child care, (i) is NOT parental", () => {
    // These three assertions exist solely to catch a regression to the
    // briefly-shipped v6 ordering. If any of them fail, the statute
    // mapping has been inverted again — revert before merging.
    expect(FACTOR_TITLES.g.toLowerCase()).not.toContain("assets");
    expect(FACTOR_TITLES.h.toLowerCase()).not.toContain("child care");
    expect(FACTOR_TITLES.i.toLowerCase()).not.toContain("parental arrangement");
  });

  it("(a)-(f) and (j) are unaffected by the (g)/(h)/(i) ordering", () => {
    expect(FACTOR_TITLES.a.toLowerCase()).toContain("medical");
    expect(FACTOR_TITLES.b.toLowerCase()).toContain("independent income");
    expect(FACTOR_TITLES.c.toLowerCase()).toContain("spousal");
    expect(FACTOR_TITLES.d.toLowerCase()).toContain("seasonal");
    expect(FACTOR_TITLES.e.toLowerCase()).toContain("age");
    expect(FACTOR_TITLES.f.toLowerCase()).toContain("special needs");
    expect(FACTOR_TITLES.j.toLowerCase()).toContain("equitable");
  });
});
