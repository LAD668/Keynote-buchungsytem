-- Post-workshop feedback (visitor)
CREATE TABLE IF NOT EXISTS public.workshop_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT REFERENCES public.tickets(ticket_id),
  workshop_id UUID REFERENCES public.workshops(id),

  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  content_rating INTEGER NOT NULL CHECK (content_rating BETWEEN 1 AND 5),
  speaker_rating INTEGER NOT NULL CHECK (speaker_rating BETWEEN 1 AND 5),
  room_rating INTEGER CHECK (room_rating BETWEEN 1 AND 5),
  tech_rating INTEGER CHECK (tech_rating BETWEEN 1 AND 5),

  -- Single choice fields
  difficulty TEXT NOT NULL CHECK (difficulty IN ('too_easy', 'just_right', 'too_complex')),
  pace TEXT NOT NULL CHECK (pace IN ('too_slow', 'good', 'too_fast')),

  -- Text feedback
  positive_comment TEXT,
  improvement_comment TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(ticket_id, workshop_id)
);

CREATE INDEX IF NOT EXISTS idx_workshop_feedback_workshop ON public.workshop_feedback(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_feedback_ticket ON public.workshop_feedback(ticket_id);

ALTER TABLE public.workshop_feedback ENABLE ROW LEVEL SECURITY;

-- For this app we use ticket_id (localStorage) not Supabase auth; allow anon read/write.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workshop_feedback'
      AND policyname = 'workshop_feedback_select_all'
  ) THEN
    CREATE POLICY workshop_feedback_select_all
      ON public.workshop_feedback
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workshop_feedback'
      AND policyname = 'workshop_feedback_insert_all'
  ) THEN
    CREATE POLICY workshop_feedback_insert_all
      ON public.workshop_feedback
      FOR INSERT
      WITH CHECK (true);
  END IF;
END$$;

