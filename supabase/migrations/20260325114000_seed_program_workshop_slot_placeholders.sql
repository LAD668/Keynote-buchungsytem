-- Seed fixed Workshop-slot placeholders for Admin timeline
-- These are placeholders (not real events) and should be filtered out in UI.

INSERT INTO public.program_items (day_date, start_time, end_time, title, description, building, floor, room)
SELECT
  '2026-09-05'::date,
  '10:00:00'::time,
  '11:00:00'::time,
  'WORKSHOP_SLOT_1',
  NULL,
  NULL,
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.program_items
  WHERE day_date = '2026-09-05'::date AND title = 'WORKSHOP_SLOT_1'
);

INSERT INTO public.program_items (day_date, start_time, end_time, title, description, building, floor, room)
SELECT
  '2026-09-05'::date,
  '11:30:00'::time,
  '12:30:00'::time,
  'WORKSHOP_SLOT_2',
  NULL,
  NULL,
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.program_items
  WHERE day_date = '2026-09-05'::date AND title = 'WORKSHOP_SLOT_2'
);

INSERT INTO public.program_items (day_date, start_time, end_time, title, description, building, floor, room)
SELECT
  '2026-09-05'::date,
  '13:30:00'::time,
  '14:30:00'::time,
  'WORKSHOP_SLOT_3',
  NULL,
  NULL,
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.program_items
  WHERE day_date = '2026-09-05'::date AND title = 'WORKSHOP_SLOT_3'
);

