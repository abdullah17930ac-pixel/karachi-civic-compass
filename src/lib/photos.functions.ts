import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "complaint-photos";
const SIGNED_URL_SECONDS = 60 * 10;

/** Turn a stored photo reference (object path, or an older public URL) into an object path. */
export function photoPath(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const marker = `/${BUCKET}/`;
  const i = ref.indexOf(marker);
  const path = i >= 0 ? ref.slice(i + marker.length).split("?")[0]! : ref;
  return path && !path.startsWith("http") && !path.includes("..") ? decodeURIComponent(path) : null;
}

/**
 * Public tracking lookup: whoever holds a complaint's tracking ID may see its photo,
 * matching the public tracking details. Photos stay private in storage; this returns a
 * short-lived signed link for that one complaint's photo only.
 */
export const getTrackingPhotoUrl = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({ trackingId: z.string().trim().min(1).max(40) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("complaints")
      .select("photo_url")
      .eq("tracking_id", data.trackingId.toUpperCase())
      .maybeSingle();
    const path = photoPath(row?.photo_url);
    if (!path) return { url: null as string | null };
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_SECONDS);
    if (error || !signed) return { url: null as string | null };
    return { url: signed.signedUrl as string | null };
  });
