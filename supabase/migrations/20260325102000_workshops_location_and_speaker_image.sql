-- Extend workshops table with location fields and speaker avatar URL

ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS building TEXT,
  ADD COLUMN IF NOT EXISTS floor INTEGER,
  ADD COLUMN IF NOT EXISTS time_label TEXT,
  ADD COLUMN IF NOT EXISTS speaker_image_url TEXT;

