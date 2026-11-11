// Layout of the 3D world (SP03, "Pintu Rezeki"), in scene units (about one
// metre each). A modern two-storey house stands at the origin, front door
// facing +z, on its own plot in a neighbourhood of streets and blocks.
// Every number the 3D components use lives here, not in JSX.

import type { Move, Pose, Vec3 } from "./camera";

export type { Pose, Vec3 };

export const HOUSE = {
  podium: { width: 5.0, height: 0.2, depth: 4.0 },
  // Ground floor volume.
  ground: { width: 4.4, depth: 3.4, height: 1.7 },
  // Upper floor volume, set back and shifted left (cantilevers right).
  upper: { width: 3.4, depth: 2.9, height: 1.45, x: -0.4, z: -0.35 },
  wall: 0.1,
  slab: 0.12,
  // Tall pivot door on the right of the front.
  // Pivot near the left edge so the open leaf lies flat against the side,
  // clear of the camera pushing through the doorway.
  door: { x: 0.95, width: 0.78, height: 1.5, depth: 0.07, pivot: 0.05 },
  // Picture window on the left of the front (x from, x to).
  glazing: { from: -2.1, to: 0.45, sill: 0.15, top: 1.55 },
  // Back window the qi escapes through.
  backWindow: { x: 0.4, width: 1.1, sill: 0.7, height: 0.8 },
  // Door swings this far (radians) into the house when open.
  doorSwing: 1.6,
  // How high the upper floor rises off for the cutaway.
  upperLift: 5.5,
} as const;

export const FLOOR_Y = HOUSE.podium.height;
export const FRONT_Z = HOUSE.ground.depth / 2;
export const DOOR_CENTER: Vec3 = [HOUSE.door.x, FLOOR_Y + 0.8, FRONT_Z];

// Interior: where each piece is in the cluttered house and once arranged.
// `tilt` knocks a piece over (radians about x), `gone` removes it when tidy.
export type ItemKind =
  | "sofa"
  | "coffee"
  | "rug"
  | "dining"
  | "chair"
  | "boxes"
  | "plant"
  | "tv"
  | "lamp";
// `y` lifts a piece (onto a bed or nightstand), `roll` tilts it in the wall
// plane (a crooked frame). `gone` removes it when tidy; `appear` is the
// reverse: absent in the cluttered room, placed when tidy.
export type Place = { x: number; z: number; rot: number; tilt?: number; y?: number; roll?: number };
export type InteriorItem<K extends string = string> = {
  kind: K;
  messy: Place;
  tidy: Place;
  gone?: boolean;
  appear?: boolean;
};
export const INTERIOR: InteriorItem<ItemKind>[] = [
  { kind: "rug", messy: { x: 0.4, z: 0.4, rot: 0.6 }, tidy: { x: -1.1, z: -0.3, rot: 0 } },
  { kind: "sofa", messy: { x: 0.55, z: 0.55, rot: 0.95 }, tidy: { x: -1.15, z: -1.05, rot: 0 } },
  { kind: "coffee", messy: { x: -0.15, z: 1.0, rot: 0.5 }, tidy: { x: -1.1, z: -0.2, rot: 0 } },
  { kind: "tv", messy: { x: -1.55, z: 0.35, rot: 1.1 }, tidy: { x: -1.1, z: 0.95, rot: Math.PI } },
  { kind: "dining", messy: { x: 0.75, z: -0.85, rot: 0.75 }, tidy: { x: 1.15, z: -0.75, rot: 0 } },
  { kind: "chair", messy: { x: 1.05, z: 1.2, rot: 0.4, tilt: 1.45 }, tidy: { x: 1.15, z: -0.12, rot: Math.PI } },
  { kind: "chair", messy: { x: -0.95, z: 0.95, rot: 2.2, tilt: -1.3 }, tidy: { x: 1.15, z: -1.38, rot: 0 } },
  { kind: "boxes", messy: { x: 1.45, z: 0.9, rot: 0.3 }, tidy: { x: 1.45, z: 0.9, rot: 0.3 }, gone: true },
  { kind: "boxes", messy: { x: 0.2, z: -1.15, rot: -0.4 }, tidy: { x: 0.2, z: -1.15, rot: -0.4 }, gone: true },
  { kind: "plant", messy: { x: 0.05, z: 1.3, rot: 0.2, tilt: 1.5 }, tidy: { x: -1.9, z: 1.3, rot: 0 } },
  { kind: "lamp", messy: { x: 1.6, z: -0.2, rot: 0, tilt: -1.4 }, tidy: { x: 1.8, z: 1.25, rot: 0 } },
];

export const LUOPAN_3D = {
  position: [0.2, 2.75, 3.3] as Vec3,
  radius: 1.0,
  thickness: 0.18,
  // Face (local +y) tilted up towards the camera, in radians about x.
  tilt: 1.25,
  // Where the needle locks (radians).
  lockAngle: 0.62,
} as const;

// Qi (energy) stream: particles per stream and how fast they travel.
export const QI = {
  particles: 130,
  speed: 0.0105,
  size: 0.06,
  // Fade motes from invisible at the first distance to full at the second.
  nearFade: [1.3, 2.8],
  // Glow halo around each mote, as size multiple and opacity.
  halo: 1.9,
  haloOpacity: 0.16,
} as const;

// Neighbourhood: a grid of blocks around the house plot, separated by
// streets. Block (0, 0) is the house; the blocks in front (+z) are a park,
// so the cameras stand in open space.
export const CITY = {
  pitch: 10,
  road: 1.7,
  blocks: 2,
  // Blocks (i, j) kept as park: no houses, just lawn and trees.
  park: [
    [-1, 1],
    [0, 1],
    [1, 1],
  ] as [number, number][],
  litFrom: 5,
  litTo: 30,
} as const;

// Camera: every shot is a move, from -> to across the scene, eased. The
// camera eases between one shot's end and the next shot's start (no cuts).
export type Shot =
  | "house-dim"
  | "door"
  | "leak"
  | "luopan"
  | "rearrange"
  | "city"
  | "home";

// fov is vertical; a 9:16 frame sees only ~56% of it horizontally.
export const SHOTS: Record<Shot, Move> = {
  // Low hero angle pushing in on the closed house.
  "house-dim": {
    from: { pos: [7.8, 0.75, 12.5], target: [0, 2.0, 0], fov: 50 },
    to: { pos: [4.0, 1.05, 8.6], target: [0.4, 1.7, 0.6], fov: 50 },
  },
  // Up the path to the door, then in through it: the dark, cluttered room.
  door: {
    // Ends just inside the doorway (it crosses the threshold at x ~1.1).
    from: { pos: [2.2, 1.35, 6.4], target: [0.95, 1.1, 1.7], fov: 50 },
    to: { pos: [1.0, 1.2, 1.15], target: [0.0, 0.75, -1.3], fov: 62 },
  },
  // Inside the living room, watching the qi circle and slip out the back.
  leak: {
    // A slow dolly across the room, ending by the door to step back out.
    from: { pos: [-1.85, 1.65, 1.45], target: [0.4, 0.75, -1.5], fov: 66 },
    to: { pos: [0.95, 1.45, 1.15], target: [0.4, 1.0, -1.65], fov: 62 },
  },
  // Back outside, wide on the facade with the luo pan floating in front.
  // Out through the door and pulling back as the luo pan rises.
  luopan: {
    from: { pos: [1.3, 1.9, 6.6], target: [0.3, 2.85, 3.0], fov: 52 },
    to: { pos: [2.6, 2.7, 9.2], target: [0.3, 2.6, 2.6], fov: 48 },
  },
  // Doll's-house view from above as the upper floor lifts away.
  rearrange: {
    from: { pos: [6.2, 8.4, 7.6], target: [0, 0.4, 0], fov: 46 },
    to: { pos: [3.2, 9.6, 5.0], target: [0, 0.4, -0.1], fov: 46 },
  },
  // Crane up: the neighbourhood map lights up block by block.
  city: {
    from: { pos: [5.5, 7.5, 13], target: [0, 1, 0], fov: 46 },
    to: { pos: [0, 34, 26], target: [0, 0, -4], fov: 46 },
  },
  // Sweeping arc down to the front: the house glowing, Shifu Po beside it.
  home: {
    from: { pos: [-7.5, 6.5, 15], target: [0.9, 2.4, 0], fov: 50 },
    to: { pos: [-3.0, 3.2, 12.4], target: [1.3, 2.7, 0], fov: 50 },
  },
};

// What sits behind the headline column in each shot. Outside, a paper haze
// over the sky; inside the house, a dark band with light text, so the
// interior stays moody and the text stays crisp.
export type Backdrop = "paper" | "dark";
export const SHOT_BACKDROP: Record<Shot, Backdrop> = {
  "house-dim": "paper",
  door: "dark",
  leak: "dark",
  luopan: "paper",
  rearrange: "paper",
  city: "paper",
  home: "paper",
};

export const FOG = { near: 30, far: 130 } as const;

// The house's front garden (plot lawn spans +-LOT_HALF on x and z). Every
// piece is a footprint so tests/layout3d.test.ts can prove nothing overlaps.
export const LOT_HALF = (CITY.pitch - CITY.road) / 2 - 0.3;
export type YardPiece = { label: string; x: number; z: number; w: number; d: number; rot?: number };
export const YARD: YardPiece[] = [
  { label: "podium", x: 0, z: 0, w: HOUSE.podium.width, d: HOUSE.podium.depth },
  { label: "steps", x: HOUSE.door.x, z: HOUSE.podium.depth / 2 + 0.4, w: 1.3, d: 0.8 },
  { label: "paver 1", x: HOUSE.door.x, z: 3.05, w: 0.9, d: 0.5 },
  { label: "paver 2", x: HOUSE.door.x + 0.1, z: 3.6, w: 0.9, d: 0.5 },
  { label: "driveway", x: -3.25, z: 2.15, w: 1.4, d: 4.0 },
  { label: "bollard 1", x: 1.75, z: 2.75, w: 0.12, d: 0.12 },
  { label: "bollard 2", x: 1.75, z: 3.3, w: 0.12, d: 0.12 },
  { label: "bollard 3", x: 1.75, z: 3.85, w: 0.12, d: 0.12 },
  // By the driveway, out of the street cameras' line to the door.
  { label: "mailbox", x: -2.3, z: 3.75, w: 0.22, d: 0.3 },
  { label: "flower bed", x: -1.0, z: 2.45, w: 2.3, d: 0.45 },
  { label: "back hedge", x: 0, z: -LOT_HALF, w: LOT_HALF * 2 - 0.2, d: 0.35 },
  { label: "side hedge", x: LOT_HALF, z: -0.5, w: 0.35, d: 6.0 },
  { label: "tree back left", x: -3.4, z: -2.8, w: 0.3, d: 0.3 },
  { label: "cypress", x: 3.0, z: -3.0, w: 0.84, d: 0.84 },
  { label: "tree right", x: 3.35, z: -0.6, w: 0.25, d: 0.25 },
  { label: "parked car", x: -3.25, z: 2.75, w: 0.86, d: 1.85 },
];
export const PEACH_TRUNK: YardPiece = { label: "peach trunk", x: 3.0, z: 3.0, w: 0.32, d: 0.32 };

// ---------------------------------------------------------------------------
// SP04 "Benang Merah Jodoh": the same house at dusk, its ground floor a
// bedroom, a peach-blossom tree in the front garden and the red thread of
// fate running from the bed, out of the open door, to the tree.

export type JodohShot = "window" | "peach" | "bedroom" | "luopan" | "tidy" | "city" | "home";

export const JODOH_SHOTS: Record<JodohShot, Move> = {
  // Low dusk angle from the street, pushing towards the door and the tree.
  window: {
    from: { pos: [6.8, 1.0, 12.5], target: [0.8, 2.0, 0.8], fov: 50 },
    to: { pos: [3.6, 1.35, 7.8], target: [1.6, 1.95, 1.9], fov: 50 },
  },
  // Down onto the peach tree and the gold sector glowing on the lawn.
  peach: {
    from: { pos: [7.6, 2.4, 9.2], target: [3.2, 1.15, 3.0], fov: 48 },
    to: { pos: [7.0, 2.6, 8.5], target: [3.2, 1.15, 3.0], fov: 48 },
  },
  // In through the open door: the dim, cluttered bedroom.
  bedroom: {
    from: { pos: [1.0, 1.4, 3.3], target: [-0.4, 0.6, -0.6], fov: 62 },
    to: { pos: [1.0, 1.55, 0.95], target: [-0.6, 0.5, -0.6], fov: 68 },
  },
  luopan: SHOTS.luopan,
  tidy: SHOTS.rearrange,
  city: SHOTS.city,
  home: SHOTS.home,
};

// Backdrop for any stage3d shot name (both worlds), for the text overlay.
export const backdropOf = (shot: string): Backdrop =>
  (SHOT_BACKDROP as Record<string, Backdrop>)[shot] ?? (JODOH_BACKDROP as Record<string, Backdrop>)[shot] ?? "paper";

export const JODOH_BACKDROP: Record<JodohShot, Backdrop> = {
  window: "paper",
  peach: "paper",
  bedroom: "dark",
  luopan: "paper",
  tidy: "paper",
  city: "paper",
  home: "paper",
};

export const PEACH = {
  position: [3.0, 0.1, 3.0] as Vec3,
  crownRadius: 1.1,
  blossoms: 420,
  // A young tree: about 2.6 m tall overall.
  trunk: { length: 0.72, radius: 0.085 },
  // Gold sector glowing on the lawn around the tree (radians, metres).
  sector: { inner: 0.55, outer: 1.45, start: -0.6, length: 1.6 },
} as const;

// Red thread of fate: bed head -> through the open door -> a peach branch.
// Routed clear of the open door leaf (x ~0.6, z 0.9..1.65) and the canopy.
export const THREAD: Vec3[] = [
  [-0.75, 0.82, -1.25],
  [-0.2, 0.95, -0.4],
  [0.75, 1.0, 0.75],
  [1.15, 1.05, 1.75],
  [1.9, 1.5, 2.35],
  [2.55, 2.05, 2.75],
];
// The thread snaps between these two points (indices into THREAD).
export const THREAD_BREAK = 2.6;

export type BedroomKind =
  | "bed"
  | "rug"
  | "nightstand"
  | "lamp"
  | "pillow"
  | "dresser"
  | "ducks"
  | "clothes"
  | "frame"
  | "box"
  | "crate"
  | "plant";

// Ground-floor bedroom. Pairs are the point: one lamp, one pillow, one
// frame when cluttered; two of each when arranged.
export const BEDROOM: InteriorItem<BedroomKind>[] = [
  { kind: "rug", messy: { x: 0.35, z: 0.55, rot: 0.6 }, tidy: { x: -0.75, z: 0.75, rot: 0 } },
  { kind: "bed", messy: { x: -0.75, z: -0.53, rot: 0 }, tidy: { x: -0.75, z: -0.53, rot: 0 } },
  { kind: "nightstand", messy: { x: -1.7, z: 1.05, rot: 0.5 }, tidy: { x: -1.82, z: -1.3, rot: 0 } },
  { kind: "nightstand", messy: { x: 0.33, z: -1.3, rot: 0 }, tidy: { x: 0.33, z: -1.3, rot: 0 }, appear: true },
  { kind: "lamp", messy: { x: -1.2, z: 1.15, rot: Math.PI - 0.3, tilt: 1.45 }, tidy: { x: -1.82, z: -1.3, rot: 0, y: 0.5 } },
  { kind: "lamp", messy: { x: 0.33, z: -1.3, rot: 0, y: 0.5 }, tidy: { x: 0.33, z: -1.3, rot: 0, y: 0.5 }, appear: true },
  { kind: "pillow", messy: { x: 0.55, z: 0.45, rot: 0.4 }, tidy: { x: -1.12, z: -1.25, rot: 0, y: 0.47 } },
  { kind: "pillow", messy: { x: -0.38, z: -1.25, rot: 0, y: 0.47 }, tidy: { x: -0.38, z: -1.25, rot: 0, y: 0.47 }, appear: true },
  { kind: "dresser", messy: { x: 1.35, z: 0.15, rot: -1.1 }, tidy: { x: 1.85, z: -0.6, rot: -Math.PI / 2 } },
  { kind: "ducks", messy: { x: 1.85, z: -0.6, rot: -Math.PI / 2, y: 0.8 }, tidy: { x: 1.85, z: -0.6, rot: -Math.PI / 2, y: 0.8 }, appear: true },
  { kind: "clothes", messy: { x: -0.55, z: 0.95, rot: 0.3 }, tidy: { x: -0.55, z: 0.95, rot: 0.3 }, gone: true },
  { kind: "box", messy: { x: 1.55, z: 1.15, rot: 0.3 }, tidy: { x: 1.55, z: 1.15, rot: 0.3 }, gone: true },
  { kind: "crate", messy: { x: 1.55, z: -1.2, rot: -0.3 }, tidy: { x: 1.55, z: -1.2, rot: -0.3 }, gone: true },
  { kind: "plant", messy: { x: 0.05, z: 1.4, rot: Math.PI, tilt: 1.45 }, tidy: { x: 1.8, z: 1.25, rot: 0 } },
  { kind: "frame", messy: { x: -1.05, z: -1.52, rot: 0, y: 1.0, roll: 0.22 }, tidy: { x: -1.15, z: -1.52, rot: 0, y: 1.05 } },
  { kind: "frame", messy: { x: -0.35, z: -1.52, rot: 0, y: 1.05 }, tidy: { x: -0.35, z: -1.52, rot: 0, y: 1.05 }, appear: true },
];

// Floor footprint (width x depth, metres) of each piece, for the collision
// test. Pieces lifted onto furniture (y > 0) and the rug are not checked
// against the floor pieces.
export const FOOTPRINT: Record<BedroomKind, [number, number]> = {
  bed: [1.6, 2.05],
  rug: [1.6, 1.1],
  nightstand: [0.45, 0.4],
  lamp: [0.26, 0.26],
  pillow: [0.6, 0.36],
  dresser: [0.95, 0.45],
  ducks: [0.4, 0.2],
  clothes: [0.55, 0.45],
  frame: [0.55, 0.06],
  box: [0.5, 0.45],
  crate: [0.55, 0.4],
  plant: [0.4, 0.4],
};
// A knocked-over piece lies along its depth axis this long.
export const FALLEN_LENGTH: Partial<Record<BedroomKind, number>> = { lamp: 0.55, plant: 0.6 };
