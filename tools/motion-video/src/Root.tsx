import React from "react";
import { Composition } from "remotion";
import { Reels } from "./Reels";
import { Talk } from "./Talk";
import config from "./video.json";
import talk from "./talk.json";
import type { TalkConfig, VideoConfig } from "./types";

const cfg = config as VideoConfig;
const tcfg = talk as TalkConfig;

export const RemotionRoot: React.FC = () => {
  const fps = cfg.fps ?? 30;
  const seconds =
    cfg.durationInSeconds ?? cfg.scenes.length * (cfg.fallbackSceneSeconds ?? 4);
  const tfps = tcfg.fps ?? 30;
  return (
    <>
      {/* Skriptdan toza animatsiya (oq fon) */}
      <Composition
        id="Reels"
        component={Reels}
        durationInFrames={Math.max(1, Math.ceil(seconds * fps))}
        fps={fps}
        width={cfg.width ?? 1080}
        height={cfg.height ?? 1080}
        defaultProps={{ config: cfg }}
      />
      {/* Odam gapirayotgan video + so'zlarga mos emoji va subtitr */}
      <Composition
        id="Talk"
        component={Talk}
        durationInFrames={Math.max(1, Math.ceil((tcfg.durationInSeconds ?? 5) * tfps))}
        fps={tfps}
        width={tcfg.width ?? 1080}
        height={tcfg.height ?? 1920}
        defaultProps={{ config: tcfg }}
      />
    </>
  );
};
