import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tn_/why-we-built-this")({
  head: () => ({
    meta: [
      { title: "Why We Built This — TN Child Support Calculator" },
      {
        name: "description",
        content:
          "A manifesto on Tennessee's Income Shares model, the spreadsheet problem, and why making the math visible matters. By Taylor C. Berger, TCB Law, PLLC.",
      },
      { property: "og:title", content: "Why We Built This — TN Child Support Calculator" },
      {
        property: "og:description",
        content:
          "Tennessee did the work. We're just turning on the lights. A manifesto on making the Income Shares math visible.",
      },
      { property: "og:url", content: "https://csg.tcblaw.org/tn/why-we-built-this" },
    ],
    links: [{ rel: "canonical", href: "https://csg.tcblaw.org/tn/why-we-built-this" }],
  }),
  component: WhyWeBuiltThis,
});

function WhyWeBuiltThis() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12 leading-relaxed text-ink">
      <header className="border-b border-border pb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Manifesto</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Why We Built This</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Taylor C. Berger, Esq. · TCB Law, PLLC · May 2026
        </p>
      </header>

      <div className="prose-tn mt-8 space-y-5 [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-2xl [&_p]:leading-relaxed [&_em]:italic">
        <p>
          For thirty-five years, Tennessee has been quietly doing something remarkable, and almost
          nobody outside the family law bar has noticed.
        </p>
        <p>
          In 1989, Congress passed the Family Support Act, which required every state to adopt
          presumptive child support guidelines. States had to pick a model. Most picked one of two:
          the percentage-of-obligor-income model, which is mathematically simple but ignores the
          custodial parent's economic contribution, or the Income Shares model, which is
          conceptually elegant but mechanically demanding. Tennessee picked Income Shares. Then
          Tennessee did something the other Income Shares states didn't always do: they actually
          built it out.
        </p>
        <p>
          The result is the body of rules at Tenn. Comp. R. &amp; Regs. Chapter 1240-02-04 — a
          fifty-page document that, read carefully, represents one of the most thoughtful pieces of
          family law in the country. It addresses gross income with specificity. It handles
          imputation. It builds a Self-Support Reserve to protect low-income obligors from being
          ordered to pay more than they can afford. It scales the basic obligation through a
          2,815-row schedule that's been econometrically calibrated to actual household spending on
          children at different income levels. It handles parenting time with a variable
          multiplier formula that reflects the economic reality that an alternate residential
          parent with substantial time is bearing real expenses. It caps the schedule at
          $28,250/month combined AGI and then continues with a marginal-rate formula above that.
          It cross-references the statutory cap at Tenn. Code Ann. § 36-5-101(e)(1)(B) so that
          high-income cases get judicial review of the children's actual needs rather than
          automatic wealth transfer. It even folds in case law — <em>Hugger v. Hugger</em>,{" "}
          <em>Nash v. Mulle</em>, <em>Smith v. Smith</em> — that shapes how the statutory cap
          operates in practice.
        </p>
        <p>
          Read together, it's a system. It tries to do justice to the actual variety of family
          situations. It has a place for the unemployed obligor and the surgeon obligor. It has a
          place for 80-day parenting and 182.5-day parenting and everything in between. It has a
          place for the stay-at-home parent and the two-physician couple and the
          one-million-dollar-earner whose ex still makes $300,000. It tries to give predictable,
          principled answers to all of them.
        </p>
        <p>
          And then it fails to deliver on its own promise. Not because the rules are wrong.
          Because the rules are inaccessible.
        </p>

        <h2>The Spreadsheet Problem</h2>
        <p>
          If you go to the Tennessee Department of Human Services website right now and download
          the official Income Shares Worksheet, you'll get a 2.5MB Excel file. It's a .xlsm —
          macro-enabled. It has six tabs, dozens of named ranges, hundreds of cells, and a VBA
          macro layer that does the actual calculations. It's a heroic piece of work for what it
          is, but what it is, is a spreadsheet trying to do a database's job.
        </p>
        <p>
          I know this because my brother downloaded it. His computer choked trying to open it. The
          error message was something to the effect of "too many formulas." He gave up.
        </p>
        <p>
          He's not an outlier. The official worksheet runs only on certain versions of Excel. It
          requires macros enabled, which most enterprise IT departments disable by default. It has
          a separate Mac version and Windows version, and they don't behave identically. There's
          an iOS app, but it produces different outputs than the spreadsheets in some edge cases.
          The TN AOC has a web calculator too, but it doesn't generate court-ready outputs and it
          doesn't show its work.
        </p>
        <p>
          So what happens in practice? The work falls to law firms. Attorneys and paralegals run
          the numbers themselves, manually, often in their own internal spreadsheets that were
          built years ago by someone who's since left the firm. The math gets done. The math gets
          done correctly more often than not. But the math gets done <strong>in private</strong>,
          behind the closed doors of one side's lawyer, and then the result gets presented to the
          other side as a position.
        </p>
        <p>A position. Not a statement.</p>
        <p>
          Here's the difference: a statement is "this is what the law says, this is what the math
          produces, this is what the order should be." A position is "this is what I'm going to
          argue for, and you're going to argue for something different, and we'll fight about it."
          Tennessee's rules were designed to produce statements. The way the rules are accessed
          produces positions.
        </p>
        <p>
          This isn't anyone's fault. Lawyers have an ethical duty under Rule 1.3 of the Tennessee
          Rules of Professional Conduct to act with reasonable diligence in representing their
          client. They have a duty under Rule 1.1 of competence. In an adversarial system, when
          you're given an opaque, fragile, hard-to-verify calculation tool and a complex set of
          rules that reasonable people could interpret differently, your duty is to interpret them
          in your client's favor. That's the system working as designed. The problem isn't the
          lawyers. The problem is that the tools the lawyers are given turn statements into
          positions.
        </p>

        <h2>What Happens When Statements Become Positions</h2>
        <p>
          In high-income Tennessee divorce cases — which is most of the cases our firm handles —
          the practical result of the spreadsheet problem is that child support gets conflated
          with alimony.
        </p>
        <p>
          I want to be careful here. I am not accusing anyone of anything. I'm describing a
          structural outcome of the system.
        </p>
        <p>
          Here's how it happens. The Income Shares model in Tennessee, applied honestly, produces
          a number that's grounded in actual child-rearing economics and bounded by a statutory
          cap and a body of case law about the children's reasonable needs. For two high earners
          in a 50/50 custody arrangement, that number is often surprisingly modest. For a high
          earner with a moderate-earning ex in standard parenting, the number can exceed the
          statutory cap and trigger a burden-shift to the recipient parent.
        </p>
        <p>
          But the recipient parent's lawyer, looking at a wealthy obligor and a client who is
          about to lose a substantial portion of the household standard of living, has a duty to
          argue for a higher number. The mechanism is available: deviation arguments under Rule
          .07. Extraordinary expenses. Educational expenses. The children's needs. The standard of
          living during the marriage. All legitimate, all in the rules, all subject to
          interpretation.
        </p>
        <p>
          And on the other side, the obligor's lawyer, looking at the formula output and a client
          who is about to have a chunk of their income redirected, has a duty to argue for a lower
          number. The mechanisms are available: the statutory cap. The recipient parent's burden.{" "}
          <em>Hugger</em> and <em>Smith</em>. The children's actual needs versus the recipient
          parent's lifestyle preferences.
        </p>
        <p>
          Both sides are doing their job. Both sides are interpreting an opaque system in their
          client's favor. And what happens in the middle, structurally and statistically, is that
          the dispute drifts. The recipient parent's lawyer pushes for a number that includes
          things the recipient parent would have received under alimony if alimony had been
          awarded — household maintenance, lifestyle preservation, a piece of the standard of
          living. The obligor's lawyer pushes back against any of that, and the resulting
          compromise number is somewhere in the middle.
        </p>
        <p>
          That middle number isn't really child support anymore. It's child support plus a quiet,
          unofficial alimony component, hiding inside deviation arguments that no one can quite
          audit because the underlying calculation was never transparent in the first place.
        </p>
        <p>
          Tennessee's legislature did not intend this. The statute is explicit: alimony is
          governed by Tenn. Code Ann. § 36-5-121, which has its own factors, its own analysis, its
          own appellate review. Child support is governed by § 36-5-101 and Chapter 1240-02-04,
          which have their own factors, their own analysis, their own review. The legislature kept
          them separate on purpose. The structural opacity of the calculation tool blurs the line
          between them in practice.
        </p>
        <p>
          This isn't a Tennessee problem specifically. Other states that adopted Income Shares
          have seen the same pattern, and it's one of the things that scares states that haven't
          yet adopted Income Shares. They look at Tennessee, they see the conflation, and they
          conclude that Income Shares is too complicated to administer cleanly. So they stay with
          simpler models — like Mississippi's flat percentage of obligor income — that produce
          predictable results at the cost of nuance.
        </p>

        <h2>The Mississippi Tradeoff</h2>
        <p>
          Mississippi's child support statute fits on three pages. Miss. Code Ann. § 43-19-101
          establishes a flat percentage: 14% of adjusted gross income for one child, 20% for two,
          22% for three, 24% for four, 26% for five or more. That's the entire calculation
          engine. No schedule. No parenting time adjustment. No 50/50 cross-credit. No SSR. No
          above-cap formula.
        </p>
        <p>
          Mississippi handles nuance differently. § 43-19-103 lists ten criteria — extraordinary
          medical expenses, the age of the child, the particular shared parental arrangement,
          total available assets, "any other adjustment which is needed to achieve an equitable
          result" — that allow the court to deviate from the flat percentage. Deviation is fully
          discretionary. The chancellor decides.
        </p>
        <p>
          I'm a Mississippi-licensed attorney. I have great respect for the Mississippi chancery
          system and for the judges who serve in it. They take this work seriously, and they do
          their best to reach equitable results.
        </p>
        <p>
          But Mississippi's system, by design, pushes the difficult work onto the judiciary at the
          time of the case. The chancellor has to absorb the facts, weigh the ten statutory
          factors, consider the totality of the circumstances, and exercise discretion. The
          result is whatever the chancellor concludes is equitable. Different chancellors reach
          different conclusions on similar facts. Different counties have different cultures.
          Predictability suffers.
        </p>
        <p>
          Tennessee's system, by contrast, tries to do the hard work in advance, at the
          legislative level, by encoding the principles into rules that produce predictable
          outputs. When the rules are accessible, this works beautifully. Two parents at
          $65,000/month and $20,000/month with three children and 50/50 custody should produce
          the same support number whether they're in Memphis or Knoxville, whether their judge is
          conservative or liberal, whether their lawyers are aggressive or accommodating. The
          number is what the rules say it is.
        </p>
        <p>
          The Mississippi tradeoff is: simpler statute, more judicial discretion, less
          predictability, lower administrative cost, but a wider range of outcomes for
          similarly-situated families.
        </p>
        <p>
          The Tennessee tradeoff is: more complex statute, more predictability, less judicial
          discretion, higher administrative cost, but a narrower range of outcomes for
          similarly-situated families — <strong>if</strong> the administrative complexity is
          actually delivered to the users.
        </p>
        <p>That "if" is the problem we set out to solve.</p>

        <h2>What We Built</h2>
        <p>
          We built a calculator. It runs at <code>tncsg.tcblaw.org</code>. It implements
          Tennessee's Income Shares model as defined in Chapter 1240-02-04 and § 36-5-101. It
          uses the verified BCSO schedule data from the official 2022 TN DHS worksheet. It
          applies the above-cap formula correctly. It engages the Self-Support Reserve when the
          obligor is in the shaded area. It applies the variable multiplier for parenting time
          adjustments. It handles the 50/50 cross-credit using the literal reading of Rule
          .04(7)(b)(2)(i). It flags the statutory presumptive cap under § 36-5-101(e)(1)(B) and
          explains the burden-shift to the recipient parent. It applies the Means-Tested Income
          zero-order rule. It handles private school as a discretionary deviation. It correctly
          distinguishes Special Expenses from Extraordinary Educational Expenses and applies the
          7% threshold to the former.
        </p>
        <p>
          It has eight verification tests covering every income zone and parenting arrangement.
          It cross-checks the math against the official TN DHS worksheet. It produces both an
          on-screen worksheet and a PDF output that mirrors the official AOC form.
        </p>
        <p>
          It explains itself. There's a{" "}
          <Link to="/tn/how-it-works" className="underline">
            How It Works
          </Link>{" "}
          page that walks through the model in plain English, with five worked use cases covering
          single-earner, high-earner / moderate-earner, two-high-earners-with-disparity,
          two-high-earners-with-near-parity, and ultra-high-income scenarios. Each case shows the
          math, identifies which protections engage, and explains the strategic implications for
          both parents.
        </p>
        <p>
          It is open source. The repository lives at{" "}
          <a
            href="https://github.com/tcbmem-png/tn-child-support-helper"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            github.com/tcbmem-png/tn-child-support-helper
          </a>
          . Every formula is annotated with its rule citation. Every calculation can be traced
          from input to output. Any attorney, any party, any judge, any contributor can audit the
          code, verify the math, and propose corrections.
        </p>
        <p>
          It is not legal advice. It is a calculator. It produces the presumptive number that the
          Tennessee Income Shares model dictates given the inputs. What the parties do with that
          number — what they negotiate, what they file, what the court ultimately orders — is and
          remains a function of human judgment exercised in the specific context of the case.
        </p>
        <p>But the number is the number. It is no longer a position. It is a statement.</p>

        <h2>Why This Matters</h2>
        <p>
          For thirty-five years, Tennessee's family law bar has been working with a system that's
          brilliant in design and broken in delivery. The legislature did good work. The rules do
          good work. The official worksheet does good work, when it works at all, for the people
          who can get it to open. The breakdown happens at the point where ordinary parties —
          parents trying to negotiate a parenting plan, parents trying to assess whether their
          existing order should be modified, parents trying to understand what to expect before
          they file — try to use the system without paying a lawyer to run the numbers in
          private.
        </p>
        <p>
          We have made the system accessible. We have made it transparent. We have made it
          auditable. We have not changed the math. The math was already there.
        </p>
        <p>
          What changes when the math is accessible is that the conversation between divorcing
          parents changes. Instead of "my lawyer says X and your lawyer says Y and we're $5,000 a
          month apart," the conversation becomes "we both put our incomes into the calculator,
          here's what the rules produce, here's what the protections do, here's where the
          discretion lives." That conversation is shorter. That conversation is cheaper. That
          conversation is more likely to settle. And the settlement is more likely to reflect
          what the legislature actually intended, rather than the gravitational pull of the
          adversarial process.
        </p>
        <p>
          Lawyers don't lose work in this system. Lawyers gain time. The time that used to be
          spent running numbers in spreadsheets and arguing over the resulting outputs gets
          redirected to the work that actually requires legal judgment: the deviations, the
          imputation analyses, the parenting plan negotiations, the cases where the formula
          doesn't tell you what to do because the facts are unusual. That's the work lawyers
          should be doing. That's the work clients should be paying for. The math should never
          have been the bottleneck.
        </p>
        <p>
          We are not arrogant about this. We did not invent the Income Shares model. We did not
          write the rules. We did not develop the case law. All we did was take what the
          Tennessee legislature, the Department of Human Services, and the appellate courts have
          spent three decades building, and translate it from a fragile spreadsheet into a
          calculator that any parent can use.
        </p>
        <p>
          If it helps people, that's what it's for. If it helps lawyers, that's what it's for. If
          it helps other states see that the Income Shares model can be administered cleanly —
          without conflating child support with alimony, without inviting adversarial drift,
          without sacrificing predictability — that's what it's for too.
        </p>
        <p>Tennessee got something right. We just made it visible.</p>

        <h2>A Word About What's Next</h2>
        <p>
          We're building the Mississippi version next, at <code>mscsg.tcblaw.org</code>.
          Mississippi's calculator will be simpler because Mississippi's statute is simpler, but
          it will be transparent in the same way. It will show the calculation. It will show the
          deviation factors. It will respect the chancellor's discretion by being explicit about
          where discretion lives and where it doesn't.
        </p>
        <p>
          After Mississippi: Alabama, Arkansas, and possibly Louisiana. The same architecture,
          the same transparency, the same respect for what each state's legislature has decided
          about how child support should work in their state.
        </p>
        <p>
          The goal is not to replace lawyers. The goal is not to replace courts. The goal is to
          make the math visible — the math that's already been done, decades ago, by legislators
          and rule-writers and judges who did good work that nobody can currently see.
        </p>
        <p>Tennessee did the work. We're just turning on the lights.</p>
      </div>

      <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>— Taylor C. Berger, Esq.</p>
        <p>TCB Law, PLLC · Memphis · Oxford</p>
        <p>May 2026</p>
        <p className="mt-6 italic">
          This is not legal advice. For estimates only. Consult a licensed Tennessee attorney for
          guidance on your specific case. The TN Child Support Calculator is open source under
          the MIT License; the code repository is available at{" "}
          <a
            href="https://github.com/tcbmem-png/tn-child-support-helper"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            github.com/tcbmem-png/tn-child-support-helper
          </a>
          .
        </p>
      </footer>
    </article>
  );
}
