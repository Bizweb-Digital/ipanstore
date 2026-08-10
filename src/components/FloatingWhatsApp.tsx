import { FaWhatsapp } from "react-icons/fa";

// Placeholder untuk diisi nanti jika berbeda, tapi untuk fungsional kita pakai default dulu
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
      className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-50 group flex items-center justify-center"
    >
      {/* Pulse ring */}
      <span className="absolute h-full w-full rounded-full bg-[#25D366] opacity-15 animate-ping [animation-duration:3s]" />

      {/* Main button */}
       <div className="relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-[#20bd5a]">
        <FaWhatsapp className="h-6 w-6 md:h-7 md:w-7" />
      </div>

      {/* Tooltip */}
      <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none -translate-x-2 group-hover:translate-x-0">
        {/* Triangle arrow */}
        <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-zinc-900 -mr-[1px]" />
        <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-xs px-4 py-2 rounded-md shadow-inset-highlight whitespace-nowrap">
          Chat Admin
        </div>
      </div>
    </a>
  );
};

export default FloatingWhatsApp;
export { WA_LINK, WA_NUMBER };
