import { useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../lib/brand";
import { PbrMaterial, useRealism, type Pbr } from "./material";

// Surface for every 3D object. Two looks from the same scene:
// - toon (default): three hard light steps plus an ink outline, like a bold
//   illustration (docs/guides/05-ASET-3D.md);
// - realistic (inside <Realism.Provider value>): PBR material, optionally
//   with a CC0 texture (`pbr`), casting and receiving soft shadows, no
//   outline (docs/UPGRADE-3D.md).

let gradientMap: THREE.DataTexture | null = null;

// 3x1 lookup: shadow, mid, light. NearestFilter keeps the steps hard.
export const toonGradient = (): THREE.DataTexture => {
  if (!gradientMap) {
    const data = new Uint8Array([
      96, 96, 96, 255, 178, 178, 178, 255, 255, 255, 255, 255,
    ]);
    gradientMap = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.generateMipmaps = false;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
};

type Vec3 = [number, number, number];

export const Toon: React.FC<{
  geometry: THREE.BufferGeometry;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  outline?: number;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number | Vec3;
  opacity?: number;
  // Texture for the realistic look (ignored in toon).
  pbr?: Pbr;
  // Surface finish for the realistic look without a texture.
  roughness?: number;
  metalness?: number;
}> = ({
  geometry,
  color,
  emissive = COLORS.ink,
  emissiveIntensity = 0,
  outline = 0,
  position,
  rotation,
  scale,
  opacity = 1,
  pbr,
  roughness = 0.7,
  metalness = 0,
}) => {
  const real = useRealism();
  if (real) {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        <mesh geometry={geometry} castShadow={opacity >= 1} receiveShadow>
          {pbr ? (
            <PbrMaterial pbr={pbr} color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} opacity={opacity} />
          ) : (
            <meshStandardMaterial
              color={color}
              roughness={roughness}
              metalness={metalness}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              transparent={opacity < 1}
              opacity={opacity}
            />
          )}
        </mesh>
      </group>
    );
  }
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry}>
        <meshToonMaterial
          color={color}
          gradientMap={toonGradient()}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      {outline > 0 ? (
        <mesh geometry={geometry} scale={1 + outline}>
          <meshBasicMaterial
            color={COLORS.ink}
            side={THREE.BackSide}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      ) : null}
    </group>
  );
};

// Shared primitive geometries, built once per component.
export const useBox = (w: number, h: number, d: number) =>
  useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);
export const useCylinder = (rt: number, rb: number, h: number, seg = 32) =>
  useMemo(() => new THREE.CylinderGeometry(rt, rb, h, seg), [rt, rb, h, seg]);
export const useCone = (r: number, h: number, seg = 4) =>
  useMemo(() => new THREE.ConeGeometry(r, h, seg), [r, h, seg]);
export const useSphere = (r: number, seg = 16) =>
  useMemo(() => new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)), [r, seg]);
