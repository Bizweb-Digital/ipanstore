import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/admin/supabase';
import type { Database } from '@/lib/admin/supabase';
import { logAudit } from '@/lib/admin/audit';

type AdminUser = Database['public']['Tables']['admin_users']['row'];

type SignInErrorKind = 'wrong_credentials' | 'not_admin' | 'whitelist_error' | 'unknown';

interface SignInResult {
  error: Error | null;
  kind?: SignInErrorKind;
}

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check active session on mount and refresh
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch admin user from whitelist
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', session.user.email)
            .single();
          
          setAdminUser(adminData);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setUser(session?.user ?? null);
            
            if (session?.user) {
              const { data: adminData } = await supabase
                .from('admin_users')
                .select('*')
                .eq('email', session.user.email)
                .single();
              
              setAdminUser(adminData);
            } else {
              setAdminUser(null);
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Pesan ke UI dibuat generik oleh pemanggil — jangan bocorkan detail.
        return { error: new Error(error.message), kind: 'wrong_credentials' };
      }

      // Login Supabase sukses (password BENAR) — verifikasi whitelist admin_users.
      // PENTING: bedakan kegagalan QUERY (RLS/jaringan) dari "memang bukan admin".
      // Dulu keduanya dibalas "Email atau password salah" sehingga user mengira
      // password-nya berubah padahal password benar.
      const { data: adminData, error: whitelistError } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (whitelistError) {
        // Query whitelist gagal (bukan karena password). Jangan bohongi user.
        await logAudit(email, 'login_whitelist_error', { message: whitelistError.message });
        await supabase.auth.signOut();
        setUser(null);
        setAdminUser(null);
        return {
          error: new Error('Gagal memeriksa akses admin. Coba beberapa saat lagi atau hubungi pengelola.'),
          kind: 'whitelist_error',
        };
      }

      if (!adminData) {
        // Password benar, tapi email memang tidak terdaftar di whitelist admin.
        await logAudit(email, 'login_rejected_not_admin');
        await supabase.auth.signOut();
        setUser(null);
        setAdminUser(null);
        return {
          error: new Error('Email ini tidak terdaftar sebagai admin.'),
          kind: 'not_admin',
        };
      }

      // Audit login sukses (tidak mengganggu flow jika gagal).
      await logAudit(email, 'login_success');
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Sign in failed'),
        kind: 'unknown',
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const email = user?.email ?? adminUser?.email;
      await supabase.auth.signOut();
      setUser(null);
      setAdminUser(null);
      if (email) {
        // Audit logout (tidak mengganggu flow jika gagal).
        await logAudit(email, 'logout');
      }
    } catch {
      // Penanganan senyap: logout gagal tidak perlu ditampilkan ke user,
      // sesi lokal tetap dibersihkan.
      setUser(null);
      setAdminUser(null);
    }
  }, [user, adminUser]);

  return (
    <AuthContext.Provider value={{ user, adminUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AuthProvider');
  }
  return context;
}
