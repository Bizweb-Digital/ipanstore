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
import { HelpCircle, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Download } from 'lucide-react';
import { toastFaq, showErrorToast } from '@/lib/admin/toast';
import { supabase } from '@/lib/admin/supabase';
import { exportToCsv } from '@/lib/admin/csv';
import { useAuditLogger } from '@/hooks/useAuditLog';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminFaqs() {
  const [search, setSearch] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const logAudit = useAuditLogger();

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const filteredFaqs = search
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(search.toLowerCase()) ||
          faq.answer.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  const exportCsv = () => {
    exportToCsv(
      `faqs_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { header: 'Pertanyaan', value: (r) => r.question },
        { header: 'Jawaban', value: (r) => r.answer },
        { header: 'Urutan', value: (r) => r.sort_order },
        { header: 'Aktif', value: (r) => (r.is_active ? 'Ya' : 'Tidak') },
        { header: 'Dibuat', value: (r) => r.created_at },
      ],
      filteredFaqs as unknown as Record<string, unknown>[]
    );
  };

  const handleOpenEdit = (faq: FAQ) => {
    setEditing(faq);
    setShowDialog(true);
  };

  const handleOpenCreate = () => {
    setEditing({
      id: '',
      question: '',
      answer: '',
      sort_order: faqs.length + 1,
      is_active: true,
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
    if (!editing?.question.trim() || !editing.answer.trim()) {
      showErrorToast('Validasi gagal', 'Pertanyaan dan jawaban wajib diisi');
      return;
    }

    try {
      setIsSaving(true);
      // Hapus id kosong untuk insert agar database generate UUID
      const { id, created_at, updated_at, ...rest } = editing;
      const payload: Record<string, unknown> = { ...rest };

      const { error } = editing.id
        ? await supabase.from('faqs').update(payload).eq('id', editing.id)
        : await supabase.from('faqs').insert([payload]);

      if (error) throw error;

      await logAudit(
        editing.id ? 'faq.update' : 'faq.create',
        editing.id || null,
        { question: editing.question, is_active: editing.is_active }
      );

      editing.id ? toastFaq.updated() : toastFaq.created();
      handleCloseDialog();
      await fetchFaqs();
    } catch (error: any) {
      console.error('Failed to save FAQ:', error);
      showErrorToast('Gagal menyimpan FAQ', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus FAQ ini?')) {
      return;
    }

    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      await logAudit('faq.delete', id);
      toastFaq.deleted();
      await fetchFaqs();
    } catch (error: any) {
      console.error('Failed to delete FAQ:', error);
      showErrorToast('Gagal menghapus FAQ', error.message);
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
            <h1 className="text-3xl font-bold font-display">FAQs</h1>
            <p className="text-muted-foreground mt-1">Kelola pertanyaan yang sering ditanyakan</p>
          </div>
          <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={filteredFaqs.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah FAQ
          </Button>
        </div>
        </div>

        {/* Search & Stats */}
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Kelola FAQs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{faqs.length}</p>
                    <p className="text-xs text-muted-foreground">Total FAQs</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium">
                      {faqs.filter((f) => f.is_active).length}
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
                      {faqs.filter((f) => !f.is_active).length}
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
                placeholder="Cari pertanyaan atau jawaban..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* FAQs Table */}
        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Daftar FAQs ({filteredFaqs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !faqs.length ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Error: {error}</p>
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center">Tidak ada FAQ ditemukan.</p>
              </div>
            ) : (
              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow>
                      <TableHead>Pertanyaan</TableHead>
                      <TableHead>Jawaban</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Buat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFaqs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell className="font-medium max-w-[300px] truncate">
                          {faq.question}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {faq.answer.substring(0, 50)}...
                        </TableCell>
                        <TableCell>
                          {faq.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              Tidak Aktif
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(faq.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(faq)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(faq.id)}
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
              <DialogTitle>{editing?.id ? 'Edit' : 'Tambah'} FAQ</DialogTitle>
              <DialogDescription>
                {editing?.id
                  ? 'Perbarui pertanyaan dan jawaban FAQ yang sudah ada'
                  : 'Tambah FAQ baru yang akan ditampilkan di website'}
              </DialogDescription>
            </DialogHeader>

            {editing && (
              <div className="space-y-4">
                {/* Question */}
                <div className="space-y-2">
                  <Label htmlFor="question">Pertanyaan *</Label>
                  <Input
                    id="question"
                    placeholder="Misal: Bagaimana cara melakukan top up?"
                    value={editing.question}
                    onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  />
                </div>

                {/* Answer */}
                <div className="space-y-2">
                  <Label htmlFor="answer">Jawaban *</Label>
                  <Textarea
                    id="answer"
                    placeholder="Tulis jawaban lengkap dengan langkah-langkah jika perlu..."
                    className="min-h-[120px]"
                    value={editing.answer || ''}
                    onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                  />
                </div>

                {/* Is Active */}
                <div className="flex items-center space-x-2 p-4 rounded-lg bg-white/5">
                  <Switch
                    checked={editing.is_active}
                    onCheckedChange={(checked) =>
                      setEditing({ ...editing, is_active: checked })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="is-active">Aktifkan FAQ Ini</Label>
                    <p className="text-xs text-muted-foreground">
                      Jika tidak aktif, FAQ tidak akan tampil di halaman Frontend FAQ.
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
