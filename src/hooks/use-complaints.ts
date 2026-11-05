import { useSyncExternalStore } from "react";
import { complaintStore } from "@/lib/complaints";

export function useComplaints() {
  return useSyncExternalStore(
    complaintStore.subscribe,
    complaintStore.getSnapshot,
    complaintStore.getServerSnapshot,
  );
}
