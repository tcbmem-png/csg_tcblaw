import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CITATIONS, type CitationKey } from "@/lib/calc/citations";

/**
 * Small ⓘ indicator that surfaces the rule citation for a computed value.
 *
 * - Small (12px), muted color — never competes with the dollar number it
 *   annotates (testing-agent nit D-2).
 * - Single popover-based interaction works for both hover (desktop) and
 *   tap (mobile). The shadcn Popover handles focus management.
 * - Links to the TN Secretary of State's chapter-level PDF; the URL
 *   structure does not support stable paragraph anchors.
 */
export function RuleInfo({
  citation,
  className = "",
}: {
  citation: CitationKey;
  className?: string;
}) {
  const c = CITATIONS[citation];
  if (!c) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Rule citation: ${c.rule}`}
          className={`inline-flex shrink-0 items-center text-muted-foreground transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full ${className}`}
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-72 text-xs leading-relaxed"
      >
        <div className="font-semibold text-ink">{c.name}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {c.rule}
        </div>
        <p className="mt-2 text-ink">{c.plain}</p>
        {c.caseNote && (
          <p className="mt-2 border-t border-rule pt-2 text-[11px] italic text-muted-foreground">
            {c.caseNote}
          </p>
        )}
        {c.url && (
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[11px] text-primary underline-offset-2 hover:underline"
          >
            Open chapter PDF →
          </a>
        )}
      </PopoverContent>
    </Popover>
  );
}
