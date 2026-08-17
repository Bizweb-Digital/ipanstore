import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  Tag,
} from 'lucide-react';
import { useServices, Service } from '@/hooks/useServices';
import { toast } from 'react-hot-toast';

export default function AdminServices() {
  const [search, setSearch] = useState('');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { services, loading, error, refetch, deleteService, updateService } = useServices();
  // Keep the page renderable even if a failed request returns no data.
  const displayServices = services || [];
  const filteredServices = search
    ? displayServices.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.slug.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase())
      )
    : displayServices;

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setShowDialog(true);
  };

  const handleOpenCreate = () => {
    setEditingService({
      id: '', // Empty means create
      name: '',
      slug: '',
      description: '',
      price: undefined,
      is_active: true,
    } as Service);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingService(null);
  };

  const handleSave = async () => {
    if (!editingService?.name.trim()) {
      toast.error('Nama layanan wajib diisi');
      return;
    }

    try {
      setIsSaving(true);

      const result = editingService.id
        ? await updateService(editingService.id, editingService)
        : await updateService(undefined, editingService as Omit<Service, 'id' | 'created_at'>);

      if (result.error) throw result.error;

      toast.success(editingService.id ? 'Layanan berhasil diperbarui' : 'Layanan berhasil dibuat');
      handleCloseDialog();
      await refetch();
    } catch (error: unknown) {
      console.error('Failed to save service:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan layanan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus layanan ini? Data order tidak akan terhapus.')) {
      return;
    }

    try {
      await deleteService(id);
      toast.success('Layanan berhasil dihapus');
      await refetch();
    } catch (error: unknown) {
      console.error('Failed to delete service:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus layanan');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Services</h1>
            <p className="text-muted-foreground mt-1">
              Kelola layanan dan paket IPAN STORE
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Layanan
          </Button>
        </div>

        {/* Search & Stats */}
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Kelola Layanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{services.length}</p>
                    <p className="text-xs text-muted-foreground">Total Layanan</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium">
                      {services.filter((s) => s.is_active).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Aktif</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/10">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium">
                      {services.filter((s) => !s.is_active).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Tidak Aktif</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, slug, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Daftar Layanan ({filteredServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !services.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Error: {error}</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada layanan ditemukan.</p>
              </div>
            ) : (
              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">
                          {service.name}
                          {!service.is_active && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (Inactive)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="bg-zinc-900 px-2 py-1 rounded text-xs">
                            {service.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span>
                              Rp{' '}
                              {service.price
                                ?.toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, '.') || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {service.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                <XCircle className="w-3 h-3" />
                                Tidak Aktif
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(service.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(service.id)}
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
              <DialogTitle>
                {editingService?.id ? 'Edit' : 'Tambah'} Layanan
              </DialogTitle>
              <DialogDescription>
                {editingService?.id
                  ? 'Perbarui informasi layanan yang sudah ada'
                  : 'Tambah layanan baru yang akan ditampilkan di website'}
              </DialogDescription>
            </DialogHeader>

            {editingService && (
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Layanan *</Label>
                  <Input
                    id="name"
                    placeholder="Misal: SET PC, ELITE, EXTREME"
                    value={editingService.name}
                    onChange={(e) =>
                      setEditingService({ ...editingService, name: e.target.value })
                    }
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug * (URL-friendly)</Label>
                  <Input
                    id="slug"
                    placeholder="misal: set-pc, elite-package"
                    value={editingService.slug}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, ''),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Otomatis dari huruf kecil, angka, dash (-), dan underscore (_) saja
                  </p>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="50000"
                    value={editingService.price ?? ''}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Hanya angka, tanpa titik/koma
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi (HTML Support)</Label>
                  <Textarea
                    id="description"
                    placeholder="<ul><li>Fitur 1</li><li>Fitur 2</li></ul>"
                    className="min-h-[120px]"
                    value={editingService.description || ''}
                    onChange={(e) =>
                      setEditingService({ ...editingService, description: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Bisa pakai HTML tags seperti&lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;, dll.
                  </p>
                </div>

                {/* Is Active */}
                <div className="flex items-center space-x-2 p-4 rounded-lg bg-white/5">
                  <Switch
                    checked={editingService.is_active}
                    onCheckedChange={(checked) =>
                      setEditingService({ ...editingService, is_active: checked })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="is-active">Aktifkan Layanan Ini</Label>
                    <p className="text-xs text-muted-foreground">
                      Jika nonaktif, layanan tidak akan muncul di website frontend
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4 mr-2" />
                    Simpan
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Error display (only when not loading) */}
      {!loading && error && (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-500 mb-2">Gagal memuat layanan</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => refetch()} variant="outline">
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
