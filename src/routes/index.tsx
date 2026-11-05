import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Megaphone,
  Search,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";
import heroImg from "@/assets/hero-karachi.jpg";
import { Button } from "@/components/ui/button";
import { CategoryIcon, DemoNote, StatusBadge } from "@/components/civic/bits";
import { useComplaints } from "@/hooks/use-complaints";
import { CATEGORIES, categoryMeta, formatDate } from "@/lib/categories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicConnect – Report & Track Civic Issues in Karachi" },
      {
        name: "description",
        content:
          "Together, let's build better communities. Report potholes, garbage, streetlights, water and drainage problems in Karachi and track them to resolution.",
      },
      { property: "og:title", content: "CivicConnect – Smart Citizen Complaint & Tracking" },
      {
        property: "og:description",
        content: "Report community problems in Karachi and follow every step until they are resolved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const COMMUNITY_STATS = [
  { value: "12,480+", label: "Complaints reported", icon: FileText },
  { value: "9,630", label: "Issues resolved", icon: CheckCircle2 },
  { value: "3.2 days", label: "Avg. resolution time", icon: Timer },
  { value: "18", label: "Karachi towns covered", icon: MapPin },
];

const STEPS = [
  {
    icon: Camera,
    title: "Report the issue",
    text: "Pick a category, add a photo and pin the location in under a minute.",
  },
  {
    icon: BadgeCheck,
    title: "Get a complaint ID",
    text: "Receive a unique tracking ID instantly — no queues, no paperwork.",
  },
  {
    icon: Users,
    title: "Routed to the right team",
    text: "Your complaint is verified and assigned to the responsible department.",
  },
  {
    icon: ShieldCheck,
    title: "Track until resolved",
    text: "Follow live status updates from Submitted to Resolved.",
  },
];

function Index() {
  const complaints = useComplaints();
  const resolved = complaints.filter((c) => c.status === "Resolved").slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
        <div className="container-page relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-card px-3 py-1.5 text-xs font-semibold text-brand shadow-card">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-brand" />
              </span>
              Karachi's civic engagement platform
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] text-navy sm:text-5xl lg:text-6xl">
              Together, Let's Build{" "}
              <span className="bg-gradient-brand bg-clip-text text-transparent">Better Communities.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              CivicConnect lets every citizen of Karachi report damaged roads, overflowing garbage,
              broken streetlights, water leaks and drainage problems — and follow each complaint
              transparently until it is fixed.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="brand" size="xl">
                <Link to="/report">
                  <Megaphone /> Report an Issue
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="bg-card">
                <Link to="/track">
                  <Search /> Track Complaint
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["AK", "BA", "SM", "UR"].map((i) => (
                  <span
                    key={i}
                    className="grid size-9 place-items-center rounded-full border-2 border-card bg-navy text-[11px] font-bold text-navy-foreground"
                  >
                    {i}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">4,200+ active citizens</span> making
                their neighbourhoods better
              </p>
            </div>
          </div>

          <div className="relative animate-fade-up [animation-delay:150ms]">
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-2 shadow-elevated">
              <img
                src={heroImg}
                alt="Karachi citizens reporting civic issues while workers repair roads, pipes and streetlights"
                width={1280}
                height={1024}
                className="aspect-[5/4] w-full rounded-2xl object-cover"
              />
            </div>
            <div className="absolute -left-4 bottom-10 hidden w-64 animate-float rounded-2xl border border-border/70 bg-card p-4 shadow-elevated sm:block">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-status-resolved-soft text-status-resolved">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Complaint resolved</p>
                  <p className="text-xs text-muted-foreground">Garbage cleared · Block 13-D</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-3 top-8 hidden animate-float rounded-2xl border border-border/70 bg-card p-4 shadow-elevated [animation-delay:1.5s] sm:block">
              <p className="text-xs font-medium text-muted-foreground">Resolution rate</p>
              <p className="font-display text-2xl font-bold text-navy">77%</p>
              <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[77%] rounded-full bg-gradient-brand" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container-page relative z-10 -mt-6 md:-mt-10">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/70 shadow-elevated lg:grid-cols-4">
          {COMMUNITY_STATS.map((s) => (
            <div key={s.label} className="bg-card p-6 sm:p-8">
              <s.icon className="size-6 text-brand" />
              <p className="mt-4 font-display text-3xl font-extrabold text-navy sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <DemoNote>Community statistics are demonstration data</DemoNote>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">What you can report</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">
            Every everyday problem, one place to report it
          </h2>
          <p className="mt-4 text-muted-foreground">
            Choose a category and your complaint is routed to the department responsible for it.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const count = complaints.filter((x) => x.category === c.id).length;
            return (
              <Link
                key={c.id}
                to="/report"
                search={{ category: c.id }}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-elevated"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                    <c.icon className="size-7" />
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {count} active
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">{c.label}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Report now <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border/70 bg-surface py-20 md:py-24">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">How it works</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">
                From complaint to resolution in four simple steps
              </h2>
              <p className="mt-4 text-muted-foreground">
                Transparent, accountable and designed for every citizen — no office visits required.
              </p>
              <Button asChild variant="navy" size="lg" className="mt-8">
                <Link to="/report">
                  Start a report <ArrowRight />
                </Link>
              </Button>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-card">
                  <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-muted">
                    0{i + 1}
                  </span>
                  <span className="grid size-12 place-items-center rounded-xl bg-gradient-navy text-navy-foreground">
                    <s.icon className="size-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* RECENTLY RESOLVED */}
      <section className="container-page py-20 md:py-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Impact</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl">Recently resolved</h2>
          </div>
          <Button asChild variant="ghost" className="self-start text-brand sm:self-auto">
            <Link to="/track">
              Track any complaint <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {resolved.map((c) => (
            <Link
              key={c.id}
              to="/track"
              search={{ id: c.id }}
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="flex items-center justify-between">
                <CategoryIcon category={c.category} />
                <StatusBadge status={c.status} />
              </div>
              <h3 className="mt-5 line-clamp-2 font-semibold text-foreground">{c.title}</h3>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {c.area}</span>
                <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {formatDate(c.updatedAt)}</span>
              </div>
              <p className="mt-4 border-t border-border/70 pt-4 text-xs font-medium text-muted-foreground">
                {categoryMeta(c.category).short} · <span className="font-mono">{c.id}</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-navy px-6 py-14 text-center text-navy-foreground shadow-elevated sm:px-12">
          <div className="absolute inset-0 bg-grid-light" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Seen a problem in your street?</h2>
            <p className="mt-4 text-navy-foreground/75">
              Your report is the first step to fixing it. It only takes a minute.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="brand" size="xl">
                <Link to="/report"><Megaphone /> Report an Issue</Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/dashboard">Open my dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
