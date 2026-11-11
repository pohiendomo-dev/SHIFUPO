import { noise2D } from "@remotion/noise";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, GOLD_GRADIENT } from "../lib/brand";
import { clamp01, drift, EASE, lerp, prog, springAt, SPRING } from "../lib/motion";

// Realistic top-down koi pond seen through a moon gate (SP02). Every fish
// is built from a 16-point spine that bends with a travelling wave, so the
// body, its colour patches, fins and tail all swim together; the tail fin
// lags the body (follow-through) and the pectoral fins paddle.

type Pt = { x: number; y: number };

const f1 = (v: number) => v.toFixed(1);

// Catmull-Rom spline through the points as cubic Beziers.
const smoothPath = (pts: Pt[], closed: boolean): string => {
  const n = pts.length;
  const at = (i: number) =>
    closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M ${f1(pts[0].x)} ${f1(pts[0].y)}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d += ` C ${f1(p1.x + (p2.x - p0.x) / 6)} ${f1(p1.y + (p2.y - p0.y) / 6)}, ${f1(p2.x - (p3.x - p1.x) / 6)} ${f1(p2.y - (p3.y - p1.y) / 6)}, ${f1(p2.x)} ${f1(p2.y)}`;
  }
  return closed ? `${d} Z` : d;
};

const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const norm = (v: Pt): Pt => {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
};
const rot = (v: Pt, a: number): Pt => ({
  x: v.x * Math.cos(a) - v.y * Math.sin(a),
  y: v.x * Math.sin(a) + v.y * Math.cos(a),
});

// Half-width of the body along the spine (s = 0 snout, 1 tail base), as a
// fraction of the fish length: blunt head, widest behind the gills, slim
// tail stalk.
const WIDTH_S = [0, 0.04, 0.12, 0.25, 0.4, 0.6, 0.8, 0.92, 1];
const WIDTH_W = [0.03, 0.072, 0.1, 0.116, 0.112, 0.084, 0.046, 0.029, 0.024];
const halfWidth = (s: number) => {
  for (let i = 1; i < WIDTH_S.length; i++) {
    if (s <= WIDTH_S[i]) {
      const t = (s - WIDTH_S[i - 1]) / (WIDTH_S[i] - WIDTH_S[i - 1]);
      return lerp(WIDTH_W[i - 1], WIDTH_W[i], t);
    }
  }
  return WIDTH_W[WIDTH_W.length - 1];
};

const SPINE_POINTS = 16;
// Body wave: one wavelength a little longer than the body.
const WAVE_K = Math.PI * 1.7;

export type KoiVariety = "kohaku" | "sanke" | "showa" | "ogon" | "tancho";

type Patch = { s: number; off: number; size: number; color: string };

// Colour patches per variety, seeded so each fish keeps its own markings.
const patchesFor = (variety: KoiVariety, seed: string): Patch[] => {
  const r = (k: string) => random(`${seed}-${k}`);
  const reds = (count: number): Patch[] =>
    Array.from({ length: count }, (_, i) => ({
      s: 0.1 + (i / count) * 0.62 + r(`rs${i}`) * 0.08,
      off: (r(`ro${i}`) - 0.5) * 0.9,
      size: 0.07 + r(`rz${i}`) * 0.05,
      color: COLORS.koiRed,
    }));
  const blacks = (count: number, big: number): Patch[] =>
    Array.from({ length: count }, (_, i) => ({
      s: 0.15 + r(`bs${i}`) * 0.7,
      off: (r(`bo${i}`) - 0.5) * 1.4,
      size: 0.018 + r(`bz${i}`) * big,
      color: COLORS.koiInk,
    }));
  switch (variety) {
    case "kohaku":
      return reds(4);
    case "sanke":
      return [...reds(3), ...blacks(6, 0.025)];
    case "showa":
      return [...blacks(5, 0.06), ...reds(3), ...blacks(3, 0.02)];
    case "tancho":
      return [{ s: 0.1, off: 0, size: 0.06, color: COLORS.koiRed }];
    case "ogon":
      return [];
  }
};

// One koi, drawn in local coordinates facing +x with its centre at (0, 0).
export const RealKoi: React.FC<{
  id: string;
  length: number;
  // Swim cycle phase in radians; advance it faster when the fish is fast.
  phase: number;
  // Body wave strength, 0.6 calm to 1.4 thrusting.
  effort?: number;
  variety: KoiVariety;
  // 0 at the surface, 1 deep: deep fish read bluer and softer.
  depth?: number;
}> = ({ id, length: L, phase, effort = 1, variety, depth = 0 }) => {
  const amp = 0.11 * effort;
  // Spine from snout (s = 0) to tail base (s = 1).
  const spine: Pt[] = Array.from({ length: SPINE_POINTS }, (_, i) => {
    const s = i / (SPINE_POINTS - 1);
    const env = 0.05 + 0.95 * s * s;
    return {
      x: L * (0.5 - s * 0.82),
      y: L * amp * env * Math.sin(phase - s * WAVE_K),
    };
  });
  const tangents = spine.map((_, i) =>
    norm({
      x: spine[Math.max(0, i - 1)].x - spine[Math.min(SPINE_POINTS - 1, i + 1)].x,
      y: spine[Math.max(0, i - 1)].y - spine[Math.min(SPINE_POINTS - 1, i + 1)].y,
    }),
  );
  const normals = tangents.map((t) => ({ x: -t.y, y: t.x }));
  const sAt = (s: number) => {
    const i = Math.min(SPINE_POINTS - 2, Math.floor(s * (SPINE_POINTS - 1)));
    const k = s * (SPINE_POINTS - 1) - i;
    return {
      p: { x: lerp(spine[i].x, spine[i + 1].x, k), y: lerp(spine[i].y, spine[i + 1].y, k) },
      t: norm({ x: lerp(tangents[i].x, tangents[i + 1].x, k), y: lerp(tangents[i].y, tangents[i + 1].y, k) }),
      n: norm({ x: lerp(normals[i].x, normals[i + 1].x, k), y: lerp(normals[i].y, normals[i + 1].y, k) }),
      w: halfWidth(s) * L,
    };
  };

  const left = spine.map((p, i) => add(p, normals[i], halfWidth(i / (SPINE_POINTS - 1)) * L));
  const right = spine.map((p, i) => add(p, normals[i], -halfWidth(i / (SPINE_POINTS - 1)) * L));
  const snout = add(spine[0], tangents[0], L * 0.025);
  const body = smoothPath([snout, ...left, ...right.reverse()], true);

  // Tail fin: two soft lobes that trail the body wave (follow-through).
  const tail = spine[SPINE_POINTS - 1];
  const back = rot(
    { x: -tangents[SPINE_POINTS - 1].x, y: -tangents[SPINE_POINTS - 1].y },
    Math.sin(phase - WAVE_K - 0.9) * 0.45 * effort,
  );
  const side = { x: -back.y, y: back.x };
  const tl = L * 0.3;
  const flutter = Math.sin(phase * 2.1) * 0.03 * L;
  const tailPts = [
    add(tail, side, L * 0.022),
    add(add(tail, back, tl * 0.45), side, L * 0.1),
    add(add(tail, back, tl), side, L * 0.17 + flutter),
    add(add(tail, back, tl * 0.62), side, L * 0.02),
    add(add(tail, back, tl * 0.58), side, -L * 0.02),
    add(add(tail, back, tl), side, -L * 0.17 + flutter),
    add(add(tail, back, tl * 0.45), side, -L * 0.1),
    add(tail, side, -L * 0.022),
  ];
  const tailFin = smoothPath(tailPts, true);
  const tailRays = [-0.15, -0.09, -0.03, 0.03, 0.09, 0.15].map((k) => {
    const end = add(add(tail, back, tl * (0.92 - Math.abs(k) * 0.4)), side, L * k + flutter * 0.6);
    return `M ${f1(tail.x)} ${f1(tail.y)} L ${f1(end.x)} ${f1(end.y)}`;
  });

  // Pectoral (s = 0.22) and pelvic (s = 0.55) fins, paddling out of step.
  const fin = (s: number, sideSign: 1 | -1, len: number, beat: number) => {
    const { p, t, n, w } = sAt(s);
    const base = add(p, n, w * 0.8 * sideSign);
    const out = norm(add({ x: n.x * sideSign * 0.75, y: n.y * sideSign * 0.75 }, t, -0.85));
    const dir = rot(out, Math.sin(phase * 0.5 + beat) * 0.38 * sideSign);
    const pts = [
      base,
      add(base, rot(dir, -0.5 * sideSign), len * 0.8),
      add(base, dir, len),
      add(base, rot(dir, 0.42 * sideSign), len * 0.78),
      add(base, t, -len * 0.18),
    ];
    const rays = [-0.35, -0.12, 0.1, 0.32].map((a) => {
      const e = add(base, rot(dir, a * sideSign), len * 0.88);
      return `M ${f1(base.x)} ${f1(base.y)} L ${f1(e.x)} ${f1(e.y)}`;
    });
    return { path: smoothPath(pts, true), rays };
  };
  const fins = [
    fin(0.22, 1, L * 0.2, 0),
    fin(0.22, -1, L * 0.2, Math.PI * 0.6),
    fin(0.56, 1, L * 0.1, 1.2),
    fin(0.56, -1, L * 0.1, 2.0),
  ];

  // Colour patches mapped onto the bent body so they bend with it.
  const patches = patchesFor(variety, id).map((pt, i) => {
    const { p, t, n, w } = sAt(Math.min(0.95, pt.s));
    const c = add(p, n, pt.off * w);
    const pts = Array.from({ length: 8 }, (_, k) => {
      const a = (k / 8) * Math.PI * 2;
      const rr = pt.size * L * (0.75 + random(`${id}-pr${i}-${k}`) * 0.5);
      // Patches stretch along the body.
      return add(add(c, t, Math.cos(a) * rr * 1.5), n, Math.sin(a) * rr);
    });
    return { d: smoothPath(pts, true), color: pt.color };
  });

  const back1 = smoothPath(spine.slice(1, 13), false);
  const dorsal = smoothPath(spine.slice(4, 10), false);
  const eye = sAt(0.075);
  const eyes = [1, -1].map((k) => add(eye.p, eye.n, eye.w * 0.72 * k));
  const head = sAt(0.02);
  const barbels = [1, -1].map((k) => {
    const a = add(head.p, head.n, head.w * 0.7 * k);
    const b = add(add(a, head.t, -L * 0.02), head.n, L * 0.035 * k);
    return `M ${f1(a.x)} ${f1(a.y)} Q ${f1(a.x + head.n.x * L * 0.02 * k)} ${f1(a.y + head.n.y * L * 0.02 * k)} ${f1(b.x)} ${f1(b.y)}`;
  });

  const baseFill = variety === "ogon" ? `url(#${id}-ogon)` : COLORS.koiCream;
  const finFill = variety === "ogon" ? COLORS.koiGold : COLORS.koiCream;

  return (
    <g>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={body} />
        </clipPath>
        <linearGradient id={`${id}-ogon`} x1="0" y1="0" x2="1" y2="1">
          {GOLD_GRADIENT.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      {/* Fins sit under the body. */}
      {fins.map((fn, i) => (
        <g key={i}>
          <path d={fn.path} fill={finFill} opacity={0.55} />
          {fn.rays.map((r, k) => (
            <path key={k} d={r} stroke={COLORS.white} strokeWidth={L * 0.005} opacity={0.55} fill="none" />
          ))}
        </g>
      ))}
      <path d={tailFin} fill={finFill} opacity={0.5} />
      {variety !== "ogon" ? (
        <path d={tailFin} fill={COLORS.koiRed} opacity={0.12} />
      ) : null}
      {tailRays.map((r, k) => (
        <path key={k} d={r} stroke={COLORS.white} strokeWidth={L * 0.005} opacity={0.5} fill="none" />
      ))}
      {/* Body with markings, scale sheen and rounded shading. */}
      <path d={body} fill={baseFill} />
      <g clipPath={`url(#${id}-clip)`}>
        {patches.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} opacity={0.94} />
        ))}
        <rect x={-L} y={-L} width={L * 2} height={L * 2} fill="url(#koi-scales)" opacity={0.22} />
        <path d={back1} stroke={COLORS.white} strokeWidth={L * 0.07} strokeLinecap="round" fill="none" opacity={0.38} filter="url(#koi-soft)" />
        <path d={body} stroke={COLORS.pondDeep} strokeWidth={L * 0.06} fill="none" opacity={0.28} filter="url(#koi-soft)" />
        {depth > 0 ? (
          <rect x={-L} y={-L} width={L * 2} height={L * 2} fill={COLORS.pondMid} opacity={depth * 0.4} />
        ) : null}
      </g>
      <path d={dorsal} stroke={COLORS.koiInk} strokeWidth={L * 0.012} fill="none" opacity={0.18} strokeLinecap="round" />
      {barbels.map((b, i) => (
        <path key={i} d={b} stroke={COLORS.koiCream} strokeWidth={L * 0.008} fill="none" opacity={0.8} strokeLinecap="round" />
      ))}
      {eyes.map((e, i) => (
        <g key={i}>
          <circle cx={e.x} cy={e.y} r={L * 0.014} fill={COLORS.koiInk} />
          <circle cx={e.x + L * 0.004} cy={e.y - L * 0.004} r={L * 0.005} fill={COLORS.white} opacity={0.9} />
        </g>
      ))}
    </g>
  );
};

// Body outline only, for the soft shadow on the pond floor.
const KoiShadow: React.FC<{ length: number; phase: number; effort: number }> = ({
  length: L,
  phase,
  effort,
}) => {
  const amp = 0.11 * effort;
  const pts: Pt[] = [];
  for (let i = 0; i < SPINE_POINTS; i++) {
    const s = i / (SPINE_POINTS - 1);
    pts.push({
      x: L * (0.5 - s * 0.82),
      y: L * amp * (0.05 + 0.95 * s * s) * Math.sin(phase - s * WAVE_K),
    });
  }
  const left = pts.map((p, i) => ({ x: p.x, y: p.y + halfWidth(i / 15) * L * 1.15 }));
  const right = pts.map((p, i) => ({ x: p.x, y: p.y - halfWidth(i / 15) * L * 1.15 }));
  const tail = pts[SPINE_POINTS - 1];
  return (
    <path
      d={smoothPath(
        [
          { x: L * 0.53, y: 0 },
          ...left,
          { x: tail.x - L * 0.28, y: tail.y + L * 0.12 },
          { x: tail.x - L * 0.2, y: tail.y },
          { x: tail.x - L * 0.28, y: tail.y - L * 0.12 },
          ...right.reverse(),
        ],
        true,
      )}
    />
  );
};

export type PondMood = "still" | "flow" | "calm";

type FishSpec = {
  variety: KoiVariety;
  length: number;
  orbit: number;
  speed: number;
  dir: 1 | -1;
  offset: number;
  depth: number;
  lane: number;
};

const SCHOOL: FishSpec[] = [
  { variety: "kohaku", length: 250, orbit: 0.5, speed: 0.011, dir: 1, offset: 0, depth: 0.05, lane: -0.28 },
  { variety: "ogon", length: 220, orbit: 0.36, speed: 0.013, dir: -1, offset: 2.1, depth: 0.25, lane: 0.22 },
  { variety: "sanke", length: 205, orbit: 0.62, speed: 0.009, dir: 1, offset: 3.6, depth: 0.15, lane: 0.02 },
  { variety: "showa", length: 185, orbit: 0.42, speed: 0.012, dir: -1, offset: 5.0, depth: 0.45, lane: 0.4 },
  { variety: "tancho", length: 175, orbit: 0.55, speed: 0.01, dir: 1, offset: 1.2, depth: 0.35, lane: -0.45 },
];

// Where fish k is at frame t, in pond coordinates (centre 0, 0; radius r).
const fishPos = (
  k: number,
  spec: FishSpec,
  t: number,
  r: number,
  flowAt: number | null,
): Pt => {
  const a = spec.offset + t * spec.speed * spec.dir * 2.4;
  const wob = noise2D(`fish${k}`, t * 0.006, 0);
  const rr = r * (spec.orbit + wob * 0.12);
  const wander = {
    x: Math.cos(a) * rr + noise2D(`fx${k}`, t * 0.004, 1) * r * 0.12,
    y: Math.sin(a) * rr * 0.86 + noise2D(`fy${k}`, t * 0.004, 2) * r * 0.12,
  };
  if (flowAt === null) {
    return wander;
  }
  // Stream: from where it is when the cue lands, each fish slides into its
  // lane and surges, accelerating, up and out of the gate.
  const tf = t - flowAt - k * 3;
  const b = EASE.inOut(clamp01((tf + 10) / 26));
  if (b <= 0) {
    return wander;
  }
  const from = fishPos(k, spec, flowAt + k * 3 - 10, r, null);
  const surge = Math.max(0, tf) ** 1.6 * 0.95;
  const stream = {
    x: spec.lane * r + Math.sin(t * 0.09 + k) * 14,
    y: Math.max(from.y, -r * 0.2) - surge,
  };
  return { x: lerp(wander.x, stream.x, b), y: lerp(wander.y, stream.y, b) };
};

// The pond inside a moon gate, centred on (cx, cy).
export const KoiPond: React.FC<{
  id: string;
  cx: number;
  cy: number;
  r: number;
  rim: number;
  start: number;
  mood: PondMood;
  flowAt?: number;
  fishCount?: number;
  exitStart?: number;
}> = ({ id, cx, cy, r, rim, start, mood, flowAt, fishCount = 4, exitStart = Infinity }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - start;
  const enter = springAt(frame, start, fps, SPRING.heavy);
  const leave = prog(frame, exitStart, exitStart + 14, EASE.in);
  const flowFrame = mood === "flow" && flowAt !== undefined ? flowAt : null;
  // Murky water clears as the energy starts to flow.
  const murk =
    mood === "still"
      ? 0.95
      : mood === "flow"
        ? 0.6 * (1 - prog(frame, (flowAt ?? start) - 8, (flowAt ?? start) + 24, EASE.inOut))
        : 0;
  const fishTempo = mood === "still" ? 0.7 : 1;
  const fishes = SCHOOL.slice(0, fishCount);

  const fishAt = (k: number, tt: number) =>
    fishPos(k, fishes[k], tt * fishTempo, r, flowFrame === null ? null : (flowFrame - start) * fishTempo);

  const scale = (0.86 + enter * 0.14) * (1 - leave * 0.08);
  return (
    <svg
      width={r * 2 + rim * 4}
      height={r * 2 + rim * 4}
      viewBox={`${-r - rim * 2} ${-r - rim * 2} ${r * 2 + rim * 4} ${r * 2 + rim * 4}`}
      style={{
        position: "absolute",
        left: cx - r - rim * 2,
        top: cy - r - rim * 2,
        overflow: "visible",
        opacity: Math.min(1, enter * 1.5) * (1 - leave),
        transform: `scale(${scale})`,
      }}
    >
      <defs>
        <radialGradient id={`${id}-water`} cx="38%" cy="32%" r="78%">
          <stop offset="0" stopColor={COLORS.pondLight} />
          <stop offset="0.5" stopColor={COLORS.pondMid} />
          <stop offset="1" stopColor={COLORS.pondDeep} />
        </radialGradient>
        <radialGradient id={`${id}-vignette`} cx="50%" cy="50%" r="50%">
          <stop offset="0.72" stopColor={COLORS.pondDeep} stopOpacity={0} />
          <stop offset="1" stopColor={COLORS.koiInk} stopOpacity={0.6} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          {GOLD_GRADIENT.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
        <clipPath id={`${id}-gate`}>
          <circle r={r} />
        </clipPath>
        {/* Thin bright web of light where the noise crosses its midpoint. */}
        <filter id={`${id}-caustic`} x={-r} y={-r} width={r * 2} height={r * 2} filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency="0.010 0.015" numOctaves={2} seed={7} />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0 0 0 0.05 0.9 0.05 0 0 0" />
          </feComponentTransfer>
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 0.92  1 0 0 0 0" />
        </filter>
        <filter id="koi-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
        <pattern id="koi-scales" width={12} height={10} patternUnits="userSpaceOnUse">
          <path d="M 0 10 Q 6 2, 12 10" stroke={COLORS.koiInk} strokeWidth={1} fill="none" opacity={0.6} />
        </pattern>
        <radialGradient id={`${id}-pad`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor={COLORS.lilyPadLight} />
          <stop offset="1" stopColor={COLORS.lilyPad} />
        </radialGradient>
        <radialGradient id={`${id}-petal`} cx="50%" cy="90%" r="90%">
          <stop offset="0" stopColor={COLORS.white} />
          <stop offset="0.55" stopColor={COLORS.lotus} />
          <stop offset="1" stopColor={COLORS.lotusDeep} />
        </radialGradient>
      </defs>

      {/* Soft shadow of the gate on the paper. */}
      <circle r={r + rim} cy={18} fill={COLORS.koiInk} opacity={0.18} filter={`url(#${id}-shadow)`} />

      <g clipPath={`url(#${id}-gate)`}>
        <circle r={r} fill={`url(#${id}-water)`} />
        {/* Pebbles on the floor, slightly wobbling through the water. */}
        {Array.from({ length: 14 }, (_, i) => {
          const a = random(`${id}pa${i}`) * Math.PI * 2;
          const d = r * (0.25 + random(`${id}pd${i}`) * 0.75);
          return (
            <ellipse
              key={i}
              cx={Math.cos(a) * d + drift(`${id}pw${i}`, frame, 0.02) * 3}
              cy={Math.sin(a) * d}
              rx={18 + random(`${id}pr${i}`) * 26}
              ry={12 + random(`${id}pq${i}`) * 16}
              fill={COLORS.stone}
              opacity={0.16}
              filter="url(#koi-soft)"
            />
          );
        })}
        {/* Fish shadows on the floor, offset away from the light. */}
        {fishes.map((spec, k) => {
          const p = fishAt(k, t);
          const q = fishAt(k, t + 1);
          const h = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
          const off = 26 + spec.depth * -14;
          return (
            <g
              key={k}
              transform={`translate(${f1(p.x + off)} ${f1(p.y + off * 1.3)}) rotate(${f1(h)})`}
              fill={COLORS.koiInk}
              opacity={0.3 - spec.depth * 0.12}
              filter={`url(#${id}-shadow)`}
            >
              <KoiShadow length={spec.length} phase={t * 0.24 * fishTempo + k} effort={1} />
            </g>
          );
        })}
        {/* Gold trails behind the school while the energy flows. */}
        {flowFrame !== null
          ? fishes.map((_, k) =>
              Array.from({ length: 9 }, (__, j) => {
                if (frame < flowFrame + j) {
                  return null;
                }
                const p = fishAt(k, t - (j + 1) * 2.5);
                return (
                  <circle
                    key={`${k}-${j}`}
                    cx={p.x + noise2D(`tr${k}`, j, frame * 0.05) * 10}
                    cy={p.y + 40}
                    r={9 - j * 0.8}
                    fill={COLORS.goldLight}
                    opacity={(1 - j / 9) * 0.75}
                  />
                );
              }),
            )
          : null}
        {/* The fish. */}
        {fishes.map((spec, k) => {
          const p = fishAt(k, t);
          const q = fishAt(k, t + 1);
          const speed = Math.hypot(q.x - p.x, q.y - p.y);
          const h = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
          // Faster fish beat harder.
          const effort = Math.min(1.5, 0.7 + speed * 0.12);
          return (
            <g key={k} transform={`translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(h)})`}>
              <RealKoi
                id={`${id}-k${k}`}
                length={spec.length}
                phase={t * (0.2 + speed * 0.02) * fishTempo + k * 1.7}
                effort={effort}
                variety={spec.variety}
                depth={spec.depth}
              />
            </g>
          );
        })}
        {/* Light dancing on the water: two caustic layers drifting apart. */}
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(${f1((i ? -1 : 1) * t * 0.6)} ${f1(t * (i ? 0.35 : -0.25))})`}>
            <rect x={-r * 2} y={-r * 2} width={r * 4} height={r * 4} filter={`url(#${id}-caustic)`} opacity={(0.16 + i * 0.06) * (1 - murk * 0.7)} />
          </g>
        ))}
        {/* Murky water (still mood) that clears when the flow starts. */}
        <circle r={r} fill={COLORS.pondMurk} opacity={murk * 0.55} />
        {/* Ripples spreading on the surface. */}
        {Array.from({ length: 4 }, (_, i) => {
          const period = 70;
          const local = t + i * 23;
          const cycle = Math.floor(local / period);
          const p = (local % period) / period;
          const a = random(`${id}ra${i}-${cycle}`) * Math.PI * 2;
          const d = random(`${id}rd${i}-${cycle}`) * r * 0.7;
          return (
            <ellipse
              key={i}
              cx={Math.cos(a) * d}
              cy={Math.sin(a) * d}
              rx={20 + p * 130}
              ry={(20 + p * 130) * 0.92}
              fill="none"
              stroke={COLORS.white}
              strokeWidth={3 - p * 2}
              opacity={(1 - p) * 0.35}
            />
          );
        })}
        {/* Floating leaves drifting on the murky surface. */}
        {mood !== "calm"
          ? [0, 1, 2].map((i) => {
              const x = -r * 0.6 + i * r * 0.55 + drift(`${id}lx${i}`, frame, 0.008) * 60 + t * 0.25;
              const y = -r * 0.45 + i * r * 0.4 + drift(`${id}ly${i}`, frame, 0.008) * 50;
              const a = drift(`${id}la${i}`, frame, 0.01) * 50 + i * 70;
              return (
                <g key={i} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})`} opacity={0.9 * (mood === "flow" ? murk / 0.6 : 1)}>
                  <path d="M -26 0 C -12 -14, 12 -14, 28 0 C 12 14, -12 14, -26 0 Z" fill={i === 1 ? "#B8862E" : "#8C6A2A"} />
                  <path d="M -26 0 L 28 0" stroke={COLORS.koiInk} strokeWidth={1.5} opacity={0.4} />
                </g>
              );
            })
          : null}
        {/* Lily pads and a lotus, bobbing on the surface. */}
        {[
          { x: 0.52, y: -0.42, s: 1.1, lotus: true },
          { x: -0.58, y: 0.5, s: 0.9, lotus: false },
          { x: 0.6, y: 0.48, s: 0.75, lotus: false },
          { x: -0.2, y: -0.72, s: 0.6, lotus: false },
        ].map((pad, i) => {
          const bob = 1 + Math.sin((t + i * 17) * 0.07) * 0.018;
          const x = pad.x * r + drift(`${id}px${i}`, frame, 0.006) * 14;
          const y = pad.y * r + drift(`${id}py${i}`, frame, 0.006) * 14;
          const a = i * 80 + drift(`${id}pr${i}`, frame, 0.005) * 25;
          const pr = 70 * pad.s;
          return (
            <g key={i} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(a)}) scale(${bob})`}>
              <ellipse cx={10} cy={14} rx={pr} ry={pr * 0.94} fill={COLORS.koiInk} opacity={0.22} filter="url(#koi-soft)" />
              <path
                d={`M 0 0 L ${pr * Math.cos(-0.22)} ${pr * Math.sin(-0.22)} A ${pr} ${pr} 0 1 0 ${pr * Math.cos(0.22)} ${pr * Math.sin(0.22)} Z`}
                fill={`url(#${id}-pad)`}
              />
              {Array.from({ length: 9 }, (_, v) => {
                const va = 0.45 + (v / 8) * (Math.PI * 2 - 0.9);
                return (
                  <line key={v} x1={0} y1={0} x2={Math.cos(va) * pr * 0.9} y2={Math.sin(va) * pr * 0.9} stroke={COLORS.lilyPadLight} strokeWidth={2} opacity={0.6} />
                );
              })}
              <path d={`M ${pr * 0.2} ${-pr * 0.75} A ${pr * 0.8} ${pr * 0.8} 0 0 0 ${-pr * 0.75} ${pr * 0.2}`} stroke={COLORS.white} strokeWidth={3} fill="none" opacity={0.25} />
              {pad.lotus ? (
                <g transform={`rotate(${-a})`}>
                  {[0, 1].map((ring) =>
                    Array.from({ length: 8 }, (_, p) => {
                      const pa = (p / 8) * 360 + ring * 22.5;
                      const open = ring === 0 ? 1 : 0.7;
                      return (
                        <path
                          key={`${ring}-${p}`}
                          d={`M 0 0 C ${-18 * open} ${-22 * open}, ${-14 * open} ${-52 * open}, 0 ${-60 * open} C ${14 * open} ${-52 * open}, ${18 * open} ${-22 * open}, 0 0 Z`}
                          transform={`rotate(${pa + Math.sin((t + p * 5) * 0.05) * 2})`}
                          fill={`url(#${id}-petal)`}
                          stroke={COLORS.lotusDeep}
                          strokeWidth={1}
                          strokeOpacity={0.4}
                        />
                      );
                    }),
                  )}
                  <circle r={11} fill={COLORS.koiGold} />
                  {Array.from({ length: 10 }, (_, s) => (
                    <circle key={s} cx={Math.cos(s * 0.63) * 7} cy={Math.sin(s * 0.63) * 7} r={2} fill={COLORS.goldDeep} />
                  ))}
                </g>
              ) : null}
            </g>
          );
        })}
        {/* Sky sheen and the dark lip of the gate. */}
        <ellipse cx={-r * 0.35 + drift(`${id}sh`, frame, 0.004) * 30} cy={-r * 0.45} rx={r * 0.55} ry={r * 0.3} fill={COLORS.white} opacity={0.09} filter={`url(#${id}-shadow)`} />
        <circle r={r} fill={`url(#${id}-vignette)`} />
      </g>
      {/* The moon gate: gold ring with an ink edge. */}
      <circle r={r + rim / 2} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={rim} />
      <circle r={r + rim} fill="none" stroke={COLORS.ink} strokeWidth={4} opacity={0.75} />
      <circle r={r} fill="none" stroke={COLORS.goldDeep} strokeWidth={3} />
    </svg>
  );
};
