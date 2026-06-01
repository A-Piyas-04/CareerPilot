import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Mail,
  Map,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge, Card, buttonClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const modules = [
  {
    title: "Command Center",
    href: "/dashboard",
    description: "Metrics, nudges, pipeline health, deadlines, and recent activity.",
    icon: LayoutDashboard,
    tone: "primary",
  },
  {
    title: "Application Tracker",
    href: "/tracker",
    description: "A polished Kanban board for every opportunity and status change.",
    icon: BriefcaseBusiness,
    tone: "accent",
  },
  {
    title: "Job Hunter",
    href: "/jobs",
    description: "Search jobs, score fit, review evidence, and save matches.",
    icon: Search,
    tone: "violet",
  },
  {
    title: "CV Intelligence",
    href: "/resume",
    description: "Upload, structure, edit, and query resume context with AI.",
    icon: FileText,
    tone: "success",
  },
  {
    title: "Goals",
    href: "/goals",
    description: "Convert career outcomes into focused tasks and milestones.",
    icon: Target,
    tone: "warning",
  },
  {
    title: "Calendar",
    href: "/calendar",
    description: "Schedule interviews, study blocks, deadlines, and reminders.",
    icon: CalendarDays,
    tone: "primary",
  },
  {
    title: "Roadmap Studio",
    href: "/roadmap",
    description: "Generate learning plans and turn roadmap items into action.",
    icon: Map,
    tone: "violet",
  },
  {
    title: "Cover Letters",
    href: "/cover-letters",
    description: "Draft, edit, regenerate, copy, and manage tailored letters.",
    icon: Mail,
    tone: "accent",
  },
  {
    title: "Career Assistant",
    href: "/chat",
    description: "Keep persistent AI conversations close to your career data.",
    icon: Bot,
    tone: "success",
  },
] as const;

const proofPoints = [
  "Authenticated workspace",
  "CV-grounded intelligence",
  "Application history",
  "AI generation flows",
  "Calendar-aware planning",
];

const toneClasses = {
  accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  violet: "bg-[var(--violet-soft)] text-[var(--violet)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-4">
          <Link className="flex items-center gap-3" href="/">
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[var(--foreground)] text-[var(--background)] shadow-[var(--shadow-soft)]">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(84,214,182,0.45),transparent_42%),radial-gradient(circle_at_76%_82%,rgba(138,163,255,0.5),transparent_44%)]" />
              <Sparkles className="relative h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">
                CareerPilot
              </span>
              <span className="block text-xs font-medium text-[var(--muted-foreground)]">
                Career command center
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link
              className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted-foreground)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"
              href="#workspace"
            >
              Workspace
            </Link>
            <Link
              className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted-foreground)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"
              href="#proof"
            >
              Proof
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            {!isLoggedIn ? (
              <Link
                className={buttonClassName({ size: "sm", variant: "secondary" })}
                href="/login"
              >
                Sign in
              </Link>
            ) : null}
            <Link
              className={buttonClassName({ size: "sm" })}
              href={isLoggedIn ? "/dashboard" : "/login?next=/dashboard"}
            >
              Open app
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative">
        <div className="mx-auto grid min-h-[680px] max-w-[1480px] gap-10 px-5 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(480px,1.08fr)] lg:items-center">
          <div className="relative z-10 pb-8">
            <Badge tone="primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered career operations
            </Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--foreground)] md:text-7xl">
              CareerPilot
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
              A premium workspace for finding roles, improving your CV, tracking
              applications, planning learning, and turning AI advice into visible
              career progress.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className={buttonClassName({ size: "lg" })}
                href={isLoggedIn ? "/dashboard" : "/login?next=/dashboard"}
              >
                Launch workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className={buttonClassName({ size: "lg", variant: "secondary" })}
                href="#workspace"
              >
                Explore modules
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {proofPoints.map((item) => (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-glass)] px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)]"
                  key={item}
                >
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <ProductScene />
        </div>
      </section>

      <section id="workspace" className="mx-auto max-w-[1480px] px-5 py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            Live workspace
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Every career workflow, redesigned as one product.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
            The modules keep their current behavior but now share one visual
            language, navigation model, and responsive rhythm.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ description, href, icon: Icon, title, tone }) => (
            <Link href={href} key={href}>
              <Card as="article" className="h-full p-5" interactive>
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-1" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section id="proof" className="border-y border-[var(--border)] bg-[var(--surface-glass)]">
        <div className="mx-auto grid max-w-[1480px] gap-6 px-5 py-14 md:grid-cols-3">
          {[
            ["9", "active modules"],
            ["20s", "query freshness"],
            ["1", "unified shell"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-4xl font-semibold tracking-tight">{value}</p>
              <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function ProductScene() {
  return (
    <div className="relative min-h-[520px]">
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(49,94,234,0.18),transparent_28rem),radial-gradient(circle_at_80%_70%,rgba(15,159,130,0.16),transparent_26rem)]" />
      <div className="relative mx-auto max-w-3xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface-glass)] p-3 shadow-[var(--shadow-strong)] backdrop-blur-2xl">
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                Today
              </p>
              <h2 className="mt-1 text-xl font-semibold">Command Center</h2>
            </div>
            <Badge tone="success">Live</Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.72fr]">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["28", "Applications"],
                  ["71%", "Roadmap"],
                  ["6", "Tasks done"],
                ].map(([value, label]) => (
                  <div
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3"
                    key={label}
                  >
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Application Pipeline</p>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    This week
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ["Saved", "78%"],
                    ["Applied", "56%"],
                    ["Interviewing", "34%"],
                    ["Offer", "18%"],
                  ].map(([label, width]) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                        <span>{label}</span>
                        <span>{width}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--primary)]"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {modules.slice(0, 5).map(({ icon: Icon, title, tone }) => (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3"
                  key={title}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {title}
                    </span>
                    <span className="block truncate text-xs text-[var(--muted-foreground)]">
                      Ready
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
