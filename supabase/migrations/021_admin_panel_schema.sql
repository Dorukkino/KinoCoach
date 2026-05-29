-- Admin panel MVP schema.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_account_status'
  ) THEN
    CREATE TYPE public.user_account_status AS ENUM ('active', 'disabled');
  END IF;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_status public.user_account_status NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_audit_events_admin_select ON public.admin_audit_events;
CREATE POLICY admin_audit_events_admin_select ON public.admin_audit_events
  FOR SELECT USING (public.current_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS admin_audit_events_created_at_idx
  ON public.admin_audit_events (created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_coach_register()
RETURNS TRIGGER AS $$
DECLARE
  claim_role TEXT;
BEGIN
  claim_role := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    ''
  );

  IF NEW.role IN ('student', 'admin') THEN
    IF claim_role = 'service_role' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Only administrators can create % profiles', NEW.role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role public.user_role;
  claim_role TEXT;
BEGIN
  claim_role := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    ''
  );

  requested_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'coach');

  -- Public signups may only become coaches. Student/admin profiles are created
  -- by server-side Admin API calls using the service role.
  IF requested_role IN ('student', 'admin') AND claim_role <> 'service_role' THEN
    requested_role := 'coach';
  END IF;

  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    requested_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
