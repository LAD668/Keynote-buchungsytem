-- Allow deleting workshops that have workshop_feedback
-- by cascading deletes from workshops -> workshop_feedback.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'workshop_feedback'
      AND tc.constraint_name = 'workshop_feedback_workshop_id_fkey'
  ) THEN
    ALTER TABLE public.workshop_feedback
      DROP CONSTRAINT workshop_feedback_workshop_id_fkey;
  END IF;
END$$;

ALTER TABLE public.workshop_feedback
  ADD CONSTRAINT workshop_feedback_workshop_id_fkey
  FOREIGN KEY (workshop_id)
  REFERENCES public.workshops(id)
  ON DELETE CASCADE;

-- Rollback (manual):
-- ALTER TABLE public.workshop_feedback DROP CONSTRAINT IF EXISTS workshop_feedback_workshop_id_fkey;
-- ALTER TABLE public.workshop_feedback
--   ADD CONSTRAINT workshop_feedback_workshop_id_fkey
--   FOREIGN KEY (workshop_id) REFERENCES public.workshops(id);

