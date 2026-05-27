-- Performance indexes and last-activity RPC for coach dashboard / student lists

-- exam_results: dashboard activity + student exam lists
CREATE INDEX IF NOT EXISTS exam_results_student_created_at_idx
  ON public.exam_results (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS exam_results_student_exam_date_idx
  ON public.exam_results (student_id, exam_date DESC, created_at DESC);

-- lesson_nets: last-activity aggregation
CREATE INDEX IF NOT EXISTS lesson_nets_student_created_at_idx
  ON public.lesson_nets (student_id, created_at DESC);

-- motivation_messages: engagement-scoped lists
CREATE INDEX IF NOT EXISTS motivation_messages_engagement_created_idx
  ON public.motivation_messages (engagement_id, created_at DESC);

-- coaching_engagements: archived list + RLS helper lookups
CREATE INDEX IF NOT EXISTS coaching_engagements_coach_ended_at_idx
  ON public.coaching_engagements (coach_id, ended_at DESC)
  WHERE status <> 'active';

CREATE INDEX IF NOT EXISTS coaching_engagements_student_coach_idx
  ON public.coaching_engagements (student_id, coach_id);

-- Tables created outside repo migrations (question_sessions, coach_lessons)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_sessions'
  ) THEN
    CREATE INDEX IF NOT EXISTS question_sessions_student_date_idx
      ON public.question_sessions (student_id, date DESC);
    CREATE INDEX IF NOT EXISTS question_sessions_student_created_at_idx
      ON public.question_sessions (student_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS question_sessions_engagement_id_idx
      ON public.question_sessions (engagement_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'coach_lessons'
  ) THEN
    CREATE INDEX IF NOT EXISTS coach_lessons_coach_id_idx
      ON public.coach_lessons (coach_id, created_at ASC);
  END IF;
END $$;

-- Single-query last activity for batch student status (replaces 4 round-trips)
CREATE OR REPLACE FUNCTION public.student_last_activity_at(p_student_ids uuid[])
RETURNS TABLE(student_id uuid, last_at timestamptz)
LANGUAGE sql
STABLE
AS $$
  SELECT sid, MAX(ts)
  FROM (
    SELECT id AS sid, last_active_at AS ts
      FROM public.students
     WHERE id = ANY(p_student_ids)
       AND last_active_at IS NOT NULL
    UNION ALL
    SELECT er.student_id, er.created_at
      FROM public.exam_results er
     WHERE er.student_id = ANY(p_student_ids)
    UNION ALL
    SELECT qs.student_id, qs.created_at
      FROM public.question_sessions qs
     WHERE qs.student_id = ANY(p_student_ids)
    UNION ALL
    SELECT ln.student_id, ln.created_at
      FROM public.lesson_nets ln
     WHERE ln.student_id = ANY(p_student_ids)
  ) u
  GROUP BY sid;
$$;
