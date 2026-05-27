/**
 * Single source of truth for §1.4 four-state classifier presentation.
 *
 * Wherever the FactorInPlay state is rendered visually — the factor card
 * header badge, the reconciliation table row, the sticky live-bar, the PDF
 * — the label, accent token, and pill styling MUST come from this module.
 * Reads identically across surfaces, drift-proof by construction.
 *
 * Per Phase 2.5 review: "Don't let one rendering use 'in dispute' while
 * another uses 'contested' or 'disputed.' Single string per status, same
 * chip styling, same color logic."
 */
import type { FactorInPlay } from "./reconciliation";

export interface InPlayPresentation {
  /** Canonical short label — chip text. Identical across all renderings. */
  label: string;
  /** Long-form label for table rows / accessibility. */
  longLabel: string;
  /** Tailwind classes for the pill chip. */
  chipClass: string;
  /** Tailwind classes for a left-accent border on a card or row. */
  borderClass: string;
  /** Tailwind classes for a tinted background block. */
  bgClass: string;
}

const TABLE: Record<FactorInPlay, InPlayPresentation> = {
  neither: {
    label: "Not asserted",
    longLabel: "Not asserted",
    chipClass: "border-rule text-muted-foreground bg-background",
    borderClass: "border-rule",
    bgClass: "bg-background",
  },
  agree: {
    label: "Agreed",
    longLabel: "Agreed amount",
    chipClass: "border-success text-success bg-success/10",
    borderClass: "border-l-4 border-l-success border-rule",
    bgClass: "border-l-2 border-success bg-success/5",
  },
  both: {
    label: "In dispute",
    longLabel: "In dispute",
    chipClass: "border-accent text-accent-foreground bg-accent/15",
    borderClass: "border-l-4 border-l-accent border-rule",
    bgClass: "border-l-2 border-accent bg-accent/10",
  },
  obligor_only: {
    label: "Asserted by obligor",
    longLabel: "Asserted by obligor",
    chipClass: "border-primary text-primary bg-primary/5",
    borderClass: "border-l-4 border-l-primary border-rule",
    bgClass: "border-l-2 border-primary bg-primary/5",
  },
  obligee_only: {
    label: "Asserted by obligee",
    longLabel: "Asserted by obligee",
    chipClass: "border-accent text-accent-foreground bg-accent/15",
    borderClass: "border-l-4 border-l-accent border-rule",
    bgClass: "border-l-2 border-accent bg-accent/10",
  },
};

export function inPlayPresentation(state: FactorInPlay): InPlayPresentation {
  return TABLE[state];
}
