-- Additional performance indexes (010 already applied remotely)

-- messages: chat thread + getLastMessageTimestampsAction
CREATE INDEX IF NOT EXISTS messages_sender_receiver_created_idx
  ON public.messages (sender_id, receiver_id, created_at ASC);

CREATE INDEX IF NOT EXISTS messages_receiver_sender_created_idx
  ON public.messages (receiver_id, sender_id, created_at DESC);

-- coaching_engagements: findActiveByCoach ORDER BY started_at DESC
CREATE INDEX IF NOT EXISTS coaching_engagements_coach_active_started_idx
  ON public.coaching_engagements (coach_id, started_at DESC)
  WHERE status = 'active';

-- coaching_engagements: findAllByStudent ORDER BY started_at
CREATE INDEX IF NOT EXISTS coaching_engagements_student_started_idx
  ON public.coaching_engagements (student_id, started_at DESC);

-- coaching_invitations: findByCoach ORDER BY created_at
CREATE INDEX IF NOT EXISTS coaching_invitations_coach_created_idx
  ON public.coaching_invitations (coach_id, created_at DESC);

-- coach_notes: coach_id filtered queries
CREATE INDEX IF NOT EXISTS coach_notes_coach_updated_idx
  ON public.coach_notes (coach_id, updated_at DESC);

-- weekly_programs: engagement-scoped week listing
CREATE INDEX IF NOT EXISTS weekly_programs_engagement_week_idx
  ON public.weekly_programs (engagement_id, week_start DESC);

-- lesson_nets: engagement-scoped week queries
CREATE INDEX IF NOT EXISTS lesson_nets_engagement_week_idx
  ON public.lesson_nets (engagement_id, week_start DESC);
