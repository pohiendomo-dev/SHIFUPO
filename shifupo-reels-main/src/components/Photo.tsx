import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import {
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, GOLD_GRADIENT, LOGO_IMAGE, PHOTO, VIDEO } from "../lib/brand";
import { drift, EASE, prog, springAt, SPRING } from "../lib/motion";

// Website photos as moving 2D pieces (docs/guides/09-ASET-WEBSITE-DAN-SCENE.md):
// never a still frame on screen. Every photo enters with weight, keeps
// pushing in slowly (Ken Burns) and leaves with a move.

const goldCss = `linear-gradient(135deg, ${GOLD_GRADIENT.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`;

type Box = { x: number; y: number; width: number; height: number };

// A diagonal band of light sweeping once across a photo.
const LightSweep: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const t = prog(frame, at, at + 26, EASE.inOut);
  if (t <= 0 || t >= 1) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(115deg, rgba(255,255,255,0) 35%, rgba(255,246,220,0.55) 50%, rgba(255,255,255,0) 65%)",
        transform: `translateX(${(t * 2.4 - 1.2) * 100}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

// One photo in a gold arch frame (round top, soft bottom corners).
export const ArchPhoto: React.FC<{
  src: string;
  box: Box;
  focus: { x: number; y: number };
  start: number;
  end: number;
  sweepAt: number;
  exitStart?: number;
}> = ({ src, box, focus, start, end, sweepAt, exitStart = Infinity }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = springAt(frame, start, fps, SPRING.heavy);
  const leave = prog(frame, exitStart, exitStart + 14, EASE.in);
  const zoom = interpolate(frame, [start, end], [...PHOTO.kenBurns], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });
  const top = box.width / 2;
  const radius = `${top}px ${top}px ${PHOTO.radius}px ${PHOTO.radius}px`;
  const inner = `${top - PHOTO.border}px ${top - PHOTO.border}px ${PHOTO.radius - 4}px ${PHOTO.radius - 4}px`;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        padding: PHOTO.border,
        borderRadius: radius,
        background: goldCss,
        transform: `translateY(${(1 - enter) * 120 - leave * 60}px) scale(${(0.9 + enter * 0.1) * (1 - leave * 0.06)})`,
        opacity: Math.min(1, enter * 1.6) * (1 - leave),
        boxShadow: "0 40px 70px rgba(18,16,14,0.32), 0 0 0 4px rgba(18,16,14,0.7)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: inner,
          overflow: "hidden",
          background: COLORS.ink,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focus.x}% ${focus.y}%`,
            transform: `scale(${zoom}) translate(${drift(`${src}x`, frame, 0.01) * 6}px, ${drift(`${src}y`, frame, 0.01) * 6}px)`,
            transformOrigin: `${focus.x}% ${focus.y}%`,
          }}
        />
        {/* Warm grade so website photos sit in the ink-and-gold world. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(120% 90% at 50% 30%, rgba(241,221,168,0) 55%, rgba(18,16,14,0.45) 100%)",
          }}
        />
        <LightSweep at={sweepAt} />
      </div>
    </div>
  );
};

// A ribbon of gold energy drawn around a frame, then flowing along itself.
export const EnergyRibbon: React.FC<{ box: Box; start: number; id: string }> = ({
  box,
  start,
  id,
}) => {
  const frame = useCurrentFrame();
  const { x, y, width: w, height: h } = box;
  const paths = [
    `M ${x - 40} ${y + h + 30} C ${x - 110} ${y + h * 0.62}, ${x + 40} ${y + h * 0.48}, ${x - 30} ${y + h * 0.3} C ${x - 80} ${y + h * 0.08}, ${x + w * 0.2} ${y - 70}, ${x + w * 0.5} ${y - 56} C ${x + w * 0.85} ${y - 44}, ${x + w + 80} ${y + h * 0.15}, ${x + w + 24} ${y + h * 0.42} C ${x + w - 30} ${y + h * 0.62}, ${x + w + 70} ${y + h * 0.82}, ${x + w + 160} ${y + h * 0.96}`,
    `M ${x + w * 0.1} ${y + h + 60} C ${x - 40} ${y + h * 0.75}, ${x - 60} ${y + h * 0.4}, ${x + w * 0.05} ${y + h * 0.12} C ${x + w * 0.3} ${y - 40}, ${x + w * 0.72} ${y - 30}, ${x + w * 0.95} ${y + h * 0.18} C ${x + w * 1.1} ${y + h * 0.4}, ${x + w * 0.95} ${y + h * 0.7}, ${x + w + 120} ${y + h * 0.88}`,
  ];
  const t = prog(frame, start, start + 34, EASE.inOut);
  if (t <= 0) {
    return null;
  }
  return (
    <svg
      width={VIDEO.width}
      height={VIDEO.height}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
        <linearGradient id={`${id}-gold`} x1="0" y1="1" x2="1" y2="0">
          {GOLD_GRADIENT.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      {paths.map((d, i) => {
        const p = Math.max(0, t - i * 0.12) / (1 - i * 0.12);
        const evo = evolvePath(Math.min(1, p), d);
        const len = getLength(d);
        const head = getPointAtLength(d, len * Math.min(1, p));
        const width = i === 0 ? 10 : 5;
        // After it is drawn, light pulses keep running along the ribbon.
        const flow = -(frame - start) * 9;
        return (
          <g key={i}>
            <path d={d} stroke={COLORS.goldLight} strokeWidth={width * 3.2} fill="none" strokeLinecap="round" opacity={0.55} filter={`url(#${id}-glow)`} strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
            <path d={d} stroke={`url(#${id}-gold)`} strokeWidth={width} fill="none" strokeLinecap="round" strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
            {p >= 1 ? (
              <path d={d} stroke={COLORS.white} strokeWidth={width * 0.5} fill="none" strokeLinecap="round" strokeDasharray="30 170" strokeDashoffset={flow} opacity={0.85} />
            ) : head ? (
              <circle cx={head.x} cy={head.y} r={width * 1.8} fill={COLORS.white} filter={`url(#${id}-glow)`} />
            ) : null}
          </g>
        );
      })}
      {/* Motes of gold drifting off the ribbon. */}
      {Array.from({ length: 16 }, (_, i) => {
        const d = paths[i % 2];
        const len = getLength(d);
        const born = start + 4 + i * 2;
        const age = frame - born;
        if (age < 0 || age > 40) {
          return null;
        }
        const pt = getPointAtLength(d, len * Math.min(1, (born - start) / 34));
        if (!pt) {
          return null;
        }
        return (
          <circle
            key={i}
            cx={pt.x + (random(`${id}mx${i}`) - 0.5) * age * 2.4}
            cy={pt.y - age * (0.6 + random(`${id}my${i}`) * 1.2)}
            r={2 + random(`${id}mr${i}`) * 4}
            fill={COLORS.goldLight}
            opacity={(1 - age / 40) * 0.9}
          />
        );
      })}
    </svg>
  );
};

// An instant-photo card that drops in on its cue, lands with a little
// bounce and rotation overshoot, then sways while the photo pushes in.
export const PhotoCard: React.FC<{
  src: string;
  orientation: "landscape" | "portrait";
  cx: number;
  cy: number;
  rotate: number;
  enter: number;
  exitStart: number;
  seed: string;
}> = ({ src, orientation, cx, cy, rotate, enter, exitStart, seed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < enter - 2) {
    return null;
  }
  const size = PHOTO.card[orientation];
  const { border, bottom } = PHOTO.card;
  const cardW = size.width + border * 2;
  const cardH = size.height + border + bottom;
  const land = springAt(frame, enter - 2, fps, SPRING.pop);
  const leave = prog(frame, exitStart + random(`${seed}l`) * 4, exitStart + 16, EASE.in);
  const sway = drift(`${seed}sw`, frame, 0.012) * 1.6;
  const bob = drift(`${seed}bb`, frame, 0.01) * 6;
  const zoom = interpolate(frame, [enter, enter + 150], [1.04, 1.14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fall = (1 - land) * -420;
  const spin = (1 - land) * -24;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - cardW / 2,
        top: cy - cardH / 2,
        width: cardW,
        height: cardH,
        padding: `${border}px ${border}px ${bottom}px`,
        boxSizing: "border-box",
        background: COLORS.white,
        borderRadius: 6,
        transform: `translate(${leave * 80}px, ${fall + bob - leave * 260}px) rotate(${rotate + spin + sway + leave * 12}deg) scale(${1 + (1 - land) * 0.12})`,
        opacity: Math.min(1, land * 2.2) * (1 - leave),
        boxShadow: `0 ${16 + land * 20}px ${30 + land * 30}px rgba(18,16,14,${0.18 + land * 0.12})`,
      }}
    >
      <div style={{ width: "100%", height: "100%", overflow: "hidden", background: COLORS.ink }}>
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom})`,
          }}
        />
      </div>
      {/* Gold washi tape holding the card. */}
      <div
        style={{
          position: "absolute",
          left: cardW / 2 - 70,
          top: -18,
          width: 140,
          height: 40,
          background: goldCss,
          opacity: 0.82,
          transform: `rotate(${-rotate * 0.6 - 3}deg)`,
          boxShadow: "0 3px 6px rgba(18,16,14,0.15)",
        }}
      />
    </div>
  );
};

// The official logo file, popping in with a soft shine.
export const LogoImage: React.FC<{ src: string; start: number }> = ({ src, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = springAt(frame, start, fps, SPRING.pop);
  return (
    <div
      style={{
        position: "absolute",
        left: (VIDEO.width - LOGO_IMAGE.width) / 2,
        top: LOGO_IMAGE.top,
        width: LOGO_IMAGE.width,
        transform: `scale(${0.7 + Math.min(1.15, pop) * 0.3})`,
        opacity: Math.min(1, pop * 2),
        filter: "drop-shadow(0 10px 24px rgba(168,22,29,0.18))",
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
  );
};
