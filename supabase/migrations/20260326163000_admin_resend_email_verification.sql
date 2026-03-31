-- Admin email verification via custom token (Resend)

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_email_verifications (
  email TEXT PRIMARY KEY,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON public.email_verification_tokens(email);

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check their own verification state via RPC
CREATE OR REPLACE FUNCTION public.is_admin_email_verified(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := (auth.jwt() ->> 'email');
  IF v_email IS NULL OR lower(p_email) IS DISTINCT FROM lower(v_email) THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_email_verifications v WHERE v.email = lower(v_email)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin_email_verified(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_email_verified(TEXT) TO authenticated;

-- Rollback (manual):
-- REVOKE EXECUTE ON FUNCTION public.is_admin_email_verified(TEXT) FROM authenticated;
-- DROP FUNCTION IF EXISTS public.is_admin_email_verified(TEXT);
-- DROP TABLE IF EXISTS public.admin_email_verifications;
-- DROP TABLE IF EXISTS public.email_verification_tokens;
