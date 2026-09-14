import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/admin/supabase';
import logo from '@/assets/logo.png';
import logoWebp from '@/assets/logo.webp';
import logoWebp293 from '@/assets/logo-293.webp';

// --- Lockout client-side ----------------------------------------------------
const ATTEMPT_KEY = 'admin_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 menit

interface AttemptState {
  count: number;
  lockedUntil: number | null;
}

function readAttempts(): AttemptState {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    const parsed = JSON.parse(raw) as Partial<AttemptState>;
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null,
    };
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function writeAttempts(state: AttemptState) {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(state));
  } catch {
    // localStorage tidak tersedia — lockout dinonaktifkan secara senyap.
  }
}

function clearAttempts() {
  try {
    localStorage.removeItem(ATTEMPT_KEY);
  } catch {
    // abaikan
  }
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
// -----------------------------------------------------------------------------

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Mode 'login' = form email+password; 'forgot' = form minta email reset.
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);
  const { signIn } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin';

  // Cegah setState setelah unmount (mis. setelah navigate sukses).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Restore status kunci dari localStorage saat mount.
  useEffect(() => {
    const attempts = readAttempts();
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      setLockedUntil(attempts.lockedUntil);
    } else if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
      // Masa kunci sudah lewat — reset counter.
      clearAttempts();
    }
  }, []);

  // Ticker countdown saat form terkunci.
  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && lockedUntil > now;
  const countdownText = isLocked ? formatCountdown(lockedUntil - now) : null;

  const recordFailure = (): number => {
    const attempts = readAttempts();
    // Jika masa kunci sebelumnya sudah lewat, mulai dari nol.
    if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
      attempts.count = 0;
      attempts.lockedUntil = null;
    }
    const nextCount = attempts.count + 1;
    if (nextCount >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCK_MS;
      writeAttempts({ count: nextCount, lockedUntil: until });
      setLockedUntil(until);
      return 0;
    }
    writeAttempts({ count: nextCount, lockedUntil: null });
    return MAX_ATTEMPTS - nextCount;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // B1 — guard double submit (Enter berulang / klik cepat).
    if (loading || isLocked) return;

    setError(null);
    setLoading(true);

    try {
      const { error: signInError, kind } = await signIn(email, password);

      if (signInError) {
        // Password BENAR tapi akses ditolak / sistem error -> jangan dihitung
        // sebagai percobaan gagal (hindari lockout yang menyesatkan) dan
        // tampilkan pesan yang jujur, bukan "password salah".
        if (kind === 'not_admin' || kind === 'whitelist_error') {
          setError(signInError.message);
          toast.error('Login gagal', { description: signInError.message });
          return;
        }

        const remaining = recordFailure();
        const genericMessage =
          remaining > 0
            ? `Email atau password salah. Sisa percobaan: ${remaining}`
            : `Email atau password salah. Akun terkunci sementara selama 5 menit.`;
        setError(genericMessage);
        toast.error('Login gagal', { description: 'Email atau password salah.' });
        // Kosongkan field password setelah gagal.
        setPassword('');
        return;
      }

      // Sukses — reset counter lockout, lalu navigasi.
      clearAttempts();
      toast.success('Login berhasil', {
        description: `Selamat datang kembali!`,
      });
      navigate(from, { replace: true });
      return;
    } finally {
      // Jangan setState jika komponen sudah unmount setelah navigate.
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Kirim link reset password ke email via Supabase Auth.
  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Masukkan email admin kamu terlebih dahulu.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/admin/reset-password`;
      // Pesan ke user dibuat netral (sukses/gagal sama) agar tidak membocorkan
      // email mana yang terdaftar sebagai admin.
      await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
      setResetSent(true);
      toast.success('Permintaan reset dikirim', {
        description: 'Jika email terdaftar, link reset sudah dikirim.',
      });
    } catch {
      // Tetap tampilkan pesan netral meski ada error jaringan.
      setResetSent(true);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const backToLogin = () => {
    setMode('login');
    setResetSent(false);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <picture>
            <source
              srcSet={`${logoWebp293} 293w, ${logoWebp} 600w`}
              sizes="120px"
              type="image/webp"
            />
            <img
              src={logo}
              alt="Logo Ipan Store"
              width={120}
              height={120}
              className="mx-auto mb-4 h-16 w-auto object-contain"
            />
          </picture>
          <h1 className="text-2xl font-bold text-foreground">IPAN STORE</h1>
          <p className="text-muted-foreground mt-1">Login Admin</p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">
              {mode === 'login' ? 'Masuk ke Akun Admin' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'login'
                ? 'Masukkan kredensial admin Anda'
                : 'Masukkan email admin, kami kirim link untuk buat password baru'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'forgot' ? (
              /* ── Mode Lupa Password ─────────────────────────────────────── */
              resetSent ? (
                <div className="space-y-4">
                  <Alert className="border-emerald-500/30 bg-emerald-500/5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertDescription className="text-emerald-200/90">
                      Jika email terdaftar sebagai admin, link reset sudah dikirim ke{' '}
                      <strong>{email.trim()}</strong>. Cek inbox atau folder spam, lalu
                      ikuti link untuk membuat password baru.
                    </AlertDescription>
                  </Alert>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 font-medium"
                    onClick={backToLogin}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali ke Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email admin"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        className="pl-10"
                        required
                        autoComplete="email"
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
                        Mengirim...
                      </>
                    ) : (
                      'Kirim Link Reset'
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      onClick={backToLogin}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Kembali ke Login
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* ── Mode Login ─────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email admin"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    className="pl-10"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Error inline persisten */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Countdown lockout */}
              {isLocked && countdownText && (
                <Alert variant="destructive">
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Terlalu banyak percobaan gagal. Coba lagi dalam {countdownText}.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading || isLocked}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : isLocked && countdownText ? (
                  `Coba lagi dalam ${countdownText}`
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
            )}

            {/* Forgot Password (hanya di mode login) */}
            {mode === 'login' && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                  }}
                >
                  Lupa password?
                </button>
              </div>
            )}

            {/* Security Note */}
            <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-primary">Keamanan:</strong> Akses hanya untuk admin yang terdaftar.
                Semua aktivitas login dicatat dalam audit log.
              </p>
            </div>
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
