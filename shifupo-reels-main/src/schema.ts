import { z } from "zod";
import { cueMatches } from "./lib/cues";
import { normalizeWord, splitWords, terbilang } from "./lib/text";

// Episode content: every word on screen and in the voice over lives in
// data/episodes/<id>.json and is validated here (CLAUDE.md, hard rule 4).

const text = z.string().trim().min(1);
const cueWord = text;
const cued = z.object({ text, cueWord });
const vo = text;
const voHighlight = z.array(text).default([]);

const hook = z.object({
  type: z.literal("hook"),
  vo,
  voHighlight,
  lines: z.array(cued).length(2),
});

const insight = z.object({
  type: z.literal("insight"),
  vo,
  voHighlight,
  lines: z.array(cued.extend({ accent: text.optional() })).length(2),
  // The compass needle locks onto one direction on this word.
  lockCueWord: cueWord,
});

const bazi = z.object({
  type: z.literal("bazi"),
  vo,
  voHighlight,
  title: cued,
  subtitle: text,
  shifuCueWord: cueWord,
  pillars: z.array(z.object({ glyph: text, label: text, cueWord })).length(4),
});

const fengshui = z.object({
  type: z.literal("fengshui"),
  vo,
  voHighlight,
  title: cued,
  stamp: cued,
});

// A raster file under public/ (photos from the Shifu Po website, etc.).
// Rules for which photos may be used: docs/guides/09-ASET-WEBSITE-DAN-SCENE.md.
const assetPath = z
  .string()
  .regex(
    /^assets\/[\w\-/]+\.(jpg|jpeg|png|webp)$/,
    "must be a path under public/assets/ (jpg, png or webp)",
  );
const accentLine = cued.extend({ accent: text.optional() });

const proof = z.object({
  type: z.literal("proof"),
  vo,
  voHighlight,
  count: z.object({
    value: z.number().int().positive(),
    suffix: z.string(),
    label: text,
    cueWord,
  }),
  // "ink": flat koi on paper (SP01). "pond": realistic koi in a moon-gate
  // pond. "none": no 2D visual (the 3D world shows the proof).
  koi: z.enum(["ink", "pond", "none"]).default("ink"),
});

const cta = z.object({
  type: z.literal("cta"),
  vo,
  voHighlight,
  button: cued,
  tagline: cued.extend({ accent: text }),
  // Real photo of Shifu Po in an arch frame instead of the standing figure.
  photo: assetPath.optional(),
});

// Koi pond in a moon gate. "still": murky water, koi drift slowly.
// "flow": clear water; on flowCueWord the koi stream upward out of the gate.
const pond = z.object({
  type: z.literal("pond"),
  vo,
  voHighlight,
  mood: z.enum(["still", "flow"]),
  kicker: text.optional(),
  lines: z.array(accentLine).min(1).max(2),
  flowCueWord: cueWord.optional(),
});

// One website photo in an arch frame, slow push-in, gold energy ribbon.
const photo = z.object({
  type: z.literal("photo"),
  vo,
  voHighlight,
  src: assetPath,
  // Where the subject's face is, in % of the image (push-in centre).
  focus: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
  kicker: text,
  lines: z.array(accentLine).min(1).max(2),
  energyCueWord: cueWord,
});

// Three website photos dealt in as instant-photo cards, one per cue word.
const gallery = z.object({
  type: z.literal("gallery"),
  vo,
  voHighlight,
  title: accentLine,
  photos: z
    .array(
      z.object({
        src: assetPath,
        orientation: z.enum(["landscape", "portrait"]),
        cueWord,
      }),
    )
    .length(3),
});

// A scene of the continuous 3D world (episode `world: "3d"`): the camera
// eases to `shot`, and the shot's key action lands on actionCueWord.
// Shots and what they show: src/three/shots.ts, src/three/World3D.tsx.
const stage3d = z.object({
  type: z.literal("stage3d"),
  vo,
  voHighlight,
  // SP03 shots: house-dim, door, leak, luopan, rearrange.
  // SP04 shots: window, peach, bedroom, luopan, tidy.
  shot: z.enum(["house-dim", "door", "leak", "luopan", "rearrange", "window", "peach", "bedroom", "tidy"]),
  kicker: text.optional(),
  lines: z.array(accentLine).min(1).max(2),
  actionCueWord: cueWord,
  // Shifu Po (cut-out photo) steps in on this word.
  shifuCueWord: cueWord.optional(),
});

export const sceneSchema = z.discriminatedUnion("type", [
  hook,
  insight,
  bazi,
  fengshui,
  proof,
  cta,
  pond,
  photo,
  gallery,
  stage3d,
]);
export type Scene = z.infer<typeof sceneSchema>;
export type SceneOf<T extends Scene["type"]> = Extract<Scene, { type: T }>;

// Episode structure (docs/guides/09-ASET-WEBSITE-DAN-SCENE.md): any scene
// order, as long as it opens with a hook-type scene, ends with exactly one
// CTA, and keeps a reel-sized number of scenes.
export const EPISODE_RULES = {
  openers: ["hook", "pond", "stage3d"] as Scene["type"][],
  minScenes: 4,
  maxScenes: 7,
} as const;

// Every cue word of a scene, in the order they are spoken.
export const sceneCues = (scene: Scene): string[] => {
  switch (scene.type) {
    case "hook":
      return scene.lines.map((l) => l.cueWord);
    case "insight":
      return [...scene.lines.map((l) => l.cueWord), scene.lockCueWord];
    case "bazi":
      return [
        scene.title.cueWord,
        scene.shifuCueWord,
        ...scene.pillars.map((p) => p.cueWord),
      ];
    case "fengshui":
      return [scene.title.cueWord, scene.stamp.cueWord];
    case "proof":
      return [scene.count.cueWord];
    case "cta":
      return [scene.button.cueWord, scene.tagline.cueWord];
    case "pond":
      return [
        ...scene.lines.map((l) => l.cueWord),
        ...(scene.flowCueWord ? [scene.flowCueWord] : []),
      ];
    case "photo":
      return [...scene.lines.map((l) => l.cueWord), scene.energyCueWord];
    case "gallery":
      return [scene.title.cueWord, ...scene.photos.map((p) => p.cueWord)];
    case "stage3d":
      return [
        ...scene.lines.map((l) => l.cueWord),
        scene.actionCueWord,
        ...(scene.shifuCueWord ? [scene.shifuCueWord] : []),
      ];
  }
};

// Words of `vo` starting at the cue spell `value` ("tiga ribu" = 3000).
const spokenNumberMatches = (sceneVo: string, cue: string, value: number) => {
  const words = splitWords(sceneVo).map(normalizeWord);
  const start = words.indexOf(normalizeWord(cue));
  const spoken = splitWords(terbilang(value));
  return spoken.every((w, i) => words[start + i] === w);
};

const checkEpisode = (episode: { scenes: Scene[] }, ctx: z.RefinementCtx) => {
  const types = episode.scenes.map((s) => s.type);
  const { openers, minScenes, maxScenes } = EPISODE_RULES;
  if (types.length < minScenes || types.length > maxScenes) {
    ctx.addIssue({
      code: "custom",
      message: `an episode has ${minScenes} to ${maxScenes} scenes (found ${types.length})`,
    });
  }
  if (types.length > 0 && !openers.includes(types[0])) {
    ctx.addIssue({
      code: "custom",
      message: `the first scene must be one of: ${openers.join(", ")}`,
    });
  }
  if (
    types[types.length - 1] !== "cta" ||
    types.filter((t) => t === "cta").length !== 1
  ) {
    ctx.addIssue({
      code: "custom",
      message: "the last scene, and only the last scene, must be the cta",
    });
  }
  episode.scenes.forEach((scene, i) => {
    for (const cue of sceneCues(scene)) {
      const n = cueMatches(scene.vo, cue).length;
      if (n !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i],
          message: `cue "${cue}" must appear exactly once in "${scene.vo}" (found ${n})`,
        });
      }
    }
    const voNorm = splitWords(scene.vo).map(normalizeWord).join(" ");
    for (const phrase of scene.voHighlight) {
      const p = splitWords(phrase).map(normalizeWord).join(" ");
      if (!voNorm.includes(p)) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i, "voHighlight"],
          message: `highlight "${phrase}" is not spoken in "${scene.vo}"`,
        });
      }
    }
    if (
      scene.type === "proof" &&
      !spokenNumberMatches(scene.vo, scene.count.cueWord, scene.count.value)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["scenes", i, "count"],
        message: `the VO must say "${terbilang(scene.count.value)}" starting at "${scene.count.cueWord}"`,
      });
    }
  });
};

export const episodeBase = z.object({
  id: z.string().regex(/^sp\d{2,}$/),
  title: text,
  brand: z.object({
    name: text,
    descriptor: text,
    sealGlyph: text,
    handle: z.string().nullable(),
    // Official logo file; the CTA shows it instead of the drawn seal plate.
    logo: assetPath.optional(),
  }),
  claims: z.array(z.object({ text, reviewed: z.boolean() })),
  // "ink": 2D paper world (SP01, SP02). "3d": one continuous 3D world.
  world: z.enum(["ink", "3d"]).default("ink"),
  // Which 3D world: SP03's house of wealth or SP04's house of love.
  set: z.enum(["rezeki", "jodoh"]).default("rezeki"),
  scenes: z.array(sceneSchema),
});

export const episodeSchema = episodeBase.superRefine(checkEpisode);
export type Episode = z.infer<typeof episodeSchema>;

const wordTiming = z.object({
  text: z.string(),
  startFrame: z.number().int(),
  endFrame: z.number().int(),
});

export const beatSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
  voStartFrame: z.number().int().nonnegative(),
  voDurationInFrames: z.number().int().positive(),
  voSrc: z.string().optional(),
  voGain: z.number().positive().optional(),
  words: z.array(wordTiming),
});

export const reelPropsSchema = episodeBase
  .extend({
    // Shows the safe area overlay in the Studio.
    debug: z.boolean(),
    // Filled in by calculateMetadata; never written by hand.
    beats: z.array(beatSchema).optional(),
  })
  .superRefine(checkEpisode);
export type ReelProps = z.infer<typeof reelPropsSchema>;
