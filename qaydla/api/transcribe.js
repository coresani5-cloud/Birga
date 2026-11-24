// Qaydla — bulutli nutqni matnga aylantirish (Vercel Function).
// Kalitlar Vercel → Settings → Environment Variables da saqlanadi:
//   ELEVENLABS_API_KEY  (tavsiya: o'zbek tilini yaxshi taniydi)  yoki  OPENAI_API_KEY
export const config = { maxDuration: 60 };

const MAX_BYTES = 4 * 1024 * 1024;
const hits = new Map(); // oddiy cheklov: IP boshiga 10 daqiqada 150 so'rov

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const provider = () => (process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : process.env.OPENAI_API_KEY ? 'openai' : null);

function allowed(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    const o = new URL(origin), self = new URL(req.url);
    return o.host === self.host || o.hostname === 'localhost' || /^qaydla[\w-]*\.vercel\.app$/.test(o.hostname);
  } catch { return false; }
}

function limited(req) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'x';
  const now = Date.now(), win = 10 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 150;
}

export function GET() {
  return json({ ok: true, provider: provider() });
}

export async function POST(req) {
  if (!allowed(req)) return json({ error: 'forbidden' }, 403);
  if (limited(req)) return json({ error: 'rate_limited' }, 429);
  const p = provider();
  if (!p) return json({ error: 'no_key' }, 503);

  const lang = new URL(req.url).searchParams.get('lang') === 'ru' ? 'ru' : 'uz';
  const buf = await req.arrayBuffer();
  if (!buf.byteLength) return json({ error: 'empty' }, 400);
  if (buf.byteLength > MAX_BYTES) return json({ error: 'too_large' }, 413);
  const type = (req.headers.get('content-type') || 'audio/webm').split(';')[0];
  const ext = type.includes('mp4') || type.includes('m4a') || type.includes('aac') ? 'm4a' : type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : 'webm';
  const file = new Blob([buf], { type });

  try {
    let r, text;
    if (p === 'elevenlabs') {
      const fd = new FormData();
      fd.append('model_id', process.env.ELEVENLABS_STT_MODEL || 'scribe_v1');
      fd.append('language_code', lang === 'ru' ? 'rus' : 'uzb');
      fd.append('tag_audio_events', 'false');
      fd.append('diarize', 'false');
      fd.append('file', file, 'audio.' + ext);
      r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, body: fd });
      const j = await r.json().catch(() => ({}));
      text = j.text;
    } else {
      const fd = new FormData();
      fd.append('model', process.env.OPENAI_STT_MODEL || 'gpt-4o-transcribe');
      fd.append('language', lang);
      fd.append('response_format', 'json');
      fd.append('file', file, 'audio.' + ext);
      r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { authorization: 'Bearer ' + process.env.OPENAI_API_KEY }, body: fd });
      const j = await r.json().catch(() => ({}));
      text = j.text;
    }
    if (!r.ok) return json({ error: 'upstream', status: r.status }, r.status === 429 ? 429 : 502);
    return json({ text: (text || '').trim(), provider: p });
  } catch {
    return json({ error: 'upstream' }, 502);
  }
}
