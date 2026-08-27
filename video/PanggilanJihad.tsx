import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const RESCALE_FACTOR = 0.78;

export type PanggilanJihadProps = {
  website?: string;
};

const GREEN_SCREEN = "#00ff00";
// Image 1 — semua scene +5 detik @60fps (280 -> 580), jatuh pas di akhir durasi
const MESSAGE_FRAMES = 580;
const LOOP_FRAMES = MESSAGE_FRAMES * 6;
const ENTER_FRAMES = 24;
const EXIT_START = 480;
const EXIT_END = MESSAGE_FRAMES - 4;
const EXIT_DROP_FRAMES = 40;
const COMPOSITION_WIDTH = 1920;
const RAIL_WIDTH = COMPOSITION_WIDTH;
// Centered + slightly larger than thin Image 1 — 120px tall, vertically centered, independent of RESCALE
const RAIL_HEIGHT = 120;
const RAIL_TOP = Math.round((1080 - 120) / 2);

// Center zone: 2 messages, shown one at a time
const centerMessages = [
  {
    lines: ["CARA DI LAGAIN GIMANA? OPTES VS IPAN", "LINK GB IPAN KE BIO"],
    size: Math.round(30 * RESCALE_FACTOR),
  },
  {
    lines: [
      "OPTES LAGA IPAN",
      "11 10K GW NET",
      "22 15K GW 2 KAYU",
      "SKIP ANTRI 20K",
      "11 HF 5K || 22 HF 8K",
    ],
    size: Math.round(24 * RESCALE_FACTOR),
  },
];

// Left zone: 3 messages, shown one at a time
const leftMessages = [
  {
    lines: ["LU WIN?", "GW RESET WS", "+ GW FOLLBACK"],
    size: Math.round(28 * RESCALE_FACTOR),
  },
  {
    lines: ["BANTU POSTUL", "LIVE GW"],
    size: Math.round(30 * RESCALE_FACTOR),
  },
  {
    lines: ["TAP TAP", "SAMPE 10K"],
    size: Math.round(32 * RESCALE_FACTOR),
  },
];

// Right zone: 2 messages, shown one at a time
const rightMessages = [
  {
    lines: ["JASA PEMBUATAN", "WEBSITE? KE BIO"],
    size: Math.round(26 * RESCALE_FACTOR),
  },
  {
    lines: ["CONTOH WEBSITE BISA", "CEK KE ipanstore.id"],
    size: Math.round(25 * RESCALE_FACTOR),
  },
];

const sceneThemes = [
  { dark: "#121212", mid: "#303030", light: "rgba(255,255,255,0.12)" },
  { dark: "#202020", mid: "#444444", light: "rgba(255,255,255,0.16)" },
  { dark: "#171717", mid: "#383838", light: "rgba(255,255,255,0.1)" },
  { dark: "#252525", mid: "#4A4A4A", light: "rgba(255,255,255,0.14)" },
  { dark: "#1C1C1C", mid: "#3E3E3E", light: "rgba(255,255,255,0.13)" },
  { dark: "#151515", mid: "#343434", light: "rgba(255,255,255,0.11)" },
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const easeInQuad = (t: number) => t * t;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

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
        width: Math.round(12 * RESCALE_FACTOR),
        background: "#94A3B8",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: Math.round(36 * RESCALE_FACTOR),
        top: Math.round(46 * RESCALE_FACTOR),
        width: Math.round(88 * RESCALE_FACTOR),
        height: Math.round(6 * RESCALE_FACTOR),
        background: "#94A3B8",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: Math.round(36 * RESCALE_FACTOR),
        top: Math.round(63 * RESCALE_FACTOR),
        width: Math.round(44 * RESCALE_FACTOR),
        height: Math.round(3 * RESCALE_FACTOR),
        background: "rgba(148, 163, 184, 0.48)",
      }}
    />
  </>
);

const electricPath = (frame: number) => {
  const phase = ((frame % 120) / 120) * Math.PI * 2;
  const points: string[] = [];
  const edgeNoise = (index: number, seed: number) =>
    Math.sin(index * 2.17 + phase * 1.7 + seed) * 2.8 +
    Math.sin(index * 5.41 - phase * 2.2 + seed * 2) * 1.4;

  for (let x = 0, index = 0; x <= RAIL_WIDTH; x += Math.round(32 * RESCALE_FACTOR), index++) {
    points.push(`${x},${3 + edgeNoise(index, 0)}`);
  }
  for (let y = Math.round(32 * RESCALE_FACTOR), index = 0; y <= RAIL_HEIGHT; y += Math.round(32 * RESCALE_FACTOR), index++) {
    points.push(`${RAIL_WIDTH - Math.round(3 * RESCALE_FACTOR) + edgeNoise(index, 3)},${y}`);
  }
  for (let x = RAIL_WIDTH - Math.round(32 * RESCALE_FACTOR), index = 0; x >= 0; x -= Math.round(32 * RESCALE_FACTOR), index++) {
    points.push(`${x},${RAIL_HEIGHT - 3 + edgeNoise(index, 6)}`);
  }
  for (let y = RAIL_HEIGHT - Math.round(32 * RESCALE_FACTOR), index = 0; y >= 0; y -= Math.round(32 * RESCALE_FACTOR), index++) {
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
        <filter id="jihad-electric-glow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation={Math.round(8 * RESCALE_FACTOR)} result="blur" />
        </filter>
      </defs>
      <path d={path} fill="none" stroke="#94A3B8" strokeWidth={Math.round(10 * RESCALE_FACTOR)} opacity="0.24" filter="url(#jihad-electric-glow)" />
      <path
        d={path}
        fill="none"
        stroke="#94A3B8"
        strokeWidth={Math.round(3 * RESCALE_FACTOR)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d={path}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={Math.round(1.5 * RESCALE_FACTOR)}
        strokeDasharray={`${Math.round(22 * RESCALE_FACTOR)} ${Math.round(38 * RESCALE_FACTOR)}`}
        strokeDashoffset={-phase * 240}
        strokeLinecap="round"
        opacity={0.6 + sparkOpacity * 0.3}
      />
      {[0, 1, 2, 3].map((corner) => {
        const x = corner % 2 === 0 ? Math.round(18 * RESCALE_FACTOR) : RAIL_WIDTH - Math.round(18 * RESCALE_FACTOR);
        const y = corner < 2 ? Math.round(18 * RESCALE_FACTOR) : RAIL_HEIGHT - Math.round(18 * RESCALE_FACTOR);
        const direction = corner % 2 === 0 ? 1 : -1;

        return (
          <path
            key={corner}
            d={`M ${x} ${y} l ${direction * Math.round(28 * RESCALE_FACTOR)} 0 M ${x} ${y} l 0 ${corner < 2 ? Math.round(28 * RESCALE_FACTOR) : -Math.round(28 * RESCALE_FACTOR)}`}
            stroke="#CBD5E1"
            strokeWidth={Math.round(2 * RESCALE_FACTOR)}
            strokeLinecap="round"
            opacity={sparkOpacity}
          />
        );
      })}
    </svg>
  );
};

type ZoneMessage = { lines: string[]; size: number };

const ZoneText = ({
  messages,
  loopFrame,
  website,
}: {
  messages: ZoneMessage[];
  loopFrame: number;
  website: string;
}) => {
  const sceneIndex = Math.floor(loopFrame / MESSAGE_FRAMES) % messages.length;
  const sceneFrame = loopFrame % MESSAGE_FRAMES;
  const message = messages[sceneIndex];
  const lines = message.lines.map((line) => line.replace("ipanstore.id", website));

  const enterProgress = easeOutCubic(clamp01(sceneFrame / ENTER_FRAMES));
  const enterOpacity = clamp01(sceneFrame / 12);
  const enterY = (1 - enterProgress) * Math.round(26 * RESCALE_FACTOR);
  const popScale = interpolate(
    sceneFrame,
    [0, ENTER_FRAMES, MESSAGE_FRAMES],
    [0.9, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const totalChars = lines.reduce((sum, line) => sum + line.length, 0);
  let charCursor = 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
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
          padding: `${Math.round(4 * RESCALE_FACTOR)}px ${Math.round(14 * RESCALE_FACTOR)}px ${Math.round(8 * RESCALE_FACTOR)}px`,
          color: "#F4F4F5",
          fontFamily: "Bowlby One SC, Impact, Arial Black, Arial, sans-serif",
          fontSize: message.size,
          fontWeight: 400,
          letterSpacing: "0.01em",
          lineHeight: 1.12,
          textAlign: "center",
          textTransform: "uppercase",
          WebkitTextStroke: `${Math.round(2.5 * RESCALE_FACTOR)}px #080808`,
          paintOrder: "stroke fill",
          textShadow: `0 ${Math.round(3 * RESCALE_FACTOR)}px 0 #080808, 0 ${Math.round(6 * RESCALE_FACTOR)}px ${Math.round(9 * RESCALE_FACTOR)}px rgba(0,0,0,0.3)`,
        }}
      >
        {lines.map((line) => (
          <div key={line} style={{ whiteSpace: "nowrap" }}>
            {Array.from(line).map((char) => {
              const charIndex = charCursor++;
              const drop = easeInQuad(
                charExitProgress(sceneFrame, charIndex, totalChars),
              );
              const charY = drop * drop * Math.round(190 * RESCALE_FACTOR);
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
};

const OverlayRail = ({ frame, website }: { frame: number; website: string }) => {
  const loopFrame = frame % LOOP_FRAMES;
  const themeIndex = Math.floor(loopFrame / MESSAGE_FRAMES) % sceneThemes.length;
  const scene = sceneThemes[themeIndex];
  const sceneFrame = loopFrame % MESSAGE_FRAMES;
  const accentPulse = 0.55 + Math.sin(((frame % 120) / 120) * Math.PI * 2) * 0.2;
  // Stay: no blink/hilang/ganti — floating terbang atas-bawah seperti LAGA IPAN referensi
  const logoOpacity = 1;
  const logoX = 0;
  const logoScale = 1;
  const floatY = Math.sin((frame / 60) * Math.PI * 0.9) * 3.5;
  const floatRot = Math.sin((frame / 60) * Math.PI * 0.5) * 0.6;
  // LAGA IPAN audit: diagonal shining sweep like 3D glossy text + soft bright pulse
  const SHINE_CYCLE = 150;
  const SHINE_DURATION = 36;
  const shineFrame = frame % SHINE_CYCLE;
  const shineT = clamp01(shineFrame / SHINE_DURATION);
  const shineActive = shineFrame < SHINE_DURATION;
  const shineX = interpolate(shineT, [0, 1], [-Math.round(120 * RESCALE_FACTOR), Math.round(220 * RESCALE_FACTOR)]);
  const shineOpacity = shineActive ? interpolate(shineT, [0, 0.15, 0.5, 0.85, 1], [0, 0.95, 0.9, 0.95, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const shineBright = shineActive ? interpolate(shineT, [0, 0.5, 1], [0, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: RAIL_TOP,
        height: RAIL_HEIGHT,
        background: `linear-gradient(135deg, ${scene.dark} 0%, ${scene.mid} 46%, ${scene.dark} 100%)`,
        borderTop: `${Math.round(3 * RESCALE_FACTOR)}px solid #94A3B8`,
        borderBottom: `1px solid rgba(148, 163, 184, 0.52)`,
        boxShadow: `0 ${Math.round(14 * RESCALE_FACTOR)}px ${Math.round(34 * RESCALE_FACTOR)}px rgba(0, 0, 0, 0.34)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(ellipse at 18% 30%, ${scene.light}, transparent 22%), radial-gradient(ellipse at 72% 72%, rgba(0,0,0,0.24), transparent 28%), repeating-linear-gradient(135deg, transparent 0 ${Math.round(34 * RESCALE_FACTOR)}px, rgba(255,255,255,0.045) ${Math.round(35 * RESCALE_FACTOR)}px ${Math.round(38 * RESCALE_FACTOR)}px, transparent ${Math.round(39 * RESCALE_FACTOR)}px ${Math.round(78 * RESCALE_FACTOR)}px), repeating-linear-gradient(40deg, rgba(0,0,0,0.1) 0 ${Math.round(2 * RESCALE_FACTOR)}px, transparent ${Math.round(3 * RESCALE_FACTOR)}px ${Math.round(14 * RESCALE_FACTOR)}px)`,
        }}
      />

      <CornerMarks />
      <ElectricBorder frame={frame} />

      {/* Flex row: logo cap + 3 zones - fills 1920 width proportionally */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "stretch",
          zIndex: 2,
        }}
      >
        <div
          style={{
            flex: `0 0 ${Math.round(190 * RESCALE_FACTOR)}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            clipPath: "polygon(0 0, 100% 0, 84% 100%, 0 100%)",
            background: `rgba(13, 13, 14, ${0.62 + accentPulse * 0.12})`,
            borderRight: "1px solid rgba(226, 232, 240, 0.38)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: Math.round(140 * RESCALE_FACTOR),
              height: Math.round(88 * RESCALE_FACTOR),
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
                width: Math.round(140 * RESCALE_FACTOR),
                height: Math.round(88 * RESCALE_FACTOR),
                objectFit: "contain",
                display: "block",
              }}
            />
            {/* LAGA IPAN shining sweep — diagonal white bar */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(105deg, transparent 35%, rgba(255,255,255,0) 42%, rgba(255,255,255,${0.95}) 50%, rgba(255,255,255,0) 58%, transparent 65%)`,
                transform: `translateX(${shineX}px) skewX(-18deg)`,
                opacity: shineOpacity,
                mixBlendMode: "screen",
                pointerEvents: "none",
              }}
            />
            {/* soft outer glow during shine */}
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

        {/* Left zone: 3 rotating messages - ratio 480 */}
        <div
          style={{
            flex: "1 1 0",
            position: "relative",
            borderRight: "1px solid rgba(148, 163, 184, 0.34)",
            fontFamily: "Arial, Helvetica, sans-serif",
            overflow: "hidden",
          }}
        >
          <ZoneText messages={leftMessages} loopFrame={loopFrame} website={website} />
        </div>

        {/* Center zone: 2 rotating messages - wider (700) */}
        <div
          style={{
            flex: "1.45 1 0",
            position: "relative",
            fontFamily: "Arial, Helvetica, sans-serif",
            overflow: "hidden",
          }}
        >
          <ZoneText messages={centerMessages} loopFrame={loopFrame} website={website} />
        </div>

        {/* Right zone: 2 rotating messages - ratio ~540 */}
        <div
          style={{
            flex: "1.12 1 0",
            position: "relative",
            borderLeft: "1px solid rgba(148, 163, 184, 0.34)",
            fontFamily: "Arial, Helvetica, sans-serif",
            overflow: "hidden",
          }}
        >
          <ZoneText messages={rightMessages} loopFrame={loopFrame} website={website} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: Math.round(120 * RESCALE_FACTOR),
          right: Math.round(280 * RESCALE_FACTOR),
          bottom: Math.round(18 * RESCALE_FACTOR),
          height: Math.round(2 * RESCALE_FACTOR),
          background: "rgba(148, 163, 184, 0.28)",
          zIndex: 3,
        }}
      />
    </div>
  );
};

export const PanggilanJihad = ({ website = "ipanstore.id" }: PanggilanJihadProps) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: GREEN_SCREEN, overflow: "hidden" }}>
      <style>{`@font-face { font-family: 'Bowlby One SC'; src: url('${staticFile("fonts/BowlbyOneSC-Regular.ttf")}') format('truetype'); font-weight: 400; font-style: normal; }`}</style>
      <OverlayRail frame={frame} website={website} />
    </AbsoluteFill>
  );
};
