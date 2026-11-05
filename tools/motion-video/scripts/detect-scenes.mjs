#!/usr/bin/env node
// Audiodagi pauzalarni topib, har sahna boshlanish soniyasini taxmin qiladi
// (qo'llanmadagi 4-qadam: SCENE_STARTS ni qo'lda yozish o'rniga).
// Foydalanish: node scripts/detect-scenes.mjs <audio> <sahnalar_soni> [--write src/video.json]
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const [audio, nArg, flag, target] = process.argv.slice(2);
const n = Number(nArg);
if (!audio || !n) {
  console.error("Foydalanish: detect-scenes.mjs <audio> <sahnalar_soni> [--write file.json]");
  process.exit(1);
}

const probe = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio]).toString();
const duration = Number(probe);

const detect = (noise, d) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", audio, "-af", `silencedetect=noise=${noise}dB:d=${d}`, "-f", "null", "-"], { encoding: "utf8" });
  const pauses = [];
  let start = null;
  for (const line of r.stderr.split("\n")) {
    const s = line.match(/silence_start: ([\d.]+)/);
    const e = line.match(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/);
    if (s) start = Number(s[1]);
    if (e) pauses.push({ start: start ?? Number(e[1]) - Number(e[2]), end: Number(e[1]), len: Number(e[2]) });
  }
  // boshidagi va oxiridagi jimlikni hisobga olmaymiz
  return pauses.filter((p) => p.start > 0.3 && p.end < duration - 0.3);
};

let pauses = [];
for (const [noise, d] of [[-35, 0.3], [-30, 0.2], [-25, 0.15], [-20, 0.1]]) {
  pauses = detect(noise, d);
  if (pauses.length >= n - 1) break;
}

let starts;
if (pauses.length >= n - 1) {
  // eng uzun n-1 pauza = sahna chegaralari; gap pauza tugaganda boshlanadi
  const chosen = [...pauses].sort((a, b) => b.len - a.len).slice(0, n - 1).sort((a, b) => a.end - b.end);
  starts = [0, ...chosen.map((p) => Math.max(0, +(p.end - 0.1).toFixed(2)))];
} else {
  console.error(`Ogohlantirish: faqat ${pauses.length} ta pauza topildi, sahnalar teng bo'linadi.`);
  starts = Array.from({ length: n }, (_, i) => +((i * duration) / n).toFixed(2));
}

console.log(JSON.stringify({ duration: +duration.toFixed(2), sceneStarts: starts }));
if (flag === "--write" && target) {
  const cfg = JSON.parse(readFileSync(target, "utf8"));
  cfg.sceneStarts = starts;
  cfg.durationInSeconds = +duration.toFixed(2);
  writeFileSync(target, JSON.stringify(cfg, null, 2) + "\n");
}
