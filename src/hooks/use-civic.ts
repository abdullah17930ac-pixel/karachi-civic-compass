import { useQuery } from "@tanstack/react-query";
import { fetchComplaints, fetchDepartments, fetchPublicStats } from "@/lib/api";
import { useAuth } from "./use-auth";

export const civicKeys = {
  stats: ["public-stats"] as const,
  departments: ["departments"] as const,
  complaints: (uid: string | null, mine: boolean) => ["complaints", uid, mine] as const,
  track: (id: string) => ["track", id] as const,
};

export function usePublicStats() {
  return useQuery({ queryKey: civicKeys.stats, queryFn: fetchPublicStats, staleTime: 30_000 });
}

export function useDepartments() {
  return useQuery({
    queryKey: civicKeys.departments,
    queryFn: fetchDepartments,
    staleTime: 5 * 60_000,
  });
}

/** Signed-in user's complaints (mine=true) or every complaint (admins, mine=false). */
export function useComplaintList(mine: boolean) {
  const { userId, ready } = useAuth();
  return useQuery({
    queryKey: civicKeys.complaints(userId, mine),
    queryFn: () => fetchComplaints(userId, mine),
    enabled: ready && !!userId,
  });
}
