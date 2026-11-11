// Brand tokens for Shifu Po (from the shifupo-home-v2 website). Every color,
// font, size and safe zone used by the composition lives here.

import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadNotoSerifSC } from "@remotion/google-fonts/NotoSerifSC";

const jakarta = loadJakarta("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
});
const cinzel = loadCinzel("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});
const han = loadNotoSerifSC("normal", { weights: ["700", "900"] });

export const FONTS = {
  body: jakarta.fontFamily,
  display: cinzel.fontFamily,
  han: han.fontFamily,
} as const;

export const COLORS = {
  ink: "#12100E",
  inkSoft: "#2A2520",
  paper: "#F8F4EC",
  paperDeep: "#EFE7D8",
  line: "#E2D7C3",
  muted: "#6B6257",
  gold: "#C9A45C",
  goldDeep: "#9C7A35",
  goldLight: "#F1DDA8",
  seal: "#A8161D",
  sealDeep: "#7E0F15",
  blueprint: "#3F5F8F",
  jade: "#2E7D63",
  koiOrange: "#E0662B",
  white: "#FFFFFF",
  // Realistic koi and pond (SP02).
  koiCream: "#FBF6EC",
  koiRed: "#D2401C",
  koiInk: "#1B1714",
  koiGold: "#E8B44C",
  pondDeep: "#0E3B3A",
  pondMid: "#1F6B62",
  pondLight: "#5FB3A1",
  pondMurk: "#4A4A2E",
  lilyPad: "#3E7B3A",
  lilyPadLight: "#6FA85A",
  lotus: "#F3A6B8",
  lotusDeep: "#D9667F",
  stone: "#B9B0A2",
  // 3D world (SP03).
  wall: "#F4E8D0",
  wood: "#8A5A33",
  woodLight: "#B98450",
  stoneDark: "#7D7468",
  lawn: "#4F8A4A",
  pine: "#2F6B4F",
  mountainNear: "#5B5650",
  mountainMid: "#8D867B",
  mountainFar: "#BDB4A5",
  skyTop: "#F2DFB8",
  skyBottom: "#F8F1E4",
  qiDead: "#8F8A80",
  // Modern house and neighbourhood (SP03 v2).
  render: "#F5F1E8",
  charcoal: "#2B2A28",
  concrete: "#C9C2B6",
  slat: "#A86E3F",
  glass: "#2E3A3C",
  asphalt: "#4A4743",
  sidewalk: "#DCD3C4",
  treeCrown: "#3F7D4E",
  treeCrownLight: "#69A35F",
  rug: "#C6A27A",
  box: "#B88A57",
  // Dusk sky (SP04).
  duskTop: "#E9A37E",
  duskMid: "#F2C59C",
  duskBottom: "#F7E2C6",
  sun: "#FFC48A",
  bark: "#5A3B2A",
  roomNight: "#9DB4D6",
} as const;

export const GOLD_GRADIENT = [
  { offset: 0, color: COLORS.goldLight },
  { offset: 0.48, color: COLORS.gold },
  { offset: 1, color: COLORS.goldDeep },
] as const;

export const VIDEO = { width: 1080, height: 1920, fps: 30 } as const;

// Bands covered by the Instagram Reels interface. Text never enters them.
export const SAFE_ZONE = {
  top: 250,
  bottom: 420,
  right: 160,
  left: 0,
} as const;
export const GUTTER = 64;
export const SAFE_AREA = {
  x: SAFE_ZONE.left + GUTTER,
  y: SAFE_ZONE.top + GUTTER,
  width: VIDEO.width - SAFE_ZONE.left - SAFE_ZONE.right - GUTTER * 2,
  height: VIDEO.height - SAFE_ZONE.top - SAFE_ZONE.bottom - GUTTER * 2,
} as const;

// Where the subject of each scene sits: between the headline block and the
// captions, horizontally centered on the frame.
export const STAGE = {
  cx: VIDEO.width / 2,
  cy: 1010,
} as const;

export const TYPE = {
  headline: 96,
  hook: 124,
  headlineSmall: 64,
  kicker: 30,
  caption: 46,
  figure: 140,
  figureLabel: 44,
  button: 46,
  tagline: 62,
  pillarGlyph: 112,
  pillarLabel: 30,
  logoName: 84,
  logoSub: 30,
  logoGlyph: 150,
  pondLine: 60,
  pondAccent: 76,
} as const;

// Moon-gate pond window (SP02 pond and proof scenes).
export const MOON_GATE = {
  cx: VIDEO.width / 2,
  cy: 985,
  r: 330,
  rim: 22,
} as const;

// Photo frames and cards for website photos (docs/guides/09).
export const PHOTO = {
  // Arch frame for a single hero photo.
  arch: { x: 240, y: 610, width: 600, height: 700 },
  // Arch frame for Shifu Po in the CTA.
  ctaArch: { x: 590, y: 960, width: 440, height: 560 },
  border: 12,
  radius: 22,
  // Push-in over a scene, as scale from -> to.
  kenBurns: [1.08, 1.3],
  // Instant-photo cards: photo size, white border, thicker bottom edge.
  card: {
    landscape: { width: 420, height: 315 },
    portrait: { width: 330, height: 440 },
    border: 18,
    bottom: 64,
  },
} as const;

// Official logo in the CTA (brand.logo): drawn this wide, centred.
export const LOGO_IMAGE = { width: 640, top: 330 } as const;

export const HEADLINE = {
  top: SAFE_AREA.y + 10,
  gap: 14,
  // Text lands this many frames before its cue word.
  leadFrames: 3,
  enterFrames: 10,
  exitFrames: 8,
  staggerFrames: 4,
  lineHeight: 1.16,
  letterSpacing: "0.02em",
  shadow: "0 6px 24px rgba(18, 16, 14, 0.18)",
} as const;

export const CAPTION = {
  height: 190,
  maxWordsPerPage: 4,
  boxPadding: "0.06em 0.16em",
  rowGap: 8,
  y: SAFE_AREA.y + SAFE_AREA.height - 190,
} as const;

export const BUTTON = {
  height: 116,
  paddingX: 56,
  radius: 58,
  iconSize: 54,
} as const;

// Ink transition between scenes: a growing ink blot with a ragged edge.
export const INK_WIPE = {
  frames: 16,
  points: 72,
  roughness: 0.16,
} as const;

export const SHIFU = {
  photo: "assets/shifu/shifu.png",
  // Height of the figure when it stands in the frame.
  height: 1080,
} as const;

export const LOGO = {
  sealRadius: 118,
} as const;
