import { printPdf } from "@/lib/print-mode";

/**
 * Dual-PDF download buttons.
 *
 * Renders the two equally-prominent download buttons described in the
 * Phase 2 brief: clean AOC-format worksheet (filing-ready) and the
 * annotated TCB Law worksheet (full analysis). Both buttons trigger the
 * browser's "Save as PDF" flow via window.print(); the print-mode class
 * on <html> decides which worksheet renders.
 *
 * The reconciliation note next to the buttons matches the brief verbatim
 * so practitioners understand the two PDFs are the same calculation in
 * two presentations.
 */
export function PdfDownloadButtons({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`no-print ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => printPdf("aoc")}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          Download AOC-format worksheet
          <span className="ml-1 text-[11px] font-normal opacity-80">
            (filing-ready)
          </span>
        </button>
        <button
          type="button"
          onClick={() => printPdf("annotated")}
          className="w-full rounded-md border border-primary bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 sm:w-auto"
        >
          Download annotated worksheet
          <span className="ml-1 text-[11px] font-normal opacity-80">
            (full analysis)
          </span>
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Both worksheets reflect the same calculation. The AOC-format version
        matches the official Tennessee Child Support Worksheet for court
        filing. The annotated version adds rule citations, methodology
        documentation, and explanatory analysis suitable for mediation,
        negotiation, or client briefing.
      </p>
    </div>
  );
}
