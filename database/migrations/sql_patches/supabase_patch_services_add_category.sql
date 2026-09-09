-- =====================================================
-- IPAN STORE — Services schema: tambah kolom `category` (idempotent)
-- ----------------------------------------------------
-- Tujuan:
--   1. Tambah kolom `category TEXT` ke tabel services (closed-list, NOT NULL).
--   2. Backfill nilai untuk baris existing berdasarkan slug-derived logic.
--   3. Pasang CHECK constraint supaya typo kategori gagal di DB layer.
--   4. Index untuk percepat filter by category WHERE is_active = true.
--
-- CARA PAKAI:
--   - Buka https://supabase.com/dashboard/project/zpjkroatjmegwnxzvwlw/sql/new
--   - Tempel script ini → Run
--   - Aman dijalankan berulang (semua ALTER/ADD pakai IF EXISTS / DO block cek).
-- =====================================================

-- ── 1. Tambah kolom category kalau belum ada ────────────────────────────
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category TEXT;

-- ── 2. Backfill baris lama dari slug (sinkron dengan deriveCategory() di lib/services.ts) ─
UPDATE public.services
SET category = CASE
  WHEN slug ILIKE '%anti-cheat%' OR slug ILIKE '%anticheat%' THEN 'Anti Cheat'
  WHEN slug ILIKE '%settinx%'                                  THEN 'APP SETTINX'
  WHEN slug ILIKE '%set-pc%' 
    OR slug ILIKE '%custom-ff%'
    OR slug ILIKE '%emulator%'                                 THEN 'SET PC'
  ELSE 'Optimize'
END
WHERE category IS NULL;

-- ── 3. Wajibkan isi + default Optimize untuk INSERT baru ─────────────────
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.services ALTER COLUMN category SET DEFAULT 'Optimize';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Default sudah ada atau gagal diubah: %', SQLERRM;
  END;

  -- Hanya set NOT NULL jika tidak ada NULL tersisa
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE category IS NULL) THEN
    BEGIN
      ALTER TABLE public.services ALTER COLUMN category SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Gagal set NOT NULL: %', SQLERRM;
    END;
  ELSE
    RAISE WARNING '⚠️ Masih ada baris dengan category NULL — NOT NULL tidak dipasang.';
  END IF;
END $$;

-- ── 4. Check constraint closed-list kategori valid ───────────────────────
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_category_check;
    ALTER TABLE public.services ADD CONSTRAINT services_category_check
      CHECK (category IN ('Optimize', 'SET PC', 'Anti Cheat', 'APP SETTINX'));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '⚠️ Gagal pasang check constraint: %', SQLERRM;
  END;
END $$;

-- ── 5. Index untuk filter kategori aktif ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_services_category_active
ON public.services(category)
WHERE is_active = true;

-- ── 6. RLS — JANGAN ubah policy yang ada; pastikan admin masih punya akses ─
-- (patch supabase_patch_services_rls_audit.sql sebelumnya sudah rebuild
-- policy `admin_can_manage_services FOR ALL`, jadi INSERT/UPDATE/DELETE
-- akan menyertakan kolom category juga tanpa tambahan apa-apa.)

-- ── 7. Audit hasil ───────────────────────────────────────────────────────
SELECT 'AFTER MIGRATION' AS stage,
       category,
       COUNT(*) AS row_count,
       BOOL_AND(is_active) AS all_active,
       ARRAY_AGG(slug ORDER BY created_at DESC) AS slugs_in_cat
FROM public.services
GROUP BY category
ORDER BY category;
