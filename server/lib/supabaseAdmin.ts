import { createClient } from '@supabase/supabase-js';

// ⚠️ GANTI DENGAN KREDENSIAL SUPABASE ANDA SETELAH MEMBUAT PROJECT
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export type Database = typeof import('../../src/lib/admin/supabase').Database;
