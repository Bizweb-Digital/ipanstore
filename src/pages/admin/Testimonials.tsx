import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Plus, Search, Edit, Trash2, Eye, XCircle, Download, CheckCircle2, ImagePlus, Loader2 } from 'lucide-react';
import { toastTestimonial, showSuccessToast, showErrorToast } from '@/lib/admin/toast';
import { supabase } from '@/lib/admin/supabase';
import { exportToCsv } from '@/lib/admin/csv';
import { useAuditLogger } from '@/hooks/useAuditLog';

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  message: string;
  image_url: string | null;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const logAudit = useAuditLogger();

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

  const exportCsv = () => {
    exportToCsv(
      `testimonials_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { header: 'Nama', value: (r) => r.name },
        { header: 'Rating', value: (r) => r.rating },
        { header: 'Pesan', value: (r) => r.message },
        { header: 'Foto', value: (r) => r.image_url || '-' },
        { header: 'Disetujui', value: (r) => (r.is_approved ? 'Ya' : 'Belum') },
        { header: 'Dibuat', value: (r) => r.created_at },
      ],
      filteredTestimonials as unknown as Record<string, unknown>[]
    );
  };

  const handleToggleApproved = async (testimonial: Testimonial) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_approved: !testimonial.is_approved })
        .eq('id', testimonial.id);
      if (error) throw error;
      await logAudit('testimonial.approval', testimonial.id, {
        is_approved: !testimonial.is_approved,
      });
      testimonial.is_approved ? toastTestimonial.rejected() : toastTestimonial.approved();
      await fetchTestimonials();
    } catch (error: any) {
      console.error('Failed to toggle approval:', error);
      showErrorToast('Gagal mengubah status', error.message);
    }
  };

  const handleOpenEdit = (testimonial: Testimonial) => {
    setEditing(testimonial);
    setImagePreview(testimonial.image_url || null);
    setImageFile(null);
    setShowDialog(true);
  };

  const handleOpenCreate = () => {
    setEditing({
      id: '',
      name: 'Customer',
      rating: 5,
      message: '',
      image_url: null,
      service_id: null,
      testimonial_id: null,
      is_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setImagePreview(null);
    setImageFile(null);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditing(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showErrorToast('Validasi gagal', 'File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Validasi gagal', 'Ukuran gambar maksimal 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('testimonial-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Pesan error yang jelas ke admin
      if (uploadError.message.toLowerCase().includes('bucket')) {
        throw new Error('Bucket storage "testimonial-images" belum dibuat di Supabase. Jalankan SQL setup dulu.');
      }
      throw new Error(uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('testimonial-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    // Foto wajib diupload
    if (!imageFile && !editing?.image_url) {
      showErrorToast('Validasi gagal', 'Foto testimonial wajib diupload');
      return;
    }

    try {
      setIsSaving(true);

      let imageUrl = editing.image_url;

      // Upload new image if selected
      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
          showSuccessToast({ type: 'testimonial', action: 'create', customTitle: 'Foto berhasil diupload' });
        } catch (uploadErr: any) {
          showErrorToast('Gagal upload foto', uploadErr.message);
          setIsSaving(false);
          return;
        }
      }

      // Prepare payload - HANYA kolom yang benar-benar ada di tabel DB
      // (testimonial_id tidak ada di skema DB → jangan dikirim, sebabkan PGRST204)
      const payload = {
        name: 'Customer',
        rating: 5,
        message: '',
        image_url: imageUrl,
        is_approved: editing.is_approved,
      };

      console.log('Saving testimonial payload:', payload);

      const { error } = editing.id
        ? await supabase.from('testimonials').update(payload).eq('id', editing.id)
        : await supabase.from('testimonials').insert([payload]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      await logAudit(
        editing.id ? 'testimonial.update' : 'testimonial.create',
        editing.id || null,
        { name: payload.name, rating: payload.rating, is_approved: payload.is_approved, has_image: !!imageUrl }
      );

      editing.id ? toastTestimonial.updated() : toastTestimonial.created();
      handleCloseDialog();
      await fetchTestimonials();
    } catch (error: any) {
      console.error('Failed to save testimonial:', error);
      showErrorToast('Gagal menyimpan testimonial', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus testimonial ini?')) {
      return;
    }

    try {
      // Get image URL before deleting to optionally delete from storage
      const testimonial = testimonials.find(t => t.id === id);

      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;

      // Try to delete image from storage if exists
      if (testimonial?.image_url) {
        try {
          const urlParts = testimonial.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage.from('testimonial-images').remove([fileName]);
        } catch (imgErr) {
          console.warn('Failed to delete image from storage:', imgErr);
        }
      }

      await logAudit('testimonial.delete', id);
      toastTestimonial.deleted();
      await fetchTestimonials();
    } catch (error: any) {
      console.error('Failed to delete testimonial:', error);
      showErrorToast('Gagal menghapus testimonial', error.message);
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
          <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={filteredTestimonials.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Testimoni
          </Button>
        </div>
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
              <div className="w-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center">Tidak ada testimonial ditemukan.</p>
              </div>
            ) : (
              <div className="rounded-md border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-3">Foto</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Dibuat</th>
                      <th className="text-right p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestimonials.map((testimonial) => (
                      <tr key={testimonial.id} className="border-t border-white/10">
                        <td className="p-3">
                          {testimonial.image_url ? (
                            <img
                              src={testimonial.image_url}
                              alt="Testimonial"
                              className="w-12 h-12 object-cover rounded-lg border border-white/10"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                              <MessageSquare className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {testimonial.is_approved ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                              Disetujui
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(testimonial.created_at)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleApproved(testimonial)}
                              className={testimonial.is_approved ? 'text-yellow-500' : 'text-green-500'}
                              title={testimonial.is_approved ? 'Batalkan persetujuan' : 'Setujui testimoni'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Foto Testimonial</Label>
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-white/20 transition-colors">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg object-contain"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <ImagePlus className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Klik untuk upload foto
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          PNG, JPG, WebP (max 5MB)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
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
