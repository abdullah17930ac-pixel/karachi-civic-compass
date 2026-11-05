import { Check, ClipboardCheck, Hammer, Search, Send } from "lucide-react";
import { formatDateTime } from "@/lib/categories";
import { STATUSES, type Complaint } from "@/lib/complaints";
import { cn } from "@/lib/utils";

const ICONS = [Send, Search, Hammer, ClipboardCheck];

export function ProgressTimeline({ complaint }: { complaint: Complaint }) {
  const current = STATUSES.indexOf(complaint.status);
  const pct = (current / (STATUSES.length - 1)) * 100;

  return (
    <div>
      {/* Desktop: horizontal */}
      <div className="relative hidden md:block">
        <div className="absolute left-[12.5%] right-[12.5%] top-6 h-1 rounded-full bg-muted" />
        <div
          className="absolute left-[12.5%] top-6 h-1 rounded-full bg-gradient-brand transition-all duration-700"
          style={{ width: `calc(${pct}% * 0.75)` }}
        />
        <ol className="relative grid grid-cols-4">
          {STATUSES.map((s, i) => {
            const entry = complaint.timeline.find((e) => e.status === s);
            const done = i <= current;
            const Icon = ICONS[i];
            return (
              <li key={s} className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-full border-4 border-card transition-all",
                    done ? "bg-brand text-brand-foreground shadow-glow" : "bg-muted text-muted-foreground",
                    i === current && "ring-4 ring-brand/20",
                  )}
                >
                  {done && i < current ? <Check className="size-5" /> : <Icon className="size-5" />}
                </span>
                <p className={cn("mt-3 text-sm font-semibold", done ? "text-foreground" : "text-muted-foreground")}>
                  {s}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry ? formatDateTime(entry.date) : "Pending"}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile: vertical */}
      <ol className="space-y-0 md:hidden">
        {STATUSES.map((s, i) => {
          const entry = complaint.timeline.find((e) => e.status === s);
          const done = i <= current;
          const Icon = ICONS[i];
          return (
            <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
              {i < STATUSES.length - 1 && (
                <span
                  className={cn(
                    "absolute left-5 top-11 h-[calc(100%-2.5rem)] w-0.5 -translate-x-1/2",
                    i < current ? "bg-brand" : "bg-muted",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative grid size-10 shrink-0 place-items-center rounded-full",
                  done ? "bg-brand text-brand-foreground shadow-glow" : "bg-muted text-muted-foreground",
                )}
              >
                {done && i < current ? <Check className="size-4" /> : <Icon className="size-4" />}
              </span>
              <div className="pt-1">
                <p className={cn("text-sm font-semibold", done ? "text-foreground" : "text-muted-foreground")}>{s}</p>
                <p className="text-xs text-muted-foreground">
                  {entry ? formatDateTime(entry.date) : "Pending"}
                </p>
                {entry && <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
