// Cuts the background out of photos, locally (no upload).
//   node cut.mjs <outDir> <image> [<image> ...]
import { removeBackground } from "@imgly/background-removal-node";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [outDir, ...inputs] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
for (const input of inputs) {
  const blob = await removeBackground(pathToFileURL(path.resolve(input)).href, {
    model: "medium",
    output: { format: "image/png", quality: 1 },
  });
  const out = path.join(outDir, `${path.parse(input).name}.png`);
  writeFileSync(out, Buffer.from(await blob.arrayBuffer()));
  console.log(`cut ${input} -> ${out}`);
}
