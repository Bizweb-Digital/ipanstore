import { useState, useEffect } from 'react';
import { supabase } from '@/lib/admin/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  Wallet,
  Calendar,
  CalendarRange,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface OrderStats {
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  completedOrders: number;
  refundedOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      // Fetch all orders with status filter
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, services(name, slug)')
        .gte('created_at', yearStart.toISOString());

      if (error) throw error;

      const paidOrCompleted = orders?.filter((o) => ['PAID', 'COMPLETED'].includes(o.status)) || [];

      // Calculate revenue
      const totalRevenue = paidOrCompleted.reduce((sum, o) => sum + Number(o.amount), 0);
      const todayRevenue = paidOrCompleted
        .filter((o) => new Date(o.created_at) >= todayStart)
        .reduce((sum, o) => sum + Number(o.amount), 0);
      const weekRevenue = paidOrCompleted
        .filter((o) => new Date(o.created_at) >= weekStart)
        .reduce((sum, o) => sum + Number(o.amount), 0);
      const monthRevenue = paidOrCompleted
        .filter((o) => new Date(o.created_at) >= monthStart)
        .reduce((sum, o) => sum + Number(o.amount), 0);
      const yearRevenue = paidOrCompleted
        .filter((o) => new Date(o.created_at) >= yearStart)
        .reduce((sum, o) => sum + Number(o.amount), 0);

      // Count by status
      const pendingOrders = orders?.filter((o) => o.status === 'PENDING').length || 0;
      const paidOrders = orders?.filter((o) => o.status === 'PAID').length || 0;
      const completedOrders = orders?.filter((o) => o.status === 'COMPLETED').length || 0;
      const refundedOrders = orders?.filter((o) => o.status === 'REFUNDED').length || 0;

      setStats({
        totalRevenue,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        yearRevenue,
        totalOrders: orders?.length || 0,
        pendingOrders,
        paidOrders,
        completedOrders,
        refundedOrders,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    color = 'primary',
  }: {
    title: string;
    value: string | number;
    icon: any;
    description?: string;
    color?: string;
  }) => (
    <Card className="bg-card border-white/10 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview bisnis IPAN STORE
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>
              {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}
            </p>
          </div>
        </div>

        {/* Revenue Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pendapatan Hari Ini"
            value={stats?.todayRevenue ? formatCurrency(stats.todayRevenue) : 'Rp 0'}
            icon={Calendar}
            description="Dari order yang sudah dibayar"
          />
          <StatCard
            title="Pendapatan Minggu Ini"
            value={stats?.weekRevenue ? formatCurrency(stats.weekRevenue) : 'Rp 0'}
            icon={CalendarRange}
            description="7 hari terakhir"
          />
          <StatCard
            title="Pendapatan Bulan Ini"
            value={stats?.monthRevenue ? formatCurrency(stats.monthRevenue) : 'Rp 0'}
            icon={TrendingUp}
            description={`Bulan ${format(new Date(), 'MMMM yyyy', { locale: id })}`}
          />
          <StatCard
            title="Pendapatan Tahun Ini"
            value={stats?.yearRevenue ? formatCurrency(stats.yearRevenue) : 'Rp 0'}
            icon={Wallet}
            description="Total semua tahun berjalan"
          />
        </div>

        {/* Order Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon={ShoppingBag}
            description="Semua order tahun ini"
          />
          <StatCard
            title="Pending"
            value={stats?.pendingOrders || 0}
            icon={Clock}
            description="Menunggu pembayaran"
            color="warning"
          />
          <StatCard
            title="Paid"
            value={stats?.paidOrders || 0}
            icon={CheckCircle2}
            description="Sudah dibayar"
            color="success"
          />
          <StatCard
            title="Refunded"
            value={stats?.refundedOrders || 0}
            icon={XCircle}
            description="Order dibatalkan"
            color="danger"
          />
        </div>

        {/* Quick Actions & Recent Orders will be added here */}
        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle>Selamat Datang di Admin Panel IPAN STORE</CardTitle>
            <CardDescription>
              Gunakan menu di sidebar untuk mengelola orders, services, testimonials, dan FAQ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h3 className="font-medium mb-2">Kelola Orders</h3>
                <p className="text-sm text-muted-foreground">
                  Lihat riwayat penjualan, update status, dan kelola pembayaran customer.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h3 className="font-medium mb-2">Kelola Services</h3>
                <p className="text-sm text-muted-foreground">
                  Tambah, edit, atau nonaktifkan layanan yang ditampilkan di homepage.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h3 className="font-medium mb-2">Kelola Testimoni</h3>
                <p className="text-sm text-muted-foreground">
                  Approve atau edit testimoni customer sebelum ditampilkan di website.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
