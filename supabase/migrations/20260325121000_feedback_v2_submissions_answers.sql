-- Feedback v2: submissions + answers per question (Event vs Workshop)

CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('event', 'workshop')),
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_kind ON public.feedback_submissions(kind);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_workshop_id ON public.feedback_submissions(workshop_id);

CREATE TABLE IF NOT EXISTS public.feedback_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.feedback_submissions(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer_type TEXT NOT NULL CHECK (answer_type IN ('rating', 'nps', 'choice', 'text')),
  rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  nps SMALLINT CHECK (nps IS NULL OR (nps >= 0 AND nps <= 10)),
  choice TEXT,
  text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_answers_submission_id ON public.feedback_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_feedback_answers_question_key ON public.feedback_answers(question_key);

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert feedback_submissions" ON public.feedback_submissions;
CREATE POLICY "Allow public insert feedback_submissions"
  ON public.feedback_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read feedback_submissions" ON public.feedback_submissions;
CREATE POLICY "Allow public read feedback_submissions"
  ON public.feedback_submissions
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public insert feedback_answers" ON public.feedback_answers;
CREATE POLICY "Allow public insert feedback_answers"
  ON public.feedback_answers
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read feedback_answers" ON public.feedback_answers;
CREATE POLICY "Allow public read feedback_answers"
  ON public.feedback_answers
  FOR SELECT
  TO public
  USING (true);

