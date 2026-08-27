import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export type IpanStorePromoProps = {
  website?: string;
};

const GREEN_SCREEN = "#00ff00";
// Perpanjang seluruh teks +5 detik @60fps (240 -> 540), jatuh pas
const LOOP_FRAMES = 2160;
const MESSAGE_FRAMES = 540;
const ENTER_FRAMES = 24;
const EXIT_START = 452;
const EXIT_END = MESSAGE_FRAMES - 4;
const EXIT_DROP_FRAMES = 32;
const RAIL_WIDTH = 1920;
// Centered + 147 -> 154 (+5% 24 Aug)
const RAIL_HEIGHT = 154;
const RAIL_TOP = Math.round((1080 - 154) / 2);

const messages = [
  { lines: ["Mau Aim Kalian Stabil?"], size: 54 },
  { lines: ["Mouse dan Analog suka stuck bareng emulator?"], size: 41 },
  {
    lines: [
      "Langsung aja Order Ipan APP SettinX V1",
      "Dan dapatkan diskon dengan kode HEMAT5",
    ],
    size: 30,
  },
  { lines: ["Kunjungi Website ipanstore.id"], size: 46 },
];

const sceneThemes = [
  { dark: "#121212", mid: "#303030", light: "rgba(255,255,255,0.12)" },
  { dark: "#202020", mid: "#444444", light: "rgba(255,255,255,0.16)" },
  { dark: "#171717", mid: "#383838", light: "rgba(255,255,255,0.1)" },
  { dark: "#252525", mid: "#4A4A4A", light: "rgba(255,255,255,0.14)" },
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const easeInQuad = (t: number) => t * t;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Progress 0→1 untuk satu karakter saat scene-nya berakhir.
 * Karakter PALING KANAN jatuh duluan, lalu berurutan ke kiri.
 * Stagger dihitung dinamis agar huruf terakhir (paling kiri) SELESAI
 * jatuh tepat di EXIT_END — jadi teks berjatuhan sampai habis dulu,
 * baru berganti ke teks berikutnya.
 */
const charExitProgress = (
  sceneFrame: number,
  charIndex: number,
  totalChars: number,
) => {
  const fromRight = totalChars - 1 - charIndex;
  const stagger =
    totalChars > 1
      ? Math.max(0, (EXIT_END - EXIT_DROP_FRAMES - EXIT_START) / (totalChars - 1))
      : 0;
  const start = EXIT_START + fromRight * stagger;

  return clamp01((sceneFrame - start) / EXIT_DROP_FRAMES);
};

const CornerMarks = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 7,
        background: "#94A3B8",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 22,
        top: 28,
        width: 54,
        height: 3,
        background: "#94A3B8",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 22,
        top: 39,
        width: 27,
        height: 2,
        background: "rgba(148, 163, 184, 0.48)",
      }}
    />
  </>
);

const electricPath = (frame: number) => {
  const phase = (frame % 120) / 120 * Math.PI * 2;
  const points: string[] = [];
  const edgeNoise = (index: number, seed: number) =>
    Math.sin(index * 2.17 + phase * 1.7 + seed) * 2.8 +
    Math.sin(index * 5.41 - phase * 2.2 + seed * 2) * 1.4;

  for (let x = 0, index = 0; x <= RAIL_WIDTH; x += 32, index++) {
    points.push(`${x},${3 + edgeNoise(index, 0)}`);
  }
  for (let y = 32, index = 0; y <= RAIL_HEIGHT; y += 32, index++) {
    points.push(`${RAIL_WIDTH - 3 + edgeNoise(index, 3)},${y}`);
  }
  for (let x = RAIL_WIDTH - 32, index = 0; x >= 0; x -= 32, index++) {
    points.push(`${x},${RAIL_HEIGHT - 3 + edgeNoise(index, 6)}`);
  }
  for (let y = RAIL_HEIGHT - 32, index = 0; y >= 0; y -= 32, index++) {
    points.push(`${3 + edgeNoise(index, 9)},${y}`);
  }

  return `M ${points.join(" L ")} Z`;
};

const ElectricBorder = ({ frame }: { frame: number }) => {
  const phase = (frame % 120) / 120;
  const path = electricPath(frame);
  const sparkOpacity = 0.45 + Math.abs(Math.sin(phase * Math.PI * 2)) * 0.55;

  return (
    <svg
      viewBox={`0 0 ${RAIL_WIDTH} ${RAIL_HEIGHT}`}
      width={RAIL_WIDTH}
      height={RAIL_HEIGHT}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 4,
        pointerEvents: "none",
        overflow: "visible",
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="ipan-electric-glow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
        </filter>
      </defs>
      <path d={path} fill="none" stroke="#94A3B8" strokeWidth="6" opacity="0.24" filter="url(#ipan-electric-glow)" />
      <path
        d={path}
        fill="none"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d={path}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="1"
        strokeDasharray="13 23"
        strokeDashoffset={-phase * 240}
        strokeLinecap="round"
        opacity={0.6 + sparkOpacity * 0.3}
      />
      {[0, 1, 2, 3].map((corner) => {
        const x = corner % 2 === 0 ? 11 : RAIL_WIDTH - 11;
        const y = corner < 2 ? 11 : RAIL_HEIGHT - 11;
        const direction = corner % 2 === 0 ? 1 : -1;

        return (
          <path
            key={corner}
            d={`M ${x} ${y} l ${direction * 17} ${corner < 2 ? 0 : 0} M ${x} ${y} l 0 ${corner < 2 ? 17 : -17}`}
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeLinecap="round"
            opacity={sparkOpacity}
          />
        );
      })}
    </svg>
  );
};

const OverlayRail = ({ frame, website }: { frame: number; website: string }) => {
  const loopFrame = frame % LOOP_FRAMES;
  const sceneIndex = Math.floor(loopFrame / MESSAGE_FRAMES);
  const scene = sceneThemes[sceneIndex];
  const sceneFrame = loopFrame % MESSAGE_FRAMES;
  const accentPulse = 0.55 + Math.sin((frame % 120) / 120 * Math.PI * 2) * 0.2;
  // Stay: no blink/hilang/ganti — floating terbang atas-bawah seperti LAGA IPAN referensi
  const logoOpacity = 1;
  const logoX = 0;
  const logoScale = 1;
  const floatY = Math.sin((frame / 60) * Math.PI * 0.9) * 3.5;
  const floatRot = Math.sin((frame / 60) * Math.PI * 0.5) * 0.6;
  // LAGA IPAN audit: diagonal shining sweep + bright pulse (same as panggilan-jihad)
  const SHINE_CYCLE = 150;
  const SHINE_DURATION = 36;
  const shineFrame = frame % SHINE_CYCLE;
  const shineT = clamp01(shineFrame / SHINE_DURATION);
  const shineActive = shineFrame < SHINE_DURATION;
  const shineX = interpolate(shineT, [0, 1], [-90, 170]);
  const shineOpacity = shineActive ? interpolate(shineT, [0, 0.15, 0.5, 0.85, 1], [0, 0.95, 0.9, 0.95, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const shineBright = shineActive ? interpolate(shineT, [0, 0.5, 1], [0, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const resolvedMessages = messages.map((message) => ({
    ...message,
    lines: message.lines.map((line) => line.replace("ipanstore.id", website)),
  }));

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: RAIL_TOP,
        height: RAIL_HEIGHT,
        background: `linear-gradient(135deg, ${scene.dark} 0%, ${scene.mid} 46%, ${scene.dark} 100%)`,
        borderTop: "2px solid #94A3B8",
        borderBottom: "1px solid rgba(148, 163, 184, 0.52)",
        boxShadow: "0 8px 21px rgba(0, 0, 0, 0.34)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(ellipse at 18% 30%, ${scene.light}, transparent 22%), radial-gradient(ellipse at 72% 72%, rgba(0,0,0,0.24), transparent 28%), repeating-linear-gradient(135deg, transparent 0 21px, rgba(255,255,255,0.045) 22px 23px, transparent 24px 48px), repeating-linear-gradient(40deg, rgba(0,0,0,0.1) 0 1px, transparent 2px 8px)`,
        }}
      />

      <CornerMarks />
      <ElectricBorder frame={frame} />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 179,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          clipPath: "polygon(0 0, 100% 0, 84% 100%, 0 100%)",
          background: `rgba(13, 13, 14, ${0.62 + accentPulse * 0.12})`,
          borderRight: "1px solid rgba(226, 232, 240, 0.38)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 133,
            height: 85,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: logoOpacity,
            transform: `translateX(${logoX}px) translateY(${floatY}px) scale(${logoScale}) rotate(${floatRot}deg)`,
            overflow: "hidden",
            filter: `drop-shadow(0 0 12px rgba(34, 211, 238, ${0.26 + shineBright * 0.4})) brightness(${1 + shineBright})`,
          }}
        >
          <Img
            src={staticFile("logo-transparent.png")}
            style={{
              width: 133,
              height: 85,
              objectFit: "contain",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(105deg, transparent 35%, rgba(255,255,255,0) 42%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 58%, transparent 65%)`,
              transform: `translateX(${shineX}px) skewX(-18deg)`,
              opacity: shineOpacity,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: -4,
              background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,${shineBright * 0.5}) 0%, transparent 70%)`,
              opacity: shineOpacity,
              pointerEvents: "none",
              filter: "blur(6px)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 169,
          right: 30,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {resolvedMessages.map((message, index) => {
          if (index !== sceneIndex) return null;

          // Masuk: sama seperti kondisi sekarang (pop + slide halus), sudah benar.
          const enterProgress = easeOutCubic(clamp01(sceneFrame / ENTER_FRAMES));
          const enterOpacity = clamp01(sceneFrame / 12);
          const enterY = (1 - enterProgress) * 16;
          const popScale = interpolate(
            sceneFrame,
            [0, ENTER_FRAMES, MESSAGE_FRAMES],
            [0.9, 1, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const totalChars = message.lines.reduce(
            (sum, line) => sum + line.length,
            0,
          );
          let charCursor = 0;

          return (
            <div
              key={message.lines.join("-")}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: enterOpacity,
                transform: `translateY(${enterY}px) scale(${popScale})`,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  maxWidth: "100%",
                  padding: "3px 12px 6px",
                  color: "#F4F4F5",
                  fontFamily: "Bowlby One SC, Impact, Arial Black, Arial, sans-serif",
                  fontSize: message.size,
                  fontWeight: 400,
                  letterSpacing: "0.01em",
                  lineHeight: 1.06,
                  textAlign: "center",
                  textTransform: "uppercase",
                  WebkitTextStroke: "1.5px #080808",
                  paintOrder: "stroke fill",
                  textShadow: "0 2px 0 #080808, 0 3px 5px rgba(0,0,0,0.3)",
                }}
              >
                {message.lines.map((line) => (
                  <div key={line} style={{ whiteSpace: "nowrap" }}>
                    {Array.from(line).map((char) => {
                      const charIndex = charCursor++;
                      // Keluar: huruf berjatuhan satu per satu dari KANAN ke KIRI.
                      const drop = easeInQuad(
                        charExitProgress(sceneFrame, charIndex, totalChars),
                      );
                      const charY = drop * drop * 118;
                      const charOpacity = 1 - drop;
                      const charRotate = drop * 14;

                      return (
                        <span
                          key={`${charIndex}-${char}`}
                          style={{
                            display: "inline-block",
                            whiteSpace: "pre",
                            opacity: charOpacity,
                            transform: `translateY(${charY}px) rotate(${charRotate}deg)`,
                          }}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 95,
          right: 223,
          bottom: 15,
          height: 1,
          background: "rgba(148, 163, 184, 0.28)",
        }}
      />
    </div>
  );
};

export const IpanStorePromo = ({ website = "ipanstore.id" }: IpanStorePromoProps) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: GREEN_SCREEN, overflow: "hidden" }}>
      <style>{`@font-face { font-family: 'Bowlby One SC'; src: url('${staticFile("fonts/BowlbyOneSC-Regular.ttf")}') format('truetype'); font-weight: 400; font-style: normal; }`}</style>
      <OverlayRail frame={frame} website={website} />
    </AbsoluteFill>
  );
};
