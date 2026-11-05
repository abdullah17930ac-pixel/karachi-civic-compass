import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Hammer,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon, DemoNote, StatCard, StatusBadge } from "@/components/civic/bits";
import { useComplaints } from "@/hooks/use-complaints";
import { categoryMeta, formatDate, formatDateTime } from "@/lib/categories";
import { countByStatus, DEMO_CITIZEN } from "@/lib/complaints";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard – CivicConnect Karachi" },
      {
        name: "description",
        content: "See all complaints you have submitted, their status and the latest activity in one place.",
      },
      { property: "og:title", content: "Citizen Dashboard – CivicConnect" },
      { property: "og:description", content: "Your civic complaints and their progress at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const all = useComplaints();
  const mine = all.filter((c) => c.mine);
  const counts = countByStatus(mine);
  const pending = counts.Submitted + counts["Under Review"] + counts["In Progress"];
  const rate = mine.length ? Math.round((counts.Resolved / mine.length) * 100) : 0;

  const activity = mine
    .flatMap((c) => c.timeline.map((e) => ({ ...e, complaint: c })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const firstName = DEMO_CITIZEN.split(" ")[0];

  return (
    <div className="bg-background">
      <div className="container-page py-10 md:py-14">
        {/* Welcome */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-navy p-7 text-navy-foreground shadow-elevated sm:p-10">
          <div className="absolute inset-0 bg-grid-light" aria-hidden />
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-brand/30 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm text-navy-foreground/70">
                <Sparkles className="size-4" /> Citizen dashboard · Demo account
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                Welcome back, {firstName} 👋
              </h1>
              <p className="mt-2 max-w-lg text-navy-foreground/75">
                {pending > 0
                  ? `You have ${pending} complaint${pending > 1 ? "s" : ""} being worked on. Thank you for keeping Karachi better.`
                  : "All your complaints are resolved. Thank you for keeping Karachi better."}
              </p>
            </div>
            <Button asChild variant="brand" size="xl">
              <Link to="/report">
                <Plus /> Submit New Complaint
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total submitted" value={mine.length} icon={FileText} tone="brand" hint="All time" />
          <StatCard label="Resolved" value={counts.Resolved} icon={CheckCircle2} tone="resolved" hint={`${rate}% resolution rate`} />
          <StatCard label="Pending" value={pending} icon={Clock} tone="review" hint={`${counts.Submitted} new · ${counts["Under Review"]} under review`} />
          <StatCard label="In progress" value={counts["In Progress"]} icon={Hammer} tone="progress" hint="Field teams working" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* My complaints */}
          <div className="rounded-2xl border border-border/70 bg-card shadow-card lg:col-span-8">
            <div className="flex items-center justify-between border-b border-border/70 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">My complaints</h2>
                <p className="text-sm text-muted-foreground">Tap a complaint to see its full timeline</p>
              </div>
              <DemoNote>Sample data</DemoNote>
            </div>
            <ul className="divide-y divide-border/70">
              {mine.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/track"
                    search={{ id: c.id }}
                    className="flex items-center gap-4 p-5 transition-colors hover:bg-surface sm:px-6"
                  >
                    <CategoryIcon category={c.category} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{c.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono">{c.id}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {c.area}</span>
                        <span>{formatDate(c.createdAt)}</span>
                      </div>
                    </div>
                    <StatusBadge status={c.status} className="hidden sm:inline-flex" />
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
              {mine.length === 0 && (
                <li className="p-10 text-center text-sm text-muted-foreground">No complaints yet.</li>
              )}
            </ul>
          </div>

          {/* Activity */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6 lg:col-span-4">
            <h2 className="text-lg font-bold text-foreground">Recent activity</h2>
            <ol className="relative mt-6 space-y-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
              {activity.map((a) => (
                <li key={a.complaint.id + a.status} className="relative pl-7">
                  <span className="absolute left-0 top-1 size-[15px] rounded-full border-[3px] border-card bg-brand ring-1 ring-brand/30" />
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {categoryMeta(a.complaint.category).short}: {a.complaint.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.date)}</p>
                </li>
              ))}
            </ol>
            <Button asChild variant="soft" className="mt-6 w-full">
              <Link to="/track">
                Track by ID <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
