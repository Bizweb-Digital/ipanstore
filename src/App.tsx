import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoadingScreen from "./components/LoadingScreen";
import Index from "./pages/Index";
import Layanan from "./pages/Layanan";
import BoostFpsFreeFire from "./pages/BoostFpsFreeFire";
import TweakingPcGaming from "./pages/TweakingPcGaming";
import Paket from "./pages/Paket";
import TestimoniPage from "./pages/TestimoniPage";
import Faq from "./pages/Faq";
import Kontak from "./pages/Kontak";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);

  const handleLoadingComplete = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {loading && <LoadingScreen onComplete={handleLoadingComplete} />}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/layanan" element={<Layanan />} />
            <Route path="/layanan/boost-fps-free-fire" element={<BoostFpsFreeFire />} />
            <Route path="/layanan/tweaking-pc-gaming" element={<TweakingPcGaming />} />
            <Route path="/paket" element={<Paket />} />
            <Route path="/testimoni" element={<TestimoniPage />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/kontak" element={<Kontak />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
