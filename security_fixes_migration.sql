-- CSG 17Y Security Hardening Migration
-- Run this script in Supabase Dashboard -> SQL Editor -> New Query -> Run!

-- 1. FIX STORAGE PERMISSIONS: Disallow public overwrites on payment receipts
DROP POLICY IF EXISTS "Allow public update in receipts" ON storage.objects;

-- 2. SECURE ADMIN PIN RPC FUNCTION: Revoke direct anon execution to prevent brute-force attacks
REVOKE EXECUTE ON FUNCTION public.verify_admin_pin(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(TEXT) TO service_role;
ALTER FUNCTION public.verify_admin_pin(TEXT) SET search_path = public, pg_temp;

-- 3. SECURE OTHER SECURITY DEFINER & SEARCH PATH FUNCTIONS
ALTER FUNCTION public.search_members(TEXT, INTEGER) SET search_path = public, pg_temp;

-- 4. CAP INCREMENT HEARTS TO PREVENT SPAM (MAX 5 HEARTS PER CALL)
-- Drop existing function first to prevent ERROR 42P13 (cannot remove parameter defaults)
DROP FUNCTION IF EXISTS public.increment_hearts(text, integer);

CREATE OR REPLACE FUNCTION public.increment_hearts(target_id text, amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_count integer := 0;
  safe_amount integer := LEAST(GREATEST(COALESCE(amount, 1), 1), 5);
BEGIN
  -- Try updating characters table first
  UPDATE public.characters 
  SET hearts = COALESCE(hearts, 0) + safe_amount 
  WHERE id = target_id
  RETURNING hearts INTO new_count;
  
  IF FOUND THEN
    RETURN new_count;
  END IF;

  -- If not in characters, try wishes table
  UPDATE public.wishes 
  SET hearts = COALESCE(hearts, 0) + safe_amount 
  WHERE id = target_id OR ('char-w-' || id) = target_id
  RETURNING hearts INTO new_count;

  IF FOUND THEN
    RETURN new_count;
  END IF;

  RETURN 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_hearts(text, integer) TO anon, authenticated, service_role;
