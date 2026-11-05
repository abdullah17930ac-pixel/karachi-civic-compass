import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Hammer,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon, DemoNote, PageHeader, StatCard, StatusBadge } from "@/components/civic/bits";
import { useComplaints } from "@/hooks/use-complaints";
import { CATEGORIES, categoryMeta, formatDate, STATUS_STYLES } from "@/lib/categories";
import {
  complaintStore,
  countByStatus,
  DEPARTMENTS,
  STATUSES,
  type CategoryId,
  type Department,
  type Status,
} from "@/lib/complaints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console – CivicConnect Karachi" },
      {
        name: "description",
        content: "Manage citizen complaints, assign departments, update statuses and view analytics.",
      },
      { property: "og:title", content: "Admin Console – CivicConnect" },
      { property: "og:description", content: "Complaint management and analytics for city departments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const TREND = [
  { month: "Jun", reported: 1640, resolved: 1180 },
  { month: "Jul", reported: 2310, resolved: 1590 },
  { month: "Aug", reported: 2780, resolved: 2050 },
  { month: "Sep", reported: 2120, resolved: 1890 },
  { month: "Oct", reported: 1930, resolved: 1720 },
  { month: "Nov", reported: 1700, resolved: 1200 },
];

const STATUS_COLORS: Record<Status, string> = {
  Submitted: "var(--status-submitted)",
  "Under Review": "var(--status-review)",
  "In Progress": "var(--status-progress)",
  Resolved: "var(--status-resolved)",
};

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "var(--shadow-card-value)",
};

function AdminPage() {
  const complaints = useComplaints();
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [q, setQ] = useState("");

  const counts = countByStatus(complaints);
  const pending = counts.Submitted + counts["Under Review"];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return complaints
      .filter((c) => cat === "all" || c.category === cat)
      .filter((c) => status === "all" || c.status === status)
      .filter(
        (c) =>
          !term ||
          c.id.toLowerCase().includes(term) ||
          c.title.toLowerCase().includes(term) ||
          c.area.toLowerCase().includes(term),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [complaints, cat, status, q]);

  const byCategory = CATEGORIES.map((c) => ({
    name: c.short,
    total: complaints.filter((x) => x.category === c.id).length,
    resolved: complaints.filter((x) => x.category === c.id && x.status === "Resolved").length,
  }));
  const byStatus = STATUSES.map((s) => ({ name: s, value: counts[s] }));

  const updateStatus = (id: string, s: Status) => {
    complaintStore.setStatus(id, s);
    toast.success(`${id} marked as “${s}”`);
  };
  const updateDept = (id: string, d: Department) => {
    complaintStore.setDepartment(id, d);
    toast.success(`${id} assigned to ${d}`);
  };

  return (
    <div className="bg-background">
      <div className="container-page py-10 md:py-14">
        <PageHeader
          eyebrow="Admin console"
          title={
            <span className="inline-flex items-center gap-3">
              Complaint Management
              <span className="hidden items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand sm:inline-flex">
                <ShieldCheck className="size-3.5" /> Admin
              </span>
            </span>
          }
          description="Review incoming complaints, assign them to departments and keep citizens updated."
          actions={
            <Button
              variant="outline"
              onClick={() => {
                complaintStore.reset();
                toast.success("Demo data restored to the original sample set.");
              }}
            >
              <RotateCcw /> Reset demo data
            </Button>
          }
        />

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total complaints" value={complaints.length} icon={FileText} tone="navy" hint="Across all categories" />
          <StatCard label="Pending" value={pending} icon={Clock} tone="review" hint={`${counts.Submitted} new · ${counts["Under Review"]} reviewing`} />
          <StatCard label="In progress" value={counts["In Progress"]} icon={Hammer} tone="progress" hint="Field work underway" />
          <StatCard label="Resolved" value={counts.Resolved} icon={CheckCircle2} tone="resolved" hint={`${complaints.length ? Math.round((counts.Resolved / complaints.length) * 100) : 0}% resolution rate`} />
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <ChartCard title="Complaints by category" className="lg:col-span-5">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byCategory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="total" name="Total" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Status breakdown" className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                  {byStatus.map((s) => (
                    <Cell key={s.name} fill={STATUS_COLORS[s.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {byStatus.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span className={cn("size-2.5 rounded-full", STATUS_STYLES[s.name].dot)} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-semibold text-foreground">{s.value}</span>
                </li>
              ))}
            </ul>
          </ChartCard>

          <ChartCard title="City-wide monthly trend" badge="Demo figures" className="lg:col-span-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={TREND} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="reported" name="Reported" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gReported)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="var(--chart-5)" strokeWidth={2.5} fill="url(#gResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-2xl border border-border/70 bg-card shadow-card">
          <div className="space-y-4 border-b border-border/70 p-5 sm:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">All complaints</h2>
                <p className="text-sm text-muted-foreground">
                  Showing {filtered.length} of {complaints.length}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search ID, title or area"
                    className="h-10 pl-9 sm:w-64"
                  />
                </div>
                <Select value={status} onValueChange={(v) => setStatus(v as Status | "all")}>
                  <SelectTrigger className="h-10 sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
                All categories
              </FilterChip>
              {CATEGORIES.map((c) => (
                <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                  <c.icon className="size-3.5" /> {c.short}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-surface text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Complaint</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {filtered.map((c) => (
                  <tr key={c.id} className="align-middle transition-colors hover:bg-surface/60">
                    <td className="max-w-xs px-6 py-4">
                      <p className="font-mono text-xs font-semibold text-brand">{c.id}</p>
                      <p className="mt-0.5 truncate font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.area} · {c.citizen}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={c.category} size="sm" />
                        <span className="text-foreground">{categoryMeta(c.category).short}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-4">
                      <Select value={c.department ?? ""} onValueChange={(v) => updateDept(c.id, v as Department)}>
                        <SelectTrigger className="h-9 w-56 text-xs">
                          <SelectValue placeholder="Assign department…" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => (
                            <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4">
                      <Select value={c.status} onValueChange={(v) => updateStatus(c.id, v as Status)}>
                        <SelectTrigger className="h-9 w-40 border-0 bg-transparent p-0 shadow-none focus:ring-0" aria-label={`Status for ${c.id}`}>
                          <StatusBadge status={c.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button asChild size="icon" variant="ghost" aria-label={`Open ${c.id}`}>
                        <Link to="/track" search={{ id: c.id }}>
                          <ExternalLink />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-muted-foreground">
                      No complaints match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border/70 px-6 py-4">
            <DemoNote>Demonstration data · changes are saved in this browser</DemoNote>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  badge,
  className,
  children,
}: {
  title: string;
  badge?: string | undefined;
  className?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-bold text-foreground">{title}</h3>
        {badge && <DemoNote>{badge}</DemoNote>}
      </div>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-navy bg-navy text-navy-foreground"
          : "border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
