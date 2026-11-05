import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./fonts";
import type { Cue, CuePosition, TalkConfig, Word } from "./types";

const EMOJI_FONT =
  '"Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif';

// Yuzni yopmaslik uchun emoji asosan tepa burchaklarda chiqadi.
const POS: Record<Exclude<CuePosition, "auto">, [number, number]> = {
  top: [50, 16],
  topLeft: [22, 20],
  topRight: [78, 20],
  left: [16, 46],
  right: [84, 46],
  center: [50, 42],
  bottomLeft: [20, 62],
  bottomRight: [80, 62],
};
const AUTO: (keyof typeof POS)[] = ["topRight", "topLeft", "right", "left", "top"];

const EmojiCue: React.FC<{ cue: Cue; pos: [number, number]; dur: number; size: number }> = ({
  cue,
  pos,
  dur,
  size,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anim = cue.anim ?? "pop";
  const pop = spring({ frame, fps, config: { damping: 8, stiffness: 170 } });
  const out = interpolate(frame, [dur - 8, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const float = interpolate(frame, [0, dur], [0, -size * 0.25]);
  const wobble =
    anim === "shake"
      ? Math.sin(frame * 1.6) * 12 * Math.max(0, 1 - frame / 20)
      : Math.sin(frame / 6) * 6;
  const s = (cue.size ?? 1) * size;
  return (
    <div
      style={{
        position: "absolute",
        left: `${pos[0]}%`,
        top: `${pos[1]}%`,
        transform: `translate(-50%, -50%) translateY(${float}px) scale(${pop * out}) rotate(${wobble}deg)`,
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative" }}>
      <div
        style={{
          fontFamily: EMOJI_FONT,
          fontSize: s,
          lineHeight: 1,
          filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.35))",
        }}
      >
        {cue.emoji}
      </div>
      {anim === "burst"
        ? Array.from({ length: 6 }, (_, i) => {
            const ang = (i / 6) * Math.PI * 2;
            const d = interpolate(frame, [0, 18], [0, s * 0.9], { extrapolateRight: "clamp" });
            const o = interpolate(frame, [4, 20], [1, 0], { extrapolateRight: "clamp" });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  fontFamily: EMOJI_FONT,
                  fontSize: s * 0.3,
                  opacity: o,
                  transform: `translate(-50%,-50%) translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d}px)`,
                }}
              >
                {cue.emoji}
              </div>
            );
          })
        : null}
      </div>
      {cue.text ? (
        <div
          style={{
            marginTop: s * 0.1,
            fontFamily,
            fontWeight: 800,
            fontSize: s * 0.32,
            color: "#111",
            background: "#fff",
            borderRadius: s * 0.12,
            padding: `${s * 0.04}px ${s * 0.14}px`,
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          {cue.text}
        </div>
      ) : null}
    </div>
  );
};

type Chunk = { words: Word[]; start: number; end: number };

/** So'zlarni 2–4 so'zlik guruhlarga bo'lish (pauza yoki tinish belgisida uziladi). */
const chunkWords = (words: Word[], max: number): Chunk[] => {
  const chunks: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) chunks.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= max || (prev && w.start - prev.end > 0.6))) flush();
    cur.push(w);
    if (/[.!?,;:]$/.test(w.word)) flush();
  });
  flush();
  return chunks;
};

const Captions: React.FC<{ cfg: TalkConfig; base: number }> = ({ cfg, base }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const c = cfg.captions ?? {};
  const chunks = useMemo(() => chunkWords(cfg.words ?? [], c.maxWords ?? 3), [cfg.words, c.maxWords]);
  const t = frame / fps;
  const idx = chunks.findIndex(
    (ch, i) => t >= ch.start && t < Math.min(ch.end + 0.4, chunks[i + 1]?.start ?? Infinity),
  );
  if (idx < 0) return null;
  const ch = chunks[idx];
  const local = Math.round((t - ch.start) * fps);
  const appear = spring({ frame: local, fps, config: { damping: 14, stiffness: 200 } });
  const color = c.color ?? "#FFFFFF";
  const hi = c.highlight ?? "#FFD60A";
  const stroke = `0 0 ${base * 0.08}px rgba(0,0,0,0.9), 0 ${base * 0.05}px 0 #000, 0 -${base * 0.03}px 0 #000, ${base * 0.03}px 0 0 #000, -${base * 0.03}px 0 0 #000`;
  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        right: "6%",
        top: `${(c.y ?? 0.74) * 100}%`,
        transform: `translateY(-50%) scale(${interpolate(appear, [0, 1], [0.85, 1])})`,
        textAlign: "center",
        fontFamily,
        fontWeight: 800,
        fontSize: base * (c.scale ?? 1),
        lineHeight: 1.15,
        textTransform: c.uppercase === false ? "none" : "uppercase",
        opacity: appear,
        maxHeight: height * 0.25,
      }}
    >
      {ch.words.map((w, i) => {
        const space = i > 0 ? " " : "";
        const active = t >= w.start && t < (ch.words[i + 1]?.start ?? ch.end + 0.4);
        return (
          <React.Fragment key={i}>
          {space}
          <span
            style={{
              color: active ? hi : color,
              textShadow: stroke,
              display: "inline-block",
              margin: `0 ${base * 0.16}px`,
              transform: `scale(${active ? 1.08 : 1})`,
            }}
          >
            {w.word}
          </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Talk: React.FC<{ config: TalkConfig }> = ({ config }) => {
  const { fps, width, height } = useVideoConfig();
  const base = Math.min(width, height) / 13;
  const vol = config.sfxVolume ?? 0.3;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {config.video ? (
        <OffthreadVideo src={staticFile(config.video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
      {config.cues.map((cue, i) => {
        const from = Math.round(cue.at * fps);
        const dur = Math.round((cue.duration ?? 1.4) * fps);
        const p = cue.position && cue.position !== "auto" ? cue.position : AUTO[i % AUTO.length];
        const sfx = cue.sfx ?? "pop";
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <EmojiCue cue={cue} pos={POS[p]} dur={dur} size={base * 2.8} />
            {sfx !== "none" ? <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={vol} /> : null}
          </Sequence>
        );
      })}
      {config.captions?.enabled === false ? null : <Captions cfg={config} base={base} />}
    </AbsoluteFill>
  );
};
