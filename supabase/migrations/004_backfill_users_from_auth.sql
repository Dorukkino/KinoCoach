-- Koç/öğrenci auth hesaplarını public.users ile senkronize eder.
-- enforce_coach_register trigger'ı geçici kapatılır (student satırları için).

BEGIN;

ALTER TABLE public.users DISABLE TRIGGER users_coach_only_register;

INSERT INTO public.users (id, email, role, full_name)
SELECT
  au.id,
  au.email,
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'coach'::user_role),
  COALESCE(NULLIF(trim(au.raw_user_meta_data->>'full_name'), ''), split_part(au.email, '@', 1), '')
FROM auth.users au
WHERE au.email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  full_name = CASE
    WHEN public.users.full_name IS NULL OR public.users.full_name = ''
    THEN EXCLUDED.full_name
    ELSE public.users.full_name
  END;

ALTER TABLE public.users ENABLE TRIGGER users_coach_only_register;

COMMIT;
