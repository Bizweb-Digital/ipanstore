/**
 * Migration Script: Migrate orders.json ke Supabase
 * 
 * Jalankan sekali saja setelah setup Supabase pertama kali:
 *   node migrations/migrate-json-to-supabase.js
 * 
 * Script ini akan:
 * 1. Baca semua orders dari server/orders.json
 * 2. Import ke tabel orders di Supabase
 * 3. Menandai status "SUCCESS" di DOKU sebagai "PAID"
 * 
 * Catatan:
 * - Pastikan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah diisi di server/.env
 * - Pastikan struktur tabel sudah dibuat via supabase_migration.sql
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

// Konfigurasi Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Load orders.json
const ordersJsonPath = path.join(__dirname, '..', 'server', 'orders.json');
let ordersData;

try {
  const content = readFileSync(ordersJsonPath, 'utf-8');
  ordersData = JSON.parse(content);
  console.log(`✅ Loaded ${ordersData.length || 0} orders from orders.json`);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('⚠️  No existing orders.json found. Starting fresh with Supabase.');
    process.exit(0);
  }
  console.error('❌ Error loading orders.json:', error.message);
  process.exit(1);
}

async function migrateOrders() {
  console.log('\n🚀 Starting migration...\n');

  const inserted = [];
  const skipped = [];
  let failedCount = 0;

  for (const order of ordersData) {
    try {
      // Map invoice_number ke format yang lebih modern (misal: IPN-YYYYMMDD-XXXXX)
      // Jika invoice_number sudah dalam format lama, tambahkan prefix
      let invoiceNumber = order.invoice_number || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Cek jika invoice sudah ada di Supabase (untuk hindari duplikat)
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('invoice_number')
        .eq('invoice_number', invoiceNumber)
        .single();

      if (existingOrder) {
        skipped.push(invoiceNumber);
        continue;
      }

      // Determine service_id berdasarkan slug atau nama service
      // Ini butuh mapping manual karena data lama mungkin berbeda dengan structure baru
      // Untuk saat ini, gunakan service_id placeholder (harus diganti nanti)
      
      // Status mapping: SUCCESS dari DOKU → PAID di Supabase
      const statusMapping = {
        'SUCCESS': 'PAID',
        'FAILED': 'EXPIRED',
        'PENDING': 'PENDING',
      };
      const newStatus = statusMapping[order.status?.toUpperCase()] || 'PENDING';

      const orderPayload = {
        invoice_number: invoiceNumber,
        customer_name: order.customer_name || 'Unknown Customer',
        customer_email: order.customer_email || '',
        customer_phone: order.customer_phone || null,
        service_id: order.service_id || '', // TODO: Map ke service_id yang benar
        amount: parseFloat(order.amount) || 0,
        status: newStatus,
        doku_transaction_id: order.doku_transaction_id || null,
        doku_payment_channel: order.payment_channel || null,
        created_at: order.created_at || new Date().toISOString(),
        paid_at: order.paid_at || null,
        completed_at: order.completed_at || null,
        refunded_at: order.refunded_at || null,
        notes: order.notes || null,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select();

      if (error) {
        console.error(`❌ Error inserting order ${invoiceNumber}:`, error.message);
        failedCount++;
        continue;
      }

      inserted.push(invoiceNumber);
    } catch (error) {
      console.error(`❌ Error processing order ${order.invoice_number}:`, error.message);
      failedCount++;
    }
  }

  // Print summary
  console.log('\n✅ Migration Summary:');
  console.log(`   ✓ Inserted: ${inserted.length} orders`);
  console.log(`   ⏭️ Skipped: ${skipped.length} (duplicate invoice numbers)`);
  console.log(`   ❌ Failed: ${failedCount} orders`);

  if (inserted.length > 0) {
    console.log('\n📦 First 5 inserted orders:');
    inserted.slice(0, 5).forEach((inv, idx) => {
      console.log(`   ${idx + 1}. ${inv}`);
    });
  }

  // Create backup of original orders.json
  const backupPath = ordersJsonPath.replace('.json', `.backup.${new Date().toISOString().split('T')[0]}.json`);
  writeFileSync(backupPath, JSON.stringify(ordersData, null, 2));
  console.log(`\n💾 Created backup: ${backupPath}`);

  console.log('\n✨ Migration complete!');
  console.log('   Next step: Update your admin panel and frontend to use Supabase instead of orders.json');
}

// Run migration
migrateOrders().catch(error => {
  console.error('\n💥 Fatal error during migration:', error);
  process.exit(1);
});
