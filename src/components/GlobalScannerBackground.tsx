import Scanner from "./Scanner";

/**
 * GlobalScannerBackground — latar animasi Scanner (React Bits) yang fixed
 * menutupi seluruh viewport. Karena fixed, efek scanner tetap terlihat di
 * bagian manapun halaman saat user scroll, dan karena dipasang sekali di
 * Layout, efek ini hadir di semua page.
 *
 * Catatan integrasi:
 * - `pointer-events-none` agar tidak menghalangi klik/hover konten.
 * - Canvas Scanner sendiri punya IntersectionObserver + visibilitychange,
 *   jadi render loop otomatis berhenti saat tab tidak aktif (hemat GPU).
 * - `aria-hidden` karena murni dekoratif.
 * - z-index 0: berada di atas warna dasar body tapi di bawah konten yang
 *   umumnya memakai `relative z-10`.
 */
const GlobalScannerBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
    >
      <Scanner
        color1="#94A3B8"
        color2="#CBD5E1"
        color3="#FFFFFF"
        speed={0.4}
        sweepSpeed={0.2}
        sweepWidth={1.8}
        sweepFalloff={6}
        scale={1.6}
        frequency={2}
        ripple={0.2}
        bandDensity={12}
        lineSharpness={5.5}
        glow={0.2}
        scanDirection="vertical"
        colorSpread={0.7}
        brightness={0.9}
        contrast={1.1}
        softness={1.5}
        vignette={0.5}
        scanline={true}
        grain={true}
        grainIntensity={0.04}
        opacity={0.5}
        mouseInteraction={true}
        mouseRadius={0.4}
        mouseStrength={0.4}
        className="opacity-25"
      />
    </div>
  );
};

export default GlobalScannerBackground;
