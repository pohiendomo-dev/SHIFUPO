import { useCurrentFrame, useVideoConfig } from "remotion";
import { Blueprint } from "../components/Blueprint";
import { CornerFrames, LogoPlate, WhatsAppButton } from "../components/Brand";
import { CompassScene } from "../components/Compass";
import { Sparkles, SpeedLines } from "../components/Fx";
import { Coins, KoiPair } from "../components/Koi";
import { KoiPond } from "../components/KoiPond";
import {
  ArchPhoto,
  EnergyRibbon,
  LogoImage,
  PhotoCard,
} from "../components/Photo";
import { Luopan } from "../components/Luopan";
import { PILLAR, Pillars } from "../components/Pillars";
import { PusherScene } from "../components/Pusher";
import { Shifu } from "../components/Shifu";
import { HeadlineLine, HeadlineStack, Kicker } from "../components/Text";
import {
  COLORS,
  FONTS,
  HEADLINE,
  MOON_GATE,
  PHOTO,
  SAFE_AREA,
  STAGE,
  TYPE,
  VIDEO,
} from "../lib/brand";
import { EASE, prog, springAt, SPRING } from "../lib/motion";
import { backdropOf } from "../three/shots";
import type { SceneOf } from "../schema";

const W = VIDEO.width;
const H = VIDEO.height;

// What every scene receives besides its content: the frame its picture
// starts, the frame it ends (the next scene's ink wipe starts there) and the
// frame of any cue word.
type Base = { start: number; end: number; cue: (word: string) => number };

// Frames before the end of a scene where its exit move starts.
const EXIT_LEAD = 14;
// Size of the hook illustration relative to its drawing.
const HOOK_SCALE = 1.28;
// Scaling around a point above the hill pushes the picture down, clear of
// the headline.
const HOOK_ORIGIN_Y = 690;

export const HookScene: React.FC<Base & { scene: SceneOf<"hook"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const [a, b] = scene.lines;
  const slamAt = cue(a.cueWord);
  return (
    <>
      {/* Scaled up around the hilltop so the figure reads at phone size. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${HOOK_SCALE})`,
          transformOrigin: `${STAGE.cx}px ${HOOK_ORIGIN_Y}px`,
        }}
      >
        <PusherScene
          start={start}
          exitStart={end - EXIT_LEAD}
          exitEnd={end + 6}
        />
      </div>
      <SpeedLines
        cx={SAFE_AREA.x + 300}
        cy={HEADLINE.top + 60}
        start={slamAt - HEADLINE.leadFrames}
        frames={8}
      />
      <HeadlineStack>
        <HeadlineLine
          text={a.text}
          cue={slamAt}
          out={end}
          variant="slam"
          size={TYPE.hook}
        />
        <HeadlineLine
          text={b.text}
          cue={cue(b.cueWord)}
          out={end}
          size={TYPE.headlineSmall}
          color={COLORS.seal}
        />
      </HeadlineStack>
    </>
  );
};

export const InsightScene: React.FC<Base & { scene: SceneOf<"insight"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const frame = useCurrentFrame();
  const [a, b] = scene.lines;
  // The compass grows into the luo pan of the next scene.
  const grow = prog(frame, end - EXIT_LEAD, end + 8, EASE.inOut);
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${1 + grow * 0.25})`,
          transformOrigin: `${STAGE.cx}px ${STAGE.cy}px`,
          opacity: 1 - grow * 0.6,
        }}
      >
        <CompassScene start={start} lock={cue(scene.lockCueWord)} />
      </div>
      <HeadlineStack>
        <HeadlineLine
          text={a.text}
          cue={cue(a.cueWord)}
          out={end}
          size={TYPE.headlineSmall}
        />
        <HeadlineLine
          text={b.text}
          cue={cue(b.cueWord)}
          out={end}
          accent={b.accent}
        />
      </HeadlineStack>
    </>
  );
};

const LUOPAN = { x: 372, y: 900 } as const;
const PILLAR_BASE = { x: 330, y: 1236 } as const;
// Centre x of pillar i on the frame.
const pillarX = (i: number, count: number) =>
  PILLAR_BASE.x -
  (count * PILLAR.width + (count - 1) * PILLAR.gap) / 2 +
  PILLAR.width / 2 +
  i * (PILLAR.width + PILLAR.gap);

export const BaziScene: React.FC<Base & { scene: SceneOf<"bazi"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const frame = useCurrentFrame();
  const titleAt = cue(scene.title.cueWord);
  const pillarCues = scene.pillars.map((p) => cue(p.cueWord));
  const sink = prog(frame, end - EXIT_LEAD, end + 6, EASE.in);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g
          transform={`translate(${LUOPAN.x} ${LUOPAN.y}) scale(${1 - sink * 0.15})`}
          opacity={1 - sink}
        >
          <Luopan start={start} id="bazi-luopan" scale={1.02} />
        </g>
        <g transform={`translate(${PILLAR_BASE.x} ${PILLAR_BASE.y})`}>
          <Pillars
            pillars={scene.pillars}
            start={titleAt - 2}
            cues={pillarCues}
            exitStart={end - EXIT_LEAD}
            id="bazi-pillars"
          />
        </g>
      </svg>
      {pillarCues.map((c, i) => (
        <Sparkles
          key={c}
          cx={pillarX(i, scene.pillars.length)}
          cy={PILLAR_BASE.y - 240}
          start={c}
          count={6}
          spread={90}
          frames={20}
        />
      ))}
      <Shifu
        enter={cue(scene.shifuCueWord) - HEADLINE.leadFrames}
        exit={end - EXIT_LEAD}
        x={930}
        baseY={H + 60}
        height={1040}
        mirror
      />
      <HeadlineStack>
        <Kicker
          text={scene.subtitle}
          start={titleAt - HEADLINE.leadFrames + 6}
          out={end}
        />
        <HeadlineLine
          text={scene.title.text}
          cue={titleAt}
          out={end}
          size={TYPE.headline * 1.4}
          accent={scene.title.text}
        />
      </HeadlineStack>
    </>
  );
};

const BLUEPRINT = { x: STAGE.cx, y: 985, scale: 0.92 } as const;

export const FengshuiScene: React.FC<Base & { scene: SceneOf<"fengshui"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stampAt = cue(scene.stamp.cueWord);
  const stamp = springAt(frame, stampAt - 1, fps, SPRING.snap);
  const leave = prog(frame, end - EXIT_LEAD, end + 6, EASE.in);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g
          transform={`translate(${BLUEPRINT.x} ${BLUEPRINT.y + leave * 80}) scale(${BLUEPRINT.scale})`}
          opacity={1 - leave}
        >
          <Blueprint
            start={start}
            flow={cue(scene.title.cueWord)}
            stamp={stampAt}
            id="fs-plan"
          />
        </g>
      </svg>
      <HeadlineStack>
        <HeadlineLine
          text={scene.title.text}
          cue={cue(scene.title.cueWord)}
          out={end}
          size={TYPE.headlineSmall}
          accent="ENERGI"
        />
      </HeadlineStack>
      {stamp > 0 ? (
        <div
          style={{
            position: "absolute",
            left: SAFE_AREA.x + 40,
            top: 1150,
            transform: `rotate(-5deg) scale(${1.5 - Math.min(1, stamp) * 0.5})`,
            transformOrigin: "0% 50%",
            opacity: Math.min(1, stamp * 2) * (1 - leave),
            border: `6px solid ${COLORS.seal}`,
            padding: "10px 26px",
            color: COLORS.seal,
            background: "rgba(248,244,236,0.92)",
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 50,
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {scene.stamp.text}
        </div>
      ) : null}
    </>
  );
};

const formatCount = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export const ProofScene: React.FC<Base & { scene: SceneOf<"proof"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const countAt = cue(scene.count.cueWord);
  const counting = prog(frame, countAt - 2, countAt + 26, EASE.out);
  const pop = springAt(frame, countAt - 3, fps, SPRING.pop);
  const label = prog(frame, countAt + 8, countAt + 20);
  const leave = prog(frame, end - EXIT_LEAD, end + 6, EASE.in);
  const enter = prog(frame, start, start + 16);
  return (
    <>
      {scene.koi === "pond" ? (
        <KoiPond
          id="proof-pond"
          cx={MOON_GATE.cx}
          cy={MOON_GATE.cy + 40}
          r={MOON_GATE.r - 30}
          rim={MOON_GATE.rim}
          start={start}
          mood="calm"
          fishCount={5}
          exitStart={end - EXIT_LEAD}
        />
      ) : null}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g
          opacity={enter * (1 - leave)}
          transform={`translate(0 ${-leave * 160})`}
        >
          {scene.koi === "ink" ? (
            <KoiPair
              cx={STAGE.cx}
              cy={1040}
              radius={270}
              start={start}
              scale={1.45}
            />
          ) : null}
          {scene.koi !== "none" ? (
            <Coins start={countAt - 4} floor={1236} minX={150} maxX={870} />
          ) : null}
        </g>
      </svg>
      <Sparkles
        cx={STAGE.cx}
        cy={560}
        start={countAt + 24}
        count={14}
        spread={300}
      />
      {frame >= countAt - 3 ? (
        <div
          style={{
            position: "absolute",
            left: SAFE_AREA.x,
            top: HEADLINE.top,
            width: SAFE_AREA.width,
            textAlign: "center",
            opacity: 1 - leave,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: TYPE.figure,
              whiteSpace: "nowrap",
              // The box hugs the digits so the gold gradient covers all of
              // them (a clipped background stops at the box edge).
              display: "inline-block",
              lineHeight: 1,
              // Vertical so every digit gets the same light-to-deep gold.
              background: `linear-gradient(180deg, ${COLORS.goldLight} 0%, ${COLORS.gold} 42%, ${COLORS.goldDeep} 100%)`,
              WebkitBackgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 8px 18px rgba(156,122,53,0.35))",
              transform: `scale(${0.6 + Math.min(1.2, pop) * 0.4})`,
            }}
          >
            {formatCount(Math.round(scene.count.value * counting))}
            {counting >= 1 ? scene.count.suffix : ""}
          </div>
          <div
            style={{
              fontFamily: FONTS.body,
              fontWeight: 800,
              fontSize: TYPE.figureLabel,
              letterSpacing: "0.18em",
              color: COLORS.ink,
              opacity: label,
              marginTop: 8,
            }}
          >
            {scene.count.label}
          </div>
        </div>
      ) : null}
    </>
  );
};

// CTA layout when the official logo and a real photo are used (SP02).
const CTA_PHOTO_LAYOUT = { taglineTop: 590, buttonTop: 790 } as const;
// CTA photos are cropped with the face centred, about 40% from the top
// (docs/guides/09, section 1).
const CTA_PHOTO_FOCUS = { x: 50, y: 38 } as const;

export const CtaScene: React.FC<
  Base & {
    scene: SceneOf<"cta">;
    brand: {
      name: string;
      descriptor: string;
      sealGlyph: string;
      logo?: string;
    };
  }
> = ({ scene, start, end, cue, brand }) => {
  if (scene.photo) {
    const buttonAt = cue(scene.button.cueWord);
    return (
      <>
        <CornerFrames start={start + 4} />
        <ArchPhoto
          src={scene.photo}
          box={PHOTO.ctaArch}
          focus={CTA_PHOTO_FOCUS}
          start={start + 6}
          end={end}
          sweepAt={buttonAt + 4}
        />
        {brand.logo ? (
          <LogoImage src={brand.logo} start={start + 2} />
        ) : (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: HEADLINE.top - 20,
              width: W,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <LogoPlate
              start={start + 2}
              glyph={brand.sealGlyph}
              name={brand.name}
              descriptor={brand.descriptor}
            />
          </div>
        )}
        <HeadlineStack top={CTA_PHOTO_LAYOUT.taglineTop}>
          <HeadlineLine
            text={scene.tagline.text}
            cue={cue(scene.tagline.cueWord)}
            out={Infinity}
            size={TYPE.tagline}
            accent={scene.tagline.accent}
          />
        </HeadlineStack>
        <div
          style={{
            position: "absolute",
            left: SAFE_AREA.x,
            top: CTA_PHOTO_LAYOUT.buttonTop,
          }}
        >
          <WhatsAppButton text={scene.button.text} cue={buttonAt} />
        </div>
        <Sparkles
          cx={SAFE_AREA.x + 330}
          cy={CTA_PHOTO_LAYOUT.buttonTop + 58}
          start={buttonAt + 6}
          count={10}
          spread={240}
        />
      </>
    );
  }
  const buttonTop = brand.logo ? CTA_PHOTO_LAYOUT.buttonTop : 1080;
  return (
    <>
      <CornerFrames start={start + 4} />
      <Shifu enter={start + 8} x={830} baseY={H + 40} height={1100} mirror />
      {brand.logo ? (
        <LogoImage src={brand.logo} start={start + 2} />
      ) : (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: HEADLINE.top - 20,
            width: W,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <LogoPlate
            start={start + 2}
            glyph={brand.sealGlyph}
            name={brand.name}
            descriptor={brand.descriptor}
          />
        </div>
      )}
      <HeadlineStack top={brand.logo ? CTA_PHOTO_LAYOUT.taglineTop : 780}>
        <HeadlineLine
          text={scene.tagline.text}
          cue={cue(scene.tagline.cueWord)}
          out={Infinity}
          size={TYPE.tagline}
          accent={scene.tagline.accent}
        />
      </HeadlineStack>
      <div style={{ position: "absolute", left: SAFE_AREA.x, top: buttonTop }}>
        <WhatsAppButton
          text={scene.button.text}
          cue={cue(scene.button.cueWord)}
        />
      </div>
      <Sparkles
        cx={SAFE_AREA.x + 330}
        cy={buttonTop + 58}
        start={cue(scene.button.cueWord) + 6}
        count={10}
        spread={240}
      />
    </>
  );
};

// Lines of a pond or photo scene; the accent word turns gold.
const AccentLines: React.FC<{
  lines: { text: string; cueWord: string; accent?: string }[];
  cue: (word: string) => number;
  end: number;
  size: number;
  color?: string;
}> = ({ lines, cue, end, size, color }) => (
  <>
    {lines.map((l) => (
      <HeadlineLine
        key={l.cueWord}
        text={l.text}
        cue={cue(l.cueWord)}
        out={end}
        size={size}
        accent={l.accent}
        color={color}
      />
    ))}
  </>
);

export const PondScene: React.FC<Base & { scene: SceneOf<"pond">; index: number }> = ({
  scene,
  start,
  end,
  cue,
  index,
}) => {
  const first = scene.lines[0];
  const flowAt = scene.flowCueWord ? cue(scene.flowCueWord) : undefined;
  return (
    <>
      <KoiPond
        id={`pond-${index}`}
        cx={MOON_GATE.cx}
        cy={MOON_GATE.cy}
        r={MOON_GATE.r}
        rim={MOON_GATE.rim}
        start={start}
        mood={scene.mood}
        flowAt={flowAt}
        fishCount={scene.mood === "flow" ? 5 : 3}
        exitStart={end - EXIT_LEAD}
      />
      {flowAt !== undefined ? (
        <Sparkles
          cx={MOON_GATE.cx}
          cy={MOON_GATE.cy - MOON_GATE.r}
          start={flowAt + 18}
          count={14}
          spread={260}
        />
      ) : null}
      <HeadlineStack>
        {scene.kicker ? (
          <Kicker
            text={scene.kicker}
            start={cue(first.cueWord) - HEADLINE.leadFrames - 6}
            out={end}
          />
        ) : null}
        <AccentLines lines={scene.lines} cue={cue} end={end} size={TYPE.pondLine} />
      </HeadlineStack>
    </>
  );
};

export const PhotoScene: React.FC<Base & { scene: SceneOf<"photo">; index: number }> = ({
  scene,
  start,
  end,
  cue,
  index,
}) => {
  const energyAt = cue(scene.energyCueWord);
  return (
    <>
      <ArchPhoto
        src={scene.src}
        box={PHOTO.arch}
        focus={scene.focus}
        start={start}
        end={end}
        sweepAt={energyAt + 10}
        exitStart={end - EXIT_LEAD}
      />
      <EnergyRibbon box={PHOTO.arch} start={energyAt - 4} id={`ribbon-${index}`} />
      <HeadlineStack>
        <Kicker
          text={scene.kicker}
          start={start + 6}
          out={end}
        />
        <AccentLines lines={scene.lines} cue={cue} end={end} size={TYPE.headlineSmall} />
      </HeadlineStack>
    </>
  );
};

// Shifu Po in 3D scenes: on the right, facing into the frame.
const SHIFU_3D = { x: 850, baseY: H + 120, height: 1180 } as const;

// Text over the 3D world; the world itself is drawn once by World3D.
export const Stage3DScene: React.FC<Base & { scene: SceneOf<"stage3d"> }> = ({
  scene,
  start,
  end,
  cue,
}) => {
  const first = scene.lines[0];
  // Light text on the dark band of interior shots (SHOT_BACKDROP).
  const dark = backdropOf(scene.shot) === "dark";
  return (
    <>
      {scene.shifuCueWord ? (
        <Shifu
          enter={cue(scene.shifuCueWord) - HEADLINE.leadFrames}
          exit={end - EXIT_LEAD}
          x={SHIFU_3D.x}
          baseY={SHIFU_3D.baseY}
          height={SHIFU_3D.height}
          mirror
        />
      ) : null}
      <HeadlineStack>
        {scene.kicker ? (
          <Kicker
            text={scene.kicker}
            start={Math.max(start + 4, cue(first.cueWord) - HEADLINE.leadFrames - 6)}
            out={end}
            color={dark ? COLORS.goldLight : undefined}
          />
        ) : null}
        <AccentLines
          lines={scene.lines}
          cue={cue}
          end={end}
          size={TYPE.headlineSmall}
          color={dark ? COLORS.paper : undefined}
        />
      </HeadlineStack>
    </>
  );
};

// Where the three gallery cards land: centre and tilt.
const GALLERY_CARDS = [
  { cx: 380, cy: 680, rotate: -6 },
  { cx: 690, cy: 880, rotate: 5 },
  { cx: 400, cy: 1045, rotate: -3 },
] as const;

export const GalleryScene: React.FC<Base & { scene: SceneOf<"gallery">; index: number }> = ({
  scene,
  start,
  end,
  cue,
  index,
}) => (
  <>
    {scene.photos.map((p, i) => (
      <PhotoCard
        key={p.src}
        src={p.src}
        orientation={p.orientation}
        cx={GALLERY_CARDS[i].cx}
        cy={GALLERY_CARDS[i].cy}
        rotate={GALLERY_CARDS[i].rotate}
        enter={Math.max(start + 4, cue(p.cueWord) - HEADLINE.leadFrames)}
        exitStart={end - EXIT_LEAD}
        seed={`gallery-${index}-${i}`}
      />
    ))}
    <HeadlineStack>
      <HeadlineLine
        text={scene.title.text}
        cue={cue(scene.title.cueWord)}
        out={end}
        size={TYPE.headlineSmall}
        accent={scene.title.accent}
      />
    </HeadlineStack>
  </>
);
