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
const LOOP_FRAMES = 480;
const MESSAGE_FRAMES = 120;
const ENTER_FRAMES = 12;
const EXIT_START = 76;
const EXIT_END = MESSAGE_FRAMES - 2;
const EXIT_DROP_FRAMES = 16;
const RAIL_WIDTH = 1920;
const RAIL_HEIGHT = 200;
const RAIL_TOP = 440;

const messages = [
  { lines: ["Mau Aim Kalian Stabil?"], size: 54 },
  { lines: ["Mouse dan Analog suka stuck bareng emulator?"], size: 40 },
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
        width: 12,
        background: "#94A3B8",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 36,
        top: 46,
        width: 88,
        height: 6,
        background: "#94A3B8",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 36,
        top: 63,
        width: 44,
        height: 3,
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
          <feGaussianBlur stdDeviation="8" result="blur" />
        </filter>
      </defs>
      <path d={path} fill="none" stroke="#94A3B8" strokeWidth="10" opacity="0.24" filter="url(#ipan-electric-glow)" />
      <path
        d={path}
        fill="none"
        stroke="#94A3B8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d={path}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        strokeDasharray="22 38"
        strokeDashoffset={-phase * 240}
        strokeLinecap="round"
        opacity={0.6 + sparkOpacity * 0.3}
      />
      {[0, 1, 2, 3].map((corner) => {
        const x = corner % 2 === 0 ? 18 : RAIL_WIDTH - 18;
        const y = corner < 2 ? 18 : RAIL_HEIGHT - 18;
        const direction = corner % 2 === 0 ? 1 : -1;

        return (
          <path
            key={corner}
            d={`M ${x} ${y} l ${direction * 28} ${corner < 2 ? 0 : 0} M ${x} ${y} l 0 ${corner < 2 ? 28 : -28}`}
            stroke="#CBD5E1"
            strokeWidth="2"
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
  const logoOpacity = interpolate(
    sceneFrame,
    [0, 14, MESSAGE_FRAMES - 16, MESSAGE_FRAMES],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const logoX = interpolate(
    sceneFrame,
    [0, 14, MESSAGE_FRAMES - 16, MESSAGE_FRAMES],
    [-40, 0, 0, 40],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const logoScale = interpolate(
    sceneFrame,
    [0, 14, MESSAGE_FRAMES - 16, MESSAGE_FRAMES],
    [0.92, 1, 1, 0.92],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
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
        borderTop: "3px solid #94A3B8",
        borderBottom: "1px solid rgba(148, 163, 184, 0.52)",
        boxShadow: "0 14px 34px rgba(0, 0, 0, 0.34)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(ellipse at 18% 30%, ${scene.light}, transparent 22%), radial-gradient(ellipse at 72% 72%, rgba(0,0,0,0.24), transparent 28%), repeating-linear-gradient(135deg, transparent 0 34px, rgba(255,255,255,0.045) 35px 38px, transparent 39px 78px), repeating-linear-gradient(40deg, rgba(0,0,0,0.1) 0 2px, transparent 3px 14px)`,
        }}
      />

      <CornerMarks />
      <ElectricBorder frame={frame} />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 224,
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
            width: 168,
            height: 106,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: logoOpacity,
            transform: `translateX(${logoX}px) scale(${logoScale})`,
          }}
        >
          <Img
            src={staticFile("logo-transparent.png")}
            style={{
              width: 168,
              height: 106,
              objectFit: "contain",
              filter: "drop-shadow(0 0 12px rgba(34, 211, 238, 0.26))",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 212,
          right: 40,
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
          const enterOpacity = clamp01(sceneFrame / 6);
          const enterY = (1 - enterProgress) * 26;
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
                  padding: "6px 20px 10px",
                  color: "#F4F4F5",
                  fontFamily: "Bowlby One SC, Impact, Arial Black, Arial, sans-serif",
                  fontSize: message.size,
                  fontWeight: 400,
                  letterSpacing: "0.01em",
                  lineHeight: 1.06,
                  textAlign: "center",
                  textTransform: "uppercase",
                  WebkitTextStroke: "2.5px #080808",
                  paintOrder: "stroke fill",
                  textShadow: "0 3px 0 #080808, 0 6px 9px rgba(0,0,0,0.3)",
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
                      const charY = drop * drop * 190;
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
          left: 120,
          right: 280,
          bottom: 18,
          height: 2,
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
