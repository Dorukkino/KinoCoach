CREATE INDEX IF NOT EXISTS question_sessions_student_date_idx
  ON public.question_sessions (student_id, date DESC);

CREATE OR REPLACE FUNCTION public.get_question_session_weeks(p_student_id UUID)
RETURNS TABLE (week_start DATE)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT date_trunc('week', date)::date
  FROM public.question_sessions
  WHERE student_id = p_student_id
  ORDER BY 1 DESC;
$$;
