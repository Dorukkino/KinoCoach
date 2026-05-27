-- Align week boundaries with app logic (Monday = week start).
CREATE OR REPLACE FUNCTION public.get_question_session_weeks(p_student_id UUID)
RETURNS TABLE (week_start DATE)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT (
    date::date - (EXTRACT(ISODOW FROM date)::int - 1)
  ) AS week_start
  FROM public.question_sessions
  WHERE student_id = p_student_id
  ORDER BY 1 DESC;
$$;
