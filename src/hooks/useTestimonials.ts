// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Testimonial Hooks
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/admin/supabase';

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  message: string;
  service_id: string | null;
  testimonial_id: string | null; // Review of specific product/service
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export function useTestimonials(serviceId?: string) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        let query = supabase.from('testimonials').select('*');
        
        if (serviceId) {
          query = query.eq('service_id', serviceId).eq('is_approved', true);
        } else {
          query = query.eq('is_approved', true);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        if (error) throw error;
        setTestimonials(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to fetch testimonials:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, [serviceId]);

  return { testimonials, loading, error };
}

// Hook untuk create/update/delete testimonial (admin only)
export function useManageTestimonials() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function approve(id: string) {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('testimonials')
        .update({ is_approved: true })
        .eq('id', id);
      
      if (error) throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function reject(id: string) {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('testimonials')
        .update({ is_approved: false })
        .eq('id', id);
      
      if (error) throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function remove(id: string) {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { approve, reject, remove, isSubmitting };
}
