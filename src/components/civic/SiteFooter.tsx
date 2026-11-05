import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-gradient-navy text-navy-foreground">
      <div className="absolute inset-0 bg-grid-light opacity-40" aria-hidden />
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-foreground/70">
            A citizen-first platform to report, track and resolve everyday civic problems across
            Karachi — from potholes to power-less streetlights.
          </p>
          <p className="mt-6 inline-flex rounded-full border border-navy-foreground/15 bg-navy-foreground/5 px-3 py-1 text-xs text-navy-foreground/70">
            Educational demo · Not affiliated with any government body
          </p>
        </div>
        <div className="md:col-span-3">
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-navy-foreground/70">
            <li><Link to="/report" className="hover:text-navy-foreground">Report an issue</Link></li>
            <li><Link to="/track" className="hover:text-navy-foreground">Track complaint</Link></li>
            <li><Link to="/dashboard" className="hover:text-navy-foreground">Citizen dashboard</Link></li>
            <li><Link to="/admin" className="hover:text-navy-foreground">Admin console</Link></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <h4 className="text-sm font-semibold">Contact (sample)</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-navy-foreground/70">
            <li className="flex items-center gap-2"><MapPin className="size-4" /> Civic Centre, Gulshan-e-Iqbal, Karachi</li>
            <li className="flex items-center gap-2"><Phone className="size-4" /> 021-000-CIVIC (demo)</li>
            <li className="flex items-center gap-2"><Mail className="size-4" /> hello@civicconnect.demo</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-navy-foreground/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-navy-foreground/60 sm:flex-row">
          <span>© 2026 CivicConnect · Civics & Community Engagement Project</span>
          <span>Together, let's build better communities.</span>
        </div>
      </div>
    </footer>
  );
}
