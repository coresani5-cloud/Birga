// Kotib — o'zbekcha ovoz: matnni ovozga aylantirish (TTS), nutqni matnga (STT)
// va telefon uchun matnni o'qishga tayyorlash (raqam, vaqt, sana, narxni so'z bilan).
// Provayderlar: Aisha (aisha.group), Muxlisa (muxlisa.uz), Microsoft Azure.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('./store');

const TTS_DIR = path.join(store.DIR, 'tts');
const AISHA = process.env.AISHA_BASE || 'https://back.aisha.group'; // AISHA_BASE — faqat test uchun
const MUXLISA = 'https://service.muxlisa.uz/api/v2';
const ELEVEN = process.env.ELEVENLABS_BASE || 'https://api.elevenlabs.io'; // ELEVENLABS_BASE — faqat test uchun

// ---------- Raqamlarni o'zbekcha so'z bilan ----------
const ONES = ['nol', 'bir', 'ikki', 'uch', "to'rt", 'besh', 'olti', 'yetti', 'sakkiz', "to'qqiz"];
const TENS = ['', "o'n", 'yigirma', "o'ttiz", 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', "to'qson"];
function under1000(n) {
  const out = [], h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
  if (h) out.push(h === 1 ? 'yuz' : ONES[h] + ' yuz');
  if (t) out.push(TENS[t]);
  if (o) out.push(ONES[o]);
  return out.join(' ');
}
function uzNumber(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 0) return 'nol';
  const parts = [], units = [[1e9, 'milliard'], [1e6, 'million'], [1e3, 'ming']];
  for (const [v, w] of units) {
    const k = Math.floor(n / v);
    if (k) { parts.push(k === 1 && v === 1e3 ? 'ming' : under1000(k) + ' ' + w); n %= v; }
  }
  if (n) parts.push(under1000(n));
  return parts.join(' ');
}
const uzOrdinal = (n) => { const w = uzNumber(n); return w + (/[aeiou]$/.test(w) ? 'nchi' : 'inchi'); };
const MONTHS = 'yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr';
const clock = (h, m) => uzNumber(Number(h)) + (Number(m) ? ' ' + uzNumber(Number(m)) : '');

// Telefonda o'qish uchun: "14:00–18:00" → "o'n to'rtdan o'n sakkizgacha", "2-noyabr" → "ikkinchi noyabr"
function uzSpeech(text) {
  let t = String(text || '')
    .replace(/[*_#`~>|]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/g, (_, a, b, c, d) => `${clock(a, b)}dan ${clock(c, d)}gacha`)
    .replace(/(\d{1,2}):(\d{2})(?:\s*-?\s*(da|ga|dan|gacha)(?![a-z']))?/g, (_, h, m, suf) => clock(h, m) + (suf || ''))
    .replace(new RegExp(`(\\d{1,2})\\s*-\\s*(${MONTHS})`, 'gi'), (_, d, m) => `${uzOrdinal(d)} ${m.toLowerCase()}`)
    .replace(/(\d{1,4})\s*-\s*(yil|yilda|yildan|uy|qavat|xona|kvartal|sinf)/gi, (_, n, w) => `${uzOrdinal(n)} ${w}`)
    .replace(/\+?\d[\d\s-]{8,}\d/g, (p) => p.replace(/\D/g, '').split('').map((c) => ONES[c]).join(' '))
    .replace(/\d{1,3}(?:[  ]\d{3})+/g, (n) => n.replace(/\D/g, ''))
    .replace(/\d+/g, (n) => uzNumber(n))
    .replace(/\s+/g, ' ')
    .trim();
  return t;
}

// ---------- Matn → ovoz (TTS) ----------
// Ishlamay qolgan provayder 10 daqiqaga chetlatiladi — keyingisi (yoki Twilio ovozi) ishlatiladi
const down = new Map();
const lastError = {};
const isDown = (p) => (down.get(p) || 0) > Date.now();
function ttsProviders(lang) {
  if (lang !== 'uz' && lang !== 'ru') return [];
  const out = [];
  // Egasining klonlangan ovozi (ElevenLabs) — birinchi o'rinda
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) out.push('elevenlabs');
  if (process.env.AISHA_API_KEY) out.push('aisha');
  if (lang === 'uz' && process.env.MUXLISA_API_KEY) out.push('muxlisa');
  if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) out.push('azure');
  return out;
}
function ttsProvider(lang) {
  const list = ttsProviders(lang);
  return list.find((p) => !isDown(p)) || null;
}
// Ruscha uchun Twilio'ning tabiiy ovozi yetarli — tashqi provayder faqat o'zbekcha uchun (TTS_RU=1 bo'lsa ruscha ham)
const ttsOn = (lang) => !!ttsProvider(lang) && (lang === 'uz' || process.env.TTS_RU === '1');
const resetDown = () => { down.clear(); for (const k of Object.keys(lastError)) delete lastError[k]; };

// Aisha javobidan audioni olish: to'g'ridan-to'g'ri audio, base64, havola yoki navbatdagi vazifa
async function aishaAudio(r, key, ms) {
  const ct = r.headers.get('content-type') || '';
  if (ct.startsWith('audio/')) return { data: Buffer.from(await r.arrayBuffer()), ext: /mpeg|mp3/.test(ct) ? 'mp3' : 'wav' };
  const j = await r.json().catch(() => ({}));
  const b64 = j.audio_base64 || (typeof j.audio === 'string' && !/^https?:|^\//.test(j.audio) ? j.audio : null);
  if (b64) return { data: Buffer.from(b64, 'base64'), ext: 'wav' };
  const p = j.audio_path || j.audio_url || j.url || j.file || (typeof j.audio === 'string' ? j.audio : null);
  if (p) {
    const url = new URL(p, AISHA);
    if (url.protocol === 'http:' && AISHA.startsWith('https:') && url.hostname === new URL(AISHA).hostname) url.protocol = 'https:';
    const a = await fetch(url, { headers: url.origin === new URL(AISHA).origin ? { 'X-Api-Key': key } : {}, signal: AbortSignal.timeout(ms) });
    if (!a.ok) throw new Error('aisha audio ' + a.status);
    return { data: Buffer.from(await a.arrayBuffer()), ext: /\.mp3(\?|$)/.test(url.pathname) ? 'mp3' : 'wav' };
  }
  if (j.id) {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      await new Promise((res) => setTimeout(res, 700));
      const q = await fetch(`${AISHA}/api/v1/tts/get/${encodeURIComponent(j.id)}/`, { headers: { 'X-Api-Key': key }, signal: AbortSignal.timeout(Math.max(1000, until - Date.now())) });
      if ((q.headers.get('content-type') || '').startsWith('audio/') || q.ok) {
        const out = await aishaAudio(q, key, Math.max(1000, until - Date.now())).catch(() => null);
        if (out) return out;
      }
    }
    throw new Error('aisha: vaqt tugadi');
  }
  throw new Error('aisha: javobda audio yo‘q');
}
const errText = async (r) => { const t = await r.text().catch(() => ''); const m = /<title>([^<]*)<\/title>/i.exec(t); return (m ? m[1] : t).replace(/\s+/g, ' ').slice(0, 120); };
async function synthAisha(text, lang, ms) {
  const key = process.env.AISHA_API_KEY;
  const fields = { transcript: text.slice(0, 950), language: lang };
  if (lang === 'uz') {
    if (process.env.AISHA_VOICE_ID) fields.voice_id = process.env.AISHA_VOICE_ID; // egasining klonlangan ovozi
    else { fields.model = process.env.AISHA_MODEL || 'Gulnoza'; fields.mood = process.env.AISHA_MOOD || 'Neutral'; }
    fields.speed = process.env.AISHA_SPEED || '1';
  }
  const headers = { 'X-Api-Key': key, Accept: 'audio/wav, audio/mpeg, application/json' };
  // 1) JSON shaklida (ko'pchilik loyihalar shunday ishlatadi), 2) bo'lmasa — forma shaklida
  let r = await fetch(`${AISHA}/api/v1/tts/post/`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(fields), signal: AbortSignal.timeout(ms) });
  if (!r.ok && r.status !== 401 && r.status !== 402) {
    const first = `${r.status} ${await errText(r)}`;
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.set(k, String(v));
    r = await fetch(`${AISHA}/api/v1/tts/post/`, { method: 'POST', headers, body: form, signal: AbortSignal.timeout(ms) });
    if (!r.ok) throw new Error(`aisha ${first} | ${r.status} ${await errText(r)}`);
  } else if (!r.ok) throw new Error(r.status === 402 ? "aisha: balans yetarli emas" : "aisha: kalit noto'g'ri");
  return aishaAudio(r, key, ms);
}
async function synthMuxlisa(text, lang, ms) {
  const r = await fetch(`${MUXLISA}/tts`, {
    method: 'POST', headers: { 'x-api-key': process.env.MUXLISA_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 5000), speaker: Number(process.env.MUXLISA_SPEAKER || 0) }), signal: AbortSignal.timeout(ms),
  });
  if (!r.ok) throw new Error(`muxlisa ${r.status} ${await errText(r)}`);
  return { data: Buffer.from(await r.arrayBuffer()), ext: 'wav' };
}
async function synthAzure(text, lang, ms) {
  const voice = lang === 'ru' ? process.env.AZURE_VOICE_RU || 'ru-RU-SvetlanaNeural' : process.env.AZURE_VOICE_UZ || 'uz-UZ-MadinaNeural';
  const loc = voice.slice(0, 5);
  const esc = (s) => s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
  const r = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm', 'User-Agent': 'kotib' },
    body: `<speak version="1.0" xml:lang="${loc}"><voice name="${voice}">${esc(text)}</voice></speak>`, signal: AbortSignal.timeout(ms),
  });
  if (!r.ok) throw new Error(`azure ${r.status} ${await errText(r)}`);
  return { data: Buffer.from(await r.arrayBuffer()), ext: 'wav' };
}
async function synthEleven(text, lang, ms) {
  const r = await fetch(`${ELEVEN}/v1/text-to-speech/${encodeURIComponent(process.env.ELEVENLABS_VOICE_ID)}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: text.slice(0, 2500), model_id: process.env.ELEVENLABS_MODEL || 'eleven_v3', voice_settings: { stability: 0.5, similarity_boost: 0.85 } }),
    signal: AbortSignal.timeout(ms),
  });
  if (!r.ok) throw new Error(`elevenlabs ${r.status} ${await errText(r)}`);
  return { data: Buffer.from(await r.arrayBuffer()), ext: 'mp3' };
}
// Egasining ovozini klonlash (ElevenLabs Instant Voice Cloning). Qaytaradi: voice_id
async function cloneVoice(buf, name) {
  if (!process.env.ELEVENLABS_API_KEY) throw new Error('Avval "Ulanishlar"ga ElevenLabs kalitini kiriting');
  const form = new FormData();
  form.set('name', String(name || 'Kotib ovozi').slice(0, 60));
  form.set('description', "Kotib uchun biznes egasining o'z ovozi (o'zbek tili)");
  form.set('labels', JSON.stringify({ language: 'uz', use: 'kotib' }));
  form.append('files', new Blob([buf], { type: 'audio/wav' }), 'sample.wav');
  const r = await fetch(`${ELEVEN}/v1/voices/add`, { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, body: form, signal: AbortSignal.timeout(60000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = j.detail?.message || j.detail?.status || (typeof j.detail === 'string' ? j.detail : '') || r.status;
    throw new Error(r.status === 401 ? "ElevenLabs kaliti noto'g'ri" : /subscription|plan|instant/i.test(String(msg)) ? "Ovoz klonlash ElevenLabs'ning pullik rejasida ishlaydi (Starter, ~5$)" : 'ElevenLabs: ' + msg);
  }
  if (!j.voice_id) throw new Error('ElevenLabs voice_id qaytarmadi');
  return j.voice_id;
}
const SYNTH = { elevenlabs: synthEleven, aisha: synthAisha, muxlisa: synthMuxlisa, azure: synthAzure };

const known = new Map(); // id -> fayl nomi
const inflight = new Map();
// Ovoz faylini tayyorlaydi (keshdan yoki provayderdan). Qaytaradi: fayl nomi ("<hash>.wav") yoki null
async function tts(text, lang = 'uz', ms = 8000) {
  if (!(lang === 'uz' || process.env.TTS_RU === '1')) return null;
  const spoken = lang === 'uz' ? uzSpeech(text) : String(text).replace(/[*_#`]/g, '');
  if (!spoken) return null;
  for (const prov of ttsProviders(lang)) {
    if (isDown(prov)) continue;
    const voiceId = prov === 'elevenlabs' ? process.env.ELEVENLABS_VOICE_ID : prov === 'aisha' ? process.env.AISHA_VOICE_ID || process.env.AISHA_MODEL || 'Gulnoza' : prov === 'muxlisa' ? process.env.MUXLISA_SPEAKER || '0' : process.env.AZURE_VOICE_UZ || '';
    const id = crypto.createHash('sha256').update([prov, voiceId, lang, spoken].join('|')).digest('hex').slice(0, 40);
    if (known.has(id)) return known.get(id);
    const cached = ['wav', 'mp3'].map((e) => `${id}.${e}`).find((n) => fs.existsSync(path.join(TTS_DIR, n)));
    if (cached) { known.set(id, cached); return cached; }
    if (!inflight.has(id)) {
      inflight.set(id, (async () => {
        try {
          const { data, ext } = await SYNTH[prov](spoken, lang, ms);
          if (!data || data.length < 100) throw new Error(prov + ': bo‘sh audio');
          fs.mkdirSync(TTS_DIR, { recursive: true });
          const name = `${id}.${ext}`;
          fs.writeFileSync(path.join(TTS_DIR, name), data);
          known.set(id, name);
          delete lastError[prov];
          return name;
        } catch (e) {
          lastError[prov] = e.message;
          down.set(prov, Date.now() + 10 * 60e3);
          console.error(`TTS (${prov}, 10 daqiqaga o'chirildi):`, e.message);
          return null;
        } finally { inflight.delete(id); }
      })());
    }
    const name = await inflight.get(id);
    if (name) return name;
  }
  return null;
}
function ttsFile(name) {
  if (!/^[a-f0-9]{40}\.(wav|mp3)$/.test(name)) return null;
  const f = path.join(TTS_DIR, name);
  return fs.existsSync(f) ? f : null;
}

// ---------- Nutq → matn (STT) ----------
const sttProvider = (lang) => (lang === 'uz' || lang === 'ru') && (process.env.AISHA_API_KEY ? 'aisha' : lang === 'uz' && process.env.MUXLISA_API_KEY ? 'muxlisa' : null);
const sttOn = (lang) => process.env.STT_MODE !== 'twilio' && lang === 'uz' && !!sttProvider(lang);

async function stt(buf, lang = 'uz', ms = 9000) {
  const prov = sttProvider(lang);
  if (!prov) return '';
  return sttWith(prov, buf, 'audio/wav', lang, ms);
}
async function sttWith(prov, buf, mime, lang, ms) {
  const until = Date.now() + ms;
  const left = () => Math.max(500, until - Date.now());
  const form = new FormData();
  const ext = /ogg|opus/.test(mime) ? 'ogg' : /webm/.test(mime) ? 'webm' : /mpeg|mp3/.test(mime) ? 'mp3' : 'wav';
  form.set('audio', new Blob([buf], { type: mime }), 'audio.' + ext);
  if (prov === 'muxlisa') {
    const r = await fetch(`${MUXLISA}/stt`, { method: 'POST', headers: { 'x-api-key': process.env.MUXLISA_API_KEY }, body: form, signal: AbortSignal.timeout(left()) });
    if (!r.ok) throw new Error(`muxlisa stt ${r.status} ${(await r.text()).slice(0, 150)}`);
    const j = await r.json().catch(() => ({}));
    return String(j.text || '').trim();
  }
  form.set('language', lang);
  form.set('has_diarization', 'false');
  const key = process.env.AISHA_API_KEY;
  const r = await fetch(`${AISHA}/api/v2/stt/post/`, { method: 'POST', headers: { 'x-api-key': key }, body: form, signal: AbortSignal.timeout(left()) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`aisha stt ${r.status} ${j.detail || j.error || ''}`);
  if (j.transcript) return String(j.transcript).trim();
  if (!j.id) throw new Error('aisha stt: javob yo‘q');
  while (Date.now() < until) {
    await new Promise((res) => setTimeout(res, 600));
    const p = await fetch(`${AISHA}/api/v2/stt/get/${encodeURIComponent(j.id)}/`, { headers: { 'x-api-key': key }, signal: AbortSignal.timeout(left()) });
    const d = await p.json().catch(() => ({}));
    if (d.status === 'SUCCESS') return String(d.transcript || '').trim();
    if (d.status === 'FAILED') throw new Error('aisha stt: FAILED');
  }
  throw new Error('aisha stt: vaqt tugadi');
}

// Gemini — audioni bevosita tushunadi (bepul kalit bilan ishlaydi)
async function geminiTranscribe(buf, mime, ms) {
  const model = process.env.GEMINI_STT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mime, data: buf.toString('base64') } }, { text: "Bu mijozning ovozli xabari (o'zbek yoki rus tilida). Uni so'zma-so'z, o'sha tilda yozib ber. Faqat matnni qaytar, izohsiz. Agar nutq bo'lmasa, bo'sh qaytar." }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 600, ...(/2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
    }),
    signal: AbortSignal.timeout(ms),
  });
  if (!r.ok) throw new Error(`gemini stt ${r.status} ${(await r.text()).slice(0, 120)}`);
  const j = await r.json();
  return String(j?.candidates?.[0]?.content?.parts?.map((x) => x.text || '').join('') || '').trim();
}
// Istalgan audio (wav, ogg, webm) → matn. Mavjud provayderlarni navbat bilan sinaydi.
async function transcribe(buf, mime = 'audio/wav', lang = 'uz', ms = 12000) {
  const order = [];
  const wav = /wav/.test(mime);
  if (process.env.AISHA_API_KEY && wav) order.push('aisha');
  if (process.env.MUXLISA_API_KEY) order.push('muxlisa');
  if (process.env.GEMINI_API_KEY) order.push('gemini');
  if (process.env.AISHA_API_KEY && !wav) order.push('aisha');
  const errs = [];
  for (const p of order) {
    try {
      const text = p === 'gemini' ? await geminiTranscribe(buf, mime, ms) : await sttWith(p, buf, mime, lang, ms);
      if (text) return text;
    } catch (e) { errs.push(e.message); }
  }
  if (errs.length) console.error('STT:', errs.join(' | '));
  if (!order.length) throw new Error("Ovozni tanish uchun Gemini, Aisha yoki Muxlisa kaliti kerak");
  return '';
}

// Twilio yozuvini yuklab olish (yozuv tayyor bo'lishi uchun bir necha marta urinadi)
async function twilioRecording(url) {
  const auth = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url + '.wav', { headers: process.env.TWILIO_ACCOUNT_SID ? { Authorization: auth } : {}, signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (r && r.ok) return Buffer.from(await r.arrayBuffer());
    await new Promise((res) => setTimeout(res, 400));
  }
  throw new Error('Twilio yozuvini yuklab bo‘lmadi');
}
// Maxfiylik: yozuvni Twilio'dan o'chiramiz (matni suhbat tarixida qoladi)
function deleteRecording(url) {
  if (!process.env.TWILIO_ACCOUNT_SID || !url) return;
  const auth = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  fetch(url + '.json', { method: 'DELETE', headers: { Authorization: auth }, signal: AbortSignal.timeout(8000) }).catch(() => {});
}

const status = () => { const t = ttsProvider('uz'); return { errors: { ...lastError }, tts: t, stt: sttOn('uz') ? sttProvider('uz') : null, cloned: t === 'elevenlabs' || (t === 'aisha' && !!process.env.AISHA_VOICE_ID), eleven: !!process.env.ELEVENLABS_API_KEY }; };

module.exports = { transcribe, resetDown, cloneVoice, uzNumber, uzOrdinal, uzSpeech, tts, ttsOn, ttsFile, stt, sttOn, twilioRecording, deleteRecording, status };
