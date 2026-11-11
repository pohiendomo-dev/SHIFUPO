import { noise2D } from "@remotion/noise";
import { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { COLORS } from "../lib/brand";
import { clamp01, EASE } from "../lib/motion";
import type { Vec3 } from "./camera";
import { shade } from "./House";
import { GltfModel } from "./Life";
import { PEACH, THREAD, THREAD_BREAK, type BedroomKind } from "./shots";
import { Toon, useBox, useCylinder, useSphere } from "./toon";

// SP04 pieces: the peach-blossom tree, the red thread of fate, the gold
// peach-blossom sector on the lawn, a pair of mandarin ducks, and the
// bedroom furniture.

// --- Peach tree ------------------------------------------------------------

type Branch = { a: THREE.Vector3; b: THREE.Vector3; r: number; depth: number };

// A deterministic branching tree: trunk, then 2-3 children per branch.
const growTree = (): { branches: Branch[]; tips: THREE.Vector3[] } => {
  const branches: Branch[] = [];
  const tips: THREE.Vector3[] = [];
  const grow = (a: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, depth: number, seed: string) => {
    const b = a.clone().add(dir.clone().multiplyScalar(len));
    branches.push({ a, b, r, depth });
    if (depth >= 4) {
      tips.push(b);
      return;
    }
    const kids = depth === 0 ? 3 : 2 + Math.floor(random(`${seed}k`) * 2);
    for (let k = 0; k < kids; k++) {
      const yaw = (k / kids) * Math.PI * 2 + random(`${seed}y${k}`) * 1.2;
      const pitch = 0.45 + random(`${seed}p${k}`) * 0.4 + depth * 0.08;
      const d = new THREE.Vector3(Math.sin(pitch) * Math.cos(yaw), Math.cos(pitch), Math.sin(pitch) * Math.sin(yaw))
        .add(dir.clone().multiplyScalar(0.6))
        .normalize();
      grow(b, d, len * (0.68 + random(`${seed}l${k}`) * 0.1), r * 0.62, depth + 1, `${seed}-${k}`);
    }
  };
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 1, 0.02).normalize(), PEACH.trunk.length, PEACH.trunk.radius, 0, "peach");
  return { branches, tips };
};

const UP = new THREE.Vector3(0, 1, 0);

export const PeachTree: React.FC<{
  // 0 bare .. 1 in full bloom (blossoms open from the inside out).
  bloom: number;
  // 0 fresh .. 1 wilted (blossoms brown and drop).
  wilt: number;
  // 0..1 a shiver through the branches.
  shake: number;
}> = ({ bloom, wilt, shake }) => {
  const frame = useCurrentFrame();
  const { branches, tips } = useMemo(growTree, []);
  const stick = useCylinder(1, 1, 1, 8);
  const blossomGeo = useMemo(() => new THREE.IcosahedronGeometry(0.075, 0), []);
  const blossoms = useMemo(() => {
    const pts: { p: THREE.Vector3; order: number; c: string; s: number }[] = [];
    const palette = [COLORS.lotus, COLORS.white, COLORS.lotusDeep, COLORS.lotus];
    for (let i = 0; i < PEACH.blossoms; i++) {
      const tip = tips[i % tips.length];
      const br = branches[branches.length - 1 - (i % Math.min(branches.length, 40))];
      const t = random(`bt${i}`);
      const base = i % 3 === 0 ? br.a.clone().lerp(br.b, t) : tip.clone();
      const jitter = new THREE.Vector3(random(`bx${i}`) - 0.5, random(`by${i}`) - 0.5, random(`bz${i}`) - 0.5).multiplyScalar(0.42);
      const p = base.add(jitter);
      pts.push({ p, order: p.length() / 3 + random(`bo${i}`) * 0.25, c: palette[i % palette.length], s: 0.7 + random(`bs${i}`) * 0.6 });
    }
    return pts;
  }, [tips, branches]);
  const brown = new THREE.Color(COLORS.wood);
  const sway = Math.sin(frame * 0.04) * 0.012 + shake * Math.sin(frame * 0.9) * 0.03;
  return (
    <group position={PEACH.position} rotation={[sway * 0.6, 0, sway]}>
      {branches.map((br, i) => {
        const dir = br.b.clone().sub(br.a);
        const len = dir.length();
        const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
        const mid = br.a.clone().add(br.b).multiplyScalar(0.5);
        return (
          <group key={i} position={mid} quaternion={q}>
            <Toon geometry={stick} color={COLORS.bark} scale={[br.r, len, br.r]} roughness={0.95} />
          </group>
        );
      })}
      {blossoms.map((b, i) => {
        // Each blossom opens in turn (inner first), with a little overshoot.
        const open = EASE.overshoot(clamp01((bloom * 1.35 - b.order) * 4));
        const drop = clamp01((wilt - b.order * 0.6) * 2.5);
        const fall = drop * drop * 2.2;
        const s = open * b.s * (1 - drop * 0.35);
        if (s <= 0.01) {
          return null;
        }
        const c = new THREE.Color(b.c).lerp(brown, wilt * 0.75);
        return (
          <mesh key={i} geometry={blossomGeo} position={[b.p.x + noise2D("bw", i, frame * 0.02) * 0.02, b.p.y - fall, b.p.z]} scale={s} castShadow>
            <meshStandardMaterial color={c} roughness={0.6} emissive={COLORS.lotus} emissiveIntensity={0.12 * (1 - wilt)} />
          </mesh>
        );
      })}
    </group>
  );
};

// Petals drifting off the tree once it blooms.
export const FallingPetals: React.FC<{ amount: number }> = ({ amount }) => {
  const frame = useCurrentFrame();
  const petal = useMemo(() => new THREE.PlaneGeometry(0.08, 0.055), []);
  const [px, , pz] = PEACH.position;
  const n = Math.round(36 * amount);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const span = 3.2;
        const y = 3.2 - ((frame * (0.01 + random(`fp${i}`) * 0.01) + random(`fy${i}`) * span) % span);
        const x = px + (random(`fx${i}`) - 0.5) * 3 + Math.sin(frame * 0.03 + i) * 0.4;
        const z = pz + (random(`fz${i}`) - 0.5) * 3 + Math.cos(frame * 0.025 + i) * 0.3;
        return (
          <mesh key={i} geometry={petal} position={[x, Math.max(0.13, y), z]} rotation={[frame * 0.06 + i, frame * 0.05 + i * 2, 0]}>
            <meshStandardMaterial color={i % 4 === 0 ? COLORS.white : COLORS.lotus} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
};

// --- Sector glow -------------------------------------------------------------

export const SectorGlow: React.FC<{ strength: number }> = ({ strength }) => {
  const frame = useCurrentFrame();
  const { inner, outer, start, length } = PEACH.sector;
  const ring = useMemo(() => new THREE.RingGeometry(inner, outer, 64, 1, start, length), [inner, outer, start, length]);
  const edge = useMemo(() => new THREE.RingGeometry(outer - 0.04, outer, 64, 1, start, length), [outer, start, length]);
  if (strength <= 0.01) {
    return null;
  }
  const pulse = 0.85 + Math.sin(frame * 0.15) * 0.15;
  return (
    <group position={[PEACH.position[0], 0.125, PEACH.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={ring}>
        <meshBasicMaterial color={COLORS.gold} transparent opacity={strength * 0.4 * pulse} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={edge}>
        <meshBasicMaterial color={COLORS.goldLight} transparent opacity={strength * 0.95} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

// --- Red thread --------------------------------------------------------------

const THREAD_SAMPLES = 120;

export const RedThread: React.FC<{
  // 0 whole .. 1 snapped (the two ends fall and dangle).
  broken: number;
  // 0..1 glow and travelling light pulses (reunited).
  glow: number;
  camera: Vec3;
}> = ({ broken, glow, camera }) => {
  const frame = useCurrentFrame();
  const base = useMemo(() => new THREE.CatmullRomCurve3(THREAD.map((p) => new THREE.Vector3(...p)), false, "centripetal"), []);
  const breakU = THREAD_BREAK / (THREAD.length - 1);
  const bead = useSphere(0.03, 10);
  // Sampled points; after the break each side sags towards the ground,
  // more the further it is from where it is still tied.
  const pts = base.getSpacedPoints(THREAD_SAMPLES).map((p, i) => {
    const u = i / THREAD_SAMPLES;
    const sway = noise2D("thread", u * 3, frame * 0.02) * 0.03;
    const fromBreak = u < breakU ? (u / breakU) ** 2 : ((1 - u) / (1 - breakU)) ** 2;
    const sag = EASE.out(broken) * fromBreak * (p.y - 0.15) * 0.95;
    return new THREE.Vector3(p.x + sway, p.y - sag + Math.sin(frame * 0.05 + u * 9) * 0.01 * broken, p.z + sway);
  });
  const split = Math.round(breakU * THREAD_SAMPLES);
  const parts = broken > 0.02 ? [pts.slice(0, split), pts.slice(split + 2)] : [pts];
  const tubes = parts.map((part) =>
    part.length > 3 ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3(part), part.length * 2, 0.012, 6, false) : null,
  );
  const halos = parts.map((part) =>
    glow > 0.01 && part.length > 3 ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3(part), part.length * 2, 0.045, 8, false) : null,
  );
  return (
    <group>
      {tubes.map((g, i) =>
        g ? (
          <mesh key={i} geometry={g} castShadow>
            <meshStandardMaterial color={COLORS.seal} emissive={COLORS.seal} emissiveIntensity={0.5 + glow * 2.2} roughness={0.5} />
          </mesh>
        ) : null,
      )}
      {halos.map((g, i) =>
        g ? (
          <mesh key={`h${i}`} geometry={g}>
            <meshBasicMaterial color={COLORS.seal} transparent opacity={glow * 0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        ) : null,
      )}
      {glow > 0.05
        ? Array.from({ length: 4 }, (_, k) => {
            const u = (frame * 0.008 + k / 4) % 1;
            const p = pts[Math.min(pts.length - 1, Math.round(u * THREAD_SAMPLES))];
            const near = clamp01((p.distanceTo(new THREE.Vector3(...camera)) - 0.8) / 1.2);
            return (
              <mesh key={k} geometry={bead} position={p}>
                <meshBasicMaterial color={COLORS.goldLight} transparent opacity={glow * near} toneMapped={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

// Gold arcs from the house to neighbours, appearing one by one (proof shot).
export const ThreadArcs: React.FC<{ targets: Vec3[]; progress: number }> = ({ targets, progress }) => {
  const frame = useCurrentFrame();
  return (
    <group>
      {targets.map((t, i) => {
        const p = clamp01(progress * targets.length - i * 0.8);
        if (p <= 0.01) {
          return null;
        }
        const a = new THREE.Vector3(0, 3.3, 0);
        const b = new THREE.Vector3(...t);
        const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 3 + a.distanceTo(b) * 0.18, 0));
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const pts = curve.getPoints(48).slice(0, Math.max(2, Math.round(48 * EASE.out(p)) + 1));
        const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.05, 6, false);
        return (
          <mesh key={i} geometry={g}>
            <meshBasicMaterial color={COLORS.seal} transparent opacity={0.85 + Math.sin(frame * 0.2 + i) * 0.15} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

// --- Mandarin ducks ----------------------------------------------------------

const Duck: React.FC<{ male: boolean }> = ({ male }) => {
  const body = useSphere(0.09, 16);
  const head = useSphere(0.045, 14);
  const beak = useBox(0.035, 0.015, 0.02);
  return (
    <group>
      <Toon geometry={body} color={male ? COLORS.koiOrange : COLORS.stoneDark} position={[0, 0.07, 0]} scale={[1.25, 0.75, 0.85]} roughness={0.5} />
      <Toon geometry={body} color={male ? COLORS.lotusDeep : COLORS.stone} position={[-0.03, 0.1, 0]} scale={[0.7, 0.45, 0.8]} roughness={0.5} />
      <Toon geometry={head} color={male ? COLORS.jade : COLORS.stoneDark} position={[0.09, 0.15, 0]} roughness={0.5} />
      <Toon geometry={head} color={COLORS.white} position={[0.105, 0.16, 0.025]} scale={0.35} />
      <Toon geometry={beak} color={male ? COLORS.seal : COLORS.stoneDark} position={[0.14, 0.145, 0]} />
    </group>
  );
};

export const DuckPair: React.FC = () => {
  const frame = useCurrentFrame();
  const nod = Math.sin(frame * 0.06) * 0.04;
  return (
    <group>
      <group position={[0, 0, -0.08]} rotation={[0, -0.35 + nod, 0]}>
        <Duck male />
      </group>
      <group position={[0, 0, 0.1]} rotation={[0, Math.PI + 0.35 - nod, 0]} scale={0.92}>
        <Duck male={false} />
      </group>
    </group>
  );
};

// --- Bedroom furniture ---------------------------------------------------------

export const BedroomItem: React.FC<{ kind: BedroomKind; light: number }> = ({ kind, light }) => {
  const s = (c: string) => shade(c, light);
  const bedFrame = useBox(1.6, 0.28, 2.05);
  const mattress = useBox(1.5, 0.2, 1.92);
  const duvet = useBox(1.54, 0.07, 1.25);
  const headboard = useBox(1.68, 0.75, 0.08);
  const stand = useBox(0.45, 0.5, 0.4);
  const drawerLine = useBox(0.4, 0.01, 0.01);
  const knob = useSphere(0.018, 8);
  const lampBase = useCylinder(0.07, 0.09, 0.05, 16);
  const lampStem = useCylinder(0.015, 0.015, 0.22, 8);
  const lampShade = useCylinder(0.09, 0.13, 0.17, 20, );
  const pillow = useSphere(0.3, 18);
  const dresser = useBox(0.95, 0.8, 0.45);
  const cloth = useSphere(0.2, 12);
  const rug = useBox(1.6, 0.02, 1.1);
  switch (kind) {
    case "bed":
      return (
        <group>
          <Toon geometry={bedFrame} color={s(COLORS.white)} position={[0, 0.14, 0]} pbr={{ id: "wood_planks", repeat: [1.2, 1.5] }} />
          <Toon geometry={mattress} color={s(COLORS.white)} position={[0, 0.38, 0.03]} pbr={{ id: "fabric_pattern_07", repeat: [2, 2] }} />
          <Toon geometry={duvet} color={s(COLORS.lotus)} position={[0, 0.51, 0.36]} pbr={{ id: "fabric_pattern_07", repeat: [2, 2] }} />
          <Toon geometry={headboard} color={s(COLORS.white)} position={[0, 0.5, -1.0]} pbr={{ id: "wood_planks", repeat: [1.2, 0.6] }} />
        </group>
      );
    case "rug":
      return <Toon geometry={rug} color={s(COLORS.goldLight)} position={[0, 0.01, 0]} pbr={{ id: "fabric_pattern_07", repeat: [3, 2] }} />;
    case "nightstand":
      return (
        <group>
          <Toon geometry={stand} color={s(COLORS.white)} position={[0, 0.25, 0]} pbr={{ id: "wood_planks", repeat: [0.4, 0.4] }} />
          <Toon geometry={drawerLine} color={s(COLORS.koiInk)} position={[0, 0.3, 0.205]} />
          <Toon geometry={knob} color={COLORS.gold} position={[0, 0.38, 0.21]} metalness={0.7} roughness={0.3} />
        </group>
      );
    case "lamp": {
      // Lamps glow warm once the room is arranged (light rises with it).
      const on = clamp01((light - 0.5) * 2);
      return (
        <group>
          <Toon geometry={lampBase} color={COLORS.gold} position={[0, 0.025, 0]} metalness={0.7} roughness={0.3} />
          <Toon geometry={lampStem} color={COLORS.gold} position={[0, 0.16, 0]} metalness={0.7} roughness={0.3} />
          <Toon geometry={lampShade} color={s(COLORS.paper)} emissive={COLORS.goldLight} emissiveIntensity={on * 1.6} position={[0, 0.34, 0]} />
          {on > 0.05 ? <pointLight position={[0, 0.34, 0]} intensity={on * 1.2} distance={2.2} color={COLORS.goldLight} /> : null}
        </group>
      );
    }
    case "pillow":
      return <Toon geometry={pillow} color={s(COLORS.white)} position={[0, 0.06, 0]} scale={[1, 0.24, 0.6]} pbr={{ id: "fabric_pattern_07", repeat: [1, 1] }} />;
    case "dresser":
      return (
        <group>
          <Toon geometry={dresser} color={s(COLORS.white)} position={[0, 0.4, 0]} pbr={{ id: "wood_planks", repeat: [0.8, 0.7] }} />
          {[0.2, 0.42, 0.64].map((y) => (
            <group key={y}>
              <Toon geometry={drawerLine} color={s(COLORS.koiInk)} position={[0, y, 0.23]} scale={[2.2, 1, 1]} />
              <Toon geometry={knob} color={COLORS.gold} position={[0, y + 0.08, 0.235]} metalness={0.7} roughness={0.3} />
            </group>
          ))}
        </group>
      );
    case "ducks":
      return <DuckPair />;
    case "clothes":
      return (
        <group>
          {[
            [0, 0, 0, COLORS.charcoal],
            [0.15, 0.04, 0.08, COLORS.seal],
            [-0.12, 0.05, -0.05, COLORS.stone],
            [0.05, 0.08, -0.1, COLORS.glass],
          ].map(([x, y, z, c], i) => (
            <Toon key={i} geometry={cloth} color={s(c as string)} position={[x as number, 0.06 + (y as number), z as number]} scale={[1.3, 0.3, 1]} pbr={{ id: "fabric_pattern_07", repeat: [1, 1] }} />
          ))}
        </group>
      );
    case "box":
      return <GltfModel id="cardboard_box_01" size={0.5} />;
    case "crate":
      return <GltfModel id="wooden_crate_01" size={0.55} />;
    case "plant":
      return <GltfModel id="potted_plant_04" size={0.75} by="height" />;
    case "frame":
      return <GltfModel id="fancy_picture_frame_01" size={0.55} />;
  }
};

