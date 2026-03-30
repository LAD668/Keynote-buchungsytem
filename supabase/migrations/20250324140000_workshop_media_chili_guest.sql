ALTER TABLE tickets ADD COLUMN IF NOT EXISTS guest_name TEXT;

ALTER TABLE workshops ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS chili_level SMALLINT DEFAULT 2;

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS time_slot INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workshops_chili_level_check'
  ) THEN
    ALTER TABLE workshops
      ADD CONSTRAINT workshops_chili_level_check
      CHECK (chili_level IS NULL OR (chili_level >= 1 AND chili_level <= 3));
  END IF;
END $$;
