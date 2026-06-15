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

  it("TN, MS, AR are available", () => {
    expect(getStateByCode("TN")?.status).toBe("available");
    expect(getStateByCode("MS")?.status).toBe("available");
    expect(getStateByCode("AR")?.status).toBe("available");
  });

  it("LA, AL, GA, FL are coming_soon", () => {
    for (const c of ["LA", "AL", "GA", "FL"]) {
      expect(getStateByCode(c)?.status, c).toBe("coming_soon");
    }
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

  it("matches AR (now an available calculator)", () => {
    expect(detectState("/ar")?.code).toBe("AR");
    expect(detectState("/ar/how-it-works")?.code).toBe("AR");
  });
});

describe("STATE_SITEMAP_ENTRIES", () => {
  it("includes available states (/tn, /ms, /ar) and excludes coming_soon/planned", () => {
    const paths = STATE_SITEMAP_ENTRIES.map((e) => e.path);
    expect(paths).toContain("/tn");
    expect(paths).toContain("/ms");
    expect(paths).toContain("/ar");
    expect(paths).not.toContain("/fl");
    expect(STATE_SITEMAP_ENTRIES).toHaveLength(3);
  });
});
