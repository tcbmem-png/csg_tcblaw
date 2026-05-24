import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "TN Child Support Helper";

interface WorksheetReadyProps {
  matterName?: string;
  downloadUrl?: string;
  amountFromLabel?: string;
  amountMonthly?: string;
}

const WorksheetReadyEmail = ({
  matterName,
  downloadUrl,
  amountFromLabel,
  amountMonthly,
}: WorksheetReadyProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your TN child support worksheet PDF is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your worksheet is ready</Heading>
        <Text style={text}>
          Thanks for your purchase. Your filing-ready Tennessee child support
          worksheet PDF{matterName ? ` for ${matterName}` : ""} is attached below
          as a secure download link.
        </Text>

        {amountMonthly && amountFromLabel ? (
          <Section style={summary}>
            <Text style={summaryLabel}>Presumptive monthly support</Text>
            <Text style={summaryValue}>${amountMonthly}</Text>
            <Text style={summaryMeta}>{amountFromLabel}</Text>
          </Section>
        ) : null}

        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          {downloadUrl ? (
            <Button href={downloadUrl} style={button}>
              Download PDF
            </Button>
          ) : null}
        </Section>

        <Text style={small}>
          The download link is unique to your order. Save the PDF locally —
          this link will continue to work, but treat it like a receipt.
        </Text>

        <Text style={footer}>
          This worksheet implements Tenn. Comp. R. &amp; Regs. 1240-02-04 (Income
          Shares Model). It is a calculation aid and not legal advice.
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
    matterName: "Smith v. Smith",
    downloadUrl: "https://example.com/unlock/abc123",
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
const small = { fontSize: "13px", color: "#666", lineHeight: "1.5", margin: "16px 0 0" };
const footer = { fontSize: "12px", color: "#888", margin: "20px 0 0", lineHeight: "1.5" };
