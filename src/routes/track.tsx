import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  FileSearch,
  Hash,
  Heart,
  Loader2,
  MapPin,
  Search,
  Star,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon, Skeleton, StatusBadge } from "@/components/civic/bits";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ProgressTimeline } from "@/components/civic/ProgressTimeline";
import { useAuth } from "@/hooks/use-auth";
import { civicKeys, usePublicStats } from "@/hooks/use-civic";
import {
  fetchMyFeedback,
  fetchOwnedComplaintId,
  fetchPublicComplaint,
  submitFeedback,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { categoryMeta, formatDate, formatDateTime } from "@/lib/categories";

export const Route = createFileRoute("/track")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => {
    const raw = s["id"];
    return { id: typeof raw === "string" && raw.trim() ? raw.trim().toUpperCase() : undefined };
  },
  head: () => ({
    meta: [
      { title: "Track Complaint – CivicConnect Karachi" },
      {
        name: "description",
        content:
          "Enter your complaint ID to see its current status, department and full progress timeline.",
      },
      { property: "og:title", content: "Track Your Complaint – CivicConnect" },
      {
        property: "og:description",
        content: "Follow your civic complaint from Submitted to Resolved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: "/track" });
  const [query, setQuery] = useState(id ?? "");
  const stats = usePublicStats();

  useEffect(() => setQuery(id ?? ""), [id]);

  const lookup = useQuery({
    queryKey: civicKeys.track(id ?? ""),
    queryFn: () => fetchPublicComplaint(id!),
    enabled: !!id,
  });
  const complaint = lookup.data ?? undefined;
  const samples = stats.data?.sample_ids ?? [];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ search: { id: query.trim() ? query.trim().toUpperCase() : undefined } });
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-navy text-navy-foreground">
        <div className="absolute inset-0 bg-grid-light" aria-hidden />
        <div className="container-page relative py-14 text-center md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-foreground/60">
            Track complaint
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
            Where is my complaint?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-navy-foreground/75">
            Enter the complaint ID you received after submitting your report.
          </p>
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-card p-2 shadow-elevated sm:flex-row"
          >
            <div className="relative flex-1">
              <Hash className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. CC-KHI-482913"
                className="h-12 border-0 bg-transparent pl-10 font-mono text-base text-foreground shadow-none focus-visible:ring-0"
                aria-label="Complaint ID"
              />
            </div>
            <Button type="submit" variant="brand" size="lg" className="h-12">
              <Search /> Track
            </Button>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            {samples.length > 0 && (
              <span className="text-navy-foreground/60">Recently updated:</span>
            )}
            {samples.map((sid) => (
              <Link
                key={sid}
                to="/track"
                search={{ id: sid }}
                className="rounded-full border border-navy-foreground/20 bg-navy-foreground/5 px-3 py-1 font-mono text-navy-foreground/85 hover:bg-navy-foreground/15"
              >
                {sid}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12 md:py-16">
        {!id && (
          <EmptyState
            title="Enter a complaint ID to begin"
            text="Your ID looks like CC-KHI-123456 and is shown right after you submit a complaint."
          />
        )}
        {id && lookup.isLoading && (
          <div className="grid gap-6 lg:grid-cols-12">
            <Skeleton className="h-72 lg:col-span-8" />
            <Skeleton className="h-72 lg:col-span-4" />
          </div>
        )}
        {id && lookup.isError && (
          <EmptyState
            title="We couldn't reach the server"
            text="Please check your internet connection and try again in a moment."
          />
        )}
        {id && lookup.isSuccess && !complaint && (
          <EmptyState
            title="Hmm, no complaint with that ID"
            text={`We couldn't find ${id}. Double-check the ID. It looks like CC-KHI-123456.`}
          />
        )}
        {complaint && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="grid gap-6 lg:grid-cols-12"
          >
            <div className="space-y-6 lg:col-span-8">
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-card sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <CategoryIcon category={complaint.category} size="lg" />
                    <div>
                      <p className="font-mono text-sm font-semibold text-brand">{complaint.id}</p>
                      <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                        {complaint.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {categoryMeta(complaint.category).label}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={complaint.status} className="px-3 py-1.5 text-sm" />
                </div>
                <div className="mt-10">
                  <ProgressTimeline complaint={complaint} />
                </div>
              </div>

              {complaint.status === "Resolved" && <FeedbackCard trackingId={complaint.id} />}

              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-card sm:p-8">
                <h3 className="font-bold text-foreground">Complaint details</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {complaint.description}
                </p>
                {complaint.photo && (
                  <img
                    src={complaint.photo}
                    alt="Photo attached to complaint"
                    className="mt-5 max-h-96 w-full rounded-xl border border-border object-cover"
                  />
                )}
              </div>

              <div className="hidden rounded-2xl border border-border/70 bg-card p-6 shadow-card sm:p-8 md:block">
                <h3 className="font-bold text-foreground">Activity log</h3>
                <ul className="mt-5 space-y-4">
                  {[...complaint.timeline].reverse().map((e) => (
                    <li key={e.status} className="flex gap-4">
                      <StatusBadge status={e.status} className="w-32 justify-center" />
                      <div>
                        <p className="text-sm text-foreground">{e.note}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(e.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="space-y-4 lg:col-span-4">
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-card">
                <h3 className="font-bold text-foreground">Information</h3>
                <dl className="mt-5 space-y-4">
                  <Info
                    icon={MapPin}
                    label="Location"
                    value={[complaint.address, complaint.area, "Karachi"]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Info
                    icon={CalendarDays}
                    label="Submitted on"
                    value={formatDate(complaint.createdAt)}
                  />
                  <Info
                    icon={CalendarDays}
                    label="Last updated"
                    value={formatDateTime(complaint.updatedAt)}
                  />
                  <Info
                    icon={Building2}
                    label="Assigned department"
                    value={complaint.department ?? "Awaiting assignment"}
                  />
                </dl>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
                <div className="relative grid h-44 place-items-center bg-surface bg-grid">
                  <span className="absolute size-24 animate-ping rounded-full bg-brand/10" />
                  <span className="relative grid size-12 place-items-center rounded-full bg-brand text-brand-foreground shadow-glow">
                    <MapPin className="size-6" />
                  </span>
                </div>
                <div className="p-4 text-sm">
                  <p className="font-semibold text-foreground">{complaint.area}</p>
                  <p className="text-muted-foreground">{complaint.address}</p>
                </div>
              </div>
            </aside>
          </motion.div>
        )}
      </section>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
        <Icon className="size-4" />
      </span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
        <FileSearch className="size-7" />
      </span>
      <h2 className="mt-5 text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <Button asChild variant="soft" className="mt-6">
        <Link to="/report">Report a new issue instead</Link>
      </Button>
    </div>
  );
}

function FeedbackCard({ trackingId }: { trackingId: string }) {
  const { userId, ready } = useAuth();
  const qc = useQueryClient();
  const owned = useQuery({
    queryKey: ["owned", trackingId, userId],
    queryFn: () => fetchOwnedComplaintId(trackingId, userId!),
    enabled: ready && !!userId,
  });
  const dbId = owned.data ?? null;
  const existing = useQuery({
    queryKey: ["feedback", dbId],
    queryFn: () => fetchMyFeedback(dbId!),
    enabled: !!dbId,
  });
  const [fixed, setFixed] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const send = useMutation({
    mutationFn: () => submitFeedback(userId!, dbId!, { fixed: fixed!, rating, comment }),
    onSuccess: () => {
      toast.success("Thank you! Your feedback helps keep everyone accountable 💛");
      void qc.invalidateQueries({ queryKey: ["feedback", dbId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save feedback."),
  });

  if (!dbId) return null; // only the person who reported it can rate it

  const done = existing.data;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-status-resolved/30 bg-status-resolved-soft p-6 sm:p-8"
    >
      <h3 className="flex items-center gap-2 font-bold text-foreground">
        <Heart className="size-5 text-status-resolved" /> Was it really fixed?
      </h3>
      {done ? (
        <p className="mt-3 text-sm text-muted-foreground">
          You said it was {done.fixed ? "fixed ✅" : "not really fixed ❌"} and rated it{" "}
          {"★".repeat(done.rating)}
          {"☆".repeat(5 - done.rating)}. Thanks for closing the loop!
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            Your honest answer tells the team whether the job was done right.
          </p>
          <div className="mt-4 flex gap-2">
            {[true, false].map((v) => (
              <Button
                key={String(v)}
                type="button"
                variant={fixed === v ? "brand" : "outline"}
                className="bg-card"
                onClick={() => setFixed(v)}
              >
                {v ? "Yes, it's fixed" : "Not really"}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button
                key={n}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="p-1"
              >
                <Star
                  className={cn(
                    "size-7",
                    n <= rating ? "fill-status-review text-status-review" : "text-muted-foreground",
                  )}
                />
              </motion.button>
            ))}
          </div>
          <Textarea
            value={comment}
            maxLength={500}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything else? (optional)"
            className="mt-4 bg-card"
          />
          <Button
            className="mt-4"
            variant="brand"
            disabled={fixed === null || rating === 0 || send.isPending}
            onClick={() => send.mutate()}
          >
            {send.isPending && <Loader2 className="animate-spin" />} Send feedback
          </Button>
        </>
      )}
    </motion.div>
  );
}
