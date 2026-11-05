import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import worker, { isTrigger, verifySignature, processWebhook } from "../src/index.js";

const IG = "17841400000000000";
let kv, calls, profileFollows;

const makeKV = () => {
  const m = new Map();
  return {
    m,
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => void m.set(k, v),
    delete: async (k) => void m.delete(k),
  };
};
const env = () => ({
  KV: kv,
  IG_ACCESS_TOKEN: "test-token",
  APP_SECRET: "app-secret",
  VERIFY_TOKEN: "verify-me",
  QOLLANMA_URL: "https://example.com/qollanma",
  PROFILE_URL: "https://instagram.com/sardorxoon",
  OWN_USERNAME: "sardorxoon",
});

beforeEach(() => {
  kv = makeKV();
  calls = [];
  profileFollows = false;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    calls.push({ method: init.method || "GET", path: u.pathname, search: u.search, body: init.body ? JSON.parse(init.body) : null, auth: init.headers?.Authorization });
    if (u.pathname.endsWith("/refresh_access_token")) return Response.json({ access_token: "new-token", expires_in: 5184000 });
    if ((init.method || "GET") === "GET") return Response.json({ id: u.pathname.split("/").pop(), username: "u", is_user_follow_business: profileFollows });
    return Response.json({ id: "ok" });
  };
});

const commentBody = (text, id = "c1", from = { id: "999", username: "mijoz" }) => ({
  object: "instagram",
  entry: [{ id: IG, time: 1, changes: [{ field: "comments", value: { id, text, from, media: { id: "m1" } } }] }],
});
const postbackBody = (sender = "555", payload = "FOLLOW_CHECK") => ({
  object: "instagram",
  entry: [{ id: IG, time: 1, messaging: [{ sender: { id: sender }, recipient: { id: IG }, timestamp: 1, postback: { mid: "x", title: "✅ Obuna bo'ldim", payload } }] }],
});

test("trigger so'zlari", () => {
  for (const t of ["AI", "ai", "Ai", "aI", "АИ", "аи", " AI! ", "ai🔥", "A.I."]) assert.equal(isTrigger(t), true, t);
  for (const t of ["AIR", "salom ai", "", null, "ии", "a i x"]) assert.equal(isTrigger(t), false, String(t));
});

test("imzo tekshiruvi", async () => {
  const body = enc('{"a":1}');
  const sig = "sha256=" + crypto.createHmac("sha256", "s").update('{"a":1}').digest("hex");
  assert.equal(await verifySignature(body, sig, "s"), true);
  assert.equal(await verifySignature(body, sig, "boshqa"), false);
  assert.equal(await verifySignature(body, null, "s"), false);
  assert.equal(await verifySignature(body, "sha256=00", "s"), false);
});

function enc(s) { return new TextEncoder().encode(s).buffer; }

test("AI izohi: ochiq javob + tugmali private reply, ikkinchi marta javob yo'q", async () => {
  const r = await processWebhook(env(), commentBody("Ai"));
  assert.deepEqual(r, ["fulfilled,fulfilled"]);
  const reply = calls.find((c) => c.path === "/v23.0/c1/replies");
  assert.ok(["Direct'ni tekshiring 📩", "Yubordim 🔥", "Qo'llanma Direct'da 👌"].includes(reply.body.message));
  const dm = calls.find((c) => c.path === `/v23.0/${IG}/messages`);
  assert.deepEqual(dm.body.recipient, { comment_id: "c1" });
  const p = dm.body.message.attachment.payload;
  assert.equal(p.template_type, "button");
  assert.match(p.text, /obuna bo'ling/);
  assert.equal(p.buttons[0].url, "https://instagram.com/sardorxoon");
  assert.equal(p.buttons[1].payload, "FOLLOW_CHECK");
  assert.equal(dm.auth, "Bearer test-token");
  calls = [];
  assert.deepEqual(await processWebhook(env(), commentBody("Ai")), ["dup"]);
  assert.equal(calls.length, 0);
});

test("boshqa izohlar va o'zimizning izohlar e'tiborsiz", async () => {
  assert.deepEqual(await processWebhook(env(), commentBody("zo'r video")), ["skip"]);
  assert.deepEqual(await processWebhook(env(), commentBody("AI", "c2", { id: IG, username: "sardorxoon" })), ["self"]);
  assert.deepEqual(await processWebhook(env(), commentBody("AI", "c3", { id: "1", username: "SardorXoon" })), ["self"]);
  assert.equal(calls.length, 0);
});

test("obuna bo'lmagan: ogohlantirish + tugmalar", async () => {
  const r = await processWebhook(env(), postbackBody());
  assert.deepEqual(r, ["not_following"]);
  const get = calls.find((c) => c.method === "GET");
  assert.equal(get.path, "/v23.0/555");
  assert.match(get.search, /is_user_follow_business/);
  const msg = calls.find((c) => c.method === "POST");
  assert.deepEqual(msg.body.recipient, { id: "555" });
  assert.match(msg.body.message.attachment.payload.text, /Obunangizni ko'rmayapman/);
  assert.equal(msg.body.message.attachment.payload.buttons.length, 2);
});

test("obuna bo'lgan: qo'llanma bir marta", async () => {
  profileFollows = true;
  assert.deepEqual(await processWebhook(env(), postbackBody()), ["sent"]);
  const msg = calls.find((c) => c.method === "POST");
  assert.equal(msg.body.message.text, "Rahmat! 🎁 Mana qo'llanma: https://example.com/qollanma");
  calls = [];
  assert.deepEqual(await processWebhook(env(), postbackBody()), ["already"]);
  assert.equal(calls.filter((c) => c.method === "GET").length, 0);
  assert.match(calls[0].body.message.text, /avval yuborilgan/);
});

test("qo'llanma yuborilmasa belgi o'chiriladi (qayta urinish mumkin)", async () => {
  profileFollows = true;
  const orig = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => ((init.method || "GET") === "POST" ? Response.json({ error: { message: "x" } }, { status: 500 }) : orig(url, init));
  const r = await processWebhook(env(), postbackBody());
  assert.match(r[0], /^error:/);
  assert.equal(await kv.get("sent:555"), null);
});

test("HTTP: verify, imzo, 200", async () => {
  const e = env();
  const ok = await worker.fetch(new Request("https://w.dev/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123"), e, {});
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), "123");
  const bad = await worker.fetch(new Request("https://w.dev/webhook?hub.mode=subscribe&hub.verify_token=xato&hub.challenge=1"), e, {});
  assert.equal(bad.status, 403);

  const body = JSON.stringify(commentBody("AI"));
  const noSig = await worker.fetch(new Request("https://w.dev/webhook", { method: "POST", body }), e, {});
  assert.equal(noSig.status, 401);

  const sig = "sha256=" + crypto.createHmac("sha256", "app-secret").update(body).digest("hex");
  const pending = [];
  const res = await worker.fetch(new Request("https://w.dev/webhook", { method: "POST", body, headers: { "X-Hub-Signature-256": sig } }), e, { waitUntil: (p) => pending.push(p) });
  assert.equal(res.status, 200);
  await Promise.all(pending);
  assert.equal(calls.length, 2);
});

test("cron: token yangilanadi va KV'dan ishlatiladi", async () => {
  const pending = [];
  await worker.scheduled({}, env(), { waitUntil: (p) => pending.push(p) });
  await Promise.all(pending);
  assert.equal(await kv.get("token:access"), "new-token");
  await processWebhook(env(), postbackBody());
  assert.equal(calls.find((c) => c.method === "GET" && c.path === "/v23.0/555").auth, "Bearer new-token");
});
