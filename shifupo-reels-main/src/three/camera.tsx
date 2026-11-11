import { useThree } from "@react-three/fiber";
import { interpolate } from "remotion";
import type * as THREE from "three";
import { drift, EASE, lerp } from "../lib/motion";
import type { Beat } from "../lib/timeline";

// Camera and timing helpers shared by every 3D world: each scene is a camera
// move (from -> to), and the camera eases from one move into the next around
// the scene boundary, so the reel never cuts.

export type Vec3 = [number, number, number];
export type Pose = { pos: Vec3; target: Vec3; fov: number };
export type Move = { from: Pose; to: Pose };

export const CAMERA = {
  // Ease window around each scene boundary (frames before, after).
  blendBefore: 10,
  blendAfter: 20,
  near: 0.05,
  far: 320,
} as const;

export const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  pos: mix(a.pos, b.pos, t),
  target: mix(a.target, b.target, t),
  fov: lerp(a.fov, b.fov, t),
});

// Where the camera is on frame f, given one move per beat.
export const poseOnTimeline = (moves: Move[], beats: Beat[], f: number): Pose => {
  const move = (i: number): Pose => {
    const { from, to } = moves[i];
    const b = beats[i];
    const p = EASE.inOut(Math.min(1, Math.max(0, (f - b.startFrame) / Math.max(1, b.endFrame - b.startFrame))));
    const pose = mixPose(from, to, p);
    // A breath of handheld drift keeps even slow moves alive.
    return { ...pose, pos: [pose.pos[0] + drift("camx", f, 0.012) * 0.04, pose.pos[1] + drift("camy", f, 0.012) * 0.03, pose.pos[2]] };
  };
  return blendOnTimeline(beats, f, move, mixPose);
};

// Any per-scene value, blended across scene boundaries like the camera.
export const blendOnTimeline = <T,>(
  beats: Beat[],
  f: number,
  valueOf: (i: number) => T,
  blend: (a: T, b: T, t: number) => T,
): T => {
  for (let k = 1; k < beats.length; k++) {
    const b = beats[k].startFrame;
    if (f >= b - CAMERA.blendBefore && f < b + CAMERA.blendAfter) {
      const t = EASE.inOut((f - (b - CAMERA.blendBefore)) / (CAMERA.blendBefore + CAMERA.blendAfter));
      return blend(valueOf(k - 1), valueOf(k), t);
    }
  }
  const i = beats.findIndex((b) => f < b.endFrame);
  return valueOf(i === -1 ? beats.length - 1 : i);
};

// Value along (frame, value) keys; frames are made strictly increasing and
// keys at Infinity (a scene that is not in the episode) are dropped.
export const keyed = (frame: number, keys: [number, number][]): number => {
  const sorted = keys.filter(([f]) => Number.isFinite(f)).sort((a, b) => a[0] - b[0]);
  if (sorted.length === 0) {
    return 0;
  }
  if (sorted.length === 1) {
    return sorted[0][1];
  }
  const fs: number[] = [];
  sorted.forEach(([f], i) => fs.push(i > 0 && f <= fs[i - 1] ? fs[i - 1] + 0.01 : f));
  return interpolate(frame, fs, sorted.map(([, v]) => v), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });
};

export const CameraRig: React.FC<{ pose: Pose }> = ({ pose }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...pose.pos);
  camera.fov = pose.fov;
  camera.near = CAMERA.near;
  camera.far = CAMERA.far;
  camera.updateProjectionMatrix();
  camera.lookAt(...pose.target);
  return null;
};
