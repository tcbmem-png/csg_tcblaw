import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/unlock/$token")({
  head: () => ({ meta: [{ title: "Download worksheet — TN Child Support" }] }),
  component: UnlockPage,
});

function UnlockPage() {
  const { token } = useParams({ from: "/unlock/$token" });
  const href = `/api/public/unlock/${token}`;
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">Your worksheet</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Use the link below to download your filing-ready PDF. This link is
        unique to your order — keep it safe.
      </p>
      <a
        href={href}
        download="tn-child-support-worksheet.pdf"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Download PDF
      </a>
    </div>
  );
}
