// Birga — media qayta kodlash (ffmpeg)
// Ovozli va video xabarlar har qanday telefonda (Android, iPhone, kompyuter) ochilishi uchun
// universal formatga o'tkaziladi: ovoz -> M4A (AAC), video -> MP4 (H.264 + AAC).
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const available = (() => { try { return spawnSync(FFMPEG, ['-version']).status === 0; } catch { return false; } })();

function run(args, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    const t = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('ffmpeg vaqt tugadi')); }, timeoutMs);
    p.on('close', (c) => { clearTimeout(t); c === 0 ? resolve() : reject(new Error('ffmpeg: ' + err.slice(-300))); });
    p.on('error', (e) => { clearTimeout(t); reject(e); });
  });
}

function probeDuration(file) {
  try {
    const r = spawnSync(FFMPEG.replace(/ffmpeg$/, 'ffprobe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
    const d = parseFloat(String(r.stdout));
    return isFinite(d) ? d : null;
  } catch { return null; }
}

// kind: voice | round | video
async function normalize(file, kind, mime) {
  if (!available) return null;
  const base = file.replace(/\.[^.\/]+$/, '');
  let out, args;
  if (kind === 'voice') {
    if (/audio\/(mp4|m4a|aac|mpeg)/.test(mime)) return null;
    out = base + '.m4a';
    args = ['-i', file, '-vn', '-ac', '1', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', out];
  } else if (kind === 'round') {
    out = base + '-r.mp4';
    // kvadrat 480x480, markazdan kesish
    args = ['-i', file, '-vf', "crop='min(iw,ih)':'min(iw,ih)',scale=480:480,fps=30", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26',
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '80k', '-ac', '1', '-movflags', '+faststart', out];
  } else if (kind === 'video') {
    if (/video\/mp4/.test(mime)) return null; // mp4 ko'p hollarda allaqachon mos
    out = base + '-v.mp4';
    args = ['-i', file, '-vf', "scale='min(1280,iw)':-2", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24',
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out];
  } else return null;
  await run(args);
  const size = fs.statSync(out).size;
  // asl fayl (webm/ogg) zaxira sifatida qoladi: AAC/H.264 ni o'qiy olmaydigan kamdan-kam brauzerlar uchun
  return { file: out, name: path.basename(out), alt: path.basename(file), mime: kind === 'voice' ? 'audio/mp4' : 'video/mp4', size, duration: probeDuration(out) };
}

module.exports = { normalize, available };
