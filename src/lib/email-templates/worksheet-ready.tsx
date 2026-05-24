import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "TN Child Support Helper";

interface WorksheetReadyProps {
  matterName?: string;
  downloadUrl?: string;
  officialDownloadUrl?: string;
  amountFromLabel?: string;
  amountMonthly?: string;
}

const WorksheetReadyEmail = ({
  matterName,
  downloadUrl,
  officialDownloadUrl,
  amountFromLabel,
  amountMonthly,
}: WorksheetReadyProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your TN child support worksheet PDFs are ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your worksheet is ready</Heading>
        <Text style={text}>
          Thanks for your purchase. Your Tennessee child support worksheet
          {matterName ? ` for ${matterName}` : ""} is ready in two formats — a
          clean summary for review and the official AOC line-numbered form for
          filing.
        </Text>

        {amountMonthly && amountFromLabel ? (
          <Section style={summary}>
            <Text style={summaryLabel}>Presumptive monthly support</Text>
            <Text style={summaryValue}>${amountMonthly}</Text>
            <Text style={summaryMeta}>{amountFromLabel}</Text>
          </Section>
        ) : null}

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

        <Text style={small}>
          The <strong>official</strong> PDF mirrors the State of Tennessee
          Child Support Worksheet (Parts I–VI, line numbers 1–16) — file this
          one with the court. The <strong>summary</strong> PDF is our
          easier-to-read version of the same calculation for your records or
          client.
        </Text>

        <Text style={small}>
          Links are unique to your order. Save both PDFs locally — the links
          will continue to work, but treat them like receipts.
        </Text>

        <Text style={footer}>
          Implements Tenn. Comp. R. &amp; Regs. 1240-02-04 (Income Shares
          Model). Calculation aid only; not legal advice.
        </Text>

        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
);


export const template = {
  component: WorksheetReadyEmail,
  subject: (d: Record<string, any>) =>
    d?.matterName
      ? `Your TN child support worksheet — ${d.matterName}`
      : "Your TN child support worksheet PDF",
  displayName: "Worksheet ready",
  previewData: {
    matterName: "Smith v. Smith (PREVIEW — links are placeholders)",
    downloadUrl: "https://tncsg.tcblaw.org/calculator",
    officialDownloadUrl: "https://tncsg.tcblaw.org/calculator",
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
