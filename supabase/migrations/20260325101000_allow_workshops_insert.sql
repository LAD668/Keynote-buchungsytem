-- Allow inserts/updates from the admin UI
-- Note: This uses the `anon` role (public) because the current admin auth is cookie-based,
-- not Supabase Auth with elevated privileges.

DROP POLICY IF EXISTS "Allow public insert workshops" ON workshops;
CREATE POLICY "Allow public insert workshops"
  ON workshops
  FOR INSERT
  TO public
  WITH CHECK (true);

