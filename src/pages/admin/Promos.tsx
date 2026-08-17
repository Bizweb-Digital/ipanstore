// ─────────────────────────────────────────────────────────────────────────────
// IPAN STORE - Halaman Admin: Kode Promo / Diskon
// CRUD tabel promo_codes. Kode dipakai customer di halaman Order dan
// divalidasi ulang oleh backend (server/index.js) saat membuat order DOKU.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BadgePercent, Plus, Search, Edit, Trash2, Loader2, XCircle, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/admin/supabase';
import { PromoCode } from '@/lib/admin/promo';
import { exportToCsv } from '@/lib/admin/csv';
import { useAuditLogger } from '@/hooks/useAuditLog';

const emptyPromo: PromoCode = {
  id: '',
  code: '',
  type: 'percent',
  value: 10,
  max_uses: null,
  used_count: 0,
  is_active: true,
  expires_at: null,
  created_at: '',
  updated_at: '',
};

export default function AdminPromos() {
  const [search, setSearch] = useState('');
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const logAudit = useAuditLogger();

  const fetchPromos = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPromos((data as PromoCode[]) || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch promos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const filtered = search
    ? promos.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()))
    : promos;

  const handleOpenCreate = () => {
    setEditing({ ...emptyPromo });
    setShowDialog(true);
  };

  const handleOpenEdit = (promo: PromoCode) => {
    setEditing({ ...promo });
    setShowDialog(true);
  };

  const handleClose = () => {
    setShowDialog(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!editing?.code.trim()) {
      toast.error('Kode promo wajib diisi');
      return;
    }
    if (editing.type === 'percent' && (editing.value <= 0 || editing.value > 100)) {
      toast.error('Diskon persen harus antara 1-100');
      return;
    }
    if (editing.type === 'fixed' && editing.value <= 0) {
      toast.error('Diskon nominal harus lebih dari 0');
      return;
    }

    try {
      setIsSaving(true);
      const code = editing.code.trim().toUpperCase();
      const payload: Record<string, unknown> = {
        code,
        type: editing.type,
        value: editing.value,
        max_uses: editing.max_uses ?? null,
        is_active: editing.is_active,
        expires_at: editing.expires_at || null,
      };

      const { error } = editing.id
        ? await supabase.from('promo_codes').update(payload).eq('id', editing.id)
        : await supabase.from('promo_codes').insert([{ ...payload, used_count: 0 }]);

      if (error) throw error;

      await logAudit(
        editing.id ? 'promo.update' : 'promo.create',
        editing.id || null,
        { code, type: editing.type, value: editing.value }
      );

      toast.success(editing.id ? 'Promo berhasil diperbarui' : 'Promo berhasil dibuat');
      handleClose();
      await fetchPromos();
    } catch (err: any) {
      console.error('Failed to save promo:', err);
      toast.error(err.message || 'Gagal menyimpan promo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus kode promo ini?')) return;
    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
      await logAudit('promo.delete', id);
      toast.success('Promo berhasil dihapus');
      await fetchPromos();
    } catch (err: any) {
      console.error('Failed to delete promo:', err);
      toast.error(err.message || 'Gagal menghapus promo');
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !promo.is_active })
        .eq('id', promo.id);
      if (error) throw error;
      await logAudit('promo.update', promo.id, { is_active: !promo.is_active });
      await fetchPromos();
    } catch (err: any) {
      console.error('Failed to toggle promo:', err);
      toast.error(err.message || 'Gagal mengubah status promo');
    }
  };

  const exportCsv = () => {
    exportToCsv(
      `promos_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { header: 'Kode', value: (r) => r.code },
        { header: 'Tipe', value: (r) => r.type },
        { header: 'Nilai', value: (r) => r.value },
        { header: 'Maks Pakai', value: (r) => r.max_uses },
        { header: 'Terpakai', value: (r) => r.used_count },
        { header: 'Aktif', value: (r) => (r.is_active ? 'Ya' : 'Tidak') },
        { header: 'Kedaluwarsa', value: (r) => r.expires_at },
        { header: 'Dibuat', value: (r) => r.created_at },
      ],
      filtered as unknown as Record<string, unknown>[]
    );
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Promos</h1>
            <p className="text-muted-foreground mt-1">
              Kelola kode promo / diskon untuk order
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Promo
            </Button>
          </div>
        </div>

        {/* Info & Search */}
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Kelola Kode Promo</CardTitle>
            <CardDescription>
              Diskon dihitung ulang oleh backend saat membuat order (server-authoritative).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari kode promo..."
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
              <BadgePercent className="w-5 h-5" />
              Daftar Promo ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !promos.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Error: {error}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Jalankan supabase_migration_v2.sql di Supabase SQL Editor terlebih dahulu.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BadgePercent className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada kode promo ditemukan.</p>
              </div>
            ) : (
              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Diskon</TableHead>
                      <TableHead>Pemakaian</TableHead>
                      <TableHead>Kedaluwarsa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell>
                          <code className="bg-zinc-900 px-2 py-1 rounded text-xs">{promo.code}</code>
                        </TableCell>
                        <TableCell>
                          {promo.type === 'percent' ? `${promo.value}%` : `Rp ${promo.value.toLocaleString('id-ID')}`}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {promo.used_count}{promo.max_uses != null ? ` / ${promo.max_uses}` : ''}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(promo.expires_at)}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleActive(promo)}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              promo.is_active
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                            }`}
                            title={promo.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                          >
                            {promo.is_active ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(promo)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(promo.id)}
                              className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing?.id ? 'Edit' : 'Tambah'} Kode Promo</DialogTitle>
              <DialogDescription>
                Kode akan tampil di halaman Order untuk digunakan customer.
              </DialogDescription>
            </DialogHeader>

            {editing && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kode Promo *</Label>
                  <Input
                    id="code"
                    placeholder="misal: HEMAT10"
                    value={editing.code}
                    onChange={(e) =>
                      setEditing({ ...editing, code: e.target.value.toUpperCase() })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Jenis Diskon</Label>
                    <select
                      id="type"
                      value={editing.type}
                      onChange={(e) =>
                        setEditing({ ...editing, type: e.target.value as 'percent' | 'fixed' })
                      }
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="percent">Persen (%)</option>
                      <option value="fixed">Nominal (Rp)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      Nilai Diskon ({editing.type === 'percent' ? '%' : 'Rp'})
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      min="1"
                      max={editing.type === 'percent' ? 100 : undefined}
                      value={editing.value}
                      onChange={(e) =>
                        setEditing({ ...editing, value: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Maksimal Pemakaian (kosong = tanpa batas)</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      placeholder="misal: 100"
                      value={editing.max_uses ?? ''}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          max_uses: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires">Kedaluwarsa (kosong = tidak ada batas waktu)</Label>
                    <Input
                      id="expires"
                      type="date"
                      value={editing.expires_at ? editing.expires_at.slice(0, 10) : ''}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          expires_at: e.target.value ? `${e.target.value}T23:59:59.999Z` : null,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 rounded-lg bg-white/5">
                  <Switch
                    checked={editing.is_active}
                    onCheckedChange={(checked) => setEditing({ ...editing, is_active: checked })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="is-active">Aktifkan Kode Promo</Label>
                    <p className="text-xs text-muted-foreground">
                      Kode nonaktif tidak bisa digunakan di halaman Order.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}