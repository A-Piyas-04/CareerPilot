import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  LayoutDashboard,
  LineChart,
  Mail,
  Map,
  Menu,
  MessageSquareText,
  Radar,
  Search,
  Sparkles,
  TrendingUp,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { LandingBrandLogo } from "@/components/landing/landing-brand-logo";
import { LandingMobileNavLinks } from "@/components/landing/landing-mobile-nav-links";
import { LandingSectionNav } from "@/components/landing/landing-section-nav";

const LANDING_SECTION_SCROLL_MARGIN = "scroll-mt-[88px]";

const LANDING_MAX = "mx-auto w-full max-w-[1560px] px-5";

function loginNext(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}

const NAV_ANCHORS = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#modules", label: "Modules" },
  { href: "#demo", label: "Demo" },
  { href: "#faq", label: "FAQ" },
] as const;

const PROOF_CARDS = [
  {
    title: "CV-grounded RAG",
    description: "Every answer and score is tied to your indexed resume chunks.",
    icon: Database,
  },
  {
    title: "Live job search",
    description: "Search real roles and compare them against your profile in one flow.",
    icon: Search,
  },
  {
    title: "Programmatic fit score",
    description: "Evidence-backed match scores with matched and missing skills.",
    icon: Radar,
  },
  {
    title: "Progress tracking dashboard",
    description: "Kanban, goals, calendar, and metrics in a unified workspace.",
    icon: TrendingUp,
  },
] as const;

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Upload or build CV",
    description: "Import your resume or craft one in the CV Intelligence workspace.",
  },
  {
    step: 2,
    title: "AI extracts skills and experience",
    description: "Structured skills, roles, and evidence chunks power every agent.",
  },
  {
    step: 3,
    title: "Search live jobs",
    description: "Job Hunter surfaces roles aligned to your background and goals.",
  },
  {
    step: 4,
    title: "Score fit with evidence",
    description: "Programmatic fit scores show why you match — and what to close.",
  },
  {
    step: 5,
    title: "Generate cover letter / roadmap",
    description: "Tailored letters and week-by-week learning plans from real gaps.",
  },
  {
    step: 6,
    title: "Track applications and progress",
    description: "Move opportunities through stages and watch your dashboard grow.",
  },
] as const;

type FeatureAccent = "emerald" | "sky" | "violet";

const ACCENT_BADGE: Record<FeatureAccent, string> = {
  emerald: "bg-emerald-900/10 text-emerald-900 ring-emerald-800/20",
  sky: "bg-sky-900/10 text-sky-900 ring-sky-800/20",
  violet: "bg-violet-900/10 text-violet-900 ring-violet-800/20",
};

const FEATURE_MODULES: {
  title: string;
  description: string;
  badge: string;
  route: string;
  icon: LucideIcon;
  accent: FeatureAccent;
}[] = [
  {
    title: "CV Intelligence",
    description:
      "Upload, parse, and query your CV so every agent speaks from your real experience.",
    badge: "RAG powered",
    route: "/resume",
    icon: FileText,
    accent: "emerald",
  },
  {
    title: "Job Hunter Agent",
    description:
      "Search live openings, review fit scores, and save strong matches to your tracker.",
    badge: "Live API",
    route: "/jobs",
    icon: Sparkles,
    accent: "emerald",
  },
  {
    title: "AI Career Assistant",
    description:
      "Grounded chat for readiness checks, gaps, roadmaps, and application strategy.",
    badge: "AI grounded",
    route: "/chat",
    icon: MessageSquareText,
    accent: "emerald",
  },
  {
    title: "Skill Gap Analysis",
    description:
      "Compare your CV to target roles and prioritize what to learn next.",
    badge: "AI grounded",
    route: "/skill-gap",
    icon: LineChart,
    accent: "sky",
  },
  {
    title: "Cover Letter Studio",
    description:
      "Draft, edit, and regenerate tailored cover letters from job descriptions.",
    badge: "AI grounded",
    route: "/cover-letters",
    icon: Mail,
    accent: "sky",
  },
  {
    title: "Roadmap Planner",
    description:
      "Build week-by-week learning plans and link items to tasks or calendar.",
    badge: "AI grounded",
    route: "/roadmap",
    icon: Map,
    accent: "sky",
  },
  {
    title: "Application Kanban",
    description:
      "Track Saved → Applied → Interviewing → Offer with full history.",
    badge: "Tracker",
    route: "/tracker",
    icon: BriefcaseBusiness,
    accent: "violet",
  },
  {
    title: "Calendar + Goals",
    description:
      "Plan interviews, deadlines, and milestones with goal-linked tasks.",
    badge: "Tracker",
    route: "/goals",
    icon: CalendarDays,
    accent: "violet",
  },
  {
    title: "Progress Dashboard",
    description:
      "Applications, skills indexed, roadmap progress, tasks, and AI nudges.",
    badge: "Tracker",
    route: "/dashboard",
    icon: LayoutDashboard,
    accent: "violet",
  },
];

const DEMO_STEPS = [
  { label: "CV upload", icon: Upload },
  { label: "Job search", icon: Search },
  { label: "Fit score", icon: Radar },
  { label: "Assistant query", icon: MessageSquareText },
  { label: "Cover letter", icon: Wand2 },
  { label: "Tracker update", icon: BriefcaseBusiness },
  { label: "Dashboard", icon: LayoutDashboard },
] as const;

const FAQ_ITEMS = [
  {
    question: "Does CareerPilot use my actual CV?",
    answer:
      "Yes. You upload or build your resume in CV Intelligence. It is chunked and indexed so agents, fit scoring, and chat stay grounded in your real experience.",
  },
  {
    question: "Can it search real jobs?",
    answer:
      "Job Hunter connects to live job search. Results are scored against your indexed CV so you see match quality before you apply.",
  },
  {
    question: "How is fit score calculated?",
    answer:
      "Fit scores are computed programmatically from your CV skills and job requirements, with evidence for matched and missing skills — not a generic guess.",
  },
  {
    question: "Can it generate cover letters?",
    answer:
      "Cover Letter Studio drafts tailored letters from your CV context and job descriptions. You can edit, copy, and regenerate anytime.",
  },
  {
    question: "Does it track applications?",
    answer:
      "The Application Tracker uses a Kanban board with stage history. Saved jobs from Job Hunter flow in, and your dashboard reflects pipeline progress.",
  },
] as const;

/** Shared landing visual tokens */
const forestGradient =
  "bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950";
const premiumCard =
  "rounded-3xl border border-emerald-900/10 bg-gradient-to-b from-white via-white to-emerald-50/40 shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-900/[0.06] backdrop-blur-sm transition-all duration-300 ease-out";
const cardHoverLift =
  "hover:-translate-y-1.5 hover:scale-[1.01] hover:border-emerald-600/25 hover:shadow-xl hover:shadow-emerald-900/20";
const sectionTitle =
  "bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-800 bg-clip-text text-transparent";
const navSignInStyles =
  "h-11 items-center justify-center rounded-lg border border-emerald-200/90 bg-emerald-50 px-5 text-[15px] font-semibold text-emerald-800 transition duration-200 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-900";
const navSignIn = `hidden sm:inline-flex ${navSignInStyles}`;
const navCtaPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 px-5 text-[15px] font-semibold text-white shadow-md shadow-emerald-900/25 ring-1 ring-emerald-700/30 transition duration-200 hover:shadow-lg hover:shadow-emerald-900/30 hover:brightness-110";
const btnForest =
  "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-900 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition-all duration-300 hover:scale-[1.02] hover:border-white/50 hover:from-emerald-900 hover:via-emerald-700 hover:to-teal-800 hover:shadow-emerald-900/40 active:scale-[0.98]";

const PROOF_CARD_TINTS = [
  "from-emerald-600/10 to-teal-500/5 group-hover:from-emerald-600/20",
  "from-teal-600/10 to-cyan-500/5 group-hover:from-teal-600/20",
  "from-sky-600/10 to-indigo-500/5 group-hover:from-sky-600/20",
  "from-violet-600/10 to-fuchsia-500/5 group-hover:from-violet-600/20",
] as const;

const PROOF_ICON_GRADIENTS = [
  "from-emerald-700 to-emerald-950",
  "from-teal-600 to-emerald-900",
  "from-sky-600 to-indigo-900",
  "from-violet-600 to-purple-900",
] as const;

const FEATURE_CARD_GLOW: Record<FeatureAccent, string> = {
  emerald:
    "hover:shadow-emerald-600/25 group-hover:border-emerald-500/30 before:group-hover:opacity-100 before:bg-gradient-to-r before:from-emerald-600 before:via-emerald-500 before:to-teal-500",
  sky: "hover:shadow-sky-600/20 group-hover:border-sky-500/30 before:group-hover:opacity-100 before:bg-gradient-to-r before:from-sky-600 before:via-cyan-500 before:to-emerald-500",
  violet:
    "hover:shadow-violet-600/20 group-hover:border-violet-500/30 before:group-hover:opacity-100 before:bg-gradient-to-r before:from-violet-600 before:via-purple-500 before:to-indigo-500",
};

const ACCENT_CHIP_GRADIENT: Record<FeatureAccent, string> = {
  emerald: "bg-gradient-to-br from-emerald-600 to-emerald-950 text-white shadow-md shadow-emerald-900/30",
  sky: "bg-gradient-to-br from-sky-500 to-indigo-800 text-white shadow-md shadow-sky-900/25",
  violet:
    "bg-gradient-to-br from-violet-500 to-purple-900 text-white shadow-md shadow-violet-900/25",
};

/** Section shells — alternating bands for clear separation (features section excluded) */
const sectionShell =
  "border-y border-emerald-200/80 py-16 md:py-24";
const sectionBgWorkflow = "bg-white";
const sectionBgModules = "bg-emerald-50/90";
const sectionBgDemo = "bg-teal-50/80";
const sectionBgPreview = "bg-sky-50/50";
const sectionBgFaq = "bg-zinc-100/90";
const sectionBgCta = "bg-gradient-to-b from-emerald-100/40 to-emerald-50/30";

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <LandingBrandLogo compact={compact} />;
}

function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-zinc-200/90 bg-white/90 shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset,0_4px_24px_-4px_rgba(6,78,59,0.12)] backdrop-blur-xl backdrop-saturate-150">
        <div
          className={`${LANDING_MAX} flex h-[4.5rem] items-center justify-between gap-4 lg:gap-8`}
        >
          <BrandLogo />

          <nav
            className="hidden flex-1 justify-center lg:flex"
            aria-label="Landing sections"
          >
            <LandingSectionNav items={NAV_ANCHORS} />
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <details className="relative lg:hidden">
              <summary
                className="flex h-11 w-11 list-none cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-zinc-50 text-zinc-700 transition hover:border-emerald-300/60 hover:bg-white hover:text-emerald-900 marker:content-none [&::-webkit-details-marker]:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-emerald-950/10 ring-1 ring-zinc-100">
                <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Navigate
                  </p>
                </div>
                <div className="p-2">
                  <LandingMobileNavLinks items={NAV_ANCHORS} />
                </div>
                <div className="space-y-2 border-t border-zinc-100 bg-zinc-50/50 p-3">
                  <Link
                    className={`flex w-full ${navSignInStyles}`}
                    href="/login"
                  >
                    Sign in
                  </Link>
                  <Link
                    className={`${navCtaPrimary} w-full`}
                    href={loginNext("/resume")}
                  >
                    Start free
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </details>

            <span
              className="mx-0.5 hidden h-8 w-px bg-zinc-200 sm:block lg:mx-1"
              aria-hidden
            />

            <Link className={navSignIn} href="/login">
              Sign in
            </Link>
            <Link className={`${navCtaPrimary} shrink-0`} href={loginNext("/resume")}>
              <span className="hidden sm:inline">Start free</span>
              <span className="sm:hidden">Get started</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroMockPanel() {
  return (
    <div
      className={`${premiumCard} ${cardHoverLift} relative overflow-hidden p-1 ring-2 ring-emerald-900/10`}
      aria-hidden
    >
      <div className={`absolute inset-0 opacity-90 ${forestGradient}`} />
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-teal-400/30 blur-3xl" />
      <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="relative rounded-[1.35rem] border border-white/10 bg-gradient-to-b from-white/95 to-emerald-50/80 p-5 shadow-inner backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-emerald-900/10 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Career cockpit
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">
              Senior Software Engineer match
            </p>
          </div>
          <span className="rounded-full bg-gradient-to-r from-emerald-700 to-emerald-950 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            CV indexed
          </span>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div
            className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-2xl font-bold text-white shadow-lg shadow-emerald-600/30"
            role="img"
            aria-label="86 percent job fit"
          >
            86%
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Job fit
            </p>
            <p className="text-lg font-semibold text-zinc-950">Strong match</p>
            <p className="mt-1 text-sm text-zinc-600">
              Evidence from 12 CV chunks · 3 gaps to close
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold text-zinc-500">Matched skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Python", "React", "SQL", "AWS"].map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-zinc-500">Missing skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Kubernetes", "GraphQL"].map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3">
          <div className="flex items-start gap-2">
            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden />
            <div>
              <p className="text-xs font-semibold text-sky-800">AI recommendation</p>
              <p className="mt-1 text-sm leading-relaxed text-sky-950">
                Prioritize a Kubernetes mini-project, then generate a tailored cover
                letter for this role.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-violet-700" aria-hidden />
            <span className="text-sm font-semibold text-violet-900">
              Tracker status
            </span>
          </div>
          <span className="text-sm font-medium text-violet-800">
            2 in Interviewing · 5 Saved
          </span>
        </div>
      </div>
    </div>
  );
}

function ProofStrip() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PROOF_CARDS.map((card, index) => {
        const Icon = card.icon;
        return (
          <article
            key={card.title}
            className={`${premiumCard} ${cardHoverLift} group relative overflow-hidden p-5`}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 transition-opacity duration-300 ${PROOF_CARD_TINTS[index]}`}
              aria-hidden
            />
            <span
              className={`relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white transition duration-300 group-hover:scale-110 group-hover:shadow-lg ${PROOF_ICON_GRADIENTS[index]}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="relative mt-4 text-base font-semibold text-emerald-950">
              {card.title}
            </h3>
            <p className="relative mt-2 text-sm leading-relaxed text-zinc-600">
              {card.description}
            </p>
          </article>
        );
      })}
    </div>
  );
}

function WorkflowTimeline() {
  return (
  <>
    <ol className="relative hidden gap-0 lg:grid lg:grid-cols-6">
      <div
        className="pointer-events-none absolute left-[8%] right-[8%] top-6 h-0.5 bg-gradient-to-r from-emerald-200 via-sky-200 to-violet-200"
        aria-hidden
      />
      {WORKFLOW_STEPS.map((item) => (
        <li key={item.step} className="group relative flex flex-col items-center px-2 text-center">
          <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition duration-300 group-hover:scale-110 group-hover:shadow-emerald-600/40">
            {item.step}
          </span>
          <h3 className="mt-4 text-sm font-semibold text-zinc-950">{item.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            {item.description}
          </p>
        </li>
      ))}
    </ol>

    <ol className="relative space-y-0 lg:hidden">
      {WORKFLOW_STEPS.map((item, index) => (
        <li
          key={item.step}
          className="relative flex gap-4 border-l-2 border-emerald-200 pb-8 pl-6 last:border-transparent last:pb-0"
        >
          <span className="absolute -left-[1.05rem] flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-xs font-bold text-white shadow-md">
            {item.step}
          </span>
          <div>
            <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {item.description}
            </p>
          </div>
          {index < WORKFLOW_STEPS.length - 1 && (
            <span className="sr-only">Next step</span>
          )}
        </li>
      ))}
    </ol>
  </>
  );
}

function FeatureCard({
  title,
  description,
  badge,
  route,
  icon: Icon,
  accent,
}: (typeof FEATURE_MODULES)[number]) {
  return (
    <Link
      className={`${premiumCard} ${cardHoverLift} group relative flex min-h-[260px] flex-col overflow-hidden p-6 before:absolute before:inset-x-0 before:top-0 before:h-1 before:opacity-0 before:transition-opacity before:duration-300 ${FEATURE_CARD_GLOW[accent]}`}
      href={loginNext(route)}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-105 ${ACCENT_CHIP_GRADIENT[accent]}`}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${ACCENT_BADGE[accent]}`}
        >
          {badge}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-emerald-950">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">
        {description}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800 transition group-hover:text-emerald-950">
        Explore
        <ChevronRight
          className="h-4 w-4 transition group-hover:translate-x-1"
          aria-hidden
        />
      </span>
    </Link>
  );
}

function DemoJourney() {
  return (
    <div className="overflow-x-auto pb-2 lg:overflow-visible">
        <ol className="flex min-w-[min(100%,640px)] flex-col gap-0 lg:min-w-0 lg:flex-row lg:items-stretch">
          {DEMO_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.label}
                className="flex flex-1 items-stretch lg:min-w-0"
              >
                <div className="flex flex-1 flex-col">
                  <div
                    className={`${premiumCard} ${cardHoverLift} group/step flex flex-1 flex-col items-center p-4 text-center lg:p-5`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 via-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/30 transition duration-300 group-hover/step:scale-110 group-hover/step:shadow-emerald-700/40">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-zinc-950">
                      {step.label}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">Step {index + 1}</p>
                  </div>
                  {index < DEMO_STEPS.length - 1 && (
                    <div
                      className="flex items-center justify-center py-2 text-emerald-400 lg:hidden"
                      aria-hidden
                    >
                      <ChevronRight className="h-5 w-5 rotate-90" />
                    </div>
                  )}
                </div>
                {index < DEMO_STEPS.length - 1 && (
                  <div
                    className="hidden shrink-0 items-center px-1 text-emerald-300 lg:flex"
                    aria-hidden
                  >
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
    </div>
  );
}

function SectionHeader({
  eyebrowText,
  title,
  description,
  id,
}: {
  eyebrowText: string;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="inline-flex rounded-full bg-gradient-to-r from-emerald-900/10 to-teal-800/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-800/15">
        {eyebrowText}
      </p>
      <h2 id={id} className={`mt-3 text-3xl font-semibold tracking-tight md:text-4xl ${sectionTitle}`}>
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-zinc-600">{description}</p>
    </div>
  );
}

function ResumeMockPanel() {
  return (
    <div className={`${premiumCard} ${cardHoverLift} p-6 transition duration-300 hover:ring-emerald-600/20`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
        Resume intelligence
      </p>
      <h3 className="mt-2 text-lg font-semibold text-zinc-950">Indexed CV sections</h3>
      <ul className="mt-4 space-y-3">
        {[
          { section: "Experience", score: 94 },
          { section: "Skills", score: 88 },
          { section: "Projects", score: 91 },
        ].map((row) => (
          <li
            key={row.section}
            className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-zinc-900">{row.section}</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                {row.score}% match
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${row.score}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-sm text-indigo-950">
        “Led migration to microservices…” — chunk evidence for fit scoring.
      </p>
    </div>
  );
}

function JobMatchMockPanel() {
  return (
    <div className={`${premiumCard} ${cardHoverLift} p-6 transition duration-300 md:-rotate-1 md:hover:rotate-0`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
        Job match
      </p>
      <h3 className="mt-2 text-lg font-semibold text-zinc-950">
        Senior Software Engineer
      </h3>
      <p className="text-sm text-zinc-600">Northline Labs · Remote</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-lg font-bold text-white shadow-lg shadow-emerald-900/30">
          86
        </span>
        <div>
          <p className="font-semibold text-emerald-800">Strong fit</p>
          <p className="text-sm text-zinc-600">Programmatic score with evidence</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-zinc-700">
        <li className="flex gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          4+ years backend experience cited from CV
        </li>
        <li className="flex gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          React and SQL listed in skills section
        </li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
          Gap: Kubernetes
        </span>
      </div>
    </div>
  );
}

function TrackerDashboardMockPanel() {
  return (
    <div className={`${premiumCard} ${cardHoverLift} p-6 transition duration-300 md:rotate-1 md:hover:rotate-0`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
        Tracker & dashboard
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Saved", "Applied", "Interview"].map((col, i) => (
          <div
            key={col}
            className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-2"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              {col}
            </p>
            <div
              className={`mt-2 rounded-lg border border-dashed border-zinc-200 bg-white p-2 text-xs font-medium text-zinc-700 ${i === 2 ? "border-emerald-200 bg-emerald-50/50" : ""}`}
            >
              {i === 0 ? "3 roles" : i === 1 ? "2 roles" : "2 active"}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-3">
          <p className="text-xs text-zinc-500">Applications</p>
          <p className="text-2xl font-semibold text-zinc-950">12</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-3">
          <p className="text-xs text-zinc-500">Skills indexed</p>
          <p className="text-2xl font-semibold text-zinc-950">28</p>
        </div>
      </div>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-2xl border border-emerald-900/10 bg-gradient-to-r from-white to-emerald-50/30 shadow-sm transition-all duration-300 hover:border-emerald-700/25 hover:shadow-md hover:shadow-emerald-900/10 open:border-emerald-700/30 open:bg-gradient-to-r open:from-emerald-50/50 open:to-white open:shadow-lg">
      <summary className="cursor-pointer list-none px-5 py-4 text-base font-semibold text-emerald-950 marker:content-none transition-colors hover:text-emerald-900 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          {question}
          <ChevronRight
            className="h-5 w-5 shrink-0 text-zinc-400 transition group-open:rotate-90"
            aria-hidden
          />
        </span>
      </summary>
      <div className="border-t border-zinc-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-zinc-600">
        {answer}
      </div>
    </details>
  );
}

function FinalCta() {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl px-6 py-14 text-center text-white shadow-2xl shadow-emerald-950/40 md:px-12 ${forestGradient}`}
      aria-labelledby="final-cta-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(20,184,166,0.25),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl"
        aria-hidden
      />
      <h2
        id="final-cta-heading"
        className="relative text-3xl font-semibold tracking-tight md:text-4xl"
      >
        Start with your CV. Let CareerPilot handle the rest.
      </h2>
      <p className="relative mx-auto mt-4 max-w-2xl text-base text-emerald-50">
        Sign in to upload your resume, search jobs, score fit, and track every
        application in one workspace.
      </p>
      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-emerald-900 shadow-lg transition duration-300 hover:scale-105 hover:bg-emerald-50 hover:shadow-xl"
          href={loginNext("/resume")}
        >
          Upload CV
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          className="inline-flex h-12 items-center rounded-xl border-2 border-white/40 px-6 text-sm font-bold text-white backdrop-blur transition duration-300 hover:scale-105 hover:border-white hover:bg-white/15"
          href="/login"
        >
          Sign in
        </Link>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className={`border-t border-emerald-900/15 py-10 text-emerald-50 ${forestGradient}`}>
      <div
        className={`${LANDING_MAX} flex flex-col items-center justify-between gap-6 sm:flex-row`}
      >
        <Link className="flex items-center gap-2.5" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/20">
            <Sparkles className="h-4 w-4 text-white" aria-hidden />
          </span>
          <span className="text-sm font-bold text-white">CareerPilot</span>
        </Link>
        <p className="text-sm text-emerald-100/80">
          © {new Date().getFullYear()} CareerPilot. AI-powered career co-pilot.
        </p>
        <Link
          className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/10"
          href="/login"
        >
          Sign in
        </Link>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-200/50 text-zinc-950">
      <LandingNavbar />

      {/* Hero */}
      <section
        id="features"
        className={`relative overflow-hidden border-b border-emerald-900/10 ${LANDING_SECTION_SCROLL_MARGIN}`}
        aria-labelledby="hero-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(6,78,59,0.15),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(14,116,144,0.12),transparent_45%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(6,95,70,0.08)_1px,transparent_0)] [background-size:28px_28px]"
          aria-hidden
        />
        <div className={`${LANDING_MAX} relative grid gap-10 py-14 md:py-20 lg:grid-cols-2 lg:items-center lg:gap-12`}>
          <div
            className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl shadow-emerald-950/25 ring-1 ring-emerald-900/20 md:p-10 ${forestGradient}`}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl"
              aria-hidden
            />
            <p className="relative inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-100 backdrop-blur">
              <Zap className="h-4 w-4 text-emerald-300" aria-hidden />
              AI-powered career co-pilot
            </p>
            <h1
              id="hero-heading"
              className="relative mt-6 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-[3.25rem]"
            >
              Your AI Career Co-pilot from CV to Job Offer
            </h1>
            <p className="relative mt-5 max-w-xl text-lg leading-8 text-emerald-100/90">
              CareerPilot understands your CV, finds matching jobs, scores fit with
              evidence, drafts applications, builds learning roadmaps, and tracks
              your progress — from first upload to offer.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center gap-3">
              <Link className={`${btnForest} h-12`} href={loginNext("/resume")}>
                Upload your CV
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                className="inline-flex h-12 items-center rounded-xl border-2 border-white/30 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur transition duration-300 hover:scale-[1.02] hover:border-white/50 hover:bg-white/20"
                href={loginNext("/jobs")}
              >
                Find matching jobs
              </Link>
            </div>
          </div>
          <HeroMockPanel />
        </div>

        <div className={`${LANDING_MAX} relative pb-14 md:pb-20`}>
          <ProofStrip />
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        className={`${sectionShell} ${sectionBgWorkflow} ${LANDING_SECTION_SCROLL_MARGIN}`}
        aria-labelledby="workflow-heading"
      >
        <div className={LANDING_MAX}>
          <SectionHeader
            description="A clear path from resume to offer — each step grounded in your CV and connected to the next module in the workspace."
            eyebrowText="How it works"
            id="workflow-heading"
            title="How CareerPilot works"
          />
          <div className="mt-12 rounded-3xl border border-emerald-200/80 bg-white p-6 shadow-lg shadow-emerald-950/8 md:p-10">
            <WorkflowTimeline />
          </div>
        </div>
      </section>

      {/* Modules */}
      <section
        id="modules"
        className={`${sectionShell} ${sectionBgModules} ${LANDING_SECTION_SCROLL_MARGIN}`}
        aria-labelledby="modules-heading"
      >
        <div className={LANDING_MAX}>
          <SectionHeader
            description="Discover, plan, and track — emerald for search and CV, sky for preparation, violet for execution and progress."
            eyebrowText="Product modules"
            id="modules-heading"
            title="Everything you need in one career workspace"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_MODULES.map((module) => (
              <FeatureCard key={module.title} {...module} />
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section
        id="demo"
        className={`${sectionShell} ${sectionBgDemo} ${LANDING_SECTION_SCROLL_MARGIN}`}
        aria-labelledby="demo-heading"
      >
        <div className={LANDING_MAX}>
          <SectionHeader
            description="The journey judges and users follow: upload your CV, search roles, review fit, ask the assistant, draft a letter, update the tracker, and see progress on your dashboard."
            eyebrowText="Demo flow"
            id="demo-heading"
            title="CV → Jobs → Guidance → Tracking"
          />
          <div className="mt-10">
            <DemoJourney />
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section
        className={`${sectionShell} ${sectionBgPreview}`}
        aria-labelledby="preview-heading"
      >
        <div className={LANDING_MAX}>
          <SectionHeader
            description="Static previews of resume intelligence, job matching, and your tracker dashboard — the same surfaces you will use after login."
            eyebrowText="Product preview"
            id="preview-heading"
            title="See the workspace before you sign in"
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:items-start">
            <ResumeMockPanel />
            <JobMatchMockPanel />
            <TrackerDashboardMockPanel />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className={`${sectionShell} ${sectionBgFaq} ${LANDING_SECTION_SCROLL_MARGIN}`}
        aria-labelledby="faq-heading"
      >
        <div className={LANDING_MAX}>
          <SectionHeader
            description="Quick answers about CV grounding, job search, fit scoring, cover letters, and application tracking."
            eyebrowText="FAQ"
            id="faq-heading"
            title="Frequently asked questions"
          />
          <div className="mt-8 max-w-3xl space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.question} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${sectionShell} ${sectionBgCta}`}>
        <div className={LANDING_MAX}>
          <FinalCta />
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
