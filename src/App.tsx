import { useState, useCallback, Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoadingScreen from "./components/LoadingScreen";
import PageSkeleton from "./components/PageSkeleton";
import Index from "./pages/Index";

// Route-level code splitting — halaman selain homepage di-load on-demand.
// Ini mencegah pengunjung homepage ikut mengunduh kode checkout, lightbox,
// depth carousel, FAQ, detail layanan, dan komponen halaman lain.
const Layanan = lazy(() => import("./pages/Layanan"));
const BoostFpsFreeFire = lazy(() => import("./pages/BoostFpsFreeFire"));
const TweakingPcGaming = lazy(() => import("./pages/TweakingPcGaming"));
const Paket = lazy(() => import("./pages/Paket"));
const Order = lazy(() => import("./pages/Order"));
const TestimoniPage = lazy(() => import("./pages/TestimoniPage"));
const Faq = lazy(() => import("./pages/Faq"));
const Kontak = lazy(() => import("./pages/Kontak"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  const [loading, setLoading] = useState(true);

  const handleLoadingComplete = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {loading && <LoadingScreen onComplete={handleLoadingComplete} />}
      <BrowserRouter>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/layanan" element={<Layanan />} />
            <Route path="/layanan/boost-fps-free-fire" element={<BoostFpsFreeFire />} />
            <Route path="/layanan/tweaking-pc-gaming" element={<TweakingPcGaming />} />
            <Route path="/paket" element={<Paket />} />
            <Route path="/order" element={<Order />} />
            <Route path="/testimoni" element={<TestimoniPage />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/kontak" element={<Kontak />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
