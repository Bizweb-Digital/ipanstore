// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Service Hooks
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/admin/supabase';

export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setServices(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  const refetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateService = async (
    id: string | undefined,
    data: Omit<Service, 'id' | 'created_at' | 'updated_at'>
  ) => {
    if (id) {
      const { error } = await supabase
        .from('services')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      return { error };
    } else {
      const { error } = await supabase
        .from('services')
        .insert({ ...data });
      return { error };
    }
  };

  const deleteService = async (id: string) => {
    // Soft delete: just set is_active = false
    // Don't actually delete to preserve order references
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);
    return { error };
  };

  return { services, loading, error, refetch, updateService, deleteService };
}

// Hook untuk ambil service by ID
export function useService(id?: string) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setService(null);
      return;
    }

    async function fetchService() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setService(data);
      } catch (err: any) {
        setError(err.message);
        console.error(`Failed to fetch service ${id}:`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [id]);

  return { service, loading, error };
}
