import { Link } from "@tanstack/react-router";
import { Menu, Megaphone, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "My Dashboard" },
  { to: "/report", label: "Report Issue" },
  { to: "/track", label: "Track" },
  { to: "/admin", label: "Admin" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-xl">
      <div className="bg-navy text-navy-foreground">
        <div className="container-page flex h-8 items-center justify-center gap-2 text-[11px] font-medium sm:text-xs">
          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Demo
          </span>
          <span className="truncate text-navy-foreground/80">
            Prototype for a Civics & Community Engagement project — all complaints and figures are sample data.
          </span>
        </div>
      </div>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="brand" className="hidden sm:inline-flex">
            <Link to="/report">
              <Megaphone /> Report an Issue
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "overflow-hidden border-t border-border/70 bg-card transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0",
        )}
      >
        <nav className="container-page flex flex-col gap-1 py-3">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
              activeProps={{ className: "bg-brand-soft text-brand" }}
            >
              {n.label}
            </Link>
          ))}
          <Button asChild variant="brand" className="mt-2 sm:hidden">
            <Link to="/report" onClick={() => setOpen(false)}>
              <Megaphone /> Report an Issue
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
