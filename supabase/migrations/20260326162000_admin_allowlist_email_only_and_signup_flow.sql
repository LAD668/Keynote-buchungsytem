-- Admin auth adjustments:
-- - admin_allowlist stores only email (no user_id)
-- - admin_codes stores used_by_email for display
-- - validate_admin_code signature simplified (no p_user_id)

ALTER TABLE public.admin_allowlist
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.admin_codes
  ADD COLUMN IF NOT EXISTS used_by_email TEXT;

DROP FUNCTION IF EXISTS public.validate_admin_code(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.validate_admin_code(
  p_code TEXT,
  p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID;
  v_email TEXT;
  v_used BOOLEAN := false;
BEGIN
  v_uid := auth.uid();
  v_email := (auth.jwt() ->> 'email');

  IF v_uid IS NULL OR v_email IS NULL THEN
    RETURN FALSE;
  END IF;

  IF lower(p_email) IS DISTINCT FROM lower(v_email) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.admin_codes
  SET used_by = v_uid,
      used_by_email = lower(v_email),
      used_at = NOW()
  WHERE code = p_code
    AND used_by IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING TRUE INTO v_used;

  IF v_used IS DISTINCT FROM TRUE THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.admin_allowlist (email)
  VALUES (lower(v_email))
  ON CONFLICT (email) DO NOTHING;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_admin_code(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_admin_code(TEXT, TEXT) TO authenticated;

-- Rollback (manual):
-- REVOKE EXECUTE ON FUNCTION public.validate_admin_code(TEXT, TEXT) FROM authenticated;
-- DROP FUNCTION IF EXISTS public.validate_admin_code(TEXT, TEXT);
-- ALTER TABLE public.admin_codes DROP COLUMN IF EXISTS used_by_email;
-- ALTER TABLE public.admin_allowlist ADD COLUMN user_id UUID REFERENCES auth.users(id);
