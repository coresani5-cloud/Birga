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
    .replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => clock(h, m))
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
function ttsProvider(lang) {
  if (lang !== 'uz' && lang !== 'ru') return null;
  if (process.env.AISHA_API_KEY) return 'aisha';
  if (lang === 'uz' && process.env.MUXLISA_API_KEY) return 'muxlisa';
  if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) return 'azure';
  return null;
}
// Ruscha uchun Twilio'ning tabiiy ovozi yetarli — tashqi provayder faqat o'zbekcha uchun (TTS_RU=1 bo'lsa ruscha ham)
const ttsOn = (lang) => !!ttsProvider(lang) && (lang === 'uz' || process.env.TTS_RU === '1');

async function synthAisha(text, lang, ms) {
  const key = process.env.AISHA_API_KEY;
  const form = new FormData();
  form.set('transcript', text.slice(0, 950));
  form.set('language', lang);
  if (lang === 'uz') {
    form.set('speed', process.env.AISHA_SPEED || '1');
    if (process.env.AISHA_VOICE_ID) form.set('voice_id', process.env.AISHA_VOICE_ID); // egasining klonlangan ovozi
    else { form.set('model', process.env.AISHA_MODEL || 'Gulnoza'); form.set('mood', process.env.AISHA_MOOD || 'Neutral'); }
  }
  const r = await fetch(`${AISHA}/api/v1/tts/post/`, { method: 'POST', headers: { 'X-Api-Key': key, 'Accept-Language': lang }, body: form, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`aisha ${r.status} ${(await r.text()).slice(0, 150)}`);
  const j = await r.json();
  const p = j.audio_path || j.audio_url;
  if (!p) throw new Error('aisha: audio_path yo‘q');
  const url = new URL(p, AISHA);
  const a = await fetch(url, { headers: url.origin === AISHA ? { 'X-Api-Key': key } : {}, signal: AbortSignal.timeout(ms) });
  if (!a.ok) throw new Error('aisha audio ' + a.status);
  return { data: Buffer.from(await a.arrayBuffer()), ext: /\.mp3(\?|$)/.test(url.pathname) ? 'mp3' : 'wav' };
}
async function synthMuxlisa(text, lang, ms) {
  const r = await fetch(`${MUXLISA}/tts`, {
    method: 'POST', headers: { 'x-api-key': process.env.MUXLISA_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 5000), speaker: Number(process.env.MUXLISA_SPEAKER || 0) }), signal: AbortSignal.timeout(ms),
  });
  if (!r.ok) throw new Error(`muxlisa ${r.status} ${(await r.text()).slice(0, 150)}`);
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
  if (!r.ok) throw new Error(`azure ${r.status} ${(await r.text()).slice(0, 150)}`);
  return { data: Buffer.from(await r.arrayBuffer()), ext: 'wav' };
}
const SYNTH = { aisha: synthAisha, muxlisa: synthMuxlisa, azure: synthAzure };

const known = new Map(); // id -> fayl nomi
const inflight = new Map();
// Ovoz faylini tayyorlaydi (keshdan yoki provayderdan). Qaytaradi: fayl nomi ("<hash>.wav") yoki null
async function tts(text, lang = 'uz', ms = 8000) {
  const prov = ttsOn(lang) && ttsProvider(lang);
  if (!prov) return null;
  const spoken = lang === 'uz' ? uzSpeech(text) : String(text).replace(/[*_#`]/g, '');
  if (!spoken) return null;
  const voiceId = prov === 'aisha' ? process.env.AISHA_VOICE_ID || process.env.AISHA_MODEL || 'Gulnoza' : prov === 'muxlisa' ? process.env.MUXLISA_SPEAKER || '0' : process.env.AZURE_VOICE_UZ || '';
  const id = crypto.createHash('sha256').update([prov, voiceId, lang, spoken].join('|')).digest('hex').slice(0, 40);
  if (known.has(id)) return known.get(id);
  for (const ext of ['wav', 'mp3']) {
    if (fs.existsSync(path.join(TTS_DIR, `${id}.${ext}`))) { known.set(id, `${id}.${ext}`); return `${id}.${ext}`; }
  }
  if (inflight.has(id)) return inflight.get(id);
  const job = (async () => {
    try {
      const { data, ext } = await SYNTH[prov](spoken, lang, ms);
      if (!data || data.length < 100) throw new Error(prov + ': bo‘sh audio');
      fs.mkdirSync(TTS_DIR, { recursive: true });
      const name = `${id}.${ext}`;
      fs.writeFileSync(path.join(TTS_DIR, name), data);
      known.set(id, name);
      return name;
    } catch (e) { console.error('TTS:', e.message); return null; }
    finally { inflight.delete(id); }
  })();
  inflight.set(id, job);
  return job;
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
  const until = Date.now() + ms;
  const left = () => Math.max(500, until - Date.now());
  const form = new FormData();
  form.set('audio', new Blob([buf], { type: 'audio/wav' }), 'call.wav');
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

const status = () => ({ tts: ttsProvider('uz'), stt: sttOn('uz') ? sttProvider('uz') : null, cloned: !!process.env.AISHA_VOICE_ID && ttsProvider('uz') === 'aisha' });

module.exports = { uzNumber, uzOrdinal, uzSpeech, tts, ttsOn, ttsFile, stt, sttOn, twilioRecording, deleteRecording, status };
