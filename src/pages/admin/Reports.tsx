import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, DollarSign, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AdminReports() {
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | '30d' | '7d'>('all');

  // Fetch orders from beginning of time
  const { orders, total, loading, error } = useOrders({ limit: 99999 });

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.created_at);
    const now = new Date();
    
    if (selectedDateRange === 'all') return true;
    if (selectedDateRange === '30d') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return orderDate >= thirtyDaysAgo;
    }
    if (selectedDateRange === '7d') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return orderDate >= sevenDaysAgo;
    }
    return true;
  });

  const calculateRevenue = () => {
    return filteredOrders
      .filter((o) => ['PAID', 'COMPLETED'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.amount), 0);
  };

  const calculatePendingRevenue = () => {
    return filteredOrders
      .filter((o) => o.status === 'PENDING')
      .reduce((sum, o) => sum + Number(o.amount), 0);
  };

  const revenue = calculateRevenue();
  const pendingRevenue = calculatePendingRevenue();

  const getTotalOrders = () => {
    return filteredOrders.length;
  };

  const getCompletedOrders = () => {
    return filteredOrders.filter((o) => o.status === 'COMPLETED').length;
  };

  const getPaidOrders = () => {
    return filteredOrders.filter((o) => o.status === 'PAID').length;
  };

  const getPendingOrders = () => {
    return filteredOrders.filter((o) => o.status === 'PENDING').length;
  };

  const exportToCSV = () => {
    // CSV headers
    const headers = [
      'Invoice Number',
      'Customer Name',
      'Customer Email',
      'Service Name',
      'Status',
      'Amount',
      'Created At',
      'Paid At',
      'Payment Channel',
    ];

    // CSV rows
    const rows = filteredOrders.map((order) => [
      order.invoice_number,
      order.customer_name,
      order.customer_email,
      order.services?.name || 'Unknown',
      order.status,
      order.amount,
      format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss'),
      order.paid_at ? format(new Date(order.paid_at), 'yyyy-MM-dd HH:mm:ss') : '',
      order.doku_payment_channel || '',
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `ipanstore-reports-${format(new Date(), 'yyyyMMdd-HHmmss', { locale: id })}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Export ${filteredOrders.length} records berhasil!`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Laporan penjualan dan analytics bisnis IPAN STORE
            </p>
          </div>
          <Button onClick={exportToCSV} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV ({filteredOrders.length})
          </Button>
        </div>

        {/* Date Range Selector */}
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filter Periode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={selectedDateRange === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedDateRange('all')}
              >
                Semua Data
              </Button>
              <Button
                variant={selectedDateRange === '30d' ? 'default' : 'outline'}
                onClick={() => setSelectedDateRange('30d')}
              >
                30 Hari Terakhir
              </Button>
              <Button
                variant={selectedDateRange === '7d' ? 'default' : 'outline'}
                onClick={() => setSelectedDateRange('7d')}
              >
                7 Hari Terakhir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-white/10 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Pendapatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                Rp{' '}
                {new Intl.NumberFormat('id-ID', {
                  maximumFractionDigits: 0,
                }).format(revenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dari {getPaidOrders()} order paid + completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/10 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pending Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                Rp{' '}
                {new Intl.NumberFormat('id-ID', {
                  maximumFractionDigits: 0,
                }).format(pendingRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dari {getPendingOrders()} order pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/10 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {getTotalOrders()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Semua periode yang dipilih
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-white/10 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {getCompletedOrders()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Order selesai diproses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Detail Laporan Orders
            </CardTitle>
            <CardDescription>
              Informasi lengkap semua order berdasarkan periode yang dipilih
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !orders.length ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Error: {error}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada data untuk periode ini.</p>
              </div>
            ) : (
              <>
                {/* Summary Table */}
                <div className="rounded-md border border-white/10 overflow-hidden mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-3">Field</th>
                        <th className="text-right p-3">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-white/10">
                        <td className="p-3">Total Orders</td>
                        <td className="p-3 text-right font-semibold">{getTotalOrders()}</td>
                      </tr>
                      <tr className="border-t border-white/10 bg-white/5">
                        <td className="p-3">Revenue Paid & Completed</td>
                        <td className="p-3 text-right font-semibold text-green-500">
                          Rp{' '}
                          {new Intl.NumberFormat('id-ID', {
                            maximumFractionDigits: 0,
                          }).format(revenue)}
                        </td>
                      </tr>
                      <tr className="border-t border-white/10">
                        <td className="p-3">Pending Orders</td>
                        <td className="p-3 text-right font-semibold text-yellow-500">
                          {getPendingOrders()}
                        </td>
                      </tr>
                      <tr className="border-t border-white/10 bg-white/5">
                        <td className="p-3">Pending Revenue</td>
                        <td className="p-3 text-right font-semibold text-yellow-500">
                          Rp{' '}
                          {new Intl.NumberFormat('id-ID', {
                            maximumFractionDigits: 0,
                          }).format(pendingRevenue)}
                        </td>
                      </tr>
                      <tr className="border-t border-white/10">
                        <td className="p-3">Completed Orders</td>
                        <td className="p-3 text-right font-semibold text-blue-500">
                          {getCompletedOrders()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Breakdown by Status */}
                <h3 className="font-semibold mb-3">Breakdown by Status:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Pending</span>
                      <Clock className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">{getPendingOrders()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rp{' '}
                      {new Intl.NumberFormat('id-ID', {
                        maximumFractionDigits: 0,
                      }).format(
                        filteredOrders
                          .filter((o) => o.status === 'PENDING')
                          .reduce((sum, o) => sum + Number(o.amount), 0)
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Paid</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-500">{getPaidOrders()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rp{' '}
                      {new Intl.NumberFormat('id-ID', {
                        maximumFractionDigits: 0,
                      }).format(
                        filteredOrders
                          .filter((o) => o.status === 'PAID')
                          .reduce((sum, o) => sum + Number(o.amount), 0)
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Completed</span>
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-500">{getCompletedOrders()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rp{' '}
                      {new Intl.NumberFormat('id-ID', {
                        maximumFractionDigits: 0,
                      }).format(
                        filteredOrders
                          .filter((o) => o.status === 'COMPLETED')
                          .reduce((sum, o) => sum + Number(o.amount), 0)
                      )}
                    </p>
                  </div>
                </div>

                {/* Full Order Details */}
                <h3 className="font-semibold mb-3">Semua Orders ({filteredOrders.length}):</h3>
                <div className="rounded-md border border-white/10 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 sticky top-0 z-10">
                      <tr>
                        <th className="text-left p-3 whitespace-nowrap">Invoice</th>
                        <th className="text-left p-3 whitespace-nowrap">Customer</th>
                        <th className="text-left p-3 whitespace-nowrap">Layanan</th>
                        <th className="text-right p-3 whitespace-nowrap">Jumlah</th>
                        <th className="text-center p-3 whitespace-nowrap">Status</th>
                        <th className="text-left p-3 whitespace-nowrap">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-t border-white/10 hover:bg-white/5">
                          <td className="p-3 font-mono text-xs">{order.invoice_number}</td>
                          <td className="p-3">
                            <div className="max-w-[200px] truncate" title={order.customer_name}>
                              {order.customer_name}
                            </div>
                            <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                              {order.customer_email}
                            </div>
                          </td>
                          <td className="p-3">{order.services?.name || 'Unknown'}</td>
                          <td className="p-3 text-right font-semibold">
                            Rp{' '}
                            {new Intl.NumberFormat('id-ID', {
                              maximumFractionDigits: 0,
                            }).format(order.amount)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'COMPLETED'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : order.status === 'PAID'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : order.status === 'PENDING'
                                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}