import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { random, staticFile, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { COLORS } from "../lib/brand";
import { CITY } from "./shots";
import { Toon, useBox, useCylinder, useSphere } from "./toon";

// Secondary life that makes the world feel lived in: cars driving the
// streets, birds crossing the sky, street lamps, a mailbox and flower beds.
// Everything is frame + seed driven, and kept off the camera paths (cars
// never use the two streets beside the house the cameras stand on).

// A small modern hatchback, facing +x, wheels on y = 0.
export const Car: React.FC<{ color: string; lights?: number; wheelSpin?: number }> = ({ color, lights = 0, wheelSpin = 0 }) => {
  const body = useBox(1.8, 0.42, 0.84);
  const cabin = useBox(1.0, 0.36, 0.78);
  const glass = useBox(1.02, 0.26, 0.8);
  const wheel = useCylinder(0.17, 0.17, 0.12, 18);
  const lamp = useBox(0.04, 0.08, 0.16);
  return (
    <group>
      <Toon geometry={body} color={color} outline={0.03} position={[0, 0.38, 0]} roughness={0.35} metalness={0.4} />
      <Toon geometry={cabin} color={color} outline={0.03} position={[-0.1, 0.76, 0]} roughness={0.35} metalness={0.4} />
      <Toon geometry={glass} color={COLORS.glass} position={[-0.1, 0.77, 0]} roughness={0.1} metalness={0.6} />
      {[-0.58, 0.58].flatMap((x) =>
        [-0.42, 0.42].map((z) => (
          <Toon key={`${x}${z}`} geometry={wheel} color={COLORS.charcoal} position={[x, 0.17, z]} rotation={[Math.PI / 2, 0, -wheelSpin]} roughness={0.9} />
        )),
      )}
      {[-0.26, 0.26].map((z) => (
        <group key={z}>
          <Toon geometry={lamp} color={COLORS.goldLight} emissive={COLORS.goldLight} emissiveIntensity={0.4 + lights * 2.5} position={[0.9, 0.42, z]} />
          <Toon geometry={lamp} color={COLORS.seal} emissive={COLORS.seal} emissiveIntensity={0.3 + lights * 1.5} position={[-0.9, 0.42, z]} />
        </group>
      ))}
    </group>
  );
};

const CAR_COLORS = [COLORS.white, COLORS.charcoal, COLORS.seal, COLORS.concrete, COLORS.glass, COLORS.goldDeep];
const EXTENT = (CITY.blocks + 0.5) * CITY.pitch;

// Streets the cars use: away from the two streets beside the house.
const LANES: { axis: "x" | "z"; line: number }[] = [
  { axis: "x", line: -5 - CITY.pitch },
  { axis: "x", line: 5 + CITY.pitch },
  { axis: "z", line: -5 },
  { axis: "z", line: -5 - CITY.pitch },
  { axis: "z", line: 5 + CITY.pitch },
];

export const MovingCars: React.FC<{ lights: number }> = ({ lights }) => {
  const frame = useCurrentFrame();
  const cars = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        lane: LANES[i % LANES.length],
        dir: i % 2 === 0 ? 1 : -1,
        speed: 0.05 + random(`car-s${i}`) * 0.04,
        offset: random(`car-o${i}`) * EXTENT * 2,
        color: CAR_COLORS[i % CAR_COLORS.length],
      })),
    [],
  );
  return (
    <group>
      {cars.map((c, i) => {
        const s = ((frame * c.speed + c.offset) % (EXTENT * 2)) - EXTENT;
        const along = s * c.dir;
        const side = c.dir * 0.42;
        const pos: [number, number, number] =
          c.lane.axis === "x" ? [c.lane.line + side, 0.02, along] : [along, 0.02, c.lane.line - side];
        const heading = c.lane.axis === "x" ? (c.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : c.dir > 0 ? 0 : Math.PI;
        return (
          <group key={i} position={pos} rotation={[0, heading, 0]}>
            <Car color={c.color} lights={lights} wheelSpin={frame * c.speed * 6} />
          </group>
        );
      })}
    </group>
  );
};

// A loose V of birds crossing the far sky, wings beating.
export const Birds: React.FC = () => {
  const frame = useCurrentFrame();
  const wing = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, -0.35, 0, 0.12, 0, 0, 0.32], 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={[-40 + ((frame * 0.09) % 80), 13, -22]}>
      {Array.from({ length: 9 }, (_, i) => {
        const row = Math.ceil(i / 2);
        const side = i % 2 === 0 ? 1 : -1;
        const flap = Math.sin(frame * 0.45 + i * 0.8) * 0.7;
        return (
          <group key={i} position={[-row * 0.9, Math.sin(frame * 0.05 + i) * 0.2 + row * 0.15, side * row * 0.7]} scale={1.4}>
            {[1, -1].map((w) => (
              <mesh key={w} geometry={wing} rotation={[0, 0, w * flap]} scale={[1, 1, w]}>
                <meshBasicMaterial color={COLORS.inkSoft} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

// A Poly Haven model, normalised to `size` metres tall, sitting on y = 0.
export const GltfModel: React.FC<{ id: string; size: number; by?: "height" | "max" }> = ({ id, size, by = "max" }) => {
  const { scene } = useGLTF(staticFile(`assets/3d/polyhaven/${id}/model.gltf`));
  const obj = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const s = box.getSize(new THREE.Vector3());
    const k = size / (by === "height" ? s.y : Math.max(s.x, s.y, s.z));
    c.scale.setScalar(k);
    c.updateMatrixWorld(true);
    box.setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    c.position.set(-center.x, -box.min.y, -center.z);
    return c;
  }, [scene, size, by]);
  return <primitive object={obj} />;
};

// Street lamps on the sidewalk corners behind and to the left of the house
// (never between a camera and the house).
export const StreetLamps: React.FC<{ glow: number }> = ({ glow }) => {
  const halo = useSphere(0.28, 12);
  // On the sidewalk ring of the house block: the back corners and the left
  // side behind the driveway (the front-left corner is the driveway).
  const corner = (CITY.pitch - CITY.road) / 2 - 0.12;
  const spots: [number, number][] = [
    [-corner, -corner],
    [corner, -corner],
    [-corner, -1.0],
  ];
  return (
    <group>
      {spots.map(([x, z]) => (
        <group key={`${x},${z}`} position={[x, 0.08, z]}>
          <GltfModel id="street_lamp_01" size={3.2} by="height" />
          {glow > 0.01 ? (
            <mesh geometry={halo} position={[0, 3.0, 0]}>
              <meshBasicMaterial color={COLORS.goldLight} transparent opacity={glow * 0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
};

export const Mailbox: React.FC = () => {
  const post = useBox(0.06, 0.9, 0.06);
  const box = useBox(0.22, 0.18, 0.3);
  const flag = useBox(0.02, 0.12, 0.06);
  return (
    <group>
      <Toon geometry={post} color={COLORS.charcoal} position={[0, 0.45, 0]} />
      <Toon geometry={box} color={COLORS.charcoal} position={[0, 0.98, 0]} roughness={0.4} metalness={0.5} />
      <Toon geometry={flag} color={COLORS.seal} position={[0.12, 1.05, 0.06]} />
    </group>
  );
};

const FLOWER_PALETTE = [COLORS.lotus, COLORS.seal, COLORS.goldLight, COLORS.white, COLORS.lotusDeep];

// A raised bed of small flowers in brand colours, swaying a little.
export const FlowerBed: React.FC<{ w: number; d: number; seed: string }> = ({ w, d, seed }) => {
  const frame = useCurrentFrame();
  const soil = useBox(w, 0.08, d);
  const bloom = useSphere(0.045, 8);
  const leaf = useSphere(0.06, 8);
  const flowers = useMemo(
    () =>
      Array.from({ length: Math.round(w * d * 70) }, (_, i) => ({
        x: (random(`${seed}fx${i}`) - 0.5) * (w - 0.1),
        z: (random(`${seed}fz${i}`) - 0.5) * (d - 0.08),
        h: 0.12 + random(`${seed}fh${i}`) * 0.12,
        c: FLOWER_PALETTE[Math.floor(random(`${seed}fc${i}`) * FLOWER_PALETTE.length)],
      })),
    [w, d, seed],
  );
  return (
    <group>
      <Toon geometry={soil} color={COLORS.wood} position={[0, 0.04, 0]} roughness={1} />
      {flowers.map((f, i) => {
        const sway = Math.sin(frame * 0.05 + i) * 0.015;
        return (
          <group key={i} position={[f.x + sway, 0.08, f.z]}>
            <Toon geometry={leaf} color={COLORS.treeCrown} position={[0, f.h * 0.4, 0]} scale={[1, 0.7, 1]} />
            <Toon geometry={bloom} color={f.c} position={[0, f.h, 0]} />
          </group>
        );
      })}
    </group>
  );
};
