import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  getRemotionEnvironment,
} from "remotion";
import { Bamboo, InkMountains, Paper, Petals } from "../components/Background";
import { InkSplash, inkBlotClip } from "../components/Fx";
import { Caption } from "../components/Text";
import { COLORS, INK_WIPE, SAFE_AREA, STAGE } from "../lib/brand";
import { MIX } from "../lib/mix";
import { cueFrame, type Beat } from "../lib/timeline";
import type { ReelProps, Scene } from "../schema";
import {
  BaziScene,
  CtaScene,
  FengshuiScene,
  GalleryScene,
  HookScene,
  InsightScene,
  PhotoScene,
  PondScene,
  ProofScene,
  Stage3DScene,
} from "../scenes/Scenes";
import { World3D } from "../three/World3D";
import { WorldJodoh } from "../three/WorldJodoh";
import { ReelSfx } from "../components/Sfx";

// Where each scene's ink wipe opens from: the point the eye is already on.
const WIPE_ORIGIN: Record<Scene["type"], { x: number; y: number }> = {
  hook: { x: STAGE.cx, y: STAGE.cy },
  insight: { x: STAGE.cx, y: STAGE.cy },
  bazi: { x: STAGE.cx, y: STAGE.cy },
  fengshui: { x: 380, y: 1100 },
  proof: { x: STAGE.cx, y: 900 },
  cta: { x: STAGE.cx, y: 560 },
  // Pond and photo scenes open from the top of the moon gate, where the
  // koi of the scene before leave the frame.
  pond: { x: STAGE.cx, y: 700 },
  photo: { x: STAGE.cx, y: 640 },
  gallery: { x: 860, y: 1180 },
  // 3D scenes never wipe; the camera move is the transition.
  stage3d: { x: STAGE.cx, y: STAGE.cy },
};

// How the background world sits under each scene type: camera lift of the
// mountains (px) and how strongly they show. The world eases between the
// values of consecutive scenes, whatever their order.
const WORLD_POSE: Record<Scene["type"], { lift: number; mountains: number }> = {
  hook: { lift: 0, mountains: 1 },
  insight: { lift: -40, mountains: 0.9 },
  bazi: { lift: 90, mountains: 0.85 },
  fengshui: { lift: 140, mountains: 0.45 },
  proof: { lift: 40, mountains: 0.8 },
  cta: { lift: 0, mountains: 1 },
  pond: { lift: 60, mountains: 0.75 },
  photo: { lift: 20, mountains: 0.85 },
  gallery: { lift: 120, mountains: 0.5 },
  stage3d: { lift: 0, mountains: 1 },
};

const SceneBody: React.FC<{
  scene: Scene;
  beat: Beat;
  brand: ReelProps["brand"];
  index: number;
}> = ({ scene, beat, brand, index }) => {
  const cue = (word: string) => cueFrame(beat, scene.vo, word);
  const common = { start: beat.startFrame, end: beat.endFrame, cue };
  switch (scene.type) {
    case "hook":
      return <HookScene scene={scene} {...common} />;
    case "insight":
      return <InsightScene scene={scene} {...common} />;
    case "bazi":
      return <BaziScene scene={scene} {...common} />;
    case "fengshui":
      return <FengshuiScene scene={scene} {...common} />;
    case "proof":
      return <ProofScene scene={scene} {...common} />;
    case "cta":
      return <CtaScene scene={scene} {...common} brand={brand} />;
    case "pond":
      return <PondScene scene={scene} {...common} index={index} />;
    case "photo":
      return <PhotoScene scene={scene} {...common} index={index} />;
    case "gallery":
      return <GalleryScene scene={scene} {...common} index={index} />;
    case "stage3d":
      return <Stage3DScene scene={scene} {...common} />;
  }
};

// The world behind every scene: paper, mountains, bamboo, petals. It never
// cuts, so the whole reel reads as one continuous move; scenes only nudge
// its camera (travel, lift) and how much of it shows.
const World: React.FC<{ beats: Beat[]; scenes: Scene[] }> = ({
  beats,
  scenes,
}) => {
  const frame = useCurrentFrame();
  const keys = beats.map((b) => b.startFrame);
  const poses = scenes.map((s) => WORLD_POSE[s.type]);
  const ease = (values: number[]) =>
    keys.length < 2
      ? values[0] ?? 0
      : interpolate(frame, keys, values, {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const lift = ease(poses.map((p) => p.lift));
  const mountains = ease(poses.map((p) => p.mountains));
  return (
    <>
      <Paper />
      <InkMountains parallax={frame * 1.2} lift={lift} opacity={mountains} />
      <Bamboo opacity={0.9} />
      <Petals />
    </>
  );
};

const SafeArea: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: SAFE_AREA.x,
      top: SAFE_AREA.y,
      width: SAFE_AREA.width,
      height: SAFE_AREA.height,
      outline: `4px dashed ${COLORS.seal}`,
    }}
  />
);

export const Reel: React.FC<ReelProps> = ({
  scenes,
  beats,
  brand,
  debug,
  world,
  set,
}) => {
  const frame = useCurrentFrame();
  if (!beats) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.paper }} />;
  }
  // In the 3D world the camera move is the transition: no ink wipes.
  const is3d = world === "3d";
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {is3d ? (
        set === "jodoh" ? (
          <WorldJodoh beats={beats} scenes={scenes} />
        ) : (
          <World3D beats={beats} scenes={scenes} />
        )
      ) : (
        <World beats={beats} scenes={scenes} />
      )}
      {scenes.map((scene, i) => {
        const beat = beats[i];
        const last = i === scenes.length - 1;
        const visibleUntil = last
          ? beat.endFrame
          : beat.endFrame + INK_WIPE.frames;
        if (frame < beat.startFrame || frame >= visibleUntil) {
          return null;
        }
        const origin = WIPE_ORIGIN[scene.type];
        const clip =
          i === 0 || is3d
            ? undefined
            : inkBlotClip(
                frame,
                beat.startFrame,
                origin.x,
                origin.y,
                // Repeated scene types get their own blot shape.
                scenes.findIndex((s) => s.type === scene.type) === i
                  ? `wipe-${scene.type}`
                  : `wipe-${scene.type}-${i}`,
              );
        const fadeOut = last
          ? 1
          : interpolate(frame, [beat.endFrame, visibleUntil], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
        return (
          <AbsoluteFill
            key={`${scene.type}-${i}`}
            style={{ clipPath: clip, opacity: fadeOut }}
          >
            <SceneBody scene={scene} beat={beat} brand={brand} index={i} />
          </AbsoluteFill>
        );
      })}
      {scenes.map((scene, i) =>
        i === 0 || is3d ? null : (
          <InkSplash
            key={`splash-${scene.type}-${i}`}
            cx={WIPE_ORIGIN[scene.type].x}
            cy={WIPE_ORIGIN[scene.type].y}
            start={beats[i].startFrame}
            seed={`splash-${scene.type}`}
          />
        ),
      )}
      {scenes.map((scene, i) => {
        const beat = beats[i];
        return (
          <Sequence
            key={`cap-${scene.type}-${i}`}
            from={beat.startFrame}
            durationInFrames={beat.endFrame - beat.startFrame}
            layout="none"
            name={`Caption ${i + 1} ${scene.type}`}
          >
            <Caption
              words={beat.words.map((w) => ({
                text: w.text,
                startFrame: w.startFrame - beat.startFrame,
                endFrame: w.endFrame - beat.startFrame,
              }))}
              highlight={scene.voHighlight}
            />
          </Sequence>
        );
      })}
      {beats.map((beat, i) =>
        beat.voSrc ? (
          <Sequence
            key={beat.voSrc}
            from={beat.voStartFrame}
            layout="none"
            name={`VO ${scenes[i].type}`}
          >
            <Audio
              src={staticFile(beat.voSrc)}
              volume={MIX.vo * (beat.voGain ?? 1)}
            />
          </Sequence>
        ) : null,
      )}
      <ReelSfx scenes={scenes} beats={beats} />
      {debug && getRemotionEnvironment().isStudio ? <SafeArea /> : null}
    </AbsoluteFill>
  );
};
