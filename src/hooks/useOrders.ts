// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Order Hooks
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/admin/supabase';

export interface Order {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  service_id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'REFUNDED' | 'EXPIRED';
  doku_transaction_id: string | null;
  doku_payment_channel: string | null;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  refunded_at: string | null;
  notes: string | null;
  webhook_payload: Record<string, any> | null;
  email_sent: boolean;
  email_sent_at: string | null;
  services?: { name: string | null; slug: string | null } | null;
}

export function useOrders(filters?: {
  status?: string;
  search?: string;
  sortBy?: 'created_at' | 'amount' | 'invoice_number';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref agar refetch() selalu memakai nilai filters terbaru
  // tanpa memicu re-fetch loop pada setiap render (object filters
  // dibuat baru tiap render oleh caller, sehingga dependency
  // [filters] sebelumnya menyebabkan infinite fetch/loading).
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  async function fetchOrders(currentFilters?: typeof filters) {
    const f = currentFilters ?? filtersRef.current;

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('orders').select('*, services(name, slug)', { count: 'exact' });

      // Apply filters
      if (f?.status) {
        query = query.eq('status', f.status);
      }
      if (f?.search) {
        query = query.or(
          `invoice_number.ilike.%${f.search}%,customer_name.ilike.%${f.search}%`
        );
      }

      // Sorting
      const sortBy = f?.sortBy || 'created_at';
      const sortOrder = f?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination (offset 0 = halaman pertama, tetap valid)
      if (f?.limit != null && f?.offset != null) {
        query = query.range(f.offset, f.offset + f.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setOrders((data as Order[]) || []);
      setTotal(count || 0);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.status,
    filters?.search,
    filters?.sortBy,
    filters?.sortOrder,
    filters?.limit,
    filters?.offset,
  ]);

  const refetch = async () => {
    await fetchOrders();
  };

  return { orders, total, loading, error, refetch };
}

// Hook untuk ambil single order by invoice number
export function useOrder(invoiceNumber?: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceNumber) {
      setOrder(null);
      return;
    }

    async function fetchOrder() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('invoice_number', invoiceNumber)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
        console.error(`Failed to fetch order ${invoiceNumber}:`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [invoiceNumber]);

  return { order, loading, error };
}
