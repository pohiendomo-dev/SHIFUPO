import { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { COLORS } from "../lib/brand";
import { clamp01, EASE } from "../lib/motion";
import { Car, FlowerBed, Mailbox } from "./Life";
import { CITY, YARD, type YardPiece } from "./shots";
import { Toon, useBox, useCone, useCylinder, useSphere } from "./toon";

// The world around the house, laid out like a neighbourhood map: a grid of
// blocks separated by asphalt streets with gold centre dashes, sidewalks,
// street trees, a park in front of the house, modern homes on every other
// block, and ink mountains far behind. `litRadius` lights the homes outward
// from the house (windows glow, a map pin pops up over each one).

const P = CITY.pitch;
const B = CITY.blocks;
const LOT = P - CITY.road;
const EXTENT = (B + 0.5) * P;

const isPark = (i: number, j: number) => CITY.park.some(([a, b]) => a === i && b === j);

const RoundTree: React.FC<{ s?: number; seed: number }> = ({ s = 1, seed }) => {
  const frame = useCurrentFrame();
  const trunk = useCylinder(0.07, 0.1, 0.8, 8);
  const crown = useSphere(0.55, 14);
  const sway = Math.sin(frame * 0.03 + seed) * 0.02;
  return (
    <group scale={s} rotation={[sway, 0, sway]}>
      <Toon geometry={trunk} color={COLORS.wood} position={[0, 0.4, 0]} />
      <Toon geometry={crown} color={COLORS.treeCrown} outline={0.04} position={[0, 1.15, 0]} />
      <Toon geometry={crown} color={COLORS.treeCrownLight} position={[0.18, 1.35, 0.12]} scale={0.55} />
    </group>
  );
};

const Cypress: React.FC<{ s?: number }> = ({ s = 1 }) => {
  const body = useCone(0.32, 2.0, 10);
  return <Toon geometry={body} color={COLORS.pine} outline={0.04} position={[0, 1.0 * s, 0]} scale={s} />;
};

// Small modern home for the neighbourhood, facing +z in its own frame.
const MiniHome: React.FC<{ lit: number; seed: number; color: string; tall: number; evening: number }> = ({ lit, seed, color, tall, evening }) => {
  const frame = useCurrentFrame();
  const base = useBox(1.9, 0.9, 1.6);
  const upper = useBox(1.25, 0.75, 1.15);
  const roofA = useBox(2.05, 0.08, 1.75);
  const roofB = useBox(1.4, 0.08, 1.3);
  const band = useMemo(() => new THREE.PlaneGeometry(1.1, 0.34), []);
  const bandUp = useMemo(() => new THREE.PlaneGeometry(0.8, 0.26), []);
  const door = useBox(0.32, 0.6, 0.04);
  const pinHead = useSphere(0.22, 14);
  const pinTip = useCone(0.15, 0.42, 14);
  const ring = useMemo(() => new THREE.TorusGeometry(0.24, 0.035, 8, 24), []);
  const on = clamp01(lit);
  // At dusk about half the windows are already lit, each its own way.
  const evenOn = evening * (random(`eve${seed}`) > 0.45 ? 0.75 : 0.1);
  const win = new THREE.Color(COLORS.glass).lerp(new THREE.Color(COLORS.goldLight), Math.max(on, evenOn));
  // The pin overshoots as it pops in, then floats.
  const pop = EASE.overshoot(clamp01(lit * 1.2));
  const float = Math.sin(frame * 0.08 + seed) * 0.08;
  const upperH = 0.75 * tall;
  return (
    <group>
      <Toon geometry={base} color={color} outline={0.02} position={[0, 0.45, 0]} />
      <Toon geometry={roofA} color={COLORS.charcoal} position={[0, 0.94, 0]} />
      <group position={[-0.25, 0.98 + upperH / 2, -0.1]} scale={[1, tall, 1]}>
        <Toon geometry={upper} color={color} outline={0.02} />
      </group>
      <Toon geometry={roofB} color={COLORS.charcoal} position={[-0.25, 0.98 + upperH + 0.04, -0.1]} />
      <mesh geometry={band} position={[-0.25, 0.5, 0.81]}>
        <meshBasicMaterial color={win} toneMapped={false} />
      </mesh>
      <mesh geometry={bandUp} position={[-0.25, 0.98 + upperH / 2, 0.48]}>
        <meshBasicMaterial color={win} toneMapped={false} />
      </mesh>
      <Toon geometry={door} color={COLORS.seal} position={[0.6, 0.3, 0.81]} />
      {pop > 0.01 ? (
        <group position={[-0.25, 0.98 + upperH + 0.9 + float, -0.1]} scale={pop}>
          <Toon geometry={pinHead} color={COLORS.seal} emissive={COLORS.seal} emissiveIntensity={0.35} outline={0.06} position={[0, 0.22, 0]} />
          <Toon geometry={pinTip} color={COLORS.seal} position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]} />
          <mesh geometry={ring} position={[0, 0.22, 0]} rotation={[0, frame * 0.04, 0]}>
            <meshBasicMaterial color={COLORS.goldLight} toneMapped={false} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

const Roads: React.FC = () => {
  const strip = useBox(CITY.road, 0.02, EXTENT * 2);
  const dash = useBox(0.08, 0.025, 0.9);
  const lines = Array.from({ length: B * 2 + 2 }, (_, k) => (k - B - 0.5) * P);
  const dashes = Array.from({ length: Math.floor((EXTENT * 2) / 2.2) }, (_, k) => -EXTENT + 1.1 + k * 2.2);
  return (
    <group>
      {lines.map((c) => (
        <group key={`x${c}`}>
          <Toon geometry={strip} color={COLORS.asphalt} position={[c, 0.012, 0]} pbr={{ id: "asphalt_02", repeat: [CITY.road / 3, (EXTENT * 2) / 3] }} />
          <Toon geometry={strip} color={COLORS.asphalt} position={[0, 0.011, c]} rotation={[0, Math.PI / 2, 0]} pbr={{ id: "asphalt_02", repeat: [CITY.road / 3, (EXTENT * 2) / 3] }} />
          {dashes.map((d) => (
            <group key={d}>
              <mesh geometry={dash} position={[c, 0.025, d]}>
                <meshBasicMaterial color={COLORS.goldLight} />
              </mesh>
              <mesh geometry={dash} position={[d, 0.024, c]} rotation={[0, Math.PI / 2, 0]}>
                <meshBasicMaterial color={COLORS.goldLight} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};

const yard = (label: string): YardPiece => {
  const p = YARD.find((y) => y.label === label);
  if (!p) {
    throw new Error(`YARD has no "${label}"`);
  }
  return p;
};

// The house's own plot, drawn from the YARD layout that
// tests/layout3d.test.ts checks for overlaps: driveway, pavers, garden
// lights, hedges, trees, flower bed, mailbox and (optionally) a parked car.
const HomePlot: React.FC<{ light: number; details: boolean }> = ({ light, details }) => {
  const box = (label: string, h: number) => {
    const p = yard(label);
    return { p, h };
  };
  const drive = yard("driveway");
  const driveGeo = useBox(drive.w, 0.03, drive.d);
  const paverGeo = useBox(0.9, 0.04, 0.5);
  const back = box("back hedge", 0.45);
  const side = box("side hedge", 0.45);
  const backGeo = useBox(back.p.w, back.h, back.p.d);
  const sideGeo = useBox(side.p.w, side.h, side.p.d);
  const bollard = useCylinder(0.06, 0.06, 0.4, 10);
  const bed = yard("flower bed");
  const mail = yard("mailbox");
  const car = yard("parked car");
  return (
    <group>
      <Toon geometry={driveGeo} color={COLORS.concrete} position={[drive.x, 0.11, drive.z]} pbr={{ id: "concrete_floor_worn_001", repeat: [drive.w / 1.5, drive.d / 1.5] }} />
      {["paver 1", "paver 2"].map((l) => {
        const p = yard(l);
        return <Toon key={l} geometry={paverGeo} color={COLORS.sidewalk} outline={0.03} position={[p.x, 0.12, p.z]} pbr={{ id: "concrete_floor_worn_001", repeat: [0.6, 0.35] }} />;
      })}
      <Toon geometry={backGeo} color={COLORS.pine} outline={0.02} position={[back.p.x, 0.3, back.p.z]} roughness={0.95} />
      <Toon geometry={sideGeo} color={COLORS.pine} outline={0.02} position={[side.p.x, 0.3, side.p.z]} roughness={0.95} />
      {["bollard 1", "bollard 2", "bollard 3"].map((l) => {
        const p = yard(l);
        return <Toon key={l} geometry={bollard} color={COLORS.gold} emissive={COLORS.goldLight} emissiveIntensity={0.2 + light} outline={0.08} position={[p.x, 0.3, p.z]} roughness={0.4} metalness={0.5} />;
      })}
      <group position={[yard("tree back left").x, 0.1, yard("tree back left").z]}>
        <RoundTree s={1.35} seed={1} />
      </group>
      <group position={[yard("cypress").x, 0.1, yard("cypress").z]}>
        <Cypress s={1.3} />
      </group>
      <group position={[yard("tree right").x, 0.1, yard("tree right").z]}>
        <RoundTree s={1.05} seed={2} />
      </group>
      {details ? (
        <>
          <group position={[bed.x, 0.1, bed.z]}>
            <FlowerBed w={bed.w} d={bed.d} seed="front-bed" />
          </group>
          <group position={[mail.x, 0.1, mail.z]} rotation={[0, -Math.PI / 2, 0]}>
            <Mailbox />
          </group>
          <group position={[car.x, 0.12, car.z]} rotation={[0, Math.PI / 2, 0]}>
            <Car color={COLORS.white} lights={0} />
          </group>
        </>
      ) : null}
    </group>
  );
};

const Petals: React.FC = () => {
  const frame = useCurrentFrame();
  const petal = useMemo(() => new THREE.PlaneGeometry(0.1, 0.065), []);
  return (
    <group>
      {Array.from({ length: 45 }, (_, i) => {
        const fall = 0.012 + random(`pf${i}`) * 0.012;
        const span = 8;
        const y = 7.5 - ((frame * fall + random(`py${i}`) * span) % span);
        const x = (random(`px${i}`) - 0.5) * 14 + Math.sin(frame * 0.02 + i) * 0.6;
        const z = (random(`pz${i}`) - 0.5) * 12 + 3;
        return (
          <mesh key={i} geometry={petal} position={[x, y, z]} rotation={[frame * 0.05 + i, frame * 0.04 + i * 2, 0]}>
            <meshBasicMaterial color={i % 3 === 0 ? COLORS.seal : COLORS.lotus} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
};

const MOUNTAIN_RINGS = [
  { radius: 48, count: 18, height: [8, 15], color: COLORS.mountainNear },
  { radius: 70, count: 22, height: [14, 24], color: COLORS.mountainMid },
  { radius: 100, count: 26, height: [22, 36], color: COLORS.mountainFar },
] as const;

export type NeighbourHome = { x: number; z: number; rot: number; d: number; color: string; tall: number; seed: number };

// Every neighbourhood home: four per block, facing the nearest street.
let homesCache: NeighbourHome[] | null = null;
export const neighbourhoodHomes = (): NeighbourHome[] => {
  if (homesCache) {
    return homesCache;
  }
  const list: NeighbourHome[] = [];
  const palette = [COLORS.render, COLORS.wall, COLORS.concrete, COLORS.paperDeep];
  let n = 0;
  for (let i = -B; i <= B; i++) {
    for (let j = -B; j <= B; j++) {
      if ((i === 0 && j === 0) || isPark(i, j)) {
        continue;
      }
      for (const [ox, oz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        const x = i * P + ox * LOT * 0.25;
        const z = j * P + oz * LOT * 0.25;
        list.push({
          x,
          z,
          rot: oz > 0 ? 0 : Math.PI,
          d: Math.hypot(x, z),
          color: palette[Math.floor(random(`hc${n}`) * palette.length)],
          tall: 0.7 + random(`ht${n}`) * 0.7,
          seed: n,
        });
        n++;
      }
    }
  }
  homesCache = list;
  return list;
};

export const Landscape: React.FC<{
  litRadius: number;
  light: number;
  // Yard details (flower bed, mailbox, parked car).
  details?: boolean;
  // 0 day .. 1 dusk: windows across the neighbourhood glow.
  evening?: number;
}> = ({ litRadius, light, details = false, evening = 0 }) => {
  const ground = useMemo(() => new THREE.CircleGeometry(220, 64), []);
  const sidewalk = useBox(LOT, 0.08, LOT);
  const lawn = useBox(LOT - 0.6, 0.06, LOT - 0.6);
  const cone = useCone(1, 1, 6);
  const homes = neighbourhoodHomes();
  const streetTrees = useMemo(() => {
    const list: { x: number; z: number; s: number }[] = [];
    for (let i = -B; i <= B; i++) {
      for (let j = -B; j <= B; j++) {
        if ((i === 0 && j === 0) || isPark(i, j)) {
          continue;
        }
        for (const [cx, cz] of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ]) {
          list.push({ x: i * P + cx * (LOT / 2 - 0.4), z: j * P + cz * (LOT / 2 - 0.4), s: 0.8 + random(`st${i}${j}${cx}${cz}`) * 0.3 });
        }
      }
    }
    return list;
  }, []);
  const peaks = MOUNTAIN_RINGS.map((ring) =>
    Array.from({ length: ring.count }, (_, i) => {
      const a = (i / ring.count) * Math.PI * 2 + random(`ma${ring.radius}${i}`) * 0.2;
      const h = ring.height[0] + random(`mh${ring.radius}${i}`) * (ring.height[1] - ring.height[0]);
      const r = ring.radius * (0.92 + random(`mr${ring.radius}${i}`) * 0.16);
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, h, w: h * (0.8 + random(`mw${ring.radius}${i}`) * 0.4), seed: i };
    }),
  );
  return (
    <group>
      <Toon geometry={ground} color={COLORS.paperDeep} rotation={[-Math.PI / 2, 0, 0]} pbr={{ id: "aerial_grass_rock", repeat: [90, 90] }} />
      <Roads />
      {Array.from({ length: B * 2 + 1 }, (_, a) => a - B).flatMap((i) =>
        Array.from({ length: B * 2 + 1 }, (_, b) => b - B).map((j) => (
          <group key={`${i},${j}`} position={[i * P, 0, j * P]}>
            <Toon geometry={sidewalk} color={COLORS.sidewalk} position={[0, 0.04, 0]} pbr={{ id: "concrete_floor_worn_001", repeat: [LOT / 2, LOT / 2] }} />
            <Toon geometry={lawn} color={COLORS.lawn} position={[0, 0.08, 0]} pbr={{ id: "aerial_grass_rock", repeat: [LOT / 3, LOT / 3] }} />
            {/* Only the park off to the side gets trees; the park in front
                of the house is open lawn so the cameras see the house. */}
            {isPark(i, j) && i < 0
              ? [
                  [-2.2, -1.5, 1.2],
                  [1.8, -2.4, 1.0],
                  [2.6, 1.6, 1.3],
                  [-2.8, 2.4, 0.9],
                  [0.2, 2.8, 1.1],
                ].map(([x, z, s], k) => (
                  <group key={k} position={[x, 0.1, z]}>
                    <RoundTree s={s} seed={k + i * 7} />
                  </group>
                ))
              : null}
          </group>
        )),
      )}
      <HomePlot light={light} details={details} />
      {homes.map((h) => (
        <group key={h.seed} position={[h.x, 0.11, h.z]} rotation={[0, h.rot, 0]}>
          <MiniHome lit={(litRadius - h.d) / 2.5} seed={h.seed} color={h.color} tall={h.tall} evening={evening} />
        </group>
      ))}
      {streetTrees.map((t, k) => (
        <group key={k} position={[t.x, 0.1, t.z]}>
          <RoundTree s={t.s} seed={k} />
        </group>
      ))}
      {MOUNTAIN_RINGS.map((ring, k) =>
        peaks[k].map((p) => (
          <Toon key={`${k}-${p.seed}`} geometry={cone} color={ring.color} position={[p.x, p.h / 2 - 0.5, p.z]} scale={[p.w, p.h, p.w]} roughness={1} />
        )),
      )}
      <Petals />
    </group>
  );
};
