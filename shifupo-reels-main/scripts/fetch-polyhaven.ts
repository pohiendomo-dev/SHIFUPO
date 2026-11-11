// Downloads the CC0 assets the 3D world uses from Poly Haven
// (https://polyhaven.com, CC0: free for commercial use, no attribution
// required) into public/assets/3d/polyhaven/<id>/, with a README per asset.
// Re-running skips files that are already there.
//
//   npm run assets

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { PUBLIC_DIR, rel, runMain, ScriptError } from "./lib/common";

const API = "https://api.polyhaven.com/files";
const HEADERS = { "User-Agent": "shifupo-reels-asset-fetch" };
const RES = "1k";

export const POLYHAVEN = {
  hdri: ["kloofendal_48d_partly_cloudy_puresky", "venice_sunset"],
  textures: [
    "asphalt_02",
    "concrete_floor_worn_001",
    "white_plaster_02",
    "laminate_floor_02",
    "wood_planks",
    "aerial_grass_rock",
    "fabric_pattern_07",
  ],
  models: [
    "Sofa_01",
    "ArmChair_01",
    "coffee_table_round_01",
    "dining_chair_02",
    "potted_plant_04",
    "fern_02",
    "cardboard_box_01",
    "wooden_crate_01",
    "street_lamp_01",
    "lantern_chandelier_01",
    "fancy_picture_frame_01",
  ],
} as const;

const fileRef = z.object({ url: z.string().url(), size: z.number() });
const filesSchema = z.record(z.string(), z.any());

const OUT = path.join(PUBLIC_DIR, "assets", "3d", "polyhaven");

const download = async (url: string, dest: string) => {
  if (existsSync(dest)) {
    return 0;
  }
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new ScriptError(`${url}: ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  return buf.length;
};

const files = async (id: string) => {
  const res = await fetch(`${API}/${id}`, { headers: HEADERS });
  if (!res.ok) {
    throw new ScriptError(`Poly Haven asset "${id}" not found (${res.status})`);
  }
  return filesSchema.parse(await res.json());
};

const readme = (id: string, kind: string) =>
  [
    `# ${id}`,
    "",
    `- Kind: ${kind}, resolution ${RES}`,
    `- Source: https://polyhaven.com/a/${id}`,
    "- License: CC0 1.0 (public domain). Free for commercial use, no attribution required.",
    "- Fetched by `npm run assets` (scripts/fetch-polyhaven.ts).",
    "",
  ].join("\n");

const main = async () => {
  let bytes = 0;
  for (const id of POLYHAVEN.hdri) {
    const f = await files(id);
    const hdr = fileRef.parse(f.hdri?.[RES]?.hdr);
    bytes += await download(hdr.url, path.join(OUT, id, "sky.hdr"));
    writeFileSync(path.join(OUT, id, "README.md"), readme(id, "HDRI"));
    console.log(`  hdri     ${id}`);
  }
  for (const id of POLYHAVEN.textures) {
    const f = await files(id);
    const maps = { diff: f.Diffuse, nor: f.nor_gl, rough: f.Rough };
    for (const [name, m] of Object.entries(maps)) {
      // Some textures lack a map (e.g. no roughness); the material then
      // falls back to a constant value.
      const jpg = fileRef.safeParse(m?.[RES]?.jpg);
      if (!jpg.success) {
        console.log(`  (${id} has no ${name} map)`);
        continue;
      }
      bytes += await download(jpg.data.url, path.join(OUT, id, `${name}.jpg`));
    }
    writeFileSync(path.join(OUT, id, "README.md"), readme(id, "PBR texture (diffuse, normal GL, roughness)"));
    console.log(`  texture  ${id}`);
  }
  for (const id of POLYHAVEN.models) {
    const f = await files(id);
    const gltf = z
      .object({ url: z.string().url(), include: z.record(z.string(), fileRef).default({}) })
      .parse(f.gltf?.[RES]?.gltf);
    bytes += await download(gltf.url, path.join(OUT, id, "model.gltf"));
    for (const [relPath, inc] of Object.entries(gltf.include)) {
      bytes += await download(inc.url, path.join(OUT, id, relPath));
    }
    writeFileSync(path.join(OUT, id, "README.md"), readme(id, "glTF model"));
    console.log(`  model    ${id}`);
  }
  console.log(`\nDownloaded ${(bytes / 1024 / 1024).toFixed(1)} MB into ${rel(OUT)}`);
};

runMain(main);
