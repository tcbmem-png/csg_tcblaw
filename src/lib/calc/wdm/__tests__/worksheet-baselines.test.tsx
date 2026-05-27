// @vitest-environment happy-dom
/**
 * Phase B0 — Worksheet visual-regression baselines.
 *
 * Renders <OfficialWorksheet /> to static HTML for every fixture in
 * `./fixtures.ts` and asserts the output matches a locked baseline
 * stored under `../__baselines__/`.
 *
 * Determinism contract (see ../__baselines__/README.md):
 *   - renderToStaticMarkup: no hooks fire post-render, no effects,
 *     no animation frames, no client-side state, no fonts, no network.
 *   - Fixed `preparedOnDisplay` injected via caption-adjacent test setup.
 *   - Radix-generated ids (`useId` counter) normalized post-render.
 *   - Whitespace normalized (collapse runs of >1 whitespace inside tags).
 *
 * Baseline update protocol is HUMAN-APPROVAL ONLY. See README.md.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Lock wall-clock determinism: OfficialWorksheet stamps `new Date()` in
// its header. Without this, baselines drift daily.
const FIXED_NOW = new Date("2026-05-27T12:00:00Z");
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});
afterAll(() => {
  vi.useRealTimers();
});
import { renderToStaticMarkup } from "react-dom/server";
import { OfficialWorksheet } from "@/components/calculator/official-worksheet";
import { calculate } from "../../calc";
import { defaultCaption } from "../../share";
import { FIXTURES } from "./fixtures";

/**
 * Normalize Radix's `useId`-generated identifiers (and the matching
 * aria-controls / aria-labelledby references) so the same tree produces
 * byte-identical HTML regardless of how many React trees rendered before
 * it in the same test process. Without this, run-order changes the ids.
 */
function normalizeRadixIds(html: string): string {
  const idMap = new Map<string, string>();
  let counter = 0;
  // Match the common React useId pattern (e.g. ":R0:", "«r0»", or Radix's "radix-«r0»").
  const idPattern = /(?:«[^»]+»|:[Rr][a-z0-9]*:)/g;
  return html.replace(idPattern, (match) => {
    if (!idMap.has(match)) {
      idMap.set(match, `__id_${counter++}__`);
    }
    return idMap.get(match)!;
  });
}

/** Pretty-print just enough to make diffs readable line-by-line. */
function prettify(html: string): string {
  return html
    .replace(/></g, ">\n<")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

function renderFixture(slug: string): string {
  const fx = FIXTURES.find((f) => f.slug === slug);
  if (!fx) throw new Error(`Unknown fixture: ${slug}`);
  const outputs = calculate(fx.inputs);
  const caption = defaultCaption();
  const html = renderToStaticMarkup(
    <OfficialWorksheet
      inputs={fx.inputs}
      outputs={outputs}
      caption={caption}
    />,
  );
  return prettify(normalizeRadixIds(html));
}

describe("Worksheet visual-regression baselines (B0)", () => {
  for (const fx of FIXTURES) {
    it(`[${fx.slug}] ${fx.label}`, async () => {
      const rendered = renderFixture(fx.slug);
      await expect(rendered).toMatchFileSnapshot(
        `../__baselines__/${fx.slug}.html`,
      );
    });
  }

  it("fixture slugs are unique", () => {
    const slugs = FIXTURES.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every fixture lists at least one `exercises` tag", () => {
    const offenders = FIXTURES.filter((f) => f.exercises.length === 0);
    expect(offenders).toEqual([]);
  });
});
