-- App-wide feature flags
-- - registration_enabled: allows workshop registration/booking
-- - feedback_enabled: allows submitting workshop feedback

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  boolean_value BOOLEAN NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_settings (key, boolean_value)
VALUES
  ('registration_enabled', true),
  ('feedback_enabled', true)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_settings'
      AND policyname = 'app_settings_select_all'
  ) THEN
    CREATE POLICY app_settings_select_all
      ON public.app_settings
      FOR SELECT
      USING (true);
  END IF;
END$$;

-- Rollback (manual):
-- DROP POLICY IF EXISTS app_settings_select_all ON public.app_settings;
-- DROP TABLE IF EXISTS public.app_settings;

