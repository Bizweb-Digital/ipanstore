import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  MessageSquare,
  HelpCircle,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Store,
  ScrollText,
  BadgePercent,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    path: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/admin/orders',
    label: 'Orders',
    icon: ShoppingCart,
  },
  {
    path: '/admin/services',
    label: 'Services',
    icon: Package,
  },
  {
    path: '/admin/testimonials',
    label: 'Testimonials',
    icon: MessageSquare,
  },
  {
    path: '/admin/faqs',
    label: 'FAQs',
    icon: HelpCircle,
  },
  {
    path: '/admin/promos',
    label: 'Promos',
    icon: BadgePercent,
  },
  {
    path: '/admin/audit',
    label: 'Audit Log',
    icon: ScrollText,
  },
  {
    path: '/admin/reports',
    label: 'Reports',
    icon: FileText,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, adminUser, signOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    // Redirect akan otomatis via useAdminAuth
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300 bg-[#1a1a1a] border-r border-white/8 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/8">
          {sidebarOpen ? (
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-sm">
                IPAN <span className="text-primary">STORE</span>
              </span>
            </Link>
          ) : (
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-primary" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-4 border-t border-white/8 space-y-1">
          {adminUser && sidebarOpen && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-medium text-muted-foreground truncate">
                {adminUser.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#1a1a1a] border-r border-white/8 flex flex-col animate-fade-right">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/8">
              <Link to="/admin" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display font-semibold text-sm">
                  IPAN <span className="text-primary">STORE</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-white/8 space-y-3">
              {adminUser && (
                <p className="text-xs font-medium text-muted-foreground truncate px-1">
                  {adminUser.email}
                </p>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-white/8 flex items-center px-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold text-sm">
              IPAN <span className="text-primary">STORE</span> Admin
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
