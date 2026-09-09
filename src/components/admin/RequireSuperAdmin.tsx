import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getMyRole } from '@/lib/admin/admins';

interface RequireSuperAdminProps {
  children: ReactNode;
}

/**
 * Route guard khusus super_admin.
 * Role dibaca langsung dari tabel admin_users via getMyRole() (toleran terhadap
 * kolom `role` yang belum ada → fallback super_admin). Viewer di-redirect ke
 * /admin dengan toast "Akses khusus super admin".
 */
export default function RequireSuperAdmin({ children }: RequireSuperAdminProps) {
  const { user, loading } = useAdminAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || !user?.email) return;
    let cancelled = false;
    getMyRole(user.email).then((role) => {
      if (!cancelled) setAllowed(role === 'super_admin');
    });
    return () => {
      cancelled = true;
    };
  }, [user?.email, loading]);

  if (loading || allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!allowed) {
    toast.error('Akses khusus super admin');
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
