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
      <div className="min-h-screen bg-[#060A14] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="gaming-card p-10 md:p-16 max-w-md w-full text-center relative z-10 border-red-500/20">
          <div className="cyber-glitch-text font-display font-black text-7xl md:text-8xl text-red-500 mb-4 tracking-tighter" data-text="404">
            404
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-3">
            System Failure
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Halaman yang kamu cari tidak ditemukan atau telah dipindahkan.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild variant="gaming-glow" className="w-full">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full text-white/70 border-white/10 hover:bg-white/5 hover:text-white">
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
