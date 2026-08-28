-- =====================================================
-- STEP 1: DIAGNOSTIK — List semua tabel yang ADA di database
-- Run query ini DULU, lalu copy hasilnya ke saya
-- =====================================================

SELECT 
  t.tablename AS table_name,
  t.tableowner AS owner,
  c.relrowsecurity AS rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE t.schemaname = 'public'
  AND c.relkind = 'r'
ORDER BY t.tablename;
