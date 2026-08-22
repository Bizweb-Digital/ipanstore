import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/admin/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp, Wallet, ShoppingBag, Clock, CheckCircle2, XCircle,
  Loader2, Activity, ArrowRight, Percent, ReceiptText,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Bar, BarChart, Cell, Pie, PieChart, Legend,
} from 'recharts';

type OrderRow = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  services?: { name: string | null; slug: string | null } | null;
};

const ALL_STATUSES = ['PENDING', 'PAID', 'COMPLETED', 'REFUNDED', 'EXPIRED'] as const;

async function fetchStats() {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  const { count: converted } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['PAID', 'COMPLETED']);
  const { data: revenueRows, error: revErr } = await supabase
    .from('orders')
    .select('amount, status, created_at, paid_at, services(name)')
    .in('status', ['PAID', 'COMPLETED']);
  if (revErr) throw revErr;
  return {
    totalOrders: count || 0,
    convertedCount: converted || 0,
    paidRows: (revenueRows || []).map((r) => ({
      amount: Number(r.amount),
      date: new Date(r.paid_at || r.created_at),
      serviceName: r.services?.name || null,
    })),
  };
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  PAID: '#22c55e',
  COMPLETED: '#3b82f6',
  REFUNDED: '#ef4444',
  EXPIRED: '#a1a1aa',
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, convertedCount: 0, paidRows: [] as { amount: number; date: Date; serviceName: string | null }[] });
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const fetchAll = useCallback(async () => {
    const [statsRes] = await Promise.all([
      fetchStats().catch((e) => {
        console.error('Failed to fetch stats:', e);
        return null;
      }),
    ]);
    if (statsRes) setStats(statsRes);

    const { data, error } = await supabase
      .from('orders')
      .select('id, invoice_number, customer_name, customer_email, amount, status, created_at, paid_at, services(name, slug)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      console.error('Failed to fetch orders:', error);
    } else {
      setOrders((data as OrderRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('admin-dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        setLive(true);
        fetchAll();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const paidOrCompleted = stats.paidRows;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const revenueOf = (from: Date) =>
    paidOrCompleted.filter((o) => o.date >= from)
      .reduce((s, o) => s + o.amount, 0);

  const countBy = (status: string) => orders.filter((o) => o.status === status).length;

  // Revenue trend last 30 days
  const TREND_DAYS = 30;
  const trendData = Array.from({ length: TREND_DAYS }).map((_, i) => {
    const day = new Date(now); day.setDate(now.getDate() - (TREND_DAYS - 1 - i));
    const key = format(day, 'yyyy-MM-dd');
    const sum = paidOrCompleted
      .filter((o) => format(o.date, 'yyyy-MM-dd') === key)
      .reduce((s, o) => s + o.amount, 0);
    return { date: format(day, 'dd MMM'), revenue: sum };
  });

  const statusData = ALL_STATUSES
    .map((s) => ({ status: s, count: countBy(s) }))
    .filter((d) => d.count > 0);

  const serviceAgg: Record<string, number> = {};
  paidOrCompleted.forEach((o) => {
    const name = o.serviceName || 'Unknown';
    serviceAgg[name] = (serviceAgg[name] || 0) + Number(o.amount);
  });
  const serviceData = Object.entries(serviceAgg)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // AOV (rata-rata nilai order yang terbayar) + konversi PENDING → PAID
  const aov = paidOrCompleted.length > 0
    ? paidOrCompleted.reduce((s, o) => s + o.amount, 0) / paidOrCompleted.length
    : 0;
  const conversionRate = stats.totalOrders > 0 ? Math.round((stats.convertedCount / stats.totalOrders) * 100) : 0;
  const totalRevenue = paidOrCompleted.reduce((s, o) => s + o.amount, 0);

  const PIE_COLORS = ['#22c55e', '#3b82f6', '#a78bfa', '#f59e0b', '#ec4899'];

  const recent = orders.slice(0, 6);

  const kpis = [
    { label: 'Pendapatan Hari Ini', value: formatCurrency(revenueOf(startOfToday)), icon: Wallet, color: '#22c55e' },
    { label: 'Pendapatan 7 Hari', value: formatCurrency(revenueOf(startOfWeek)), icon: TrendingUp, color: '#3b82f6' },
    { label: 'Pendapatan Bulan Ini', value: formatCurrency(revenueOf(startOfMonth)), icon: Activity, color: '#a78bfa' },
    { label: 'Total Order', value: String(stats.totalOrders), icon: ShoppingBag, color: '#f59e0b' },
  ];

  const statusKpis = [
    { label: 'Pending', value: countBy('PENDING'), icon: Clock, color: '#f59e0b' },
    { label: 'Paid', value: countBy('PAID'), icon: CheckCircle2, color: '#22c55e' },
    { label: 'Completed', value: countBy('COMPLETED'), icon: CheckCircle2, color: '#3b82f6' },
    { label: 'Refunded', value: countBy('REFUNDED'), icon: XCircle, color: '#ef4444' },
  ];

  const statusBadge = (s: string) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: STATUS_COLORS[s] || '#a1a1aa', background: `${STATUS_COLORS[s] || '#a1a1aa'}1a`, border: `1px solid ${STATUS_COLORS[s] || '#a1a1aa'}33` }}>
      {s}
    </span>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview bisnis IPAN STORE</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className={`relative flex h-2.5 w-2.5 ${live ? 'bg-green-500' : 'bg-zinc-500'} rounded-full`}>
                {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />}
              </span>
              {live ? 'Live' : 'Terhubung'}
            </span>
            <span className="text-sm text-muted-foreground">{format(now, 'EEEE, d MMMM yyyy', { locale: localeId })}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPI Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((k) => (
                <Card key={k.label} className="bg-card border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <k.icon className="w-4 h-4" style={{ color: k.color }} />
                      {k.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{k.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order status */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statusKpis.map((k) => (
                <Card key={k.label} className="bg-card border-white/10">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{k.label}</p>
                      <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
                    </div>
                    <k.icon className="w-6 h-6" style={{ color: k.color }} />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Insight: AOV, Konversi, Total Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-white/10">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rata-rata Nilai Order (AOV)</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(Math.round(aov))}</p>
                  </div>
                  <ReceiptText className="w-6 h-6 text-primary" />
                </CardContent>
              </Card>
              <Card className="bg-card border-white/10">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Konversi Pembayaran (PAID+COMPLETED)</p>
                    <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
                  </div>
                  <Percent className="w-6 h-6 text-green-500" />
                </CardContent>
              </Card>
              <Card className="bg-card border-white/10">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pendapatan (Semua Waktu)</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-card border-white/10 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Revenue 30 Hari</CardTitle>
                  <CardDescription>Dari order yang sudah dibayar / selesai</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} />
                        <Tooltip
                          contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: '#a1a1aa' }}
                          formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Status Order</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data</p>
                  ) : (
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="count"
                            nameKey="status"
                            innerRadius={45}
                            outerRadius={80}
                            paddingAngle={3}
                            label={({ status, count }) => `${count}`}
                          >
                            {statusData.map((d) => (
                              <Cell key={d.status} fill={STATUS_COLORS[d.status] || '#a1a1aa'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: '#a1a1aa' }}
                            formatter={(v: any, name: any) => [`${v} order`, String(name)]}
                          />
                          <Legend
                            formatter={(value: string) => (
                              <span style={{ color: '#a1a1aa', fontSize: 11 }}>{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Top services */}
              <Card className="bg-card border-white/10 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Top Layanan (Revenue)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {serviceData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Belum ada data</p>
                  ) : (
                    serviceData.map((s) => {
                      const max = serviceData[0].value || 1;
                      return (
                        <div key={s.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground truncate mr-2">{s.name}</span>
                            <span className="text-muted-foreground font-mono">{formatCurrency(s.value)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${(s.value / max) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Revenue pie per layanan */}
              <Card className="bg-card border-white/10 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Porsi Revenue per Layanan</CardTitle>
                </CardHeader>
                <CardContent>
                  {serviceData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Belum ada data</p>
                  ) : (
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={serviceData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={45}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {serviceData.map((entry, i) => (
                              <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: '#a1a1aa' }}
                            formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']}
                          />
                          <Legend
                            formatter={(value: string) => (
                              <span style={{ color: '#a1a1aa', fontSize: 11 }}>{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent orders */}
              <Card className="bg-card border-white/10 lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Order Terbaru</CardTitle>
                    <Link to="/admin/orders" className="inline-flex items-center text-sm text-primary hover:underline">
                      Lihat semua <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Belum ada order</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {recent.map((o) => (
                        <div key={o.id} className="flex items-center justify-between py-2.5 gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{o.customer_name}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">{o.invoice_number}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(o.amount))}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(o.created_at), 'dd MMM HH:mm', { locale: localeId })}
                            </p>
                          </div>
                          <div className="shrink-0">{statusBadge(o.status)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
