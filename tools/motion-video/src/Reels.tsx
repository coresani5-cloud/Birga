import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./fonts";
import type { ListItem, Scene, Sfx, VideoConfig } from "./types";

const EMOJI_FONT =
  '"Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif';

type Theme = { color: string; accent: string; bg: string; sfxVolume: number; base: number };

/** Sahna boshlanish kadrlarini hisoblash (sceneStarts yoki teng bo'lish). */
const sceneFrames = (cfg: VideoConfig, fps: number, total: number) => {
  const n = cfg.scenes.length;
  let starts: number[];
  if (cfg.sceneStarts && cfg.sceneStarts.length >= n) {
    starts = cfg.sceneStarts.slice(0, n).map((s) => Math.round(s * fps));
  } else {
    starts = cfg.scenes.map((_, i) => Math.round((i * total) / n));
  }
  return starts.map((from, i) => {
    const to = i + 1 < n ? starts[i + 1] : total;
    return { from, duration: Math.max(1, to - from) };
  });
};

const SfxAt: React.FC<{ at: number; sfx: Sfx | undefined; volume: number }> = ({
  at,
  sfx,
  volume,
}) => {
  if (!sfx || sfx === "none") return null;
  return (
    <Sequence from={Math.max(0, Math.round(at))} durationInFrames={45} layout="none">
      <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={volume} />
    </Sequence>
  );
};

/** Pastdan yengil ko'tarilib chiqish. */
const useRise = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return {
    opacity: p,
    transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`,
  };
};

const usePop = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 160 } });
  return { transform: `scale(${p})`, opacity: Math.min(1, p * 2) };
};

/** Sahna oxirida yumshoq yo'qolish. */
const Exit: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        opacity: out,
        transform: `scale(${interpolate(out, [0, 1], [0.96, 1])})`,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: "8%",
        textAlign: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Emoji: React.FC<{ e: string; size: number; delay?: number }> = ({ e, size, delay = 0 }) => {
  const frame = useCurrentFrame();
  const style = usePop(delay);
  const bob = Math.sin((frame - delay) / 12) * 6;
  return (
    <div
      style={{
        ...style,
        fontFamily: EMOJI_FONT,
        fontSize: size,
        lineHeight: 1.1,
        marginBottom: size * 0.15,
        translate: `0 ${frame > delay + 15 ? bob : 0}px`,
      }}
    >
      {e}
    </div>
  );
};

const Text: React.FC<{
  t: Theme;
  size: number;
  weight?: number;
  delay?: number;
  children: React.ReactNode;
  color?: string;
}> = ({ t, size, weight = 700, delay = 0, children, color }) => {
  const rise = useRise(delay);
  return (
    <div
      style={{
        ...rise,
        fontSize: size,
        fontWeight: weight,
        color: color ?? t.color,
        lineHeight: 1.2,
        letterSpacing: -0.5,
        whiteSpace: "pre-line",
      }}
    >
      {children}
    </div>
  );
};

const Typing: React.FC<{ t: Theme; text: string }> = ({ t, text }) => {
  const frame = useCurrentFrame();
  const chars = Math.min(text.length, Math.floor(Math.max(0, frame - 6) / 3));
  const caret = Math.floor(frame / 15) % 2 === 0;
  return (
    <div style={{ fontSize: t.base * 1.6, fontWeight: 800, color: t.color, letterSpacing: 2 }}>
      {text.slice(0, chars)}
      <span style={{ color: t.accent, opacity: caret ? 1 : 0 }}>|</span>
    </div>
  );
};

const Counter: React.FC<{ t: Theme; to: number; suffix: string; duration: number }> = ({
  t,
  to,
  suffix,
  duration,
}) => {
  const frame = useCurrentFrame();
  const end = Math.min(duration - 10, 60);
  const p = interpolate(frame, [5, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const done = frame >= end;
  const bump = done ? spring({ frame: frame - end, fps: 30, config: { damping: 8 } }) : 0;
  return (
    <div style={{ width: "80%" }}>
      <div
        style={{
          fontSize: t.base * 2.2,
          fontWeight: 800,
          color: done ? t.accent : t.color,
          transform: `scale(${1 + bump * 0.08 - (done ? 0.08 : 0)})`,
        }}
      >
        {Math.round(p * to)}
        {suffix}
      </div>
      <div
        style={{
          height: t.base * 0.22,
          borderRadius: 999,
          background: "rgba(0,0,0,0.08)",
          overflow: "hidden",
          marginTop: t.base * 0.3,
        }}
      >
        <div style={{ width: `${p * 100}%`, height: "100%", background: t.accent, borderRadius: 999 }} />
      </div>
    </div>
  );
};

const Row: React.FC<{ t: Theme; item: ListItem; delay: number }> = ({ t, item, delay }) => {
  const rise = useRise(delay);
  return (
    <div
      style={{
        ...rise,
        display: "flex",
        alignItems: "center",
        gap: t.base * 0.35,
        fontSize: t.base * 0.75,
        fontWeight: 700,
        color: t.color,
        margin: `${t.base * 0.18}px 0`,
      }}
    >
      {item.emoji ? <span style={{ fontFamily: EMOJI_FONT }}>{item.emoji}</span> : null}
      <span>{item.text}</span>
    </div>
  );
};

/** Sahna ichidagi ovoz effektlari qachon chalinishi. */
const sceneSfx = (scene: Scene, duration: number): { at: number; sfx: Sfx }[] => {
  const def = (s: Sfx | undefined, fallback: Sfx) => s ?? fallback;
  switch (scene.type) {
    case "emoji":
      return [{ at: 0, sfx: def(scene.sfx, "pop") }];
    case "title":
      return [{ at: 0, sfx: def(scene.sfx, "whoosh") }];
    case "typing": {
      const s = def(scene.sfx, "click");
      if (s === "none") return [];
      return Array.from(scene.text, (_, i) => ({ at: 6 + i * 3, sfx: s }));
    }
    case "counter":
      return [{ at: Math.min(duration - 10, 60), sfx: def(scene.sfx, "ding") }];
    case "list": {
      const s = def(scene.sfx, "pop");
      const off = scene.title ? 10 : 0;
      return scene.items.map((_, i) => ({ at: off + i * 12, sfx: s }));
    }
    case "compare":
      return [
        { at: 0, sfx: def(scene.sfx, "pop") },
        { at: 14, sfx: "whoosh" },
        { at: 24, sfx: def(scene.sfx, "pop") },
      ];
  }
};

const SceneView: React.FC<{ scene: Scene; t: Theme; duration: number }> = ({
  scene,
  t,
  duration,
}) => {
  const b = t.base;
  let body: React.ReactNode;
  switch (scene.type) {
    case "emoji":
      body = (
        <>
          <Emoji e={scene.emoji} size={b * 3} />
          {scene.text ? <Text t={t} size={b} delay={6}>{scene.text}</Text> : null}
        </>
      );
      break;
    case "title":
      body = (
        <>
          {scene.emoji ? <Emoji e={scene.emoji} size={b * 1.8} /> : null}
          <Text t={t} size={b * 1.25} weight={800}>{scene.text}</Text>
          {scene.sub ? (
            <Text t={t} size={b * 0.6} weight={500} delay={8} color={t.accent}>
              {scene.sub}
            </Text>
          ) : null}
        </>
      );
      break;
    case "typing":
      body = (
        <>
          {scene.emoji ? <Emoji e={scene.emoji} size={b * 1.8} /> : null}
          <Typing t={t} text={scene.text} />
          {scene.sub ? (
            <Text t={t} size={b * 0.6} weight={500} delay={6 + scene.text.length * 3}>
              {scene.sub}
            </Text>
          ) : null}
        </>
      );
      break;
    case "counter":
      body = (
        <>
          {scene.emoji ? <Emoji e={scene.emoji} size={b * 1.8} /> : null}
          <Counter t={t} to={scene.to} suffix={scene.suffix ?? ""} duration={duration} />
          {scene.text ? <Text t={t} size={b * 0.7} delay={10}>{scene.text}</Text> : null}
        </>
      );
      break;
    case "list": {
      const off = scene.title ? 10 : 0;
      body = (
        <>
          {scene.title ? <Text t={t} size={b * 0.95} weight={800}>{scene.title}</Text> : null}
          <div style={{ marginTop: b * 0.3, textAlign: "left" }}>
            {scene.items.map((it, i) => (
              <Row key={i} t={t} item={it} delay={off + i * 12} />
            ))}
          </div>
        </>
      );
      break;
    }
    case "compare":
      body = (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: b * 0.6 }}>
            <div style={{ textAlign: "center" }}>
              <Emoji e={scene.left.emoji ?? "❌"} size={b * 1.8} />
              <Text t={t} size={b * 0.7}>{scene.left.text}</Text>
            </div>
            <Text t={t} size={b * 1.2} delay={14} color={t.accent}>→</Text>
            <div style={{ textAlign: "center" }}>
              <Emoji e={scene.right.emoji ?? "✅"} size={b * 1.8} delay={24} />
              <Text t={t} size={b * 0.7} delay={26}>{scene.right.text}</Text>
            </div>
          </div>
          {scene.text ? <Text t={t} size={b * 0.75} delay={34}>{scene.text}</Text> : null}
        </>
      );
      break;
  }
  return (
    <>
      <Exit duration={duration}>{body}</Exit>
      {sceneSfx(scene, duration)
        .filter((s) => s.at < duration)
        .map((s, i) => (
          <SfxAt key={i} at={s.at} sfx={s.sfx} volume={t.sfxVolume} />
        ))}
    </>
  );
};

export const Reels: React.FC<{ config: VideoConfig }> = ({ config }) => {
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t: Theme = {
    color: config.color ?? "#111111",
    accent: config.accent ?? "#0A84FF",
    bg: config.background ?? "#FFFFFF",
    sfxVolume: config.sfxVolume ?? 0.35,
    base: Math.min(width, height) / 12,
  };
  const frames = sceneFrames(config, fps, durationInFrames);
  return (
    <AbsoluteFill style={{ background: t.bg, fontFamily }}>
      {config.audio ? <Audio src={staticFile(config.audio)} /> : null}
      {config.scenes.map((scene, i) => (
        <Sequence key={i} from={frames[i].from} durationInFrames={frames[i].duration}>
          <SceneView scene={scene} t={t} duration={frames[i].duration} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
