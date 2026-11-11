import { useTexture } from "@react-three/drei";
import { createContext, useContext, useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";

// Realistic (PBR) surfaces for the 3D world: CC0 Poly Haven textures from
// public/assets/3d/polyhaven (fetched by `npm run assets`). The same scene
// can still render in the flat toon look: `Realism` switches it.

export const Realism = createContext(false);
export const useRealism = () => useContext(Realism);

export type TexId =
  | "asphalt_02"
  | "concrete_floor_worn_001"
  | "white_plaster_02"
  | "laminate_floor_02"
  | "wood_planks"
  | "aerial_grass_rock"
  | "fabric_pattern_07";

// Which maps each texture has (fabric_pattern_07 ships without a diffuse).
const MAPS: Record<TexId, ("diff" | "nor" | "rough")[]> = {
  asphalt_02: ["diff", "nor", "rough"],
  concrete_floor_worn_001: ["diff", "nor", "rough"],
  white_plaster_02: ["diff", "nor", "rough"],
  laminate_floor_02: ["diff", "nor", "rough"],
  wood_planks: ["diff", "nor", "rough"],
  aerial_grass_rock: ["diff", "nor", "rough"],
  fabric_pattern_07: ["nor", "rough"],
};

const url = (id: TexId, map: string) => staticFile(`assets/3d/polyhaven/${id}/${map}.jpg`);

export type Pbr = { id: TexId; repeat: [number, number] };

// A standard material using the texture, tiled `repeat` times over the face
// and tinted with `color` (white keeps the photo colour).
export const PbrMaterial: React.FC<{
  pbr: Pbr;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
}> = ({ pbr, color, emissive, emissiveIntensity = 0, opacity = 1 }) => {
  const maps = MAPS[pbr.id];
  const loaded = useTexture(Object.fromEntries(maps.map((m) => [m, url(pbr.id, m)])) as Record<string, string>);
  const [rx, ry] = pbr.repeat;
  const tex = useMemo(() => {
    const out: { map?: THREE.Texture; normalMap?: THREE.Texture; roughnessMap?: THREE.Texture } = {};
    const prep = (t: THREE.Texture, srgb: boolean) => {
      const c = t.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(rx, ry);
      c.anisotropy = 8;
      c.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      c.needsUpdate = true;
      return c;
    };
    if (loaded.diff) out.map = prep(loaded.diff, true);
    if (loaded.nor) out.normalMap = prep(loaded.nor, false);
    if (loaded.rough) out.roughnessMap = prep(loaded.rough, false);
    return out;
  }, [loaded, rx, ry]);
  return (
    <meshStandardMaterial
      {...tex}
      color={color}
      roughness={tex.roughnessMap ? 1 : 0.8}
      metalness={0}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
};
