import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { categoryMeta, STATUS_STYLES } from "@/lib/categories";
import type { CategoryId, Status } from "@/lib/complaints";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        s.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {status}
    </span>
  );
}

export function CategoryIcon({
  category,
  size = "md",
}: {
  category: CategoryId;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = categoryMeta(category).icon;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-brand-soft text-brand",
        size === "sm" && "size-8 [&_svg]:size-4",
        size === "md" && "size-10 [&_svg]:size-5",
        size === "lg" && "size-14 rounded-2xl [&_svg]:size-7",
      )}
    >
      <Icon />
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
  tone?: "brand" | "review" | "progress" | "resolved" | "navy";
}) {
  const tones = {
    brand: "bg-brand-soft text-brand",
    navy: "bg-navy text-navy-foreground",
    review: "bg-status-review-soft text-status-review",
    progress: "bg-status-progress-soft text-status-progress",
    resolved: "bg-status-resolved-soft text-status-resolved",
  };
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card transition-shadow hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-10 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
        )}
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-brand" />
      {children}
    </span>
  );
}
