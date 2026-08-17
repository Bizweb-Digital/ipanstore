import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Loader2,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Calendar,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/admin/supabase';
import { Order, useOrders } from '@/hooks/useOrders';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'EXPIRED', label: 'Expired' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Tanggal Order' },
  { value: 'amount', label: 'Jumlah' },
  { value: 'invoice_number', label: 'Invoice Number' },
];

const ITEMS_PER_PAGE = 10;

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const { orders, total, loading, error, refetch } = useOrders({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search,
    sortBy: sortBy as 'created_at' | 'amount' | 'invoice_number',
    sortOrder,
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  });

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, sortBy, sortOrder]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh orders
      await refetch();
      
      // Close detail modal if open
      if (selectedOrder?.id === orderId) {
        setShowDetail(false);
      }
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert('Gagal update status: ' + error.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getPaymentChannel = (channel: string | null) => {
    if (!channel) return 'N/A';
    return channel.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Kelola riwayat penjualan dan status order
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters & Search */}
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filter & Cari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Cari Invoice/Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Invoice atau nama customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <Label htmlFor="sort">Urutkan</Label>
                <div className="flex gap-2">
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-20"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Daftar Order ({total})
            </CardTitle>
            <CardDescription>
              Klik pada baris untuk melihat detail lengkap
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !orders.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Error: {error}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada order yang ditemukan.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Layanan</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetail(true);
                          }}
                        >
                          <TableCell className="font-mono text-sm">
                            {order.invoice_number}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{order.services?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{order.services?.slug || '-'}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">{formatCurrency(order.amount)}</p>
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Quick actions based on status
                                  if (order.status === 'PENDING') {
                                    handleStatusUpdate(order.id, 'PAID');
                                  } else if (order.status === 'PAID') {
                                    handleStatusUpdate(order.id, 'COMPLETED');
                                  }
                                }}
                                disabled={updatingStatus === order.id}
                              >
                                {updatingStatus === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : order.status === 'PENDING' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : order.status === 'PAID' ? (
                                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Halaman {page} dari {totalPages} ({total} total order)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="text-sm font-medium">
                        {page} / {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Order #{selectedOrder?.invoice_number}</DialogTitle>
              <DialogDescription>
                Informasi lengkap order dan pembayaran
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Status Section */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Status Order</h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Number</span>
                      <span className="font-mono">{selectedOrder.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal Order</span>
                      <span>{format(new Date(selectedOrder.created_at), 'EEEE, dd MMMM yyyy HH:mm:ss', { locale: id })}</span>
                    </div>
                    {selectedOrder.paid_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tanggal Bayar</span>
                        <span>{format(new Date(selectedOrder.paid_at), 'EEEE, dd MMMM yyyy HH:mm:ss', { locale: id })}</span>
                      </div>
                    )}
                    {selectedOrder.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tanggal Selesai</span>
                        <span>{format(new Date(selectedOrder.completed_at), 'EEEE, dd MMMM yyyy HH:mm:ss', { locale: id })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Section */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedOrder.customer_email}</span>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedOrder.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service & Payment Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Layanan
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nama</span>
                        <span>{selectedOrder.services?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Slug</span>
                        <span className="font-mono">{selectedOrder.services?.slug || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga</span>
                        <span className="font-semibold">{formatCurrency(selectedOrder.amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Pembayaran
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jumlah</span>
                        <span className="font-semibold">{formatCurrency(selectedOrder.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DOKU Transaction ID</span>
                        <span className="font-mono text-xs">{selectedOrder.doku_transaction_id || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Channel</span>
                        <span>{getPaymentChannel(selectedOrder.doku_payment_channel)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Status */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Produk
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={selectedOrder.email_sent ? 'text-green-500' : 'text-yellow-500'}>
                        {selectedOrder.email_sent ? 'Terkirim' : 'Belum Dikirim'}
                      </span>
                    </div>
                    {selectedOrder.email_sent_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Waktu Kirim</span>
                        <span>{format(new Date(selectedOrder.email_sent_at), 'EEEE, dd MMMM yyyy HH:mm:ss', { locale: id })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Webhook Payload */}
                {selectedOrder.webhook_payload && (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="font-semibold mb-3">Webhook Payload (DOKU)</h3>
                    <pre className="text-xs bg-black/20 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedOrder.webhook_payload, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Admin Notes */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-semibold mb-3">Catatan Admin</h3>
                  <textarea
                    className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Tambah catatan untuk order ini..."
                    value={selectedOrder.notes || ''}
                    onChange={(e) => {
                      // Update notes in real-time
                      // Note: This is a simplified implementation
                      // In production, you'd want to debounce this
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {selectedOrder.status === 'PENDING' && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleStatusUpdate(selectedOrder.id, 'PAID');
                      }}
                      disabled={updatingStatus === selectedOrder.id}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Tandai PAID
                    </Button>
                  )}
                  {selectedOrder.status === 'PAID' && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleStatusUpdate(selectedOrder.id, 'COMPLETED');
                      }}
                      disabled={updatingStatus === selectedOrder.id}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Tandai COMPLETED
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowDetail(false)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}