-- Seed: Beispiel-Workshops für die UI-Demo
-- (INSERTs laufen im Migrations-Context; RLS-Policies blocken sie nicht wie im Browser.)

INSERT INTO public.workshops (title, speaker, room, time_slot, description, image_url, chili_level)
SELECT
  'Keynote: Zukunft aus Daten',
  'Alex König',
  'Aula',
  1,
  'Wie man aus rohen Signalen klare Entscheidungen macht.',
  NULL,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE title = 'Keynote: Zukunft aus Daten');

INSERT INTO public.workshops (title, speaker, room, time_slot, description, image_url, chili_level)
SELECT
  'Design Systems kompakt',
  'Mira Stein',
  'Studio 1',
  1,
  'Von Tokens bis Komponenten: ein schlanker Weg zu konsistenten UIs.',
  NULL,
  2
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE title = 'Design Systems kompakt');

INSERT INTO public.workshops (title, speaker, room, time_slot, description, image_url, chili_level)
SELECT
  'Sicherheit für Frontends',
  'Jonas Weber',
  'Studio 2',
  1,
  'Praktische Checks gegen Leaks, XSS und falsche CORS-Setups.',
  NULL,
  2
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE title = 'Sicherheit für Frontends');

INSERT INTO public.workshops (title, speaker, room, time_slot, description, image_url, chili_level)
SELECT
  'Choreo: Bewegte Interfaces',
  'Sven Richter',
  'Studio 1',
  2,
  'Mikro-Animationen, die sich wie Geschwindigkeit anfühlen.',
  NULL,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE title = 'Choreo: Bewegte Interfaces');

INSERT INTO public.workshops (title, speaker, room, time_slot, description, image_url, chili_level)
SELECT
  'Supabase Basics & RLS',
  'Lena Hartmann',
  'Studio 3',
  2,
  'Wie Policies wirklich funktionieren – inkl. häufigen Stolperfallen.',
  NULL,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE title = 'Supabase Basics & RLS');

INSERT INTO public.workshops (title, speaker, room, time_slot, description, image_url, chili_level)
SELECT
  'Workshop: MVP in 90 Minuten',
  'Nora Schmid',
  'Studio 2',
  2,
  'Gemeinsam ein kleines Produkt bauen – Fokus auf Scope & Feedback.',
  NULL,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE title = 'Workshop: MVP in 90 Minuten');

INSERT INTO public.workshops (title, speaker, room, time_slot, description, image_url, chili_level)
SELECT
  'Performance: 5x schneller',
  'Paul Wagner',
  'Aula',
  3,
  'Messbar optimieren: Rendering, Caching und Monitoring in der Praxis.',
  NULL,
  2
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE title = 'Performance: 5x schneller');

INSERT INTO public.workshops (title, speaker, room, time_slot, description, image_url, chili_level)
SELECT
  'Data Storytelling',
  'Elif Aydin',
  'Studio 1',
  3,
  'Aus Diagrammen werden Geschichten – mit klaren Entscheidungen statt Deko.',
  NULL,
  2
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE title = 'Data Storytelling');

INSERT INTO public.workshops (title, speaker, room, time_slot, description, image_url, chili_level)
SELECT
  'AI Tools: Nutzen statt Hype',
  'Tobias Braun',
  'Studio 3',
  3,
  'Schnelle Workflows, die wirklich im Alltag landen.',
  NULL,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.workshops WHERE title = 'AI Tools: Nutzen statt Hype');

