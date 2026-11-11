import { AbsoluteFill } from "remotion";
import { COLORS } from "../lib/brand";
import { drift, EASE, lerp, prog, springAt, SPRING } from "../lib/motion";
import { LUOPAN_3D } from "./shots";

// Pieces every 3D world shares: the headline backdrop, the luo pan's
// choreography, and the film grade over the canvas.

// Behind the headline column: paper haze outside, dark band inside a room.
export const HeadlineBackdrop: React.FC<{ dark: number; paper?: string }> = ({ dark, paper = COLORS.skyTop }) => (
  <>
    <AbsoluteFill
      style={{
        opacity: 1 - dark,
        background: `linear-gradient(180deg, ${paper}00 0px, ${paper}E0 230px, ${paper}C8 600px, ${paper}00 860px)`,
      }}
    />
    <AbsoluteFill
      style={{
        opacity: dark,
        background: `linear-gradient(180deg, ${COLORS.ink}F2 0px, ${COLORS.ink}D9 300px, ${COLORS.ink}99 620px, ${COLORS.ink}00 900px)`,
      }}
    />
  </>
);

// Soft vignette and warm grade over the 3D canvas (post-processing passes
// do not render under Remotion, so the grade is a CSS layer).
export const FilmGrade: React.FC<{ warmth?: number; vignette?: number }> = ({ warmth = 0.08, vignette = 0.32 }) => (
  <>
    <AbsoluteFill style={{ background: COLORS.goldLight, mixBlendMode: "soft-light", opacity: warmth }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 85% 70% at 50% 48%, ${COLORS.ink}00 55%, ${COLORS.ink} 100%)`,
        opacity: vignette,
      }}
    />
  </>
);

// The luo pan rises, spins while its needle searches, and locks on `lockAt`.
export const luopanState = (frame: number, fps: number, start: number, end: number, lockAt: number) => {
  const appear = Number.isFinite(start)
    ? springAt(frame, start + 4, fps, SPRING.heavy) * (1 - prog(frame, end - 8, end + 10, EASE.in))
    : 0;
  const spin = prog(frame, start, lockAt + 12, EASE.out) * Math.PI * 2.4 + drift("lpspin", frame, 0.01) * 0.05;
  const searching = (f: number) => Math.sin(f * 0.33) * 1.3 + Math.sin(f * 0.71) * 0.5;
  const needle =
    frame < lockAt - 1
      ? searching(frame)
      : lerp(searching(lockAt - 1), LUOPAN_3D.lockAngle, springAt(frame, lockAt - 1, fps, SPRING.snap));
  const lockGlow = prog(frame, lockAt, lockAt + 5) * (1 - prog(frame, lockAt + 8, lockAt + 34));
  return { appear, spin, needle, lockGlow };
};
