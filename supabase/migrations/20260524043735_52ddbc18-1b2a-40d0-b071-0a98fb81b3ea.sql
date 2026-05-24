CREATE OR REPLACE FUNCTION public.verify_email_queue_token(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  stored text;
BEGIN
  SELECT decrypted_secret INTO stored
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;
  IF stored IS NULL OR token IS NULL THEN
    RETURN false;
  END IF;
  RETURN stored = token;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_email_queue_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_email_queue_token(text) TO service_role;