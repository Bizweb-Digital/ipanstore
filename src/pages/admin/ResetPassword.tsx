import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/admin/supabase';
import logo from '@/assets/logo.png';
import logoWebp from '@/assets/logo.webp';
import logoWebp293 from '@/assets/logo-293.webp';

const MIN_PASSWORD = 8;

/**
 * Halaman tujuan dari link "reset password" yang dikirim Supabase Auth ke email.
 * Supabase mengarahkan user ke sini dengan token recovery di URL, lalu memicu
 * event PASSWORD_RECOVERY yang membuat sesi sementara untuk updateUser().
 */
export default function AdminResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false); // sesi recovery valid
  const [checking, setChecking] = useState(true); // masih deteksi sesi
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    // Dengarkan event recovery dari Supabase (dipicu saat buka link dari email).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setChecking(false);
      }
    });

    // Fallback: jika sudah ada sesi (beberapa alur langsung membuat sesi).
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setReady(true);
      }
      setChecking(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password.length < MIN_PASSWORD) {
      setError(`Password minimal ${MIN_PASSWORD} karakter.`);
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setDone(true);
      toast.success('Password berhasil diubah', {
        description: 'Silakan masuk dengan password baru kamu.',
      });
      // Keluar dari sesi recovery agar tidak terbawa, lalu arahkan ke login.
      await supabase.auth.signOut();
      setTimeout(() => navigate('/admin/login', { replace: true }), 1500);
    } catch (err) {
      setError(err?.message || 'Gagal mengubah password. Coba lagi atau minta link baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <picture>
            <source srcSet={`${logoWebp293} 293w, ${logoWebp} 600w`} sizes="120px" type="image/webp" />
            <img
              src={logo}
              alt="Logo Ipan Store"
              width={120}
              height={120}
              className="mx-auto mb-4 h-16 w-auto object-contain"
            />
          </picture>
          <h1 className="text-2xl font-bold text-foreground">IPAN STORE</h1>
          <p className="text-muted-foreground mt-1">Reset Password Admin</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Buat Password Baru</CardTitle>
            <CardDescription className="text-center">
              Masukkan password baru untuk akun admin kamu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Memverifikasi link...</span>
              </div>
            ) : done ? (
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <AlertDescription className="text-emerald-200/90">
                  Password berhasil diubah. Mengalihkan ke halaman login...
                </AlertDescription>
              </Alert>
            ) : !ready ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Link reset tidak valid atau sudah kedaluwarsa. Minta link baru lewat
                    tombol "Lupa password?" di halaman login.
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 font-medium"
                  onClick={() => navigate('/admin/login', { replace: true })}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder={`Minimal ${MIN_PASSWORD} karakter`}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="pl-10"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Ulangi password baru"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        if (error) setError(null);
                      }}
                      className="pl-10"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Password Baru'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} IPAN STORE. Hak cipta dilindungi.</p>
        </div>
      </div>
    </div>
  );
}
