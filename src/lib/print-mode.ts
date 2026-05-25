/**
 * Dual-PDF print mode controller.
 *
 * The worksheet view renders BOTH the clean AOC-format worksheet and the
 * annotated TCB Law worksheet. We pick which one prints by toggling a class
 * on <html>; `@media print` rules in src/styles.css hide the other.
 *
 * - mode="aoc"        → body shows .pdf-aoc, hides .pdf-annotated
 * - mode="annotated"  → body shows .pdf-annotated, hides .pdf-aoc
 *
 * The class is reset after the print dialog closes so the on-screen view
 * (which shows the annotated worksheet only) is unaffected.
 */
export type PdfMode = "aoc" | "annotated";

export function printPdf(mode: PdfMode): void {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const cls = mode === "aoc" ? "print-mode-aoc" : "print-mode-annotated";
  root.classList.add(cls);

  // Clean up after the print dialog closes (afterprint fires in modern
  // browsers; fall back to a small timeout in case the listener missed).
  const cleanup = () => {
    root.classList.remove("print-mode-aoc", "print-mode-annotated");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  setTimeout(cleanup, 5000);

  // Defer to next frame so the class lands before the print snapshot.
  requestAnimationFrame(() => window.print());
}
