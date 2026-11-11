import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sp01 from "../data/episodes/sp01.json";
import sp02 from "../data/episodes/sp02.json";
import sp03 from "../data/episodes/sp03.json";
import { cueMatches } from "../src/lib/cues";
import { terbilang } from "../src/lib/text";
import { cueFrame, evenWordTimings, layoutBeats } from "../src/lib/timeline";
import { episodeSchema, sceneCues } from "../src/schema";
import { splitWords } from "../src/lib/text";
import { PACING } from "../src/lib/timing";

describe("sp01 episode", () => {
  const episode = episodeSchema.parse(sp01);

  it("passes the schema (order, cues, highlights, spoken numbers)", () => {
    expect(episode.scenes.map((s) => s.type)).toEqual([
      "hook",
      "insight",
      "bazi",
      "fengshui",
      "proof",
      "cta",
    ]);
  });

  it("has every cue spoken exactly once in its own line", () => {
    for (const scene of episode.scenes) {
      for (const cue of sceneCues(scene)) {
        expect(cueMatches(scene.vo, cue), `${scene.type}: ${cue}`).toHaveLength(
          1,
        );
      }
    }
  });

  it("stays inside the reel length at the estimated speaking rate", () => {
    const words = episode.scenes.reduce(
      (n, s) => n + splitWords(s.vo).length,
      0,
    );
    const seconds =
      words / PACING.estimateWordsPerSecond +
      PACING.leadInSeconds +
      (episode.scenes.length - 1) * PACING.lineGapSeconds +
      PACING.outroHoldSeconds;
    expect(seconds).toBeGreaterThan(20);
    expect(seconds).toBeLessThan(30);
  });

  it("rejects a cue that is not spoken", () => {
    // A loose copy: the test edits fields the JSON import types too strictly.
    const broken = JSON.parse(JSON.stringify(sp01));
    broken.scenes[2].pillars[0].cueWord = "minggu";
    expect(episodeSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a count that does not match the voice over", () => {
    // A loose copy: the test edits fields the JSON import types too strictly.
    const broken = JSON.parse(JSON.stringify(sp01));
    broken.scenes[4].count = { ...broken.scenes[4].count, value: 2000 };
    expect(episodeSchema.safeParse(broken).success).toBe(false);
  });
});

describe("sp02 episode (website photos, koi pond)", () => {
  const episode = episodeSchema.parse(sp02);

  it("passes the schema with a free scene order", () => {
    expect(episode.scenes.map((s) => s.type)).toEqual([
      "pond",
      "pond",
      "photo",
      "gallery",
      "proof",
      "cta",
    ]);
  });

  it("only uses photos that exist in public/", () => {
    const files = [
      episode.brand.logo,
      ...episode.scenes.flatMap((s) => {
        switch (s.type) {
          case "photo":
            return [s.src];
          case "gallery":
            return s.photos.map((p) => p.src);
          case "cta":
            return s.photo ? [s.photo] : [];
          default:
            return [];
        }
      }),
    ].filter((f): f is string => Boolean(f));
    for (const f of files) {
      expect(
        existsSync(path.join(import.meta.dirname, "..", "public", f)),
        f,
      ).toBe(true);
    }
  });

  it("stays inside the reel length at the estimated speaking rate", () => {
    const words = episode.scenes.reduce(
      (n, s) => n + splitWords(s.vo).length,
      0,
    );
    const seconds =
      words / PACING.estimateWordsPerSecond +
      PACING.leadInSeconds +
      (episode.scenes.length - 1) * PACING.lineGapSeconds +
      PACING.outroHoldSeconds;
    expect(seconds).toBeGreaterThan(20);
    expect(seconds).toBeLessThan(30);
  });

  it("rejects an episode that does not end on the cta", () => {
    const broken = JSON.parse(JSON.stringify(sp02));
    broken.scenes = [...broken.scenes.slice(0, 4), broken.scenes[5], broken.scenes[4]];
    expect(episodeSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an episode that opens without a hook-type scene", () => {
    const broken = JSON.parse(JSON.stringify(sp02));
    broken.scenes = [broken.scenes[2], ...broken.scenes.slice(0, 2), ...broken.scenes.slice(3)];
    expect(episodeSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a photo path outside public/assets", () => {
    const broken = JSON.parse(JSON.stringify(sp02));
    broken.scenes[2].src = "https://shifupofengshui.com/pagoda.jpg";
    expect(episodeSchema.safeParse(broken).success).toBe(false);
  });
});

describe("sp03 episode (3D world)", () => {
  const episode = episodeSchema.parse(sp03);

  it("is a 3D episode that opens on the house and ends on the cta", () => {
    expect(episode.world).toBe("3d");
    expect(episode.scenes[0].type).toBe("stage3d");
    expect(episode.scenes[episode.scenes.length - 1].type).toBe("cta");
  });

  it("stays inside the reel length at the estimated speaking rate", () => {
    const words = episode.scenes.reduce(
      (n, s) => n + splitWords(s.vo).length,
      0,
    );
    const seconds =
      words / PACING.estimateWordsPerSecond +
      PACING.leadInSeconds +
      (episode.scenes.length - 1) * PACING.lineGapSeconds +
      PACING.outroHoldSeconds;
    expect(seconds).toBeGreaterThan(20);
    expect(seconds).toBeLessThan(30);
  });

  it("rejects an action cue that is not spoken", () => {
    const broken = JSON.parse(JSON.stringify(sp03));
    broken.scenes[1].actionCueWord = "jendela";
    expect(episodeSchema.safeParse(broken).success).toBe(false);
  });
});

describe("terbilang", () => {
  it("spells numbers up to the hundred thousands", () => {
    expect(terbilang(25)).toBe("dua puluh lima");
    expect(terbilang(100)).toBe("seratus");
    expect(terbilang(1000)).toBe("seribu");
    expect(terbilang(3000)).toBe("tiga ribu");
    expect(terbilang(3850)).toBe("tiga ribu delapan ratus lima puluh");
  });
});

describe("timeline", () => {
  it("lays lines out with pauses and finds cue frames", () => {
    const words = splitWords("Konsultasi sekarang via WhatsApp.");
    const { beats, durationInFrames } = layoutBeats(
      [
        { voDurationInFrames: 60, words: evenWordTimings(["a", "b"], 60) },
        { voDurationInFrames: 60, words: evenWordTimings(words, 60) },
      ],
      30,
    );
    expect(beats[0].startFrame).toBe(0);
    expect(beats[1].voStartFrame).toBe(beats[0].voStartFrame + 60 + 9);
    expect(beats[0].endFrame).toBe(beats[1].startFrame);
    expect(durationInFrames).toBe(beats[1].voStartFrame + 60 + 36);
    expect(
      cueFrame(beats[1], "Konsultasi sekarang via WhatsApp.", "WhatsApp"),
    ).toBe(beats[1].voStartFrame + 45);
  });
});
