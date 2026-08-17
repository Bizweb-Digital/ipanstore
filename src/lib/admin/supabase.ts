import { createClient } from '@supabase/supabase-js';

// SUPABASE CONFIG - PRODUCTION CREDENTIALS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zpjkroatjmegwnxzvwlw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwamtyb2F0am1lZ3dueHp2d2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjUwODksImV4cCI6MjEwMjU0MTA4OX0.wT12hDD3nmQra1sA-XHst6N7ZvSI3KN6zeLRwAoaOjM';

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
