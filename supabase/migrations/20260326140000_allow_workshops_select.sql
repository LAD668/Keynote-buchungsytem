-- Allow visitors (public/anon) to read workshops

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read workshops" ON public.workshops;
CREATE POLICY "Allow public read workshops"
  ON public.workshops
  FOR SELECT
  TO public
  USING (true);

-- Rollback (manual):
-- DROP POLICY IF EXISTS "Allow public read workshops" ON public.workshops;

