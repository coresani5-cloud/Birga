#!/usr/bin/env node
// .srt subtitrni words.json ga aylantiradi. Har qator ichida so'z vaqtlari
// harf soniga qarab taqsimlanadi (Whisper bo'lmaganda zaxira usul).
// Foydalanish: node scripts/srt-to-words.mjs subs.srt words.json
import { readFileSync, writeFileSync } from "node:fs";
const [src, out] = process.argv.slice(2);
const t = (s) => { const [h, m, r] = s.replace(",", ".").split(":"); return +h * 3600 + +m * 60 + +r; };
const words = [];
for (const block of readFileSync(src, "utf8").replace(/\r/g, "").split(/\n\n+/)) {
  const lines = block.trim().split("\n");
  const i = lines.findIndex((l) => l.includes("-->"));
  if (i < 0) continue;
  const [a, b] = lines[i].split("-->").map((x) => t(x.trim().split(" ")[0]));
  const toks = lines.slice(i + 1).join(" ").replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean);
  const total = toks.reduce((s, w) => s + w.length + 1, 0);
  let cur = a;
  for (const w of toks) {
    const d = ((w.length + 1) / total) * (b - a);
    words.push({ word: w, start: +cur.toFixed(2), end: +(cur + d).toFixed(2) });
    cur += d;
  }
}
writeFileSync(out, JSON.stringify(words, null, 1));
console.log(`${words.length} so'z -> ${out}`);
