-- Feedback (per workshop + organization)

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('workshop', 'organization')),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  speaker_rating SMALLINT CHECK (speaker_rating IS NULL OR (speaker_rating >= 1 AND speaker_rating <= 5)),
  org_rating SMALLINT CHECK (org_rating IS NULL OR (org_rating >= 1 AND org_rating <= 5)),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_workshop_id ON public.feedback(workshop_id);
CREATE INDEX IF NOT EXISTS idx_feedback_kind ON public.feedback(kind);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert feedback" ON public.feedback;
CREATE POLICY "Allow public insert feedback"
  ON public.feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admin UI uses anon client + cookie auth; allow reading for dashboards.
DROP POLICY IF EXISTS "Allow public read feedback" ON public.feedback;
CREATE POLICY "Allow public read feedback"
  ON public.feedback
  FOR SELECT
  TO public
  USING (true);

