// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Halaman Admin: Audit Log
// Menampilkan jejak aksi admin (ubah status order, CRUD services/testimonials/faqs).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
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
import { ScrollText, Search, RefreshCw, Loader2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { fetchAuditLogs, AuditEntry } from '@/hooks/useAuditLog';
import { exportToCsv } from '@/lib/admin/csv';

const ACTION_LABELS: Record<string, string> = {
  'order.status.update': 'Ubah Status Order',
  'service.create': 'Tambah Layanan',
  'service.update': 'Edit Layanan',
  'service.delete': 'Hapus Layanan',
  'testimonial.create': 'Tambah Testimoni',
  'testimonial.update': 'Edit Testimoni',
  'testimonial.delete': 'Hapus Testimoni',
  'testimonial.approval': 'Moderasi Testimoni',
  'faq.create': 'Tambah FAQ',
  'faq.update': 'Edit FAQ',
  'faq.delete': 'Hapus FAQ',
  'promo.create': 'Tambah Promo',
  'promo.update': 'Edit Promo',
  'promo.delete': 'Hapus Promo',
};

const actionLabel = (action: string) => ACTION_LABELS[action] || action;

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuditLogs(500);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = search
    ? logs.filter(
        (l) =>
          l.admin_email.toLowerCase().includes(search.toLowerCase()) ||
          l.action.toLowerCase().includes(search.toLowerCase()) ||
          (l.target_id || '').toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const exportCsv = () => {
    exportToCsv(
      `audit_log_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { header: 'Waktu', value: (r) => r.created_at },
        { header: 'Admin', value: (r) => r.admin_email },
        { header: 'Aksi', value: (r) => r.action },
        { header: 'Target ID', value: (r) => r.target_id },
        { header: 'Detail', value: (r) => JSON.stringify(r.metadata) },
      ],
      filtered as unknown as Record<string, unknown>[]
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Audit Log</h1>
            <p className="text-muted-foreground mt-1">Jejak aktivitas admin di panel</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Cari Riwayat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari admin, aksi, atau target ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="w-5 h-5" />
              Riwayat Aksi ({filtered.length})
            </CardTitle>
            <CardDescription>
              Menampilkan maksimal 500 entri terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !logs.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Error: {error}</p>
              </div>
            ) : pageData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada catatan aktivitas.</p>
              </div>
            ) : (
              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-sm">{log.admin_email}</TableCell>
                        <TableCell>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {actionLabel(log.action)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.target_id || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Halaman {page} dari {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}