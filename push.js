// Birga — Web Push bildirishnomalari (bepul, brauzerning o'z push xizmati orqali)
// Ilova yopiq bo'lsa ham yangi xabar va kiruvchi qo'ng'iroq haqida xabar beradi.
// VAPID kalitlari bazada saqlanadi — server qayta ishga tushsa ham obunalar ishlayveradi.
const webpush = require('web-push');

async function createPush(db) {
  let keys;
  if (process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE) keys = { publicKey: process.env.VAPID_PUBLIC, privateKey: process.env.VAPID_PRIVATE };
  else {
    const saved = await db.getMeta('vapid');
    if (saved) keys = JSON.parse(saved);
    else { keys = webpush.generateVAPIDKeys(); await db.setMeta('vapid', JSON.stringify(keys)); }
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@birga.app', keys.publicKey, keys.privateKey);

  return {
    publicKey: keys.publicKey,
    async subscribe(userId, sub) {
      if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint)) return false;
      await db.run('INSERT INTO push_subs(endpoint,user_id,sub,created) VALUES(?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, sub=excluded.sub',
        [sub.endpoint, userId, JSON.stringify(sub), Date.now()]);
      return true;
    },
    async unsubscribe(endpoint) { await db.run('DELETE FROM push_subs WHERE endpoint=?', [endpoint]); },
    async send(userId, payload, opts = {}) {
      const subs = await db.all('SELECT * FROM push_subs WHERE user_id=?', [userId]);
      await Promise.all(subs.map(async (s) => {
        try { await webpush.sendNotification(JSON.parse(s.sub), JSON.stringify(payload), { TTL: opts.ttl ?? 3600, urgency: opts.urgency || 'normal' }); }
        catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await db.run('DELETE FROM push_subs WHERE endpoint=?', [s.endpoint]); }
      }));
    },
  };
}

module.exports = { createPush };
