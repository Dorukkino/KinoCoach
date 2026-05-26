-- LearnToTeach initial schema

CREATE TYPE user_role AS ENUM ('coach', 'student');
CREATE TYPE student_status_color AS ENUM ('green', 'yellow', 'red');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'coach',
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT,
  track TEXT,
  task_completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.weekly_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  grid_json JSONB NOT NULL DEFAULT '[]',
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, week_start)
);

CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  scores_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_id, student_id)
);

CREATE TABLE public.motivation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lesson_nets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  grid_json JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, week_start)
);

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Coach owns student check
CREATE OR REPLACE FUNCTION public.is_coach_of_student(p_student_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = p_student_id AND s.coach_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_nets ENABLE ROW LEVEL SECURITY;

-- users policies
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (id = auth.uid());

-- students policies
CREATE POLICY students_coach_all ON public.students
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY students_self_select ON public.students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY students_self_update_activity ON public.students
  FOR UPDATE USING (user_id = auth.uid());

-- weekly_programs
CREATE POLICY weekly_coach_all ON public.weekly_programs
  FOR ALL USING (public.is_coach_of_student(student_id));

CREATE POLICY weekly_student_select ON public.weekly_programs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid())
  );

CREATE POLICY weekly_student_update ON public.weekly_programs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid())
  );

CREATE POLICY weekly_student_insert ON public.weekly_programs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid())
  );

-- exam_results
CREATE POLICY exam_coach_all ON public.exam_results
  FOR ALL USING (public.is_coach_of_student(student_id));

CREATE POLICY exam_student_select ON public.exam_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid())
  );

-- messages
CREATE POLICY messages_participants ON public.messages
  FOR ALL USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- coach_notes (coach only)
CREATE POLICY notes_coach_only ON public.coach_notes
  FOR ALL USING (coach_id = auth.uid());

-- motivation_messages
CREATE POLICY motivation_coach_crud ON public.motivation_messages
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY motivation_student_read ON public.motivation_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid())
  );

-- lesson_nets
CREATE POLICY lesson_coach_all ON public.lesson_nets
  FOR ALL USING (public.is_coach_of_student(student_id));

CREATE POLICY lesson_student_all ON public.lesson_nets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid())
  );

-- Trigger: block direct student signup; allow Admin API + auth profile sync
CREATE OR REPLACE FUNCTION public.enforce_coach_register()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    IF current_setting('app.creating_auth_profile', true) = 'true' THEN
      RETURN NEW;
    END IF;
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

CREATE TRIGGER users_coach_only_register
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_coach_register();

-- Auto-create profile on auth signup (coach)
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Storage bucket (run in dashboard or separate migration)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false);
