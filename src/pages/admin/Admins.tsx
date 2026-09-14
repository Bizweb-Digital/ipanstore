import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, ShieldCheck, Trash2, UserPlus, Loader2, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  AdminEntry,
  AdminRole,
  createAdminAccount,
  listAdmins,
  removeAdmin,
  updateAdminRole,
} from '@/lib/admin/admins';

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  viewer: 'Viewer',
};

export default function AdminAdmins() {
  const { user } = useAdminAuth();
  const myEmail = user?.email?.toLowerCase() ?? '';

  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog tambah admin
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('viewer');
  const [isSaving, setIsSaving] = useState(false);

  // AlertDialog hapus admin
  const [deleting, setDeleting] = useState<AdminEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAdmins(await listAdmins());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar admin';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Format email tidak valid');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    if (admins.some((a) => a.email.toLowerCase() === email)) {
      toast.error('Email sudah terdaftar sebagai admin');
      return;
    }
    try {
      setIsSaving(true);
      // Buat akun Auth + whitelist + kirim kredensial via backend (Gmail SMTP).
      const result = await createAdminAccount(email, newPassword, newRole);
      toast.success(result.message, { duration: 6000 });
      if (!result.emailSent) {
        toast('Email kredensial gagal dikirim. Kirim manual ke admin tersebut.', {
          icon: '⚠️',
          duration: 6000,
        });
      }
      setShowAdd(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('viewer');
      await fetchAdmins();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat akun admin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (admin: AdminEntry, role: AdminRole) => {
    // Cegah admin menurunkan role dirinya sendiri
    if (admin.email.toLowerCase() === myEmail) {
      toast.error('Kamu tidak bisa mengubah role akunmu sendiri');
      return;
    }
    try {
      await updateAdminRole(admin.id, role);
      toast.success(`Role ${admin.email} diubah menjadi ${ROLE_LABEL[role]}`);
      await fetchAdmins();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah role');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    // Cegah admin menghapus dirinya sendiri
    if (deleting.email.toLowerCase() === myEmail) {
      toast.error('Kamu tidak bisa menghapus akunmu sendiri');
      setDeleting(null);
      return;
    }
    try {
      setIsDeleting(true);
      await removeAdmin(deleting.id);
      toast.success(`${deleting.email} dihapus dari daftar admin`);
      setDeleting(null);
      await fetchAdmins();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus admin');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
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
        {/* Header — flex-wrap agar tombol tidak terdorong keluar layar di mobile */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display">Admins</h1>
            <p className="text-muted-foreground mt-1">
              Kelola whitelist admin IPAN STORE
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="shrink-0">
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Admin
          </Button>
        </div>

        {/* Info: user tetap harus dibuat manual di Supabase Auth */}
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertTitle>Cara kerja tambah admin</AlertTitle>
          <AlertDescription>
            Cukup isi <strong>email, password, dan role</strong> — akun langsung dibuat di
            Supabase Auth + whitelist, dan <strong>kredensial otomatis dikirim ke email admin
            baru</strong> via Gmail. Tidak perlu lagi buat akun manual di Supabase Dashboard.
          </AlertDescription>
        </Alert>

        {/* Tabel admin */}
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Daftar Admin</CardTitle>
            <CardDescription>{admins.length} email terdaftar di whitelist</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <p>Error: {error}</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada admin terdaftar</p>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 overflow-x-auto">
                <Table className="min-w-[520px]">
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Ditambahkan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => {
                      const isSelf = admin.email.toLowerCase() === myEmail;
                      return (
                        <TableRow key={admin.id} className="border-white/10">
                          <TableCell className="font-medium">
                            {admin.email}
                            {isSelf && (
                              <span className="ml-2 text-xs text-primary">(kamu)</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {admin.role === 'super_admin' ? (
                                <ShieldCheck className="w-4 h-4 text-primary" />
                              ) : (
                                <Shield className="w-4 h-4 text-muted-foreground" />
                              )}
                              <Select
                                value={admin.role}
                                onValueChange={(v) =>
                                  handleRoleChange(admin, v as AdminRole)
                                }
                                disabled={isSelf}
                              >
                                <SelectTrigger className="w-[150px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(admin.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isSelf}
                              onClick={() => setDeleting(admin)}
                              className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog tambah admin — lebar dibatasi agar muat di layar mobile */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Admin Baru</DialogTitle>
              <DialogDescription>
                Isi email, password, dan role. Akun langsung dibuat dan kredensial otomatis
                dikirim ke email admin baru via Gmail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Password ini dikirim ke email admin baru. Minta mereka menggantinya setelah
                  login pertama.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin — akses penuh</SelectItem>
                    <SelectItem value="viewer">Viewer — akses terbatas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)} disabled={isSaving}>
                Batal
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isSaving || !newEmail.trim() || newPassword.length < 8}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Membuat akun...
                  </>
                ) : (
                  'Tambah & Kirim Email'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AlertDialog konfirmasi hapus */}
        <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
          <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus admin?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{deleting?.email}</strong> akan dihapus dari whitelist dan tidak bisa
                lagi mengakses dashboard admin. Tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
