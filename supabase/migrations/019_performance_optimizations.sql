-- Performance: RPCs, indexes, weekly program summary columns, atomic cell toggle

-- weekly_programs: denormalized summary + optimistic locking
ALTER TABLE public.weekly_programs
  ADD COLUMN IF NOT EXISTS total_tasks_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_tasks_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.lesson_nets
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.weekly_grid_metrics(p_grid jsonb)
RETURNS TABLE(total_tasks int, completed_tasks int, completion_rate numeric)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_total int := 0;
  v_done int := 0;
  v_row jsonb;
  v_cell jsonb;
BEGIN
  IF p_grid IS NULL OR jsonb_typeof(p_grid) <> 'array' THEN
    RETURN QUERY SELECT 0, 0, 0::numeric;
    RETURN;
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_grid)
  LOOP
    IF jsonb_typeof(v_row) = 'array' THEN
      FOR v_cell IN SELECT value FROM jsonb_array_elements(v_row)
      LOOP
        IF v_cell IS NOT NULL AND v_cell <> 'null'::jsonb AND jsonb_typeof(v_cell) = 'object' THEN
          v_total := v_total + 1;
          IF COALESCE((v_cell->>'done')::boolean, false) THEN
            v_done := v_done + 1;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN QUERY SELECT
    v_total,
    v_done,
    CASE WHEN v_total = 0 THEN 0::numeric
         ELSE ROUND((v_done::numeric / v_total::numeric) * 100, 2)
    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_weekly_program_summary()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  m record;
BEGIN
  SELECT * INTO m FROM public.weekly_grid_metrics(NEW.grid_json);
  NEW.total_tasks_count := m.total_tasks;
  NEW.completed_tasks_count := m.completed_tasks;
  NEW.completion_rate := m.completion_rate;
  NEW.updated_at := NOW();
  IF TG_OP = 'UPDATE' AND (OLD.grid_json IS DISTINCT FROM NEW.grid_json) THEN
    NEW.version := COALESCE(OLD.version, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS weekly_programs_summary_sync ON public.weekly_programs;
CREATE TRIGGER weekly_programs_summary_sync
  BEFORE INSERT OR UPDATE OF grid_json ON public.weekly_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_weekly_program_summary();

UPDATE public.weekly_programs wp
SET grid_json = wp.grid_json;

CREATE OR REPLACE FUNCTION public.sync_lesson_net_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  IF TG_OP = 'UPDATE' AND (OLD.grid_json IS DISTINCT FROM NEW.grid_json) THEN
    NEW.version := COALESCE(OLD.version, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lesson_nets_version_sync ON public.lesson_nets;
CREATE TRIGGER lesson_nets_version_sync
  BEFORE INSERT OR UPDATE OF grid_json ON public.lesson_nets
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_lesson_net_version();

-- Atomic cell toggle via jsonb_set (row = day index 0..9, col = task index 0..6 in stored grid)
CREATE OR REPLACE FUNCTION public.toggle_weekly_program_cell(
  p_engagement_id uuid,
  p_week_start date,
  p_row int,
  p_col int,
  p_expected_version int DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  student_id uuid,
  week_start date,
  grid_json jsonb,
  completion_rate numeric,
  total_tasks_count int,
  completed_tasks_count int,
  version int,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec public.weekly_programs%ROWTYPE;
  v_cell jsonb;
  v_path text[];
  v_done boolean;
BEGIN
  SELECT * INTO v_rec
  FROM public.weekly_programs
  WHERE engagement_id = p_engagement_id
    AND week_start = p_week_start
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'weekly program not found';
  END IF;

  IF p_expected_version IS NOT NULL AND v_rec.version <> p_expected_version THEN
    RAISE EXCEPTION 'version conflict' USING ERRCODE = '40001';
  END IF;

  v_path := ARRAY[p_row::text, p_col::text];
  v_cell := v_rec.grid_json #> v_path;

  IF v_cell IS NULL OR v_cell = 'null'::jsonb THEN
    RAISE EXCEPTION 'cell empty';
  END IF;

  v_done := NOT COALESCE((v_cell->>'done')::boolean, false);

  UPDATE public.weekly_programs wp
  SET grid_json = jsonb_set(
    wp.grid_json,
    v_path,
    jsonb_set(v_cell, '{done}', to_jsonb(v_done)),
    false
  )
  WHERE wp.id = v_rec.id
  RETURNING * INTO v_rec;

  RETURN QUERY
  SELECT
    v_rec.id,
    v_rec.student_id,
    v_rec.week_start,
    v_rec.grid_json,
    v_rec.completion_rate,
    v_rec.total_tasks_count,
    v_rec.completed_tasks_count,
    v_rec.version,
    v_rec.updated_at;
END;
$$;

-- Chat peers
CREATE OR REPLACE FUNCTION public.chat_allowed_peers(p_user_id uuid)
RETURNS TABLE(peer_user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.user_id
  FROM public.coaching_engagements ce
  JOIN public.students s ON s.id = ce.student_id
  WHERE ce.coach_id = p_user_id AND ce.status = 'active'
  UNION
  SELECT ce.coach_id
  FROM public.students st
  JOIN public.coaching_engagements ce
    ON ce.student_id = st.id AND ce.status = 'active'
  WHERE st.user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.chat_unread_counts_by_sender(p_user_id uuid)
RETURNS TABLE(sender_id uuid, unread_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.sender_id, COUNT(*)::bigint
  FROM public.messages m
  WHERE m.receiver_id = p_user_id
    AND m.read_at IS NULL
    AND m.sender_id IN (SELECT peer_user_id FROM public.chat_allowed_peers(p_user_id))
  GROUP BY m.sender_id;
$$;

CREATE OR REPLACE FUNCTION public.last_message_timestamps(
  p_user_id uuid,
  p_peer_ids uuid[]
)
RETURNS TABLE(peer_id uuid, last_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (peer_id)
    CASE
      WHEN sender_id = p_user_id THEN receiver_id
      ELSE sender_id
    END AS peer_id,
    created_at AS last_at
  FROM public.messages
  WHERE (
    sender_id = p_user_id AND receiver_id = ANY(p_peer_ids)
  ) OR (
    receiver_id = p_user_id AND sender_id = ANY(p_peer_ids)
  )
  ORDER BY peer_id, created_at DESC;
$$;

-- Coach activity feed (global order + limit)
CREATE OR REPLACE FUNCTION public.coach_activity_feed(
  p_coach_id uuid,
  p_limit int DEFAULT 20,
  p_max_age_days int DEFAULT 2,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id text DEFAULT NULL
)
RETURNS TABLE(
  id text,
  student_id uuid,
  activity_type text,
  description text,
  meta text,
  note text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH students AS (
    SELECT ce.student_id AS sid
    FROM public.coaching_engagements ce
    WHERE ce.coach_id = p_coach_id AND ce.status = 'active'
  ),
  cutoff AS (
    SELECT NOW() - make_interval(days => p_max_age_days) AS ts
  ),
  exams AS (
    SELECT
      'exam-' || er.id::text AS id,
      er.student_id AS sid,
      'exam'::text AS activity_type,
      'deneme neti ekledi'::text AS description,
      'Toplam: ' || COALESCE(
        (COALESCE((er.scores_json->>'turkish')::numeric, 0) +
         COALESCE((er.scores_json->>'math')::numeric, 0) +
         COALESCE((er.scores_json->>'science')::numeric, 0) +
         COALESCE((er.scores_json->>'social')::numeric, 0) +
         COALESCE((er.scores_json->>'english')::numeric, 0))::text,
        '0'
      ) || ' net' AS meta,
      ''::text AS note,
      er.created_at
    FROM public.exam_results er
    JOIN students s ON s.sid = er.student_id
    CROSS JOIN cutoff c
    WHERE er.created_at >= c.ts
  ),
  sessions AS (
    SELECT
      'qs-' || qs.id::text AS id,
      qs.student_id AS sid,
      'question_session'::text AS activity_type,
      qs.lesson_name || ' soru çözdü'::text AS description,
      qs.correct::text || '/' || qs.total::text || ' doğru' AS meta,
      COALESCE(qs.note, '')::text AS note,
      qs.created_at
    FROM public.question_sessions qs
    JOIN students s ON s.sid = qs.student_id
    CROSS JOIN cutoff c
    WHERE qs.created_at >= c.ts
  )
  SELECT * FROM (
    SELECT * FROM exams
    UNION ALL
    SELECT * FROM sessions
  ) u
  WHERE p_cursor_created_at IS NULL
     OR u.created_at < p_cursor_created_at
     OR (
       u.created_at = p_cursor_created_at
       AND (p_cursor_id IS NULL OR u.id < p_cursor_id)
     )
  ORDER BY created_at DESC, id DESC
  LIMIT GREATEST(p_limit, 1);
$$;

CREATE OR REPLACE FUNCTION public.coach_active_students(
  p_coach_id uuid,
  p_cursor_started_at timestamptz DEFAULT NULL,
  p_cursor_student_id uuid DEFAULT NULL,
  p_limit int DEFAULT 100
)
RETURNS TABLE(
  engagement_id uuid,
  student_id uuid,
  user_id uuid,
  name text,
  email text,
  task_completion_rate numeric,
  last_active_at timestamptz,
  grade text,
  track text,
  school_level text,
  started_at timestamptz,
  last_activity_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH active AS (
    SELECT ce.*
    FROM public.coaching_engagements ce
    WHERE ce.coach_id = p_coach_id
      AND ce.status = 'active'
      AND (
        p_cursor_started_at IS NULL
        OR ce.started_at < p_cursor_started_at
        OR (
          ce.started_at = p_cursor_started_at
          AND (p_cursor_student_id IS NULL OR ce.student_id < p_cursor_student_id)
        )
      )
    ORDER BY ce.started_at DESC, ce.student_id DESC
    LIMIT GREATEST(p_limit, 1)
  )
  SELECT
    a.id AS engagement_id,
    s.id AS student_id,
    s.user_id,
    s.name,
    u.email,
    s.task_completion_rate,
    s.last_active_at,
    s.grade,
    s.track,
    a.school_level,
    a.started_at,
    COALESCE(la.last_at, s.last_active_at) AS last_activity_at
  FROM active a
  JOIN public.students s ON s.id = a.student_id
  JOIN public.users u ON u.id = s.user_id
  LEFT JOIN LATERAL (
    SELECT last_at
    FROM public.student_last_activity_at(ARRAY[a.student_id])
    LIMIT 1
  ) la ON true
  ORDER BY a.started_at DESC, a.student_id DESC;
$$;

-- Weekly reminder batch candidates
CREATE OR REPLACE FUNCTION public.weekly_reminder_candidates(
  p_week_start date,
  p_threshold numeric DEFAULT 30
)
RETURNS TABLE(
  engagement_id uuid,
  student_id uuid,
  student_user_id uuid,
  student_name text,
  completion_percent numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ce.id AS engagement_id,
    s.id AS student_id,
    s.user_id AS student_user_id,
    s.name AS student_name,
    COALESCE(wp.completion_rate, 0) AS completion_percent
  FROM public.coaching_engagements ce
  JOIN public.students s ON s.id = ce.student_id
  LEFT JOIN public.weekly_programs wp
    ON wp.engagement_id = ce.id AND wp.week_start = p_week_start
  WHERE ce.status = 'active'
    AND COALESCE(wp.completion_rate, 0) < p_threshold
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = s.user_id
        AND n.type = 'WEEKLY_REMINDER'
        AND n.metadata->>'weekStart' = p_week_start::text
    );
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS messages_thread_cursor_idx
  ON public.messages (sender_id, receiver_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS messages_thread_cursor_rev_idx
  ON public.messages (receiver_id, sender_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS exam_results_created_student_idx
  ON public.exam_results (created_at DESC, student_id);

CREATE INDEX IF NOT EXISTS question_sessions_created_student_idx
  ON public.question_sessions (created_at DESC, student_id);

CREATE INDEX IF NOT EXISTS question_sessions_student_date_created_idx
  ON public.question_sessions (student_id, date DESC, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS coaching_engagements_coach_active_started_student_idx
  ON public.coaching_engagements (coach_id, started_at DESC, student_id DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS users_lower_email_idx
  ON public.users (lower(email));

CREATE INDEX IF NOT EXISTS coaching_invitations_student_pending_idx
  ON public.coaching_invitations (student_id, status, created_at DESC);
