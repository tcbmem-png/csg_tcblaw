/**
 * Appendix A — Imputed vs Actual Comparison (compare-mode).
 *
 * DRIFT-RISK HIGH (plan §0.1). Strict neutrality: show both scenarios
 * with equal weight; quantify the dispute; never tell the reader which
 * scenario is more defensible, more likely, or to be preferred.
 *
 * Signature per Phase D+E ack §6: (primary, alternative) => Block[].
 * If alternative is null, the appendix is skipped at the registry level;
 * defensive handling still emits a neutral placeholder if invoked.
 */
import type { WDM } from "@/lib/calc/wdm/types";
import { authorityLine, h, money, p, t, table, type Block } from "../layout/flow";

function finalAllIn(wdm: WDM): string {
  const line = wdm.sections
    .find((s) => s.id === "final")
    ?.lines.find((l) => l.screenLineNo === "15");
  return line?.total?.display ?? "—";
}

function pcso(wdm: WDM): number {
  return wdm.panels.statutoryCap.calculatedPCSO;
}

export function build(primary: WDM, alternative: WDM | null): Block[] {
  const blocks: Block[] = [];
  blocks.push(h(1, "Appendix A. Imputed vs Actual Comparison"));

  if (!alternative) {
    blocks.push(
      p(
        t(
          "No alternative scenario was provided for this worksheet. This appendix is reserved for cases in which the parties present competing imputation positions.",
        ),
      ),
    );
    return blocks;
  }

  blocks.push(
    p(
      t(
        "The primary scenario reflects the user's primary income election; the alternative scenario reflects the alternative election. The factors the tribunal weighs in resolving an imputation dispute are listed at Rule .04(3)(a)2.(iii); this appendix neither evaluates those factors nor recommends an outcome.",
      ),
    ),
  );

  const dMonthly = pcso(primary) - pcso(alternative);
  blocks.push(
    table([
      ["", "Primary", "Alternative", "Difference"],
      [
        "Calculated PCSO (monthly)",
        money(pcso(primary)),
        money(pcso(alternative)),
        money(Math.abs(dMonthly)),
      ],
      ["Final all-in monthly obligation", finalAllIn(primary), finalAllIn(alternative), "—"],
    ]),
  );

  blocks.push(
    p(
      t(
        `Monthly delta between the two scenarios: ${money(Math.abs(dMonthly))}. Annualized: ${money(Math.abs(dMonthly) * 12)}.`,
      ),
    ),
  );

  blocks.push(authorityLine("income_imputed_vocational"));
  return blocks;
}
