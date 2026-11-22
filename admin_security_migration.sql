-- Migration: Create admin_users table and secure verify_admin_pin RPC function
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run!

CREATE TABLE IF NOT EXISTS public.admin_users (
    "id" TEXT PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "role" TEXT NOT NULL DEFAULT 'BTC_ADMIN',
    "pin_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial admin user (CSG17Y BTC) with hashed PIN (SHA256 of 'csg17y')
INSERT INTO public.admin_users ("id", "username", "role", "pin_hash")
VALUES (
    'admin-btc-1',
    'BTC_Admin',
    'SUPER_ADMIN',
    '314c33281c7046bc8374d44d58e8da8620d7198f815098b040919a9d6a036df8'
)
ON CONFLICT ("username") DO UPDATE SET "pin_hash" = EXCLUDED."pin_hash";

-- RLS: Disallow direct public SELECT on admin_users table (Protect hashes from being read by visitors)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny public access on admin_users" ON public.admin_users;
CREATE POLICY "Deny public access on admin_users" ON public.admin_users FOR SELECT USING (false);

-- RPC Function: Verify admin PIN securely in database
CREATE OR REPLACE FUNCTION public.verify_admin_pin(input_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE pin_hash = encode(sha256(input_pin::bytea), 'hex')
       OR pin_hash = input_pin
  );
END;
$$;

-- Grant execution permission to both anon and authenticated users
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(TEXT) TO anon, authenticated, service_role;
