import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { FriendlyEmpty, Skeleton } from "./bits";

type Redirect = "/dashboard" | "/report" | "/admin";

/** Shows children only to signed-in users (and only admins when `admin` is set). */
export function RequireAuth({
  redirect,
  admin = false,
  children,
}: {
  redirect: Redirect;
  admin?: boolean;
  children: ReactNode;
}) {
  const { ready, session, isAdmin } = useAuth();

  if (!ready) {
    return (
      <div className="container-page space-y-4 py-14">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container-page py-16">
        <FriendlyEmpty
          emoji="🔐"
          title="Please sign in first"
          text={
            redirect === "/report"
              ? "We need to know who's reporting so we can keep you updated on your complaint."
              : "Sign in to see this page. It only takes a moment."
          }
        >
          <Button asChild variant="brand">
            <Link to="/login" search={{ redirect }}>
              <LogIn /> Sign in or create account
            </Link>
          </Button>
        </FriendlyEmpty>
      </div>
    );
  }

  if (admin && !isAdmin) {
    return (
      <div className="container-page py-16">
        <FriendlyEmpty
          emoji="🙂"
          title="This area is for the CivicConnect team"
          text="Only admins can manage complaints. You can still report and track your own issues."
        >
          <Button asChild variant="brand">
            <Link to="/dashboard">Go to my dashboard</Link>
          </Button>
        </FriendlyEmpty>
      </div>
    );
  }

  return <>{children}</>;
}
