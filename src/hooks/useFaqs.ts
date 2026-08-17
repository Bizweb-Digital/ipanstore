// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - FAQ Hooks
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/admin/supabase';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useFaqs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setFaqs(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to fetch FAQs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFaqs();
  }, []);

  return { faqs, loading, error };
}

// Hook untuk CRUD FAQs (admin only)
export function useManageFaqs() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function create(faq: Partial<FAQ>) {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('faqs')
        .insert(faq)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function update(id: string, updates: Partial<FAQ>) {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('faqs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function remove(id: string) {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('faqs')
        .update({ is_active: active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { create, update, remove, toggleActive, isSubmitting };
}
