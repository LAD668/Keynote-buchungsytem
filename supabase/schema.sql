-- Tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT UNIQUE NOT NULL,
  guest_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workshops table
CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  speaker TEXT NOT NULL,
  room TEXT NOT NULL,
  time_slot INTEGER NOT NULL CHECK (time_slot IN (1, 2, 3)),
  description TEXT,
  building TEXT,
  floor INTEGER,
  time_label TEXT,
  image_url TEXT,
  speaker_image_url TEXT,
  chili_level SMALLINT DEFAULT 2 CHECK (chili_level IS NULL OR (chili_level >= 1 AND chili_level <= 3)),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  time_slot INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ticket_id, workshop_id)
);

-- Program items table (event schedule)
CREATE TABLE program_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  title TEXT NOT NULL,
  description TEXT,
  building TEXT,
  floor INTEGER,
  room TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT,
  workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('workshop', 'organization')),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  speaker_rating SMALLINT CHECK (speaker_rating IS NULL OR (speaker_rating >= 1 AND speaker_rating <= 5)),
  org_rating SMALLINT CHECK (org_rating IS NULL OR (org_rating >= 1 AND org_rating <= 5)),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback v2 (structured questionnaire)
CREATE TABLE feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('event', 'workshop')),
  workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feedback_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES feedback_submissions(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer_type TEXT NOT NULL CHECK (answer_type IN ('rating', 'nps', 'choice', 'text')),
  rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  nps SMALLINT CHECK (nps IS NULL OR (nps >= 0 AND nps <= 10)),
  choice TEXT,
  text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_registrations_ticket ON registrations(ticket_id);
CREATE INDEX idx_registrations_workshop ON registrations(workshop_id);
CREATE INDEX idx_workshops_timeslot ON workshops(time_slot);
CREATE INDEX idx_feedback_workshop_id ON feedback(workshop_id);
CREATE INDEX idx_feedback_kind ON feedback(kind);
CREATE INDEX idx_feedback_submissions_kind ON feedback_submissions(kind);
CREATE INDEX idx_feedback_submissions_workshop_id ON feedback_submissions(workshop_id);
CREATE INDEX idx_feedback_answers_submission_id ON feedback_answers(submission_id);
CREATE INDEX idx_feedback_answers_question_key ON feedback_answers(question_key);

-- Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_answers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read workshops"
  ON workshops
  FOR SELECT
  TO public
  USING (true);

-- Admin UI needs to insert workshops (currently uses `anon` because auth is cookie-based).
CREATE POLICY "Allow public insert workshops"
  ON workshops
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update workshops"
  ON workshops
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete workshops"
  ON workshops
  FOR DELETE
  TO public
  USING (true);

-- Login: Ticket-Zeilen müssen lesbar sein (RLS ohne Policy = kein Zugriff).
CREATE POLICY "Allow public select tickets"
  ON tickets
  FOR SELECT
  TO public
  USING (true);

-- Buchungen: nur wenn ticket_id in tickets existiert (Browser setzt kein app.ticket_id).
CREATE POLICY "Allow registrations for valid tickets"
  ON registrations
  FOR ALL
  TO public
  USING (
    EXISTS (SELECT 1 FROM tickets t WHERE t.ticket_id = registrations.ticket_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tickets t WHERE t.ticket_id = registrations.ticket_id)
  );

CREATE POLICY "Allow public read program items"
  ON program_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write program items"
  ON program_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert feedback"
  ON feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read feedback"
  ON feedback
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert feedback_submissions"
  ON feedback_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read feedback_submissions"
  ON feedback_submissions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert feedback_answers"
  ON feedback_answers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read feedback_answers"
  ON feedback_answers
  FOR SELECT
  TO public
  USING (true);
