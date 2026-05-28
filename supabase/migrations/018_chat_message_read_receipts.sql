-- Track whether an incoming chat message has been seen by its receiver.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.messages
      ADD COLUMN read_at TIMESTAMPTZ;

    -- Existing chat history predates read receipts, so treat it as already seen.
    UPDATE public.messages
    SET read_at = created_at
    WHERE read_at IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS messages_receiver_unread_sender_idx
  ON public.messages (receiver_id, sender_id, created_at DESC)
  WHERE read_at IS NULL;
