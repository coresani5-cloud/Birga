// Birga — Web Push bildirishnomalari (bepul, brauzerning o'z push xizmati orqali)
// Ilova yopiq bo'lsa ham yangi xabar va kiruvchi qo'ng'iroq haqida xabar beradi.
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

function createPush(db, dataDir) {
  db.exec(`CREATE TABLE IF NOT EXISTS push_subs(endpoint TEXT PRIMARY KEY, user_id INTEGER, sub TEXT, created INTEGER);
            CREATE INDEX IF NOT EXISTS idx_push_user ON push_subs(user_id);`);
  const keyFile = path.join(dataDir, 'vapid.json');
  let keys;
  if (process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE) keys = { publicKey: process.env.VAPID_PUBLIC, privateKey: process.env.VAPID_PRIVATE };
  else if (fs.existsSync(keyFile)) keys = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  else { keys = webpush.generateVAPIDKeys(); fs.writeFileSync(keyFile, JSON.stringify(keys), { mode: 0o600 }); }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@birga.app', keys.publicKey, keys.privateKey);

  return {
    publicKey: keys.publicKey,
    subscribe(userId, sub) {
      if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint)) return false;
      db.prepare('INSERT OR REPLACE INTO push_subs(endpoint,user_id,sub,created) VALUES(?,?,?,?)').run(sub.endpoint, userId, JSON.stringify(sub), Date.now());
      return true;
    },
    unsubscribe(endpoint) { db.prepare('DELETE FROM push_subs WHERE endpoint=?').run(endpoint); },
    async send(userId, payload, opts = {}) {
      const subs = db.prepare('SELECT * FROM push_subs WHERE user_id=?').all(userId);
      await Promise.all(subs.map(async (s) => {
        try { await webpush.sendNotification(JSON.parse(s.sub), JSON.stringify(payload), { TTL: opts.ttl ?? 3600, urgency: opts.urgency || 'normal' }); }
        catch (e) { if (e.statusCode === 404 || e.statusCode === 410) db.prepare('DELETE FROM push_subs WHERE endpoint=?').run(s.endpoint); }
      }));
    },
  };
}

module.exports = { createPush };
