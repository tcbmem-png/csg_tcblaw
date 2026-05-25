import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tn_/how-it-works/income")({
  head: () => ({
    meta: [
      {
        title:
          "How Tennessee calculates income for child support — TN Calculator",
      },
      {
        name: "description",
        content:
          "Plain-English guide to Tennessee's child-support income rules: W-2 Box 5 vs Box 1, variable income averaging, self-employment, and imputation under Rule 1240-02-04-.04(3).",
      },
      {
        property: "og:title",
        content: "How Tennessee calculates income for child support",
      },
      {
        property: "og:description",
        content:
          "Walkthrough of TN child-support income rules, including the W-2 Box 5 catch, averaging variable income, self-employment, and imputation.",
      },
      {
        property: "og:url",
        content: "https://csg.tcblaw.org/tn/how-it-works/income",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://csg.tcblaw.org/tn/how-it-works/income",
      },
    ],
  }),
  component: HowItWorksIncome,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 font-serif text-2xl text-ink">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 font-serif text-lg text-ink">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3">{children}</p>;
}

function HowItWorksIncome() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
        Reference · Rule 1240-02-04-.04(3)
      </p>
      <h1 className="mt-2 font-serif text-4xl">
        How Tennessee calculates income for child support
      </h1>
      <p className="mt-4 text-sm italic text-muted-foreground">
        A reference page structured for three reading depths: skim the
        Quick Answer at the top, read the numbered sections for the focused
        explanation, and consult the authorities appendix at the bottom for
        a citation audit.
      </p>

      {/* Just want to use the calculator? */}
      <H2>Just want to use the calculator?</H2>
      <P>
        <Link
          to="/tn"
          className="underline decoration-rule underline-offset-2 hover:text-primary"
        >
          Back to the calculator →
        </Link>
      </P>
      <P>
        Most users don't need to read this whole page. If your income is
        steady wages from one job with no bonuses, no investments, and no
        recent changes, the calculator's income helper will produce the
        right monthly figure in about thirty seconds. Expand the income
        helper at the top of the Inputs tab and pick the "simple steady
        income" option.
      </P>
      <P>
        This page exists for users who want to understand what's happening,
        users who have a more complicated situation than the simple path
        covers, and lawyers or judges who want to verify the calculator's
        interpretation of Tennessee law.
      </P>

      {/* Quick Answer */}
      <div className="mt-10 rounded-md border border-accent/60 bg-accent/10 p-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Quick Answer
        </div>
        <p className="mt-2">
          For Tennessee child support purposes, your monthly gross income
          includes:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
          <li>
            <strong>All wages and salary</strong> before voluntary deductions
            (use W-2 Box 5, not Box 1)
          </li>
          <li>
            <strong>Variable income</strong> like bonuses, commissions, and
            overtime, averaged over a reasonable period
          </li>
          <li>
            <strong>Self-employment income</strong>, gross receipts minus
            ordinary business expenses (with some Schedule C deductions
            disallowed)
          </li>
          <li>
            <strong>Investment income</strong>, retirement payments,
            disability, unemployment, and certain other recurring sources
          </li>
          <li>
            <strong>Federal benefits</strong> paid to your child on your
            account (added to your gross, then credited at the end)
          </li>
        </ul>
        <p className="mt-3 text-sm">It does not include:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
          <li>
            <strong>SSI</strong> (Supplemental Security Income — different
            from SSDI, which does count)
          </li>
          <li>
            <strong>Your current spouse's income</strong> if you've remarried
          </li>
          <li>
            <strong>Means-tested public assistance</strong> like TANF or SNAP
          </li>
          <li>
            <strong>The child's own income</strong> from any source
          </li>
        </ul>
        <p className="mt-3 text-sm">
          The most common error: using W-2 Box 1 instead of Box 5. If you
          contribute to a 401(k), Box 1 is lower than Box 5 by the amount of
          your contributions. Tennessee does not let you deduct voluntary
          retirement contributions from your gross income. Use Box 5.
        </p>
      </div>

      <H2>1. Why this matters more than you'd think</H2>
      <P>
        The child support calculation starts with one number per parent:
        monthly gross income. Everything downstream — the BCSO lookup, the
        parenting time adjustment, the statutory cap analysis — is built on
        top of that number. If the income figure is wrong by $1,000 a month,
        the support number can be wrong by $300 a month, and over the life
        of a typical order that's $30,000 to $60,000 in misallocated
        support.
      </P>
      <P>
        The income figure is also the most contested input in real Tennessee
        child support practice. Not because the rule is unclear — the rule
        is detailed and well-drafted — but because the rule's details often
        get lost in a calculation tool that asks for "monthly gross income"
        as a single number and doesn't show what's behind it. Two lawyers
        running the same case can come up with different income numbers,
        both defensible, neither necessarily wrong, depending on which W-2
        box they used, which averaging period they applied to a bonus, and
        whether they added back disallowed Schedule C deductions.
      </P>
      <P>
        Tennessee's rule is at Tenn. Comp. R. &amp; Regs. 1240-02-04-.04(3).
        It's worth knowing what it actually says, not because you need to
        read the rule yourself, but because the calculator's helper is
        built around it and the choices the helper asks you to make are
        choices the rule requires.
      </P>

      <H2>2. What counts as gross income</H2>
      <P>
        Tennessee defines gross income broadly. The rule includes wages,
        salaries, commissions, bonuses, overtime, tips, severance,
        self-employment income, investment income (dividends, interest,
        capital gains when recurring), trust income, annuities, pensions
        and retirement plan distributions, disability benefits (including
        Social Security Disability Insurance, which is different from SSI),
        workers' compensation, unemployment, alimony received from someone
        other than your child's other parent, judgments from civil actions,
        gifts and inheritances of cash or liquid assets, prizes and lottery
        winnings, and actual income earned during incarceration.
      </P>
      <P>
        If money is coming in regularly, from almost any source, the
        default rule is that it counts.
      </P>
      <P>
        Two clarifications worth making about specific categories that
        confuse people:
      </P>
      <P>
        <strong>Retirement income.</strong> Distributions from pensions,
        401(k)s, IRAs, and similar accounts count as income when received.
        Contributions to those accounts do not reduce your gross income for
        child support purposes, even though they reduce your taxable income
        for IRS purposes. This is the source of the Box 5 vs Box 1 issue
        described in the next section.
      </P>
      <P>
        <strong>Federal benefits paid to the child.</strong> If your child
        receives Social Security benefits on your account (the most common
        scenario is when the obligor parent is disabled and receives SSDI,
        with dependent benefits paid to the child), those benefits are added
        to your gross income for the calculation. They are then credited
        against your final support obligation at the end of the worksheet.
        The net effect is that you get credit for the benefit going to the
        child, but the calculation treats you as if you had earned that
        amount. This is at Rule .04(3)(a)(5).
      </P>

      <H2>3. What does not count</H2>
      <P>
        Tennessee excludes specific categories from gross income. The list
        is short but important.
      </P>
      <P>
        <strong>Means-tested public assistance.</strong> Supplemental
        Security Income (SSI), Families First (Tennessee's TANF program),
        SNAP, and similar benefits are excluded. If your only source of
        income is SSI, the support order is set to zero — not the $100
        minimum floor, but actual zero. This is at Rule .04(3)(c) and Rule
        .04(3)(c)(2).
      </P>
      <P>
        The SSI exclusion creates one of the most common
        misunderstandings in Tennessee child support practice. SSI (Title
        XVI of the Social Security Act) is excluded. SSDI (Title II) is
        counted. The two have similar names and are administered by the
        same agency, but they're different programs with different rules.
        SSDI is paid based on a worker's contribution record and counts as
        income. SSI is paid based on financial need and doesn't count. If
        you're not sure which you receive, the easiest way to tell is
        whether your monthly benefit depends on your work history (SSDI) or
        on your overall financial situation (SSI). When in doubt, ask
        Social Security directly.
      </P>
      <P>
        <strong>Your current spouse's income.</strong> If you've remarried,
        your new spouse's income is not counted toward your gross income
        for child support purposes. The same is true of benefits derived
        from your new household — for example, if your new spouse provides
        health insurance for you, the value of that coverage isn't your
        income.
      </P>
      <P>
        <strong>The child's own income.</strong> Whatever the child earns
        or receives from any source is not the parent's income.
      </P>
      <P>
        <strong>Adoption assistance payments.</strong> If you receive
        adoption assistance for a child you've adopted, that's excluded.
      </P>

      <H2>4. The W-2 Box 5 question</H2>
      <P>
        This is the single most common silent error in Tennessee child
        support calculations.
      </P>
      <P>
        W-2 forms have two boxes that look like they show your income. Box
        1 is labeled "Wages, tips, other compensation" and is the number
        that goes on your federal tax return. Box 5 is labeled "Medicare
        wages and tips" and shows your total compensation before some
        specific deductions.
      </P>
      <P>
        The two boxes are different when you contribute to a 401(k),
        403(b), 457, or similar retirement plan. Box 1 reflects your wages
        net of those contributions. Box 5 reflects your wages before them.
      </P>

      <div className="mt-4 rounded-md border border-accent/60 bg-accent/10 p-4 text-sm">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Worked example
        </div>
        <p className="mt-2">
          Salary: $100,000. 401(k) contribution: $22,500 (2026 limit for
          under-50).
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Box 1 (federal wages):</strong> $77,500
          </li>
          <li>
            <strong>Box 5 (Medicare wages):</strong> $100,000
          </li>
          <li>
            <strong>For child support:</strong> use $100,000 ($8,333/mo)
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Using Box 1 here understates monthly gross by ~$1,875 and
          typically reduces support by hundreds of dollars per month.
        </p>
      </div>

      <P>
        For child support, Tennessee uses Box 5. The rule does not permit
        voluntary retirement contributions to reduce gross income. Whatever
        you put into your 401(k) is still part of your gross income for
        child support purposes.
      </P>
      <P>
        This matters more than people realize. A parent who unknowingly
        uses Box 1 for the calculation systematically understates their
        income by the amount of their retirement contributions, which can
        be tens of thousands of dollars per year for higher earners. The
        downstream effect on the support number is real, the error is
        invisible without auditing the calculation, and the official
        Tennessee DHS worksheet does nothing to catch it — it just asks
        for "Monthly Gross Income" without distinguishing.
      </P>
      <P>
        The calculator's income helper asks you which box your annual
        figure came from. If you say Box 1, the helper prompts you to look
        up Box 5 instead. This catch is the helper's single highest-value
        feature for most users.
      </P>
      <P>
        If you don't have a W-2 (you're paid from a 1099, you're
        self-employed, you're new at your job and haven't received one
        yet), the equivalent question is: are you including everything you
        actually earn before voluntary retirement contributions? If yes,
        you're using the right number.
      </P>

      <H2>5. Variable income and the averaging question</H2>
      <P>
        If your income includes bonuses, commissions, overtime, investment
        dividends, or anything else that varies from year to year,
        Tennessee requires that you average it.
      </P>
      <P>
        The rule's exact language: "Variable income such as commissions,
        bonuses, overtime pay, dividends, etc. shall be averaged over a
        reasonable period of time consistent with the circumstances of the
        case and added to a parent's fixed salary or wages to determine
        gross income."
      </P>
      <P>
        What the rule does not say: it does not specify three years, or any
        other particular period. The "reasonable period" determination is
        committed to the trial court's discretion. Different income types
        call for different periods, and the right period for any given case
        depends on what's representative of likely future earnings.
      </P>
      <P>
        In practice, most lawyers will gather three years of tax returns
        through discovery. This is convention, not a rule requirement. The
        court (or the parties in negotiation) selects the period that
        fairly represents what the parent will likely earn going forward.
      </P>
      <P>
        What this means strategically: if your most recent year had an
        unusually large bonus, the other parent's lawyer may argue for a
        one-year average that captures it. If your most recent year had an
        unusually small bonus, you may argue for a longer average that
        smooths it out. Both positions are defensible under the rule. The
        period selection is itself a contested question in high-income
        cases.
      </P>
      <P>
        The calculator's helper asks you to enter variable income amounts
        for the last one, two, and three years, then asks you to pick the
        averaging period. The choice prints to the worksheet's methodology
        appendix, which means the resulting monthly figure is documented
        and defensible. If the other parent disputes your selection, the
        conversation is about which period is reasonable — not about
        whether your number is right under your chosen period.
      </P>
      <P>
        A few rules of thumb for the period selection, which the
        calculator's helper surfaces as guidance rather than instruction:
      </P>

      <H3>Annual bonuses paid consistently</H3>
      <P>
        Two-year or three-year averaging is most common because it captures
        normal year-to-year variation.
      </P>

      <H3>Quarterly sales commissions</H3>
      <P>
        Two years of quarterly data is typically a good window — long
        enough to smooth seasonal patterns, short enough to reflect current
        performance.
      </P>

      <H3>Hourly overtime</H3>
      <P>
        The most recent twelve months is usually the right window. Overtime
        patterns shift more quickly than salaries do, and the relevant
        question is what's representative going forward.
      </P>

      <H3>Investment dividends from a stable portfolio</H3>
      <P>
        The trailing twelve months is appropriate unless the portfolio has
        been recently restructured, in which case the trailing three years
        may give a more representative picture.
      </P>

      <H3>One-time bonuses or capital gains</H3>
      <P>
        The period question may be moot — if the income is genuinely
        non-recurring, the right answer may be to exclude it from the
        ongoing calculation. The rule allows this when the income is not
        "consistent" with future expectations.
      </P>

      <H2>6. Self-employment income</H2>
      <P>
        Self-employment is the most contested income category in Tennessee
        family law. It's also where the calculator can do the least without
        human judgment. If you're self-employed with significant business
        income, you should consider whether the case warrants a forensic
        accountant. The calculator can give you a starting point. It cannot
        give you a definitive answer.
      </P>
      <P>
        The Tennessee rule is that self-employment income equals gross
        receipts from the business minus ordinary and necessary expenses to
        produce that income. That sounds like it tracks Schedule C of the
        IRS return, and as a starting point it does. But the rule
        explicitly disallows certain deductions that Schedule C permits.
      </P>
      <P>
        The disallowed deductions include accelerated depreciation,
        investment tax credits, and "other business expenses determined by
        the tribunal to be inappropriate for determining gross income for
        child support purposes." The principle is that Schedule C
        deductions are designed to reduce taxable income; child support is
        interested in actual cash available to support the children. A
        deduction that reduces taxes but doesn't reduce actual cash is not
        a legitimate reduction of child support income.
      </P>
      <P>
        Accelerated depreciation is the most common example. A
        self-employed person who buys a piece of equipment and depreciates
        it over a few years has reduced their taxable income by the
        depreciation amount, but they haven't reduced their actual cash by
        that amount in each of those years — the cash went out the year of
        purchase. For child support, the accelerated depreciation needs to
        be added back.
      </P>
      <P>
        The calculator's helper currently covers steady wage income. A
        guided self-employment path with the add-back questions is a
        planned addition; when it ships, the worksheet methodology
        appendix will document what was added back and why. For now,
        self-employed parents should compute the adjusted figure
        themselves and enter it in the simple income field, with a note in
        the methodology appendix describing the add-backs.
      </P>
      <P>
        Two further complications worth knowing about, both of which
        generally require an attorney's analysis:
      </P>
      <P>
        <strong>Self-employment tax credit.</strong> Self-employed parents
        pay both halves of the FICA tax. To put them on roughly equal
        footing with W-2 employees who pay only the employee half, the
        rule allows a credit for the self-employment tax actually paid
        (the employer-side half). This is at Rule .04(4)(b).
      </P>
      <P>
        <strong>
          Distinguishing personal expenses from business expenses.
        </strong>{" "}
        Self-employed parents have more latitude than W-2 employees to
        characterize personal expenses as business expenses on their tax
        returns. In contested cases, opposing counsel will look at the
        Schedule C carefully for items that may be personal in substance.
        The car you drive, the home office, the meals, the travel — all of
        these can be legitimate business expenses or personal expenses
        dressed up as business expenses, depending on the facts.
      </P>

      <H2>7. When the court assigns income you don't actually earn</H2>
      <P>
        Sometimes, in Tennessee child support cases, the court uses an
        "imputed" income figure rather than what the parent actually earns.
        This is called imputation, and it requires a specific court
        determination. The calculator can help you understand what an
        imputed number would produce, but it cannot tell you whether a
        court would actually impute in your case.
      </P>
      <P>
        Tennessee allows imputation in three situations, all under Rule
        .04(3)(a)(2):
      </P>

      <H3>Willful and voluntary underemployment</H3>
      <P>
        A parent has voluntarily reduced their income — taken a
        lower-paying job, gone part-time, stopped working — and the
        reduction is not reasonable in light of their obligation to support
        the children. The court considers the parent's past employment,
        education, skills, lifestyle, and the reasons for the income
        reduction. Going back to school for genuine career advancement may
        not support imputation. Quitting a job because you don't feel like
        working may. The line is fact-driven.
      </P>

      <H3>Failure to produce reliable evidence of income</H3>
      <P>
        A parent who refuses to participate or refuses to provide income
        documentation may have income imputed. The mechanism is either the
        statutory default (described below) or, in modification cases, the
        prior order's income increased by up to 10% per year.
      </P>

      <H3>Substantial non-income-producing assets</H3>
      <P>
        When a parent owns significant assets that could be producing
        income but aren't (undeveloped land, large cash holdings sitting
        idle, valuable property), the court may impute income at a
        reasonable rate of return.
      </P>

      <P>
        Two situations explicitly do not support imputation, regardless of
        how much the income has dropped:
      </P>

      <H3>Incarceration</H3>
      <P>
        A parent who is in prison is not treated as voluntarily unemployed.
        This is at Rule .04(3)(a)(2)(iii) and reflects relatively recent
        recognition that lifetime arrearages from imputed pre-incarceration
        income don't serve children's interests. Actual income earned in
        prison (prison wages) does count.
      </P>

      <H3>Active military service</H3>
      <P>
        A parent who enlists, is drafted, or is activated from a Reserve or
        National Guard unit for full-time service is not subject to
        imputation, even if civilian earnings would be higher. Tennessee
        public policy supports the armed forces.
      </P>

      <P>
        Stay-at-home parents have a special category. Being a stay-at-home
        parent does not automatically support imputation. The court
        considers whether the stay-at-home role existed during the marriage
        (a long-standing family arrangement is harder to override than a
        recent post-separation choice), how long the parent has been out of
        the workforce, and the age of the children. A stay-at-home parent
        of school-age children may face more pressure than a stay-at-home
        parent of infants.
      </P>
      <P>
        When imputation is being argued, the calculator helps in a specific
        way: it can run both scenarios side-by-side, showing what the
        support number is under actual income and what it is under imputed
        income. The dollar difference between those two scenarios is what
        the imputation dispute is fighting over. In some cases the
        difference is small enough that the dispute resolves quickly. In
        other cases the difference is large enough that the parties accept
        the cost of fully litigating it. Either way, the calculation
        becomes a shared statement of stakes rather than competing private
        positions.
      </P>

      <H2>8. The statutory default income figures</H2>
      <P>
        When imputation is being applied but there's no specific
        earning-capacity evidence — typically in default judgment
        situations where the parent has not appeared — Tennessee provides
        default median income figures based on 2016 Census data.
      </P>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>
          <strong>Tennessee female population:</strong> $35,936/yr
          ($2,994.67/mo)
        </li>
        <li>
          <strong>Tennessee male population:</strong> $43,761/yr
          ($3,646.75/mo)
        </li>
      </ul>
      <P>
        The rule explicitly addresses why these are gender-specific rather
        than using a single median: the underlying Census data shows a
        substantial earnings gap, and using a single median would
        systematically understate male earnings and overstate female
        earnings.
      </P>
      <P>
        These defaults are most useful in default judgments where the
        absent parent has not appeared. In contested cases where evidence
        is being presented on both sides, the court typically determines a
        specific earning capacity based on the parent's actual skills,
        education, and the available job market, rather than falling back
        to the median.
      </P>
      <P>The default figures are at Rule .04(3)(a)(2)(iv).</P>

      <H2>9. Adjustments to get from gross income to AGI</H2>
      <P>
        After gross income is determined, three adjustments produce
        Adjusted Gross Income, which is the figure that drives the BCSO
        schedule lookup.
      </P>
      <P>
        <strong>Self-employment tax credit.</strong> Already mentioned
        above. Self-employed parents deduct from gross income the amount of
        self-employment tax actually paid.
      </P>
      <P>
        <strong>Credit for other in-home children.</strong> A parent's
        biological children who are not the subject of the current support
        order, but who reside with the parent at least half the time,
        generate a credit. The credit is 75% of a theoretical support order
        calculated on the parent's income alone for those children. This
        is at Rule .04(5)(b) and is calculated on a separate Credit
        Worksheet.
      </P>
      <P>
        <strong>Credit for other not-in-home children.</strong> A parent
        who is paying court-ordered support for children of another
        relationship receives credit for the actual support paid. This is
        at Rule .04(5)(a).
      </P>
      <P>
        The calculator's income helper, when it ships guided
        credit-handling, will walk users through these adjustments. For
        now, users should compute the credits themselves (or have a lawyer
        do it) and enter the adjusted figure.
      </P>

      <H2>10. The three-year tax return convention</H2>
      <P>
        Most Tennessee family lawyers will ask for three years of tax
        returns during discovery. Standard requests include federal and
        state returns, all schedules, W-2s, 1099s, K-1s, and supporting
        documentation. This is convention. The rule does not require
        three-year averaging.
      </P>
      <P>
        The court determines what monthly income figure best represents
        the parent's likely earnings going forward, given the totality of
        the evidence. Three-year averaging is one approach. Two-year is
        another. Twelve-month is appropriate for some income types. The
        right period depends on the kind of income and the circumstances
        of the case.
      </P>
      <P>
        What the three-year discovery practice does provide is a basis for
        the court to identify patterns. A parent whose income has been
        steadily climbing year over year is in a different position than a
        parent whose income has been volatile. A self-employed parent
        whose Schedule C shows wildly different bottom lines from year to
        year is in a different position than one with stable net income.
        The three years of returns are evidence; the calculation period is
        a separate determination based on that evidence.
      </P>
      <P>
        For a calculator user: three years of returns are usually enough to
        make the choices the calculator's helper asks for. If you have
        less than three years of data — you're newly self-employed, or
        you've just started a job that includes commissions — the
        calculator's helper still works, but the resulting number may be
        less defensible if challenged.
      </P>

      <H2>11. What this means for your case</H2>
      <P>
        Most cases are simple. The simple income path of the calculator's
        helper handles them in thirty seconds, with the Box 5 catch as the
        main quality-control feature. For users in this bucket, the rest
        of this page exists for context, not for instruction.
      </P>
      <P>
        Some cases have one or two complications. Variable income, recent
        job changes, retirement income mixed with wages. The calculator's
        helper has paths for these, and the methodology appendix on the
        worksheet documents the choices you made. For users in this
        bucket, the relevant sections of this page are the ones that match
        your situation.
      </P>
      <P>
        A small minority of cases are complicated. Self-employment with
        substantial business income. Imputation arguments. Multiple sources
        with different averaging periods. Substantial non-income-producing
        assets. For users in this bucket, the calculator's helper is a
        starting point and a structured way to document your position, but
        the case needs an attorney's analysis.
      </P>
      <P>
        The principle that runs through all three buckets is the same:
        the income determination is itself a substantive legal question,
        and the answer is defensible to the extent the methodology behind
        it is visible. The official Tennessee worksheet hides the
        methodology behind a single "Monthly Gross Income" field. The
        calculator's helper exposes it. Whatever number you arrive at, the
        worksheet output documents how you got there — which makes the
        number reviewable, auditable, and harder to challenge on grounds
        that don't actually have merit.
      </P>
      <P>
        If you're using the calculator to negotiate with the other parent,
        the methodology appendix is the document that lets you say "here's
        how I got to this number, here's the rule that supports each
        choice, and here's what the result would be if we made different
        choices." That conversation is more productive than two opposing
        positions arrived at through two opaque calculations.
      </P>
      <P>
        If you're using the calculator to prepare for court, the
        methodology appendix is the documentation you'll need anyway. The
        judge will eventually ask how the income figure was derived.
        Having it documented in advance, with rule citations attached,
        saves time and protects against the kinds of challenges that
        thrive when calculations are presented as conclusions rather than
        processes.
      </P>

      {/* Authorities */}
      <H2>Authorities and citations</H2>
      <P>
        Primary authority: Tenn. Comp. R. &amp; Regs. 1240-02-04-.04
        (Determination of Child Support). Specific subsections referenced
        in this page:
      </P>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
        <li>1240-02-04-.04(3) — Gross income generally</li>
        <li>1240-02-04-.04(3)(a) — Inclusions</li>
        <li>
          1240-02-04-.04(3)(a)(1) — Wages and salary (Box 5 question)
        </li>
        <li>
          1240-02-04-.04(3)(a)(2)(ii) — Willful and voluntary
          underemployment
        </li>
        <li>1240-02-04-.04(3)(a)(2)(iii) — Incarceration carve-out</li>
        <li>
          1240-02-04-.04(3)(a)(2)(iv) — Statutory default income figures
        </li>
        <li>1240-02-04-.04(3)(a)(2)(v) — Non-income-producing assets</li>
        <li>1240-02-04-.04(3)(a)(3) — Self-employment income</li>
        <li>1240-02-04-.04(3)(a)(5) — Federal benefits to child</li>
        <li>1240-02-04-.04(3)(b) — Variable income averaging</li>
        <li>1240-02-04-.04(3)(c) — Exclusions from gross income</li>
        <li>
          1240-02-04-.04(3)(c)(2) — Means-tested income zero-order rule
        </li>
        <li>1240-02-04-.04(4)(b) — Self-employment tax credit</li>
        <li>1240-02-04-.04(5) — Credits for other children</li>
      </ul>
      <P>
        Statutory authority: Tenn. Code Ann. § 36-5-101, et seq.
        Specifically § 36-5-101(e) for the statutory presumptive maximum
        analysis.
      </P>
      <P>
        Tennessee DHS published guidance:{" "}
        <em>A Guide to Tennessee's Child Support Worksheet</em> (2021
        edition), pp. 8–15, addresses the gross income determination in
        plain language and includes worked examples. The Guide is the most
        authoritative narrative source on how the rule is meant to be
        applied.
      </P>
      <P>
        Cases that practitioners may want to consult:{" "}
        <em>Massey v. Casals</em>, 315 S.W.3d 788 (Tenn. Ct. App. 2009),
        and similar cases addressing the trial court's discretion in
        selecting averaging periods for variable income. Imputation cases
        include those interpreting the willful-underemployment standard;
        readers should verify current treatment of any specific case
        before relying on it.
      </P>
      <P>
        For users who want the rule text directly, the current chapter is
        available through Cornell Legal Information Institute and through
        the Tennessee Secretary of State's rules database.
      </P>

      <div className="mt-12 rounded-md border border-rule bg-cream p-4 text-sm">
        Ready to run a calculation?{" "}
        <Link
          to="/tn"
          className="font-medium text-primary underline decoration-rule underline-offset-2 hover:decoration-primary"
        >
          Open the calculator →
        </Link>
      </div>

      <p className="mt-6 text-xs italic text-muted-foreground">
        This page is part of the TCB Law Tennessee Child Support
        Calculator. It is not legal advice; for guidance on your specific
        case, consult a licensed Tennessee attorney.
      </p>
    </div>
  );
}
