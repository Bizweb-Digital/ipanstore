import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route guard yang memastikan hanya admin yang sudah login bisa akses route admin.
 * Jika tidak login, redirect ke /admin/login dengan state untuk kembali setelah login.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, adminUser, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    // Tampilkan loading skeleton sambil cek session
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  // Jika tidak ada user atau user tidak di whitelist admin_users
  if (!user || !adminUser) {
    // Redirect ke login, simpan path asli agar bisa kembali setelah login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
