import { Audio } from "@remotion/media";
import { random, Sequence, staticFile, useVideoConfig } from "remotion";
import { HEADLINE } from "../lib/brand";
import {
  SFX,
  SFX_MIX,
  TICK_EVERY_FRAMES,
  WHOOSH_PEAK_SECONDS,
  type SfxName,
} from "../lib/sfx";
import { cueFrame, type Beat } from "../lib/timeline";
import type { Scene } from "../schema";

type Hit = { name: SfxName; at: number; gain?: number };

// Every sound effect of the reel, each on the frame of the picture or text
// event it belongs to (the same cue frames the scenes use).
const hitsFor = (scenes: Scene[], beats: Beat[], fps: number): Hit[] => {
  const hits: Hit[] = [];
  const text = (f: number) => f - HEADLINE.leadFrames;
  scenes.forEach((scene, i) => {
    const beat = beats[i];
    const cue = (w: string) => cueFrame(beat, scene.vo, w);
    if (i > 0) {
      hits.push({
        name: "whoosh",
        at: beat.startFrame + Math.round(8 - WHOOSH_PEAK_SECONDS * fps),
      });
    }
    switch (scene.type) {
      case "hook":
        hits.push({ name: "gong", at: 0, gain: 0.8 });
        hits.push({ name: "thump", at: text(cue(scene.lines[0].cueWord)) });
        hits.push({ name: "pop", at: text(cue(scene.lines[1].cueWord)) });
        break;
      case "insight": {
        const lock = cue(scene.lockCueWord);
        for (
          let f = beat.startFrame + 6;
          f < lock - 2;
          f += TICK_EVERY_FRAMES
        ) {
          hits.push({
            name: "tick",
            at: f,
            gain: 0.7 + random(`tick${f}`) * 0.3,
          });
        }
        hits.push({ name: "lock", at: lock });
        hits.push({ name: "shimmer", at: lock + 3, gain: 0.7 });
        hits.push({ name: "pop", at: text(cue(scene.lines[0].cueWord)) });
        break;
      }
      case "bazi":
        hits.push({
          name: "gong",
          at: text(cue(scene.title.cueWord)),
          gain: 0.6,
        });
        scene.pillars.forEach((p, k) => {
          hits.push({
            name: `chime${k + 1}` as SfxName,
            at: cue(p.cueWord) - 1,
          });
        });
        break;
      case "fengshui":
        hits.push({ name: "shimmer", at: cue(scene.title.cueWord) });
        hits.push({ name: "stamp", at: cue(scene.stamp.cueWord) - 1 });
        break;
      case "proof": {
        const c = cue(scene.count.cueWord);
        for (let k = 0; k < 9; k++) {
          hits.push({
            name: "coin",
            at: c + 10 + k * 3 + Math.floor(random(`coin${k}`) * 3),
            gain: 0.6 + random(`cg${k}`) * 0.4,
          });
        }
        hits.push({ name: "shimmer", at: c + 22 });
        break;
      }
      case "pond": {
        // Water life: a few koi gulps scattered through the scene.
        for (let k = 0; k < 4; k++) {
          hits.push({
            name: "bubble",
            at: beat.startFrame + 10 + k * 17 + Math.floor(random(`bub${i}${k}`) * 8),
            gain: 0.6 + random(`bg${i}${k}`) * 0.4,
          });
        }
        if (i === 0) {
          hits.push({ name: "gong", at: 0, gain: 0.7 });
        }
        hits.push({ name: "pop", at: text(cue(scene.lines[0].cueWord)) });
        const last = scene.lines[scene.lines.length - 1];
        hits.push({ name: "thump", at: text(cue(last.cueWord)), gain: 0.7 });
        if (scene.flowCueWord) {
          const flow = cue(scene.flowCueWord);
          hits.push({ name: "whoosh", at: flow - 4, gain: 0.8 });
          hits.push({ name: "shimmer", at: flow + 6 });
        }
        break;
      }
      case "photo":
        hits.push({ name: "pop", at: text(cue(scene.lines[0].cueWord)) });
        hits.push({ name: "shimmer", at: cue(scene.energyCueWord) - 2 });
        hits.push({ name: "chime2", at: cue(scene.energyCueWord) + 14, gain: 0.7 });
        break;
      case "gallery":
        hits.push({ name: "pop", at: text(cue(scene.title.cueWord)) });
        scene.photos.forEach((p, k) => {
          hits.push({
            name: "stamp",
            at: cue(p.cueWord) - HEADLINE.leadFrames + 8,
            gain: 0.55,
          });
          hits.push({ name: `chime${k + 1}` as SfxName, at: cue(p.cueWord), gain: 0.5 });
        });
        break;
      case "stage3d": {
        const act = cue(scene.actionCueWord);
        hits.push({ name: "pop", at: text(cue(scene.lines[0].cueWord)) });
        if (i === 0) {
          hits.push({ name: "gong", at: 0, gain: 0.7 });
        }
        switch (scene.shot) {
          case "house-dim":
            // Coins hitting the closed door.
            for (let k = 0; k < 5; k++) {
              hits.push({ name: "coin", at: act + k * 3, gain: 0.7 });
            }
            hits.push({ name: "thump", at: act, gain: 0.8 });
            break;
          case "door":
            hits.push({ name: "gong", at: beat.startFrame + 8, gain: 0.5 });
            hits.push({ name: "shimmer", at: act - 2 });
            break;
          case "leak":
            hits.push({ name: "whoosh", at: act - 6, gain: 0.7 });
            hits.push({ name: "thump", at: act + 4, gain: 0.45 });
            break;
          case "luopan":
            for (
              let f = beat.startFrame + 6;
              f < act - 2;
              f += TICK_EVERY_FRAMES
            ) {
              hits.push({ name: "tick", at: f, gain: 0.6 + random(`t3${f}`) * 0.3 });
            }
            hits.push({ name: "lock", at: act });
            hits.push({ name: "shimmer", at: act + 3, gain: 0.7 });
            break;
          case "rearrange":
            for (let k = 0; k < 5; k++) {
              hits.push({ name: "stamp", at: act - 8 + k * 5 + 6, gain: 0.45 });
            }
            hits.push({ name: "shimmer", at: act + 18 });
            break;
          // SP04.
          case "window":
            // The thread snapping: a taut pluck, then a soft thud.
            hits.push({ name: "lock", at: act - 2, gain: 0.6 });
            hits.push({ name: "thump", at: act + 6, gain: 0.4 });
            break;
          case "peach":
            hits.push({ name: "shimmer", at: act - 4 });
            hits.push({ name: "chime1", at: act + 2, gain: 0.6 });
            break;
          case "bedroom":
            hits.push({ name: "thump", at: act, gain: 0.35 });
            break;
          case "tidy":
            for (let k = 0; k < 4; k++) {
              hits.push({ name: `chime${k + 1}` as SfxName, at: act - 6 + k * 6, gain: 0.55 });
            }
            hits.push({ name: "shimmer", at: act + 20 });
            break;
        }
        break;
      }
      case "cta":
        hits.push({ name: "gong", at: beat.startFrame + 2, gain: 0.7 });
        hits.push({
          name: "pop",
          at: cue(scene.button.cueWord) - 3,
          gain: 1.2,
        });
        hits.push({ name: "chime3", at: text(cue(scene.tagline.cueWord)) });
        break;
    }
  });
  return hits.filter((h) => h.at >= 0);
};

export const ReelSfx: React.FC<{ scenes: Scene[]; beats: Beat[] }> = ({
  scenes,
  beats,
}) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {hitsFor(scenes, beats, fps).map((hit, i) => (
        <Sequence
          key={`${hit.name}-${hit.at}-${i}`}
          from={hit.at}
          layout="none"
          name={`SFX ${hit.name}`}
        >
          <Audio
            src={staticFile(SFX[hit.name])}
            volume={SFX_MIX[hit.name] * (hit.gain ?? 1)}
          />
        </Sequence>
      ))}
    </>
  );
};
