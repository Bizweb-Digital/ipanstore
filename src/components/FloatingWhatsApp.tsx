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
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 group flex items-center justify-center"
    >
      {/* Pulse rings */}
      <span className="absolute h-full w-full rounded-full bg-[#25D366] opacity-30 animate-ping duration-1000" />
      <span className="absolute h-[120%] w-[120%] rounded-full bg-[#25D366] opacity-10 animate-ping duration-1000 delay-150" />
      
      {/* Main button */}
      <div className="relative flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(37,211,102,0.6)]">
        <FaWhatsapp className="h-7 w-7 md:h-8 md:w-8" />
      </div>

      {/* Tooltip */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0">
        <div className="bg-[#101827] border border-white/10 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
          Chat Admin
        </div>
        {/* Triangle arrow */}
        <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-[#101827] -ml-[1px]" />
      </div>
    </a>
  );
};

export default FloatingWhatsApp;
export { WA_LINK, WA_NUMBER };
