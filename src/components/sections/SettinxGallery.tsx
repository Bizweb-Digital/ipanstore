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
            className="group relative block w-full rounded-lg overflow-hidden border border-white/16 bg-[#0C0C0C] transition-colors duration-200 hover:border-white/24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Buka foto ${p.caption}`}
          >
            <div className="relative aspect-[16/10] bg-[#0C0C0C]">
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                decoding="async"
                width={1920}
                height={1080}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-3 text-center">
              <span className="inline-block font-mono text-[10px] md:text-xs uppercase tracking-wider text-[#F4F4F5] bg-[#0C0C0C]/85 border border-white/16 px-2.5 md:px-3 py-1 rounded-sm">
                {p.caption}
              </span>
            </div>
            <div className="absolute inset-0 bg-[#0C0C0C]/0 group-hover:bg-[#0C0C0C]/30 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="font-mono text-xs text-[#F4F4F5] uppercase tracking-wider bg-[#0C0C0C]/70 border border-white/24 px-3 py-1.5 rounded-sm">
                Klik untuk perbesar
              </span>
            </div>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-[#0C0C0C]/95 flex items-center justify-center p-4"
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
            className="absolute top-4 right-4 z-10 h-10 w-10 rounded-lg bg-[#131314] border border-white/16 hover:bg-white/5 hover:border-white/24 text-[#F4F4F5] flex items-center justify-center transition-colors duration-200"
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
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-lg bg-[#131314] border border-white/16 hover:bg-white/5 hover:border-white/24 text-[#F4F4F5] flex items-center justify-center transition-colors duration-200"
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
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-lg bg-[#131314] border border-white/16 hover:bg-white/5 hover:border-white/24 text-[#F4F4F5] flex items-center justify-center transition-colors duration-200"
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
              width={1920}
              height={1080}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg border border-white/16"
            />
            <figcaption className="mt-4 text-center">
              <span className="gaming-tag text-xs px-4 py-1.5 bg-[#131314] border-white/16 text-[#F4F4F5]">
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
