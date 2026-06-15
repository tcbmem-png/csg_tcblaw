import { describe, it, expect } from "vitest";
import {
  STATES,
  STATE_SITEMAP_ENTRIES,
  detectState,
  getStateByCode,
} from "@/lib/states";

describe("states registry", () => {
  it("contains exactly 50 entries", () => {
    expect(STATES).toHaveLength(50);
  });

  it("has unique codes and unique tile coordinates", () => {
    const codes = new Set(STATES.map((s) => s.code));
    expect(codes.size).toBe(50);
    const tiles = new Set(STATES.map((s) => s.tile.join(",")));
    expect(tiles.size).toBe(50);
  });

  it("every available state has route, model, cite", () => {
    for (const s of STATES.filter((s) => s.status === "available")) {
      expect(s.route, `${s.code} route`).toMatch(/^\/[a-z]{2}$/);
      expect(s.model).toBeTruthy();
      expect(s.cite).toBeTruthy();
    }
  });

  it("TN, MS, AR, LA, AL, FL are available", () => {
    for (const c of ["TN", "MS", "AR", "LA", "AL", "FL"]) {
      expect(getStateByCode(c)?.status, c).toBe("available");
    }
  });

  it("GA is coming_soon", () => {
    expect(getStateByCode("GA")?.status).toBe("coming_soon");
  });
});

describe("detectState", () => {
  it("matches state routes and sub-paths", () => {
    expect(detectState("/tn")?.code).toBe("TN");
    expect(detectState("/tn/how-it-works")?.code).toBe("TN");
    expect(detectState("/ms")?.code).toBe("MS");
    expect(detectState("/ms/about")?.code).toBe("MS");
  });

  it("returns null for non-state routes", () => {
    expect(detectState("/")).toBeNull();
    expect(detectState("/about")).toBeNull();
  });

  it("matches AR, LA, AL, FL (now available calculators)", () => {
    expect(detectState("/ar")?.code).toBe("AR");
    expect(detectState("/la")?.code).toBe("LA");
    expect(detectState("/al")?.code).toBe("AL");
    expect(detectState("/fl")?.code).toBe("FL");
    expect(detectState("/fl/how-it-works")?.code).toBe("FL");
  });
});

describe("STATE_SITEMAP_ENTRIES", () => {
  it("includes available states (/tn, /ms, /ar, /la, /al, /fl) and excludes coming_soon/planned", () => {
    const paths = STATE_SITEMAP_ENTRIES.map((e) => e.path);
    expect(paths).toContain("/tn");
    expect(paths).toContain("/ms");
    expect(paths).toContain("/ar");
    expect(paths).toContain("/la");
    expect(paths).toContain("/al");
    expect(paths).toContain("/fl");
    expect(paths).not.toContain("/ga");
    expect(STATE_SITEMAP_ENTRIES).toHaveLength(6);
  });
});
