-- Allow coaches to keep multiple dated notes per student engagement.
ALTER TABLE public.coach_notes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.coach_notes
  DROP CONSTRAINT IF EXISTS coach_notes_engagement_unique;

CREATE INDEX IF NOT EXISTS coach_notes_engagement_updated_idx
  ON public.coach_notes (engagement_id, updated_at DESC);
