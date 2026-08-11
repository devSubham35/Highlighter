import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { HeroMockup } from "@/components/landing/HeroMockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Camera,
  Check,
  Code2,
  Globe,
  Highlighter as HighlightIcon,
  Layers,
  MessageSquareText,
  MousePointer2,
  PenLine,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#product", label: "Product" },
  { href: "#faq", label: "FAQ" },
];

const features = [
  {
    icon: Code2,
    title: "One-line install",
    description: "Paste a single script tag on any site. No build step, no framework lock-in.",
  },
  {
    icon: Camera,
    title: "Viewport screenshots",
    description: "Capture exactly what users see, including scroll position and layout context.",
  },
  {
    icon: PenLine,
    title: "Built-in annotations",
    description: "Rectangle, arrow, and highlight tools help reporters point to the exact problem.",
  },
  {
    icon: Globe,
    title: "Rich session metadata",
    description: "Browser, OS, device, viewport size, page URL, and referrer are captured automatically.",
  },
  {
    icon: Layers,
    title: "Focused issue board",
    description: "Filter by status and severity, assign owners, and track progress across projects.",
  },
  {
    icon: MessageSquareText,
    title: "Activity history",
    description: "Track status and priority changes with a clear audit trail on every issue.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create a project",
    description: "Sign up, add your website, and copy the widget snippet into your HTML.",
  },
  {
    step: "02",
    title: "Collect visual reports",
    description: "Visitors click the floating widget, annotate screenshots, and submit issues in seconds.",
  },
  {
    step: "03",
    title: "Triage in one place",
    description: "Review screenshots, metadata, and activity history from a clean dashboard built for bug fixing.",
  },
];

const audiences = [
  {
    icon: Users,
    title: "Product teams",
    description: "Turn messy Slack screenshots into structured issues your team can act on.",
  },
  {
    icon: Shield,
    title: "QA & agencies",
    description: "Give clients a frictionless way to report bugs without learning your tools.",
  },
  {
    icon: Sparkles,
    title: "Founders & marketers",
    description: "Catch conversion-killing UI bugs before they cost you signups.",
  },
];

const faqs = [
  {
    question: "How long does setup take?",
    answer: "Most teams are live in under five minutes: create a project, paste the snippet, and you are done.",
  },
  {
    question: "What metadata gets collected?",
    answer:
      "Each report includes browser, OS, device, screen and viewport dimensions, page URL, referrer, and user agent — everything you need to reproduce the issue.",
  },
  {
    question: "Can I customize the widget?",
    answer: "Yes. Choose widget color and position per project so it fits your brand and layout.",
  },
  {
    question: "Do reporters need an account?",
    answer: "No. Anyone on your site can submit a report through the widget without signing in.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-sidebar-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HighlightIcon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-foreground">Highlight</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block">
              <Button type="button" variant="ghost">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button type="button">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--auth-grid-soft)_1px,transparent_1px),linear-gradient(to_bottom,var(--auth-grid-soft)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24 lg:gap-16">
          <div>
            <Badge variant="success" className="mb-4 gap-1.5 px-3 py-1">
              <Zap className="h-3 w-3" />
              Visual bug reporting
            </Badge>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Ship faster by fixing what users actually see.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
              Highlight turns any website into a feedback channel. One script, annotated screenshots, and
              complete session metadata — all flowing into a dashboard your team will actually use.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button type="button">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button type="button" variant="outline">
                  See how it works
                </Button>
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["No credit card", "5-minute setup", "Works on any site"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <HeroMockup />
        </div>
      </section>

      <section className="border-y border-sidebar-border bg-card/50 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 text-center">
          {[
            { value: "< 30s", label: "Average report time" },
            { value: "1 script", label: "To go live" },
            { value: "100%", label: "Visual context" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Everything you need to close the feedback loop
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From the first screenshot to the final fix, Highlight keeps visual context at the center.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border border-sidebar-border bg-card transition-shadow hover:shadow-md dark:bg-surface-elevated"
            >
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-sidebar-border bg-muted/40 py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              From snippet to solved in three steps
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                {index < steps.length - 1 ? (
                  <div
                    aria-hidden
                    className="absolute top-8 left-[calc(50%+2rem)] hidden h-px w-[calc(100%-4rem)] bg-border md:block"
                  />
                ) : null}
                <Card className="relative h-full border border-sidebar-border bg-card dark:bg-surface-elevated">
                  <CardContent className="p-6">
                    <span className="text-3xl font-semibold text-primary/30">{item.step}</span>
                    <h3 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-sidebar-border bg-[var(--code-bg)] p-5 font-mono text-xs text-[var(--code-fg)]">
            <pre className="overflow-x-auto whitespace-pre-wrap break-all">{`<script
  src="https://your-app.com/widget.js"
  data-project-key="your-project-key">
</script>`}</pre>
          </div>
        </div>
      </section>

      <section id="product" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Product</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              A dashboard built for triage, not tickets
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Every report arrives with screenshots, severity, status, and environment details. Your team
              spends less time asking &ldquo;what browser?&rdquo; and more time shipping fixes.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Status workflow from open to resolved",
                "Priority and severity at a glance",
                "Screenshot previews with full metadata",
                "Activity history on every issue",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 inline-block">
              <Button type="button">
                Open your workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section className="border-y border-sidebar-border bg-card/50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Who it&apos;s for</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Built for teams who care about polish
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {audiences.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-sidebar-border bg-background p-6 text-center md:text-left"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary md:mx-0">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="overflow-hidden rounded-2xl border border-sidebar-border bg-linear-to-br from-primary/10 via-card to-card">
          <div className="grid items-center gap-8 p-8 md:grid-cols-[1fr_auto] md:p-12">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <MousePointer2 className="h-5 w-5" />
                <span className="text-sm font-semibold">Floating widget</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Let anyone on your site report a bug in seconds
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                The widget stays out of the way until it is needed. Reporters annotate, describe, and
                submit — you get a complete issue without back-and-forth email threads.
              </p>
            </div>
            <Link href="/register">
              <Button type="button" size="lg" className="w-full md:w-auto">
                Add to your site
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-sidebar-border bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Common questions</h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.question} className="border border-sidebar-border bg-card dark:bg-surface-elevated">
                <CardContent className="p-5">
                  <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <div className="rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground md:px-16 md:py-16">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to catch bugs before users churn?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Create your workspace, paste one script, and start receiving visual bug reports today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button
                type="button"
                variant="secondary"
                className="bg-card text-foreground hover:bg-card/90"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                type="button"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-sidebar-border bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HighlightIcon className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">Highlight</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
            <Link href="/login" className="transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link href="/register" className="transition-colors hover:text-foreground">
              Sign up
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Highlight
          </p>
        </div>
      </footer>
    </div>
  );
}
