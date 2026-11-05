import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 place-items-center rounded-xl bg-gradient-navy text-navy-foreground shadow-card",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path
          d="M12 2.5c-3.6 0-6.5 2.8-6.5 6.4 0 4.6 5.4 10.9 6 11.6.3.3.7.3 1 0 .6-.7 6-7 6-11.6 0-3.6-2.9-6.4-6.5-6.4Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="m9.2 9.2 2 2 3.8-3.9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-brand" />
    </span>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="CivicConnect home">
      <LogoMark />
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-lg font-extrabold tracking-tight",
            inverted ? "text-navy-foreground" : "text-navy",
          )}
        >
          Civic<span className="text-brand">Connect</span>
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em]",
            inverted ? "text-navy-foreground/60" : "text-muted-foreground",
          )}
        >
          Karachi
        </span>
      </span>
    </Link>
  );
}
