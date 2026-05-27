-- Lean fallback indexes for coach dashboard / student list hot paths

CREATE INDEX IF NOT EXISTS idx_engagements_coach ON coaching_engagements(coach_id);
CREATE INDEX IF NOT EXISTS idx_engagements_student ON coaching_engagements(student_id);
CREATE INDEX IF NOT EXISTS idx_weekly_programs_student ON weekly_programs(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
