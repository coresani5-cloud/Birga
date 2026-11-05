import React from "react";
import { Composition } from "remotion";
import { Reels } from "./Reels";
import config from "./video.json";
import type { VideoConfig } from "./types";

const cfg = config as VideoConfig;

export const RemotionRoot: React.FC = () => {
  const fps = cfg.fps ?? 30;
  const seconds =
    cfg.durationInSeconds ?? cfg.scenes.length * (cfg.fallbackSceneSeconds ?? 4);
  return (
    <Composition
      id="Reels"
      component={Reels}
      durationInFrames={Math.max(1, Math.ceil(seconds * fps))}
      fps={fps}
      width={cfg.width ?? 1080}
      height={cfg.height ?? 1080}
      defaultProps={{ config: cfg }}
    />
  );
};
