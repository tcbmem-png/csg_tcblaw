/**
 * Fixtures harness — the gate the StateSpec contract defines: "a state is done
 * when the engine reproduces all its fixtures, and they trace to authority."
 *
 * Each state ships a fixtures.json of authoritative worked examples. The
 * harness loads them and a test runs each through the state's engine, asserting
 * the present `expected` fields. A new income-shares state becomes a data-only
 * drop: author its spec + fixtures.json and run them through the generic
 * income-shares core — no new engine code.
 */
import { readFileSync } from "node:fs";

export interface Fixture<I = unknown, E = Record<string, unknown>> {
  /** Stable id, e.g. "TN-3ch-5050-mid". */
  id: string;
  /** Where the expected numbers come from (test, official calc, treatise). */
  source: string;
  notes?: string;
  /** State-native inputs (merged over the state's defaults by the runner). */
  inputs: Partial<I>;
  /** The fields to assert; partial so a fixture can pin only what it knows. */
  expected: Partial<E>;
}

export function loadFixtures<I = unknown, E = Record<string, unknown>>(
  location: string | URL,
): Fixture<I, E>[] {
  return JSON.parse(readFileSync(location, "utf8")) as Fixture<I, E>[];
}
