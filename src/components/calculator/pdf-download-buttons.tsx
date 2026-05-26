import { useState } from "react";
import type { CalcInputs, CalcOutputs } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";
import { defaultCaption } from "@/lib/calc/share";

/**
 * Dual-PDF download buttons.
 *
 * - "AOC-format worksheet" downloads a true replica of the State of
 *   Tennessee / AOC Child Support Worksheet (Mother/Father/Caretaker
 *   columns, PRP/ARP/SPLIT checkboxes, hatched N/A cells, official line
 *   numbering 1/1a-1e/2/2a/3/4/...). Rendered by
 *   src/lib/pdf/official-worksheet-pdf.ts.
 *
 * - "Annotated worksheet" downloads the branded TCB Law worksheet with
 *   rule citations and methodology appendix. Rendered by
 *   src/lib/pdf/worksheet-pdf.ts.
 *
 * Both PDFs reflect the same calculation — same CalcInputs/CalcOutputs
 * feed both renderers.
 */
function triggerDownload(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(caption: CaseCaption, fallback: string) {
  const base = (caption.matterName || caption.docketNumber || fallback)
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback;
}

export function PdfDownloadButtons({
  inputs,
  outputs,
  caption = defaultCaption(),
  className = "",
}: {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  caption?: CaseCaption;
  className?: string;
}) {
  const [busy, setBusy] = useState<null | "aoc" | "annotated">(null);

  async function downloadAoc() {
    if (busy) return;
    setBusy("aoc");
    try {
      const { renderOfficialWorksheetPdf } = await import(
        "@/lib/pdf/official-worksheet-pdf"
      );
      const bytes = await renderOfficialWorksheetPdf({ inputs, outputs, caption });
      triggerDownload(
        bytes,
        `${safeName(caption, "tn-child-support-worksheet")}-AOC.pdf`,
      );
    } finally {
      setBusy(null);
    }
  }

  async function downloadAnnotated() {
    if (busy) return;
    setBusy("annotated");
    try {
      const { renderWorksheetPdf } = await import("@/lib/pdf/worksheet-pdf");
      const bytes = await renderWorksheetPdf({ inputs, outputs, caption });
      triggerDownload(
        bytes,
        `${safeName(caption, "tn-child-support-worksheet")}-annotated.pdf`,
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`no-print ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={downloadAoc}
          disabled={busy !== null}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
        >
          {busy === "aoc" ? "Generating…" : "Download AOC-format worksheet"}
          <span className="ml-1 text-[11px] font-normal opacity-80">
            (filing-ready)
          </span>
        </button>
        <button
          type="button"
          onClick={downloadAnnotated}
          disabled={busy !== null}
          className="w-full rounded-md border border-primary bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60 sm:w-auto"
        >
          {busy === "annotated"
            ? "Generating…"
            : "Download annotated worksheet"}
          <span className="ml-1 text-[11px] font-normal opacity-80">
            (full analysis)
          </span>
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Both worksheets reflect the same calculation. The AOC-format version
        is a line-by-line replica of the State of Tennessee Child Support
        Worksheet (Mother/Father columns, official line numbering) for court
        filing. The annotated version adds rule citations, methodology
        documentation, and explanatory analysis suitable for mediation,
        negotiation, or client briefing.
      </p>
    </div>
  );
}
