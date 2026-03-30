-- Allow admin UI (cookie-auth -> anon client) to update/delete workshops

DROP POLICY IF EXISTS "Allow public update workshops" ON workshops;
CREATE POLICY "Allow public update workshops"
  ON workshops
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete workshops" ON workshops;
CREATE POLICY "Allow public delete workshops"
  ON workshops
  FOR DELETE
  TO public
  USING (true);

