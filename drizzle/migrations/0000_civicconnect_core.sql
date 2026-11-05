-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'citizen');
CREATE TYPE public.complaint_status AS ENUM ('Submitted', 'Under Review', 'In Progress', 'Resolved');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- New user: profile + citizen role (+ first admin for the project owner's email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'citizen');
  IF lower(NEW.email) = 'shaikhabdullaharqam@gmail.com'
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Departments
CREATE TABLE public.departments (
  id text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments are public" ON public.departments FOR SELECT TO anon, authenticated USING (true);

-- Complaints
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text NOT NULL UNIQUE,
  user_id uuid,
  citizen_name text NOT NULL DEFAULT '',
  citizen_phone text,
  category text NOT NULL CHECK (category IN ('roads','garbage','streetlights','water','drainage','parks')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 6 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 20 AND 1000),
  photo_url text,
  location text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  town text NOT NULL,
  department_id text REFERENCES public.departments(id),
  status public.complaint_status NOT NULL DEFAULT 'Submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX complaints_user_idx ON public.complaints(user_id);
CREATE INDEX complaints_status_idx ON public.complaints(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Citizens read own complaints, admins read all" ON public.complaints FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Citizens file their own complaints" ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'Submitted' AND department_id IS NULL);
CREATE POLICY "Admins update complaints" ON public.complaints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete complaints" ON public.complaints FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tracking ID generator CC-KHI-XXXXXX
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS text LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE candidate text;
BEGIN
  LOOP
    candidate := 'CC-KHI-' || (100000 + floor(random() * 900000))::int::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.complaints WHERE tracking_id = candidate);
  END LOOP;
  RETURN candidate;
END $$;

CREATE OR REPLACE FUNCTION public.complaints_before_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_id IS NULL OR NEW.tracking_id = '' THEN
    NEW.tracking_id := public.generate_tracking_id();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER complaints_set_tracking BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.complaints_before_insert();

CREATE TRIGGER complaints_touch BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Status history
CREATE TABLE public.status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  old_status public.complaint_status,
  new_status public.complaint_status NOT NULL,
  note text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX status_history_complaint_idx ON public.status_history(complaint_id, changed_at);
GRANT SELECT, INSERT ON public.status_history TO authenticated;
GRANT ALL ON public.status_history TO service_role;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins read history" ON public.status_history FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Admins add history" ON public.status_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.complaints_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.status_history (complaint_id, old_status, new_status, note, changed_by, changed_at)
  VALUES (NEW.id, NULL, 'Submitted', 'Complaint received and logged.', NEW.user_id, NEW.created_at);
  RETURN NEW;
END $$;
CREATE TRIGGER complaints_initial_history AFTER INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.complaints_after_insert();

-- Admin status change with note (writes history)
CREATE OR REPLACE FUNCTION public.update_complaint_status(_complaint_id uuid, _new_status public.complaint_status, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE old public.complaint_status;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only the CivicConnect team can change a status';
  END IF;
  SELECT status INTO old FROM public.complaints WHERE id = _complaint_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Complaint not found'; END IF;
  IF old = _new_status THEN RETURN; END IF;
  UPDATE public.complaints SET status = _new_status WHERE id = _complaint_id;
  INSERT INTO public.status_history (complaint_id, old_status, new_status, note, changed_by)
  VALUES (_complaint_id, old, _new_status, NULLIF(btrim(COALESCE(_note, '')), ''), auth.uid());
END $$;
REVOKE EXECUTE ON FUNCTION public.update_complaint_status(uuid, public.complaint_status, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.update_complaint_status(uuid, public.complaint_status, text) TO authenticated;

-- Feedback
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL UNIQUE REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  fixed boolean NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (comment IS NULL OR char_length(comment) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins read feedback" ON public.feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners rate resolved complaints" ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND c.user_id = auth.uid() AND c.status = 'Resolved')
  );

-- Public, privacy-safe reads (no citizen name/phone)
CREATE OR REPLACE FUNCTION public.get_public_complaint(_tracking_id text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', c.id,
    'tracking_id', c.tracking_id,
    'category', c.category,
    'title', c.title,
    'description', c.description,
    'photo_url', c.photo_url,
    'location', c.location,
    'town', c.town,
    'latitude', c.latitude,
    'longitude', c.longitude,
    'status', c.status,
    'department', d.name,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('old_status', h.old_status, 'new_status', h.new_status, 'note', h.note, 'changed_at', h.changed_at) ORDER BY h.changed_at)
      FROM public.status_history h WHERE h.complaint_id = c.id
    ), '[]'::jsonb)
  )
  FROM public.complaints c
  LEFT JOIN public.departments d ON d.id = c.department_id
  WHERE c.tracking_id = upper(btrim(_tracking_id))
$$;
GRANT EXECUTE ON FUNCTION public.get_public_complaint(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH resolved_times AS (
    SELECT EXTRACT(EPOCH FROM (
      COALESCE((SELECT max(h.changed_at) FROM public.status_history h WHERE h.complaint_id = c.id AND h.new_status = 'Resolved'), c.updated_at)
      - c.created_at)) / 86400.0 AS days
    FROM public.complaints c WHERE c.status = 'Resolved'
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.complaints),
    'resolved', (SELECT count(*) FROM public.complaints WHERE status = 'Resolved'),
    'avg_resolution_days', (SELECT round(avg(days)::numeric, 1) FROM resolved_times),
    'towns', (SELECT count(DISTINCT town) FROM public.complaints),
    'citizens', (SELECT count(DISTINCT COALESCE(user_id::text, 'seed:' || citizen_name)) FROM public.complaints)
               + (SELECT count(*) FROM public.profiles p WHERE NOT EXISTS (SELECT 1 FROM public.complaints c WHERE c.user_id = p.id)),
    'active_by_category', COALESCE((
      SELECT jsonb_object_agg(category, n) FROM (
        SELECT category, count(*) AS n FROM public.complaints WHERE status <> 'Resolved' GROUP BY category
      ) x
    ), '{}'::jsonb),
    'recent_resolved', COALESCE((
      SELECT jsonb_agg(r) FROM (
        SELECT c.tracking_id, c.category, c.title, c.town, c.updated_at
        FROM public.complaints c WHERE c.status = 'Resolved'
        ORDER BY c.updated_at DESC LIMIT 3
      ) r
    ), '[]'::jsonb),
    'sample_ids', COALESCE((
      SELECT jsonb_agg(tracking_id) FROM (
        SELECT tracking_id FROM public.complaints ORDER BY updated_at DESC LIMIT 4
      ) s
    ), '[]'::jsonb)
  )
$$;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;

-- Photo storage policies (bucket created separately)
CREATE POLICY "Complaint photos are publicly viewable" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'complaint-photos');
CREATE POLICY "Citizens upload photos to their own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complaint-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Citizens remove their own photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'complaint-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
