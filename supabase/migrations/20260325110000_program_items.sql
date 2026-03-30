-- Program items (2-day event schedule)

CREATE TABLE IF NOT EXISTS public.program_items (
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

ALTER TABLE public.program_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read program items" ON public.program_items;
CREATE POLICY "Allow public read program items"
  ON public.program_items
  FOR SELECT
  TO public
  USING (true);

-- Admin UI currently uses anon client + cookie auth, so we allow public writes.
DROP POLICY IF EXISTS "Allow public write program items" ON public.program_items;
CREATE POLICY "Allow public write program items"
  ON public.program_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

