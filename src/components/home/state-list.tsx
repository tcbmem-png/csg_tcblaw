import { STATES, GITHUB_ISSUES_URL, type StateEntry } from "@/lib/states";

function group(status: StateEntry["status"]) {
  return STATES.filter((s) => s.status === status).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function StateList() {
  const available = group("available");
  const coming = group("coming_soon");
  const planned = group("planned");

  return (
    <div className="space-y-8">
      <Section title="Available now" count={available.length}>
        <ul className="space-y-3">
          {available.map((s) => (
            <li key={s.code} className="text-sm">
              <a
                href={s.route!}
                className="font-medium text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
              >
                {s.name}
              </a>
              {s.model && (
                <span className="text-ink/80"> — {s.model}</span>
              )}
              {s.cite && (
                <span className="ml-1 font-mono text-xs text-muted-foreground">
                  ({s.cite})
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Coming soon" count={coming.length}>
        <ul className="space-y-3">
          {coming.map((s) => {
            const href = s.route ?? GITHUB_ISSUES_URL;
            const external = !s.route;
            return (
              <li key={s.code} className="text-sm">
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer noopener" : undefined}
                  className="font-medium text-ink underline decoration-rule underline-offset-2 hover:text-primary hover:decoration-primary"
                >
                  {s.name}
                </a>
                {s.model && (
                  <span className="text-muted-foreground"> — {s.model}</span>
                )}
                {s.cite && (
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    ({s.cite})
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Planned" count={planned.length}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {planned.map((s) => s.name).join(", ")}.
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary">
        {title}{" "}
        <span className="text-muted-foreground">({count})</span>
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
