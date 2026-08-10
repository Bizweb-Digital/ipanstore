import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <SEOHead title="404 Not Found | IPAN STORE" description="Halaman tidak ditemukan." />
      <div className="min-h-screen bg-zinc-950 relative overflow-hidden flex items-center justify-center p-4">
        {/* Subtle grid + faint glow */}
        <div className="absolute inset-0 hero-grid pointer-events-none" />
        <div className="absolute inset-0 hero-glow pointer-events-none" />

        <div className="relative z-10 max-w-md w-full text-center">
          <p className="font-mono text-7xl md:text-8xl font-bold text-zinc-500 tracking-tight mb-6">
            404
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 mb-3">
            System Failure
          </h1>
          <p className="text-zinc-400 text-sm mb-10">
            Halaman yang kamu cari tidak ditemukan atau telah dipindahkan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
