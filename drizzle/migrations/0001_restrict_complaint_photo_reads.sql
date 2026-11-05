DROP POLICY IF EXISTS "Complaint photos are publicly viewable" ON storage.objects;
CREATE POLICY "Owners and admins view complaint photos" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'complaint-photos'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR public.has_role((select auth.uid()), 'admin'::public.app_role)
    )
  );