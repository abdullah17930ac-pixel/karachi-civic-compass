// Database access for CivicConnect (Lovable Cloud / Supabase).
// Pages call these helpers through React Query hooks in `src/hooks/use-civic.ts`.
import { supabase } from "@/integrations/supabase/client";
import { getTrackingPhotoUrl } from "./photos.functions";
import {
  CATEGORY_IDS,
  DEPARTMENTS,
  DEFAULT_DEPARTMENT,
  SEED_COMPLAINTS,
  STATUSES,
  type CategoryId,
  type Complaint,
  type Status,
  type TimelineEntry,
} from "./complaints";

export interface DepartmentRow {
  id: string;
  name: string;
  short_name: string;
  categories: string[];
}

const NOTES: Record<Status, string> = {
  Submitted: "Complaint received and logged.",
  "Under Review": "Verified by the area coordinator.",
  "In Progress": "Field team assigned and work has started.",
  Resolved: "Issue resolved and closed.",
};

type HistoryRow = { new_status: Status; note: string | null; changed_at: string };

function toTimeline(history: HistoryRow[]): TimelineEntry[] {
  // Keep the latest entry for each step reached, in step order.
  const byStatus = new Map<Status, TimelineEntry>();
  for (const h of [...history].sort((a, b) => a.changed_at.localeCompare(b.changed_at))) {
    byStatus.set(h.new_status, {
      status: h.new_status,
      date: h.changed_at,
      note: h.note || NOTES[h.new_status],
    });
  }
  return STATUSES.filter((s) => byStatus.has(s)).map((s) => byStatus.get(s)!);
}

function asCategory(c: string): CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(c) ? (c as CategoryId) : "roads";
}

interface ComplaintRow {
  id: string;
  tracking_id: string;
  user_id: string | null;
  citizen_name: string;
  category: string;
  title: string;
  description: string;
  photo_url: string | null;
  location: string;
  town: string;
  department_id: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
  departments?: { name: string } | null;
  status_history?: HistoryRow[];
}

function mapRow(r: ComplaintRow, me?: string | null): Complaint {
  return {
    id: r.tracking_id,
    dbId: r.id,
    title: r.title,
    description: r.description,
    category: asCategory(r.category),
    area: r.town,
    address: r.location,
    status: r.status,
    department: r.departments?.name ?? null,
    departmentId: r.department_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    citizen: r.citizen_name || "Citizen",
    mine: !!me && r.user_id === me,
    photo: r.photo_url ?? undefined,
    timeline: toTimeline(r.status_history ?? []),
  };
}

const SELECT =
  "id, tracking_id, user_id, citizen_name, category, title, description, photo_url, location, town, department_id, status, created_at, updated_at, departments(name), status_history(new_status, note, changed_at)";

/** Complaints visible to the signed-in user (own complaints, or all for admins). */
export async function fetchComplaints(
  userId: string | null,
  onlyMine: boolean,
): Promise<Complaint[]> {
  let q = supabase.from("complaints").select(SELECT).order("created_at", { ascending: false });
  if (onlyMine && userId) q = q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as ComplaintRow[]).map((r) => mapRow(r, userId));
}

export async function fetchDepartments(): Promise<DepartmentRow[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, short_name, categories")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export function suggestDepartment(
  depts: DepartmentRow[],
  category: CategoryId,
): DepartmentRow | undefined {
  return (
    depts.find((d) => d.categories.includes(category)) ??
    depts.find((d) => d.name === DEFAULT_DEPARTMENT[category])
  );
}

export { DEPARTMENTS };

// ---------- public (no login) ----------

export interface PublicStats {
  total: number;
  resolved: number;
  avg_resolution_days: number | null;
  towns: number;
  citizens: number;
  active_by_category: Partial<Record<CategoryId, number>>;
  recent_resolved: {
    tracking_id: string;
    category: string;
    title: string;
    town: string;
    updated_at: string;
  }[];
  sample_ids: string[];
}

export async function fetchPublicStats(): Promise<PublicStats> {
  const { data, error } = await supabase.rpc("get_public_stats");
  if (error) throw error;
  return data as unknown as PublicStats;
}

interface PublicComplaint {
  id: string;
  tracking_id: string;
  category: string;
  title: string;
  description: string;
  photo_url: string | null;
  location: string;
  town: string;
  status: Status;
  department: string | null;
  created_at: string;
  updated_at: string;
  history: HistoryRow[];
}

/** Tracking lookup by ID. Never returns the citizen's name or phone. */
export async function fetchPublicComplaint(trackingId: string): Promise<Complaint | null> {
  const { data, error } = await supabase.rpc("get_public_complaint", { _tracking_id: trackingId });
  if (error) throw error;
  if (!data) return null;
  const c = data as unknown as PublicComplaint;
  let photo: string | undefined;
  if (c.photo_url) {
    try {
      photo = (await getTrackingPhotoUrl({ data: { trackingId: c.tracking_id } })).url ?? undefined;
    } catch {
      photo = undefined;
    }
  }
  return {
    id: c.tracking_id,
    dbId: c.id,
    title: c.title,
    description: c.description,
    category: asCategory(c.category),
    area: c.town,
    address: c.location,
    status: c.status,
    department: c.department,
    departmentId: null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    citizen: "",
    mine: false,
    photo,
    timeline: toTimeline(c.history ?? []),
  };
}

// ---------- citizen actions ----------

export interface NewComplaint {
  category: CategoryId;
  title: string;
  description: string;
  town: string;
  location: string;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  photo?: Blob | undefined;
}

export async function submitComplaint(
  user: { id: string; name: string },
  input: NewComplaint,
): Promise<{ trackingId: string; photoFailed: boolean }> {
  let photo_url: string | null = null;
  let photoFailed = false;
  if (input.photo) {
    const path = `${user.id}/${Date.now()}.jpg`;
    const up = await supabase.storage
      .from("complaint-photos")
      .upload(path, input.photo, { contentType: "image/jpeg", upsert: false });
    if (up.error) photoFailed = true;
    // Photos are private: store the object path and serve short-lived signed links.
    else photo_url = path;
  }
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      // The database trigger replaces this with a unique CC-KHI-###### ID.
      tracking_id: "",
      user_id: user.id,
      citizen_name: user.name,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      town: input.town,
      location: input.location.trim(),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      photo_url,
    })
    .select("tracking_id")
    .single();
  if (error) throw error;
  return { trackingId: data.tracking_id, photoFailed };
}

export async function fetchMyFeedback(complaintDbId: string) {
  const { data, error } = await supabase
    .from("feedback")
    .select("fixed, rating, comment")
    .eq("complaint_id", complaintDbId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitFeedback(
  userId: string,
  complaintDbId: string,
  fb: { fixed: boolean; rating: number; comment: string },
) {
  const { error } = await supabase.from("feedback").insert({
    complaint_id: complaintDbId,
    user_id: userId,
    fixed: fb.fixed,
    rating: fb.rating,
    comment: fb.comment.trim() || null,
  });
  if (error) throw error;
}

/** Is this complaint (by tracking ID) owned by the signed-in user? RLS only returns own rows. */
export async function fetchOwnedComplaintId(
  trackingId: string,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("complaints")
    .select("id")
    .eq("tracking_id", trackingId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

// ---------- admin actions ----------

export async function updateStatus(dbId: string, status: Status, note: string) {
  const { error } = await supabase.rpc("update_complaint_status", {
    _complaint_id: dbId,
    _new_status: status,
    _note: note,
  });
  if (error) throw error;
}

export async function assignDepartment(dbId: string, departmentId: string) {
  const { error } = await supabase
    .from("complaints")
    .update({ department_id: departmentId })
    .eq("id", dbId);
  if (error) throw error;
}

export async function fetchFeedbackSummary(): Promise<{
  count: number;
  avg: number | null;
  fixedPct: number | null;
}> {
  const { data, error } = await supabase.from("feedback").select("rating, fixed");
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return { count: 0, avg: null, fixedPct: null };
  const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
  const fixed = rows.filter((r) => r.fixed).length;
  return {
    count: rows.length,
    avg: Math.round(avg * 10) / 10,
    fixedPct: Math.round((fixed / rows.length) * 100),
  };
}

/**
 * Admin helper: fill an empty database with the Karachi sample complaints.
 * Each one is filed as Submitted, then walked through the real status steps so the
 * history and timeline look exactly like a real case.
 */
export async function loadSampleComplaints(adminId: string, depts: DepartmentRow[]) {
  let added = 0;
  for (const s of [...SEED_COMPLAINTS].reverse()) {
    const { data, error } = await supabase
      .from("complaints")
      .insert({
        tracking_id: s.id,
        user_id: adminId,
        citizen_name: s.citizen,
        category: s.category,
        title: s.title,
        description: s.description,
        town: s.area,
        location: s.address,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") continue; // already loaded
      throw error;
    }
    added++;
    const target = STATUSES.indexOf(s.status);
    if (target >= 1) {
      const dept = suggestDepartment(depts, s.category);
      if (dept) await assignDepartment(data.id, dept.id);
    }
    for (let i = 1; i <= target; i++) {
      const step = STATUSES[i]!;
      const note = s.timeline.find((e) => e.status === step)?.note ?? NOTES[step];
      await updateStatus(data.id, step, note);
    }
  }
  return added;
}
