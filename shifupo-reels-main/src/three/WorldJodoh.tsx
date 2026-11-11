import { ContactShadows, Environment } from "@react-three/drei";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, VIDEO } from "../lib/brand";
import { EASE, lerp, prog, springAt, SPRING } from "../lib/motion";
import { cueFrame, type Beat } from "../lib/timeline";
import type { Scene } from "../schema";
import { blendOnTimeline, CameraRig, keyed, poseOnTimeline, type Vec3 } from "./camera";
import { AssetGate } from "./gate";
import { House } from "./House";
import { BedroomItem, FallingPetals, PeachTree, RedThread, SectorGlow, ThreadArcs } from "./Jodoh";
import { Landscape, neighbourhoodHomes } from "./Landscape";
import { Birds, MovingCars, StreetLamps } from "./Life";
import { Realism } from "./material";
import { Luopan3D } from "./Props3D";
import { FilmGrade, HeadlineBackdrop, luopanState } from "./shared";
import { BEDROOM, CITY, FOG, JODOH_BACKDROP, JODOH_SHOTS, type BedroomKind, type JodohShot } from "./shots";

// SP04 world ("Benang Merah Jodoh"): the modern house at dusk, its ground
// floor a bedroom, a peach tree in the garden and the red thread of fate
// running from the bed out to the tree. Realistic look: PBR textures, an
// HDRI sky for reflections and ambient light, a low sun with soft shadows.

export const jodohShotOf = (scene: Scene): JodohShot => {
  switch (scene.type) {
    case "stage3d":
      return scene.shot as JodohShot;
    case "proof":
      return "city";
    case "cta":
      return "home";
    default:
      return "window";
  }
};

const SUN = { position: [-9, 6.5, 4] as Vec3, intensity: 2.6, shadowSize: 14 } as const;
const ARC_TARGETS = 14;

export const WorldJodoh: React.FC<{ scenes: Scene[]; beats: Beat[] }> = ({ scenes, beats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shots = scenes.map(jodohShotOf);
  const at = (shot: JodohShot) => shots.indexOf(shot);
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

  const pose = poseOnTimeline(shots.map((s) => JODOH_SHOTS[s]), beats, frame);
  const backdropDark = blendOnTimeline(beats, frame, (i) => (JODOH_BACKDROP[shots[i]] === "dark" ? 1 : 0), lerp);

  const hook = at("window");
  const peach = at("peach");
  const bed = at("bedroom");
  const lp = at("luopan");
  const tidy = at("tidy");
  const city = at("city");

  // The room: dim and cluttered until it is arranged, then warm.
  const light = keyed(frame, [
    [0, 0.1],
    [action(tidy), 0.1],
    [action(tidy) + 26, 1],
  ]);
  const arrange = BEDROOM.map((_, k) => (tidy >= 0 ? springAt(frame, action(tidy) - 12 + k * 2, fps, SPRING.pop) : 0));
  const lift = tidy >= 0 ? springAt(frame, startOf(tidy) + 2, fps, SPRING.heavy) * (1 - prog(frame, endOf(tidy) - 4, endOf(tidy) + 20, EASE.inOut)) : 0;

  // The thread snaps on the hook's cue, is mended (and glows) on the tidy cue.
  const snap = prog(frame, action(hook) - 2, action(hook) + 16, EASE.out);
  const mend = springAt(frame, action(tidy), fps, SPRING.soft);
  const broken = snap * (1 - mend);
  const threadGlow = Math.max(prog(frame, action(tidy), action(tidy) + 20), 0);

  // Peach tree: sparse at first, bare and shivering when the sector is
  // named, wilting while the room is a mess, blooming once it is arranged.
  const bloom = keyed(frame, [
    [0, 0.35],
    [startOf(peach), 0.35],
    [action(peach), 0.2],
    [action(tidy), 0.2],
    [action(tidy) + 34, 1],
  ]);
  const wilt = keyed(frame, [
    [0, 0],
    [startOf(bed), 0],
    [action(bed) + 10, 0.85],
    [action(tidy), 0.85],
    [action(tidy) + 20, 0],
  ]);
  const shake = prog(frame, action(peach) - 4, action(peach) + 4) * (1 - prog(frame, action(peach) + 10, action(peach) + 30));
  const sector = prog(frame, action(peach) - 6, action(peach) + 12) * (1 - prog(frame, endOf(tidy) - 10, endOf(tidy) + 10));

  const luopan = luopanState(frame, fps, startOf(lp), endOf(lp), action(lp));

  const proofScene = city >= 0 ? scenes[city] : undefined;
  const countAt = proofScene?.type === "proof" ? cue(city, proofScene.count.cueWord) : Infinity;
  const litRadius = lerp(CITY.litFrom, CITY.litTo, prog(frame, countAt - 4, countAt + 46, EASE.out));
  const arcs = prog(frame, countAt - 2, countAt + 50, EASE.out);
  const arcTargets: Vec3[] = neighbourhoodHomes()
    .slice()
    .sort((a, b) => a.d - b.d)
    .slice(0, ARC_TARGETS)
    .map((h) => [h.x, 2.1, h.z]);

  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(180deg, ${COLORS.duskTop} 0%, ${COLORS.duskMid} 38%, ${COLORS.duskBottom} 62%)` }}
    >
      <ThreeCanvas width={VIDEO.width} height={VIDEO.height} dpr={1.5} shadows>
        <Realism.Provider value>
          <AssetGate label="SP04 world">
            <CameraRig pose={pose} />
            <Environment files={staticFile("assets/3d/polyhaven/venice_sunset/sky.hdr")} environmentIntensity={0.85} />
            <fog attach="fog" args={[COLORS.duskBottom, FOG.near, FOG.far]} />
            <directionalLight
              position={SUN.position}
              intensity={SUN.intensity}
              color={COLORS.sun}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0004}
              shadow-normalBias={0.02}
              shadow-camera-left={-SUN.shadowSize}
              shadow-camera-right={SUN.shadowSize}
              shadow-camera-top={SUN.shadowSize}
              shadow-camera-bottom={-SUN.shadowSize}
              shadow-camera-near={1}
              shadow-camera-far={40}
            />
            <ambientLight intensity={0.12} />
            <pointLight position={[-0.6, 1.4, -0.3]} intensity={light * 5} distance={4.5} color={COLORS.goldLight} />
            {/* Cool evening light through the glass, so the dim, cluttered
                room still reads before it is arranged. */}
            <pointLight position={[0.2, 1.5, 1.2]} intensity={1.6 * (1 - light)} distance={4} color={COLORS.roomNight} />
            <Landscape litRadius={litRadius} light={light} details evening={0.8} />
            <House
              light={light}
              doorOpen={1}
              lift={lift}
              arrange={arrange}
              items={BEDROOM}
              renderItem={(kind, l) => <BedroomItem kind={kind as BedroomKind} light={l} />}
            />
            <PeachTree bloom={bloom} wilt={wilt} shake={shake} />
            <FallingPetals amount={Math.max(bloom - 0.3, wilt) } />
            <SectorGlow strength={sector} />
            <RedThread broken={broken} glow={threadGlow} camera={pose.pos} />
            {city >= 0 ? <ThreadArcs targets={arcTargets} progress={arcs} /> : null}
            <Luopan3D appear={luopan.appear} spin={luopan.spin} needle={luopan.needle} lockGlow={luopan.lockGlow} />
            <MovingCars lights={0.8} />
            <Birds />
            <StreetLamps glow={0.9} />
            {/* Recomputed every frame (no `frames` cap): frames render in
                parallel tabs, so a one-shot shadow would differ per tab. */}
            <ContactShadows position={[0, 0.115, 0]} opacity={0.45} scale={14} blur={2.4} far={2.5} resolution={512} />
          </AssetGate>
        </Realism.Provider>
      </ThreeCanvas>
      <FilmGrade warmth={0.1} vignette={0.3} />
      <HeadlineBackdrop dark={backdropDark} paper={COLORS.duskBottom} />
    </AbsoluteFill>
  );
};
