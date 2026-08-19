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
const FADE_FRAMES = 18;
const RAIL_WIDTH = 1920;
const RAIL_HEIGHT = 316;

const messages = [
  { lines: ["Mau Aim Kalian Stabil?"], size: 46 },
  { lines: ["Mouse dan Analog suka stuck bareng emulator?"], size: 32 },
  {
    lines: [
      "Langsung aja Order Ipan APP SettinX V1",
      "Dan dapatkan diskon dengan kode HEMAT5",
    ],
    size: 25,
  },
  { lines: ["Kunjungi Website ipanstore.id"], size: 40 },
];

const sceneThemes = [
  { dark: "#121212", mid: "#303030", light: "rgba(255,255,255,0.12)" },
  { dark: "#202020", mid: "#444444", light: "rgba(255,255,255,0.16)" },
  { dark: "#171717", mid: "#383838", light: "rgba(255,255,255,0.1)" },
  { dark: "#252525", mid: "#4A4A4A", light: "rgba(255,255,255,0.14)" },
];

const getRelativeFrame = (frame: number, messageIndex: number) => {
  const loopFrame = frame % LOOP_FRAMES;
  let relative = loopFrame - messageIndex * MESSAGE_FRAMES;

  if (relative < -FADE_FRAMES) relative += LOOP_FRAMES;
  if (relative > MESSAGE_FRAMES) relative -= LOOP_FRAMES;

  return relative;
};

const messageOpacity = (relative: number) => {
  if (relative < 0) {
    return interpolate(relative, [-FADE_FRAMES, 0], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return interpolate(
    relative,
    [0, MESSAGE_FRAMES - FADE_FRAMES, MESSAGE_FRAMES],
    [1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
};

const messageOffset = (relative: number) => {
  if (relative < 0) {
    return interpolate(relative, [-FADE_FRAMES, 0], [22, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return interpolate(relative, [0, MESSAGE_FRAMES], [0, -22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
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
  const accentPulse = 0.55 + Math.sin((frame % 120) / 120 * Math.PI * 2) * 0.2;
  const logoSceneFrame = frame % MESSAGE_FRAMES;
  const logoOpacity = interpolate(
    logoSceneFrame,
    [0, 14, MESSAGE_FRAMES - 18, MESSAGE_FRAMES],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const logoX = interpolate(
    logoSceneFrame,
    [0, 14, MESSAGE_FRAMES - 18, MESSAGE_FRAMES],
    [-54, 0, 0, 54],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const logoScale = interpolate(
    logoSceneFrame,
    [0, 14, MESSAGE_FRAMES - 18, MESSAGE_FRAMES],
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
        top: 382,
        height: 316,
        background: `linear-gradient(135deg, ${scene.dark} 0%, ${scene.mid} 46%, ${scene.dark} 100%)`,
        borderTop: "3px solid #94A3B8",
        borderBottom: "1px solid rgba(148, 163, 184, 0.52)",
        boxShadow: "0 18px 44px rgba(0, 0, 0, 0.34)",
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
          width: 318,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          clipPath: "polygon(0 0, 100% 0, 86% 100%, 0 100%)",
          background: `rgba(13, 13, 14, ${0.62 + accentPulse * 0.12})`,
          borderRight: "1px solid rgba(226, 232, 240, 0.38)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 236,
            height: 148,
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
              width: 236,
              height: 148,
              objectFit: "contain",
              filter: "drop-shadow(0 0 14px rgba(34, 211, 238, 0.26))",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 300,
          right: 54,
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
          const relative = getRelativeFrame(frame, index);
          const opacity = messageOpacity(relative);
          const y = messageOffset(relative);
          const x = interpolate(relative, [-FADE_FRAMES, 0, MESSAGE_FRAMES], [30, 0, -12], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const popScale = interpolate(
            relative,
            [-FADE_FRAMES, 0, 12, MESSAGE_FRAMES - FADE_FRAMES, MESSAGE_FRAMES],
            [0.92, 0.98, 1, 1, 0.96],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

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
                opacity,
                transform: `translate(${x}px, ${y}px) scale(${popScale})`,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  maxWidth: "100%",
                  padding: "10px 26px 14px",
                  color: "#F4F4F5",
                  fontFamily: "Bowlby One SC, Impact, Arial Black, Arial, sans-serif",
                  fontSize: message.size,
                  fontWeight: 400,
                  letterSpacing: "0.01em",
                  lineHeight: 1.08,
                  textAlign: "center",
                  textTransform: "uppercase",
                  WebkitTextStroke: "3px #080808",
                  paintOrder: "stroke fill",
                  textShadow: "0 4px 0 #080808, 0 7px 10px rgba(0,0,0,0.3)",
                }}
              >
                {message.lines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 152,
          right: 360,
          bottom: 26,
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
