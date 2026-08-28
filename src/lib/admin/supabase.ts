import { createClient } from '@supabase/supabase-js';

// SECURITY FIX #3: Hardcoded production credentials dihapus.
// Env vars WAJIB diisi di .env / Vite — tidak ada fallback di code.
// Kalau hilang, client dibuat dengan nilai kosong → semua query akan error
// dengan pesan jelas, memaksa developer konfigurasi dengan benar.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[IPAN STORE] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tidak diisi di .env. ' +
      'Pastikan kedua variabel ada sebelum menjalankan aplikasi.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function untuk resolve service id dari name
export async function getServiceIdByName(name: string) {
  if (!name) return null;
  
  const { data, error } = await supabase
    .from('services')
    .select('id')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();
  
  if (error || !data) return null;
  return data.id;
}

export type Database = {
  public: {
    Tables: {
      admin_users: {
        row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      faqs: {
        row: {
          id: string;
          question: string;
          answer: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        row: {
          id: string;
          invoice_number: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          service_id: string;
          amount: number;
          status: string;
          doku_transaction_id: string | null;
          doku_payment_channel: string | null;
          created_at: string;
          paid_at: string | null;
          completed_at: string | null;
          refunded_at: string | null;
          notes: string | null;
          webhook_payload: Record<string, unknown> | null;
          email_sent: boolean;
          email_sent_at: string | null;
          settinx_license_uid: string | null;
          settinx_license_error: string | null;
          promo_code: string | null;
          discount_amount: number;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          service_id: string;
          amount: number;
          status: string;
          doku_transaction_id?: string | null;
          doku_payment_channel?: string | null;
          created_at?: string;
          paid_at?: string | null;
          completed_at?: string | null;
          refunded_at?: string | null;
          notes?: string | null;
          webhook_payload?: Record<string, unknown> | null;
          email_sent?: boolean;
          email_sent_at?: string | null;
          settinx_license_uid?: string | null;
          settinx_license_error?: string | null;
          promo_code?: string | null;
          discount_amount?: number;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          service_id?: string;
          amount?: number;
          status?: string;
          doku_transaction_id?: string | null;
          doku_payment_channel?: string | null;
          created_at?: string;
          paid_at?: string | null;
          completed_at?: string | null;
          refunded_at?: string | null;
          notes?: string | null;
          webhook_payload?: Record<string, unknown> | null;
          email_sent?: boolean;
          email_sent_at?: string | null;
          settinx_license_uid?: string | null;
          settinx_license_error?: string | null;
          promo_code?: string | null;
          discount_amount?: number;
        };
      };
      promo_codes: {
        row: {
          id: string;
          code: string;
          type: 'percent' | 'fixed';
          value: number;
          max_uses: number | null;
          used_count: number;
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          type?: 'percent' | 'fixed';
          value?: number;
          max_uses?: number | null;
          used_count?: number;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          type?: 'percent' | 'fixed';
          value?: number;
          max_uses?: number | null;
          used_count?: number;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          price: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      testimonials: {
        row: {
          id: string;
          name: string;
          rating: number;
          message: string;
          image_url: string | null;
          service_id: string | null;
          testimonial_id: string | null; // Reference ke testimonial_parent untuk review produk
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rating: number;
          message: string;
          image_url?: string | null;
          service_id?: string | null;
          testimonial_id?: string | null;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rating?: number;
          message?: string;
          image_url?: string | null;
          service_id?: string | null;
          testimonial_id?: string | null;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
