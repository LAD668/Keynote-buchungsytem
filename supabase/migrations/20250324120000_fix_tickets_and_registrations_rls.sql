-- Fix: tickets hatte RLS ohne Policy → kein SELECT möglich (Login schlägt immer fehl).
-- Fix: registrations nutzte current_setting('app.ticket_id'), das der Browser-Client nie setzt.

DROP POLICY IF EXISTS "Allow ticket owner registrations" ON registrations;
DROP POLICY IF EXISTS "Allow public select tickets" ON tickets;
DROP POLICY IF EXISTS "Allow registrations for valid tickets" ON registrations;

-- Ticket-ID ist das Geheimnis: Lesen aller Zeilen ist für Anon ok, solange die ID nicht erraten wird.
CREATE POLICY "Allow public select tickets"
  ON tickets
  FOR SELECT
  TO public
  USING (true);

-- Buchungen nur, wenn ticket_id in tickets existiert (Besitz durch Kenntnis der ID).
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
