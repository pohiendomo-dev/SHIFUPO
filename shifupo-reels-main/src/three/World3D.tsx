import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, VIDEO } from "../lib/brand";
import { EASE, lerp, prog, springAt, SPRING } from "../lib/motion";
import { cueFrame, type Beat } from "../lib/timeline";
import type { Scene } from "../schema";
import { blendOnTimeline, CameraRig, keyed, poseOnTimeline } from "./camera";
import { House } from "./House";
import { Landscape } from "./Landscape";
import { BlockedCoins, IncomingCoins, LightPillar, Luopan3D } from "./Props3D";
import { QiStream } from "./Qi";
import { HeadlineBackdrop, luopanState } from "./shared";
import { CITY, FOG, INTERIOR, SHOT_BACKDROP, SHOTS, type Shot } from "./shots";

// SP03 world ("Pintu Rezeki"): one continuous 3D world under the whole reel.
// Scenes never cut: every scene is a camera move, and every change in the
// world (door, light, qi, luo pan, cutaway, map) is keyed to the cue words
// of the scene that talks about it.

export const shotOf = (scene: Scene): Shot => {
  switch (scene.type) {
    case "stage3d":
      return scene.shot as Shot;
    case "proof":
      return "city";
    case "cta":
      return "home";
    default:
      return "house-dim";
  }
};

export const World3D: React.FC<{ scenes: Scene[]; beats: Beat[] }> = ({ scenes, beats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shots = scenes.map(shotOf);
  const at = (shot: Shot) => shots.indexOf(shot);
  const startOf = (i: number) => (i >= 0 ? beats[i].startFrame : Infinity);
  const endOf = (i: number) => (i >= 0 ? beats[i].endFrame : Infinity);
  const cue = (i: number, word: string) => cueFrame(beats[i], scenes[i].vo, word);
  const action = (i: number) => {
    if (i < 0) {
      return Infinity;
    }
    const s = scenes[i];
    return s.type === "stage3d" ? cue(i, s.actionCueWord) : startOf(i);
  };

  const pose = poseOnTimeline(shots.map((s) => SHOTS[s]), beats, frame);
  const backdropDark = blendOnTimeline(beats, frame, (i) => (SHOT_BACKDROP[shots[i]] === "dark" ? 1 : 0), lerp);

  const hook = at("house-dim");
  const door = at("door");
  const leak = at("leak");
  const lp = at("luopan");
  const re = at("rearrange");
  const city = at("city");
  const home = at("home");

  // The door opens early in its scene so the camera can push through it.
  const doorOpen = door >= 0 ? springAt(frame, startOf(door) + 2, fps, SPRING.heavy) : home >= 0 ? 1 : 0;
  const light = keyed(frame, [
    [0, 0.1],
    [action(door), 0.1],
    [action(door) + 16, 0.22],
    [startOf(leak) + 4, 0.22],
    [action(leak) + 12, 0.04],
    [action(re), 0.04],
    [action(re) + 24, 1],
  ]);
  const mood = 0.8 + light * 0.35;
  const luopan = luopanState(frame, fps, startOf(lp), endOf(lp), action(lp));

  const lift = re >= 0 ? springAt(frame, startOf(re) + 2, fps, SPRING.heavy) * (1 - prog(frame, endOf(re) - 4, endOf(re) + 20, EASE.inOut)) : 0;
  const arrange = INTERIOR.map((_, k) => (re >= 0 ? springAt(frame, action(re) - 10 + k * 3, fps, SPRING.pop) : 0));

  const proofScene = city >= 0 ? scenes[city] : undefined;
  const countAt = proofScene?.type === "proof" ? cue(city, proofScene.count.cueWord) : Infinity;
  const litRadius = lerp(CITY.litFrom, CITY.litTo, prog(frame, countAt - 4, countAt + 46, EASE.out));
  const pillar = city >= 0 ? prog(frame, countAt - 6, countAt + 12) * (1 - prog(frame, endOf(city) - 8, endOf(city) + 12)) : 0;

  const qiEnter = 1 - prog(frame, startOf(leak), startOf(leak) + 14);
  const qiLeak = prog(frame, startOf(leak) + 2, startOf(leak) + 10) * (1 - prog(frame, startOf(lp) + 4, startOf(lp) + 20));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COLORS.skyTop} 0%, ${COLORS.skyBottom} 55%)` }}>
      <ThreeCanvas width={VIDEO.width} height={VIDEO.height} flat dpr={1.5}>
        <CameraRig pose={pose} />
        <fog attach="fog" args={[COLORS.skyBottom, FOG.near, FOG.far]} />
        <hemisphereLight args={[COLORS.skyTop, COLORS.goldDeep, 0.65 * mood]} />
        <directionalLight position={[-6, 10, 7]} intensity={2.3 * mood} color={COLORS.white} />
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 1.3, 0]} intensity={light * 6} distance={5} color={COLORS.goldLight} />
        <Landscape litRadius={litRadius} light={light} />
        <House light={light} doorOpen={doorOpen} lift={lift} arrange={arrange} />
        <LightPillar strength={pillar} />
        {door >= 0 ? <QiStream mode="enter" start={action(door) - 8} opacity={qiEnter} camera={pose.pos} /> : null}
        {leak >= 0 ? <QiStream mode="leak" start={startOf(leak) + 2} opacity={qiLeak} camera={pose.pos} /> : null}
        {re >= 0 ? <QiStream mode="flow" start={action(re) - 4} opacity={1} camera={pose.pos} /> : null}
        {hook >= 0 ? <BlockedCoins hitAt={action(hook)} until={endOf(hook) + 20} /> : null}
        {home >= 0 ? <IncomingCoins start={startOf(home) + 10} /> : null}
        <Luopan3D appear={luopan.appear} spin={luopan.spin} needle={luopan.needle} lockGlow={luopan.lockGlow} />
      </ThreeCanvas>
      <HeadlineBackdrop dark={backdropDark} />
    </AbsoluteFill>
  );
};
