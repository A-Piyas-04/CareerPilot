import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  Goal,
  Layers3,
  LineChart,
  ListChecks,
  Map,
  MessageSquareText,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";

const corePages = [
  {
    title: "AI Career Assistant",
    href: "/chat",
    description:
      "Save career conversations, review message history, and prepare for the Phase 2.2 AI engine.",
    icon: MessageSquareText,
    accent: "bg-blue-50 text-blue-700",
    status: "Live",
  },
  {
    title: "Application Tracker",
    href: "/tracker",
    description:
      "Move opportunities through Saved, Applied, Interviewing, Offer, and Rejected with history tracking.",
    icon: BriefcaseBusiness,
    accent: "bg-emerald-50 text-emerald-700",
    status: "Live",
  },
  {
    title: "Goals",
    href: "/goals",
    description:
      "Define career outcomes, manage status, and break each goal into focused task lists.",
    icon: Goal,
    accent: "bg-sky-50 text-sky-700",
    status: "Live",
  },
  {
    title: "Calendar",
    href: "/calendar",
    description:
      "Plan interviews, deadlines, reminders, study blocks, and application milestones in one calendar.",
    icon: CalendarDays,
    accent: "bg-violet-50 text-violet-700",
    status: "Live",
  },
  {
    title: "Tasks",
    href: "/goals#tasks",
    description:
      "Keep standalone to-dos organized by overdue, today, this week, and later.",
    icon: ListChecks,
    accent: "bg-amber-50 text-amber-700",
    status: "Live",
  },
  {
    title: "Resume Intelligence",
    href: "/resume",
    description:
      "Upload, inspect, and query resume context that powers future AI recommendations.",
    icon: FileText,
    accent: "bg-rose-50 text-rose-700",
    status: "Live",
  },
  {
    title: "Cover Letter Studio",
    href: "/cover-letters",
    description:
      "Create, manage, copy, edit, and regenerate tailored cover letters from job descriptions.",
    icon: Wand2,
    accent: "bg-blue-50 text-blue-700",
    status: "Live",
  },
  {
    title: "Progress Dashboard",
    href: "/dashboard",
    description:
      "Track applications, roadmap progress, completed tasks, upcoming deadlines, and recent activity.",
    icon: Layers3,
    accent: "bg-zinc-100 text-zinc-700",
    status: "Live",
  },
];

const futureFeatures = [
  {
    title: "Skill Gap Analysis",
    description:
      "Compare resume strengths against target roles and prioritize what to learn next.",
    icon: LineChart,
  },
  {
    title: "Roadmap Generator",
    description:
      "Generate week-by-week learning plans and turn roadmap items into tasks or calendar events.",
    icon: Map,
  },
  {
    title: "AI Nudges",
    description:
      "Surface timely reminders when deadlines, overdue tasks, or stalled applications need attention.",
    icon: Bot,
  },
];

const proofPoints = [
  "Authenticated workspace",
  "Supabase-backed data",
  "Kanban history tracking",
  "Goal-linked and standalone tasks",
  "Calendar deadline visibility",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex max-w-[1560px] items-center justify-between gap-4 px-5 py-4">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold leading-tight">
                CareerPilot
              </span>
              <span className="block text-xs font-medium text-zinc-500">
                Career co-pilot workspace
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              href="#workspace"
            >
              Workspace
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              href="#roadmap"
            >
              Roadmap
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="hidden h-10 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:flex"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              href="/login?next=/tracker"
            >
              Open workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </section>

      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(4,120,87,0.42),transparent_45%,rgba(37,99,235,0.22))]" />
        <div className="relative mx-auto grid min-h-[620px] max-w-[1560px] gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center">
          <div className="max-w-4xl">
            <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-100">
              Career planning, execution, and tracking in one place
            </p>
            <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-tight tracking-normal text-white md:text-7xl">
              CareerPilot
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-200">
              A focused workspace for managing job applications, career goals,
              tasks, resume intelligence, and calendar commitments before the AI
              assistant layer comes online.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className="flex h-12 items-center gap-2 rounded-md bg-emerald-500 px-5 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400"
                href="/login?next=/tracker"
              >
                Start tracking
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="flex h-12 items-center rounded-md border border-white/20 px-5 text-sm font-bold text-white transition hover:bg-white/10"
                href="#workspace"
              >
                View modules
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {proofPoints.map((item) => (
                <span
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-zinc-100"
                  key={item}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur">
            <div className="rounded-md bg-white p-4 text-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Today
                  </p>
                  <h2 className="text-lg font-semibold">Career cockpit</h2>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                  Live
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {corePages.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      className="flex items-center gap-3 rounded-md border border-zinc-200 p-3 transition hover:border-emerald-200 hover:bg-emerald-50"
                      href={item.href}
                      key={item.title}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${item.accent}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-zinc-500">
                          {item.description}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-[1560px] px-5 py-14"
        id="workspace"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Main Pages
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-zinc-950">
              Your active CareerPilot modules
            </h2>
          </div>
          <Link
            className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            href="/login"
          >
            Sign in to continue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {corePages.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="group flex min-h-64 flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                href={item.href}
                key={item.title}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-md ${item.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600">
                    {item.status}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-950">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">
                  {item.description}
                </p>
                <span className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-800">
                  Open page
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white" id="roadmap">
        <div className="mx-auto max-w-[1560px] px-5 py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Coming Next
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-zinc-950">
              Built to grow into a full AI career co-pilot
            </h2>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              The current workspace establishes the productivity layer. Future
              modules can connect resume context, job intelligence, generation
              flows, dashboard analytics, and proactive reminders.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {futureFeatures.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  className="rounded-lg border border-zinc-200 bg-[#f6f7f9] p-5"
                  key={item.title}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-emerald-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-zinc-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
