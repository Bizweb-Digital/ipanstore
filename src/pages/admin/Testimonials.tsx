import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { MessageSquare, Plus, Search, Edit, Trash2, Eye, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/admin/supabase';

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  message: string;
  service_id: string | null;
  testimonial_id: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminTestimonials() {
  const [search, setSearch] = useState('');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const filteredTestimonials = search
    ? testimonials.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.message.toLowerCase().includes(search.toLowerCase())
      )
    : testimonials;

  const handleOpenEdit = (testimonial: Testimonial) => {
    setEditing(testimonial);
    setShowDialog(true);
  };

  const handleOpenCreate = () => {
    setEditing({
      id: '',
      name: '',
      rating: 5,
      message: '',
      service_id: null,
      testimonial_id: null,
      is_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!editing?.name.trim() || !editing.message.trim()) {
      toast.error('Nama dan pesan testimonial wajib diisi');
      return;
    }

    try {
      setIsSaving(true);

      // Untuk insert, buang id kosong agar database generate UUID sendiri.
      const { id, created_at, updated_at, ...rest } = editing;
      const payload: Record<string, unknown> = { ...rest };

      const { error } = editing.id
        ? await supabase.from('testimonials').update(payload).eq('id', editing.id)
        : await supabase.from('testimonials').insert([payload]);

      if (error) throw error;

      toast.success(editing.id ? 'Testimoni berhasil diperbarui' : 'Testimoni berhasil dibuat');
      handleCloseDialog();
      await fetchTestimonials();
    } catch (error: any) {
      console.error('Failed to save testimonial:', error);
      toast.error(error.message || 'Gagal menyimpan testimonial');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus testimonial ini?')) {
      return;
    }

    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
      toast.success('Testimonial berhasil dihapus');
      await fetchTestimonials();
    } catch (error: any) {
      console.error('Failed to delete testimonial:', error);
      toast.error(error.message || 'Gagal menghapus testimonial');
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
            <h1 className="text-3xl font-bold font-display">Testimonials</h1>
            <p className="text-muted-foreground mt-1">Kelola testimoni customer</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Testimoni
          </Button>
        </div>

        {/* Search & Stats */}
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Kelola Testimonial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{testimonials.length}</p>
                    <p className="text-xs text-muted-foreground">Total Testimoni</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/10">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium">
                      {testimonials.filter((t) => t.is_approved).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Disetujui</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-zinc-500/10 border border-zinc-500/10">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {testimonials.filter((t) => !t.is_approved).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Belum Disetujui</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau pesan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Testimonials Table */}
        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Daftar Testimonial ({filteredTestimonials.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !testimonials.length ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Error: {error}</p>
              </div>
            ) : filteredTestimonials.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada testimonial ditemukan.</p>
              </div>
            ) : (
              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Pesan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTestimonials.map((testimonial) => (
                      <TableRow key={testimonial.id}>
                        <TableCell className="font-medium">{testimonial.name}</TableCell>
                        <TableCell>
                          {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {testimonial.message.substring(0, 60)}...
                        </TableCell>
                        <TableCell>
                          {testimonial.is_approved ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                              Disetujui
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                              Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(testimonial.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(testimonial)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(testimonial.id)}
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
              <DialogTitle>{editing?.id ? 'Edit' : 'Tambah'} Testimonial</DialogTitle>
              <DialogDescription>
                {editing?.id
                  ? 'Perbarui informasi testimonial yang sudah ada'
                  : 'Tambah testimonial baru untuk ditampilkan di website'}
              </DialogDescription>
            </DialogHeader>

            {editing && (
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Customer *</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Budi Santoso"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={editing.rating ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        rating: Math.max(1, Math.min(5, parseInt(e.target.value) || 5)),
                      })
                    }
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Pesan Testimonial *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tulis pengalaman customer dengan layanan IPAN STORE..."
                    className="min-h-[120px]"
                    value={editing.message || ''}
                    onChange={(e) => setEditing({ ...editing, message: e.target.value })}
                  />
                </div>

                {/* Is Approved */}
                <div className="flex items-center space-x-2 p-4 rounded-lg bg-white/5">
                  <Switch
                    checked={editing.is_approved}
                    onCheckedChange={(checked) =>
                      setEditing({ ...editing, is_approved: checked })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="is-approved">Setujui Testimonial Ini</Label>
                    <p className="text-xs text-muted-foreground">
                      Jika tidak disetujui, testimonial tidak akan tampil di website frontend.
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
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
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
