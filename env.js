// .env faylini o'qish (qo'shimcha kutubxonasiz)
const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, '.env');
if (fs.existsSync(f)) {
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || m[1] in process.env) continue;
    let v = m[2].trim();
    if (/^["']/.test(v)) v = v.replace(/^(["'])(.*)\1.*$/, '$2'); else v = v.replace(/\s+#.*$/, '').replace(/^#.*$/, '');
    if (v !== '') process.env[m[1]] = v;
  }
}
