// Birga — ma'lumotlar bazasi qatlami
// DATABASE_URL berilsa PostgreSQL (masalan bepul Supabase) — ma'lumotlar doimiy saqlanadi.
// Aks holda serverdagi SQLite fayli ishlatiladi (VPS uchun qulay).
const path = require('path');
const fs = require('fs');

const PG = !!process.env.DATABASE_URL;
let pool = null, sqlite = null;

if (PG) {
  const { Pool, types } = require('pg');
  types.setTypeParser(20, (v) => Number(v)); // BIGINT -> number
  const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false }, max: Number(process.env.DB_POOL) || 5 });
  pool.on('error', (e) => console.error('DB:', e.message));
} else {
  const Database = require('better-sqlite3');
  const dir = process.env.DATA_DIR || path.join(__dirname, 'data');
  fs.mkdirSync(dir, { recursive: true });
  sqlite = new Database(path.join(dir, 'birga.db'));
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
}

const conv = (sql) => { let i = 0; return sql.replace(/\?/g, () => '$' + ++i); };

async function all(sql, params = []) {
  if (PG) return (await pool.query(conv(sql), params)).rows;
  return sqlite.prepare(sql).all(...params);
}
async function get(sql, params = []) { return (await all(sql, params))[0]; }
async function run(sql, params = []) {
  if (PG) { const r = await pool.query(conv(sql), params); return { changes: r.rowCount }; }
  const r = sqlite.prepare(sql).run(...params); return { changes: r.changes };
}
// INSERT ... -> yangi qator id si
async function insert(sql, params = []) {
  if (PG) return (await pool.query(conv(sql) + ' RETURNING id', params)).rows[0].id;
  return Number(sqlite.prepare(sql).run(...params).lastInsertRowid);
}

const ID = PG ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT)`,
  `CREATE TABLE IF NOT EXISTS users(id ${ID}, phone TEXT UNIQUE NOT NULL, name TEXT, username TEXT UNIQUE, bio TEXT DEFAULT '',
     avatar TEXT, country TEXT, lang TEXT DEFAULT 'uz', search TEXT DEFAULT '', created_at BIGINT, last_seen BIGINT)`,
  `CREATE TABLE IF NOT EXISTS codes(phone TEXT PRIMARY KEY, code_hash TEXT, expires BIGINT, attempts INTEGER DEFAULT 0, sent_at BIGINT)`,
  `CREATE TABLE IF NOT EXISTS sms_log(phone TEXT, ip TEXT, country TEXT, at BIGINT)`,
  `CREATE INDEX IF NOT EXISTS idx_sms_at ON sms_log(at)`,
  `CREATE TABLE IF NOT EXISTS chats(id ${ID}, type TEXT DEFAULT 'private', created_at BIGINT)`,
  `CREATE TABLE IF NOT EXISTS chat_members(chat_id BIGINT, user_id BIGINT, last_read_id BIGINT DEFAULT 0, muted INTEGER DEFAULT 0, PRIMARY KEY(chat_id, user_id))`,
  `CREATE INDEX IF NOT EXISTS idx_members_user ON chat_members(user_id)`,
  `CREATE TABLE IF NOT EXISTS messages(id ${ID}, chat_id BIGINT, sender_id BIGINT, type TEXT, text TEXT, file TEXT, mime TEXT, size BIGINT,
     duration REAL, meta TEXT, reply_to BIGINT, created_at BIGINT, deleted INTEGER DEFAULT 0, edited INTEGER DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_msg_chat ON messages(chat_id, id)`,
  `CREATE TABLE IF NOT EXISTS stories(id ${ID}, user_id BIGINT, file TEXT, mime TEXT, caption TEXT DEFAULT '', duration REAL,
     pinned INTEGER DEFAULT 1, created_at BIGINT, expires_at BIGINT)`,
  `CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS reels(id ${ID}, user_id BIGINT, kind TEXT, file TEXT, mime TEXT, ig_kind TEXT, ig_code TEXT, caption TEXT DEFAULT '',
     duration REAL, created_at BIGINT)`,
  `CREATE INDEX IF NOT EXISTS idx_reels_user ON reels(user_id)`,
  `CREATE TABLE IF NOT EXISTS story_views(story_id BIGINT, user_id BIGINT, at BIGINT, PRIMARY KEY(story_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS contacts(owner_id BIGINT, user_id BIGINT, name TEXT, created BIGINT, PRIMARY KEY(owner_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS media_acks(message_id BIGINT, user_id BIGINT, at BIGINT, PRIMARY KEY(message_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS push_subs(endpoint TEXT PRIMARY KEY, user_id BIGINT, sub TEXT, created BIGINT)`,
  `CREATE INDEX IF NOT EXISTS idx_push_user ON push_subs(user_id)`,
];
// eski bazalarga qo'shiladigan ustunlar
const COLUMNS = [
  ['users', 'country', 'TEXT'], ['users', 'lang', "TEXT DEFAULT 'uz'"], ['users', 'search', "TEXT DEFAULT ''"],
  ['chat_members', 'muted', 'INTEGER DEFAULT 0'], ['messages', 'edited', 'INTEGER DEFAULT 0'],
  ['chat_members', 'role', "TEXT DEFAULT 'member'"], ['chat_members', 'joined_at', 'BIGINT'],
  ['chats', 'title', 'TEXT'], ['chats', 'about', "TEXT DEFAULT ''"], ['chats', 'avatar', 'TEXT'], ['chats', 'username', 'TEXT'],
  ['chats', 'invite', 'TEXT'], ['chats', 'owner_id', 'BIGINT'], ['users', 'email', 'TEXT'], ['codes', 'email', 'TEXT'], ['messages', 'gone', 'INTEGER DEFAULT 0'],
  ['users', 'pass_hash', 'TEXT'], ['users', 'pass_hint', 'TEXT'],
];

async function columns(table) {
  if (PG) return (await all('SELECT column_name AS name FROM information_schema.columns WHERE table_name=?', [table])).map((r) => r.name);
  return sqlite.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name);
}

async function init() {
  for (const s of SCHEMA) await run(s);
  for (const [t, c, type] of COLUMNS) if (!(await columns(t)).includes(c)) await run(`ALTER TABLE ${t} ADD COLUMN ${c} ${type}`);
  await run('CREATE INDEX IF NOT EXISTS idx_chats_username ON chats(username)');
  await run('CREATE INDEX IF NOT EXISTS idx_chats_invite ON chats(invite)');
  await run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await run('CREATE INDEX IF NOT EXISTS idx_msg_file ON messages(file)');
  // qidiruv ustunini to'ldirish (eski foydalanuvchilar uchun)
  const rows = await all("SELECT id, name, username FROM users WHERE (search IS NULL OR search='') AND name IS NOT NULL");
  for (const u of rows) await run('UPDATE users SET search=? WHERE id=?', [searchKey(u.name, u.username), u.id]);
}

function searchKey(name, username) { return `${name || ''} ${username || ''}`.toLowerCase().trim(); }

async function getMeta(k) { return (await get('SELECT v FROM meta WHERE k=?', [k]))?.v; }
async function setMeta(k, v) { await run('INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v', [k, v]); }

module.exports = { all, get, run, insert, init, getMeta, setMeta, searchKey, kind: PG ? 'postgres' : 'sqlite' };
