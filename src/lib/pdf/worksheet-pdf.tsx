import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CalcInputs, CalcOutputs, Direction } from "@/lib/calc/types";
import type { CaseCaption } from "@/lib/calc/share";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  h1: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  small: { fontSize: 8, color: "#666" },
  captionBox: { borderWidth: 1, borderColor: "#cccccc", padding: 8, marginBottom: 12 },
  captionRow: { flexDirection: "row", marginBottom: 2 },
  captionLabel: { fontFamily: "Helvetica-Bold", width: 110 },
  rowHeader: {
    flexDirection: "row",
    backgroundColor: "#f0ebe0",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: "#999",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  rowEmph: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderColor: "#999",
    backgroundColor: "#faf6ec",
  },
  cellNum: { width: 28, color: "#666", fontSize: 8 },
  cellLabel: { flex: 1 },
  cellVal: { width: 70, textAlign: "right" },
  cellTotal: { width: 70, textAlign: "right", fontFamily: "Helvetica-Bold" },
  emph: { fontFamily: "Helvetica-Bold" },
  footer: { marginTop: 16, fontSize: 8, color: "#666", lineHeight: 1.4 },
});

function fmt(n: number) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}
function dirLabel(d: Direction, a: string, b: string) {
  if (d === "parent_a_to_b") return `${a} -> ${b}`;
  if (d === "parent_b_to_a") return `${b} -> ${a}`;
  return "—";
}

interface RowProps {
  n?: string;
  label: string;
  a?: string;
  b?: string;
  total?: string;
  emphasis?: boolean;
}
const Row = ({ n, label, a, b, total, emphasis }: RowProps) => (
  <View style={emphasis ? styles.rowEmph : styles.row}>
    <Text style={styles.cellNum}>{n ?? ""}</Text>
    <Text style={[styles.cellLabel, emphasis ? styles.emph : {}]}>{label}</Text>
    <Text style={styles.cellVal}>{a ?? ""}</Text>
    <Text style={styles.cellVal}>{b ?? ""}</Text>
    <Text style={emphasis ? styles.cellTotal : styles.cellVal}>{total ?? ""}</Text>
  </View>
);

interface Props {
  inputs: CalcInputs;
  outputs: CalcOutputs;
  caption: CaseCaption;
}

export function WorksheetPdfDoc({ inputs, outputs, caption }: Props) {
  const a = inputs.parentALabel || "Parent A";
  const b = inputs.parentBLabel || "Parent B";
  return (
    <Document
      title={caption.matterName || "TN Child Support Worksheet"}
      author="TN Child Support Helper"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h1}>Tennessee Child Support Worksheet</Text>
        <Text style={styles.small}>
          Income Shares Model — Tenn. Comp. R. &amp; Regs. 1240-02-04 (schedule
          effective {outputs.scheduleEffectiveDate}).
        </Text>

        <View style={styles.captionBox}>
          {caption.matterName ? (
            <View style={styles.captionRow}>
              <Text style={styles.captionLabel}>Matter:</Text>
              <Text>{caption.matterName}</Text>
            </View>
          ) : null}
          {caption.docketNumber ? (
            <View style={styles.captionRow}>
              <Text style={styles.captionLabel}>Docket No.:</Text>
              <Text>{caption.docketNumber}</Text>
            </View>
          ) : null}
          {caption.court ? (
            <View style={styles.captionRow}>
              <Text style={styles.captionLabel}>Court:</Text>
              <Text>{caption.court}</Text>
            </View>
          ) : null}
          {caption.preparedBy ? (
            <View style={styles.captionRow}>
              <Text style={styles.captionLabel}>Prepared by:</Text>
              <Text>{caption.preparedBy}</Text>
            </View>
          ) : null}
          {caption.client ? (
            <View style={styles.captionRow}>
              <Text style={styles.captionLabel}>Client:</Text>
              <Text>{caption.client}</Text>
            </View>
          ) : null}
          <View style={styles.captionRow}>
            <Text style={styles.captionLabel}>Children:</Text>
            <Text>
              {inputs.numChildren} (youngest age {inputs.youngestChildAge})
            </Text>
          </View>
        </View>

        <Text style={styles.h2}>I. Adjusted Gross Income</Text>
        <View style={styles.rowHeader}>
          <Text style={styles.cellNum}>#</Text>
          <Text style={styles.cellLabel}>Item</Text>
          <Text style={styles.cellVal}>{a}</Text>
          <Text style={styles.cellVal}>{b}</Text>
          <Text style={styles.cellVal}>Combined</Text>
        </View>
        <Row
          n="1"
          label="Monthly gross income"
          a={fmt(inputs.parentAGrossMonthly)}
          b={fmt(inputs.parentBGrossMonthly)}
        />
        <Row
          n="2"
          label="Self-employment tax credit"
          a={fmt(inputs.parentASECredit)}
          b={fmt(inputs.parentBSECredit)}
        />
        <Row
          n="3"
          label="Credit: prior support"
          a={fmt(inputs.parentAPriorSupport)}
          b={fmt(inputs.parentBPriorSupport)}
        />
        <Row
          n="4"
          label="Credit: in-home children"
          a={fmt(inputs.parentAInhomeCredit)}
          b={fmt(inputs.parentBInhomeCredit)}
        />
        <Row
          n="5"
          label="Adjusted Gross Income"
          a={fmt(outputs.parentAAGI)}
          b={fmt(outputs.parentBAGI)}
          total={fmt(outputs.combinedAGI)}
          emphasis
        />
        <Row
          n="6"
          label="Pro-rata share (PI)"
          a={`${(outputs.piA * 100).toFixed(1)}%`}
          b={`${(outputs.piB * 100).toFixed(1)}%`}
        />

        <Text style={styles.h2}>II. Basic Child Support Obligation</Text>
        <Row
          n="7"
          label="BCSO from schedule"
          total={fmt(outputs.bcso)}
          emphasis
        />
        <Row
          n="8"
          label="Each parent's BCSO share"
          a={fmt(outputs.parentABcsoShare)}
          b={fmt(outputs.parentBBcsoShare)}
        />

        <Text style={styles.h2}>III. Parenting Time Adjustment</Text>
        <Row n="9" label={`ARP: ${outputs.arpIdentity.replace("_", " ")} — band: ${outputs.parentingTimeBand}`} />
        <Row
          n="10"
          label="Net presumptive support"
          total={fmt(outputs.netPresumptiveSupport)}
          emphasis
        />

        <Text style={styles.h2}>IV. Add-Ons</Text>
        <Row n="11" label="Health insurance (from A perspective)" total={fmt(outputs.addOnHealthFromA)} />
        <Row n="12" label="Uninsured medical" total={fmt(outputs.addOnMedicalFromA)} />
        <Row n="13" label="Work-related childcare" total={fmt(outputs.addOnChildcareFromA)} />
        <Row n="14" label="Total add-ons (from A)" total={fmt(outputs.addOnsTotalFromA)} emphasis />

        {outputs.privateSchoolDeviationFromA || outputs.specialExpensesDeviationFromA ? (
          <>
            <Text style={styles.h2}>V. Deviations</Text>
            <Row n="15" label="Private school" total={fmt(outputs.privateSchoolDeviationFromA)} />
            <Row n="16" label="Special expenses" total={fmt(outputs.specialExpensesDeviationFromA)} />
          </>
        ) : null}

        <Text style={styles.h2}>VI. Final Monthly Order</Text>
        <Row
          label="Direction"
          total={dirLabel(outputs.allInDirection, a, b)}
          emphasis
        />
        <Row
          label="Monthly amount"
          total={fmt(outputs.allInMonthly)}
          emphasis
        />
        <Row label="Annualized" total={fmt(outputs.allInAnnual)} />

        {outputs.ssrApplied ? (
          <Text style={styles.footer}>
            Self-support reserve applied: {outputs.ssrNote}
          </Text>
        ) : null}
        {outputs.warnings.length ? (
          <Text style={styles.footer}>
            Notes: {outputs.warnings.join(" • ")}
          </Text>
        ) : null}

        <Text style={styles.footer}>
          This worksheet is a calculation aid produced by TN Child Support
          Helper and implements the Tennessee Income Shares Model. It is not
          legal advice and is not the official AOC form. Verify all inputs and
          consult counsel before filing.
        </Text>
      </Page>
    </Document>
  );
}
