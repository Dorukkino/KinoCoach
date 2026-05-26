-- Fix: "Database error creating new user" when coach adds student
-- Cause: enforce_coach_register blocked handle_new_user from inserting role=student

CREATE OR REPLACE FUNCTION public.enforce_coach_register()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    -- Profile row created by auth.users trigger (handle_new_user)
    IF current_setting('app.creating_auth_profile', true) = 'true' THEN
      RETURN NEW;
    END IF;
    -- Direct upsert via Admin API (service_role)
    IF COALESCE(
      current_setting('request.jwt.claims', true)::json->>'role',
      ''
    ) = 'service_role' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Students cannot self-register';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('app.creating_auth_profile', 'true', true);
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'coach'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;
  PERFORM set_config('app.creating_auth_profile', 'false', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
