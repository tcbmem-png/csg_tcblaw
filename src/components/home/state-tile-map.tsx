import { useState, useMemo } from "react";
import {
  STATES,
  TILE_COLS,
  TILE_ROWS,
  GITHUB_ISSUES_URL,
  type StateEntry,
} from "@/lib/states";

const TILE = 44;
const GAP = 6;
const STRIDE = TILE + GAP;
const PAD = 8;
const VIEW_W = TILE_COLS * STRIDE - GAP + PAD * 2;
const VIEW_H = TILE_ROWS * STRIDE - GAP + PAD * 2;

const FILL: Record<StateEntry["status"], string> = {
  available: "var(--state-available)",
  coming_soon: "var(--state-coming)",
  planned: "var(--state-planned)",
};
const TEXT: Record<StateEntry["status"], string> = {
  available: "var(--state-available-foreground)",
  coming_soon: "var(--state-coming-foreground)",
  planned: "var(--state-planned-foreground)",
};

function hrefFor(s: StateEntry): string | null {
  if (s.status === "available" && s.route) return s.route;
  if (s.status === "coming_soon") return s.route ?? GITHUB_ISSUES_URL;
  return null;
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
      const interactive = s.status !== "planned";
      const href = hrefFor(s);
      const ariaLabel =
        s.status === "available"
          ? `${s.name} — open calculator`
          : s.status === "coming_soon"
          ? `${s.name} — coming soon`
          : `${s.name} — planned`;

      const underReview =
        s.status === "available" && s.reviewStatus === "under_review";

      const rect = (
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transition: "transform 120ms ease-out",
          }}
          className={
            interactive
              ? "tile-interactive cursor-pointer"
              : "tile-inert"
          }
        >
          <rect
            x={x}
            y={y}
            width={TILE}
            height={TILE}
            rx={6}
            ry={6}
            fill={FILL[s.status]}
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="ui-monospace, 'JetBrains Mono', Menlo, monospace"
            fontSize={14}
            fontWeight={600}
            fill={TEXT[s.status]}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {s.code}
          </text>
          {underReview && (
            <circle
              cx={x + TILE - 7}
              cy={y + 7}
              r={3.5}
              fill="var(--primary)"
              stroke="var(--background)"
              strokeWidth={1.25}
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
        const external = href.startsWith("http");
        return (
          <a
            key={s.code}
            href={href}
            aria-label={ariaLabel}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer noopener" : undefined}
            {...handlers}
          >
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

function Legend() {
  const items: { label: string; status: StateEntry["status"] }[] = [
    { label: "Available now", status: "available" },
    { label: "Coming soon", status: "coming_soon" },
    { label: "Planned", status: "planned" },
  ];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((it) => (
        <span key={it.status} className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: FILL[it.status] }}
          />
          <span>{it.label}</span>
        </span>
      ))}
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background: "var(--primary)",
            boxShadow: "0 0 0 1px var(--background)",
          }}
        />
        <span>Being verified</span>
      </span>
    </div>
  );
}

function DetailPanel({ state }: { state: StateEntry | null }) {
  if (!state) {
    const liveCount = STATES.filter((s) => s.status === "available").length;
    const comingCount = STATES.filter((s) => s.status === "coming_soon").length;
    return (
      <div className="min-h-[112px] rounded-lg border border-dashed border-rule bg-cream/60 p-5 text-sm text-muted-foreground">
        Hover or focus a state tile for details. {liveCount}{" "}
        {liveCount === 1 ? "calculator is" : "calculators are"} live.{" "}
        {comingCount} more across the Southeast{" "}
        {comingCount === 1 ? "is" : "are"} next.
      </div>
    );
  }

  const statusLabel =
    state.status === "available"
      ? "Available now"
      : state.status === "coming_soon"
      ? "Coming soon"
      : "Planned";

  return (
    <div className="min-h-[112px] rounded-lg border border-rule bg-background p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {statusLabel}
          </p>
          <h3 className="mt-1 font-serif text-xl text-ink">{state.name}</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {state.code}
        </span>
      </div>
      {state.model && (
        <p className="mt-2 text-sm text-ink/90">{state.model}</p>
      )}
      {state.cite && (
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {state.cite}
        </p>
      )}
      <div className="mt-3 text-sm">
        {state.status === "available" && state.route && (
          <a
            href={state.route}
            className="font-medium text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
          >
            Open the {state.name} calculator →
          </a>
        )}
        {state.status === "coming_soon" && (
          <a
            href={state.route ?? GITHUB_ISSUES_URL}
            target={state.route ? undefined : "_blank"}
            rel={state.route ? undefined : "noreferrer noopener"}
            className="font-medium text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
          >
            {state.route
              ? `See the ${state.name} roadmap →`
              : "Coming soon — file an issue →"}
          </a>
        )}
        {state.status === "planned" && (
          <span className="text-muted-foreground">
            Planned. Status will update here when work begins.
          </span>
        )}
      </div>
    </div>
  );
}
