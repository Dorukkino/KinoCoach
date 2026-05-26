-- Add note column to question_sessions for topic/subject notes
ALTER TABLE public.question_sessions
  ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
