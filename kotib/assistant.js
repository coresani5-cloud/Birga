// Kotib — aqlli yordamchi: o'zbek va rus tillarida gaplashadi, savollarga javob beradi,
// bo'sh vaqtni aytadi, uchrashuv va zakaz qabul qiladi, murakkab masalani insonga topshiradi.
// AI kaliti bo'lsa (GEMINI_API_KEY / GROQ_API_KEY / AI_API_URL+AI_API_KEY) — AI ishlaydi,
// bo'lmasa yoki AI javob bermasa — qoidalar asosidagi yordamchi ishlaydi.
const S = require('./slots');

// ---------- Til ----------
const RU_WD = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const RU_MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const detectLang = (t) => {
  const s = String(t || '');
  const cyr = (s.match(/[а-яё]/gi) || []).length, lat = (s.match(/[a-z]/gi) || []).length;
  if (cyr > lat && !/[ўқғҳ]/i.test(s)) return 'ru';
  if (lat + cyr >= 3) return 'uz';
  return null;
};
const L = (lang, uz, ru) => (lang === 'ru' ? ru : uz);
function humanL(date, lang) {
  if (lang !== 'ru') return S.human(date);
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${RU_MON[m - 1]}, ${RU_WD[S.weekday(date)]}`;
}

// ---------- Kontekst ----------
const money = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/ /g, ' ') + ' so‘m';
const hasStock = (p) => p.stock !== null && p.stock !== undefined && p.stock !== '';
function serviceList(st) {
  return (st.services || []).map((s) => `- ${s.name}: ${s.duration} daqiqa${s.price ? ', narxi ' + s.price : ''}${s.desc ? ' (' + s.desc + ')' : ''}`).join('\n') || '- (yo‘q)';
}
function productList(st) {
  return (st.products || []).map((p) => `- ${p.name}: ${money(p.price)} / ${p.unit || 'dona'}; qoldiq: ${hasStock(p) ? (Number(p.stock) > 0 ? p.stock + ' ' + (p.unit || 'dona') : 'QOLMAGAN') : 'bor'}${p.desc ? ' (' + p.desc + ')' : ''}`).join('\n') || '- (yo‘q)';
}
function hoursText(st, lang) {
  return [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const h = st.hours?.[d], name = lang === 'ru' ? RU_WD[d] : S.WEEKDAYS[d];
    if (!h || h.off) return `${name}: ${L(lang, 'dam olish', 'выходной')}`;
    const br = (h.breaks || []).map((b) => `${b.from}–${b.to}`).join(', ');
    return `${name}: ${h.open}–${h.close}${br ? L(lang, ' (tanaffus ', ' (перерыв ') + br + ')' : ''}`;
  }).join('\n');
}
function availability(st, days = 14) {
  const t = S.now(), out = [];
  for (let i = 0; i < days; i++) {
    const d = S.addDays(t.date, i), r = S.freeRanges(st, d);
    out.push(`${d} (${S.human(d)}): ${S.dayHours(st, d) ? (r.length ? S.fmtRanges(r) : "to'liq band") : 'dam olish kuni'}`);
  }
  return out.join('\n');
}
function historyText(h) {
  if (!h) return 'Yangi mijoz (avval murojaat qilmagan).';
  const c = h.customer, out = [];
  if (c) out.push(`Ismi: ${c.name || "noma'lum"}; birinchi murojaat: ${new Date(c.firstSeen).toISOString().slice(0, 10)}; qo'ng'iroqlar: ${c.calls}, yozishmalar: ${c.chats}${c.notes ? '; egasining izohi: ' + c.notes : ''}`);
  if (h.bookings.length) out.push('Uchrashuvlari: ' + h.bookings.map((b) => `${b.date} ${b.start} ${b.serviceName} (${b.status})`).join('; '));
  if (h.orders.length) out.push('Zakazlari: ' + h.orders.map((o) => `${new Date(o.createdAt).toISOString().slice(0, 10)}: ${o.items.map((i) => i.name + '×' + i.qty).join(', ')} = ${money(o.total)} (${o.status})`).join('; '));
  if (h.convs.length) out.push('Oldingi murojaatlar: ' + h.convs.map((v) => `[${new Date(v.updatedAt).toISOString().slice(0, 10)}] ` + v.messages.filter((m) => m.role === 'user').slice(-2).map((m) => m.content.slice(0, 100)).join(' / ')).join('; '));
  return out.join('\n');
}

function systemPrompt(st, conv, history) {
  const b = st.business, t = S.now(), voice = conv.channel === 'call';
  return `Sen "${b.name}" biznesining kotibisan — 24/7 ishlaydigan aqlli virtual xodim. Mijoz bilan ${voice ? 'telefonda gaplashyapsan' : 'yozishyapsan'}.
VAZIFALARING: savollarga javob berish, bo'sh vaqtni aytish, uchrashuvga yozish, mahsulot zakazini qabul qilish, kerak bo'lsa insonga (egasi/operatorga) topshirish.

TIL: mijoz o'zbekcha gapirsa — sof o'zbek tilida (lotin yozuvida), ruscha gapirsa — to'g'ri rus tilida javob ber. Tillarni aralashtirma.${conv.lang ? ` Hozirgi suhbat tili: ${conv.lang === 'ru' ? 'rus' : "o'zbek"}.` : ''}
SOF O'ZBEK TILI (o'zbekcha javobda albatta rioya qil):
- Adabiy o'zbek tilida, joriy lotin yozuvida yoz; o‘ va g‘ harflarini to'g'ri yoz, kirill harflarini aralashtirma.
- Ruscha, inglizcha va turkcha so'z ishlatma, o'zbekcha muqobilini qo'lla: "konechno" emas "albatta", "normalno" emas "yaxshi", "ponyatno" emas "tushunarli", "zakaz" emas "buyurtma", "skidka" emas "chegirma", "dostavka" emas "yetkazib berish", "adres" emas "manzil", "zapis" emas "yozilish", "spasibo" emas "rahmat", "problema" emas "muammo", "vopros" emas "savol", "variant" emas "imkoniyat", "okey" emas "xo'p" yoki "mayli".
- Turkcha shakllardan qoch ("bilgi" emas "ma'lumot", "-yor" emas "-yapti"). Gap tuzilishi tabiiy o'zbekcha bo'lsin, tarjima ohangi sezilmasin.
- Mijozga "siz" deb hurmat bilan murojaat qil; "hurmatli mijoz" kabi rasmiy qolip iboralarni takrorlama.
- Mijoz ruscha so'z aralashtirib gapirsa ham, sen sof o'zbekcha javob ber.
${voice ? "- Telefonda raqamlarni so'z bilan yoz: \"soat o'n to'rtda\", \"ikki yuz ellik ming so'm\", \"ikkinchi noyabr\"." : ''}
USLUB: tirik, samimiy va xushmuomala xodimdek tabiiy gapir; mijozni ismi bilan chaqir (agar ma'lum bo'lsa); qayta qo'ng'iroq qilgan mijozni tanib, avvalgi buyurtmalarini eslab gapir.
${voice ? "Telefon suhbati: javob 1–3 qisqa gap, Markdown, ro'yxat, emoji ishlatma. Raqam va vaqtni so'z bilan o'qilishi oson qilib yoz." : 'Javob qisqa va aniq bo‘lsin (2–5 gap).'}

QAT'IY QOIDALAR:
- Narx, mahsulot qoldig'i, manzil va vaqtlarni FAQAT quyidagi ma'lumotlardan ol. Hech narsani to'qib chiqarma. Qoldig'i "QOLMAGAN" mahsulotni sotishga va'da berma.
- Bo'sh vaqtni faqat "BO'SH VAQTLAR" ro'yxatidan ayt. Xizmat davomiyligi bo'sh oraliqqa to'liq sig'ishi kerak, boshlanish vaqti ${b.slotStep || 30} daqiqa qadamda.
- Uchrashuv uchun kerak: xizmat, sana, vaqt, ism${conv.from ? '' : ', telefon'}. Zakaz uchun: mahsulot(lar), soni, ism${conv.from ? '' : ', telefon'}, kerak bo'lsa yetkazish manzili. Yetishmayotganini birma-bir so'ra. Hammasini mijozga takrorlab, rozi bo'lgach "booking" yoki "order"ni to'ldir.
- INSONGA TOPSHIRISH ("handoff": true): mijoz egasi/operator/menejer bilan gaplashmoqchi bo'lsa; shikoyat, pulni qaytarish, janjal, sog'liq yoki huquqiy masala, katta ulgurji kelishuv, chegirma so'rash yoki boshqa nozik/murakkab holatda. "reply"da: "Sizni mas'ul xodimimizga ulayman" mazmunida qisqa gap.
- Javobini bilmagan savol bo'lsa — to'qima: "callback"ga qisqa sabab yoz va "reply"da xodimimiz tez orada qayta bog'lanishini ayt.
- Biznesga aloqasiz mavzularda muloyimlik bilan faqat biznes bo'yicha yordam bera olishingni ayt.

BIZNES: ${b.name}
Haqida: ${b.about || '-'}
Manzil: ${b.address || "ko'rsatilmagan"}
Telefon: ${b.phone || "ko'rsatilmagan"}
${b.extra ? "Qo'shimcha: " + b.extra + '\n' : ''}
XIZMATLAR (uchrashuv bilan):
${serviceList(st)}

MAHSULOTLAR (narx va qoldiq — bazadan, hozirgi holat):
${productList(st)}

ISH VAQTI:
${hoursText(st)}

SAVOL-JAVOBLAR:
${(st.faq || []).map((f) => `S: ${f.q}\nJ: ${f.a}`).join('\n') || '-'}

HOZIR: ${S.human(t.date)} (${t.date}), soat ${S.toHM(t.min)}.
BO'SH VAQTLAR (keyingi 14 kun):
${availability(st)}

MIJOZ${conv.from ? ` (telefon: ${conv.from})` : ''}:
${historyText(history)}

JAVOB FORMATI — faqat bitta JSON obyekt, boshqa hech narsa yozma:
{"reply": "mijozga javob", "lang": "uz yoki ru", "booking": null, "order": null, "handoff": false, "callback": null}
Uchrashuv tayyor bo'lsa: "booking": {"service": "xizmat nomi", "date": "YYYY-MM-DD", "time": "HH:MM", "name": "ism", "phone": "telefon", "notes": ""}
Zakaz tayyor bo'lsa: "order": {"items": [{"product": "mahsulot nomi", "qty": 1}], "name": "ism", "phone": "telefon", "address": "", "notes": ""}`;
}

// ---------- AI chaqiruvi ----------
const AI_TIMEOUT = Number(process.env.AI_TIMEOUT_MS) || 12000;
const aiOn = () => !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || (process.env.AI_API_URL && process.env.AI_API_KEY));

async function post(url, headers, body, ms) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) });
  const txt = await r.text();
  if (!r.ok) throw new Error(r.status + ' ' + txt.slice(0, 200));
  return JSON.parse(txt);
}
async function aiCall(system, msgs, ms) {
  const errs = [];
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const j = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': process.env.GEMINI_API_KEY }, {
        systemInstruction: { parts: [{ text: system }] },
        contents: msgs.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content || ' ' }] })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 900, responseMimeType: 'application/json', ...(/2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
      }, ms);
      const out = j?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
      if (out) return out;
      errs.push('gemini: empty');
    } catch (e) { errs.push('gemini: ' + e.message); }
  }
  const compat = [];
  if (process.env.GROQ_API_KEY) compat.push(['https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_API_KEY, process.env.GROQ_MODEL || 'llama-3.3-70b-versatile']);
  if (process.env.AI_API_URL && process.env.AI_API_KEY) compat.push([process.env.AI_API_URL, process.env.AI_API_KEY, process.env.AI_MODEL || 'gpt-4o-mini']);
  for (const [url, key, model] of compat) {
    try {
      const j = await post(url, { Authorization: 'Bearer ' + key }, {
        model, temperature: 0.4, max_tokens: 900, response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, ...msgs.map((m) => ({ role: m.role, content: m.content }))],
      }, ms);
      const out = String(j?.choices?.[0]?.message?.content || '').trim();
      if (out) return out;
      errs.push(url + ': empty');
    } catch (e) { errs.push(url.split('/')[2] + ': ' + e.message); }
  }
  if (errs.length) console.error('Kotib AI:', errs.join(' | '));
  return null;
}
function parseJson(txt) {
  if (!txt) return null;
  const s = txt.indexOf('{'), e = txt.lastIndexOf('}');
  if (s < 0 || e < s) return { reply: txt.trim() };
  try { return JSON.parse(txt.slice(s, e + 1)); } catch { return { reply: txt.replace(/[{}"]/g, '').trim() }; }
}

// ---------- Matndan sana, vaqt, xizmat, mahsulotni ajratish ----------
const norm = (t) => String(t || '').toLowerCase().replace(/[‘’ʻʼ`´]/g, "'").replace(/ё/g, 'е');
const WD_RX = [/yakshanba|воскресень|якшанба/, /dushanba|понедельник|душанба/, /seshanba|вторник|сешанба/, /chorshanba|сред[уа]|чоршанба/, /payshanba|четверг|пайшанба/, /juma|пятниц|жума/, /(?<![a-z])shanba|суббот|(?<![а-я])шанба/];
const MONTH_RX = [/yanvar|январ/, /fevral|феврал/, /mart|март/, /aprel|апрел/, /may|ма[йя]/, /iyun|июн/, /iyul|июл/, /avgust|август/, /sentabr|sentyabr|сентябр/, /oktabr|oktyabr|октябр/, /noyabr|ноябр/, /dekabr|декабр/];

function parseDate(text) {
  const t = norm(text), today = S.now().date;
  if (/indin|послезавтра|индинга/.test(t)) return S.addDays(today, 2);
  if (/ertaga|завтра|эртага/.test(t)) return S.addDays(today, 1);
  if (/bugun|сегодня|бугун/.test(t)) return today;
  let m = /(?<!soat\s*|соат\s*|в\s*)(?<![\d:])(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/.exec(t);
  if (m && Number(m[2]) <= 12 && Number(m[1]) <= 31) {
    const y = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : today.slice(0, 4);
    let d = `${y}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    if (!m[3] && d < today) d = `${Number(y) + 1}${d.slice(4)}`;
    return d;
  }
  for (let i = 0; i < 12; i++) {
    const mm = new RegExp('(\\d{1,2})\\s*-?\\s*(?:' + MONTH_RX[i].source + ')').exec(t);
    if (mm) {
      let d = `${today.slice(0, 4)}-${String(i + 1).padStart(2, '0')}-${String(mm[1]).padStart(2, '0')}`;
      if (d < today) d = `${Number(today.slice(0, 4)) + 1}${d.slice(4)}`;
      return d;
    }
  }
  for (let w = 0; w < 7; w++) {
    if (WD_RX[w].test(t)) for (let i = 0; i < 7; i++) { const d = S.addDays(today, i); if (S.weekday(d) === w) return d; }
  }
  return null;
}
function parseTime(text) {
  const t = norm(text);
  let m = /(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?!\d)/.exec(t) || /(?:soat|соат|в)\s*([01]?\d|2[0-3])[.]([0-5]\d)(?!\d)/.exec(t);
  if (m) return String(m[1]).padStart(2, '0') + ':' + m[2];
  m = /(?:soat|соат|в|at)\s*(\d{1,2})(?:\s*(?:da|ga|larda|часов|час))?(?!\d)/.exec(t) || /(\d{1,2})\s*(?:da|ga)\b/.exec(t);
  if (m) {
    let h = Number(m[1]);
    if (h >= 1 && h <= 7) h += 12;
    if (h <= 23) return String(h).padStart(2, '0') + ':00';
  }
  return null;
}
function fuzzyFind(list, text) {
  const t = norm(text);
  let best = null, score = 0;
  for (const s of list || []) {
    const n = norm(s.name);
    if (n && t.includes(n)) return s;
    const words = n.split(/\s+/).filter((w) => w.length > 2);
    if (!words.length) continue;
    const hit = words.filter((w) => t.includes(w.slice(0, Math.max(4, w.length - 2)))).length;
    if (hit && hit / words.length > score) { score = hit / words.length; best = s; }
  }
  return score >= 0.5 ? best : null;
}
const findService = (st, text) => fuzzyFind(st.services, text);
const findProduct = (st, text) => fuzzyFind(st.products, text);
function findPhone(text) {
  const d = String(text || '').replace(/[^\d+]/g, '');
  return d.replace(/\D/g, '').length >= 9 ? d : null;
}
function parseQty(text) {
  const m = /(\d{1,4})\s*(?:ta|dona|kg|kilo|litr|l|шт|штук|кг|литр|пачк|qop|quti)?\b/.exec(norm(text).replace(/\+?\d[\d\s-]{8,}/g, ' '));
  return m ? Number(m[1]) : null;
}
function faqMatch(st, text) {
  const words = (s) => norm(s).replace(/[^\p{L}\d\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2).map((w) => w.slice(0, 5));
  const q = new Set(words(text));
  if (!q.size) return null;
  let best = null, score = 0;
  for (const f of st.faq || []) {
    const fw = words(f.q);
    if (!fw.length) continue;
    const hit = fw.filter((w) => q.has(w)).length / fw.length;
    if (hit > score) { score = hit; best = f; }
  }
  return score >= 0.5 ? best : null;
}

// ---------- Qoidalar asosidagi yordamchi (AI yo'q bo'lganda) ----------
function startsText(st, date, svc, lang) {
  if (!S.dayHours(st, date)) return L(lang, `${humanL(date)} — dam olish kunimiz.`, `${humanL(date, 'ru')} — у нас выходной.`);
  const starts = S.freeStarts(st, date, svc?.duration || Math.min(...(st.services || []).map((s) => s.duration), 30));
  if (!starts.length) return L(lang, `${humanL(date)} kuni bo'sh vaqt qolmagan.`, `На ${humanL(date, 'ru')} свободного времени нет.`);
  const list = starts.slice(0, 12).join(', ') + (starts.length > 12 ? L(lang, ' va boshqalar', ' и др.') : '');
  if (svc) return L(lang, `${humanL(date)} kuni "${svc.name}" uchun bo'sh vaqtlar: ${list}.`, `${humanL(date, 'ru')}, свободно для «${svc.name}»: ${list}.`);
  return L(lang, `${humanL(date)} kuni bo'sh vaqt: ${S.fmtRanges(S.freeRanges(st, date))}.`, `${humanL(date, 'ru')}, свободно: ${S.fmtRanges(S.freeRanges(st, date))}.`);
}
function nextOpenDays(st, n = 3) {
  const out = [];
  let d = S.now().date;
  for (let i = 0; i < 30 && out.length < n; i++, d = S.addDays(d, 1)) if (S.freeRanges(st, d).length) out.push(d);
  return out;
}
const HANDOFF_RX = /operator|odam bilan|inson bilan|rahbar|direktor|egasi bilan|menejer|shikoyat|pulimni qaytar|оператор|менеджер|руковод|директор|живым|человеком|жалоб|верните деньги|оператор|раҳбар|шикоят/;

function ruleReply(st, conv, text) {
  const t = norm(text), lang = conv.lang || detectLang(text) || 'uz';
  const dr = conv.draft || (conv.draft = {});
  const b = st.business;
  const svc = findService(st, text), prod = findProduct(st, text), date = parseDate(text), time = parseTime(text), phone = findPhone(text);

  if (HANDOFF_RX.test(t)) {
    conv.draft = {};
    return { reply: L(lang, "Tushundim. Sizni mas'ul xodimimizga ulayman.", 'Понял вас. Соединяю с ответственным сотрудником.'), handoff: true };
  }
  if (/bekor|отмен|kerak emas|не надо/.test(t) && dr.kind) { conv.draft = {}; return { reply: L(lang, 'Mayli, bekor qilindi. Yana savolingiz bormi?', 'Хорошо, отменено. Есть ещё вопросы?') }; }

  const wantsOrder = /zakaz|buyurtma ber|sotib ol|olmoqchi|kerak edi|yetkaz|dostavka|заказ|купить|доставк|нужн/.test(t) && (prod || dr.kind === 'order' || ((st.products || []).length && !svc));
  const wantsBook = /yozil|yozib|band qil|bron|navbat|uchrashuv|запис|брон|приём|прием|ёзил|навбат/.test(t) || (/zakaz|buyurtma|заказ/.test(t) && !prod && !(st.products || []).length);

  // Ism va telefonni umumiy yig'amiz
  const fillPerson = () => {
    if (phone) dr.phone = phone;
    const nm = /(?:ismim|mening ismim|меня зовут)\s+([\p{L}'-]{2,})/iu.exec(text);
    if (nm) dr.name = nm[1];
    else if (dr.ask === 'name' && !svc && !prod && !date && !time && !phone && t.trim().length >= 2 && t.trim().length < 40) dr.name = String(text).trim();
    if (!dr.name && conv.customer?.name) dr.name = conv.customer.name;
    if (!dr.phone && conv.from) dr.phone = conv.from;
    if (!dr.name) { dr.ask = 'name'; return L(lang, 'Ismingizni aytib yuboring.', 'Как вас зовут?'); }
    if (!dr.phone) { dr.ask = 'phone'; return L(lang, 'Telefon raqamingizni yozing.', 'Напишите ваш номер телефона.'); }
    return null;
  };

  // Mahsulot zakazi
  if (wantsOrder || dr.kind === 'order') {
    dr.kind = 'order';
    if (prod) { dr.product = prod.id; dr.qty = parseQty(text) || dr.qty || null; }
    else if (dr.ask === 'qty') dr.qty = parseQty(text) || dr.qty;
    if (dr.ask === 'address' && !phone) dr.address = String(text).trim();
    const p = (st.products || []).find((x) => x.id === dr.product);
    if (!p) { dr.ask = 'product'; return { reply: L(lang, 'Qaysi mahsulotdan zakaz qilasiz? ', 'Какой товар хотите заказать? ') + (st.products || []).map((x) => x.name).join(', ') + '.' }; }
    if (hasStock(p) && Number(p.stock) <= 0) { conv.draft = {}; return { reply: L(lang, `Kechirasiz, "${p.name}" hozir qolmagan.`, `Извините, «${p.name}» сейчас нет в наличии.`) }; }
    if (!dr.qty) { dr.ask = 'qty'; return { reply: L(lang, `"${p.name}" — ${money(p.price)}. Nechta kerak?`, `«${p.name}» — ${money(p.price)}. Сколько нужно?`) }; }
    if (hasStock(p) && Number(p.stock) < dr.qty) { dr.ask = 'qty'; dr.qty = null; return { reply: L(lang, `Kechirasiz, faqat ${p.stock} ${p.unit || 'dona'} qolgan. Nechta olasiz?`, `Извините, осталось только ${p.stock}. Сколько возьмёте?`) }; }
    const ask = fillPerson();
    if (ask) return { reply: ask };
    if (dr.address === undefined) { dr.ask = 'address'; dr.address = null; return { reply: L(lang, "Yetkazib berish manzilini yozing (o'zingiz olib ketsangiz — \"o'zim\" deb yozing).", 'Укажите адрес доставки (или напишите «самовывоз»).') }; }
    if (dr.address === null) { dr.ask = 'address'; return { reply: L(lang, 'Manzilni yozing.', 'Напишите адрес.') }; }
    const order = { items: [{ product: p.name, qty: dr.qty }], name: dr.name, phone: dr.phone, address: dr.address, notes: '' };
    conv.draft = {};
    return { reply: '', order };
  }

  // Uchrashuvga yozilish
  if (dr.kind === 'booking' || wantsBook) {
    dr.kind = 'booking';
    if (svc) dr.service = svc.id;
    if (date) dr.date = date;
    if (time) dr.time = time;
    const s = (st.services || []).find((x) => x.id === dr.service) || ((st.services || []).length === 1 ? st.services[0] : null);
    if (s) dr.service = s.id;
    if (!s) { dr.ask = 'service'; return { reply: L(lang, 'Qaysi xizmatga yozilmoqchisiz? ', 'На какую услугу хотите записаться? ') + (st.services || []).map((x) => x.name).join(', ') + '.' }; }
    if (!dr.date) { dr.ask = 'date'; return { reply: L(lang, "Qaysi kunga yozay? Eng yaqin bo'sh kunlar: ", 'На какой день записать? Ближайшие свободные дни: ') + nextOpenDays(st).map((d) => humanL(d, lang)).join('; ') + '.' }; }
    if (!dr.time) { dr.ask = 'time'; return { reply: startsText(st, dr.date, s, lang) + L(lang, ' Qaysi vaqt qulay?', ' Какое время удобно?') }; }
    const err = S.check(st, dr.date, dr.time, s.duration);
    if (err) { dr.ask = 'time'; dr.time = null; return { reply: `${L(lang, err, 'Это время недоступно')}. ${startsText(st, dr.date, s, lang)}` }; }
    const ask = fillPerson();
    if (ask) return { reply: ask };
    const booking = { service: s.name, date: dr.date, time: dr.time, name: dr.name, phone: dr.phone, notes: '' };
    conv.draft = {};
    return { reply: '', booking };
  }

  if (/bo'sh|bosh vaqt|vaqt bor|qachon|свобод|когда|бўш|вақт|окошк/.test(t) || date) {
    if (date) return { reply: startsText(st, date, svc, lang) + L(lang, " Yozib qo'yaymi?", ' Записать вас?') };
    const days = nextOpenDays(st);
    return { reply: days.length ? days.map((d) => `${humanL(d, lang)}: ${S.fmtRanges(S.freeRanges(st, d))}`).join('. ') + L(lang, '. Qaysi kun qulay?', '. Какой день удобен?') : L(lang, "Yaqin kunlarda bo'sh vaqt yo'q.", 'В ближайшие дни свободного времени нет.') };
  }
  if (prod) {
    const stock = hasStock(prod) ? (Number(prod.stock) > 0 ? L(lang, `${prod.stock} ${prod.unit || 'dona'} bor`, `в наличии ${prod.stock}`) : L(lang, 'hozir qolmagan', 'сейчас нет в наличии')) : L(lang, 'mavjud', 'в наличии');
    return { reply: `${prod.name} — ${money(prod.price)}, ${stock}.` + (!hasStock(prod) || Number(prod.stock) > 0 ? L(lang, ' Zakaz qilasizmi?', ' Оформить заказ?') : '') };
  }
  const f = faqMatch(st, text);
  if (f) return { reply: f.a };
  if (/narx|qancha|necha pul|xizmat|mahsulot|цен|стоим|сколько|услуг|товар|нарх/.test(t)) {
    const lines = [...(st.services || []).map((s) => `${s.name} — ${s.price || L(lang, 'narxi kelishiladi', 'по договорённости')} (${s.duration} ${L(lang, 'daqiqa', 'мин')})`), ...(st.products || []).map((p) => `${p.name} — ${money(p.price)}`)];
    return { reply: lines.join('; ') + '.' };
  }
  if (/manzil|qayerda|адрес|где|манзил|lokatsiya/.test(t)) return { reply: b.address ? L(lang, `Manzilimiz: ${b.address}.`, `Наш адрес: ${b.address}.`) : L(lang, 'Manzilni aniqlab, sizga xabar beramiz.', 'Уточним адрес и сообщим вам.'), callback: b.address ? null : 'Manzilni so‘radi' };
  if (/ish vaqt|soat nechada|ochiq|режим|работаете|график|иш вақт/.test(t)) return { reply: L(lang, 'Ish vaqtimiz: ', 'Мы работаем: ') + hoursText(st, lang).replace(/\n/g, '; ') + '.' };
  if (/assalom|salom|привет|здравств|добрый|ассалом|салом/.test(t)) return { reply: greeting(st, lang) };
  if (/rahmat|спасибо|рахмат/.test(t)) return { reply: L(lang, "Arzimaydi! Yana savollar bo'lsa, bemalol murojaat qiling.", 'Пожалуйста! Обращайтесь, если будут вопросы.') };
  dr.unknown = (dr.unknown || 0) + 1;
  if (dr.unknown >= 2) { dr.unknown = 0; return { reply: L(lang, "Bu savol bo'yicha xodimimiz sizga tez orada qayta qo'ng'iroq qiladi.", 'По этому вопросу наш сотрудник скоро вам перезвонит.'), callback: 'Javob topilmagan savol: ' + String(text).slice(0, 150) }; }
  return { reply: L(lang, `Men ${b.name} bo'yicha savollarga javob beraman, bo'sh vaqtni aytaman, uchrashuvga yozaman va zakaz qabul qilaman. Nima kerakligini aytib bering.`, `Я отвечаю на вопросы о «${b.name}», подскажу свободное время, запишу на приём и приму заказ. Чем могу помочь?`) };
}

function greeting(st, lang) {
  const g = String(st.business.greeting || '').replace(/\{name\}/g, st.business.name);
  return lang === 'ru' ? `Здравствуйте! Я секретарь «${st.business.name}». Чем могу помочь?` : g || 'Assalomu alaykum! Qanday yordam bera olaman?';
}

// ---------- Asosiy funksiya ----------
// act: { createBooking, createOrder, history } — server tomonidan beriladi
async function respond(st, conv, text, act) {
  if (!conv.lang) conv.lang = detectLang(text);
  conv.messages.push({ role: 'user', content: String(text).slice(0, 2000), at: Date.now() });
  let result = null, via = 'rules';
  if (aiOn()) {
    const msgs = conv.messages.filter((m) => m.role !== 'system').slice(-20).map((m) => ({ role: m.role, content: m.content }));
    const ms = conv.channel === 'call' ? Math.min(AI_TIMEOUT, 9000) : AI_TIMEOUT;
    const out = parseJson(await aiCall(systemPrompt(st, conv, act.history(conv.from)), msgs, ms));
    if (out && (out.reply || out.booking || out.order)) { result = out; via = 'ai'; }
  }
  if (!result) result = ruleReply(st, conv, text);
  if (result.lang === 'ru' || result.lang === 'uz') conv.lang = result.lang;
  const lang = conv.lang || 'uz';

  let reply = String(result.reply || '').trim(), booking = null, order = null;
  const bk = result.booking;
  if (bk && bk.date && bk.time) {
    const svc = findService(st, bk.service || '') || ((st.services || []).length === 1 ? st.services[0] : null);
    const r = act.createBooking({ serviceId: svc?.id, date: bk.date, start: bk.time, name: bk.name || conv.customer?.name || '', phone: bk.phone || conv.from || '', notes: bk.notes || '', source: conv.channel, conversationId: conv.id });
    if (r.ok) {
      booking = r.booking;
      conv.customer = { name: booking.customer.name, phone: booking.customer.phone };
      if (!reply || via === 'rules') reply = L(lang, `Yozib qo'ydim: ${humanL(booking.date)}, soat ${booking.start}, "${booking.serviceName}". Sizni kutamiz!`, `Записал вас: ${humanL(booking.date, 'ru')}, в ${booking.start}, «${booking.serviceName}». Ждём вас!`);
    } else {
      const starts = S.isDate(bk.date) ? S.freeStarts(st, bk.date, svc?.duration || 30).slice(0, 8) : [];
      reply = L(lang, `Kechirasiz, ${r.error.charAt(0).toLowerCase() + r.error.slice(1)}. `, 'Извините, это время недоступно. ') + (starts.length ? L(lang, `Shu kuni bo'sh vaqtlar: ${starts.join(', ')}. Qaysi biri qulay?`, `В этот день свободно: ${starts.join(', ')}. Какое время удобно?`) : L(lang, 'Boshqa kunni tanlaysizmi?', 'Выберем другой день?'));
    }
  }
  const od = result.order;
  if (od && Array.isArray(od.items) && od.items.length) {
    const r = act.createOrder({ items: od.items, name: od.name || conv.customer?.name || '', phone: od.phone || conv.from || '', address: od.address || '', notes: od.notes || '', source: conv.channel, conversationId: conv.id });
    if (r.ok) {
      order = r.order;
      conv.customer = { name: order.customer.name, phone: order.customer.phone };
      if (!reply || via === 'rules') reply = L(lang, `Zakazingiz qabul qilindi: ${order.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}. Jami ${money(order.total)}. Tez orada siz bilan bog'lanamiz!`, `Заказ принят: ${order.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}. Итого ${money(order.total)}. Скоро свяжемся с вами!`);
    } else {
      reply = L(lang, `Kechirasiz, ${r.error.charAt(0).toLowerCase() + r.error.slice(1)}.`, `Извините, не удалось оформить заказ: ${r.error}.`);
    }
  }
  if (!reply) reply = L(lang, 'Kechirasiz, tushunmadim. Qaytadan aytib bera olasizmi?', 'Извините, не понял. Можете повторить?');
  conv.messages.push({ role: 'assistant', content: reply, at: Date.now() });
  if (conv.messages.length > 80) conv.messages = conv.messages.slice(-80);
  conv.updatedAt = Date.now();
  return { reply, booking, order, handoff: !!result.handoff, callback: result.callback ? String(result.callback) : null, via, lang };
}

module.exports = { respond, greeting, aiOn, detectLang, parseDate, parseTime, L };
