/**
 * Washington — honest-assessment intro screen (the "front door").
 *
 * Copy is sourced from CSG/06_State_Forms/WA/WA_Pro_Se_Experience.md and
 * CSG/04_Agent_Pipeline/Honest_Assessment_Brief_WA_CA.md. Tone (per the brief):
 * plain words, credit before critique, specific not vague, no funnel-bro, never
 * overclaim CSG. The defensible line is "accurate, not always accessible."
 * Every legal claim traces to the verified authority pack (RCW cites) or to the
 * observed WSCSS form/tool; nothing is free-handed.
 */

interface Credit {
  title: string;
  body: string;
  /** Where this is grounded (form line + statute, or observed tool behavior). */
  cite: string;
}

const CREDITS: Credit[] = [
  {
    title: "Open, no login",
    body: "The calculator a self-represented parent needs is the open WSCSS Worksheet Calculator at fortress.wa.gov — no account, no email, no gate.",
    cite: "Observed: WA DCS WSCSS Worksheet Calculator (guest path)",
  },
  {
    title: "Client-side — nothing leaves the browser",
    body: "It runs entirely in the parent's browser. Editing a field and recalculating produced zero network requests; the State's own notice says worksheets are not saved, retained, or stored.",
    cite: "Observed: network trace, zero requests on recalc",
  },
  {
    title: "Prints the worksheet you actually file",
    body: "Print generates the exact WSCSS Worksheet PDF that gets filed in court. Free.",
    cite: "Observed: WSCSS Worksheet (mandatory form CSW/CSWP)",
  },
  {
    title: "It shows its own safety math, on the form",
    body: "Line 8 prints the Self-Support Reserve — $2,394 (180% of the federal poverty guideline). Line 18 shows 45% of each parent's net income. Line 19 shows the 25%-of-basic medical-support cap.",
    cite: "WSCSS lines 8 / 18 / 19; RCW 26.19.065(2)(b), 26.19.065(1), 26.09.105",
  },
  {
    title: "The only login wall guards the payment portal — not the calculator",
    body: "The SAW (SecureAccess Washington) gate is on DCS Online, the portal for paying support and viewing case payments. The whole calculator is the guest path. Washington is the model state.",
    cite: "Observed: SAW gate scoped to DCS Online payment portal",
  },
];

export interface WaHonestAssessmentProps {
  /** Flow into the cited worksheet. */
  onContinue: () => void;
}

export function WaHonestAssessment({ onContinue }: WaHonestAssessmentProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Honest assessment — Washington
      </p>
      <h1 className="mt-2 font-serif text-4xl">Washington mostly works.</h1>
      <p className="mt-4 text-lg">
        Of the states we studied, Washington built what the others didn't — open, no login, runs in
        the browser, and prints the actual court worksheet. <strong>Difficulty 2.5/5</strong>, the
        best of the states studied.
      </p>

      <h2 className="mt-10 font-serif text-2xl">What Washington gets right</h2>
      <ul className="mt-4 space-y-5">
        {CREDITS.map((c) => (
          <li key={c.title}>
            <p className="font-medium">{c.title}</p>
            <p className="mt-1">{c.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.cite}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-serif text-2xl">Where we add something</h2>
      <p className="mt-3">
        Washington's tool is accurate — it just isn't always legible. Two gaps remain, and they're
        the whole reason this page exists:
      </p>
      <ol className="mt-4 list-decimal space-y-3 pl-6">
        <li>
          <strong>No rule on the line.</strong> The calculator never shows the governing authority.
          We put the RCW, the WAC, and the verified case law on each line — and we label anything
          still pending confirmation rather than dress it up as settled.
        </li>
        <li>
          <strong>It doesn't show the math.</strong> A parent sees outputs, not derivation. We show
          the per-line computation — Line 5 is the per-child amount × the number of children, Line 6
          is net ÷ combined to three decimals, Line 7 is that share × the total — and let you check
          each figure against the State's own tool.
        </li>
      </ol>

      <p className="mt-8 text-sm text-muted-foreground">
        This is a worksheet, not legal advice, and not a substitute for the State's tool. Every
        number here is recomputed independently and matched to Washington's open WSCSS calculator to
        the dollar; the citation next to a line is there only because we recomputed that line.
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
      >
        See the cited worksheet →
      </button>
    </div>
  );
}
