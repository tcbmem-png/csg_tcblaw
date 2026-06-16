import { useState, useMemo } from "react";
import {
  STATES,
  TILE_COLS,
  TILE_ROWS,
  GITHUB_ISSUES_URL,
  modelLabel,
  type StateEntry,
  type StateModel,
} from "@/lib/states";

const TILE = 44;
const GAP = 6;
const STRIDE = TILE + GAP;
const PAD = 8;
const VIEW_W = TILE_COLS * STRIDE - GAP + PAD * 2;
const VIEW_H = TILE_ROWS * STRIDE - GAP + PAD * 2;

// Model hues × status lightness. One harmonized family on cream.
const MODEL_COLORS: Record<
  StateModel,
  { solid: string; pale: string; onSolid: string; onPale: string }
> = {
  income_shares: { solid: "#B8442A", pale: "#EFDCD4", onSolid: "#FAFAF7", onPale: "#7A2A18" },
  percentage:    { solid: "#2E6B70", pale: "#DBE6E6", onSolid: "#FAFAF7", onPale: "#1C4A4E" },
  melson:        { solid: "#6E4660", pale: "#E7DCE3", onSolid: "#FAFAF7", onPale: "#4A3144" },
};

const HATCH_ID = "tile-hatch";

function tileFill(s: StateEntry): { fill: string; text: string } {
  const c = MODEL_COLORS[s.modelKey];
  return s.status === "available"
    ? { fill: c.solid, text: c.onSolid }
    : { fill: c.pale, text: c.onPale };
}

export function StateTileMap() {
  const [focus, setFocus] = useState<StateEntry | null>(null);
  const detail = focus;

  const tiles = useMemo(() => {
    return STATES.map((s) => {
      const [col, row] = s.tile;
      const x = PAD + col * STRIDE;
      const y = PAD + row * STRIDE;
      const cx = x + TILE / 2;
      const cy = y + TILE / 2;
      const interactive = s.status === "available";
      const href = interactive ? s.route ?? null : null;
      const { fill, text } = tileFill(s);
      const corrected = !!s.correction;
      const inVerification = s.verifyStatus === "in_verification";
      const label = modelLabel(s);
      const ariaLabel =
        s.status === "available"
          ? `${s.name} — ${label} · ${inVerification ? "available, in verification" : corrected ? "verified, recently corrected" : "verified"}`
          : `${s.name} — ${label} · planned`;

      const rect = (
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transition: "transform 120ms ease-out",
          }}
          className={interactive ? "tile-interactive cursor-pointer" : "tile-inert"}
        >
          <rect
            x={x}
            y={y}
            width={TILE}
            height={TILE}
            rx={6}
            ry={6}
            fill={fill}
          />
          {inVerification && (
            <rect
              x={x}
              y={y}
              width={TILE}
              height={TILE}
              rx={6}
              ry={6}
              fill={`url(#${HATCH_ID})`}
              style={{ pointerEvents: "none" }}
            />
          )}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="ui-monospace, 'JetBrains Mono', Menlo, monospace"
            fontSize={14}
            fontWeight={600}
            fill={text}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {s.code}
          </text>
          {corrected && (
            <polygon
              points={`${x + TILE - 16},${y} ${x + TILE},${y} ${x + TILE},${y + 16}`}
              fill="#7A1F2B"
              stroke="#FAFAF7"
              strokeWidth={1}
              style={{ pointerEvents: "none" }}
            />
          )}
        </g>
      );

      const handlers = {
        onMouseEnter: () => setFocus(s),
        onFocus: () => setFocus(s),
        onMouseLeave: () => setFocus((prev) => (prev === s ? null : prev)),
        onBlur: () => setFocus((prev) => (prev === s ? null : prev)),
      };

      if (interactive && href) {
        return (
          <a key={s.code} href={href} aria-label={ariaLabel} {...handlers}>
            {rect}
          </a>
        );
      }
      return (
        <g key={s.code} aria-hidden="true">
          {rect}
        </g>
      );
    });
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-rule bg-background p-5">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label="United States child support calculator coverage map"
          className="block w-full h-auto"
        >
          <defs>
            <pattern
              id={HATCH_ID}
              width="8.49"
              height="8.49"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(135)"
            >
              <rect width="8.49" height="8.49" fill="rgba(250,250,247,0)" />
              <rect width="1" height="8.49" fill="rgba(250,250,247,0.22)" />
            </pattern>
          </defs>
          <style>{`
            .tile-interactive:hover, .tile-interactive:focus { transform: scale(1.15); outline: none; }
            a:focus-visible .tile-interactive { transform: scale(1.15); }
            a:focus-visible rect { stroke: var(--ring); stroke-width: 2; }
          `}</style>
          {tiles}
        </svg>

        <Legend />
      </div>

      <DetailPanel state={detail} />
    </div>
  );
}

function Swatch({ model }: { model: StateModel }) {
  return (
    <span
      aria-hidden
      className="inline-block h-3 w-3 rounded-sm"
      style={{ background: MODEL_COLORS[model].solid }}
    />
  );
}

function Legend() {
  return (
    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Model</span>
        <span className="inline-flex items-center gap-2"><Swatch model="income_shares" /> Income shares</span>
        <span className="inline-flex items-center gap-2"><Swatch model="percentage" /> Percentage of income</span>
        <span className="inline-flex items-center gap-2"><Swatch model="melson" /> Melson formula</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Status</span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: MODEL_COLORS.income_shares.solid }}
          />
          Available · verified
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="relative inline-block h-3 w-3 overflow-hidden rounded-sm"
            style={{ background: MODEL_COLORS.income_shares.solid }}
          >
            <span
              aria-hidden
              className="absolute right-0 top-0"
              style={{
                width: 0,
                height: 0,
                borderTop: "6px solid #7A1F2B",
                borderLeft: "6px solid transparent",
              }}
            />
          </span>
          Recently corrected
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3 w-3 rounded-sm"
            style={{
              background: `${MODEL_COLORS.income_shares.solid}`,
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(250,250,247,0) 0 6px, rgba(250,250,247,.22) 6px 7px)",
            }}
          />
          In verification
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: MODEL_COLORS.income_shares.pale }}
          />
          Planned
        </span>
      </div>
    </div>
  );
}

function DetailPanel({ state }: { state: StateEntry | null }) {
  if (!state) {
    const liveCount = STATES.filter((s) => s.status === "available").length;
    return (
      <div className="min-h-[112px] rounded-lg border border-dashed border-rule bg-cream/60 p-5 text-sm text-muted-foreground">
        Hover or focus a state tile for details. {liveCount} calculators are
        live across the Southeast. More states are planned.
      </div>
    );
  }

  const label = modelLabel(state);
  const corrected = !!state.correction;
  const inVerification = state.verifyStatus === "in_verification";

  let statusLine: string;
  if (state.status === "available") {
    if (inVerification) statusLine = "Available · in verification";
    else if (corrected) statusLine = "Verified · recently corrected";
    else statusLine = "Verified";
  } else {
    statusLine = "Planned";
  }

  return (
    <div className="min-h-[112px] rounded-lg border border-rule bg-background p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {statusLine}
          </p>
          <h3 className="mt-1 font-serif text-xl text-ink">{state.name}</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {state.code}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink/90">{label}</p>
      {state.cite && (
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {state.cite}
        </p>
      )}
      {corrected && (
        <p className="mt-2 text-xs leading-relaxed text-ink/80">
          {state.correction}
        </p>
      )}
      {inVerification && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Numbers are being reconciled against the state's own official tool.
        </p>
      )}
      <div className="mt-3 text-sm">
        {state.status === "available" && state.route ? (
          <a
            href={state.route}
            className="font-medium text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
          >
            Open the {state.name} calculator →
          </a>
        ) : (
          <a
            href={GITHUB_ISSUES_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
          >
            Planned — follow progress on GitHub →
          </a>
        )}
      </div>
    </div>
  );
}
