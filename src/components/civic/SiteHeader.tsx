import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, Megaphone, ShieldCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "./Logo";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "My Dashboard" },
  { to: "/report", label: "Report Issue" },
  { to: "/track", label: "Track" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session, isAdmin, name, signOut } = useAuth();
  const navigate = useNavigate();

  const links = isAdmin ? [...NAV, { to: "/admin" as const, label: "Admin" }] : NAV;

  const logout = async () => {
    await signOut();
    setOpen(false);
    toast.success("Signed out. See you soon 👋");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-xl">
      <div className="bg-navy text-navy-foreground">
        <div className="container-page flex h-8 items-center justify-center gap-2 text-[11px] font-medium sm:text-xs">
          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Student project
          </span>
          <span className="truncate text-navy-foreground/80">
            A Civics & Community Engagement prototype — not affiliated with any government body.
          </span>
        </div>
      </div>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className: "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
              }}
            >
              {n.label === "Admin" ? (
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> Admin
                </span>
              ) : (
                n.label
              )}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <div className="hidden items-center gap-2 md:flex">
              <span
                className="grid size-8 place-items-center rounded-full bg-navy text-xs font-bold text-navy-foreground"
                title={name}
              >
                {name.slice(0, 1).toUpperCase() || "?"}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut /> Sign out
              </Button>
            </div>
          ) : (
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link to="/login">
                <LogIn /> Sign in
              </Link>
            </Button>
          )}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="hidden sm:block"
          >
            <Button asChild variant="brand">
              <Link to="/report">
                <Megaphone /> Report an Issue
              </Link>
            </Button>
          </motion.div>
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
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/70 bg-card lg:hidden"
          >
            <nav className="container-page flex flex-col gap-1 py-3">
              {links.map((n) => (
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
              {session ? (
                <Button variant="outline" className="mt-2" onClick={logout}>
                  <LogOut /> Sign out ({name})
                </Button>
              ) : (
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <LogIn /> Sign in / Sign up
                  </Link>
                </Button>
              )}
              <Button asChild variant="brand" className="mt-1 sm:hidden">
                <Link to="/report" onClick={() => setOpen(false)}>
                  <Megaphone /> Report an Issue
                </Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
