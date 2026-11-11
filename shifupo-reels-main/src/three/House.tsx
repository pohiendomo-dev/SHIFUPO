import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { COLORS } from "../lib/brand";
import { clamp01, lerp } from "../lib/motion";
import { FLOOR_Y, FRONT_Z, HOUSE, INTERIOR, type InteriorItem, type ItemKind } from "./shots";
import { Toon, useBox, useCone, useCylinder, useSphere } from "./toon";

// Modern two-storey house: rendered walls on a concrete podium, a full-height
// picture window, a tall red pivot door under a charcoal canopy, timber slat
// cladding, flat roofs with a thin gold fascia, and a real interior behind
// the glass. `light` (0 dark .. 1 warm) shades the interior and windows;
// `arrange` moves each interior item from cluttered to tidy.

const OUT = 0.03;
const ink = new THREE.Color(COLORS.koiInk);

// Interior colours sink towards ink when the house has no energy.
export const shade = (color: string, light: number) =>
  `#${ink.clone().lerp(new THREE.Color(color), 0.18 + 0.82 * light).getHexString()}`;

const Glass: React.FC<{ w: number; h: number; position: [number, number, number]; light: number; rotY?: number }> = ({
  w,
  h,
  position,
  light,
  rotY = 0,
}) => {
  const pane = useMemo(() => new THREE.PlaneGeometry(w, h), [w, h]);
  const tint = new THREE.Color(COLORS.glass).lerp(new THREE.Color(COLORS.skyTop), 0.18).lerp(new THREE.Color(COLORS.goldLight), light * 0.35);
  return (
    <mesh geometry={pane} position={position} rotation={[0, rotY, 0]}>
      <meshBasicMaterial color={tint} transparent opacity={0.32 + (1 - light) * 0.18} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};

const Item: React.FC<{ kind: ItemKind; light: number }> = ({ kind, light }) => {
  const s = (c: string) => shade(c, light);
  const rug = useBox(1.6, 0.02, 1.1);
  const seat = useBox(1.3, 0.24, 0.55);
  const back = useBox(1.3, 0.32, 0.12);
  const arm = useBox(0.12, 0.34, 0.55);
  const top = useBox(0.7, 0.05, 0.45);
  const base = useBox(0.55, 0.2, 0.32);
  const unit = useBox(1.2, 0.32, 0.3);
  const screen = useBox(0.95, 0.52, 0.04);
  const table = useBox(1.0, 0.05, 0.7);
  const leg = useBox(0.05, 0.42, 0.05);
  const chairSeat = useBox(0.36, 0.05, 0.36);
  const chairBack = useBox(0.36, 0.42, 0.05);
  const chairLeg = useBox(0.04, 0.24, 0.04);
  const carton = useBox(0.42, 0.32, 0.36);
  const tape = useBox(0.43, 0.02, 0.07);
  const pot = useCylinder(0.15, 0.11, 0.26, 18);
  const crown = useSphere(0.26, 14);
  const lampBase = useCylinder(0.12, 0.14, 0.03, 18);
  const pole = useCylinder(0.015, 0.015, 1.1, 8);
  const lampShade = useCone(0.18, 0.22, 18);
  switch (kind) {
    case "rug":
      return <Toon geometry={rug} color={s(COLORS.rug)} position={[0, 0.01, 0]} />;
    case "sofa":
      return (
        <group>
          <Toon geometry={seat} color={s(COLORS.seal)} outline={OUT} position={[0, 0.17, 0]} />
          <Toon geometry={back} color={s(COLORS.sealDeep)} outline={OUT} position={[0, 0.42, -0.22]} />
          {[-1, 1].map((k) => (
            <Toon key={k} geometry={arm} color={s(COLORS.sealDeep)} outline={OUT} position={[k * 0.64, 0.22, 0]} />
          ))}
        </group>
      );
    case "coffee":
      return (
        <group>
          <Toon geometry={base} color={s(COLORS.charcoal)} position={[0, 0.1, 0]} />
          <Toon geometry={top} color={s(COLORS.woodLight)} outline={OUT} position={[0, 0.23, 0]} />
        </group>
      );
    case "tv":
      return (
        <group>
          <Toon geometry={unit} color={s(COLORS.slat)} outline={OUT} position={[0, 0.16, 0]} />
          <Toon geometry={screen} color={s(COLORS.charcoal)} outline={OUT} position={[0, 0.62, -0.08]} />
        </group>
      );
    case "dining":
      return (
        <group>
          <Toon geometry={table} color={s(COLORS.woodLight)} outline={OUT} position={[0, 0.44, 0]} />
          {[-1, 1].flatMap((a) =>
            [-1, 1].map((b) => <Toon key={`${a}${b}`} geometry={leg} color={s(COLORS.charcoal)} position={[a * 0.42, 0.21, b * 0.28]} />),
          )}
        </group>
      );
    case "chair":
      return (
        <group>
          <Toon geometry={chairSeat} color={s(COLORS.charcoal)} outline={OUT} position={[0, 0.25, 0]} />
          <Toon geometry={chairBack} color={s(COLORS.charcoal)} outline={OUT} position={[0, 0.48, -0.16]} />
          {[-1, 1].flatMap((a) =>
            [-1, 1].map((b) => <Toon key={`${a}${b}`} geometry={chairLeg} color={s(COLORS.charcoal)} position={[a * 0.15, 0.12, b * 0.15]} />),
          )}
        </group>
      );
    case "boxes":
      return (
        <group>
          {[
            [0, 0.16, 0, 0],
            [0.08, 0.48, 0.03, 0.3],
            [-0.3, 0.16, 0.25, -0.5],
          ].map(([x, y, z, r], i) => (
            <group key={i} position={[x, y, z]} rotation={[0, r, 0]}>
              <Toon geometry={carton} color={s(COLORS.box)} outline={OUT} />
              <Toon geometry={tape} color={s(COLORS.paperDeep)} position={[0, 0.16, 0]} />
            </group>
          ))}
        </group>
      );
    case "plant":
      return (
        <group>
          <Toon geometry={pot} color={s(COLORS.concrete)} outline={OUT} position={[0, 0.13, 0]} />
          <Toon geometry={crown} color={s(COLORS.treeCrown)} outline={OUT} position={[0, 0.48, 0]} />
          <Toon geometry={crown} color={s(COLORS.treeCrownLight)} position={[0.1, 0.62, 0.05]} scale={0.6} />
        </group>
      );
    case "lamp":
      return (
        <group>
          <Toon geometry={lampBase} color={s(COLORS.charcoal)} position={[0, 0.015, 0]} />
          <Toon geometry={pole} color={s(COLORS.charcoal)} position={[0, 0.56, 0]} />
          <Toon geometry={lampShade} color={COLORS.gold} emissive={COLORS.goldLight} emissiveIntensity={light * 0.9} outline={OUT} position={[0, 1.12, 0]} />
        </group>
      );
  }
};

// A wall box placed by its x/y extents on the plane z (front/back walls).
const WallPiece: React.FC<{ x0: number; x1: number; y0: number; y1: number; z: number; color: string; depth?: number }> = ({
  x0,
  x1,
  y0,
  y1,
  z,
  color,
  depth = HOUSE.wall,
}) => {
  const w = Math.max(0.001, x1 - x0);
  const h = Math.max(0.001, y1 - y0);
  const g = useBox(w, h, depth);
  // Plaster tiles about every 1.4 m so the texture keeps its real scale.
  return (
    <Toon
      geometry={g}
      color={color}
      outline={0.012}
      position={[(x0 + x1) / 2, (y0 + y1) / 2, z]}
      pbr={color === COLORS.charcoal ? undefined : { id: "white_plaster_02", repeat: [w / PLASTER_TILE, h / PLASTER_TILE] }}
    />
  );
};

// Real-world size of one texture tile (metres) for the main surfaces.
const PLASTER_TILE = 1.4;
const FLOOR_TILE = 1.2;

// Places one interior item: hop and slide from cluttered to tidy, knocked
// over (tilt) or crooked (roll) when cluttered, gone/appearing as needed.
const PlacedItem: React.FC<{ item: InteriorItem; t: number; children: React.ReactNode }> = ({ item, t, children }) => {
  const tc = clamp01(t);
  const hop = Math.sin(tc * Math.PI) * 0.4;
  const p = { x: lerp(item.messy.x, item.tidy.x, t), z: lerp(item.messy.z, item.tidy.z, t) };
  const y = lerp(item.messy.y ?? 0, item.tidy.y ?? 0, tc);
  const rot = lerp(item.messy.rot, item.tidy.rot, t);
  const tilt = lerp(item.messy.tilt ?? 0, item.tidy.tilt ?? 0, tc);
  const roll = lerp(item.messy.roll ?? 0, item.tidy.roll ?? 0, tc);
  const gone = item.gone ? tc : 0;
  const shown = item.appear ? Math.max(0, t) : 1;
  const scale = (1 - gone) * Math.min(1.15, shown);
  if (scale <= 0.001) {
    return null;
  }
  return (
    <group position={[p.x, FLOOR_Y + 0.03 + y + hop - gone * 0.4, p.z]} rotation={[0, rot, 0]} scale={scale}>
      <group rotation={[tilt, 0, roll]} position={[0, Math.abs(Math.sin(tilt)) * 0.12, 0]}>
        {children}
      </group>
    </group>
  );
};

export const House: React.FC<{
  // 0 dark, cluttered energy .. 1 warm and full.
  light: number;
  doorOpen: number;
  // 0 on .. 1 the upper floor and roofs lifted off (cutaway).
  lift: number;
  arrange: number[];
  // The room behind the glass; defaults to SP03's living room.
  items?: InteriorItem[];
  renderItem?: (kind: string, light: number) => React.ReactNode;
}> = ({ light, doorOpen, lift, arrange, items = INTERIOR, renderItem }) => {
  const frame = useCurrentFrame();
  const { ground: G, upper: U, wall: T, door: D, glazing: GZ, backWindow: BW } = HOUSE;
  const top = FLOOR_Y + G.height;
  const halfW = G.width / 2;
  const frontZ = FRONT_Z - T / 2;
  const backZ = -FRONT_Z + T / 2;
  const doorL = D.x - D.width / 2;
  const doorR = D.x + D.width / 2;

  const podium = useBox(HOUSE.podium.width, HOUSE.podium.height, HOUSE.podium.depth);
  const sideLiner = useBox(0.01, G.height, G.depth - T * 2);
  const linerZ = backZ + T / 2 + 0.006;
  const floor = useBox(G.width - T * 2, 0.03, G.depth - T * 2);
  const sideWall = useBox(T, G.height, G.depth);
  const ceiling = useBox(G.width + 0.3, HOUSE.slab, G.depth + 0.3);
  const fascia = useBox(G.width + 0.32, 0.035, 0.035);
  const upperBox = useBox(U.width, U.height, U.depth);
  const upperRoof = useBox(U.width + 0.35, HOUSE.slab, U.depth + 0.35);
  const upperFascia = useBox(U.width + 0.37, 0.035, 0.035);
  const ribbon = useMemo(() => new THREE.PlaneGeometry(U.width * 0.62, 0.62), [U.width]);
  const slat = useBox(0.045, G.height - 0.05, 0.05);
  const upperSlat = useBox(0.045, U.height - 0.1, 0.05);
  const mullion = useBox(0.045, GZ.top - GZ.sill, 0.06);
  const leaf = useBox(D.width, D.height, D.depth);
  const handle = useBox(0.03, 0.55, 0.04);
  const canopy = useBox(D.width + 0.9, 0.08, 0.75);
  const sconce = useBox(0.08, 0.22, 0.08);
  const step = useBox(1.3, 0.1, 0.4);
  const planter = useBox(1.2, 0.35, 0.4);
  const shrub = useSphere(0.24, 12);

  const glassY = FLOOR_Y + (GZ.sill + GZ.top) / 2;
  const liftY = lift * HOUSE.upperLift;

  return (
    <group>
      <Toon geometry={podium} color={COLORS.white} outline={0.012} position={[0, HOUSE.podium.height / 2, 0]} pbr={{ id: "concrete_floor_worn_001", repeat: [3, 2.4] }} />
      {[0, 1].map((i) => (
        <Toon key={i} geometry={step} color={COLORS.concrete} outline={0.02} position={[D.x, 0.05 + (1 - i) * 0.1 - 0.05, HOUSE.podium.depth / 2 + 0.2 + i * 0.4]} />
      ))}
      <Toon geometry={floor} color={shade(COLORS.white, light)} position={[0, FLOOR_Y + 0.015, 0]} pbr={{ id: "laminate_floor_02", repeat: [G.width / FLOOR_TILE, G.depth / FLOOR_TILE] }} />

      {/* Side walls. */}
      {[-1, 1].map((k) => (
        <Toon key={k} geometry={sideWall} color={COLORS.render} outline={0.012} position={[k * (halfW - T / 2), FLOOR_Y + G.height / 2, 0]} pbr={{ id: "white_plaster_02", repeat: [G.depth / PLASTER_TILE, G.height / PLASTER_TILE] }} />
      ))}

      {/* Back wall with the window the qi escapes through. */}
      <WallPiece x0={-halfW} x1={BW.x - BW.width / 2} y0={FLOOR_Y} y1={top} z={backZ} color={COLORS.render} />
      <WallPiece x0={BW.x + BW.width / 2} x1={halfW} y0={FLOOR_Y} y1={top} z={backZ} color={COLORS.render} />
      <WallPiece x0={BW.x - BW.width / 2} x1={BW.x + BW.width / 2} y0={FLOOR_Y} y1={FLOOR_Y + BW.sill} z={backZ} color={COLORS.render} />
      <WallPiece x0={BW.x - BW.width / 2} x1={BW.x + BW.width / 2} y0={FLOOR_Y + BW.sill + BW.height} y1={top} z={backZ} color={COLORS.render} />
      <Glass w={BW.width} h={BW.height} position={[BW.x, FLOOR_Y + BW.sill + BW.height / 2, backZ]} light={light} />

      {/* Inner wall faces: they darken with the house's energy, so the
          room reads dark and stale until it is rearranged. */}
      {[-1, 1].map((k) => (
        <Toon key={k} geometry={sideLiner} color={shade(COLORS.render, light)} position={[k * (halfW - T - 0.006), FLOOR_Y + G.height / 2, 0]} />
      ))}
      <WallPiece x0={-halfW + T} x1={BW.x - BW.width / 2} y0={FLOOR_Y} y1={top} z={linerZ} color={shade(COLORS.render, light)} depth={0.01} />
      <WallPiece x0={BW.x + BW.width / 2} x1={halfW - T} y0={FLOOR_Y} y1={top} z={linerZ} color={shade(COLORS.render, light)} depth={0.01} />
      <WallPiece x0={BW.x - BW.width / 2} x1={BW.x + BW.width / 2} y0={FLOOR_Y} y1={FLOOR_Y + BW.sill} z={linerZ} color={shade(COLORS.render, light)} depth={0.01} />
      <WallPiece x0={BW.x - BW.width / 2} x1={BW.x + BW.width / 2} y0={FLOOR_Y + BW.sill + BW.height} y1={top} z={linerZ} color={shade(COLORS.render, light)} depth={0.01} />

      {/* Front: picture window, wall pier, pivot door, timber slats. */}
      <WallPiece x0={-halfW} x1={GZ.from} y0={FLOOR_Y} y1={top} z={frontZ} color={COLORS.render} />
      <WallPiece x0={GZ.from} x1={GZ.to} y0={FLOOR_Y} y1={FLOOR_Y + GZ.sill} z={frontZ} color={COLORS.charcoal} />
      <WallPiece x0={GZ.from} x1={GZ.to} y0={FLOOR_Y + GZ.top} y1={top} z={frontZ} color={COLORS.render} />
      <Glass w={GZ.to - GZ.from} h={GZ.top - GZ.sill} position={[(GZ.from + GZ.to) / 2, glassY, frontZ]} light={light} />
      {[GZ.from, (GZ.from + GZ.to) / 2, GZ.to].map((x, i) => (
        <Toon key={i} geometry={mullion} color={COLORS.charcoal} position={[x, glassY, frontZ + 0.01]} />
      ))}
      <WallPiece x0={GZ.to} x1={doorL} y0={FLOOR_Y} y1={top} z={frontZ} color={COLORS.render} />
      <WallPiece x0={doorL} x1={doorR} y0={FLOOR_Y + D.height} y1={top} z={frontZ} color={COLORS.render} />
      <WallPiece x0={doorR} x1={halfW} y0={FLOOR_Y} y1={top} z={frontZ} color={COLORS.render} />
      {Array.from({ length: 9 }, (_, i) => (
        <Toon key={i} geometry={slat} color={COLORS.white} position={[doorR + 0.08 + i * 0.095, FLOOR_Y + G.height / 2, FRONT_Z + 0.03]} pbr={{ id: "wood_planks", repeat: [0.08, 1.2] }} />
      ))}
      {/* Pivot door: swings into the house around an off-centre axis. */}
      <group position={[doorL + D.pivot, FLOOR_Y + D.height / 2, frontZ]} rotation={[0, doorOpen * HOUSE.doorSwing, 0]}>
        <Toon geometry={leaf} color={COLORS.seal} outline={0.035} position={[D.width / 2 - D.pivot, 0, 0]} />
        <Toon geometry={handle} color={COLORS.gold} position={[D.width - D.pivot - 0.1, 0, D.depth / 2 + 0.03]} />
      </group>
      <group position={[D.x, FLOOR_Y + D.height + 0.1, FRONT_Z + 0.35]}>
        <Toon geometry={canopy} color={COLORS.charcoal} outline={0.02} />
      </group>
      {[-1, 1].map((k) => (
        <Toon key={k} geometry={sconce} color={COLORS.gold} emissive={COLORS.goldLight} emissiveIntensity={0.3 + light * 0.9} outline={0.06} position={[D.x + k * (D.width / 2 + 0.16), FLOOR_Y + 1.15, FRONT_Z + 0.06]} />
      ))}
      <group position={[(GZ.from + GZ.to) / 2, 0.375, HOUSE.podium.depth / 2 - 0.25]}>
        <Toon geometry={planter} color={COLORS.charcoal} outline={0.02} />
        {[-0.4, 0, 0.4].map((x, i) => (
          <Toon key={i} geometry={shrub} color={COLORS.treeCrown} outline={0.04} position={[x, 0.28, 0]} scale={0.9 + Math.sin(frame * 0.05 + i) * 0.02} />
        ))}
      </group>

      {/* Interior. */}
      {items.map((item, i) => (
        <PlacedItem key={i} item={item} t={arrange[i] ?? 0}>
          {renderItem ? renderItem(item.kind, light) : <Item kind={item.kind as ItemKind} light={light} />}
        </PlacedItem>
      ))}

      {/* Everything above the ground floor lifts off for the cutaway. */}
      <group position={[0, liftY, 0]} rotation={[-lift * 0.08, 0, lift * 0.05]}>
        <Toon geometry={ceiling} color={COLORS.charcoal} outline={0.012} position={[0, top + HOUSE.slab / 2, 0]} />
        <Toon geometry={fascia} color={COLORS.gold} position={[0, top + HOUSE.slab / 2, G.depth / 2 + 0.16]} />
        <group position={[U.x, top + HOUSE.slab + U.height / 2, U.z]}>
          <Toon geometry={upperBox} color={COLORS.render} outline={0.012} pbr={{ id: "white_plaster_02", repeat: [U.width / PLASTER_TILE, U.height / PLASTER_TILE] }} />
          <mesh geometry={ribbon} position={[-U.width * 0.15, 0.05, U.depth / 2 + 0.01]}>
            <meshBasicMaterial color={new THREE.Color(COLORS.glass).lerp(new THREE.Color(COLORS.goldLight), light * 0.75)} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <Toon key={i} geometry={upperSlat} color={COLORS.white} position={[U.width / 2 - 0.12 - i * 0.1, 0, U.depth / 2 + 0.03]} pbr={{ id: "wood_planks", repeat: [0.08, 1] }} />
          ))}
          <Toon geometry={upperRoof} color={COLORS.charcoal} outline={0.012} position={[0, U.height / 2 + HOUSE.slab / 2, 0]} />
          <Toon geometry={upperFascia} color={COLORS.gold} position={[0, U.height / 2 + HOUSE.slab / 2, U.depth / 2 + 0.18]} />
        </group>
      </group>
    </group>
  );
};
