import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import ElectricBorder from "@/components/effects/ElectricBorder";
import VariableProximity from "@/components/effects/VariableProximity";

const launchBenefits = [
  "Bayar sekali, pakai selamanya (lifetime)",
  "Gabungan semua paket optimasi dalam 1 aplikasi",
  "Aman dengan fitur snapshot & rollback",
];

const LaunchPopup = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  // Ref area pelacakan mouse untuk efek VariableProximity pada judul.
  const popupRef = useRef<HTMLDivElement>(null);

  // Muncul setiap kali website dibuka / di-refresh (setelah loading screen).
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, []);

  // Jeda efek WebGL global (SplashCursor + Scanner) selama modal terbuka,
  // agar tidak membuang GPU/CPU di balik popup. Efek popup (ElectricBorder +
  // VariableProximity) tetap berjalan. Kembali normal saat modal ditutup.
  useEffect(() => {
    document.dispatchEvent(new CustomEvent("ipan:modal-state", { detail: { open } }));
  }, [open]);

  const goToOrder = () => {
    setOpen(false);
    navigate("/order?paket=app-settinx&kode=HEMAT5");
  };

  const scrollToProduct = () => {
    setOpen(false);
    const el = document.getElementById("app-settinx");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        aria-describedby="launch-popup-desc"
        className="max-w-[92vw] sm:max-w-md gap-0 overflow-hidden rounded-2xl border border-white/16 bg-[#0B0B0C] p-0 max-h-[90vh] overflow-y-auto"
      >
        <div ref={popupRef} className="relative">
          {/* Ambient glow atas — konsisten dengan kartu produk SettinX */}
          <div
            className="pointer-events-none absolute -inset-8 rounded-3xl"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(148,163,184,0.16), transparent 70%)",
              filter: "blur(28px)",
            }}
          />

          <div className="relative p-6 sm:p-8 text-center">
            <span className="gaming-badge-accent mb-4">Grand Launching</span>

            <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F5] mb-2">
              <VariableProximity
                label="IPAN APP SettinX V1"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={popupRef}
                radius={120}
                falloff="gaussian"
              />
            </DialogTitle>

            <DialogDescription
              id="launch-popup-desc"
              className="text-sm text-zinc-400 leading-relaxed"
            >
              Aplikasi tweak premium untuk emulator Free Fire. Optimalkan kontrol,
              raih FPS tinggi, dan aiming lebih presisi di setiap duel.
            </DialogDescription>

            {/* Harga — border elektrik bergerak (sama seperti katalog SettinX) */}
            <ElectricBorder
              color="#94A3B8"
              speed={0.8}
              chaos={0.08}
              borderRadius={16}
              className="relative mt-6"
            >
              <div className="relative rounded-xl bg-[#131314]/60 p-4">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <span className="font-mono text-sm text-zinc-600 line-through">Rp 100.000</span>
                  <span className="gaming-tag bg-red-500/10 !text-red-300 !border-red-400/30">
                    -5%
                  </span>
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F4F5] leading-none">
                  Rp 75.000
                </div>
                <p className="mt-2 text-xs text-green-400">
                  Pakai kode <span className="font-mono font-semibold">HEMAT5</span> → cukup bayar{" "}
                  <span className="font-mono font-semibold">Rp 71.250</span>
                </p>
              </div>
            </ElectricBorder>

            {/* Keunggulan */}
            <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left">
              {launchBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-[#F4F4F5]">
                  <BadgeCheck className="h-4 w-4 text-[#94A3B8] shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {/* Deadline */}
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#94A3B8]">
              Promo Grand Launching berakhir 31 Agustus 2026
            </p>

            {/* CTA */}
            <div className="mt-5 space-y-2.5">
              <Button
                onClick={goToOrder}
                size="lg"
                className="w-full bg-[#111111] text-white hover:bg-[#333333]"
              >
                Order Sekarang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                onClick={scrollToProduct}
                className="w-full text-xs text-zinc-400 transition-colors hover:text-[#F4F4F5]"
              >
                Lihat detail produk
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LaunchPopup;
