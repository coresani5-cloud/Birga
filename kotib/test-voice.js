// Kotib — o'zbekcha ovoz tekshiruvi: node test-voice.js
// Aisha va Twilio o'rniga soxta server ishlatiladi; to'liq qo'ng'iroq jarayoni sinaladi.
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const PORT = 3997, MOCK = 3998;
const base = `http://localhost:${PORT}`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kotib-voice-'));
const spoken = [];
const twilioHooks = {};
const cloned = [];
let aishaFail = false;
const tgSent = [];
const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(3000)]);

const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => body += c.toString('latin1'));
  req.on('end', () => {
    if (req.url.startsWith('/2010-04-01/Accounts/AC1/')) {
      if (req.headers.authorization !== 'Basic ' + Buffer.from('AC1:tok').toString('base64')) { res.writeHead(401); return res.end('{}'); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (req.method === 'GET') return res.end(JSON.stringify({ incoming_phone_numbers: [{ sid: 'PN' + 'a'.repeat(32), phone_number: '+15551234567', friendly_name: 'Mening raqamim', voice_url: twilioHooks.voice || '', capabilities: { sms: true } }] }));
      const f = new URLSearchParams(body); Object.assign(twilioHooks, { voice: f.get('VoiceUrl'), status: f.get('StatusCallback'), sms: f.get('SmsUrl') });
      return res.end(JSON.stringify({ sid: 'PN' + 'a'.repeat(32), phone_number: '+15551234567' }));
    }
    if (req.url.startsWith('/botTGTOKEN/')) {
      const method = req.url.split('/')[2];
      const o = body ? JSON.parse(Buffer.from(body, 'latin1').toString('utf8')) : {};
      if (method === 'sendMessage') tgSent.push(o.text);
      const result = method === 'getMe' ? { username: 'savetir_bot' } : method === 'getFile' ? { file_path: 'voice/a.ogg' } : true;
      res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: true, result }));
    }
    if (req.url === '/file/botTGTOKEN/voice/a.ogg') { res.writeHead(200, { 'Content-Type': 'audio/ogg' }); return res.end(Buffer.alloc(4000, 7)); }
    if (req.url.startsWith('/v1/')) {
      if (req.headers['xi-api-key'] !== 'el-key') { res.writeHead(401); return res.end('{}'); }
      if (req.url === '/v1/voices/add') { cloned.push(body.length); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ voice_id: 'VOICE_ME' })); }
      if (req.url.startsWith('/v1/text-to-speech/VOICE_ME')) { spoken.push('ELEVEN:' + JSON.parse(body).text); res.writeHead(200, { 'Content-Type': 'audio/mpeg' }); return res.end(Buffer.alloc(2000, 1)); }
    }
    if (req.headers['x-api-key'] !== 'test-key' && !req.url.startsWith('/rec/') && !req.url.startsWith('/media/')) { res.writeHead(401); return res.end('{}'); }
    if (req.url === '/api/v1/tts/post/') {
      if (aishaFail) { res.writeHead(500, { 'Content-Type': 'text/html' }); return res.end('<html><title>Server Error (500)</title></html>'); }
      let tr = '', vid = null;
      if (body.trim().startsWith('{')) { const o = JSON.parse(Buffer.from(body, 'latin1').toString('utf8')); tr = o.transcript; vid = o.voice_id; }
      else { const m = /name="transcript"\r\n\r\n([\s\S]*?)\r\n--/.exec(body); tr = Buffer.from(m ? m[1] : '', 'latin1').toString('utf8'); const v = /name="voice_id"\r\n\r\n(\w+)/.exec(body); vid = v && v[1]; }
      spoken.push(tr);
      if (vid) spoken.push('VOICE_ID=' + vid);
      res.writeHead(201, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ audio_path: '/media/a.wav' }));
    }
    if (req.url === '/media/a.wav') { res.writeHead(200, { 'Content-Type': 'audio/wav' }); return res.end(wav); }
    if (req.url === '/api/v2/stt/post/') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ id: 't1' })); }
    if (req.url === '/api/v2/stt/get/t1/') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ status: 'SUCCESS', transcript: "Ertaga bo'sh vaqt bormi?" })); }
    if (req.url === '/rec/R1.wav') { res.writeHead(200, { 'Content-Type': 'audio/wav' }); return res.end(wav); }
    res.writeHead(404); res.end();
  });
}).listen(MOCK);

const env = { ...process.env, PORT: String(PORT), DATA_DIR: dir, DATABASE_URL: '', GEMINI_API_KEY: '', GROQ_API_KEY: '', AI_API_URL: '', TWILIO_AUTH_TOKEN: '', TWILIO_ACCOUNT_SID: '', ADMIN_PASSWORD: 'parol123', AISHA_API_KEY: '', PUBLIC_URL: '', AISHA_BASE: `http://localhost:${MOCK}`, TWILIO_API_BASE: `http://localhost:${MOCK}`, ELEVENLABS_BASE: `http://localhost:${MOCK}`, TELEGRAM_API_BASE: `http://localhost:${MOCK}`, TG_BOT_TOKEN: '', TG_CHAT_ID: '', ELEVENLABS_API_KEY: '', ELEVENLABS_VOICE_ID: '', TWILIO_FROM: '' };
const srv = spawn(process.execPath, [path.join(__dirname, 'server.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
let token = '';
async function j(url, body, method) {
  const r = await fetch(base + url, { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
}
const form = async (url, p) => (await fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(p) })).text();

async function main() {
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/health'); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  token = (await j('/api/auth/login', { password: 'parol123' })).data.token;
  const hours = {}; for (let d = 0; d < 7; d++) hours[d] = { open: '09:00', close: '18:00', off: false, breaks: [{ from: '13:00', to: '14:00' }] };
  await j('/api/settings', { hours }, 'PUT');

  // Ovoz ulanmaganda — Twilio ovozi
  let x = await form('/twilio/voice', { CallSid: 'C0', From: '+998900000000' });
  assert.match(x, /<Say voice="Polly.Filiz"/);
  assert.equal((await j('/api/voice/test', { text: 'salom' })).status, 400);

  // Ilovadan Aisha kalitini ulaymiz
  const c = (await j('/api/connections', { AISHA_API_KEY: 'test-key', PUBLIC_URL: base }, 'PUT')).data;
  assert.equal(c.voice.tts, 'aisha');
  assert.equal(c.voice.stt, 'aisha');
  assert.ok(c.keys.find((k) => k.key === 'AISHA_API_KEY').value.startsWith('••••'), 'kalit yashirilishi kerak');

  // Ovozni sinash: raqamlar so'z bilan o'qiladi
  const t = (await j('/api/voice/test', { text: "Soat 14:30 da, narxi 250 000 so'm" })).data;
  assert.match(t.spoken, /o'n to'rt o'ttiz.*ikki yuz ellik ming so'm/);
  assert.equal((await fetch(base + t.url)).status, 200);

  // Qo'ng'iroq: til menyusi o'zbekcha ovozda
  x = await form('/twilio/voice', { CallSid: 'C1', From: '+998901112233' });
  assert.match(x, new RegExp(`<Play>${base}/tts/[a-f0-9]{40}\\.wav</Play>`), x);
  assert.match(x, /<Say voice="Polly.Tatyana"/); // ruscha qism — Twilio ovozi
  // 1 — o'zbekcha: endi Twilio emas, yozib olinadi (Aisha taniydi)
  x = await form('/twilio/voice/turn?menu=1', { CallSid: 'C1', From: '+998901112233', Digits: '1' });
  assert.match(x, /<Record action="\/twilio\/voice\/rec"/, x);
  // Mijoz gapirdi → Aisha STT → javob o'zbekcha ovozda
  spoken.length = 0;
  x = await form('/twilio/voice/rec', { CallSid: 'C1', From: '+998901112233', RecordingUrl: `http://localhost:${MOCK}/rec/R1`, RecordingDuration: '3' });
  assert.match(x, /<Play>/);
  assert.ok(spoken.some((s) => /to'qqizdan o'n uchgacha/.test(s)), 'vaqt so‘z bilan aytilishi kerak: ' + spoken.join(' | '));
  const conv = (await j('/api/conversations/call:C1')).data;
  assert.ok(conv.messages.some((m) => m.role === 'user' && /Ertaga/.test(m.content)), 'tanilgan gap tarixda saqlanadi');

  // Klonlangan ovoz: AISHA_VOICE_ID
  await j('/api/connections', { AISHA_VOICE_ID: '777' }, 'PUT');
  assert.equal((await j('/api/connections')).data.voice.cloned, true);
  spoken.length = 0;
  await j('/api/voice/test', { text: 'Yangi matn' });
  assert.ok(spoken.includes('VOICE_ID=777'), 'egasining ovozi ishlatilishi kerak');

  // Salomlashish yozuvi (egasining o'z ovozi)
  const g = await j('/api/media/greeting', { type: 'audio/wav', data: wav.toString('base64'), seconds: 3 });
  assert.equal(g.status, 200);
  x = await form('/twilio/voice', { CallSid: 'C2', From: '+998905556677' });
  assert.match(x, /\/media\/greeting\?v=\d+<\/Play>/, x);
  const m = await fetch(base + '/media/greeting');
  assert.equal(m.status, 200);
  assert.equal(Buffer.from(await m.arrayBuffer()).length, wav.length);
  assert.equal((await j('/api/media/greeting', null, 'DELETE')).status, 200);
  assert.equal((await fetch(base + '/media/greeting')).status, 404);

  // Egasining ovozini klonlash (ElevenLabs)
  const sample = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(120000)]).toString('base64');
  assert.equal((await j('/api/voice/clone', { data: sample, seconds: 60 })).status, 400); // rozilik yo'q
  assert.match((await j('/api/voice/clone', { data: sample, seconds: 60, consent: true })).data.error, /ElevenLabs/); // kalit yo'q
  await j('/api/connections', { ELEVENLABS_API_KEY: 'el-key' }, 'PUT');
  const cl = await j('/api/voice/clone', { data: sample, seconds: 60, consent: true });
  assert.equal(cl.status, 200, JSON.stringify(cl.data));
  assert.equal(cl.data.voice.tts, 'elevenlabs');
  assert.equal(cl.data.voice.cloned, true);
  assert.ok(cloned[0] > 100000, 'namuna yuborilishi kerak');
  spoken.length = 0;
  const et = (await j('/api/voice/test', { text: 'Soat 10:00 da kutamiz' })).data;
  assert.ok(spoken.includes("ELEVEN:Soat o'nda kutamiz"), spoken.join('|'));
  assert.match(et.url, /\.mp3$/);
  assert.equal((await fetch(base + et.url)).status, 200);
  await j('/api/voice/clone', null, 'DELETE');
  assert.equal((await j('/api/connections')).data.voice.tts, 'aisha');

  // Telegram bot: mijoz yozadi va ovozli xabar yuboradi
  await j('/api/connections', { TG_BOT_TOKEN: 'TGTOKEN' }, 'PUT');
  const tgSecret = require('crypto').createHash('sha256').update('kotib-tg:TGTOKEN').digest('hex').slice(0, 32);
  const hook = (update) => fetch(`${base}/telegram/hook/${tgSecret}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': tgSecret }, body: JSON.stringify(update) });
  const wait = async (n) => { for (let i = 0; i < 50 && tgSent.length < n; i++) await new Promise((r) => setTimeout(r, 100)); };
  assert.equal((await fetch(`${base}/telegram/hook/${tgSecret}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 403); // sirsiz
  const chat = { id: 555, type: 'private' }, from = { first_name: 'Dilshod', language_code: 'uz' };
  await hook({ message: { chat, from, text: '/start' } }); await wait(1);
  assert.match(tgSent[0], /SAVE|kotib|Assalomu/i);
  await hook({ message: { chat, from, contact: { phone_number: '998935551122' } } }); await wait(2);
  assert.match(tgSent[1], /Rahmat/);
  await hook({ message: { chat, from, voice: { file_id: 'F1', duration: 3, mime_type: 'audio/ogg', file_size: 4000 } } }); await wait(3);
  assert.match(tgSent[2], /🎤 «Ertaga bo'sh vaqt bormi\?»/, tgSent[2]);
  assert.match(tgSent[2], /09:00–13:00/);
  const tgConv = (await j('/api/conversations/tg:555')).data;
  assert.equal(tgConv.channel, 'telegram');
  assert.equal(tgConv.from, '+998935551122');

  // Saytda ovozli suhbat
  const wv = await j('/api/chat/voice', { session: 'webv1', data: wav.toString('base64'), mime: 'audio/wav' });
  assert.equal(wv.status, 200, JSON.stringify(wv.data));
  assert.match(wv.data.text, /Ertaga/);
  assert.match(wv.data.audio, /^\/tts\/[a-f0-9]{40}\.wav$/);

  // Aisha ishlamay qolsa — kotib to'xtamaydi, Twilio ovoziga o'tadi va xatoni aniq aytadi
  aishaFail = true;
  const vt = await j('/api/voice/test', { text: 'Butunlay yangi matn 123' });
  assert.equal(vt.status, 502);
  assert.match(vt.data.error, /aisha.*500/i);
  x = await form('/twilio/voice', { CallSid: 'C9', From: '+998907778899' });
  assert.match(x, /<Say voice="Polly.Filiz"/);
  aishaFail = false;
  await j('/api/connections', {}, 'PUT'); // qayta saqlash — provayder qayta yoqiladi
  assert.equal((await j('/api/voice/test', { text: 'Yana bir matn' })).status, 200);

  // Kotib raqami: Twilio raqamini ilovadan avtomatik ulash
  assert.equal((await j('/api/phone/numbers')).status, 400); // kalit yo'q
  await j('/api/connections', { TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 'tok' }, 'PUT');
  let nums = (await j('/api/phone/numbers')).data;
  assert.equal(nums.numbers[0].number, '+15551234567');
  assert.equal(nums.numbers[0].connected, false);
  const con = await j('/api/phone/connect', { sid: nums.numbers[0].sid });
  assert.equal(con.status, 200, JSON.stringify(con.data));
  assert.deepEqual(twilioHooks, { voice: base + '/twilio/voice', status: base + '/twilio/status', sms: base + '/twilio/sms' });
  nums = (await j('/api/phone/numbers')).data;
  assert.equal(nums.numbers[0].connected, true);
  const sset = (await j('/api/settings')).data;
  assert.equal(sset.kotibNumber, '+15551234567');
  assert.equal((await j('/api/connections')).data.keys.find((k) => k.key === 'TWILIO_FROM').value, '+15551234567');

  console.log("✅ Ovoz tekshiruvlari o'tdi");
}
const done = (code) => { mock.close(); srv.on('exit', () => { fs.rmSync(dir, { recursive: true, force: true }); process.exit(code); }); srv.kill(); };
main().then(() => done(0)).catch((e) => { console.error('❌', e.stack, JSON.stringify(tgSent)); done(1); });
