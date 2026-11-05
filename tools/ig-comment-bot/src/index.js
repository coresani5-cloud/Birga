// Instagram "comment-to-DM" bot — Cloudflare Workers + KV.
// Instagram API with Instagram Login (Facebook sahifasiz) ishlatiladi.
//
// Oqim:
//   1) Postga "AI" izohi  -> izohga ochiq javob + private reply (Direct) 2 ta tugma bilan
//   2) "Obuna bo'ldim" bosildi -> is_user_follow_business tekshiriladi
//        true  -> qo'llanma havolasi (bir odamga bir marta)
//        false -> "obunangizni ko'rmayapman" + yana o'sha tugmalar
//
// Secretlar (faqat `wrangler secret put` orqali):
//   IG_ACCESS_TOKEN  — Instagram User access token (long-lived)
//   APP_SECRET       — Instagram app secret (webhook imzosi uchun)
//   VERIFY_TOKEN     — webhook tasdiqlash so'zi (o'zingiz o'ylab topasiz)
//   QOLLANMA_URL     — qo'llanma havolasi

const PUBLIC_REPLIES = ["Direct'ni tekshiring 📩", "Yubordim 🔥", "Qo'llanma Direct'da 👌"];

const TEXT_ASK =
  "Salom! 👋 AI montaj qo'llanmasini olish uchun avval @sardorxoon'ga obuna bo'ling, keyin tugmani bosing 👇";
const TEXT_NOT_FOLLOWING =
  "Obunangizni ko'rmayapman 🙂 Obuna bo'lib, bir necha soniyadan keyin qayta bosing";
const TEXT_ALREADY_SENT = "Qo'llanma sizga avval yuborilgan ✅ Yuqoridagi xabarni ko'ring 👆";
const textThanks = (url) => `Rahmat! 🎁 Mana qo'llanma: ${url}`;

const POSTBACK_FOLLOWED = "FOLLOW_CHECK";

const DAY = 86400;

// ---------- yordamchilar ----------

/** "AI", "ai", "Ai", "АИ", "аи", "AI!", " ai 🔥" -> true */
export function isTrigger(text) {
  if (typeof text !== "string") return false;
  const norm = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/а/g, "a") // kirill a
    .replace(/[иі]/g, "i") // kirill i
    .replace(/[^\p{L}\p{N}]+/gu, ""); // tinish belgilari, emoji, bo'shliqlar
  return norm === "ai";
}

const enc = new TextEncoder();

/** X-Hub-Signature-256 ni tekshirish (HMAC-SHA256, doimiy vaqtli taqqoslash). */
export async function verifySignature(rawBody, header, secret) {
  if (!header || !secret || !header.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, rawBody));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  const got = header.slice(7).toLowerCase();
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function graphBase(env) {
  return `https://graph.instagram.com/${env.GRAPH_VERSION || "v23.0"}`;
}

/** Yangilangan token KV'da bo'lsa o'shani, bo'lmasa secret'dagini ishlatamiz. */
async function getToken(env) {
  return (await env.KV.get("token:access")) || env.IG_ACCESS_TOKEN;
}

async function graph(env, method, path, body) {
  const token = await getToken(env);
  const url = new URL(graphBase(env) + path);
  const init = { method, headers: { Authorization: `Bearer ${token}` } };
  if (body) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Token yoki boshqa ma'lumotlar logga tushmasin — faqat xato matni
    console.error(`Graph ${method} ${path} -> ${res.status}`, JSON.stringify(data?.error ?? data));
    const err = new Error(data?.error?.message || `Graph ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function followButtons(env) {
  return [
    { type: "web_url", url: env.PROFILE_URL || "https://instagram.com/sardorxoon", title: "👤 Profilga o'tish" },
    { type: "postback", title: "✅ Obuna bo'ldim", payload: POSTBACK_FOLLOWED },
  ];
}

function buttonMessage(env, text) {
  return {
    attachment: {
      type: "template",
      payload: { template_type: "button", text, buttons: followButtons(env) },
    },
  };
}

/** KV'da "faqat bir marta" belgisi. true = birinchi marta. */
async function once(env, key, ttl) {
  if (await env.KV.get(key)) return false;
  await env.KV.put(key, String(Date.now()), ttl ? { expirationTtl: ttl } : undefined);
  return true;
}

// ---------- hodisalar ----------

export async function handleComment(env, igUserId, value) {
  const commentId = value?.id;
  const text = value?.text;
  const fromId = value?.from?.id;
  const fromUsername = value?.from?.username;
  if (!commentId || !isTrigger(text)) return "skip";
  // O'zimizning izohlarimizga javob bermaymiz (cheksiz aylanishning oldini olish)
  if (fromId && fromId === igUserId) return "self";
  if (fromUsername && env.OWN_USERNAME && fromUsername.toLowerCase() === env.OWN_USERNAME.toLowerCase())
    return "self";

  // Bitta izohga bir marta (Meta webhook'ni qayta yuborishi mumkin)
  if (!(await once(env, `comment:${commentId}`, 30 * DAY))) return "dup";

  const results = await Promise.allSettled([
    // 1) ochiq javob
    graph(env, "POST", `/${commentId}/replies`, { message: pick(PUBLIC_REPLIES) }),
    // 2) private reply: Direct'ga tugmali xabar
    graph(env, "POST", `/${igUserId}/messages`, {
      recipient: { comment_id: commentId },
      message: buttonMessage(env, TEXT_ASK),
    }),
  ]);
  return results.map((r) => r.status).join(",");
}

export async function handlePostback(env, igUserId, event) {
  const userId = event?.sender?.id;
  const payload = event?.postback?.payload;
  if (!userId || payload !== POSTBACK_FOLLOWED || userId === igUserId) return "skip";

  const send = (message) =>
    graph(env, "POST", `/${igUserId}/messages`, { recipient: { id: userId }, message });

  if (await env.KV.get(`sent:${userId}`)) {
    await send({ text: TEXT_ALREADY_SENT });
    return "already";
  }

  const profile = await graph(env, "GET", `/${userId}?fields=username,is_user_follow_business`);
  if (profile.is_user_follow_business === true) {
    // Avval belgilaymiz, keyin yuboramiz — ikki marta bosilsa ham bitta yuborilsin
    if (!(await once(env, `sent:${userId}`))) return "already";
    try {
      await send({ text: textThanks(env.QOLLANMA_URL) });
    } catch (e) {
      await env.KV.delete(`sent:${userId}`); // yuborilmadi — keyingi bosishda qayta urinadi
      throw e;
    }
    return "sent";
  }
  await send(buttonMessage(env, TEXT_NOT_FOLLOWING));
  return "not_following";
}

export async function processWebhook(env, body) {
  if (body?.object !== "instagram") return [];
  const out = [];
  for (const entry of body.entry ?? []) {
    const igUserId = String(entry.id);
    for (const change of entry.changes ?? []) {
      if (change.field === "comments") {
        out.push(await handleComment(env, igUserId, change.value).catch((e) => `error:${e.message}`));
      }
    }
    for (const ev of entry.messaging ?? []) {
      if (ev.postback) {
        out.push(await handlePostback(env, igUserId, ev).catch((e) => `error:${e.message}`));
      }
    }
  }
  return out;
}

/** Long-lived token 60 kun yashaydi — cron har hafta yangilab, KV'ga yozadi. */
export async function refreshToken(env) {
  const token = await getToken(env);
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    console.error("Token yangilanmadi", res.status, JSON.stringify(data?.error ?? {}));
    return false;
  }
  await env.KV.put("token:access", data.access_token);
  return true;
}

// ---------- Worker ----------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/webhook") {
      return new Response("ok", { status: url.pathname === "/" ? 200 : 404 });
    }

    // Meta webhook tasdiqlash (GET)
    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && env.VERIFY_TOKEN && token === env.VERIFY_TOKEN && challenge) {
        return new Response(challenge, { status: 200 });
      }
      return new Response("forbidden", { status: 403 });
    }

    if (request.method !== "POST") return new Response("method not allowed", { status: 405 });

    const raw = await request.arrayBuffer();
    const ok = await verifySignature(raw, request.headers.get("x-hub-signature-256"), env.APP_SECRET);
    if (!ok) return new Response("bad signature", { status: 401 });

    let body;
    try {
      body = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      return new Response("bad json", { status: 400 });
    }
    // Meta tez 200 kutadi — ishni fonda bajaramiz
    ctx.waitUntil(processWebhook(env, body).then((r) => r.length && console.log("webhook:", r.join(" | "))));
    return new Response("EVENT_RECEIVED", { status: 200 });
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(refreshToken(env));
  },
};
