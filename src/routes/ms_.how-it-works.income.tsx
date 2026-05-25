import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/ms_/how-it-works/income")({
  head: () => ({
    meta: [
      {
        title:
          "How Mississippi calculates income for child support — MS Calculator",
      },
      {
        name: "description",
        content:
          "Plain-English guide to Mississippi's child-support income rules under Miss. Code Ann. § 43-19-101: gross income, the four mandatory AGI deductions, the voluntary 401(k) trap, self-employment, and imputation.",
      },
      {
        property: "og:title",
        content: "How Mississippi calculates income for child support",
      },
      {
        property: "og:description",
        content:
          "Walkthrough of MS child-support AGI: gross income, mandatory deductions, the in-home other-children adjustment, self-employment, imputation, and threshold findings.",
      },
      {
        property: "og:url",
        content: "https://csg.tcblaw.org/ms/how-it-works/income",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://csg.tcblaw.org/ms/how-it-works/income",
      },
    ],
  }),
  component: HowItWorksIncome,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 font-serif text-2xl text-ink">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3">{children}</p>;
}

function HowItWorksIncome() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
        Reference · Miss. Code Ann. § 43-19-101
      </p>
      <h1 className="mt-2 font-serif text-4xl">
        How Mississippi calculates income for child support
      </h1>
      <p className="mt-4 text-sm italic text-muted-foreground">
        A companion to the Tennessee income page. The two states cover the
        same topic and reach different conclusions because the two states'
        laws are different. Skim the Quick Answer, read the numbered
        sections for the focused explanation, and consult the authorities
        appendix for a citation audit.
      </p>

      <H2>Just want to use the calculator?</H2>
      <P>
        <Link
          to="/ms"
          className="underline decoration-rule underline-offset-2 hover:text-primary"
        >
          Back to the calculator →
        </Link>
      </P>
      <P>
        Most users won't need to read this whole page. Mississippi's child
        support law is structured around a single number — the obligor's
        monthly adjusted gross income — and the law is more specific than
        Tennessee's about what gets subtracted from gross income to arrive
        at AGI. If your situation is straightforward (one job, no
        self-employment, no recent income changes), the calculator's inputs
        form does the math correctly when you fill in the numbered fields.
      </P>
      <P>
        This page is for users who want to understand what's actually
        happening, users whose situations are more complicated than the
        simple form covers, and lawyers or chancellors who want to verify
        the calculator's interpretation of Mississippi law.
      </P>

      <div className="mt-10 rounded-md border border-rule bg-accent/10 p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Quick Answer
        </p>
        <P>
          For Mississippi child support, the obligor's monthly adjusted
          gross income drives the entire calculation. The statute defines
          AGI specifically:
        </P>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong>Start with gross income from all sources.</strong>
          </li>
          <li>
            <strong>
              Subtract actual federal, state, and local tax liability
            </strong>{" "}
            (not what's withheld — what's actually owed at the end of the
            year).
          </li>
          <li>
            <strong>
              Subtract Social Security and Medicare contributions
            </strong>{" "}
            (W-2 Box 4 plus Box 6, or roughly 15.3% for self-employed
            parents).
          </li>
          <li>
            <strong>
              Subtract mandatory retirement and disability contributions.
            </strong>{" "}
            Government pension contributions are mandatory. 401(k), 403(b),
            and IRA contributions are voluntary — those are NOT deductible.
          </li>
          <li>
            <strong>
              Subtract pre-existing court-ordered support for other
              children.
            </strong>
          </li>
        </ul>
        <P>
          That gives you annual AGI. Divide by twelve. Then optionally
          subtract a discretionary in-home other-children adjustment to get
          the monthly AGI that drives the percentage calculation.
        </P>
        <P>
          The most common silent error in Mississippi practice: confusing
          voluntary 401(k) contributions with mandatory retirement
          contributions. Voluntary contributions don't reduce your AGI for
          child support purposes, even though they reduce your taxable
          income for IRS purposes. The statute is explicit about this at §
          43-19-101(3)(b)(iii).
        </P>
      </div>

      <H2>1. Mississippi's approach in one paragraph</H2>
      <P>
        Mississippi uses a flat percentage of the obligor's adjusted gross
        income. One child is 14%. Two children is 20%. Three is 22%. Four
        is 24%. Five or more is 26%. That's the statute. Everything else —
        the deviations under § 43-19-103, the high-income and low-income
        written findings under § 43-19-101(4), the shared parenting
        question — is downstream of the AGI determination.
      </P>
      <P>
        This means the AGI calculation matters more in Mississippi than the
        analogous calculation matters in many other states. If your AGI is
        wrong by $1,000 a month, your support number is wrong by $140 to
        $260 a month depending on the number of children. Over the life of
        a typical order, that's tens of thousands of dollars in
        misallocated support.
      </P>

      <H2>2. What counts as gross income</H2>
      <P>
        Mississippi's definition of gross income, at Miss. Code Ann. §
        43-19-101(3)(a), is similar to most states' definitions. Gross
        income includes wages, salaries, commissions, bonuses, dividends,
        severance pay, pensions, interest, trust income, annuities, capital
        gains, social security benefits, workers' compensation benefits,
        unemployment insurance benefits, disability insurance benefits,
        income from self-employment, gifts, prizes, and any other source.
      </P>
      <P>
        If money is coming in on a recurring basis, the default rule is
        that it counts. The handful of exclusions are narrow:
      </P>
      <P>
        <strong>SSI is not counted.</strong> Supplemental Security Income
        (Title XVI of the Social Security Act) is means-tested public
        assistance and doesn't count toward gross income. This is different
        from SSDI (Title II), which does count. The two programs have
        similar names but different rules. SSDI is based on the worker's
        contribution record; SSI is based on financial need. If you
        receive SSI as your sole source of income, the calculator's output
        should reflect that you cannot be subject to a meaningful support
        order on that income alone — you've already been determined by the
        Social Security Administration to be unable to support yourself.
      </P>
      <P>
        <strong>Public assistance does not count.</strong> TANF, SNAP, and
        similar means-tested benefits are excluded.
      </P>
      <P>
        <strong>The child's own income does not count.</strong> Whatever a
        child earns or receives from any source is the child's, not the
        parent's.
      </P>
      <P>
        <strong>A current spouse's income does not count.</strong> If the
        obligor has remarried, the new spouse's income is not added to
        gross income. The new spouse's contributions to household expenses
        may indirectly affect the analysis through the discretionary
        in-home other-children adjustment, but they don't add to the
        obligor's own gross income.
      </P>

      <H2>3. The four mandatory deductions</H2>
      <P>
        Miss. Code Ann. § 43-19-101(3)(b) lists the deductions that the
        court must allow in computing adjusted gross income. They are the
        spine of the AGI calculation.
      </P>
      <P>
        <strong>Federal, state, and local taxes.</strong> The statute says
        "the amount of taxes paid to the federal, state, and local
        governments." This is actual tax liability, not withholding. The
        distinction matters: a high earner who is over-withheld will get a
        refund at year-end; their actual tax liability is less than what
        came out of their paychecks. The right number for child support is
        what they actually owed for the tax year, not what was withheld.
        For most W-2 employees, the actual liability is the number on the
        year's 1040, not the cumulative number from the year's pay stubs.
      </P>
      <P>
        <strong>Social Security and Medicare contributions.</strong> For
        W-2 employees this is Box 4 plus Box 6 of the W-2 — the employee's
        half of FICA, which is 6.2% of wages up to the Social Security
        wage base plus 1.45% of all wages. For self-employed parents this
        is the self-employment tax, roughly 15.3% on net self-employment
        income up to the wage base (12.4% Social Security plus 2.9%
        Medicare), with the math complicated slightly by the
        self-employed-half-deduction on the federal return.
      </P>
      <P>
        <strong>Mandatory retirement and disability contributions.</strong>{" "}
        This is the deduction Mississippi gets specific about and where
        the most common silent error lives. The statute at §
        43-19-101(3)(b)(iii) refers to "mandatory" contributions, which in
        Mississippi practice has consistently meant contributions to
        governmental retirement systems (PERS for state employees, federal
        civil service for federal employees, military retirement for
        active-duty members) where the contribution is a condition of
        employment.
      </P>
      <P>
        What is NOT deductible: voluntary contributions to 401(k), 403(b),
        457, traditional IRA, Roth IRA, or any other defined contribution
        plan where the parent has a choice about whether and how much to
        contribute. The IRS lets the parent reduce taxable income with
        these contributions; Mississippi child support law does not.
      </P>
      <P>
        This is the equivalent in Mississippi practice of the W-2 Box 5
        vs Box 1 question in Tennessee practice. The mechanics are
        different but the underlying point is the same: Mississippi does
        not allow voluntary retirement contributions to reduce gross
        income for child support purposes, and the parent who unknowingly
        subtracts them is systematically understating their AGI.
      </P>
      <P>
        For a parent earning $100,000 per year who contributes $22,500 to
        a 401(k), the wrong AGI calculation would deduct that $22,500.
        The right AGI calculation does not. With two children at 20%,
        that's a difference of $4,500 per year in the support obligation.
        Over the life of a typical order, the dollars add up significantly.
      </P>
      <P>
        <strong>
          Pre-existing court-ordered support for other children.
        </strong>{" "}
        If the parent is already paying support under a prior court order
        for children of another relationship, the actual amount paid under
        that order is deductible. The statute uses the word "actual" —
        what gets deducted is what's actually being paid, not what was
        ordered if there's a difference (arrearages don't generate
        ongoing AGI deductions, though they're addressed elsewhere in the
        law). Note that the deduction is for support of other children,
        not for spousal support; alimony is treated as part of
        Mississippi's separate alimony law and doesn't reduce AGI for
        child support purposes.
      </P>

      <H2>4. The in-home other-children adjustment</H2>
      <P>
        After the four mandatory deductions, Mississippi allows a
        discretionary adjustment for other biological or legally adopted
        children residing in the obligor's home. This is at §
        43-19-101(3)(c).
      </P>
      <P>
        Unlike the four mandatory deductions, this adjustment doesn't
        have a statutory formula. The chancellor exercises discretion
        based on the obligor's circumstances. In practice, chancellors
        often use something analogous to the support that would be owed
        for those in-home children if they were the subject of an order,
        but the analysis is fact-driven.
      </P>
      <P>
        The calculator's input form treats this as a monthly figure the
        user enters directly. The user (or their attorney) is responsible
        for determining what's reasonable in their specific case. The
        worksheet documents the adjustment as a separate line so the
        chancellor can see what was claimed and review it independently.
      </P>

      <H2>5. Self-employment income</H2>
      <P>
        Self-employment is the most contested income category in
        Mississippi family law, as it is in most states. Mississippi's
        rule is broadly similar to Tennessee's: self-employment income
        equals gross receipts minus ordinary and necessary business
        expenses. But the Mississippi case law has developed some
        specific principles worth knowing about.
      </P>
      <P>
        <strong>
          Schedule C is the starting point, not the ending point.
        </strong>{" "}
        Like Tennessee, Mississippi does not accept the taxpayer's
        Schedule C bottom line as definitive. Mississippi chancellors,
        drawing on a body of case law including <em>Strickland v. Day</em>{" "}
        and similar decisions, have consistently scrutinized
        self-employment income claims for non-cash deductions and personal
        expenses dressed up as business expenses.
      </P>
      <P>
        <strong>
          Accelerated depreciation and similar non-cash deductions.
        </strong>{" "}
        These are the most common items added back in contested cases.
        The principle is the same as in Tennessee: depreciation reduces
        taxable income but doesn't reduce actual cash available to support
        children. The chancellor may add back the depreciation when
        computing AGI.
      </P>
      <P>
        <strong>The "draws" question.</strong> For self-employed parents
        who pay themselves through draws from a business entity (LLC,
        S-corp), the relevant figure for child support is typically the
        total compensation received, not just the W-2 portion if the
        parent has structured themselves as a partial employee. The
        chancellor will look at the business's books, the parent's
        lifestyle, and the actual cash flow rather than accepting the
        artificial division between salary and distributions.
      </P>
      <P>
        <strong>The "lifestyle" cross-check.</strong> Mississippi
        chancellors, again drawing on case law, have been willing to
        impute additional income to self-employed parents whose reported
        income is inconsistent with their observable lifestyle. A
        self-employed parent with a $30,000 reported income who lives in
        a $600,000 house and drives a new truck will face scrutiny. The
        chancellor's authority here flows from the general
        rebuttable-presumption framework of § 43-19-101 combined with the
        deviation framework of § 43-19-103.
      </P>
      <P>
        For users of the calculator who are self-employed: the simple
        input field is a starting point. If your case involves
        significant business income or any complexity in the Schedule C,
        you should expect that opposing counsel (or the chancellor) will
        look behind your reported AGI to verify the cash actually
        available for support. The calculator gives you a number; in real
        practice, that number is the opening position, not the final
        answer.
      </P>

      <H2>6. Imputation under § 43-19-101(5) (2022 amendment)</H2>
      <P>
        For decades Mississippi's approach to imputation was almost entirely
        judicial — built case-by-case on <em>Gillespie v. Gillespie</em>,
        594 So. 2d 620 (Miss. 1992), and its progeny. That changed on July
        1, 2022, when House Bill 1067 added a dedicated imputation
        subsection at <strong>Miss. Code Ann. § 43-19-101(5)</strong>.
        Mississippi now has a statutory framework, not just case law.
      </P>
      <P>
        The headline rule of § 43-19-101(5) is that{" "}
        <strong>
          imputation must be based on specific fact-gathering, not on a
          standard amount.
        </strong>{" "}
        The statute directs the court to consider the parent's:
      </P>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>past and present employment and earnings history;</li>
        <li>education, training, and job skills;</li>
        <li>
          the prevailing earnings level in the local community for the
          parent's occupation or skill set;
        </li>
        <li>available employers willing to hire the parent;</li>
        <li>
          other relevant background factors — assets, residence, age,
          health, criminal record, record of seeking work, and similar
          circumstances bearing on earning capacity.
        </li>
      </ul>
      <P>
        This means Mississippi has departed from the older practice (still
        seen in some states) of pegging imputed income to a generic
        median-wage figure. After HB 1067, the chancellor must build the
        imputed number from facts in the record. A finding that "the
        obligor could earn $X per month" without record support for the
        listed factors is now vulnerable on appeal in a way it was not
        before 2022.
      </P>
      <P>
        The calculator surfaces this directly. When you mark gross income
        as "imputed" instead of "actual," the inputs panel asks you to
        check off which § 43-19-101(5) factors support the imputed figure
        and to describe any "other" facts. The worksheet and PDF then
        carry that basis statement into Section I so the chancellor sees
        the foundation alongside the dollar amount.
      </P>
      <P>
        The older case law has not been displaced — <em>Gillespie</em>{" "}
        and similar decisions still guide when imputation is appropriate
        (voluntary underemployment, refusal to provide evidence,
        substantial non-income-producing assets). HB 1067 layered a
        statutory how on top of the existing case law about when.
      </P>

      <H2>6a. Incarceration: § 43-19-36 (2023 amendment)</H2>
      <P>
        A second 2020s amendment, House Bill 1349 (effective July 1,
        2023), added <strong>Miss. Code Ann. § 43-19-36</strong>. This
        section reverses the older Mississippi practice of treating
        incarceration as voluntary unemployment that could justify
        imputation. Under the new statute:
      </P>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>
          When the obligor is incarcerated for{" "}
          <strong>180 consecutive days or more</strong>, the child support
          obligation is <strong>suspended by operation of law</strong> for
          the duration of incarceration and for{" "}
          <strong>60 days after release</strong>.
        </li>
        <li>
          Suspension is automatic — no motion required — though either
          party may move to confirm or contest it.
        </li>
        <li>
          Three carve-outs prevent suspension: (i) the incarceration is
          for non-payment of child support itself; (ii) the incarceration
          is for a crime against the child or the child's custodian; or
          (iii) the obligor has the <strong>means to pay</strong> support
          despite being incarcerated.
        </li>
      </ul>
      <P>
        The "means to pay" carve-out is the most fact-intensive. An
        obligor with substantial liquid assets, a working business, or
        passive income that continues during incarceration is not
        automatically suspended. The chancellor makes the call.
      </P>
      <P>
        The calculator implements § 43-19-36 as a short-circuit. If you
        check the incarceration box, set the expected duration to 180+
        days, and none of the three carve-outs apply, the worksheet stops
        at Section I and prints a suspension finding instead of running
        the percentage calculation. The PDF prints the same finding as a
        standalone page citing § 43-19-36(2).
      </P>
      <P>
        For the calculator's purposes: the inputs form accepts the AGI
        figure the user enters, whether that figure represents actual
        earnings or imputed earnings. The worksheet flags imputed AGI
        with the § 43-19-101(5) factor basis so the record reflects how
        the number was derived. Where actual and imputed figures differ
        significantly, you can also use the side-by-side mode to model
        both positions in one worksheet.
      </P>

      <H2>7. The health insurance question</H2>
      <P>
        Section 43-19-101(6) requires every Mississippi child support
        order to address health insurance. The statute's mechanics are
        less prescriptive than Tennessee's parallel rule. When the
        obligee provides health insurance for the children, the cost of
        the children's portion is generally added to the support
        obligation. When the obligor provides coverage, the statute
        provides less guidance, and the chancellor has discretion to
        adjust the support figure to reflect that the obligor is already
        bearing the coverage cost directly.
      </P>
      <P>
        The calculator handles this through the health insurance provider
        radio button. When the obligee provides coverage, the monthly
        children's portion is added to the support figure. When the
        obligor provides coverage, the premium is shown as informational
        only, with a note that the chancellor may adjust under §
        43-19-101(6).
      </P>
      <P>
        Recent legislative attention to this question, including Senate
        Bill 2505 in 2025 (which would clarify some of the
        obligor-provided coverage mechanics), suggests this is an area of
        evolving Mississippi law. The calculator currently implements
        only what is enacted, with the SB 2505 status flagged in the{" "}
        <Link
          to="/ms/about"
          className="underline decoration-rule underline-offset-2 hover:text-primary"
        >
          /ms/about
        </Link>{" "}
        page.
      </P>

      <H2>8. Threshold findings and what they mean</H2>
      <P>
        When annual AGI is below $10,000 or above $100,000, Mississippi
        requires the chancellor to make written findings on whether the
        guideline percentage produces a reasonable result. This is at §
        43-19-101(4).
      </P>
      <P>
        These thresholds exist because the flat percentage may produce
        unreasonable results at the extremes. At very low income, 14% to
        26% of a barely-subsistence-level income may produce an order the
        parent literally cannot pay. At very high income, the same
        percentages may produce an order substantially in excess of any
        reasonable measure of the children's needs.
      </P>
      <P>
        The calculator surfaces both thresholds as warnings when the
        obligor's annual AGI crosses them. The warnings appear in the
        sidebar during input and as callout boxes in the worksheet and
        PDF. The chancellor still has to make the actual finding; the
        calculator just makes sure the user knows the finding is required.
      </P>

      <H2>9. What this page doesn't cover</H2>
      <P>A few things have been deliberately set aside.</P>
      <P>
        <strong>Alimony.</strong> Mississippi addresses spousal support
        through a separate body of law at § 93-5-23 and related
        provisions. For obligors who are paying both child support and
        alimony, the two calculations are independent. Alimony does not
        reduce AGI for child support purposes.
      </P>
      <P>
        <strong>Retroactive support.</strong> The calculator computes
        prospective monthly support only. Retroactive support — for
        periods before the order is entered — involves additional
        analysis and is typically addressed by counsel rather than by the
        calculator.
      </P>
      <P>
        <strong>Split custody.</strong> When some children live primarily
        with one parent and others live primarily with the other,
        Mississippi's flat-percentage approach gets complicated and the
        calculator does not currently handle this case. Counsel should be
        involved.
      </P>
      <P>
        <strong>Emancipation projections.</strong> The calculator
        computes current monthly support. It does not project when the
        obligation will end. Mississippi's default emancipation age is
        21, not 18, with specific conditions for earlier emancipation at
        § 93-11-65(8). This timing is important for long-term planning
        but isn't part of the monthly support calculation.
      </P>

      <H2>Authorities and citations</H2>
      <P>
        Primary statutory authority: Miss. Code Ann. § 43-19-101, et seq.
      </P>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>§ 43-19-101(1) — Statutory percentages by number of children</li>
        <li>§ 43-19-101(3)(a) — Definition of gross income</li>
        <li>§ 43-19-101(3)(b) — Mandatory deductions in computing AGI</li>
        <li>
          § 43-19-101(3)(b)(iii) — Mandatory retirement contributions (the
          "voluntary 401(k) trap")
        </li>
        <li>§ 43-19-101(3)(c) — In-home other-children adjustment</li>
        <li>
          § 43-19-101(4) — High-income and low-income threshold findings
        </li>
        <li>
          § 43-19-101(5) — Imputation framework (added by HB 1067, eff.
          July 1, 2022)
        </li>
        <li>§ 43-19-101(6) — Health insurance treatment</li>
        <li>§ 43-19-103 — The ten deviation criteria (a)–(j)</li>
        <li>
          § 43-19-36 — Suspension of support during incarceration of 180+
          days (added by HB 1349, eff. July 1, 2023)
        </li>
        <li>§ 93-11-65(8) — Emancipation age and conditions</li>
      </ul>
      <P>
        Selected Mississippi case law referenced on this page
        (practitioners should verify current treatment of any specific
        case):
      </P>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>
          <em>Tedford v. Dempsey</em>, 437 So. 2d 410 (Miss. 1983) —
          foundational on child support presumptions
        </li>
        <li>
          <em>Knutson v. Knutson</em>, 704 So. 2d 1331 (Miss. 1997) —
          written findings requirement for deviation
        </li>
        <li>
          <em>Gillespie v. Gillespie</em>, 594 So. 2d 620 (Miss. 1992) —
          imputation and earning capacity
        </li>
        <li>
          <em>McEachern v. McEachern</em>, 605 So. 2d 809 (Miss. 1992) —
          high-income deviation analysis
        </li>
        <li>
          <em>Strickland v. Day</em> and related cases on self-employment
          income scrutiny
        </li>
      </ul>
      <P>
        The current statutory text is available through the Mississippi
        Code at code.ms.gov and through standard legal research
        databases. The Mississippi Department of Human Services maintains
        the IV-D enforcement program but does not publish a worksheet
        equivalent to Tennessee's official DHS spreadsheet.
      </P>

      <div className="mt-12 rounded-md border border-rule bg-cream p-6 text-sm">
        <P>
          <Link
            to="/ms"
            className="underline decoration-rule underline-offset-2 hover:text-primary"
          >
            Back to the calculator →
          </Link>
        </P>
        <p className="mt-3 italic text-muted-foreground">
          This page is part of the TCB Law Mississippi Child Support
          Calculator. It is not legal advice; for guidance on your
          specific case, consult a licensed Mississippi attorney.
        </p>
      </div>
    </div>
  );
}
