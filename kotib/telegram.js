// Kotib — Telegram bot: mijozlar botga yozadi yoki ovozli xabar yuboradi, AI kotib javob beradi (bepul).
// Egasi uchun ham shu bot: yangi buyurtma xabarlari va /hisobot buyrug'i.
const crypto = require('crypto');
const store = require('./store');
const V = require('./voice');
const CFG = require('./config');

const API = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org'; // TELEGRAM_API_BASE — faqat test uchun
const st = () => store.get();
const token = () => process.env.TG_BOT_TOKEN || '';
const secret = () => crypto.createHash('sha256').update('kotib-tg:' + token()).digest('hex').slice(0, 32);
const hookPath = () => `/telegram/hook/${secret()}`;

async function call(method, body) {
  const r = await fetch(`${API}/bot${token()}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}), signal: AbortSignal.timeout(15000) });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error(`telegram ${method}: ${j.description || r.status}`);
  return j.result;
}

// Webhook'ni o'rnatish: Telegram mijoz xabarlarini shu serverga yuboradi
let lastSetup = '';
async function setup(force) {
  const t = token(), base = CFG.publicUrl();
  if (!t || !/^https:\/\//.test(base)) return { ok: false, reason: !t ? 'token' : 'url' };
  const key = t + base;
  if (!force && lastSetup === key) return { ok: true, bot: st().meta.tgBot || null };
  try {
    const me = await call('getMe');
    await call('setWebhook', { url: base + hookPath(), secret_token: secret(), allowed_updates: ['message'], drop_pending_updates: false });
    await call('setMyCommands', { commands: [{ command: 'start', description: 'Boshlash' }, { command: 'hisobot', description: 'Bugungi hisobot (faqat egasi uchun)' }] }).catch(() => {});
    st().meta.tgBot = me.username;
    store.save();
    lastSetup = key;
    return { ok: true, bot: me.username };
  } catch (e) {
    console.error('Telegram sozlash:', e.message);
    return { ok: false, reason: e.message };
  }
}

const contactKeyboard = { keyboard: [[{ text: '📱 Raqamimni yuborish', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true };

// Kiruvchi xabarni qayta ishlash. deps: { conversation, talk, A, C }
async function handle(update, deps) {
  const m = update.message;
  if (!m || !m.chat || m.chat.type !== 'private') return;
  const chatId = m.chat.id;
  const ownerChat = String(process.env.TG_CHAT_ID || st().business.tgChatId || '');
  const send = (text, extra = {}) => call('sendMessage', { chat_id: chatId, text, ...extra }).catch((e) => console.error(e.message));

  // Egasining buyruqlari
  if (ownerChat && String(chatId) === ownerChat && /^\/hisobot/.test(m.text || '')) {
    return call('sendMessage', { chat_id: chatId, text: deps.C.reportText(deps.C.report()), parse_mode: 'HTML' }).catch(() => {});
  }

  const conv = deps.conversation('tg:' + chatId, 'telegram', '');
  conv.tgName = [m.from?.first_name, m.from?.last_name].filter(Boolean).join(' ').slice(0, 60);
  if (!conv.customer && conv.tgName) conv.customer = { name: conv.tgName, phone: conv.from || '' };

  // Mijoz raqamini yubordi
  if (m.contact?.phone_number) {
    const phone = '+' + String(m.contact.phone_number).replace(/\D/g, '');
    conv.from = phone;
    const cu = deps.C.touchCustomer(phone, { chat: true, name: conv.tgName });
    if (cu?.name) conv.customer = { name: cu.name, phone };
    store.save();
    return send(deps.A.L(conv.lang || 'uz', 'Rahmat! Raqamingiz saqlandi. Savolingizni yozing yoki ovozli xabar yuboring.', 'Спасибо! Номер сохранён. Напишите вопрос или отправьте голосовое сообщение.'), { reply_markup: { remove_keyboard: true } });
  }

  if (/^\/start/.test(m.text || '')) {
    const lang = m.from?.language_code === 'ru' ? 'ru' : 'uz';
    const hello = deps.A.greeting(st(), lang) + '\n\n' + deps.A.L(lang, "Yozing yoki 🎤 ovozli xabar yuboring. Uchrashuvga yozilish uchun raqamingizni yuboring 👇", 'Напишите или отправьте 🎤 голосовое сообщение. Для записи отправьте номер телефона 👇');
    return send(hello, conv.from ? {} : { reply_markup: contactKeyboard });
  }

  let text = String(m.text || m.caption || '').trim();
  const media = m.voice || m.audio || m.video_note;
  if (media) {
    call('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});
    try {
      if (media.file_size > 15 * 1024 * 1024) throw new Error('katta fayl');
      const f = await call('getFile', { file_id: media.file_id });
      const r = await fetch(`${API}/file/bot${token()}/${f.file_path}`, { signal: AbortSignal.timeout(20000) });
      const buf = Buffer.from(await r.arrayBuffer());
      const mime = m.video_note ? 'video/mp4' : media.mime_type || 'audio/ogg';
      text = await V.transcribe(buf, mime, conv.lang || 'uz', 15000);
    } catch (e) { console.error('Telegram ovoz:', e.message); }
    if (!text) return send(deps.A.L(conv.lang || 'uz', "Kechirasiz, ovozli xabarni tushunolmadim. Iltimos, yozib yuboring.", 'Извините, не разобрал голосовое сообщение. Напишите, пожалуйста.'));
  }
  if (!text) return;

  call('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});
  const r = await deps.talk(conv, text);
  let reply = r.reply;
  if (media) reply = `🎤 «${text.slice(0, 200)}»\n\n${reply}`;
  // Uchrashuv yoki operator uchun raqam kerak bo'lsa — tugmani ko'rsatamiz
  const needPhone = !conv.from && (r.handoff || /telefon|raqam|номер|телефон/i.test(r.reply));
  await send(reply, needPhone ? { reply_markup: contactKeyboard } : {});
}

module.exports = { setup, handle, hookPath, secret, token };
