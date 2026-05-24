import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "TCB Child Support Helper";

interface WorksheetReadyProps {
  /** "TN" (default) or "MS" — adapts copy and CTAs. */
  state?: "TN" | "MS";
  matterName?: string;
  /** Summary PDF link (TN) or single MS PDF link. */
  downloadUrl?: string;
  /** Only present for TN orders. */
  officialDownloadUrl?: string;
  amountFromLabel?: string;
  amountMonthly?: string;
}

const WorksheetReadyEmail = ({
  state = "TN",
  matterName,
  downloadUrl,
  officialDownloadUrl,
  amountFromLabel,
  amountMonthly,
}: WorksheetReadyProps) => {
  const isMS = state === "MS";
  const stateName = isMS ? "Mississippi" : "Tennessee";
  const amountSubtitle = isMS ? "Proposed monthly support" : "Presumptive monthly support";
  return (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {stateName} child support worksheet PDF is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your worksheet is ready</Heading>
        <Text style={text}>
          Thanks for your purchase. Your {stateName} child support worksheet
          {matterName ? ` for ${matterName}` : ""} is ready{isMS
            ? "."
            : " in two formats — a clean summary for review and the official AOC line-numbered form for filing."}
        </Text>

        {amountMonthly && amountFromLabel ? (
          <Section style={summary}>
            <Text style={summaryLabel}>{amountSubtitle}</Text>
            <Text style={summaryValue}>${amountMonthly}</Text>
            <Text style={summaryMeta}>{amountFromLabel}</Text>
          </Section>
        ) : null}

        {isMS ? (
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            {downloadUrl ? (
              <Button href={downloadUrl} style={button}>
                Download MS worksheet PDF
              </Button>
            ) : null}
          </Section>
        ) : (
          <>
            <Section style={{ textAlign: "center", margin: "28px 0" }}>
              {officialDownloadUrl ? (
                <Button href={officialDownloadUrl} style={button}>
                  Download official AOC worksheet
                </Button>
              ) : null}
            </Section>
            <Section style={{ textAlign: "center", margin: "12px 0 28px" }}>
              {downloadUrl ? (
                <Button href={downloadUrl} style={buttonSecondary}>
                  Download summary worksheet
                </Button>
              ) : null}
            </Section>
          </>
        )}

        {isMS ? (
          <Text style={small}>
            Your worksheet implements Miss. Code Ann. § 43-19-101 (presumptive
            guideline) and § 43-19-103 (deviation criteria). The PDF includes
            your AGI computation, presumptive award, threshold findings (if
            triggered), and any deviation factors you proposed.
          </Text>
        ) : (
          <Text style={small}>
            The <strong>official</strong> PDF mirrors the State of Tennessee
            Child Support Worksheet (Parts I–VI, line numbers 1–16) — file
            this one with the court. The <strong>summary</strong> PDF is our
            easier-to-read version of the same calculation for your records
            or client.
          </Text>
        )}

        <Text style={small}>
          Links are unique to your order. Save the PDF locally — the link
          will continue to work, but treat it like a receipt.
        </Text>

        <Text style={footer}>
          {isMS
            ? "Implements Miss. Code Ann. §§ 43-19-101 & 43-19-103. Calculation aid only; not legal advice."
            : "Implements Tenn. Comp. R. & Regs. 1240-02-04 (Income Shares Model). Calculation aid only; not legal advice."}
        </Text>

        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
  );
};


export const template = {
  component: WorksheetReadyEmail,
  subject: (d: Record<string, any>) => {
    const stateName = d?.state === "MS" ? "Mississippi" : "Tennessee";
    return d?.matterName
      ? `Your ${stateName} child support worksheet — ${d.matterName}`
      : `Your ${stateName} child support worksheet PDF`;
  },
  displayName: "Worksheet ready",
  previewData: {
    state: "TN",
    matterName: "Smith v. Smith (PREVIEW — links are placeholders)",
    downloadUrl: "https://csg.tcblaw.org/tn",
    officialDownloadUrl: "https://csg.tcblaw.org/tn",
    amountFromLabel: "Parent A → Parent B",
    amountMonthly: "1,284",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Georgia, 'Times New Roman', serif" };
const container = { padding: "24px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: 700, color: "#1a1a1a", margin: "0 0 16px" };
const text = { fontSize: "15px", color: "#333", lineHeight: "1.55", margin: "0 0 16px" };
const summary = {
  background: "#f6f2ea",
  border: "1px solid #e6dfd1",
  padding: "16px 18px",
  borderRadius: "4px",
  margin: "12px 0 8px",
};
const summaryLabel = { fontSize: "12px", color: "#6b6357", margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.04em" };
const summaryValue = { fontSize: "26px", fontWeight: 700, color: "#1a1a1a", margin: "4px 0 2px" };
const summaryMeta = { fontSize: "13px", color: "#6b6357", margin: 0 };
const button = {
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "4px",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};
const buttonSecondary = {
  backgroundColor: "#ffffff",
  color: "#1a1a1a",
  padding: "11px 21px",
  borderRadius: "4px",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
  border: "1px solid #1a1a1a",
};
const small = { fontSize: "13px", color: "#666", lineHeight: "1.5", margin: "16px 0 0" };
const footer = { fontSize: "12px", color: "#888", margin: "20px 0 0", lineHeight: "1.5" };
