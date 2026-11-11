import { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { COLORS } from "../lib/brand";
import { DOOR_CENTER, FLOOR_Y, FRONT_Z, LUOPAN_3D } from "./shots";
import { Toon, toonGradient, useBox, useCylinder } from "./toon";

// Chinese coin: round, square hole, bevelled edge. Lies in the xy plane.
const useCoin = (r = 0.26) =>
  useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, r, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    const h = r * 0.3;
    hole.moveTo(-h, -h);
    hole.lineTo(h, -h);
    hole.lineTo(h, h);
    hole.lineTo(-h, h);
    hole.lineTo(-h, -h);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
      curveSegments: 32,
    });
    g.center();
    return g;
  }, [r]);

const GRAVITY = 0.012;

// Coins fly at the closed door, hit it on `hitAt` and bounce back down to
// the ground: the money that never gets in.
export const BlockedCoins: React.FC<{ hitAt: number; until: number }> = ({ hitAt, until }) => {
  const frame = useCurrentFrame();
  const coin = useCoin();
  if (frame > until) {
    return null;
  }
  return (
    <group>
      {Array.from({ length: 5 }, (_, k) => {
        const hit = hitAt + k * 3;
        const flight = 20;
        const t = frame - (hit - flight);
        if (t < 0) {
          return null;
        }
        const from = new THREE.Vector3(-3.4 + k * 0.5, 3.0 + random(`bc${k}`) * 0.6, 6.4);
        const to = new THREE.Vector3(DOOR_CENTER[0] - 0.25 + k * 0.12, FLOOR_Y + 0.5 + random(`bh${k}`) * 0.6, FRONT_Z + 0.1);
        let p: THREE.Vector3;
        if (t <= flight) {
          const u = t / flight;
          p = from.clone().lerp(to, u);
          p.y += Math.sin(u * Math.PI) * 1.2;
        } else {
          // Bounce back off the door, then fall and settle on the ground.
          const tb = t - flight;
          const vx = (random(`bv${k}`) - 0.5) * 0.05;
          const vz = 0.06 + random(`bz${k}`) * 0.03;
          const vy = 0.09;
          const y = to.y + vy * tb - (GRAVITY / 2) * tb * tb;
          p = new THREE.Vector3(to.x + vx * tb, Math.max(0.04, y), to.z + vz * Math.min(tb, 34));
        }
        const spin = frame * 0.32 + k;
        const landed = p.y <= 0.041;
        return (
          <Toon
            key={k}
            geometry={coin}
            color={COLORS.gold}
            emissive={COLORS.goldDeep}
            emissiveIntensity={0.15}
            outline={0.06}
            position={[p.x, p.y, p.z]}
            rotation={landed ? [Math.PI / 2, 0, k] : [spin * 0.4, spin, 0]}
          />
        );
      })}
    </group>
  );
};

// A steady stream of coins arcing in through the open door.
export const IncomingCoins: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const coin = useCoin(0.22);
  const t = frame - start;
  if (t < 0) {
    return null;
  }
  const count = 14;
  return (
    <group>
      {Array.from({ length: count }, (_, k) => {
        // Each coin starts a little after the previous one, then loops.
        const local = t * 0.022 - k / count;
        if (local < 0) {
          return null;
        }
        const u = local % 1;
        const a = new THREE.Vector3(3.6 + random(`ic${k}`) * 1.5, 5.2 + random(`iy${k}`), 3.8);
        const c = new THREE.Vector3(1.4, 3.6, 3.4);
        const b = new THREE.Vector3(DOOR_CENTER[0], FLOOR_Y + 0.7, FRONT_Z - 0.3);
        const p = a.clone().multiplyScalar((1 - u) * (1 - u)).add(c.clone().multiplyScalar(2 * u * (1 - u))).add(b.clone().multiplyScalar(u * u));
        const s = u > 0.85 ? (1 - u) / 0.15 : Math.min(1, u * 8);
        return (
          <Toon
            key={k}
            geometry={coin}
            color={COLORS.gold}
            emissive={COLORS.goldLight}
            emissiveIntensity={0.25}
            outline={0.06}
            position={[p.x, p.y, p.z]}
            rotation={[frame * 0.2 + k, frame * 0.27 + k, 0]}
            scale={s}
          />
        );
      })}
    </group>
  );
};

// Face of the luo pan, painted once on a canvas: rings, ticks, trigrams.
const useLuopanFace = () =>
  useMemo(() => {
    const size = 1024;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    if (!g) {
      return null;
    }
    const m = size / 2;
    const grad = g.createRadialGradient(m * 0.8, m * 0.7, 40, m, m, m);
    grad.addColorStop(0, COLORS.goldLight);
    grad.addColorStop(0.6, COLORS.gold);
    grad.addColorStop(1, COLORS.goldDeep);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    g.strokeStyle = COLORS.ink;
    g.lineCap = "round";
    const ring = (f: number, w: number) => {
      g.lineWidth = w;
      g.beginPath();
      g.arc(m, m, m * f, 0, Math.PI * 2);
      g.stroke();
    };
    [0.97, 0.84, 0.7, 0.56, 0.42, 0.3].forEach((f, i) => ring(f, i === 0 ? 12 : 6));
    // 72 fine ticks on the outer band.
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const long = i % 3 === 0;
      g.lineWidth = long ? 5 : 3;
      g.beginPath();
      g.moveTo(m + Math.cos(a) * m * 0.84, m + Math.sin(a) * m * 0.84);
      g.lineTo(m + Math.cos(a) * m * (long ? 0.95 : 0.9), m + Math.sin(a) * m * (long ? 0.95 : 0.9));
      g.stroke();
    }
    // 24 mountains: alternating red and ink blocks.
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + Math.PI / 24;
      g.save();
      g.translate(m + Math.cos(a) * m * 0.77, m + Math.sin(a) * m * 0.77);
      g.rotate(a + Math.PI / 2);
      g.fillStyle = i % 2 === 0 ? COLORS.seal : COLORS.ink;
      g.fillRect(-16, -16, 32, 32);
      g.restore();
    }
    // 8 trigrams: three bars each, broken (yin) or whole (yang).
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      g.save();
      g.translate(m + Math.cos(a) * m * 0.63, m + Math.sin(a) * m * 0.63);
      g.rotate(a + Math.PI / 2);
      g.fillStyle = COLORS.ink;
      for (let b = 0; b < 3; b++) {
        const y = -24 + b * 22;
        if ((k >> b) & 1) {
          g.fillRect(-46, y, 92, 13);
        } else {
          g.fillRect(-46, y, 38, 13);
          g.fillRect(8, y, 38, 13);
        }
      }
      g.restore();
    }
    // 16 dots, then the red heaven pool.
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.fillStyle = i % 4 === 0 ? COLORS.seal : COLORS.ink;
      g.beginPath();
      g.arc(m + Math.cos(a) * m * 0.49, m + Math.sin(a) * m * 0.49, 11, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = COLORS.seal;
    g.beginPath();
    g.arc(m, m, m * 0.3, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = COLORS.goldLight;
    g.lineWidth = 8;
    g.beginPath();
    g.arc(m, m, m * 0.24, 0, Math.PI * 2);
    g.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);

export const Luopan3D: React.FC<{
  appear: number;
  spin: number;
  needle: number;
  lockGlow: number;
}> = ({ appear, spin, needle, lockGlow }) => {
  const { radius: R, thickness: T } = LUOPAN_3D;
  const face = useLuopanFace();
  const disc = useCylinder(R, R * 1.02, T, 96);
  const rim = useMemo(() => new THREE.TorusGeometry(R * 1.02, 0.05, 12, 96), [R]);
  const halo = useMemo(() => new THREE.TorusGeometry(R * 1.12, 0.035, 8, 96), [R]);
  const needleHalf = useBox(0.07, 0.035, R * 0.78);
  const cap = useCylinder(0.09, 0.09, 0.06, 24);
  if (appear <= 0.001) {
    return null;
  }
  const [px, py, pz] = LUOPAN_3D.position;
  return (
    <group position={[px, py - (1 - appear) * 1.6, pz]} scale={Math.max(0.001, appear)}>
      <group rotation={[LUOPAN_3D.tilt, 0, 0]}>
        <group rotation={[0, spin, 0]}>
          <mesh geometry={disc}>
            <meshToonMaterial attach="material-0" color={COLORS.goldDeep} gradientMap={toonGradient()} />
            <meshBasicMaterial attach="material-1" map={face} toneMapped={false} />
            <meshToonMaterial attach="material-2" color={COLORS.goldDeep} gradientMap={toonGradient()} />
          </mesh>
          <mesh geometry={disc} scale={1.03}>
            <meshBasicMaterial color={COLORS.ink} side={THREE.BackSide} />
          </mesh>
          <mesh geometry={rim} rotation={[Math.PI / 2, 0, 0]} position={[0, T / 2, 0]}>
            <meshToonMaterial color={COLORS.gold} gradientMap={toonGradient()} />
          </mesh>
        </group>
        {/* Needle: red north half, ink south half. */}
        <group position={[0, T / 2 + 0.04, 0]} rotation={[0, needle, 0]}>
          <Toon geometry={needleHalf} color={COLORS.seal} emissive={COLORS.seal} emissiveIntensity={0.3} position={[0, 0, -R * 0.39]} outline={0.05} />
          <Toon geometry={needleHalf} color={COLORS.ink} position={[0, 0, R * 0.39]} />
          <Toon geometry={cap} color={COLORS.gold} position={[0, 0.03, 0]} outline={0.08} />
        </group>
        {lockGlow > 0 ? (
          <mesh geometry={halo} rotation={[Math.PI / 2, 0, 0]} position={[0, T / 2, 0]} scale={1 + (1 - lockGlow) * 0.25}>
            <meshBasicMaterial color={COLORS.goldLight} transparent opacity={lockGlow} toneMapped={false} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
};

// Gold beam rising from a freshly lit home (proof shot accent).
export const LightPillar: React.FC<{ strength: number }> = ({ strength }) => {
  const beam = useCylinder(0.5, 1.6, 9, 32);
  if (strength <= 0.001) {
    return null;
  }
  return (
    <mesh geometry={beam} position={[0, FLOOR_Y + 4.8, 0]}>
      <meshBasicMaterial
        color={COLORS.goldLight}
        transparent
        opacity={strength * 0.28}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
};

