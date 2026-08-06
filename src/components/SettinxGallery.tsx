import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type SettinxPhoto = {
  src: string;
  alt: string;
  caption: string;
};

const SETTINX_PHOTOS: SettinxPhoto[] = [
  {
    src: "/img/settinx/page-menu-app-settinx.png",
    alt: "Tampilan menu utama IPAN APP SettinX",
    caption: "PAGE MENU APP SETTINX",
  },
  {
    src: "/img/settinx/login-page-app-settinx.png",
    alt: "Tampilan login page IPAN APP SettinX",
    caption: "LOGIN PAGE IPAN APP SETTINX",
  },
];

const SettinxGallery = ({ compact = false }: { compact?: boolean }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = (i: number) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);
  const next = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % SETTINX_PHOTOS.length));
  const prev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + SETTINX_PHOTOS.length) % SETTINX_PHOTOS.length));

  return (
    <>
      <div className={`grid grid-cols-2 ${compact ? "gap-3 md:gap-4" : "gap-4 md:gap-6"} max-w-4xl mx-auto`}>
        {SETTINX_PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => open(i)}
            className="group relative block w-full rounded-2xl overflow-hidden border-2 border-gaming-accent/30 hover:border-gaming-accent bg-[#0B1120] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(56,189,248,0.35)]"
            aria-label={`Buka foto ${p.caption}`}
          >
            <div className={`relative ${compact ? "aspect-[16/10]" : "aspect-[16/10]"} bg-[#060A14]`}>
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060A14]/85 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 text-center">
              <span className="inline-block bg-gaming-accent/90 text-[#060A14] text-[10px] md:text-xs font-black px-2.5 md:px-3 py-1 rounded-md uppercase tracking-wider shadow-[0_0_10px_rgba(56,189,248,0.4)]">
                {p.caption}
              </span>
            </div>
            <div className="absolute inset-0 bg-gaming-accent/0 group-hover:bg-gaming-accent/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="font-display text-xs font-bold text-white tracking-widest uppercase">
                Klik untuk perbesar
              </span>
            </div>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-[#060A14]/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Tutup lightbox"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Foto berikutnya"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <figure
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={SETTINX_PHOTOS[lightboxIndex].src}
              alt={SETTINX_PHOTOS[lightboxIndex].alt}
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-gaming-accent/40 shadow-[0_0_40px_rgba(56,189,248,0.4)]"
            />
            <figcaption className="mt-4 text-center">
              <span className="inline-block bg-gaming-accent text-[#060A14] text-xs font-black px-4 py-1.5 rounded-md uppercase tracking-wider">
                {SETTINX_PHOTOS[lightboxIndex].caption}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
};

export default SettinxGallery;