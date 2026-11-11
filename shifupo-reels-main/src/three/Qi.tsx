import { noise2D } from "@remotion/noise";
import { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { COLORS } from "../lib/brand";
import { clamp01, EASE } from "../lib/motion";
import { DOOR_CENTER, FLOOR_Y, FRONT_Z, HOUSE, QI, type Vec3 } from "./shots";

// Streams of qi: gold motes travelling along a 3D curve. A stream grows
// from its source when it starts, then keeps flowing.
//   enter: down the street, up the path and in through the front door
//   leak:  in through the door, a loop round the living room, out the back
//          window and away over the roof, greying as it goes
//   flow:  in through the door and through every corner, staying inside

export type QiMode = "enter" | "leak" | "flow";

const MID = FLOOR_Y + 0.8;
const DX = DOOR_CENTER[0];
const BW = HOUSE.backWindow;
const APPROACH: Vec3[] = [
  [-12, 2.6, 7.5],
  [-6, 1.6, 6.2],
  [-1.5, 1.2, 5.4],
  [DX + 0.2, 1.0, 3.6],
  [DX, MID, FRONT_Z + 0.5],
  [DX, MID, FRONT_Z - 0.3],
];

const PATHS: Record<QiMode, Vec3[]> = {
  enter: [...APPROACH, [0.3, MID, 0.3], [-0.6, MID, -0.4]],
  leak: [
    ...APPROACH,
    [0.2, MID, 0.6],
    [-0.9, MID + 0.1, 0.2],
    [-0.8, MID + 0.15, -0.9],
    [0.4, MID + 0.1, -0.6],
    [0.5, MID + 0.2, 0.3],
    [-0.2, MID + 0.25, 0.0],
    [BW.x, FLOOR_Y + BW.sill + BW.height / 2, -FRONT_Z + 0.1],
    [BW.x + 0.2, FLOOR_Y + BW.sill + BW.height / 2, -FRONT_Z - 0.8],
    [1.5, 3.4, -3.4],
    [3.5, 5.6, -5.2],
    [7, 7.6, -8],
  ],
  flow: [
    ...APPROACH,
    [0.2, MID, 0.7],
    [-1.4, MID, 0.9],
    [-1.6, MID + 0.05, -0.9],
    [-0.4, MID + 0.1, -1.2],
    [1.2, MID + 0.1, -1.1],
    [1.6, MID + 0.15, 0.5],
    [0.6, MID + 0.25, 1.0],
    [-0.6, MID + 0.35, 0.3],
    [0, MID + 0.6, -0.3],
    [0, MID + 0.9, 0],
  ],
};

export const QiStream: React.FC<{
  mode: QiMode;
  start: number;
  // 0..1 overall visibility (fades streams in and out between scenes).
  opacity: number;
  // Motes this close to the camera fade out instead of filling the frame.
  camera: Vec3;
}> = ({ mode, start, opacity, camera }) => {
  const frame = useCurrentFrame();
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(PATHS[mode].map((p) => new THREE.Vector3(...p)), false, "centripetal"),
    [mode],
  );
  const mote = useMemo(() => new THREE.SphereGeometry(QI.size, 10, 8), []);
  const halo = useMemo(() => new THREE.SphereGeometry(QI.size * QI.halo, 10, 8), []);
  const t = frame - start;
  if (t < 0 || opacity <= 0.001) {
    return null;
  }
  const head = EASE.out(clamp01(t / 34));
  const gold = new THREE.Color(COLORS.goldLight);
  const deep = new THREE.Color(COLORS.gold);
  const dead = new THREE.Color(COLORS.qiDead);
  return (
    <group>
      {Array.from({ length: QI.particles }, (_, i) => {
        const offset = i / QI.particles;
        const u = (offset + t * QI.speed * (0.85 + random(`qs${mode}${i}`) * 0.3)) % 1;
        if (u > head) {
          return null;
        }
        const p = curve.getPointAt(u);
        const j = 0.14 + u * 0.08;
        const x = p.x + noise2D(`qx${mode}${i}`, u * 4, frame * 0.02) * j;
        const y = p.y + noise2D(`qy${mode}${i}`, u * 4, frame * 0.02) * j;
        const z = p.z + noise2D(`qz${mode}${i}`, u * 4, frame * 0.02) * j;
        const greying = mode === "leak" ? clamp01((u - 0.66) / 0.2) : 0;
        const color = (i % 3 === 0 ? deep : gold).clone().lerp(dead, greying);
        const twinkle = 0.75 + Math.sin(frame * 0.3 + i * 1.7) * 0.25;
        const fadeEnds = Math.min(1, u * 12) * Math.min(1, (1 - u) * 10);
        const near = clamp01((Math.hypot(x - camera[0], y - camera[1], z - camera[2]) - QI.nearFade[0]) / (QI.nearFade[1] - QI.nearFade[0]));
        const a = opacity * fadeEnds * near * (1 - greying * 0.5);
        if (a <= 0.01) {
          return null;
        }
        const s = (0.7 + random(`qz${i}`) * 0.6) * twinkle;
        return (
          <group key={i} position={[x, y, z]} scale={s}>
            <mesh geometry={mote}>
              <meshBasicMaterial color={color} transparent opacity={a} toneMapped={false} />
            </mesh>
            <mesh geometry={halo}>
              <meshBasicMaterial color={color} transparent opacity={a * QI.haloOpacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
