# Mississippi Child Support Calculator
## MS Canonical Spec — TCB Law

*An open-source operational reference for the Mississippi child support calculator at csg.tcblaw.org/ms. Maps Miss. Code Ann. § 43-19-101 (presumptive percentage), § 43-19-103 (ten deviation criteria), § 43-19-36 (incarceration suspension), and § 93-11-65 (age-21 emancipation default) to the data model, the document, and the asynchronous two-attorney workflow. Resolves the small set of mechanical ambiguities in the statute with explicit TCB Law conventions. Authority: Miss. Code Ann. § 43-19-101, -103, -36; § 93-11-65; § 93-5-23 (alimony, separately governed).*

> **Scope.** This document is a working specification, not legal advice. It is designed so that two parties with stipulated input facts will reach the same arithmetic conclusions on the worksheet, every time, regardless of who runs the calculation. Where the underlying authorities leave room for interpretation, this document records TCB Law's chosen reading explicitly, with citation to the source, so the choice is auditable. Where Mississippi places discretion in the chancellor — which is most of where the value of the tool lives — the document organizes the arguments and quantifies the consequences without predetermining the ruling.

---

## §0 Project Charter & Design Principles

### Statements, not positions

The Tennessee canonical opens with a sentence: *"But the number is the number. It is no longer a position. It is a statement."* It is the philosophical north star for both calculators, but it lands differently in Mississippi.

In Tennessee, the statement is the calculated number. The Income Shares model is detailed enough that a correctly-applied worksheet produces an answer both parties should agree is the answer; the calculator's job is to make that calculation transparent so it stops being computed privately as a position and starts being computed publicly as a statement.

In Mississippi, the calculated number is trivial — AGI times a statutory percentage. The number is a starting point, not an endpoint. Mississippi gives the chancellor broad discretion to deviate up or down under ten enumerated criteria, with a catchall, and the practical settlement number in any contested case is whatever the parties negotiate inside that discretion or whatever the chancellor ultimately rules. The MS calculator's job is not to produce the answer. It is to produce the **structured statement of each side's positions on each statutory factor** that the chancellor — or the parties negotiating in the chancellor's shadow — needs to arrive at an answer.

The same north star, applied: convert privately-held positions into shared statements. In Tennessee the statement is the math. In Mississippi the statement is the deviation analysis, the supporting facts, the legal authority, the proposed amount, and the dollar magnitude of every disagreement. Both states get the same architectural commitment — transparency, audit trail, open source — applied to whatever the bottleneck happens to be in that state's law.

### Why a database, not a spreadsheet

Same answer as TN. The deviation worksheet has ten factor records per case, each with multi-field structured input from each of two parties, plus a reconciliation layer that derives per-factor gap quantities and a cumulative-through-emancipation projection. Storing that in cell formulas or hidden macros produces an artifact no one can audit. A relational store with explicit tables, foreign keys, and procedural functions makes every input typed and every derivation explicit. The opensource commitment in §0.3 is downstream of this — civic legal infrastructure has to be inspectable to be civic legal infrastructure.

### Why Mississippi is fundamentally different from Tennessee

The architecture is shared. The application differs. Three commitments make MS its own:

1. **The calculation is decorative; the deviation worksheet is the product.** The MS calculator's "primary output" is not a worksheet line that says "support order: $X/month." It is a structured § 43-19-103 deviation analysis with two-party position capture, factor-by-factor reconciliation, a chancellor's decision surface, and a cumulative-through-emancipation projection. The percentage calculation is a one-line input to that document.

2. **The document is built by two attorneys, asynchronously.** TN's calculator is single-attorney by design. MS's is dual-attorney by necessity — the deviation analysis needs both sides' positions in each side's own words, with each attorney authoring their own column, attributed in the final PDF. The mechanism is URL-based with no server-side state: the link is the document, each attorney holds it for their turn, sends it back, and the worksheet is complete when both have filled their columns.

3. **The chancellor is the customer.** The document's final form is what the chancellor reads to rule, not what the parties read to settle. Settlement uses are downstream of the chancellor-ready document; if the document works for the chancellor it works for everyone upstream. The chancellor needs: statute text verbatim alongside positions, both parties' arguments in their own counsel's words, supporting facts indexed to exhibits, a decision surface where each ruling produces a number, and a final order that reflects the chancellor's chosen application of each factor.

These three commitments shape every convention below.

### Versioning

This document targets the current Mississippi child support statutes as in effect 2026:

- Miss. Code Ann. § 43-19-101 — current text including subsection (5) imputation framework (HB 1067, effective July 1, 2022).
- Miss. Code Ann. § 43-19-36 — incarceration suspension (SB 2082, effective July 1, 2023).
- Miss. Code Ann. § 93-11-65 — age-21 emancipation default with statutory carve-outs.

When the statute is amended, the constants and the factor structure here may need updating. The architecture should make a statute amendment a constants-and-conventions update, not a business-logic rewrite. The version stamp lives at the database level:

```sql
INSERT INTO calculator_version VALUES (
  'statute_version'   = 'Miss. Code Ann. § 43-19-101 (HB 1067 active 2022-07-01)',
  'incarceration_version' = 'Miss. Code Ann. § 43-19-36 (SB 2082 active 2023-07-01)',
  'emancipation_version'  = 'Miss. Code Ann. § 93-11-65 (age 21 default)',
  'spec_version'      = 'TCB Law MS Canonical v1.0'
);
```

### The ten TCB Law conventions — resolved

| # | Convention | Resolution | Source / Note |
|---|---|---|---|
| 1 | AGI computation under § 43-19-101(3) | Full enumeration of allowable deductions (federal/state/local taxes, Social Security contributions, mandatory retirement/disability contributions, existing court-ordered support for other children, optional discretionary allowance for in-home other children). Voluntary deferrals are NOT deducted. | Rule statute |
| 2 | $10k floor and $100k ceiling are **annual** AGI thresholds, not monthly | The statute is ambiguous but is read as annual by Mississippi practitioners and by the structure of § 43-19-101(3)(e) which computes AGI annually then divides by 12. AGI < $10k/year or > $100k/year **requires** a written finding on the record under § 43-19-101(4) as to whether the guideline percentage is reasonable. | Practitioner consensus + statutory structure |
| 3 | MS self-employment add-backs follow TN's §1.6 pattern by analogy | Mississippi's gross-income definition is broader than TN's and the statute is silent on Schedule C add-backs. Practitioner convention treats depreciation, home-office, and excessive promotional/travel/vehicle/personal expenses the same way TN does. Documented as a TCB Law convention pending Mississippi case-law clarification. | TN §1.6 analogy; practitioner convention |
| 4 | Four-state factor classifier per § 43-19-103 factor | Each of the ten factors carries a status: not asserted, obligor only, obligee only, both. "Both" splits into "agree on amount" (a documented stipulation) vs "disagree on amount" (the contested case). The classifier drives the UI and the disagreement-gap calculation. | UX/data convention |
| 5 | Verbatim position requirement | Each party's position is captured in that party's own counsel's words. The calculator does not paraphrase, summarize, or normalize. Position narratives are stored as authored, attributed to the authoring attorney, dated, and displayed verbatim in the final PDF. | UX/data convention; the document IS a structured statement, not a summary |
| 6 | Cumulative-through-emancipation projection | For each child, compute months remaining to age 21 (the § 93-11-65 default), accounting for any statutory carve-outs that would emancipate earlier (marriage, military service, qualifying felony conviction with 2+ year sentence, full-time school discontinuance). For multiple children, the projection uses the **average remaining months** across the children for the cumulative-gap calculation; the per-child obligation is treated as proportional. | § 93-11-65; convention for multi-child cases |
| 7 | Imputation as user-controlled scenario tool | The § 43-19-101(5) factor list (assets, residence, job skills, educational attainment, literacy, age, health, criminal record/barriers, work-seeking record, local job market, prevailing local earnings) appears as a structured form when imputation is asserted. The calculator does not produce a "default imputed amount" — the 2022 amendment specifically forbids standard-amount-in-lieu-of-fact-gathering. User enters the imputed amount with the statutory factors documented as the basis. Same toggle + amount + application-percentage pattern as TN §1.7. | § 43-19-101(5) (HB 1067) |
| 8 | Incarceration suspension as a first-class flow | When the obligor is incarcerated or involuntarily institutionalized for more than 180 consecutive days, support is suspended by operation of law under § 43-19-36, with three statutory carve-outs (offenses involving § 97-3-7 domestic violence, § 97-5-39 child abuse, § 97-5-3 criminal nonpayment) and an exception for obligors with means to pay. The obligation resumes 60 days after release. The calculator surfaces this as a structured input gate; when active, the obligation is set to $0 with the statutory finding language auto-generated. | § 43-19-36 (SB 2082) |
| 9 | Chancellor's decision surface per factor | For each contested factor, the chancellor selects: adopt obligor's proposal, adopt obligee's proposal, split the difference, set a custom amount, or decline the deviation. The selection produces a signed dollar contribution to the final order. The reconciliation panel and the cumulative-through-emancipation projection update live as decisions are made. | UX convention; mirrors actual chancery practice of ruling on each factor individually |
| 10 | Asynchronous two-attorney handoff (case-ID identity) | The deviation worksheet is built by two attorneys in their own browsers, exchanged via URL with no server-side state. Each attorney's contribution is locked when handed off and attributed in the final PDF. A stable `caseId` field in the share payload allows the originator's browser to detect a returned URL as their own across content changes. localStorage is used (client-side only) to save in-progress receiving slates. | Architectural convention; preserves "no server state" commitment while enabling round-trip workflow |

Each of the ten conventions is recorded again, with full reasoning, in §1 of this document.

---

## §1 The Ten TCB Law Conventions — In Detail

### §1.1 AGI computation under § 43-19-101(3)

**Authority.** Miss. Code Ann. § 43-19-101(3)(a)–(e).

**Resolution.** Adjusted Gross Income for purposes of the presumptive percentage calculation is computed as:

```
gross income from all sources
    minus federal income taxes (actual liability for the year; not overwithholding)
    minus state and local income taxes (same)
    minus Social Security contributions
    minus mandatory retirement and disability contributions ONLY
        (voluntary retirement and disability contributions are NOT deducted)
    minus amount of any existing court-ordered support for another child or children
    minus (court's discretion) an amount for in-home other children of the obligor parent
        (no statutory formula — purely judicial discretion)
equals annual AGI
    divided by 12 = monthly AGI
```

**Gross income** under § 43-19-101(3)(a) is broadly defined: wages, salary, self-employment income, commissions, investment income (dividends, interest, trust income), the obligor's portion of joint income, workers' compensation, disability, unemployment, annuity and retirement benefits including IRA, payments from any person or government entity, alimony, inherited property income, any other earned income. **Excluded:** monetary benefits from a second household, including the income of the obligor's current spouse.

**The "voluntary" qualifier on retirement deductions is operationally significant.** Subsection (3)(b)(iii) specifically excludes "any voluntary retirement and disability contributions" from the mandatory-deduction category. A parent's voluntary 401(k) deferrals do not reduce AGI for child-support purposes — only mandatory pension/retirement/disability contributions do. Practitioners should confirm the deduction category before treating it as mandatory.

**The "in-home other children" deduction (subsection (3)(d)) is purely discretionary.** The statute says "the court may subtract an amount that it deems appropriate to account for the needs of said child or children." There is no formula, no presumed amount. The calculator captures the user-entered amount with required rationale, but presents it as judicial discretion the chancellor may grant or deny.

**Self-employment income.** The statute does not address Schedule C add-backs. TCB Law convention §1.3 (below) applies the same add-back framework Tennessee uses, by analogy and practitioner consensus.

**Database scaffolding:**

```sql
CREATE TABLE ms_obligor_income (
  case_id                       INTEGER PRIMARY KEY REFERENCES ms_case(case_id),
  annual_gross_all_sources      NUMERIC NOT NULL CHECK (annual_gross_all_sources >= 0),
  annual_federal_tax            NUMERIC NOT NULL DEFAULT 0,
  annual_state_local_tax        NUMERIC NOT NULL DEFAULT 0,
  annual_social_security        NUMERIC NOT NULL DEFAULT 0,
  annual_mandatory_retirement   NUMERIC NOT NULL DEFAULT 0,
  annual_voluntary_retirement   NUMERIC NOT NULL DEFAULT 0,   -- captured for transparency; NOT deducted
  annual_existing_court_support NUMERIC NOT NULL DEFAULT 0,
  annual_in_home_discretionary  NUMERIC NOT NULL DEFAULT 0,
  in_home_discretionary_rationale TEXT,
  CONSTRAINT no_excessive_taxes CHECK (annual_federal_tax + annual_state_local_tax <= annual_gross_all_sources)
);

CREATE FUNCTION ms_compute_monthly_agi(case_id INTEGER) RETURNS NUMERIC AS $$
DECLARE r RECORD; annual_agi NUMERIC;
BEGIN
  SELECT * INTO r FROM ms_obligor_income WHERE ms_obligor_income.case_id = $1;
  annual_agi := r.annual_gross_all_sources
              - r.annual_federal_tax
              - r.annual_state_local_tax
              - r.annual_social_security
              - r.annual_mandatory_retirement
              - r.annual_existing_court_support
              - r.annual_in_home_discretionary;
  RETURN GREATEST(0, annual_agi / 12.0);
END;
$$ LANGUAGE plpgsql;
```

### §1.2 The $10,000 / $100,000 thresholds are annual

**Authority.** Miss. Code Ann. § 43-19-101(4).

**Resolution.** The statute reads: *"In cases in which the adjusted gross income as defined in this section is more than One Hundred Thousand Dollars ($100,000.00) or less than Ten Thousand Dollars ($10,000.00), the court shall make a written finding in the record as to whether or not the application of the guidelines established in this section is reasonable."*

The text is ambiguous about whether the thresholds are monthly or annual figures. TCB Law convention: **annual**, based on three considerations:

1. **Statutory structure.** Subsection (3)(e) computes AGI annually first and then divides by 12 to produce a monthly figure. The natural reading of subsection (4) is that the threshold applies to the antecedent AGI calculation, which is annual.
2. **Practitioner consensus.** Mississippi practitioners interpret these as annual, and chancery courts have applied them as annual. A monthly reading would put almost every case above the $10k threshold and almost no case above the $100k threshold, rendering the floor irrelevant and the ceiling almost never triggered.
3. **Comparison to Tennessee.** Tennessee's analogous high-income trigger under Tenn. Code Ann. § 36-5-101(e)(1)(B) is explicitly a $10,000 monthly threshold. If Mississippi intended monthly, it would have said so similarly.

**Action when triggered.** A written finding is required on the record. The calculator surfaces this as a required-finding flag (visible to the chancellor on the output document) whenever annual AGI falls outside the $10,000–$100,000 band. The flag does not predetermine the finding — the chancellor still must apply judgment to whether the guideline percentage is reasonable in the case at hand — but the procedural requirement is made explicit in the document so it cannot be overlooked.

**Database scaffolding:**

```sql
CREATE FUNCTION ms_required_finding_flag(annual_agi NUMERIC) RETURNS TEXT AS $$
  SELECT CASE
    WHEN annual_agi < 10000  THEN 'low_income_threshold'
    WHEN annual_agi > 100000 THEN 'high_income_threshold'
    ELSE NULL
  END;
$$ LANGUAGE SQL IMMUTABLE;
```

### §1.3 Self-employment add-backs in MS — follows TN §1.6 by analogy

**Authority.** Miss. Code Ann. § 43-19-101(3)(a) (gross income from "income from self-employment"); statutory silence on the computation; TN Rule 1240-02-04-.04(3)(a)(3) as analogy; practitioner convention.

**Resolution.** Where the obligor is self-employed, MS gross income for purposes of § 43-19-101(3) is computed by:

1. Starting from gross receipts.
2. Deducting only "ordinary and reasonable" expenses necessary to produce the income.
3. Adding back the four categories the rule restricts — same as TN §1.6:
   - **Depreciation in full.** Treated as a tax-accounting convention rather than a real cost.
   - **Home office expenses in full.**
   - **Excessive promotional, travel, vehicle, or personal expenses** — the fact-finder's percentage determination of excessive within each category is added back.
4. The resulting annualized figure flows into § 43-19-101(3)(a) gross income.

**Why this convention is necessary.** Mississippi's statute is silent on self-employment computation. A practitioner using IRS Schedule C net profit as the gross-income input dramatically understates the obligor's actual income, because the IRS allows deductions (depreciation, home office, etc.) that the child-support purpose does not contemplate. The TN rule explicitly closes this gap; the MS calculator closes it by convention.

**Limitation.** Mississippi case law has not directly endorsed the TN-style add-back framework. The convention is offered as a practitioner-defensible reading; a chancellor may choose to apply a different framework. The document records the chancellor's chosen treatment.

**Database scaffolding:** identical structure to TN canonical §1.6, applied to MS gross-income input.

### §1.4 Four-state factor classifier per § 43-19-103 factor

**Authority.** Miss. Code Ann. § 43-19-103; structural requirement of the deviation analysis.

**Resolution.** Each of the ten enumerated § 43-19-103 factors carries a status with four primary values:

| Classifier | UI rendering | Behavioral effect |
|---|---|---|
| `not_asserted` | Visually de-emphasized (faded); collapsible to a one-line summary | Does not contribute to the reconciliation; appears in the audit trail as "not asserted by either party" |
| `obligor_only` | Single-party position visible in the obligor's column; obligee column shows "$0" or explicit non-position | Treated as a one-sided proposal; chancellor's decision determines whether to grant or deny |
| `obligee_only` | Mirror image — obligee column shows position, obligor shows "$0" | Same as obligor_only, reversed |
| `both` | Both columns populated; further refined by the agreed/disputed sub-classifier below | The contested case; reconciliation quantifies the gap |

The `both` value carries a sub-classifier:

| Sub-classifier | Trigger | Behavioral effect |
|---|---|---|
| `agreed_amount` | Both parties propose the same dollar adjustment | Treated as a stipulation; the chancellor's decision surface offers "accept agreed" as the default; the factor appears in the reconciliation with no gap |
| `disagreed_amount` | Parties propose different dollar adjustments | The fully-contested case; the gap is quantified; the chancellor's decision surface offers all five options (adopt obligor, adopt obligee, split, custom, decline) |

**Why the classifier matters.** The four states are not just metadata — they drive how the document reads. A chancellor scanning a factor that's `not_asserted` should be able to skip it immediately; one that's `agreed_amount` should require only confirmation; one that's `disagreed_amount` should be the focus of attention. The visual treatment makes this evident at a glance, and the reconciliation panel only quantifies gaps where the classifier indicates a gap exists.

**Database scaffolding:**

```sql
CREATE TYPE factor_status AS ENUM (
  'not_asserted', 'obligor_only', 'obligee_only', 'both_agreed', 'both_disagreed'
);

CREATE TABLE ms_factor_assertion (
  case_id           INTEGER NOT NULL REFERENCES ms_case(case_id),
  factor_letter     CHAR(1) NOT NULL CHECK (factor_letter IN ('a','b','c','d','e','f','g','h','i','j')),
  status            factor_status NOT NULL DEFAULT 'not_asserted',
  PRIMARY KEY (case_id, factor_letter)
);
```

### §1.5 Verbatim position requirement

**Authority.** UX / data convention; reflects the document's purpose as a structured statement of each party's positions.

**Resolution.** When a party asserts a deviation under any § 43-19-103 factor, that party's position narrative is captured in the authoring attorney's own words and stored verbatim. The calculator does not summarize, paraphrase, or normalize the language. The PDF presents the narrative as written, with attribution: "Per counsel for Obligor — [attorney name]: [narrative]."

**Why verbatim matters.** Three reasons.

1. **The chancellor needs to read what counsel argued, not what the calculator inferred.** Counsel's word choice carries legal significance — invoking specific case law, framing the children's needs in particular language, emphasizing particular facts. A paraphrase loses information.
2. **The document is a litigation-ready exhibit.** When attached to a motion, an affidavit, or the final order, the document must reflect what counsel actually said. A summary would expose counsel to the risk of being "summarized" into a position they did not take.
3. **The opposing attorney's view is opposing counsel's, not the calculator's view of opposing counsel.** The two-attorney handoff is the mechanism that makes this real: each side authors their own column. The verbatim convention is the policy commitment that makes the mechanism honest.

**The position narrative is one of six fields** captured per factor, per asserting party. Per the design:

| Field | Required | Description |
|---|---|---|
| Position narrative | Yes if asserting | Verbatim text from the authoring attorney explaining the party's position on this factor |
| Supporting facts | Recommended | Bulleted facts the position relies on |
| Documentation references | Recommended | Exhibit numbers / document identifiers supporting the facts |
| Proposed monthly adjustment | Yes if asserting | Signed dollar amount (negative = downward deviation, positive = upward) |
| Legal authority | Recommended | Statutory subsection cite plus any case law |
| Authored by | Auto-captured | Attorney name + date + handoff round |

**Database scaffolding:**

```sql
CREATE TABLE ms_factor_position (
  case_id              INTEGER NOT NULL REFERENCES ms_case(case_id),
  factor_letter        CHAR(1) NOT NULL CHECK (factor_letter IN ('a','b','c','d','e','f','g','h','i','j')),
  party                CHAR(1) NOT NULL CHECK (party IN ('O','E')),  -- O=obligor, E=obligee
  narrative            TEXT NOT NULL,
  supporting_facts     TEXT,
  documentation_refs   TEXT,
  proposed_monthly     NUMERIC,                       -- signed: negative = down, positive = up
  legal_authority      TEXT,
  authored_by_name     TEXT NOT NULL,
  authored_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  handoff_round        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (case_id, factor_letter, party)
);
```

### §1.6 Cumulative-through-emancipation projection

**Authority.** Miss. Code Ann. § 93-11-65 (age 21 default; carve-outs for marriage, military service, qualifying felony conviction with 2+ year sentence, full-time school discontinuance).

**Resolution.** For each child in the case, compute months remaining to age 21 as of the case effective date. Apply any user-asserted earlier-emancipation circumstance (with documentation) to reduce that figure to the projected emancipation date for that specific child. The default — used for the great majority of cases — is age 21.

For the cumulative-through-emancipation projection in the reconciliation panel, compute the **average remaining months across the children**. For example: two children at ages 14 and 10 → child 1 has 84 months remaining, child 2 has 132 months remaining, average is 108 months. The cumulative figure is the monthly amount × 108.

**Why average rather than per-child computation.** The MS statute treats the support obligation as a single amount for all children together (not per child), and the percentage table accordingly steps up by child count. When children emancipate one by one, the recalculation drops the support to the new child-count percentage — a complex schedule the calculator can model in detail but that doesn't fit the cumulative-projection use case. The average-months figure produces a fair total-impact estimate for negotiation and is consistent with how chancellors typically discuss the long-term economic effect.

**The cumulative-through-emancipation figure is the negotiation anchor.** A $400/month disagreement on factor (e) looks small until the document shows "$43,200 over 108 average remaining months." That number is what makes parties move toward settlement.

**Earlier-emancipation handling.** When a user marks a child as already emancipated under one of the four § 93-11-65 carve-outs, the calculator removes that child from the projection. If the user is asserting an anticipated earlier emancipation that hasn't yet occurred (e.g., the child has enlisted, marries the following month, etc.), the calculator notes the uncertainty in the document and uses the user-supplied projected emancipation date for the projection.

**Database scaffolding:**

```sql
CREATE TABLE ms_child (
  case_id                       INTEGER NOT NULL REFERENCES ms_case(case_id),
  child_id                      SERIAL PRIMARY KEY,
  name                          TEXT,
  date_of_birth                 DATE NOT NULL,
  emancipated_status            TEXT CHECK (emancipated_status IN (
    'minor', 'emancipated_age', 'emancipated_marriage',
    'emancipated_military', 'emancipated_felony', 'emancipated_school_dropout'
  )) DEFAULT 'minor',
  projected_emancipation_date   DATE     -- defaults to 21st birthday; user override allowed
);

CREATE FUNCTION ms_cumulative_months(case_id INTEGER, as_of DATE) RETURNS NUMERIC AS $$
  WITH per_child AS (
    SELECT EXTRACT(epoch FROM (COALESCE(projected_emancipation_date, date_of_birth + INTERVAL '21 years') - as_of)) / (30.4375 * 86400) AS months
    FROM ms_child
    WHERE ms_child.case_id = $1
      AND emancipated_status = 'minor'
  )
  SELECT GREATEST(0, AVG(months)) FROM per_child;
$$ LANGUAGE SQL STABLE;
```

### §1.7 Imputation as user-controlled scenario tool

**Authority.** Miss. Code Ann. § 43-19-101(5) (HB 1067, effective July 1, 2022).

**Resolution.** The 2022 amendment prohibits "imputation of income . . . based upon a standard amount in lieu of fact-gathering" and requires imputed amounts to be based on specific enumerated factors:

| Factor (per § 43-19-101(5)) |
|---|
| Obligated parent's assets |
| Obligated parent's residence |
| Obligated parent's job skills |
| Obligated parent's educational attainment |
| Obligated parent's literacy |
| Obligated parent's age |
| Obligated parent's health |
| Obligated parent's criminal record and other employment barriers |
| Obligated parent's record of seeking work |
| The local job market |
| The availability of employers willing to hire the obligated parent |
| Prevailing earnings level in the local community |

When a party asserts imputed income, the calculator presents a structured form covering these twelve factors. The asserting party documents the position factor-by-factor in their own words (per §1.5). The calculator does not produce a "default imputed amount" — by statute, that would be improper.

**The imputed monthly amount is user-entered.** The party asserting imputation enters the figure they propose, with the twelve-factor documentation as the basis. The calculator's role is to make the imputed amount visible alongside the actual income, run the percentage calculation against both as a side-by-side comparison (consistent with TN §1.7's application-percentage slider), and let the chancellor (or mediator) see the dollar magnitude of the imputation dispute as a discrete number.

**The toggle + amount + application-percentage pattern from TN §1.7 carries over.** When the imputation toggle is active, the user enters the imputed monthly amount. The application percentage 0–100% blends actual and imputed for scenario modeling. The percentage exists to let users model the realistic range of judicial outcomes — chancellors rarely impute the full proposed amount, and the slider quantifies what partial imputation produces.

**Audit-trail labeling.** When imputation is active, the audit trail labels the downstream amounts as "scenario modeling — not a court determination." The chancellor's decision surface on the factor under which imputation is asserted (typically § 43-19-103(g), (h), or (j)) is where the imputation actually gets ruled on.

**Database scaffolding:**

```sql
CREATE TABLE ms_imputation_override (
  case_id                  INTEGER PRIMARY KEY REFERENCES ms_case(case_id),
  is_active                BOOLEAN NOT NULL DEFAULT FALSE,
  imputed_annual           NUMERIC,
  application_pct          NUMERIC DEFAULT 100 CHECK (application_pct BETWEEN 0 AND 100),
  factor_assets            TEXT,
  factor_residence         TEXT,
  factor_job_skills        TEXT,
  factor_educational       TEXT,
  factor_literacy          TEXT,
  factor_age               TEXT,
  factor_health            TEXT,
  factor_criminal_barriers TEXT,
  factor_work_seeking      TEXT,
  factor_local_job_market  TEXT,
  factor_employer_willing  TEXT,
  factor_prevailing_local  TEXT,
  asserted_by              CHAR(1) CHECK (asserted_by IN ('O','E')),
  CHECK (NOT is_active OR imputed_annual IS NOT NULL)
);
```

### §1.8 Incarceration suspension as a first-class flow

**Authority.** Miss. Code Ann. § 43-19-36 (SB 2082, effective July 1, 2023).

**Resolution.** Where the obligor is incarcerated or involuntarily institutionalized for more than 180 consecutive days, the support obligation is suspended by operation of law under § 43-19-36. The statute provides:

- The suspension is **automatic** — by operation of law, not motion-dependent.
- Three carve-outs preserve the obligation: offenses involving § 97-3-7 domestic violence, § 97-5-39 child abuse, or § 97-5-3 criminal nonpayment of support.
- An exception preserves obligation when the obligor has **means to pay** during incarceration.
- The obligation **resumes 60 days after release** from the qualifying incarceration.

**Calculator implementation.** When the user indicates the obligor is incarcerated or institutionalized, the calculator presents an input gate:

1. **Duration check.** Confirm the period of incarceration exceeds 180 consecutive days. If shorter, suspension does not apply.
2. **Carve-out check.** Identify whether the underlying offense falls into one of the three carve-outs. If yes, suspension does not apply.
3. **Means-to-pay check.** Identify whether the obligor has assets, prison-job income, or other means to pay during incarceration. If yes, the suspension may not fully apply; the document captures the means-to-pay analysis for chancery review.
4. **Suspension result.** If suspension applies in full: the obligation for the suspension period is $0; the calculator emits the suspension-finding language as required output text; arrears do not accrue during the suspension period; the 60-day post-release resumption window is documented.

**The default position for an incarcerated obligor is suspension.** The carve-outs and the means-to-pay exception must be affirmatively established by the obligee or the chancellor; otherwise the statutory default applies. This is a meaningful shift from the pre-2023 framework where arrearages continued to accrue during incarceration.

**Database scaffolding:**

```sql
CREATE TABLE ms_incarceration_status (
  case_id                INTEGER PRIMARY KEY REFERENCES ms_case(case_id),
  is_incarcerated        BOOLEAN NOT NULL DEFAULT FALSE,
  incarceration_start    DATE,
  expected_release_date  DATE,
  days_exceeds_180       BOOLEAN GENERATED ALWAYS AS (
    expected_release_date IS NOT NULL AND incarceration_start IS NOT NULL
    AND (expected_release_date - incarceration_start) > 180
  ) STORED,
  offense_category       TEXT CHECK (offense_category IN (
    'none', 'domestic_violence_97_3_7', 'child_abuse_97_5_39', 'criminal_nonpayment_97_5_3', 'other'
  )) DEFAULT 'none',
  has_means_to_pay       BOOLEAN DEFAULT FALSE,
  means_to_pay_rationale TEXT,
  CONSTRAINT must_have_rationale CHECK (NOT has_means_to_pay OR means_to_pay_rationale IS NOT NULL)
);

CREATE FUNCTION ms_suspension_applies(case_id INTEGER) RETURNS BOOLEAN AS $$
  SELECT
    is_incarcerated
    AND days_exceeds_180
    AND offense_category = 'none'
    AND NOT has_means_to_pay
  FROM ms_incarceration_status WHERE ms_incarceration_status.case_id = $1;
$$ LANGUAGE SQL STABLE;
```

### §1.9 Chancellor's decision surface

**Authority.** Implementation convention; reflects actual chancery practice of ruling on each statutory factor individually.

**Resolution.** For each § 43-19-103 factor that is in dispute (or asserted by one side only), the chancellor's decision surface offers five options, presented as a horizontal button row in the UI:

| Option | When available | Result |
|---|---|---|
| Adopt obligor's proposal | Whenever obligor has proposed an amount | Final-order contribution from this factor = obligor's proposed amount |
| Adopt obligee's proposal | Whenever obligee has proposed an amount | Final-order contribution from this factor = obligee's proposed amount |
| Split the difference | When both parties have proposed amounts | Final-order contribution = arithmetic mean of obligor's and obligee's proposals |
| Custom amount | Always | Chancellor enters a specific dollar figure; the calculator accepts the entry and updates downstream values |
| Decline deviation | Always | No deviation under this factor; final-order contribution = $0 |

**When both parties agree on the amount** (`both_agreed` per §1.4), the surface collapses to two options: accept agreed amount (default) or decline. Splits don't apply because there's no difference to split.

**Live recalculation.** Every change to the decision surface immediately updates: the sticky live-bar at the top of the document, the reconciliation table at the bottom, the cumulative-through-emancipation projection, and the final order amount. The chancellor sees the consequence of each ruling before making the next.

**Audit trail.** Each chancellor decision is recorded in the audit trail with: factor letter, chosen option, resulting dollar contribution, timestamp. When the chancellor saves or prints the document, the saved version reflects the chancellor's chosen rulings; if the parties later wish to model alternative scenarios, they re-open the worksheet and play with the buttons without affecting the chancellor's saved order.

**Database scaffolding:**

```sql
CREATE TABLE ms_chancellor_decision (
  case_id            INTEGER NOT NULL REFERENCES ms_case(case_id),
  factor_letter      CHAR(1) NOT NULL CHECK (factor_letter IN ('a','b','c','d','e','f','g','h','i','j')),
  decision           TEXT NOT NULL CHECK (decision IN (
    'adopt_obligor', 'adopt_obligee', 'split_difference', 'custom', 'decline', 'accept_agreed'
  )),
  custom_amount      NUMERIC,
  decided_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (case_id, factor_letter)
);

CREATE FUNCTION ms_decision_contribution(case_id INTEGER, factor CHAR(1)) RETURNS NUMERIC AS $$
DECLARE
  d RECORD;
  obligor_prop NUMERIC;
  obligee_prop NUMERIC;
BEGIN
  SELECT * INTO d FROM ms_chancellor_decision
    WHERE ms_chancellor_decision.case_id = $1 AND factor_letter = factor;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT proposed_monthly INTO obligor_prop FROM ms_factor_position
    WHERE ms_factor_position.case_id = $1 AND factor_letter = factor AND party = 'O';
  SELECT proposed_monthly INTO obligee_prop FROM ms_factor_position
    WHERE ms_factor_position.case_id = $1 AND factor_letter = factor AND party = 'E';

  CASE d.decision
    WHEN 'adopt_obligor'    THEN RETURN COALESCE(obligor_prop, 0);
    WHEN 'adopt_obligee'    THEN RETURN COALESCE(obligee_prop, 0);
    WHEN 'split_difference' THEN RETURN ROUND((COALESCE(obligor_prop,0) + COALESCE(obligee_prop,0)) / 2);
    WHEN 'custom'           THEN RETURN COALESCE(d.custom_amount, 0);
    WHEN 'accept_agreed'    THEN RETURN COALESCE(obligor_prop, obligee_prop, 0);
    WHEN 'decline'          THEN RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

### §1.10 Asynchronous two-attorney handoff with case-ID identity

**Authority.** Architectural convention; the technical fix identified in the prior UX redesign spec.

**Resolution.** The MS deviation worksheet is built collaboratively by two attorneys, exchanged via URL with no server-side state. The mechanism is asynchronous (not real-time) and operates on each attorney's own schedule, the same way attorneys already exchange position papers.

**The handoff has five moments:**

| # | Moment | Status | Who's looking | Primary action |
|---|---|---|---|---|
| 1 | Drafting | `none` | Originator | Send to opposing counsel |
| 2 | Sent — awaiting response | `originated` | Originator | (resend link) |
| 3 | Your turn | `originated` or `in_progress` | Receiving counsel | Send back, or download final |
| 4 | Returned for review | `in_progress` + originator browser detected | Originator | Send revisions back, or download final |
| 5 | Complete | `completed` | Either side | Download final PDF |

**The case-ID identity fix.** v1's originator detection keyed off `fingerprint(inputs + caption)`. When the receiving attorney edited the deviation slate, the fingerprint changed, and the originator's browser failed to detect a returned URL as their own. The fix:

- A `caseId` field is added to the share payload root (random UUID, generated at first Send).
- localStorage key for origination tokens becomes `ms.handoff.origins.{caseId}` rather than `ms.handoff.origins.fp:{fingerprint}`.
- The originator's `recordOriginatedHandoff` writes under the caseId. On any subsequent URL open, `isOriginatorBrowser` checks for a token under that URL's caseId — match means originator's browser; no match means receiving-side opener.
- Legacy URLs without caseId fall back to fingerprint check (or default to non-originator behavior); existing share URLs in the wild keep working.

**Receiving-side persistence.** The receiving attorney's in-progress slate is saved to localStorage under `ms.handoff.draft.{caseId}`. On reopening the URL in the same browser, the calculator prompts: "Continue from where you left off? You had positions in progress when you last visited." Removes the "I closed the tab and lost my work" failure mode without breaking the no-server-state commitment.

**The PDF attribution.** When both attorneys have filled their columns and either party clicks "Download final worksheet," the resulting PDF includes:

- A header identifying both attorneys: "Counsel for Obligor: [Name], [Firm] · Counsel for Obligee: [Name], [Firm]."
- Per-entry attribution: every position narrative is labeled "Per counsel for Obligor — [name]: [text]" or "Per counsel for Obligee — [name]: [text]."
- The handoff round (1 if single exchange; higher if the worksheet went back and forth multiple times for revisions).

**The URL is the entire transport.** No server-side state, no third-party storage, no telemetry. The state encoded in the URL contains every input, every position, every chancellor decision (if any), and the caseId. Both attorneys can hold their copy of the URL indefinitely; either can re-open it at any time to see the worksheet as it stood at last save.

**Database scaffolding (client-side localStorage shapes):**

```typescript
// Per-case origination identity
type OriginationStore = Record<
  `case:${string}` | `fp:${string}`,   // case:{caseId} (current) or fp:{fingerprint} (legacy)
  string                                 // 16-hex-byte origination token
>;
// localStorage key: "ms.handoff.origins"

// Per-case receiving-side draft
interface ReceivingDraft {
  inputs: MSInputs;
  handoff: HandoffState;
  baseShareHash: string;       // hash of the share URL when received; detects mismatches
  savedAt: string;             // ISO timestamp
}
// localStorage key: `ms.handoff.draft.${caseId}`
```

**Share payload v4 (bumps the v3 schema to add caseId):**

```typescript
interface MSSharePayloadV4 {
  v: 4;
  s: "MS";
  caseId: string;              // UUID; stable across round-trips
  i: MSInputs;
  c: MSCaseCaption;
  h: HandoffState;
}
// v2/v3 legacy payloads still readable; caseId backfilled from fingerprint on legacy load
```

---

## §2 Database Schema Overview

The MS calculator's relational model groups data into five entity clusters: case identification, parties and children, income inputs, factor assertions and chancellor decisions, and handoff state. Reference data (the percentage table, statute citations) is read-only.

```
                       ┌──────────────────┐
                       │     ms_case      │
                       └────────┬─────────┘
                                │ 1
              ┌─────────────────┼─────────────────┐
            * │                 │ *              * │
        ┌─────▼──────┐    ┌─────▼──────┐    ┌─────▼─────────┐
        │ ms_attorney│    │ ms_child   │    │ms_factor_position│
        └────────────┘    └────────────┘    └──────────────────┘
                                                    │
                                          ┌─────────▼──────────┐
                                          │ms_factor_assertion │
                                          └─────────┬──────────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │ms_chancellor_dec  │
                                          └───────────────────┘

  Reference tables:
    ms_percentage_table      — 14/20/22/24/26% by child count
    ms_factor_statute_text   — verbatim statute text for each of 10 factors
    ms_emancipation_default  — § 93-11-65 age-21 + carve-outs

  Per-case auxiliary:
    ms_obligor_income        — § 1.1 AGI inputs
    ms_imputation_override   — § 1.7 imputation factors and amount
    ms_incarceration_status  — § 1.8 incarceration suspension state
    ms_audit_trail           — every computation, every chancellor decision
```

### Core entity tables

```sql
CREATE TABLE ms_case (
  case_id              SERIAL PRIMARY KEY,
  matter_name          TEXT NOT NULL,
  docket_number        TEXT,
  court                TEXT NOT NULL,             -- e.g., "Mississippi Chancery Court, Lafayette County"
  case_caption_party_a TEXT NOT NULL,             -- typically the obligor
  case_caption_party_b TEXT NOT NULL,             -- typically the obligee
  effective_date       DATE NOT NULL,
  parenting_arrangement TEXT NOT NULL,            -- "50/50 joint physical" | "primary with [name]" | etc.
  statute_version      TEXT NOT NULL DEFAULT 'Miss. Code Ann. § 43-19-101 (HB 1067 active 2022-07-01)',
  spec_version         TEXT NOT NULL DEFAULT 'TCB Law MS Canonical v1.0',
  obligor_party        CHAR(1) NOT NULL CHECK (obligor_party IN ('A','B'))
);

CREATE TABLE ms_attorney (
  case_id            INTEGER NOT NULL REFERENCES ms_case(case_id),
  representing_party CHAR(1) NOT NULL CHECK (representing_party IN ('A','B')),
  name               TEXT NOT NULL,
  firm               TEXT,
  email              TEXT,
  PRIMARY KEY (case_id, representing_party)
);
```

### Reference: Percentage table per § 43-19-101(1)

```sql
CREATE TABLE ms_percentage_table (
  num_children   INTEGER PRIMARY KEY CHECK (num_children BETWEEN 1 AND 10),
  percentage     NUMERIC NOT NULL          -- decimal form: 0.14, 0.20, 0.22, 0.24, 0.26
);

INSERT INTO ms_percentage_table VALUES
  (1, 0.14),
  (2, 0.20),
  (3, 0.22),
  (4, 0.24),
  (5, 0.26);
-- For 6+ children, treat as 5+ per "or more" statutory language

CREATE FUNCTION ms_presumptive_monthly(case_id INTEGER) RETURNS NUMERIC AS $$
DECLARE
  monthly_agi NUMERIC;
  pct NUMERIC;
  num_children INTEGER;
BEGIN
  monthly_agi := ms_compute_monthly_agi($1);
  SELECT COUNT(*) INTO num_children
    FROM ms_child
    WHERE ms_child.case_id = $1
      AND emancipated_status = 'minor';
  SELECT percentage INTO pct FROM ms_percentage_table WHERE ms_percentage_table.num_children = LEAST(num_children, 5);
  RETURN ROUND(monthly_agi * pct);
END;
$$ LANGUAGE plpgsql;
```

### Reference: § 43-19-103 statute text per factor

```sql
CREATE TABLE ms_factor_statute_text (
  factor_letter   CHAR(1) PRIMARY KEY CHECK (factor_letter IN ('a','b','c','d','e','f','g','h','i','j')),
  short_name      TEXT NOT NULL,
  full_text       TEXT NOT NULL            -- verbatim from § 43-19-103
);

INSERT INTO ms_factor_statute_text VALUES
  ('a', 'Extraordinary medical, psychological, educational, or dental expenses',
        'Extraordinary medical, psychological, educational or dental expenses.'),
  ('b', 'Independent income of the child',
        'Independent income of the child.'),
  ('c', 'Both child support and spousal support to the obligee',
        'The payment of both child support and spousal support to the obligee.'),
  ('d', 'Seasonal variations in income or expenses',
        'Seasonal variations in one or both parents'' incomes or expenses.'),
  ('e', 'Age of child — greater needs of older children',
        'The age of the child, taking into account the greater needs of older children.'),
  ('f', 'Special needs traditionally met within the family budget',
        'Special needs that have traditionally been met within the family budget even though the fulfilling of those needs will cause the support to exceed the proposed guidelines.'),
  ('g', 'Particular shared parental arrangement',
        'The particular shared parental arrangement, such as where the noncustodial parent spends a great deal of time with the children thereby reducing the financial expenditures incurred by the custodial parent, or the refusal of the noncustodial parent to become involved in the activities of the child, or giving due consideration to the custodial parent''s homemaking services.'),
  ('h', 'Total available assets',
        'Total available assets of the obligee, obligor and the child.'),
  ('i', 'Obligee''s childcare expenses for employment',
        'Payment by the obligee of child care expenses in order that the obligee may seek or retain employment, or because of the disability of the obligee.'),
  ('j', 'Equitable result catchall',
        'Any other adjustment which is needed to achieve an equitable result which may include, but not be limited to, a reasonable and necessary existing expense or debt.');
```

---

## §3 Per-Factor Treatment — § 43-19-103 (a) Through (j)

This section provides operational guidance for each of the ten enumerated factors: common assertion patterns by each side, typical supporting facts, applicable Mississippi case law, common dollar magnitudes, and computational notes.

### § 43-19-103(a) — Extraordinary medical, psychological, educational, or dental expenses

**Statute:** *Extraordinary medical, psychological, educational or dental expenses.*

**Common assertion patterns:** Private school tuition (most common); orthodontic and dental treatment plans; educational therapy for learning differences; mental health treatment beyond what insurance covers; tutoring for children with documented needs.

**Obligor's typical assertion (downward deviation):** Obligor pays the extraordinary expense directly and the presumptive percentage already includes typical expenses; the direct payment should reduce the cash transfer. Common dollar magnitude: the full monthly cost of the directly-paid item, less the obligee's pro rata share.

**Obligee's typical assertion (varies):** May concede partial downward adjustment but argue the magnitude. May assert additional extraordinary expenses (orthodontic, therapy) that warrant upward adjustment offsetting the obligor's downward request.

**Mississippi case law:** *Tedford v. Dempsey*, 437 So. 2d 410 (Miss. 1983); *Knutson v. Knutson*, 704 So. 2d 1331 (Miss. 1997).

**Computational note:** The deviation magnitude is typically computed as the obligor's pro rata share of the directly-paid expense, signed negative if the obligor is paying and a downward deviation is sought. The calculator does not impose a per-cap; the asserting party documents the amount and the chancellor rules.

### § 43-19-103(b) — Independent income of the child

**Statute:** *Independent income of the child.*

**Common assertion patterns:** Rare in standard cases. May apply when a child has substantial inherited assets producing income, trust income, an established earning history (e.g., child actor, model, gifted athlete), or a Social Security survivor's benefit.

**Obligor's typical assertion (downward):** Child has independent income sufficient to reduce the support obligation. Common dollar magnitude: the monthly amount of the child's independent income, potentially the full reduction.

**Obligee's typical assertion (resistance):** The child's income is for the child's future needs, not for offsetting the obligor's current obligation; reducing support would have the perverse effect of redirecting the child's resources to the obligor.

**Computational note:** Where asserted, the magnitude is typically the documented monthly income of the child. The chancellor rules on whether to apply it as a deviation and at what level.

### § 43-19-103(c) — Payment of both child support and spousal support to the obligee

**Statute:** *The payment of both child support and spousal support to the obligee.*

**Common assertion patterns:** Only applies when the obligor is paying both child support and alimony to the same obligee. Mississippi alimony is governed separately by Miss. Code Ann. § 93-5-23. The presence of an alimony obligation may warrant downward deviation in the child support calculation to avoid double-counting the obligor's overall transfer to the obligee.

**Obligor's typical assertion (downward):** Total transfer to obligee (child support + alimony) exceeds reasonable need; downward deviation in child support recognizes the dual payment.

**Obligee's typical assertion (resistance):** The two obligations serve different purposes (child support for the children's needs vs. alimony for the obligee's needs); double-counting is not the right frame.

**Computational note:** Where invoked, the deviation magnitude reflects the chancellor's view of the total transfer's reasonableness, typically capped at the alimony amount.

### § 43-19-103(d) — Seasonal variations in income or expenses

**Statute:** *Seasonal variations in one or both parents' incomes or expenses.*

**Common assertion patterns:** Construction trades, agriculture, fisheries, ski-resort hospitality, retail-heavy commission businesses. Either parent's income may be seasonal.

**Common deviation pattern:** The deviation typically operates by smoothing — establishing a monthly average that reflects the seasonal pattern rather than the peak or trough.

**Computational note:** Where invoked, the calculator captures the seasonal income pattern (e.g., months 1–6 vs. months 7–12) and computes the monthly average. The deviation is the difference between the peak-month payment under the percentage and the smoothed monthly amount.

### § 43-19-103(e) — Age of the child / greater needs of older children

**Statute:** *The age of the child, taking into account the greater needs of older children.*

**Common assertion patterns:** Older children's needs (extracurriculars, activities, social costs, advanced academic costs) exceed those of younger children. Typically asserted by the obligee for upward deviation.

**Mississippi case law:** *McEachern v. McEachern*, 605 So. 2d 809 (Miss. 1992).

**Computational note:** Often asserted as a specific monthly amount tied to documented age-specific expenses (activity fees, tutoring for older child, etc.). The deviation is the asserted amount; the chancellor rules on whether the documented expenses warrant adjustment.

### § 43-19-103(f) — Special needs traditionally met within the family budget

**Statute:** *Special needs that have traditionally been met within the family budget even though the fulfilling of those needs will cause the support to exceed the proposed guidelines.*

**Common assertion patterns:** Special needs (disability, chronic medical condition, gifted-program participation) that were funded pre-separation through the family budget. The factor recognizes that some needs should not be cut by the divorce simply because they would push the support over the guideline percentage.

**Computational note:** Documented monthly cost of the special need, signed positive (upward). Often overlaps with (a) extraordinary expenses; counsel should be deliberate about which factor they invoke to avoid duplication.

### § 43-19-103(g) — Particular shared parental arrangement

**Statute:** *The particular shared parental arrangement, such as where the noncustodial parent spends a great deal of time with the children thereby reducing the financial expenditures incurred by the custodial parent, or the refusal of the noncustodial parent to become involved in the activities of the child, or giving due consideration to the custodial parent's homemaking services.*

**Common assertion patterns:** This is the single most contested factor in Mississippi practice. 50/50 custody, substantial visitation arrangements, and unusual custody allocations all run through (g). Mississippi has no statutory cross-credit formula — chancellors apply (g) discretionarily.

**Obligor's typical assertion (50/50 downward):** Obligor is bearing approximately 50% of household expenses directly; presumptive percentage was calibrated against noncustodial-visitation arrangements; mechanical application overstates the obligor's net contribution. Common dollar magnitude: substantial downward adjustment, sometimes 25–50% of presumptive.

**Obligee's typical assertion (resistance to magnitude):** Concedes some downward adjustment but disputes the magnitude. Argues fixed household costs (housing, utilities, school enrollment district) do not halve with 50/50 parenting.

**Computational note:** This factor's magnitude is the most chancellor-dependent. The calculator presents both sides' proposed amounts with rationale and offers the split-difference option as a common settlement point. Tennessee's cross-credit formula under Rule 1240-02-04-.04(7)(b)(2)(i) provides an instructive benchmark — `BCSO × |piA − piB|` — though it does not bind a Mississippi chancellor.

### § 43-19-103(h) — Total available assets

**Statute:** *Total available assets of the obligee, obligor and the child.*

**Common assertion patterns:** Inherited assets producing income; investment portfolios; closely-held business interests; substantial liquid assets. Typically asserted by whichever side has the weaker income picture and wants to point at the other's substantial assets.

**Computational note:** The factor specifies "total available assets of obligee, obligor, and the child" — meaning the chancellor weighs all three. Asymmetric assertions (obligor pointing only at obligee's assets, or vice versa) typically draw counter-argument that the factor's text requires considering both sides' assets. The deviation magnitude reflects the chancellor's view of how much each party's assets reduce the need for the support transfer.

### § 43-19-103(i) — Obligee's childcare expenses for employment

**Statute:** *Payment by the obligee of child care expenses in order that the obligee may seek or retain employment, or because of the disability of the obligee.*

**Common assertion patterns:** Documented work-related daycare or after-school care that the obligee pays. Common in cases where the obligee returned to work after separation. Sometimes asserted as agreed (both parties stipulate to the pro rata share); sometimes contested as to magnitude.

**Computational note:** The obligee's documented monthly childcare cost is the typical starting point; the deviation is usually the obligor's pro rata share, signed positive (upward). The "for employment" qualifier requires the childcare to be employment-related; convenience care does not qualify.

### § 43-19-103(j) — Equitable result catchall

**Statute:** *Any other adjustment which is needed to achieve an equitable result which may include, but not be limited to, a reasonable and necessary existing expense or debt.*

**Common assertion patterns:** Anything not captured by (a)–(i). Pre-existing debt obligations (marital debt, parental student loans where one parent is paying for educational debt of the other), unusual expenses, irregular financial circumstances. The catchall is also frequently invoked by the obligor seeking a "total package" reduction reflecting cumulative direct contributions across multiple factors.

**Doctrinal note:** Mississippi case law gives chancellors broad discretion under (j). The catchall is the "anything else equitable" provision; opposing counsel commonly responds that (j) should not duplicate (a)–(i) adjustments already granted.

**Computational note:** The (j) deviation is the asserting party's proposed equitable adjustment. The chancellor's decision surface offers all five options (adopt, split, custom, decline) with custom being particularly common — chancellors often craft a specific (j) adjustment to bring the total order to a number that feels right rather than adopting either party's exact proposal.

---

## §4 Calculation Procedure

The calculator runs the worksheet by executing a fixed sequence of stored procedures. Each procedure reads from input tables, writes to the per-case computation row, and produces an audit trail entry. The sequence is:

```
 1. ms_validate_inputs(case_id)
 2. ms_compute_monthly_agi(case_id)             -- § 1.1
 3. ms_check_required_finding(case_id)          -- § 1.2 ($10k / $100k threshold)
 4. ms_apply_imputation(case_id)                -- § 1.7 (if active)
 5. ms_check_incarceration_suspension(case_id)  -- § 1.8 (if applicable)
 6. ms_presumptive_monthly(case_id)             -- AGI × percentage
 7. ms_cumulative_months(case_id, effective_date)   -- § 1.6
 8. FOR EACH factor in ('a'..'j'):
      ms_factor_status(case_id, factor)          -- § 1.4 classifier
      ms_factor_position(case_id, factor, 'O')   -- § 1.5 obligor's position
      ms_factor_position(case_id, factor, 'E')   -- § 1.5 obligee's position
      ms_decision_contribution(case_id, factor)  -- § 1.9 chancellor's decision
 9. ms_compute_reconciliation(case_id)           -- per-party totals + gap
10. ms_compute_final_order(case_id)              -- presumptive + sum of chancellor decisions
11. ms_write_audit_trail(case_id)
12. ms_render_outputs(case_id)                   -- PDF + Behind-the-Scenes HTML
```

Every step is idempotent — re-running the sequence over the same input state produces the same output state, with the timestamp updated. The sensitivity exploration (chancellor toggling decision options) re-runs steps 9–11 only; steps 1–8 are unchanged because the underlying positions are stable.

---

## §5 Output Generation Pipeline

The MS calculator produces three outputs per computed case via a single `produce_outputs(case_id)` operation:

1. **MS Deviation Worksheet PDF.** Litigation-ready memorandum titled "Statement of Child Support and § 43-19-103 Deviations." Format: PDF. Contains the case caption, the income module summary, the presumptive calculation, all ten factors with verbatim statute text + both parties' positions + supporting facts + chancellor's decision (if any) + per-factor gap, the reconciliation panel, and the final order. Attribution per § 1.5 ("Per counsel for Obligor — [name]: [text]").
2. **Behind the Scenes HTML.** Interactive companion document — the same shape as the `MS_Deviation_Worksheet_Williams.html` reference. Used in mediation (parties can toggle decision options to model settlement scenarios) and on the chancellor's bench (chancellor toggles decision options to render the final ruling). Standalone HTML, no external dependencies; opens in any browser without a network connection.
3. **Sensitivity HTML (optional).** Multi-column rendering showing the final order at different imputation application percentages (when § 1.7 is active) or at different chancellor's-decision configurations. Generated on demand.

All three outputs derive from the same `ms_audit_trail` row and the related case tables. They cannot disagree.

**Filenames:** `MS_Deviation_Worksheet_[CaseName]_[Date].pdf`, `MS_Behind_the_Scenes_[CaseName]_[Date].html`, `MS_Sensitivity_[CaseName]_[Date].html`.

### §5.1 PDF rendering

The PDF is template-rendered (not a fillable-form fill, since MS has no AOC-mandated form). The template lives at `src/templates/ms-deviation-pdf.html` (or equivalent in the v2 codebase) and is converted to PDF via Puppeteer or similar HTML-to-PDF tool, server-side or client-side per v2 architecture preference.

The template has clean print-stylesheet support (Letter / 0.5" margins / 10pt body) and includes:

- Case caption block (parties, court, docket, date, parenting arrangement).
- Income module summary (AGI computation, optional imputation, optional incarceration suspension).
- Presumptive monthly support (with the $10k/$100k written-finding flag when triggered).
- Per-factor section for each of (a)–(j): statute text, status (per § 1.4), obligor position (verbatim), obligee position (verbatim), chancellor decision, per-factor contribution.
- Reconciliation table: per-party totals, gap, chancellor's running total.
- Final order: monthly amount, cumulative-through-emancipation projection.
- Authority footer: statutes cited, cases cited, exhibits referenced.
- Attorney attribution block (both counsel identified).

### §5.2 Behind the Scenes HTML rendering

Same architecture as TN canonical §5.3 — template engine renders against a context dictionary pulled from the case tables. The interactive controls (chancellor's decision buttons, optional imputation slider) are wired with vanilla JavaScript (no React dependency required for the standalone-HTML output). The reference implementation is `MS_Deviation_Worksheet_Williams.html` in the project folder.

### §5.3 Sensitivity HTML rendering

Same architecture as TN canonical §5.4. The "variable" axis defaults to imputation application percentage (when § 1.7 is active); secondary axis option is the chancellor's decision configuration (e.g., "what if the chancellor adopts obligor on all contested factors vs. obligee vs. splits"). Transaction-and-rollback or deep-clone-and-mutate pattern preserves the canonical case state.

---

## §6 Validation Notes for Common Scenarios

### §6.1 50/50 custody, moderately high income, modest deviations (the Williams reference case)

The Williams worked example demonstrates the most common high-volume MS case: surgeon obligor ($35,000/mo gross), school counselor obligee, two children, 50/50 custody, several factors contested (a, e, g, h, j), agreed factor (i). Verify v2 produces the same numbers documented in `MS_Deviation_Worksheet_Williams.html`.

### §6.2 Pure presumptive case (no deviations)

AGI × percentage produces the order amount. Final order = presumptive. Cumulative through emancipation = presumptive × average remaining months. No factor cards populated. PDF output is the income module summary + the presumptive calculation + the final order, with a one-line "No § 43-19-103 deviations asserted by either party" entry where the factor section would be.

### §6.3 High-income obligor ($150,000+ AGI annual)

Annual AGI exceeds the $100,000 threshold per § 1.2. The required-finding flag triggers; the output document includes the statutory-finding language. Chancellor's analysis under (j) or (h) typically reduces the mechanical amount; the deviation worksheet captures the analysis.

### §6.4 Imputation contested case

Obligor argues obligee is voluntarily underemployed; both parties' positions on the § 43-19-101(5) twelve factors are captured. The calculator's imputation toggle is active; the application-percentage slider shows the result at 0% (actual income) through 100% (fully imputed). The chancellor's ultimate ruling on the imputed amount is captured via the decision surface on the factor under which imputation is asserted (typically (g) or (h)).

### §6.5 Incarcerated obligor

Obligor has been incarcerated for more than 180 days. No § 97-3-7, § 97-5-39, or § 97-5-3 carve-out applies. Means-to-pay is false. Per § 1.8, suspension applies by operation of law; the obligation is $0 for the suspension period; arrears do not accrue; the 60-day post-release resumption is documented.

### §6.6 Multiple children with different ages

Children ages 14, 10, 5. § 1.6 cumulative-through-emancipation uses the average remaining months: (84 + 132 + 192) / 3 = 136 months. The cumulative figure is the monthly order × 136. Per-child individualized timelines are not used for the cumulative projection (though they're documented in the audit trail for chancellor reference).

---

## §7 Source Authorities

**Statutes**

- Miss. Code Ann. § 43-19-101 — child support award guidelines (presumptive percentage, AGI computation, $10k/$100k written-finding thresholds, medical support).
- Miss. Code Ann. § 43-19-101(5) — imputation framework with specific factor list (HB 1067, effective July 1, 2022).
- Miss. Code Ann. § 43-19-103 — ten criteria for overcoming the presumption.
- Miss. Code Ann. § 43-19-36 — suspension of obligation during 180+ day incarceration (SB 2082, effective July 1, 2023).
- Miss. Code Ann. § 93-11-65(8) — age-21 emancipation default with statutory carve-outs.
- Miss. Code Ann. § 97-3-7, § 97-5-39, § 97-5-3 — incarceration suspension carve-outs (domestic violence; child abuse; criminal nonpayment).
- Miss. Code Ann. § 93-5-23 — alimony framework (separate and distinct from child support).

**Mississippi case law cited in this spec**

- *Tedford v. Dempsey*, 437 So. 2d 410 (Miss. 1983) — extraordinary educational expenses under (a).
- *Knutson v. Knutson*, 704 So. 2d 1331 (Miss. 1997) — medical/dental cost allocation under (a).
- *McEachern v. McEachern*, 605 So. 2d 809 (Miss. 1992) — greater needs of older children under (e).

(Additional case authority is captured per-factor as counsel cites it; the calculator does not predetermine which cases apply to which factor.)

**TCB Law conventions documented in this canonical**

§1.1 (AGI computation including the voluntary-deferral non-deduction); §1.2 (annual threshold reading of $10k/$100k); §1.3 (MS self-employment add-backs by TN analogy); §1.4 (four-state factor classifier); §1.5 (verbatim position requirement); §1.6 (cumulative-through-emancipation with average-months projection for multi-child cases); §1.7 (imputation as user-controlled scenario tool, statute-driven factor framework); §1.8 (incarceration suspension as first-class auto-applying flow); §1.9 (chancellor's decision surface mechanics); §1.10 (asynchronous two-attorney handoff with case-ID identity).

---

## §8 Reference Implementation

The `MS_Deviation_Worksheet_Williams.html` file in this project folder is the working reference for what the Behind-the-Scenes output should look and behave like:

- Sticky live-bar with presumptive / final-order / cumulative figures.
- Side-by-side party position columns with verbatim narratives.
- Statute text inline at the top of each factor card.
- Four-state status badge per factor.
- Disagreement gap quantification (monthly + cumulative).
- Five-option chancellor's decision surface per factor.
- Live recalculation across the sticky bar, the reconciliation table, and the final-order block.
- Authority footer with statutes, cases, and documentation index.

Any v2 implementation should produce output indistinguishable from the Williams reference, with the case-specific data substituted from the database. The visual design, the interaction model, and the information hierarchy are not subject to change without canonical revision.

---

*This document is open source. Any deviation from the conventions in §1, or any update reflecting a statutory amendment, must be reflected in the `calculator_version` table and noted in the audit trail of any case computed under the new convention. Consistency is the operating premise: same positions in, same numbers out, every time. The chancellor's discretion is preserved — the calculator structures the analysis; the chancellor rules.*
