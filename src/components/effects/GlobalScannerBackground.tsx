import Scanner from "./Scanner";

/**
 * GlobalScannerBackground — adaptif untuk mobile vs desktop
 */
const GlobalScannerBackground = () => {
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
    >
      <Scanner
        color1="#94A3B8"
        color2="#CBD5E1"
        color3="#FFFFFF"
        speed={isMobile ? 0.25 : 0.4}
        sweepSpeed={0.15}
        sweepWidth={isMobile ? 2.0 : 1.8}
        sweepFalloff={6}
        scale={isMobile ? 1.4 : 1.6}
        frequency={isMobile ? 1 : 2}
        ripple={0.1}
        bandDensity={isMobile ? 8 : 12}
        lineSharpness={5.5}
        glow={0.1}
        scanDirection="vertical"
        colorSpread={isMobile ? 0.4 : 0.7}
        brightness={0.9}
        contrast={1.1}
        softness={2.0}
        vignette={0.5}
        scanline={true}
        grain={true}
        grainIntensity={isMobile ? 0.02 : 0.04}
        opacity={0.35}
        mouseInteraction={!isMobile}
        mouseRadius={0.4}
        mouseStrength={0.3}
        className="opacity-25"
      />
    </div>
  );
};

export default GlobalScannerBackground;
