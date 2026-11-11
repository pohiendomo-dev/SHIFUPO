import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { Move, Vec3 } from "../src/three/camera";
import {
  BEDROOM,
  DOOR_CENTER,
  FALLEN_LENGTH,
  FLOOR_Y,
  FOOTPRINT,
  FRONT_Z,
  HOUSE,
  JODOH_SHOTS,
  LOT_HALF,
  LUOPAN_3D,
  PEACH,
  PEACH_TRUNK,
  SHOTS,
  THREAD,
  YARD,
  type Shot,
  type BedroomKind,
  type JodohShot,
  type Place,
} from "../src/three/shots";

// Quality gates for the 3D worlds (docs/UPGRADE-3D.md, section 4): nothing
// interpenetrates, nothing leaves its room, the thread only passes through
// the doorway, and every shot keeps its subject on screen.

type Rect = { cx: number; cz: number; w: number; d: number; rot: number; label: string };

const TOL = 0.01;
const ROOM = {
  x: HOUSE.ground.width / 2 - HOUSE.wall - 0.01,
  z: HOUSE.ground.depth / 2 - HOUSE.wall - 0.01,
};
// The open door leaf (fully open in SP04) lies along x just inside the door.
const DOOR_LEAF: Rect = {
  cx: HOUSE.door.x - HOUSE.door.width / 2 + HOUSE.door.pivot,
  cz: FRONT_Z - HOUSE.wall / 2 - (HOUSE.door.width - HOUSE.door.pivot) / 2,
  w: HOUSE.door.depth,
  d: HOUSE.door.width - HOUSE.door.pivot,
  rot: 0,
  label: "door leaf",
};

const footprint = (kind: BedroomKind, p: Place): Rect => {
  const [w, d] = FOOTPRINT[kind];
  const fallen = Math.abs(p.tilt ?? 0) > 0.5;
  const len = fallen ? (FALLEN_LENGTH[kind] ?? d) : d;
  // A knocked-over piece lies from its base along its local +z.
  const off = fallen ? len / 2 : 0;
  return {
    cx: p.x + Math.sin(p.rot) * off,
    cz: p.z + Math.cos(p.rot) * off,
    w,
    d: len,
    rot: p.rot,
    label: kind,
  };
};

const corners = (r: Rect) => {
  const c = Math.cos(r.rot);
  const s = Math.sin(r.rot);
  return [
    [-r.w / 2, -r.d / 2],
    [r.w / 2, -r.d / 2],
    [r.w / 2, r.d / 2],
    [-r.w / 2, r.d / 2],
  ].map(([x, z]) => [r.cx + x * c + z * s, r.cz - x * s + z * c]);
};

// Separating-axis test for two rotated rectangles, with a small tolerance.
const overlaps = (a: Rect, b: Rect) => {
  const ca = corners(a);
  const cb = corners(b);
  const axes = [a.rot, a.rot + Math.PI / 2, b.rot, b.rot + Math.PI / 2].map((t) => [Math.cos(t), -Math.sin(t)]);
  return axes.every(([ax, az]) => {
    const pa = ca.map(([x, z]) => x * ax + z * az);
    const pb = cb.map(([x, z]) => x * ax + z * az);
    return Math.min(...pa) < Math.max(...pb) - TOL && Math.min(...pb) < Math.max(...pa) - TOL;
  });
};

const floorPieces = (state: "messy" | "tidy") =>
  BEDROOM.filter((it) => (state === "messy" ? !it.appear : !it.gone))
    .map((it) => ({ kind: it.kind, place: it[state] }))
    .filter(({ kind, place }) => kind !== "rug" && kind !== "frame" && !(place.y && place.y > 0));

describe("SP04 bedroom layout", () => {
  for (const state of ["messy", "tidy"] as const) {
    it(`has no two pieces interpenetrating (${state})`, () => {
      const rects = [...floorPieces(state).map((p) => footprint(p.kind, p.place)), DOOR_LEAF];
      const clashes: string[] = [];
      rects.forEach((a, i) =>
        rects.slice(i + 1).forEach((b) => {
          if (overlaps(a, b)) {
            clashes.push(`${a.label} x ${b.label}`);
          }
        }),
      );
      expect(clashes).toEqual([]);
    });

    it(`keeps every piece inside the room (${state})`, () => {
      const outside = floorPieces(state)
        .map((p) => footprint(p.kind, p.place))
        .filter((r) => corners(r).some(([x, z]) => Math.abs(x) > ROOM.x || Math.abs(z) > ROOM.z))
        .map((r) => r.label);
      expect(outside).toEqual([]);
    });

    it(`puts lifted pieces on something that is there (${state})`, () => {
      const present = BEDROOM.filter((it) => (state === "messy" ? !it.appear : !it.gone));
      const lifted = present.filter((it) => (it[state].y ?? 0) > 0 && it.kind !== "frame");
      const unsupported = lifted
        .filter((it) => {
          const p = it[state];
          return !present.some((s) => {
            if (s === it || (s[state].y ?? 0) > 0 || !["bed", "nightstand", "dresser"].includes(s.kind)) {
              return false;
            }
            const r = footprint(s.kind, s[state]);
            return overlaps(r, { cx: p.x, cz: p.z, w: 0.05, d: 0.05, rot: 0, label: it.kind });
          });
        })
        .map((it) => it.kind);
      expect(unsupported).toEqual([]);
    });
  }
});

describe("front garden", () => {
  const pieces = [...YARD, PEACH_TRUNK].map((p) => ({ cx: p.x, cz: p.z, w: p.w, d: p.d, rot: p.rot ?? 0, label: p.label }));
  // Flat slabs that are meant to sit on or against each other.
  const allowed = new Set(["driveway|parked car", "parked car|driveway", "podium|steps", "steps|podium"]);

  it("has no two pieces overlapping", () => {
    const clashes: string[] = [];
    pieces.forEach((a, i) =>
      pieces.slice(i + 1).forEach((b) => {
        if (!allowed.has(`${a.label}|${b.label}`) && overlaps(a, b)) {
          clashes.push(`${a.label} x ${b.label}`);
        }
      }),
    );
    expect(clashes).toEqual([]);
  });

  it("keeps every piece on the plot", () => {
    const off = pieces.filter((r) => corners(r).some(([x, z]) => Math.abs(x) > LOT_HALF + 0.31 || Math.abs(z) > LOT_HALF + 0.31)).map((r) => r.label);
    expect(off).toEqual([]);
  });
});

describe("SP04 red thread", () => {
  const curve = new THREE.CatmullRomCurve3(THREAD.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const pts = curve.getSpacedPoints(400);

  it("leaves the house only through the doorway", () => {
    const bad = pts.filter((p, i) => {
      const q = pts[i + 1];
      if (!q) {
        return false;
      }
      const crosses = (p.z - FRONT_Z) * (q.z - FRONT_Z) <= 0;
      const doorL = HOUSE.door.x - HOUSE.door.width / 2;
      const doorR = HOUSE.door.x + HOUSE.door.width / 2;
      return crosses && !(p.x > doorL + 0.05 && p.x < doorR - 0.05 && p.y < FLOOR_Y + HOUSE.door.height - 0.05);
    });
    expect(bad.length).toBe(0);
  });

  it("never touches the open door leaf", () => {
    const hits = pts.filter((p) => overlaps(DOOR_LEAF, { cx: p.x, cz: p.z, w: 0.02, d: 0.02, rot: 0, label: "thread" }) && p.y < FLOOR_Y + HOUSE.door.height);
    expect(hits.length).toBe(0);
  });

  it("stays inside the room until the door and ends in the peach crown", () => {
    const inside = pts.filter((p) => p.z < FRONT_Z - 0.1);
    expect(inside.every((p) => Math.abs(p.x) < ROOM.x && p.z > -ROOM.z)).toBe(true);
    const end = pts[pts.length - 1];
    const [tx, , tz] = PEACH.position;
    expect(Math.hypot(end.x - tx, end.z - tz)).toBeLessThan(PEACH.crownRadius);
  });
});

describe("SP04 peach tree", () => {
  it("clears the door canopy", () => {
    const [x, , z] = PEACH.position;
    const crownY = 2.6;
    const canopy = new THREE.Box3(
      new THREE.Vector3(HOUSE.door.x - (HOUSE.door.width + 0.9) / 2, FLOOR_Y + HOUSE.door.height + 0.06, FRONT_Z - 0.02),
      new THREE.Vector3(HOUSE.door.x + (HOUSE.door.width + 0.9) / 2, FLOOR_Y + HOUSE.door.height + 0.14, FRONT_Z + 0.73),
    );
    const d = canopy.distanceToPoint(new THREE.Vector3(x, crownY, z));
    expect(d).toBeGreaterThan(PEACH.crownRadius);
  });
});

// Camera paths: no move and no blend between shots may pass through a wall,
// the glass or the upper floor; going in or out of the house happens only
// through the open front door.
const solids = (() => {
  const G = HOUSE.ground;
  const T = HOUSE.wall;
  const y0 = FLOOR_Y;
  const y1 = FLOOR_Y + G.height + HOUSE.slab;
  const fz = FRONT_Z;
  const doorL = HOUSE.door.x - HOUSE.door.width / 2;
  const doorR = HOUSE.door.x + HOUSE.door.width / 2;
  const doorTop = FLOOR_Y + HOUSE.door.height;
  const b = (x0: number, yA: number, z0: number, x1: number, yB: number, z1: number, label: string) => ({
    box: new THREE.Box3(new THREE.Vector3(x0, yA, z0), new THREE.Vector3(x1, yB, z1)),
    label,
  });
  const U = HOUSE.upper;
  return [
    b(-G.width / 2, y0, fz - T, doorL, y1, fz, "front wall / glass (left of door)"),
    b(doorR, y0, fz - T, G.width / 2, y1, fz, "front wall (right of door)"),
    b(doorL, doorTop, fz - T, doorR, y1, fz, "wall above door"),
    b(-G.width / 2, y0, -fz, G.width / 2, y1, -fz + T, "back wall / window"),
    b(-G.width / 2, y0, -fz, -G.width / 2 + T, y1, fz, "left wall"),
    b(G.width / 2 - T, y0, -fz, G.width / 2, y1, fz, "right wall"),
    b(-G.width / 2, y1 - HOUSE.slab, -fz, G.width / 2, y1, fz, "ceiling slab"),
    b(U.x - U.width / 2, y1, U.z - U.depth / 2, U.x + U.width / 2, y1 + U.height + HOUSE.slab, U.z + U.depth / 2, "upper floor"),
  ];
})();
// The near plane sits this far in front of the camera.
const NEAR_MARGIN = 0.06;

const pathClashes = (a: Vec3, b: Vec3, label: string) => {
  const out: string[] = [];
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const steps = Math.ceil(A.distanceTo(B) / 0.02);
  for (let i = 0; i <= steps; i++) {
    const p = A.clone().lerp(B, i / steps);
    for (const s of solids) {
      if (s.box.clone().expandByScalar(NEAR_MARGIN).containsPoint(p)) {
        out.push(`${label} hits ${s.label}`);
        return out;
      }
    }
  }
  return out;
};

const checkSequence = (moves: Move[]) => {
  const clashes: string[] = [];
  moves.forEach((m, i) => {
    clashes.push(...pathClashes(m.from.pos, m.to.pos, `shot ${i + 1} move`));
    const next = moves[i + 1];
    if (next) {
      clashes.push(...pathClashes(m.to.pos, next.from.pos, `blend ${i + 1}->${i + 2}`));
    }
  });
  return clashes;
};

describe("camera paths", () => {
  it("SP04: never passes through walls, glass or the upper floor", () => {
    const order: JodohShot[] = ["window", "peach", "bedroom", "luopan", "tidy", "city", "home"];
    expect(checkSequence(order.map((s) => JODOH_SHOTS[s]))).toEqual([]);
  });

  it("SP03: never passes through walls, glass or the upper floor", () => {
    const order: Shot[] = ["house-dim", "door", "leak", "luopan", "rearrange", "city", "home"];
    expect(checkSequence(order.map((s) => SHOTS[s]))).toEqual([]);
  });
});

// Points each shot is about, which must stay on screen through the move.
const SUBJECTS: Partial<Record<JodohShot, Vec3[]>> = {
  window: [DOOR_CENTER, [PEACH.position[0], 2.2, PEACH.position[2]]],
  // The crown and the sector glowing on the lawn in front of it.
  peach: [
    [PEACH.position[0], 2.0, PEACH.position[2]],
    // Middle of the sector ring (it opens towards +x, see PEACH.sector).
    [PEACH.position[0] + 0.95, 0.12, PEACH.position[2] - 0.2],
  ],
  bedroom: [[-0.75, 0.6, -0.55]],
  luopan: [LUOPAN_3D.position],
  tidy: [[0, 0.6, 0]],
  home: [[0, 1.4, 0]],
};

const project = (move: Move, t: number, p: Vec3) => {
  const pose = {
    pos: move.from.pos.map((v, i) => v + (move.to.pos[i] - v) * t) as Vec3,
    target: move.from.target.map((v, i) => v + (move.to.target[i] - v) * t) as Vec3,
    fov: move.from.fov + (move.to.fov - move.from.fov) * t,
  };
  const cam = new THREE.PerspectiveCamera(pose.fov, 1080 / 1920, 0.05, 300);
  cam.position.set(...pose.pos);
  cam.lookAt(...pose.target);
  cam.updateMatrixWorld();
  return new THREE.Vector3(...p).project(cam);
};

describe("SP04 framing", () => {
  for (const [shot, points] of Object.entries(SUBJECTS) as [JodohShot, Vec3[]][]) {
    it(`keeps the ${shot} subject on screen, clear of headline and captions`, () => {
      for (const t of [0, 0.5, 1]) {
        for (const p of points) {
          const n = project(JODOH_SHOTS[shot], t, p);
          expect(Math.abs(n.x), `${shot} t=${t} x`).toBeLessThan(0.82);
          expect(n.y, `${shot} t=${t} y`).toBeLessThan(0.3);
          expect(n.y, `${shot} t=${t} y`).toBeGreaterThan(-0.5);
          expect(n.z, `${shot} t=${t} behind camera`).toBeLessThan(1);
        }
      }
    });
  }
});
