import { FaWhatsapp } from "react-icons/fa";

const WA_NUMBER = "6288976496870";
const WA_TEXT = encodeURIComponent("Halo min, saya mau optimize PC saya");
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;

const FloatingWhatsApp = () => {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp IPAN STORE"
      className="fixed bottom-6 right-6 z-50 group"
    >
      <span className="absolute inset-0 rounded-full bg-[hsl(142_70%_45%)] animate-ping opacity-30" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(142_70%_45%)] text-white shadow-[0_0_30px_hsl(142_70%_45%/0.6)] transition-transform group-hover:scale-110">
        <FaWhatsapp className="h-8 w-8" />
      </span>
      <span className="absolute right-20 top-1/2 -translate-y-1/2 hidden md:block whitespace-nowrap rounded-lg bg-card border border-border px-4 py-2 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity shadow-card">
        Chat Admin Sekarang
      </span>
    </a>
  );
};

export default FloatingWhatsApp;
export { WA_LINK, WA_NUMBER };
