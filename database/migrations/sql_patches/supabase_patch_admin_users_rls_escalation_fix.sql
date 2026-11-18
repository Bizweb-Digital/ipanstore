-- ============================================================================
-- IPAN STORE — PERBAIKAN RLS admin_users (IDEMPOTENT)
-- ----------------------------------------------------------------------------
-- MASALAH:
--   public.is_admin() adalah SECURITY DEFINER (bypass RLS) dan HANYA memeriksa
--   "email terdaftar di admin_users" TANPA memeriksa kolom `role`.
--   Policy admin_insert / admin_update / admin_delete memakai is_admin(),
--   sehingga akun ber-role `viewer` bisa menaikkan dirinya sendiri jadi
--   `super_admin`  ->  eskalasi hak akses.
--
-- YANG DILAKUKAN:
--   1. is_admin()       : tambah cek role (viewer & super_admin = admin aktif)
--   2. is_super_admin() : fungsi baru, HANYA super_admin
--   3. Policy tulis admin_users (INSERT/UPDATE/DELETE) jadi super_admin saja.
--      Policy baca (admin_select, admin_select_self, service_role_manage)
--      DIBIARKAN apa adanya.
--
-- CATATAN: body fungsi memakai SINGLE QUOTE (bukan $f$) karena SQL Editor
--   Supabase memecah dollar-quote sehingga muncul syntax error at "SELECT".
--
-- CARA PAKAI: SQL Editor -> New query -> Ctrl+A -> Delete -> Ctrl+V -> Run
-- Aman dijalankan berulang kali (idempotent).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS '
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE lower(email) = lower(check_email)
      AND coalesce(role, ''super_admin'') IN (''super_admin'', ''viewer'')
  );
';

CREATE OR REPLACE FUNCTION public.is_super_admin(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS '
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE lower(email) = lower(check_email)
      AND coalesce(role, ''super_admin'') = ''super_admin''
  );
';

DROP POLICY IF EXISTS "admin_insert"       ON public.admin_users;
DROP POLICY IF EXISTS "admin_update"       ON public.admin_users;
DROP POLICY IF EXISTS "admin_delete"       ON public.admin_users;
DROP POLICY IF EXISTS "super_admin_insert" ON public.admin_users;
DROP POLICY IF EXISTS "super_admin_update" ON public.admin_users;
DROP POLICY IF EXISTS "super_admin_delete" ON public.admin_users;

CREATE POLICY "super_admin_insert" ON public.admin_users
  FOR INSERT TO public
  WITH CHECK (public.is_super_admin(auth.email()));

CREATE POLICY "super_admin_update" ON public.admin_users
  FOR UPDATE TO public
  USING (public.is_super_admin(auth.email()))
  WITH CHECK (public.is_super_admin(auth.email()));

CREATE POLICY "super_admin_delete" ON public.admin_users
  FOR DELETE TO public
  USING (public.is_super_admin(auth.email()));

COMMIT;
