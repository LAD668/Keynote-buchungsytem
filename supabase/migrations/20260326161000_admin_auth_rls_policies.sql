-- RLS policies for admin management tables

ALTER TABLE public.admin_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_codes_select_admins ON public.admin_codes;
DROP POLICY IF EXISTS admin_codes_insert_admins ON public.admin_codes;
DROP POLICY IF EXISTS admin_codes_delete_admins_unused ON public.admin_codes;
DROP POLICY IF EXISTS admin_allowlist_select_admins ON public.admin_allowlist;

CREATE POLICY admin_codes_select_admins
  ON public.admin_codes
  FOR SELECT
  TO authenticated
  USING (public.is_admin((auth.jwt() ->> 'email')));

CREATE POLICY admin_codes_insert_admins
  ON public.admin_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin((auth.jwt() ->> 'email')));

CREATE POLICY admin_codes_delete_admins_unused
  ON public.admin_codes
  FOR DELETE
  TO authenticated
  USING (public.is_admin((auth.jwt() ->> 'email')) AND used_by IS NULL);

CREATE POLICY admin_allowlist_select_admins
  ON public.admin_allowlist
  FOR SELECT
  TO authenticated
  USING (public.is_admin((auth.jwt() ->> 'email')));

-- Rollback (manual):
-- DROP POLICY IF EXISTS admin_codes_select_admins ON public.admin_codes;
-- DROP POLICY IF EXISTS admin_codes_insert_admins ON public.admin_codes;
-- DROP POLICY IF EXISTS admin_codes_delete_admins_unused ON public.admin_codes;
-- DROP POLICY IF EXISTS admin_allowlist_select_admins ON public.admin_allowlist;
