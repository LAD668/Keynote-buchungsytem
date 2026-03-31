-- Admin auth support: one-time codes + allowlist + RPC helpers

CREATE TABLE IF NOT EXISTS public.admin_codes (
  code TEXT PRIMARY KEY,
  created_by TEXT DEFAULT 'system',
  assigned_to_email TEXT,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validate_admin_code(
  p_code TEXT,
  p_user_id UUID,
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

  IF p_user_id IS DISTINCT FROM v_uid OR lower(p_email) IS DISTINCT FROM lower(v_email) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.admin_codes
  SET used_by = p_user_id, used_at = NOW()
  WHERE code = p_code
    AND used_by IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING TRUE INTO v_used;

  IF v_used IS DISTINCT FROM TRUE THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.admin_allowlist (email, user_id)
  VALUES (lower(p_email), p_user_id)
  ON CONFLICT (email) DO UPDATE
  SET user_id = EXCLUDED.user_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_allowlist a
    WHERE a.email = lower(p_email)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_admin_code(TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_admin_code(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(TEXT) TO authenticated;

-- Rollback (manual):
-- REVOKE EXECUTE ON FUNCTION public.validate_admin_code(TEXT, UUID, TEXT) FROM authenticated;
-- REVOKE EXECUTE ON FUNCTION public.is_admin(TEXT) FROM authenticated;
-- DROP FUNCTION IF EXISTS public.validate_admin_code(TEXT, UUID, TEXT);
-- DROP FUNCTION IF EXISTS public.is_admin(TEXT);
-- DROP TABLE IF EXISTS public.admin_allowlist;
-- DROP TABLE IF EXISTS public.admin_codes;
