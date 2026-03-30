-- Enforce "registration_enabled" feature flag for booking changes.
-- - Visitors can always SELECT their registrations (agenda visibility)
-- - Visitors can only INSERT/UPDATE/DELETE when registration_enabled = true

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow registrations for valid tickets" ON public.registrations;
DROP POLICY IF EXISTS "Allow registrations select for valid tickets" ON public.registrations;
DROP POLICY IF EXISTS "Allow registrations insert when enabled" ON public.registrations;
DROP POLICY IF EXISTS "Allow registrations update when enabled" ON public.registrations;
DROP POLICY IF EXISTS "Allow registrations delete when enabled" ON public.registrations;

CREATE POLICY "Allow registrations select for valid tickets"
  ON public.registrations
  FOR SELECT
  TO public
  USING (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.ticket_id = registrations.ticket_id)
  );

CREATE POLICY "Allow registrations insert when enabled"
  ON public.registrations
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.ticket_id = registrations.ticket_id)
    AND EXISTS (
      SELECT 1
      FROM public.app_settings s
      WHERE s.key = 'registration_enabled'
        AND s.boolean_value = true
    )
  );

CREATE POLICY "Allow registrations update when enabled"
  ON public.registrations
  FOR UPDATE
  TO public
  USING (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.ticket_id = registrations.ticket_id)
    AND EXISTS (
      SELECT 1
      FROM public.app_settings s
      WHERE s.key = 'registration_enabled'
        AND s.boolean_value = true
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.ticket_id = registrations.ticket_id)
    AND EXISTS (
      SELECT 1
      FROM public.app_settings s
      WHERE s.key = 'registration_enabled'
        AND s.boolean_value = true
    )
  );

CREATE POLICY "Allow registrations delete when enabled"
  ON public.registrations
  FOR DELETE
  TO public
  USING (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.ticket_id = registrations.ticket_id)
    AND EXISTS (
      SELECT 1
      FROM public.app_settings s
      WHERE s.key = 'registration_enabled'
        AND s.boolean_value = true
    )
  );

-- Rollback (manual):
-- DROP POLICY IF EXISTS "Allow registrations select for valid tickets" ON public.registrations;
-- DROP POLICY IF EXISTS "Allow registrations insert when enabled" ON public.registrations;
-- DROP POLICY IF EXISTS "Allow registrations update when enabled" ON public.registrations;
-- DROP POLICY IF EXISTS "Allow registrations delete when enabled" ON public.registrations;
-- CREATE POLICY "Allow registrations for valid tickets"
--   ON public.registrations
--   FOR ALL
--   TO public
--   USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.ticket_id = registrations.ticket_id))
--   WITH CHECK (EXISTS (SELECT 1 FROM public.tickets t WHERE t.ticket_id = registrations.ticket_id));

