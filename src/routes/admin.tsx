import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Database,
  Hammer,
  Loader2,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  CategoryIcon,
  DemoNote,
  FriendlyEmpty,
  PageHeader,
  Skeleton,
  StatCard,
  StatusBadge,
} from "@/components/civic/bits";
import { RequireAuth } from "@/components/civic/RequireAuth";
import { Stagger, StaggerItem } from "@/components/civic/motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useComplaintList, useDepartments } from "@/hooks/use-civic";
import {
  assignDepartment,
  fetchFeedbackSummary,
  loadSampleComplaints,
  suggestDepartment,
  updateStatus as apiUpdateStatus,
} from "@/lib/api";
import { CATEGORIES, categoryMeta, formatDate, STATUS_STYLES } from "@/lib/categories";
import {
  countByStatus,
  STATUSES,
  type CategoryId,
  type Complaint,
  type Status,
} from "@/lib/complaints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console – CivicConnect Karachi" },
      {
        name: "description",
        content:
          "Manage citizen complaints, assign departments, update statuses and view analytics.",
      },
      { property: "og:title", content: "Admin Console – CivicConnect" },
      {
        property: "og:description",
        content: "Complaint management and analytics for city departments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const STALE_DAYS = 5;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Reported vs resolved per month for the last 6 months, from real complaints. */
function monthlyTrend(list: Complaint[]) {
  const now = new Date();
  const rows = [];
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const inMonth = (iso: string) => {
      const x = new Date(iso);
      return `${x.getFullYear()}-${x.getMonth()}` === key;
    };
    rows.push({
      month: MONTHS[d.getMonth()]!,
      reported: list.filter((c) => inMonth(c.createdAt)).length,
      resolved: list.filter((c) => c.status === "Resolved" && inMonth(c.updatedAt)).length,
    });
  }
  return rows;
}

const isStale = (c: Complaint) =>
  c.status !== "Resolved" && Date.now() - new Date(c.updatedAt).getTime() > STALE_DAYS * 86_400_000;

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
  return (
    <RequireAuth redirect="/admin" admin>
      <AdminConsole />
    </RequireAuth>
  );
}

function AdminConsole() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const list = useComplaintList(false);
  const depts = useDepartments();
  const feedback = useQuery({ queryKey: ["feedback-summary"], queryFn: fetchFeedbackSummary });
  const complaints = list.data ?? [];
  const [pendingChange, setPendingChange] = useState<{ c: Complaint; status: Status } | null>(null);
  const [note, setNote] = useState("");
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
          c.area.toLowerCase().includes(term) ||
          c.citizen.toLowerCase().includes(term),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [complaints, cat, status, q]);

  const byCategory = CATEGORIES.map((c) => ({
    name: c.short,
    total: complaints.filter((x) => x.category === c.id).length,
    resolved: complaints.filter((x) => x.category === c.id && x.status === "Resolved").length,
  }));
  const byStatus = STATUSES.map((s) => ({ name: s, value: counts[s] }));

  const refresh = () => {
    void qc.invalidateQueries();
  };

  const statusMut = useMutation({
    mutationFn: async ({ c, status, note }: { c: Complaint; status: Status; note: string }) => {
      // Moving past "Submitted" needs a department: pick the usual one if none is set.
      if (STATUSES.indexOf(status) >= 1 && !c.departmentId) {
        const d = suggestDepartment(depts.data ?? [], c.category);
        if (d) await assignDepartment(c.dbId, d.id);
      }
      await apiUpdateStatus(c.dbId, status, note);
    },
    onSuccess: (_d, v) => {
      toast.success(`${v.c.id} is now “${v.status}”. The citizen can see your note.`);
      setPendingChange(null);
      setNote("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update status."),
  });

  const deptMut = useMutation({
    mutationFn: ({ c, deptId }: { c: Complaint; deptId: string }) =>
      assignDepartment(c.dbId, deptId),
    onSuccess: (_d, v) => {
      const name = depts.data?.find((d) => d.id === v.deptId)?.name ?? "department";
      toast.success(`${v.c.id} assigned to ${name}`);
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't assign department."),
  });

  const seedMut = useMutation({
    mutationFn: () => loadSampleComplaints(userId!, depts.data ?? []),
    onSuccess: (n) => {
      toast.success(
        n ? `Added ${n} sample Karachi complaints 🎉` : "Sample complaints were already loaded.",
      );
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't load sample data."),
  });

  const unassigned = complaints.filter((c) => !c.departmentId && c.status !== "Resolved").length;
  const stale = complaints.filter(isStale).length;
  const trend = monthlyTrend(complaints);

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
            complaints.length === 0 && !list.isLoading ? (
              <Button
                variant="outline"
                onClick={() => seedMut.mutate()}
                disabled={seedMut.isPending}
              >
                {seedMut.isPending ? <Loader2 className="animate-spin" /> : <Database />} Load
                sample complaints
              </Button>
            ) : undefined
          }
        />

        {list.isLoading && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        )}
        {list.isError && (
          <p className="mt-8 rounded-2xl bg-destructive/10 p-5 text-sm text-destructive">
            Couldn't load complaints:{" "}
            {list.error instanceof Error ? list.error.message : "unknown error"}
          </p>
        )}
        {!list.isLoading && !list.isError && complaints.length === 0 && (
          <div className="mt-10">
            <FriendlyEmpty
              emoji="📭"
              title="No complaints yet"
              text="Nothing has been reported so far. For a demo, load a set of realistic Karachi sample complaints. They'll go through the real status steps."
            >
              <Button variant="brand" onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
                {seedMut.isPending ? <Loader2 className="animate-spin" /> : <Database />} Load
                sample complaints
              </Button>
            </FriendlyEmpty>
          </div>
        )}
        {complaints.length > 0 && (
          <>
            <Stagger className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StaggerItem>
                <StatCard
                  label="Total complaints"
                  value={complaints.length}
                  icon={FileText}
                  tone="navy"
                  hint={`${unassigned} unassigned · ${stale} stale`}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Pending"
                  value={pending}
                  icon={Clock}
                  tone="review"
                  hint={`${counts.Submitted} new · ${counts["Under Review"]} reviewing`}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="In progress"
                  value={counts["In Progress"]}
                  icon={Hammer}
                  tone="progress"
                  hint="Field work underway"
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Resolved"
                  value={counts.Resolved}
                  icon={CheckCircle2}
                  tone="resolved"
                  hint={`${complaints.length ? Math.round((counts.Resolved / complaints.length) * 100) : 0}% resolution rate`}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Citizen rating"
                  value={feedback.data?.avg != null ? `${feedback.data.avg} ★` : "—"}
                  icon={Star}
                  tone="brand"
                  hint={
                    feedback.data?.count
                      ? `${feedback.data.count} reviews · ${feedback.data.fixedPct}% say fixed`
                      : "No feedback yet"
                  }
                />
              </StaggerItem>
            </Stagger>

            {/* Charts */}
            <div className="mt-6 grid gap-6 lg:grid-cols-12">
              <ChartCard title="Complaints by category" className="lg:col-span-5">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byCategory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="var(--muted-foreground)"
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="total" name="Total" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                    <Bar
                      dataKey="resolved"
                      name="Resolved"
                      fill="var(--chart-1)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Status breakdown" className="lg:col-span-3">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={byStatus}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
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

              <ChartCard title="Last 6 months" className="lg:col-span-4">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="var(--muted-foreground)"
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="reported"
                      name="Reported"
                      stroke="var(--chart-1)"
                      strokeWidth={2.5}
                      fill="url(#gReported)"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      name="Resolved"
                      stroke="var(--chart-5)"
                      strokeWidth={2.5}
                      fill="url(#gResolved)"
                    />
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
                        placeholder="Search ID, title, area or name"
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
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
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
                      <tr
                        key={c.id}
                        className={cn(
                          "align-middle transition-colors hover:bg-surface/60",
                          !c.departmentId && c.status !== "Resolved" && "bg-status-review-soft/60",
                        )}
                      >
                        <td className="max-w-xs px-6 py-4">
                          <p className="flex items-center gap-2 font-mono text-xs font-semibold text-brand">
                            {c.id}
                            {isStale(c) && (
                              <span
                                className="rounded-full bg-destructive/10 px-2 py-0.5 font-sans text-[10px] font-bold uppercase text-destructive"
                                title={`No update for over ${STALE_DAYS} days`}
                              >
                                Stale
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 truncate font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.area} · {c.citizen}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <CategoryIcon category={c.category} size="sm" />
                            <span className="text-foreground">
                              {categoryMeta(c.category).short}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          {depts.data && depts.data.length > 0 ? (
                            <Select
                              value={c.departmentId ?? ""}
                              onValueChange={(v) => deptMut.mutate({ c, deptId: v })}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-9 w-56 text-xs",
                                  !c.departmentId && "border-status-review text-status-review",
                                )}
                              >
                                <SelectValue placeholder="⚠ Assign department…" />
                              </SelectTrigger>
                              <SelectContent>
                                {depts.data.map((d) => (
                                  <SelectItem key={d.id} value={d.id} className="text-xs">
                                    {d.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {c.department ?? "Not assigned"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Select
                            value={c.status}
                            onValueChange={(v) => {
                              setNote("");
                              setPendingChange({ c, status: v as Status });
                            }}
                          >
                            <SelectTrigger
                              className="h-9 w-40 border-0 bg-transparent p-0 shadow-none focus:ring-0"
                              aria-label={`Status for ${c.id}`}
                            >
                              <StatusBadge status={c.status} />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
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
                <DemoNote>
                  Amber rows still need a department · “Stale” = no update for {STALE_DAYS}+ days
                </DemoNote>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!pendingChange} onOpenChange={(o) => !o && setPendingChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Move {pendingChange?.c.id} to “{pendingChange?.status}”?
            </DialogTitle>
            <DialogDescription>
              Add a short note for the citizen (optional). It shows on their tracking timeline.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder={
              pendingChange?.status === "Resolved"
                ? "e.g. Pothole filled and road levelled today."
                : pendingChange?.status === "In Progress"
                  ? "e.g. Team visited the site this morning."
                  : "e.g. Verified with the area coordinator."
            }
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingChange(null)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={statusMut.isPending}
              onClick={() => pendingChange && statusMut.mutate({ ...pendingChange, note })}
            >
              {statusMut.isPending && <Loader2 className="animate-spin" />} Update status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6",
        className,
      )}
    >
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
