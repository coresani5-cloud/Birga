/* Birga — O'yinlar (10 ta kichik o'yin). app.js dagi umumiy yordamchilardan foydalanadi: $, t, esc, icon, api, modal, toast. */
'use strict';
(function () {
  const L = () => (typeof LANG !== 'undefined' && ['uz', 'ru', 'en'].includes(LANG) ? LANG : '_');
  const PK = (ns) => (typeof I18N_PACK !== 'undefined' && I18N_PACK?.games?.[ns]) || null; // boshqa tillar tarjimasi (/i18n/<til>.json)
  const T = {
    uz: { score: 'Ochko', best: 'Rekord', again: 'Qayta o‘ynash', top: 'Reyting', share: 'Chatga ulashish', over: 'O‘yin tugadi', newrec: 'Yangi rekord!', rank: 'Birga’da {n}-o‘rin',
      tap_start: 'Boshlash uchun bosing', lives: 'Jon', level: 'Daraja', you: 'Siz', bot: 'Bot', win: 'Yutdingiz!', lose: 'Yutqazdingiz', draw: 'Durang', flag: 'Bayroq', open: 'Ochish',
      top_title: 'Eng yaxshi o‘yinchilar', empty_top: 'Hali hech kim o‘ynamagan — birinchi bo‘ling!', share_text: '🎮 Birga’dagi “{g}” o‘yinida {s} ochko to‘pladim! Sen ham urinib ko‘r 😉', moves: 'Yurish', time: 'Vaqt',
      hint_snake: 'Barmoq bilan suring', hint_penalty: 'Darvozaning burchagiga bosing', hint_aim: 'Nishonlarga tez bosing', hint_2048: 'Suring — bir xil sonlar qo‘shiladi', hint_flappy: 'Uchish uchun bosing',
      hint_blocks: 'Suring ←→, bosish — burish, pastga — tushirish', hint_memory: 'Juftlarini toping', hint_xo: 'Botni yengib ko‘ring', hint_breakout: 'Taxtani barmoq bilan suring', hint_mines: 'Minalarni chetlab o‘ting', hint_run: 'Suring: chap/o‘ng, tepaga — sakrash, pastga — engashish', wave: 'To‘lqin', reload: 'O‘q joylanmoqda', hint_strike: 'Chapda — yurish, ekranni suring — burilish, 🔫 — otish', hint_football: 'Joystik — yugurish, ⚽ — zarba, ↗️ — pas' },
    ru: { score: 'Очки', best: 'Рекорд', again: 'Играть снова', top: 'Рейтинг', share: 'Поделиться в чат', over: 'Игра окончена', newrec: 'Новый рекорд!', rank: '{n}-е место в Birga',
      tap_start: 'Нажмите, чтобы начать', lives: 'Жизни', level: 'Уровень', you: 'Вы', bot: 'Бот', win: 'Победа!', lose: 'Поражение', draw: 'Ничья', flag: 'Флаг', open: 'Открыть',
      top_title: 'Лучшие игроки', empty_top: 'Пока никто не играл — будьте первым!', share_text: '🎮 Набрал(а) {s} очков в игре «{g}» в Birga! Попробуй и ты 😉', moves: 'Ходы', time: 'Время',
      hint_snake: 'Свайпайте пальцем', hint_penalty: 'Нажмите в угол ворот', hint_aim: 'Быстро нажимайте на мишени', hint_2048: 'Свайп — одинаковые числа складываются', hint_flappy: 'Нажимайте, чтобы лететь',
      hint_blocks: 'Свайп ←→, нажатие — поворот, вниз — сброс', hint_memory: 'Найдите пары', hint_xo: 'Попробуйте обыграть бота', hint_breakout: 'Двигайте платформу пальцем', hint_mines: 'Обойдите мины', hint_run: 'Свайп: влево/вправо, вверх — прыжок, вниз — подкат', wave: 'Волна', reload: 'Перезарядка', hint_strike: 'Слева — ходьба, свайп по экрану — поворот, 🔫 — огонь', hint_football: 'Джойстик — бег, ⚽ — удар, ↗️ — пас' },
    en: { score: 'Score', best: 'Best', again: 'Play again', top: 'Leaderboard', share: 'Share to chat', over: 'Game over', newrec: 'New record!', rank: '#{n} on Birga',
      tap_start: 'Tap to start', lives: 'Lives', level: 'Level', you: 'You', bot: 'Bot', win: 'You win!', lose: 'You lose', draw: 'Draw', flag: 'Flag', open: 'Open',
      top_title: 'Top players', empty_top: 'Nobody has played yet — be the first!', share_text: '🎮 I scored {s} in “{g}” on Birga! Can you beat it? 😉', moves: 'Moves', time: 'Time',
      hint_snake: 'Swipe to turn', hint_penalty: 'Tap a corner of the goal', hint_aim: 'Tap the targets fast', hint_2048: 'Swipe — equal numbers merge', hint_flappy: 'Tap to fly',
      hint_blocks: 'Swipe ←→, tap to rotate, down to drop', hint_memory: 'Find the pairs', hint_xo: 'Try to beat the bot', hint_breakout: 'Drag the paddle', hint_mines: 'Avoid the mines', hint_run: 'Swipe left/right, up to jump, down to slide', wave: 'Wave', reload: 'Reloading', hint_strike: 'Left stick to move, swipe screen to turn, 🔫 to fire', hint_football: 'Stick to run, ⚽ to shoot, ↗️ to pass' },
  };
  const tg = (k) => (T[L()] || PK('g') || T.en)[k] || T.en[k] || T.uz[k];
  const GAMES = [
    { id: 'run', e: '🏃', c: ['#F97316', '#DB2777'], n: { uz: 'Birga Run', ru: 'Birga Run', en: 'Birga Run' }, big: 1 },
    { id: 'strike', e: '🔫', c: ['#475569', '#B45309'], n: { uz: 'Birga Strike', ru: 'Birga Strike', en: 'Birga Strike' } },
    { id: 'football', e: '⚽', c: ['#16A34A', '#1D4ED8'], n: { uz: 'Futbol 4×4', ru: 'Футбол 4×4', en: 'Football 4v4' } },
    { id: 'snake', e: '🐍', c: ['#22C55E', '#0EA5E9'], n: { uz: 'Ilon', ru: 'Змейка', en: 'Snake' } },
    { id: 'aim', e: '🎯', c: ['#F97316', '#DC2626'], n: { uz: 'Snayper', ru: 'Снайпер', en: 'Sniper' } },
    { id: '2048', e: '🔢', c: ['#F59E0B', '#EA580C'], n: { uz: '2048', ru: '2048', en: '2048' } },
    { id: 'flappy', e: '🐤', c: ['#38BDF8', '#2563EB'], n: { uz: 'Qushcha', ru: 'Птичка', en: 'Birdie' } },
    { id: 'blocks', e: '🧱', c: ['#8B5CF6', '#4F46E5'], n: { uz: 'Bloklar', ru: 'Блоки', en: 'Blocks' } },
    { id: 'memory', e: '🃏', c: ['#EC4899', '#8B5CF6'], n: { uz: 'Xotira', ru: 'Память', en: 'Memory' } },
    { id: 'xo', e: '❌', c: ['#0EA5E9', '#6366F1'], n: { uz: 'X-O', ru: 'Крестики-нолики', en: 'Tic-Tac-Toe' } },
    { id: 'breakout', e: '🏓', c: ['#14B8A6', '#0F766E'], n: { uz: 'G‘isht sindirish', ru: 'Арканоид', en: 'Breakout' } },
    { id: 'mines', e: '💣', c: ['#64748B', '#1E293B'], n: { uz: 'Mina qidiruv', ru: 'Сапёр', en: 'Minesweeper' } },
  ];
  const gname = (g) => g.n[L()] || PK('gn')?.[g.id] || g.n.en || g.n.uz;

  /* ---------- umumiy yordamchilar ---------- */
  let actx = null;
  function snd(f = 600, d = 0.06, v = 0.05, type = 'sine') {
    if (store.get('birga_game_sound') === '0') return;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d); o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + d); } catch {}
  }
  function canvasIn(stage, ratio) {
    const c = document.createElement('canvas'); c.className = 'gm-cv'; stage.appendChild(c);
    const g = c.getContext('2d');
    const fit = () => {
      const r = stage.getBoundingClientRect(); let w = r.width - 16, h = r.height - 16;
      if (ratio) { if (w / h > ratio) w = h * ratio; else h = w / ratio; }
      w = Math.max(200, Math.floor(w)); h = Math.max(200, Math.floor(h));
      const d = Math.min(3, devicePixelRatio || 1);
      c.style.width = w + 'px'; c.style.height = h + 'px'; c.width = Math.round(w * d); c.height = Math.round(h * d);
      g.setTransform(d, 0, 0, d, 0, 0); c.W = w; c.H = h;
    };
    fit(); return { c, g, fit };
  }
  function pos(c, e) { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function swipe(el, onDir, onTap) {
    let s = null;
    el.addEventListener('pointerdown', (e) => { s = [e.clientX, e.clientY, Date.now()]; });
    el.addEventListener('pointerup', (e) => {
      if (!s) return; const dx = e.clientX - s[0], dy = e.clientY - s[1]; const m = Math.max(Math.abs(dx), Math.abs(dy)); s = null;
      if (m < 22) { onTap?.(e); return; }
      onDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'), e);
    });
  }
  const KEYS = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', a: 'L', d: 'R', w: 'U', s: 'D' };
  function loop(fn) { let id, last = performance.now(), run = true; const f = (tt) => { if (!run) return; const dt = Math.min(0.05, (tt - last) / 1000); last = tt; fn(dt); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => { run = false; cancelAnimationFrame(id); }; }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (n) => Math.floor(Math.random() * n);
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function text(g, s, x, y, size, color = '#fff', align = 'center', weight = 800) { g.font = `${weight} ${size}px system-ui, -apple-system, Segoe UI, sans-serif`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }

  /* ---------- O'YINLAR ---------- */
  const IMPL = {};

  // 1) Ilon
  IMPL.snake = (stage, ui) => {
    const COLS = 16, ROWS = 22; const { c, g, fit } = canvasIn(stage, COLS / ROWS);
    let snake, dir, nd, food, acc, speed, score, alive, started;
    const reset = () => { snake = [[8, 12], [8, 13], [8, 14]]; dir = [0, -1]; nd = dir; food = place(); acc = 0; speed = 7; score = 0; alive = true; started = false; ui.score(0); };
    const place = () => { let p; do p = [ri(COLS), ri(ROWS)]; while (snake?.some((s) => s[0] === p[0] && s[1] === p[1])); return p; };
    const turn = (d) => { started = true; const m = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] }[d]; if (m && (m[0] !== -dir[0] || m[1] !== -dir[1])) nd = m; };
    swipe(c, turn, () => { started = true; });
    const kd = (e) => { if (KEYS[e.key]) { e.preventDefault(); turn(KEYS[e.key]); } }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      const cs = c.W / COLS;
      if (alive && started) {
        acc += dt * speed;
        while (acc >= 1) {
          acc -= 1; dir = nd; const h = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
          if (h[0] < 0 || h[1] < 0 || h[0] >= COLS || h[1] >= ROWS || snake.some((s) => s[0] === h[0] && s[1] === h[1])) { alive = false; snd(160, 0.3, 0.08, 'sawtooth'); ui.over(score); break; }
          snake.unshift(h);
          if (h[0] === food[0] && h[1] === food[1]) { score++; ui.score(score); speed = Math.min(16, 7 + score * 0.25); food = place(); snd(880); } else snake.pop();
        }
      }
      g.fillStyle = '#0B1220'; g.fillRect(0, 0, c.W, c.H);
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if ((x + y) % 2) { g.fillStyle = '#0F1A2E'; g.fillRect(x * cs, y * cs, cs, cs); }
      g.font = `${cs * 0.9}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🍎', food[0] * cs + cs / 2, food[1] * cs + cs / 2 + 1);
      snake.forEach((s, i) => { g.fillStyle = i ? `hsl(${140 - i * 2},70%,${50 - Math.min(20, i)}%)` : '#4ADE80'; rr(g, s[0] * cs + 1, s[1] * cs + 1, cs - 2, cs - 2, cs * 0.3); g.fill(); });
      const h = snake[0]; g.fillStyle = '#0B1220'; g.beginPath(); g.arc(h[0] * cs + cs * (0.5 + dir[0] * 0.2 - dir[1] * 0.18), h[1] * cs + cs * (0.5 + dir[1] * 0.2 - dir[0] * 0.18), cs * 0.09, 0, 7); g.arc(h[0] * cs + cs * (0.5 + dir[0] * 0.2 + dir[1] * 0.18), h[1] * cs + cs * (0.5 + dir[1] * 0.2 + dir[0] * 0.18), cs * 0.09, 0, 7); g.fill();
      if (!started && alive) text(g, tg('hint_snake'), c.W / 2, c.H * 0.35, 18);
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 2) Penalti (futbol)
  IMPL.penalty = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.7);
    let score, lives, keeper, kv, ball, shot, msg, msgT;
    const reset = () => { score = 0; lives = 3; keeper = 0.5; kv = 0.35; ball = null; shot = null; msg = ''; msgT = 0; ui.score(0); ui.info(`❤️ ${lives}`); };
    reset();
    c.addEventListener('pointerdown', (e) => {
      if (shot || lives <= 0) return; const [x, y] = pos(c, e); const W = c.W, H = c.H;
      const gx = W * 0.12, gw = W * 0.76, gy = H * 0.12, gh = H * 0.24;
      const tx = Math.max(gx - 30, Math.min(gx + gw + 30, x)), ty = Math.max(gy - 20, Math.min(gy + gh + 10, y));
      shot = { sx: W / 2, sy: H * 0.82, tx, ty, t: 0, dive: Math.random() < 0.55 + Math.min(0.3, score * 0.02) ? (tx - gx) / gw : Math.random() };
      snd(300, 0.08, 0.08, 'triangle');
    });
    const stop = loop((dt) => {
      const W = c.W, H = c.H; const gx = W * 0.12, gw = W * 0.76, gy = H * 0.12, gh = H * 0.24;
      const kw = gw * (0.24 + Math.min(0.08, score * 0.006));
      if (!shot) { keeper += kv * dt * (1 + score * 0.06); if (keeper > 0.88 || keeper < 0.12) kv = -kv; keeper = Math.max(0.12, Math.min(0.88, keeper)); }
      else {
        shot.t += dt * 1.9;
        keeper += (Math.max(0.12, Math.min(0.88, shot.dive)) - keeper) * Math.min(1, dt * (3.2 + score * 0.15));
        if (shot.t >= 1 && !shot.done) {
          shot.done = true; const kx = gx + keeper * gw;
          const inGoal = shot.tx > gx + 4 && shot.tx < gx + gw - 4 && shot.ty > gy + 4 && shot.ty < gy + gh;
          const saved = inGoal && Math.abs(shot.tx - kx) < kw / 2 + 10 && shot.ty > gy + gh * 0.05;
          if (inGoal && !saved) { score++; ui.score(score); msg = 'GOOOL! ⚽'; snd(1046, 0.25, 0.08); }
          else { lives--; ui.info(`❤️ ${Math.max(0, lives)}`); msg = saved ? '🧤 !!!' : '❌'; snd(180, 0.25, 0.08, 'sawtooth'); }
          msgT = 1.1;
          setTimeout(() => { shot = null; if (lives <= 0) ui.over(score); }, 900);
        }
      }
      // maydon
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#15803D'); gr.addColorStop(1, '#166534'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)'; g.fillRect(0, (H / 8) * i, W, H / 8); }
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.strokeRect(W * 0.04, gy + gh, W * 0.92, H * 0.3); g.beginPath(); g.arc(W / 2, H * 0.82, 4, 0, 7); g.fillStyle = '#fff'; g.fill();
      // darvoza
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(gx, gy, gw, gh);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(gx + (gw / 12) * i, gy); g.lineTo(gx + (gw / 12) * i, gy + gh); g.stroke(); } for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(gx, gy + (gh / 5) * i); g.lineTo(gx + gw, gy + (gh / 5) * i); g.stroke(); }
      g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(gx, gy + gh); g.lineTo(gx, gy); g.lineTo(gx + gw, gy); g.lineTo(gx + gw, gy + gh); g.stroke();
      // darvozabon
      const kx = gx + keeper * gw; g.fillStyle = '#F59E0B'; rr(g, kx - kw / 2, gy + gh * 0.35, kw, gh * 0.5, 10); g.fill();
      g.fillStyle = '#FCD34D'; g.beginPath(); g.arc(kx, gy + gh * 0.25, gh * 0.14, 0, 7); g.fill();
      text(g, '🧤', kx - kw / 2, gy + gh * 0.4, gh * 0.22); text(g, '🧤', kx + kw / 2, gy + gh * 0.4, gh * 0.22);
      // to'p
      let bx = W / 2, by = H * 0.82, bs = W * 0.09;
      if (shot) { const k = Math.min(1, shot.t); bx = shot.sx + (shot.tx - shot.sx) * k; by = shot.sy + (shot.ty - shot.sy) * k - Math.sin(k * Math.PI) * 30; bs = W * (0.09 - 0.04 * k); }
      g.font = `${bs}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚽', bx, by);
      if (!shot && score === 0 && lives === 3) text(g, tg('hint_penalty'), W / 2, H * 0.6, 17);
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, H * 0.52, 40); }
    });
    return { stop, restart: reset, resize: fit };
  };

  // 3) Snayper (nishonga otish, CS uslubida)
  IMPL.aim = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, null);
    let targets, score, lives, spawnT, combo, shots, hx, hy, flash;
    const reset = () => { targets = []; score = 0; lives = 3; spawnT = 0.5; combo = 0; shots = []; flash = 0; ui.score(0); ui.info(`❤️ 3`); };
    reset();
    c.addEventListener('pointermove', (e) => { [hx, hy] = pos(c, e); });
    c.addEventListener('pointerdown', (e) => {
      if (lives <= 0) return; const [x, y] = pos(c, e); hx = x; hy = y; shots.push({ x, y, t: 0.25 }); snd(220, 0.07, 0.06, 'square');
      let hit = -1; for (let i = targets.length - 1; i >= 0; i--) { const tt = targets[i]; if (Math.hypot(x - tt.x, y - tt.y) < tt.r * tt.s) { hit = i; break; } }
      if (hit >= 0) { const tt = targets[hit]; const head = Math.hypot(x - tt.x, y - tt.y) < tt.r * tt.s * 0.35; combo++; const pts = (head ? 3 : 1) * (1 + Math.floor(combo / 5)); score += pts; ui.score(score); targets.splice(hit, 1); snd(head ? 1300 : 900, 0.08, 0.07); tt.pop = head ? 'HEADSHOT +' + pts : '+' + pts; pops.push({ ...tt, t: 0.7 }); }
      else { combo = 0; }
    });
    const pops = [];
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      if (lives > 0) {
        spawnT -= dt; const rate = Math.max(0.35, 1.1 - score * 0.012);
        if (spawnT <= 0) { spawnT = rate; const r = Math.max(22, 38 - score * 0.15); targets.push({ x: rnd(r + 10, W - r - 10), y: rnd(r + 60, H - r - 20), r, s: 0, life: Math.max(1.1, 2.4 - score * 0.02), age: 0, kind: Math.random() < 0.15 ? 'hostage' : 'enemy' }); }
        for (let i = targets.length - 1; i >= 0; i--) { const tt = targets[i]; tt.age += dt; tt.s = Math.min(1, tt.age * 6) * (tt.age > tt.life - 0.25 ? Math.max(0, (tt.life - tt.age) / 0.25) : 1); if (tt.age >= tt.life) { targets.splice(i, 1); if (tt.kind === 'enemy') { lives--; combo = 0; flash = 0.25; ui.info(`❤️ ${Math.max(0, lives)}`); snd(140, 0.2, 0.08, 'sawtooth'); if (lives <= 0) ui.over(score); } } }
      }
      // fon — ombor devori
      g.fillStyle = '#2B2118'; g.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 34) for (let x = (y / 34) % 2 ? -30 : 0; x < W; x += 60) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 1, y + 1, 58, 32); g.fillStyle = 'rgba(255,200,120,.05)'; g.fillRect(x + 2, y + 2, 56, 3); }
      for (const tt of targets) {
        const r = tt.r * tt.s; if (r <= 0) continue;
        g.save(); g.translate(tt.x, tt.y);
        if (tt.kind === 'hostage') { g.fillStyle = '#E5E7EB'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); text(g, '🙋', 0, 2, r * 1.2); }
        else { [1, 0.72, 0.44, 0.18].forEach((k, i) => { g.fillStyle = i % 2 ? '#fff' : '#DC2626'; g.beginPath(); g.arc(0, 0, r * k, 0, 7); g.fill(); }); }
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - tt.age / tt.life)); g.stroke();
        g.restore();
      }
      for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.t -= dt; if (p.t <= 0) { pops.splice(i, 1); continue; } g.globalAlpha = Math.min(1, p.t * 2); text(g, p.pop, p.x, p.y - (0.7 - p.t) * 50, 18, '#FDE047'); g.globalAlpha = 1; }
      for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t -= dt; if (s.t <= 0) { shots.splice(i, 1); continue; } g.fillStyle = `rgba(20,20,20,${s.t * 3})`; g.beginPath(); g.arc(s.x, s.y, 4, 0, 7); g.fill(); }
      if (hx != null) { g.strokeStyle = '#4ADE80'; g.lineWidth = 2; g.beginPath(); g.arc(hx, hy, 14, 0, 7); g.moveTo(hx - 22, hy); g.lineTo(hx - 7, hy); g.moveTo(hx + 7, hy); g.lineTo(hx + 22, hy); g.moveTo(hx, hy - 22); g.lineTo(hx, hy - 7); g.moveTo(hx, hy + 7); g.lineTo(hx, hy + 22); g.stroke(); }
      if (combo >= 5) text(g, `🔥 x${1 + Math.floor(combo / 5)}`, W - 50, 30, 20, '#FDE047');
      if (flash > 0) { flash -= dt; g.fillStyle = `rgba(220,38,38,${flash})`; g.fillRect(0, 0, W, H); }
      if (score === 0 && lives === 3 && !targets.length) text(g, tg('hint_aim'), W / 2, H / 2, 18);
    });
    return { stop, restart: reset, resize: fit };
  };

  // 4) 2048
  IMPL['2048'] = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 1);
    let b, score, anim, dead;
    const COL = { 2: '#EEE4DA', 4: '#EDE0C8', 8: '#F2B179', 16: '#F59563', 32: '#F67C5F', 64: '#F65E3B', 128: '#EDCF72', 256: '#EDCC61', 512: '#EDC850', 1024: '#EDC53F', 2048: '#EDC22E' };
    const add = () => { const e = []; b.forEach((r, y) => r.forEach((v, x) => !v && e.push([x, y]))); if (!e.length) return; const [x, y] = e[ri(e.length)]; b[y][x] = Math.random() < 0.9 ? 2 : 4; anim[y][x] = 0; };
    const reset = () => { b = Array.from({ length: 4 }, () => [0, 0, 0, 0]); anim = Array.from({ length: 4 }, () => [1, 1, 1, 1]); score = 0; dead = false; add(); add(); ui.score(0); };
    const canMove = () => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { if (!b[y][x]) return true; if (x < 3 && b[y][x] === b[y][x + 1]) return true; if (y < 3 && b[y][x] === b[y + 1][x]) return true; } return false; };
    const move = (d) => {
      if (dead) return; let moved = false;
      const get = (i, j) => (d === 'L' ? [i, j] : d === 'R' ? [i, 3 - j] : d === 'U' ? [j, i] : [3 - j, i]);
      for (let i = 0; i < 4; i++) {
        const line = []; for (let j = 0; j < 4; j++) { const [y, x] = get(i, j); if (b[y][x]) line.push(b[y][x]); }
        const out = []; for (let k = 0; k < line.length; k++) { if (line[k] === line[k + 1]) { out.push(line[k] * 2); score += line[k] * 2; k++; } else out.push(line[k]); }
        for (let j = 0; j < 4; j++) { const [y, x] = get(i, j); const v = out[j] || 0; if (b[y][x] !== v) { moved = true; if (v > b[y][x] && b[y][x]) anim[y][x] = 0.6; } b[y][x] = v; }
      }
      if (moved) { add(); ui.score(score); snd(500, 0.04, 0.04); if (!canMove()) { dead = true; setTimeout(() => ui.over(score), 400); } }
    };
    swipe(c, move); const kd = (e) => { if (KEYS[e.key]) { e.preventDefault(); move(KEYS[e.key]); } }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      const W = c.W, p = W * 0.03, cs = (W - p * 5) / 4;
      g.fillStyle = '#BBADA0'; rr(g, 0, 0, W, W, 14); g.fill();
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        const v = b[y][x]; anim[y][x] = Math.min(1, anim[y][x] + dt * 6); const k = v ? 0.6 + 0.4 * anim[y][x] : 1;
        const X = p + x * (cs + p), Y = p + y * (cs + p);
        g.fillStyle = v ? COL[v] || '#3C3A32' : '#CDC1B4'; rr(g, X + (cs * (1 - k)) / 2, Y + (cs * (1 - k)) / 2, cs * k, cs * k, 8); g.fill();
        if (v) text(g, String(v), X + cs / 2, Y + cs / 2 + 1, cs * (v < 100 ? 0.45 : v < 1000 ? 0.36 : 0.28) * k, v <= 4 ? '#776E65' : '#fff');
      }
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 5) Qushcha (Flappy)
  IMPL.flappy = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.62);
    let y, vy, pipes, score, alive, started, tPipe, ground;
    const reset = () => { y = 0.45; vy = 0; pipes = []; score = 0; alive = true; started = false; tPipe = 0; ground = 0; ui.score(0); };
    const flap = () => { if (!alive) return; started = true; vy = -0.62; snd(700, 0.05, 0.04); };
    c.addEventListener('pointerdown', flap); const kd = (e) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      const W = c.W, H = c.H, gap = 0.27 - Math.min(0.06, score * 0.002), sp = 0.3 + Math.min(0.15, score * 0.004);
      if (alive && started) {
        vy += 1.65 * dt; y += vy * dt; tPipe -= dt; ground = (ground + sp * dt) % 0.1;
        if (tPipe <= 0) { tPipe = 1.45; pipes.push({ x: 1.1, gy: rnd(0.22, 0.68), s: false }); }
        for (const p of pipes) { p.x -= sp * dt; if (!p.s && p.x < 0.2) { p.s = true; score++; ui.score(score); snd(990, 0.06, 0.05); } }
        pipes = pipes.filter((p) => p.x > -0.3);
        const bx = 0.25, br = 0.035 * (H / W) * 0.62;
        const hit = y > 0.9 - br || y < 0 || pipes.some((p) => Math.abs(p.x - bx) < 0.1 && (y - br < p.gy - gap / 2 || y + br > p.gy + gap / 2));
        if (hit) { alive = false; snd(150, 0.3, 0.08, 'sawtooth'); setTimeout(() => ui.over(score), 500); }
      }
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7DD3FC'); sky.addColorStop(1, '#BAE6FD'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.8)'; [[0.2, 0.15], [0.7, 0.25], [0.45, 0.08]].forEach(([cx, cy]) => { g.beginPath(); g.arc(cx * W, cy * H, 22, 0, 7); g.arc(cx * W + 22, cy * H + 5, 18, 0, 7); g.arc(cx * W - 20, cy * H + 6, 15, 0, 7); g.fill(); });
      for (const p of pipes) { const x = (p.x - 0.08) * W, w = 0.16 * W; g.fillStyle = '#22C55E'; g.fillRect(x, 0, w, (p.gy - gap / 2) * H); g.fillRect(x, (p.gy + gap / 2) * H, w, H); g.fillStyle = '#15803D'; g.fillRect(x - 4, (p.gy - gap / 2) * H - 18, w + 8, 18); g.fillRect(x - 4, (p.gy + gap / 2) * H, w + 8, 18); }
      g.fillStyle = '#D97706'; g.fillRect(0, 0.9 * H, W, H * 0.1); g.fillStyle = '#84CC16'; g.fillRect(0, 0.9 * H, W, 10);
      g.save(); g.translate(0.25 * W, y * H); g.rotate(Math.max(-0.5, Math.min(1.2, vy * 1.4))); g.font = `${W * 0.11}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.scale(-1, 1); g.fillText('🐤', 0, 0); g.restore();
      if (!started) text(g, tg('hint_flappy'), W / 2, H * 0.62, 18, '#0C4A6E');
      text(g, String(score), W / 2, H * 0.12, 44, '#fff');
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 6) Bloklar (Tetris)
  IMPL.blocks = (stage, ui) => {
    const COLS = 10, ROWS = 20; const { c, g, fit } = canvasIn(stage, (COLS + 4.5) / ROWS);
    const SH = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]]];
    const CL = ['#22D3EE', '#FACC15', '#A855F7', '#3B82F6', '#F97316', '#EF4444', '#22C55E'];
    let grid, cur, next, acc, score, lines, dead;
    const newP = () => { const i = ri(7); return { m: SH[i].map((r) => r.slice()), c: i, x: 3, y: 0 }; };
    const fits = (m, x, y) => m.every((r, j) => r.every((v, i) => !v || (x + i >= 0 && x + i < COLS && y + j < ROWS && (y + j < 0 || !grid[y + j][x + i]))));
    const rot = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
    const reset = () => { grid = Array.from({ length: ROWS }, () => Array(COLS).fill(-1).map(() => null)); cur = newP(); next = newP(); acc = 0; score = 0; lines = 0; dead = false; ui.score(0); ui.info(`${tg('level')} 1`); };
    const lock = () => {
      cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) grid[cur.y + j][cur.x + i] = cur.c; }));
      let n = 0; for (let y = ROWS - 1; y >= 0; y--) if (grid[y].every((v) => v !== null)) { grid.splice(y, 1); grid.unshift(Array(COLS).fill(null)); n++; y++; }
      if (n) { lines += n; score += [0, 100, 300, 500, 800][n] * (1 + Math.floor(lines / 10)); ui.score(score); ui.info(`${tg('level')} ${1 + Math.floor(lines / 10)}`); snd(880, 0.12, 0.06); } else snd(260, 0.04, 0.04);
      cur = next; next = newP(); if (!fits(cur.m, cur.x, cur.y)) { dead = true; snd(150, 0.4, 0.08, 'sawtooth'); ui.over(score); }
    };
    const act = (d) => {
      if (dead) return;
      if (d === 'L' && fits(cur.m, cur.x - 1, cur.y)) cur.x--;
      if (d === 'R' && fits(cur.m, cur.x + 1, cur.y)) cur.x++;
      if (d === 'U' || d === 'rot') { const m = rot(cur.m); for (const k of [0, -1, 1, -2, 2]) if (fits(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; break; } }
      if (d === 'D') { while (fits(cur.m, cur.x, cur.y + 1)) { cur.y++; score += 2; } ui.score(score); lock(); }
    };
    // barmoq bilan: chapga/o'ngga sudrash har 1 katakda siljitadi
    let drag = null;
    c.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, moved: false, t: Date.now() }; });
    c.addEventListener('pointermove', (e) => { if (!drag) return; const cs = c.W / (COLS + 4.5); while (e.clientX - drag.x > cs) { act('R'); drag.x += cs; drag.moved = true; } while (drag.x - e.clientX > cs) { act('L'); drag.x -= cs; drag.moved = true; } });
    c.addEventListener('pointerup', (e) => { if (!drag) return; const dy = e.clientY - drag.y; if (dy > 60 && Date.now() - drag.t < 400) act('D'); else if (!drag.moved && Math.abs(dy) < 15) act('rot'); drag = null; });
    const kd = (e) => { if (KEYS[e.key] || e.key === ' ') { e.preventDefault(); act(e.key === ' ' ? 'D' : KEYS[e.key] === 'D' ? 'down1' : KEYS[e.key]); if (KEYS[e.key] === 'D' && fits(cur.m, cur.x, cur.y + 1)) cur.y++; } }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      if (!dead) { acc += dt * (1.6 + Math.floor(lines / 10) * 0.7); while (acc >= 1) { acc -= 1; if (fits(cur.m, cur.x, cur.y + 1)) cur.y++; else { lock(); break; } } }
      const cs = c.W / (COLS + 4.5), W = cs * COLS;
      g.fillStyle = '#0F172A'; g.fillRect(0, 0, c.W, c.H); g.fillStyle = '#111C33'; g.fillRect(0, 0, W, cs * ROWS);
      const cell = (x, y, ci, a = 1) => { g.globalAlpha = a; g.fillStyle = CL[ci]; rr(g, x * cs + 1, y * cs + 1, cs - 2, cs - 2, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x * cs + 3, y * cs + 3, cs - 6, 3); g.globalAlpha = 1; };
      grid.forEach((r, y) => r.forEach((v, x) => v !== null && cell(x, y, v)));
      if (!dead) { let gy = cur.y; while (fits(cur.m, cur.x, gy + 1)) gy++; cur.m.forEach((r, j) => r.forEach((v, i) => { if (v) { cell(cur.x + i, gy + j, cur.c, 0.2); cell(cur.x + i, cur.y + j, cur.c); } })); }
      text(g, 'NEXT', W + cs * 2.25, cs * 1.2, cs * 0.6, '#94A3B8');
      next.m.forEach((r, j) => r.forEach((v, i) => { if (v) { g.fillStyle = CL[next.c]; rr(g, W + cs * 0.6 + i * cs * 0.8, cs * 2 + j * cs * 0.8, cs * 0.75, cs * 0.75, 3); g.fill(); } }));
      text(g, String(lines), W + cs * 2.25, cs * 6, cs * 0.9, '#E2E8F0'); text(g, 'LINES', W + cs * 2.25, cs * 6.9, cs * 0.45, '#94A3B8');
      if (score === 0 && !dead && lines === 0 && cur.y < 3) text(g, tg('hint_blocks'), W / 2, cs * ROWS * 0.45, Math.min(15, cs * 0.6), '#CBD5E1', 'center', 600);
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 7) Xotira (juftlarni topish)
  IMPL.memory = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.8);
    const EM = ['🍎', '🚗', '⚽', '🐱', '🌙', '🎸', '🍕', '🚀', '🌵', '🎁', '🐳', '⭐'];
    let cards, open, moves, t0, done, lockT, level, total;
    const deal = () => { const n = level === 1 ? 6 : 8; const pick = EM.slice().sort(() => Math.random() - 0.5).slice(0, n); cards = [...pick, ...pick].sort(() => Math.random() - 0.5).map((e) => ({ e, up: false, ok: false, f: 0 })); open = []; t0 = performance.now(); done = false; lockT = 0; };
    const reset = () => { level = 1; total = 0; moves = 0; deal(); ui.score(0); ui.info(`${tg('level')} 1`); };
    const dims = () => (cards.length === 12 ? [3, 4] : [4, 4]);
    c.addEventListener('pointerdown', (e) => {
      if (done || lockT > 0) return; const [x, y] = pos(c, e); const [C, R] = dims(); const cw = c.W / C, ch = c.H / R; const i = Math.floor(y / ch) * C + Math.floor(x / cw);
      const k = cards[i]; if (!k || k.up || k.ok) return; k.up = true; open.push(k); snd(600, 0.04, 0.04);
      if (open.length === 2) {
        moves++;
        if (open[0].e === open[1].e) { open.forEach((q) => (q.ok = true)); open = []; snd(990, 0.1, 0.05); total += 50; ui.score(total);
          if (cards.every((q) => q.ok)) { const secs = (performance.now() - t0) / 1000; total += Math.max(20, Math.round(400 - secs * 6 - moves * 4)) * level; ui.score(total); done = true;
            if (level < 4) setTimeout(() => { level++; moves = 0; ui.info(`${tg('level')} ${level}`); deal(); }, 900); else setTimeout(() => ui.over(total), 700); } }
        else lockT = 0.75;
      }
    });
    reset();
    const stop = loop((dt) => {
      if (lockT > 0) { lockT -= dt; if (lockT <= 0) { open.forEach((q) => (q.up = false)); open = []; } }
      g.fillStyle = '#1E1B4B'; g.fillRect(0, 0, c.W, c.H);
      const [C, R] = dims(); const cw = c.W / C, ch = c.H / R;
      cards.forEach((k, i) => {
        k.f += ((k.up || k.ok ? 1 : 0) - k.f) * Math.min(1, dt * 12);
        const x = (i % C) * cw, y = Math.floor(i / C) * ch, s = Math.abs(Math.cos(k.f * Math.PI)); const face = k.f > 0.5;
        g.save(); g.translate(x + cw / 2, y + ch / 2); g.scale(Math.max(0.02, s), 1);
        g.fillStyle = face ? (k.ok ? '#BBF7D0' : '#fff') : '#7C3AED'; rr(g, -cw / 2 + 5, -ch / 2 + 5, cw - 10, ch - 10, 12); g.fill();
        if (face) text(g, k.e, 0, 2, Math.min(cw, ch) * 0.48); else text(g, '?', 0, 2, Math.min(cw, ch) * 0.35, 'rgba(255,255,255,.6)');
        g.restore();
      });
    });
    return { stop, restart: reset, resize: fit };
  };

  // 8) X-O (bot bilan)
  IMPL.xo = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 1);
    let b, turn, streak, msg, msgT, busy;
    const LN = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const win = (bb) => { for (const l of LN) if (bb[l[0]] && bb[l[0]] === bb[l[1]] && bb[l[1]] === bb[l[2]]) return { w: bb[l[0]], l }; return bb.every(Boolean) ? { w: 'D' } : null; };
    const mm = (bb, p) => { const r = win(bb); if (r) return r.w === 'O' ? 10 : r.w === 'X' ? -10 : 0; let best = p === 'O' ? -99 : 99; for (let i = 0; i < 9; i++) if (!bb[i]) { bb[i] = p; const v = mm(bb, p === 'O' ? 'X' : 'O'); bb[i] = null; best = p === 'O' ? Math.max(best, v) : Math.min(best, v); } return best; };
    const botMove = () => {
      const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      const smart = Math.random() < Math.min(0.95, 0.6 + streak * 0.08); let pick = free[ri(free.length)];
      if (smart) { let best = -99; for (const i of free) { b[i] = 'O'; const v = mm(b, 'X'); b[i] = null; if (v > best) { best = v; pick = i; } } }
      b[pick] = 'O'; snd(420, 0.05, 0.04);
    };
    const round = () => { b = Array(9).fill(null); turn = 'X'; busy = false; };
    const reset = () => { streak = 0; msg = ''; msgT = 0; round(); ui.score(0); ui.info(`${tg('you')} ❌ · ${tg('bot')} ⭕`); };
    const end = (r) => {
      busy = true; msgT = 1.3;
      if (r.w === 'X') { streak++; ui.score(streak); msg = tg('win'); snd(1046, 0.2, 0.06); setTimeout(round, 1300); }
      else if (r.w === 'D') { msg = tg('draw'); setTimeout(round, 1300); }
      else { msg = tg('lose'); snd(160, 0.3, 0.07, 'sawtooth'); setTimeout(() => ui.over(streak), 1300); }
    };
    c.addEventListener('pointerdown', (e) => {
      if (busy || turn !== 'X') return; const [x, y] = pos(c, e); const i = Math.floor(y / (c.H / 3)) * 3 + Math.floor(x / (c.W / 3));
      if (b[i]) return; b[i] = 'X'; snd(700, 0.05, 0.04); let r = win(b); if (r) return end(r);
      turn = 'O'; busy = true; setTimeout(() => { botMove(); turn = 'X'; busy = false; r = win(b); if (r) end(r); }, 380);
    });
    reset();
    const stop = loop((dt) => {
      const W = c.W, s = W / 3; g.fillStyle = '#0F172A'; g.fillRect(0, 0, W, W);
      g.strokeStyle = '#334155'; g.lineWidth = 6; g.lineCap = 'round'; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(s * i, 14); g.lineTo(s * i, W - 14); g.moveTo(14, s * i); g.lineTo(W - 14, s * i); g.stroke(); }
      b.forEach((v, i) => { const x = (i % 3) * s + s / 2, y = Math.floor(i / 3) * s + s / 2, r = s * 0.28;
        if (v === 'X') { g.strokeStyle = '#38BDF8'; g.lineWidth = 10; g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke(); }
        if (v === 'O') { g.strokeStyle = '#F472B6'; g.lineWidth = 10; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); } });
      const r = win(b); if (r?.l) { const a = r.l[0], z = r.l[2]; g.strokeStyle = '#FDE047'; g.lineWidth = 8; g.beginPath(); g.moveTo((a % 3) * s + s / 2, Math.floor(a / 3) * s + s / 2); g.lineTo((z % 3) * s + s / 2, Math.floor(z / 3) * s + s / 2); g.stroke(); }
      if (msgT > 0) { msgT -= dt; g.fillStyle = 'rgba(15,23,42,.6)'; g.fillRect(0, W / 2 - 34, W, 68); text(g, msg, W / 2, W / 2, 34); }
    });
    return { stop, restart: reset, resize: fit };
  };

  // 9) G'isht sindirish (Breakout)
  IMPL.breakout = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.66);
    let px, ball, bricks, score, lives, level, stuck;
    const build = () => { bricks = []; const rows = Math.min(8, 4 + level); for (let r = 0; r < rows; r++) for (let i = 0; i < 8; i++) bricks.push({ x: i / 8, y: 0.1 + r * 0.045, hp: r < level - 1 ? 2 : 1, hue: (r * 40 + level * 30) % 360 }); };
    const serve = () => { stuck = true; ball = { x: px, y: 0.86, vx: 0, vy: 0 }; };
    const reset = () => { px = 0.5; score = 0; lives = 3; level = 1; build(); serve(); ui.score(0); ui.info(`❤️ 3`); };
    const launch = () => { if (!stuck) return; stuck = false; const sp = 0.62 + level * 0.06; ball.vx = rnd(-0.5, 0.5) * sp; ball.vy = -sp; };
    c.addEventListener('pointermove', (e) => { const [x] = pos(c, e); px = Math.max(0.1, Math.min(0.9, x / c.W)); });
    c.addEventListener('pointerdown', (e) => { const [x] = pos(c, e); px = Math.max(0.1, Math.min(0.9, x / c.W)); launch(); });
    const kd = (e) => { if (e.key === 'ArrowLeft') px = Math.max(0.1, px - 0.06); if (e.key === 'ArrowRight') px = Math.min(0.9, px + 0.06); if (e.key === ' ') launch(); }; addEventListener('keydown', kd);
    reset();
    const stop = loop((dt) => {
      const W = c.W, H = c.H, ar = W / H, pw = 0.2, R = 0.016;
      if (stuck) { ball.x = px; ball.y = 0.9 - 0.035; }
      else if (lives > 0) {
        for (let k = 0; k < 2; k++) {
          ball.x += (ball.vx * dt) / 2; ball.y += ((ball.vy * dt) / 2) * ar;
          if (ball.x < R || ball.x > 1 - R) { ball.vx = -ball.vx; ball.x = Math.max(R, Math.min(1 - R, ball.x)); snd(500, 0.02, 0.03); }
          if (ball.y < 0.04) { ball.vy = Math.abs(ball.vy); snd(500, 0.02, 0.03); }
          if (ball.vy > 0 && ball.y > 0.9 - 0.02 && ball.y < 0.93 && Math.abs(ball.x - px) < pw / 2 + R) { const off = (ball.x - px) / (pw / 2); const sp = Math.hypot(ball.vx, ball.vy); ball.vx = off * sp * 0.8; ball.vy = -Math.sqrt(Math.max(0.05, sp * sp - ball.vx * ball.vx)); snd(380, 0.03, 0.04); }
          for (const br of bricks) { if (br.hp <= 0) continue; if (ball.x > br.x && ball.x < br.x + 1 / 8 && ball.y > br.y && ball.y < br.y + 0.04) { br.hp--; ball.vy = -ball.vy; if (br.hp <= 0) { score += 10 * level; ui.score(score); snd(900, 0.04, 0.05); } break; } }
          if (ball.y > 1) { lives--; ui.info(`❤️ ${Math.max(0, lives)}`); snd(150, 0.3, 0.07, 'sawtooth'); if (lives <= 0) { ui.over(score); return; } serve(); break; }
        }
        if (bricks.every((b2) => b2.hp <= 0)) { level++; score += 100; ui.score(score); build(); serve(); snd(1200, 0.25, 0.06); }
      }
      g.fillStyle = '#042F2E'; g.fillRect(0, 0, W, H);
      for (const br of bricks) if (br.hp > 0) { g.fillStyle = `hsl(${br.hue},75%,${br.hp > 1 ? 40 : 58}%)`; rr(g, br.x * W + 2, br.y * H + 2, W / 8 - 4, 0.04 * H - 4, 5); g.fill(); }
      g.fillStyle = '#F8FAFC'; rr(g, (px - pw / 2) * W, 0.9 * H, pw * W, 0.022 * H, 8); g.fill();
      g.fillStyle = '#FDE047'; g.beginPath(); g.arc(ball.x * W, ball.y * H, R * W, 0, 7); g.fill();
      if (stuck && score === 0 && lives === 3) text(g, tg('hint_breakout'), W / 2, H * 0.6, 16, '#CCFBF1');
    });
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // 10) Mina qidiruv
  IMPL.mines = (stage, ui) => {
    const N = 9, M = 10; const { c, g, fit } = canvasIn(stage, 1);
    let cells, first, dead, won, t0, flagMode, opened;
    const nb = (i) => { const x = i % N, y = Math.floor(i / N), r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if ((dx || dy) && X >= 0 && Y >= 0 && X < N && Y < N) r.push(Y * N + X); } return r; };
    const reset = () => { cells = Array.from({ length: N * N }, () => ({ m: false, o: false, f: false, n: 0 })); first = true; dead = false; won = false; t0 = 0; flagMode = false; opened = 0; ui.score(0); ui.info(`💣 ${M}`); ui.extra(`<button class="gm-mode">⛏️ ${tg('open')}</button>`, () => { flagMode = !flagMode; return flagMode ? `🚩 ${tg('flag')}` : `⛏️ ${tg('open')}`; }); };
    const plant = (safe) => { const ban = new Set([safe, ...nb(safe)]); let k = 0; while (k < M) { const i = ri(N * N); if (!cells[i].m && !ban.has(i)) { cells[i].m = true; k++; } } cells.forEach((q, i) => (q.n = nb(i).filter((j) => cells[j].m).length)); t0 = performance.now(); };
    const reveal = (i) => { const q = cells[i]; if (q.o || q.f) return; q.o = true; opened++; if (!q.n && !q.m) nb(i).forEach(reveal); };
    const tap = (i, flag) => {
      if (dead || won) return; const q = cells[i];
      if (flag) { if (!q.o) { q.f = !q.f; snd(500, 0.03, 0.03); ui.info(`💣 ${M - cells.filter((x) => x.f).length}`); } return; }
      if (q.f) return; if (first) { first = false; plant(i); }
      if (q.m) { q.o = true; dead = true; cells.forEach((x) => x.m && (x.o = true)); snd(120, 0.5, 0.09, 'sawtooth'); setTimeout(() => ui.over(0), 900); return; }
      reveal(i); snd(650, 0.03, 0.03);
      if (opened === N * N - M) { won = true; const secs = (performance.now() - t0) / 1000; const sc = Math.max(10, Math.round(1000 - secs * 5)); ui.score(sc); snd(1200, 0.3, 0.06); setTimeout(() => ui.over(sc), 900); }
    };
    let lp = null, lpFired = false;
    c.addEventListener('pointerdown', (e) => { const [x, y] = pos(c, e); const i = Math.floor(y / (c.H / N)) * N + Math.floor(x / (c.W / N)); lpFired = false; lp = setTimeout(() => { lpFired = true; navigator.vibrate?.(20); tap(i, true); }, 380); c._i = i; });
    c.addEventListener('pointerup', () => { clearTimeout(lp); if (!lpFired && c._i != null) tap(c._i, flagMode); c._i = null; });
    c.addEventListener('contextmenu', (e) => { e.preventDefault(); });
    reset();
    const COLN = ['', '#2563EB', '#16A34A', '#DC2626', '#7C3AED', '#B45309', '#0891B2', '#111827', '#6B7280'];
    const stop = loop(() => {
      const s = c.W / N; g.fillStyle = '#94A3B8'; g.fillRect(0, 0, c.W, c.W);
      cells.forEach((q, i) => { const x = (i % N) * s, y = Math.floor(i / N) * s;
        g.fillStyle = q.o ? (q.m ? '#FCA5A5' : '#F1F5F9') : (i + Math.floor(i / N)) % 2 ? '#4ADE80' : '#22C55E'; g.fillRect(x + 1, y + 1, s - 2, s - 2);
        if (q.o && q.m) text(g, '💣', x + s / 2, y + s / 2 + 1, s * 0.6); else if (q.o && q.n) text(g, String(q.n), x + s / 2, y + s / 2 + 1, s * 0.55, COLN[q.n]); else if (!q.o && q.f) text(g, '🚩', x + s / 2, y + s / 2 + 1, s * 0.55); });
      if (!dead && !won && t0) { const secs = Math.floor((performance.now() - t0) / 1000); ui.score(Math.max(10, 1000 - secs * 5)); }
    });
    return { stop, restart: reset, resize: fit };
  };

  // 11) Birga Run — 3 yo'lakli yuguruvchi (Subway uslubida, psevdo-3D)
  IMPL.run = (stage, ui) => {
    const { c, g, fit } = canvasIn(stage, 0.58);
    const LW = 0.72, ZP = 3, FAR = 70, CAMH = 2.25, PH = 1.3;
    const TRAIN_C = [['#DC2626', '#991B1B'], ['#2563EB', '#1E3A8A'], ['#F59E0B', '#B45309'], ['#10B981', '#065F46'], ['#8B5CF6', '#5B21B6']];
    const BLD_C = ['#F472B6', '#60A5FA', '#FBBF24', '#34D399', '#A78BFA', '#FB7185', '#38BDF8'];
    let P, objs, side, speed, dist, coins, spawnZ, sideZ, started, dead, deadT, magnet, shield, mult, tie, hint, shake, sparks;
    const reset = () => {
      P = { lane: 0, x: 0, y: 0, vy: 0, slide: 0, run: 0, stumble: 0 };
      objs = []; side = []; speed = 11; dist = 0; coins = 0; spawnZ = 26; sideZ = 0; started = false; dead = false; deadT = 0; magnet = 0; shield = 0; mult = 1; tie = 0; hint = 1; shake = 0; sparks = [];
      for (let z = 4; z < FAR; z += 3.2) addSide(z);
      ui.score(0); ui.info('🪙 0');
    };
    function addSide(z) {
      for (const s of [-1, 1]) {
        const h = rnd(1.6, 5.5), w = rnd(1.2, 2.2);
        side.push({ x0: s < 0 ? -LW * 1.5 - 0.5 - w : LW * 1.5 + 0.5, w, h, z, d: rnd(2.2, 3), col: BLD_C[ri(BLD_C.length)], win: Math.random() < 0.7 });
      }
    }
    // qator yaratish: kamida bitta yo'lak doim o'tish mumkin
    function spawnRow(z) {
      const lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
      const r = Math.random(), lvl = Math.min(1, dist / 1500);
      let blocked = [];
      if (r < 0.34) { blocked = [lanes[0]]; objs.push(train(lanes[0], z)); }
      else if (r < 0.34 + 0.18 * (0.5 + lvl)) { blocked = [lanes[0], lanes[1]]; objs.push(train(lanes[0], z), train(lanes[1], z + rnd(0, 4))); }
      else if (r < 0.75) { const n = 1 + ri(3); for (let i = 0; i < n; i++) objs.push({ t: 'low', lane: lanes[i], z, len: 0.35 }); blocked = lanes.slice(0, n); if (n === 3) blocked = []; }
      else { const n = 1 + ri(2); for (let i = 0; i < n; i++) objs.push({ t: 'high', lane: lanes[i], z, len: 0.3 }); if (Math.random() < 0.5) objs.push({ t: 'low', lane: lanes[n], z: z + 0.1, len: 0.35 }); blocked = []; }
      // tangalar
      const free = [-1, 0, 1].filter((l) => !blocked.includes(l) || !objs.some((o) => o.t === 'train' && o.lane === l && Math.abs(o.z - z) < 12));
      const cl = free[ri(free.length)];
      if (cl !== undefined && Math.random() < 0.8) {
        const lowHere = objs.find((o) => o.t === 'low' && o.lane === cl && Math.abs(o.z - z) < 1);
        for (let i = 0; i < 6; i++) { const zz = z - 4 + i * 1.4; const arc = lowHere ? Math.max(0, 1.1 - Math.abs(zz - z) * 0.25) : 0; objs.push({ t: 'coin', lane: cl, z: zz, y: 0.55 + arc }); }
      }
      if (Math.random() < 0.06) objs.push({ t: Math.random() < 0.5 ? 'magnet' : 'shield', lane: free[ri(free.length)] ?? 0, z: z + 6, y: 0.7 });
      else if (Math.random() < 0.03) objs.push({ t: 'x2', lane: free[ri(free.length)] ?? 0, z: z + 6, y: 0.7 });
    }
    const train = (lane, z) => { const col = TRAIN_C[ri(TRAIN_C.length)]; return { t: 'train', lane, z, len: rnd(7, 12), col, moving: Math.random() < Math.min(0.35, dist / 4000) ? rnd(3, 6) : 0 }; };
    const act = (d) => {
      if (dead) return; if (!started) { started = true; hint = 0; }
      if (d === 'L' && P.lane > -1) { P.lane--; snd(520, 0.05, 0.04); }
      else if (d === 'R' && P.lane < 1) { P.lane++; snd(520, 0.05, 0.04); }
      else if (d === 'U' && P.y <= 0.01) { P.vy = 8.2; P.slide = 0; snd(700, 0.08, 0.05, 'triangle'); }
      else if (d === 'D') { if (P.y > 0.05) P.vy = -14; P.slide = 0.62; snd(300, 0.08, 0.04); }
    };
    swipe(c, act, () => { if (!started) { started = true; hint = 0; } });
    const kd = (e) => { if (KEYS[e.key]) { e.preventDefault(); act(KEYS[e.key]); } }; addEventListener('keydown', kd);
    reset();
    // proyeksiya
    let W, H, F, HZ;
    const sx = (x, z) => W / 2 + (x * F) / z;
    const sy = (y, z) => HZ + ((CAMH - y) * F) / z;
    function quad(pts, fill) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }
    function box(x0, x1, y0, y1, z0, z1, front, top, sideC) {
      z0 = Math.max(0.6, z0); if (z1 <= z0) return null;
      if (x1 < 0) quad([[sx(x1, z0), sy(y0, z0)], [sx(x1, z0), sy(y1, z0)], [sx(x1, z1), sy(y1, z1)], [sx(x1, z1), sy(y0, z1)]], sideC);
      if (x0 > 0) quad([[sx(x0, z0), sy(y0, z0)], [sx(x0, z0), sy(y1, z0)], [sx(x0, z1), sy(y1, z1)], [sx(x0, z1), sy(y0, z1)]], sideC);
      if (y1 < CAMH) quad([[sx(x0, z0), sy(y1, z0)], [sx(x1, z0), sy(y1, z0)], [sx(x1, z1), sy(y1, z1)], [sx(x0, z1), sy(y1, z1)]], top);
      const r = [sx(x0, z0), sy(y1, z0), sx(x1, z0) - sx(x0, z0), sy(y0, z0) - sy(y1, z0)];
      g.fillStyle = front; g.fillRect(r[0], r[1], r[2], r[3]); return r;
    }
    function drawObj(o) {
      const x = o.lane * LW;
      if (o.t === 'train') {
        const r = box(x - LW * 0.44, x + LW * 0.44, 0.05, 1.95, o.z, o.z + o.len, o.col[0], o.col[1], o.col[1]);
        if (r && o.z > 0.6) {
          const [rx, ry, rw, rh] = r; g.fillStyle = '#BAE6FD'; rr(g, rx + rw * 0.12, ry + rh * 0.12, rw * 0.76, rh * 0.3, rw * 0.06); g.fill();
          g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(rx + rw * 0.1, ry + rh * 0.55, rw * 0.8, rh * 0.06);
          g.fillStyle = '#FEF08A'; g.beginPath(); g.arc(rx + rw * 0.2, ry + rh * 0.78, rw * 0.07, 0, 7); g.arc(rx + rw * 0.8, ry + rh * 0.78, rw * 0.07, 0, 7); g.fill();
        }
      } else if (o.t === 'low') {
        const r = box(x - LW * 0.45, x + LW * 0.45, 0.22, 0.62, o.z, o.z + o.len, '#F8FAFC', '#E2E8F0', '#CBD5E1');
        if (r) { const [rx, ry, rw, rh] = r; g.save(); g.beginPath(); g.rect(rx, ry, rw, rh); g.clip(); g.fillStyle = '#EF4444'; for (let i = -1; i < 6; i++) { g.beginPath(); g.moveTo(rx + (rw / 5) * i, ry + rh); g.lineTo(rx + (rw / 5) * (i + 0.5), ry + rh); g.lineTo(rx + (rw / 5) * (i + 1), ry); g.lineTo(rx + (rw / 5) * (i + 0.5), ry); g.fill(); } g.restore();
          box(x - LW * 0.42, x - LW * 0.36, 0, 0.22, o.z, o.z + 0.1, '#475569', '#334155', '#334155'); box(x + LW * 0.36, x + LW * 0.42, 0, 0.22, o.z, o.z + 0.1, '#475569', '#334155', '#334155'); }
      } else if (o.t === 'high') {
        box(x - LW * 0.46, x - LW * 0.38, 0, 1.55, o.z, o.z + 0.12, '#334155', '#1E293B', '#1E293B'); box(x + LW * 0.38, x + LW * 0.46, 0, 1.55, o.z, o.z + 0.12, '#334155', '#1E293B', '#1E293B');
        const r = box(x - LW * 0.46, x + LW * 0.46, 1.05, 1.5, o.z, o.z + o.len, '#FACC15', '#EAB308', '#CA8A04');
        if (r) { const [rx, ry, rw, rh] = r; g.fillStyle = '#111827'; for (let i = 0; i < 5; i += 2) g.fillRect(rx + (rw / 5) * i, ry, rw / 5, rh); }
      } else if (o.z > 0.6) {
        const px = sx(x, o.z), py = sy(o.y, o.z), s = F / o.z;
        if (o.t === 'coin') { const k = Math.abs(Math.cos(tie * 3 + o.z)); g.fillStyle = '#F59E0B'; g.beginPath(); g.ellipse(px, py, Math.max(1, s * 0.17 * k), s * 0.17, 0, 0, 7); g.fill(); g.fillStyle = '#FDE047'; g.beginPath(); g.ellipse(px, py, Math.max(0.5, s * 0.11 * k), s * 0.11, 0, 0, 7); g.fill(); }
        else { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(px, py, s * 0.24, 0, 7); g.fill(); text(g, o.t === 'magnet' ? '🧲' : o.t === 'shield' ? '🛡️' : '✖️2', px, py + 1, s * (o.t === 'x2' ? 0.18 : 0.3)); }
      }
    }
    function drawPlayer() {
      const z = ZP, x = P.x * LW, gy = sy(0, z), s = F / z;
      const px = sx(x, z), py = sy(P.y, z);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(sx(x, z), gy, s * 0.26 * (1 - Math.min(0.5, P.y * 0.3)), s * 0.07, 0, 0, 7); g.fill();
      const sl = P.slide > 0, h = sl ? 0.62 : PH, k = P.run;
      g.save(); g.translate(px, py);
      if (dead) g.rotate(Math.min(1.3, deadT * 4));
      const u = s; // 1 birlik
      if (shield > 0) { g.strokeStyle = `rgba(56,189,248,${0.5 + 0.3 * Math.sin(tie * 10)})`; g.lineWidth = 4; g.beginPath(); g.ellipse(0, -h * u * 0.5, u * 0.42, h * u * 0.62, 0, 0, 7); g.stroke(); }
      if (sl) {
        g.fillStyle = '#1D4ED8'; rr(g, -u * 0.26, -u * 0.36, u * 0.52, u * 0.3, u * 0.12); g.fill();
        g.fillStyle = '#FBBF24'; g.beginPath(); g.arc(u * 0.2, -u * 0.42, u * 0.13, 0, 7); g.fill();
        g.fillStyle = '#EF4444'; g.beginPath(); g.arc(u * 0.2, -u * 0.46, u * 0.13, Math.PI, 0); g.fill();
      } else {
        const sw = P.y > 0.05 ? 0.6 : Math.sin(k * 14);
        g.strokeStyle = '#1E3A8A'; g.lineCap = 'round'; g.lineWidth = u * 0.11;
        g.beginPath(); g.moveTo(-u * 0.07, -u * 0.5); g.lineTo(-u * 0.07 - sw * u * 0.1, -u * 0.06); g.moveTo(u * 0.07, -u * 0.5); g.lineTo(u * 0.07 + sw * u * 0.1, -u * 0.06); g.stroke();
        g.fillStyle = '#111827'; g.beginPath(); g.ellipse(-u * 0.07 - sw * u * 0.1, -u * 0.04, u * 0.08, u * 0.05, 0, 0, 7); g.ellipse(u * 0.07 + sw * u * 0.1, -u * 0.04, u * 0.08, u * 0.05, 0, 0, 7); g.fill();
        g.fillStyle = '#F97316'; rr(g, -u * 0.18, -u * 1.0, u * 0.36, u * 0.52, u * 0.1); g.fill();
        g.fillStyle = '#8B5CF6'; rr(g, -u * 0.15, -u * 0.95, u * 0.3, u * 0.32, u * 0.08); g.fill(); // ryukzak
        g.strokeStyle = '#FDBA74'; g.lineWidth = u * 0.08; g.beginPath(); g.moveTo(-u * 0.18, -u * 0.9); g.lineTo(-u * 0.27 + sw * u * 0.08, -u * 0.62); g.moveTo(u * 0.18, -u * 0.9); g.lineTo(u * 0.27 - sw * u * 0.08, -u * 0.62); g.stroke();
        g.fillStyle = '#FBBF24'; g.beginPath(); g.arc(0, -u * 1.13, u * 0.15, 0, 7); g.fill();
        g.fillStyle = '#EF4444'; g.beginPath(); g.arc(0, -u * 1.17, u * 0.155, Math.PI, 0); g.fill(); g.fillRect(-u * 0.02, -u * 1.2, u * 0.2, u * 0.05);
      }
      g.restore();
    }
    function hit(o) {
      if (shield > 0) { shield = 0; o.dead = true; shake = 0.3; snd(400, 0.2, 0.08, 'square'); return; }
      dead = true; deadT = 0; shake = 0.5; snd(110, 0.5, 0.1, 'sawtooth'); navigator.vibrate?.(120);
      const sc = Math.floor(dist) + coins * 10; ui.score(sc); setTimeout(() => ui.over(sc), 900);
    }
    const stop = loop((dt) => {
      W = c.W; H = c.H; F = H * 0.78; HZ = H * 0.27;
      tie += dt;
      if (started && !dead) {
        speed = Math.min(30, 11 + dist / 120); const dz = speed * dt; dist += dz * mult * 0.5;
        P.run += dt * (speed / 14);
        P.x += (P.lane - P.x) * Math.min(1, dt * 16);
        P.vy -= 24 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0) P.vy = 0;
        if (P.slide > 0) P.slide -= dt;
        magnet = Math.max(0, magnet - dt); if (mult > 1) { P.x2T -= dt; if (P.x2T <= 0) mult = 1; }
        for (const o of objs) o.z -= dz + (o.moving || 0) * dt;
        for (const b of side) b.z -= dz;
        spawnZ -= dz; if (spawnZ <= FAR - 20) { spawnRow(FAR); spawnZ = FAR + rnd(9, 14) - Math.min(4, dist / 600); }
        sideZ -= dz; if (sideZ <= 0) { addSide(FAR + 2); sideZ = 3.2; }
        // to'qnashuv
        const pl = Math.round(P.x), ph = P.slide > 0 ? 0.62 : PH;
        for (const o of objs) {
          if (o.dead) continue;
          if (o.t === 'coin' || o.t === 'magnet' || o.t === 'shield' || o.t === 'x2') {
            if (magnet > 0 && o.t === 'coin' && o.z < ZP + 9 && o.z > ZP - 1) { o.lane += (P.x - o.lane) * Math.min(1, dt * 10); o.y += (P.y + 0.6 - o.y) * Math.min(1, dt * 10); o.z -= (o.z - ZP) * Math.min(1, dt * 8); }
            if (Math.abs(o.z - ZP) < 0.6 && Math.abs(o.lane - P.x) < 0.5 && Math.abs(o.y - (P.y + 0.6)) < 0.9) {
              o.dead = true;
              if (o.t === 'coin') { coins++; ui.info('🪙 ' + coins); snd(1200 + (coins % 5) * 80, 0.05, 0.035); }
              else { if (o.t === 'magnet') magnet = 10; else if (o.t === 'shield') shield = 1; else { mult = 2; P.x2T = 12; } snd(880, 0.25, 0.06, 'triangle'); }
            }
            continue;
          }
          const z0 = o.z, z1 = o.z + (o.len || 0.3);
          if (Math.abs(o.lane - P.x) > 0.55) continue;
          if (ZP + 0.25 < z0 || ZP - 0.25 > z1) continue;
          if (o.t === 'low' && P.y > 0.55) continue;
          if (o.t === 'high' && ph < 1.0) continue;
          if (o.t === 'train' && Math.abs(o.lane - pl) > 0.5 && Math.abs(o.lane - P.x) > 0.35) continue;
          hit(o); break;
        }
        objs = objs.filter((o) => !o.dead && o.z + (o.len || 0) > 0.3);
        side = side.filter((b) => b.z + b.d > 0.6);
        ui.score(Math.floor(dist) + coins * 10);
      } else if (dead) deadT += dt;
      // ---- chizish ----
      g.save();
      if (shake > 0) { shake -= dt; g.translate(rnd(-6, 6) * shake * 2, rnd(-6, 6) * shake * 2); }
      const sky = g.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, '#38BDF8'); sky.addColorStop(1, '#BAE6FD'); g.fillStyle = sky; g.fillRect(-10, -10, W + 20, HZ + 12);
      g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 4; i++) { const cx = ((i * 137 + tie * 6) % (W + 120)) - 60, cy = HZ * (0.25 + (i % 2) * 0.25); g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.arc(cx + 18, cy - 6, 20, 0, 7); g.arc(cx + 38, cy, 15, 0, 7); g.fill(); }
      g.fillStyle = '#93C5FD'; for (let i = 0; i < 14; i++) { const bw = W / 10, bh = HZ * (0.25 + ((i * 53) % 7) / 14); g.fillRect(i * bw * 0.8 - 10, HZ - bh, bw * 0.7, bh); }
      g.fillStyle = '#A3A3A3'; g.fillRect(-10, HZ, W + 20, H - HZ + 10);
      // yo'l (shag'al) va relslar
      const zn = 0.9, zf = FAR;
      quad([[sx(-LW * 1.5 - 0.2, zn), sy(0, zn)], [sx(LW * 1.5 + 0.2, zn), sy(0, zn)], [sx(LW * 1.5 + 0.2, zf), sy(0, zf)], [sx(-LW * 1.5 - 0.2, zf), sy(0, zf)]], '#78716C');
      quad([[sx(-40, zn), sy(0, zn)], [sx(-LW * 1.5 - 0.2, zn), sy(0, zn)], [sx(-LW * 1.5 - 0.2, zf), sy(0, zf)], [sx(-40, zf), sy(0, zf)]], '#65A30D');
      quad([[sx(LW * 1.5 + 0.2, zn), sy(0, zn)], [sx(40, zn), sy(0, zn)], [sx(40, zf), sy(0, zf)], [sx(LW * 1.5 + 0.2, zf), sy(0, zf)]], '#65A30D');
      const off = (dist * 2) % 1.6;
      g.fillStyle = '#57534E';
      for (let z = 1.6 - off + 0.9; z < 50; z += 1.6) for (const l of [-1, 0, 1]) quad([[sx(l * LW - LW * 0.4, z), sy(0, z)], [sx(l * LW + LW * 0.4, z), sy(0, z)], [sx(l * LW + LW * 0.4, z + 0.35), sy(0, z + 0.35)], [sx(l * LW - LW * 0.4, z + 0.35), sy(0, z + 0.35)]], '#57534E');
      g.strokeStyle = '#E7E5E4'; g.lineWidth = 2;
      for (const l of [-1, 0, 1]) for (const d of [-0.26, 0.26]) { g.beginPath(); g.moveTo(sx(l * LW + d * LW, zn), sy(0, zn)); g.lineTo(sx(l * LW + d * LW, zf), sy(0, zf)); g.stroke(); }
      // binolar (orqadan oldinga)
      const all = side.map((b) => ({ k: 'b', z: b.z, b })).concat(objs.map((o) => ({ k: 'o', z: o.z, o })));
      all.push({ k: 'p', z: ZP + 0.01 });
      all.sort((a, b) => b.z - a.z);
      for (const it of all) {
        if (it.k === 'p') { drawPlayer(); continue; }
        if (it.k === 'o') { drawObj(it.o); continue; }
        const b = it.b; const r = box(b.x0, b.x0 + b.w, 0, b.h, b.z, b.z + b.d, b.col, shade(b.col, -18), shade(b.col, -32));
        if (r && b.win && r[2] > 8) { g.fillStyle = 'rgba(255,255,255,.55)'; const cols = 2, rows = Math.max(1, Math.floor(b.h / 0.9)); for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) g.fillRect(r[0] + r[2] * (0.15 + i * 0.45), r[1] + r[3] * (0.1 + j * (0.85 / rows)), r[2] * 0.25, r[3] * (0.45 / rows)); }
      }
      g.restore();
      // HUD
      let hy = 18; const badge = (s, tm) => { g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 10, hy - 12, 84, 24, 12); g.fill(); text(g, s + ' ' + Math.ceil(tm), 52, hy + 1, 13); hy += 30; };
      if (magnet > 0) badge('🧲', magnet); if (mult > 1) badge('✖️2', P.x2T); if (shield > 0) { g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 10, hy - 12, 40, 24, 12); g.fill(); text(g, '🛡️', 30, hy + 1, 14); }
      if (!started) {
        g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, W * 0.1, H * 0.36, W * 0.8, 96, 18); g.fill();
        text(g, tg('hint_run'), W / 2, H * 0.36 + 30, 16); text(g, '⬅️ ➡️ ⬆️ ⬇️', W / 2, H * 0.36 + 66, 22);
      }
    });
    function shade(hex, p) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, v + p)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
    return { stop: () => { stop(); removeEventListener('keydown', kd); }, restart: reset, resize: fit };
  };

  // virtual joystik + tugmalar (sensorli ekran uchun)
  function padUI(stage, btns) {
    const el = document.createElement('div'); el.className = 'gm-pad';
    el.innerHTML = `<div class="gm-joy"><i></i></div><div class="gm-btns">${btns.map((b) => `<button data-b="${b.id}" class="${b.cls || ''}">${b.t}</button>`).join('')}</div>`;
    stage.appendChild(el);
    const st = { x: 0, y: 0, on: false, b: {}, tap: {} };
    const joy = el.querySelector('.gm-joy'), knob = joy.querySelector('i');
    let jid = null, c0 = null;
    joy.addEventListener('pointerdown', (e) => { jid = e.pointerId; joy.setPointerCapture(e.pointerId); const r = joy.getBoundingClientRect(); c0 = [r.left + r.width / 2, r.top + r.height / 2]; mv(e); });
    const mv = (e) => { if (e.pointerId !== jid) return; let dx = e.clientX - c0[0], dy = e.clientY - c0[1]; const R = joy.offsetWidth * 0.38, m = Math.hypot(dx, dy); if (m > R) { dx *= R / m; dy *= R / m; } st.x = dx / R; st.y = dy / R; st.on = true; knob.style.transform = `translate(${dx}px,${dy}px)`; };
    joy.addEventListener('pointermove', mv);
    const up = (e) => { if (e.pointerId !== jid) return; jid = null; st.x = st.y = 0; st.on = false; knob.style.transform = ''; };
    joy.addEventListener('pointerup', up); joy.addEventListener('pointercancel', up);
    el.querySelectorAll('[data-b]').forEach((b) => {
      const id = b.dataset.b;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); st.b[id] = true; st.tap[id] = true; b.classList.add('on'); });
      const off = () => { st.b[id] = false; b.classList.remove('on'); };
      b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    });
    st.take = (id) => { const v = st.tap[id]; st.tap[id] = false; return v; };
    return st;
  }
  const keysDown = new Set();
  addEventListener('keydown', (e) => keysDown.add(e.key.toLowerCase()));
  addEventListener('keyup', (e) => keysDown.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keysDown.clear());

  // 12) Birga Strike — oddiy 3D otishma (CS uslubida, raycasting)
  IMPL.strike = (stage, ui) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, null);
    const MAP = ['################', '#......#.......#', '#.##...#..###..#', '#.#.......#....#', '#.#..##...#.##.#', '#....#.........#', '###..#..####...#', '#.......#......#', '#..##...#..##..#', '#..#.......#...#', '#..#..###..#..##', '#......#.......#', '#.###..#..###..#', '#..............#', '#..##......##..#', '################'];
    const N = 16, wall = (x, y) => x < 0 || y < 0 || x >= N || y >= N || MAP[y | 0][x | 0] === '#';
    const pad = padUI(stage, [{ id: 'fire', t: '🔫', cls: 'big' }, { id: 'reload', t: '🔄' }]);
    let P, en, wave, kills, ammo, reloadT, fireT, flash, hurt, dead, items, msg, msgT, look = null, lookX = 0;
    c.addEventListener('pointerdown', (e) => { look = e.pointerId; lookX = e.clientX; });
    c.addEventListener('pointermove', (e) => { if (look === e.pointerId) { P.a += (e.clientX - lookX) * 0.0065; lookX = e.clientX; } });
    const lu = (e) => { if (look === e.pointerId) look = null; }; c.addEventListener('pointerup', lu); c.addEventListener('pointercancel', lu);
    const freeCell = (far) => { for (let i = 0; i < 200; i++) { const x = 1 + ri(N - 2) + 0.5, y = 1 + ri(N - 2) + 0.5; if (!wall(x, y) && (!far || Math.hypot(x - P.x, y - P.y) > 6)) return [x, y]; } return [1.5, 1.5]; };
    const spawnWave = () => { wave++; const n = 2 + wave * 2; for (let i = 0; i < n; i++) { const [x, y] = freeCell(true); en.push({ x, y, hp: wave > 3 ? 3 : 2, cd: rnd(1, 2.5), hit: 0, st: 0, dead: 0, col: ['#B91C1C', '#1D4ED8', '#047857', '#7C2D12'][ri(4)] }); } msg = tg('wave') + ' ' + wave; msgT = 1.6; };
    const reset = () => { P = { x: 1.5, y: 13.5, a: 0, hp: 100 }; en = []; wave = 0; kills = 0; ammo = 30; reloadT = 0; fireT = 0; flash = 0; hurt = 0; dead = false; items = []; spawnWave(); ui.score(0); hud(); };
    const hud = () => ui.info(`❤️ ${Math.max(0, Math.round(P.hp))} · 🔫 ${reloadT > 0 ? '…' : ammo}`);
    const los = (x0, y0, x1, y1) => { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 6); for (let i = 1; i < n; i++) if (wall(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n)) return false; return true; };
    function shoot() {
      if (reloadT > 0 || fireT > 0 || dead) return;
      if (ammo <= 0) { reloadT = 1.4; snd(300, 0.1, 0.04); return; }
      ammo--; fireT = 0.13; flash = 0.06; snd(140, 0.09, 0.09, 'square'); snd(90, 0.12, 0.06, 'sawtooth');
      let best = null, bd = 1e9;
      for (const e of en) {
        if (e.dead) continue; const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy);
        let da = Math.atan2(dy, dx) - P.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < Math.max(0.05, 0.32 / d) && d < bd && los(P.x, P.y, e.x, e.y)) { bd = d; best = e; }
      }
      if (best) { best.hp--; best.hit = 0.15; if (best.hp <= 0) { best.dead = 1; kills++; ui.score(kills * 100 + (wave - 1) * 250); snd(600, 0.15, 0.06); if (Math.random() < 0.35) items.push({ x: best.x, y: best.y, t: Math.random() < 0.5 ? 'med' : 'ammo' }); } }
      if (ammo === 0) reloadT = 1.4;
      hud();
    }
    reset();
    const ZB = [];
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      if (!dead) {
        let mx = pad.x, my = pad.y;
        if (keysDown.has('w')) my = -1; if (keysDown.has('s')) my = 1; if (keysDown.has('a')) mx = -1; if (keysDown.has('d')) mx = 1;
        if (keysDown.has('arrowleft')) P.a -= dt * 2.4; if (keysDown.has('arrowright')) P.a += dt * 2.4;
        if (keysDown.has('arrowup')) my = -1; if (keysDown.has('arrowdown')) my = 1;
        const sp = 3 * dt, ca = Math.cos(P.a), sa = Math.sin(P.a);
        const vx = (-my * ca - mx * sa) * sp, vy = (-my * sa + mx * ca) * sp;
        if (!wall(P.x + vx + Math.sign(vx) * 0.2, P.y)) P.x += vx; if (!wall(P.x, P.y + vy + Math.sign(vy) * 0.2)) P.y += vy;
        if (pad.b.fire || keysDown.has(' ')) shoot();
        if (pad.take('reload') && ammo < 30 && reloadT <= 0) { reloadT = 1.4; hud(); }
        if (reloadT > 0) { reloadT -= dt; if (reloadT <= 0) { ammo = 30; hud(); } }
        fireT -= dt;
        for (const e of en) {
          if (e.dead) { e.dead += dt; continue; }
          e.hit = Math.max(0, e.hit - dt); e.st += dt;
          const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy), see = d < 11 && los(e.x, e.y, P.x, P.y);
          if (see && d > 1.6) { const s = (1.1 + wave * 0.08) * dt; const nx = e.x + (dx / d) * s, ny = e.y + (dy / d) * s; if (!wall(nx, e.y)) e.x = nx; if (!wall(e.x, ny)) e.y = ny; }
          e.cd -= dt;
          if (see && e.cd <= 0) { e.cd = rnd(1.1, 2.2) / (1 + wave * 0.1); e.fl = 0.08; snd(200, 0.06, 0.03, 'square'); if (Math.random() < Math.max(0.25, 0.75 - d * 0.06)) { P.hp -= 6 + wave; hurt = 0.3; hud(); if (P.hp <= 0) { dead = true; snd(120, 0.6, 0.1, 'sawtooth'); setTimeout(() => ui.over(kills * 100 + (wave - 1) * 250), 900); } } }
          if (e.fl) e.fl = Math.max(0, e.fl - dt);
        }
        for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; if (Math.hypot(it.x - P.x, it.y - P.y) < 0.6) { if (it.t === 'med') P.hp = Math.min(100, P.hp + 35); else ammo = 30; items.splice(i, 1); snd(900, 0.12, 0.05); hud(); } }
        if (en.every((e) => e.dead)) { en = []; spawnWave(); }
      }
      // ---- render ----
      const hz = H / 2;
      let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, '#7DD3FC'); gr.addColorStop(1, '#E0F2FE'); g.fillStyle = gr; g.fillRect(0, 0, W, hz);
      gr = g.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, '#A8A29E'); gr.addColorStop(1, '#57534E'); g.fillStyle = gr; g.fillRect(0, hz, W, hz);
      const FOV = 1.05, cols = Math.ceil(W / 2), dirx = Math.cos(P.a), diry = Math.sin(P.a), plx = -diry * Math.tan(FOV / 2), ply = dirx * Math.tan(FOV / 2);
      for (let i = 0; i < cols; i++) {
        const cam = (2 * i) / cols - 1, rx = dirx + plx * cam, ry = diry + ply * cam;
        let mx = P.x | 0, my = P.y | 0; const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry);
        let sxs, sys, sdx, sdy, side = 0;
        if (rx < 0) { sxs = -1; sdx = (P.x - mx) * ddx; } else { sxs = 1; sdx = (mx + 1 - P.x) * ddx; }
        if (ry < 0) { sys = -1; sdy = (P.y - my) * ddy; } else { sys = 1; sdy = (my + 1 - P.y) * ddy; }
        for (let k = 0; k < 64; k++) { if (sdx < sdy) { sdx += ddx; mx += sxs; side = 0; } else { sdy += ddy; my += sys; side = 1; } if (wall(mx, my)) break; }
        const pd = side ? sdy - ddy : sdx - ddx; ZB[i] = pd;
        const lh = H / Math.max(0.05, pd), y0 = hz - lh / 2;
        let wx = side ? P.x + pd * rx : P.y + pd * ry; wx -= Math.floor(wx);
        const br = Math.max(0.25, 1 - pd / 14) * (side ? 0.78 : 1);
        const brick = ((wx * 4) | 0) % 2 === 0;
        g.fillStyle = `rgb(${(brick ? 196 : 184) * br | 0},${(brick ? 110 : 98) * br | 0},${(brick ? 76 : 66) * br | 0})`; g.fillRect(i * 2, y0, 2.2, lh);
        g.fillStyle = `rgba(0,0,0,${0.18 * br})`; for (let r = 1; r < 4; r++) g.fillRect(i * 2, y0 + (lh / 4) * r, 2.2, Math.max(1, lh / 80));
      }
      // spraytlar
      const spr = en.filter((e) => !e.dead || e.dead < 1.2).map((e) => ({ e, d: Math.hypot(e.x - P.x, e.y - P.y) })).concat(items.map((it) => ({ it, d: Math.hypot(it.x - P.x, it.y - P.y) })));
      spr.sort((a, b) => b.d - a.d);
      for (const s of spr) {
        const o = s.e || s.it, dx = o.x - P.x, dy = o.y - P.y;
        const inv = 1 / (plx * diry - dirx * ply), tx = inv * (diry * dx - dirx * dy), ty = inv * (-ply * dx + plx * dy);
        if (ty <= 0.2) continue;
        const scx = (W / 2) * (1 + tx / ty), sh = H / ty, col = Math.floor(scx / 2);
        if (col < 0 || col >= cols || ZB[col] < ty) continue;
        if (s.it) { text(g, s.it.t === 'med' ? '🩹' : '📦', scx, hz + sh * 0.35, sh * 0.25); continue; }
        const e = s.e, w = sh * 0.42, top = hz - sh * 0.38, fall = e.dead ? Math.min(1, e.dead * 2) : 0;
        g.save(); g.translate(scx, hz + sh * 0.5); g.rotate(fall * 1.4); g.translate(-scx, -(hz + sh * 0.5));
        g.globalAlpha = e.dead ? Math.max(0, 1 - e.dead) : 1;
        const bob = Math.sin(e.st * 8) * sh * 0.01;
        g.fillStyle = e.hit ? '#fff' : e.col; rr(g, scx - w / 2, top + sh * 0.22 + bob, w, sh * 0.42, w * 0.18); g.fill();
        g.fillStyle = '#1F2937'; g.fillRect(scx - w * 0.35, top + sh * 0.62 + bob, w * 0.28, sh * 0.25); g.fillRect(scx + w * 0.07, top + sh * 0.62 + bob, w * 0.28, sh * 0.25);
        g.fillStyle = e.hit ? '#fff' : '#FCD34D'; g.beginPath(); g.arc(scx, top + sh * 0.13 + bob, w * 0.26, 0, 7); g.fill();
        g.fillStyle = '#111827'; g.fillRect(scx - w * 0.28, top + sh * 0.06 + bob, w * 0.56, w * 0.12);
        g.fillStyle = '#374151'; g.fillRect(scx - w * 0.05, top + sh * 0.35 + bob, w * 0.62, w * 0.12);
        if (e.fl) { g.fillStyle = '#FDE047'; g.beginPath(); g.arc(scx + w * 0.6, top + sh * 0.36 + bob, w * 0.15, 0, 7); g.fill(); }
        g.restore(); g.globalAlpha = 1;
      }
      // qurol
      const bob = Math.sin(performance.now() / 120) * (Math.abs(pad.x) + Math.abs(pad.y) > 0.1 ? 4 : 0.8), kick = fireT > 0 ? 8 : 0;
      const gx = W * 0.62, gy = H - 10 + bob + kick;
      g.fillStyle = '#1F2937'; g.beginPath(); g.moveTo(gx - 30, gy); g.lineTo(gx - 8, gy - 120); g.lineTo(gx + 14, gy - 120); g.lineTo(gx + 40, gy); g.fill();
      g.fillStyle = '#4B5563'; g.fillRect(gx - 4, gy - 150, 14, 40); g.fillStyle = '#92400E'; g.beginPath(); g.moveTo(gx + 10, gy); g.lineTo(gx + 26, gy - 60); g.lineTo(gx + 50, gy - 50); g.lineTo(gx + 46, gy); g.fill();
      if (flash > 0) { flash -= dt; g.fillStyle = '#FDE047'; g.beginPath(); g.arc(gx + 3, gy - 158, 18, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(gx + 3, gy - 158, 8, 0, 7); g.fill(); }
      g.strokeStyle = '#22C55E'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 12, hz); g.lineTo(W / 2 - 4, hz); g.moveTo(W / 2 + 4, hz); g.lineTo(W / 2 + 12, hz); g.moveTo(W / 2, hz - 12); g.lineTo(W / 2, hz - 4); g.moveTo(W / 2, hz + 4); g.lineTo(W / 2, hz + 12); g.stroke();
      // mini xarita
      const ms = 5; g.globalAlpha = 0.75; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = MAP[y][x] === '#' ? '#1F2937' : '#E5E7EB'; g.fillRect(8 + x * ms, 8 + y * ms, ms, ms); }
      g.fillStyle = '#16A34A'; g.fillRect(8 + P.x * ms - 2, 8 + P.y * ms - 2, 4, 4); g.fillStyle = '#DC2626'; en.forEach((e) => !e.dead && g.fillRect(8 + e.x * ms - 1.5, 8 + e.y * ms - 1.5, 3, 3)); g.globalAlpha = 1;
      if (reloadT > 0) text(g, tg('reload') + '…', W / 2, hz + 40, 16, '#FDE047');
      if (hurt > 0) { hurt -= dt; g.fillStyle = `rgba(220,38,38,${hurt})`; g.fillRect(0, 0, W, H); }
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, hz - 60, 30, '#fff'); }
      if (kills === 0 && wave === 1 && !pad.on && msgT <= 0) text(g, tg('hint_strike'), W / 2, hz + 70, 14);
    });
    return { stop, restart: reset, resize: fit };
  };

  // 13) Birga Futbol — 4x4 futbol (PES uslubida, yuqoridan ko'rinish)
  IMPL.football = (stage, ui) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, 0.62);
    const pad = padUI(stage, [{ id: 'shoot', t: '⚽', cls: 'big' }, { id: 'pass', t: '↗️' }]);
    const FW = 68, FH = 105, GW = 18, MATCH = 120;
    let pl, ball, sc, time, owner, ctrl, kick, msg, msgT, over, last = [0, -1];
    const form = [[0, 0.95], [-0.5, 0.75], [0.5, 0.75], [0, 0.6]];
    const mk = (team, i) => { const [fx, fy] = form[i]; const y = team ? 1 - fy : fy; return { team, i, gk: i === 0, hx: FW / 2 + fx * FW * 0.5, hy: y * FH, x: 0, y: 0, vx: 0, vy: 0, cd: 0, dir: team ? 1 : -1 }; };
    const kickoff = (to) => {
      pl.forEach((p) => { p.x = p.hx; p.y = p.hy + (p.team ? -6 : 6) * (p.i === 3 ? 1 : 0); p.vx = p.vy = 0; p.cd = 0; });
      ball = { x: FW / 2, y: FH / 2, vx: 0, vy: 0, z: 0, vz: 0 }; owner = null; kick = 0.8;
      const s = pl.find((p) => p.team === to && p.i === 3); s.x = FW / 2; s.y = FH / 2 + (to ? -1.5 : 1.5);
    };
    const reset = () => { pl = [0, 1, 2, 3].map((i) => mk(0, i)).concat([0, 1, 2, 3].map((i) => mk(1, i))); sc = [0, 0]; time = 0; over = false; msg = ''; msgT = 0; kickoff(0); ctrl = pl[3]; ui.score(0); info(); };
    const info = () => ui.info(`${tg('you')} ${sc[0]} : ${sc[1]} ${tg('bot')} · ${Math.min(90, Math.floor((time / MATCH) * 90))}'`);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const goalY = (team) => (team ? FH + 1 : -1); // 0-jamoa (siz) yuqoridagi darvozaga hujum qiladi
    function strike(p, tx, ty, power, lob) {
      const dx = tx - ball.x, dy = ty - ball.y, d = Math.hypot(dx, dy) || 1;
      ball.vx = (dx / d) * power; ball.vy = (dy / d) * power; ball.vz = lob ? 9 : 2.5; owner = null; p.cd = 0.35; last = [p.team, pl.indexOf(p)];
      snd(240, 0.06, 0.07, 'triangle');
    }
    function shootAt(p, aimX) { const gy = goalY(p.team); const tx = FW / 2 + (aimX ?? rnd(-GW * 0.4, GW * 0.4)); strike(p, tx, gy, 46, false); }
    function passTo(p, mate) { strike(p, mate.x + mate.vx * 0.25, mate.y + mate.vy * 0.25, Math.min(40, 18 + dist(p, mate) * 0.9), dist(p, mate) > 30); }
    const bestMate = (p) => { let b = null, bs = -1e9; for (const m of pl) { if (m === p || m.team !== p.team || m.gk) continue; const fwd = (p.team ? m.y - p.y : p.y - m.y); const press = Math.min(...pl.filter((o) => o.team !== p.team).map((o) => dist(o, m))); const s = fwd * 0.6 + press * 1.2 - dist(p, m) * 0.2; if (s > bs) { bs = s; b = m; } } return b; };
    reset();
    const stop = loop((dt) => {
      const W = c.W, H = c.H, k = W / (FW + 8), ox = 4 * k, oy = (H - FH * k) / 2;
      const X = (x) => ox + x * k, Y = (y) => oy + y * k;
      if (!over) {
        time += dt; if (time >= MATCH) { over = true; const win = sc[0] > sc[1]; msg = sc[0] === sc[1] ? tg('draw') : win ? tg('win') : tg('lose'); msgT = 9; const s = sc[0] * 100 + (win ? 300 : sc[0] === sc[1] ? 100 : 0); ui.score(s); setTimeout(() => ui.over(s), 1500); }
        if (Math.floor(time * 2) !== Math.floor((time - dt) * 2)) info();
        kick = Math.max(0, kick - dt);
        // boshqariladigan o'yinchi — to'pga eng yaqin (darvozabondan tashqari)
        if (!owner || owner.team !== 0) { const cand = pl.filter((p) => p.team === 0 && !p.gk).sort((a, b) => dist(a, ball) - dist(b, ball))[0]; if (cand !== ctrl && dist(cand, ball) + 2 < dist(ctrl, ball)) ctrl = cand; }
        else if (owner.team === 0) ctrl = owner;
        let jx = pad.x, jy = pad.y; if (keysDown.has('arrowleft') || keysDown.has('a')) jx = -1; if (keysDown.has('arrowright') || keysDown.has('d')) jx = 1; if (keysDown.has('arrowup') || keysDown.has('w')) jy = -1; if (keysDown.has('arrowdown') || keysDown.has('s')) jy = 1;
        const shootB = pad.take('shoot') || keysDown.has(' '), passB = pad.take('pass') || keysDown.has('x');
        for (const p of pl) {
          p.cd = Math.max(0, p.cd - dt);
          let tx = p.hx, ty = p.hy, spd = 15;
          const ballSide = ball.y / FH;
          if (p === ctrl) { p.vx += (jx * 20 - p.vx) * Math.min(1, dt * 10); p.vy += (jy * 20 - p.vy) * Math.min(1, dt * 10); }
          else {
            if (p.gk) { tx = FW / 2 + Math.max(-GW / 2, Math.min(GW / 2, (ball.x - FW / 2) * 0.6)); ty = p.team ? 3 : FH - 3; spd = 13; if (dist(p, ball) < 14 && (p.team ? ball.y < 16 : ball.y > FH - 16)) { tx = ball.x; ty = ball.y; } }
            else {
              const att = owner ? owner.team === p.team : false;
              tx = p.hx + (ball.x - FW / 2) * 0.35; ty = p.hy + (ballSide - 0.5) * FH * 0.55 + (att ? (p.team ? 10 : -10) : 0);
              const chaser = pl.filter((q) => q.team === p.team && !q.gk && q !== (p.team === 0 ? ctrl : null)).sort((a, b) => dist(a, ball) - dist(b, ball))[0];
              if (p.team === 1 && chaser === p && owner !== p) { tx = ball.x; ty = ball.y; spd = 15.5 + Math.min(3, sc[0]); }
              if (p.team === 0 && chaser === p && owner && owner.team === 1 && dist(p, ball) < 18) { tx = ball.x; ty = ball.y; }
              if (owner === p && p.team === 1) { tx = FW / 2 + (p.x - FW / 2) * 0.6; ty = FH - 4; spd = 13; }
            }
            const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
            const vx = d > 0.6 ? (dx / d) * Math.min(spd, d * 4) : 0, vy = d > 0.6 ? (dy / d) * Math.min(spd, d * 4) : 0;
            p.vx += (vx - p.vx) * Math.min(1, dt * 6); p.vy += (vy - p.vy) * Math.min(1, dt * 6);
          }
          p.x = Math.max(1, Math.min(FW - 1, p.x + p.vx * dt)); p.y = Math.max(-1, Math.min(FH + 1, p.y + p.vy * dt));
          if (Math.hypot(p.vx, p.vy) > 2) p.dir = Math.atan2(p.vy, p.vx);
        }
        // to'qnashuv — o'yinchilar bir-biridan itariladi
        for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) { const a = pl[i], b = pl[j], d = dist(a, b); if (d < 2.4 && d > 0) { const f = (2.4 - d) / 2; a.x -= ((b.x - a.x) / d) * f; a.y -= ((b.y - a.y) / d) * f; b.x += ((b.x - a.x) / d) * f; b.y += ((b.y - a.y) / d) * f; } }
        // to'p
        if (owner) {
          const a = typeof owner.dir === 'number' ? owner.dir : 0; ball.x = owner.x + Math.cos(a) * 1.6; ball.y = owner.y + Math.sin(a) * 1.6; ball.vx = owner.vx; ball.vy = owner.vy; ball.z = 0;
          if (owner.team === 0) {
            if (shootB) { const aim = jx * GW * 0.45; shootAt(owner, aim); }
            else if (passB) { const m = bestMate(owner); if (m) passTo(owner, m); }
          } else if (owner.team === 1 && owner.cd <= 0) {
            const dg = Math.hypot(owner.x - FW / 2, owner.y - FH);
            const press = Math.min(...pl.filter((o) => o.team === 0).map((o) => dist(o, owner)));
            if (dg < 30 && Math.random() < dt * 2.5) shootAt(owner);
            else if (press < 4 && Math.random() < dt * 3) { const m = bestMate(owner); if (m) passTo(owner, m); }
          }
          // to'p olib qo'yish
          for (const p of pl) if (p.team !== owner?.team && p.cd <= 0 && dist(p, ball) < 1.9 && Math.random() < dt * (p.team === 0 ? 6 : 3.2)) { owner.cd = 0.6; owner = p; p.cd = 0.3; snd(500, 0.04, 0.04); break; }
        } else {
          ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vz -= 30 * dt; ball.z = Math.max(0, ball.z + ball.vz * dt); if (ball.z === 0) { ball.vz = Math.abs(ball.vz) > 4 ? -ball.vz * 0.4 : 0; }
          const fr = ball.z > 0 ? 0.995 : Math.pow(0.35, dt); ball.vx *= fr; ball.vy *= fr;
          if (ball.x < 0.5 || ball.x > FW - 0.5) { ball.vx = -ball.vx * 0.7; ball.x = Math.max(0.5, Math.min(FW - 0.5, ball.x)); }
          const inGoalX = Math.abs(ball.x - FW / 2) < GW / 2;
          if (ball.y < 0 || ball.y > FH) {
            if (inGoalX && ball.z < 3) { const t = ball.y < 0 ? 0 : 1; sc[t]++; msg = '⚽ GOOOL!'; msgT = 1.6; snd(1046, 0.4, 0.09); info(); ui.score(sc[0] * 100); kickoff(1 - t); }
            else { ball.vy = -ball.vy * 0.6; ball.y = Math.max(0.5, Math.min(FH - 0.5, ball.y)); }
          }
          if (kick <= 0 && ball.z < 1.6) for (const p of pl) {
            if (p.cd > 0) continue; const d = dist(p, ball), sp = Math.hypot(ball.vx, ball.vy);
            if (d < (p.gk ? 2.8 : 1.8) && (sp < 34 || p.gk && Math.random() < 0.65 || Math.random() < 0.3)) { owner = p; if (p.gk) { ball.vx = ball.vy = 0; p.cd = 0.5; } break; }
          }
        }
        if (owner?.gk && owner.cd <= 0.05) { const m = bestMate(owner); if (m) passTo(owner, m); }
      }
      // ---- chizish ----
      g.fillStyle = '#14532D'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#16A34A' : '#15803D'; g.fillRect(X(0), Y((FH / 10) * i), FW * k, (FH / 10) * k + 1); }
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2;
      g.strokeRect(X(0), Y(0), FW * k, FH * k); g.beginPath(); g.moveTo(X(0), Y(FH / 2)); g.lineTo(X(FW), Y(FH / 2)); g.stroke();
      g.beginPath(); g.arc(X(FW / 2), Y(FH / 2), 9 * k, 0, 7); g.stroke();
      for (const t of [0, 1]) { const y0 = t ? FH - 16 : 0; g.strokeRect(X(FW / 2 - 20), Y(y0), 40 * k, 16 * k); g.strokeRect(X(FW / 2 - 9), Y(t ? FH - 6 : 0), 18 * k, 6 * k); }
      for (const t of [0, 1]) { g.fillStyle = 'rgba(255,255,255,.9)'; const y = t ? Y(FH) : Y(0) - 3 * k; g.fillRect(X(FW / 2 - GW / 2), y, GW * k, 3 * k); g.fillStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i < 9; i++) g.fillRect(X(FW / 2 - GW / 2 + i * 2), y, 1, 3 * k); }
      for (const p of pl) {
        const x = X(p.x), y = Y(p.y), r = 1.5 * k;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 2, y + 3, r, r * 0.6, 0, 0, 7); g.fill();
        if (p === ctrl) { g.strokeStyle = '#FDE047'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.stroke(); g.fillStyle = '#FDE047'; g.beginPath(); g.moveTo(x, y - r - 12); g.lineTo(x - 5, y - r - 19); g.lineTo(x + 5, y - r - 19); g.fill(); }
        g.fillStyle = p.gk ? (p.team ? '#F59E0B' : '#22D3EE') : p.team ? '#DC2626' : '#2563EB'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.fillStyle = '#FCD9B6'; g.beginPath(); g.arc(x + Math.cos(p.dir) * r * 0.25, y + Math.sin(p.dir) * r * 0.25, r * 0.5, 0, 7); g.fill();
        g.fillStyle = '#fff'; text(g, String(p.gk ? 1 : p.i + 6 + (p.team ? 0 : 3)), x, y + r + 8, 9, '#fff');
      }
      const bx = X(ball.x), by = Y(ball.y) - ball.z * k * 0.6, br = 0.9 * k * (1 + ball.z * 0.05);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(X(ball.x) + 1, Y(ball.y) + 2, br, br * 0.6, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(bx, by, br * 0.4, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, W / 2 - 70, 6, 140, 28, 14); g.fill();
      text(g, `🔵 ${sc[0]} : ${sc[1]} 🔴`, W / 2 - 20, 20, 15); text(g, `${Math.min(90, Math.floor((time / MATCH) * 90))}'`, W / 2 + 48, 20, 13, '#FDE047');
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, H / 2, 34, '#fff'); }
      if (time < 4 && !over) text(g, tg('hint_football'), W / 2, H * 0.62, 14);
    });
    return { stop, restart: reset, resize: fit };
  };

  /* ---------- O'yin oynasi ---------- */
  const Page = { cur: null, inst: null, best: {}, score: 0 };
  function ensurePage() {
    if ($('#gm-page')) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="gm-page hidden" id="gm-page">
      <div class="gm-head"><button class="icon-btn light" id="gm-back">${icon('back')}</button><div class="gm-title" id="gm-title"></div>
        <div class="gm-stats"><span id="gm-info"></span><span class="gm-sc"><small>${tg('score')}</small><b id="gm-score">0</b></span><span class="gm-sc"><small>🏆</small><b id="gm-best">0</b></span></div></div>
      <div class="gm-extra" id="gm-extra"></div>
      <div class="gm-stage" id="gm-stage"></div>
      <div class="gm-over hidden" id="gm-over"></div></div>`);
    $('#gm-back').onclick = () => closeGame();
    addEventListener('resize', () => Page.inst?.resize?.());
    document.addEventListener('visibilitychange', () => { if (document.hidden && Page.inst && !$('#gm-page').classList.contains('hidden')) closeGame(); });
    if (typeof trackEl === 'function') trackEl($('#gm-page'), 'game', () => closeGame());
  }
  function startGame(id) {
    ensurePage();
    const meta = GAMES.find((x) => x.id === id); if (!meta) return;
    closeRoom(true); Page.cur = meta; Page.score = 0;
    $('#gm-title').textContent = `${meta.e} ${gname(meta)}`;
    $('#gm-best').textContent = Page.best[id] || 0; $('#gm-score').textContent = 0; $('#gm-info').textContent = ''; $('#gm-extra').innerHTML = '';
    $('#gm-page').style.setProperty('--g1', meta.c[0]); $('#gm-page').style.setProperty('--g2', meta.c[1]);
    $('#gm-page').classList.remove('hidden'); $('#gm-over').classList.add('hidden');
    run();
  }
  function run() {
    Page.inst?.stop?.(); const st = $('#gm-stage'); st.innerHTML = ''; st.className = 'gm-stage';
    $('#gm-extra').innerHTML = '';
    const ui = {
      score: (n) => { Page.score = n; $('#gm-score').textContent = n; },
      info: (s) => { $('#gm-info').textContent = s; },
      extra: (html, onClick) => { $('#gm-extra').innerHTML = html; const b = $('#gm-extra button'); if (b) b.onclick = () => { b.textContent = onClick(); }; },
      over: (n) => gameOver(n),
    };
    requestAnimationFrame(() => { Page.inst = IMPL[Page.cur.id](st, ui); });
  }
  function closeGame() { if (Room.cur || Room.inst) { closeRoom(true); } Page.inst?.stop?.(); Page.inst = null; $('#gm-page')?.classList.add('hidden'); renderLobby(); }
  async function gameOver(score) {
    const id = Page.cur.id; const prev = Page.best[id] || 0;
    const ov = $('#gm-over');
    ov.innerHTML = `<div class="gm-card"><h3>${tg('over')}</h3><div class="gm-big">${score}</div><p class="gm-rec" id="gm-rec">${score > prev ? '🎉 ' + tg('newrec') : `🏆 ${tg('best')}: ${prev}`}</p><p class="gm-rank" id="gm-rank"></p>
      <button class="btn-primary" id="gm-again">${tg('again')}</button>
      <div class="gm-row"><button id="gm-top">🏆 ${tg('top')}</button><button id="gm-share">${icon('send')} ${tg('share')}</button></div></div>`;
    ov.classList.remove('hidden');
    $('#gm-again').onclick = () => { ov.classList.add('hidden'); run(); };
    $('#gm-top').onclick = () => showTop(id);
    $('#gm-share').onclick = () => shareScore(Page.cur, score);
    if (score > prev) { Page.best[id] = score; $('#gm-best').textContent = score; }
    try {
      const r = await api('/api/games/score', { body: { game: id, score } });
      Page.best[id] = r.best; $('#gm-best').textContent = r.best;
      const rk = $('#gm-rank'); if (rk) rk.textContent = tg('rank').replace('{n}', r.rank);
    } catch {}
  }
  async function showTop(id) {
    const meta = GAMES.find((x) => x.id === id);
    modal(`<h3>${meta.e} ${tg('top_title')} <button class="icon-btn" data-close>${icon('close')}</button></h3><div class="gm-top" id="gm-toplist"><p class="empty-note">…</p></div>`);
    try {
      const r = await api('/api/games/top?game=' + id);
      const medal = ['🥇', '🥈', '🥉'];
      $('#gm-toplist').innerHTML = r.top.length ? r.top.map((x, i) => `<div class="gm-tr${x.user.id === S.me.id ? ' me' : ''}"><span class="gm-pos">${medal[i] || i + 1}</span>${avatar({ ...x.user, online: false }, 'sm')}<b>${esc(S.users.get(x.user.id)?.name || x.user.name || '')}</b><span class="gm-pts">${x.best}</span></div>`).join('')
        + (r.me && r.me.rank > 20 ? `<div class="gm-tr me"><span class="gm-pos">${r.me.rank}</span>${avatar({ ...S.me, online: false }, 'sm')}<b>${esc(S.me.name)}</b><span class="gm-pts">${r.me.best}</span></div>` : '')
        : `<p class="empty-note">${esc(tg('empty_top'))}</p>`;
    } catch { $('#gm-toplist').innerHTML = `<p class="empty-note">${esc(t('net_err'))}</p>`; }
  }
  function shareScore(meta, score) {
    const txt = tg('share_text').replace('{g}', gname(meta)).replace('{s}', score);
    const list = [...S.chats.values()].filter((c) => !(c.type === 'channel' && !['owner', 'admin'].includes(c.role)) && (c.last || c.self)).sort((a, b) => (b.last?.created_at || 0) - (a.last?.created_at || 0)).slice(0, 60);
    modal(`<h3>${tg('share')} <button class="icon-btn" data-close>${icon('close')}</button></h3><div class="chat-pick">${list.map((c) => `<button data-cid="${c.id}">${chatAvatar(c, 'sm')}<b>${esc(chatTitle(c))}</b></button>`).join('')}</div>`);
    $('#modal-card .chat-pick').onclick = async (e) => { const b = e.target.closest('[data-cid]'); if (!b) return; closeModal(); try { await emitSend({ chatId: +b.dataset.cid, type: 'text', text: txt }); toast('✓'); } catch (er) { toast(er.message); } };
  }

  /* ================= 2 KISHILIK O'YINLAR (do'stni taklif qilib) ================= */
  const MPL = [
    { id: 'chess', bot: 1, two: 1, e: '♟️', c: ['#78350F', '#1C1917'], n: { uz: 'Shaxmat', ru: 'Шахматы', en: 'Chess' } },
    { id: 'checkers', bot: 1, two: 1, e: '⚪', c: ['#B91C1C', '#7F1D1D'], n: { uz: 'Shashka', ru: 'Шашки', en: 'Checkers' } },
  ];
  const MT = {
    uz: { mp: 'Do‘st bilan o‘ynash', mp_sub: 'Do‘stingizni taklif qiling — navbatma-navbat jonli o‘ynaysiz', solo: 'Yakka o‘yinlar', invite: 'Kimni taklif qilasiz?', active: 'Davom etayotgan o‘yinlar',
      wait: 'Raqib kutilmoqda…', wait_sub: 'Taklif chatga yuborildi. Do‘stingiz “O‘ynash” ni bossa — o‘yin boshlanadi.', your: 'Sizning navbatingiz', their: 'Raqib o‘ylamoqda…', resign: 'Taslim bo‘lish', resign_q: 'Taslim bo‘lasizmi?',
      hide_q: 'Bu o‘yindan chiqib, ro‘yxatdan o‘chirasizmi? (taslim hisoblanadi)', you_won: 'Siz yutdingiz! 🎉', you_lost: 'Siz yutqazdingiz', draw: 'Durang', won_by: '{n} yutdi', play: 'O‘ynash', watch: 'Ko‘rish', open: 'Ochish', invited: 'O‘yinga taklif', status_wait: 'Raqib kutilmoqda', status_play: 'O‘yin davom etmoqda', status_over: 'O‘yin tugadi',
      shuffle: 'Aralashtirish', ready: 'Tayyorman', wait_ready: 'Raqib kemalarini joylamoqda…', place: 'Kemalaringizni joylang', enemy: 'Raqib dengizi', mine: 'Sizning flotingiz', check: 'Shoh!', wins: 'g‘alaba', confirm: 'Tasdiqlash uchun yana bosing', sent: 'Taklif yuborildi', not_avail: 'O‘yin topilmadi', spectate: 'Siz tomoshabinsiz', rematch: 'Qayta o‘ynash', players: 'O‘yinchilar:', joined: 'kishi qo‘shildi', start_now: 'Hozir boshlash ({n} kishi)', send_inv: 'Taklif yuborish', hint_grp: 'Guruhdan {n} kishigacha qo‘shila oladi', hint_pick: 'Taklif qilinganlar: {k} / {n} — bir nechta chatni belgilang', max4: 'Ko‘pi bilan 4 kishi', their_n: '{n} yurmoqda…' },
    ru: { mp: 'Играть с другом', mp_sub: 'Пригласите друга — играйте по очереди в реальном времени', solo: 'Одиночные игры', invite: 'Кого пригласить?', active: 'Текущие партии',
      wait: 'Ожидание соперника…', wait_sub: 'Приглашение отправлено в чат. Когда друг нажмёт «Играть» — игра начнётся.', your: 'Ваш ход', their: 'Соперник думает…', resign: 'Сдаться', resign_q: 'Сдаться?',
      hide_q: 'Выйти из этой игры и убрать её из списка? (засчитается поражение)', you_won: 'Вы победили! 🎉', you_lost: 'Вы проиграли', draw: 'Ничья', won_by: 'Победил(а) {n}', play: 'Играть', watch: 'Смотреть', open: 'Открыть', invited: 'Приглашение в игру', status_wait: 'Ожидание соперника', status_play: 'Идёт игра', status_over: 'Игра окончена',
      shuffle: 'Перемешать', ready: 'Готов', wait_ready: 'Соперник расставляет корабли…', place: 'Расставьте корабли', enemy: 'Поле соперника', mine: 'Ваш флот', check: 'Шах!', wins: 'побед', confirm: 'Нажмите ещё раз для подтверждения', sent: 'Приглашение отправлено', not_avail: 'Игра не найдена', spectate: 'Вы зритель', rematch: 'Реванш', players: 'Игроки:', joined: 'присоединились', start_now: 'Начать сейчас ({n} игр.)', send_inv: 'Отправить приглашение', hint_grp: 'Из группы могут присоединиться до {n} игроков', hint_pick: 'Приглашено: {k} / {n} — отметьте несколько чатов', max4: 'Не больше 4 игроков', their_n: 'Ходит {n}…' },
    en: { mp: 'Play with a friend', mp_sub: 'Invite a friend — take turns live', solo: 'Solo games', invite: 'Who do you invite?', active: 'Ongoing games',
      wait: 'Waiting for opponent…', wait_sub: 'Invite sent to the chat. The game starts when your friend taps “Play”.', your: 'Your turn', their: 'Opponent is thinking…', resign: 'Resign', resign_q: 'Resign this game?',
      hide_q: 'Leave this game and remove it from the list? (counts as resigning)', you_won: 'You won! 🎉', you_lost: 'You lost', draw: 'Draw', won_by: '{n} won', play: 'Play', watch: 'Watch', open: 'Open', invited: 'Game invite', status_wait: 'Waiting for opponent', status_play: 'Game in progress', status_over: 'Game over',
      shuffle: 'Shuffle', ready: 'Ready', wait_ready: 'Opponent is placing ships…', place: 'Place your ships', enemy: 'Enemy waters', mine: 'Your fleet', check: 'Check!', wins: 'wins', confirm: 'Tap again to confirm', sent: 'Invite sent', not_avail: 'Game not found', spectate: 'You are watching', rematch: 'Rematch', players: 'Players:', joined: 'joined', start_now: 'Start now ({n} players)', send_inv: 'Send invite', hint_grp: 'Up to {n} players can join from the group', hint_pick: 'Invited: {k} / {n} — select several chats', max4: 'Up to 4 players', their_n: '{n} is moving…' },
  };
  const mt = (k) => (MT[L()] || PK('mt') || MT.en)[k] || MT.en[k] || MT.uz[k];
  try { const st = document.createElement('style'); st.textContent = '.mp-bar.mp-n { flex-wrap: wrap; gap: 6px; } .mp-bar.mp-n .mp-p { max-width: 48%; padding-right: 8px; border-color: color-mix(in srgb, var(--pc) 55%, transparent); }\n.mp-bar.mp-n .mp-p.on { border-color: #FDE047; } .mp-p.out { opacity: .4; filter: grayscale(1); } .mp-p.out b { text-decoration: line-through; }\n.mp-ncount { display: flex; align-items: center; gap: 8px; margin: 4px 0 6px; flex-wrap: wrap; } .mp-ncount span { font-weight: 700; font-size: 14px; }\n.mp-ncount button { border: 1.5px solid var(--line, #ccc); background: transparent; color: inherit; border-radius: 20px; padding: 7px 14px; font: 700 14px system-ui; cursor: pointer; }\n.mp-ncount button.on { background: var(--accent, #2563EB); border-color: var(--accent, #2563EB); color: #fff; }\n.mp-nhint { margin: 0 0 8px; font-size: 13px; opacity: .75; } .chat-pick.multi button { position: relative; } .chat-pick.multi .mp-chk { margin-left: auto; width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--line, #bbb); flex: none; }\n.chat-pick.multi button.on .mp-chk { background: var(--accent, #2563EB); border-color: var(--accent, #2563EB); box-shadow: inset 0 0 0 4px var(--card, #fff); }\n.mp-send { width: 100%; margin-top: 10px; position: sticky; bottom: 0; } .mp-cnt { font-size: 16px; } .mp-cnt b { font-size: 22px; } #mp-start { margin-top: 12px; }'; document.head.appendChild(st); } catch {}
  const MPI = {};
  const FONT = 'system-ui, -apple-system, Segoe UI, sans-serif';

  // umumiy taxta chizish yordamchisi: kvadrat maydon + bosish → katak
  function boardCanvas(stage, n, ratio = 1) {
    const cv = canvasIn(stage, ratio);
    cv.cell = (e) => { const [x, y] = pos(cv.c, e); const s = Math.min(cv.c.W, cv.c.H) / n; const ox = (cv.c.W - s * n) / 2, oy = (cv.c.H - s * n) / 2; const cx = Math.floor((x - ox) / s), cy = Math.floor((y - oy) / s); return cx < 0 || cy < 0 || cx >= n || cy >= n ? null : [cx, cy]; };
    return cv;
  }

  // ---- Shaxmat (to'liq qoidalar: rokirovka, en passant, o'zgarish, mat/pat) ----
  MPI.chess = (stage, ctx) => {
    const cv = canvasIn(stage, 1); const { c, g } = cv;
    const flip = ctx.me === 1;
    let B = 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR';
    B = B.split('');
    const S = { turn: 'w', cr: { K: 1, Q: 1, k: 1, q: 1 }, ep: -1, half: 0 };
    let sel = -1, targets = [], last = null, done = false, anim = [], hist = {};
    const col = (p) => (p === '.' ? null : p === p.toUpperCase() ? 'w' : 'b');
    const on = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
    function attacked(b, sq, by) { // sq katakni 'by' rangi uradimi
      const r = sq >> 3, f = sq & 7;
      const P = by === 'w' ? 'P' : 'p', N = by === 'w' ? 'N' : 'n', Bp = by === 'w' ? 'B' : 'b', R = by === 'w' ? 'R' : 'r', Q = by === 'w' ? 'Q' : 'q', K = by === 'w' ? 'K' : 'k';
      const pr = by === 'w' ? r + 1 : r - 1; for (const df of [-1, 1]) if (on(pr, f + df) && b[pr * 8 + f + df] === P) return true;
      for (const [dr, df] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) if (on(r + dr, f + df) && b[(r + dr) * 8 + f + df] === N) return true;
      for (const [dr, df] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (on(r + dr, f + df) && b[(r + dr) * 8 + f + df] === K) return true;
        let rr2 = r + dr, ff = f + df; const diag = dr && df;
        while (on(rr2, ff)) { const q = b[rr2 * 8 + ff]; if (q !== '.') { if (q === Q || q === (diag ? Bp : R)) return true; break; } rr2 += dr; ff += df; }
      }
      return false;
    }
    function pseudo(b, s, side) {
      const out = [];
      for (let i = 0; i < 64; i++) {
        const p = b[i]; if (col(p) !== side) continue; const r = i >> 3, f = i & 7, t = p.toLowerCase();
        const add = (j) => { const q = b[j]; if (col(q) !== side) out.push([i, j]); };
        if (t === 'p') {
          const d = side === 'w' ? -1 : 1, start = side === 'w' ? 6 : 1;
          if (on(r + d, f) && b[(r + d) * 8 + f] === '.') { out.push([i, (r + d) * 8 + f]); if (r === start && b[(r + 2 * d) * 8 + f] === '.') out.push([i, (r + 2 * d) * 8 + f]); }
          for (const df of [-1, 1]) if (on(r + d, f + df)) { const j = (r + d) * 8 + f + df; if ((b[j] !== '.' && col(b[j]) !== side) || j === s.ep) out.push([i, j]); }
        } else if (t === 'n') { for (const [dr, df] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) if (on(r + dr, f + df)) add((r + dr) * 8 + f + df); }
        else if (t === 'k') {
          for (const [dr, df] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (on(r + dr, f + df)) add((r + dr) * 8 + f + df);
          const opp = side === 'w' ? 'b' : 'w', home = side === 'w' ? 60 : 4, kk = side === 'w' ? 'K' : 'k', qq = side === 'w' ? 'Q' : 'q';
          if (i === home && !attacked(b, home, opp)) {
            if (s.cr[kk] && b[home + 1] === '.' && b[home + 2] === '.' && b[home + 3] === (side === 'w' ? 'R' : 'r') && !attacked(b, home + 1, opp) && !attacked(b, home + 2, opp)) out.push([i, home + 2]);
            if (s.cr[qq] && b[home - 1] === '.' && b[home - 2] === '.' && b[home - 3] === '.' && b[home - 4] === (side === 'w' ? 'R' : 'r') && !attacked(b, home - 1, opp) && !attacked(b, home - 2, opp)) out.push([i, home - 2]);
          }
        } else {
          const dirs = t === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : t === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
          for (const [dr, df] of dirs) { let rr2 = r + dr, ff = f + df; while (on(rr2, ff)) { const j = rr2 * 8 + ff; if (b[j] === '.') out.push([i, j]); else { if (col(b[j]) !== side) out.push([i, j]); break; } rr2 += dr; ff += df; } }
        }
      }
      return out;
    }
    function make(b, s, [a, z, pr]) {
      const nb = b.slice(), ns = { turn: s.turn === 'w' ? 'b' : 'w', cr: { ...s.cr }, ep: -1, half: s.half + 1 };
      const p = nb[a], t = p.toLowerCase(); let cap = nb[z] !== '.';
      if (t === 'p' && z === s.ep) { nb[z + (col(p) === 'w' ? 8 : -8)] = '.'; cap = true; }
      nb[z] = p; nb[a] = '.';
      if (t === 'p') { ns.half = 0; if (Math.abs(z - a) === 16) ns.ep = (a + z) / 2; if (z < 8 || z >= 56) nb[z] = col(p) === 'w' ? (pr || 'Q').toUpperCase() : (pr || 'q').toLowerCase(); }
      if (cap) ns.half = 0;
      if (t === 'k') { if (z - a === 2) { nb[a + 1] = nb[a + 3]; nb[a + 3] = '.'; } if (a - z === 2) { nb[a - 1] = nb[a - 4]; nb[a - 4] = '.'; } if (col(p) === 'w') ns.cr.K = ns.cr.Q = 0; else ns.cr.k = ns.cr.q = 0; }
      for (const [sq, k] of [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']]) if (a === sq || z === sq) ns.cr[k] = 0;
      return [nb, ns, cap];
    }
    const kingSq = (b, side) => b.indexOf(side === 'w' ? 'K' : 'k');
    const legal = (b, s) => pseudo(b, s, s.turn).filter((m) => { const [nb] = make(b, s, m); return !attacked(nb, kingSq(nb, s.turn), s.turn === 'w' ? 'b' : 'w'); });
    let moves = legal(B, S);
    const inCheck = () => attacked(B, kingSq(B, S.turn), S.turn === 'w' ? 'b' : 'w');
    const mySide = ctx.me === 0 ? 'w' : 'b';
    // --- o'lchamlar: ramka (koordinatalar uchun) + 8×8 katak ---
    const geo = () => { const tot = Math.min(c.W, c.H), m = Math.max(14, Math.round(tot * 0.052)), s = (tot - 2 * m) / 8; return { s, m, ox: (c.W - 8 * s) / 2, oy: (c.H - 8 * s) / 2 }; };
    const cellAt = (e) => { const [x, y] = pos(c, e); const { s, ox, oy } = geo(); const cx = Math.floor((x - ox) / s), cy = Math.floor((y - oy) / s); return cx < 0 || cy < 0 || cx > 7 || cy > 7 ? null : [cx, cy]; };
    const toSq = ([x, y]) => (flip ? (7 - y) * 8 + (7 - x) : y * 8 + x);
    c.addEventListener('pointerdown', (e) => {
      if (done || S.turn !== mySide || ctx.me < 0) return; const p = cellAt(e); if (!p) return; const sq = toSq(p);
      if (sel >= 0 && targets.includes(sq)) { const m = [sel, sq]; const pc = B[sel].toLowerCase(); if (pc === 'p' && (sq < 8 || sq >= 56)) m.push('q'); sel = -1; targets = []; ctx.send(m); return; }
      if (col(B[sq]) === mySide) { sel = sq; targets = moves.filter((m) => m[0] === sq).map((m) => m[1]); snd(660, 0.03, 0.03); } else { sel = -1; targets = []; }
    });
    // --- bot: alfa-beta (iterativ chuqurlashish, ~220 ms), material + katak jadvallari, tinchlantiruvchi qidiruv ---
    const PV = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    const tb = (s) => s.split(' ').map(Number);
    const PST = {
      p: tb('0 0 0 0 0 0 0 0 50 50 50 50 50 50 50 50 10 10 20 30 30 20 10 10 5 5 10 25 25 10 5 5 0 0 0 20 20 0 0 0 5 -5 -10 0 0 -10 -5 5 5 10 10 -20 -20 10 10 5 0 0 0 0 0 0 0 0'),
      n: tb('-50 -40 -30 -30 -30 -30 -40 -50 -40 -20 0 0 0 0 -20 -40 -30 0 10 15 15 10 0 -30 -30 5 15 20 20 15 5 -30 -30 0 15 20 20 15 0 -30 -30 5 10 15 15 10 5 -30 -40 -20 0 5 5 0 -20 -40 -50 -40 -30 -30 -30 -30 -40 -50'),
      b: tb('-20 -10 -10 -10 -10 -10 -10 -20 -10 0 0 0 0 0 0 -10 -10 0 5 10 10 5 0 -10 -10 5 5 10 10 5 5 -10 -10 0 10 10 10 10 0 -10 -10 10 10 10 10 10 10 -10 -10 5 0 0 0 0 5 -10 -20 -10 -10 -10 -10 -10 -10 -20'),
      r: tb('0 0 0 0 0 0 0 0 5 10 10 10 10 10 10 5 -5 0 0 0 0 0 0 -5 -5 0 0 0 0 0 0 -5 -5 0 0 0 0 0 0 -5 -5 0 0 0 0 0 0 -5 -5 0 0 0 0 0 0 -5 0 0 0 5 5 0 0 0'),
      q: tb('-20 -10 -10 -5 -5 -10 -10 -20 -10 0 0 0 0 0 0 -10 -10 0 5 5 5 5 0 -10 -5 0 5 5 5 5 0 -5 0 0 5 5 5 5 0 -5 -10 5 5 5 5 5 0 -10 -10 0 5 0 0 0 0 -10 -20 -10 -10 -5 -5 -10 -10 -20'),
      k: tb('-30 -40 -40 -50 -50 -40 -40 -30 -30 -40 -40 -50 -50 -40 -40 -30 -30 -40 -40 -50 -50 -40 -40 -30 -30 -40 -40 -50 -50 -40 -40 -30 -20 -30 -30 -40 -40 -30 -30 -20 -10 -20 -20 -20 -20 -20 -20 -10 20 20 0 0 0 0 20 20 20 30 10 0 0 10 30 20'),
      e: tb('-50 -40 -30 -20 -20 -30 -40 -50 -30 -20 -10 0 0 -10 -20 -30 -30 -10 20 30 30 20 -10 -30 -30 -10 30 40 40 30 -10 -30 -30 -10 30 40 40 30 -10 -30 -30 -10 20 30 30 20 -10 -30 -30 -30 0 0 0 0 -30 -30 -50 -30 -30 -30 -30 -30 -30 -50'),
    };
    function evalB(b, side) { // side nuqtai nazaridan baho
      let sc = 0, nonP = 0, wk = -1, bk = -1;
      for (let i = 0; i < 64; i++) { const p = b[i]; if (p === '.') continue; const t = p.toLowerCase(); if (t !== 'p' && t !== 'k') nonP += PV[t]; if (p === 'K') wk = i; else if (p === 'k') bk = i; }
      const end = nonP <= 1700;
      for (let i = 0; i < 64; i++) { const p = b[i]; if (p === '.') continue; const t = p.toLowerCase(), w = p !== t; const tbl = t === 'k' && end ? PST.e : PST[t]; const v = PV[t] + tbl[w ? i : i ^ 56]; sc += w ? v : -v; }
      if (end && wk >= 0 && bk >= 0) { // endshpil: yutayotgan tomon qirolni chetga siqadi
        const d = Math.abs((wk >> 3) - (bk >> 3)) + Math.abs((wk & 7) - (bk & 7)), edge = (k) => Math.max(3 - (k >> 3), (k >> 3) - 4) + Math.max(3 - (k & 7), (k & 7) - 4);
        if (sc > 150) sc += edge(bk) * 12 + (14 - d) * 5; else if (sc < -150) sc -= edge(wk) * 12 + (14 - d) * 5;
      }
      return side === 'w' ? sc : -sc;
    }
    function bot(seat) {
      const side = seat === 0 ? 'w' : 'b'; if (done || S.turn !== side || !moves.length) return null;
      const MATE = 100000, t0 = performance.now(), LIM = 220; let nodes = 0, abort = false;
      const mvv = (b, m) => { const q = b[m[1]]; let v = q !== '.' ? PV[q.toLowerCase()] * 10 - PV[b[m[0]].toLowerCase()] / 10 + 1000 : 0; if (b[m[0]].toLowerCase() === 'p' && (m[1] < 8 || m[1] >= 56)) v += 8000; return v; };
      const ordered = (b, ms) => ms.map((m) => [mvv(b, m), m]).sort((x, y) => y[0] - x[0]).map((x) => x[1]);
      const tick = () => { if ((++nodes & 255) === 0 && performance.now() - t0 > LIM) abort = true; return abort; };
      function qs(b, s, al, be, ply, qd) {
        if (tick()) return 0; const sp = evalB(b, s.turn); if (sp >= be) return sp; if (sp > al) al = sp; if (qd > 5) return sp;
        for (const m of ordered(b, pseudo(b, s, s.turn).filter((m) => b[m[1]] !== '.'))) {
          if (b[m[1]].toLowerCase() === 'k') return MATE - ply;
          const [nb, ns] = make(b, s, m); const v = -qs(nb, ns, -be, -al, ply + 1, qd + 1); if (abort) return 0;
          if (v >= be) return v; if (v > al) al = v;
        }
        return al;
      }
      function ab(b, s, d, al, be, ply) {
        if (tick()) return 0; if (d <= 0) return qs(b, s, al, be, ply, 0);
        let best = -Infinity;
        for (const m of ordered(b, pseudo(b, s, s.turn))) {
          if (b[m[1]].toLowerCase() === 'k') return MATE - ply; // qirolni urish = oldingi yurish noqonuniy
          const [nb, ns] = make(b, s, m); const v = -ab(nb, ns, d - 1, -be, -al, ply + 1); if (abort) return 0;
          if (v > best) best = v; if (v > al) al = v; if (al >= be) break;
        }
        if (best <= -MATE + 100 && !attacked(b, kingSq(b, s.turn), s.turn === 'w' ? 'b' : 'w')) return 0; // pat
        return best;
      }
      let root = moves.slice().sort(() => Math.random() - 0.5); root = ordered(B, root); let bestM = root[0];
      for (let d = 1; d <= 6; d++) {
        let al = -Infinity, bm = null; const sc = [];
        for (const m of root) { const [nb, ns] = make(B, S, m); const v = -ab(nb, ns, d - 1, -Infinity, -al, 1); if (abort) break; sc.push([v, m]); if (v > al) { al = v; bm = m; } }
        if (abort && d > 2) break; if (bm) bestM = bm; if (abort) break;
        root = sc.sort((x, y) => y[0] - x[0]).map((x) => x[1]).concat(root.filter((m) => !sc.some((x) => x[1] === m)));
        if (al >= MATE - 100 || performance.now() - t0 > LIM * 0.45) break;
      }
      const m = bestM.slice(0, 2); if (B[m[0]].toLowerCase() === 'p' && (m[1] < 8 || m[1] >= 56)) m.push('q'); return m;
    }
    // --- effektlar ---
    const parts = []; let shake = 0, capFx = null, clock = 0;
    const burst = (sq, white) => { const { s, ox, oy } = geo(); let x = sq & 7, y = sq >> 3; if (flip) { x = 7 - x; y = 7 - y; } const cx = ox + x * s + s / 2, cy = oy + y * s + s / 2; for (let k = 0; k < 22; k++) { const a = Math.random() * 6.28, v = (0.6 + Math.random()) * s * 2.2; parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - s, l: 0.5 + Math.random() * 0.4, c: k % 3 ? (white ? '#FFF7E6' : '#3F3A36') : '#FBBF24', r: s * (0.03 + Math.random() * 0.05) }); } };
    const api = {
      apply(sd, m, replay) {
        if (done || !Array.isArray(m) || (sd === 0 ? 'w' : 'b') !== S.turn) return false;
        const ok = moves.find((x) => x[0] === m[0] && x[1] === m[1]); if (!ok) return false;
        const pr = typeof m[2] === 'string' && 'qrbn'.includes(m[2]) ? m[2] : undefined;
        const capSq = B[m[0]].toLowerCase() === 'p' && m[1] === S.ep ? m[1] + (S.turn === 'w' ? 8 : -8) : m[1], capP = B[capSq];
        const [nb, ns, cap] = make(B, S, [m[0], m[1], pr]);
        if (!replay) {
          anim = [{ a: m[0], z: m[1], t: 0 }]; const kk = B[m[0]].toLowerCase() === 'k' && Math.abs(m[1] - m[0]) === 2; if (kk) anim.push(m[1] > m[0] ? { a: m[0] + 3, z: m[0] + 1, t: -0.25 } : { a: m[0] - 4, z: m[0] - 1, t: -0.25 });
          if (cap && capP !== '.') { capFx = { sq: capSq, p: capP, t: 0 }; } snd(cap ? 300 : 520, 0.07, 0.07, 'triangle');
        }
        B = nb; Object.assign(S, ns); last = [m[0], m[1]]; sel = -1; targets = []; moves = legal(B, S);
        const key = B.join('') + S.turn; hist[key] = (hist[key] || 0) + 1;
        const ck = inCheck();
        if (!moves.length) { done = true; ctx.over(ck ? sd : 2); }
        else if (S.half >= 100 || hist[key] >= 3 || B.filter((x) => x !== '.').every((x) => 'Kk'.includes(x)) || (B.filter((x) => x !== '.').length === 3 && B.some((x) => 'NnBb'.includes(x)))) { done = true; ctx.over(2); }
        else if (ck && !replay) { ctx.hint(mt('check')); snd(880, 0.15, 0.06); }
        ctx.turn(done ? -1 : S.turn === 'w' ? 0 : 1); return true;
      },
      bot,
    };
    // --- grafika: keshlangan yog'och taxta va vektor figuralar ---
    const mkC = (w, h) => { const o = document.createElement('canvas'), d = Math.min(3, devicePixelRatio || 1); o.width = Math.ceil(w * d); o.height = Math.ceil(h * d); const x = o.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [o, x]; };
    let bgC = null, bgK = '', spr = {};
    function drawBg() {
      const { s, m, ox, oy } = geo(); const [o, x] = mkC(c.W, c.H); bgC = o; spr = {};
      let sd = 11; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      const fx = ox - m, fy = oy - m, fw = 8 * s + 2 * m, rad = m * 0.45;
      x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 22; x.shadowOffsetY = 8; let gr = x.createLinearGradient(fx, fy, fx + fw, fy + fw); gr.addColorStop(0, '#7A4424'); gr.addColorStop(0.5, '#562D14'); gr.addColorStop(1, '#3B1D0B'); x.fillStyle = gr; rr(x, fx, fy, fw, fw, rad); x.fill(); x.restore();
      x.save(); rr(x, fx, fy, fw, fw, rad); x.clip(); x.globalAlpha = 0.14; x.strokeStyle = '#1A0B03';
      for (let i = 0; i < 46; i++) { x.lineWidth = 0.4 + R() * 1.2; const yy = fy + R() * fw; x.beginPath(); x.moveTo(fx, yy); x.bezierCurveTo(fx + fw * 0.3, yy + (R() - 0.5) * 10, fx + fw * 0.7, yy + (R() - 0.5) * 10, fx + fw, yy + (R() - 0.5) * 8); x.stroke(); }
      x.restore(); x.strokeStyle = 'rgba(255,214,160,.28)'; x.lineWidth = 1.5; rr(x, fx + 1, fy + 1, fw - 2, fw - 2, rad); x.stroke();
      for (let sq = 0; sq < 64; sq++) {
        const xx = ox + (sq & 7) * s, yy = oy + (sq >> 3) * s, dk = ((sq >> 3) + (sq & 7)) % 2;
        gr = x.createLinearGradient(xx, yy, xx + s, yy + s); gr.addColorStop(0, dk ? '#B77A49' : '#F4DCB3'); gr.addColorStop(1, dk ? '#93582F' : '#E5C18D'); x.fillStyle = gr; x.fillRect(xx, yy, s + 0.5, s + 0.5);
        x.globalAlpha = dk ? 0.2 : 0.13; x.strokeStyle = dk ? '#4A2511' : '#A87A48'; x.lineWidth = 0.7;
        for (let k = 0; k < 5; k++) { const y2 = yy + R() * s; x.beginPath(); x.moveTo(xx, y2); x.quadraticCurveTo(xx + s / 2, y2 + (R() - 0.5) * s * 0.3, xx + s, y2 + (R() - 0.5) * s * 0.2); x.stroke(); }
        x.globalAlpha = 1;
      }
      x.strokeStyle = 'rgba(20,8,2,.65)'; x.lineWidth = 2; x.strokeRect(ox - 1, oy - 1, 8 * s + 2, 8 * s + 2);
      x.font = `700 ${Math.round(m * 0.52)}px ${FONT}`; x.fillStyle = 'rgba(255,226,182,.9)'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let i = 0; i < 8; i++) { const f = 'abcdefgh'[flip ? 7 - i : i], rk = String(flip ? i + 1 : 8 - i); x.fillText(f, ox + i * s + s / 2, oy + 8 * s + m / 2); x.fillText(f, ox + i * s + s / 2, oy - m / 2); x.fillText(rk, ox - m / 2, oy + i * s + s / 2); x.fillText(rk, ox + 8 * s + m / 2, oy + i * s + s / 2); }
    }
    function shape(x, t) { // 100×100 birlikdagi figura konturi
      x.beginPath();
      if (t === 'p') { x.moveTo(63, 31); x.arc(50, 31, 13, 0, 7); x.moveTo(41, 44); x.lineTo(59, 44); x.quadraticCurveTo(58, 62, 68, 76); x.lineTo(32, 76); x.quadraticCurveTo(42, 62, 41, 44); x.moveTo(63, 46); x.ellipse(50, 46, 13, 4.5, 0, 0, 7); }
      else if (t === 'r') { x.moveTo(28, 14); [[38, 14], [38, 22], [45, 22], [45, 14], [55, 14], [55, 22], [62, 22], [62, 14], [72, 14], [72, 31], [66, 37], [34, 37], [28, 31]].forEach(([a, b]) => x.lineTo(a, b)); x.closePath(); x.moveTo(35, 37); x.lineTo(65, 37); x.lineTo(63, 76); x.lineTo(37, 76); x.closePath(); }
      else if (t === 'n') { x.moveTo(33, 76); x.bezierCurveTo(33, 63, 43, 57, 47, 50); x.bezierCurveTo(40, 52, 30, 55, 24, 53); x.bezierCurveTo(17, 51, 16, 44, 21, 40); x.bezierCurveTo(28, 32, 34, 23, 42, 18); x.lineTo(46, 7); x.lineTo(52, 15); x.bezierCurveTo(66, 19, 74, 35, 71, 52); x.bezierCurveTo(70, 62, 67, 70, 67, 76); x.closePath(); }
      else if (t === 'b') { x.moveTo(55, 11); x.arc(50, 11, 5, 0, 7); x.moveTo(50, 15); x.bezierCurveTo(65, 24, 67, 41, 58, 50); x.lineTo(42, 50); x.bezierCurveTo(33, 41, 35, 24, 50, 15); x.moveTo(43, 54); x.lineTo(57, 54); x.quadraticCurveTo(58, 67, 66, 76); x.lineTo(34, 76); x.quadraticCurveTo(42, 67, 43, 54); x.moveTo(62, 53); x.ellipse(50, 53, 12, 4, 0, 0, 7); }
      else if (t === 'q') { x.moveTo(31, 58); [[20, 25], [32, 44], [36, 17], [44, 42], [50, 12], [56, 42], [64, 17], [68, 44], [80, 25], [69, 58]].forEach(([a, b]) => x.lineTo(a, b)); x.closePath(); [[20, 23], [36, 15], [50, 10], [64, 15], [80, 23]].forEach(([a, b]) => { x.moveTo(a + 4.5, b); x.arc(a, b, 4.5, 0, 7); }); x.rect(31, 57, 38, 7); x.moveTo(33, 64); x.lineTo(67, 64); x.quadraticCurveTo(64, 71, 69, 76); x.lineTo(31, 76); x.quadraticCurveTo(36, 71, 33, 64); }
      else { x.rect(47, 4, 6, 20); x.rect(41, 9, 18, 6); x.moveTo(31, 58); x.bezierCurveTo(17, 42, 28, 25, 44, 32); x.quadraticCurveTo(50, 20, 56, 32); x.bezierCurveTo(72, 25, 83, 42, 69, 58); x.closePath(); x.rect(31, 57, 38, 7); x.moveTo(33, 64); x.lineTo(67, 64); x.quadraticCurveTo(64, 71, 69, 76); x.lineTo(31, 76); x.quadraticCurveTo(36, 71, 33, 64); }
      x.moveTo(26, 76); x.lineTo(74, 76); x.quadraticCurveTo(79, 76, 79, 81); x.lineTo(79, 86); x.quadraticCurveTo(79, 90, 74, 90); x.lineTo(26, 90); x.quadraticCurveTo(21, 90, 21, 86); x.lineTo(21, 81); x.quadraticCurveTo(21, 76, 26, 76);
    }
    function sprite(p, s) {
      const k = p + '|' + Math.round(s); if (spr[k]) return spr[k];
      const [o, x] = mkC(s, s); const w = col(p) === 'w', t = p.toLowerCase(); x.scale(s / 100, s / 100);
      x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(52, 90, 31, 7, 0, 0, 7); x.fill();
      shape(x, t); x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 6; x.shadowOffsetY = 3; x.fillStyle = w ? '#EADBC4' : '#1C1917'; x.fill(); x.restore();
      const gr = x.createLinearGradient(20, 0, 80, 100); if (w) { gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, '#F4EADB'); gr.addColorStop(1, '#C9B08E'); } else { gr.addColorStop(0, '#6B625C'); gr.addColorStop(0.45, '#2A2420'); gr.addColorStop(1, '#0A0807'); }
      x.fillStyle = gr; x.fill(); x.lineJoin = 'round'; x.lineWidth = 3; x.strokeStyle = w ? '#4B3621' : '#C9B79C'; x.stroke();
      x.save(); x.clip(); const hl = x.createRadialGradient(36, 26, 1, 36, 26, 46); hl.addColorStop(0, w ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.3)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = hl; x.fillRect(0, 0, 100, 100); x.restore();
      x.strokeStyle = w ? '#4B3621' : '#C9B79C'; x.fillStyle = x.strokeStyle; x.lineWidth = 2.5; x.lineCap = 'round';
      if (t === 'n') { x.beginPath(); x.arc(40, 29, 2.8, 0, 7); x.fill(); x.beginPath(); x.moveTo(56, 22); x.quadraticCurveTo(66, 34, 62, 50); x.stroke(); x.beginPath(); x.arc(24, 46, 1.6, 0, 7); x.fill(); }
      if (t === 'b') { x.beginPath(); x.moveTo(55, 25); x.lineTo(46, 38); x.stroke(); }
      return (spr[k] = o);
    }
    const stop = loop((dt) => {
      clock += dt; const { s, ox, oy } = geo(); const key = c.W + 'x' + c.H; if (key !== bgK) { bgK = key; drawBg(); }
      const xy = (sq) => { let x = sq & 7, y = sq >> 3; if (flip) { x = 7 - x; y = 7 - y; } return [ox + x * s, oy + y * s]; };
      g.clearRect(0, 0, c.W, c.H); g.save();
      if (shake > 0) { shake = Math.max(0, shake - dt * 14); g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); }
      g.drawImage(bgC, 0, 0, c.W, c.H);
      if (last) last.forEach((sq, i) => { const [x, y] = xy(sq); g.fillStyle = i ? 'rgba(255,214,64,.5)' : 'rgba(255,214,64,.3)'; g.fillRect(x, y, s, s); });
      if (sel >= 0) { const [x, y] = xy(sel); g.fillStyle = 'rgba(74,222,128,.5)'; g.fillRect(x, y, s, s); g.strokeStyle = 'rgba(22,163,74,.9)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, s - 2, s - 2); }
      if (inCheck()) { const [x, y] = xy(kingSq(B, S.turn)); const pu = 0.75 + 0.25 * Math.sin(clock * 6); const gr = g.createRadialGradient(x + s / 2, y + s / 2, 2, x + s / 2, y + s / 2, s * 0.72); gr.addColorStop(0, `rgba(239,68,68,${pu})`); gr.addColorStop(0.6, `rgba(220,38,38,${pu * 0.55})`); gr.addColorStop(1, 'rgba(220,38,38,0)'); g.fillStyle = gr; g.fillRect(x - s * 0.1, y - s * 0.1, s * 1.2, s * 1.2); }
      for (const t2 of targets) { const [x, y] = xy(t2); if (B[t2] !== '.') { g.lineWidth = s * 0.07; g.strokeStyle = 'rgba(21,128,61,.75)'; g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.43, 0, 7); g.stroke(); } else { g.fillStyle = 'rgba(21,128,61,.55)'; g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.15, 0, 7); g.fill(); } }
      const hide = new Set(anim.map((a) => a.z));
      for (let sq = 0; sq < 64; sq++) { if (B[sq] === '.' || hide.has(sq)) continue; const [x, y] = xy(sq); g.drawImage(sprite(B[sq], s), x, y - s * 0.02, s, s); }
      if (capFx) { if (!anim.length || anim[0].t >= 1) capFx.t += dt * 3; const [x, y] = xy(capFx.sq), k = capFx.t; if (k < 1) { g.globalAlpha = 1 - k; const z = 1 + k * 0.4; g.drawImage(sprite(capFx.p, s), x + s / 2 - (s * z) / 2, y + s / 2 - (s * z) / 2, s * z, s * z); g.globalAlpha = 1; } else capFx = null; }
      for (const a of anim) {
        a.t = Math.min(1, a.t + dt * 4.2); const k = a.t <= 0 ? 0 : 1 - Math.pow(1 - a.t, 3), [x0, y0] = xy(a.a), [x1, y1] = xy(a.z), lift = Math.sin(Math.PI * Math.max(0, a.t)) * s * 0.12, sz = s * (1 + lift / s);
        g.drawImage(sprite(B[a.z], s), x0 + (x1 - x0) * k - (sz - s) / 2, y0 + (y1 - y0) * k - lift - (sz - s) / 2, sz, sz);
        if (a.t >= 1 && !a.f) { a.f = 1; if (capFx && a === anim[0]) { burst(capFx.sq, col(capFx.p) === 'w'); shake = 5; snd(180, 0.12, 0.06, 'square'); } }
      }
      if (anim.length && anim.every((a) => a.t >= 1)) anim = [];
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.l -= dt; if (q.l <= 0) { parts.splice(i, 1); continue; } q.vy += s * 9 * dt; q.x += q.vx * dt; q.y += q.vy * dt; g.globalAlpha = Math.min(1, q.l * 2); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.restore();
    });
    ctx.turn(0);
    return { ...api, stop, resize: () => { cv.fit(); bgK = ''; } };
  };


  // ---- Shashka (rus qoidalari: majburiy urish, ketma-ket urish, uchar damka) ----
  MPI.checkers = (stage, ctx) => {
    const cv = canvasIn(stage, 1); const { c, g } = cv; const flip = ctx.me === 1;
    // 0-o'yinchi (oq) pastda: 5-7 qatorlar; 1-o'yinchi (qora) tepada: 0-2 qatorlar
    const b = Array(64).fill(null);
    for (let i = 0; i < 64; i++) { const r = i >> 3, f = i & 7; if ((r + f) % 2 === 1) { if (r < 3) b[i] = { s: 1, k: 0 }; else if (r > 4) b[i] = { s: 0, k: 0 }; } }
    let turn = 0, done = false, sel = -1, path = [], last = null, quiet = 0;
    const on = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
    const DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    function caps(from, sd, king) {
      const res = []; const orig = b[from]; b[from] = null;
      const dfs = (sq, k, taken, pth) => {
        const r = sq >> 3, f = sq & 7; let found = false;
        for (const [dr, df] of DIRS) {
          if (k) {
            let rr2 = r + dr, ff = f + df; while (on(rr2, ff) && !b[rr2 * 8 + ff]) { rr2 += dr; ff += df; }
            if (!on(rr2, ff)) continue; const mid = rr2 * 8 + ff; const q = b[mid];
            if (!q || q.s === sd || taken.includes(mid)) continue;
            let lr = rr2 + dr, lf = ff + df; const lands = [];
            while (on(lr, lf) && !b[lr * 8 + lf]) { lands.push(lr * 8 + lf); lr += dr; lf += df; }
            for (const L of lands) { found = true; dfs(L, true, taken.concat(mid), pth.concat(L)); }
          } else {
            const mr = r + dr, mf = f + df, lr = r + 2 * dr, lf = f + 2 * df; if (!on(lr, lf)) continue;
            const mid = mr * 8 + mf, L = lr * 8 + lf, q = b[mid];
            if (!q || q.s === sd || taken.includes(mid) || b[L]) continue;
            found = true; const promo = (sd === 0 && lr === 0) || (sd === 1 && lr === 7); dfs(L, promo, taken.concat(mid), pth.concat(L));
          }
        }
        if (!found && pth.length > 1) res.push({ p: pth, t: taken });
      };
      dfs(from, king, [], [from]); b[from] = orig; return res;
    }
    function allMoves(sd) {
      let cp = [], st = [];
      for (let i = 0; i < 64; i++) { const q = b[i]; if (!q || q.s !== sd) continue; cp = cp.concat(caps(i, sd, q.k)); }
      if (cp.length) return cp;
      for (let i = 0; i < 64; i++) {
        const q = b[i]; if (!q || q.s !== sd) continue; const r = i >> 3, f = i & 7;
        for (const [dr, df] of DIRS) {
          if (!q.k && dr !== (sd === 0 ? -1 : 1)) continue;
          let rr2 = r + dr, ff = f + df;
          while (on(rr2, ff) && !b[rr2 * 8 + ff]) { st.push({ p: [i, rr2 * 8 + ff], t: [] }); if (!q.k) break; rr2 += dr; ff += df; }
        }
      }
      return st;
    }
    let moves = allMoves(0);
    const geo = () => { const tot = Math.min(c.W, c.H), m = Math.max(14, Math.round(tot * 0.052)), s = (tot - 2 * m) / 8; return { s, m, ox: (c.W - 8 * s) / 2, oy: (c.H - 8 * s) / 2 }; };
    const cellAt = (e) => { const [x, y] = pos(c, e); const { s, ox, oy } = geo(); const cx = Math.floor((x - ox) / s), cy = Math.floor((y - oy) / s); return cx < 0 || cy < 0 || cx > 7 || cy > 7 ? null : [cx, cy]; };
    const toSq = ([x, y]) => (flip ? (7 - y) * 8 + (7 - x) : y * 8 + x);
    const same = (a, z) => a.length === z.length && a.every((v, i) => v === z[i]);
    const prefix = (pth) => moves.filter((m) => pth.every((v, i) => m.p[i] === v));
    c.addEventListener('pointerdown', (e) => {
      if (done || turn !== ctx.me) return; const p = cellAt(e); if (!p) return; const sq = toSq(p);
      if (path.length) {
        const cand = prefix(path.concat(sq));
        if (cand.length) { path.push(sq); const full = cand.find((m) => same(m.p, path)); if (full) { const pth = path; path = []; sel = -1; ctx.send(pth); } else snd(660, 0.03, 0.03); return; }
      }
      if (b[sq]?.s === ctx.me && moves.some((m) => m.p[0] === sq)) { sel = sq; path = [sq]; snd(600, 0.03, 0.03); } else { sel = -1; path = []; }
    });
    // --- bot: negamaks + alfa-beta (iterativ chuqurlashish, ~220 ms); butun ketma-ket urish bitta yurish ---
    const doM = (m, sd) => { // taxtada vaqtincha yurish; qaytaradi: bekor qilish funksiyasi
      const pc = b[m.p[0]], k0 = pc.k, tk = m.t.map((i) => [i, b[i]]), z = m.p[m.p.length - 1];
      b[m.p[0]] = null; m.t.forEach((i) => (b[i] = null)); b[z] = pc;
      if (!pc.k) for (const sq of m.p) { const r = sq >> 3; if ((sd === 0 && r === 0) || (sd === 1 && r === 7)) pc.k = 1; }
      return () => { b[z] = null; b[m.p[0]] = pc; pc.k = k0; tk.forEach(([i, q]) => (b[i] = q)); };
    };
    function evalB(sd) {
      let sc = 0;
      for (let i = 0; i < 64; i++) { const q = b[i]; if (!q) continue; const r = i >> 3, f = i & 7; let v;
        if (q.k) v = 300 + (3.5 - Math.abs(3.5 - r)) * 2 + (3.5 - Math.abs(3.5 - f)) * 2;
        else { const adv = q.s === 0 ? 7 - r : r; v = 100 + adv * 4 + (f > 1 && f < 6 ? 4 : 0) + (adv === 0 ? 6 : 0); }
        sc += q.s === sd ? v : -v; }
      return sc;
    }
    function bot(seat) {
      if (done || seat !== turn || !moves.length) return null; if (moves.length === 1) return moves[0].p.slice();
      const MATE = 100000, t0 = performance.now(), LIM = 220; let nodes = 0, abort = false;
      const ab = (sd, d, al, be, ply) => {
        if ((++nodes & 63) === 0 && performance.now() - t0 > LIM) abort = true; if (abort) return 0;
        const ms = allMoves(sd); if (!ms.length) return -MATE + ply;
        if (d <= 0 && !ms[0].t.length) return evalB(sd); // urish bo'lsa davom etadi (tinch holat)
        if (ply > 14) return evalB(sd);
        ms.sort((x, y) => y.t.length - x.t.length); let best = -Infinity;
        for (const m of ms) { const un = doM(m, sd); const v = -ab(1 - sd, d - 1, -be, -al, ply + 1); un(); if (abort) return 0; if (v > best) best = v; if (v > al) al = v; if (al >= be) break; }
        return best;
      };
      let root = moves.slice().sort(() => Math.random() - 0.5), bestM = root[0];
      for (let d = 1; d <= 10; d++) {
        let al = -Infinity, bm = null; const sc = [];
        for (const m of root) { const un = doM(m, seat); const v = -ab(1 - seat, d - 1, -Infinity, -al, 1); un(); if (abort) break; sc.push([v, m]); if (v > al) { al = v; bm = m; } }
        if (abort) break; bestM = bm || bestM; root = sc.sort((x, y) => y[0] - x[0]).map((x) => x[1]);
        if (Math.abs(al) > MATE - 100 || performance.now() - t0 > LIM * 0.4) break;
      }
      return bestM.p.slice();
    }
    // --- effektlar ---
    const parts = []; let anim = null, shake = 0, clock = 0;
    const cxy = (sq, s, ox, oy) => { let x = sq & 7, y = sq >> 3; if (flip) { x = 7 - x; y = 7 - y; } return [ox + x * s + s / 2, oy + y * s + s / 2]; };
    const burst = (sq, dark) => { const { s, ox, oy } = geo(); const [cx, cy] = cxy(sq, s, ox, oy); for (let k = 0; k < 24; k++) { const a = Math.random() * 6.28, v = (0.5 + Math.random()) * s * 2.4; parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - s, l: 0.45 + Math.random() * 0.4, c: k % 4 === 0 ? '#FDE047' : dark ? '#292524' : '#F5F5F4', r: s * (0.03 + Math.random() * 0.05) }); } };
    const api = {
      apply(sd, pth, replay) {
        if (done || sd !== turn || !Array.isArray(pth)) return false;
        const m = moves.find((x) => same(x.p, pth)); if (!m) return false;
        const pc = b[m.p[0]]; const capd = m.t.map((i) => ({ i, q: { ...b[i] }, gone: 0, f: 0 }));
        b[m.p[0]] = null; m.t.forEach((i) => (b[i] = null));
        const z = m.p[m.p.length - 1]; b[z] = pc;
        if (!pc.k) { for (const sq of m.p) { const r = sq >> 3; if ((sd === 0 && r === 0) || (sd === 1 && r === 7)) pc.k = 1; } }
        last = m.p; if (!replay) { snd(m.t.length ? 320 : 520, 0.07, 0.06, 'triangle'); anim = { p: m.p.slice(), t: 0, pc, caps: capd }; }
        quiet = m.t.length || !pc.k ? 0 : quiet + 1;
        turn = 1 - turn; moves = allMoves(turn); path = []; sel = -1;
        if (!moves.length) { done = true; ctx.over(sd); } else if (quiet >= 30) { done = true; ctx.over(2); }
        ctx.turn(done ? -1 : turn); return true;
      },
      bot,
    };
    // --- grafika ---
    const mkC = (w, h) => { const o = document.createElement('canvas'), d = Math.min(3, devicePixelRatio || 1); o.width = Math.ceil(w * d); o.height = Math.ceil(h * d); const x = o.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [o, x]; };
    let bgC = null, bgK = '', spr = {};
    function drawBg() {
      const { s, m, ox, oy } = geo(); const [o, x] = mkC(c.W, c.H); bgC = o; spr = {};
      let sd = 23; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      const fx = ox - m, fy = oy - m, fw = 8 * s + 2 * m, rad = m * 0.45;
      x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 22; x.shadowOffsetY = 8; let gr = x.createLinearGradient(fx, fy, fx + fw, fy + fw); gr.addColorStop(0, '#8A2E1C'); gr.addColorStop(0.5, '#5E1E10'); gr.addColorStop(1, '#3E1208'); x.fillStyle = gr; rr(x, fx, fy, fw, fw, rad); x.fill(); x.restore();
      x.save(); rr(x, fx, fy, fw, fw, rad); x.clip(); x.globalAlpha = 0.15; x.strokeStyle = '#1A0603';
      for (let i = 0; i < 46; i++) { x.lineWidth = 0.4 + R() * 1.2; const yy = fy + R() * fw; x.beginPath(); x.moveTo(fx, yy); x.bezierCurveTo(fx + fw * 0.3, yy + (R() - 0.5) * 10, fx + fw * 0.7, yy + (R() - 0.5) * 10, fx + fw, yy + (R() - 0.5) * 8); x.stroke(); }
      x.restore(); x.strokeStyle = 'rgba(255,200,160,.28)'; x.lineWidth = 1.5; rr(x, fx + 1, fy + 1, fw - 2, fw - 2, rad); x.stroke();
      for (let sq = 0; sq < 64; sq++) {
        const xx = ox + (sq & 7) * s, yy = oy + (sq >> 3) * s, dk = ((sq >> 3) + (sq & 7)) % 2;
        gr = x.createLinearGradient(xx, yy, xx + s, yy + s); gr.addColorStop(0, dk ? '#7A4520' : '#F6E3C2'); gr.addColorStop(1, dk ? '#5A3015' : '#E9CC9C'); x.fillStyle = gr; x.fillRect(xx, yy, s + 0.5, s + 0.5);
        x.globalAlpha = dk ? 0.22 : 0.13; x.strokeStyle = dk ? '#2B1405' : '#A87A48'; x.lineWidth = 0.7;
        for (let k = 0; k < 5; k++) { const y2 = yy + R() * s; x.beginPath(); x.moveTo(xx, y2); x.quadraticCurveTo(xx + s / 2, y2 + (R() - 0.5) * s * 0.3, xx + s, y2 + (R() - 0.5) * s * 0.2); x.stroke(); }
        x.globalAlpha = 1;
      }
      x.strokeStyle = 'rgba(20,8,2,.65)'; x.lineWidth = 2; x.strokeRect(ox - 1, oy - 1, 8 * s + 2, 8 * s + 2);
      x.font = `700 ${Math.round(m * 0.52)}px ${FONT}`; x.fillStyle = 'rgba(255,222,190,.9)'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let i = 0; i < 8; i++) { const f = 'abcdefgh'[flip ? 7 - i : i], rk = String(flip ? i + 1 : 8 - i); x.fillText(f, ox + i * s + s / 2, oy + 8 * s + m / 2); x.fillText(f, ox + i * s + s / 2, oy - m / 2); x.fillText(rk, ox - m / 2, oy + i * s + s / 2); x.fillText(rk, ox + 8 * s + m / 2, oy + i * s + s / 2); }
    }
    function sprite(dark, king, s) { // 3D shashka toshi (yon devor, ariqchalar, yaltirash, damka toji)
      const k = (dark ? 'd' : 'w') + (king ? 'k' : '') + Math.round(s); if (spr[k]) return spr[k];
      const [o, x] = mkC(s, s); x.scale(s / 100, s / 100); const cx = 50, cy = 46, R0 = 38;
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(52, 58, 40, 36, 0, 0, 7); x.fill();
      x.fillStyle = dark ? '#0C0A09' : '#A8A29E'; x.beginPath(); x.arc(cx, cy + 7, R0, 0, 7); x.fill();
      let gr = x.createRadialGradient(cx - 12, cy - 14, 3, cx, cy, R0); if (dark) { gr.addColorStop(0, '#6B635D'); gr.addColorStop(0.55, '#2B2522'); gr.addColorStop(1, '#141110'); } else { gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.6, '#F1ECE4'); gr.addColorStop(1, '#CFC7BA'); }
      x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, R0, 0, 7); x.fill();
      x.lineWidth = 2.5; x.strokeStyle = dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.16)'; for (const r of [29, 21]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); }
      x.strokeStyle = dark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.8)'; x.lineWidth = 1.5; for (const r of [28, 20]) { x.beginPath(); x.arc(cx + 0.8, cy + 1.2, r, 0.2, 2.6); x.stroke(); }
      gr = x.createRadialGradient(cx - 14, cy - 18, 1, cx - 14, cy - 18, 26); gr.addColorStop(0, dark ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, R0, 0, 7); x.fill();
      if (king) {
        x.save(); x.translate(cx, cy + 1); x.beginPath(); x.moveTo(-17, 9); [[-20, -9], [-9, 0], [0, -15], [9, 0], [20, -9], [17, 9]].forEach(([a, b2]) => x.lineTo(a, b2)); x.closePath();
        gr = x.createLinearGradient(0, -15, 0, 10); gr.addColorStop(0, '#FEF08A'); gr.addColorStop(0.5, '#F59E0B'); gr.addColorStop(1, '#B45309'); x.fillStyle = gr; x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 3; x.shadowOffsetY = 1.5; x.fill(); x.shadowColor = 'transparent';
        x.strokeStyle = '#78350F'; x.lineWidth = 1.5; x.lineJoin = 'round'; x.stroke(); x.fillStyle = '#FEF3C7'; for (const [a, b2] of [[-20, -9], [0, -15], [20, -9]]) { x.beginPath(); x.arc(a, b2, 2.6, 0, 7); x.fill(); } x.restore();
      }
      return (spr[k] = o);
    }
    const stop = loop((dt) => {
      clock += dt; const { s, ox, oy } = geo(); const key = c.W + 'x' + c.H; if (key !== bgK) { bgK = key; drawBg(); }
      const xy = (sq) => { let x = sq & 7, y = sq >> 3; if (flip) { x = 7 - x; y = 7 - y; } return [ox + x * s, oy + y * s]; };
      g.clearRect(0, 0, c.W, c.H); g.save();
      if (shake > 0) { shake = Math.max(0, shake - dt * 14); g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); }
      g.drawImage(bgC, 0, 0, c.W, c.H);
      if (last) { last.forEach((sq) => { const [x, y] = xy(sq); g.fillStyle = 'rgba(255,214,64,.32)'; g.fillRect(x, y, s, s); }); if (last.length > 1) { g.strokeStyle = 'rgba(255,214,64,.55)'; g.lineWidth = s * 0.06; g.lineCap = 'round'; g.setLineDash([s * 0.12, s * 0.12]); g.beginPath(); last.forEach((sq, i) => { const [x, y] = xy(sq); g[i ? 'lineTo' : 'moveTo'](x + s / 2, y + s / 2); }); g.stroke(); g.setLineDash([]); } }
      if (!done && turn === ctx.me && !path.length && moves[0]?.t.length) { const pu = 0.6 + 0.4 * Math.sin(clock * 6); new Set(moves.map((m) => m.p[0])).forEach((sq) => { const [x, y] = xy(sq); g.strokeStyle = `rgba(249,115,22,${pu})`; g.lineWidth = 3; g.strokeRect(x + 2, y + 2, s - 4, s - 4); }); }
      path.forEach((sq) => { const [x, y] = xy(sq); g.fillStyle = 'rgba(74,222,128,.42)'; g.fillRect(x, y, s, s); });
      if (path.length) { const nx = new Set(prefix(path).map((m) => m.p[path.length]).filter((v) => v !== undefined)); nx.forEach((sq) => { const [x, y] = xy(sq); g.fillStyle = 'rgba(34,197,94,.8)'; g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.16, 0, 7); g.fill(); }); }
      const az = anim ? anim.p[anim.p.length - 1] : -1;
      for (let sq = 0; sq < 64; sq++) { const q = b[sq]; if (!q || sq === az) continue; const [x, y] = xy(sq); g.drawImage(sprite(q.s === 1, q.k, s), x, y, s, s); }
      if (anim) {
        anim.t += dt * 4.5; const n = anim.p.length - 1, seg = Math.min(n - 1, Math.floor(anim.t)), fr = Math.min(1, anim.t - seg), e = fr < 0.5 ? 2 * fr * fr : 1 - Math.pow(-2 * fr + 2, 2) / 2;
        anim.caps.forEach((cp, k) => { if (!cp.gone && (k < seg || (k === seg && fr >= 1) || anim.t >= n)) { cp.gone = 1; burst(cp.i, cp.q.s === 1); shake = 4; snd(200 + k * 60, 0.09, 0.05, 'square'); } if (cp.f < 1) { if (cp.gone) cp.f += dt * 4; const [x, y] = xy(cp.i), zz = 1 + cp.f * 0.3; g.globalAlpha = Math.max(0, 1 - cp.f); g.drawImage(sprite(cp.q.s === 1, cp.q.k, s), x + s / 2 - (s * zz) / 2, y + s / 2 - (s * zz) / 2, s * zz, s * zz); g.globalAlpha = 1; } });
        const [x0, y0] = xy(anim.p[seg]), [x1, y1] = xy(anim.p[seg + 1]), lift = (anim.caps.length ? 0.22 : 0.08) * s * Math.sin(Math.PI * fr), sz = s + lift * 0.6;
        g.drawImage(sprite(anim.pc.s === 1, anim.pc.k, s), x0 + (x1 - x0) * e - (sz - s) / 2, y0 + (y1 - y0) * e - lift - (sz - s) / 2, sz, sz);
        if (anim.t >= n && anim.caps.every((cp) => cp.gone && cp.f >= 1)) anim = null;
      }
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.l -= dt; if (q.l <= 0) { parts.splice(i, 1); continue; } q.vy += s * 9 * dt; q.x += q.vx * dt; q.y += q.vy * dt; g.globalAlpha = Math.min(1, q.l * 2); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.restore();
    });
    ctx.turn(0);
    return { ...api, stop, resize: () => { cv.fit(); bgK = ''; } };
  };



  /* ================= v20: yangi 2 kishilik o'yinlar — jonli (futbol 4×4, Strike duel, xokkey) va navbatli (Reversi, Nuqtalar) ================= */
  MPL.push(
    { id: 'fb4', bot: 1, e: '⚽', c: ['#16A34A', '#1D4ED8'], rt: 1, big: 1, n: { uz: 'Futbol 4×4 (jonli)', ru: 'Футбол 4×4 (онлайн)', en: 'Football 4v4 (live)' } },
    { id: 'duel', bot: 1, e: '🔫', c: ['#475569', '#B45309'], rt: 1, n: { uz: 'Counter duel (jonli)', ru: 'Counter дуэль', en: 'Counter duel' } },
    { id: 'hockey', bot: 1, e: '🏒', c: ['#0EA5E9', '#E11D48'], rt: 1, n: { uz: 'Havo xokkeyi', ru: 'Аэрохоккей', en: 'Air hockey' } },
    { id: 'reversi', bot: 1, e: '⚫', c: ['#15803D', '#14532D'], n: { uz: 'Reversi', ru: 'Реверси', en: 'Reversi' } },
  );
  const RT_T = {
    uz: { wait_rt: 'Raqib ulanmoqda…', go: 'Boshladik!', lost: 'Raqib bilan aloqa uzildi…', kills: 'Frag', first: '{n} ga birinchi yetgan yutadi', you: 'Siz', opp: 'Raqib', goal: '⚽ GOOOL!', respawn: 'Qayta tug‘ilish…', hit: 'Tegdi!', killed: 'Yo‘q qilindi!', pass: 'Navbat o‘tkazildi — yurish yo‘q' },
    ru: { wait_rt: 'Подключаем соперника…', go: 'Поехали!', lost: 'Связь с соперником потеряна…', kills: 'Фраги', first: 'Побеждает первый до {n}', you: 'Вы', opp: 'Соперник', goal: '⚽ ГОООЛ!', respawn: 'Возрождение…', hit: 'Попал!', killed: 'Убит!', pass: 'Пропуск хода — нет ходов' },
    en: { wait_rt: 'Connecting opponent…', go: 'Go!', lost: 'Connection to opponent lost…', kills: 'Frags', first: 'First to {n} wins', you: 'You', opp: 'Opponent', goal: '⚽ GOAL!', respawn: 'Respawning…', hit: 'Hit!', killed: 'Eliminated!', pass: 'Turn passed — no moves' },
  };
  const rt = (k) => (RT_T[L()] || PK('rt') || RT_T.en)[k] || RT_T.en[k] || RT_T.uz[k];
  // umumiy: jonli aloqa — raqibdan ma'lumot kelmay qolsa ogohlantirish
  function rtLink(ctx, onMsg) {
    if (ctx.local) { const st = { last: 0, alive: true }; return { st, recv(d, s) { onMsg(d, s); }, lost: () => false }; }
    const st = { last: 0, alive: false };
    return {
      st, recv(d, s) { st.last = performance.now(); st.alive = true; onMsg(d, s); },
      lost() { return st.alive && performance.now() - st.last > 4000; },
    };
  }

  // ---- Futbol 4×4 (jonli, 2 kishi): uy egasi (0) fizikani hisoblaydi, mehmon (1) boshqaruvini yuboradi ----
  MPI.fb4 = (stage, ctx) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, 0.62);
    const pad = padUI(stage, [{ id: 'shoot', t: '⚽', cls: 'big' }, { id: 'pass', t: '↗️' }]);
    const FW = 68, FH = 105, GW = 18, MATCH = 180, HOST = ctx.me === 0, SPEC = ctx.me < 0, NP = ctx.n || 2, MT = ctx.me < 0 ? 0 : ctx.me % 2;
    const form = [[0, 0.95], [-0.5, 0.75], [0.5, 0.75], [0, 0.58]];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    let pl = [], ball, sc = [0, 0], time = 0, owner = null, ctrl = [null, null], ctrl2 = [null, null], kick = 0, msg = '', msgT = 0, over = false, started = false, cd = 3, endW = null;
    // jamoa = o'rin % 2; har o'rinning kiritishi alohida
    const gin = Array.from({ length: NP }, () => ({ x: 0, y: 0, sh: 0, ps: 0 })), seen = gin.map(() => ({ sh: 0, ps: 0 })); const mine = { sh: 0, ps: 0 };
    const hum = (t) => { const a = []; for (let s = t; s < NP; s += 2) if (!ctx.out?.has(s) && !ctx.isBot?.(s)) a.push(s); return a; }; // botlar odam hisoblanmaydi — ularni jamoa AI boshqaradi
    const BT = [0, 1].map((t) => { for (let s = t; s < NP; s += 2) if (ctx.isBot?.(s)) return true; return false; }), alive = (t) => { for (let s = t; s < NP; s += 2) if (!ctx.out?.has(s)) return true; return false; };
    const PT = []; let shake = 0, flashT = 0; const burst = (x, y, n, sp, cols) => { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = sp * (0.3 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.6 + Math.random() * 0.6, col: cols[i % cols.length] }); } if (PT.length > 160) PT.splice(0, PT.length - 160); };
    const goalFx = (x, y) => { shake = 0.45; flashT = 0.5; burst(x, y, 34, 26, ['#FDE047', '#FFFFFF', '#22D3EE', '#F472B6', '#4ADE80']); };
    let HU = [hum(0), hum(1)];
    const who = (p) => (p === ctrl[p.team] ? HU[p.team][0] ?? -1 : p === ctrl2[p.team] ? HU[p.team][1] ?? -1 : -1);
    let snap = null, prev = null, snapT = 0;
    const mk = (team, i) => { const [fx, fy] = form[i]; const y = team ? 1 - fy : fy; return { team, i, gk: i === 0, hx: FW / 2 + fx * FW * 0.5, hy: y * FH, x: 0, y: 0, vx: 0, vy: 0, cd: 0, dir: team ? Math.PI / 2 : -Math.PI / 2 }; };
    const kickoff = (to) => {
      pl.forEach((p) => { p.x = p.hx; p.y = p.hy; p.vx = p.vy = 0; p.cd = 0; });
      ball = { x: FW / 2, y: FH / 2, vx: 0, vy: 0, z: 0, vz: 0 }; owner = null; kick = 1;
      const s = pl.find((p) => p.team === to && p.i === 3); s.x = FW / 2; s.y = FH / 2 + (to ? -1.6 : 1.6);
    };
    pl = [0, 1, 2, 3].map((i) => mk(0, i)).concat([0, 1, 2, 3].map((i) => mk(1, i))); kickoff(0); ctrl = [pl[3], pl[7]]; ctrl2 = [pl[2], pl[6]];
    const goalY = (team) => (team ? FH + 1 : -1);
    function strike(p, tx, ty, power, lob) { const dx = tx - ball.x, dy = ty - ball.y, d = Math.hypot(dx, dy) || 1; ball.vx = (dx / d) * power; ball.vy = (dy / d) * power; ball.vz = lob ? 9 : 2.5; owner = null; p.cd = 0.35; snd(240, 0.06, 0.07, 'triangle'); }
    const shootAt = (p, aim) => strike(p, FW / 2 + aim, goalY(p.team), 47, false);
    const bestMate = (p) => { let b = null, bs = -1e9; for (const m of pl) { if (m === p || m.team !== p.team || m.gk) continue; const fwd = p.team ? m.y - p.y : p.y - m.y; const press = Math.min(...pl.filter((o) => o.team !== p.team).map((o) => dist(o, m))); const s = fwd * 0.6 + press * 1.2 - Math.abs(dist(p, m) - 22) * 0.3; if (s > bs) { bs = s; b = m; } } return b; };
    const passTo = (p, m) => strike(p, m.x + m.vx * 0.25, m.y + m.vy * 0.25, Math.min(40, 18 + dist(p, m) * 0.9), dist(p, m) > 30);
    const finish = (w) => { if (over) return; over = true; endW = w; ctx.rt?.send({ t: 'end', w, sc }); setTimeout(() => ctx.over(w), 600); };
    // ---- uy egasi: simulyatsiya ----
    function sim(dt) {
      time += dt; kick = Math.max(0, kick - dt); HU = [hum(0), hum(1)];
      if (time >= MATCH && !over) finish(sc[0] === sc[1] ? ctx.DRAW : sc[0] > sc[1] ? 0 : 1);
      if (NP > 2 && !over) for (const t of [0, 1]) if (!alive(t)) finish(1 - t); // jamoada hech kim qolmasa — raqib yutadi
      const inputs = gin.map((q, s) => (s === 0 ? { x: pad.x, y: pad.y, sh: mine.sh, ps: mine.ps } : s % 2 ? { x: -q.x, y: -q.y, sh: q.sh, ps: q.ps } : { ...q })); // 1-jamoa ekrani 180° burilgan
      const kd = keysDown; if (kd.has('arrowleft') || kd.has('a')) inputs[0].x = -1; if (kd.has('arrowright') || kd.has('d')) inputs[0].x = 1; if (kd.has('arrowup') || kd.has('w')) inputs[0].y = -1; if (kd.has('arrowdown') || kd.has('s')) inputs[0].y = 1;
      const press = inputs.map((q, s) => { const r = [q.sh > seen[s].sh, q.ps > seen[s].ps]; seen[s].sh = q.sh; seen[s].ps = q.ps; return r; });
      for (const t of [0, 1]) {
        const two = HU[t].length > 1 || (HU[t].length > 0 && BT[t]), fld = pl.filter((p) => p.team === t && !p.gk);
        const pick = (cur, ex) => { const cs = fld.filter((p) => p !== ex).sort((a, b) => dist(a, ball) - dist(b, ball))[0]; return !cur || cur === ex || (cs !== cur && dist(cs, ball) + 2 < dist(cur, ball)) ? cs : cur; };
        if (owner && owner.team === t && !owner.gk && owner !== ctrl2[t]) ctrl[t] = owner; else ctrl[t] = pick(ctrl[t], two ? ctrl2[t] : null);
        if (two) { if (!owner || owner !== ctrl2[t]) ctrl2[t] = pick(ctrl2[t], ctrl[t]); } else ctrl2[t] = null;
      }
      for (const p of pl) {
        p.cd = Math.max(0, p.cd - dt);
        let tx = p.hx, ty = p.hy, spd = 15; const hs = who(p);
        if (hs >= 0) { const inp = inputs[hs]; p.vx += (inp.x * 20 - p.vx) * Math.min(1, dt * 10); p.vy += (inp.y * 20 - p.vy) * Math.min(1, dt * 10); }
        else {
          const chase = BT[p.team] && !p.gk && (p === ctrl2[p.team] || (!HU[p.team].length && p === ctrl[p.team])); // bot: to'pga eng yaqin futbolchi to'pni quvadi
          if (p === owner && !p.gk) { tx = FW / 2; ty = p.team ? FH : 0; spd = 14; if (BT[p.team]) { let nb = null, nd = 1e9; for (const o of pl) if (o.team !== p.team && !o.gk) { const d = dist(o, p); if (d < nd) { nd = d; nb = o; } } spd = 14; if (nb && nd < 9 && (p.team ? nb.y > p.y : nb.y < p.y)) tx = Math.max(6, Math.min(FW - 6, p.x + Math.sign(p.x - nb.x || 1) * 10)); } } // to'p bilan darvozaga (bot himoyachini aylanib o'tadi)
          else if (chase && (!owner || owner.team !== p.team)) { const o = owner || ball; tx = o.x + (owner ? 0 : ball.vx * 0.25); ty = o.y + (owner ? (p.team ? 1.2 : -1.2) : ball.vy * 0.25); spd = 15; }
          else if (p.gk) { tx = FW / 2 + Math.max(-GW / 2, Math.min(GW / 2, (ball.x - FW / 2) * 0.6)); ty = p.team ? 3 : FH - 3; spd = 13; if (dist(p, ball) < 14 && (p.team ? ball.y < 16 : ball.y > FH - 16)) { tx = ball.x; ty = ball.y; } }
          else { const att = owner ? owner.team === p.team : false; tx = p.hx + (ball.x - FW / 2) * 0.35; ty = p.hy + (ball.y / FH - 0.5) * FH * 0.55 + (att ? (p.team ? 10 : -10) : 0); }
          const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
          const vx = d > 0.6 ? (dx / d) * Math.min(spd, d * 4) : 0, vy = d > 0.6 ? (dy / d) * Math.min(spd, d * 4) : 0;
          p.vx += (vx - p.vx) * Math.min(1, dt * 6); p.vy += (vy - p.vy) * Math.min(1, dt * 6);
        }
        p.x = Math.max(1, Math.min(FW - 1, p.x + p.vx * dt)); p.y = Math.max(-1, Math.min(FH + 1, p.y + p.vy * dt));
        if (Math.hypot(p.vx, p.vy) > 2) p.dir = Math.atan2(p.vy, p.vx);
      }
      for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) { const a = pl[i], b = pl[j], d = dist(a, b); if (d < 2.4 && d > 0) { const f = (2.4 - d) / 2; a.x -= ((b.x - a.x) / d) * f; a.y -= ((b.y - a.y) / d) * f; b.x += ((b.x - a.x) / d) * f; b.y += ((b.y - a.y) / d) * f; } }
      if (owner) {
        const a = owner.dir; ball.x = owner.x + Math.cos(a) * 1.6; ball.y = owner.y + Math.sin(a) * 1.6; ball.vx = owner.vx; ball.vy = owner.vy; ball.z = 0;
        const t = owner.team, hs = who(owner), sh = hs >= 0 && press[hs][0], ps = hs >= 0 && press[hs][1];
        if (owner.gk) { if (owner.cd <= 0.05) { const m = bestMate(owner); if (m) passTo(owner, m); } }
        else if (hs < 0) { owner.hold = (owner.hold || 0) + dt; if (BT[t] && Math.abs(owner.y - (t ? FH : 0)) < 17 + Math.random() * 6) { const gk = pl.find((o) => o.gk && o.team !== t); strike(owner, FW / 2 + (gk && gk.x < FW / 2 ? 1 : -1) * GW * (0.12 + Math.random() * 0.45), goalY(t), 33 + Math.random() * 6, false); } // bot: darvozabondan uzoq burchakka
        else if (BT[t]) { const nd = Math.min(...pl.filter((o) => o.team !== t).map((o) => dist(o, owner))), m = bestMate(owner); if (m && ((nd < 3.5 && owner.hold > 0.5) || owner.hold > 3.5) && (t ? m.y > owner.y - 4 : m.y < owner.y + 4)) passTo(owner, m); } // bot: bosim bo'lsa yoki uzoq ushlasa — oldindagi sherigiga pas
        else if (Math.abs(owner.y - (t ? FH : 0)) < 24) shootAt(owner, (Math.random() - 0.5) * GW * 0.6); else if (owner.hold > 1.2) { const m = bestMate(owner); if (m) passTo(owner, m); } }
        else if (sh) shootAt(owner, inputs[hs].x * GW * 0.45);
        else if (ps) { const m = bestMate(owner); if (m) passTo(owner, m); }
        for (const p of pl) if (owner && p.team !== owner.team && p.cd <= 0 && dist(p, ball) < 1.9 && Math.random() < dt * (who(p) >= 0 ? 7 : BT[p.team] && (p === ctrl[p.team] || p === ctrl2[p.team]) ? 3.5 : 2.5)) { owner.cd = 0.6; owner = p; p.cd = 0.3; p.hold = 0; snd(500, 0.04, 0.04); break; }
      } else {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vz -= 30 * dt; ball.z = Math.max(0, ball.z + ball.vz * dt); if (ball.z === 0) ball.vz = Math.abs(ball.vz) > 4 ? -ball.vz * 0.4 : 0;
        const fr = ball.z > 0 ? 0.995 : Math.pow(0.35, dt); ball.vx *= fr; ball.vy *= fr;
        if (ball.x < 0.5 || ball.x > FW - 0.5) { ball.vx = -ball.vx * 0.7; ball.x = Math.max(0.5, Math.min(FW - 0.5, ball.x)); }
        if (ball.y < 0 || ball.y > FH) {
          if (Math.abs(ball.x - FW / 2) < GW / 2 && ball.z < 3) { const tm = ball.y < 0 ? 0 : 1; sc[tm]++; msg = rt('goal'); msgT = 1.8; snd(1046, 0.4, 0.09); goalFx(ball.x, ball.y < 0 ? 0 : FH); kickoff(1 - tm); }
          else { ball.vy = -ball.vy * 0.6; ball.y = Math.max(0.5, Math.min(FH - 0.5, ball.y)); }
        }
        if (kick <= 0 && ball.z < 1.6) for (const p of pl) { if (p.cd > 0) continue; const d = dist(p, ball), sp = Math.hypot(ball.vx, ball.vy); if (d < (p.gk ? 2.8 : 1.8) && (sp < 34 || (p.gk && Math.random() < 0.6) || Math.random() < 0.3)) { owner = p; p.hold = 0; if (p.gk) { ball.vx = ball.vy = 0; p.cd = 0.5; } break; } }
      }
    }
    // u: har o'rin qaysi futbolchini boshqaradi (n>2)
    const useats = () => Array.from({ length: NP }, (_, s) => { const k = HU[s % 2].indexOf(s); return k === 0 ? pl.indexOf(ctrl[s % 2]) : k === 1 ? pl.indexOf(ctrl2[s % 2]) : -1; });
    const pack = () => ({ t: 's', p: pl.map((p) => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.dir * 100) / 100]), b: [Math.round(ball.x * 10) / 10, Math.round(ball.y * 10) / 10, Math.round(ball.z * 10) / 10], sc, tm: Math.round(time), c: [pl.indexOf(ctrl[0]), pl.indexOf(ctrl[1])], m: msgT > 0 ? msg : '', cd: Math.max(0, Math.ceil(cd)), ...(NP > 2 ? { u: useats() } : {}) });
    const link = rtLink(ctx, (d, s) => {
      if (HOST) { if (d.t === 'i' && s > 0 && s < NP) { const q = gin[s]; q.x = +d.x || 0; q.y = +d.y || 0; q.sh = d.sh | 0; q.ps = d.ps | 0; } return; }
      if (d.t === 's') { prev = snap; snap = d; snapT = performance.now(); if (d.m && d.m !== msg) { msg = d.m; msgT = 1.8; snd(1046, 0.3, 0.07); } if (d.sc[0] + d.sc[1] > sc[0] + sc[1]) goalFx(FW / 2, d.sc[1] > sc[1] ? FH : 0); sc = d.sc; time = d.tm; }
      if (d.t === 'end' && !over) { over = true; endW = d.w; sc = d.sc || sc; setTimeout(() => ctx.over(d.w), 600); }
    });
    ctx.turn(-1, rt('wait_rt'));
    let sendT = 0, hiT = 0;
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      if (pad.take('shoot') || keysDown.has(' ')) mine.sh++; if (pad.take('pass') || keysDown.has('x')) mine.ps++;
      sendT += dt; hiT += dt;
      if (HOST) {
        if (!started && link.st.alive) { started = true; ctx.turn(-1, '⚽ ' + gname(mpMeta('fb4'))); }
        if (started) { if (cd > 0) cd -= dt; else if (!over) sim(dt); }
        if (sendT > 0.066) { sendT = 0; ctx.rt?.send(over && endW != null ? { t: 'end', w: endW, sc } : pack()); } // tugagach 'end' qayta yuboriladi (paket yo'qolsa ham)
      } else if (!SPEC) {
        let x = pad.x, y = pad.y; const kd = keysDown; if (kd.has('arrowleft') || kd.has('a')) x = -1; if (kd.has('arrowright') || kd.has('d')) x = 1; if (kd.has('arrowup') || kd.has('w')) y = -1; if (kd.has('arrowdown') || kd.has('s')) y = 1;
        if (sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, sh: mine.sh, ps: mine.ps }); }
        if (snap && !started) { started = true; ctx.turn(-1, gname(mpMeta('fb4'))); }
      }
      // ko'rinish: har kim o'z jamoasini pastda ko'radi (1-jamoa uchun maydon 180° buriladi)
      const flip = MT === 1;
      let P, B, C2, CD, U;
      if (HOST) { P = pl.map((p) => [p.x, p.y, p.dir]); B = [ball.x, ball.y, ball.z]; C2 = [pl.indexOf(ctrl[0]), pl.indexOf(ctrl[1])]; CD = Math.ceil(cd); if (NP > 2) U = useats(); }
      else if (snap) {
        const k = prev ? Math.min(1, (performance.now() - snapT) / 66) : 1, lerp = (a, b) => (prev ? a + (b - a) * k : b);
        P = snap.p.map((q, i) => [lerp(prev?.p[i][0] ?? q[0], q[0]), lerp(prev?.p[i][1] ?? q[1], q[1]), q[2]]);
        B = [lerp(prev?.b[0] ?? snap.b[0], snap.b[0]), lerp(prev?.b[1] ?? snap.b[1], snap.b[1]), snap.b[2]]; C2 = snap.c; CD = snap.cd; U = snap.u;
      }
      const k = W / (FW + 8), ox = 4 * k, oy = (H - FH * k) / 2;
      const X = (x) => ox + (flip ? FW - x : x) * k, Y = (y) => oy + (flip ? FH - y : y) * k;
      const sb = g.createLinearGradient(0, 0, 0, H); sb.addColorStop(0, '#0F172A'); sb.addColorStop(0.5, '#14532D'); sb.addColorStop(1, '#0F172A'); g.fillStyle = sb; g.fillRect(0, 0, W, H);
      g.save(); if (shake > 0) { shake = Math.max(0, shake - dt); const q = shake * 18; g.translate((Math.random() - 0.5) * q, (Math.random() - 0.5) * q); }
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 18; g.fillStyle = '#15803D'; g.fillRect(ox - 2 * k, oy - 2 * k, (FW + 4) * k, (FH + 4) * k); g.shadowColor = 'transparent'; g.shadowBlur = 0;
      for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#16A34A' : '#15803D'; g.fillRect(ox, oy + (FH / 10) * i * k, FW * k, (FH / 10) * k + 1); }
      const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(255,255,255,.06)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = vg; g.fillRect(ox, oy, FW * k, FH * k);
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.strokeRect(ox, oy, FW * k, FH * k);
      g.beginPath(); g.moveTo(ox, oy + (FH / 2) * k); g.lineTo(ox + FW * k, oy + (FH / 2) * k); g.stroke(); g.beginPath(); g.arc(ox + (FW / 2) * k, oy + (FH / 2) * k, 9 * k, 0, 7); g.stroke();
      for (const t of [0, 1]) { const y0 = t ? oy + (FH - 16) * k : oy; g.strokeRect(ox + (FW / 2 - 20) * k, y0, 40 * k, 16 * k); const gx0 = ox + (FW / 2 - GW / 2) * k, gy0 = t ? oy + FH * k : oy - 3 * k; g.fillStyle = 'rgba(15,23,42,.55)'; g.fillRect(gx0, gy0, GW * k, 3 * k); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (let xx = gx0; xx <= gx0 + GW * k; xx += k * 1.5) { g.beginPath(); g.moveTo(xx, gy0); g.lineTo(xx, gy0 + 3 * k); g.stroke(); } g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(gx0, gy0, GW * k, 3 * k); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.85)'; }
      if (P) {
        P.forEach((q, i) => {
          const team = i < 4 ? 0 : 1, gk = i % 4 === 0, x = X(q[0]), y = Y(q[1]), r = 1.55 * k, myTeam = team === MT;
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 2, y + 3, r, r * 0.6, 0, 0, 7); g.fill();
          if (NP > 2 && U) { const ss = U.indexOf(i); if (ss >= 0) { g.strokeStyle = ss === ctx.me ? '#FDE047' : ctx.col?.[ss] || '#fff'; g.lineWidth = ss === ctx.me ? 3.5 : 2.5; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.stroke(); text(g, (ctx.names?.[ss] || '').slice(0, 8), x, y - r - 11, 10, ss === ctx.me ? '#FDE047' : '#fff'); } }
          else if (C2 && C2[team] === i) { g.strokeStyle = myTeam ? '#FDE047' : '#FCA5A5'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.stroke(); }
          g.fillStyle = gk ? (team ? '#F59E0B' : '#22D3EE') : team ? '#DC2626' : '#2563EB'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
          const dd = (flip ? Math.PI : 0) + q[2]; g.fillStyle = '#FCD9B6'; g.beginPath(); g.arc(x + Math.cos(dd) * r * 0.25, y + Math.sin(dd) * r * 0.25, r * 0.5, 0, 7); g.fill();
        });
        const bx = X(B[0]), by = Y(B[1]) - B[2] * k * 0.6, br = 0.9 * k * (1 + B[2] * 0.05);
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(X(B[0]) + 1, Y(B[1]) + 2, br, br * 0.6, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(bx, by, br * 0.4, 0, 7); g.fill();
      }
      for (let i = PT.length - 1; i >= 0; i--) { const q = PT[i]; q.t -= dt; if (q.t <= 0) { PT.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.95; q.vy *= 0.95; g.globalAlpha = Math.min(1, q.t * 2); g.fillStyle = q.col; g.fillRect(X(q.x) - 2.5, Y(q.y) - 2.5, 5, 5); } g.globalAlpha = 1;
      g.restore(); if (flashT > 0) { flashT -= dt; g.fillStyle = `rgba(255,255,255,${flashT * 0.4})`; g.fillRect(0, 0, W, H); }
      const myS = sc[MT], opS = sc[1 - MT];
      g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, W / 2 - 92, 6, 184, 30, 15); g.fill();
      text(g, `${MT === 1 ? '🔴' : '🔵'} ${myS} : ${opS} ${MT === 1 ? '🔵' : '🔴'}`, W / 2 - 22, 21, 15); text(g, `${Math.min(90, Math.floor((time / MATCH) * 90))}'`, W / 2 + 62, 21, 13, '#FDE047');
      if (NP > 2) [MT, 1 - MT].forEach((t, j) => { let n = 0; for (let s = t; s < NP; s += 2) { const dx = W / 2 - 22 + (j ? 1 : -1) * (14 + n++ * 12); g.globalAlpha = ctx.out?.has(s) ? 0.3 : 1; g.fillStyle = ctx.col?.[s] || '#fff'; g.beginPath(); g.arc(dx, 43, 4.5, 0, 7); g.fill(); if (s === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.stroke(); } g.globalAlpha = 1; } });
      if (!started) text(g, rt('wait_rt'), W / 2, H / 2, 18);
      else if (CD > 0) text(g, String(CD), W / 2, H / 2, 64, '#FDE047');
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, H / 2 - 40, 34); }
      if (NP > 2 && over && endW != null) text(g, endW === ctx.DRAW ? '🤝' : `${endW ? '🔴🔴' : '🔵🔵'} 🏆`, W / 2, H / 2 + 20, 30);
      if (link.lost() && !over) text(g, rt('lost'), W / 2, H * 0.7, 15, '#FCA5A5');
    });
    return { apply: () => false, rt: (s, d) => link.recv(d, s), quit: () => { HU = [hum(0), hum(1)]; }, stop, resize: fit };
  };


  // ---- Strike duel (jonli 1×1, raycasting 3D): har kim o'z harakatini hisoblaydi, tegish raqibga yuboriladi ----
  MPI.duel = (stage, ctx) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, null);
    const MAP = ['################', '#......#.......#', '#.##...#..###..#', '#.#.......#....#', '#.#..##...#.##.#', '#....#.........#', '###..#..####...#', '#.......#......#', '#..##...#..##..#', '#...#......#...#', '#...#..##..#...#', '#.......##.....#', '#.###......###.#', '#...#..#.......#', '#......#...#...#', '################'];
    const N = 16, wall = (x, y) => x < 0 || y < 0 || x >= N || y >= N || MAP[y | 0][x | 0] === '#';
    const pad = padUI(stage, [{ id: 'fire', t: '🔫', cls: 'big' }, { id: 'reload', t: '🔄' }]);
    // n>2: hamma hammaga qarshi (FFA) — har kim o'z holatini hammaga yuboradi, tegish nishonga yuboriladi
    const NP = Math.max(2, ctx.n | 0), FFA = NP > 2, COL = ctx.col || ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B'];
    const WIN = 5, SPAWN = [[1.5, 1.5, 0.8], [14.5, 14.5, 3.9], [14.5, 1.5, 2.4], [1.5, 14.5, -0.86]];
    const me = Math.max(0, ctx.me);
    let P = { x: SPAWN[me][0], y: SPAWN[me][1], a: SPAWN[me][2], hp: 100, dead: 0 }, O = null, Oprev = null, OT = 0;
    const OS = {}, gone = new Set(); // FFA: boshqa o'yinchilar {cur, prev, T, fl, f}
    let frags = Array(NP).fill(0), ammo = 20, reloadT = 0, fireT = 0, flash = 0, hurt = 0, hitMk = 0, oFlash = 0, oFire = 0, fireN = 0, msg = '', msgT = 0, over = false, look = null, lookX = 0, started = false;
    c.addEventListener('pointerdown', (e) => { look = e.pointerId; lookX = e.clientX; });
    c.addEventListener('pointermove', (e) => { if (look === e.pointerId) { P.a += (e.clientX - lookX) * 0.0065; lookX = e.clientX; } });
    const lu = (e) => { if (look === e.pointerId) look = null; }; c.addEventListener('pointerup', lu); c.addEventListener('pointercancel', lu);
    const los = (x0, y0, x1, y1) => { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 6); for (let i = 1; i < n; i++) if (wall(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n)) return false; return true; };
    const foes = () => (FFA ? Object.keys(OS).map(Number).filter((s) => !gone.has(s) && OS[s].cur && !OS[s].cur.dead).map((s) => ({ s, ...OS[s].cur })) : O && !O.dead ? [{ s: 1 - me, ...O }] : []);
    const respawn = () => { const fs = FFA ? foes() : O ? [O] : [], far = SPAWN.slice(0, 2).concat([[1.5, 14.5, 0], [14.5, 1.5, 3.1], [7.5, 7.5, 0]]).filter((s) => fs.every((o) => Math.hypot(s[0] - o.x, s[1] - o.y) > 6)); const s = far[ri(far.length)] || SPAWN[me]; Object.assign(P, { x: s[0], y: s[1], a: s[2], hp: 100, dead: 0 }); ammo = 20; reloadT = 0; };
    // FFA: frag hisoblari faqat o'sadi — max bilan birlashtiriladi; WIN ga yetgan birinchi g'olib
    const chkWin = () => { if (over) return; const w = frags.findIndex((f, s) => f >= WIN && !gone.has(s)); if (w >= 0) { over = true; ctx.rt?.send({ t: 'end', w, fr: frags }); setTimeout(() => ctx.over(w), 800); } };
    const link = rtLink(ctx, (d, s) => {
      if (FFA) {
        if (!Number.isInteger(s) || s < 0 || s >= NP || gone.has(s)) return;
        if (d.t === 'p') { const o = OS[s] || (OS[s] = { cur: null, prev: null, T: 0, fl: 0, f: 0 }); o.prev = o.cur; o.cur = d; o.T = performance.now(); if (d.f > o.f) { o.f = d.f; o.fl = 0.08; snd(160, 0.07, 0.04, 'square'); } if (Array.isArray(d.fr)) d.fr.forEach((v, i) => { if (i < NP) frags[i] = Math.max(frags[i], v | 0); }); chkWin(); }
        if (d.t === 'hit' && !P.dead && !over && ctx.me >= 0) { P.hp -= d.dmg | 0; hurt = 0.4; snd(120, 0.15, 0.07, 'sawtooth'); if (P.hp <= 0) { P.dead = 2.5; frags[s]++; ctx.rt?.send({ t: 'die', by: s }); msg = rt('killed') + ' — ' + (ctx.names?.[s] || ''); msgT = 2; chkWin(); } }
        if (d.t === 'die') { const by = d.by | 0; if (by >= 0 && by < NP) { frags[by]++; if (by === me && ctx.me >= 0) { msg = '💀 +1'; msgT = 1.5; snd(700, 0.2, 0.07); } chkWin(); } }
        if (d.t === 'end' && !over) { over = true; setTimeout(() => ctx.over(d.w), 800); }
        return;
      }
      if (d.t === 'p') { Oprev = O; O = d; OT = performance.now(); if (d.f > oFire) { oFire = d.f; oFlash = 0.08; snd(160, 0.07, 0.04, 'square'); } frags[1 - me] = Math.max(frags[1 - me], d.k | 0); }
      if (d.t === 'hit' && !P.dead && !over) { P.hp -= d.dmg | 0; hurt = 0.4; snd(120, 0.15, 0.07, 'sawtooth'); if (P.hp <= 0) { P.dead = 2.5; ctx.rt?.send({ t: 'die' }); msg = rt('killed'); msgT = 2; } }
      if (d.t === 'die') { frags[me]++; msg = '💀 +1'; msgT = 1.5; snd(700, 0.2, 0.07); if (frags[me] >= WIN && !over) { over = true; ctx.rt?.send({ t: 'end', w: me, fr: frags }); setTimeout(() => ctx.over(me), 800); } }
      if (d.t === 'end' && !over) { over = true; setTimeout(() => ctx.over(d.w), 800); }
    });
    function shoot() {
      if (reloadT > 0 || fireT > 0 || P.dead || over) return;
      if (ammo <= 0) { reloadT = 1.3; return; }
      ammo--; fireT = 0.16; flash = 0.06; fireN++; snd(140, 0.09, 0.09, 'square'); snd(90, 0.12, 0.06, 'sawtooth');
      let best = null;
      for (const o of foes()) {
        const dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy); let da = Math.atan2(dy, dx) - P.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < Math.max(0.045, 0.3 / d) && los(P.x, P.y, o.x, o.y) && (!best || d < best.d)) best = { s: o.s, d, head: Math.abs(da) < 0.12 / d };
      }
      if (best) { const dmg = best.head ? 50 : 25; if (FFA) ctx.rt?.send({ t: 'hit', dmg }, best.s); else ctx.rt?.send({ t: 'hit', dmg }); hitMk = 0.25; msg = best.head ? '🎯 ' + rt('hit') : rt('hit'); msgT = 0.5; sparks(best.head ? '#FDE047' : '#F87171', best.head ? 14 : 9); if (LB[best.s]) botHurt(best.s, dmg, me); }
      if (ammo === 0) reloadT = 1.3;
    }
    // effektlar: ekran koordinatasidagi uchqunlar (tegishda), silkinish
    const SPK = []; const sparks = (col, n) => { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = 60 + Math.random() * 160; SPK.push({ x: 0, y: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.25 + Math.random() * 0.25, col }); } };
    // ---- yakka rejim botlari: BFS bilan izlaydi, ko'rsa yon tomonga yurib (strafe) otadi, joni kam bo'lsa pana joyga yashirinadi ----
    const BOTS = [...(ctx.bots || [])].filter((s) => s < NP && s !== me), LB = {}, nrm = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    BOTS.forEach((s) => (LB[s] = { s, x: SPAWN[s][0], y: SPAWN[s][1], a: SPAWN[s][2], hp: 100, dead: 0, f: 0, k: 0, ammo: 20, rl: 0, ft: 0, seen: 0, rc: 0.5, tg: -1, tgT: 0, D: null, dT: 0, sd: 1, sT: 0, cover: 0, cov: null, sp: 0, lx: 0, ly: 0 }));
    const ents = () => [{ s: me, x: P.x, y: P.y, dead: P.dead > 0, sp: pSp }].concat(BOTS.map((s) => LB[s]).map((b) => ({ s: b.s, x: b.x, y: b.y, dead: b.dead > 0, sp: b.sp })));
    const bfs = (tx, ty, lim = 99) => { const D = new Int8Array(N * N).fill(-1), q = [(ty | 0) * N + (tx | 0)]; D[q[0]] = 0; for (let h = 0; h < q.length; h++) { const k = q[h], x = k % N, y = (k / N) | 0; if (D[k] >= lim) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, nk = ny * N + nx; if (!wall(nx, ny) && D[nk] < 0) { D[nk] = D[k] + 1; q.push(nk); } } } return D; };
    const coverCell = (b, e) => { const D = bfs(b.x, b.y, 5); let best = null, bd = 99; for (let k = 0; k < N * N; k++) if (D[k] > 0 && D[k] < bd) { const cx = (k % N) + 0.5, cy = ((k / N) | 0) + 0.5; if (!los(cx, cy, e.x, e.y)) { bd = D[k]; best = [cx, cy]; } } return best; };
    let pSp = 0, ppx = P.x, ppy = P.y;
    const hurtMe = (s, dmg) => { const was = !(P.dead > 0); link.recv({ t: 'hit', dmg }, s); if (was && P.dead > 0 && !FFA) { LB[s].k++; if (LB[s].k >= WIN) link.recv({ t: 'end', w: s }, s); } };
    const botHurt = (s, dmg, by) => { const b = LB[s]; if (!b || b.dead > 0 || over) return; b.hp -= dmg; b.tg = by; b.tgT = 1; b.seen = Math.max(b.seen, b.rc * 0.6);
      if (b.hp <= 0) { b.dead = 2.5; b.hp = 0; if (by === me) link.recv(FFA ? { t: 'die', by: me } : { t: 'die' }, s); else { frags[by]++; chkWin(); } } };
    const botRespawn = (b) => { const es = ents().filter((e) => e.s !== b.s && !e.dead), pts = SPAWN.concat([[1.5, 14.5, 0], [14.5, 1.5, 3.1], [7.5, 7.5, 0], [12.5, 5.5, 0]]).filter((q) => !wall(q[0], q[1]) && es.every((e) => Math.hypot(q[0] - e.x, q[1] - e.y) > 6)); const q = pts[ri(pts.length)] || SPAWN[b.s]; Object.assign(b, { x: q[0], y: q[1], a: q[2], hp: 100, dead: 0, ammo: 20, rl: 0, seen: 0, cover: 0, D: null }); };
    const botStep = (dt) => { pSp = Math.hypot(P.x - ppx, P.y - ppy) / Math.max(dt, 1e-3); ppx = P.x; ppy = P.y;
      for (const s of BOTS) { const b = LB[s]; if (gone.has(s)) continue;
        if (b.dead > 0) { b.dead -= dt; if (b.dead <= 0) botRespawn(b); }
        else {
          b.ft -= dt; if (b.rl > 0) { b.rl -= dt; if (b.rl <= 0) b.ammo = 20; }
          const es = ents().filter((e) => e.s !== s && !e.dead && !gone.has(e.s)); b.tgT -= dt;
          if (b.tgT <= 0 || !es.some((e) => e.s === b.tg)) { b.tgT = 0.6; let bd = 1e9; b.tg = -1; for (const e of es) { const d = Math.hypot(e.x - b.x, e.y - b.y) * (los(b.x, b.y, e.x, e.y) ? 0.5 : 1); if (d < bd) { bd = d; b.tg = e.s; } } }
          const e = es.find((q) => q.s === b.tg); let mx = 0, my = 0;
          if (e) { const dx = e.x - b.x, dy = e.y - b.y, d = Math.hypot(dx, dy), vis = d < 12 && los(b.x, b.y, e.x, e.y), want = Math.atan2(dy, dx);
            if (vis) {
              if (b.seen <= 0) b.rc = 0.4 + Math.random() * 0.35; b.seen += dt; b.lx = e.x; b.ly = e.y; b.a += Math.max(-3 * dt, Math.min(3 * dt, nrm(want - b.a)));
              if (b.hp <= 50 && b.cover <= 0 && Math.random() < dt * 1.2) { b.cov = coverCell(b, e); if (b.cov) b.cover = 1.6 + Math.random(); }
              if (b.cover > 0 && b.cov) { mx = b.cov[0] - b.x; my = b.cov[1] - b.y; }
              else { b.sT -= dt; if (b.sT <= 0) { b.sT = 0.4 + Math.random() * 0.9; b.sd = Math.random() < 0.5 ? -1 : 1; } mx = -Math.sin(want) * b.sd + (d > 6 ? Math.cos(want) * 0.7 : d < 2.5 ? -Math.cos(want) * 0.6 : 0); my = Math.cos(want) * b.sd + (d > 6 ? Math.sin(want) * 0.7 : d < 2.5 ? -Math.sin(want) * 0.6 : 0); }
              if (b.seen > b.rc && Math.abs(nrm(want - b.a)) < 0.12 && b.ft <= 0 && b.rl <= 0 && !(b.cover > 0.4)) { // otish: aniqlik masofa va nishon harakatiga bog'liq
                b.ammo--; b.f++; b.ft = 0.32 + Math.random() * 0.28; if (b.ammo <= 0) b.rl = 1.5;
                if (Math.random() < Math.max(0.14, Math.min(0.66, 0.68 - d * 0.035 - (e.sp > 1 ? 0.14 : 0) - (b.sp > 1 ? 0.06 : 0)))) { const dmg = Math.random() < 0.12 ? 50 : 25; if (e.s === me) hurtMe(s, dmg); else botHurt(e.s, dmg, s); }
              }
            } else {
              b.seen = Math.max(0, b.seen - dt * 2); b.dT -= dt; if (!b.D || b.dT <= 0) { b.D = bfs(b.lx && b.seen > 0 ? b.lx : e.x, b.lx && b.seen > 0 ? b.ly : e.y); b.dT = 0.5; }
              const cx = b.x | 0, cy = b.y | 0; let bv = b.D[cy * N + cx] < 0 ? 99 : b.D[cy * N + cx], nx = cx, ny = cy;
              for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = b.D[(cy + oy) * N + cx + ox]; if (v >= 0 && v < bv) { bv = v; nx = cx + ox; ny = cy + oy; } }
              mx = nx + 0.5 - b.x; my = ny + 0.5 - b.y; if (nx === cx && ny === cy) { mx = dx; my = dy; } b.a += Math.max(-3 * dt, Math.min(3 * dt, nrm(Math.atan2(my, mx) - b.a)));
            }
          }
          if (b.cover > 0) b.cover -= dt;
          const m = Math.hypot(mx, my), sp = 2.5 * dt; let vx = 0, vy = 0; if (m > 0.05) { vx = (mx / m) * sp; vy = (my / m) * sp; }
          const ox = b.x, oy = b.y; if (!wall(b.x + vx + Math.sign(vx) * 0.2, b.y)) b.x += vx; if (!wall(b.x, b.y + vy + Math.sign(vy) * 0.2)) b.y += vy; b.sp = Math.hypot(b.x - ox, b.y - oy) / Math.max(dt, 1e-3);
        }
        link.recv({ t: 'p', x: b.x, y: b.y, a: b.a, hp: Math.max(0, Math.round(b.hp)), dead: b.dead > 0 ? 1 : 0, f: b.f, k: b.k }, s);
      } };
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    let sendT = 0; const ZB = [];
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      sendT += dt; if (link.st.alive && !started) { started = true; msg = rt('go'); msgT = 1.2; }
      if (BOTS.length && started && !over) botStep(dt);
      if (P.dead) { P.dead -= dt; if (P.dead <= 0) respawn(); }
      else if (started && !over) {
        let mx = pad.x, my = pad.y; const kd = keysDown;
        if (kd.has('w') || kd.has('arrowup')) my = -1; if (kd.has('s') || kd.has('arrowdown')) my = 1; if (kd.has('a')) mx = -1; if (kd.has('d')) mx = 1;
        if (kd.has('arrowleft')) P.a -= dt * 2.4; if (kd.has('arrowright')) P.a += dt * 2.4;
        const sp = 3.1 * dt, ca = Math.cos(P.a), sa = Math.sin(P.a); const vx = (-my * ca - mx * sa) * sp, vy = (-my * sa + mx * ca) * sp;
        if (!wall(P.x + vx + Math.sign(vx) * 0.2, P.y)) P.x += vx; if (!wall(P.x, P.y + vy + Math.sign(vy) * 0.2)) P.y += vy;
        if (pad.b.fire || kd.has(' ')) shoot();
        if (pad.take('reload') && ammo < 20 && reloadT <= 0) reloadT = 1.3;
      }
      if (reloadT > 0) { reloadT -= dt; if (reloadT <= 0) ammo = 20; }
      fireT -= dt;
      if (sendT > 0.05 && ctx.me >= 0) { sendT = 0; ctx.rt?.send({ t: 'p', x: Math.round(P.x * 100) / 100, y: Math.round(P.y * 100) / 100, a: Math.round(P.a * 100) / 100, hp: Math.max(0, Math.round(P.hp)), dead: P.dead > 0 ? 1 : 0, f: fireN, k: frags[me], ...(FFA ? { fr: frags } : {}) }); }
      ctx.turn(-1, FFA ? `❤️ ${Math.max(0, Math.round(P.hp))} · 🔫 ${reloadT > 0 ? '…' : ammo} · ${rt('kills')} ${frags[me]}/${WIN}` : `❤️ ${Math.max(0, Math.round(P.hp))} · 🔫 ${reloadT > 0 ? '…' : ammo} · ${rt('you')} ${frags[me]} : ${frags[1 - me]} ${rt('opp')}`);
      // ---- render ----
      const hz = H / 2; g.save(); if (hurt > 0) { const q = hurt * 22; g.translate((Math.random() - 0.5) * q, (Math.random() - 0.5) * q); }
      let gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, '#0EA5E9'); gr.addColorStop(1, '#BAE6FD'); g.fillStyle = gr; g.fillRect(0, 0, W, hz);
      gr = g.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, '#A8A29E'); gr.addColorStop(1, '#44403C'); g.fillStyle = gr; g.fillRect(0, hz, W, hz);
      const FOV = 1.05, cols = Math.ceil(W / 2), dirx = Math.cos(P.a), diry = Math.sin(P.a), plx = -diry * Math.tan(FOV / 2), ply = dirx * Math.tan(FOV / 2);
      for (let i = 0; i < cols; i++) {
        const cam = (2 * i) / cols - 1, rx = dirx + plx * cam, ry = diry + ply * cam;
        let mx = P.x | 0, my = P.y | 0; const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry); let sxs, sys, sdx, sdy, side = 0;
        if (rx < 0) { sxs = -1; sdx = (P.x - mx) * ddx; } else { sxs = 1; sdx = (mx + 1 - P.x) * ddx; }
        if (ry < 0) { sys = -1; sdy = (P.y - my) * ddy; } else { sys = 1; sdy = (my + 1 - P.y) * ddy; }
        for (let k = 0; k < 64; k++) { if (sdx < sdy) { sdx += ddx; mx += sxs; side = 0; } else { sdy += ddy; my += sys; side = 1; } if (wall(mx, my)) break; }
        const pd = side ? sdy - ddy : sdx - ddx; ZB[i] = pd;
        const lh = H / Math.max(0.05, pd), y0 = hz - lh / 2; let wx = side ? P.x + pd * rx : P.y + pd * ry; wx -= Math.floor(wx);
        const br = Math.max(0.22, 1 - pd / 14) * (side ? 0.78 : 1), crate = (mx + my) % 3 === 0;
        const base = crate ? [150, 120, 70] : ((wx * 4) | 0) % 2 === 0 ? [120, 128, 140] : [108, 116, 128];
        g.fillStyle = `rgb(${base[0] * br | 0},${base[1] * br | 0},${base[2] * br | 0})`; g.fillRect(i * 2, y0, 2.2, lh);
        g.fillStyle = `rgba(0,0,0,${0.2 * br})`; for (let r = 1; r < 4; r++) g.fillRect(i * 2, y0 + (lh / 4) * r, 2.2, Math.max(1, lh / 90));
      }
      // raqib(lar) (oraliq holat bilan silliq); FFA: uzoqdan yaqinga, o'rin rangida
      const spr = [];
      if (FFA) { for (const k in OS) { const s = +k, o = OS[s]; if (gone.has(s) || s === ctx.me || !o.cur || o.cur.dead) continue; const kk = o.prev ? Math.min(1, (performance.now() - o.T) / 50) : 1; spr.push({ x: o.prev ? o.prev.x + (o.cur.x - o.prev.x) * kk : o.cur.x, y: o.prev ? o.prev.y + (o.cur.y - o.prev.y) * kk : o.cur.y, hp: o.cur.hp, fl: o.fl > 0, col: COL[s], nm: ctx.names?.[s] || rt('opp') }); if (o.fl > 0) o.fl -= dt; } }
      else if (O && !O.dead) { const kk = Oprev ? Math.min(1, (performance.now() - OT) / 50) : 1; spr.push({ x: Oprev ? Oprev.x + (O.x - Oprev.x) * kk : O.x, y: Oprev ? Oprev.y + (O.y - Oprev.y) * kk : O.y, hp: O.hp, fl: oFlash > 0, col: ctx.me === 0 ? '#DC2626' : '#2563EB', nm: ctx.names?.[1 - me] || rt('opp') }); }
      spr.sort((a, b) => Math.hypot(b.x - P.x, b.y - P.y) - Math.hypot(a.x - P.x, a.y - P.y));
      for (const sp of spr) {
        const dx = sp.x - P.x, dy = sp.y - P.y; const inv = 1 / (plx * diry - dirx * ply), tx = inv * (diry * dx - dirx * dy), ty = inv * (-ply * dx + plx * dy);
        if (ty > 0.2) {
          const scx = (W / 2) * (1 + tx / ty), sh = H / ty, col = Math.floor(scx / 2);
          if (col >= 0 && col < cols && ZB[col] >= ty) {
            const w = sh * 0.42, top = hz - sh * 0.38, bob = Math.sin(performance.now() / 110) * sh * 0.01, red = sp.col;
            g.fillStyle = red; rr(g, scx - w / 2, top + sh * 0.22 + bob, w, sh * 0.42, w * 0.18); g.fill();
            g.fillStyle = '#1F2937'; g.fillRect(scx - w * 0.35, top + sh * 0.62 + bob, w * 0.28, sh * 0.25); g.fillRect(scx + w * 0.07, top + sh * 0.62 + bob, w * 0.28, sh * 0.25);
            g.fillStyle = '#FCD34D'; g.beginPath(); g.arc(scx, top + sh * 0.13 + bob, w * 0.26, 0, 7); g.fill(); g.fillStyle = '#111827'; g.fillRect(scx - w * 0.28, top + sh * 0.06 + bob, w * 0.56, w * 0.12);
            g.fillStyle = '#374151'; g.fillRect(scx - w * 0.05, top + sh * 0.35 + bob, w * 0.62, w * 0.12);
            if (sp.fl) { g.fillStyle = '#FDE047'; g.beginPath(); g.arc(scx + w * 0.6, top + sh * 0.36 + bob, w * 0.16, 0, 7); g.fill(); }
            const bw = Math.max(30, w); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(scx - bw / 2, top - 10, bw, 5); g.fillStyle = '#22C55E'; g.fillRect(scx - bw / 2, top - 10, bw * Math.max(0, sp.hp) / 100, 5);
            text(g, sp.nm, scx, top - 20, 12, FFA ? sp.col : undefined);
          }
        }
      }
      if (oFlash > 0) oFlash -= dt;
      for (let i = SPK.length - 1; i >= 0; i--) { const q = SPK[i]; q.t -= dt; if (q.t <= 0) { SPK.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; g.globalAlpha = Math.min(1, q.t * 4); g.fillStyle = q.col; g.fillRect(W / 2 + q.x - 2, hz + q.y - 2, 4, 4); } g.globalAlpha = 1;
      const bob = Math.sin(performance.now() / 120) * (Math.abs(pad.x) + Math.abs(pad.y) > 0.1 ? 4 : 0.8), kick = fireT > 0 ? 8 : 0, gx = W * 0.62, gy = H - 10 + bob + kick;
      g.fillStyle = '#1F2937'; g.beginPath(); g.moveTo(gx - 30, gy); g.lineTo(gx - 8, gy - 120); g.lineTo(gx + 14, gy - 120); g.lineTo(gx + 40, gy); g.fill();
      g.fillStyle = '#4B5563'; g.fillRect(gx - 4, gy - 150, 14, 40); g.fillStyle = '#92400E'; g.beginPath(); g.moveTo(gx + 10, gy); g.lineTo(gx + 26, gy - 60); g.lineTo(gx + 50, gy - 50); g.lineTo(gx + 46, gy); g.fill();
      if (flash > 0) { flash -= dt; g.fillStyle = 'rgba(253,224,71,.12)'; g.fillRect(0, 0, W, H); g.fillStyle = '#FDE047'; g.beginPath(); g.arc(gx + 3, gy - 158, 18, 0, 7); g.fill(); g.fillStyle = '#FFF'; g.beginPath(); g.arc(gx + 3, gy - 158, 8, 0, 7); g.fill(); }
      g.restore();
      g.strokeStyle = hitMk > 0 ? '#EF4444' : '#22C55E'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 12, hz); g.lineTo(W / 2 - 4, hz); g.moveTo(W / 2 + 4, hz); g.lineTo(W / 2 + 12, hz); g.moveTo(W / 2, hz - 12); g.lineTo(W / 2, hz - 4); g.moveTo(W / 2, hz + 4); g.lineTo(W / 2, hz + 12); g.stroke();
      if (hitMk > 0) { hitMk -= dt; g.beginPath(); g.moveTo(W / 2 - 9, hz - 9); g.lineTo(W / 2 - 4, hz - 4); g.moveTo(W / 2 + 9, hz - 9); g.lineTo(W / 2 + 4, hz - 4); g.moveTo(W / 2 - 9, hz + 9); g.lineTo(W / 2 - 4, hz + 4); g.moveTo(W / 2 + 9, hz + 9); g.lineTo(W / 2 + 4, hz + 4); g.stroke(); }
      const ms = 5; g.globalAlpha = 0.75; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = MAP[y][x] === '#' ? '#1F2937' : '#E5E7EB'; g.fillRect(8 + x * ms, 8 + y * ms, ms, ms); }
      g.fillStyle = '#16A34A'; g.fillRect(8 + P.x * ms - 2, 8 + P.y * ms - 2, 4, 4); g.globalAlpha = 1;
      if (FFA) { // ixcham hisob qatori: o'rin rangidagi nuqta + frag, o'zimniki sariq halqa
        const cw = 44, bw = NP * cw + 12, bx = W / 2 - bw / 2; g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, bx, 8, bw, 28, 14); g.fill();
        for (let s = 0; s < NP; s++) { const x = bx + 6 + s * cw + 12; g.globalAlpha = gone.has(s) ? 0.35 : 1; g.fillStyle = COL[s]; g.beginPath(); g.arc(x, 22, 6, 0, 7); g.fill(); if (s === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.beginPath(); g.arc(x, 22, 8.5, 0, 7); g.stroke(); } text(g, String(frags[s]), x + 17, 22, 15); g.globalAlpha = 1; }
      } else { g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, W / 2 - 60, 8, 120, 28, 14); g.fill(); text(g, `${frags[me]} : ${frags[1 - me]}`, W / 2, 22, 16); }
      if (reloadT > 0) text(g, '🔄…', W / 2, hz + 40, 16, '#FDE047');
      if (hurt > 0) { hurt -= dt; g.fillStyle = `rgba(220,38,38,${hurt})`; g.fillRect(0, 0, W, H); }
      if (P.dead > 0) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, W, H); text(g, rt('respawn') + ' ' + Math.ceil(P.dead), W / 2, hz, 22); }
      if (!started) text(g, rt('wait_rt'), W / 2, hz - 50, 18);
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, hz - 60, 26); }
      if (link.lost() && !over) text(g, rt('lost'), W / 2, H * 0.72, 15, '#FCA5A5');
    });
    return { apply: () => false, rt: (s, d) => link.recv(d, s), stop, resize: fit, quit: (s) => { gone.add(s); delete OS[s]; } };
  };


  // ---- Havo xokkeyi (jonli): uy egasi shaybani hisoblaydi ----
  MPI.hockey = (stage, ctx) => {
    const { c, g, fit } = canvasIn(stage, 0.6);
    const TW = 1, TH = 1.65, GOAL = 0.34, MR = 0.075, PR = 0.045, WIN = 7, HOST = ctx.me === 0, NP = ctx.n || 2, MS = Math.max(0, ctx.me), MT = MS % 2, flip = MT === 1;
    // n>2: jamoa = o'rin % 2, har kishining o'z shaybasi (to'qmoq) o'z yarmida
    const two = (t) => (t === 0 ? NP >= 3 : NP >= 4), home = (s) => ({ x: two(s % 2) ? (s < 2 ? 0.3 : 0.7) : 0.5, y: s % 2 ? 0.18 : TH - 0.18, vx: 0, vy: 0 });
    let puck = { x: 0.5, y: TH / 2, vx: 0, vy: 0 }, m = Array.from({ length: NP }, (_, s) => home(s)), sc = [0, 0], over = false, started = false, msg = '', msgT = 0, serveT = 1, endW = null;
    let target = null, snap = null, prevS = null, snapT = 0; const gone = new Set();
    // effektlar
    const PT = []; let shake = 0, glow = [0, 0];
    const burst = (x, y, col, n, sp) => { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = sp * (0.3 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.3 + Math.random() * 0.4, col }); } if (PT.length > 160) PT.splice(0, PT.length - 160); };
    const goalFx = (s) => { shake = 0.35; glow[s] = 1; burst(0.5, s ? TH : 0, s ? '#F43F5E' : '#3B82F6', 26, 1.2); };
    const toWorld = (px, py) => { const s = Math.min(c.W / TW, c.H / TH), ox = (c.W - TW * s) / 2, oy = (c.H - TH * s) / 2; let x = (px - ox) / s, y = (py - oy) / s; if (flip) { x = TW - x; y = TH - y; } return [x, y]; };
    const clampM = (o, seat) => { o.x = Math.max(MR, Math.min(TW - MR, o.x)); o.y = seat % 2 === 0 ? Math.max(TH / 2 + MR, Math.min(TH - MR, o.y)) : Math.max(MR, Math.min(TH / 2 - MR, o.y)); };
    const onPt = (e) => { if (ctx.me < 0) return; const [x, y] = toWorld(...pos(c, e)); target = { x, y }; };
    c.addEventListener('pointerdown', onPt); c.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') onPt(e); });
    const reset = (towards) => { puck = { x: 0.5, y: TH / 2 + (towards === 0 ? 0.12 : -0.12), vx: 0, vy: 0 }; serveT = 0.8; };
    const finish = (w) => { if (over) return; over = true; endW = w; ctx.rt?.send({ t: 'end', w }); setTimeout(() => ctx.over(w), 600); };
    const link = rtLink(ctx, (d, sd) => {
      if (d.t === 'm' && (HOST || NP > 2) && sd > 0 && sd < NP && sd !== ctx.me) { const o = m[sd], nx = +d.x, ny = +d.y; o.vx = (nx - o.x) * 30; o.vy = (ny - o.y) * 30; o.x = nx; o.y = ny; clampM(o, sd); }
      if (!HOST && d.t === 's') { prevS = snap; snap = d; snapT = performance.now(); if (d.sc[0] + d.sc[1] > sc[0] + sc[1]) { snd(880, 0.3, 0.08); msg = '🥅'; msgT = 1; goalFx(d.sc[0] > sc[0] ? 0 : 1); } sc = d.sc; m[0].x = d.m[0]; m[0].y = d.m[1]; }
      if (d.t === 'end' && !over) { over = true; endW = d.w; setTimeout(() => ctx.over(d.w), 600); }
    });
    // botlar (faqat uy egasida): shaybani kechikib "ko'radi", o'z yarmida bo'lsa orqasidan aylanib o'tib darvozaga uradi, aks holda darvoza oldida himoyada turadi
    const BOT = [...(ctx.bots || [])].filter((s) => s < NP), AI = {}; BOT.forEach((s) => (AI[s] = { t: 0, px: 0.5, py: TH / 2, vx: 0, vy: 0, aim: 0, st: 0, poke: 0, ret: 0 }));
    const botStep = (dt) => { for (const s of BOT) { if (gone.has(s)) continue; const o = m[s], a = AI[s], f = s % 2 ? 1 : -1, G = s % 2 ? 0 : TH, OG = TH - G;
      a.t -= dt; if (a.t <= 0) { a.t = 0.08 + Math.random() * 0.1; a.px = puck.x + (Math.random() - 0.5) * 0.03; a.py = puck.y + (Math.random() - 0.5) * 0.03; a.vx = puck.vx; a.vy = puck.vy; }
      const px = a.px + a.vx * 0.1, py = a.py + a.vy * 0.1, own = (py - TH / 2) * f < MR + PR * 0.5 && Math.hypot(a.vx, a.vy) < 2.5 || (py - TH / 2) * f < -0.02;
      const mate = two(s % 2) ? (s < 2 ? s + 2 : s - 2) : -1; let att = own && serveT <= 0;
      if (att && mate >= 0 && mate < NP && !gone.has(mate)) att = Math.abs(px - home(s).x) <= Math.abs(px - home(mate).x);
      let tx, ty, vmax = 1.45;
      const dp = Math.hypot(puck.x - o.x, puck.y - o.y); a.st = a.ret <= 0 && dp < MR + PR + 0.03 ? a.st + dt : 0; if (a.st > 0.5) { a.st = 0; a.poke = 0.5; a.ret = 0; } // burchakda qotsa: keskin urib, darhol orqaga
      if (a.ret > 0) { a.ret -= dt; tx = TW / 2; ty = G + f * 0.4; vmax = 2.2; }
      else if (a.poke > 0) { a.poke -= dt; tx = puck.x; ty = puck.y; vmax = 2.8; if (dp < MR + PR + 0.006) { a.poke = 0; a.ret = 0.45; } }
      else if (att) {
        if (Math.random() < dt * 0.6) a.aim = (Math.random() - 0.5) * GOAL * 0.8;
        let dx = TW / 2 + a.aim - px, dy = OG - py; const dd = Math.hypot(dx, dy) || 1; dx /= dd; dy /= dd; // shaybadan darvozaga yo'nalish
        const rx = px - o.x, ry = py - o.y, along = rx * dx + ry * dy, side = Math.abs(rx * dy - ry * dx);
        if (along > 0.02 && side < MR * 0.9) { tx = px + dx * 0.2; ty = py + dy * 0.2; vmax = 2.3; } // orqasida — zarba
        else if (along <= 0.02) { tx = px + (o.x >= px ? 1 : -1) * (MR + PR + 0.04); ty = py - f * (MR + PR + 0.05); vmax = 1.7; } // oldida — aylanib o'tish
        else { tx = px - dx * (MR + PR + 0.03); ty = py - dy * (MR + PR + 0.03); vmax = 1.7; }
      } else {
        const ly = G + f * 0.2, hx = home(s).x; let ix = TW / 2 + (px - TW / 2) * 0.45;
        if (a.vy * f < -0.1 && (py - ly) * f > 0) ix = Math.max(MR, Math.min(TW - MR, px + a.vx * ((ly - py) / a.vy))); // kelayotgan shaybani to'sish
        tx = two(s % 2) ? hx + (ix - TW / 2) * 0.6 : ix; ty = ly;
      }
      const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy) || 1, v = Math.min(vmax, d * 10);
      o.vx += ((dx / d) * v - o.vx) * Math.min(1, dt * 12); o.vy += ((dy / d) * v - o.vy) * Math.min(1, dt * 12); o.x += o.vx * dt; o.y += o.vy * dt; clampM(o, s); } };
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    let sendT = 0;
    const stop = loop((dt) => {
      const mine = m[MS];
      if (target && ctx.me >= 0) { const nx = mine.x + (target.x - mine.x) * Math.min(1, dt * 22), ny = mine.y + (target.y - mine.y) * Math.min(1, dt * 22); mine.vx = (nx - mine.x) / dt; mine.vy = (ny - mine.y) / dt; mine.x = nx; mine.y = ny; clampM(mine, MS); }
      sendT += dt; if (link.st.alive) started = true;
      if (HOST && started && !over) {
        if (NP > 2) for (const t of [0, 1]) { let any = false; for (let s = t; s < NP; s += 2) if (!gone.has(s)) any = true; if (!any) finish(1 - t); } // jamoada odam qolmasa — raqib yutadi
        botStep(dt);
        if (serveT > 0) serveT -= dt;
        else if ((puck.x < PR + 0.04 || puck.x > TW - PR - 0.04) && (puck.y < PR + 0.04 || puck.y > TH - PR - 0.04)) { puck.vx += Math.sign(TW / 2 - puck.x) * dt * 3; puck.vy += Math.sign(TH / 2 - puck.y) * dt * 3; } // burchakdan havo oqimi chiqaradi (qotib qolmasin)
        if (serveT <= 0) for (let st = 0; st < 3; st++) {
          const h = dt / 3; puck.x += puck.vx * h; puck.y += puck.vy * h; puck.vx *= Math.pow(0.6, h); puck.vy *= Math.pow(0.6, h);
          if (puck.x < PR) { puck.x = PR; puck.vx = Math.abs(puck.vx) * 0.9; snd(300, 0.03, 0.03); } if (puck.x > TW - PR) { puck.x = TW - PR; puck.vx = -Math.abs(puck.vx) * 0.9; snd(300, 0.03, 0.03); }
          const inG = Math.abs(puck.x - TW / 2) < GOAL / 2;
          if (puck.y < PR && !inG) { puck.y = PR; puck.vy = Math.abs(puck.vy) * 0.9; } if (puck.y > TH - PR && !inG) { puck.y = TH - PR; puck.vy = -Math.abs(puck.vy) * 0.9; }
          if (puck.y < -PR || puck.y > TH + PR) { const s = puck.y < 0 ? 0 : 1; sc[s]++; snd(880, 0.3, 0.08); msg = '🥅'; msgT = 1; goalFx(s); reset(1 - s); if (sc[s] >= WIN) finish(s); break; }
          m.forEach((o, i) => { if (gone.has(i)) return; const dx = puck.x - o.x, dy = puck.y - o.y, d = Math.hypot(dx, dy); if (d < MR + PR && d > 0) { const nx = dx / d, ny = dy / d; puck.x = o.x + nx * (MR + PR); puck.y = o.y + ny * (MR + PR); const rv = (puck.vx - o.vx) * nx + (puck.vy - o.vy) * ny; if (rv < 0) { puck.vx -= 1.9 * rv * nx; puck.vy -= 1.9 * rv * ny; } const sp = Math.hypot(puck.vx, puck.vy); if (sp > 3.2) { puck.vx *= 3.2 / sp; puck.vy *= 3.2 / sp; } snd(500, 0.03, 0.05); if (rv < -0.6) burst(o.x + nx * MR, o.y + ny * MR, '#E0F2FE', 6, 0.5); } });
          puck.x = Math.max(PR, Math.min(TW - PR, puck.x)); if (Math.abs(puck.x - TW / 2) >= GOAL / 2) puck.y = Math.max(PR, Math.min(TH - PR, puck.y)); // devor ichida qolsin
        }
        if (sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 's', p: [Math.round(puck.x * 1000) / 1000, Math.round(puck.y * 1000) / 1000], m: [Math.round(m[0].x * 1000) / 1000, Math.round(m[0].y * 1000) / 1000], sc, ...(NP > 2 ? { M: m.map((o) => [Math.round(o.x * 1000) / 1000, Math.round(o.y * 1000) / 1000]) } : {}) }); }
      } else if (HOST && over && endW != null && sendT > 0.1) { sendT = 0; ctx.rt?.send({ t: 'end', w: endW }); // 'end' qayta yuboriladi
      } else if (!HOST && ctx.me >= 0 && sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 'm', x: Math.round(mine.x * 1000) / 1000, y: Math.round(mine.y * 1000) / 1000 }); }
      if (!HOST && snap) { const k = prevS ? Math.min(1, (performance.now() - snapT) / 33) : 1; puck.x = prevS ? prevS.p[0] + (snap.p[0] - prevS.p[0]) * k : snap.p[0]; puck.y = prevS ? prevS.p[1] + (snap.p[1] - prevS.p[1]) * k : snap.p[1]; if (ctx.me < 0 && snap.M) snap.M.forEach((q, i) => { m[i].x = q[0]; m[i].y = q[1]; }); }
      // chizish
      const s = Math.min(c.W / TW, c.H / TH), ox = (c.W - TW * s) / 2, oy = (c.H - TH * s) / 2;
      const X = (x) => ox + (flip ? TW - x : x) * s, Y = (y) => oy + (flip ? TH - y : y) * s;
      const bg = g.createLinearGradient(0, 0, 0, c.H); bg.addColorStop(0, '#0F172A'); bg.addColorStop(1, '#1E293B'); g.fillStyle = bg; g.fillRect(0, 0, c.W, c.H);
      g.save(); if (shake > 0) { shake = Math.max(0, shake - dt); const k = shake * 20; g.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k); }
      const ice = g.createLinearGradient(ox, oy, ox + TW * s, oy + TH * s); ice.addColorStop(0, '#F0F9FF'); ice.addColorStop(0.5, '#E0F2FE'); ice.addColorStop(1, '#BAE6FD');
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 22; g.shadowOffsetY = 8; g.fillStyle = ice; rr(g, ox, oy, TW * s, TH * s, 26); g.fill(); g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.strokeStyle = '#0284C7'; g.lineWidth = 7; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; rr(g, ox + 5, oy + 5, TW * s - 10, TH * s - 10, 22); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(ox + TW * s * 0.1, oy + 10); g.lineTo(ox + TW * s * 0.35, oy + 10); g.lineTo(ox + TW * s * 0.12, oy + TH * s * 0.5); g.lineTo(ox + 10, oy + TH * s * 0.5); g.fill(); // muz yaltirashi
      g.strokeStyle = 'rgba(225,29,72,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(ox, oy + (TH / 2) * s); g.lineTo(ox + TW * s, oy + (TH / 2) * s); g.stroke(); g.beginPath(); g.arc(ox + (TW / 2) * s, oy + (TH / 2) * s, 0.14 * s, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(37,99,235,.35)'; for (const yy of [0, TH]) { g.beginPath(); g.arc(ox + (TW / 2) * s, Y(yy), 0.24 * s, 0, 7); g.stroke(); }
      for (const t of [0, 1]) { const gy = t ? TH : 0; glow[t] = Math.max(0, glow[t] - dt * 0.8); const yy = Y(gy), gx = ox + (TW / 2 - GOAL / 2) * s; g.fillStyle = '#0F172A'; g.fillRect(gx, yy - 4, GOAL * s, 8); if (glow[t] > 0) { g.fillStyle = `rgba(253,224,71,${glow[t] * 0.7})`; g.fillRect(gx - 6, yy - 8, GOAL * s + 12, 16); } }
      for (let i = PT.length - 1; i >= 0; i--) { const q = PT[i]; q.t -= dt; if (q.t <= 0) { PT.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.93; q.vy *= 0.93; g.globalAlpha = Math.min(1, q.t * 2.5); g.fillStyle = q.col; g.fillRect(X(q.x) - 2, Y(q.y) - 2, 4, 4); } g.globalAlpha = 1;
      const disc = (x, y, r, col, ring) => { const cx = X(x), cy = Y(y), R = r * s; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.arc(cx + 3, cy + 5, R, 0, 7); g.fill(); const gr = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R); gr.addColorStop(0, ring ? '#FFFFFF' : '#475569'); gr.addColorStop(0.35, col); gr.addColorStop(1, col); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); if (ring) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R * 0.62, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(cx, cy, R * 0.4, 0, 7); g.fill(); } };
      disc(puck.x, puck.y, PR, '#111827');
      m.forEach((o, i) => { if (gone.has(i)) return; disc(o.x, o.y, MR, i % 2 ? '#E11D48' : '#2563EB', true);
        if (NP > 2) { g.fillStyle = ctx.col?.[i] || '#fff'; g.beginPath(); g.arc(X(o.x), Y(o.y), MR * s * 0.36, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.stroke(); if (i === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 4; g.beginPath(); g.arc(X(o.x), Y(o.y), MR * s + 4, 0, 7); g.stroke(); } } });
      g.restore();
      const my = sc[MT], op = sc[1 - MT];
      g.fillStyle = 'rgba(15,23,42,.75)'; rr(g, c.W - 46, c.H / 2 - 54, 38, 108, 12); g.fill();
      text(g, `${my}`, c.W - 27, c.H / 2 + 26, 24, '#60A5FA'); text(g, `${op}`, c.W - 27, c.H / 2 - 26, 24, '#FB7185');
      if (NP > 2) [MT, 1 - MT].forEach((t, j) => { let n = 0; for (let sd = t; sd < NP; sd += 2) { const yy = c.H / 2 + (j ? -1 : 1) * (66 + n++ * 13); g.globalAlpha = gone.has(sd) ? 0.3 : 1; g.fillStyle = ctx.col?.[sd] || '#000'; g.beginPath(); g.arc(c.W - 27, yy, 5, 0, 7); g.fill(); if (sd === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.stroke(); } g.globalAlpha = 1; } });
      if (!started) text(g, rt('wait_rt'), c.W / 2, c.H / 2 - 40, 16, '#0F172A');
      if (msgT > 0) { msgT -= dt; text(g, msg, c.W / 2, c.H / 2, 40 + (1 - msgT) * 14, '#0F172A'); }
      if (NP > 2 && over && endW != null) text(g, `${endW ? '🔴🔴' : '🔵🔵'} 🏆`, c.W / 2, c.H / 2 + 50, 30, '#0F172A');
      if (link.lost() && !over) text(g, rt('lost'), c.W / 2, c.H * 0.7, 14, '#E11D48');
    });
    if (!HOST && ctx.me >= 0) m[MS].y = MT ? 0.18 : TH - 0.18;
    return { apply: () => false, rt: (sd, d) => link.recv(d, sd), quit: (sd) => { gone.add(sd); }, stop, resize: fit };
  };


  // ---- Reversi (8×8, navbatma-navbat) ----
  MPI.reversi = (stage, ctx) => {
    const N = 8, NP = ctx.n || 2, MULTI = NP > 2; const cv = canvasIn(stage, 8 / 9); const { c, g } = cv; // tepada hisob qatori uchun joy
    // n>2 (Rolit): markazda o'rinlar rangi (soat yo'nalishida 0,1,2,3); n=3 da 35-katak bo'sh qoladi
    const b = Array(N * N).fill(-1); if (MULTI) { [27, 28, 36, 35].slice(0, NP).forEach((k, i) => (b[k] = i)); } else { b[27] = b[36] = 1; b[28] = b[35] = 0; } let turn = 0, done = false, lastI = -1;
    const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const flips = (i, sd) => { if (b[i] !== -1) return []; const x0 = i % N, y0 = (i / N) | 0, out = []; for (const [dx, dy] of D8) { const L = []; let x = x0 + dx, y = y0 + dy; while (x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] !== -1 && b[y * N + x] !== sd) { L.push(y * N + x); x += dx; y += dy; } if (L.length && x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] === sd) out.push(...L); } return out; };
    const adj = (i) => b[i] === -1 && D8.some(([dx, dy]) => { const x = (i % N) + dx, y = ((i / N) | 0) + dy; return x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] !== -1; });
    const flank = (sd) => b.map((_, i) => i).filter((i) => flips(i, sd).length);
    // Rolit: qisib olish imkoni bo'lmasa — istalgan toshga yondosh bo'sh katakka qo'yish mumkin
    const moves = (sd) => { const f = flank(sd); return f.length || !MULTI ? f : b.map((_, i) => i).filter(adj); };
    const cnt = (s) => b.filter((v) => v === s).length;
    const finish = () => {
      done = true; if (!MULTI) { const n0 = cnt(0), n1 = cnt(1); return ctx.over(n0 === n1 ? 2 : n0 > n1 ? 0 : 1); }
      const sc = Array.from({ length: NP }, (_, i) => (ctx.out?.has(i) ? -1 : cnt(i))); const mx = Math.max(...sc), top = sc.map((v, i) => (v === mx ? i : -1)).filter((i) => i >= 0); ctx.over(top.length > 1 ? ctx.DRAW : top[0]);
    };
    // o'lchamlar: tepada hisob paneli, pastda ramkali taxta
    const geo = () => { const hh = Math.max(36, Math.round(c.H * 0.09)), m = Math.max(14, Math.round(Math.min(c.W, c.H) * 0.045)); const s = Math.min((c.W - 2 * m) / N, (c.H - hh - 8 - 2 * m) / N); return { s, m, hh, ox: (c.W - s * N) / 2, oy: hh + 8 + m + Math.max(0, (c.H - hh - 8 - 2 * m - s * N) / 2) }; };
    const cellAt = (e) => { const [x, y] = pos(c, e); const { s, ox, oy } = geo(); const cx = Math.floor((x - ox) / s), cy = Math.floor((y - oy) / s); return cx < 0 || cy < 0 || cx >= N || cy >= N ? null : [cx, cy]; };
    c.addEventListener('pointerdown', (e) => { if (done || turn !== ctx.me) return; const p = cellAt(e); if (!p) return; const i = p[1] * N + p[0]; if (moves(ctx.me).includes(i)) ctx.send(i); });
    // --- bot: ochko jadvali (burchak +, burchak yoni −), ag'darilgan toshlar, raqib harakatchanligi ---
    const WT = '100 -20 10 5 5 10 -20 100 -20 -50 -2 -2 -2 -2 -50 -20 10 -2 1 1 1 1 -2 10 5 -2 1 0 0 1 -2 5 5 -2 1 0 0 1 -2 5 10 -2 1 1 1 1 -2 10 -20 -50 -2 -2 -2 -2 -50 -20 100 -20 10 5 5 10 -20 100'.split(' ').map(Number);
    const wAt = (i) => { let w = WT[i]; if (w < 0) { const x = i % N, y = (i / N) | 0; if (b[(y < 4 ? 0 : 7) * N + (x < 4 ? 0 : 7)] !== -1) w = 4; } return w; };
    function bot(sd) {
      if (done || sd !== turn) return null; const ms = moves(sd); if (!ms.length) return null;
      const empty = b.filter((v) => v === -1).length; let best = ms[0], bv = -Infinity;
      for (const i of ms) {
        const f = flips(i, sd), all = [i, ...f], old = all.map((k) => b[k]); let v = wAt(i) + f.length * (MULTI ? 3 : 1.2) + Math.random() * 2;
        all.forEach((k) => (b[k] = sd));
        if (!MULTI) { const om = flank(1 - sd); v -= om.length * 2.5; if (om.some((k) => WT[k] === 100)) v -= 70; if (!om.length) v += 25; }
        else { const om = flank(ctx.next(sd)); if (om.some((k) => WT[k] === 100)) v -= 45; }
        all.forEach((k, j) => (b[k] = old[j]));
        if (empty < 12) v += f.length * 5; // oxirida — ko'proq tosh
        if (v > bv) { bv = v; best = i; }
      }
      return best;
    }
    // --- effektlar: ag'darilish animatsiyasi, tushish, uchqunlar ---
    const flT = new Float32Array(N * N).fill(-1), flFrom = new Int8Array(N * N).fill(-1), parts = []; let clock = 0, drop = null;
    const api = {
      apply(sd, i, replay) {
        if (done || sd !== turn || !Number.isInteger(i) || i < 0 || i >= N * N || !moves(sd).includes(i)) return false; const f = flips(i, sd);
        if (!replay) { const x0 = i % N, y0 = (i / N) | 0; f.forEach((k) => { flFrom[k] = b[k]; flT[k] = clock + 0.12 + Math.max(Math.abs((k % N) - x0), Math.abs(((k / N) | 0) - y0)) * 0.08; }); drop = { i, t: 0, sd }; }
        b[i] = sd; f.forEach((k) => (b[k] = sd)); lastI = i; if (!replay) snd(sd ? 380 : 480, 0.06, 0.06, 'triangle');
        if (MULTI) { if (b.every((v) => v !== -1)) finish(); else turn = ctx.next(sd); }
        else if (moves(1 - sd).length) turn = 1 - sd; else if (moves(sd).length) { turn = sd; if (!replay) ctx.hint(rt('pass')); } else { finish(); }
        ctx.turn(done ? -1 : turn); return true;
      },
      quit(s) { if (done || ctx.active().length < 2) return; if (turn === s) { turn = ctx.next(s); ctx.turn(turn); } },
      bot,
    };
    const colOf = (s) => (MULTI ? ctx.col[s] : s ? '#F5F5F4' : '#1C1917');
    const mkC = (w, h) => { const o = document.createElement('canvas'), d = Math.min(3, devicePixelRatio || 1); o.width = Math.ceil(w * d); o.height = Math.ceil(h * d); const x = o.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [o, x]; };
    let bgC = null, bgK = '', spr = {};
    function drawBg() {
      const { s, m, ox, oy } = geo(); const [o, x] = mkC(c.W, c.H); bgC = o; spr = {};
      let sd = 5; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      const fx = ox - m, fy = oy - m, fw = N * s + 2 * m, rad = m * 0.6;
      x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 20; x.shadowOffsetY = 8; let gr = x.createLinearGradient(fx, fy, fx + fw, fy + fw); gr.addColorStop(0, '#6B4226'); gr.addColorStop(0.5, '#4A2A16'); gr.addColorStop(1, '#2E180A'); x.fillStyle = gr; rr(x, fx, fy, fw, fw, rad); x.fill(); x.restore();
      x.save(); rr(x, fx, fy, fw, fw, rad); x.clip(); x.globalAlpha = 0.15; x.strokeStyle = '#140802'; for (let i = 0; i < 40; i++) { x.lineWidth = 0.4 + R(); const yy = fy + R() * fw; x.beginPath(); x.moveTo(fx, yy); x.bezierCurveTo(fx + fw * 0.3, yy + (R() - 0.5) * 10, fx + fw * 0.7, yy + (R() - 0.5) * 10, fx + fw, yy + (R() - 0.5) * 8); x.stroke(); } x.restore();
      x.strokeStyle = 'rgba(255,214,160,.25)'; x.lineWidth = 1.5; rr(x, fx + 1, fy + 1, fw - 2, fw - 2, rad); x.stroke();
      gr = x.createRadialGradient(ox + (N * s) / 2, oy + (N * s) * 0.4, s, ox + (N * s) / 2, oy + (N * s) / 2, N * s * 0.75); gr.addColorStop(0, '#22A45D'); gr.addColorStop(0.7, '#157A40'); gr.addColorStop(1, '#0D5A2D'); x.fillStyle = gr; x.fillRect(ox, oy, N * s, N * s);
      x.globalAlpha = 0.07; for (let i = 0; i < 900; i++) { x.fillStyle = R() > 0.5 ? '#fff' : '#000'; x.fillRect(ox + R() * N * s, oy + R() * N * s, 1, 1); } x.globalAlpha = 1;
      for (let i = 0; i <= N; i++) { x.strokeStyle = 'rgba(4,40,18,.75)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(ox, oy + i * s); x.lineTo(ox + s * N, oy + i * s); x.moveTo(ox + i * s, oy); x.lineTo(ox + i * s, oy + s * N); x.stroke(); x.strokeStyle = 'rgba(120,230,160,.12)'; x.lineWidth = 1; x.beginPath(); x.moveTo(ox, oy + i * s + 1.5); x.lineTo(ox + s * N, oy + i * s + 1.5); x.moveTo(ox + i * s + 1.5, oy); x.lineTo(ox + i * s + 1.5, oy + s * N); x.stroke(); }
      x.fillStyle = 'rgba(4,40,18,.85)'; for (const [a, b2] of [[2, 2], [2, 6], [6, 2], [6, 6]]) { x.beginPath(); x.arc(ox + a * s, oy + b2 * s, Math.max(2.5, s * 0.06), 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 2; x.strokeRect(ox - 1, oy - 1, N * s + 2, N * s + 2);
      if (m >= 13) { x.font = `700 ${Math.round(m * 0.55)}px ${FONT}`; x.fillStyle = 'rgba(255,226,182,.85)'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let i = 0; i < N; i++) { x.fillText('abcdefgh'[i], ox + i * s + s / 2, oy + N * s + m / 2); x.fillText(String(i + 1), ox - m / 2, oy + i * s + s / 2); } }
    }
    function sprite(sd, s) { // 3D tosh: yon devor + gradient yuz + yaltirash
      const k = sd + '|' + Math.round(s); if (spr[k]) return spr[k];
      const [o, x] = mkC(s, s); x.scale(s / 100, s / 100); const base = colOf(sd), light = !MULTI && sd === 1;
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(53, 57, 40, 37, 0, 0, 7); x.fill();
      x.fillStyle = base; x.beginPath(); x.arc(50, 54, 40, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,.35)'; x.fill();
      x.fillStyle = base; x.beginPath(); x.arc(50, 48, 40, 0, 7); x.fill();
      let gr = x.createRadialGradient(36, 30, 2, 50, 48, 42); gr.addColorStop(0, light ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.42)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, light ? 'rgba(0,0,0,.2)' : 'rgba(0,0,0,.38)'); x.fillStyle = gr; x.fill();
      x.strokeStyle = light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.14)'; x.lineWidth = 2; x.beginPath(); x.arc(50, 48, 30, 0, 7); x.stroke();
      gr = x.createLinearGradient(0, 10, 0, 50); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(44, 26, 20, 10, -0.35, 0, 7); x.fill();
      return (spr[k] = o);
    }
    const pill = (x, y, w, h, sd, on) => {
      g.save(); if (on) { g.shadowColor = '#FDE047'; g.shadowBlur = 12; } g.fillStyle = on ? 'rgba(253,224,71,.18)' : 'rgba(0,0,0,.35)'; rr(g, x, y, w, h, h / 2); g.fill(); g.restore();
      g.strokeStyle = on ? '#FDE047' : 'rgba(255,255,255,.18)'; g.lineWidth = on ? 2 : 1; rr(g, x, y, w, h, h / 2); g.stroke();
      const d = h * 0.78; g.globalAlpha = ctx.out?.has(sd) ? 0.35 : 1; g.drawImage(sprite(sd, d), x + h * 0.12, y + (h - d) / 2, d, d);
      text(g, String(cnt(sd)), x + h + (w - h) / 2 - 4, y + h / 2 + 1, Math.round(h * 0.5), on ? '#FDE047' : '#fff'); if (sd === ctx.me) { g.fillStyle = '#FDE047'; g.beginPath(); g.arc(x + w - 7, y + 7, 3, 0, 7); g.fill(); } g.globalAlpha = 1;
    };
    const stop = loop((dt) => {
      clock += dt; const { s, ox, oy, hh } = geo(); const key = c.W + 'x' + c.H; if (key !== bgK) { bgK = key; drawBg(); }
      g.clearRect(0, 0, c.W, c.H); g.drawImage(bgC, 0, 0, c.W, c.H);
      // hisob paneli
      const ph = Math.min(hh - 6, 38), pw = Math.min(MULTI ? 86 : 110, (c.W - 16) / NP - 8);
      for (let k = 0; k < NP; k++) pill(c.W / 2 + (k - (NP - 1) / 2) * (pw + 8) - pw / 2, (hh - ph) / 2 + 2, pw, ph, k, k === turn && !done);
      const hint = !done && turn === ctx.me ? moves(ctx.me) : [];
      const pu = 0.5 + 0.5 * Math.sin(clock * 5);
      for (const i of hint) { const x = ox + (i % N) * s + s / 2, y = oy + ((i / N) | 0) * s + s / 2; g.globalAlpha = 0.22 + 0.18 * pu; g.drawImage(sprite(ctx.me, s * 0.5), x - s * 0.25, y - s * 0.25, s * 0.5, s * 0.5); g.globalAlpha = 1; }
      for (let i = 0; i < N * N; i++) {
        if (b[i] < 0) continue; const x = ox + (i % N) * s, y = oy + ((i / N) | 0) * s, pd = s * 0.06, d = s - 2 * pd;
        if (drop && drop.i === i) { drop.t += dt * 5; const k = Math.min(1, drop.t), z = 1 + (1 - k) * 0.5; g.globalAlpha = Math.min(1, 0.3 + k); g.drawImage(sprite(b[i], d), x + s / 2 - (d * z) / 2, y + s / 2 - (d * z) / 2 - (1 - k) * s * 0.3, d * z, d * z); g.globalAlpha = 1; if (k >= 1) { drop = null; for (let q = 0; q < 14; q++) { const a = (q / 14) * 6.28; parts.push({ x: x + s / 2, y: y + s / 2, vx: Math.cos(a) * s * 2.2, vy: Math.sin(a) * s * 2.2, l: 0.35, c: q % 2 ? '#FDE68A' : colOf(b[i]), r: s * 0.04 }); } } continue; }
        if (flT[i] >= 0) {
          const p = (clock - flT[i]) / 0.34;
          if (p >= 1) flT[i] = -1;
          else { const ph2 = Math.max(0, p), sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * ph2))), cl = ph2 < 0.5 ? flFrom[i] : b[i], lift = Math.sin(Math.PI * ph2) * s * 0.14; g.save(); g.translate(x + s / 2, y + s / 2 - lift); g.scale(sx, 1); g.drawImage(sprite(cl, d), -d / 2, -d / 2, d, d); g.restore(); continue; }
        }
        g.drawImage(sprite(b[i], d), x + pd, y + pd, d, d);
      }
      if (lastI >= 0 && b[lastI] >= 0 && !drop) { const x = ox + (lastI % N) * s + s / 2, y = oy + ((lastI / N) | 0) * s + s / 2 - s * 0.03; g.fillStyle = MULTI || b[lastI] === 1 ? '#EF4444' : '#F87171'; g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, s * 0.075, 0, 7); g.fill(); g.stroke(); }
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.l -= dt; if (q.l <= 0) { parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9; g.globalAlpha = Math.min(1, q.l * 3); g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    });
    ctx.turn(0);
    return { ...api, stop, resize: () => { cv.fit(); bgK = ''; } };
  };


  /* ---- o'yin xonasi (server bilan bog'lanish) ---- */
  const Room = { cur: null, inst: null, moves: [], off: null };
  const sock = () => (typeof S !== 'undefined' ? S.socket : null);
  const emitA = (ev, p) => new Promise((res, rej) => { const s = sock(); if (!s) return rej(new Error('offline')); s.timeout(15000).emit(ev, p, (err, r) => (err ? rej(err) : r?.error ? rej(Object.assign(new Error(r.error), { r })) : res(r))); });
  const uname = (u) => (u ? S.users?.get(u.id)?.name || u.name || '' : '');
  function mpMeta(id) { return MPL.find((x) => x.id === id); }
  // Yakka rejim: siz + botlar (server kerak emas). Har bir o'yin ctx.bots dagi o'rinlarni o'zi boshqaradi
  const BOTN = { uz: 'Bot', ru: 'Бот', en: 'Bot' };
  function openLocal(game, n) {
    ensurePage(); closeRoom(true); Page.inst?.stop?.(); Page.inst = null; Page.cur = null;
    const meta = mpMeta(game); if (!meta) return; n = meta.two ? 2 : Math.max(2, Math.min(4, n || 2));
    const bots = Array.from({ length: n - 1 }, (_, i) => ({ id: 9e8 + i + 1, name: `${BOTN[L()] || 'Bot'} ${i + 1} 🤖`, bot: 1 }));
    showRoom({ id: 'local-' + Date.now().toString(36), game, local: 1, seat: 0, n, status: 'play', moves: [], users: [S.me, ...bots], out: [], chats: [], draw: n > 2 ? 9 : 2 });
  }
  async function openRoom(roomId) {
    ensurePage(); closeRoom(true);
    let r; try { r = (await emitA('game:join', { room: roomId })).room; } catch (e) { toast(mt('not_avail')); return; }
    Page.inst?.stop?.(); Page.inst = null; Page.cur = null;
    showRoom(r);
  }
  function showRoom(r) {
    const meta = mpMeta(r.game); if (!meta) return;
    Room.cur = r; Room.moves = r.moves.slice();
    $('#gm-title').textContent = `${meta.e} ${gname(meta)}`;
    $('#gm-page').style.setProperty('--g1', meta.c[0]); $('#gm-page').style.setProperty('--g2', meta.c[1]);
    $('#gm-page').classList.remove('hidden'); $('#gm-page').classList.add('mp'); $('#gm-over').classList.add('hidden');
    $('#gm-score').parentElement.classList.add('hidden'); $('#gm-best').parentElement.classList.add('hidden');
    bindSock(); build();
  }
  function players(r) { return Array.from({ length: r.n || 2 }, (_, i) => uname(r.users?.[i]) || '…'); }
  const PCOL = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B'];
  function build() {
    const r = Room.cur; Room.inst?.stop?.(); Room.inst = null;
    const st = $('#gm-stage'); st.innerHTML = ''; st.className = 'gm-stage';
    const names = players(r);
    const meta = mpMeta(r.game);
    const pcell = (i) => `<div class="mp-p" data-s="${i}" style="--pc:${PCOL[i]}">${r.users[i] ? avatar({ ...r.users[i], online: false }, 'sm') : '<span class="mp-q">?</span>'}<b>${esc(names[i])}</b><i></i></div>`;
    const N = r.n || 2;
    $('#gm-extra').innerHTML = `<div class="mp-bar${N > 2 ? ' mp-n' : ''}">${N > 2 ? names.map((_, i) => pcell(i)).join('') : pcell(0) + '<span class="mp-vs">VS</span>' + pcell(1)}</div><div class="mp-turn" id="mp-turn"></div>`;
    (r.out || []).forEach((s) => $(`.mp-p[data-s="${s}"]`)?.classList.add('out'));
    $('#gm-info').innerHTML = r.seat >= 0 && r.status === 'play' && !r.local ? `<button class="mp-resign" id="mp-resign">🏳️</button>` : '';
    $('#mp-resign')?.addEventListener('click', () => { if (confirm(mt('resign_q'))) emitA('game:over', { room: r.id, resign: true }).then((x) => { if (x?.out) { $('#gm-info').innerHTML = ''; } }).catch(() => toast(t('net_err'))); });
    if (r.status === 'wait') {
      const joined = r.users.filter(Boolean).length;
      st.innerHTML = `<div class="mp-wait"><div class="mp-spin">${meta.e}</div><h3>${esc(mt('wait'))}</h3>${N > 2 ? `<p class="mp-cnt"><b>${joined}/${N}</b> ${esc(mt('joined'))}</p>` : ''}<p>${esc(mt('wait_sub'))}</p>${N > 2 && r.seat === 0 && joined >= 2 ? `<button class="btn-primary" id="mp-start">▶ ${esc(mt('start_now').replace('{n}', joined))}</button>` : ''}</div>`;
      $('#mp-start')?.addEventListener('click', () => emitA('game:start', { room: r.id }).catch(() => toast(t('net_err'))));
      return;
    }
    let overShown = false;
    const out = new Set(r.out || []);
    const LOCAL = !!r.local, BOTS = new Set(LOCAL ? Array.from({ length: N - 1 }, (_, i) => i + 1) : []);
    const ctx = {
      local: LOCAL, bots: BOTS, isBot: (s) => BOTS.has(s), seed: [...String(r.id)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7),
      me: r.seat, names, secret: r.secret, n: N, DRAW: r.draw ?? (N > 2 ? 9 : 2), out, col: PCOL,
      active: () => Array.from({ length: N }, (_, i) => i).filter((i) => !out.has(i)),
      next: (s) => { for (let k = 1; k <= N; k++) { const q = (s + k) % N; if (!out.has(q)) return q; } return s; },
      send: (m) => {
        if (!Room.inst) return; const n = Room.moves.length;
        if (!Room.inst.apply(r.seat, m, false)) return;
        Room.moves.push({ s: r.seat, m });
        if (LOCAL) return;
        emitA('game:move', { room: r.id, n, m }).catch((e) => { resync(); if (e?.message !== 'sync') toast(t('net_err')); });
      },
      over: (w) => { if (overShown) return; if (r.seat >= 0 && !LOCAL) emitA('game:over', { room: r.id, w }).catch(() => {}); setTimeout(() => showResult(w), 700); },
      turn: (s, txt) => {
        $$('.mp-p').forEach((p) => p.classList.toggle('on', +p.dataset.s === s));
        const el = $('#mp-turn'); if (!el) return;
        el.textContent = Room.turnTxt = txt || (s < 0 ? '' : r.seat < 0 ? mt('spectate') : s === r.seat ? mt('your') : N > 2 ? mt('their_n').replace('{n}', names[s]) : mt('their'));
        el.classList.toggle('me', s === r.seat && s >= 0);
        if (BOTS.has(s)) { clearTimeout(Room.botT); const inst0 = Room.inst; Room.botT = setTimeout(() => { if (Room.ctx !== ctx || overShown || !Room.inst || Room.inst !== inst0 && inst0) return; const m = Room.inst.bot?.(s); if (m != null && Room.inst.apply(s, m, false)) Room.moves.push({ s, m }); }, 650 + Math.random() * 600); }
      },
      hint: (s, keep) => { const el = $('#mp-turn'); if (el) { el.textContent = s; el.classList.add('flash'); clearTimeout(Room.hintT); Room.hintT = setTimeout(() => { el.classList.remove('flash'); if (!keep && Room.turnTxt != null && el.textContent === s) el.textContent = Room.turnTxt; }, 1600); } },
      secretSave: (data) => emitA('game:secret', { room: r.id, data }),
      rt: meta.rt && LOCAL ? { send: () => {} } : meta.rt ? { send: (d, to) => { const s = sock(); if (s && r.seat >= 0) s.volatile.emit('game:rt', { room: r.id, d, ...(Number.isInteger(to) ? { to } : {}) }); } } : null,
    };
    const showResult = (w) => {
      if (overShown) return; overShown = true;
      const D = ctx.DRAW; const txt = w === D ? mt('draw') : r.seat < 0 || N > 2 && w !== r.seat ? mt('won_by').replace('{n}', names[w]) : w === r.seat ? mt('you_won') : mt('you_lost');
      const ov = $('#gm-over');
      ov.innerHTML = `<div class="gm-card"><div class="gm-big">${w === D ? '🤝' : w === r.seat ? '🏆' : r.seat < 0 ? '🏁' : '😔'}</div><h3>${esc(txt)}</h3>
        ${r.seat >= 0 ? `<button class="btn-primary" id="mp-again">${esc(mt('rematch'))}</button>` : ''}<div class="gm-row"><button id="mp-see">${esc(mt('watch'))}</button><button id="mp-top">🏆 ${tg('top')}</button></div></div>`;
      ov.classList.remove('hidden');
      if (w === r.seat) snd(1046, 0.4, 0.08);
      $('#mp-again')?.addEventListener('click', () => (r.local ? openLocal(r.game, N) : invite(r.game, r.chats?.length > 1 ? r.chats : r.chatId, N)));
      $('#mp-see').onclick = () => ov.classList.add('hidden');
      $('#mp-top').onclick = () => showTopMP(r.game);
      $('#gm-info').innerHTML = '';
    };
    Room.showResult = showResult;
    Room.ctx = ctx;
    const quitSeat = (s, replay) => { out.add(s); $(`.mp-p[data-s="${s}"]`)?.classList.add('out'); Room.inst?.quit?.(s, replay); if (!replay) ctx.hint('🏳️ ' + names[s]); };
    Room.quitSeat = quitSeat;
    requestAnimationFrame(() => {
      Room.inst = MPI[r.game](st, ctx);
      for (const mv of Room.moves) { if (mv.m?.quit) { quitSeat(mv.s, true); continue; } if (!meta.rt) Room.inst.apply(mv.s, mv.m, true); }
      Room.inst.ready?.();
      if (r.status === 'over' && r.winner != null) showResult(r.winner);
    });
  }
  async function resync() {
    const r = Room.cur; if (!r) return;
    try { const nr = (await emitA('game:join', { room: r.id })).room; Room.cur = nr; Room.moves = nr.moves.slice(); build(); } catch {}
  }
  function bindSock() {
    const s = sock(); if (!s || Room.off) return;
    const onMove = (ev) => {
      const r = Room.cur; if (!r || ev.room !== r.id || !Room.inst) return;
      if (ev.i < Room.moves.length) return;
      if (ev.i > Room.moves.length) return resync();
      Room.moves.push({ s: ev.s, m: ev.m });
      if (ev.m?.quit) { Room.quitSeat?.(ev.s, false); return; }
      if (!Room.inst.apply(ev.s, ev.m, false)) resync();
    };
    const onState = (st) => {
      GameCards.set(st.id, st);
      const r = Room.cur; if (!r || st.id !== r.id) return;
      const wasWait = r.status === 'wait';
      Room.cur = { ...r, ...st, moves: st.moves };
      if (wasWait) { Room.moves = st.moves.slice(); build(); }
      else if (st.status === 'over') { $('#gm-info').innerHTML = ''; Room.showResult?.(st.winner); }
    };
    const onConn = () => { if (Room.cur && !mpMeta(Room.cur.game)?.rt) resync(); };
    const onRt = (ev) => { if (Room.cur && ev.room === Room.cur.id) Room.inst?.rt?.(ev.s, ev.d); };
    s.on('game:move', onMove); s.on('game:state', onState); s.on('connect', onConn); s.on('game:rt', onRt);
    Room.off = () => { s.off('game:move', onMove); s.off('game:state', onState); s.off('connect', onConn); s.off('game:rt', onRt); Room.off = null; };
  }
  function closeRoom(silent) {
    clearTimeout(Room.botT);
    Room.inst?.stop?.(); Room.inst = null; Room.cur = null; Room.off?.();
    $('#gm-page')?.classList.remove('mp');
    $('#gm-score')?.parentElement.classList.remove('hidden'); $('#gm-best')?.parentElement.classList.remove('hidden');
    if (!silent) renderLobby();
  }
  async function invite(game, chatId, nPre) {
    const meta = mpMeta(game); const multi = !meta.two;
    const go = async (cids, n) => {
      closeModal();
      try { const r = await emitA('game:invite', { chats: cids, game, n }); toast(mt('sent')); Page.inst?.stop?.(); Page.inst = null; ensurePage(); closeRoom(true); showRoom(r.room); }
      catch (e) { toast(e.message === 'blocked' ? t('blocked_cant') || t('not_sent') : t('not_sent')); }
    };
    if (chatId) return go(Array.isArray(chatId) ? chatId : [chatId], nPre || 2);
    const list = [...S.chats.values()].filter((c) => c.type !== 'channel' && !c.self).sort((a, b) => (b.last?.created_at || 0) - (a.last?.created_at || 0)).slice(0, 80);
    let n = 2; const pick = new Set();
    modal(`<h3>${meta.e} ${esc(mt('invite'))} <button class="icon-btn" data-close>${icon('close')}</button></h3>
      ${multi ? `<div class="mp-ncount"><span>${esc(mt('players'))}</span>${[2, 3, 4].map((k) => `<button data-n="${k}" class="${k === 2 ? 'on' : ''}">👤 ${k}</button>`).join('')}</div><p class="mp-nhint" id="mp-nhint"></p>` : ''}
      <div class="chat-pick${multi ? ' multi' : ''}">${list.map((c) => `<button data-cid="${c.id}" data-grp="${c.type === 'private' ? 0 : 1}">${chatAvatar(c, 'sm')}<b>${esc(chatTitle(c))}</b>${multi ? '<i class="mp-chk"></i>' : ''}</button>`).join('')}</div>
      ${multi ? `<button class="btn-primary mp-send" id="mp-send" disabled>${esc(mt('send_inv'))}</button>` : ''}`);
    const card = $('#modal-card');
    const paint = () => {
      card.querySelectorAll('[data-n]').forEach((b) => b.classList.toggle('on', +b.dataset.n === n));
      card.querySelectorAll('[data-cid]').forEach((b) => b.classList.toggle('on', pick.has(+b.dataset.cid)));
      const hasGrp = [...pick].some((id) => S.chats.get(id)?.type !== 'private');
      const need = n - 1, priv = [...pick].filter((id) => S.chats.get(id)?.type === 'private').length;
      const h = $('#mp-nhint'); if (h) h.textContent = hasGrp ? mt('hint_grp').replace('{n}', n) : mt('hint_pick').replace('{k}', priv).replace('{n}', need);
      const sb = $('#mp-send'); if (sb) sb.disabled = !pick.size;
    };
    card.onclick = (e) => {
      const nb = e.target.closest('[data-n]'); if (nb) { n = +nb.dataset.n; while (pick.size > n - 1) pick.delete([...pick].pop()); return paint(); }
      if (e.target.closest('#mp-send')) { const priv = [...pick].filter((id) => S.chats.get(id)?.type === 'private').length; return go([...pick], Math.max(n, 1 + priv)); }
      const b = e.target.closest('[data-cid]'); if (!b) return; const id = +b.dataset.cid;
      if (!multi) return go([id], 2);
      if (pick.has(id)) pick.delete(id); else { if (pick.size >= Math.max(1, n - 1)) { if (n < 4) n++; else return toast(mt('max4')); } pick.add(id); }
      paint();
    };
    paint();
  }
  async function showTopMP(game) {
    const meta = mpMeta(game);
    modal(`<h3>${meta.e} ${tg('top_title')} <button class="icon-btn" data-close>${icon('close')}</button></h3><div class="gm-top" id="gm-toplist"><p class="empty-note">…</p></div>`);
    try {
      const r = await api('/api/games/top?game=w_' + game); const medal = ['🥇', '🥈', '🥉'];
      $('#gm-toplist').innerHTML = r.top.length ? r.top.map((x, i) => `<div class="gm-tr${x.user.id === S.me.id ? ' me' : ''}"><span class="gm-pos">${medal[i] || i + 1}</span>${avatar({ ...x.user, online: false }, 'sm')}<b>${esc(S.users.get(x.user.id)?.name || x.user.name || '')}</b><span class="gm-pts">${x.best} ${esc(mt('wins'))}</span></div>`).join('') : `<p class="empty-note">${esc(tg('empty_top'))}</p>`;
    } catch { $('#gm-toplist').innerHTML = `<p class="empty-note">${esc(t('net_err'))}</p>`; }
  }
  // chatdagi taklif kartochkalari holati
  const GameCards = {
    map: new Map(), q: new Set(), tm: null,
    set(id, st) { this.map.set(id, st); this.paint(id); },
    want(id) { if (this.map.has(id)) return; this.q.add(id); clearTimeout(this.tm); this.tm = setTimeout(() => this.flush(), 120); },
    async flush() { const ids = [...this.q]; this.q.clear(); if (!ids.length) return; try { const r = await emitA('game:peek', { ids }); Object.entries(r || {}).forEach(([k, v]) => this.set(k, v)); } catch {} },
    paint(id) {
      const st = this.map.get(id); if (!st) return;
      document.querySelectorAll(`[data-groom="${id}"]`).forEach((el) => {
        const me = S.me?.id, seat = st.pl ? st.pl.indexOf(me) : st.a === me ? 0 : st.b === me ? 1 : -1; const D = st.draw ?? 2;
        const s = el.querySelector('.gc-st'), b = el.querySelector('.gc-go');
        if (s) s.textContent = st.status === 'over' ? (st.winner === D ? mt('draw') : seat >= 0 ? (st.winner === seat ? mt('you_won') : mt('you_lost')) : mt('status_over')) : st.status === 'play' ? mt('status_play') : mt('status_wait') + (st.n > 2 ? ` · ${st.joined}/${st.n}` : '');
        if (b) b.textContent = st.status === 'over' || (seat < 0 && st.status === 'play') ? mt('watch') : mt('play');
      });
    },
  };
  function cardHTML(m) {
    const gm = m.meta?.game || {}; const meta = mpMeta(gm.g); if (!meta) return '';
    GameCards.want(gm.room); setTimeout(() => GameCards.paint(gm.room), 0);
    return `<div class="game-card" data-groom="${esc(gm.room)}" style="--g1:${meta.c[0]};--g2:${meta.c[1]}"><span class="gc-e">${meta.e}</span><div class="gc-t"><small>${esc(mt('invited'))}</small><b>${esc(gname(meta))}</b><span class="gc-st">…</span></div><button class="gc-go">${esc(mt('play'))}</button></div>`;
  }
  async function myRooms() { try { return (await emitA('game:mine', {})).rooms || []; } catch { return []; } }

  window.BirgaMP = { list: MPL, openLocal, chooseMode, openRoom, invite, cardHTML, GameCards, mt, gname };

  // O'yin rejimini tanlash: yakka (botlar bilan) yoki do'stlar bilan
  const MODE_T = {
    uz: { title: 'Qanday o‘ynaysiz?', solo: 'Yakka — botlar bilan', solo_sub: 'Hozir boshlang, raqiblar — kompyuter', friends: 'Do‘stlar bilan', friends_sub: 'Chatdan 1–3 do‘stingizni taklif qiling', total: 'O‘yinchilar soni' },
    ru: { title: 'Как будете играть?', solo: 'Одиночная — с ботами', solo_sub: 'Начните сразу, соперники — компьютер', friends: 'С друзьями', friends_sub: 'Пригласите 1–3 друзей из чата', total: 'Игроков' },
    en: { title: 'How do you want to play?', solo: 'Solo — with bots', solo_sub: 'Start now against computer opponents', friends: 'With friends', friends_sub: 'Invite 1–3 friends from your chats', total: 'Players' },
  };
  const md = (k) => (MODE_T[L()] || PK('mode') || MODE_T.en)[k] || MODE_T.en[k];
  function chooseMode(game) {
    const meta = mpMeta(game); if (!meta?.bot) return invite(game);
    let n = 2;
    modal(`<h3>${meta.e} ${esc(md('title'))} <button class="icon-btn" data-close>${icon('close')}</button></h3>
      <div class="gm-modes"><div class="gm-mode solo"><b>🤖 ${esc(md('solo'))}</b><small>${esc(md('solo_sub'))}</small>
        ${meta.two ? '' : `<div class="mp-ncount"><span>${esc(md('total'))}</span>${[2, 3, 4].map((k) => `<button data-n="${k}" class="${k === 2 ? 'on' : ''}">👤 ${k}</button>`).join('')}</div>`}
        <button class="btn-primary" id="gm-solo">▶ ${esc(mt('play'))}</button></div>
      <button class="gm-mode friends" id="gm-friends"><b>👥 ${esc(md('friends'))}</b><small>${esc(md('friends_sub'))}</small></button></div>`);
    const card = $('#modal-card');
    card.onclick = (e) => {
      const nb = e.target.closest('[data-n]'); if (nb) { n = +nb.dataset.n; card.querySelectorAll('[data-n]').forEach((b) => b.classList.toggle('on', b === nb)); return; }
      if (e.target.closest('#gm-solo')) { closeModal(); openLocal(game, n); return; }
      if (e.target.closest('#gm-friends')) { closeModal(); setTimeout(() => invite(game), 50); }
    };
  }
  try { const st = document.createElement('style'); st.textContent = '.gm-tile{position:relative}.gm-new{position:absolute;top:8px;right:8px;background:#EF4444;color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:8px;letter-spacing:.04em}.gm-room{position:relative}.gm-x{margin-left:6px;width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:50%;background:rgba(239,68,68,.14);color:#EF4444;font-weight:800;font-size:14px}.gm-x:hover{background:rgba(239,68,68,.3)}.gm-room.gone{opacity:.4;pointer-events:none}.gm-modes{display:grid;gap:10px}.gm-mode{display:flex;flex-direction:column;gap:6px;text-align:left;padding:14px;border-radius:16px;border:1px solid var(--line);background:var(--panel-2,var(--panel));color:inherit}.gm-mode b{font-size:16px}.gm-mode small{color:var(--muted)}.gm-mode.solo{background:linear-gradient(135deg,rgba(31,107,255,.12),rgba(138,43,226,.12))}.gm-mode .btn-primary{margin-top:4px}.gm-mode .mp-ncount{margin:4px 0}'; document.head.appendChild(st); } catch {}

  // Lobbi bo'limlari (tartib bilan)
  const GCATS = [['race', ['drag', 'traffic', 'race']], ['sport', ['shootout', 'fb4', 'hockey', 'pong', 'pool']], ['fight', ['fight', 'tanks', 'duel', 'sumo']], ['board', ['chess', 'checkers', 'reversi']]];
  const GCAT_T = { uz: { race: '🏎️ Poyga', sport: '⚽ Sport', fight: '⚔️ Jang va harakat', board: '♟️ Stol o‘yinlari', sub: 'Yakka (botlar bilan) yoki 2–4 do‘st bilan o‘ynang' }, ru: { race: '🏎️ Гонки', sport: '⚽ Спорт', fight: '⚔️ Бои и экшн', board: '♟️ Настольные', sub: 'Играйте одни (с ботами) или с 2–4 друзьями' }, en: { race: '🏎️ Racing', sport: '⚽ Sports', fight: '⚔️ Fighting & action', board: '♟️ Board games', sub: 'Play solo with bots or with 2–4 friends' } };
  const gcat = (k) => (GCAT_T[L()] || GCAT_T.en)[k];
  const NEWG = new Set(['drag', 'shootout', 'traffic', 'fight', 'pool']);
  /* ---------- O'yinlar bo'limi (lobbi) ---------- */
  async function renderLobby() {
    const el = $('#games-grid'); if (!el) return;
    const tile = (m, mp) => `<button class="gm-tile${m.big && !mp ? ' big' : ''}" data-${mp ? 'mp' : 'g'}="${m.id}" style="--g1:${m.c[0]};--g2:${m.c[1]}"><span class="gm-e">${m.e}</span><b>${esc(gname(m))}</b><small data-sc="${mp ? 'w_' + m.id : m.id}">🏆 ${Page.best[mp ? 'w_' + m.id : m.id] || 0}${mp ? ' ' + esc(mt('wins')) : ''}</small>${mp ? `<span class="gm-2p">${m.bot ? '🤖 ' : ''}👥 ${m.two ? 2 : '2–4'}</span>` : ''}${NEWG.has(m.id) ? '<span class="gm-new">NEW</span>' : ''}</button>`;
    el.innerHTML = `<div class="gm-act hidden" id="gm-act"></div>
      <p class="gm-hs">${esc(gcat('sub'))}</p>${GCATS.map(([k, ids]) => { const ms = ids.map(mpMeta).filter(Boolean); return ms.length ? `<h4 class="gm-h">${esc(gcat(k))}</h4><div class="gm-grid">${ms.map((m) => tile(m, true)).join('')}</div>` : ''; }).join('')}${(() => { const rest = MPL.filter((m) => !GCATS.some(([, ids]) => ids.includes(m.id))); return rest.length ? `<div class="gm-grid">${rest.map((m) => tile(m, true)).join('')}</div>` : ''; })()}
      <h4 class="gm-h">🎮 ${esc(mt('solo'))}</h4><div class="gm-grid">${GAMES.map((m) => tile(m)).join('')}</div>`;
    el.onclick = async (e) => {
      const hx = e.target.closest('[data-hide]');
      if (hx) { e.stopPropagation(); const id = hx.dataset.hide, row = hx.closest('.gm-room'); if (!confirm(mt('hide_q'))) return; row?.classList.add('gone');
        try { await emitA('game:over', { room: id, resign: true }).catch(() => {}); await emitA('game:hide', { room: id }); row?.remove(); if (!$('#gm-act .gm-room')) $('#gm-act')?.classList.add('hidden'); } catch { row?.classList.remove('gone'); toast(t('net_err')); } return; }
      const b = e.target.closest('[data-g],[data-mp],[data-room]'); if (!b) return;
      if (b.dataset.g) startGame(b.dataset.g); else if (b.dataset.mp) chooseMode(b.dataset.mp); else openRoom(b.dataset.room);
    };
    try { const mine = await api('/api/games/mine'); Object.assign(Page.best, mine); el.querySelectorAll('[data-sc]').forEach((x) => { const k = x.dataset.sc; x.textContent = '🏆 ' + (Page.best[k] || 0) + (k.startsWith('w_') ? ' ' + mt('wins') : ''); }); } catch {}
    const rooms = await myRooms(); const act = $('#gm-act');
    if (act && rooms.length) {
      act.innerHTML = `<h4 class="gm-h">⏳ ${esc(mt('active'))}</h4>` + rooms.map((r) => { const m = mpMeta(r.game); const op = r.users.filter((u, i) => u && i !== r.seat).map(uname).join(', '); const myTurn = r.turn === r.seat;
        return `<button class="gm-room" data-room="${r.id}"><span class="gm-e2" style="background:linear-gradient(135deg,${m.c[0]},${m.c[1]})">${m.e}</span><span class="gm-rt"><b>${esc(gname(m))}</b><small>${op ? esc(op) : esc(mt('status_wait'))}</small></span>${myTurn ? `<i class="gm-dot"></i>` : ''}<span class="gm-go">${esc(mt('open'))} ›</span><span class="gm-x" role="button" data-hide="${r.id}" aria-label="✕">✕</span></button>`; }).join('');
      act.classList.remove('hidden');
    }
  }


  /* ================= Birga Poyga (jonli, 2 kishi): har kim o'z mashinasini boshqaradi, holat raqibga uzatiladi ================= */
  MPL.push({ id: 'race', bot: 1, e: '🏎️', c: ['#DC2626', '#111827'], rt: 1, big: 1, n: { uz: 'Birga Poyga (jonli)', ru: 'Гонки (онлайн)', en: 'Birga Racing (live)' } });
  const RACE_T = { uz: { lap: 'Davra', pos: 'O‘rin', nitro: 'Nitro', fin: '🏁 Marra!', off: 'Yo‘ldan chiqdingiz', wrong: '↩️ Teskari yo‘nalish' }, ru: { lap: 'Круг', pos: 'Место', nitro: 'Нитро', fin: '🏁 Финиш!', off: 'Вы вне трассы', wrong: '↩️ Не туда' }, en: { lap: 'Lap', pos: 'Pos', nitro: 'Nitro', fin: '🏁 Finish!', off: 'Off track', wrong: '↩️ Wrong way' } };
  const rct = (k) => (RACE_T[L()] || PK('race') || RACE_T.en)[k] || RACE_T.en[k];
  MPI.race = (stage, ctx) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, null);
    const pad = padUI(stage, [{ id: 'gas', t: '⛽', cls: 'big' }, { id: 'brake', t: '🛑' }, { id: 'nitro', t: '🔥' }]);
    const LAPS = 3, WTR = 70, ME = Math.max(0, ctx.me), SPEC = ctx.me < 0, N = ctx.n > 2 ? ctx.n : 2, MULTI = N > 2;
    // trassa: silliq yopiq egri chiziq (Catmull-Rom)
    const CP = [[0, 0], [520, -40], [880, 120], [940, 420], [700, 560], [520, 420], [300, 520], [120, 760], [-260, 720], [-420, 420], [-300, 160], [-460, -120], [-260, -300]];
    const P = []; const n = CP.length;
    for (let i = 0; i < n; i++) { const p0 = CP[(i - 1 + n) % n], p1 = CP[i], p2 = CP[(i + 1) % n], p3 = CP[(i + 2) % n]; for (let k = 0; k < 40; k++) { const t2 = k / 40, t3 = t2 * t2, t4 = t3 * t2; P.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t2 + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t3 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t4), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t2 + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t3 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t4)]); } }
    const NP = P.length, S = [0]; for (let i = 1; i <= NP; i++) S.push(S[i - 1] + Math.hypot(P[i % NP][0] - P[i - 1][0], P[i % NP][1] - P[i - 1][1])); const LEN = S[NP];
    const dirAt = (i) => { const a = P[i % NP], b = P[(i + 1) % NP]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
    const nearest = (x, y, hint) => { let bi = hint, bd = 1e12; for (let k = -30; k <= 30; k++) { const i = (hint + k + NP) % NP, d = (P[i][0] - x) ** 2 + (P[i][1] - y) ** 2; if (d < bd) { bd = d; bi = i; } } if (bd > 300 * 300) for (let i = 0; i < NP; i++) { const d = (P[i][0] - x) ** 2 + (P[i][1] - y) ** 2; if (d < bd) { bd = d; bi = i; } } return [bi, Math.sqrt(bd)]; };
    // start: 2 qatorli setka (0,1 — oldinda; 2,3 — orqada)
    const a0 = dirAt(0), side = (s, row = 0) => [P[0][0] - Math.cos(a0) * (40 + row * 62) + Math.cos(a0 + Math.PI / 2) * 22 * s, P[0][1] - Math.sin(a0) * (40 + row * 62) + Math.sin(a0 + Math.PI / 2) * 22 * s];
    const mkCar = (seat) => { const [x, y] = side(seat % 2 ? 1 : -1, seat >> 1); return { seat, x, y, a: a0, v: 0, idx: 0, lap: 0, prog: 0, nitro: 3, nT: 0, fin: 0, out: 0, skid: [], snap: null, prev: null, t: 0, heard: 0 }; };
    const cars = Array.from({ length: N }, (_, i) => mkCar(i)); for (const o of cars) { o.idx = nearest(o.x, o.y, NP - 1)[0]; o.lap = o.idx > NP / 2 ? -1 : 0; }
    const me = cars[ME], others = cars.filter((o) => o !== me), op = cars[1 - ME];
    let started = false, cd = 3.4, time = 0, over = false, msg = '', msgT = 0, wrongT = 0, sendT = 0, order = [], endT = 15, ordT = 0, endW = null;
    // umumiy fizika: o'yinchi ham, botlar ham shu funksiya bilan yuradi
    const drive = (o, steer, gas, brake, dt) => {
      const [idx, off] = nearest(o.x, o.y, o.idx); const onTrack = off < WTR;
      const vmax = (onTrack ? 300 : 120) * (o.nT > 0 ? 1.45 : 1) * (o.sk || 1); o.nT = Math.max(0, o.nT - dt);
      if (!o.fin && gas) o.v += (o.nT > 0 ? 340 : 190) * dt; else if (brake) o.v -= 320 * dt; else o.v -= 70 * dt * Math.sign(o.v);
      if (o.v > vmax) o.v -= (onTrack ? 260 : 420) * dt; o.v = Math.max(-80, Math.min(vmax + 40, o.v)); if (o.fin) o.v *= Math.pow(0.4, dt);
      const sr = steer * Math.min(1, Math.abs(o.v) / 90) * (2.7 - Math.min(1.2, Math.abs(o.v) / 300)) * Math.sign(o.v || 1); o.a += sr * dt;
      o.x += Math.cos(o.a) * o.v * dt; o.y += Math.sin(o.a) * o.v * dt;
      if (Math.abs(steer) > 0.6 && Math.abs(o.v) > 200) { o.skid.push([o.x, o.y]); if (o.skid.length > 60) o.skid.shift(); if (Math.random() < 0.4) smoke(o.x - Math.cos(o.a) * 18, o.y - Math.sin(o.a) * 18, 'rgba(229,231,235,'); }
      else if (o.skid.length && Math.random() < 0.1) o.skid.shift();
      if (!onTrack && Math.abs(o.v) > 60 && Math.random() < 0.5) smoke(o.x - Math.cos(o.a) * 18, o.y - Math.sin(o.a) * 18, 'rgba(146,104,58,');
      if (!onTrack && off > WTR + 70) { const q = P[idx]; o.x += (q[0] - o.x) * dt * 2; o.y += (q[1] - o.y) * dt * 2; } // juda uzoqqa ketmasin
      if (o.idx > NP * 0.8 && idx < NP * 0.2) o.lap++; else if (o.idx < NP * 0.2 && idx > NP * 0.8) o.lap--;
      o.idx = idx; o.prog = o.lap * LEN + S[idx]; return idx;
    };
    // effektlar: shina tutuni / tuproq (dunyo koordinatasida)
    const SM = []; const smoke = (x, y, col) => { SM.push({ x, y, t: 0.7, r: 6 + Math.random() * 6, col }); if (SM.length > 90) SM.shift(); };
    // manzara: trassadan uzoqda daraxtlar (deterministik)
    const TREES = []; { let sd = 11; const rn = () => ((sd = (sd * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 400 && TREES.length < 90; i++) { const x = -700 + rn() * 1900, y = -500 + rn() * 1500, [, d] = nearest(x, y, 0); if (d > WTR + 70) TREES.push([x, y, 14 + rn() * 16, rn() < 0.5 ? '#166534' : '#15803D']); } }
    // botlar (faqat yakka rejimda, uy egasida): poyga chizig'i bo'ylab oldinga qarab rul buradi, burilishdan oldin sekinlaydi, to'g'ri yo'lda nitro
    const nrm = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const BOTC = SPEC ? [] : [...(ctx.bots || [])].filter((s) => cars[s]).map((s) => cars[s]); let clk = 0;
    BOTC.forEach((o, k) => { o.heard = 1; o.sk = [0.95, 0.915, 0.975][k % 3] + Math.random() * 0.02; o.lane = [10, -12, 0][k % 3]; o.ai = { nT: 4 + Math.random() * 4, err: 0, errT: 0 }; });
    const botDrive = (o, dt) => {
      const j = (o.idx + 6 + ((Math.abs(o.v) / 22) | 0)) % NP, q = P[j], dA = dirAt(j); let curv = 0; for (const k of [10, 20, 32]) curv = Math.max(curv, Math.abs(nrm(dirAt((o.idx + k) % NP) - dirAt(o.idx))));
      const turn = Math.sign(nrm(dirAt((o.idx + 25) % NP) - dirAt(o.idx))), lat = o.lane + turn * Math.min(32, curv * 40);
      const tx = q[0] + Math.cos(dA + Math.PI / 2) * lat, ty = q[1] + Math.sin(dA + Math.PI / 2) * lat;
      o.ai.errT -= dt; if (o.ai.errT <= 0) { o.ai.errT = 0.4 + Math.random(); o.ai.err = (Math.random() - 0.5) * (1 - o.sk) * 4; }
      const steer = Math.max(-1, Math.min(1, (nrm(Math.atan2(ty - o.y, tx - o.x) - o.a) + o.ai.err) * 2.6));
      const tv = 300 * o.sk * (1 - Math.min(0.5, curv * 0.5));
      if (o.nitro > 0 && o.nT <= 0 && curv < 0.12 && o.v > 200 && clk > o.ai.nT) { o.nitro--; o.nT = 1.6; o.ai.nT = clk + 7 + Math.random() * 8; }
      drive(o, steer, !o.fin && o.v < tv, o.v > tv + 35, dt);
    };
    const COL = MULTI ? ['#2563EB', '#DC2626', '#16A34A', '#F59E0B'] : ['#2563EB', '#DC2626'];
    // ko'p kishilik: marra tartibini uy egasi (0) belgilaydi
    const addFin = (s) => { if (order.includes(s)) return; order.push(s); if (order.length === 1 && s !== ctx.me) { msg = '🏁 ' + ctx.names[s]; msgT = 2.5; } ctx.rt?.send({ t: 'ord', o: order }); };
    const finish = (w) => { if (over) return; over = true; endW = w; if (ctx.me === 0) ctx.rt?.send({ t: 'end', w }); setTimeout(() => ctx.over(w), 1500); };
    const link = rtLink(ctx, (d, s) => {
      const o = cars[s]; if (!o) return;
      if (d.t === 'c' && (o !== me || SPEC)) { o.prev = o.snap; o.snap = d; o.t = performance.now(); o.lap = d.l; o.prog = d.p; o.heard = 1; }
      if (!MULTI) { if (d.t === 'fin' && !over) { op.fin = d.tm || 1; if (!me.fin) { over = true; msg = rct('fin'); msgT = 3; setTimeout(() => ctx.over(1 - ME), 1500); } } return; }
      if (d.t === 'fin' || (d.t === 'c' && d.f)) { o.fin = o.fin || d.tm || 1; if (ctx.me === 0) addFin(s); }
      if (d.t === 'ord' && s === 0 && Array.isArray(d.o)) { if (!order.length && d.o.length && d.o[0] !== ctx.me) { msg = '🏁 ' + ctx.names[d.o[0]]; msgT = 2.5; } order = d.o.filter((x) => cars[x]); order.forEach((x) => { if (!cars[x].fin) cars[x].fin = 1; }); }
      if (d.t === 'end' && s === 0 && !over) finish(d.w);
    });
    ctx.turn(-1, rt('wait_rt'));
    const stop = loop((dt) => {
      const W = c.W, H = c.H;
      const allHeard = others.every((o) => o.heard || o.out || ctx.out?.has(o.seat));
      if (!started && ((MULTI ? allHeard && link.st.alive : link.st.alive) || SPEC)) { started = true; snd(440, 0.15, 0.06); ctx.turn(-1, '🏎️ ' + rct('lap') + ' × ' + LAPS); }
      if (started && cd > 0) { const p0 = Math.ceil(cd); cd -= dt; if (Math.ceil(cd) !== p0) snd(cd <= 0 ? 880 : 440, 0.15, 0.07); }
      const kd = keysDown; let steer = pad.x; if (kd.has('arrowleft') || kd.has('a')) steer = -1; if (kd.has('arrowright') || kd.has('d')) steer = 1;
      const gas = pad.b.gas || kd.has('arrowup') || kd.has('w') || (pad.on && pad.y < -0.35), brake = pad.b.brake || kd.has('arrowdown') || kd.has('s') || (pad.on && pad.y > 0.5);
      if ((pad.take('nitro') || kd.has('shift')) && me.nitro > 0 && me.nT <= 0 && started && cd <= 0) { me.nitro--; me.nT = 1.6; snd(160, 0.5, 0.06, 'sawtooth'); }
      if (started && cd <= 0 && !SPEC) {
        if (!me.fin) time += dt;
        const idx = drive(me, steer, gas, brake, dt);
        const fwd = Math.cos(me.a - dirAt(idx)); wrongT = fwd < -0.3 && Math.abs(me.v) > 40 ? wrongT + dt : 0;
        if (me.lap >= LAPS && !me.fin) { me.fin = time; msg = rct('fin'); msgT = 3; snd(1046, 0.5, 0.08); ctx.rt?.send({ t: 'fin', tm: time }); if (!MULTI) { if (!op.fin) { over = true; setTimeout(() => ctx.over(ME), 1500); } } else if (ctx.me === 0) addFin(0); }
      }
      if (started && cd <= 0 && BOTC.length) { clk += dt; for (const o of BOTC) { botDrive(o, dt); if (o.lap >= LAPS && !o.fin) { o.fin = clk || 1; if (!MULTI) link.recv({ t: 'fin', tm: clk }, o.seat); else addFin(o.seat); } } }
      // uy egasi: hamma marraga yetsa yoki birinchidan 15 s o'tsa — tamom
      if (MULTI && ctx.me === 0 && order.length && !over) { endT -= dt; const act = cars.filter((o) => !o.out && !ctx.out?.has(o.seat)); if (endT <= 0 || act.every((o) => order.includes(o.seat))) finish(order[0]); }
      if (MULTI && ctx.me === 0 && order.length && (ordT += dt) > 0.4) { ordT = 0; ctx.rt?.send(endW != null ? { t: 'end', w: endW } : { t: 'ord', o: order }); } // paketlar yo'qolishi mumkin — qayta yuboramiz
      sendT += dt; if (!SPEC && sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 'c', x: Math.round(me.x), y: Math.round(me.y), a: Math.round(me.a * 100) / 100, v: Math.round(me.v), l: me.lap, p: Math.round(me.prog), n: me.nT > 0 ? 1 : 0, ...(MULTI && me.fin ? { f: 1 } : {}) }); }
      for (const o of cars) { if ((o === me && !SPEC) || !o.snap) continue; const k = o.prev ? Math.min(1.5, (performance.now() - o.t) / 50) : 1, lp = (a, b) => (o.prev ? a + (b - a) * k : b); o.x = lp(o.prev?.x ?? o.snap.x, o.snap.x); o.y = lp(o.prev?.y ?? o.snap.y, o.snap.y); o.a = o.snap.a; o.v = o.snap.v; o.nT = o.snap.n; }
      // ---- chizish: kamera mashina orqasidan (mashina yo'nalishi bo'yicha) ----
      const zoom = Math.min(W, H) / 520 * (1 - Math.min(0.25, Math.abs(me.v) / 1400));
      const gb = g.createRadialGradient(W / 2, H * 0.6, 20, W / 2, H * 0.6, Math.max(W, H) * 0.8); gb.addColorStop(0, '#4D9A44'); gb.addColorStop(1, '#2F6B2A'); g.save(); g.fillStyle = gb; g.fillRect(0, 0, W, H);
      g.translate(W / 2, H * 0.66); g.scale(zoom, zoom); g.rotate(-me.a - Math.PI / 2); g.translate(-me.x, -me.y);
      const path = () => { g.beginPath(); P.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); };
      g.lineJoin = 'round'; g.lineCap = 'round';
      path(); g.strokeStyle = '#E5E7EB'; g.lineWidth = WTR * 2 + 16; g.stroke(); path(); g.setLineDash([22, 22]); g.strokeStyle = '#EF4444'; g.lineWidth = WTR * 2 + 16; g.stroke(); g.setLineDash([]);
      path(); g.strokeStyle = '#374151'; g.lineWidth = WTR * 2; g.stroke(); path(); g.setLineDash([26, 30]); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
      // start/finish
      g.save(); g.translate(P[0][0], P[0][1]); g.rotate(a0 + Math.PI / 2); for (let i = -7; i < 7; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#111'; g.fillRect(i * 10, j * 10 - 10, 10, 10); } g.restore();
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 4; for (const o of cars) { if (o.skid.length < 2) continue; g.beginPath(); o.skid.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); }
      for (let i = SM.length - 1; i >= 0; i--) { const q = SM[i]; q.t -= dt; if (q.t <= 0) { SM.splice(i, 1); continue; } q.r += dt * 26; g.fillStyle = q.col + (q.t * 0.5).toFixed(2) + ')'; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); }
      const car = (o, col, isMe) => {
        g.save(); g.translate(o.x, o.y); g.rotate(o.a);
        if (o.nT > 0) { g.fillStyle = 'rgba(251,146,60,.85)'; g.beginPath(); g.moveTo(-22, -6); g.lineTo(-44 - Math.random() * 14, 0); g.lineTo(-22, 6); g.fill(); }
        g.fillStyle = 'rgba(0,0,0,.32)'; rr(g, -19, -9, 46, 25, 8); g.fill();
        g.fillStyle = '#111'; [[-15, -13], [9, -13], [-15, 8], [9, 8]].forEach(([x, y]) => g.fillRect(x, y, 11, 5));
        const bg2 = g.createLinearGradient(0, -11, 0, 11); bg2.addColorStop(0, col); bg2.addColorStop(0.45, '#FFFFFF66'); bg2.addColorStop(0.55, col); bg2.addColorStop(1, col);
        g.fillStyle = col; rr(g, -22, -11, 46, 22, 9); g.fill(); g.fillStyle = bg2; rr(g, -22, -11, 46, 22, 9); g.fill();
        g.fillStyle = 'rgba(15,23,42,.85)'; rr(g, 1, -8, 11, 16, 4); g.fill(); g.fillStyle = 'rgba(15,23,42,.7)'; rr(g, -14, -7, 7, 14, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(3, -6, 3, 12);
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(-24, -10, 4, 20); g.fillStyle = '#FEF9C3'; g.fillRect(21, -8, 3, 4); g.fillRect(21, 4, 3, 4); g.fillStyle = '#F87171'; g.fillRect(-23, -8, 2, 4); g.fillRect(-23, 4, 2, 4);
        g.restore();
        if (!isMe) { g.save(); g.translate(o.x, o.y); g.rotate(me.a + Math.PI / 2); text(g, MULTI ? String(ctx.names[o.seat] || '').slice(0, 10) : rt('opp'), 0, -34, MULTI ? 14 : 16, '#fff'); g.restore(); }
      };
      others.forEach((o) => { if (!o.out && (!MULTI || o.heard || !started)) car(o, COL[o.seat], false); }); car(me, COL[ME], true);
      for (const t of TREES) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(t[0] + 8, t[1] + 8, t[2], 0, 7); g.fill(); g.fillStyle = t[3]; g.beginPath(); g.arc(t[0], t[1], t[2], 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(t[0] - t[2] * 0.3, t[1] - t[2] * 0.3, t[2] * 0.5, 0, 7); g.fill(); }
      g.restore();
      // ---- HUD ----
      const rk = (o) => (order.includes(o.seat) ? -1e9 + order.indexOf(o.seat) : o.fin && !MULTI ? -1e9 + o.fin : -o.prog);
      const live = cars.filter((o) => !o.out), myPos = MULTI ? live.slice().sort((a, b) => rk(a) - rk(b)).indexOf(me) + 1 : 0;
      g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, 8, 8, 150, 54, 12); g.fill();
      text(g, `${rct('lap')} ${Math.max(1, Math.min(LAPS, me.lap + 1))}/${LAPS}`, 16, 24, 15, '#fff', 'left'); const first = MULTI ? myPos === 1 : me.fin ? !op.fin || me.fin <= op.fin : me.prog >= op.prog;
      text(g, `${rct('pos')}: ${MULTI ? myPos : first ? '1' : '2'}/${MULTI ? live.length : 2}`, 16, 46, 15, first ? '#FDE047' : '#fff', 'left');
      g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, W - 112, 8, 104, 54, 12); g.fill(); text(g, `${Math.round(Math.abs(me.v) * 0.6)}`, W - 60, 28, 22, '#fff'); text(g, 'km/h  🔥×' + me.nitro, W - 60, 50, 11, '#E5E7EB');
      // ko'p kishilik: o'yinchilar qatori (davra yoki marra o'rni)
      if (MULTI) { g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, 8, 68, N * 42 + 8, 24, 12); g.fill(); cars.forEach((o, i) => { const x = 22 + i * 42, oi = order.indexOf(i); g.globalAlpha = o.out ? 0.3 : 1; g.fillStyle = COL[i]; g.beginPath(); g.arc(x, 80, 6, 0, 7); g.fill(); if (i === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.stroke(); } text(g, oi >= 0 ? '🏁' + (oi + 1) : String(Math.max(1, Math.min(LAPS, o.lap + 1))), x + 9, 80, 11, i === ctx.me ? '#FDE047' : '#fff', 'left'); g.globalAlpha = 1; }); }
      // mini xarita
      const mx = W - 92, my = 74, ms = 80 / 1500; g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, mx - 6, my - 6, 92, 92, 10); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); P.forEach((q, i) => { const x = mx + 40 + (q[0] - 240) * ms, y = my + 40 + (q[1] - 230) * ms; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke();
      others.concat([me]).forEach((o) => { if (o.out) return; g.fillStyle = COL[o.seat]; g.beginPath(); g.arc(mx + 40 + (o.x - 240) * ms, my + 40 + (o.y - 230) * ms, 4, 0, 7); g.fill(); });
      // marra tartibi
      if (MULTI && order.length) { const h = 22 * order.length + 14; g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, W / 2 - 90, H * 0.5, 180, h, 12); g.fill(); order.forEach((s, i) => { g.fillStyle = COL[s]; g.beginPath(); g.arc(W / 2 - 70, H * 0.5 + 18 + i * 22, 6, 0, 7); g.fill(); text(g, `${i + 1}. ${String(ctx.names[s] || '').slice(0, 12)}`, W / 2 - 58, H * 0.5 + 18 + i * 22, 14, s === ctx.me ? '#FDE047' : '#fff', 'left'); }); }
      if (!started) text(g, rt('wait_rt'), W / 2, H * 0.35, 18);
      else if (cd > 0) text(g, String(Math.ceil(cd)), W / 2, H * 0.35, 72, '#FDE047'); else if (cd > -0.8) text(g, rt('go'), W / 2, H * 0.35, 40, '#22C55E');
      if (wrongT > 1) text(g, rct('wrong'), W / 2, H * 0.22, 20, '#FCA5A5');
      if (msgT > 0) { msgT -= dt; text(g, msg, W / 2, H * 0.3, 36, '#FDE047'); }
      if (link.lost() && !over) text(g, rt('lost'), W / 2, H * 0.45, 15, '#FCA5A5');
    });
    return { apply: () => false, rt: (s, d) => link.recv(d, s), stop, resize: fit, quit: (s) => { if (cars[s] && s !== ctx.me) cars[s].out = 1; } };
  };



  /* ================= Yana 3 ta jonli 2 kishilik o'yin: Ping-pong, Tank jangi, Sumo ================= */
  MPL.push(
    { id: 'pong', bot: 1, e: '🏓', c: ['#0EA5E9', '#7C3AED'], rt: 1, n: { uz: 'Ping-pong (jonli)', ru: 'Пинг-понг (онлайн)', en: 'Ping-pong (live)' } },
    { id: 'tanks', bot: 1, e: '🪖', c: ['#4D7C0F', '#78350F'], rt: 1, big: 1, n: { uz: 'Tank jangi (jonli)', ru: 'Танковый бой (онлайн)', en: 'Tank battle (live)' } },
    { id: 'sumo', bot: 1, e: '🤼', c: ['#F59E0B', '#DC2626'], rt: 1, n: { uz: 'Sumo (jonli)', ru: 'Сумо (онлайн)', en: 'Sumo (live)' } },
  );
  // umumiy: uy egasi (0) hisoblaydi, mehmon (1) boshqaruvini yuboradi; ekranda har kim o'zini pastda ko'radi
  function hostGame(ctx, { onInput, onSnap }) {
    const HOST = ctx.me === 0; let snap = null, prev = null, snapT = 0, over = false;
    const link = rtLink(ctx, (d, s) => {
      if (HOST && d.t === 'i') onInput(d, s);
      if (!HOST && d.t === 's') { prev = snap; snap = d; snapT = performance.now(); onSnap?.(d); }
      if (d.t === 'end' && !over) { over = true; setTimeout(() => ctx.over(d.w), 700); }
    });
    return {
      HOST, link, get snap() { return snap; },
      k(ms) { return prev ? Math.min(1.2, (performance.now() - snapT) / ms) : 1; },
      lerp(a, b, ms) { return prev ? a + (b - a) * this.k(ms) : b; }, prevS: () => prev,
      end(w) { if (over) return; over = true; ctx.rt?.send({ t: 'end', w }); setTimeout(() => ctx.over(w), 700); }, get over() { return over; },
    };
  }

  // ---- Ping-pong ----
  MPI.pong = (stage, ctx) => {
    // effektlar: uchqunlar (dunyo koordinatasida) + ekran silkinishi
    const PT = []; let shake = 0;
    const burst = (x, y, col, n, sp) => { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = sp * (0.3 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.35 + Math.random() * 0.4, col }); } if (PT.length > 160) PT.splice(0, PT.length - 160); };
    const drawPT = (g, V, dt) => { for (let i = PT.length - 1; i >= 0; i--) { const q = PT[i]; q.t -= dt; if (q.t <= 0) { PT.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.93; q.vy *= 0.93; const [x, y] = V(q.x, q.y); g.globalAlpha = Math.min(1, q.t * 2.5); g.fillStyle = q.col; g.fillRect(x - 2, y - 2, 4, 4); } g.globalAlpha = 1; };
    const shk = (g, dt) => { if (shake > 0) { shake = Math.max(0, shake - dt); const k = shake * 22; g.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k); } };
    if ((ctx.n || 2) > 2) { // 3–4 kishi: kvadrat stol, har kim bir tomonni himoya qiladi, jonlar tugasa tomon devorga aylanadi
      const NP = ctx.n, { c, g, fit } = canvasIn(stage, 0.82), PW = 0.26, PH = 0.03, BR = 0.022, LIVES = 5, PY = 0.94, ME = Math.max(0, ctx.me), COL = ctx.col;
      const rot = (x, y, k) => { k = ((k % 4) + 4) % 4; for (let i = 0; i < k; i++) [x, y] = [-y, x]; return [x, y]; }; // 90° burish
      const loc = (x, y, j) => { const [a, b] = rot(x - 0.5, y - 0.5, -j); return [a + 0.5, b + 0.5]; }, wld = (x, y, j) => { const [a, b] = rot(x - 0.5, y - 0.5, j); return [a + 0.5, b + 0.5]; };
      const pu = Array(NP).fill(0.5), pv = Array(NP).fill(0), lives = Array(NP).fill(LIVES), got = new Set(ctx.bots || []);
      let ball = { x: 0.5, y: 0.5, vx: 0, vy: 0 }, serve = 1.5, msg = '', msgT = 0, hits = 0, trail = [], target = null, sendT = 0, aliveT = 0, started = false;
      const alive = (j) => j < NP && lives[j] > 0 && !ctx.out?.has(j);
      const T = { uz: '❤️ {n} — oxirgi qolgan yutadi', ru: '❤️ {n} — побеждает последний', en: '❤️ {n} — last one standing wins' }[L()] || PK('x')?.pong_last || '❤️ {n} — last one standing wins';
      const H = hostGame(ctx, { onInput: (d, s) => { if (s > 0 && s < NP) { got.add(s); const nx = Math.max(PW / 2, Math.min(1 - PW / 2, +d.u || 0.5)); pv[s] = (nx - pu[s]) * 25; pu[s] = nx; } },
        onSnap: (d) => { d.p.forEach((u, i) => { if (i !== ME || ctx.me < 0) pu[i] = u; }); if (d.l.some((v, i) => v < lives[i])) { snd(880, 0.25, 0.07); msg = d.l[ME] < lives[ME] && ctx.me >= 0 ? '💔' : '🏓'; msgT = 0.9; shake = 0.3; burst(ball.x, ball.y, '#FDE047', 18, 0.9); } d.l.forEach((v, i) => (lives[i] = v)); if (d.h > hits) { snd(520, 0.04, 0.05, 'square'); burst(ball.x, ball.y, '#FFFFFF', 8, 0.6); } hits = d.h; } });
      const doServe = () => { const al = [...Array(NP).keys()].filter(alive), j = al[ri(al.length)] ?? 0; const [vx, vy] = rot((Math.random() - 0.5) * 0.5, 0.8, j); ball = { x: 0.5, y: 0.5, vx, vy }; };
      const lose = (j) => { lives[j]--; msg = j === ME && ctx.me >= 0 ? '💔' : '🏓'; msgT = 0.9; snd(880, 0.25, 0.07); shake = 0.3; burst(ball.x, ball.y, COL[j], 22, 0.9); trail = []; ball = { x: 0.5, y: 0.5, vx: 0, vy: 0 }; serve = 1;
        const al = [...Array(NP).keys()].filter(alive); if (al.length <= 1) H.end(al.length ? al[0] : ctx.DRAW); };
      const pc = (j) => j >= NP ? '#64748B' : COL[j];
      // botlar: to'p o'z tomoniga kelayotganda kesishish nuqtasini taxmin qiladi (kechikish + xato bilan)
      const BOT = [...(ctx.bots || [])].filter((j) => j < NP), AI = {}; BOT.forEach((j) => (AI[j] = { t: 0, x: 0.5, off: 0 }));
      const botStep = (dt) => { for (const j of BOT) { if (!alive(j)) continue; const a = AI[j]; a.t -= dt;
        if (a.t <= 0) { a.t = 0.13 + Math.random() * 0.12; const [lx, ly] = loc(ball.x, ball.y, j), [lvx, lvy] = rot(ball.vx, ball.vy, -j), sp = Math.hypot(lvx, lvy);
          if (lvy > 0.02 && serve <= 0) { const px = lx + lvx * ((PY - ly) / lvy); a.x = Math.max(0, Math.min(1, px)) + (Math.random() - 0.5) * (0.05 + sp * 0.12) - a.off; } else { a.off = (Math.random() - 0.5) * PW * 0.7; a.x = 0.5 + (lx - 0.5) * 0.25; } }
        const mv = Math.max(-1.15 * dt, Math.min(1.15 * dt, a.x - pu[j])); pv[j] = mv / dt; pu[j] = Math.max(PW / 2, Math.min(1 - PW / 2, pu[j] + mv)); } };
      ctx.turn(-1, T.replace('{n}', LIVES));
      const stop = loop((dt) => {
        const kd = keysDown;
        if (kd.has('arrowleft') || kd.has('a')) target = Math.max(0, (target ?? pu[ME]) - dt * 1.6); if (kd.has('arrowright') || kd.has('d')) target = Math.min(1, (target ?? pu[ME]) + dt * 1.6);
        if (target != null && ctx.me >= 0 && alive(ME)) { const nx = pu[ME] + (target - pu[ME]) * Math.min(1, dt * 18); pv[ME] = (nx - pu[ME]) / dt; pu[ME] = Math.max(PW / 2, Math.min(1 - PW / 2, nx)); }
        sendT += dt; const live = H.link.st.alive; if (live) aliveT += dt;
        if (H.HOST && live && !H.over) {
          if (!started) started = aliveT > 4 || ctx.active().every((s) => s === 0 || got.has(s)); // hamma ulanguncha kutamiz
          if (started) botStep(dt);
          if (!started); else if (serve > 0) { serve -= dt; if (serve <= 0) doServe(); }
          else for (let st = 0; st < 4; st++) {
            const h = dt / 4; ball.x += ball.vx * h; ball.y += ball.vy * h; trail.push([ball.x, ball.y]); if (trail.length > 14) trail.shift(); let lost = false;
            for (let j = 0; j < 4; j++) {
              let [lx, ly] = loc(ball.x, ball.y, j), [lvx, lvy] = rot(ball.vx, ball.vy, -j), ch = false;
              if (alive(j)) {
                if (lvy > 0 && Math.abs(ly - PY) < PH / 2 + BR && Math.abs(lx - pu[j]) < PW / 2 + BR) { const off = (lx - pu[j]) / (PW / 2), sp = Math.min(2, Math.hypot(lvx, lvy) * 1.05 + 0.02); lvy = -sp * Math.cos(off * 0.9); lvx = sp * Math.sin(off * 0.9) + pv[j] * 0.25; ly = PY - (PH / 2 + BR); hits++; ch = true; snd(520, 0.04, 0.05, 'square'); }
                else if (ly > 1.05) { lose(j); lost = true; break; }
              } else if (ly > 1 - BR && lvy > 0) { ly = 1 - BR; lvy = -lvy; if (Math.abs(lvx) < Math.abs(lvy) * 0.3) lvx = (lvx < 0 ? -1 : 1) * Math.abs(lvy) * 0.3; ch = true; } // devor: to'g'ri chiziqda qotib qolmasin
              if (ch) { [ball.x, ball.y] = wld(lx, ly, j); [ball.vx, ball.vy] = rot(lvx, lvy, j); burst(ball.x, ball.y, alive(j) ? '#FFFFFF' : '#CBD5E1', 7, 0.6); }
            }
            if (lost) break;
          }
          if (sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 's', b: [Math.round(ball.x * 1000) / 1000, Math.round(ball.y * 1000) / 1000], p: pu.map((u) => Math.round(u * 1000) / 1000), l: lives, h: hits }); }
        } else if (!H.HOST && ctx.me >= 0 && sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 'i', u: Math.round(pu[ME] * 1000) / 1000 }); }
        if (!H.HOST && H.snap) { const pv0 = H.prevS(); ball.x = H.lerp(pv0?.b[0] ?? H.snap.b[0], H.snap.b[0], 33); ball.y = H.lerp(pv0?.b[1] ?? H.snap.b[1], H.snap.b[1], 33); trail.push([ball.x, ball.y]); if (trail.length > 14) trail.shift(); }
        // chizish: har kim o'z tomonini pastda ko'radi
        const top = 34, s = Math.min(c.W, c.H - top - 6), ox = (c.W - s) / 2, oy = top + (c.H - top - s) / 2, V = (x, y, j) => { const [a, b] = j == null ? loc(x, y, ME) : loc(...wld(x, y, j), ME); return [ox + a * s, oy + b * s]; };
        const bg = g.createRadialGradient(c.W / 2, c.H / 2, 10, c.W / 2, c.H / 2, Math.max(c.W, c.H) * 0.7); bg.addColorStop(0, '#1E1B4B'); bg.addColorStop(1, '#05060F'); g.fillStyle = bg; g.fillRect(0, 0, c.W, c.H);
        g.save(); shk(g, dt);
        const gr = g.createLinearGradient(ox, oy, ox + s, oy + s); gr.addColorStop(0, '#1E40AF'); gr.addColorStop(0.5, '#2563EB'); gr.addColorStop(1, '#1E3A8A');
        g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 24; g.shadowOffsetY = 8; g.fillStyle = gr; rr(g, ox, oy, s, s, 14); g.fill(); g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
        g.fillStyle = 'rgba(255,255,255,.06)'; rr(g, ox + 6, oy + 6, s - 12, s * 0.45, 12); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + s, oy + s); g.moveTo(ox + s, oy); g.lineTo(ox, oy + s); g.stroke(); g.setLineDash([]);
        g.beginPath(); g.arc(ox + s / 2, oy + s / 2, s * 0.12, 0, 7); g.stroke();
        for (let j = 0; j < 4; j++) { const [x1, y1] = V(0, 1, j), [x2, y2] = V(1, 1, j); g.lineCap = 'round';
          if (alive(j)) { g.strokeStyle = pc(j) + '99'; g.lineWidth = 4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
          else { g.strokeStyle = '#94A3B8'; g.lineWidth = 9; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.strokeStyle = '#E2E8F0'; g.lineWidth = 3; g.stroke(); } g.lineCap = 'butt'; }
        trail.forEach((q, i) => { const [x, y] = V(q[0], q[1]); g.fillStyle = `rgba(253,224,71,${i / trail.length * 0.45})`; g.beginPath(); g.arc(x, y, BR * s * (i / trail.length), 0, 7); g.fill(); });
        drawPT(g, (x, y) => V(x, y), dt);
        { const [x, y] = V(ball.x, ball.y); g.fillStyle = 'rgba(253,224,71,.25)'; g.beginPath(); g.arc(x, y, BR * s * 2.2, 0, 7); g.fill(); const bgr = g.createRadialGradient(x - BR * s * 0.3, y - BR * s * 0.3, 1, x, y, BR * s); bgr.addColorStop(0, '#FFFBEB'); bgr.addColorStop(1, '#FACC15'); g.fillStyle = bgr; g.beginPath(); g.arc(x, y, BR * s, 0, 7); g.fill(); }
        for (let j = 0; j < NP; j++) { if (!alive(j)) continue; const [x, y] = V(pu[j], PY, j), hz = ((j - ME) % 2 + 2) % 2 === 0, w = (hz ? PW : PH) * s, hh = (hz ? PH : PW) * s;
          g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, x - w / 2 + 2, y - hh / 2 + 3, w, hh, 7); g.fill();
          g.fillStyle = pc(j); rr(g, x - w / 2, y - hh / 2, w, hh, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, x - w / 2 + 2, y - hh / 2 + 1.5, Math.max(2, w - 4), Math.max(2, hh * 0.4), 4); g.fill();
          if (j === ME && ctx.me >= 0) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; rr(g, x - w / 2 - 2, y - hh / 2 - 2, w + 4, hh + 4, 8); g.stroke(); } }
        g.restore();
        // har o'rin: rangli nuqta + jonlar
        const cw = Math.min(90, c.W / NP); for (let j = 0; j < NP; j++) { const x = c.W / 2 + (j - (NP - 1) / 2) * cw; g.globalAlpha = alive(j) ? 1 : 0.4; g.fillStyle = pc(j); g.beginPath(); g.arc(x - 16, 17, 7, 0, 7); g.fill(); if (j === ME && ctx.me >= 0) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.beginPath(); g.arc(x - 16, 17, 10, 0, 7); g.stroke(); } text(g, '❤' + lives[j], x + 8, 17, 15, '#fff'); g.globalAlpha = 1; }
        if (!H.link.st.alive || (H.HOST && !started)) text(g, rt('wait_rt'), c.W / 2, oy + s / 2 - 50, 16);
        if (msgT > 0) { msgT -= dt; text(g, msg, c.W / 2, oy + s / 2, 46); }
        if (H.link.lost() && !H.over) text(g, rt('lost'), c.W / 2, oy + s * 0.7, 14, '#FCA5A5');
      });
      const onPt = (e) => { if (ctx.me >= 0) target = (pos(c, e)[0] - (c.W - Math.min(c.W, c.H - 40)) / 2) / Math.min(c.W, c.H - 40); };
      c.addEventListener('pointerdown', onPt); c.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') onPt(e); });
      return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit, quit: (s) => { if (H.HOST && s < NP) { lives[s] = 0; const al = [...Array(NP).keys()].filter(alive); if (al.length <= 1 && !H.over) H.end(al.length ? al[0] : ctx.DRAW); } } };
    }
    const { c, g, fit } = canvasIn(stage, 0.6);
    const TW = 1, TH = 1.7, PW = 0.24, PH = 0.035, BR = 0.022, WIN = 7, flip = ctx.me === 1, ME = Math.max(0, ctx.me);
    const pd = [{ x: 0.5, vx: 0 }, { x: 0.5, vx: 0 }]; let ball = { x: 0.5, y: TH / 2, vx: 0, vy: 0 }, sc = [0, 0], serve = 1.2, server = 0, msg = '', msgT = 0, hits = 0, trail = [];
    let target = null, sendT = 0;
    const toX = (px) => { const s = Math.min(c.W / TW, c.H / TH), ox = (c.W - TW * s) / 2; let x = (px - ox) / s; return flip ? TW - x : x; };
    const onPt = (e) => { if (ctx.me >= 0) target = toX(pos(c, e)[0]); };
    c.addEventListener('pointerdown', onPt); c.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') onPt(e); });
    const H = hostGame(ctx, { onInput: (d) => { const nx = +d.x; pd[1].vx = (nx - pd[1].x) * 25; pd[1].x = nx; }, onSnap: (d) => { if (d.sc[0] + d.sc[1] > sc[0] + sc[1]) { snd(880, 0.25, 0.07); msg = '🏓'; msgT = 0.9; shake = 0.3; burst(ball.x, ball.y, '#FDE047', 20, 0.9); } if (d.h > hits) { snd(520, 0.04, 0.05, 'square'); burst(ball.x, ball.y, '#FFFFFF', 8, 0.6); } hits = d.h; sc = d.sc; pd[0].x = d.p0; } });
    const doServe = () => { const dir = server === 0 ? -1 : 1; ball = { x: 0.5, y: TH / 2, vx: (Math.random() - 0.5) * 0.5, vy: dir * 0.85 }; };
    // bot (1-o'rin, tepada): to'p o'ziga kelayotganda devordan qaytishni hisobga olib kesishish nuqtasini taxmin qiladi
    const BOT = ctx.isBot?.(1), AI = { t: 0, x: 0.5, off: 0 }, PY1 = 0.09;
    const pred = (x, y, vx, vy, py) => { const L2 = TW - 2 * BR; let px = x + vx * ((py - y) / vy) - BR; px = ((px % (2 * L2)) + 2 * L2) % (2 * L2); if (px > L2) px = 2 * L2 - px; return px + BR; };
    const botStep = (dt) => { const p = pd[1]; AI.t -= dt;
      if (AI.t <= 0) { AI.t = 0.12 + Math.random() * 0.12; const sp = Math.hypot(ball.vx, ball.vy);
        if (ball.vy < -0.02 && serve <= 0) AI.x = pred(ball.x, ball.y, ball.vx, ball.vy, PY1) + (Math.random() - 0.5) * (0.04 + sp * 0.1) - AI.off;
        else { AI.off = (Math.random() - 0.5) * PW * 0.75; AI.x = 0.5 + (ball.x - 0.5) * 0.3; } }
      const mv = Math.max(-1.3 * dt, Math.min(1.3 * dt, AI.x - p.x)); p.vx = mv / dt; p.x = Math.max(PW / 2, Math.min(TW - PW / 2, p.x + mv)); };
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    const stop = loop((dt) => {
      const mine = pd[ME]; const kd = keysDown;
      if (kd.has('arrowleft') || kd.has('a')) target = Math.max(0, (target ?? mine.x) - dt * 1.6); if (kd.has('arrowright') || kd.has('d')) target = Math.min(1, (target ?? mine.x) + dt * 1.6);
      if (target != null && ctx.me >= 0) { const nx = mine.x + (target - mine.x) * Math.min(1, dt * 18); mine.vx = (nx - mine.x) / dt; mine.x = Math.max(PW / 2, Math.min(TW - PW / 2, nx)); }
      sendT += dt; const live = H.link.st.alive;
      if (H.HOST && live && !H.over) {
        if (BOT) botStep(dt);
        if (serve > 0) { serve -= dt; if (serve <= 0) doServe(); }
        else for (let st = 0; st < 4; st++) {
          const h = dt / 4; ball.x += ball.vx * h; ball.y += ball.vy * h; trail.push([ball.x, ball.y]); if (trail.length > 14) trail.shift();
          if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); } if (ball.x > TW - BR) { ball.x = TW - BR; ball.vx = -Math.abs(ball.vx); }
          for (const s of [0, 1]) { const py = s === 0 ? TH - 0.09 : 0.09, p = pd[s];
            if (Math.abs(ball.y - py) < PH / 2 + BR && Math.abs(ball.x - p.x) < PW / 2 + BR && (s === 0 ? ball.vy > 0 : ball.vy < 0)) {
              const off = (ball.x - p.x) / (PW / 2); const sp = Math.min(2.4, Math.hypot(ball.vx, ball.vy) * 1.06 + 0.02);
              ball.vy = (s === 0 ? -1 : 1) * sp * Math.cos(off * 0.9); ball.vx = sp * Math.sin(off * 0.9) + p.vx * 0.25; ball.y = py + (s === 0 ? -1 : 1) * (PH / 2 + BR); hits++; snd(520, 0.04, 0.05, 'square'); burst(ball.x, ball.y, s ? '#F9A8D4' : '#A5F3FC', 9, 0.6); } }
          if (ball.y > TH + 0.05 || ball.y < -0.05) { const w = ball.y < 0 ? 0 : 1; sc[w]++; server = 1 - w; serve = 1; msg = '🏓'; msgT = 0.9; snd(880, 0.25, 0.07); shake = 0.3; burst(ball.x, Math.max(0, Math.min(TH, ball.y)), '#FDE047', 20, 0.9); trail = []; ball = { x: 0.5, y: TH / 2, vx: 0, vy: 0 }; if (sc[w] >= WIN) H.end(w); break; }
        }
        if (sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 's', b: [Math.round(ball.x * 1000) / 1000, Math.round(ball.y * 1000) / 1000], p0: Math.round(pd[0].x * 1000) / 1000, sc, h: hits }); }
      } else if (!H.HOST && ctx.me >= 0 && sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(pd[1].x * 1000) / 1000 }); }
      if (!H.HOST && H.snap) { const pv = H.prevS(); ball.x = H.lerp(pv?.b[0] ?? H.snap.b[0], H.snap.b[0], 33); ball.y = H.lerp(pv?.b[1] ?? H.snap.b[1], H.snap.b[1], 33); trail.push([ball.x, ball.y]); if (trail.length > 14) trail.shift(); }
      const s = Math.min(c.W / TW, c.H / TH), ox = (c.W - TW * s) / 2, oy = (c.H - TH * s) / 2, X = (x) => ox + (flip ? TW - x : x) * s, Y = (y) => oy + (flip ? TH - y : y) * s;
      const bg = g.createRadialGradient(c.W / 2, c.H / 2, 10, c.W / 2, c.H / 2, Math.max(c.W, c.H) * 0.7); bg.addColorStop(0, '#1E1B4B'); bg.addColorStop(1, '#05060F'); g.fillStyle = bg; g.fillRect(0, 0, c.W, c.H);
      g.save(); shk(g, dt);
      const gr = g.createLinearGradient(0, oy, 0, oy + TH * s); gr.addColorStop(0, '#1E3A8A'); gr.addColorStop(0.5, '#2563EB'); gr.addColorStop(1, '#1E3A8A');
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 24; g.shadowOffsetY = 8; g.fillStyle = gr; rr(g, ox, oy, TW * s, TH * s, 14); g.fill(); g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.fillStyle = 'rgba(255,255,255,.05)'; rr(g, ox + 6, oy + 6, TW * s * 0.5, TH * s - 12, 10); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.strokeRect(ox + 4, oy + 4, TW * s - 8, TH * s - 8); g.lineWidth = 1.5; g.beginPath(); g.moveTo(ox + TW * s / 2, oy + 4); g.lineTo(ox + TW * s / 2, oy + TH * s - 4); g.stroke();
      g.fillStyle = 'rgba(15,23,42,.55)'; g.fillRect(ox, oy + TH * s / 2 - 3, TW * s, 6); g.strokeStyle = '#F8FAFC'; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(ox, oy + TH * s / 2); g.lineTo(ox + TW * s, oy + TH * s / 2); g.stroke(); g.setLineDash([]);
      trail.forEach((q, i) => { g.fillStyle = `rgba(253,224,71,${i / trail.length * 0.45})`; g.beginPath(); g.arc(X(q[0]), Y(q[1]), BR * s * (i / trail.length), 0, 7); g.fill(); });
      drawPT(g, (x, y) => [X(x), Y(y)], dt);
      { const x = X(ball.x), y = Y(ball.y); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + 3, y + 5, BR * s, 0, 7); g.fill(); g.fillStyle = 'rgba(253,224,71,.22)'; g.beginPath(); g.arc(x, y, BR * s * 2.3, 0, 7); g.fill(); const bgr = g.createRadialGradient(x - BR * s * 0.3, y - BR * s * 0.3, 1, x, y, BR * s); bgr.addColorStop(0, '#FFFBEB'); bgr.addColorStop(1, '#FACC15'); g.fillStyle = bgr; g.beginPath(); g.arc(x, y, BR * s, 0, 7); g.fill(); }
      [[0, TH - 0.09, '#22D3EE'], [1, 0.09, '#F472B6']].forEach(([i, y, col]) => { const x0 = X(pd[i].x) - (PW / 2) * s, y0 = Y(y) - (PH / 2) * s; g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 2, y0 + 4, PW * s, PH * s, 8); g.fill(); g.fillStyle = col; rr(g, x0, y0, PW * s, PH * s, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; rr(g, x0 + 4, y0 + 2, PW * s - 8, PH * s * 0.35, 4); g.fill(); });
      g.restore();
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, c.W - 50, c.H / 2 - 56, 42, 112, 14); g.fill();
      text(g, String(sc[ME]), c.W - 29, c.H / 2 + 28, 28, '#fff'); text(g, String(sc[1 - ME]), c.W - 29, c.H / 2 - 28, 28, 'rgba(255,255,255,.55)');
      if (!H.link.st.alive) text(g, rt('wait_rt'), c.W / 2, c.H / 2 - 50, 16);
      if (msgT > 0) { msgT -= dt; text(g, msg, c.W / 2, c.H / 2, 46); }
      if (H.link.lost() && !H.over) text(g, rt('lost'), c.W / 2, c.H * 0.7, 14, '#FCA5A5');
    });
    return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit };
  };


  // ---- Tank jangi: devorli maydon, o'q devordan bir marta qaytadi. 5 ta g'alaba ----
  MPI.tanks = (stage, ctx) => {
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, 0.75);
    const pad = padUI(stage, [{ id: 'fire', t: '💥', cls: 'big' }]);
    const N = ctx.n > 2 ? ctx.n : 2, AW = 20, AH = 15, WIN = 5, ME = Math.max(0, ctx.me), COL = N > 2 ? ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B'] : ['#22C55E', '#F97316'];
    const WALLS = [[4, 3, 1, 4], [15, 8, 1, 4], [8, 7, 4, 1], [9, 2, 2, 1], [9, 12, 2, 1], [3, 11, 3, 1], [14, 3, 3, 1]];
    const wallHit = (x, y, r) => x < r || y < r || x > AW - r || y > AH - r || WALLS.some(([wx, wy, ww, wh]) => x > wx - r && x < wx + ww + r && y > wy - r && y < wy + wh + r);
    // 4 burchak: 0 past-chap, 1 tepa-o'ng, 2 tepa-chap, 3 past-o'ng
    const SP = [{ x: 2, y: AH - 2, a: -Math.PI / 4 }, { x: AW - 2, y: 2, a: (3 * Math.PI) / 4 }, { x: 2, y: 2, a: Math.PI / 4 }, { x: AW - 2, y: AH - 2, a: (-3 * Math.PI) / 4 }];
    const spawn = (i) => ({ ...SP[i] });
    const FL = (i) => i === 1 || i === 2; // tepada boshlaganlar uchun ekran 180° burilgan
    let T = Array.from({ length: N }, (_, i) => ({ ...spawn(i), hp: 3, dead: 0, cd: 0, out: 0 })), B = [], sc = Array(N).fill(0), fx = [], sendT = 0;
    const gin = Array.from({ length: N }, () => ({ x: 0, y: 0, f: 0 })), seen = Array(N).fill(0); let myF = 0;
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    // effektlar: uchqun/tutun zarralari, silkinish, o'q izi
    const PT = []; let shake = 0, lastB = 0;
    const boom = (x, y, big) => { for (let i = 0; i < (big ? 26 : 10); i++) { const a = Math.random() * 7, v = (big ? 5 : 3) * (0.3 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.4 + Math.random() * 0.5, col: Math.random() < 0.5 ? '#FDBA74' : big && Math.random() < 0.5 ? '#57534E' : '#FDE047', r: big ? 0.18 : 0.1 }); } if (PT.length > 200) PT.splice(0, PT.length - 200); shake = Math.max(shake, big ? 0.35 : 0.15); };
    const H = hostGame(ctx, { onInput: (d, s) => { if (s > 0 && s < N) { gin[s].x = +d.x || 0; gin[s].y = +d.y || 0; gin[s].f = d.f | 0; } }, onSnap: (d) => { if (sum(d.sc) > sum(sc)) snd(120, 0.5, 0.1, 'sawtooth'); sc = d.sc; (d.fx || []).forEach((e) => { fx.push({ x: e[0], y: e[1], t: 0.5 }); boom(e[0], e[1], true); }); if (d.B.length > lastB) snd(200, 0.08, 0.05, 'square'); lastB = d.B.length; } });
    // ---- botlar (faqat uy egasida): BFS bilan yo'l topadi, ko'rinsa minorani nishonga buradi, kechikish + xato bilan otadi, o'qdan chetlanadi ----
    const BOT = [...(ctx.bots || [])].filter((i) => i < N), AI = {};
    const free = []; for (let j = 0; j < AH; j++) for (let i = 0; i < AW; i++) free.push(!wallHit(i + 0.5, j + 0.5, 0.6));
    const los = (x0, y0, x1, y1) => { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 4); for (let k = 1; k < n; k++) if (wallHit(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, 0.12)) return false; return true; };
    const bfs = (tx, ty) => { const D = new Int16Array(AW * AH).fill(-1), q = [Math.min(AH - 1, ty | 0) * AW + Math.min(AW - 1, tx | 0)]; D[q[0]] = 0; for (let h = 0; h < q.length; h++) { const k = q[h], x = k % AW, y = (k / AW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, nk = ny * AW + nx; if (nx >= 0 && ny >= 0 && nx < AW && ny < AH && D[nk] < 0 && free[nk]) { D[nk] = D[k] + 1; q.push(nk); } } } return D; };
    const nrm = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const brain = (i, dt) => { const t = T[i], a = AI[i] || (AI[i] = { tg: -1, tgT: 0, react: 0, err: 0, D: null, dT: 0, dodge: 0, dx: 0, dy: 0, aimT: 0.3 + Math.random() * 0.25 }); const out = { x: 0, y: 0, f: seen[i] };
      a.tgT -= dt; if (a.tgT <= 0 || !T[a.tg] || T[a.tg].dead > 0 || T[a.tg].out) { a.tgT = 0.6; let bd = 1e9; a.tg = -1; T.forEach((e, j) => { if (j === i || e.dead > 0 || e.out) return; const d = Math.hypot(e.x - t.x, e.y - t.y) * (los(t.x, t.y, e.x, e.y) ? 0.6 : 1); if (d < bd) { bd = d; a.tg = j; } }); a.D = null; }
      const e = T[a.tg]; if (!e) return out;
      // chetlanish: yaqinlashayotgan o'q
      if (a.dodge > 0) { a.dodge -= dt; out.x = a.dx; out.y = a.dy; return out; }
      for (const b of B) { if (b.o === i) continue; const rx = t.x - b.x, ry = t.y - b.y, sp = Math.hypot(b.vx, b.vy), al = (rx * b.vx + ry * b.vy) / sp; if (al > 0 && al < 4.5 && Math.abs(rx * b.vy - ry * b.vx) / sp < 0.9 && Math.random() < 0.55) { const s = Math.random() < 0.5 ? 1 : -1; a.dx = (-b.vy / sp) * s; a.dy = (b.vx / sp) * s; if (wallHit(t.x + a.dx * 1.2, t.y + a.dy * 1.2, 0.55)) { a.dx = -a.dx; a.dy = -a.dy; } a.dodge = 0.35; out.x = a.dx; out.y = a.dy; return out; } }
      const dx = e.x - t.x, dy = e.y - t.y, d = Math.hypot(dx, dy);
      if (d < 14 && los(t.x, t.y, e.x, e.y)) {
        a.react += dt; const want = Math.atan2(dy, dx) + a.err, da = nrm(want - t.a), m = Math.abs(da) > 0.15 ? 0.22 : d > 7 ? 0.65 : d < 3 ? 0 : 0.22;
        out.x = Math.cos(want) * Math.max(m, 0.21); out.y = Math.sin(want) * Math.max(m, 0.21);
        if (a.react > a.aimT && Math.abs(da) < 0.09 && t.cd <= 0) { out.f = seen[i] + 1; a.err = (Math.random() - 0.5) * 0.24; a.aimT = 0.15 + Math.random() * 0.3; a.react = 0; }
      } else {
        a.react = Math.max(0, a.react - dt); a.dT -= dt; if (!a.D || a.dT <= 0) { a.D = bfs(e.x, e.y); a.dT = 0.5; }
        const cx = Math.min(AW - 1, t.x | 0), cy = Math.min(AH - 1, t.y | 0); let best = null, bv = 1e9;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const nx = cx + ox, ny = cy + oy; if (nx < 0 || ny < 0 || nx >= AW || ny >= AH || (!ox && !oy)) continue; const v = a.D[ny * AW + nx]; if (v >= 0 && (ox && oy ? free[cy * AW + nx] && free[ny * AW + cx] : true) && v + (ox && oy ? 0.4 : 0) < bv) { bv = v + (ox && oy ? 0.4 : 0); best = [nx + 0.5, ny + 0.5]; } }
        if (best) { const mx = best[0] - t.x, my = best[1] - t.y, mm = Math.hypot(mx, my) || 1; out.x = mx / mm; out.y = my / mm; }
      }
      return out; };
    // fon: offscreen keshda (o'lcham yoki burilish o'zgarganda qayta chiziladi)
    let BG = null, bgK = '';
    const drawBG = (W, H, flip, s, ox, oy, X, Y) => {
      const k = W + 'x' + H + (flip ? 'f' : ''); if (bgK === k) return; bgK = k; const d = Math.min(3, devicePixelRatio || 1);
      BG = document.createElement('canvas'); BG.width = Math.round(W * d); BG.height = Math.round(H * d); const b = BG.getContext('2d'); b.setTransform(d, 0, 0, d, 0, 0);
      b.fillStyle = '#1A2E05'; b.fillRect(0, 0, W, H); const gr = b.createLinearGradient(ox, oy, ox + AW * s, oy + AH * s); gr.addColorStop(0, '#4D7C0F'); gr.addColorStop(1, '#3F6212'); b.fillStyle = gr; b.fillRect(ox, oy, AW * s, AH * s);
      let sd = 7; const rn = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
      b.save(); b.beginPath(); b.rect(ox, oy, AW * s, AH * s); b.clip();
      for (let i = 0; i < 260; i++) { b.fillStyle = rn() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.05)'; b.beginPath(); b.arc(ox + rn() * AW * s, oy + rn() * AH * s, 1 + rn() * s * 0.35, 0, 7); b.fill(); }
      for (let i = 0; i < 6; i++) { b.fillStyle = 'rgba(120,53,15,.22)'; b.beginPath(); b.ellipse(ox + rn() * AW * s, oy + rn() * AH * s, s * (0.8 + rn()), s * (0.5 + rn() * 0.5), rn() * 3, 0, 7); b.fill(); } b.restore(); // tuproq dog'lari
      WALLS.forEach(([wx, wy, ww, wh]) => { const x0 = Math.min(X(wx), X(wx + ww)), y0 = Math.min(Y(wy), Y(wy + wh)), w = ww * s, h = wh * s;
        b.fillStyle = 'rgba(0,0,0,.35)'; b.fillRect(x0 + 4, y0 + 5, w, h); b.fillStyle = '#57534E'; b.fillRect(x0, y0, w, h); b.fillStyle = '#78716C'; b.fillRect(x0 + 2, y0 + 2, w - 4, h * 0.45);
        b.strokeStyle = 'rgba(0,0,0,.25)'; b.lineWidth = 1; for (let yy = y0 + s * 0.5; yy < y0 + h - 1; yy += s * 0.5) { b.beginPath(); b.moveTo(x0, yy); b.lineTo(x0 + w, yy); b.stroke(); } for (let xx = x0 + s; xx < x0 + w - 1; xx += s) { b.beginPath(); b.moveTo(xx, y0); b.lineTo(xx, y0 + h); b.stroke(); } });
      b.strokeStyle = '#292524'; b.lineWidth = 4; b.strokeRect(ox, oy, AW * s, AH * s);
    };
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    const stop = loop((dt) => {
      const kd = keysDown; let jx = pad.x, jy = pad.y; if (kd.has('arrowleft') || kd.has('a')) jx = -1; if (kd.has('arrowright') || kd.has('d')) jx = 1; if (kd.has('arrowup') || kd.has('w')) jy = -1; if (kd.has('arrowdown') || kd.has('s')) jy = 1;
      if (pad.take('fire') || kd.has(' ')) myF++;
      sendT += dt; const newFx = [];
      if (H.HOST && H.link.st.alive && !H.over) {
        const inputs = T.map((_, i) => (i === 0 ? { x: jx, y: jy, f: myF } : FL(i) ? { x: -gin[i].x, y: -gin[i].y, f: gin[i].f } : gin[i]));
        for (const i of BOT) if (!T[i].out && T[i].dead <= 0) inputs[i] = brain(i, dt);
        const fire = inputs.map((p, i) => p.f > seen[i]); inputs.forEach((p, i) => (seen[i] = p.f));
        T.forEach((t, i) => {
          if (t.out) return; t.cd = Math.max(0, t.cd - dt);
          if (t.dead > 0) { t.dead -= dt; if (t.dead <= 0) Object.assign(t, spawn(i), { hp: 3 }); return; }
          const inp = inputs[i], m = Math.hypot(inp.x, inp.y);
          if (m > 0.2) { const want = Math.atan2(inp.y, inp.x); let da = ((want - t.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; t.a += Math.max(-4 * dt, Math.min(4 * dt, da)); const sp = 4.2 * Math.min(1, m) * (Math.abs(da) < 1.2 ? 1 : 0.3); const nx = t.x + Math.cos(t.a) * sp * dt, ny = t.y + Math.sin(t.a) * sp * dt; if (!wallHit(nx, t.y, 0.55)) t.x = nx; if (!wallHit(t.x, ny, 0.55)) t.y = ny; }
          if (fire[i] && t.cd <= 0) { t.cd = 0.6; B.push({ x: t.x + Math.cos(t.a) * 0.8, y: t.y + Math.sin(t.a) * 0.8, vx: Math.cos(t.a) * 11, vy: Math.sin(t.a) * 11, o: i, b: 1, life: 2.2 }); snd(200, 0.08, 0.06, 'square'); }
        });
        for (const b of B) {
          b.life -= dt; const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
          if (wallHit(nx, b.y, 0.1)) { if (b.b-- > 0) b.vx = -b.vx; else b.life = 0; } else b.x = nx;
          if (wallHit(b.x, ny, 0.1)) { if (b.b-- > 0) b.vy = -b.vy; else b.life = 0; } else b.y = ny;
          if (b.life <= 0) boom(b.x, b.y, false);
          T.forEach((t, i) => { if (b.life > 0 && !t.out && t.dead <= 0 && (i !== b.o || b.b < 1) && Math.hypot(t.x - b.x, t.y - b.y) < 0.6) { b.life = 0; t.hp--; newFx.push([b.x, b.y]); snd(90, 0.15, 0.08, 'sawtooth'); if (t.hp <= 0) { t.dead = 2; newFx.push([t.x, t.y]);
            if (N === 2) { const w = i === b.o ? 1 - i : b.o; sc[w]++; if (sc[w] >= WIN) H.end(w); }
            else if (i === b.o) sc[i] = Math.max(0, sc[i] - 1); // o'zini o'ldirsa −1
            else { sc[b.o]++; if (sc[b.o] >= WIN) H.end(b.o); } } } });
        }
        B = B.filter((b) => b.life > 0); newFx.forEach((e) => { fx.push({ x: e[0], y: e[1], t: 0.5 }); boom(e[0], e[1], true); });
        if (sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 's', T: T.map((t) => [Math.round(t.x * 100) / 100, Math.round(t.y * 100) / 100, Math.round(t.a * 100) / 100, t.hp, t.dead > 0 || t.out ? 1 : 0]), B: B.map((b) => [Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10]), sc, fx: newFx }); }
      } else if (!H.HOST && ctx.me >= 0 && sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(jx * 100) / 100, y: Math.round(jy * 100) / 100, f: myF }); }
      let TV = T.map((t) => [t.x, t.y, t.a, t.hp, t.dead > 0 || t.out ? 1 : 0]), BV = B.map((b) => [b.x, b.y]);
      if (!H.HOST && H.snap) { const pv = H.prevS(); TV = H.snap.T.map((q, i) => [H.lerp(pv?.T[i]?.[0] ?? q[0], q[0], 50), H.lerp(pv?.T[i]?.[1] ?? q[1], q[1], 50), q[2], q[3], q[4]]); BV = H.snap.B; }
      // chizish (tepadan boshlaganlar uchun 180° burilgan)
      const flip = ctx.me >= 0 && FL(ctx.me), s = Math.min(c.W / AW, c.H / AH), ox = (c.W - AW * s) / 2, oy = (c.H - AH * s) / 2, X = (x) => ox + (flip ? AW - x : x) * s, Y = (y) => oy + (flip ? AH - y : y) * s;
      drawBG(c.W, c.H, flip, s, ox, oy, X, Y);
      g.save(); if (shake > 0) { shake = Math.max(0, shake - dt); const k = shake * 22; g.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k); }
      g.drawImage(BG, 0, 0, c.W, c.H);
      fx = fx.filter((e) => (e.t -= dt) > 0); fx.forEach((e) => { g.fillStyle = `rgba(41,37,36,${e.t * 0.5})`; g.beginPath(); g.arc(X(e.x), Y(e.y), 0.6 * s, 0, 7); g.fill(); g.fillStyle = `rgba(251,146,60,${e.t * 2})`; g.beginPath(); g.arc(X(e.x), Y(e.y), (0.5 - e.t) * 3 * s + 0.3 * s, 0, 7); g.fill(); });
      TV.forEach((q, i) => { if (q[4]) return; if (N > 2 && i === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 3; g.beginPath(); g.arc(X(q[0]), Y(q[1]), 0.85 * s, 0, 7); g.stroke(); }
        g.save(); g.translate(X(q[0]), Y(q[1])); g.rotate(q[2] + (flip ? Math.PI : 0));
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-0.55 * s + 3, -0.45 * s + 4, 1.2 * s, 0.95 * s);
        g.fillStyle = '#1C1917'; g.fillRect(-0.62 * s, -0.52 * s, 1.24 * s, 0.24 * s); g.fillRect(-0.62 * s, 0.28 * s, 1.24 * s, 0.24 * s);
        g.fillStyle = 'rgba(255,255,255,.12)'; for (let k = -0.55; k < 0.6; k += 0.22) { g.fillRect(k * s, -0.5 * s, 0.06 * s, 0.2 * s); g.fillRect(k * s, 0.3 * s, 0.06 * s, 0.2 * s); } // gusenitsa
        const bd = g.createLinearGradient(0, -0.36 * s, 0, 0.36 * s); bd.addColorStop(0, '#FFFFFF55'); bd.addColorStop(0.3, COL[i]); bd.addColorStop(1, COL[i]); g.fillStyle = COL[i]; rr(g, -0.5 * s, -0.36 * s, 1 * s, 0.72 * s, 5); g.fill(); g.fillStyle = bd; rr(g, -0.5 * s, -0.36 * s, 1 * s, 0.72 * s, 5); g.fill();
        g.fillStyle = '#0C0A09'; g.fillRect(0.05 * s, -0.08 * s, 0.75 * s, 0.16 * s); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(0, 0, 0.28 * s, 0, 7); g.fill(); g.fillStyle = COL[i]; g.beginPath(); g.arc(-0.02 * s, -0.02 * s, 0.22 * s, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(-0.08 * s, -0.08 * s, 0.08 * s, 0, 7); g.fill();
        if (H.HOST && T[i].cd > 0.5) { g.fillStyle = '#FDE047'; g.beginPath(); g.arc(0.9 * s, 0, 0.22 * s, 0, 7); g.fill(); }
        g.restore();
        for (let k = 0; k < 3; k++) { g.fillStyle = k < q[3] ? '#22C55E' : 'rgba(255,255,255,.25)'; g.fillRect(X(q[0]) - 0.45 * s + k * 0.32 * s, Y(q[1]) - 0.85 * s, 0.26 * s, 0.1 * s); } });
      BV.forEach((b) => { g.fillStyle = 'rgba(253,224,71,.3)'; g.beginPath(); g.arc(X(b[0]), Y(b[1]), 0.26 * s, 0, 7); g.fill(); g.fillStyle = '#FEF08A'; g.beginPath(); g.arc(X(b[0]), Y(b[1]), 0.13 * s, 0, 7); g.fill(); });
      for (let i = PT.length - 1; i >= 0; i--) { const q = PT[i]; q.t -= dt; if (q.t <= 0) { PT.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.92; q.vy *= 0.92; g.globalAlpha = Math.min(1, q.t * 2); g.fillStyle = q.col; g.beginPath(); g.arc(X(q.x), Y(q.y), q.r * s, 0, 7); g.fill(); } g.globalAlpha = 1;
      g.restore();
      if (N === 2) { g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, c.W / 2 - 70, 6, 140, 28, 14); g.fill(); text(g, `${ME ? '🟠' : '🟢'} ${sc[ME]} : ${sc[1 - ME]} ${ME ? '🟢' : '🟠'}`, c.W / 2, 20, 15); }
      else { const w = N * 50; g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, c.W / 2 - w / 2, 6, w, 28, 14); g.fill(); sc.forEach((v, i) => { const x = c.W / 2 - w / 2 + 14 + i * 50, dim = ctx.out?.has(i); g.globalAlpha = dim ? 0.35 : 1; g.fillStyle = COL[i]; g.beginPath(); g.arc(x, 20, 7, 0, 7); g.fill(); if (i === ctx.me) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.stroke(); } text(g, String(v), x + 18, 20, 15, i === ctx.me ? '#FDE047' : '#fff'); g.globalAlpha = 1; }); }
      if (!H.link.st.alive) text(g, rt('wait_rt'), c.W / 2, c.H / 2, 16); else if (ctx.me >= 0 && TV[ME]?.[4] && !ctx.out?.has(ME)) text(g, rt('respawn'), c.W / 2, c.H / 2, 18, '#FCA5A5');
      if (H.link.lost() && !H.over) text(g, rt('lost'), c.W / 2, c.H * 0.7, 14, '#FCA5A5');
    });
    return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit, quit: (s) => { if (T[s]) T[s].out = 1; B = B.filter((b) => b.o !== s); } };
  };


  // ---- Sumo: raqibni doiradan itarib chiqaring. 3 raund yutgan g'olib ----
  MPI.sumo = (stage, ctx) => {
    const R = 1, PR = 0.13, WIN = 3;
    // effektlar: chang zarralari (maydon koordinatasida) + silkinish
    const PT = []; let shake = 0;
    const dust = (x, y, n, sp, col = '#E7CFA4') => { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = sp * (0.3 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.4 + Math.random() * 0.4, col, r: 2 + Math.random() * 3 }); } if (PT.length > 140) PT.splice(0, PT.length - 140); };
    // bot: eng yaqin (ayniqsa chetga yaqin) raqibni tanlaydi, uning markaz tomoniga o'tib tashqariga itaradi, o'zi chetga yaqinlashsa markazga qaytadi; yaqinda — keskin hamla (dash)
    const AI = {};
    const brain = (i, P, dt) => { const p = P[i], a = AI[i] || (AI[i] = { t: 0, tg: -1, ox: 0, oy: 0, j: Math.random() * 7, k: 0.82 + Math.random() * 0.12 }); a.t -= dt;
      if (a.t <= 0) { a.t = 0.14 + Math.random() * 0.12; let bs = 1e9; a.tg = -1; P.forEach((q, j) => { if (j === i || q.in === false) return; const v = Math.hypot(q.x - p.x, q.y - p.y) - Math.hypot(q.x, q.y) * 0.5; if (v < bs) { bs = v; a.tg = j; } }); if (a.tg >= 0) { a.ox = P[a.tg].x; a.oy = P[a.tg].y; } }
      const r = Math.hypot(p.x, p.y) || 1e-6, vout = (p.x * p.vx + p.y * p.vy) / r; let x = 0, y = 0, dash = false;
      if (r > 0.7 && vout > -0.15) { x = -p.x / r; y = -p.y / r; if (r > 0.84 && vout > 0.3 && Math.random() < 0.7) dash = true; } // chetdan qochish
      else if (a.tg >= 0) {
        const orr = Math.hypot(a.ox, a.oy) || 1e-6, dx = a.ox - p.x, dy = a.oy - p.y, d = Math.hypot(dx, dy) || 1e-6, inside = r < orr + 0.04;
        const tx = inside ? dx : a.ox - (a.ox / orr) * PR * 2.4 - p.x, ty = inside ? dy : a.oy - (a.oy / orr) * PR * 2.4 - p.y, m = Math.hypot(tx, ty) || 1; x = tx / m; y = ty / m;
        if (inside && d < PR * 2 + 0.28 && Math.random() < dt * 2.5) dash = true;
      }
      const w = Math.sin(performance.now() / 400 + a.j) * 0.18; return { x: (x - y * w) * a.k, y: (y + x * w) * a.k, dash };
    };
    // chizish yordamchilari
    const arena = (g, W, H, cx, cy, s) => {
      const bg = g.createRadialGradient(cx, cy - s * 0.3, s * 0.2, cx, cy, Math.max(W, H) * 0.75); bg.addColorStop(0, '#44403C'); bg.addColorStop(1, '#0C0A09'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(cx, cy + 10, (R + 0.2) * s, (R + 0.2) * s * 0.98, 0, 0, 7); g.fill();
      const wd = g.createLinearGradient(0, cy - (R + 0.16) * s, 0, cy + (R + 0.16) * s); wd.addColorStop(0, '#B08560'); wd.addColorStop(1, '#7C5A3C'); g.fillStyle = wd; g.beginPath(); g.arc(cx, cy, (R + 0.16) * s, 0, 7); g.fill();
      const cl = g.createRadialGradient(cx - s * 0.25, cy - s * 0.3, s * 0.1, cx, cy, R * s); cl.addColorStop(0, '#F3E1BC'); cl.addColorStop(1, '#D9BC8A'); g.fillStyle = cl; g.beginPath(); g.arc(cx, cy, R * s, 0, 7); g.fill();
      g.strokeStyle = '#A3814F'; g.lineWidth = Math.max(5, s * 0.06); g.beginPath(); g.arc(cx, cy, R * s, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.setLineDash([6, 7]); g.beginPath(); g.arc(cx, cy, R * s - 1, 0, 7); g.stroke(); g.setLineDash([]); // somon arqon
    };
    const wrestler = (g, x, y, r, col, dashing, alpha) => {
      g.globalAlpha = alpha; g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x + 3, y + 6, r * 1.02, r * 0.72, 0, 0, 7); g.fill();
      if (dashing) { g.fillStyle = 'rgba(253,224,71,.35)'; g.beginPath(); g.arc(x, y, r * 1.35, 0, 7); g.fill(); }
      const sk = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); sk.addColorStop(0, '#FFE4C7'); sk.addColorStop(1, '#E0A97A'); g.fillStyle = sk; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.strokeStyle = col; g.lineWidth = r * 0.34; g.beginPath(); g.arc(x, y, r * 0.78, 0, 7); g.stroke(); // mavashi kamari
      g.fillStyle = '#1C1917'; g.beginPath(); g.arc(x, y, r * 0.3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(x - r * 0.08, y - r * 0.1, r * 0.1, 0, 7); g.fill(); // tepadan: boshidagi tugun
      g.globalAlpha = 1;
    };
    const drawPT = (g, V, dt) => { for (let i = PT.length - 1; i >= 0; i--) { const q = PT[i]; q.t -= dt; if (q.t <= 0) { PT.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.92; q.vy *= 0.92; const [x, y] = V(q.x, q.y); g.globalAlpha = Math.min(0.8, q.t * 1.6); g.fillStyle = q.col; g.beginPath(); g.arc(x, y, q.r, 0, 7); g.fill(); } g.globalAlpha = 1; };
    const shk = (g, dt) => { if (shake > 0) { shake = Math.max(0, shake - dt); const k = shake * 24; g.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k); } };
    if ((ctx.n || 2) > 2) { // 3–4 kishi: hamma doirada, chiqib ketgan raunddan chiqadi, oxirgi qolgan raundni yutadi
      stage.classList.add('gm-stage-pad');
      const NP = ctx.n, { c, g, fit } = canvasIn(stage, 0.8), pad = padUI(stage, [{ id: 'dash', t: '💨', cls: 'big' }]);
      const ME = Math.max(0, ctx.me), COL = ctx.col, AN = (i) => Math.PI / 2 + (i * Math.PI * 2) / NP, VA = -(ME * Math.PI * 2) / NP; // VA: o'zimiz pastda bo'lishi uchun burish
      const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
      const start = () => Array.from({ length: NP }, (_, i) => ({ x: Math.cos(AN(i)) * 0.5, y: Math.sin(AN(i)) * 0.5, vx: 0, vy: 0, dash: 0, cd: 0, in: !ctx.out?.has(i) }));
      let P = start(), sc = Array(NP).fill(0), pause = 1.5, msg = '', msgT = 0, sendT = 0, aliveT = 0, started = false;
      const gin = Array.from({ length: NP }, () => ({ x: 0, y: 0, d: 0 })), seen = Array(NP).fill(0), got = new Set(ctx.bots || []); let myD = 0;
      const BOT = [...(ctx.bots || [])].filter((i) => i < NP);
      let pin = null; // mehmon: chiqib ketganlarni aniqlash uchun oldingi holat
      const H = hostGame(ctx, { onInput: (d, s) => { if (s > 0 && s < NP) { got.add(s); gin[s] = { x: Math.max(-1, Math.min(1, +d.x || 0)), y: Math.max(-1, Math.min(1, +d.y || 0)), d: d.d | 0 }; } },
        onSnap: (d) => { if (d.sc.reduce((a, b) => a + b, 0) > sc.reduce((a, b) => a + b, 0)) { snd(300, 0.4, 0.08, 'triangle'); msg = '💥'; msgT = 1; } sc = d.sc; d.P.forEach((q, i) => { if (pin && pin[i] && !q[4]) { dust(q[0], q[1], 14, 0.8); shake = 0.3; } }); pin = d.P.map((q) => q[4]); } });
      ctx.turn(-1, rt('first').replace('{n}', WIN));
      const stop = loop((dt) => {
        const kd = keysDown; let jx = pad.x, jy = pad.y; if (kd.has('arrowleft') || kd.has('a')) jx = -1; if (kd.has('arrowright') || kd.has('d')) jx = 1; if (kd.has('arrowup') || kd.has('w')) jy = -1; if (kd.has('arrowdown') || kd.has('s')) jy = 1;
        if (pad.take('dash') || kd.has(' ')) myD++;
        [jx, jy] = rot(jx, jy, -VA); // ekran yo'nalishi → maydon yo'nalishi
        sendT += dt; if (H.link.st.alive) aliveT += dt;
        if (H.HOST && H.link.st.alive && !H.over) {
          if (!started) started = aliveT > 4 || ctx.active().every((s) => s === 0 || got.has(s));
          gin[0] = { x: jx, y: jy, d: myD };
          if (pause <= 0) for (const b of BOT) { if (!P[b].in) continue; const q = brain(b, P, dt); gin[b] = { x: q.x, y: q.y, d: seen[b] + (q.dash ? 1 : 0) }; }
          const dsh = gin.map((q, i) => q.d > seen[i]); gin.forEach((q, i) => (seen[i] = q.d));
          if (!started); else if (pause > 0) { pause -= dt; if (pause <= 0) P = start(); }
          else {
            P.forEach((p, i) => { if (!p.in) return; const inp = ctx.out?.has(i) ? { x: 0, y: 0 } : gin[i]; p.cd = Math.max(0, p.cd - dt); p.dash = Math.max(0, p.dash - dt); p.vx += inp.x * 3.2 * dt; p.vy += inp.y * 3.2 * dt;
              if (dsh[i] && p.cd <= 0 && !ctx.out?.has(i)) { const m = Math.hypot(inp.x, inp.y) || 1; p.vx += (inp.x / m) * 1.6; p.vy += (inp.y / m) * 1.6; p.cd = 1.4; p.dash = 0.25; snd(240, 0.08, 0.06); dust(p.x, p.y, 6, 0.5); }
              p.vx *= Math.pow(0.35, dt); p.vy *= Math.pow(0.35, dt); p.x += p.vx * dt; p.y += p.vy * dt; });
            for (let i = 0; i < NP; i++) for (let j = i + 1; j < NP; j++) { const a = P[i], b = P[j]; if (!a.in || !b.in) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
              if (d < PR * 2 && d > 0) { const nx = dx / d, ny = dy / d, rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (rv > 0) { const ka = a.dash > 0 ? 0.6 : 1, kb = b.dash > 0 ? 0.6 : 1; const jj = rv * 1.25; a.vx -= jj * nx * ka; a.vy -= jj * ny * ka; b.vx += jj * nx * kb; b.vy += jj * ny * kb; snd(160, 0.05, 0.06); if (rv > 0.5) { dust(a.x + nx * PR, a.y + ny * PR, 8, 0.6, '#FFFFFF'); shake = Math.max(shake, 0.12); } } const o = (PR * 2 - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; } }
            P.forEach((p) => { if (p.in && Math.hypot(p.x, p.y) > R + PR * 0.3) { p.in = false; snd(200, 0.2, 0.06, 'triangle'); dust(p.x, p.y, 14, 0.8); shake = 0.3; } });
            const left = P.map((p, i) => (p.in ? i : -1)).filter((i) => i >= 0);
            if (left.length <= 1) { const w = left.length ? left[0] : -1; if (w >= 0) { sc[w]++; msg = '💥'; msgT = 1; snd(300, 0.4, 0.08, 'triangle'); if (sc[w] >= WIN) H.end(w); } pause = 1.4; }
          }
          if (sendT > 0.04) { sendT = 0; ctx.rt?.send({ t: 's', P: P.map((p) => [Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000, p.dash > 0 ? 1 : 0, Math.round(p.cd * 10) / 10, p.in ? 1 : 0]), sc }); }
        } else if (!H.HOST && ctx.me >= 0 && sendT > 0.04) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(jx * 100) / 100, y: Math.round(jy * 100) / 100, d: myD }); }
        let PV = P.map((p) => [p.x, p.y, p.dash > 0 ? 1 : 0, p.cd, p.in ? 1 : 0]);
        if (!H.HOST && H.snap) { const pv = H.prevS(); PV = H.snap.P.map((q, i) => [H.lerp(pv?.P[i]?.[0] ?? q[0], q[0], 40), H.lerp(pv?.P[i]?.[1] ?? q[1], q[1], 40), q[2], q[3], q[4]]); }
        const s = Math.min(c.W, c.H) / 2.6, cx = c.W / 2, cy = c.H / 2 + 10, V = (x, y) => { const [a, b] = rot(x, y, VA); return [cx + a * s, cy + b * s]; };
        g.save(); shk(g, dt); arena(g, c.W, c.H, cx, cy, s);
        for (let i = 0; i < NP; i++) { const [x, y] = V(Math.cos(AN(i)) * 0.5, Math.sin(AN(i)) * 0.5); g.strokeStyle = COL[i] + '66'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, PR * s * 0.7, 0, 7); g.stroke(); } // boshlang'ich joylar
        drawPT(g, V, dt);
        PV.forEach((q, i) => { const [x, y] = V(q[0], q[1]); wrestler(g, x, y, PR * s, COL[i], q[2], q[4] ? 1 : 0.3);
          if (i === ME && ctx.me >= 0) { g.globalAlpha = q[4] ? 1 : 0.3; g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.arc(x, y, PR * s + 12, 0, 7); g.stroke(); g.setLineDash([]); if (q[3] > 0) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, PR * s + 8, -Math.PI / 2, -Math.PI / 2 + (1 - q[3] / 1.4) * Math.PI * 2); g.stroke(); } g.globalAlpha = 1; } });
        g.restore();
        const cw = Math.min(80, c.W / NP); g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, cx - (cw * NP) / 2 - 6, 8, cw * NP + 12, 28, 14); g.fill();
        for (let j = 0; j < NP; j++) { const x = cw * (j - (NP - 1) / 2) + cx; g.globalAlpha = ctx.out?.has(j) ? 0.4 : 1; g.fillStyle = COL[j]; g.beginPath(); g.arc(x - 12, 22, 8, 0, 7); g.fill(); if (j === ME && ctx.me >= 0) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.beginPath(); g.arc(x - 12, 22, 11, 0, 7); g.stroke(); } text(g, String(sc[j]), x + 10, 22, 20); g.globalAlpha = 1; }
        if (!H.link.st.alive || (H.HOST && !started)) text(g, rt('wait_rt'), cx, cy, 16, '#111');
        else if (ctx.me >= 0 && PV[ME] && !PV[ME][4]) text(g, '👀', cx, cy + R * s * 0.55, 22);
        if (msgT > 0) { msgT -= dt; text(g, msg, cx, cy, 54 + (1 - msgT) * 20); }
        if (H.link.lost() && !H.over) text(g, rt('lost'), cx, c.H * 0.9, 14, '#FCA5A5');
      });
      return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit, quit: (s) => { if (P[s]) P[s].in = false; } };
    }
    stage.classList.add('gm-stage-pad');
    const { c, g, fit } = canvasIn(stage, 0.8);
    const pad = padUI(stage, [{ id: 'dash', t: '💨', cls: 'big' }]);
    const ME = Math.max(0, ctx.me), COL = ['#2563EB', '#DC2626'], BOT = ctx.isBot?.(1);
    const start = () => [{ x: 0, y: 0.45, vx: 0, vy: 0, dash: 0, cd: 0 }, { x: 0, y: -0.45, vx: 0, vy: 0, dash: 0, cd: 0 }];
    let P = start(), sc = [0, 0], pause = 1.5, msg = '', msgT = 0, sendT = 0;
    const gin = { x: 0, y: 0, d: 0 }; let seenD = 0, myD = 0, seenD0 = 0;
    const H = hostGame(ctx, { onInput: (d) => { gin.x = +d.x || 0; gin.y = +d.y || 0; gin.d = d.d | 0; }, onSnap: (d) => { if (d.sc[0] + d.sc[1] > sc[0] + sc[1]) { snd(300, 0.4, 0.08, 'triangle'); msg = '💥'; msgT = 1; shake = 0.3; const q = d.P.find((p) => Math.hypot(p[0], p[1]) > R) || d.P[0]; dust(q[0], q[1], 14, 0.8); } sc = d.sc; } });
    ctx.turn(-1, rt('first').replace('{n}', WIN));
    const stop = loop((dt) => {
      const kd = keysDown; let jx = pad.x, jy = pad.y; if (kd.has('arrowleft') || kd.has('a')) jx = -1; if (kd.has('arrowright') || kd.has('d')) jx = 1; if (kd.has('arrowup') || kd.has('w')) jy = -1; if (kd.has('arrowdown') || kd.has('s')) jy = 1;
      if (pad.take('dash') || kd.has(' ')) myD++;
      sendT += dt;
      if (H.HOST && H.link.st.alive && !H.over) {
        if (BOT && pause <= 0) { const q = brain(1, P, dt); gin.x = -q.x; gin.y = -q.y; if (q.dash) gin.d = seenD + 1; } // bot: maydon koordinatasida (mehmon kabi teskari)
        const inputs = [{ x: jx, y: jy, d: myD }, { x: -gin.x, y: -gin.y, d: gin.d }]; const dsh = [inputs[0].d > seenD0, inputs[1].d > seenD]; seenD0 = inputs[0].d; seenD = inputs[1].d;
        if (pause > 0) { pause -= dt; if (pause <= 0) P = start(); }
        else {
          P.forEach((p, i) => { const inp = inputs[i]; p.cd = Math.max(0, p.cd - dt); p.dash = Math.max(0, p.dash - dt); p.vx += inp.x * 3.2 * dt; p.vy += inp.y * 3.2 * dt;
            if (dsh[i] && p.cd <= 0) { const m = Math.hypot(inp.x, inp.y) || 1; p.vx += (inp.x / m) * 1.6; p.vy += (inp.y / m) * 1.6; p.cd = 1.4; p.dash = 0.25; snd(240, 0.08, 0.06); dust(p.x, p.y, 6, 0.5); }
            p.vx *= Math.pow(0.35, dt); p.vy *= Math.pow(0.35, dt); p.x += p.vx * dt; p.y += p.vy * dt; });
          const [a, b] = P, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d < PR * 2 && d > 0) { const nx = dx / d, ny = dy / d, rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (rv > 0) { const ka = a.dash > 0 ? 0.6 : 1, kb = b.dash > 0 ? 0.6 : 1; const j = rv * 1.25; a.vx -= j * nx * ka; a.vy -= j * ny * ka; b.vx += j * nx * kb; b.vy += j * ny * kb; snd(160, 0.05, 0.06); if (rv > 0.5) { dust(a.x + nx * PR, a.y + ny * PR, 8, 0.6, '#FFFFFF'); shake = Math.max(shake, 0.12); } } const o = (PR * 2 - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; }
          const out = P.map((p) => Math.hypot(p.x, p.y) > R + PR * 0.3);
          if (out[0] || out[1]) { const w = out[0] && out[1] ? -1 : out[0] ? 1 : 0; P.forEach((p, i) => { if (out[i]) dust(p.x, p.y, 14, 0.8); }); shake = 0.3; if (w >= 0) { sc[w]++; msg = '💥'; msgT = 1; snd(300, 0.4, 0.08, 'triangle'); if (sc[w] >= WIN) H.end(w); } pause = 1.4; }
        }
        if (sendT > 0.04) { sendT = 0; ctx.rt?.send({ t: 's', P: P.map((p) => [Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000, p.dash > 0 ? 1 : 0, Math.round(p.cd * 10) / 10]), sc }); }
      } else if (!H.HOST && ctx.me >= 0 && sendT > 0.04) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(jx * 100) / 100, y: Math.round(jy * 100) / 100, d: myD }); }
      let PV = P.map((p) => [p.x, p.y, p.dash > 0 ? 1 : 0, p.cd]);
      if (!H.HOST && H.snap) { const pv = H.prevS(); PV = H.snap.P.map((q, i) => [H.lerp(pv?.P[i][0] ?? q[0], q[0], 40), H.lerp(pv?.P[i][1] ?? q[1], q[1], 40), q[2], q[3]]); }
      const flip = ctx.me === 1, s = Math.min(c.W, c.H) / 2.6, cx = c.W / 2, cy = c.H / 2, X = (x) => cx + (flip ? -x : x) * s, Y = (y) => cy + (flip ? -y : y) * s;
      g.save(); shk(g, dt); arena(g, c.W, c.H, cx, cy, s);
      g.strokeStyle = '#F8FAFC'; g.lineWidth = 3; [-0.12, 0.12].forEach((x) => { g.beginPath(); g.moveTo(cx + x * s, cy - 0.12 * s); g.lineTo(cx + x * s, cy + 0.12 * s); g.stroke(); });
      drawPT(g, (x, y) => [X(x), Y(y)], dt);
      PV.forEach((q, i) => { const x = X(q[0]), y = Y(q[1]); wrestler(g, x, y, PR * s, COL[i], q[2], 1); if (i === ME && q[3] > 0) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, PR * s + 9, -Math.PI / 2, -Math.PI / 2 + (1 - q[3] / 1.4) * Math.PI * 2); g.stroke(); } });
      g.restore();
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, cx - 64, 8, 128, 32, 16); g.fill(); g.fillStyle = COL[ME]; g.beginPath(); g.arc(cx - 46, 24, 7, 0, 7); g.fill(); g.fillStyle = COL[1 - ME]; g.beginPath(); g.arc(cx + 46, 24, 7, 0, 7); g.fill();
      text(g, `${sc[ME]} : ${sc[1 - ME]}`, cx, 24, 22);
      if (!H.link.st.alive) text(g, rt('wait_rt'), cx, cy, 16, '#111');
      if (msgT > 0) { msgT -= dt; text(g, msg, cx, cy, 54 + (1 - msgT) * 20); }
      if (H.link.lost() && !H.over) text(g, rt('lost'), cx, c.H * 0.9, 14, '#FCA5A5');
    });
    return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop, resize: fit };
  };


  /* ================= Drag poyga (jonli, 2–4 kishi): 402 m to'g'ri yo'l, ilashma bilan start, 6 uzatma, bir martalik nitro ================= */
  MPL.push({ id: 'drag', e: '🏁', c: ['#F97316', '#0F172A'], rt: 1, bot: 1, big: 1, n: { uz: 'Drag poyga', ru: 'Драг-рейсинг', en: 'Drag Race' } });
  MPI.drag = (stage, ctx) => {
    const TX = {
      uz: { gas: 'GAZ', shift: 'UZATMA', clutch: 'ILASHMA', nitro: 'NITRO', lc: 'START NAZORATI', pl: 'MUKAMMAL START!', gl: 'YAXSHI START', spin: 'BUKSOVKA!', bog: 'SUST START', fs: 'FALSTART! +1 s', ps: 'MUKAMMAL!', gs: 'YAXSHI', early: 'ERTA', late: 'KECH', nos: 'NITRO!', hint: 'GAZni bosib, strelkani yashilda tuting — YASHIL chiroqda ILASHMA!', res: 'NATIJALAR', fin: 'MARRA', start: 'START', top: 'Maks', rx: 'Reaksiya', you: 'Siz', km: 'km/soat', go: 'KETDIK!' },
      ru: { gas: 'ГАЗ', shift: 'ПЕРЕДАЧА', clutch: 'СЦЕПЛЕНИЕ', nitro: 'НИТРО', lc: 'LAUNCH CONTROL', pl: 'ИДЕАЛЬНЫЙ СТАРТ!', gl: 'ХОРОШИЙ СТАРТ', spin: 'ПРОБУКСОВКА!', bog: 'ВЯЛЫЙ СТАРТ', fs: 'ФАЛЬСТАРТ! +1 с', ps: 'ИДЕАЛЬНО!', gs: 'ХОРОШО', early: 'РАНО', late: 'ПОЗДНО', nos: 'НИТРО!', hint: 'Держите ГАЗ: стрелка в зелёной зоне — на ЗЕЛЁНЫЙ жмите СЦЕПЛЕНИЕ!', res: 'РЕЗУЛЬТАТЫ', fin: 'ФИНИШ', start: 'СТАРТ', top: 'Макс', rx: 'Реакция', you: 'Вы', km: 'км/ч', go: 'ПОЕХАЛИ!' },
      en: { gas: 'GAS', shift: 'SHIFT', clutch: 'CLUTCH', nitro: 'NITRO', lc: 'LAUNCH CONTROL', pl: 'PERFECT LAUNCH!', gl: 'GOOD LAUNCH', spin: 'WHEELSPIN!', bog: 'BOGGED DOWN', fs: 'FALSE START! +1s', ps: 'PERFECT SHIFT!', gs: 'GOOD SHIFT', early: 'TOO EARLY', late: 'TOO LATE', nos: 'NITRO!', hint: 'Hold GAS — keep the needle in the green. Tap CLUTCH on GREEN!', res: 'RESULTS', fin: 'FINISH', start: 'START', top: 'Top', rx: 'Reaction', you: 'You', km: 'km/h', go: 'GO!' },
    };
    const tx = (k) => (TX[L()] || PK('drag') || TX.en)[k] || TX.en[k];
    const ord = (n) => (L() === 'ru' ? n + '-е' : L() === 'uz' ? n + '-o‘rin' : n + ['ST', 'ND', 'RD', 'TH'][n - 1]);
    const { c, g, fit } = canvasIn(stage, null);
    const N = Math.max(2, ctx.n || 2), ME = Math.max(0, ctx.me), SPEC = ctx.me < 0, COL = ctx.col, DIST = 402, PRE = 4.2;
    // fizika: uzatmalar, moment egri chizig'i, havo qarshiligi
    const GR = [3.25, 2.3, 1.78, 1.45, 1.2, 1.0], FD = 3.9, WR = 0.33, KA = 3.5, CD = 0.00026, NG = 6, RL = 8500;
    const tq = (r) => (r < 6600 ? 0.55 + 0.45 * (1 - ((6600 - r) / 5600) ** 2) : 1 - 0.55 * ((r - 6600) / 1900) ** 2);
    const wrpm = (v, gi) => (v / WR) * GR[gi] * FD * 9.5493;
    const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
    const FNT = 'system-ui, -apple-system, Segoe UI, sans-serif', DPR = () => Math.min(3, devicePixelRatio || 1);
    const tt = (s, x, y, size, col, al = 'center', st = 0, w = 900, it = 1) => { g.font = `${it ? 'italic ' : ''}${w} ${size}px ${FNT}`; g.textAlign = al; g.textBaseline = 'middle'; if (st) { g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = st; g.strokeText(s, x, y); } g.fillStyle = col; g.fillText(s, x, y); };
    const shd = (hex, p) => { const n = parseInt(hex.slice(1), 16), f = (v) => cl(v + p, 0, 255) | 0; return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
    let sd = (ctx.seed >>> 0) || 7; const sr = () => { sd = (sd + 0x6d2b79f5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    // ---- holat: uy egasi (0) hamma mashinani hisoblaydi ----
    const mk = () => ({ x: 0, v: 0, rpm: 1000, gear: 0, ln: 0, fs: 0, cl: 0, sh: 0, bo: 0, bog: 0, sp: 0, nT: 0, nU: 0, fin: 0, rx: 0, top: 0, evc: 0, evk: 0, fl: 0, lim: 0, seen: 0, nseen: 0, out: 0 });
    const C = Array.from({ length: N }, mk), INP = Array.from({ length: N }, () => ({ g: 0, s: 0, n: 0, r: 0 }));
    const BOT = {}; (ctx.bots || new Set()).forEach((b) => { if (b >= N) return; const sk = 0.55 + sr() * 0.4; BOT[b] = { sk, lr: 5900 + (sr() - 0.5) * 2 * (1 - sk) * 2600, rx: 0.14 + sr() * 0.42 * (1 - sk), fsT: sr() < 0.1 * (1 - sk) ? -0.2 : null, sT: Array.from({ length: NG }, () => cl(7600 + (sr() - 0.5) * 2 * (1 - sk) * 1500, 6300, 8350)), nG: 2 + Math.floor(sr() * 3), lg: -1 }; });
    let ph = 0, K = -PRE, endAt = 0, sendT = 0, aliveT = 0, firstFin = 0; const got = new Set();
    const ev = (o, e) => { o.evc++; o.evk = e; };
    const rep = (r, real) => (r > 0 ? cl(r, real - 1200, real + 1200) : real);
    const rev = (o, gas, dt) => { o.rpm += gas ? (o.rpm < 4000 ? 6000 : 3000) * dt : -3500 * dt; if (o.rpm >= RL - 60) { o.rpm = RL - 450 - Math.random() * 300; o.fl = 0.1; } o.rpm = Math.max(950, o.rpm); };
    const sim = (o, q, dt) => {
      const tap = q.s > o.seen, nit = q.n > o.nseen; o.seen = q.s; o.nseen = q.n; const gas = q.g && !o.out && !o.fin;
      o.fl = Math.max(0, o.fl - dt);
      if (!o.ln) {
        if (ph < 1) return; rev(o, gas, dt);
        if (tap && K < 0 && !o.fs) { o.fs = 1; ev(o, 5); }
        if (K >= 0 && ((tap && !o.fs) || K >= (o.fs ? 1 : 1.5)) && !o.out) { // start: ilashma qo'yib yuborildi
          const Lr = rep(q.r, o.rpm); o.ln = 1; o.rx = K; o.cl = Lr; o.rpm = Lr;
          if (o.fs); else if (Lr < 3800) { o.bog = 0.9; ev(o, 4); } else if (Lr > 7300) { o.sp = 1.2; ev(o, 3); } else if (Lr >= 5200 && Lr <= 6800) { o.bo = 1.1; ev(o, 1); } else ev(o, 2);
        }
        return;
      }
      if (nit && !o.nU && !o.fin && !o.out) { o.nU = 1; o.nT = 2.6; ev(o, 10); }
      let r = Math.max(wrpm(o.v, o.gear), o.gear === 0 ? o.cl : 0, o.sp > 0 ? 6900 + Math.random() * 500 : 0, 1000); o.cl = Math.max(0, o.cl - 3800 * dt);
      if (tap && o.gear < NG - 1 && o.sh <= 0 && !o.fin) { const q0 = rep(q.r, r); o.gear++; o.fl = 0.28; if (q0 >= 7400 && q0 <= 7850) { o.sh = 0.07; o.bo = 0.7; ev(o, 6); } else if (q0 >= 6800 && q0 < 8250) { o.sh = 0.17; ev(o, 7); } else { o.sh = 0.3; ev(o, q0 < 6800 ? 8 : 9); } }
      o.lim = r >= RL - 80 ? 1 : 0; if (o.lim) r = RL - 80 - Math.random() * 450;
      let a = 0;
      if (o.fin || o.out) a = o.v > 0.5 ? -6.5 : 0; // marradan keyin parashyut
      else if (gas && o.sh <= 0 && !o.lim) a = KA * tq(r) * GR[o.gear] * (1 + (o.bo > 0 ? 0.22 : 0) + (o.nT > 0 ? 0.45 : 0)) * (o.bog > 0 ? 0.55 : 1) * (o.sp > 0 ? 0.7 : 1);
      a -= CD * o.v * o.v + (o.v > 0.1 ? 0.15 : 0);
      o.v = Math.max(0, o.v + a * dt); o.x += o.v * dt; o.rpm += (r - o.rpm) * Math.min(1, dt * (o.sh > 0 ? 14 : 30));
      o.sh -= dt; o.bo -= dt; o.bog -= dt; o.sp -= dt; o.nT = Math.max(0, o.nT - dt); o.top = Math.max(o.top, o.v);
      if (!o.fin && !o.out && o.x >= DIST) { o.fin = Math.max(0.01, K - (o.x - DIST) / Math.max(1, o.v)); ev(o, 11); if (!firstFin) firstFin = K; }
    };
    // botlar: mahoratiga qarab biroz noaniq start va uzatma
    const botIn = (b) => {
      const B = BOT[b], o = C[b], q = INP[b];
      q.g = ph >= 1 && K > -3.2 ? (o.ln ? 1 : o.rpm < B.lr ? 1 : 0) : 0;
      if (!o.ln && ph >= 1) { if (B.fsT != null && K >= B.fsT && !B.fd) { B.fd = 1; q.s++; } else if (K >= B.rx && !B.cd) { B.cd = 1; q.s++; } }
      else if (o.ln && !o.fin && o.gear < NG - 1 && o.sh <= 0 && o.rpm >= B.sT[o.gear] && B.lg !== o.gear) { B.lg = o.gear; q.s++; }
      if (o.ln && o.gear >= B.nG && !o.nU && o.sh <= 0) q.n++;
    };
    const rankOf = (arr, outF) => arr.map((_, i) => i).sort((a, b) => { const A = arr[a], Bq = arr[b], oa = outF(a), ob = outF(b); if (oa !== ob) return oa - ob; if (A.fin && Bq.fin) return A.fin - Bq.fin; if (A.fin || Bq.fin) return A.fin ? -1 : 1; return Bq.x - A.x; });
    // ---- tarmoq ----
    let gSnapT = 0, Kc = -PRE, phV = 0;
    const H = hostGame(ctx, { onInput: (d, s) => { if (s > 0 && s < N) { got.add(s); const q = INP[s]; q.g = d.g ? 1 : 0; q.s = Math.max(q.s, d.s | 0); q.n = Math.max(q.n, d.n | 0); q.r = +d.r || 0; } }, onSnap: () => { gSnapT = performance.now(); } });
    // ---- mahalliy boshqaruv ----
    const gasP = new Set(); let myS = 0, myN = 0, shFx = 0, niFx = 0, sendNow = false, myR = 1000;
    const myGas = () => !SPEC && (gasP.size > 0 || keysDown.has('arrowup') || keysDown.has('w'));
    const tapShift = () => { if (SPEC) return; myS++; shFx = 0.18; sendNow = true; };
    const tapNitro = () => { if (SPEC) return; myN++; niFx = 0.25; sendNow = true; };
    // ---- ko'rinish holati (hamma mijozda) ----
    const V = Array.from({ length: N }, () => ({ x: 0, v: 0, rpm: 1000, gear: 0, f: 0, evc: 0, evk: 0, fin: 0, rx: 0, top: 0, nT: 0, wa: Math.random() * 6, pitch: 0, pv: 0, acc: 0, lt: -9, ln: 0, ec: 0 }));
    const PT = Array.from({ length: 140 }, () => ({ on: 0, x: 0, d: 0, h: 0, r: 0, a: 0, life: 0, mx: 1, vx: 0, vh: 0 })); // tutun zarrachalari
    let pop = null, shake = 0, Tn = 0, cdPrev = 9, engT = 0, ppmS = 0, axS = 0, camX = -2;
    const lane = (s) => { if (SPEC) return s; return s === ME ? 0 : s < ME ? s + 1 : s; }; // o'zim eng yaqin yo'lakda
    // ---- statik qatlamlar (keshlanadi) ----
    let LY = null;
    const mkC = (w, h, d) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * d)); cv.height = Math.max(1, Math.ceil(h * d)); const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [cv, x]; };
    const ridge = (x, TW, fs) => fs.reduce((s, [f, a, p]) => s + a * Math.pow(1 - Math.abs(Math.sin((Math.PI * f * x) / TW + p)), 2), 0);
    const gauge = (R, max, major, minor, zones, lab, div, red, d) => {
      const S = R + 10, [cv, x] = mkC(S * 2, S * 2, d); x.translate(S, S);
      const A0 = Math.PI * 0.75, SW = Math.PI * 1.5, an = (v) => A0 + (v / max) * SW;
      let gr = x.createLinearGradient(0, -S, 0, S); gr.addColorStop(0, '#E5E7EB'); gr.addColorStop(0.45, '#4B5563'); gr.addColorStop(0.55, '#1F2937'); gr.addColorStop(1, '#9CA3AF'); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, R + 8, 0, 7); x.fill();
      x.fillStyle = '#05070A'; x.beginPath(); x.arc(0, 0, R + 3, 0, 7); x.fill();
      gr = x.createRadialGradient(0, -R * 0.35, R * 0.05, 0, 0, R); gr.addColorStop(0, '#2B3546'); gr.addColorStop(1, '#07090D'); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill();
      zones.forEach(([a, b, col, wd]) => { x.strokeStyle = col; x.lineWidth = R * wd; x.beginPath(); x.arc(0, 0, R * 0.87, an(a), an(b)); x.stroke(); });
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let v = 0; v <= max + 1e-6; v += minor) {
        const isM = Math.abs(v / major - Math.round(v / major)) < 1e-6, a = an(v), r1 = R * (isM ? 0.74 : 0.81), r2 = R * 0.93;
        x.strokeStyle = v >= red ? '#F87171' : isM ? '#F8FAFC' : 'rgba(248,250,252,.5)'; x.lineWidth = isM ? R * 0.03 : R * 0.014; x.beginPath(); x.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); x.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); x.stroke();
        if (isM) { x.font = `italic 800 ${Math.max(8, R * 0.15)}px ${FNT}`; x.fillStyle = v >= red ? '#F87171' : '#E5E7EB'; x.fillText(String(Math.round(v / div)), Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6); }
      }
      x.font = `700 ${Math.max(7, R * 0.085)}px ${FNT}`; x.fillStyle = 'rgba(203,213,225,.65)'; x.fillText(lab, 0, -R * 0.4);
      gr = x.createLinearGradient(0, -R, 0, -R * 0.1); gr.addColorStop(0, 'rgba(255,255,255,.13)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(0, -R * 0.5, R * 0.82, R * 0.48, 0, 0, 7); x.fill();
      return { cv, S, A0, SW, max };
    };
    const layout = () => {
      const W = c.W, H = c.H, port = W < H * 0.95, hudH = Math.round(port ? cl(H * 0.4, 210, 330) : cl(H * 0.33, 165, 250)), SH = H - hudH, d = DPR(), td = Math.min(2, d);
      const yHz = SH * 0.43, yF = SH * 0.6, yN = SH * 0.94, dk = N === 2 ? 0.17 : N === 3 ? 0.125 : 0.1, kn = 1 + dk * 0.5, kf = 1 - (N - 1) * dk - dk * 0.5;
      const yk = (k) => yN - ((kn - k) / (kn - kf)) * (yN - yF), ppm0 = port ? (W * 0.37) / 4.6 : Math.min(W * 0.23, SH * 0.72) / 4.6;
      const TW = Math.ceil(Math.max(W, 640) * 1.5), R0 = Math.random; let s0 = 12345; const rr0 = () => ((s0 = (s0 * 16807) % 2147483647) / 2147483647);
      // tog'lar (qorli), yashil tog'lar, o'rmon, bulutlar — choksiz takrorlanadigan plitalar
      const mtn = (yb, hb, hv, fs, cTop, cBot, snowY, shadeA) => {
        const [cv, x] = mkC(TW, yb + 2, td), Y = (px) => yb - SH * (hb + hv * ridge(px, TW, fs)), p = new Path2D(); p.moveTo(0, yb + 2);
        for (let px = 0; px <= TW; px += 3) p.lineTo(px, Y(px)); p.lineTo(TW, yb + 2); p.closePath();
        let gr = x.createLinearGradient(0, yb - SH * (hb + hv), 0, yb); gr.addColorStop(0, cTop); gr.addColorStop(1, cBot); x.fillStyle = gr; x.fill(p);
        x.save(); x.clip(p);
        for (let px = 0; px < TW; px += 2) { const dy = Y(px + 2) - Y(px); if (dy > 0) { x.fillStyle = `rgba(0,0,0,${Math.min(0.28, dy * shadeA)})`; x.fillRect(px, Y(px), 2.4, yb - Y(px)); } else { x.fillStyle = `rgba(255,255,255,${Math.min(0.12, -dy * shadeA * 0.5)})`; x.fillRect(px, Y(px), 2.4, (yb - Y(px)) * 0.5); } }
        if (snowY) { x.beginPath(); x.moveTo(0, 0); for (let px = 0; px <= TW; px += 6) x.lineTo(px, yb - SH * snowY + Math.sin(px * 0.09) * SH * 0.008 + Math.sin(px * 0.031) * SH * 0.012); x.lineTo(TW, 0); x.closePath(); gr = x.createLinearGradient(0, yb - SH * (hb + hv), 0, yb - SH * snowY); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#DCE6F2'); x.fillStyle = gr; x.fill();
          for (let px = 0; px < TW; px += 2) { const dy = Y(px + 2) - Y(px); if (dy > 0 && Y(px) < yb - SH * snowY) { x.fillStyle = `rgba(90,120,170,${Math.min(0.35, dy * shadeA * 1.4)})`; x.fillRect(px, Y(px), 2.4, yb - SH * snowY - Y(px) + 4); } } }
        gr = x.createLinearGradient(0, yb - SH * 0.12, 0, yb); gr.addColorStop(0, 'rgba(214,230,245,0)'); gr.addColorStop(1, 'rgba(214,230,245,.55)'); x.fillStyle = gr; x.fillRect(0, yb - SH * 0.12, TW, SH * 0.12 + 2);
        x.restore(); return cv;
      };
      const L1 = mtn(yHz + 2, 0.08, 0.2, [[3, 0.55, 0.3], [7, 0.32, 1.1], [17, 0.13, 2.2]], '#8FA8CC', '#7088AE', 0.2, 0.05);
      const L2 = mtn(yHz + SH * 0.07, 0.05, 0.15, [[2, 0.5, 0.9], [5, 0.35, 2.4], [13, 0.15, 0.4]], '#5F9460', '#3D6E46', 0.165, 0.06);
      const [L3, x3] = mkC(TW, yF + 2, td), hb = (px) => yF - SH * (0.05 + 0.025 * Math.sin((Math.PI * 2 * 3 * px) / TW) + 0.015 * Math.sin((Math.PI * 2 * 7 * px) / TW + 1));
      { let gr = x3.createLinearGradient(0, yF - SH * 0.1, 0, yF); gr.addColorStop(0, '#4F8F3E'); gr.addColorStop(1, '#6BAA4A'); x3.fillStyle = gr; x3.beginPath(); x3.moveTo(0, yF + 2); for (let px = 0; px <= TW; px += 4) x3.lineTo(px, hb(px)); x3.lineTo(TW, yF + 2); x3.closePath(); x3.fill();
        const trees = []; for (let i = 0; i < TW / 9; i++) { const px = rr0() * TW; trees.push([px, hb(px) + rr0() * SH * 0.03, SH * (0.035 + rr0() * 0.05), rr0()]); } trees.sort((a, b) => a[1] - b[1]);
        trees.forEach(([px, y, h, t]) => { for (const ox of [-TW, 0, TW]) { const X = px + ox; if (X < -h || X > TW + h) continue; x3.fillStyle = '#3B2A1A'; x3.fillRect(X - h * 0.04, y - h * 0.2, h * 0.08, h * 0.22);
          if (t < 0.8) for (let j = 0; j < 3; j++) { const w = h * (0.36 - j * 0.08), yy = y - h * (0.15 + j * 0.27); x3.fillStyle = j % 2 ? '#1F5A32' : '#24683A'; x3.beginPath(); x3.moveTo(X - w, yy); x3.lineTo(X, yy - h * 0.42); x3.lineTo(X + w, yy); x3.closePath(); x3.fill(); x3.fillStyle = 'rgba(0,0,0,.18)'; x3.beginPath(); x3.moveTo(X, yy - h * 0.42); x3.lineTo(X + w, yy); x3.lineTo(X, yy); x3.closePath(); x3.fill(); }
          else { x3.fillStyle = '#3F7F35'; x3.beginPath(); x3.arc(X, y - h * 0.45, h * 0.3, 0, 7); x3.fill(); x3.fillStyle = '#56A045'; x3.beginPath(); x3.arc(X - h * 0.08, y - h * 0.52, h * 0.18, 0, 7); x3.fill(); } } });
        gr = x3.createLinearGradient(0, yF - SH * 0.035, 0, yF); gr.addColorStop(0, '#7DBA55'); gr.addColorStop(1, '#5E9C40'); x3.fillStyle = gr; x3.fillRect(0, yF - SH * 0.035, TW, SH * 0.035 + 2);
        for (let px = 0; px < TW; px += 40) { x3.fillStyle = 'rgba(255,255,255,.05)'; x3.fillRect(px, yF - SH * 0.035, 20, SH * 0.035); } }
      const [CL, xc] = mkC(TW, yHz, td);
      for (let i = 0; i < 7; i++) { const cx0 = rr0() * TW, cy0 = SH * (0.06 + rr0() * 0.2), s = SH * (0.03 + rr0() * 0.035); for (const ox of [-TW, 0, TW]) { const X = cx0 + ox; if (X < -s * 6 || X > TW + s * 6) continue; const gr = xc.createLinearGradient(0, cy0 - s * 1.5, 0, cy0 + s * 0.8); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(214,226,242,.85)'); xc.fillStyle = gr; xc.beginPath(); for (let j = 0; j < 6; j++) { const ex = X + (j - 2.5) * s * 0.9, ey = cy0 - Math.sin((j / 5) * Math.PI) * s * 0.7; xc.moveTo(ex + s, ey); xc.ellipse(ex, ey, s * (1 + Math.sin(j * 1.7) * 0.25), s * 0.75, 0, 0, 7); } xc.fill(); } }
      void R0;
      // asfalt, karbon, tutun spraytlari
      const [AS, xa] = mkC(160, 64, 1); xa.fillStyle = '#34373E'; xa.fillRect(0, 0, 160, 64); for (let i = 0; i < 900; i++) { const v = 40 + rr0() * 50 | 0; xa.fillStyle = `rgba(${v},${v},${v + 4},${0.4 + rr0() * 0.5})`; xa.fillRect(rr0() * 160, rr0() * 64, 1 + rr0() * 1.5, 1); }
      const [CB, xb] = mkC(8, 8, 1); xb.fillStyle = '#12161D'; xb.fillRect(0, 0, 8, 8); xb.fillStyle = '#1A2029'; xb.fillRect(0, 0, 4, 4); xb.fillRect(4, 4, 4, 4); xb.fillStyle = '#0D1015'; xb.fillRect(0, 3, 4, 1); xb.fillRect(4, 7, 4, 1);
      const [PF, xp] = mkC(64, 64, 1); { const gr = xp.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(235,235,240,.9)'); gr.addColorStop(0.5, 'rgba(215,215,222,.45)'); gr.addColorStop(1, 'rgba(200,200,210,0)'); xp.fillStyle = gr; xp.fillRect(0, 0, 64, 64); }
      // HUD joylashuvi
      let bw, gasB, shB, tach, spd, nit;
      if (port) { bw = Math.round(W * 0.235); const top = Math.round(hudH * 0.3); const r = Math.min(bw / 2 - 4, top / 2 - 2); spd = { x: 10 + bw / 2, y: SH + top / 2 + 6, r }; nit = { x: W - 10 - bw / 2, y: SH + top / 2 + 6, r: r * 0.92 }; shB = { x: 10, y: SH + top + 14, w: bw, h: hudH - top - 24 }; gasB = { x: W - 10 - bw, y: shB.y, w: bw, h: shB.h }; tach = { x: W / 2, y: SH + hudH * 0.55, R: Math.min((W - 2 * bw - 52) / 2, hudH * 0.38) }; }
      else { bw = Math.round(cl(W * 0.12, 110, 170)); shB = { x: 16, y: SH + 14, w: bw, h: hudH - 26 }; gasB = { x: W - 16 - bw, y: SH + 14, w: bw, h: hudH - 26 }; const R = Math.min(hudH * 0.4, 118); tach = { x: W / 2, y: SH + hudH * 0.54, R }; const r2 = R * 0.62; spd = { x: W / 2 - R - 30 - r2, y: tach.y + R * 0.1, r: r2 }; nit = { x: W / 2 + R + 30 + r2 * 0.85, y: tach.y + R * 0.1, r: r2 * 0.85 }; }
      const tz = [[7200, 7900, '#15803D', 0.11], [7400, 7850, '#4ADE80', 0.11], [8000, 9000, '#DC2626', 0.11]], lz = [[5200, 6800, '#22C55E', 0.11], [8000, 9000, '#DC2626', 0.11]];
      const gT = gauge(tach.R, 9000, 1000, 250, tz, 'RPM ×1000', 1000, 8000, d), gL = gauge(tach.R, 9000, 1000, 250, lz, 'RPM ×1000', 1000, 8000, d), gS = gauge(spd.r, 300, 60, 20, [[260, 300, '#DC2626', 0.1]], tx('km'), 1, 999, d);
      const [HB, xh] = mkC(W, hudH, d); { let gr = xh.createLinearGradient(0, 0, 0, hudH); gr.addColorStop(0, '#1C2433'); gr.addColorStop(1, '#06080C'); xh.fillStyle = gr; xh.fillRect(0, 0, W, hudH); xh.globalAlpha = 0.5; xh.fillStyle = xh.createPattern(CB, 'repeat'); xh.fillRect(0, 0, W, hudH); xh.globalAlpha = 1;
        gr = xh.createLinearGradient(0, 0, 0, 6); gr.addColorStop(0, '#F97316'); gr.addColorStop(1, 'rgba(249,115,22,0)'); xh.fillStyle = gr; xh.fillRect(0, 0, W, 6); xh.fillStyle = 'rgba(255,255,255,.18)'; xh.fillRect(0, 0, W, 1);
        gr = xh.createRadialGradient(tach.x, tach.y - SH, 0, tach.x, tach.y - SH, tach.R * 1.6); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); xh.fillStyle = gr; xh.fillRect(0, 0, W, hudH); }
      const sky = g.createLinearGradient(0, 0, 0, yF); sky.addColorStop(0, '#1D5DBF'); sky.addColorStop(0.45, '#4F92E3'); sky.addColorStop(0.8, '#A9D0F5'); sky.addColorStop(1, '#F1E6D2');
      const sun = g.createRadialGradient(W * 0.8, SH * 0.13, 0, W * 0.8, SH * 0.13, SH * 0.3); sun.addColorStop(0, 'rgba(255,253,235,1)'); sun.addColorStop(0.08, 'rgba(255,248,214,.95)'); sun.addColorStop(0.25, 'rgba(255,236,190,.35)'); sun.addColorStop(1, 'rgba(255,236,190,0)');
      const asph = g.createLinearGradient(0, yF, 0, yN); asph.addColorStop(0, 'rgba(20,22,26,.35)'); asph.addColorStop(1, 'rgba(70,74,82,.1)');
      const grass = g.createLinearGradient(0, yN, 0, SH); grass.addColorStop(0, '#5E9C40'); grass.addColorStop(1, '#3E7A2C');
      LY = { W, H, port, hudH, SH, yHz, yF, yN, dk, kn, kf, yk, ppm0, TW, L1, L2, L3, CL, AP: g.createPattern(AS, 'repeat'), PF, HB, bw, gasB, shB, tach, spd, nit, gT, gL, gS, sky, sun, asph, grass, fine: matchMedia('(pointer: fine)').matches };
      if (!ppmS) ppmS = ppm0;
    };
    // ---- mashina shakli (metrlarda, Path2D bilan keshlanadi) ----
    const PB = new Path2D(); PB.moveTo(-2.28, -0.36); PB.lineTo(-2.33, -0.7); PB.quadraticCurveTo(-2.31, -0.9, -2.02, -0.93); PB.lineTo(-1.32, -0.99); PB.bezierCurveTo(-0.95, -1.22, -0.55, -1.31, -0.12, -1.32); PB.bezierCurveTo(0.3, -1.32, 0.58, -1.22, 0.98, -0.99); PB.lineTo(1.85, -0.8); PB.quadraticCurveTo(2.27, -0.73, 2.35, -0.56); PB.lineTo(2.32, -0.34); PB.lineTo(1.86, -0.3); PB.arc(1.38, -0.335, 0.45, 0, Math.PI, true); PB.lineTo(-0.95, -0.28); PB.arc(-1.42, -0.335, 0.45, 0, Math.PI, true); PB.lineTo(-2.28, -0.36); PB.closePath();
    const PW = new Path2D(); PW.moveTo(-1.12, -1.0); PW.bezierCurveTo(-0.85, -1.19, -0.5, -1.255, -0.12, -1.26); PW.bezierCurveTo(0.26, -1.26, 0.5, -1.18, 0.84, -1.0); PW.closePath();
    const PG = new Path2D(); PG.moveTo(-2.2, -0.86); PG.lineTo(-1.3, -0.95); PG.lineTo(0.98, -0.965); PG.lineTo(1.85, -0.79); PG.lineTo(2.22, -0.69); PG.lineTo(2.22, -0.64); PG.lineTo(1.85, -0.73); PG.lineTo(0.98, -0.89); PG.lineTo(-1.3, -0.88); PG.lineTo(-2.2, -0.8); PG.closePath();
    const PI_ = new Path2D(); PI_.moveTo(-1.05, -0.62); PI_.lineTo(-0.55, -0.66); PI_.lineTo(-0.6, -0.52); PI_.lineTo(-1.0, -0.5); PI_.closePath();
    const PL = new Path2D(); PL.moveTo(1.92, -0.765); PL.quadraticCurveTo(2.2, -0.73, 2.31, -0.63); PL.lineTo(2.24, -0.6); PL.quadraticCurveTo(2.1, -0.67, 1.92, -0.715); PL.closePath();
    const PS = new Path2D(); PS.moveTo(-2.44, -1.13); PS.lineTo(-1.82, -1.16); PS.lineTo(-1.84, -1.09); PS.lineTo(-2.42, -1.06); PS.closePath();
    const PFl = new Path2D(); PFl.moveTo(0, -0.5); PFl.quadraticCurveTo(-0.45, -0.9, -1, 0); PFl.quadraticCurveTo(-0.45, 0.9, 0, 0.5); PFl.closePath();
    const bodyG = COL.map((col) => { const gr = g.createLinearGradient(0, -1.32, 0, -0.27); gr.addColorStop(0, shd(col, 110)); gr.addColorStop(0.28, shd(col, 30)); gr.addColorStop(0.6, col); gr.addColorStop(1, shd(col, -95)); return gr; });
    const glassG = (() => { const gr = g.createLinearGradient(-1, -1.26, 0.6, -1.0); gr.addColorStop(0, '#0B1220'); gr.addColorStop(0.45, '#253247'); gr.addColorStop(0.55, '#5B6B85'); gr.addColorStop(0.62, '#1B2433'); gr.addColorStop(1, '#0B1220'); return gr; })();
    const rimG = (() => { const gr = g.createRadialGradient(-0.05, -0.06, 0.02, 0, 0, 0.25); gr.addColorStop(0, '#F1F5F9'); gr.addColorStop(0.6, '#94A3B8'); gr.addColorStop(1, '#475569'); return gr; })();
    const tyreG = (() => { const gr = g.createRadialGradient(0, 0, 0.24, 0, 0, 0.34); gr.addColorStop(0, '#2A2A2E'); gr.addColorStop(0.5, '#151518'); gr.addColorStop(1, '#050506'); return gr; })();
    const flG = [(() => { const gr = g.createLinearGradient(0, 0, -1, 0); gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.3, 'rgba(255,196,60,.95)'); gr.addColorStop(0.7, 'rgba(249,90,22,.7)'); gr.addColorStop(1, 'rgba(220,38,38,0)'); return gr; })(), (() => { const gr = g.createLinearGradient(0, 0, -1, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(125,211,252,.95)'); gr.addColorStop(0.6, 'rgba(99,102,241,.75)'); gr.addColorStop(1, 'rgba(168,85,247,0)'); return gr; })()];
    const wheel = (wx, ang, blur) => {
      g.save(); g.translate(wx, -0.335);
      g.fillStyle = tyreG; g.beginPath(); g.arc(0, 0, 0.335, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 0.012; g.beginPath(); g.arc(0, 0, 0.29, 0, 7); g.stroke();
      g.fillStyle = '#3F444C'; g.beginPath(); g.arc(0, 0, 0.245, 0, 7); g.fill(); // tormoz diski
      g.fillStyle = '#DC2626'; g.beginPath(); g.arc(0, 0, 0.2, -2.3, -1.2); g.arc(0, 0, 0.12, -1.2, -2.3, true); g.fill(); // support
      const sp = (a, al) => { g.globalAlpha = al; g.save(); g.rotate(a); g.fillStyle = rimG; for (let j = 0; j < 5; j++) { g.rotate(Math.PI * 0.4); g.beginPath(); g.moveTo(0.04, -0.035); g.lineTo(0.235, -0.05); g.lineTo(0.235, 0.05); g.lineTo(0.04, 0.035); g.closePath(); g.fill(); } g.restore(); };
      sp(ang, 1 - blur * 0.55); if (blur > 0.05) { sp(ang - 0.2, 0.35 * blur); sp(ang - 0.4, 0.25 * blur); g.globalAlpha = 0.45 * blur; g.fillStyle = '#9AA4B2'; g.beginPath(); g.arc(0, 0, 0.235, 0, 7); g.arc(0, 0, 0.07, 0, 7, true); g.fill(); }
      g.globalAlpha = 1; g.strokeStyle = '#CBD5E1'; g.lineWidth = 0.022; g.beginPath(); g.arc(0, 0, 0.24, 0, 7); g.stroke();
      g.fillStyle = '#1F2937'; g.beginPath(); g.arc(0, 0, 0.055, 0, 7); g.fill(); g.fillStyle = '#E2E8F0'; g.beginPath(); g.arc(0, 0, 0.025, 0, 7); g.fill();
      g.restore();
    };
    const drawCar = (i, q, sx, gy, s) => {
      const col = COL[i], f = q.f, vib = !q.ln && phV >= 1 ? Math.sin(Tn * 70 + i) * 0.006 * (q.rpm / 8000) : 0;
      g.save(); g.translate(sx, gy); g.scale(s, s);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(0, 0.02, 2.5, 0.12, 0, 0, 7); g.fill();
      g.fillStyle = '#0A0A0C'; g.beginPath(); g.arc(1.38, -0.335, 0.43, Math.PI, 0); g.arc(-1.42, -0.335, 0.43, Math.PI, 0); g.fill();
      // olov (uzatma / nitro)
      if (f & 2 || f & 8) { const nos = !!(f & 2), Ln = nos ? 1.3 + Math.random() * 0.6 : 0.5 + Math.random() * 0.35, hh = nos ? 0.2 + Math.random() * 0.05 : 0.13; g.save(); g.globalCompositeOperation = 'lighter'; g.translate(-2.36, -0.41); g.scale(Ln, hh); g.fillStyle = flG[nos ? 1 : 0]; g.fill(PFl); if (nos) { g.scale(0.55, 0.55); g.fill(PFl); } g.restore(); }
      g.save(); g.translate(-1.42, vib); g.rotate(-q.pitch); g.translate(1.42, 0);
      g.fillStyle = bodyG[i]; g.fill(PB);
      g.save(); g.clip(PB);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(-2.5, -0.69, 5, 0.06); g.fillStyle = shd(col, -60); g.fillRect(-2.5, -0.62, 5, 0.025);
      g.fillStyle = 'rgba(0,0,0,.42)'; g.fillRect(-2.5, -0.44, 5, 0.2); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-2.5, -0.445, 5, 0.012);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fill(PG);
      g.restore();
      g.fillStyle = glassG; g.fill(PW); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 0.025; g.stroke(PW);
      g.fillStyle = '#F8FAFC'; g.beginPath(); g.arc(-0.1, -1.09, 0.12, 0, 7); g.fill(); g.fillStyle = col; g.fillRect(-0.22, -1.13, 0.24, 0.03); g.fillStyle = '#0F172A'; g.beginPath(); g.arc(-0.03, -1.08, 0.075, -1.2, 1.3); g.fill(); // shlem
      g.strokeStyle = shd(col, -70); g.lineWidth = 0.05; g.beginPath(); g.moveTo(-0.24, -1.255); g.lineTo(-0.16, -1.0); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(-0.85, -1.215); g.bezierCurveTo(-0.5, -1.3, 0.1, -1.31, 0.42, -1.25); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.018; g.beginPath(); g.moveTo(0.88, -0.97); g.quadraticCurveTo(0.97, -0.62, 0.88, -0.33); g.moveTo(-0.62, -0.99); g.quadraticCurveTo(-0.7, -0.62, -0.66, -0.31); g.stroke();
      g.fillStyle = '#0B0D10'; g.fill(PI_); g.fillStyle = shd(col, -40); g.beginPath(); g.ellipse(0.74, -1.02, 0.09, 0.045, -0.2, 0, 7); g.fill();
      g.fillStyle = '#E0F2FE'; g.fill(PL); g.fillStyle = 'rgba(56,189,248,.5)'; g.fillRect(1.98, -0.73, 0.18, 0.02);
      g.fillStyle = q.fin ? '#FF4D4D' : '#B91C1C'; g.fillRect(-2.34, -0.84, 0.13, 0.08); if (q.fin) { g.fillStyle = 'rgba(255,60,60,.35)'; g.beginPath(); g.arc(-2.3, -0.8, 0.22, 0, 7); g.fill(); }
      g.fillStyle = '#111317'; g.fillRect(-2.0, -1.12, 0.06, 0.2); g.fill(PS); g.fillStyle = col; g.fillRect(-2.43, -1.135, 0.05, 0.08);
      g.fillStyle = '#111317'; g.fillRect(1.68, -0.32, 0.66, 0.04); g.fillStyle = '#9CA3AF'; g.fillRect(-2.4, -0.45, 0.1, 0.06);
      g.fillStyle = '#F8FAFC'; g.beginPath(); g.arc(0.2, -0.56, 0.15, 0, 7); g.fill(); g.save(); g.scale(0.01, 0.01); g.font = `italic 900 20px ${FNT}`; g.fillStyle = '#0F172A'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), 20, -55); g.restore();
      g.restore();
      const blur = cl((q.v - 6) / 30, 0, 1); wheel(1.38, q.wa, blur); wheel(-1.42, q.wa, blur);
      if (q.fin && q.v > 2) { // tormoz parashyuti
        const px = -2.4 - 2.2, py = -1.0; g.strokeStyle = 'rgba(30,30,30,.7)'; g.lineWidth = 0.025; g.beginPath(); g.moveTo(-2.35, -0.75); g.lineTo(px + 0.2, py - 0.55); g.moveTo(-2.35, -0.75); g.lineTo(px + 0.2, py + 0.55); g.stroke();
        g.fillStyle = '#F8FAFC'; g.beginPath(); g.ellipse(px, py, 0.32, 0.62, 0, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.ellipse(px, py, 0.32, 0.62, 0, -0.9, 0.9); g.lineTo(px, py); g.fill(); }
      g.restore();
    };
    // ---- boshqaruv hodisalari ----
    const inR = (b, x, y, p = 6) => x >= b.x - p && x <= b.x + b.w + p && y >= b.y - p && y <= b.y + b.h + p;
    const hit = (x, y) => { if (!LY) return null; if (inR(LY.gasB, x, y)) return 'gas'; if (inR(LY.shB, x, y)) return 'shift'; if (Math.hypot(x - LY.nit.x, y - LY.nit.y) < LY.nit.r + 12) return 'nitro'; if (y < LY.SH) return x > c.W / 2 ? 'gas' : 'shift'; return null; };
    const pd = (e) => { e.preventDefault(); if (SPEC) return; const [x, y] = pos(c, e), h = hit(x, y); if (h === 'gas') { gasP.add(e.pointerId); sendNow = true; } else if (h === 'shift') tapShift(); else if (h === 'nitro') tapNitro(); };
    const pu = (e) => { if (gasP.delete(e.pointerId)) sendNow = true; };
    c.addEventListener('pointerdown', pd); c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu); c.addEventListener('pointerleave', pu); c.addEventListener('contextmenu', (e) => e.preventDefault());
    const kd = (e) => { const tg0 = e.target?.tagName; if (tg0 === 'INPUT' || tg0 === 'TEXTAREA') return; const k = e.key.toLowerCase(); if ([' ', 'arrowup', 'arrowright', 'arrowdown'].includes(k)) e.preventDefault(); if (k === 'arrowup' || k === 'w') sendNow = true; if (e.repeat) return; if (k === ' ' || k === 'arrowright' || k === 'd' || k === 'e') tapShift(); if (k === 'n' || k === 'shift' || k === 'arrowdown') tapNitro(); };
    const ku = (e) => { const k = e.key.toLowerCase(); if (k === 'arrowup' || k === 'w') sendNow = true; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    const onRes = () => { fit(); LY = null; }; addEventListener('resize', onRes);
    ctx.turn(-1, '🏁 402 m');
    const EVT = { 1: ['pl', '#4ADE80', 1], 2: ['gl', '#FDE047', 0], 3: ['spin', '#F87171', 0], 4: ['bog', '#FB923C', 0], 5: ['fs', '#EF4444', 0], 6: ['ps', '#4ADE80', 1], 7: ['gs', '#FDE047', 0], 8: ['early', '#FB923C', 0], 9: ['late', '#FB923C', 0], 10: ['nos', '#60A5FA', 1] };
    const evSnd = (k) => { if (k === 1 || k === 6) { snd(1320, 0.12, 0.06, 'triangle'); setTimeout(() => snd(1760, 0.14, 0.05, 'triangle'), 70); } else if (k === 2 || k === 7) snd(990, 0.1, 0.05, 'triangle'); else if (k === 8 || k === 9 || k === 4) snd(260, 0.14, 0.05, 'square'); else if (k === 3 || k === 5) snd(150, 0.4, 0.07, 'sawtooth'); else if (k === 10) { snd(110, 0.7, 0.07, 'sawtooth'); snd(220, 0.5, 0.04, 'square'); } else if (k === 11) snd(1046, 0.5, 0.08, 'triangle'); };
    const stop = loop((dt) => {
      Tn += dt; if (!LY || LY.W !== c.W || LY.H !== c.H) layout();
      const now = performance.now();
      // ---- uy egasi: fizika ----
      if (H.HOST && H.link.st.alive) {
        if (ph === 0) { aliveT += dt; if (ctx.local || aliveT > 4 || ctx.active().every((s) => s === 0 || got.has(s))) { ph = 1; K = -PRE; } }
        else K += dt;
        if (ph === 1 && K >= 0) ph = 2;
        const q0 = INP[0]; q0.g = myGas() ? 1 : 0; q0.s = myS; q0.n = myN; q0.r = 0;
        for (const b in BOT) botIn(+b);
        C.forEach((o, i) => { if (ctx.out?.has(i)) o.out = 1; });
        const ns = Math.max(1, Math.ceil(dt * 120)); for (let k = 0; k < ns; k++) C.forEach((o, i) => sim(o, INP[i], dt / ns));
        if (ph === 2 && !H.over) { const act = C.map((_, i) => i).filter((i) => !C[i].out); if (act.every((i) => C[i].fin) || (firstFin && K > firstFin + 9) || K > 60) { ph = 3; endAt = K + 2.8; } }
        if (ph === 3 && K >= endAt && !H.over) { const o0 = rankOf(C, (i) => C[i].out)[0]; H.end(C[o0].fin && !C[o0].out ? o0 : ctx.DRAW); }
        sendT += dt; if (sendT > 0.05 && !H.over) { sendT = 0; ctx.rt?.send({ t: 's', p: ph, k: Math.round(K * 1000), c: C.map((o) => [Math.round(o.x * 100), Math.round(o.v * 100), Math.round(o.rpm), o.gear, (o.ln ? 1 : 0) | (o.nT > 0 ? 2 : 0) | (o.sp > 0 ? 4 : 0) | (o.fl > 0 ? 8 : 0) | (o.lim ? 16 : 0) | (o.fs ? 32 : 0) | (o.nU ? 64 : 0) | (o.bo > 0 ? 128 : 0) | (o.out ? 256 : 0), o.evc, o.evk, Math.round(o.fin * 1000), Math.round(o.rx * 1000), Math.round(o.top * 10), Math.round(o.nT * 100)]) }); }
        phV = ph; Kc = K;
        C.forEach((o, i) => { const q = V[i]; q.x = o.x; q.v = o.v; q.rpm = o.rpm; q.gear = o.gear; q.f = (o.ln ? 1 : 0) | (o.nT > 0 ? 2 : 0) | (o.sp > 0 ? 4 : 0) | (o.fl > 0 ? 8 : 0) | (o.lim ? 16 : 0) | (o.fs ? 32 : 0) | (o.nU ? 64 : 0) | (o.bo > 0 ? 128 : 0) | (o.out ? 256 : 0); q.evc = o.evc; q.evk = o.evk; q.fin = o.fin; q.rx = o.rx; q.top = o.top; q.nT = o.nT; });
      } else if (!H.HOST) {
        sendT += dt; if (!SPEC && (sendT > 0.05 || sendNow)) { sendT = 0; sendNow = false; ctx.rt?.send({ t: 'i', g: myGas() ? 1 : 0, s: myS, n: myN, r: Math.round(V[ME].ln ? V[ME].rpm : myR) }); }
        const s = H.snap;
        if (s) { const p = H.prevS(); phV = s.p; const tgt = s.k / 1000 + Math.min(0.3, (now - gSnapT) / 1000); Kc += dt; if (Math.abs(tgt - Kc) > 0.3) Kc = tgt; else Kc += (tgt - Kc) * Math.min(1, dt * 6);
          s.c.forEach((a, i) => { const q = V[i]; if (!q) return; const b = p?.c?.[i]; q.x = H.lerp(b ? b[0] : a[0], a[0], 50) / 100; q.v = H.lerp(b ? b[1] : a[1], a[1], 50) / 100; q.rpm = H.lerp(b ? b[2] : a[2], a[2], 50); q.gear = a[3]; q.f = a[4]; q.evc = a[5]; q.evk = a[6]; q.fin = a[7] / 1000; q.rx = a[8] / 1000; q.top = a[9] / 10; q.nT = a[10] / 100; }); }
        // o'z mashinam startgacha: aylanishlarni mahalliy hisoblaymiz (kechikishsiz strelka)
        if (!SPEC && !(V[ME].f & 1) && phV >= 1) { const o = { rpm: myR, fl: 0 }; rev(o, myGas(), dt); myR = o.rpm; } else myR = V[ME].rpm;
      }
      // ---- umumiy: g'ildirak, qiyalik, hodisalar ----
      const VS = SPEC ? rankOf(V, (i) => (V[i].f & 256 ? 1 : 0))[0] : ME, vc = V[VS];
      V.forEach((q, i) => {
        q.wa += (q.v / WR) * dt; const ac = (q.v - q.pv) / Math.max(dt, 0.001); q.pv = q.v; q.acc += (ac - q.acc) * Math.min(1, dt * 6); q.pitch += (cl(q.acc * 0.006, -0.035, 0.07) - q.pitch) * Math.min(1, dt * 8);
        if (q.f & 1 && !q.ln) { q.ln = 1; q.lt = Tn; if (i === VS) shake = Math.max(shake, 0.35); }
        if (q.evc !== q.ec) { q.ec = q.evc; if (i === VS && !SPEC) { const e = EVT[q.evk]; if (e) pop = { t: tx(e[0]), c: e[1], g: e[2], T: 0 }; evSnd(q.evk); if (q.evk === 10) shake = Math.max(shake, 0.5); if (q.evk >= 6 && q.evk <= 9) shake = Math.max(shake, 0.12); } }
        // tutun: startda va buksovkada
        const smk = q.ln && !q.fin && (Tn - q.lt < 0.8 || q.f & 4) ? (q.f & 4 ? 3 : 2) : !q.ln && q.rpm > 7600 && phV >= 1 ? 0.3 : 0;
        for (let k = 0; k < smk; k++) { if (k >= 1 && Math.random() > smk - k) break; const p = PT.find((z) => !z.on); if (!p) break; p.on = 1; p.x = q.x - 2.25 - 1.42 - 0.3 + Math.random() * 0.4; p.d = i; p.h = 0.15; p.r = 0.4 + Math.random() * 0.3; p.a = 0.5 + Math.random() * 0.3; p.life = 0; p.mx = 1 + Math.random() * 0.8; p.vx = -1 - Math.random() * 3; p.vh = 0.4 + Math.random() * 0.6; }
      });
      PT.forEach((p) => { if (!p.on) return; p.life += dt; if (p.life > p.mx) { p.on = 0; return; } p.x += p.vx * dt; p.vx *= 0.97; p.h += p.vh * dt; p.r += dt * 1.6; });
      // ---- ovozlar: sanoq va motor ----
      if (phV >= 1 && Kc < 0.05) { const cn = Math.ceil(-Kc); if (cn !== cdPrev) { if (cn >= 1 && cn <= 3) snd(660, 0.14, 0.06, 'square'); else if (cn <= 0) snd(1320, 0.4, 0.07, 'square'); cdPrev = cn; } }
      engT -= dt; const dispR = !H.HOST && !SPEC && !(vc.f & 1) ? myR : vc.rpm;
      if (phV >= 1 && engT <= 0 && !(phV === 3 && vc.v < 1)) { engT = 0.075; snd(48 + dispR / 36, 0.1, 0.016 + (myGas() ? 0.012 : 0), 'sawtooth'); }
      shFx -= dt; niFx -= dt; shake = Math.max(0, shake - dt);
      // ---- CHIZISH ----
      const { W, H: HH, SH, yHz, yF, yN, kn, kf, yk, dk, TW } = LY;
      const vr = cl(vc.v / 75, 0, 1); ppmS += (LY.ppm0 * (1 - 0.16 * vr) - ppmS) * Math.min(1, dt * 2); const ppm = ppmS;
      const axT = W * (LY.port ? 0.5 : 0.42) - W * 0.12 * vr; axS += (axT - axS) * Math.min(1, dt * 3); if (!axS) axS = axT;
      camX = vc.x - 2.25; const shx = shake > 0 ? (Math.random() - 0.5) * shake * 14 : 0, shy = shake > 0 ? (Math.random() - 0.5) * shake * 10 : 0;
      const ax = axS + shx, sx = (wx, k) => ax + (wx - camX) * ppm * k;
      g.save(); g.beginPath(); g.rect(0, 0, W, SH); g.clip(); g.translate(0, shy);
      g.fillStyle = LY.sky; g.fillRect(0, -12, W, yF + 12); g.fillStyle = LY.sun; g.fillRect(0, -12, W, yF);
      const tile = (cv, par, y0, h, add = 0) => { let o = ((camX * ppm * par + add) % TW + TW) % TW; g.drawImage(cv, -o, y0, TW, h); if (TW - o < W) g.drawImage(cv, TW - o, y0, TW, h); };
      tile(LY.CL, 0.012, 0, yHz, Tn * 6); tile(LY.L1, 0.03, 0, yHz + 4); tile(LY.L2, 0.07, 0, yHz + SH * 0.07 + 2); tile(LY.L3, 0.2, 0, yF + 2);
      // uzoq to'siq, reklama taxtalari, masofa belgilari
      const kg = kf - 0.04, yg = yk(kg), sg = ppm * kg, wL = camX - ax / sg - 8, wR = camX + (W - ax) / sg + 8;
      g.fillStyle = '#6D7682'; for (let x = Math.ceil(wL / 2.5) * 2.5; x < wR; x += 2.5) g.fillRect(sx(x, kg) - 0.06 * sg, yg - 0.85 * sg, 0.12 * sg, 0.85 * sg);
      const ads = ['BIRGA', 'NITRO+', 'DRAG 402', 'TURBO', 'V8 OIL', 'BIRGA'], adc = ['#F97316', '#2563EB', '#111827', '#DC2626', '#16A34A', '#7C3AED'];
      for (let x = Math.ceil((wL - 6) / 24) * 24; x < wR; x += 24) { if (x > -14 && x < 6) continue; const j = ((x / 24) % 6 + 6) % 6, X0 = sx(x, kg), bwid = 6 * sg; g.fillStyle = adc[j]; g.fillRect(X0, yg - 1.25 * sg, bwid, 0.8 * sg); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(X0, yg - 1.25 * sg, bwid, 0.12 * sg); tt(ads[j], X0 + bwid / 2, yg - 0.85 * sg, Math.max(7, 0.5 * sg), '#fff', 'center', 0, 900, 1); }
      let rg = g.createLinearGradient(0, yg - 0.75 * sg, 0, yg - 0.4 * sg); rg.addColorStop(0, '#E5E7EB'); rg.addColorStop(1, '#6B7280'); g.fillStyle = rg; g.fillRect(0, yg - 0.72 * sg, W, 0.24 * sg); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, yg - 0.5 * sg, W, 0.04 * sg);
      for (const m of [100, 200, 300]) { const X0 = sx(m, kg); if (X0 < -80 || X0 > W + 80) continue; g.fillStyle = '#334155'; g.fillRect(X0 - 0.08 * sg, yg - 3.2 * sg, 0.16 * sg, 3.2 * sg); g.fillStyle = '#F8FAFC'; rr(g, X0 - 1.1 * sg, yg - 3.6 * sg, 2.2 * sg, 1.2 * sg, 0.15 * sg); g.fill(); g.strokeStyle = '#F97316'; g.lineWidth = Math.max(1, 0.1 * sg); g.stroke(); tt(String(m), X0, yg - 3.05 * sg, Math.max(8, 0.7 * sg), '#0F172A', 'center', 0, 900, 1); }
      // start chiroqlari daraxti
      { const kT = kf - 0.02, sT = ppm * kT, X0 = sx(-3.2, kT), y0 = yk(kT); if (X0 > -40 && X0 < W + 40) { g.fillStyle = '#1F2937'; g.fillRect(X0 - 0.07 * sT, y0 - 3.4 * sT, 0.14 * sT, 3.4 * sT); g.fillStyle = '#0B0F16'; rr(g, X0 - 0.32 * sT, y0 - 5.2 * sT, 0.64 * sT, 2.1 * sT, 0.1 * sT); g.fill(); g.strokeStyle = '#475569'; g.lineWidth = Math.max(1, 0.04 * sT); g.stroke();
        const lit = [phV >= 1, phV >= 1 && Kc >= -3, phV >= 1 && Kc >= -2, phV >= 1 && Kc >= -1, phV >= 2 || (phV >= 1 && Kc >= 0)], cols = ['#F8FAFC', '#FBBF24', '#FBBF24', '#FBBF24', '#22C55E'];
        for (let j = 0; j < 6; j++) { const yy = y0 - (4.95 - j * 0.33) * sT, on = j < 5 ? lit[j] && (j === 4 || j === 0 || !lit[4]) : vc.f & 32, cc = j < 5 ? cols[j] : '#EF4444'; for (const sxo of [-0.15, 0.15]) { g.fillStyle = on ? cc : '#262B33'; g.beginPath(); g.arc(X0 + sxo * sT, yy, 0.1 * sT, 0, 7); g.fill(); if (on) { g.fillStyle = cc + '55'; g.beginPath(); g.arc(X0 + sxo * sT, yy, 0.24 * sT, 0, 7); g.fill(); } } } } }
      // asfalt
      g.fillStyle = '#33363D'; g.fillRect(0, yF, W, yN - yF); g.save(); const po = -(((camX * ppm) % 160) + 160) % 160; g.translate(po, 0); g.fillStyle = LY.AP; g.fillRect(-po, yF, W + 0, yN - yF); g.restore(); g.fillStyle = LY.asph; g.fillRect(0, yF, W, yN - yF);
      // start maydonchasi (to'q beton) va rezina izlari
      const quad = (x0, x1, k0, k1, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(sx(x0, k0), yk(k0)); g.lineTo(sx(x1, k0), yk(k0)); g.lineTo(sx(x1, k1), yk(k1)); g.lineTo(sx(x0, k1), yk(k1)); g.closePath(); g.fill(); };
      quad(-30, 0, kn, kf, 'rgba(120,124,130,.25)');
      for (let l = 0; l < N; l++) { const kL = 1 - l * dk; for (const o of [-0.22, 0.22]) { const k1 = kL + o * dk - 0.035 * dk, k2 = kL + o * dk + 0.035 * dk; for (let s = 0; s < 6; s++) quad(s * 12, s * 12 + 12, k1, k2, `rgba(10,10,12,${0.5 - s * 0.08})`); } }
      // yo'lak chiziqlari
      g.fillStyle = '#F1F5F9'; g.fillRect(0, yF - 1, W, 3); g.fillRect(0, yN - 2, W, 3);
      for (let l = 1; l < N; l++) { const kb = kn - l * dk, yb = yk(kb), sb = ppm * kb, a0 = camX - ax / sb - 6, a1 = camX + (W - ax) / sb + 6; g.fillStyle = 'rgba(248,250,252,.85)'; for (let x = Math.floor(a0 / 6) * 6; x < a1; x += 6) g.fillRect(sx(x, kb), yb - 1, 3 * sb, 2.4); }
      // yo'lak raqamlari va ranglari (start oldida)
      for (let i = 0; i < N; i++) { const l = lane(i), kL = 1 - l * dk, X0 = sx(-7, kL), y0 = yk(kL); if (X0 < -60 || X0 > W + 60) continue; quad(-12, -0.3, kL + dk * 0.46, kL + dk * 0.4, COL[i]); g.save(); g.translate(X0, y0); g.scale(1, 0.32); tt(String(i + 1), 0, 0, 2.4 * ppm * kL, 'rgba(255,255,255,.75)', 'center', 0, 900, 1); g.restore(); }
      quad(-0.35, 0, kn, kf, '#F8FAFC'); // start chizig'i
      for (let j = 0; j < 2; j++) for (let m = 0; m < 10; m++) { const ka = kn - ((kn - kf) * m) / 10, kb = kn - ((kn - kf) * (m + 1)) / 10; quad(DIST + j * 0.7, DIST + j * 0.7 + 0.7, ka, kb, (m + j) % 2 ? '#111827' : '#F8FAFC'); } // marra
      // portal (start va marra) — uzoq ustun
      const gantry = (x, lab, chk, near) => { // uzoq tomonda tabloli minora, marrada yaqinda shaxmatli ustun
        if (near) { if (!chk) return; const kb = kn + 0.14, sb = ppm * kb, xb = sx(x, kb), yb = yk(kb); if (xb < -60 || xb > W + 60) return; g.fillStyle = '#374151'; g.fillRect(xb - 0.1 * sb, yb - 3.2 * sb, 0.2 * sb, 3.2 * sb + 40); const q = 0.3 * sb; for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) { g.fillStyle = (a + b) % 2 ? '#111827' : '#F8FAFC'; g.fillRect(xb + 0.1 * sb + a * q, yb - 3.2 * sb + b * q, q, q); } return; }
        const ka = kf - 0.04, sa = ppm * ka, ya = yk(ka), xa = sx(x, ka); if (xa < -6 * sa || xa > W + 6 * sa) return;
        g.fillStyle = '#4B5563'; for (const o of [-2.6, 2.6]) g.fillRect(xa + (o - 0.1) * sa, ya - 5.8 * sa, 0.2 * sa, 5.8 * sa);
        const bx = xa - 3 * sa, by = ya - 6.6 * sa, bw0 = 6 * sa, bh = 1.5 * sa; g.fillStyle = chk ? '#111827' : '#EA580C'; rr(g, bx, by, bw0, bh, 0.15 * sa); g.fill();
        if (chk) { const q = bh / 4; for (let a = 0; a < bw0 / q - 0.5; a++) for (let b = 0; b < 4; b++) if ((a + b) % 2 && (a < 3 || a > bw0 / q - 4)) { g.fillStyle = '#F8FAFC'; g.fillRect(bx + a * q, by + b * q, q, q); } }
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(bx, by, bw0, bh * 0.18); tt(lab, xa, by + bh / 2, Math.max(9, bh * (chk ? 0.42 : 0.55)), '#fff', 'center', 0, 900, 1); };
      gantry(0, tx('start'), 0, 0); gantry(DIST, tx('fin'), 1, 0);
      // mashinalar (uzoqdan yaqinga) + tutun
      const ordL = V.map((_, i) => i).sort((a, b) => lane(b) - lane(a));
      for (const i of ordL) { const q = V[i], l = lane(i), kL = 1 - l * dk, s = ppm * kL, gy = yk(kL) + dk * 0.22 * (yN - yF) / (kn - kf), cx = sx(q.x - 2.25, kL); q._sx = cx; q._gy = gy; q._s = s;
        PT.forEach((p) => { if (!p.on || p.d !== i) return; const t = p.life / p.mx, rr1 = p.r * s * 1.3; g.globalAlpha = p.a * (1 - t) * (q.f & 256 ? 0.3 : 1); g.drawImage(LY.PF, sx(p.x, kL) - rr1, gy - p.h * s - rr1, rr1 * 2, rr1 * 2); }); g.globalAlpha = 1;
        if (cx > -4 * s && cx < W + 4 * s) { if (q.f & 256) g.globalAlpha = 0.45; drawCar(i, q, cx, gy, s); g.globalAlpha = 1; } }
      // old plan: o't, yaqin to'siq, portal ustunlari
      g.fillStyle = LY.grass; g.fillRect(0, yN + 1, W, SH - yN + 20); gantry(0, tx('start'), 0, 1); gantry(DIST, tx('fin'), 1, 1);
      { const kq = kn + 0.3, sq = ppm * kq, a0 = camX - ax / sq - 3, a1 = camX + (W - ax) / sq + 3, yb3 = SH + 2, st = cl(vc.v / 40, 0, 1); g.fillStyle = 'rgba(55,65,81,.9)'; for (let x = Math.floor(a0 / 3) * 3; x < a1; x += 3) { const X0 = sx(x, kq); g.fillRect(X0 - 0.07 * sq, yb3 - 0.75 * sq, 0.14 * sq + st * 0.5 * sq, 0.75 * sq); }
        rg = g.createLinearGradient(0, yb3 - 0.7 * sq, 0, yb3 - 0.4 * sq); rg.addColorStop(0, '#D1D5DB'); rg.addColorStop(1, '#4B5563'); g.fillStyle = rg; g.fillRect(0, yb3 - 0.68 * sq, W, 0.26 * sq); }
      // ism yorliqlari va ekrandan tashqaridagi mashinalar
      for (let i = 0; i < N; i++) { if (i === VS && !SPEC) continue; const q = V[i]; if (q._s == null || q.f & 256) continue; const nm = String(ctx.names[i] || '').slice(0, 11), s = q._s, cx = q._sx, ty = q._gy - 1.75 * s, dx = q.x - vc.x;
        if (cx > W - 10 || cx < 10) { const R0 = cx > W - 10, txt = `${R0 ? '' : '◀ '}${nm} ${dx >= 0 ? '+' : ''}${dx.toFixed(0)}m${R0 ? ' ▶' : ''}`; g.font = `italic 800 12px ${FNT}`; const w = g.measureText(txt).width + 18, X0 = R0 ? W - w - 6 : 6; g.fillStyle = 'rgba(2,6,23,.7)'; rr(g, X0, ty - 11, w, 22, 11); g.fill(); g.fillStyle = COL[i]; rr(g, X0, ty - 11, 5, 22, 3); g.fill(); tt(txt, X0 + w / 2 + 2, ty, 12, '#fff', 'center', 0, 800, 1); }
        else { g.font = `italic 800 12px ${FNT}`; const w = g.measureText(nm).width + 16; g.fillStyle = 'rgba(2,6,23,.6)'; rr(g, cx - w / 2, ty - 10, w, 20, 10); g.fill(); g.strokeStyle = COL[i]; g.lineWidth = 2; g.stroke(); tt(nm, cx, ty, 12, '#fff', 'center', 0, 800, 1); } }
      if (!SPEC && vc._s) { const ty = vc._gy - 1.72 * vc._s; g.fillStyle = '#FDE047'; g.beginPath(); g.moveTo(vc._sx - 7, ty - 8); g.lineTo(vc._sx + 7, ty - 8); g.lineTo(vc._sx, ty + 1); g.closePath(); g.fill(); }
      // tezlik chiziqlari va nitro effekti
      if (vc.v > 30) { const al = cl((vc.v - 30) / 45, 0, 1) * 0.35; g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = 1.5; g.beginPath(); for (let j = 0; j < 16; j++) { const y0 = SH * (0.08 + ((j * 0.618) % 1) * 0.85), L0 = 40 + vc.v * 2.2, x0 = W - (((Tn * (900 + j * 37) + j * 211) % (W + L0 * 2)) | 0); g.moveTo(x0, y0); g.lineTo(x0 + L0, y0); } g.stroke(); }
      if (vc.f & 2) { const ng = g.createRadialGradient(W / 2, SH / 2, Math.min(W, SH) * 0.3, W / 2, SH / 2, Math.max(W, SH) * 0.75); ng.addColorStop(0, 'rgba(56,189,248,0)'); ng.addColorStop(1, `rgba(56,120,248,${0.35 + Math.random() * 0.1})`); g.fillStyle = ng; g.fillRect(0, 0, W, SH); }
      g.restore();
      // ---- sahna HUD: taymer, progress ----
      const tm = vc.fin ? vc.fin : phV >= 2 ? Math.max(0, Kc) : 0;
      g.fillStyle = 'rgba(2,6,23,.62)'; rr(g, W / 2 - 64, 8, 128, 36, 18); g.fill(); g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 1; g.stroke(); tt(tm.toFixed(2), W / 2 + 6, 27, 22, vc.fin ? '#FDE047' : '#fff', 'right', 0, 900, 1); tt('s', W / 2 + 10, 29, 13, '#94A3B8', 'left', 0, 800, 1);
      { const bx = 16, bw2 = W - 32, by = 54; g.fillStyle = 'rgba(2,6,23,.45)'; rr(g, bx - 4, by - 7, bw2 + 8, 14, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(bx, by - 1, bw2, 2); for (let j = 0; j < 4; j++) { g.fillStyle = j % 2 ? '#111' : '#fff'; g.fillRect(bx + bw2 - 6, by - 6 + j * 3, 6, 3); }
        for (let i = 0; i < N; i++) { if (V[i].f & 256) continue; const X0 = bx + cl(V[i].x / DIST, 0, 1) * (bw2 - 6); g.fillStyle = COL[i]; g.beginPath(); g.arc(X0, by, i === VS ? 6 : 4.5, 0, 7); g.fill(); if (i === VS) { g.strokeStyle = '#FDE047'; g.lineWidth = 2; g.stroke(); } } }
      // start chiroqlari (katta)
      if (phV >= 1 && Kc < 1) { const lr = LY.port ? 14 : 17, gap = lr * 2.6, cx0 = W / 2, cy0 = SH * 0.25, pw = gap * 4 + 10; g.fillStyle = 'rgba(8,10,14,.85)'; rr(g, cx0 - pw / 2, cy0 - lr - 8, pw, lr * 2 + 16, lr + 8); g.fill(); g.strokeStyle = '#475569'; g.lineWidth = 2; g.stroke();
        for (let j = 0; j < 4; j++) { const on = j < 3 ? Kc >= -3 + j && Kc < 0 : Kc >= 0, cc = j < 3 ? '#FBBF24' : '#22C55E', X0 = cx0 - gap * 1.5 + j * gap; if (on) { const gl = g.createRadialGradient(X0, cy0, 0, X0, cy0, lr * 2); gl.addColorStop(0, cc + 'AA'); gl.addColorStop(1, cc + '00'); g.fillStyle = gl; g.fillRect(X0 - lr * 2, cy0 - lr * 2, lr * 4, lr * 4); } g.fillStyle = on ? cc : '#1F242C'; g.beginPath(); g.arc(X0, cy0, lr, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(X0 - lr * 0.3, cy0 - lr * 0.35, lr * 0.35, 0, 7); g.fill(); }
        const big = Kc < -3 ? '' : Kc < 0 ? String(Math.ceil(-Kc)) : tx('go'), sc0 = 1 + (1 - ((Kc % 1) + 1) % 1) * 0.25; if (big) { g.save(); g.translate(W / 2, SH * 0.25 + lr * 2 + 34); g.scale(sc0, sc0); tt(big, 0, 0, LY.port ? 40 : 52, Kc >= 0 ? '#4ADE80' : '#FDE047', 'center', 7, 900, 1); g.restore(); }
        if (!SPEC && !(vc.f & 1) && Kc < 0) { g.font = `700 13px ${FNT}`; const ht = tx('hint'), one = g.measureText(ht).width + 24 < W - 20, ls = one ? [ht] : ht.split(' — '), w = Math.min(W - 20, Math.max(...ls.map((x) => g.measureText(x).width)) + 24), y0 = SH * 0.25 + lr * 2 + 64; g.fillStyle = 'rgba(2,6,23,.72)'; rr(g, W / 2 - w / 2, y0, w, 10 + ls.length * 17, 13); g.fill(); ls.forEach((x, j) => tt(x, W / 2, y0 + 14 + j * 17, 13, j ? '#FDE047' : '#E2E8F0', 'center', 0, 700, 0)); } }
      if (phV === 0) { g.fillStyle = 'rgba(2,6,23,.7)'; rr(g, W / 2 - 130, SH * 0.3 - 18, 260, 36, 18); g.fill(); tt(rt('wait_rt'), W / 2, SH * 0.3, 15, '#fff', 'center', 0, 700, 0); }
      // LAUNCH CONTROL ko'rsatkichi
      if (!SPEC && !(vc.f & 1) && phV >= 1) { const inZ = dispR >= 5200 && dispR <= 6800, cc = inZ ? '#22C55E' : dispR > 6800 ? '#EF4444' : '#F59E0B', lab = tx('lc'); g.font = `italic 900 13px ${FNT}`; const w = g.measureText(lab).width + 40; g.fillStyle = 'rgba(2,6,23,.75)'; rr(g, W / 2 - w / 2, SH - 34, w, 26, 13); g.fill(); g.strokeStyle = cc; g.lineWidth = 2; g.stroke(); g.fillStyle = cc; g.beginPath(); g.arc(W / 2 - w / 2 + 15, SH - 21, 5 + (inZ ? Math.sin(Tn * 12) : 0), 0, 7); g.fill(); tt(lab, W / 2 + 8, SH - 21, 13, '#fff', 'center', 0, 900, 1); }
      // hodisa yozuvi (PERFECT SHIFT va h.k.)
      if (pop) { pop.T += dt; const t = pop.T; if (t > 1.3) pop = null; else { const sc0 = t < 0.15 ? 0.6 + (t / 0.15) * 0.55 : t < 0.25 ? 1.15 - ((t - 0.15) / 0.1) * 0.15 : 1, al = t > 1 ? 1 - (t - 1) / 0.3 : 1; g.save(); g.globalAlpha = al; g.translate(W / 2, SH * (phV >= 2 ? 0.27 : 0.44) - t * 10); g.scale(sc0, sc0); g.rotate(-0.04); tt(pop.t, 0, 0, LY.port ? 26 : 34, pop.c, 'center', 7, 900, 1); if (pop.g) { g.globalAlpha = al * 0.35; g.globalCompositeOperation = 'lighter'; tt(pop.t, 0, 0, LY.port ? 26 : 34, pop.c, 'center', 0, 900, 1); } g.restore(); } }
      // natijalar
      const order = rankOf(V, (i) => (V[i].f & 256 ? 1 : 0));
      if (vc.fin && phV < 3 && !SPEC) { const pl = order.indexOf(VS) + 1; g.fillStyle = 'rgba(2,6,23,.6)'; rr(g, W / 2 - 110, SH * 0.36, 220, 74, 18); g.fill(); tt(vc.fin.toFixed(2) + ' s', W / 2, SH * 0.36 + 28, 30, '#FDE047', 'center', 5, 900, 1); tt(ord(pl) + '  🏁', W / 2, SH * 0.36 + 58, 16, pl === 1 ? '#4ADE80' : '#fff', 'center', 0, 900, 1); }
      if (phV === 3) { const rh = 40, pw2 = Math.min(W - 24, 440), ph2 = 58 + N * rh + 10, px = (W - pw2) / 2, py = Math.max(66, (SH - ph2) / 2 + 10);
        const gr = g.createLinearGradient(0, py, 0, py + ph2); gr.addColorStop(0, 'rgba(15,23,42,.94)'); gr.addColorStop(1, 'rgba(2,6,23,.94)'); g.fillStyle = gr; rr(g, px, py, pw2, ph2, 16); g.fill(); g.strokeStyle = '#F97316'; g.lineWidth = 2; g.stroke();
        tt('🏁 ' + tx('res'), W / 2, py + 26, 20, '#fff', 'center', 0, 900, 1);
        order.forEach((i, r) => { const q = V[i], y = py + 52 + r * rh, me = i === ME && !SPEC, medal = ['#FBBF24', '#CBD5E1', '#D97706', '#64748B'][r];
          if (me) { g.fillStyle = 'rgba(253,224,71,.12)'; rr(g, px + 8, y, pw2 - 16, rh - 4, 10); g.fill(); }
          g.fillStyle = medal; g.beginPath(); g.arc(px + 28, y + rh / 2 - 2, 13, 0, 7); g.fill(); tt(String(r + 1), px + 28, y + rh / 2 - 2, 15, '#0F172A', 'center', 0, 900, 1);
          g.fillStyle = COL[i]; rr(g, px + 48, y + 8, 6, rh - 20, 3); g.fill();
          tt(String(ctx.names[i] || '').slice(0, 14) + (me ? ' (' + tx('you') + ')' : ''), px + 62, y + rh / 2 - 8, 14, me ? '#FDE047' : '#fff', 'left', 0, 800, 0);
          tt(`${tx('top')} ${Math.round(q.top * 3.6)} ${tx('km')} · ${tx('rx')} ${q.f & 32 ? '—' : q.rx.toFixed(3)}`, px + 62, y + rh / 2 + 8, 10.5, '#94A3B8', 'left', 0, 600, 0);
          tt(q.f & 256 ? '—' : q.fin ? q.fin.toFixed(2) + ' s' : 'DNF', px + pw2 - 16, y + rh / 2 - 2, 18, q.fin ? (r === 0 ? '#4ADE80' : '#fff') : '#F87171', 'right', 0, 900, 1); }); }
      if (H.link.lost() && !H.over) tt(rt('lost'), W / 2, SH * 0.6, 14, '#FCA5A5', 'center', 4, 800, 0);
      // ---- pastki panel: taxometr, spidometr, pedallar ----
      const hy = SH; g.drawImage(LY.HB, 0, hy, W, LY.hudH);
      const T = LY.tach, launched = !!(vc.f & 1), gF = launched ? LY.gT : LY.gL;
      const needle = (cx, cy, R, gg, val, col) => { const a = gg.A0 + cl(val / gg.max, 0, 1.02) * gg.SW; g.save(); g.translate(cx, cy); g.rotate(a); g.shadowColor = col; g.shadowBlur = 10; g.fillStyle = col; g.beginPath(); g.moveTo(-R * 0.16, -R * 0.04); g.lineTo(R * 0.9, -R * 0.012); g.lineTo(R * 0.9, R * 0.012); g.lineTo(-R * 0.16, R * 0.04); g.closePath(); g.fill(); g.restore(); const hg = g.createRadialGradient(cx - R * 0.03, cy - R * 0.03, 0, cx, cy, R * 0.11); hg.addColorStop(0, '#64748B'); hg.addColorStop(1, '#0F172A'); g.fillStyle = hg; g.beginPath(); g.arc(cx, cy, R * 0.1, 0, 7); g.fill(); };
      g.drawImage(gF.cv, T.x - gF.S, T.y - gF.S, gF.S * 2, gF.S * 2);
      const rpmD = vc.f & 16 ? dispR + Math.sin(Tn * 60) * 180 : dispR; needle(T.x, T.y, T.R, gF, rpmD, '#FF5A1F');
      tt(String(vc.gear + 1), T.x, T.y - T.R * 0.02 - T.R * 0.32, T.R * 0.36, launched ? '#fff' : '#94A3B8', 'center', 0, 900, 1);
      tt(String(Math.round(vc.v * 3.6)), T.x, T.y + T.R * 0.42, T.R * 0.26, '#F8FAFC', 'center', 0, 900, 1); tt(tx('km'), T.x, T.y + T.R * 0.62, Math.max(8, T.R * 0.1), '#94A3B8', 'center', 0, 700, 0);
      // smena chiroqlari (LED)
      { const nL = 10, lo = launched ? 5600 : 2400, hi = launched ? 7700 : 6400, perf = launched ? dispR >= 7400 && dispR <= 7850 : dispR >= 5200 && dispR <= 6800, fl = perf && Math.sin(Tn * 40) > 0, ww = T.R * 1.7, y0 = T.y - T.R - 16, lr = Math.max(3, Math.min(6, ww / nL / 2 - 1.5));
        g.fillStyle = '#05070A'; rr(g, T.x - ww / 2 - 8, y0 - lr - 4, ww + 16, lr * 2 + 8, lr + 4); g.fill();
        for (let j = 0; j < nL; j++) { const on = dispR >= lo + ((hi - lo) * j) / (nL - 1), cc = perf ? (fl ? '#60A5FA' : '#1E3A8A') : j < 4 ? '#22C55E' : j < 7 ? '#FACC15' : '#EF4444', X0 = T.x - ww / 2 + (ww / (nL - 1)) * j; g.fillStyle = on || perf ? cc : '#1F2937'; g.beginPath(); g.arc(X0, y0, lr, 0, 7); g.fill(); if ((on && !perf) || (perf && fl)) { g.fillStyle = cc + '44'; g.beginPath(); g.arc(X0, y0, lr * 2, 0, 7); g.fill(); } } }
      const S2 = LY.spd, gS = LY.gS; g.drawImage(gS.cv, S2.x - gS.S, S2.y - gS.S, gS.S * 2, gS.S * 2); needle(S2.x, S2.y, S2.r, gS, vc.v * 3.6, '#38BDF8'); if (S2.r > 62) tt(String(Math.round(vc.v * 3.6)), S2.x, S2.y + S2.r * 0.45, S2.r * 0.26, '#E2E8F0', 'center', 0, 900, 1);
      // nitro tugmasi
      { const n = LY.nit, used = !!(vc.f & 64), act = !!(vc.f & 2), pr = niFx > 0 ? 0.93 : 1; g.save(); g.translate(n.x, n.y); g.scale(pr, pr); if (used && !act) g.globalAlpha = 0.45;
        g.strokeStyle = '#0B1220'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, n.r + 5, 0, 7); g.stroke(); const frac = act ? vc.nT / 2.6 : used ? 0 : 1; g.strokeStyle = act ? '#A5F3FC' : '#22D3EE'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, n.r + 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); g.stroke();
        const ng = g.createRadialGradient(-n.r * 0.3, -n.r * 0.35, n.r * 0.1, 0, 0, n.r); ng.addColorStop(0, act ? '#BAE6FD' : '#60A5FA'); ng.addColorStop(0.6, '#2563EB'); ng.addColorStop(1, '#1E1B4B'); g.fillStyle = ng; g.beginPath(); g.arc(0, 0, n.r, 0, 7); g.fill();
        const u = n.r / 30; g.fillStyle = '#E0F2FE'; rr(g, -7 * u, -12 * u, 14 * u, 20 * u, 4 * u); g.fill(); g.fillRect(-3 * u, -17 * u, 6 * u, 6 * u); g.fillStyle = '#1D4ED8'; g.fillRect(-7 * u, -5 * u, 14 * u, 5 * u);
        tt(tx('nitro'), 0, 16 * u, Math.max(8, 8.5 * u), '#fff', 'center', 0, 900, 1); g.restore(); g.globalAlpha = 1; if (LY.fine && !SPEC) tt('N', n.x, n.y + n.r + 18, 10, '#94A3B8', 'center', 0, 800, 0); }
      // pedallar
      const btn = (b, kind) => { const gas = kind === 'gas', down = gas ? myGas() : shFx > 0; g.save(); g.translate(b.x + b.w / 2, b.y + b.h / 2); if (down) g.scale(0.95, 0.95); const w = b.w, h = b.h;
        if (gas) { let gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#9CA3AF'); gr.addColorStop(0.5, '#F3F4F6'); gr.addColorStop(1, '#6B7280'); g.fillStyle = gr; g.beginPath(); g.moveTo(-w * 0.42, -h / 2); g.lineTo(w * 0.42, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.fill();
          g.fillStyle = down ? '#111827' : '#1F2937'; g.beginPath(); g.moveTo(-w * 0.36, -h / 2 + 7); g.lineTo(w * 0.36, -h / 2 + 7); g.lineTo(w * 0.43, h / 2 - 7); g.lineTo(-w * 0.43, h / 2 - 7); g.closePath(); g.fill();
          for (let j = 0; j < 7; j++) { const yy = -h / 2 + 16 + (j * (h - 50)) / 6, ww = w * (0.6 + (j / 6) * 0.12); g.fillStyle = '#4B5563'; rr(g, -ww / 2, yy, ww, 4, 2); g.fill(); }
          if (down) { g.strokeStyle = '#22C55E'; g.lineWidth = 3; g.shadowColor = '#22C55E'; g.shadowBlur = 14; g.beginPath(); g.moveTo(-w * 0.42, -h / 2); g.lineTo(w * 0.42, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.stroke(); g.shadowBlur = 0; }
          tt(tx('gas'), 0, h / 2 - 20, Math.min(18, w * 0.2), down ? '#4ADE80' : '#F8FAFC', 'center', 0, 900, 1); }
        else { const pre = !launched, cue = pre ? phV >= 1 && Kc >= 0 : dispR >= 7300 && dispR <= 7900 && vc.gear < NG - 1 && !vc.fin, pulse = cue ? 0.5 + 0.5 * Math.sin(Tn * 18) : 0;
          let gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#334155'); gr.addColorStop(1, '#0F172A'); g.fillStyle = gr; rr(g, -w / 2, -h / 2, w, h, 16); g.fill();
          g.strokeStyle = cue ? `rgba(74,222,128,${0.6 + pulse * 0.4})` : pre ? '#F59E0B' : '#F97316'; g.lineWidth = cue ? 4 : 2.5; if (cue) { g.shadowColor = '#4ADE80'; g.shadowBlur = 18 * pulse; } rr(g, -w / 2, -h / 2, w, h, 16); g.stroke(); g.shadowBlur = 0;
          const aw = w * 0.32; g.fillStyle = cue ? '#4ADE80' : '#F8FAFC'; for (let j = 0; j < 2; j++) { const yy = -h * 0.16 + j * aw * 0.55 - (pre ? 0 : 0); g.beginPath(); g.moveTo(-aw, yy + aw * 0.45); g.lineTo(0, yy - aw * 0.15); g.lineTo(aw, yy + aw * 0.45); g.lineTo(aw, yy + aw * 0.7); g.lineTo(0, yy + aw * 0.1); g.lineTo(-aw, yy + aw * 0.7); g.closePath(); g.fill(); if (pre) break; }
          tt(pre ? tx('clutch') : tx('shift'), 0, h / 2 - 20, Math.min(16, (w * 1.25) / Math.max(5, (pre ? tx('clutch') : tx('shift')).length)), cue ? '#4ADE80' : pre ? '#FBBF24' : '#F8FAFC', 'center', 0, 900, 1);
          if (launched && vc.gear < NG - 1) tt(`${vc.gear + 1} → ${vc.gear + 2}`, 0, -h / 2 + 18, 12, '#94A3B8', 'center', 0, 800, 1); }
        g.restore(); if (LY.fine && !SPEC) tt(gas ? '↑ / W' : 'SPACE', b.x + b.w / 2, b.y + b.h + 8, 10, '#64748B', 'center', 0, 700, 0); };
      if (!SPEC) { btn(LY.gasB, 'gas'); btn(LY.shB, 'shift'); }
    });
    return { apply: () => false, rt: (sd0, d) => H.link.recv(d, sd0), stop: () => { stop(); removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('resize', onRes); }, resize: onRes, quit: (s) => { if (C[s]) C[s].out = 1; } };
  };

  // ---- Penalti seriyasi (navbatma-navbat, 2–4 kishi; darvozabon — umumiy AI, seed orqali hamma mijozda bir xil) ----
  MPL.push({ id: 'shootout', e: '🥅', c: ['#15803D', '#0C4A6E'], bot: 1, n: { uz: 'Penalti seriyasi', ru: 'Серия пенальти', en: 'Penalty Shootout' } });
  const SHOOT_T = {
    uz: { your: 'SIZNING NAVBATINGIZ', aim: 'Darvozaga bosing / torting — nishon', aimk: 'Nishon: ←↑→↓ yoki sichqoncha, Probel', power: 'Kuchni to‘xtatish uchun bosing', goal: 'GOL!', save: 'QAYTARDI!', post: 'USTUNGA TEGDI!', postin: 'USTUN… VA GOL!', wide: 'YONIDAN!', over: 'USTIDAN!', round: 'RAUND {n}/5', sd: 'QO‘SHIMCHA SERIYA', kicks: '{n} tepmoqda…', pw: 'KUCH' },
    ru: { your: 'ВАШ УДАР', aim: 'Нажмите / тяните по воротам — прицел', aimk: 'Прицел: ←↑→↓ или мышь, Пробел', power: 'Нажмите, чтобы остановить силу', goal: 'ГОЛ!', save: 'СЕЙВ!', post: 'ШТАНГА!', postin: 'ШТАНГА… И ГОЛ!', wide: 'МИМО!', over: 'ВЫШЕ ВОРОТ!', round: 'РАУНД {n}/5', sd: 'ДОП. СЕРИЯ', kicks: 'Бьёт {n}…', pw: 'СИЛА' },
    en: { your: 'YOUR TURN', aim: 'Tap or drag on the goal to aim', aimk: 'Aim: ←↑→↓ or mouse, Space', power: 'Tap to stop the power bar', goal: 'GOAL!', save: 'SAVED!', post: 'OFF THE POST!', postin: 'POST… AND IN!', wide: 'WIDE!', over: 'OVER THE BAR!', round: 'ROUND {n}/5', sd: 'SUDDEN DEATH', kicks: '{n} is shooting…', pw: 'POWER' },
  };
  MPI.shootout = (stage, ctx) => {
    const NP = ctx.n || 2, tx = (k) => (SHOOT_T[L()] || SHOOT_T.en)[k] || SHOOT_T.en[k];
    const cv = canvasIn(stage); const { c, g } = cv; c.style.touchAction = 'none';
    const GW = 3.66, GH = 2.44, BR = 0.11, KZ = 16.9, GZ = 17, SZ = 6, NZ = 18.6, NT = 2.0, TC = 0.95; let CAMH = 2.0, KX0 = -1.15, YM = 0, WIDE = false;
    const mb = (a) => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const cl = (v, a, b) => (v < a ? a : v > b ? b : v), ease = (u) => 1 - (1 - u) * (1 - u), sg = (v) => (v < 0 ? -1 : 1);
    // ---------- mantiq (deterministik) ----------
    const res = Array.from({ length: NP }, () => []), log = [];
    let phase = 'reg', round = 0, rq = [], cur = 0, sdSet = null, sdRound = 0, done = false, winner = null, kickN = 0;
    const goals = (s) => res[s].reduce((a, v) => a + (v ? 1 : 0), 0);
    const startRound = (l) => { rq = l.slice(); cur = rq.shift(); };
    const finish = (w) => { done = true; winner = w; cur = -1; };
    const early = () => { if (phase !== 'reg') return false; const A = ctx.active(); for (const s of A) if (A.every((o) => o === s || goals(o) + Math.max(0, 5 - res[o].length) < goals(s))) { finish(s); return true; } return false; };
    const advance = () => {
      if (early()) return;
      if (rq.length) { cur = rq.shift(); return; }
      const A = ctx.active();
      if (phase === 'reg') { if (round < 4) { round++; return startRound(A); } const mx = Math.max(...A.map(goals)), top = A.filter((s) => goals(s) === mx); if (top.length === 1) return finish(top[0]); phase = 'sd'; sdSet = top; return startRound(sdSet); }
      sdSet = sdSet.filter((s) => !ctx.out.has(s)); const sc = sdSet.filter((s) => res[s][res[s].length - 1]);
      if (sc.length === 1) return finish(sc[0]); if (sc.length) sdSet = sc; if (sdSet.length === 1) return finish(sdSet[0]);
      if (++sdRound >= 15) return finish(ctx.DRAW); startRound(sdSet);
    };
    startRound(ctx.active());
    // zarba natijasi: harakat {x,y,p} + seed + zarba raqami → hamma joyda bir xil
    const outcome = (x, y, p, k) => {
      const R = mb((ctx.seed ^ Math.imul(k + 1, 0x9E3779B1)) >>> 0);
      x = cl(x, -1.3, 1.3); y = cl(y, 0, 1.4); p = cl(p, 0, 1);
      const sc = 0.1 + 0.5 * p * p, r1 = R(), r2 = R();
      const ax = x * GW + (r1 - 0.5) * 1.6 * sc, ay = Math.max(BR, y * GH + (r2 - 0.5) * 0.9 * sc + (p > 0.84 ? (p - 0.84) * 9 : 0));
      const curve = (R() - 0.5) * 1.4, read = R(), s1 = R(), s2 = R(), s3 = R(), luck = R(), sv = R();
      let kx, ky; // darvozabon sakrash nuqtasi: zarbani "o'qiydi" yoki taxmin qiladi
      if (read < 0.2 + 0.4 * (1 - p)) { kx = ax * (0.72 + 0.28 * s1); ky = ay * (0.7 + 0.3 * s2); }
      else { const d = s3 < 0.42 ? -1 : s3 < 0.84 ? 1 : 0; kx = d ? d * (1.3 + 1.7 * s1) : 0; ky = d ? 0.3 + 1.5 * s2 : 0.6 + 1.2 * s2; }
      kx = cl(kx, -3.3, 3.3); ky = cl(ky, 0.15, 2.3);
      const aX = Math.abs(ax), inG = aX < GW - 0.03 && ay < GH - 0.03;
      const post = Math.abs(aX - GW) < BR + 0.07 && ay < GH + BR, bar = Math.abs(ay - GH) < BR + 0.07 && aX < GW + BR;
      let r;
      if (post || bar) r = inG && luck < 0.35 ? 'postin' : 'post';
      else if (!inG) r = aX >= GW ? 'wide' : 'over';
      else { let reach = 0.62 + 0.6 * (1 - p); if (aX > 2.9 && ay > 1.75) reach *= 0.45; else if (aX > 3.1 || (aX > 2.6 && ay < 0.35)) reach *= 0.7; const dx = ax - kx, dy = (ay - ky) * 1.15; r = Math.sqrt(dx * dx + dy * dy) < reach ? 'save' : 'goal'; }
      return { r, goal: r === 'goal' || r === 'postin', ax, ay, kx, ky, curve, p, bar: !post && bar, sv };
    };
    // ---------- ko'rinish holati ----------
    let US = 0, W = 0, H = 0, S = 0, F = 0, HZ = 0, CX = 0, DPR = 1, PX = 0, PY = 0, PS = 0, bgC = null, crC = null, crH = 0;
    const P = (x, y, z) => { PS = F / z; PX = CX + x * PS; PY = HZ + (CAMH - y) * PS; };
    const Q = []; let A = null, visN = 0, ann = -2, ph = 'idle', aimX = 0, aimY = 0.45, pw = 0, pwT = 0, drag = false, bannerT = 9, tm = 0, shk = 0, flashA = 0, cheer = 0, stopped = false, lbl = '';
    const ball = { x: 0, y: BR, z: SZ, vx: 0, vy: 0, vz: 0, rot: 0, gone: false };
    const rip = []; const PN = 140, pX = new Float32Array(PN), pY = new Float32Array(PN), pVX = new Float32Array(PN), pVY = new Float32Array(PN), pL = new Float32Array(PN), pC = new Array(PN).fill('#fff'); let pI = 0;
    const NUM = [10, 7, 9, 11], KIT = '#A3E635', TN = 14, trX = new Float32Array(TN), trY = new Float32Array(TN), trZ = new Float32Array(TN); let trN = 0, trI = 0;
    const off = (w, h) => { const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(w * DPR)); o.height = Math.max(1, Math.round(h * DPR)); const x = o.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return [o, x]; };
    // statik fon: osmon, projektorlar, tribuna, maysa, chiziqlar (offscreen keshda)
    const build = () => {
      W = c.W; H = c.H; DPR = c.width / c.W; CX = W / 2; const ar = W / H; WIDE = ar > 1.45 && H < 520; CAMH = WIDE ? 1.5 : ar < 0.85 ? 3.0 : 2.0;
      // kamera: past yassi ekranda darvozaga yaqinlashadi (to'p pastki chetda, tepuvchi qisman kesiladi)
      const tp = (GH + 0.2 - CAMH) / GZ, bt = CAMH / (WIDE ? 5.9 : 4.95), mt = WIDE ? Math.max(22, H * 0.1) : H * 0.14, mbm = WIDE ? 8 : 44;
      F = Math.min(W * (WIDE ? 1.3 : 1.9), H * (WIDE ? 9 : 1.75), (H - mt - mbm) / (Math.max(0, tp) + bt)); S = F / 1.86; HZ = H - mbm - bt * F;
      KX0 = -Math.min(1.6, (CX * 0.64) / (F / 4.95)); P(0, 0, GZ); YM = PY; P(0, 0, SZ); YM = (YM + PY) / 2; US = Math.min(S, H * 0.75);
      const [b, x] = off(W, H); bgC = b;
      let gr = x.createLinearGradient(0, 0, 0, HZ); gr.addColorStop(0, '#060B1E'); gr.addColorStop(0.6, '#1A2350'); gr.addColorStop(1, '#3A2D62'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
      const rs = mb(99); x.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 40; i++) x.fillRect(rs() * W, rs() * HZ * 0.5, 1.2, 1.2);
      // projektor minoralari
      for (const sd of [-1, 1]) {
        const tx0 = CX + sd * Math.max(W * 0.42, S * 0.55), ty0 = Math.max(18, HZ - 0.95 * S);
        x.strokeStyle = '#1F2937'; x.lineWidth = 4; x.beginPath(); x.moveTo(tx0, ty0); x.lineTo(tx0 + sd * 8, HZ); x.stroke();
        const rg = x.createRadialGradient(tx0, ty0, 2, tx0, ty0, S * 0.7); rg.addColorStop(0, 'rgba(255,250,220,.55)'); rg.addColorStop(0.25, 'rgba(255,240,200,.12)'); rg.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
        x.fillStyle = '#111827'; rr(x, tx0 - 26, ty0 - 14, 52, 26, 3); x.fill();
        for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { x.fillStyle = '#FFFBEB'; x.shadowColor = '#FEF3C7'; x.shadowBlur = 8; x.beginPath(); x.arc(tx0 - 20 + i * 10, ty0 - 8 + j * 8, 3, 0, 7); x.fill(); }
        x.shadowBlur = 0;
      }
      // tribuna qiyaligi
      const bank = (z) => 1.5 + (z - 22.5) * 0.72;
      P(0, bank(46), 46); const topY = PY; P(0, 1.5, 22.5); const botY = PY;
      x.fillStyle = '#0F172A'; x.fillRect(0, topY - S * 0.07, W, S * 0.07); x.fillStyle = '#1E293B'; x.fillRect(0, topY - S * 0.012, W, S * 0.012);
      for (let i = 0; i < 9; i++) { const lx = (i + 0.5) * W / 9; const lg = x.createRadialGradient(lx, topY - S * 0.015, 1, lx, topY - S * 0.015, 14); lg.addColorStop(0, 'rgba(255,255,255,.9)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = lg; x.fillRect(lx - 14, topY - S * 0.03, 28, 28); }
      gr = x.createLinearGradient(0, topY, 0, botY); gr.addColorStop(0, '#1E1B4B'); gr.addColorStop(1, '#312E81'); x.fillStyle = gr; x.fillRect(0, topY, W, botY - topY);
      P(0, 0, 22.5); const wallB = PY; gr = x.createLinearGradient(0, botY, 0, wallB); gr.addColorStop(0, '#1E3A8A'); gr.addColorStop(1, '#0F172A'); x.fillStyle = gr; x.fillRect(0, botY, W, wallB - botY + 1);
      // maysa (perspektivada chiziqlar)
      P(0, 0, 21.6); const gTop = PY; x.fillStyle = '#1F7A33'; x.fillRect(0, gTop, W, H - gTop);
      for (let z = 21.6, i = 0; z > 1.2; z -= 1.6, i++) { P(0, 0, z); const y0 = PY; P(0, 0, Math.max(1.2, z - 1.6)); const y1 = Math.min(H, PY); x.fillStyle = i % 2 ? '#2C9142' : '#25843A'; x.fillRect(0, y0, W, y1 - y0 + 1); }
      for (let i = 0; i < 900; i++) { const yy = gTop + rs() * (H - gTop); x.fillStyle = rs() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'; x.fillRect(rs() * W, yy, 1.5, 1.5); }
      gr = x.createRadialGradient(CX, HZ + 0.25 * S, 10, CX, HZ + 0.25 * S, S * 0.9); gr.addColorStop(0, 'rgba(255,255,230,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, gTop, W, H - gTop);
      // eskirgan joylar
      x.fillStyle = 'rgba(120,90,40,.18)'; P(0, 0, 16.4); x.beginPath(); x.ellipse(PX, PY, 1.8 * PS, 0.35 * PS, 0, 0, 7); x.fill(); P(0, 0, SZ); x.beginPath(); x.ellipse(PX, PY, 0.7 * PS, 0.25 * PS, 0, 0, 7); x.fill();
      // chiziqlar
      x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineCap = 'round';
      const ln = (x0, z0, x1, z1) => { P(x0, 0, z0); const a = PX, b2 = PY, w0 = PS; P(x1, 0, z1); x.lineWidth = Math.max(1, 0.1 * (w0 + PS) / 2); x.beginPath(); x.moveTo(a, b2); x.lineTo(PX, PY); x.stroke(); };
      ln(-40, GZ, 40, GZ); ln(-9.16, 11.5, 9.16, 11.5); ln(-9.16, 11.5, -9.16, GZ); ln(9.16, 11.5, 9.16, GZ); ln(-20.16, 0.6, -20.16, GZ); ln(20.16, 0.6, 20.16, GZ);
      P(0, 0, SZ); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(PX, PY, 0.13 * PS, 0.13 * PS * (CAMH / SZ) * 1.2, 0, 0, 7); x.fill();
      // darvoza soyasi
      P(-GW, 0, GZ); const sx0 = PX, sy0 = PY; P(GW, 0, NZ + 0.6); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(sx0, sy0 - (sy0 - PY), PX - sx0, sy0 - PY);
      // tomoshabinlar (alohida kesh — to'lqin uchun bo'laklab chiziladi)
      crH = botY + 6; const [cc, y] = off(W, crH); crC = cc;
      const SK = ['#F5D0A9', '#E0AC69', '#C68642', '#8D5524', '#FFDBAC'], CL = ['#3B82F6', '#EF4444', '#F8FAFC', '#22C55E', '#F59E0B', '#1F2937', '#A855F7', '#EF4444', '#3B82F6', '#FDE047'];
      let balc = false;
      for (let z = 46; z >= 23; z -= 0.72) {
        if (!balc && z < 33.5) { // ikkinchi yarus balkoni + LED lenta
          balc = true; const by = bank(33.2); P(0, by + 0.2, 33.2); const b0 = PY, ps = PS; P(0, by - 1.1, 33.2); const b1 = PY;
          let lg2 = y.createLinearGradient(0, b0, 0, b1); lg2.addColorStop(0, '#111827'); lg2.addColorStop(0.3, '#1F2937'); lg2.addColorStop(1, '#030712'); y.fillStyle = lg2; y.fillRect(0, b0, W, b1 - b0);
          const lh = (b1 - b0) * 0.42, ly = b0 + (b1 - b0) * 0.34; lg2 = y.createLinearGradient(0, ly, 0, ly + lh); lg2.addColorStop(0, '#0E7490'); lg2.addColorStop(1, '#164E63'); y.fillStyle = lg2; y.fillRect(0, ly, W, lh);
          const msg = ['GOAL', 'PENALTY', 'BIRGA', 'GOAL', '★★★'], step = Math.max(60, lh * 7); for (let i = 0, xx = 6; xx < W; i++, xx += step) text(y, msg[i % msg.length], xx + step / 2, ly + lh / 2, Math.max(6, lh * 0.7), '#A5F3FC', 'center', 900);
          y.fillStyle = 'rgba(255,255,255,.35)'; y.fillRect(0, b0, W, Math.max(1, ps * 0.03));
          continue;
        }
        const yb = bank(z); P(0, yb, z); const ps = PS, rowY = PY, half = (W / 2) / ps + 1;
        y.fillStyle = 'rgba(0,0,0,.25)'; y.fillRect(0, rowY - 0.1 * ps, W, 0.12 * ps);
        for (let xx = -half + rs() * 0.4; xx < half; xx += 0.5 + rs() * 0.12) {
          if (rs() < 0.06) continue;
          const sx = CX + xx * ps, bh = (0.48 + rs() * 0.1) * ps, bw = 0.38 * ps, col = CL[(rs() * CL.length) | 0];
          y.fillStyle = col; rr(y, sx - bw / 2, rowY - bh, bw, bh, bw * 0.3); y.fill();
          y.fillStyle = SK[(rs() * SK.length) | 0]; y.beginPath(); y.arc(sx, rowY - bh - 0.1 * ps, 0.11 * ps, 0, 7); y.fill();
          if (rs() < 0.12) { y.strokeStyle = col; y.lineWidth = Math.max(1, 0.07 * ps); y.beginPath(); y.moveTo(sx - bw * 0.4, rowY - bh * 0.8); y.lineTo(sx - bw * 0.7, rowY - bh - 0.35 * ps); y.moveTo(sx + bw * 0.4, rowY - bh * 0.8); y.lineTo(sx + bw * 0.7, rowY - bh - 0.35 * ps); y.stroke(); }
          if (rs() < 0.015) { y.fillStyle = CL[(rs() * 4) | 0]; y.fillRect(sx, rowY - bh - 0.9 * ps, 0.7 * ps, 0.4 * ps); y.fillStyle = '#E5E7EB'; y.fillRect(sx - 0.03 * ps, rowY - bh - 0.9 * ps, 0.05 * ps, 0.9 * ps); }
        }
      }
      // uzoq qatorlar qorong'iroq (chuqurlik)
      y.globalCompositeOperation = 'source-atop'; gr = y.createLinearGradient(0, 0, 0, crH); gr.addColorStop(0, 'rgba(6,10,30,.62)'); gr.addColorStop(0.55, 'rgba(6,10,30,.25)'); gr.addColorStop(1, 'rgba(6,10,30,0)'); y.fillStyle = gr; y.fillRect(0, 0, W, crH); y.globalCompositeOperation = 'source-over';
      // tribuna oldidagi soya
      gr = y.createLinearGradient(0, topY, 0, topY + S * 0.12); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); y.fillStyle = gr; y.fillRect(0, topY, W, S * 0.12);
    };
    // ---------- figuralar ----------
    const limb = (x0, y0, x1, y1, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const leg2 = (hx, hy, fx, fy, bend, w, skin, sock, boot, short) => { const mx = (hx + fx) / 2 + bend, my = (hy + fy) / 2; limb(hx, hy, mx, my, w, skin); limb(mx, my, fx, fy, w * 0.9, sock); g.fillStyle = boot; g.beginPath(); g.ellipse(fx, fy, w * 0.75, w * 0.45, 0, 0, 7); g.fill(); if (short) limb(hx, hy, hx + (mx - hx) * 0.35, hy + (my - hy) * 0.35, w * 1.25, short); };
    // darvozabon (old tomondan), mahalliy koordinata: y tepaga, markaz — bel
    const drawKeeper = (cxm, cym, th, hl0, hl1, hr0, hr1, spread) => {
      P(cxm, 0, KZ); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(PX, PY, (0.45 + Math.abs(Math.sin(th)) * 0.6) * PS, 0.08 * PS, 0, 0, 7); g.fill();
      P(cxm, cym, KZ); g.save(); g.translate(PX, PY); g.scale(PS, -PS); g.rotate(-th); g.lineCap = 'round';
      const fx = 0.2 + spread * 0.12;
      leg2(-0.11, -0.05, -fx, -0.92, -0.06, 0.12, '#F1C27D', '#14532D', '#111', '#111827'); leg2(0.11, -0.05, fx, -0.92, 0.06, 0.12, '#F1C27D', '#14532D', '#111', '#111827');
      g.fillStyle = '#111827'; rr(g, -0.22, -0.2, 0.44, 0.26, 0.06); g.fill();
      const gr = g.createLinearGradient(-0.25, 0, 0.25, 0); gr.addColorStop(0, '#65A30D'); gr.addColorStop(0.5, KIT); gr.addColorStop(1, '#4D7C0F'); g.fillStyle = gr; g.beginPath(); g.moveTo(-0.22, 0.02); g.lineTo(0.22, 0.02); g.lineTo(0.27, 0.56); g.lineTo(-0.27, 0.56); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(-0.24, 0.26, 0.48, 0.07); g.fillStyle = '#1C1917'; g.fillRect(-0.06, 0.5, 0.12, 0.06);
      const arm = (sx, sy, hx, hy) => { let dx = hx - sx, dy = hy - sy; const d = Math.sqrt(dx * dx + dy * dy) || 1, m = Math.min(d, 0.72); dx *= m / d; dy *= m / d; const ex = sx + dx * 0.5 - dy * 0.12 * sg(sx), ey = sy + dy * 0.5 + dx * 0.12 * sg(sx); limb(sx, sy, ex, ey, 0.11, KIT); limb(ex, ey, sx + dx, sy + dy, 0.095, '#F1C27D'); g.fillStyle = '#F8FAFC'; g.beginPath(); g.arc(sx + dx, sy + dy, 0.095, 0, 7); g.fill(); g.fillStyle = '#F97316'; g.beginPath(); g.arc(sx + dx, sy + dy, 0.05, 0, 7); g.fill(); };
      arm(-0.24, 0.5, hl0, hl1); arm(0.24, 0.5, hr0, hr1);
      g.fillStyle = '#E0AC69'; g.fillRect(-0.05, 0.54, 0.1, 0.08); g.beginPath(); g.arc(0, 0.74, 0.13, 0, 7); g.fill();
      g.fillStyle = '#3F2A1D'; g.beginPath(); g.arc(0, 0.77, 0.135, 0.15, Math.PI - 0.15); g.fill(); g.fillStyle = '#111'; g.fillRect(-0.06, 0.72, 0.03, 0.03); g.fillRect(0.03, 0.72, 0.03, 0.03);
      g.restore();
    };
    // tepuvchi (orqa tomondan), mahalliy: y pastga, boshi — oyoqlar orasi
    const drawKicker = (fx, fy, k, col, num, run, kick, react, jump) => {
      g.save(); g.translate(fx, fy); g.scale(k, k); g.lineCap = 'round'; g.lineJoin = 'round';
      const sh = g.createRadialGradient(0, 0, 0.02, 0, 0, 0.5); sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.beginPath(); g.ellipse(0, 0, 0.5, 0.11, 0, 0, 7); g.fill(); g.translate(0, -jump);
      const lL = run >= 0 ? Math.max(0, Math.sin(run)) * 0.28 : 0, lR = run >= 0 ? Math.max(0, -Math.sin(run)) * 0.28 : 0, sw = run >= 0 ? Math.sin(run) : 0, bob = run >= 0 ? Math.abs(Math.cos(run)) * 0.04 : 0;
      g.translate(0, -bob);
      const sock = (x0, y0, x1, y1) => { limb(x0, y0, x1, y1, 0.115, '#F8FAFC'); const m = 0.25; limb(x0 + (x1 - x0) * m, y0 + (y1 - y0) * m, x0 + (x1 - x0) * (m + 0.1), y0 + (y1 - y0) * (m + 0.1), 0.12, col); };
      const leg = (hx, fxx, fyy, bend) => { const mx = (hx + fxx) / 2 + bend, my = (-0.92 + fyy) / 2; limb(hx, -0.92, mx, my, 0.14, '#D9A066'); sock(mx, my, fxx, fyy - 0.04); g.fillStyle = '#0B0F19'; g.beginPath(); g.ellipse(fxx, fyy - 0.02, 0.085, 0.06, 0, 0, 7); g.fill(); g.fillStyle = col; g.fillRect(fxx - 0.07, fyy - 0.05, 0.14, 0.02); };
      leg(-0.11, -0.15, -lL, -0.05); leg(0.11, 0.15 + kick * 0.05, -lR - kick * 0.45, 0.05);
      // shorti
      g.fillStyle = '#0F172A'; g.beginPath(); g.moveTo(-0.25, -1.05); g.lineTo(0.25, -1.05); g.lineTo(0.27, -0.78); g.lineTo(0.03, -0.76); g.lineTo(0, -0.84); g.lineTo(-0.03, -0.76); g.lineTo(-0.27, -0.78); g.closePath(); g.fill();
      g.fillStyle = col; g.fillRect(-0.265, -1.03, 0.035, 0.25); g.fillRect(0.23, -1.03, 0.035, 0.25);
      // futbolka
      const gr = g.createLinearGradient(-0.32, 0, 0.32, 0); gr.addColorStop(0, 'rgba(0,0,0,.38)'); gr.addColorStop(0.42, 'rgba(255,255,255,.16)'); gr.addColorStop(0.6, 'rgba(255,255,255,.04)'); gr.addColorStop(1, 'rgba(0,0,0,.42)');
      g.fillStyle = col; g.beginPath(); g.moveTo(-0.25, -0.98); g.lineTo(0.25, -0.98); g.quadraticCurveTo(0.3, -1.25, 0.31, -1.49); g.quadraticCurveTo(0, -1.6, -0.31, -1.49); g.quadraticCurveTo(-0.3, -1.25, -0.25, -0.98); g.closePath(); g.fill(); g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 0.015; g.beginPath(); g.moveTo(-0.1, -1.0); g.quadraticCurveTo(-0.05, -1.25, -0.12, -1.45); g.moveTo(0.12, -1.02); g.quadraticCurveTo(0.08, -1.2, 0.14, -1.42); g.stroke();
      g.fillStyle = '#F8FAFC'; g.fillRect(-0.25, -1.01, 0.5, 0.035);
      let hx = 0.34, hy = -1.02 - sw * 0.14, hy2 = -1.02 + sw * 0.14; if (react === 1) { hx = 0.46; hy = hy2 = -2.08; } else if (react === 2) { hx = 0.13; hy = hy2 = -1.74; }
      const ar = (sx, ex, ey) => { const mx = (sx + ex) / 2 + sg(sx) * 0.1, my = (-1.45 + ey) / 2, kx = sx + (mx - sx) * 0.55, ky = -1.45 + (my + 1.45) * 0.55; limb(sx, -1.45, kx, ky, 0.13, col); limb(kx, ky, kx + (mx - kx) * 0.12, ky + (my - ky) * 0.12, 0.13, '#F8FAFC'); limb(kx, ky, mx, my, 0.095, '#D9A066'); limb(mx, my, ex, ey, 0.085, '#D9A066'); g.fillStyle = '#C98F57'; g.beginPath(); g.arc(ex, ey, 0.055, 0, 7); g.fill(); };
      ar(-0.27, -hx, hy); ar(0.27, hx, hy2);
      // bo'yin, bosh, soch
      g.fillStyle = '#C98F57'; g.fillRect(-0.055, -1.62, 0.11, 0.1); g.fillStyle = '#F8FAFC'; g.beginPath(); g.ellipse(0, -1.53, 0.1, 0.03, 0, 0, 7); g.fill();
      g.fillStyle = '#D9A066'; g.beginPath(); g.ellipse(0, -1.7, 0.12, 0.135, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-0.12, -1.69, 0.025, 0.04, 0, 0, 7); g.ellipse(0.12, -1.69, 0.025, 0.04, 0, 0, 7); g.fill();
      g.fillStyle = '#1C1410'; g.beginPath(); g.ellipse(0, -1.74, 0.125, 0.11, 0, Math.PI, Math.PI * 2); g.lineTo(0.125, -1.68); g.quadraticCurveTo(0, -1.6, -0.125, -1.68); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(-0.04, -1.8, 0.05, 0.025, -0.4, 0, 7); g.fill();
      // raqam
      g.scale(0.01, 0.01); g.font = `900 30px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3.5; g.strokeStyle = 'rgba(0,0,0,.45)'; g.strokeText(String(num), 0, -125); g.fillStyle = '#fff'; g.fillText(String(num), 0, -125);
      g.restore();
    };
    const drawBall = (sx, sy, r, rot) => {
      const gr = g.createRadialGradient(sx - r * 0.35, sy - r * 0.35, r * 0.1, sx, sy, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.7, '#E5E7EB'); gr.addColorStop(1, '#94A3B8');
      g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, 7); g.fill(); if (r < 3) return;
      g.save(); g.beginPath(); g.arc(sx, sy, r, 0, 7); g.clip(); g.fillStyle = '#1F2937';
      for (let i = 0; i < 6; i++) { const a = rot + i * 1.0472, d = i ? r * 0.78 : 0, px = sx + Math.cos(a) * d * (i ? 1 : 0), py = sy + Math.sin(a * 0.7 + rot * 0.3) * d * 0.9 * (i ? 1 : 0), pr = i ? r * 0.3 : r * 0.32; g.beginPath(); for (let j = 0; j < 5; j++) { const b = rot * (i ? 0.5 : 1) + j * 1.2566; g.lineTo(px + Math.cos(b) * pr, py + Math.sin(b) * pr); } g.fill(); }
      g.restore();
    };
    // ---------- to'r (to'lqinlanadi) ----------
    const NXc = 24, NVc = 12, nsx = new Float32Array((NXc + 1) * (NVc + 1)), nsy = new Float32Array((NXc + 1) * (NVc + 1));
    const ripD = (x, y) => { let d = 0; for (const r of rip) { const dx = x - r.x, dy = y - r.y, q = dx * dx + dy * dy; if (q > 3) continue; d += r.a * Math.exp(-q / 0.45) * Math.exp(-r.t * 2.4) * (1 + 0.6 * Math.sin(r.t * 22 - Math.sqrt(q) * 6)); } return d; };
    const netPt = (u, v) => { const x = -GW + 2 * GW * u; let y, z; if (v <= 0.6) { y = NT * v / 0.6; z = NZ; } else { const w = (v - 0.6) / 0.4; y = NT + (GH - NT) * w; z = NZ + (GZ - NZ) * w; } z += ripD(x, y) * (v <= 0.6 ? 1 : 1 - (v - 0.6) / 0.4); P(x, y, z); };
    const drawNet = () => {
      for (let j = 0; j <= NVc; j++) for (let i = 0; i <= NXc; i++) { netPt(i / NXc, j / NVc); const k = j * (NXc + 1) + i; nsx[k] = PX; nsy[k] = PY; }
      g.fillStyle = 'rgba(15,23,42,.35)'; g.beginPath(); for (let i = 0; i <= NXc; i++) g.lineTo(nsx[i], nsy[i]); for (let i = NXc; i >= 0; i--) g.lineTo(nsx[NVc * (NXc + 1) + i], nsy[NVc * (NXc + 1) + i]); g.fill();
      g.strokeStyle = 'rgba(241,245,249,.5)'; g.lineWidth = 1; g.beginPath();
      for (let j = 0; j <= NVc; j++) { for (let i = 0; i <= NXc; i++) { const k = j * (NXc + 1) + i; i ? g.lineTo(nsx[k], nsy[k]) : g.moveTo(nsx[k], nsy[k]); } }
      for (let i = 0; i <= NXc; i++) { for (let j = 0; j <= NVc; j++) { const k = j * (NXc + 1) + i; j ? g.lineTo(nsx[k], nsy[k]) : g.moveTo(nsx[k], nsy[k]); } }
      // yon to'rlar
      for (const sd of [-1, 1]) { const x = sd * GW; for (let j = 0; j <= 8; j++) { const h0 = (GH * j) / 8, h1 = (NT * j) / 8; P(x, h0, GZ); g.moveTo(PX, PY); P(x, h1, NZ); g.lineTo(PX, PY); } for (let i = 0; i <= 6; i++) { const z = GZ + ((NZ - GZ) * i) / 6, top = GH + ((NT - GH) * i) / 6; P(x, 0, z); g.moveTo(PX, PY); P(x, top, z); g.lineTo(PX, PY); } }
      g.stroke();
      g.strokeStyle = '#94A3B8'; g.lineWidth = 2; g.beginPath(); P(-GW, 0, NZ); g.moveTo(PX, PY); P(-GW, NT, NZ); g.lineTo(PX, PY); P(GW, NT, NZ); g.lineTo(PX, PY); P(GW, 0, NZ); g.lineTo(PX, PY); g.stroke();
    };
    const drawPosts = () => {
      P(0, 0, GZ); const w = 0.12 * PS;
      const pg = (x0, x1) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#CBD5E1'); gr.addColorStop(0.4, '#fff'); gr.addColorStop(1, '#94A3B8'); return gr; };
      for (const sd of [-1, 1]) { P(sd * (GW + 0.06), GH + 0.12, GZ); const xx = PX - w / 2, top = PY; P(0, 0, GZ); g.fillStyle = pg(xx, xx + w); g.fillRect(xx, top, w, PY - top); }
      P(-GW - 0.12, GH + 0.12, GZ); const x0 = PX, y0 = PY; P(GW + 0.12, GH, GZ); const gr = g.createLinearGradient(0, y0, 0, PY); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#94A3B8'); g.fillStyle = gr; g.fillRect(x0, y0, PX - x0, PY - y0);
    };
    const AD = ['BIRGA', '⚽ BIRGA O‘YINLAR', 'BIRGA', 'PENALTI • BIRGA'];
    const drawBoards = () => {
      P(0, 0.9, 21.6); const y0 = PY, ps = PS; P(0, 0, 21.6); const y1 = PY, h = y1 - y0, sw = 7 * ps;
      const sh = (tm * 0.6) % 1;
      for (let i = -6; i <= 6; i++) {
        const x0 = CX + (i - 0.5) * sw, k = (i + 60) % 4, hue = (i * 47 + ((tm * 40) | 0)) % 360;
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, `hsl(${hue},70%,22%)`); gr.addColorStop(1, `hsl(${hue},70%,12%)`); g.fillStyle = gr; g.fillRect(x0, y0, sw + 1, h);
        if (x0 > W || x0 + sw < 0) continue;
        g.save(); g.beginPath(); g.rect(x0 + 2, y0, sw - 4, h); g.clip(); text(g, AD[k], x0 + sw * (0.5 + (k % 2 ? sh - 0.5 : 0) * 0.6), y0 + h / 2, Math.max(7, h * 0.55), `hsl(${(hue + 180) % 360},90%,75%)`, 'center', 900); g.restore();
      }
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, y0, W, 1.5); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, y1, W, 2);
    };
    // ---------- animatsiya ----------
    const keeperPose = { cx: 0, cy: 0.98, th: 0, h: [-0.45, 0.3, 0.45, 0.3], sp: 0 };
    const kick = { x: KX0, z: 4.95, run: -1, k: 0, react: 0, jump: 0, s: 0, al: 1 };
    const kpFinal = (Hx, Hy) => { const th = cl(Math.atan2(Hx, Hy + 0.3) * 1.1, -1.4, 1.4), ux = Math.sin(th), uy = Math.cos(th); let cx = Hx - ux * 1.15, cy = Math.max(0.45, Hy - uy * 1.15); cx = cl(cx, -2.9, 2.9); const dx = Hx - cx, dy = Hy - cy, lx = dx * Math.cos(th) - dy * Math.sin(th), ly = dx * Math.sin(th) + dy * Math.cos(th); return { th, cx, cy, lx, ly }; };
    const burst = (x, y, n, cols) => { for (let i = 0; i < n; i++) { const j = pI++ % PN; pX[j] = x; pY[j] = y; const a = Math.random() * 6.28, v = 80 + Math.random() * 260; pVX[j] = Math.cos(a) * v; pVY[j] = Math.sin(a) * v - 180; pL[j] = 1 + Math.random() * 0.8; pC[j] = cols[i % cols.length]; } };
    const resetScene = () => { trN = 0; kick.al = 1; ball.x = 0; ball.y = BR; ball.z = SZ; ball.vx = ball.vy = ball.vz = 0; ball.gone = false; kick.x = KX0; kick.z = 4.95; kick.run = -1; kick.k = 0; kick.react = 0; kick.jump = 0; };
    const setTurn = () => { if (stopped) return; if (done) { ann = -1; ctx.over(winner); return; } ann = cur; lbl = phase === 'sd' ? tx('sd') : tx('round').replace('{n}', round + 1); ctx.turn(cur); kick.s = cur; if (cur === ctx.me) { ph = 'aim'; aimX = 0; aimY = 0.45; bannerT = 0; } else ph = 'idle'; };
    const hitFx = (A) => {
      const o = A.o; A.hit = true; A.ht = A.t; visN++; A.msg = o.r === 'post' && o.bar ? 'post' : o.r;
      const b = ball;
      if (o.r === 'goal' || o.r === 'postin') { cheer = 2.6; flashA = 0.35; if (o.r === 'postin') { b.vx = -b.vx * 0.3 - sg(o.ax) * 1.5; b.vz *= 0.75; snd(1500, 0.12, 0.06, 'square'); } [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => !stopped && snd(f, 0.18, 0.06, 'triangle'), 160 + i * 110)); }
      else if (o.r === 'save') { b.vx = sg(o.ax - o.kx || o.sv - 0.5) * (3 + o.sv * 3); b.vy = 2.2 + o.sv * 2; b.vz = -5 - o.sv * 3; shk = 6; snd(160, 0.16, 0.12, 'triangle'); P(b.x, b.y, b.z); burst(PX, PY, 18, ['#fff', '#E2E8F0']); cheer = 0.8; }
      else if (o.r === 'post') { if (o.bar) { b.vy = Math.abs(b.vy) * 0.4 + 2.5; b.vz = -b.vz * 0.35; } else { b.vx = sg(o.ax) * 2.5; b.vz = -b.vz * 0.4; } shk = 5; snd(1200, 0.25, 0.07, 'square'); snd(1800, 0.3, 0.04, 'sine'); }
      else { snd(300, 0.25, 0.06, 'sawtooth'); setTimeout(() => !stopped && snd(200, 0.3, 0.05, 'sawtooth'), 180); }
    };
    const upd = (dt) => {
      tm += dt; if (bannerT < 9) bannerT += dt; shk = Math.max(0, shk - dt * 20); flashA = Math.max(0, flashA - dt * 1.2); cheer = Math.max(0, cheer - dt);
      for (let i = rip.length - 1; i >= 0; i--) { rip[i].t += dt; if (rip[i].t > 2) rip.splice(i, 1); }
      for (let j = 0; j < PN; j++) if (pL[j] > 0) { pL[j] -= dt; pVY[j] += 420 * dt; pVX[j] *= 0.985; pX[j] += pVX[j] * dt; pY[j] += pVY[j] * dt; }
      if (ph === 'pow') { pwT += dt; const u = (pwT * 0.95) % 2; pw = u < 1 ? u : 2 - u; }
      if (!A && Q.length) { A = Q.shift(); A.t = 0; A.fd = 0.8 - 0.38 * A.o.p; resetScene(); kick.s = A.s; snd(2400, 0.18, 0.03); const o = A.o, sv = o.r === 'save'; A.H = sv ? [o.ax, o.ay] : [o.kx, o.ky]; A.kp = kpFinal(A.H[0], A.H[1]); A.dd = sv ? A.fd + 0.07 : 0.46; }
      const kp = keeperPose;
      if (!A) { // kutish: darvozabon chayqaladi
        kp.cx = Math.sin(tm * 1.6) * 0.35; kp.cy = 0.98 + Math.abs(Math.sin(tm * 3.2)) * 0.05; kp.th = 0; kp.h[0] = -0.48; kp.h[1] = 0.25; kp.h[2] = 0.48; kp.h[3] = 0.25; kp.sp = 0.3;
        kick.run = -1; kick.al = Math.min(1, kick.al + dt * 4); return;
      }
      A.t += dt; const t = A.t, o = A.o, b = ball; const ka = t > TC + 0.05 && (!A.hit || t < A.ht + 0.45) ? 0.42 : 1; kick.al += (ka - kick.al) * Math.min(1, dt * 10);
      // tepuvchi yugurishi
      if (t < TC) { const u = t / TC; kick.x = KX0 + (-0.32 - KX0) * u; kick.z = 4.95 + 0.77 * u; kick.run = t * 13; kick.k = t > TC - 0.15 ? (t - TC + 0.15) / 0.15 * 0.6 : 0; }
      else { kick.run = -1; kick.k = Math.max(0.3, 1 - (t - TC) * 1.5); if (A.hit && t > A.ht + 0.3) { kick.react = o.goal ? 1 : 2; kick.jump = o.goal ? Math.abs(Math.sin((t - A.ht) * 9)) * 0.25 : 0; } }
      // darvozabon sakrashi
      const ds = TC - 0.06, d = cl((t - ds) / A.dd, 0, 1), e = ease(d), F2 = A.kp, x0 = kp.cx;
      if (t >= ds) {
        if (A.sx == null) { A.sx = x0; }
        const side = Math.abs(F2.th) > 0.55, fall = side ? ease(cl((t - ds - A.dd) / 0.5, 0, 1)) : 0;
        kp.cx = A.sx + (F2.cx - A.sx) * e; kp.cy = 0.98 + (F2.cy - 0.98) * e + Math.sin(d * Math.PI) * (side ? 0.25 : 0.1); kp.cy += (0.3 - kp.cy) * fall;
        kp.th = F2.th * e + (sg(F2.th) * 1.55 - F2.th) * fall; kp.h[0] = -0.48 + (F2.lx - 0.1 - -0.48) * e; kp.h[1] = 0.25 + (F2.ly - 0.25) * e; kp.h[2] = 0.48 + (F2.lx + 0.1 - 0.48) * e; kp.h[3] = kp.h[1]; kp.sp = 0.3 + 0.4 * e;
      } else { kp.cx = Math.sin(tm * 1.6) * 0.35; kp.th = 0; }
      // to'p
      if (t < TC) { b.x = 0; b.y = BR; b.z = SZ; }
      else if (t < TC + A.fd) {
        if (!A.kicked) { A.kicked = 1; snd(110, 0.14, 0.14, 'sine'); snd(70, 0.12, 0.1, 'triangle'); }
        const u = (t - TC) / A.fd, arc = 0.2 + (1 - o.p) * 0.9, px = b.x, py = b.y, pz = b.z;
        b.x = o.ax * u + o.curve * Math.sin(Math.PI * u); b.y = BR + (o.ay - BR) * u + arc * Math.sin(Math.PI * u); b.z = SZ + (GZ - SZ) * u;
        if (dt > 0) { b.vx = (b.x - px) / dt; b.vy = (b.y - py) / dt; b.vz = (b.z - pz) / dt; } b.rot += dt * 18; trX[trI] = b.x; trY[trI] = b.y; trZ[trI] = b.z; trI = (trI + 1) % TN; trN = Math.min(TN, trN + 1);
      } else {
        if (!A.hit) hitFx(A);
        if (!b.gone) {
          b.vy -= 9.8 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.rot += dt * Math.sqrt(b.vx * b.vx + b.vz * b.vz) * 0.6;
          if (b.y < BR) { b.y = BR; b.vy = -b.vy * 0.45; b.vx *= 0.8; b.vz *= 0.8; }
          if (o.goal) { if (b.z > NZ - 0.1 && !A.net) { A.net = 1; rip.push({ x: b.x, y: b.y, t: 0, a: 0.75 }); shk = 7; b.vz = -b.vz * 0.12; b.vx *= 0.3; b.vy *= 0.3; snd(90, 0.3, 0.1, 'sine'); P(b.x, b.y, b.z); burst(PX, PY, 60, [ctx.col[A.s], '#FDE047', '#fff', '#22D3EE']); } b.x = cl(b.x, -GW + 0.15, GW - 0.15); b.z = Math.min(b.z, NZ - 0.05); if (b.y > GH - 0.1 && b.z > GZ) b.y = GH - 0.1; }
          else if (b.z > 26 || b.z < 1.5) b.gone = true;
        }
      }
      if (t > TC + A.fd + 2.3) { A = null; resetScene(); if (!Q.length) setTurn(); }
    };
    // ---------- chizish ----------
    const banner = (s, y, col1, col2, sz, age) => {
      const k = age < 0.18 ? 0.4 + (age / 0.18) * 0.9 : 1 + 0.3 * Math.exp(-(age - 0.18) * 7);
      g.save(); g.translate(W / 2, y); g.scale(k, k); g.font = `900 ${sz}px ${FONT}`; const mw = g.measureText(s).width; if (mw > W * 0.86) { sz *= (W * 0.86) / mw; g.font = `900 ${sz}px ${FONT}`; } g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = sz * 0.16; g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineJoin = 'round'; g.strokeText(s, 0, 4); g.strokeText(s, 0, 0);
      const gr = g.createLinearGradient(0, -sz / 2, 0, sz / 2); gr.addColorStop(0, col1); gr.addColorStop(1, col2); g.fillStyle = gr; g.fillText(s, 0, 0); g.restore();
    };
    const drawHUD = () => {
      const rh = cl(US * 0.062, 17, 26), N = NP, pw0 = Math.min(W - 16, rh * 13.5), x0 = 8, y0 = 8;
      // vizual natijalar (animatsiyadan oldin oshkor qilinmaydi)
      const vis = Array.from({ length: N }, () => []); for (let i = 0; i < visN && i < log.length; i++) vis[log[i].s].push(log[i].g);
      const maxK = Math.max(5, ...vis.map((v) => v.length)), nd = Math.min(maxK, 8), st = maxK - nd;
      g.fillStyle = 'rgba(2,6,23,.72)'; rr(g, x0, y0, pw0, rh * N + rh * 0.9, rh * 0.35); g.fill(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.stroke();
      text(g, lbl, x0 + rh * 0.45, y0 + rh * 0.45, rh * 0.42, '#FDE047', 'left', 900);
      const act = A ? A.s : ann;
      for (let s = 0; s < N; s++) {
        const y = y0 + rh * 0.9 + rh * s + rh / 2, out = ctx.out?.has(s); g.globalAlpha = out ? 0.35 : 1;
        if (s === act) { g.fillStyle = 'rgba(253,224,71,.16)'; g.fillRect(x0 + 2, y - rh / 2 + 1, pw0 - 4, rh - 2); g.fillStyle = '#FDE047'; g.fillRect(x0 + 2, y - rh / 2 + 1, 3, rh - 2); }
        g.fillStyle = ctx.col[s]; g.beginPath(); g.arc(x0 + rh * 0.55, y, rh * 0.25, 0, 7); g.fill(); if (s === ctx.me) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
        let nm = String(ctx.names[s] || '…'); if (nm.length > 10) nm = nm.slice(0, 9) + '…'; text(g, nm, x0 + rh, y, rh * 0.5, '#fff', 'left', 700);
        const dx0 = x0 + rh * 5.6, sp = Math.min(rh * 0.82, (pw0 - rh * 7.2) / nd);
        for (let i = 0; i < nd; i++) {
          const v = vis[s][st + i], cx = dx0 + i * sp, r = Math.min(rh * 0.3, sp * 0.42), sd = st + i >= 5;
          if (v == null) { g.strokeStyle = sd ? 'rgba(253,224,71,.5)' : 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, y, r, 0, 7); g.stroke(); continue; }
          g.fillStyle = v ? '#16A34A' : '#DC2626'; g.beginPath(); g.arc(cx, y, r, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = Math.max(1.5, r * 0.28); g.lineCap = 'round'; g.beginPath();
          if (v) { g.moveTo(cx - r * 0.45, y); g.lineTo(cx - r * 0.1, y + r * 0.38); g.lineTo(cx + r * 0.5, y - r * 0.4); } else { g.moveTo(cx - r * 0.4, y - r * 0.4); g.lineTo(cx + r * 0.4, y + r * 0.4); g.moveTo(cx + r * 0.4, y - r * 0.4); g.lineTo(cx - r * 0.4, y + r * 0.4); } g.stroke();
        }
        text(g, String(vis[s].filter(Boolean).length), x0 + pw0 - rh * 0.7, y, rh * 0.72, '#fff', 'center', 900); g.globalAlpha = 1;
      }
    };
    const draw = () => {
      if (c.W !== W || c.H !== H || !bgC) build();
      g.save(); if (shk > 0) g.translate((Math.random() - 0.5) * shk, (Math.random() - 0.5) * shk);
      g.drawImage(bgC, 0, 0, W, H);
      // tomoshabinlar to'lqini
      const NS = 10, sw = W / NS, amp = cheer > 0 ? 2 + Math.min(cheer, 1.5) * 3 : 1.2, spd = cheer > 0 ? 13 : 2.5;
      for (let i = 0; i < NS; i++) { const dy = Math.sin(tm * spd + i * 0.9) * amp - (cheer > 0 ? amp : 0); g.drawImage(crC, i * sw * DPR, 0, sw * DPR + 1, crH * DPR, i * sw, dy, sw + 0.5, crH); }
      if (cheer > 0 || Math.random() < 0.08) { const n = cheer > 0 ? 6 : 1; P(0, 10, 36); const yA = PY; P(0, 2, 24); const yB = PY; for (let i = 0; i < n; i++) { const fx = Math.random() * W, fy = yA + Math.random() * (yB - yA); const rg = g.createRadialGradient(fx, fy, 0, fx, fy, 7); rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(fx - 7, fy - 7, 14, 14); } }
      drawBoards(); drawNet();
      const b = ball; let ballDrawn = false;
      const dBall = () => { if (b.gone) return; P(b.x, 0, b.z); g.fillStyle = `rgba(0,0,0,${cl(0.4 - b.y * 0.06, 0.08, 0.4)})`; g.beginPath(); g.ellipse(PX, PY, BR * 1.4 * PS, BR * 0.45 * PS, 0, 0, 7); g.fill(); P(b.x, b.y, b.z); drawBall(PX, PY, Math.max(2, BR * 1.25 * PS), b.rot); ballDrawn = true; };
      if (trN > 1 && A && A.t < TC + A.fd + 0.35) { const fa = A.hit ? Math.max(0, 1 - (A.t - A.ht) / 0.3) : 1; for (let i = 0; i < trN; i++) { const j = (trI - trN + i + TN) % TN; P(trX[j], trY[j], trZ[j]); const u = (i + 1) / trN; g.fillStyle = `rgba(255,255,255,${0.32 * u * u * fa})`; g.beginPath(); g.arc(PX, PY, Math.max(1.5, BR * 1.1 * PS * u), 0, 7); g.fill(); } }
      if (b.z > KZ) dBall();
      const kp = keeperPose; drawKeeper(kp.cx, kp.cy, kp.th, kp.h[0], kp.h[1], kp.h[2], kp.h[3], kp.sp);
      drawPosts();
      // nishon
      if (ph !== 'idle' && !A) {
        const tx0 = aimX * GW, ty0 = aimY * GH; P(tx0, ty0, GZ); const mx = PX, my = PY, r = 0.32 * PS * (1 + Math.sin(tm * 6) * 0.08);
        g.setLineDash([3, 5]); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 14; i++) { const u = i / 14; P(tx0 * u, BR + (ty0 - BR) * u + 0.6 * Math.sin(Math.PI * u), SZ + (GZ - SZ) * u); i ? g.lineTo(PX, PY) : g.moveTo(PX, PY); } g.stroke(); g.setLineDash([]);
        g.strokeStyle = ph === 'pow' ? '#FDE047' : '#fff'; g.lineWidth = 2.5; g.beginPath(); g.arc(mx, my, r, 0, 7); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.arc(mx, my, r * 0.45, 0, 7); g.moveTo(mx - r * 1.4, my); g.lineTo(mx - r * 0.6, my); g.moveTo(mx + r * 0.6, my); g.lineTo(mx + r * 1.4, my); g.moveTo(mx, my - r * 1.4); g.lineTo(mx, my - r * 0.6); g.moveTo(mx, my + r * 0.6); g.lineTo(mx, my + r * 1.4); g.stroke();
      }
      if (!ballDrawn) dBall();
      // tepuvchi
      const ks = kick.s >= 0 && kick.s < NP ? kick.s : 0; P(kick.x, 0, kick.z); g.globalAlpha = kick.al; drawKicker(PX, PY, PS * 0.72, ctx.col[ks], NUM[ks], kick.run, kick.k, kick.react, kick.jump); g.globalAlpha = 1;
      // zarrachalar
      for (let j = 0; j < PN; j++) if (pL[j] > 0) { g.globalAlpha = Math.min(1, pL[j]); g.fillStyle = pC[j]; g.fillRect(pX[j], pY[j], 5, 3 + (j % 3)); } g.globalAlpha = 1;
      g.restore();
      if (flashA > 0) { g.fillStyle = `rgba(255,255,255,${flashA})`; g.fillRect(0, 0, W, H); }
      // natija yozuvi
      if (A && A.hit) { const age = A.t - A.ht, gl = A.o.goal; banner(tx(A.msg), YM, gl ? '#FEF08A' : '#fff', gl ? '#F59E0B' : '#FCA5A5', Math.min(W * 0.13, Math.max(US * 0.17, H * 0.2)) * (A.msg.length > 8 ? 0.7 : 1), age); }
      // navbat lentasi
      if (bannerT < 1.8) { const a = bannerT, sl = a < 0.25 ? 1 - ease(a / 0.25) : a > 1.5 ? -ease((a - 1.5) / 0.3) : 0, y = YM, hh = cl(US * 0.11, 34, 60); g.save(); g.translate(sl * W, 0); g.globalAlpha = a > 1.5 ? 1 - (a - 1.5) / 0.3 : 1; const gr = g.createLinearGradient(0, y - hh / 2, 0, y + hh / 2); gr.addColorStop(0, ctx.col[Math.max(0, ctx.me)]); gr.addColorStop(1, 'rgba(15,23,42,.95)'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, y - hh / 2); g.lineTo(W, y - hh / 2 - 6); g.lineTo(W, y + hh / 2 - 6); g.lineTo(0, y + hh / 2); g.fill(); text(g, '⚽ ' + tx('your'), W / 2, y - 3, hh * 0.45, '#fff', 'center', 900); g.restore(); }
      // kuch shkalasi
      if (ph === 'pow') { // kuch shkalasi: qizil zona — ustidan uchadi
        P(0, BR, SZ); const bw = cl(US * 0.05, 14, 22), bx = Math.min(W - bw - 14, CX + Math.max(60, US * 0.4)), by1 = PY - 4, by0 = Math.max(30, by1 - US * 0.45), hh2 = by1 - by0;
        g.fillStyle = 'rgba(2,6,23,.72)'; rr(g, bx - 6, by0 - 24, bw + 12, hh2 + 30, 10); g.fill(); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.stroke();
        const gr = g.createLinearGradient(0, by1, 0, by0); gr.addColorStop(0, '#16A34A'); gr.addColorStop(0.5, '#FACC15'); gr.addColorStop(0.8, '#F97316'); gr.addColorStop(0.84, '#DC2626'); gr.addColorStop(1, '#7F1D1D'); g.fillStyle = gr; rr(g, bx, by0, bw, hh2, bw / 2); g.fill();
        g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, bx, by0, bw, hh2 * (1 - pw), bw / 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 1; i < 4; i++) g.fillRect(bx + bw * 0.62, by1 - hh2 * i / 4, bw * 0.38, 1); g.fillStyle = '#FEE2E2'; g.fillRect(bx, by1 - hh2 * 0.84, bw, 1.5);
        const my = by1 - hh2 * pw, hot = pw > 0.84; g.save(); g.shadowColor = hot ? '#EF4444' : '#fff'; g.shadowBlur = 10; g.fillStyle = '#fff'; rr(g, bx - 5, my - 2.5, bw + 10, 5, 2.5); g.fill(); g.beginPath(); g.moveTo(bx - 7, my - 6); g.lineTo(bx - 1, my); g.lineTo(bx - 7, my + 6); g.fill(); g.restore();
        text(g, tx('pw'), bx + bw / 2, by0 - 12, 10, hot ? '#FCA5A5' : '#fff', 'center', 900);
      }
      drawHUD();
      // pastki maslahat
      let ht = ''; if (!A && !done) { if (cur === ctx.me && ann === cur) ht = ph === 'pow' ? tx('power') : matchMedia('(pointer: fine)').matches ? tx('aimk') : tx('aim'); else if (cur >= 0 && ann === cur) ht = tx('kicks').replace('{n}', ctx.names[cur] || '…'); }
      if (ht) { g.font = `700 13px ${FONT}`; const tw = g.measureText(ht).width + 24; g.fillStyle = 'rgba(2,6,23,.7)'; const hx = WIDE ? W - 10 - tw / 2 : W / 2; rr(g, hx - tw / 2, H - 34, tw, 26, 13); g.fill(); text(g, ht, hx, H - 21, 13, '#fff', 'center', 700); }
    };
    const stop0 = loop((dt) => { upd(dt); draw(); });
    // ---------- boshqaruv ----------
    const canShoot = () => !done && !A && !Q.length && cur === ctx.me && ann === cur && ctx.me >= 0;
    const setAim = (e) => { const [x, y] = pos(c, e); P(0, 0, GZ); const ps = PS, gx = (x - CX) / ps, gy = (PY - y) / ps; aimX = cl(gx / GW, -1.25, 1.25); aimY = cl(gy / GH, 0.04, 1.35); };
    const shoot = () => { if (!canShoot() || ph !== 'pow') return; ph = 'idle'; ctx.send({ x: Math.round(aimX * 1000) / 1000, y: Math.round(aimY * 1000) / 1000, p: Math.round(pw * 1000) / 1000 }); };
    c.addEventListener('pointerdown', (e) => { if (!canShoot()) return; e.preventDefault(); if (ph === 'pow') return shoot(); ph = 'aim'; drag = true; setAim(e); try { c.setPointerCapture(e.pointerId); } catch {} snd(700, 0.03, 0.03); });
    c.addEventListener('pointermove', (e) => { if (drag && ph === 'aim') setAim(e); else if (!drag && ph === 'aim' && e.pointerType === 'mouse' && canShoot()) setAim(e); });
    c.addEventListener('pointerup', () => { if (!drag) return; drag = false; if (ph === 'aim' && canShoot()) { ph = 'pow'; pwT = 0; } });
    const onKey = (e) => {
      if (!canShoot() || e.target?.closest?.('input,textarea')) return; const k = e.key;
      if (ph === 'aim' && KEYS[k] && k.length > 1) { e.preventDefault(); if (k === 'ArrowLeft') aimX = cl(aimX - 0.07, -1.25, 1.25); if (k === 'ArrowRight') aimX = cl(aimX + 0.07, -1.25, 1.25); if (k === 'ArrowUp') aimY = cl(aimY + 0.07, 0.04, 1.35); if (k === 'ArrowDown') aimY = cl(aimY - 0.07, 0.04, 1.35); }
      else if (k === ' ' || k === 'Enter') { e.preventDefault(); if (ph === 'aim') { ph = 'pow'; pwT = 0; } else if (ph === 'pow') shoot(); }
    };
    window.addEventListener('keydown', onKey);
    const api = {
      apply(s, m, replay) {
        if (done || s !== cur || !m || typeof m !== 'object') return false;
        const x = +m.x, y = +m.y, p = +m.p; if (![x, y, p].every(Number.isFinite)) return false;
        const o = outcome(x, y, p, kickN++); res[s].push(o.goal); log.push({ s, g: o.goal }); advance();
        if (replay) { visN = log.length; if (done) { ann = -1; ctx.over(winner); } else setTurn(); bannerT = 9; return true; }
        Q.push({ s, o }); ph = 'idle'; ann = -2; ctx.turn(-1, '⚽ ' + (ctx.names[s] || '')); return true;
      },
      bot(s) {
        const sk = 0.45 + 0.5 * mb(ctx.seed + s * 7919)(); const side = Math.random() < 0.5 ? -1 : 1; let x = side * (0.25 + Math.random() * 0.72); const y = 0.08 + Math.random() * 0.85; if (Math.random() < 0.15) x *= 0.3;
        const p = cl(0.66 + (Math.random() - 0.5) * (1.15 - sk) * 0.95, 0.2, 1); return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, p: Math.round(p * 1000) / 1000 };
      },
      quit(s, replay) {
        if (done) return; rq = rq.filter((q) => q !== s); if (sdSet) sdSet = sdSet.filter((q) => q !== s); if (ctx.active().length < 2) return;
        if (cur === s) advance(); else early();
        if (replay || (!A && !Q.length)) { if (done) { ann = -1; ctx.over(winner); } else setTurn(); }
      },
      stop() { stopped = true; stop0(); window.removeEventListener('keydown', onKey); },
      resize() { cv.fit(); bgC = null; },
    };
    setTurn();
    return api;
  };

  /* ================= Shahar poygasi (jonli, 2–4 kishi): psevdo-3D shahar ko'chasi, tirbandlik orasida 90 s — eng uzoqqa borgan yutadi ================= */
  MPL.push({ id: 'traffic', e: '🚗', c: ['#0EA5E9', '#F97316'], rt: 1, bot: 1, big: 1, n: { uz: 'Shahar poygasi', ru: 'Городские гонки', en: 'City Racer' } });
  const TRF_T = {
    uz: { pos: 'O‘RIN', km: 'km', kmh: 'km/soat', boost: 'NITRO', near: 'YAQIN O‘TISH!', crash: 'TO‘QNASHUV!', go: 'KETDIK!', fin: 'MARRA!', res: 'NATIJALAR', wait: 'O‘yinchilar kutilmoqda…', rule: '⏱ 90 soniya — kim uzoqroq borsa, o‘sha yutadi', keys: '← → rul · ↑ gaz · ↓ tormoz · Probel — nitro', time: 'VAQT', you: 'Siz' },
    ru: { pos: 'МЕСТО', km: 'км', kmh: 'км/ч', boost: 'НИТРО', near: 'НА ВОЛОСКЕ!', crash: 'АВАРИЯ!', go: 'ВПЕРЁД!', fin: 'ФИНИШ!', res: 'РЕЗУЛЬТАТЫ', wait: 'Ждём игроков…', rule: '⏱ 90 секунд — побеждает тот, кто проедет дальше', keys: '← → руль · ↑ газ · ↓ тормоз · Пробел — нитро', time: 'ВРЕМЯ', you: 'Вы' },
    en: { pos: 'POS', km: 'km', kmh: 'km/h', boost: 'BOOST', near: 'NEAR MISS!', crash: 'CRASH!', go: 'GO!', fin: 'FINISH!', res: 'RESULTS', wait: 'Waiting for players…', rule: '⏱ 90 seconds — the farthest distance wins', keys: '← → steer · ↑ gas · ↓ brake · Space — boost', time: 'TIME', you: 'You' },
  };
  MPI.traffic = (stage, ctx) => {
    const tx = (k) => (TRF_T[L()] || TRF_T.en)[k] || TRF_T.en[k];
    const { c, g, fit } = canvasIn(stage, null); c.style.touchAction = 'none';
    const N = ctx.n || 2, SPEC = ctx.me < 0, ME = Math.max(0, ctx.me), COL = ctx.col;
    const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
    // deterministik tasodif (hamma mijozda bir xil yo'l va tirbandlik)
    const mb = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const R = mb(ctx.seed || 7);
    const SEG = 5, NS = 2200, RW = 7, SW = 4, BX = RW + SW, LX = [-5.25, -1.75, 1.75, 5.25], DRAW = 170, RACE = 90, CW = 1.95, CL = 4.4, ZP = 5.5, NEAR = 0.5, VMAX = 58, VBO = 78;
    // ---- yo'l: burilishlar, tepaliklar, chorrahalar, binolar ----
    const CU = new Float32Array(NS), YY = new Float32Array(NS + 1), INT = new Uint8Array(NS + 2), BL = new Int16Array(NS).fill(-1), BRr = new Int16Array(NS).fill(-1);
    for (let i = 0, y = 0; i < NS;) { const len = 25 + (R() * 70 | 0), cv = i < 50 || R() < 0.35 ? 0 : (R() < 0.5 ? -1 : 1) * (0.003 + R() * 0.011), dh = i < 50 ? 0 : (R() - 0.5) * 13;
      for (let k = 0; k < len && i < NS; k++, i++) { const u = k / len; CU[i] = cv * Math.min(1, u * 4, (1 - u) * 4); YY[i + 1] = y + dh * (0.5 - 0.5 * Math.cos(Math.PI * (k + 1) / len)); } y += dh; }
    for (let s = 0, nx = 55 + (R() * 30 | 0); s < NS; s++) if (s === nx) { for (let k = 0; k < 4; k++) INT[s + k] = k === 0 || k === 3 ? 2 : 1; nx = s + 65 + (R() * 50 | 0); }
    const BLK = [];
    for (const arr of [BL, BRr]) for (let s = 0; s < NS;) { if (INT[s]) { s++; continue; } const len = 3 + (R() * 5 | 0); let e = s; while (e < s + len && e < NS && !INT[e]) e++; const id = BLK.length; BLK.push({ s, e, p: R() * 8 | 0, h: 4.5 + (2 + (R() * 8 | 0)) * 3.2, sg: R() * 8 | 0, aw: R() * 5 | 0, st: R() * 3 | 0, sh: R() < 0.75, w: R() * 8 | 0 }); for (let k = s; k < e; k++) arr[k] = id; s = e; }
    // ---- tirbandlik: har bo'lakda bir xil tezlik (to'qnashmaydi), vaqt bo'yicha aniq hisoblanadi ----
    const TD = [[1.84, 1.45, 4.6], [2.0, 1.8, 4.8], [1.84, 1.5, 4.6], [2.05, 2.3, 5.4], [2.55, 3.15, 11.5], [2.5, 3.5, 9], [1.96, 1.22, 4.4]]; // sedan, suv, taksi, furgon, avtobus, yuk mashinasi, sport
    const CCOL = ['#F3F4F6', '#9CA3AF', '#1F2937', '#B91C1C', '#1D4ED8', '#065F46', '#D6C7A1', '#7F1D1D', '#0F766E'], BUSC = ['#F97316', '#16A34A', '#2563EB'], TRKC = ['#F8FAFC', '#DC2626', '#1E40AF', '#FACC15'];
    const bodyCol = (ty, k) => (ty === 2 ? '#FACC15' : ty === 4 ? BUSC[k % 3] : ty === 5 ? TRKC[k % 4] : CCOL[k]);
    const VL = [23, 19, 15.5, 12], TR = LX.map(() => []);
    for (let l = 0; l < 4; l++) for (let z = 90 + R() * 50; z < 9500;) { const r = R(); const ty = l === 3 ? (r < 0.22 ? 4 : r < 0.42 ? 5 : r < 0.56 ? 3 : r < 0.8 ? 0 : 1) : l === 2 ? (r < 0.1 ? 5 : r < 0.2 ? 3 : r < 0.4 ? 2 : r < 0.65 ? 1 : 0) : (r < 0.15 ? 2 : r < 0.45 ? 1 : r < 0.53 ? 3 : 0);
      TR[l].push({ z, ty, k: R() * 9 | 0, sp: null }); z += TD[ty][2] + 19 + R() * 82 * (1 - Math.min(0.5, z / 14000)); }
    const lb = (A, v) => { let lo = 0, hi = A.length; while (lo < hi) { const m = (lo + hi) >> 1; if (A[m].z < v) lo = m + 1; else hi = m; } return lo; };
    // ---- poygachilar ----
    const SL = N === 2 ? [1, 2] : [1, 2, 0, 3];
    const RS = Array.from({ length: N }, (_, s) => ({ z: 15, x: LX[SL[s]], v: 0, b: 0.3, bo: 0, ct: 0, h: 0, nm: 0, sm: 0, br: 0, out: ctx.out?.has(s) ? 1 : 0, fin: 0 }));
    const IN = Array.from({ length: N }, () => ({ s: 0, g: 0, b: 0, n: 0 })), BOT = Array.from({ length: N }, (_, s) => ({ tl: SL[s], th: 0, sk: 0.62 + Math.random() * 0.33 }));
    const nearL = (x) => { let b = 0; for (let l = 1; l < 4; l++) if (Math.abs(LX[l] - x) < Math.abs(LX[b] - x)) b = l; return b; };
    const gapAhead = (l, z, t) => { const A = TR[l], vl = VL[l]; for (let k = lb(A, z - 13 - vl * t); k < A.length; k++) { const q = A[k], cz = q.z + vl * t; if (cz + TD[q.ty][2] > z - 1.5) { GV = vl; return cz - (z + CL); } } GV = 0; return 999; };
    let GV = 0;
    function botIn(s, r, dt, t) { // bot: eng bo'sh bo'lakni tanlaydi, yaqinlashsa tormoz, yo'l ochiq bo'lsa nitro
      const B = BOT[s], o = IN[s], cur = nearL(r.x); B.th -= dt;
      if (B.th <= 0) { B.th = 0.16 + (1 - B.sk) * 0.45 + Math.random() * 0.15; let best = -1e9, bl = B.tl;
        for (let l = 0; l < 4; l++) { const gp = gapAhead(l, r.z, t), vl = GV; let sc = Math.min(gp, 230) + vl * 0.6 - Math.abs(LX[l] - r.x) * 6 + (l === B.tl ? 10 : 0);
          for (let m = Math.min(l, cur); m <= Math.max(l, cur); m++) if (m !== cur) { const g2 = gapAhead(m, r.z, t); if (g2 < 5 + (r.v - GV) * 0.3) sc -= 400; }
          if (sc > best) { best = sc; bl = l; } }
        if (Math.random() < 0.04 * (1 - B.sk)) bl = cl(cur + (Math.random() < 0.5 ? -1 : 1), 0, 3);
        B.tl = bl; }
      o.s = cl((LX[B.tl] - r.x) * 0.9, -1, 1);
      let gm = 999, va = 0; for (let l = 0; l < 4; l++) if (Math.abs(LX[l] - r.x) < 2.35) { const gp = gapAhead(l, r.z, t); if (gp < gm) { gm = gp; va = GV; } }
      const cls = r.v - va; o.g = 1; o.b = 0;
      if (gm < 999 && cls > 0 && gm < cls * cls / (26 + B.sk * 10) + 7) { o.g = 0; if (gm < cls * cls / 20 + 4) o.b = 1; }
      o.n = r.b > 0.45 && gm > 150 ? 1 : o.n && r.b > 0.04 && gm > 70 ? 1 : 0;
    }
    function simR(r, s, inp, dt, t0, t1) {
      if (r.out || ctx.out?.has(s)) { r.out = 1; r.v = Math.max(0, r.v - 20 * dt); r.z += r.v * dt; return; }
      r.sm += (inp.s - r.sm) * Math.min(1, dt * 9);
      r.bo = inp.n && r.b > 0.02 && r.ct <= 0 ? 1 : 0; if (r.bo) r.b = Math.max(0, r.b - dt * 0.3);
      const vm = r.bo ? VBO : VMAX;
      if (r.bo) r.v += 17 * dt; else if (inp.g && r.v < vm) r.v += 11.5 * (1 - 0.55 * r.v / vm) * dt;
      if (inp.b) r.v -= 28 * dt; else if (!inp.g && !r.bo) r.v -= 4 * dt;
      if (r.v > vm) r.v -= (r.v - vm) * 1.2 * dt; r.v = Math.max(0, r.v); r.br = inp.b ? 1 : 0; r.b = Math.min(1, r.b + dt * 0.012);
      const si = Math.min(NS - 1, r.z / SEG | 0);
      r.x += r.sm * Math.min(1, r.v / 8) * 9.5 * dt - CU[si] * r.v * 3 * dt;
      const lim = RW - CW / 2 - 0.15; if (Math.abs(r.x) > lim) { r.x = Math.sign(r.x) * lim; r.v -= r.v * 0.7 * dt; }
      const zp = r.z; r.z += r.v * dt; r.ct = Math.max(0, r.ct - dt);
      for (let l = 0; l < 4; l++) { const dxl = Math.abs(r.x - LX[l]); if (dxl > 3.6) continue; const A = TR[l], vl = VL[l];
        for (let k = lb(A, r.z - 13 - vl * t1); k < A.length; k++) { const q = A[k], d = TD[q.ty], cz = q.z + vl * t1; if (cz > r.z + CL + 1) break; const ov = (CW + d[0]) / 2;
          if (r.ct <= 0 && dxl < ov - 0.15 && r.z < cz + d[2] && r.z + CL > cz) { // to'qnashuv: keskin sekinlashish
            r.h++; r.ct = 1.3; if (r.z + CL - cz < 2.6) { r.z = cz - CL - 0.3; r.v = Math.min(r.v * 0.3, vl * 0.65); } else { r.v *= 0.5; r.x = cl(LX[l] + (r.x >= LX[l] ? 1 : -1) * (ov + 0.05), -lim, lim); } break; }
          const czp = q.z + vl * t0; if (r.ct <= 0 && zp < czp + d[2] && r.z >= cz + d[2] && dxl >= ov - 0.15 && dxl < ov + 1.1) { r.nm++; r.b = Math.min(1, r.b + 0.2); } // yaqin o'tish → nitro
        } }
    }
    // ---- tarmoq: uy egasi (0) hammani hisoblaydi ----
    let ph = 0, cd = 3.5, T = 0, endT = 0, sendT = 0, aliveT = 0, win = -1; const got = new Set();
    const H = hostGame(ctx, { onInput: (d, s) => { if (s > 0 && s < N) { got.add(s); const o = IN[s]; o.s = cl(+d.s || 0, -1, 1); o.g = d.g ? 1 : 0; o.b = d.b ? 1 : 0; o.n = d.n ? 1 : 0; } } });
    // ko'rinish holati (uy egasida — RS dan, mehmonda — snapshotlar orasida silliqlash)
    const VZ = new Float32Array(N), VX = new Float32Array(N), VV = new Float32Array(N), VB = new Float32Array(N), VBO_ = new Uint8Array(N), VCT = new Uint8Array(N), VH = new Int32Array(N), VNM = new Int32Array(N), VSM = new Float32Array(N), VBR = new Uint8Array(N), VOUT = new Uint8Array(N), VF = new Float32Array(N);
    let VT = 0, VPH = 0, VCD = 3, seenH = -1, seenNM = -1;
    ctx.turn(-1, tx('rule'));
    // ---- ranglar va tuman ----
    const FOG = [214, 226, 236], FL = 16;
    const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const shade = (h, p) => { const [r, gg, b] = hx(h); const f = (v) => cl(Math.round(v + p), 0, 255); return `rgb(${f(r)},${f(gg)},${f(b)})`; };
    const FA = (h) => { const [r, gg, b] = hx(h); return Array.from({ length: FL }, (_, q) => { const a = Math.pow(q / (FL - 1), 1.1) * 0.86; return `rgb(${r * (1 - a) + FOG[0] * a | 0},${gg * (1 - a) + FOG[1] * a | 0},${b * (1 - a) + FOG[2] * a | 0})`; }); };
    const FQ = new Uint8Array(DRAW + 1); for (let n = 0; n <= DRAW; n++) FQ[n] = Math.min(FL - 1, Math.pow(n / DRAW, 1.25) * FL | 0);
    const C = { sw1: FA('#B8B2A7'), sw2: FA('#ACA69B'), as1: FA('#3A3D45'), as2: FA('#363940'), cross: FA('#414450'), curb1: FA('#E5E7EB'), curb2: FA('#9CA3AF'), line: FA('#F1F5F9'), yel: FA('#FACC15') };
    const PALS = ['#D8C3A5', '#C27B5C', '#8EA3B5', '#E9DCC3', '#A95A45', '#6D97A8', '#E4E6E8', '#CBB08A'];
    const shx = (h, p) => '#' + hx(h).map((v) => cl(Math.round(v + p), 0, 255).toString(16).padStart(2, '0')).join('');
    const PC = PALS.map((p, i) => ({ f: FA(p), d: FA(shx(p, -38)), c: FA(i % 2 ? '#F5F0E6' : '#5B5F66'), w1: FA(i === 5 ? '#3F6C8E' : '#2B3D55'), w2: FA(i === 5 ? '#9CC2DF' : '#7397BC') }));
    const AW = ['#DC2626', '#16A34A', '#2563EB', '#F59E0B', '#9333EA'].map(FA), SG = ['#EF4444', '#0EA5E9', '#22C55E', '#F97316', '#A855F7', '#FACC15', '#EC4899', '#14B8A6'].map(FA), SHOPG = FA('#1E2A3A'), SHOPL = FA('#E3B867');
    const SIGNW = ['KAFE', 'MARKET', 'NON', 'DORIXONA', 'OSHXONA', 'KITOBLAR', 'GULLAR', 'MEHMONXONA'];
    // ---- spritelar (oldindan chizilgan, kesh) ----
    const mk = (w, h) => { const v = document.createElement('canvas'); v.width = Math.max(2, Math.ceil(w)); v.height = Math.max(2, Math.ceil(h)); return v; };
    const SPR = new Map();
    const PROF = [[[0, 1, 0.1, 0.62, 0], [0.24, 0.76, 0.6, 0.96, 1], [0.3, 0.7, 0.94, 1, 0]], [[0, 1, 0.1, 0.6, 0], [0.08, 0.78, 0.58, 0.96, 1], [0.08, 0.78, 0.94, 1, 0]], null, [[0, 1, 0.08, 1, 0], [0.72, 0.97, 0.55, 0.88, 1]], [[0, 1, 0.08, 1, 0], [0.03, 0.97, 0.48, 0.84, 1], [0, 1, 0.2, 0.27, 3]], [[0, 0.74, 0.2, 1, 2], [0.77, 1, 0.12, 0.8, 0], [0.8, 0.98, 0.5, 0.75, 1], [0, 1, 0.1, 0.22, 3]], [[0, 1, 0.1, 0.6, 0], [0.3, 0.75, 0.56, 0.97, 1], [0.38, 0.7, 0.94, 1, 0]]];
    PROF[2] = PROF[0];
    const CAB = [[0.2, 0.36, 0.64, 0.82, 0.84, 0.66, 0.95], [0.03, 0.08, 0.74, 0.86, 0.92, 0.84, 1.05], [0.2, 0.36, 0.64, 0.82, 0.84, 0.66, 0.95], 0, 0, 0, [0.24, 0.44, 0.62, 0.8, 0.7, 0.46, 0.72]]; // kabina: orqa oyna boshi/oxiri, old oyna boshi/oxiri, eni (past/yuqori), yelka balandligi
    const WHL = [[0.18, 0.8], [0.18, 0.8], [0.18, 0.8], [0.17, 0.82], [0.12, 0.72], [0.1, 0.22, 0.86], [0.17, 0.8]];
    function rrp(x, X, Y, w, h, r) { rr(x, X, Y, w, h, Math.min(r, w / 2, h / 2)); }
    function paintRear(x, ty, col, w, h) {
      const lg = (y0, y1, a, b) => { const q = x.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, a); q.addColorStop(1, b); return q; };
      const glass = (y0, y1) => lg(y0, y1, '#6B819E', '#0F172A');
      const light = (X, Y, ww, hh, r = 0.05) => { x.fillStyle = lg(Y, Y + hh, '#FF6B6B', '#9F1239'); rrp(x, X, Y, ww, hh, r); x.fill(); x.fillStyle = 'rgba(255,220,220,.55)'; rrp(x, X + ww * 0.15, Y + hh * 0.18, ww * 0.7, hh * 0.22, r / 2); x.fill(); };
      const glow = (X, Y, r) => { x.save(); x.globalCompositeOperation = 'lighter'; const q = x.createRadialGradient(X, Y, 0, X, Y, r); q.addColorStop(0, 'rgba(255,60,60,.38)'); q.addColorStop(1, 'rgba(255,0,0,0)'); x.fillStyle = q; x.fillRect(X - r, Y - r, r * 2, r * 2); x.restore(); };
      const plate = (Y) => { x.fillStyle = '#E5E7EB'; rrp(x, -0.26, Y, 0.52, 0.13, 0.02); x.fill(); x.fillStyle = '#334155'; for (let i = 0; i < 5; i++) x.fillRect(-0.21 + i * 0.085, Y + 0.035, 0.055, 0.06); };
      x.fillStyle = 'rgba(0,0,0,.38)'; x.beginPath(); x.ellipse(0, -0.02, w * 0.6, 0.16, 0, 0, 7); x.fill();
      const tw = ty >= 4 && ty <= 5 ? 0.42 : 0.3; x.fillStyle = '#0B0B0D'; rrp(x, -w / 2 + 0.03, -0.52, tw, 0.52, 0.07); x.fill(); rrp(x, w / 2 - 0.03 - tw, -0.52, tw, 0.52, 0.07); x.fill();
      if (ty <= 2 || ty === 6) { // yengil mashinalar
        const sp = ty === 6, sh = CAB[ty][6];
        x.fillStyle = lg(-sh, -0.2, shade(col, 35), shade(col, -55)); x.beginPath();
        if (sp) { x.moveTo(-w / 2, -0.2); x.lineTo(-w / 2, -0.42); x.quadraticCurveTo(-w / 2, -sh, -w / 2 + 0.3, -sh); x.lineTo(w / 2 - 0.3, -sh); x.quadraticCurveTo(w / 2, -sh, w / 2, -0.42); x.lineTo(w / 2, -0.2); x.closePath(); }
        else rrp(x, -w / 2, -sh, w, sh - 0.2, 0.14);
        x.fill(); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-w / 2 + 0.2, -sh, w - 0.4, 0.03);
        if (sp) { // sport: poyga chiziqlari, qanot, LED chiroq chizig'i, 4 ta quvur
          x.fillStyle = 'rgba(255,255,255,.88)'; x.fillRect(-0.2, -sh, 0.12, sh - 0.25); x.fillRect(0.08, -sh, 0.12, sh - 0.25);
          x.fillStyle = '#111827'; x.fillRect(-0.5, -sh - 0.16, 0.06, 0.18); x.fillRect(0.44, -sh - 0.16, 0.06, 0.18); x.fillStyle = lg(-sh - 0.24, -sh - 0.14, '#374151', '#0B0F19'); rrp(x, -w / 2 + 0.04, -sh - 0.25, w - 0.08, 0.1, 0.04); x.fill();
          x.fillStyle = '#1F0A0A'; x.fillRect(-w / 2 + 0.1, -sh + 0.08, w - 0.2, 0.1); light(-w / 2 + 0.1, -sh + 0.09, w - 0.2, 0.07, 0.03); light(-w / 2 + 0.08, -sh + 0.06, 0.36, 0.14); light(w / 2 - 0.44, -sh + 0.06, 0.36, 0.14);
          glow(-w / 2 + 0.26, -sh + 0.13, 0.4); glow(w / 2 - 0.26, -sh + 0.13, 0.4);
          x.fillStyle = '#0B0F19'; rrp(x, -w / 2 + 0.12, -0.36, w - 0.24, 0.18, 0.05); x.fill(); x.fillStyle = '#1F2937'; for (let i = -3; i <= 3; i++) x.fillRect(i * 0.11 - 0.012, -0.36, 0.024, 0.16);
          [-0.38, -0.24, 0.24, 0.38].forEach((ex) => { x.fillStyle = '#9CA3AF'; x.beginPath(); x.ellipse(ex, -0.27, 0.055, 0.045, 0, 0, 7); x.fill(); x.fillStyle = '#0B0B0B'; x.beginPath(); x.ellipse(ex, -0.27, 0.035, 0.028, 0, 0, 7); x.fill(); });
          plate(-0.56);
        } else {
          if (ty === 1) { light(-w / 2 + 0.06, -sh + 0.05, 0.18, 0.42); light(w / 2 - 0.24, -sh + 0.05, 0.18, 0.42); }
          else { light(-w / 2 + 0.06, -sh + 0.07, 0.36, 0.19); light(w / 2 - 0.42, -sh + 0.07, 0.36, 0.19); }
          glow(-w / 2 + 0.25, -sh + 0.17, 0.35); glow(w / 2 - 0.25, -sh + 0.17, 0.35);
          if (ty === 2) { x.fillStyle = '#111'; for (let i = 0; i < 12; i++) x.fillRect(-w / 2 + 0.2 + i * (w - 0.4) / 12, -sh + 0.32 + (i % 2) * 0.05, (w - 0.4) / 12, 0.05);
}
          plate(-0.62);
          x.fillStyle = lg(-0.48, -0.22, shade(col, -30), shade(col, -70)); rrp(x, -w / 2 + 0.02, -0.48, w - 0.04, 0.26, 0.08); x.fill(); x.fillStyle = '#111827'; rrp(x, -w / 2 + 0.2, -0.3, w - 0.4, 0.08, 0.03); x.fill();
          x.fillStyle = '#B91C1C'; x.fillRect(-w / 2 + 0.08, -0.42, 0.14, 0.05); x.fillRect(w / 2 - 0.22, -0.42, 0.14, 0.05);
          x.fillStyle = '#4B5563'; x.beginPath(); x.ellipse(w * 0.28, -0.24, 0.07, 0.045, 0, 0, 7); x.fill();
        }
      } else if (ty === 3) { // furgon
        x.fillStyle = lg(-h, -0.2, shade(col, 22), shade(col, -45)); rrp(x, -w / 2, -h, w, h - 0.2, 0.22); x.fill();
        x.fillStyle = glass(-h + 0.2, -h + 0.85); rrp(x, -w / 2 + 0.14, -h + 0.2, w / 2 - 0.19, 0.62, 0.06); x.fill(); rrp(x, 0.05, -h + 0.2, w / 2 - 0.19, 0.62, 0.06); x.fill();
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-0.015, -h + 0.1, 0.03, h - 0.55); x.fillStyle = '#374151'; x.fillRect(0.06, -1.1, 0.16, 0.05);
        light(-w / 2 + 0.03, -1.35, 0.14, 0.7); light(w / 2 - 0.17, -1.35, 0.14, 0.7); glow(-w / 2 + 0.1, -1.0, 0.4); glow(w / 2 - 0.1, -1.0, 0.4);
        x.fillStyle = '#1F2937'; rrp(x, -w / 2 + 0.02, -0.46, w - 0.04, 0.24, 0.06); x.fill(); plate(-0.62);
      } else if (ty === 4) { // avtobus
        x.fillStyle = lg(-h, -0.25, shade(col, 25), shade(col, -40)); rrp(x, -w / 2, -h, w, h - 0.25, 0.2); x.fill();
        x.fillStyle = '#0B0F19'; rrp(x, -w / 2 + 0.25, -h + 0.12, w - 0.5, 0.3, 0.05); x.fill(); x.save(); x.scale(0.01, 0.01); x.font = '900 22px ui-monospace,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#FBBF24'; x.fillText(String(10 + (col.charCodeAt(2) % 80)), 0, (-h + 0.27) * 100); x.restore();
        x.fillStyle = glass(-h + 0.55, -h + 1.45); rrp(x, -w / 2 + 0.18, -h + 0.55, w - 0.36, 0.9, 0.08); x.fill(); x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(-w / 2 + 0.3, -h + 0.6, 0.35, 0.8);
        x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(-w / 2, -1.62, w, 0.2); x.fillStyle = shade(col, -55); for (let i = 0; i < 6; i++) x.fillRect(-0.75, -1.25 + i * 0.1, 1.5, 0.045);
        light(-w / 2 + 0.05, -1.35, 0.2, 0.62); light(w / 2 - 0.25, -1.35, 0.2, 0.62); glow(-w / 2 + 0.15, -1.05, 0.5); glow(w / 2 - 0.15, -1.05, 0.5);
        x.fillStyle = '#111827'; rrp(x, -w / 2 + 0.02, -0.55, w - 0.04, 0.3, 0.06); x.fill(); plate(-0.7);
      } else { // yuk mashinasi
        x.fillStyle = '#1F2937'; x.fillRect(-w / 2 + 0.2, -0.85, w - 0.4, 0.5); x.fillStyle = '#111'; x.fillRect(-w / 2 + 0.02, -0.55, 0.42, 0.42); x.fillRect(w / 2 - 0.44, -0.55, 0.42, 0.42);
        x.fillStyle = lg(-h, -0.8, shade(col, 12), shade(col, -32)); rrp(x, -w / 2, -h, w, h - 0.8, 0.06); x.fill(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 0.05; rrp(x, -w / 2 + 0.06, -h + 0.06, w - 0.12, h - 0.92, 0.04); x.stroke();
        x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(-0.015, -h + 0.08, 0.03, h - 0.95); x.fillStyle = '#9CA3AF'; [-0.85, -0.35, 0.35, 0.85].forEach((bx) => { x.fillRect(bx - 0.025, -h + 0.15, 0.05, h - 1.1); x.fillRect(bx - 0.06, -1.7, 0.12, 0.07); });
        x.fillStyle = '#F59E0B'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(-w / 2 + 0.25 + i * (w - 0.5) / 3, -h + 0.1, 0.04, 0, 7); x.fill(); }
        x.fillStyle = '#CBD5E1'; x.fillRect(-w / 2 + 0.1, -0.72, w - 0.2, 0.13); light(-w / 2 + 0.12, -0.74, 0.32, 0.16); light(w / 2 - 0.44, -0.74, 0.32, 0.16); glow(-w / 2 + 0.28, -0.66, 0.4); glow(w / 2 - 0.28, -0.66, 0.4); plate(-0.55);
      }
    }
    function carSprite(ty, col, ppm) {
      const key = ty * 1000 + ppm + col; let v = SPR.get(key); if (v) return v; const [w, h] = TD[ty];
      v = mk((w + 0.8) * ppm, (h + 0.85) * ppm); const x = v.getContext('2d'); v.ax = v.width / 2; v.gy = (h + 0.5) * ppm; v.ppm = ppm; x.translate(v.ax, v.gy); x.scale(ppm, ppm); paintRear(x, ty, col, w, h);
      v.c0 = shade(col, -35); v.c1 = shade(col, 18); v.c2 = shade(col, -30); v.c3 = shade(col, 8); if (ty === 5) { v.c0 = '#C9CED6'; v.c1 = '#E5E7EB'; } SPR.set(key, v); return v;
    }
    const objS = {}; // chiroq ustuni, daraxt, svetofor (o'ng tomon; chap — ko'zgu)
    function objSprite(kind, st, left) {
      const key = kind + st + (left ? 'L' : 'R'); if (objS[key]) return objS[key];
      const ppm = 46, [ww, hh, ax] = kind === 0 ? [3.2, 8, 2.8] : kind === 1 ? [4.6, 6.8, 2.3] : [5.6, 6.4, 5.2];
      const v = mk(ww * ppm, hh * ppm), x = v.getContext('2d'); v.ppm = ppm; v.gy = (hh - 0.15) * ppm; v.ax = left ? v.width - ax * ppm : ax * ppm;
      x.translate(left ? v.width : 0, 0); if (left) x.scale(-1, 1); x.translate(ax * ppm, v.gy); x.scale(ppm, ppm);
      if (kind === 0) { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(0, 0, 0.4, 0.1, 0, 0, 7); x.fill(); const q = x.createLinearGradient(-0.1, 0, 0.1, 0); q.addColorStop(0, '#6B7280'); q.addColorStop(0.5, '#D1D5DB'); q.addColorStop(1, '#4B5563'); x.fillStyle = q; x.fillRect(-0.09, -7.4, 0.18, 7.4); x.fillRect(-0.16, -1.2, 0.32, 1.2);
        x.strokeStyle = '#6B7280'; x.lineWidth = 0.12; x.beginPath(); x.moveTo(0, -7.3); x.quadraticCurveTo(0, -7.7, -0.6, -7.7); x.lineTo(-2.1, -7.6); x.stroke(); x.fillStyle = '#374151'; x.beginPath(); x.ellipse(-2.2, -7.55, 0.5, 0.14, 0, 0, 7); x.fill(); x.fillStyle = '#FEF9C3'; x.beginPath(); x.ellipse(-2.2, -7.45, 0.36, 0.07, 0, 0, 7); x.fill(); }
      else if (kind === 1) { x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(0.3, 0, 1.6, 0.25, 0, 0, 7); x.fill(); x.fillStyle = '#78716C'; x.fillRect(-0.9, -0.5, 1.8, 0.5); x.fillStyle = '#A8A29E'; x.fillRect(-0.9, -0.55, 1.8, 0.1); x.fillStyle = '#5B3A22'; x.fillRect(-0.12, -2.8, 0.24, 2.3);
        [[0, -4.1, 1.75, '#166534'], [-0.8, -3.5, 1.1, '#15803D'], [0.85, -3.6, 1.15, '#14532D'], [0.2, -4.9, 1.2, '#16A34A'], [-0.5, -4.6, 0.9, '#22C55E']].forEach(([cx, cy, r, cc]) => { const q = x.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r); q.addColorStop(0, shade(cc, 45)); q.addColorStop(1, cc); x.fillStyle = q; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }); }
      else { x.fillStyle = '#374151'; x.fillRect(-0.1, -6.0, 0.2, 6.0); x.fillRect(-4.6, -5.85, 4.6, 0.14); x.fillRect(-0.18, -0.8, 0.36, 0.8);
        [-1.9, -4.2].forEach((hxp) => { x.fillStyle = '#111827'; rrp(x, hxp - 0.22, -5.75, 0.44, 1.15, 0.08); x.fill(); x.fillStyle = '#FACC15'; x.fillRect(hxp - 0.26, -5.75, 0.04, 1.15);
          ['#EF4444', '#F59E0B', '#22C55E'].forEach((lc, i) => { const on = i === st; x.fillStyle = on ? lc : '#1F2937'; x.beginPath(); x.arc(hxp, -5.52 + i * 0.35, 0.13, 0, 7); x.fill(); if (on) { x.save(); x.globalCompositeOperation = 'lighter'; const q = x.createRadialGradient(hxp, -5.52 + i * 0.35, 0, hxp, -5.52 + i * 0.35, 0.5); q.addColorStop(0, lc + 'AA'); q.addColorStop(1, lc + '00'); x.fillStyle = q; x.fillRect(hxp - 0.5, -6.0 + i * 0.35, 1, 1); x.restore(); } }); });
        x.fillStyle = '#111827'; rrp(x, 0.1, -3.2, 0.34, 0.7, 0.05); x.fill(); x.fillStyle = st === 2 ? '#F8FAFC' : '#F97316'; x.beginPath(); x.arc(0.27, st === 2 ? -2.7 : -3.0, 0.09, 0, 7); x.fill(); }
      return (objS[key] = v);
    }
    // ---- osmon va shahar silueti (o'lcham o'zgarganda qayta chiziladi) ----
    let skyC = null, cityC = null, cW = 0, cH = 0, skyX = 0;
    function buildBg(W, H, HY) {
      cW = W; cH = H; skyC = mk(W, HY + 4); let x = skyC.getContext('2d'); const q = x.createLinearGradient(0, 0, 0, HY); q.addColorStop(0, '#2F6FB5'); q.addColorStop(0.55, '#7FB6E6'); q.addColorStop(1, '#DCE6EE'); x.fillStyle = q; x.fillRect(0, 0, W, HY + 4);
      const sx = W * 0.74, sy = HY * 0.32, sr = Math.max(14, HY * 0.09); let rg = x.createRadialGradient(sx, sy, 0, sx, sy, sr * 6); rg.addColorStop(0, 'rgba(255,248,220,.95)'); rg.addColorStop(0.18, 'rgba(255,236,180,.55)'); rg.addColorStop(1, 'rgba(255,236,180,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, HY);
      x.fillStyle = '#FFFBEB'; x.beginPath(); x.arc(sx, sy, sr, 0, 7); x.fill();
      const cw = Math.max(800, W * 2); cityC = mk(cw, HY * 0.75 + 2); x = cityC.getContext('2d'); const ch = cityC.height, rc = mb(99);
      for (let i = 0; i < 7; i++) { const cx = rc() * cw, cy = ch * (0.1 + rc() * 0.3), r = 20 + rc() * 40; x.fillStyle = 'rgba(255,255,255,.55)'; for (let j = 0; j < 5; j++) { x.beginPath(); x.ellipse(cx + (j - 2) * r * 0.6, cy + Math.abs(j - 2) * r * 0.12, r * (0.7 - Math.abs(j - 2) * 0.12), r * 0.32, 0, 0, 7); x.fill(); } }
      [['#B3C3D2', 0.25, 0.75], ['#97ABBF', 0.12, 0.5]].forEach(([cc, h0, h1]) => { x.fillStyle = cc; for (let bx = -10; bx < cw;) { const bw = 14 + rc() * 46, bh = ch * (h0 + rc() * (h1 - h0)); x.fillRect(bx, ch - bh, bw, bh + 1); if (rc() < 0.25) x.fillRect(bx + bw / 2 - 1, ch - bh - ch * 0.08, 2, ch * 0.08); if (rc() < 0.15) { x.beginPath(); x.moveTo(bx, ch - bh); x.lineTo(bx + bw / 2, ch - bh - bw * 0.6); x.lineTo(bx + bw, ch - bh); x.fill(); } bx += bw + rc() * 6; } });
      x.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 300; i++) x.fillRect(rc() * cw, ch * (0.55 + rc() * 0.45), 2, 2);
      const hz = x.createLinearGradient(0, ch * 0.5, 0, ch); hz.addColorStop(0, 'rgba(220,230,238,0)'); hz.addColorStop(1, 'rgba(220,230,238,.85)'); x.fillStyle = hz; x.fillRect(0, 0, cw, ch);
    }
    // ---- proyeksiya ----
    const Zc = new Float32Array(DRAW + 2), XO = new Float32Array(DRAW + 2), YW = new Float32Array(DRAW + 2), CLP = new Float32Array(DRAW + 1);
    let F = 300, HY = 200, W2 = 200, camX = 0, camY = 0, camZ = 0, base = 0, PJx = 0, PJy = 0, PJk = 0;
    const pj = (n, f, lat, h) => { const z = Zc[n] + f * SEG; if (z < 0.3) return false; const k = F / z; PJx = W2 + (XO[n] + (XO[n + 1] - XO[n]) * f + lat - camX) * k; PJy = HY - (YW[n] + (YW[n + 1] - YW[n]) * f + h - camY) * k; PJk = k; return true; };
    const pjz = (z, lat, h) => { const s = Math.floor(z / SEG), n = s - base; if (n < 0 || n >= DRAW) return false; return pj(n, z / SEG - s, lat, h); };
    const poly = (col, cu, z0, l0, h0, z1, l1, h1, z2, l2, h2, z3, l3, h3) => { if (!pjz(z0, l0, h0)) return; const ax = PJx, ay = PJy; if (!pjz(z1, l1, h1)) return; const bx = PJx, by = PJy; if (!pjz(z2, l2, h2)) return; const cx = PJx, cy = PJy; if (!pjz(z3, l3, h3)) return;
      if (cu === 1 && cy >= by - 0.3) return; g.fillStyle = col; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(cx, cy); g.lineTo(PJx, PJy); g.fill(); };
    let qx1 = 0, qy1 = 0, qk1 = 0, qx2 = 0, qy2 = 0, qk2 = 0;
    const qd = (a, b) => { g.moveTo(qx1 + a * qk1, qy1); g.lineTo(qx1 + b * qk1, qy1); g.lineTo(qx2 + b * qk2, qy2); g.lineTo(qx2 + a * qk2, qy2); g.closePath(); };
    // ---- boshqaruv: sensor (rul chapda, pedallar o'ngda) + klaviatura ----
    const ptr = new Map(); let tS = 0, LY = null;
    const lay = () => LY;
    const hitR = (p, x, y, m = 8) => x > p[0] - m && x < p[0] + p[2] + m && y > p[1] - m && y < p[1] + p[3] + m;
    const role = (x, y) => { const L2 = lay(); if (!L2) return 's'; if (Math.hypot(x - L2.bx, y - L2.by) < L2.br + 10) return 'n'; if (hitR(L2.gas, x, y)) return 'g'; if (hitR(L2.brk, x, y)) return 'b'; return x < L2.W / 2 ? 's' : 'g'; };
    const pd = (e) => { e.preventDefault(); const [x, y] = pos(c, e), r = role(x, y), L2 = lay(); const inW = L2 && Math.hypot(x - L2.wx, y - L2.wy) < L2.wr; ptr.set(e.pointerId, { r, x0: inW ? L2.wx : x }); try { c.setPointerCapture(e.pointerId); } catch {} if (r === 's') pm(e); };
    const pm = (e) => { const p = ptr.get(e.pointerId); if (!p || p.r !== 's') return; const [x] = pos(c, e); tS = cl((x - p.x0) / ((LY?.wr || 60) * 0.85), -1, 1); };
    const pu = (e) => { const p = ptr.get(e.pointerId); if (p?.r === 's') tS = 0; ptr.delete(e.pointerId); };
    c.addEventListener('pointerdown', pd); c.addEventListener('pointermove', pm); c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
    const myIn = { s: 0, g: 0, b: 0, n: 0 };
    const readIn = () => { const kd = keysDown; let s = tS, gg = 0, b = 0, n = 0; for (const p of ptr.values()) { if (p.r === 'g') gg = 1; else if (p.r === 'b') b = 1; else if (p.r === 'n') n = 1; }
      if (kd.has('arrowleft') || kd.has('a')) s = -1; if (kd.has('arrowright') || kd.has('d')) s = 1; if (kd.has('arrowup') || kd.has('w')) gg = 1; if (kd.has('arrowdown') || kd.has('s')) b = 1; if (kd.has(' ') || kd.has('shift')) n = 1;
      myIn.s = s; myIn.g = gg; myIn.b = b; myIn.n = n; };
    const kdn = (e) => { if (e.key === ' ' && document.activeElement === document.body) e.preventDefault(); }; addEventListener('keydown', kdn);
    // ---- effektlar ----
    const PN = 70, PX_ = new Float32Array(PN), PY_ = new Float32Array(PN), PVX = new Float32Array(PN), PVY = new Float32Array(PN), PLF = new Float32Array(PN), PK_ = new Uint8Array(PN); let pi = 0;
    const burst = (x, y, k, m) => { for (let i = 0; i < m; i++) { const j = pi++ % PN, a = Math.random() * Math.PI * 2, sp = (0.3 + Math.random()) * k * 9; PX_[j] = x; PY_[j] = y; PVX[j] = Math.cos(a) * sp; PVY[j] = Math.sin(a) * sp - k * 4; PLF[j] = 0.5 + Math.random() * 0.6; PK_[j] = i % 3; } };
    let shake = 0, flash = 0, popT = 0, popTxt = '', popCol = '#fff', engT = 0, bstA = 0, lastCd = 9, lastBo = 0, steerVis = 0, tm = 0;
    const items = [], ITS = []; for (let i = 0; i < 80; i++) items.push({ z: 0, l: 0, ty: 0, q: null, s: -1 });
    const RSP = COL.map((cc) => carSprite(6, cc, 170));
    const fmtT = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const rank = () => { const a = []; for (let s = 0; s < N; s++) a.push(s); return a.sort((p, q) => (VOUT[p] - VOUT[q]) || ((VF[q] || VZ[q]) - (VF[p] || VZ[p]))); };
    const name = (s) => String(ctx.names?.[s] || 'P' + (s + 1)).slice(0, 11);
    function drawCar(o, W) {
      const ty = o.ty, D = TD[ty], w = D[0], hh = D[1], len = D[2], zc = o.z - camZ; if (zc < 0.7) return;
      if (!pjz(o.z, o.l, 0)) return; const sx = PJx, sy = PJy, k = PJk; if (sx + w * k < -20 || sx - w * k > W + 20) return;
      const sp = o.s >= 0 ? RSP[o.s] : o.q.sp || (o.q.sp = carSprite(ty, bodyCol(ty, o.q.k), 96));
      const ghost = o.s >= 0 && VCT[o.s] && (tm * 14 | 0) % 2; if (ghost) g.globalAlpha = 0.45;
      const z = o.z, Lc = o.l, w2 = w / 2, dl = Lc - camX, ss = dl > 0 ? -1 : 1, le = Lc + ss * w2, side = Math.abs(dl) > w2 * 0.5 && zc < 140;
      if (zc < 170) { // 3D: soya, yon, tom
        poly('rgba(0,0,0,.32)', 0, z - 0.2, Lc - w2 - 0.15, 0, z - 0.2, Lc + w2 + 0.15, 0, z + len + 0.2, Lc + w2 + 0.15, 0, z + len + 0.2, Lc - w2 - 0.15, 0);
        const P = PROF[ty], wheels = () => { const wr = ty === 4 || ty === 5 ? 0.5 : 0.34, ws = WHL[ty]; for (let i = 0; i < ws.length; i++) { if (!pjz(z + ws[i] * len, le, 0)) continue; const xw = PJx, yw = PJy, kw = PJk; pjz(z + ws[i] * len + wr, le, 0); const rx = Math.max(1, Math.abs(PJx - xw)), ry = wr * kw;
          g.fillStyle = '#0A0A0A'; g.beginPath(); g.ellipse(xw, yw - ry, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = '#9CA3AF'; g.beginPath(); g.ellipse(xw, yw - ry, rx * 0.5, ry * 0.5, 0, 0, 7); g.fill(); } };
        const CB = CAB[ty];
        if (CB) { const sh = CB[6], c0 = CB[4] * w2, c1 = CB[5] * w2, za = z + CB[0] * len, zb = z + CB[1] * len, zc2 = z + CB[2] * len, zd = z + CB[3] * len;
          if (side) { poly(sp.c0, 0, z, le, 0.16, z + len, le, 0.16, z + len, le, sh * 0.92, z, le, sh); wheels(); }
          poly(sp.c1, 1, z, Lc - w2, sh, z, Lc + w2, sh, z + len, Lc + w2, sh * 0.9, z + len, Lc - w2, sh * 0.9);
          if (ty === 6) { poly('rgba(255,255,255,.85)', 1, z, Lc - 0.2, sh, z, Lc - 0.08, sh, z + len, Lc - 0.08, sh * 0.9, z + len, Lc - 0.2, sh * 0.9); poly('rgba(255,255,255,.85)', 1, z, Lc + 0.08, sh, z, Lc + 0.2, sh, z + len, Lc + 0.2, sh * 0.9, z + len, Lc + 0.08, sh * 0.9); }
          poly('#3B4A63', 1, zc2, Lc - c1, hh, zc2, Lc + c1, hh, zd, Lc + c0, sh * 0.96, zd, Lc - c0, sh * 0.96);
          if (side) poly('#253246', 0, za, Lc + ss * c0, sh, zb, Lc + ss * c1, hh, zc2, Lc + ss * c1, hh, zd, Lc + ss * c0, sh * 0.96);
          poly(sp.c1, 1, zb, Lc - c1, hh, zb, Lc + c1, hh, zc2, Lc + c1, hh, zc2, Lc - c1, hh);
          if (ty === 6) { poly('#FFFFFF', 1, zb, Lc - 0.2, hh, zb, Lc - 0.08, hh, zc2, Lc - 0.08, hh, zc2, Lc - 0.2, hh); poly('#FFFFFF', 1, zb, Lc + 0.08, hh, zb, Lc + 0.2, hh, zc2, Lc + 0.2, hh, zc2, Lc + 0.08, hh); }
          if (ty === 2) { poly('#F8FAFC', 0, zb + 0.3, Lc - 0.3, hh, zb + 0.3, Lc + 0.3, hh, zb + 0.3, Lc + 0.3, hh + 0.22, zb + 0.3, Lc - 0.3, hh + 0.22); poly('#FDE68A', 1, zb + 0.3, Lc - 0.3, hh + 0.22, zb + 0.3, Lc + 0.3, hh + 0.22, zb + 0.6, Lc + 0.3, hh + 0.22, zb + 0.6, Lc - 0.3, hh + 0.22); }
          poly(sp.c0, 0, za, Lc - c0, sh, za, Lc + c0, sh, zb, Lc + c1, hh, zb, Lc - c1, hh); const zm = za + (zb - za) * 0.12, zn = za + (zb - za) * 0.9, cm = c0 + (c1 - c0) * 0.12, cn = c0 + (c1 - c0) * 0.9, hm = sh + (hh - sh) * 0.12, hn = sh + (hh - sh) * 0.9;
          poly('#22324D', 0, zm, Lc - cm * 0.84, hm, zm, Lc + cm * 0.84, hm, zn, Lc + cn * 0.84, hn, zn, Lc - cn * 0.84, hn);
          poly('rgba(255,255,255,.16)', 0, zm, Lc - cm * 0.5, hm, zm, Lc - cm * 0.2, hm, zn, Lc - cn * 0.02, hn, zn, Lc - cn * 0.3, hn);
        } else { // qutisimon: furgon, avtobus, yuk mashinasi
          if (side) { for (let i = 0; i < P.length; i++) { const q = P[i]; poly(q[4] === 1 ? '#1E293B' : q[4] === 2 ? sp.c2 : q[4] === 3 ? '#111827' : sp.c0, 0, z + q[0] * len, le, q[2] * hh, z + q[1] * len, le, q[2] * hh, z + q[1] * len, le, q[3] * hh, z + q[0] * len, le, q[3] * hh); } wheels(); }
          if (ty === 5) { poly(sp.c1, 1, z + 0.77 * len, Lc - w2 + 0.1, 0.8 * hh, z + 0.77 * len, Lc + w2 - 0.1, 0.8 * hh, z + len, Lc + w2 - 0.1, 0.8 * hh, z + len, Lc - w2 + 0.1, 0.8 * hh); poly(sp.c3, 1, z, Lc - w2, hh, z, Lc + w2, hh, z + 0.74 * len, Lc + w2, hh, z + 0.74 * len, Lc - w2, hh); }
          else { const e = ty === 3 ? 0.86 : 1; poly(sp.c1, 1, z, Lc - w2 + 0.05, hh, z, Lc + w2 - 0.05, hh, z + e * len, Lc + w2 - 0.05, hh, z + e * len, Lc - w2 + 0.05, hh);
            if (ty === 4) poly('#CBD5E1', 1, z + 0.4 * len, Lc - 0.7, hh + 0.02, z + 0.4 * len, Lc + 0.7, hh + 0.02, z + 0.6 * len, Lc + 0.7, hh + 0.02, z + 0.6 * len, Lc - 0.7, hh + 0.02); }
        } }
      const sc = k / sp.ppm; let dx = sx - sp.ax * sc, dy = sy - sp.gy * sc;
      if (o.s >= 0 && o.s === VS) { g.save(); g.translate(sx, sy); g.rotate(VSM[o.s] * 0.035); g.drawImage(sp, -sp.ax * sc, -sp.gy * sc + Math.sin(tm * 30) * Math.min(1, VV[o.s] / 40) * 0.6, sp.width * sc, sp.height * sc); g.restore(); }
      else g.drawImage(sp, dx, dy, sp.width * sc, sp.height * sc);
      if (o.s >= 0) { const s = o.s, ly = sy - 0.6 * k; g.save(); g.globalCompositeOperation = 'lighter';
        if (VBR[s] || VCT[s]) for (const ex of [-0.74, 0.74]) { const rg = g.createRadialGradient(sx + ex * k, ly, 0, sx + ex * k, ly, 0.7 * k); rg.addColorStop(0, 'rgba(255,80,80,.9)'); rg.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = rg; g.fillRect(sx + ex * k - 0.7 * k, ly - 0.7 * k, 1.4 * k, 1.4 * k); }
        if (VBO_[s]) for (const ex of [-0.38, -0.24, 0.24, 0.38]) { const fx = sx + ex * k, fy = sy - 0.27 * k, r = (0.22 + Math.random() * 0.2) * k; const rg = g.createRadialGradient(fx, fy, 0, fx, fy + r * 0.4, r * 1.6); rg.addColorStop(0, 'rgba(220,240,255,.95)'); rg.addColorStop(0.25, 'rgba(96,165,250,.8)'); rg.addColorStop(0.6, 'rgba(249,115,22,.55)'); rg.addColorStop(1, 'rgba(249,115,22,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(fx, fy + r * 0.5, r * 0.8, r * 1.6, 0, 0, 7); g.fill(); }
        g.restore();
        if (s !== VS && zc < 260 && pjz(o.z + len * 0.4, o.l, hh + 0.35)) { const nm = name(s), fs = cl(k * 0.32, 10, 15); g.font = `800 ${fs}px ${FONT}`; const tw = g.measureText(nm).width + 14, ty2 = Math.max(fs + 4, PJy - fs); g.fillStyle = 'rgba(15,23,42,.75)'; rr(g, sx - tw / 2, ty2 - fs * 0.75, tw, fs * 1.5, fs * 0.75); g.fill(); g.strokeStyle = COL[s]; g.lineWidth = 2; g.stroke(); text(g, nm, sx, ty2, fs, '#fff');
          g.fillStyle = COL[s]; g.beginPath(); g.moveTo(sx - 5, ty2 + fs * 0.75); g.lineTo(sx + 5, ty2 + fs * 0.75); g.lineTo(sx, ty2 + fs * 0.75 + 6); g.fill(); } }
      if (ghost) g.globalAlpha = 1;
    }
    let VS = ME;
    const stop = loop((dt) => {
      tm += dt; readIn(); const W = c.W, Hh = c.H;
      // ---- uy egasi: simulyatsiya ----
      if (H.HOST && H.link.st.alive && !H.over) {
        sendT += dt;
        if (ph === 0) { aliveT += dt; if (ctx.local || aliveT > 5 || ctx.active().every((s) => s === 0 || got.has(s))) { ph = 1; cd = 3.5; } }
        else if (ph === 1) { cd -= dt; if (cd <= 0) { ph = 2; T = 0; } }
        else {
          if (ph === 2) { IN[0].s = SPEC ? 0 : myIn.s; IN[0].g = myIn.g; IN[0].b = myIn.b; IN[0].n = myIn.n; for (const s of ctx.bots || []) if (s < N) botIn(s, RS[s], dt, T); }
          else for (const o of IN) { o.g = 0; o.n = 0; o.b = 1; }
          const t0 = T; T += dt; if (ph === 2 && T >= RACE) { ph = 3; endT = 3.4; RS.forEach((r) => (r.fin = r.z)); let bz = -1; RS.forEach((r, s) => { if (!r.out && r.z > bz) { bz = r.z; win = s; } }); if (win < 0) win = 0; }
          RS.forEach((r, s) => simR(r, s, IN[s], dt, t0, T));
          for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) { const A = RS[a], B = RS[b], dz = A.z - B.z, dx = A.x - B.x; if (Math.abs(dz) < CL && Math.abs(dx) < CW && !A.out && !B.out) { const p = (CW - Math.abs(dx)) / 2 + 0.02, sg = dx >= 0 ? 1 : -1; A.x += sg * p; B.x -= sg * p; if (dz > 0) B.v *= 0.985; else A.v *= 0.985; } }
          if (ph === 3) { endT -= dt; if (endT <= 0) H.end(win); }
        }
        if (sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 's', ph, cd: Math.round(cd * 10) / 10, T: Math.round(T * 100) / 100, R: RS.map((r) => [Math.round(r.z * 10) / 10, Math.round(r.x * 100) / 100, Math.round(r.v * 10) / 10, Math.round(r.b * 100) / 100, r.bo, r.ct > 0 ? 1 : 0, r.h, r.nm, Math.round(r.sm * 100) / 100, r.br, r.out, Math.round(r.fin)]) }); }
        for (let s = 0; s < N; s++) { const r = RS[s]; VZ[s] = r.z; VX[s] = r.x; VV[s] = r.v; VB[s] = r.b; VBO_[s] = r.bo; VCT[s] = r.ct > 0 ? 1 : 0; VH[s] = r.h; VNM[s] = r.nm; VSM[s] = r.sm; VBR[s] = r.br; VOUT[s] = r.out; VF[s] = r.fin; }
        VT = T; VPH = ph; VCD = cd;
      } else if (!H.HOST) {
        sendT += dt; if (ctx.me >= 0 && sendT > 0.04) { sendT = 0; ctx.rt?.send({ t: 'i', s: Math.round(myIn.s * 100) / 100, g: myIn.g, b: myIn.b, n: myIn.n }); }
        const S = H.snap, P = H.prevS(); if (S) { const lp = (a, b) => H.lerp(a, b, 50); VPH = S.ph; VCD = S.cd; VT = P && P.ph === S.ph ? lp(P.T, S.T) : S.T;
          S.R.forEach((q, s) => { if (s >= N) return; const pq = P?.R?.[s] || q; VZ[s] = lp(pq[0], q[0]); VX[s] = lp(pq[1], q[1]); VV[s] = lp(pq[2], q[2]); VB[s] = q[3]; VBO_[s] = q[4]; VCT[s] = q[5]; VH[s] = q[6]; VNM[s] = q[7]; VSM[s] = lp(pq[8], q[8]); VBR[s] = q[9]; VOUT[s] = q[10]; VF[s] = q[11]; }); }
      }
      VS = SPEC ? rank()[0] : ME;
      // ---- effekt tetiklari (o'z mashinam) ----
      if (seenH < 0) { seenH = VH[VS]; seenNM = VNM[VS]; }
      if (VH[VS] > seenH) { shake = 0.55; flash = 1; popTxt = tx('crash'); popCol = '#F87171'; popT = 1.3; snd(80, 0.4, 0.12, 'square'); snd(300, 0.18, 0.07, 'sawtooth'); burst(W / 2, LY ? LY.carY : Hh * 0.8, LY ? LY.k : 50, 34); }
      if (VNM[VS] > seenNM) { popTxt = tx('near') + ' +' + tx('boost'); popCol = '#67E8F9'; popT = 1.1; snd(1200, 0.07, 0.04); setTimeout(() => snd(1600, 0.08, 0.04), 70); }
      seenH = VH[VS]; seenNM = VNM[VS];
      if (VBO_[VS] && !lastBo) snd(130, 0.5, 0.05, 'sawtooth'); lastBo = VBO_[VS];
      if (VPH === 1) { const ci = Math.ceil(VCD); if (ci !== lastCd && ci <= 3 && ci > 0) snd(440, 0.15, 0.07); lastCd = ci; } if (VPH === 2 && lastCd > 0 && lastCd < 9) { snd(880, 0.3, 0.08); lastCd = 0; popTxt = tx('go'); popCol = '#4ADE80'; popT = 0.9; }
      if (VPH === 3 && lastCd !== -5) { lastCd = -5; snd(1046, 0.5, 0.08); }
      engT -= dt; if (engT <= 0 && VPH >= 1 && !SPEC) { engT = 0.14; snd(48 + VV[VS] * 1.7 + (VBO_[VS] ? 30 : 0), 0.13, 0.012, 'sawtooth'); }
      // ---- kamera va maket ----
      const port = Hh > W * 1.05, carW = port ? W * 0.29 : Math.min(W * 0.22, Hh * 0.45);
      const wr = port ? Math.min(74, W * 0.19) : Math.min(64, Hh * 0.25, W * 0.13);
      const carBot = port ? Hh - wr * 1.45 - 20 : Hh * 0.95; HY = Hh * (port ? 0.45 : 0.5); W2 = W / 2;
      bstA += ((VBO_[VS] ? 1 : 0) - bstA) * Math.min(1, dt * 4);
      const F0 = carW * ZP / CW, camH = (carBot - HY) * ZP / F0; F = F0 * (1 - 0.07 * bstA);
      if (cW !== W || cH !== Hh || !skyC) buildBg(W, Hh, HY);
      const pz = VZ[VS]; camX = VX[VS]; camZ = pz - ZP; base = Math.max(0, Math.floor(camZ / SEG)); const bp = camZ / SEG - base;
      const yAt = (z) => { const s = cl(Math.floor(z / SEG), 0, NS - 1), f = z / SEG - s; return YY[s] + (YY[s + 1] - YY[s]) * f; }; camY = yAt(pz) + camH;
      for (let n = 0, x = 0, dx = -CU[base] * bp; n <= DRAW; n++) { const si = Math.min(NS - 1, base + n); Zc[n] = (base + n) * SEG - camZ; XO[n] = x; YW[n] = YY[Math.min(NS, base + n)]; x += dx; dx += CU[si]; }
      skyX += CU[Math.min(NS - 1, base)] * VV[VS] * dt * 60;
      const ui = cl(Math.min(W, Hh) / 400, 0.8, 1.1), cs = cl(Math.min(Hh / 380, W / 390), 0.72, 1.1);
      const gw = 54 * cs, gh = 104 * cs, bw = 60 * cs, bh = 66 * cs, br2 = 27 * cs;
      LY = { W, wx: 14 + wr, wy: Hh - 12 - wr, wr, gas: [W - 14 - gw, Hh - 12 - gh, gw, gh], brk: [W - 14 - gw - 12 - bw, Hh - 12 - bh, bw, bh], bx: W - 14 - gw / 2, by: Hh - 12 - gh - 14 - br2, br: br2, carY: carBot - CW * F / ZP * 0.35, k: F / ZP };
      // ---- chizish ----
      shake = Math.max(0, shake - dt); const shx = shake > 0 ? (Math.random() - 0.5) * shake * 26 : 0, shy = shake > 0 ? (Math.random() - 0.5) * shake * 18 : 0;
      g.save(); g.translate(shx, shy);
      g.drawImage(skyC, 0, 0, W, HY + 4); g.fillStyle = '#DCE6EE'; g.fillRect(0, HY, W, Hh - HY);
      const ccw = cityC.width, off = ((skyX % ccw) + ccw) % ccw; g.drawImage(cityC, -off, HY - cityC.height + 2); g.drawImage(cityC, ccw - off, HY - cityC.height + 2);
      // A) yo'l — oldindan orqaga, tepalik orqasini kesib
      let maxy = Hh + 60;
      for (let n = 0; n < DRAW; n++) {
        CLP[n] = maxy; const si = base + n; if (si >= NS - 1) break; if (Zc[n + 1] <= NEAR) continue;
        const f0 = Zc[n] < NEAR ? (NEAR - Zc[n]) / SEG : 0; pj(n, f0, 0, 0); qx1 = PJx; qy1 = PJy; qk1 = PJk; pj(n, 1, 0, 0); qx2 = PJx; qy2 = PJy; qk2 = PJk;
        if (qy2 >= maxy || qy2 >= qy1) continue;
        if (qy1 > maxy) { const u = (qy1 - maxy) / (qy1 - qy2); qx1 += (qx2 - qx1) * u; qk1 += (qk2 - qk1) * u; qy1 = maxy; }
        qy1 += 0.7; const it = INT[si], alt = (si >> 1) & 1, q = FQ[n];
        g.fillStyle = (it ? C.cross : alt ? C.sw1 : C.sw2)[q]; g.beginPath(); qd(-95, 95); g.fill();
        g.fillStyle = (alt ? C.as1 : C.as2)[q]; g.beginPath(); qd(-RW, RW); g.fill();
        if (!it) { g.fillStyle = (alt ? C.curb1 : C.curb2)[q]; g.beginPath(); qd(-RW - 0.35, -RW); qd(RW, RW + 0.35); g.fill(); g.fillStyle = C.line[q]; g.beginPath(); qd(-RW + 0.35, -RW + 0.5); qd(RW - 0.5, RW - 0.35); if (si % 4 < 2) { qd(-3.58, -3.42); qd(-0.08, 0.08); qd(3.42, 3.58); } g.fill(); }
        else if (it === 2) { g.fillStyle = C.line[q]; g.beginPath(); for (let a = -RW + 0.6; a < RW - 0.5; a += 1.3) qd(a, a + 0.65); g.fill(); }
        if (si === 7) { g.fillStyle = C.line[q]; g.beginPath(); for (let a = -RW; a < RW; a += 1) if (((a + RW) | 0) % 2) qd(a, a + 1); g.fill(); }
        maxy = qy2;
      }
      // B) binolar, ustunlar, mashinalar — orqadan oldinga
      let ni = 0; const DZ = DRAW * SEG;
      for (let l = 0; l < 4; l++) { const A = TR[l], vl = VL[l], tt = Math.max(0, VT); for (let k = lb(A, camZ + 0.7 - vl * tt); k < A.length && ni < 76; k++) { const z = A[k].z + vl * tt; if (z > camZ + DZ - 20) break; const o = items[ni++]; o.z = z; o.l = LX[l]; o.ty = A[k].ty; o.q = A[k]; o.s = -1; } }
      for (let s = 0; s < N; s++) if (VZ[s] > camZ + 0.7 && VZ[s] < camZ + DZ - 20 && !(VOUT[s] && s !== VS)) { const o = items[ni++]; o.z = VZ[s]; o.l = VX[s]; o.ty = 6; o.q = null; o.s = s; }
      ITS.length = 0; for (let i = 0; i < ni; i++) ITS.push(items[i]); ITS.sort((a, b) => b.z - a.z);
      const tl = (si) => { const u = ((VT + si * 1.7) % 10 + 10) % 10; return u < 5.5 ? 2 : u < 7 ? 1 : 0; };
      let p = 0; const bigFont = `900 70px ${FONT}`;
      for (let n = DRAW - 1; n >= 0; n--) {
        const si = base + n; if (si >= NS - 1) continue; const zs = si * SEG, q = FQ[n];
        let clipped = false;
        if (Zc[n] > 1.2) {
          if (pj(n, 0, 0, 0) && PJy > CLP[n] + 1) { clipped = true; g.save(); g.beginPath(); g.rect(-30, -30, W + 60, CLP[n] + 30); g.clip(); }
          for (let sd = -1; sd <= 1; sd += 2) { // binolar
            const bi = sd < 0 ? BL[si] : BRr[si]; if (bi < 0) continue; const B = BLK[bi], P = PC[B.p], hb = B.h, lat = sd * BX;
            pj(n, 0, lat, 0); const xa = PJx + sd * 0.7, ya = PJy, ka = PJk; pj(n, 1, lat, 0); const xb = PJx, yb = PJy, kb = PJk;
            if (si === B.s && n < 150) { const xo = xa + sd * 14 * ka; if (!(Math.max(xa, xo) < 0 || Math.min(xa, xo) > W)) { g.fillStyle = P.d[q]; g.fillRect(Math.min(xa, xo), ya - hb * ka, Math.abs(xo - xa), hb * ka + 1);
              if (n < 60) { g.fillStyle = P.w1[q]; g.beginPath(); for (let la = 1.5; la < 13; la += 3.6) for (let h0 = 5.2; h0 < hb - 1.5; h0 += 3.2) g.rect(xa + sd * la * ka, ya - (h0 + 1.8) * ka, sd * 1.7 * ka, 1.8 * ka); g.fill(); } } }
            if (Math.max(xa, xb) < 0 || Math.min(xa, xb) > W) continue;
            g.fillStyle = P.f[q]; g.beginPath(); g.moveTo(xa, ya + 1); g.lineTo(xa, ya - hb * ka); g.lineTo(xb, yb - hb * kb); g.lineTo(xb, yb + 1); g.fill();
            if (n < 95) { g.fillStyle = P.c[q]; g.beginPath(); g.moveTo(xa, ya - hb * ka); g.lineTo(xb, yb - hb * kb); g.lineTo(xb, yb - (hb - 0.5) * kb); g.lineTo(xa, ya - (hb - 0.5) * ka); g.fill(); }
            if (n < 72) { const cols = B.st === 0 ? [0.12, 0.42, 0.58, 0.88] : B.st === 1 ? [0, 1] : [0.08, 0.28, 0.4, 0.6, 0.72, 0.92], wh = B.st === 1 ? 1.5 : 1.9, fl = (hb - 4.6) / 3.2 | 0;
              for (let pass = 0; pass < 2; pass++) { g.fillStyle = pass ? P.w2[q] : P.w1[q]; g.beginPath();
                for (let ci = 0; ci < cols.length; ci += 2) { pj(n, cols[ci], lat, 0); const x0 = PJx, y0 = PJy, k0 = PJk; pj(n, cols[ci + 1], lat, 0); const x1 = PJx, y1 = PJy, k1 = PJk;
                  for (let r = 0; r < fl; r++) { if (((si * 7 + r * 13 + ci * 5 + B.w) % 5 === 0) !== !!pass) continue; const h0 = 5.2 + r * 3.2, h1 = h0 + wh; g.moveTo(x0, y0 - h0 * k0); g.lineTo(x1, y1 - h0 * k1); g.lineTo(x1, y1 - h1 * k1); g.lineTo(x0, y0 - h1 * k0); g.closePath(); } }
                g.fill(); } }
            if (B.sh && n < 110) { // do'kon: vitrina, soyabon, peshlavha
              const qq = (f0, f1, h0, h1) => { pj(n, f0, lat, 0); const x0 = PJx, y0 = PJy, k0 = PJk; pj(n, f1, lat, 0); g.beginPath(); g.moveTo(x0, y0 - h0 * k0); g.lineTo(PJx, PJy - h0 * PJk); g.lineTo(PJx, PJy - h1 * PJk); g.lineTo(x0, y0 - h1 * k0); g.fill(); };
              g.fillStyle = SHOPG[q]; qq(0.05, 0.95, 0.3, 3.0); if (n < 60) { g.fillStyle = SHOPL[q]; qq(0.1, 0.9, 0.3, 1.1); }
              g.fillStyle = AW[B.aw][q]; qq(0, 1, 3.0, 3.6); g.fillStyle = 'rgba(255,255,255,.25)'; if (si % 2) qq(0, 1, 3.0, 3.6);
              if (si === B.s + 1) { g.fillStyle = SG[B.sg][q]; qq(0.06, 0.94, 3.9, 5.0);
                if (n < 34) { pj(n, sd < 0 ? 0.06 : 0.94, lat, 0); const cx = PJx, cy = PJy, ck = PJk; pj(n, sd < 0 ? 0.94 : 0.06, lat, 0); const dx2 = PJx, dy2 = PJy, dk = PJk;
                  g.save(); g.transform((dx2 - cx) / 1000, (dy2 - 4.95 * dk - (cy - 4.95 * ck)) / 1000, 0, (1.0 * ck) / 100, cx, cy - 4.95 * ck); g.font = bigFont; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,.95)'; g.fillText(SIGNW[B.sg], 500, 56, 900); g.restore(); } } }
          }
          if (n < 135) { // ko'cha jihozlari
            const oa = 1 - q / FL * 0.5; if (oa < 1) g.globalAlpha = oa;
            const obj = (kind, st, lat, f) => { const sp = objSprite(kind, st, lat < 0); if (!pj(n, f, lat, 0)) return; const s2 = PJk / sp.ppm, x0 = PJx - sp.ax * s2, w0 = sp.width * s2; if (x0 > W || x0 + w0 < 0) return; g.drawImage(sp, x0, PJy - sp.gy * s2, w0, sp.height * s2); };
            if (!INT[si]) { if (si % 8 === 4) { obj(1, 0, -(RW + 2.4), 0.5); obj(1, 0, RW + 2.4, 0.5); } if (si % 8 === 0) { obj(0, 0, -(RW + 0.7), 0.5); obj(0, 0, RW + 0.7, 0.5); } if (INT[si + 1]) { const st = tl(si); obj(2, st, -(RW + 0.6), 0.9); obj(2, st, RW + 0.6, 0.9); } }
            g.globalAlpha = 1;
          }
        }
        while (p < ITS.length && ITS[p].z >= zs) drawCar(ITS[p++], W);
        if (clipped) g.restore();
      }
      while (p < ITS.length) drawCar(ITS[p++], W);
      // tezlik chiziqlari
      const spd = VV[VS];
      if (spd > 50 || bstA > 0.1) { const a0 = Math.min(1, (spd - 45) / 30) * 0.5 + bstA * 0.4; g.strokeStyle = `rgba(255,255,255,${a0.toFixed(2)})`; g.lineWidth = 1.5; g.beginPath(); const R0 = Math.max(W, Hh) * 0.42; for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, r0 = R0 * (0.7 + Math.random() * 0.5), r1 = r0 + 40 + Math.random() * 90; g.moveTo(W2 + Math.cos(a) * r0, HY + Math.sin(a) * r0 * 0.7); g.lineTo(W2 + Math.cos(a) * r1, HY + Math.sin(a) * r1 * 0.7); } g.stroke(); }
      // zarrachalar
      for (let i = 0; i < PN; i++) { if (PLF[i] <= 0) continue; PLF[i] -= dt; PVY[i] += 600 * dt; PX_[i] += PVX[i] * dt; PY_[i] += PVY[i] * dt; g.fillStyle = PK_[i] === 0 ? '#FDE68A' : PK_[i] === 1 ? '#F97316' : '#9CA3AF'; const sz = PK_[i] === 2 ? 4 : 2.5; g.fillRect(PX_[i], PY_[i], sz, sz); }
      g.restore();
      if (flash > 0) { flash = Math.max(0, flash - dt * 2.2); const vg = g.createRadialGradient(W2, Hh / 2, Math.min(W, Hh) * 0.3, W2, Hh / 2, Math.max(W, Hh) * 0.75); vg.addColorStop(0, 'rgba(239,68,68,0)'); vg.addColorStop(1, `rgba(239,68,68,${(flash * 0.55).toFixed(2)})`); g.fillStyle = vg; g.fillRect(0, 0, W, Hh); }
      if (bstA > 0.05) { const vg = g.createRadialGradient(W2, HY, Math.min(W, Hh) * 0.35, W2, HY, Math.max(W, Hh) * 0.8); vg.addColorStop(0, 'rgba(56,189,248,0)'); vg.addColorStop(1, `rgba(56,189,248,${(bstA * 0.3).toFixed(2)})`); g.fillStyle = vg; g.fillRect(0, 0, W, Hh); }
      // ---- HUD ----
      const rk = rank(), myP = rk.indexOf(VS) + 1, panel = (x, y, w, h, r = 12) => { g.fillStyle = 'rgba(15,23,42,.62)'; rr(g, x, y, w, h, r); g.fill(); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1; g.stroke(); };
      panel(10, 10, 112 * ui, 60 * ui); text(g, tx('pos'), 20 * ui, 23 * ui, 10 * ui, '#94A3B8', 'left'); text(g, `${myP}`, 20 * ui, 44 * ui, 28 * ui, myP === 1 ? '#FDE047' : '#fff', 'left'); g.font = `800 ${28 * ui}px ${FONT}`; const pw2 = g.measureText(String(myP)).width;
      text(g, `/${N}`, 22 * ui + pw2, 48 * ui, 14 * ui, '#CBD5E1', 'left'); text(g, `${(Math.max(0, VZ[VS] - 15) / 1000).toFixed(2)} ${tx('km')}`, 112 * ui, 60 * ui, 12 * ui, '#E2E8F0', 'right');
      const remain = VPH >= 2 ? RACE - VT : RACE; const tw0 = 92 * ui; panel(W2 - tw0 / 2, 10, tw0, 40 * ui, 20 * ui); text(g, tx('time'), W2, 20 * ui, 8.5 * ui, '#94A3B8'); text(g, fmtT(remain), W2, 36 * ui, 18 * ui, remain < 10.5 && VPH === 2 ? (tm * 3 | 0) % 2 ? '#F87171' : '#fff' : '#fff');
      // tezlik o'lchagichi + nitro
      const gr = 36 * ui, gx = W - 14 - gr, gy = 12 + gr, kmh = Math.round(spd * 3.6), a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, fr = Math.min(1, kmh / 300);
      g.fillStyle = 'rgba(15,23,42,.7)'; g.beginPath(); g.arc(gx, gy, gr + 4, 0, 7); g.fill(); g.lineWidth = 5 * ui; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(gx, gy, gr - 3, a0, a1); g.stroke();
      const grd = g.createLinearGradient(gx - gr, 0, gx + gr, 0); grd.addColorStop(0, '#22D3EE'); grd.addColorStop(0.6, '#FACC15'); grd.addColorStop(1, '#EF4444'); g.strokeStyle = grd; g.beginPath(); g.arc(gx, gy, gr - 3, a0, a0 + (a1 - a0) * fr); g.stroke(); g.lineCap = 'butt';
      const na = a0 + (a1 - a0) * fr; g.strokeStyle = '#F87171'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + Math.cos(na) * (gr - 9), gy + Math.sin(na) * (gr - 9)); g.stroke(); g.fillStyle = '#E2E8F0'; g.beginPath(); g.arc(gx, gy, 3, 0, 7); g.fill();
      text(g, String(kmh), gx, gy + gr * 0.42, 15 * ui, '#fff'); text(g, tx('kmh'), gx, gy + gr * 0.78, 7.5 * ui, '#94A3B8');
      const bwid = 96 * ui, bx0 = W - 14 - bwid, by0 = gy + gr + 12; panel(bx0 - 4, by0 - 4, bwid + 8, 20 * ui + 8, 10); const bv = VB[VS];
      g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, bx0, by0 + 9 * ui, bwid, 9 * ui, 4.5 * ui); g.fill(); const bg2 = g.createLinearGradient(bx0, 0, bx0 + bwid, 0); bg2.addColorStop(0, '#0EA5E9'); bg2.addColorStop(1, '#A78BFA'); g.fillStyle = bg2; if (bv > 0.01) { rr(g, bx0, by0 + 9 * ui, Math.max(9 * ui, bwid * bv), 9 * ui, 4.5 * ui); g.fill(); }
      text(g, tx('boost'), bx0, by0 + 3 * ui, 8.5 * ui, bv > 0.4 ? '#67E8F9' : '#94A3B8', 'left');
      // o'rinlar ro'yxati
      { const rowH = 17 * ui, horiz = W > 620; let y0 = horiz ? 10 + 46 * ui : 10 + 66 * ui; const lw = 128 * ui;
        rk.forEach((s, i) => { const gap = VZ[s] - VZ[VS], lbl = s === VS ? (SPEC ? name(s) : tx('you')) : name(s), gtx = s === VS ? '' : (gap >= 0 ? '+' : '') + Math.round(gap) + 'm';
          const x = horiz ? W2 - (N * (lw + 6)) / 2 + i * (lw + 6) : 10, y = horiz ? y0 : y0 + i * (rowH + 3);
          g.fillStyle = s === VS ? 'rgba(250,204,21,.92)' : 'rgba(15,23,42,.6)'; rr(g, x, y, lw, rowH, rowH / 2); g.fill(); g.globalAlpha = VOUT[s] ? 0.4 : 1;
          text(g, String(i + 1), x + 9 * ui, y + rowH / 2, 10 * ui, s === VS ? '#111827' : '#FDE047'); g.fillStyle = COL[s]; g.beginPath(); g.arc(x + 22 * ui, y + rowH / 2, 4.5 * ui, 0, 7); g.fill();
          text(g, lbl.slice(0, 9), x + 30 * ui, y + rowH / 2, 10 * ui, s === VS ? '#111827' : '#fff', 'left', 800); text(g, gtx, x + lw - 7, y + rowH / 2, 9.5 * ui, gap >= 0 ? '#FCA5A5' : '#86EFAC', 'right', 700); g.globalAlpha = 1; }); }
      // ---- sensor boshqaruv ----
      steerVis += ((SPEC ? 0 : myIn.s) - steerVis) * Math.min(1, dt * 14);
      if (!SPEC) { const { wx, wy } = LY, rot = steerVis * 1.75; g.fillStyle = 'rgba(15,23,42,.3)'; g.beginPath(); g.arc(wx, wy, wr + 4, 0, 7); g.fill();
        g.save(); g.translate(wx, wy); g.rotate(rot); g.lineCap = 'round'; g.strokeStyle = '#111827'; g.lineWidth = wr * 0.2; g.beginPath(); g.arc(0, 0, wr * 0.86, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, wr * 0.93, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        g.strokeStyle = '#EF4444'; g.lineWidth = wr * 0.2; g.beginPath(); g.arc(0, 0, wr * 0.86, -Math.PI / 2 - 0.12, -Math.PI / 2 + 0.12); g.stroke();
        g.strokeStyle = '#374151'; g.lineWidth = wr * 0.16; g.beginPath(); g.moveTo(-wr * 0.8, wr * 0.05); g.lineTo(0, wr * 0.12); g.lineTo(wr * 0.8, wr * 0.05); g.moveTo(0, wr * 0.12); g.lineTo(0, wr * 0.8); g.stroke();
        const hg = g.createRadialGradient(-wr * 0.08, -wr * 0.05, 1, 0, wr * 0.1, wr * 0.32); hg.addColorStop(0, '#6B7280'); hg.addColorStop(1, '#1F2937'); g.fillStyle = hg; g.beginPath(); g.arc(0, wr * 0.1, wr * 0.3, 0, 7); g.fill(); g.strokeStyle = '#94A3B8'; g.lineWidth = 2; g.beginPath(); g.arc(0, wr * 0.1, wr * 0.13, 0, 7); g.stroke(); g.lineCap = 'butt'; g.restore();
        const pedal = (r, on, hue) => { const [x, y, w, h] = r, o2 = on ? 3 : 0; g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x + 2, y + 4, w, h, 10); g.fill(); const pg = g.createLinearGradient(x, y, x + w, y + h); pg.addColorStop(0, on ? '#4B5563' : '#9CA3AF'); pg.addColorStop(1, on ? '#1F2937' : '#4B5563'); g.fillStyle = pg; rr(g, x, y + o2, w, h - o2, 10); g.fill(); g.strokeStyle = hue; g.lineWidth = 2.5; g.stroke();
          g.fillStyle = 'rgba(0,0,0,.35)'; for (let yy = y + o2 + 10; yy < y + h - 8; yy += 9) g.fillRect(x + 8, yy, w - 16, 3.5); };
        let pg0 = 0, pb0 = 0, pn0 = 0; for (const p2 of ptr.values()) { if (p2.r === 'g') pg0 = 1; if (p2.r === 'b') pb0 = 1; if (p2.r === 'n') pn0 = 1; }
        pedal(LY.brk, pb0 || myIn.b, '#F87171'); pedal(LY.gas, pg0 || myIn.g, '#4ADE80');
        const { bx, by } = LY; g.fillStyle = VBO_[VS] ? 'rgba(14,165,233,.75)' : 'rgba(15,23,42,.6)'; g.beginPath(); g.arc(bx, by, br2, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(bx, by, br2 - 2, 0, 7); g.stroke();
        g.strokeStyle = bv > 0.4 ? '#67E8F9' : '#38BDF8'; g.beginPath(); g.arc(bx, by, br2 - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * bv); g.stroke();
        g.fillStyle = bv > 0.05 ? '#FB923C' : '#64748B'; g.beginPath(); g.moveTo(bx, by - br2 * 0.55); g.quadraticCurveTo(bx + br2 * 0.5, by - br2 * 0.05, bx + br2 * 0.28, by + br2 * 0.42); g.quadraticCurveTo(bx, by + br2 * 0.6, bx - br2 * 0.28, by + br2 * 0.42); g.quadraticCurveTo(bx - br2 * 0.45, by, bx - br2 * 0.05, by - br2 * 0.2); g.quadraticCurveTo(bx + br2 * 0.05, by - br2 * 0.35, bx, by - br2 * 0.55); g.fill();
        g.fillStyle = bv > 0.05 ? '#FEF08A' : '#94A3B8'; g.beginPath(); g.ellipse(bx, by + br2 * 0.22, br2 * 0.14, br2 * 0.22, 0, 0, 7); g.fill(); if (pn0) {} }
      // ---- holat yozuvlari ----
      if (VPH === 0 || (!H.HOST && !H.snap)) { panel(W2 - 140, Hh * 0.36 - 24, 280, 48, 24); text(g, tx('wait'), W2, Hh * 0.36, 16, '#fff'); }
      if (VPH === 1) { const n3 = Math.ceil(VCD), lw2 = 132 * ui, lh = 48 * ui, lx = W2 - lw2 / 2, ly2 = Hh * 0.26; panel(lx, ly2, lw2, lh, lh / 2);
        for (let i = 0; i < 3; i++) { const on = 3 - i >= n3 && n3 <= 3, cc = n3 <= 1 && i === 2 ? '#22C55E' : '#EF4444'; g.fillStyle = on ? cc : '#334155'; g.beginPath(); g.arc(lx + lw2 * (0.22 + i * 0.28), ly2 + lh / 2, lh * 0.32, 0, 7); g.fill(); if (on) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.stroke(); } }
        if (n3 <= 3) text(g, String(n3), W2, ly2 + lh + 40 * ui, 54 * ui, '#FDE047'); if (VCD > 2.6 && !('ontouchstart' in window)) text(g, tx('keys'), W2, ly2 - 16, 12 * ui, '#fff', 'center', 700); }
      if (popT > 0) { popT -= dt; const a = Math.min(1, popT * 3), sz = (popTxt === tx('go') ? 46 : 24) * ui * (1 + Math.max(0, popT - 0.8) * 0.6); g.globalAlpha = a; g.lineWidth = 5; g.lineJoin = 'round'; g.strokeStyle = 'rgba(15,23,42,.8)'; g.font = `900 ${sz}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const py = Hh * (port ? 0.3 : 0.32); g.strokeText(popTxt, W2, py); text(g, popTxt, W2, py, sz, popCol, 'center', 900); g.globalAlpha = 1; }
      if (VPH === 3) { const rows = rk.length, pw = Math.min(300, W - 40), phh = 64 + rows * 30, px = W2 - pw / 2, py = Math.max(8, Hh * 0.42 - phh / 2); g.fillStyle = 'rgba(2,6,23,.82)'; rr(g, px, py, pw, phh, 18); g.fill(); g.strokeStyle = '#FACC15'; g.lineWidth = 2; g.stroke();
        text(g, '🏁 ' + tx('fin'), W2, py + 24, 20, '#FDE047'); rk.forEach((s, i) => { const y = py + 56 + i * 30; if (s === VS) { g.fillStyle = 'rgba(250,204,21,.15)'; rr(g, px + 10, y - 13, pw - 20, 26, 13); g.fill(); } text(g, i === 0 ? '🏆' : String(i + 1), px + 30, y, 16, '#fff');
          g.fillStyle = COL[s]; g.beginPath(); g.arc(px + 52, y, 6, 0, 7); g.fill(); text(g, name(s), px + 64, y, 14, '#fff', 'left', 700); text(g, `${((VF[s] || VZ[s]) / 1000 - 0.015).toFixed(2)} ${tx('km')}`, px + pw - 20, y, 14, '#CBD5E1', 'right', 700); }); }
      if (H.link.lost() && !H.over) text(g, rt('lost'), W2, Hh * 0.5, 15, '#FCA5A5');
    });
    return { apply: () => false, rt: (sd, d) => H.link.recv(d, sd), stop: () => { stop(); removeEventListener('keydown', kdn); }, resize: fit, quit: (s) => { if (RS[s]) RS[s].out = 1; } };
  };

  /* ================= Pahlavonlar jangi (jonli, 2–4 kishi): yon ko'rinishdagi 2D jang. Uy egasi (0) hamma narsani hisoblaydi ================= */
  MPL.push({ id: 'fight', e: '🥋', c: ['#9A3412', '#312E81'], rt: 1, bot: 1, big: 1, n: { uz: 'Pahlavonlar jangi', ru: 'Битва богатырей', en: 'Heroes Fight' } });
  const FIGHT_T = {
    uz: { round: 'RAUND {n}', final: 'HAL QILUVCHI RAUND', fight: 'JANG!', ko: 'K.O.', time: 'VAQT!', draw: 'DURANG', wins: 'G‘ALABA!', you: 'SIZ', hits: '{n} ZARBA', hint: 'Joystik — yurish/sakrash/engashish · 👊 musht · 🦶 tepki · 🛡️ himoya · ⚡ maxsus zarba', hintk: 'WASD/strelkalar — yurish · J/Z musht · K/X tepki · L/C himoya · Probel — maxsus', sp: ['Yer silkinishi', 'Olovli hamla', 'Bo‘ron', 'Quyosh chaqnashi'] },
    ru: { round: 'РАУНД {n}', final: 'РЕШАЮЩИЙ РАУНД', fight: 'В БОЙ!', ko: 'K.O.', time: 'ВРЕМЯ!', draw: 'НИЧЬЯ', wins: 'ПОБЕДА!', you: 'ВЫ', hits: '{n} УДАРА', hint: 'Джойстик — ходьба/прыжок/присед · 👊 удар · 🦶 пинок · 🛡️ блок · ⚡ суперудар', hintk: 'WASD/стрелки — ходьба · J/Z удар · K/X пинок · L/C блок · Пробел — суперудар', sp: ['Землетрясение', 'Огненный рывок', 'Вихрь', 'Солнечная вспышка'] },
    en: { round: 'ROUND {n}', final: 'FINAL ROUND', fight: 'FIGHT!', ko: 'K.O.', time: 'TIME!', draw: 'DRAW', wins: 'WINS!', you: 'YOU', hits: '{n} HITS', hint: 'Stick — walk/jump/crouch · 👊 punch · 🦶 kick · 🛡️ block · ⚡ special', hintk: 'WASD/arrows — move · J/Z punch · K/X kick · L/C block · Space — special', sp: ['Earth Shock', 'Fire Dash', 'Whirlwind', 'Sun Flare'] },
  };
  const fgt = (k) => (FIGHT_T[L()] || PK('fight') || FIGHT_T.en)[k] || FIGHT_T.en[k];
  // qahramonlar (o'rin i → qahramon i): o'zbek dostonlari ruhida, original dizayn
  const FHERO = [
    { n: { uz: 'Alpomish', ru: 'Алпамыш', en: 'Alpomish' }, spd: 0.9, pow: 1.15, jmp: 0.95, w: 1.14, h: 1.04, ks: 1, coat: '#16A34A', coat2: '#14532D', str: '#FACC15', trim: '#FDE68A', belt: '#78350F', buckle: '#FBBF24', pants: '#1E293B', boot: '#4A2C17', skin: '#D9A06B', hair: '#3B2314', aura: '#A3E635', hem: 30 },
    { n: { uz: 'Go‘ro‘g‘li', ru: 'Гёроглы', en: 'Gorogly' }, spd: 1.05, pow: 1.04, jmp: 1, w: 1.02, h: 1, ks: 1, coat: '#DC2626', coat2: '#7F1D1D', str: '#FDE68A', trim: '#F59E0B', belt: '#E7E5E4', buckle: '#B91C1C', pants: '#292524', boot: '#111827', skin: '#C98A5B', hair: '#16100C', aura: '#FB923C', hem: 28 },
    { n: { uz: 'Kurashchi', ru: 'Курашист', en: 'Kurash' }, spd: 1.16, pow: 0.96, jmp: 1.08, w: 0.98, h: 1, ks: 0.9, coat: '#2563EB', coat2: '#1E3A8A', str: '#BFDBFE', trim: '#F8FAFC', belt: '#16A34A', buckle: '#15803D', pants: '#1E3A8A', boot: '#1F2937', skin: '#C98A5B', hair: '#111111', aura: '#67E8F9', hem: 22 },
    { n: { uz: 'Bahodir', ru: 'Баходир', en: 'Bahodir' }, spd: 0.98, pow: 1.08, jmp: 0.98, w: 1, h: 1, ks: 1, coat: '#EAB308', coat2: '#92400E', str: '#FEF9C3', trim: '#FFFBEB', belt: '#7F1D1D', buckle: '#FDE047', pants: '#7F1D1D', boot: '#78350F', skin: '#E2A77E', hair: '#1C1917', aura: '#FDE047', hem: 26 },
  ];
  const fMul = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  MPI.fight = (stage, ctx) => {
    stage.classList.add('gm-stage-pad');
    const { c, g } = canvasIn(stage, null);
    const fit = () => { const r = stage.getBoundingClientRect(), d = Math.min(3, devicePixelRatio || 1); const w = Math.max(200, Math.floor(r.width - 16)), h = Math.max(200, Math.floor(Math.min(r.height - 166, w * 1.3))); c.style.width = w + 'px'; c.style.height = h + 'px'; c.width = Math.round(w * d); c.height = Math.round(h * d); g.setTransform(d, 0, 0, d, 0, 0); c.W = w; c.H = h; };
    requestAnimationFrame(fit);
    const pad = padUI(stage, [{ id: 'b', t: '🛡️' }, { id: 's', t: '⚡' }, { id: 'p', t: '👊' }, { id: 'k', t: '🦶' }]);
    const pel = stage.querySelector('.gm-pad'); pel?.classList.add('ft-pad'); const spB = pel?.querySelector('[data-b="s"]');
    if (!document.getElementById('ft-css')) { const st = document.createElement('style'); st.id = 'ft-css'; st.textContent = '.ft-pad .gm-btns{display:grid;grid-template-columns:repeat(2,66px);gap:9px 10px}.ft-pad .gm-btns button{width:66px;height:56px;border-radius:18px;font-size:26px;color:#fff;border:2px solid rgba(255,255,255,.4);box-shadow:0 4px 0 rgba(0,0,0,.4),inset 0 2px 0 rgba(255,255,255,.3)}.ft-pad [data-b=p]{background:linear-gradient(180deg,#FB923C,#C2410C)}.ft-pad [data-b=k]{background:linear-gradient(180deg,#60A5FA,#1D4ED8)}.ft-pad [data-b=b]{background:linear-gradient(180deg,#94A3B8,#334155)}.ft-pad [data-b=s]{background:linear-gradient(180deg,#4B5563,#1F2937);filter:grayscale(.8);opacity:.75}.ft-pad [data-b=s].rdy{background:linear-gradient(180deg,#FDE047,#F59E0B);filter:none;opacity:1;animation:ftpl .55s ease-in-out infinite alternate}@keyframes ftpl{to{box-shadow:0 0 24px #FDE047,0 4px 0 rgba(0,0,0,.4)}}.ft-pad .gm-btns button.on{transform:translateY(3px) scale(.95);filter:brightness(1.3)}'; document.head.appendChild(st); }
    const N = Math.max(2, ctx.n || 2), FFA = N > 2, ME = ctx.me, HW = FFA ? 640 : 440, WIN = 2, RTM = FFA ? 75 : 60, GRV = 1700, OL = '#120C16';
    const ID = 0, WK = 1, JP = 2, CR = 3, BL = 4, PU = 5, KI = 6, AK = 7, SW = 8, UP = 9, SC = 10, HT = 11, DN = 12, RS = 13, KO = 14, WN = 15;
    // hujumlar: [davom, faol0, faol1, zarar, masofa, balandlik, itarish, karaxt, yiqitish]
    const FA = { 5: [0.26, 0.07, 0.14, 5, 50, 98, 90, 0.26, 0], 6: [0.42, 0.14, 0.24, 8, 66, 74, 150, 0.32, 0], 7: [0.6, 0.06, 0.5, 8, 54, 22, 160, 0.3, 0], 8: [0.5, 0.14, 0.27, 7, 72, 8, 120, 0.3, 1], 9: [0.46, 0.1, 0.24, 10, 46, 84, 120, 0.3, 1] };
    const HEAVY = [0.36, 0.11, 0.19, 8, 54, 96, 230, 0.36, 0];
    const atk = (f) => { const A = f.st === PU && f.ci === 2 ? HEAVY : FA[f.st]; if (f.h.ks !== 1 && f.st >= KI && f.st <= SW) return [A[0] * f.h.ks, A[1] * f.h.ks, A[2] * f.h.ks, A[3], A[4], A[5], A[6], A[7], A[8]]; return A; };
    const SPD = [[0.8, 0.36], [0.75, 0.15], [0.62, 0.28], [0.85, 0.42]]; // maxsus: [davom, otish vaqti]
    const SPX = N === 2 ? [-150, 150] : N === 3 ? [-280, 0, 280] : [-330, -110, 110, 330];
    const F = Array.from({ length: N }, (_, i) => ({ i, h: FHERO[i % 4], hi: i % 4, x: SPX[i], y: 0, vx: 0, vy: 0, face: SPX[i] < 0 ? 1 : -1, hp: 100, sp: 30, st: ID, tt: 0, ci: 0, cmb: 0, hm: 0, buf: '', bufT: 0, jl: 1, out: ctx.out?.has(i) ? 1 : 0, lastP: -9, hitOk: 0, stun: 0, cr: 0, lt: -1, fired: 0,
      ghp: 100, px: SPX[i], sv: 0, pst: -1, pcmb: 0, cmbS: 0, P: { hx: 0, hy: -55, ln: 0.1, hd: 0, fh: [0, 0], bh: [0, 0], ff: [0, 0], bf: [0, 0], rot: 0, ry: 0, eye: 0 } }));
    let ph = 0, pt = 0, rn = 1, tmr = RTM, wins = Array(N).fill(0), rw = -1, rk = 0, koI = -1, hs = 0, clock = 0, PR = [], EV = [], sendT = 0, aliveT = 0, started = false, snapAt = 0, lastPh = -1, ended = false;
    const gin = Array.from({ length: N }, () => ({ x: 0, y: 0, p: 0, k: 0, s: 0, b: 0 })), seen = Array.from({ length: N }, () => ({ p: 0, k: 0, s: 0 })), got = new Set();
    const my = { x: 0, y: 0, p: 0, k: 0, s: 0, b: 0 }, BOT = F.map(() => ({ t: 0.5, bt: 0, q: [], qt: 0, o: { x: 0, y: 0, p: 0, k: 0, s: 0, b: 0 } })), ZERO = { x: 0, y: 0, p: 0, k: 0, s: 0, b: 0 };
    const hname = (i) => Array.from(String(ctx.names[i] || '…')).slice(0, 16).join(''); // qahramon nomi emas — Birga'dagi ism
    const alive = () => F.filter((f) => !f.out && f.st !== KO);
    const ev = (a) => { EV.push(a); fxEv(a); };
    const reset = () => { PR = []; F.forEach((f, i) => { Object.assign(f, { x: SPX[i], y: 0, vx: 0, vy: 0, face: SPX[i] < 0 ? 1 : -1, hp: f.out ? 0 : 100, st: f.out ? KO : ID, tt: 0, ci: 0, cmb: 0, hm: 0, buf: '', jl: 1, stun: 0, lt: 0 }); f.ghp = f.hp; f.px = f.x; }); tmr = RTM; };
    const near = (f) => { let T = null, bd = 1e9; for (const e of F) if (e !== f && !e.out && e.st !== KO) { const d = Math.abs(e.x - f.x) + Math.abs(e.y - f.y) * 0.5; if (d < bd) { bd = d; T = e; } } return T; };
    const endRound = (w, kind) => { if (ph !== 2) return; ph = 3; pt = 0; rw = w; rk = kind; if (w >= 0) wins[w]++; };
    function hit(a, T, dmg, kb, stun, kd, ay, dir, heavy, sp) {
      if (T.out || T.st >= DN || (ph !== 2 && ph !== 3)) return false;
      if (T.st === BL && T.face === -dir && T.y >= -1) { T.hp = Math.max(1, T.hp - dmg * a.h.pow * (sp ? 0.3 : 0.12)); T.vx = dir * kb * 0.8; T.sp = Math.min(100, T.sp + 3); a.sp = Math.min(100, a.sp + 2); ev([2, T.x - dir * 18, ay, 0]); hs = 0.04; return true; }
      T.hp -= dmg * a.h.pow; a.sp = Math.min(100, a.sp + 9); T.sp = Math.min(100, T.sp + 5); a.cmb = T.st === HT || T.st === DN ? a.cmb + 1 : 1;
      T.face = -dir; T.buf = '';
      if (T.hp <= 0) {
        T.hp = 0; T.st = KO; T.tt = 0; T.vx = dir * 320; T.vy = -480; T.lt = -1; const al = alive(), fin = !FFA || al.length <= 1;
        ev([3, T.x, T.y - 70, fin ? 1 : 0]); hs = fin ? 0.12 : 0.2;
        if (fin && ph === 2) { koI = T.i; endRound(FFA ? (al[0]?.i ?? -1) : a.i, 0); }
      } else if (kd || T.y < -4) { T.st = DN; T.tt = 0; T.vx = dir * 240; T.vy = -400; T.lt = -1; } else { T.st = HT; T.tt = 0; T.stun = stun; T.vx = dir * kb; }
      ev([1, T.x - dir * 14, ay, heavy ? 1 : 0]); if (T.st !== KO) hs = heavy ? 0.09 : 0.055; return true;
    }
    function startAtk(f, k, crouch) {
      f.buf = ''; f.tt = 0; f.hm = 0; f.hitOk = 0;
      if (k === 's') { f.st = SC; f.sp -= 100; f.fired = 0; ev([4, f.x, f.y - 70, f.hi]); return; }
      if (k === 'p') { if (crouch) f.st = UP; else { f.ci = clock - f.lastP < 0.45 ? (f.ci + 1) % 3 : 0; f.st = PU; } } else f.st = crouch ? SW : KI;
    }
    // bitta jangchi qadami (faqat uy egasida)
    function upd(f, inp, dt, act) {
      f.tt += dt; if (f.bufT > 0 && (f.bufT -= dt) <= 0) f.buf = '';
      if (f.buf === 's' && f.sp < 100) f.buf = '';
      const gr = f.y >= 0 && f.vy >= 0, wasAir = f.y < 0;
      if (f.st <= BL && f.st !== JP && gr) {
        const T = near(f); if (T && Math.abs(T.x - f.x) > 6) f.face = Math.sign(T.x - f.x);
        f.vx = 0;
        if (!act || f.out) f.st = ID;
        else if (f.buf) startAtk(f, f.buf, inp.y > 0.5);
        else if (inp.b) { f.st = BL; f.cr = inp.y > 0.5 ? 1 : 0; }
        else if (inp.y < -0.55 && !f.jl) { f.st = JP; f.tt = 0; f.jl = 1; f.vy = -620 * f.h.jmp; f.vx = Math.abs(inp.x) > 0.3 ? Math.sign(inp.x) * 210 * f.h.spd : 0; }
        else if (inp.y > 0.5) f.st = CR;
        else if (Math.abs(inp.x) > 0.3) { const d = Math.sign(inp.x); f.st = WK; f.vx = d * 175 * f.h.spd * (d === f.face ? 1 : 0.75); }
        else f.st = ID;
        if (inp.y > -0.3) f.jl = 0;
      } else if (f.st === JP && f.buf && f.buf !== 's' && act) { f.st = AK; f.tt = 0; f.hm = 0; f.hitOk = 0; f.buf = ''; }
      if (f.st >= PU && f.st <= UP) {
        const A = atk(f);
        if (f.st !== AK && gr) f.vx = f.st === PU && f.tt < A[1] ? f.face * 60 : f.vx * Math.pow(0.001, dt);
        if (f.tt >= A[1] && f.tt <= A[2]) for (const T of F) {
          if (T === f || f.hm & (1 << T.i)) continue; const dx = (T.x - f.x) * f.face, ay = f.y - A[5] * f.h.h, top = T.y - (T.st === CR || (T.st === BL && T.cr) || T.st === SW ? 74 : 128) * T.h.h;
          if (dx > -12 && dx < A[4] + 16 && ay >= top - 4 && ay <= T.y + 6) { f.hm |= 1 << T.i; if (hit(f, T, A[3], A[6], A[7], A[8] || (f.st === AK && T.y < -4), ay, f.face, (f.st === PU && f.ci === 2) || f.st === UP, 0)) f.hitOk = 1; }
        }
        const done = f.st === AK ? gr && f.tt > 0.05 : f.tt >= A[0], cancel = f.hitOk && f.tt >= A[2] && f.buf && f.buf !== 's' && f.st !== AK;
        if (done || cancel) { if (f.st === PU) f.lastP = f.ci === 2 ? -9 : clock; f.st = gr ? ID : JP; if (cancel && act) startAtk(f, f.buf, inp.y > 0.5); }
      } else if (f.st === SC) {
        const [dur, ft] = SPD[f.hi];
        if (f.hi === 1) { f.vx = f.tt > 0.15 && f.tt < 0.45 ? f.face * 920 : 0; if (f.vx) for (const T of F) if (T !== f && !(f.hm & (1 << T.i)) && Math.abs(T.x - f.x) < 46 && Math.abs(T.y - f.y) < 110) { f.hm |= 1 << T.i; hit(f, T, 17, 280, 0.4, 1, f.y - 80, f.face, 1, 1); } }
        else if (gr) f.vx = 0;
        if (!f.fired && f.tt >= ft) {
          f.fired = 1;
          if (f.hi === 0) { PR.push({ k: 0, x: f.x + f.face * 30, y: 0, d: f.face, o: f.i, t: 0, hm: 0 }, { k: 0, x: f.x - f.face * 30, y: 0, d: -f.face, o: f.i, t: 0, hm: 0 }); ev([9, f.x, 0, 0]); }
          if (f.hi === 2) PR.push({ k: 1, x: f.x + f.face * 40, y: f.y - 62, d: f.face, o: f.i, t: 0, hm: 0 });
          if (f.hi === 3) { ev([8, f.x, f.y - 70, 0]); for (const T of F) { const dx = T.x - f.x; if (T !== f && Math.abs(dx) < 185 && Math.abs(T.y - f.y) < 150) hit(f, T, 16, 260, 0.4, 1, T.y - 70, Math.sign(dx) || f.face, 1, 1); } }
        }
        if (f.tt >= dur) { f.st = ID; f.tt = 0; }
      } else if (f.st === HT) { if (f.tt >= f.stun) { f.st = ID; f.tt = 0; } }
      else if (f.st === DN) { if (f.lt >= 0 && f.tt - f.lt > 0.6) { f.st = RS; f.tt = 0; } }
      else if (f.st === RS) { if (f.tt > 0.35) { f.st = ID; f.tt = 0; f.jl = 1; } }
      // fizika
      if (!gr || f.vy < 0) f.vy += GRV * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.y >= 0) {
        f.y = 0; if (wasAir && f.vy > 0) { if (f.st === JP || f.st === AK) { f.st = ID; f.tt = 0; ev([5, f.x, 0, 0]); } if ((f.st === DN || f.st === KO) && f.lt < 0) { f.lt = f.tt; f.vx *= 0.35; ev([6, f.x, 0, 0]); } }
        f.vy = 0; if (f.st !== WK && !(f.st === SC && f.hi === 1)) f.vx *= Math.pow(f.st >= DN ? 0.02 : 0.004, dt);
      }
      f.x = Math.max(-HW + 22, Math.min(HW - 22, f.x));
    }
    // bot sun'iy intellekti
    function botIn(i, dt) {
      const f = F[i], b = BOT[i], o = b.o; b.t -= dt; b.bt -= dt; b.qt -= dt;
      const T = near(f); if (!T || ph !== 2 || f.out) { o.x = o.y = o.b = 0; return o; }
      const dx = T.x - f.x, dist = Math.abs(dx), dir = Math.sign(dx) || 1;
      if (b.q.length && b.qt <= 0) { o[b.q.shift()]++; b.qt = 0.16; }
      if (b.bt > 0) { o.b = 1; o.x = 0; o.y = 0; return o; } o.b = 0;
      const thr = T.st >= PU && T.st <= SC && T.face === -dir && dist < (T.st === SC ? 260 : 110) && T.tt < 0.3;
      const proj = PR.some((q) => q.o !== i && q.d === Math.sign(f.x - q.x) && Math.abs(q.x - f.x) < 200);
      if ((thr || proj) && b.t <= 0) { b.t = 0.25; if (Math.random() < (proj ? 0.65 : 0.5)) { if (proj && PR.some((q) => q.k === 0 && q.o !== i) && Math.random() < 0.6) { o.y = -1; return o; } b.bt = 0.3 + Math.random() * 0.25; o.b = 1; o.x = 0; o.y = 0; return o; } }
      if (b.t > 0) return o;
      b.t = 0.13 + Math.random() * 0.2; o.y = 0;
      const spR = [300, 330, 420, 165][f.hi];
      if (f.sp >= 100 && dist < spR && T.st < DN && Math.random() < 0.5) { o.s++; o.x = 0; return o; }
      if (T.st >= DN) { o.x = dist < 100 ? -dir : 0; return o; }
      if (dist > 78) { o.x = dir; if (dist < 230 && dist > 120 && Math.random() < 0.1) { o.y = -1; b.q.push('k'); b.qt = 0.22; } else if (Math.random() < 0.06) o.x = 0; }
      else {
        o.x = 0; const r = Math.random();
        if (T.y < -30 && r < 0.6) { o.y = 1; o.p++; }
        else if (r < 0.48) { o.p++; b.q.push('p', 'p'); b.qt = 0.18; }
        else if (r < 0.7) o.k++;
        else if (r < 0.82) { o.y = 1; o.k++; }
        else if (r < 0.9) o.x = -dir;
        else { o.y = 1; o.p++; }
      }
      return o;
    }
    // ---- effektlar ----
    const PT = [], RG = []; let shake = 0, flash = 0, spT = 0, spTxt = '', spCol = '#fff', banT = 0;
    const pp = (x, y, vx, vy, l, s, col, ty, gr) => { if (PT.length > 420) PT.shift(); PT.push({ x, y, vx, vy, l, m: l, s, c: col, t: ty, g: gr || 0 }); };
    const spark = (x, y, n, col) => { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, v = 200 + Math.random() * 520; pp(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.18 + Math.random() * 0.22, 2 + Math.random() * 2.5, col, 0, 600); } };
    const dust = (x, y, n) => { for (let k = 0; k < n; k++) pp(x + (Math.random() - 0.5) * 40, y - 4, (Math.random() - 0.5) * 260, -Math.random() * 90, 0.5 + Math.random() * 0.5, 8 + Math.random() * 10, '#E2E8F0', 2, -40); };
    function fxEv(e) {
      const [k, x, y, a] = e;
      if (k === 1) { spark(x, y, a ? 26 : 15, a ? '#FFF7AD' : '#FFD27A'); RG.push({ x, y, t: 0, m: 0.22, r: a ? 70 : 44, c: '#FFF3C4', w: 5 }); shake = Math.max(shake, a ? 10 : 5); snd(a ? 120 : 170, 0.09, 0.11, 'square'); snd(55, 0.16, 0.09, 'sawtooth'); }
      if (k === 2) { spark(x, y, 10, '#BFDBFE'); RG.push({ x, y, t: 0, m: 0.18, r: 34, c: '#93C5FD', w: 4 }); shake = Math.max(shake, 2); snd(950, 0.05, 0.05, 'triangle'); }
      if (k === 3) { flash = a ? 1 : 0.55; shake = 18; spark(x, y, 40, '#FFFFFF'); snd(70, 0.9, 0.15, 'sawtooth'); snd(140, 0.5, 0.09, 'square'); }
      if (k === 4) { const h = FHERO[a]; for (let q = 0; q < 26; q++) { const an = Math.random() * 6.28; pp(x + Math.cos(an) * 30, y + Math.sin(an) * 50, Math.cos(an) * 160, Math.sin(an) * 160 - 60, 0.6, 4, h.aura, 1, -100); } RG.push({ x, y, t: 0, m: 0.4, r: 90, c: h.aura, w: 6 }); spTxt = '⚡ ' + h.n[L()] || h.n.en; spTxt += ': ' + fgt('sp')[a]; spCol = h.aura; spT = 1.6; snd(240, 0.35, 0.07, 'sawtooth'); snd(480, 0.35, 0.05, 'triangle'); }
      if (k === 5) dust(x, 0, 5);
      if (k === 6) { dust(x, 0, 16); shake = Math.max(shake, 6); snd(80, 0.22, 0.11, 'triangle'); }
      if (k === 8) { flash = Math.max(flash, 0.45); RG.push({ x, y, t: 0, m: 0.5, r: 200, c: '#FDE047', w: 10, ray: 1 }); for (let q = 0; q < 40; q++) { const an = Math.random() * 6.28, v = 300 + Math.random() * 300; pp(x, y, Math.cos(an) * v, Math.sin(an) * v, 0.45, 4, '#FEF08A', 1, 0); } snd(1300, 0.45, 0.06, 'sine'); snd(650, 0.5, 0.07, 'triangle'); }
      if (k === 9) { shake = 15; dust(x, 0, 26); for (let q = 0; q < 14; q++) pp(x + (Math.random() - 0.5) * 60, -6, (Math.random() - 0.5) * 300, -200 - Math.random() * 300, 0.9, 4 + Math.random() * 4, '#78716C', 4, 1500); snd(50, 0.7, 0.15, 'sawtooth'); snd(90, 0.4, 0.1, 'square'); }
    }
    const HG = hostGame(ctx, {
      onInput: (d, s) => { if (s > 0 && s < N) { got.add(s); const q = gin[s]; q.x = Math.max(-1, Math.min(1, +d.x || 0)); q.y = Math.max(-1, Math.min(1, +d.y || 0)); q.p = d.p | 0; q.k = d.k | 0; q.s = d.s | 0; q.b = d.b ? 1 : 0; } },
      onSnap: (d) => { snapAt = performance.now(); (d.e || []).forEach(fxEv); },
    });
    ctx.turn(-1, matchMedia('(pointer: coarse)').matches ? fgt('hint') : fgt('hintk'));
    // klaviatura: bosilishlarni sanash
    const KP = { j: 'p', z: 'p', k: 'k', x: 'k', ' ': 's', i: 's', v: 's' };
    const kd = (e) => { if (e.repeat || /input|textarea/i.test(e.target?.tagName || '')) return; const a = KP[e.key.toLowerCase()]; if (a) { my[a]++; if (e.key === ' ') e.preventDefault(); } };
    addEventListener('keydown', kd);
    // ---- fon (keshlangan qatlamlar) ----
    let sky = null, vig = null, skyK = '', LQ = 0, Lfar = null, Lmid = null, Lfor = null, Lgnd = null, glow = null;
    const mkC = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
    function layer(LW, LH, Q, draw) { const cv = mkC(LW * Q, LH * Q), x = cv.getContext('2d'); x.scale(Q, Q); draw(x, LW, LH); cv.LW = LW; cv.LH = LH; return cv; }
    function mountains(x, w, h, R, c1, c2, sn, sh, step, hi) {
      const pk = []; let px = -40; while (px < w + 80) { pk.push([px, h * (hi[0] + R() * hi[1])]); px += step * (0.6 + R() * 0.8); pk.push([px, h * (0.55 + R() * 0.2)]); px += step * (0.4 + R() * 0.5); }
      const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); x.fillStyle = gr; x.beginPath(); x.moveTo(-50, h + 2); pk.forEach((p) => x.lineTo(p[0], p[1])); x.lineTo(w + 50, h + 2); x.fill();
      for (let k = 0; k < pk.length - 2; k += 2) {
        const [qx, qy] = pk[k], L0 = pk[k - 1] || [qx - 80, h * 0.7], R0 = pk[k + 1], lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], d = 0.32 + R() * 0.12;
        const l = lp([qx, qy], L0, d), r = lp([qx, qy], R0, d), m = lp([qx, qy], [(L0[0] + R0[0]) / 2, (L0[1] + R0[1]) / 2], d * 0.8);
        x.fillStyle = sn; x.beginPath(); x.moveTo(qx, qy); x.lineTo(r[0], r[1]); x.lineTo(r[0] - (r[0] - m[0]) * 0.4, m[1] - 6); x.lineTo(m[0] + 4, m[1] + 4); x.lineTo(m[0] - (m[0] - l[0]) * 0.5, l[1] - 8); x.lineTo(l[0], l[1]); x.fill();
        x.fillStyle = sh; x.beginPath(); x.moveTo(qx, qy); x.lineTo(r[0], r[1]); x.lineTo(r[0] - (r[0] - m[0]) * 0.4, m[1] - 6); x.lineTo(qx + (r[0] - qx) * 0.2, qy + (m[1] - qy) * 0.6); x.fill();
      }
    }
    function pine(x, px, by, ht, col, snow) {
      const w = ht * 0.42; x.fillStyle = '#1B130E'; x.fillRect(px - 2, by - ht * 0.15, 4, ht * 0.16);
      for (let k = 0; k < 4; k++) { const t0 = by - ht * 0.12 - k * ht * 0.22, ww = w * (1 - k * 0.2); x.fillStyle = col; x.beginPath(); x.moveTo(px - ww, t0); x.lineTo(px, t0 - ht * 0.36); x.lineTo(px + ww, t0); x.quadraticCurveTo(px, t0 - ht * 0.06, px - ww, t0); x.fill();
        x.fillStyle = snow; x.beginPath(); x.moveTo(px - ww * 0.75, t0 - ht * 0.06); x.lineTo(px, t0 - ht * 0.36); x.lineTo(px + ww * 0.35, t0 - ht * 0.16); x.quadraticCurveTo(px - ww * 0.1, t0 - ht * 0.14, px - ww * 0.75, t0 - ht * 0.06); x.fill(); }
    }
    function buildBG(W, H, s) {
      const d = Math.min(3, devicePixelRatio || 1), k = W + 'x' + H;
      if (skyK !== k) {
        skyK = k; sky = mkC(W * d, H * d); let x = sky.getContext('2d'); x.scale(d, d);
        const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0A0F2E'); gr.addColorStop(0.35, '#2B2160'); gr.addColorStop(0.62, '#7B3F7A'); gr.addColorStop(0.8, '#E07A5F'); gr.addColorStop(1, '#F6B27A'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
        const R = fMul(5); for (let q = 0; q < 140; q++) { const sy = R() * H * 0.5; x.globalAlpha = (1 - sy / (H * 0.5)) * (0.4 + R() * 0.6); x.fillStyle = '#fff'; x.beginPath(); x.arc(R() * W, sy, R() * 1.3 + 0.3, 0, 7); x.fill(); } x.globalAlpha = 1;
        const mx = W * 0.72, my = H * 0.24, mr = Math.min(W, H) * 0.07, mg = x.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 5); mg.addColorStop(0, 'rgba(255,235,210,.45)'); mg.addColorStop(1, 'rgba(255,200,180,0)'); x.fillStyle = mg; x.fillRect(0, 0, W, H);
        x.fillStyle = '#FFF4E0'; x.beginPath(); x.arc(mx, my, mr, 0, 7); x.fill(); x.fillStyle = 'rgba(200,170,150,.35)'; [[-0.3, -0.2, 0.25], [0.35, 0.15, 0.18], [-0.1, 0.4, 0.14]].forEach(([a, b, r]) => { x.beginPath(); x.arc(mx + a * mr, my + b * mr, r * mr, 0, 7); x.fill(); });
        vig = mkC(W * d, H * d); x = vig.getContext('2d'); x.scale(d, d); const vg = x.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,3,20,.55)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
      }
      const Q = Math.max(1, Math.min(2, Math.round(s * d * 2) / 2));
      if (Q !== LQ) {
        LQ = Q;
        Lfar = layer(1800, 330, Q, (x, w, h) => mountains(x, w, h, fMul(11), '#8E86C4', '#433E78', '#FBEFFF', 'rgba(120,110,190,.55)', 120, [0.05, 0.3]));
        Lmid = layer(2000, 240, Q, (x, w, h) => { mountains(x, w, h, fMul(23), '#4B4485', '#211E48', '#DCD6F5', 'rgba(70,60,140,.6)', 95, [0.12, 0.3]); const fg = x.createLinearGradient(0, h * 0.6, 0, h); fg.addColorStop(0, 'rgba(240,160,150,0)'); fg.addColorStop(1, 'rgba(240,170,160,.35)'); x.fillStyle = fg; x.fillRect(0, 0, w, h); });
        Lfor = layer(2400, 200, Q, (x, w, h) => { const R = fMul(37); for (let px = 0; px < w; px += 18 + R() * 26) pine(x, px, h - 18, 90 + R() * 60, '#22325A', '#9AA6CC'); const fg = x.createLinearGradient(0, 0, 0, h); fg.addColorStop(0, 'rgba(200,140,170,0)'); fg.addColorStop(1, 'rgba(200,150,180,.35)'); x.fillStyle = fg; x.fillRect(0, 0, w, h); for (let px = 0; px < w; px += 26 + R() * 34) pine(x, px, h + 2, 110 + R() * 70, '#0E1730', '#C9D3EE'); });
        Lgnd = layer(2 * HW + 1200, 80, Q, (x, w, h) => {
          const R = fMul(51), by = 34; x.fillStyle = '#E8EEFA'; x.beginPath(); x.moveTo(0, by); for (let px = 0; px <= w; px += 30) x.lineTo(px, by - 6 - Math.sin(px * 0.013) * 5 - R() * 5); x.lineTo(w, by + 4); x.lineTo(0, by + 4); x.fill();
          for (let q = 0; q < 70; q++) { const px = R() * w, py = by - 2 + R() * 6, r = 4 + R() * 9; x.fillStyle = '#4B5068'; x.beginPath(); x.ellipse(px, py, r * 1.4, r, 0, Math.PI, 0); x.fill(); x.fillStyle = '#F1F5FF'; x.beginPath(); x.ellipse(px, py - r * 0.65, r * 1.1, r * 0.4, 0, Math.PI, 0); x.fill(); }
          x.strokeStyle = '#7C6A55'; x.lineWidth = 1.3; for (let q = 0; q < 120; q++) { const px = R() * w, py = by + 2 + R() * 4; for (let b = -2; b <= 2; b++) { x.beginPath(); x.moveTo(px, py); x.lineTo(px + b * 2.5, py - 6 - R() * 6); x.stroke(); } }
          x.fillStyle = 'rgba(150,165,205,.5)'; for (let q = 0; q < 160; q++) { x.beginPath(); x.ellipse(R() * w, by + 10 + R() * 60, 3 + R() * 10, 1 + R() * 2, 0, 0, 7); x.fill(); }
        });
        glow = mkC(128, 128); const x = glow.getContext('2d'), gg = x.createRadialGradient(64, 64, 2, 64, 64, 64); gg.addColorStop(0, 'rgba(255,214,140,.95)'); gg.addColorStop(0.25, 'rgba(255,150,60,.45)'); gg.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = gg; x.fillRect(0, 0, 128, 128);
      }
    }
    const LANT = FFA ? [-560, -300, 300, 560] : [-400, -190, 190, 400];
    const flakes = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random(), z: 0.4 + Math.random(), p: Math.random() * 6 }));
    // ---- poza va chizish ----
    const IK = (ax, ay, bx, by, l1, l2, sg, o) => { const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 0.001, dd = Math.min(d, l1 + l2 - 0.01), b = Math.atan2(dy, dx), a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd)))); o[0] = ax + Math.cos(b + sg * a) * l1; o[1] = ay + Math.sin(b + sg * a) * l1; o[2] = ax + Math.cos(b) * dd; o[3] = ay + Math.sin(b) * dd; return o; };
    const J0 = [0, 0, 0, 0], J1 = [0, 0, 0, 0], J2 = [0, 0, 0, 0], J3 = [0, 0, 0, 0];
    const ext = (t, a0, a1, d) => { const e = t < a0 ? t / a0 : t < a1 ? 1 : Math.max(0, 1 - (t - a1) / (d - a1)); return 1 - (1 - e) * (1 - e); };
    const s2 = (a, x, y) => { a[0] = x; a[1] = y; };
    function pose(f, now) {
      const o = f.P, t = f.tt, br = Math.sin(now * 3.3 + f.i * 1.7), hi = f.hi;
      o.rot = 0; o.ry = 0; o.hd = 0; o.ln = 0.14; o.hx = 0; o.hy = -54 + br * 1.1; o.eye = 0;
      s2(o.ff, 14, 0); s2(o.bf, -13, 0); s2(o.fh, 17, -3 + br); s2(o.bh, 11, 4 + br);
      switch (f.st) {
        case WK: { const p = f.x * 0.06 * f.face, sn = Math.sin(p); s2(o.ff, 13 + sn * 12, -Math.max(0, Math.cos(p)) * 8); s2(o.bf, -12 - sn * 12, -Math.max(0, -Math.cos(p)) * 8); o.hy = -54 - Math.abs(sn) * 2; o.ln = 0.2; s2(o.fh, 18, -3 + sn * 2); s2(o.bh, 10, 4 - sn * 2); break; }
        case JP: case AK: { const u = Math.sin(Math.min(1, t / 0.7) * Math.PI); o.hy = -58 + 4 * u; s2(o.ff, 12 + 6 * u, -4 - 22 * u); s2(o.bf, -10, -2 - 14 * u); s2(o.fh, 16, -10); s2(o.bh, 4, -14);
          if (f.st === AK) { const e = Math.min(1, t / 0.08); s2(o.ff, 12 + 46 * e, -22 + 30 * e); s2(o.bf, -8, -30); o.ln = 0.14 - 0.4 * e; s2(o.bh, -16, 0); } break; }
        case CR: o.hy = -34 + br * 0.6; o.ln = 0.36; s2(o.ff, 20, 0); s2(o.bf, -17, 0); s2(o.fh, 18, 4); s2(o.bh, 12, 8); break;
        case BL: if (f.cr) { o.hy = -34; o.ln = 0.3; s2(o.ff, 20, 0); s2(o.bf, -17, 0); } else { o.hy = -51; o.ln = -0.02; } s2(o.fh, 13, -16); s2(o.bh, 9, -11); o.hd = 0.15; break;
        case PU: { const A = atk(f), e = ext(t, A[1], A[2], A[0]);
          if (f.ci === 0) { s2(o.fh, 17 + 30 * e, -3 + 2 * e); o.ln = 0.14 + 0.12 * e; o.hx = 4 * e; }
          else if (f.ci === 1) { s2(o.bh, 11 + 37 * e, 4 - 4 * e); s2(o.fh, 14, -6); o.ln = 0.14 + 0.25 * e; o.hx = 6 * e; o.bf[1] = -3 * e; }
          else { s2(o.bh, 10 + 38 * e, 2 - 8 * e); s2(o.fh, 12, -2); o.ln = 0.1 + 0.4 * e; o.hx = 10 * e; o.hy = -54 + 4 * e; o.ff[0] = 14 + 8 * e; o.bf[1] = -4 * e; }
          if (hi === 3 && f.ci !== 0) o.bh[1] -= 4; break; }
        case KI: { const A = atk(f), e = ext(t, A[1], A[2], A[0]), kh = hi === 2 ? 92 : 72; s2(o.ff, 8 + 58 * e, -kh * e); o.ln = 0.14 - 0.5 * e; s2(o.bh, 11 - 26 * e, 6 + 6 * e); s2(o.fh, 14, -6); o.hx = -4 * e; s2(o.bf, -13, 0); break; }
        case SW: { const A = atk(f), e = ext(t, A[1], A[2], A[0]); o.hy = -27; o.ln = 0.55; s2(o.ff, 8 + 62 * e, -1); s2(o.bf, -16, 0); s2(o.fh, 6, 28); s2(o.bh, -4, 26); break; }
        case UP: { const A = atk(f), e = ext(t, A[1], A[2], A[0]); o.hy = -34 - 26 * e; o.ln = 0.4 - 0.5 * e; s2(o.fh, 12 + 8 * e, 8 - 58 * e); s2(o.ff, 16, -6 * e); s2(o.bf, -14, 0); s2(o.bh, 8, 8); break; }
        case SC: { const [dur, ft] = SPD[hi], w = Math.min(1, t / ft), e = t < ft ? w : Math.max(0, 1 - (t - ft) / (dur - ft) * 1.3);
          if (hi === 0) { if (t < ft) { o.hy = -54 - 10 * w; s2(o.fh, 4, -44 * w); s2(o.bh, -6, -42 * w); o.ln = -0.2 * w; s2(o.ff, 12, -8 * w); } else { o.hy = -32 - 20 * (1 - e); o.ln = 0.6 * e; s2(o.fh, 24, 34 * e); s2(o.bh, 14, 36 * e); s2(o.ff, 22, 0); s2(o.bf, -20, 0); } }
          else if (hi === 1) { const d = t > 0.15 && t < 0.45; if (t < 0.15) { o.hy = -46; o.ln = -0.1; s2(o.fh, -6, 6); } else if (d) { o.ln = 0.6; o.hy = -50; s2(o.ff, 34, -2); s2(o.bf, -36, -10); s2(o.fh, 46, 0); s2(o.bh, -24, 12); } else { o.ln = 0.3 * e; s2(o.fh, 20 + 20 * e, -2); } }
          else if (hi === 2) { if (t < ft) { s2(o.ff, 10 + 48 * w, -88 * w); o.ln = -0.45 * w; s2(o.fh, 10, -14); s2(o.bh, -14, -8); } else { s2(o.fh, 44 * e + 16, -6); s2(o.bh, 36 * e + 10, -2); o.ln = 0.3 * e; o.hx = 6 * e; s2(o.ff, 22, 0); } }
          else { if (t < ft) { o.hy = -54 - 6 * w; s2(o.fh, 18 * w + 10, -40 * w); s2(o.bh, -14 * w, -40 * w); o.ln = -0.12 * w; o.hd = -0.3 * w; } else { s2(o.fh, 44 * e + 4, -4); s2(o.bh, -38 * e, -4); o.ln = -0.05; s2(o.ff, 20, 0); s2(o.bf, -20, 0); } }
          break; }
        case HT: { const k = Math.max(0, 1 - t / Math.max(0.2, f.stun || 0.3)); o.ln = 0.14 - 0.6 * k; o.hd = -0.4 * k; o.hx = -7 * k; s2(o.fh, 4, 16); s2(o.bh, -6, 18); o.ff[1] = -6 * k; o.eye = 1; break; }
        case DN: case KO: { o.hy = -55; o.ln = 0; s2(o.ff, 3, 0); s2(o.bf, -2, 0); s2(o.fh, 18, 26); s2(o.bh, -10, 30); o.rot = -Math.PI / 2 * Math.min(1, t / 0.32); o.ry = -9 * Math.min(1, t / 0.32); o.eye = f.st === KO ? 2 : 1; break; }
        case RS: { const k = Math.min(1, t / 0.35); o.rot = -Math.PI / 2 * (1 - k); o.ry = -9 * (1 - k); o.hy = -36 - 18 * k; o.ln = 0.3; s2(o.ff, 18, 0); s2(o.bf, -14, 0); s2(o.fh, 16, 10); break; }
        case WN: { const b = Math.abs(Math.sin(now * 5)) * 2; o.hy = -55 - b; o.ln = 0;
          if (hi === 0) { s2(o.fh, 18, -26); s2(o.bh, -12, -26); s2(o.ff, 18, 0); s2(o.bf, -18, 0); } else if (hi === 1) { s2(o.fh, 6, -46 - b); s2(o.bh, 12, 8); } else if (hi === 2) { s2(o.fh, 14, -44); s2(o.bh, -10, 16); o.ln = -0.1; s2(o.ff, 8, -6); } else { s2(o.bh, 14, -40 - b); s2(o.fh, 18, 8); } break; }
      }
    }
    const limb = (x0, y0, x1, y1, x2, y2, col, w) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.lineWidth = w + 3.4; g.strokeStyle = OL; g.stroke(); g.lineWidth = w; g.strokeStyle = col; g.stroke(); g.lineWidth = w * 0.3; g.strokeStyle = 'rgba(255,255,255,.17)'; g.stroke(); };
    const fist = (x, y, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, 5.6, 0, 7); g.fill(); g.lineWidth = 2.2; g.strokeStyle = OL; g.stroke(); };
    function boot(kx, ky, ax, ay, h) {
      const a = Math.atan2(ay - ky, ax - kx) - Math.PI / 2; g.save(); g.translate(ax, ay); g.rotate(a);
      g.fillStyle = h.boot; g.beginPath(); g.moveTo(-6, -8); g.lineTo(5, -8); g.quadraticCurveTo(7, -1, 13, 0); g.quadraticCurveTo(17, -1, 16, -5); g.quadraticCurveTo(19, 1, 15, 4); g.lineTo(-6, 4); g.closePath(); g.fill(); g.lineWidth = 2.2; g.strokeStyle = OL; g.stroke();
      g.strokeStyle = h.trim; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-5, -5); g.lineTo(5, -5); g.stroke(); g.restore();
    }
    // bosh (portret uchun ham)
    function head(hi, x, y, a, eye, now, sw) {
      const h = FHERO[hi]; g.save(); g.translate(x, y); g.rotate(a); g.lineJoin = 'round'; g.lineCap = 'round';
      g.fillStyle = h.skin; g.beginPath(); g.ellipse(0, 0, 10.5, 11.6, 0, 0, 7); g.fill(); g.lineWidth = 2.4; g.strokeStyle = OL; g.stroke();
      g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(-3, 3, 7, 8, 0, 0, 7); g.fill();
      g.fillStyle = h.skin; g.beginPath(); g.moveTo(9.5, -2); g.lineTo(13.6, 3.6); g.lineTo(9.6, 5); g.fill(); g.lineWidth = 1.4; g.stroke();
      g.fillStyle = h.skin; g.beginPath(); g.ellipse(-2.5, 1.5, 2.6, 3.4, 0, 0, 7); g.fill(); g.lineWidth = 1.2; g.stroke();
      if (eye === 2) { g.strokeStyle = OL; g.lineWidth = 1.6; g.beginPath(); g.moveTo(3.6, -4.2); g.lineTo(8, 0); g.moveTo(8, -4.2); g.lineTo(3.6, 0); g.stroke(); }
      else if (eye === 1) { g.strokeStyle = OL; g.lineWidth = 1.8; g.beginPath(); g.moveTo(3.5, -2); g.lineTo(8.5, -1.4); g.stroke(); }
      else { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(6.3, -2, 2.9, 2.1, 0, 0, 7); g.fill(); g.fillStyle = '#1B1209'; g.beginPath(); g.arc(7.4, -2, 1.45, 0, 7); g.fill(); }
      g.strokeStyle = hi >= 2 ? '#2B1A12' : h.hair; g.lineWidth = hi >= 2 ? 1.4 : 2.4; g.beginPath(); g.moveTo(2.4, -6.4); g.lineTo(9.8, hi >= 2 ? -6.6 : -4.8); g.stroke();
      if (h.fem) { g.strokeStyle = '#B91C1C'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(6.6, 7); g.lineTo(9.4, 6.6); g.stroke(); g.fillStyle = '#FACC15'; g.beginPath(); g.arc(-2.2, 6.6, 1.6, 0, 7); g.fill(); }
      else { g.strokeStyle = '#7A3E2A'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(6.2, 7.2); g.lineTo(9.4, 7); g.stroke(); }
      if (hi === 0) {
        g.fillStyle = h.hair; g.beginPath(); g.moveTo(-6, 2); g.quadraticCurveTo(-4, 13, 3, 15.5); g.quadraticCurveTo(10, 15, 12, 7.6); g.quadraticCurveTo(9, 9.4, 5, 8.4); g.quadraticCurveTo(1, 7, -1, 4); g.fill(); g.lineWidth = 1.6; g.strokeStyle = OL; g.stroke();
        g.fillStyle = h.hair; g.beginPath(); g.moveTo(5, 5.2); g.quadraticCurveTo(10, 3.6, 13, 6.4); g.quadraticCurveTo(9, 6.2, 5, 7); g.fill();
        g.fillStyle = '#111318'; g.beginPath(); g.moveTo(-11.4, -4); g.lineTo(-10.4, -13.6); g.quadraticCurveTo(0, -18.2, 10.4, -13.4); g.lineTo(11.4, -5.6); g.quadraticCurveTo(0, -8.4, -11.4, -4); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OL; g.stroke();
        g.strokeStyle = '#F8FAFC'; g.lineWidth = 1.5; [[-6, -10.5], [0.5, -12], [7, -10.5]].forEach(([qx, qy]) => { g.beginPath(); g.moveTo(qx - 2, qy + 1.6); g.quadraticCurveTo(qx, qy - 3, qx + 2.2, qy + 0.4); g.stroke(); });
        g.strokeStyle = '#E2E8F0'; g.lineWidth = 1; g.beginPath(); g.moveTo(-11, -5.6); g.quadraticCurveTo(0, -9.6, 11, -7); g.stroke();
      } else if (hi === 1) {
        g.fillStyle = h.hair; g.beginPath(); g.moveTo(4.6, 5.4); g.quadraticCurveTo(10, 3.4, 13, 6); g.quadraticCurveTo(12.6, 11, 9.6, 12); g.quadraticCurveTo(10.4, 7.8, 5.4, 7); g.fill();
        g.fillStyle = 'rgba(30,20,15,.25)'; g.beginPath(); g.ellipse(4, 8, 7, 4, 0.3, 0, 7); g.fill();
        const fur = [[-9, -9], [-3, -11], [3, -11], [9, -9], [-11, -15], [-5, -18], [1, -19], [7, -18], [12, -14], [-8, -22], [-1, -24], [6, -23]];
        fur.forEach(([qx, qy]) => { g.fillStyle = '#2A1C14'; g.beginPath(); g.arc(qx, qy, 6, 0, 7); g.fill(); }); g.lineWidth = 2; g.strokeStyle = OL; g.beginPath(); g.moveTo(-15, -8); g.quadraticCurveTo(-16, -28, 0, -30); g.quadraticCurveTo(17, -28, 16, -7); g.stroke();
        fur.forEach(([qx, qy]) => { g.fillStyle = '#5B4232'; g.beginPath(); g.arc(qx + 1.4, qy - 1.6, 2.4, 0, 7); g.fill(); });
        g.fillStyle = '#1A110C'; rr(g, -14, -9.5, 29, 4.5, 2); g.fill();
      } else if (hi === 2) { // kurashchi: kalta soch, peshonabog', mo'ylov
        g.fillStyle = h.hair; g.beginPath(); g.moveTo(-11, 2); g.quadraticCurveTo(-13, -13, 0, -13.4); g.quadraticCurveTo(10, -13, 11, -5.5); g.quadraticCurveTo(4, -9.2, -3, -6.4); g.quadraticCurveTo(-7, -2, -11, 2); g.fill(); g.lineWidth = 1.6; g.strokeStyle = OL; g.stroke();
        g.fillStyle = '#16A34A'; g.beginPath(); g.moveTo(-11.6, -4.4); g.quadraticCurveTo(0, -10.4, 11.4, -6.2); g.lineTo(11, -3.6); g.quadraticCurveTo(0, -7.6, -11.4, -1.6); g.closePath(); g.fill(); g.lineWidth = 1.3; g.stroke();
        g.strokeStyle = '#16A34A'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-11, -2.6); g.quadraticCurveTo(-17 - sw * 6, 0, -20 - sw * 10, 6); g.stroke();
        g.fillStyle = h.hair; g.beginPath(); g.moveTo(4.4, 5.4); g.quadraticCurveTo(9, 3.6, 12.6, 6.2); g.quadraticCurveTo(12, 8.6, 10.6, 8.2); g.quadraticCurveTo(8.6, 6.4, 5, 7); g.fill();
      } else { // bahodir: soqol + oltin dubulg'a
        g.fillStyle = h.hair; g.beginPath(); g.moveTo(-6, 2); g.quadraticCurveTo(-5, 14, 3, 17); g.quadraticCurveTo(11, 16, 12.4, 7.6); g.quadraticCurveTo(9, 9.6, 5, 8.6); g.quadraticCurveTo(1, 7, -1, 4); g.fill(); g.lineWidth = 1.6; g.strokeStyle = OL; g.stroke();
        g.fillStyle = h.hair; g.beginPath(); g.moveTo(5, 5.2); g.quadraticCurveTo(10, 3.6, 13, 6.4); g.quadraticCurveTo(9, 6.2, 5, 7); g.fill();
        g.fillStyle = '#EAB308'; g.beginPath(); g.moveTo(-12, 2); g.lineTo(-12.4, -7); g.quadraticCurveTo(-11, -17, 0, -17.6); g.quadraticCurveTo(11, -17, 12, -6.5); g.lineTo(8, -6.8); g.quadraticCurveTo(2, -8, -5, -5); g.lineTo(-5, 3); g.closePath(); g.fill(); g.lineWidth = 2; g.strokeStyle = OL; g.stroke();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-3, -13, 5, 2.4, -0.3, 0, 7); g.fill();
        g.strokeStyle = '#A16207'; g.lineWidth = 2; g.beginPath(); g.moveTo(-12, -6.6); g.quadraticCurveTo(0, -10, 12, -6.6); g.stroke();
        g.fillStyle = '#FDE047'; g.beginPath(); g.arc(4, -10.5, 2.4, 0, 7); g.fill(); g.strokeStyle = '#FDE047'; g.lineWidth = 0.9; for (let r = 0; r < 8; r++) { const an = r * 0.785; g.beginPath(); g.moveTo(4 + Math.cos(an) * 3, -10.5 + Math.sin(an) * 3); g.lineTo(4 + Math.cos(an) * 4.8, -10.5 + Math.sin(an) * 4.8); g.stroke(); }
        g.fillStyle = '#EAB308'; g.beginPath(); g.moveTo(-4, -16.6); g.lineTo(0, -29); g.lineTo(4, -16.6); g.closePath(); g.fill(); g.lineWidth = 1.6; g.strokeStyle = OL; g.stroke(); g.strokeStyle = '#DC2626'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, -28); g.quadraticCurveTo(-5 - sw * 4, -25, -8 - sw * 7, -19 - Math.sin(now * 4)); g.stroke(); // o'tkir dubulg'a, kichik popuk
      }
      g.restore();
    }
    function drawF(f, now) {
      const h = f.h, o = f.P, hi = f.hi, sw = Math.max(-1, Math.min(1, -f.sv * f.face / 300)) + Math.sin(now * 2 + f.i) * 0.08;
      g.save(); g.translate(f.x, f.y); g.scale(f.face, 1); if (o.rot) { g.translate(0, o.ry); g.rotate(o.rot); } g.scale(h.w, h.h);
      g.lineJoin = 'round'; g.lineCap = 'round';
      const sl = Math.sin(o.ln), cl = Math.cos(o.ln), hx = o.hx, hy = o.hy, nx = hx + sl * 40, ny = hy - cl * 40, sx = hx + sl * 32, sy = hy - cl * 32;
      const fA = IK(sx + 2, sy, sx + o.fh[0], sy + o.fh[1], 22, 21, 1, J0), bA = IK(sx - 3, sy, sx + o.bh[0], sy + o.bh[1], 22, 21, 1, J1);
      const fL = IK(hx + 4, hy, o.ff[0], o.ff[1] - 4, 29, 28, -1, J2), bL = IK(hx - 4, hy, o.bf[0], o.bf[1] - 4, 29, 28, -1, J3);
      if (h.cape) { g.fillStyle = h.cape; g.beginPath(); g.moveTo(sx - 6, sy - 2); g.quadraticCurveTo(hx - 26 - sw * 18, hy + 10, hx - 24 - sw * 26, -6); g.lineTo(hx - 6, -8); g.quadraticCurveTo(hx - 4, hy, sx + 2, sy); g.fill(); g.lineWidth = 2.2; g.strokeStyle = OL; g.stroke(); }
      const dk = h.coat2, arm = hi === 3 ? h.skin : h.coat;
      limb(sx - 3, sy, bA[0], bA[1], bA[2], bA[3], hi === 3 ? '#C98F68' : dk, 10.5);
      if (hi === 3) { // qalqon
        g.save(); g.translate(bA[2], bA[3]); const sg = g.createRadialGradient(-3, -4, 1, 0, 0, 16); sg.addColorStop(0, '#FEF3C7'); sg.addColorStop(0.5, '#EAB308'); sg.addColorStop(1, '#A16207'); g.fillStyle = sg; g.beginPath(); g.ellipse(2, 0, 10, 16, 0, 0, 7); g.fill(); g.lineWidth = 2.4; g.strokeStyle = OL; g.stroke();
        g.strokeStyle = '#92400E'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(2, 0, 7, 12, 0, 0, 7); g.stroke(); g.fillStyle = '#B91C1C'; g.beginPath(); g.arc(2, 0, 3.4, 0, 7); g.fill(); g.restore();
      } else fist(bA[2], bA[3], h.skin);
      limb(hx - 4, hy, bL[0], bL[1], bL[2], bL[3], dk === h.coat2 ? shadeF(h.pants) : h.pants, 12); boot(bL[0], bL[1], bL[2], bL[3], h);
      limb(hx + 4, hy, fL[0], fL[1], fL[2], fL[3], h.pants, 12.5); boot(fL[0], fL[1], fL[2], fL[3], h);
      // to'n (chapan) / zirh
      const hem = h.hem, bx0 = hx - cl * 12, by0 = hy - sl * 12, fx0 = hx + cl * 13, fy0 = hy + sl * 13, hb = [hx - 15 - sw * 7 - (f.st === KI ? 6 : 0), hy + hem], hf = [hx + 15 - sw * 3 + (f.st === KI ? 12 : 0), hy + hem - (f.st === KI ? 10 : 0)];
      const body = () => { g.beginPath(); g.moveTo(sx - cl * 12, sy - sl * 12); g.lineTo(bx0, by0); g.lineTo(hb[0], hb[1]); g.quadraticCurveTo(hx, hy + hem + 4, hf[0], hf[1]); g.lineTo(fx0, fy0); g.quadraticCurveTo(sx + cl * 17, sy + sl * 17 + 4, nx + cl * 6, ny + sl * 6); g.lineTo(nx - cl * 7, ny - sl * 7); g.closePath(); };
      const gg = g.createLinearGradient(hx - 16, 0, hx + 18, 0); gg.addColorStop(0, h.coat2); gg.addColorStop(0.55, h.coat); gg.addColorStop(1, h.coat2);
      body(); g.fillStyle = gg; g.fill(); g.save(); g.clip();
      if (hi === 3) { g.strokeStyle = 'rgba(120,70,10,.6)'; g.lineWidth = 1.1; for (let yy = ny - 4; yy < hy + 2; yy += 5) for (let xx = hx - 20; xx < hx + 24; xx += 6) { g.beginPath(); g.arc(xx + ((yy / 5) % 2) * 3, yy, 3, 0, Math.PI); g.stroke(); } g.fillStyle = '#7F1D1D'; g.fillRect(hx - 30, hy + 2, 60, 40); g.fillStyle = '#991B1B'; for (let xx = hx - 22; xx < hx + 22; xx += 7) { g.fillRect(xx, hy + 2, 5, hem); } g.fillStyle = '#FDE047'; for (let xx = hx - 22; xx < hx + 22; xx += 7) g.fillRect(xx, hy + hem - 4, 5, 3); }
      else { g.strokeStyle = h.str; g.globalAlpha = 0.55; g.lineWidth = 2.2; for (let xx = hx - 24; xx < hx + 26; xx += 7) { g.beginPath(); for (let yy = ny - 6; yy < hy + hem + 6; yy += 6) g.lineTo(xx + ((yy / 6) % 2 ? 1.6 : -1.6) + sl * (yy - hy) * -1, yy); g.stroke(); } g.globalAlpha = 1;
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(hx - 30, hy + hem - 5, 60, 6); }
      g.restore(); body(); g.lineWidth = 2.6; g.strokeStyle = OL; g.stroke();
      if (hi !== 3) { g.strokeStyle = h.trim; g.lineWidth = 2.2; g.beginPath(); g.moveTo(nx + cl * 5, ny + sl * 5); g.quadraticCurveTo(sx + cl * 14, sy + sl * 14 + 6, fx0 - 2, fy0 + 2); g.lineTo(hf[0] - 1, hf[1] - 2); g.stroke(); g.beginPath(); g.moveTo(hb[0] + 2, hb[1] - 1.5); g.quadraticCurveTo(hx, hy + hem + 2.5, hf[0] - 1, hf[1] - 1.5); g.stroke(); }
      // kamar
      g.strokeStyle = OL; g.lineWidth = 9; g.beginPath(); g.moveTo(bx0 + sl * 2, by0 - cl * 2); g.lineTo(fx0 + sl * 2, fy0 - cl * 2); g.stroke(); g.strokeStyle = h.belt; g.lineWidth = 6; g.stroke();
      if (hi === 1) { g.strokeStyle = '#B91C1C'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(bx0 + sl * 2, by0 - cl * 2); g.lineTo(fx0 + sl * 2, fy0 - cl * 2); g.stroke(); g.strokeStyle = h.belt; g.lineWidth = 4; g.beginPath(); g.moveTo(hx - 8, hy + 2); g.lineTo(hx - 14 - sw * 6, hy + 18); g.stroke(); }
      g.fillStyle = h.buckle; g.beginPath(); g.arc(fx0 - cl * 3 + sl * 2, fy0 - sl * 3 - cl * 2, 3.4, 0, 7); g.fill(); g.lineWidth = 1.4; g.strokeStyle = OL; g.stroke();
      if (hi === 3) { g.fillStyle = '#FDE047'; g.beginPath(); g.ellipse(sx + cl * 2, sy - 1, 9, 6, o.ln, 0, 7); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OL; g.stroke(); }
      // bo'yin va bosh
      const ha = o.ln + o.hd, hcx = nx + Math.sin(ha) * 11, hcy = ny - Math.cos(ha) * 11;
      g.strokeStyle = OL; g.lineWidth = 10; g.beginPath(); g.moveTo(nx, ny + 2); g.lineTo(hcx, hcy); g.stroke(); g.strokeStyle = h.skin; g.lineWidth = 7; g.stroke();
      head(hi, hcx, hcy, ha * 0.7, o.eye, now, sw);
      // oldingi qo'l
      limb(sx + 2, sy, fA[0], fA[1], fA[2], fA[3], arm, 11);
      if (hi === 3) { g.strokeStyle = '#EAB308'; g.lineWidth = 6; g.beginPath(); const ux = fA[2] - fA[0], uy = fA[3] - fA[1]; g.moveTo(fA[0] + ux * 0.35, fA[1] + uy * 0.35); g.lineTo(fA[0] + ux * 0.8, fA[1] + uy * 0.8); g.stroke(); }
      else { g.strokeStyle = h.trim; g.lineWidth = 3; g.beginPath(); const ux = fA[2] - fA[0], uy = fA[3] - fA[1]; g.moveTo(fA[0] + ux * 0.74, fA[1] + uy * 0.74); g.lineTo(fA[0] + ux * 0.8, fA[1] + uy * 0.8); g.stroke(); }
      fist(fA[2], fA[3], h.skin);
      g.restore();
    }
    function shadeF(hex) { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, v - 28); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
    // ---- HUD ----
    function portrait(i, x, y, r, mir, now) {
      const f = F[i]; g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); const bg = g.createRadialGradient(x, y - r * 0.3, 2, x, y, r); bg.addColorStop(0, f.h.aura); bg.addColorStop(1, '#1E1B4B'); g.fillStyle = bg; g.fill(); g.clip();
      g.translate(x, y + r * 0.28); g.scale((mir ? -1 : 1) * r / 15, r / 15); head(f.hi, 0, 0, 0, f.st === KO || f.out ? 2 : f.st === HT ? 1 : 0, now, 0); g.restore();
      g.lineWidth = 3; g.strokeStyle = ctx.col[i]; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x, y, r - 2.2, 0, 7); g.stroke();
      if (f.out || f.st === KO) { g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    }
    function bar(x, y, w, h, f, rev, now) {
      g.fillStyle = 'rgba(10,8,25,.75)'; rr(g, x - 2, y - 2, w + 4, h + 4, 4); g.fill();
      const hp = Math.max(0, f.hp) / 100, gh = Math.max(hp, f.ghp / 100), X = (v) => (rev ? x + w - w * v : x);
      g.fillStyle = '#F8FAFC'; g.globalAlpha = 0.85; g.fillRect(X(gh), y, w * gh, h); g.globalAlpha = 1; g.fillStyle = '#DC2626'; g.fillRect(X(gh), y, w * gh, h);
      const low = hp < 0.3, gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, low ? '#FCA5A5' : '#FEF08A'); gr.addColorStop(0.5, low ? '#EF4444' : '#FACC15'); gr.addColorStop(1, low ? '#991B1B' : '#CA8A04');
      g.fillStyle = gr; g.globalAlpha = low ? 0.75 + 0.25 * Math.sin(now * 12) : 1; g.fillRect(X(hp), y, w * hp, h); g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(X(hp), y + 1, w * hp, h * 0.3);
      g.strokeStyle = '#FDE68A'; g.lineWidth = 1.4; rr(g, x - 1, y - 1, w + 2, h + 2, 3); g.stroke();
    }
    function meter(x, y, w, h, f, rev, now) {
      g.fillStyle = 'rgba(10,8,25,.7)'; rr(g, x - 1, y - 1, w + 2, h + 2, 3); g.fill(); const v = Math.min(100, f.sp) / 100, full = v >= 1;
      const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, full ? '#FDE047' : '#1D4ED8'); gr.addColorStop(1, full ? '#FB923C' : '#22D3EE'); g.fillStyle = gr;
      if (full) { g.shadowColor = '#FDE047'; g.shadowBlur = 8 + 6 * Math.sin(now * 10); } g.fillRect(rev ? x + w - w * v : x, y, w * v, h); g.shadowBlur = 0;
      g.fillStyle = 'rgba(0,0,0,.5)'; for (let k = 1; k < 4; k++) g.fillRect(x + (w * k) / 4 - 0.5, y, 1, h);
    }
    const pips = (x, y, n, rev) => { for (let k = 0; k < WIN; k++) { const px = x + (rev ? -k : k) * 13; g.fillStyle = 'rgba(10,8,25,.7)'; g.beginPath(); g.arc(px, y, 5.5, 0, 7); g.fill(); if (k < n) { g.fillStyle = '#FACC15'; g.beginPath(); g.arc(px, y, 4.2, 0, 7); g.fill(); g.fillStyle = '#FFF'; g.beginPath(); g.arc(px - 1.2, y - 1.2, 1.3, 0, 7); g.fill(); } g.strokeStyle = '#FDE68A'; g.lineWidth = 1; g.beginPath(); g.arc(px, y, 5.5, 0, 7); g.stroke(); } };
    const label = (s, x, y, size, col, al) => { g.font = `italic 900 ${size}px ${FONT}`; g.textAlign = al; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = 'rgba(10,6,20,.85)'; g.lineJoin = 'round'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); };
    function timerBox(x, y, now) {
      g.save(); g.translate(x, y); g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; g.lineTo(Math.cos(a) * 21, Math.sin(a) * 21); } g.closePath();
      const gr = g.createLinearGradient(0, -21, 0, 21); gr.addColorStop(0, '#3B2A6B'); gr.addColorStop(1, '#120B2E'); g.fillStyle = gr; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#FACC15'; g.stroke(); g.restore();
      label(String(Math.max(0, Math.ceil(tmr))), x, y + 1, 18, tmr <= 10 && ph === 2 && Math.sin(now * 10) > 0 ? '#F87171' : '#FFF', 'center');
    }
    function hud(W, now) {
      if (!FFA) {
        const bw = Math.max(60, W / 2 - 92);
        [0, 1].forEach((i) => { const f = F[i], rev = i === 1, px = rev ? W - 30 : 30, bx = rev ? W / 2 + 32 : 58;
          portrait(i, px, 30, 22, rev, now); bar(bx, 13, bw, 13, f, rev, now); meter(rev ? bx + bw * 0.35 : bx, 31, bw * 0.65, 5, f, rev, now);
          const nm = hname(i).toUpperCase(), pn = ''; label(nm, rev ? bx + bw : bx, 47, 13, '#FFF', rev ? 'right' : 'left');
          g.font = `700 11px ${FONT}`; const nw = g.measureText(nm).width; label(pn, rev ? bx + bw - nw * 1.18 - 8 : bx + nw * 1.18 + 8, 47.5, 10, i === ME ? '#FDE047' : 'rgba(255,255,255,.75)', rev ? 'right' : 'left');
          pips(rev ? W / 2 + 14 : W / 2 - 14, 60, wins[i], !rev); });
        timerBox(W / 2, 27, now); return 70;
      }
      const cols = W >= 620 ? N : 2, rows = Math.ceil(N / cols), pw = (W - 16 - (cols - 1) * 8) / cols;
      F.forEach((f, i) => { const cx = 8 + (i % cols) * (pw + 8), cy = 6 + Math.floor(i / cols) * 46, rev = cols === 2 && i % 2 === 1;
        g.fillStyle = 'rgba(15,10,40,.45)'; rr(g, cx, cy, pw, 42, 10); g.fill(); if (i === ME) { g.strokeStyle = ctx.col[i]; g.lineWidth = 1.5; rr(g, cx, cy, pw, 42, 10); g.stroke(); }
        const px = rev ? cx + pw - 21 : cx + 21, bx = rev ? cx + 8 : cx + 42, bw = pw - 52;
        portrait(i, px, cy + 21, 16, rev, now); bar(bx, cy + 7, bw, 9, f, rev, now); meter(bx, cy + 20, bw, 3.5, f, rev, now);
        label(Array.from(hname(i)).slice(0, Math.max(6, Math.floor(bw / 6.5))).join(''), rev ? bx + bw : bx, cy + 32, 10, i === ME ? '#FDE047' : '#FFF', rev ? 'right' : 'left'); pips(rev ? bx + 6 : bx + bw - 6, cy + 32, wins[i], !rev); });
      const ty = 6 + rows * 46 + 22; timerBox(W / 2, ty, now); return ty + 22;
    }
    function banner(txt, y, size, age, c1, c2) {
      if (age < 0) return; const W = c.W, sc = age < 0.16 ? 2.4 - 1.4 * (age / 0.16) : 1 + Math.max(0, 0.04 - (age - 0.16) * 0.1);
      g.save(); g.translate(W / 2, y); g.scale(sc, sc); g.globalAlpha = Math.min(1, age * 7); g.font = `italic 900 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineJoin = 'round'; g.lineWidth = size * 0.2; g.strokeStyle = '#1A0B05'; g.strokeText(txt, 0, 0); g.lineWidth = size * 0.07; g.strokeStyle = '#FFF7D6'; g.strokeText(txt, 0, 0);
      const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); gr.addColorStop(0, '#FFFBEB'); gr.addColorStop(0.35, c1); gr.addColorStop(0.7, c2); gr.addColorStop(1, '#7C2D12');
      g.shadowColor = c2; g.shadowBlur = 24; g.fillStyle = gr; g.fillText(txt, 0, 0); g.restore();
    }
    // ---- asosiy sikl ----
    const cam = { x: 0, vw: 520 }; let prevCam = 0;
    const stop = loop((dt) => {
      const now = performance.now() / 1000, W = c.W, Hc = c.H;
      // kirish
      let jx = pad.x, jy = pad.y; const K = keysDown; if (K.has('arrowleft') || K.has('a')) jx = -1; if (K.has('arrowright') || K.has('d')) jx = 1; if (K.has('arrowup') || K.has('w')) jy = -1; if (K.has('arrowdown') || K.has('s')) jy = 1;
      if (pad.take('p')) my.p++; if (pad.take('k')) my.k++; if (pad.take('s')) my.s++; my.x = jx; my.y = jy; my.b = pad.b.b || K.has('l') || K.has('c') || K.has('shift') ? 1 : 0;
      sendT += dt; if (HG.link.st.alive) aliveT += dt;
      if (HG.HOST && HG.link.st.alive && !ended) {
        if (!started) { started = aliveT > 5 || ctx.active().every((s) => s === 0 || ctx.bots?.has(s) || got.has(s)); if (started) { ph = 1; pt = 0; } }
        else {
          pt += dt; let sdt = dt * (ph === 3 && rk === 0 && pt < 1.3 ? 0.3 : 1); if (hs > 0) { hs -= dt; sdt = 0; }
          if (ph === 1 && pt > 1.6) { ph = 2; pt = 0; }
          if (ph === 3 && pt > 2.6) { ph = 4; pt = 0; if (rw >= 0) { const f = F[rw]; f.st = WN; f.tt = 0; f.vx = 0; } }
          if (ph === 4 && pt > 2.3) {
            const best = Math.max(...wins), lead = wins.filter((w) => w === best).length === 1 ? wins.indexOf(best) : -1;
            if (rw >= 0 && wins[rw] >= WIN) { ph = 5; ended = true; HG.end(rw); } else if (rn >= 5) { ph = 5; ended = true; HG.end(lead >= 0 ? lead : ctx.DRAW); } else { rn++; reset(); ph = 1; pt = 0; }
          }
          const IN = F.map((f, i) => { const q = f.out ? ZERO : i === 0 ? (ctx.me === 0 ? my : ZERO) : ctx.bots?.has(i) ? botIn(i, dt) : gin[i]; if (q !== ZERO) { const sv = seen[i]; for (const k of 'pks') if (q[k] > sv[k]) { sv[k] = q[k]; if (ph === 2) { f.buf = k; f.bufT = 0.3; } } } return q; });
          if (sdt > 0) {
            clock += sdt; F.forEach((f, i) => { if (ph !== 4 || i !== rw) upd(f, IN[i], sdt, ph === 2); else { f.tt += sdt; } });
            for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) { const A = F[a], B = F[b]; if (A.out || B.out || A.st >= DN || B.st >= DN || (A.st === SC && A.hi === 1) || (B.st === SC && B.hi === 1)) continue; const dx = B.x - A.x; if (Math.abs(dx) < 36 && Math.abs(A.y - B.y) < 90) { const o = (36 - Math.abs(dx)) / 2 * (Math.sign(dx) || 1); A.x -= o; B.x += o; } }
            F.forEach((f) => (f.x = Math.max(-HW + 22, Math.min(HW - 22, f.x))));
            for (const q of PR) { q.t += sdt; q.x += q.d * (q.k ? 430 : 560) * sdt; for (const T of F) { if (T.i === q.o || q.hm & (1 << T.i)) continue; const okY = q.k ? q.y > T.y - 145 && q.y < T.y + 30 : T.y > -40; if (Math.abs(T.x - q.x) < 38 && okY) { q.hm |= 1 << T.i; hit(F[q.o], T, q.k ? 15 : 18, q.k ? 300 : 200, 0.4, 1, q.k ? q.y : T.y - 30, q.d, 1, 1); } } }
            PR = PR.filter((q) => q.t < (q.k ? 1.3 : 0.78) && Math.abs(q.x) < HW + 60);
            if (ph === 2) { tmr -= sdt; if (tmr <= 0) { tmr = 0; const al = alive(), mx = Math.max(...al.map((f) => f.hp)), top = al.filter((f) => f.hp === mx); endRound(top.length === 1 ? top[0].i : -1, top.length === 1 ? 1 : 2); } }
            if (ph === 2 && FFA && alive().length <= 1) endRound(alive()[0]?.i ?? -1, 0);
          }
        }
        if (sendT > 0.05) { sendT = 0; ctx.rt?.send({ t: 's', f: F.map((f) => [Math.round(f.x), Math.round(f.y), f.face, Math.ceil(f.hp), Math.floor(f.sp), f.st, Math.round(f.tt * 100), f.ci, f.cmb, f.out, f.cr]), p: PR.map((q) => [q.k, Math.round(q.x), Math.round(q.y), q.d]), g: [ph, Math.round(pt * 100), rn, Math.ceil(tmr), rw, rk, koI], w: wins, e: EV }); EV = []; }
      } else if (!HG.HOST && ctx.me >= 0 && sendT > 0.033) { sendT = 0; ctx.rt?.send({ t: 'i', x: Math.round(my.x * 100) / 100, y: Math.round(my.y * 100) / 100, p: my.p, k: my.k, s: my.s, b: my.b }); }
      let PV = PR;
      if (!HG.HOST && HG.snap) {
        const S = HG.snap, pv = HG.prevS(), el = (performance.now() - snapAt) / 1000;
        S.f.forEach((q, i) => { const f = F[i]; if (!f) return; const p = pv?.f?.[i]; f.x = HG.lerp(p ? p[0] : q[0], q[0], 50); f.y = HG.lerp(p ? p[1] : q[1], q[1], 50); f.face = q[2]; f.hp = q[3]; f.sp = q[4]; f.st = q[5]; f.tt = q[6] / 100 + el; f.ci = q[7]; f.cmb = q[8]; f.out = q[9]; f.cr = q[10]; });
        ph = S.g[0]; pt = S.g[1] / 100 + el; rn = S.g[2]; tmr = S.g[3]; rw = S.g[4]; rk = S.g[5]; koI = S.g[6]; wins = S.w; PV = (S.p || []).map((q) => ({ k: q[0], x: q[1] + q[3] * (q[0] ? 430 : 560) * Math.min(el, 0.1), y: q[2], d: q[3] }));
      }
      // holat o'zgarishlari: tovush, kombo
      if (ph !== lastPh) { if (ph === 1) { snd(196, 0.8, 0.09, 'triangle'); snd(392, 0.5, 0.05, 'sine'); } if (ph === 2) { snd(523, 0.12, 0.08, 'square'); setTimeout(() => snd(784, 0.3, 0.08, 'square'), 120); } if (ph === 4 && rw >= 0) [523, 659, 784, 1046].forEach((fq, k) => setTimeout(() => snd(fq, 0.18, 0.06, 'triangle'), k * 110)); lastPh = ph; banT = 0; }
      banT += dt;
      F.forEach((f) => { if (f.st !== f.pst) { if (f.st >= PU && f.st <= UP) snd(260 + Math.random() * 80, 0.07, 0.03, 'triangle'); f.pst = f.st; } if (f.cmb > f.pcmb && f.cmb >= 2) f.cmbS = 1.3; f.pcmb = f.cmb; f.cmbS -= dt; f.sv += ((f.x - f.px) / Math.max(dt, 0.001) - f.sv) * Math.min(1, dt * 8); f.px = f.x; f.ghp = f.ghp > f.hp ? Math.max(f.hp, f.ghp - dt * (f.st === HT || f.st === DN ? 4 : 30)) : f.hp;
        if (f.st === SC && f.hi === 1 && f.tt > 0.15 && f.tt < 0.5) for (let k = 0; k < 3; k++) pp(f.x + (Math.random() - 0.5) * 30, f.y - 20 - Math.random() * 90, -f.face * (60 + Math.random() * 200), -40 - Math.random() * 120, 0.4, 9 + Math.random() * 8, Math.random() < 0.5 ? '#FB923C' : '#FDE047', 3, -200);
        if (f.st === SC && f.tt < SPD[f.hi][1] && Math.random() < 0.6) pp(f.x + (Math.random() - 0.5) * 50, f.y - Math.random() * 120, 0, -80, 0.5, 3, f.h.aura, 1, -50); });
      if (spB && ME >= 0 && F[ME]) { const r = F[ME].sp >= 100; if (r !== spB._r) { spB._r = r; spB.classList.toggle('rdy', r); } }
      // kamera
      let mn = 1e9, mx = -1e9; F.forEach((f) => { if (!f.out) { mn = Math.min(mn, f.x); mx = Math.max(mx, f.x); } }); if (mn > mx) { mn = -200; mx = 200; }
      let tcx = (mn + mx) / 2, vw = Math.max(FFA ? 480 : 420, mx - mn + 200);
      if (ph === 3 && rk === 0 && koI >= 0 && pt < 1.7 && F[koI]) { tcx = F[koI].x; vw = Math.max(320, vw * 0.7); }
      cam.x += (tcx - cam.x) * Math.min(1, dt * 5); cam.vw += (vw - cam.vw) * Math.min(1, dt * (vw > cam.vw ? 7 : 2.5));
      const s = Math.min(W / cam.vw, Hc / 360), half = W / 2 / s; cam.x = half > HW + 110 ? 0 : Math.max(-HW - 110 + half, Math.min(HW + 110 - half, cam.x));
      const gy = Hc - Math.max(26, Hc * 0.1), hz = gy - 34 * s; buildBG(W, Hc, s);
      shake = Math.max(0, shake - dt * 40); const shx = (Math.random() - 0.5) * shake, shy = (Math.random() - 0.5) * shake;
      // fon
      g.drawImage(sky, 0, 0, W, Hc); g.save(); g.translate(shx * 0.3, shy * 0.3);
      const lay = (Lc, p, by, z) => { const q = s * z; g.drawImage(Lc, W / 2 + (-Lc.LW / 2 - cam.x * p) * q, by - Lc.LH * q, Lc.LW * q, Lc.LH * q); };
      lay(Lfar, 0.08, hz - 30 * s, 0.6); lay(Lmid, 0.22, hz - 12 * s, 0.74); lay(Lfor, 0.45, hz + 4 * s, 0.86); g.restore();
      const gg = g.createLinearGradient(0, hz, 0, Hc); gg.addColorStop(0, '#C9CFEA'); gg.addColorStop(0.3, '#AEB6DA'); gg.addColorStop(1, '#6F79A8'); g.fillStyle = gg; g.fillRect(0, hz, W, Hc - hz);
      g.save(); g.translate(W / 2 - cam.x * s + shx, gy + shy); g.scale(s, s);
      g.drawImage(Lgnd, -Lgnd.LW / 2, -34 - 34, Lgnd.LW, Lgnd.LH);
      const sun = g.createRadialGradient(0, 0, 10, 0, 0, HW); sun.addColorStop(0, 'rgba(255,190,150,.22)'); sun.addColorStop(1, 'rgba(255,190,150,0)'); g.fillStyle = sun; g.beginPath(); g.ellipse(0, 6, HW, 26, 0, 0, 7); g.fill();
      // fonarlar
      for (const lx of LANT) { g.fillStyle = '#2B1D14'; g.fillRect(lx - 3, -128, 6, 100); g.fillRect(lx - 3, -128, 26, 5); g.strokeStyle = '#2B1D14'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(lx + 18, -123); g.lineTo(lx + 18, -114); g.stroke(); g.fillStyle = '#F8FAFC'; g.fillRect(lx - 6, -131, 32, 3);
        const fl = 0.8 + Math.sin(now * 9 + lx) * 0.08 + Math.sin(now * 23 + lx * 3) * 0.05; g.fillStyle = '#7C2D12'; rr(g, lx + 11, -115, 14, 20, 5); g.fill(); g.fillStyle = `rgba(255,${170 + 40 * fl | 0},90,${fl})`; rr(g, lx + 12.5, -113, 11, 16, 4); g.fill(); g.strokeStyle = '#7C2D12'; g.lineWidth = 1; g.beginPath(); g.moveTo(lx + 18, -113); g.lineTo(lx + 18, -97); g.stroke();
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 * fl; g.drawImage(glow, lx + 18 - 70, -105 - 70, 140, 140); g.globalAlpha = 0.18 * fl; g.drawImage(glow, lx + 18 - 60, -40, 120, 70); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      // chegaradagi qoyalar
      for (const sd of [-1, 1]) { const rx = sd * (HW + 26); g.fillStyle = '#3F4560'; g.beginPath(); g.moveTo(rx - 50, 8); g.lineTo(rx - 40, -60); g.lineTo(rx - 8, -96); g.lineTo(rx + 30, -84); g.lineTo(rx + 52, -30); g.lineTo(rx + 56, 8); g.fill(); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); g.fillStyle = '#585F80'; g.beginPath(); g.moveTo(rx - 40, -60); g.lineTo(rx - 8, -96); g.lineTo(rx + 2, -40); g.lineTo(rx - 30, 0); g.fill(); g.fillStyle = '#F1F5FF'; g.beginPath(); g.moveTo(rx - 42, -56); g.lineTo(rx - 8, -96); g.lineTo(rx + 30, -84); g.lineTo(rx + 34, -74); g.quadraticCurveTo(rx, -80, rx - 42, -56); g.fill(); }
      // soyalar va jangchilar
      const ord = F.slice().sort((a, b) => (a.st >= DN ? 0 : a.st >= PU && a.st <= SC ? 2 : 1) - (b.st >= DN ? 0 : b.st >= PU && b.st <= SC ? 2 : 1));
      for (const f of ord) { if (f.out && f.st !== KO) continue; const k = Math.max(0.35, 1 + f.y / 260); g.fillStyle = 'rgba(20,20,50,.35)'; g.beginPath(); g.ellipse(f.x, 2, 34 * k * f.h.w, 7 * k, 0, 0, 7); g.fill(); if (!f.out) { g.strokeStyle = ctx.col[f.i]; g.globalAlpha = 0.65; g.lineWidth = 2.5; g.beginPath(); g.ellipse(f.x, 2, 30 * k, 6 * k, 0, 0, 7); g.stroke(); g.globalAlpha = 1; } }
      for (const f of ord) { if (f.out && f.st !== KO) continue; pose(f, now); if (f.st === SC && f.tt < SPD[f.hi][1] + 0.1) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(glow, f.x - 80, f.y - 150, 160, 170); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } g.globalAlpha = f.out ? 0.4 : 1; drawF(f, now); g.globalAlpha = 1; }
      // snaryadlar
      for (const q of PV) {
        if (q.k === 0) { for (let k = 0; k < 4; k++) { const rx = q.x - q.d * k * 20, ht = 34 - k * 7; g.fillStyle = k % 2 ? '#57534E' : '#78716C'; g.beginPath(); g.moveTo(rx - 12, 4); g.lineTo(rx - 3 + q.d * 2, -ht); g.lineTo(rx + 4, -ht * 0.6); g.lineTo(rx + 12, 4); g.fill(); g.lineWidth = 2; g.strokeStyle = OL; g.stroke(); g.fillStyle = '#F1F5FF'; g.beginPath(); g.moveTo(rx - 5, -ht * 0.75); g.lineTo(rx - 3 + q.d * 2, -ht); g.lineTo(rx + 2, -ht * 0.7); g.fill(); }
          g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6; g.drawImage(glow, q.x - 50, -40, 100, 60); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; if (Math.random() < 0.7) dust(q.x, 0, 1); }
        else { g.save(); g.translate(q.x, q.y + 30); for (let k = 0; k < 7; k++) { const yy = -k * 13, rx = 10 + k * 6, off = Math.sin(now * 14 + k) * 6; g.strokeStyle = `rgba(${200 + k * 7},250,255,${0.85 - k * 0.07})`; g.lineWidth = 3.2 - k * 0.25; g.beginPath(); g.ellipse(off, yy, rx, 4 + k * 0.6, 0, now * 9 + k, now * 9 + k + 4.6); g.stroke(); } g.restore();
          if (Math.random() < 0.8) pp(q.x + (Math.random() - 0.5) * 50, q.y + 30 - Math.random() * 90, q.d * 100 + (Math.random() - 0.5) * 140, -60, 0.4, 2.5, '#E0F2FE', 1, 0); }
      }
      // zarrachalar
      for (let pass = 0; pass < 2; pass++) { if (pass) g.globalCompositeOperation = 'lighter'; for (const p of PT) { const add = p.t === 0 || p.t === 1 || p.t === 3; if (add !== !!pass) continue; const k = p.l / p.m; g.globalAlpha = Math.max(0, Math.min(1, k * (p.t === 2 ? 0.7 : 1)));
        if (p.t === 0) { g.strokeStyle = p.c; g.lineWidth = p.s; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); g.stroke(); }
        else if (p.t === 4) { g.fillStyle = p.c; g.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
        else { g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.t === 2 ? p.s * (1.6 - k * 0.6) : p.t === 3 ? p.s * k : p.s, 0, 7); g.fill(); } } g.globalAlpha = 1; } g.globalCompositeOperation = 'source-over';
      for (let i = PT.length - 1; i >= 0; i--) { const p = PT[i]; p.l -= dt; if (p.l <= 0) { PT.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t === 0 || p.t === 2) { p.vx *= 1 - dt * 3; } if (p.t === 4 && p.y > 0) { p.y = 0; p.vy *= -0.3; p.vx *= 0.6; } }
      for (let i = RG.length - 1; i >= 0; i--) { const r = RG[i]; r.t += dt; if (r.t > r.m) { RG.splice(i, 1); continue; } const k = r.t / r.m; g.globalAlpha = 1 - k; g.strokeStyle = r.c; g.lineWidth = r.w * (1 - k) + 1; g.beginPath(); g.arc(r.x, r.y, r.r * (0.3 + k), 0, 7); g.stroke();
        if (r.ray) { g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 16; q++) { const a = q * 0.3927 + now; g.beginPath(); g.moveTo(r.x + Math.cos(a) * 30, r.y + Math.sin(a) * 30); g.lineTo(r.x + Math.cos(a) * r.r * 1.3 * (0.4 + k), r.y + Math.sin(a) * r.r * 1.3 * (0.4 + k)); g.stroke(); } g.globalCompositeOperation = 'source-over'; } g.globalAlpha = 1; }
      // "SIZ" belgisi va kombo
      F.forEach((f) => { if (f.out) return; const top = f.y - (f.st === CR || f.st === SW ? 92 : 150) * f.h.h - 6;
        if (f.i === ME && f.st < DN) { const bob = Math.sin(now * 5) * 3; g.fillStyle = ctx.col[f.i]; g.beginPath(); g.moveTo(f.x - 7, top - 10 + bob); g.lineTo(f.x + 7, top - 10 + bob); g.lineTo(f.x, top + bob); g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke(); g.save(); g.translate(f.x, top - 20 + bob); g.scale(1 / s, 1 / s); label(fgt('you'), 0, 0, 12, '#fff', 'center'); g.restore(); }
        if (f.cmbS > 0 && f.cmb >= 2) { g.save(); g.translate(f.x, top - (f.i === ME ? 40 : 18)); const sc = (1 + Math.max(0, f.cmbS - 1.1) * 3) / s; g.scale(sc, sc); g.globalAlpha = Math.min(1, f.cmbS * 2); label(fgt('hits').replace('{n}', f.cmb), 0, 0, 18, '#FDE047', 'center'); g.restore(); g.globalAlpha = 1; } });
      g.restore();
      // qor
      const dcx = (cam.x - prevCam) * s; prevCam = cam.x; g.fillStyle = '#FFFFFF';
      for (const fl of flakes) { fl.y += (0.035 + 0.05 * fl.z) * dt; fl.x += (Math.sin(now * 0.8 + fl.p) * 0.012 * fl.z) * dt - (dcx * fl.z * 0.6) / W; if (fl.y > 1.02) { fl.y = -0.02; fl.x = Math.random(); } fl.x = ((fl.x % 1) + 1) % 1; g.globalAlpha = 0.35 + 0.45 * (fl.z - 0.4); g.beginPath(); g.arc(fl.x * W, fl.y * Hc, fl.z * 1.7, 0, 7); g.fill(); } g.globalAlpha = 1;
      g.drawImage(vig, 0, 0, W, Hc);
      // KO: sekin harakat — kino chiziqlari
      if (ph === 3 && rk === 0) { const k = Math.min(1, pt * 4) * (pt < 2.2 ? 1 : Math.max(0, 1 - (pt - 2.2) * 3)), bh = Hc * 0.07 * k; g.fillStyle = '#000'; g.fillRect(0, 0, W, bh); g.fillRect(0, Hc - bh, W, bh); }
      if (flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(1, flash) * 0.85})`; g.fillRect(0, 0, W, Hc); flash -= dt * 2.4; }
      const hb = hud(W, now);
      const bs = Math.min(W * 0.15, 78), by = Math.max(hb + bs * 0.8, Hc * 0.36);
      if (ph === 0 || !HG.link.st.alive) label(rt('wait_rt'), W / 2, by, 16, '#fff', 'center');
      else if (ph === 1) { const fin = wins.filter((w) => w === WIN - 1).length >= 2; banner(fin ? fgt('final') : fgt('round').replace('{n}', rn), by, fin ? bs * 0.62 : bs, banT, '#FDE68A', '#F59E0B'); }
      else if (ph === 2 && pt < 0.9) banner(fgt('fight'), by, bs * 1.15, pt, '#FECACA', '#EF4444');
      else if (ph === 3) banner(rk === 0 ? fgt('ko') : rk === 1 ? fgt('time') : fgt('draw'), by, bs * (rk === 0 ? 1.4 : 1), banT, rk === 0 ? '#FECACA' : '#BFDBFE', rk === 0 ? '#DC2626' : '#3B82F6');
      else if (ph >= 4) { if (rw >= 0) { banner(hname(rw).toUpperCase(), by - bs * 0.3, bs * 0.7, banT, '#FDE68A', '#F59E0B'); banner(fgt('wins'), by + bs * 0.45, bs * 0.62, banT - 0.15, '#FEF3C7', '#EAB308'); label(String(ctx.names[rw] || ''), W / 2, by + bs * 1.05, 14, rw === ME ? '#FDE047' : '#fff', 'center'); } else banner(fgt('draw'), by, bs, banT, '#BFDBFE', '#3B82F6'); }
      if (spT > 0) { spT -= dt; g.globalAlpha = Math.min(1, spT * 3); label(spTxt, W / 2, hb + 14, 15, spCol, 'center'); g.globalAlpha = 1; }
      if (HG.link.lost() && !HG.over) label(rt('lost'), W / 2, Hc * 0.6, 14, '#FCA5A5', 'center');
    });
    return {
      apply: () => false, rt: (sd, d) => HG.link.recv(d, sd), resize: () => { fit(); skyK = ''; },
      stop: () => { stop(); removeEventListener('keydown', kd); },
      quit: (s) => { const f = F[s]; if (!f || !HG.HOST) return; f.out = 1; f.hp = 0; f.st = KO; const act = ctx.active(); if (act.length <= 1 && !ended) { ended = true; ph = 5; HG.end(act.length ? act[0] : ctx.DRAW); } else if (ph === 2 && alive().length <= 1) endRound(alive()[0]?.i ?? -1, 0); },
    };
  };

  /* ================= Bilyard (8-pool: 2 kishi; 3–4 kishi — ochkoli variant) ================= */
  MPL.push({ id: 'pool', e: '🎱', c: ['#0F766E', '#7C2D12'], bot: 1, n: { uz: 'Bilyard', ru: 'Бильярд', en: 'Billiards' } });
  const POOL_T = {
    uz: { solids: 'Yaxlitlar', stripes: 'Yo‘lli', open: 'Stol ochiq', foul: 'Qoidabuzarlik!', scratch: 'Oq shar tushib ketdi', nohit: 'Hech bir sharga tegmadi', wrong: 'Avval noto‘g‘ri shar', norail: 'Bortga tegmadi', bih: 'Oq sharni sudrab joylang', aim: 'Nishonga oling, o‘ngdagi kiyni pastga torting', you: 'Siz', brk: 'Boshlang‘ich zarba', again: 'Yana siz!', spin: 'Aylanish', pts: 'ochko', eight: '8-shar!', early8: '8-shar erta tushdi', kitchen: 'Oq sharni chiziq ortiga qo‘ying' },
    ru: { solids: 'Сплошные', stripes: 'Полосатые', open: 'Стол открыт', foul: 'Фол!', scratch: 'Биток в лузе', nohit: 'Не задет ни один шар', wrong: 'Сначала задет не тот шар', norail: 'Нет касания борта', bih: 'Перетащите биток', aim: 'Цельтесь и тяните кий справа вниз', you: 'Вы', brk: 'Разбой', again: 'Ещё удар!', spin: 'Винт', pts: 'очк.', eight: 'Шар 8!', early8: 'Шар 8 забит раньше времени', kitchen: 'Поставьте биток за линию' },
    en: { solids: 'Solids', stripes: 'Stripes', open: 'Open table', foul: 'Foul!', scratch: 'Scratch', nohit: 'No ball hit', wrong: 'Wrong ball first', norail: 'No rail after contact', bih: 'Ball in hand — drag the cue ball', aim: 'Drag to aim, pull the cue on the right down', you: 'You', brk: 'Break!', again: 'Shoot again!', spin: 'Spin', pts: 'pts', eight: '8-ball!', early8: '8-ball potted early', kitchen: 'Place the cue ball behind the line' },
  };
  const ptx = (k) => (POOL_T[L()] || POOL_T.en)[k] || POOL_T.en[k];
  // fizika: stol 1000×500 birlik, shar radiusi 14; qadam 1/480 s
  const PL = { L: 1000, W: 500, R: 14, DT: 1 / 480, AS: 420, AR: 160 };
  const PK6 = [[-6, -6, 28], [500, -16, 24], [1006, -6, 28], [-6, 506, 28], [500, 516, 24], [1006, 506, 28]]; // luzalar: markaz + ushlash radiusi
  const PSEG = (() => { // bort chiziqlari + luza "jag'lari"
    const L = 1000, W = 500, CM = 40, SM = 30, J = 22, s = []; const sg = (a, b, c, d) => s.push([a, b, c, d]);
    sg(CM, 0, 500 - SM, 0); sg(500 + SM, 0, L - CM, 0); sg(CM, W, 500 - SM, W); sg(500 + SM, W, L - CM, W); sg(0, CM, 0, W - CM); sg(L, CM, L, W - CM);
    sg(CM, 0, CM - J, -J); sg(0, CM, -J, CM - J); sg(L - CM, 0, L - CM + J, -J); sg(L, CM, L + J, CM - J); sg(CM, W, CM - J, W + J); sg(0, W - CM, -J, W - CM + J); sg(L - CM, W, L - CM + J, W + J); sg(L, W - CM, L + J, W - CM + J);
    sg(500 - SM, 0, 500 - SM + 4, -24); sg(500 + SM, 0, 500 + SM - 4, -24); sg(500 - SM, W, 500 - SM + 4, W + 24); sg(500 + SM, W, 500 + SM - 4, W + 24);
    return s;
  })();
  const poolSim = (B) => B.map((b, i) => ({ i, x: b.x, y: b.y, on: b.on, vx: 0, vy: 0, wx: 0, wy: 0, sz: 0 }));
  // zarba: a — burchak, p — kuch 0..1, sx — yon aylanish, sy — yuqori(+)/past(−) aylanish
  function poolStrike(S, a, p, sx, sy, brk) { const v = (40 + p * 1460) * (brk ? 1.85 : 1), c = S[0]; c.vx = Math.cos(a) * v; c.vy = Math.sin(a) * v; c.wx = c.vx * 1.9 * sy; c.wy = c.vy * 1.9 * sy; c.sz = sx * v * 0.55; }
  // bitta fizika qadami; ev: {f: birinchi tekkan shar, r: tegishdan keyin bort, pk: tushganlar, t}; fx — animatsiya effektlari
  function poolStep(S, ev, fx) {
    const { R, DT, AS, AR, L, W } = PL; let any = false;
    for (let k = 0; k < 16; k++) {
      const b = S[k]; if (!b.on || (!b.vx && !b.vy && !b.wx && !b.wy)) continue;
      let vx = b.vx, vy = b.vy; const qx = vx - b.wx, qy = vy - b.wy, sl = Math.sqrt(qx * qx + qy * qy);
      if (sl > 0.5) { const d = AS * DT; if (d * 3.5 >= sl) { vx = b.wx = (5 * vx + 2 * b.wx) / 7; vy = b.wy = (5 * vy + 2 * b.wy) / 7; } else { const ux = qx / sl, uy = qy / sl; vx -= ux * d; vy -= uy * d; b.wx += ux * d * 2.5; b.wy += uy * d * 2.5; } }
      else { const sp = Math.sqrt(vx * vx + vy * vy), d = (AR + sp * 0.12) * DT; if (d >= sp) vx = vy = 0; else { const q = 1 - d / sp; vx *= q; vy *= q; } b.wx = vx; b.wy = vy; }
      b.sz *= 1 - 1.2 * DT; b.vx = vx; b.vy = vy; b.x += vx * DT; b.y += vy * DT;
      if (Math.abs(vx) + Math.abs(vy) < 1.5 && Math.abs(b.wx) + Math.abs(b.wy) < 1.5) { b.vx = b.vy = b.wx = b.wy = b.sz = 0; } else any = true;
    }
    const D2 = 4 * R * R;
    for (let i = 0; i < 16; i++) {
      const a = S[i]; if (!a.on) continue;
      for (let j = i + 1; j < 16; j++) {
        const b = S[j]; if (!b.on || (!a.vx && !a.vy && !b.vx && !b.vy)) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy; if (d2 >= D2 || d2 < 1e-9) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = (2 * R - d) / 2; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
        const vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (vn <= 0) continue;
        const J = vn * 0.975; a.vx -= J * nx; a.vy -= J * ny; b.vx += J * nx; b.vy += J * ny; any = true;
        if (i === 0 && ev.f < 0) ev.f = j; if (fx) fx.hit(a, b, vn);
      }
    }
    for (let k = 0; k < 16; k++) {
      const b = S[k]; if (!b.on) continue;
      if (b.vx || b.vy) {
        if (b.x < R + 1 || b.x > L - R - 1 || b.y < R + 1 || b.y > W - R - 1) for (const s of PSEG) {
          const ex = s[2] - s[0], ey = s[3] - s[1]; let t = ((b.x - s[0]) * ex + (b.y - s[1]) * ey) / (ex * ex + ey * ey); t = t < 0 ? 0 : t > 1 ? 1 : t;
          const px = s[0] + ex * t, py = s[1] + ey * t, dx = b.x - px, dy = b.y - py, d2 = dx * dx + dy * dy; if (d2 >= R * R || d2 < 1e-9) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; b.x = px + nx * R; b.y = py + ny * R; if (vn >= 0) continue;
          const sp = Math.hypot(b.vx, b.vy) || 1, rx = -b.vy / sp, ry = b.vx / sp; // harakatning o'ng tomoni
          b.vx -= 1.78 * vn * nx; b.vy -= 1.78 * vn * ny;
          if (b.sz) { let kx = rx * b.sz * 0.35, ky = ry * b.sz * 0.35; const kn = kx * nx + ky * ny; kx -= kn * nx; ky -= kn * ny; b.vx += kx; b.vy += ky; b.sz *= 0.45; }
          const wn = b.wx * nx + b.wy * ny; b.wx -= 1.5 * wn * nx; b.wy -= 1.5 * wn * ny;
          if (ev.f >= 0) ev.r = 1; if (fx) fx.rail(b, -vn);
        }
      }
      if (b.y > 20 && b.y < W - 20 && b.x > 20 && b.x < L - 20) continue;
      let pp = null; for (const p of PK6) { const dx = b.x - p[0], dy = b.y - p[1]; if (dx * dx + dy * dy < p[2] * p[2]) { pp = p; break; } }
      if (!pp && (b.x < -40 || b.x > L + 40 || b.y < -40 || b.y > W + 40)) pp = PK6.reduce((m, p) => (Math.hypot(b.x - p[0], b.y - p[1]) < Math.hypot(b.x - m[0], b.y - m[1]) ? p : m));
      if (pp) { b.on = false; ev.pk.push(b.i); if (fx) fx.pot(b, pp); b.vx = b.vy = b.wx = b.wy = b.sz = 0; }
    }
    ev.t += DT; return any;
  }
  function poolRun(B, cp, a, p, sx, sy, brk) { const S = poolSim(B); if (cp) { S[0].x = cp[0]; S[0].y = cp[1]; S[0].on = true; } poolStrike(S, a, p, sx, sy, brk); const ev = { f: -1, r: 0, pk: [], t: 0 }; while (poolStep(S, ev) && ev.t < 40); return { S, ev }; }
  const POOL_RGB = [[246, 241, 228], [247, 190, 22], [29, 78, 216], [220, 38, 38], [109, 40, 217], [249, 115, 22], [21, 128, 61], [127, 29, 29], [20, 20, 22]];
  const poolCol = (i) => POOL_RGB[i > 8 ? i - 8 : i];

  MPI.pool = (stage, ctx) => {
    const { c, g, fit } = canvasIn(stage); c.style.touchAction = 'none';
    const N = ctx.n || 2, MULTI = N > 2, { L: TL, W: TW, R } = PL, RWD = 52, CU = 13;
    let sd = (ctx.seed >>> 0) || 1; const rng = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const shuf = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    // piramida (urug' bo'yicha hamma mijozda bir xil)
    const B = Array.from({ length: 16 }, () => ({ x: 0, y: 0, on: true }));
    { const ps = []; for (let r = 0; r < 5; r++) for (let k = 0; k <= r; k++) ps.push([750 + r * (R * 1.732 + 0.35), 250 + (k - r / 2) * (2 * R + 0.4)]);
      const so = shuf([1, 2, 3, 4, 5, 6, 7]), st = shuf([9, 10, 11, 12, 13, 14, 15]), ids = Array(15).fill(0); ids[4] = 8; const a = so.pop(), b = st.pop(); if (rng() < 0.5) { ids[10] = a; ids[14] = b; } else { ids[10] = b; ids[14] = a; }
      const rest = shuf([...so, ...st]); for (let k = 0; k < 15; k++) if (!ids[k]) ids[k] = rest.pop(); ids.forEach((id, k) => { B[id].x = ps[k][0]; B[id].y = ps[k][1]; }); B[0].x = 250; B[0].y = 250; }
    let turn = 0, broke = false, bih = 'k', done = false, winner = -1, lastShooter = -1; const grp = [0, 0], score = [0, 0, 0, 0], potted = [];
    const grpOf = (i) => (i < 8 ? 1 : i > 8 ? 2 : 0);
    const r1 = (v) => Math.round(v * 10) / 10;
    const free = (x, y, ex, Bs = B) => { for (let k = 0; k < 600; k++) { const an = k * 2.399, rr0 = Math.sqrt(k) * R * 0.8, px = x + Math.cos(an) * rr0, py = y + Math.sin(an) * rr0; if (px < R + 1 || px > TL - R - 1 || py < R + 1 || py > TW - R - 1) continue; if (Bs.every((b, i) => i === ex || !b.on || (b.x - px) ** 2 + (b.y - py) ** 2 > 4 * R * R + 4)) return [r1(px), r1(py)]; } return [x, y]; };
    const targets = (s, Bs = B, gg = grp[s]) => { const on = []; for (let i = 1; i < 16; i++) if (Bs[i].on) on.push(i); if (MULTI) return on; if (!gg) return on.filter((i) => i !== 8); const l = on.filter((i) => grpOf(i) === gg); return l.length ? l : on.includes(8) ? [8] : []; };
    // qoidalar hakami (B — zarbadan oldingi holat)
    function judge(s, ev) {
      const obj = ev.pk.filter((i) => i > 0), scr = ev.pk.includes(0);
      if (MULTI) return { foul: scr, why: scr ? 'scratch' : '', cont: obj.length > 0 && !scr, pts: obj.reduce((a, i) => a + i, 0) - (scr ? 10 : 0), win: -1, obj };
      const gg = grp[s], brk = !broke, tg = targets(s);
      const why = scr ? 'scratch' : ev.f < 0 ? 'nohit' : !brk && !tg.includes(ev.f) ? 'wrong' : !brk && !obj.length && !ev.r ? 'norail' : '';
      const foul = !!why;
      if (obj.includes(8) && !brk) { const ok = gg && tg.length === 1 && tg[0] === 8 && !foul; return { foul, why: ok ? '' : 'early8', win: ok ? s : 1 - s, obj, eight: 1 }; }
      let assign = 0; if (!gg && !brk && !foul) { const f = obj.find((i) => i !== 8); if (f) assign = grpOf(f); }
      const ng = gg || assign;
      const cont = !foul && (brk ? obj.some((i) => i !== 8) : ng ? obj.some((i) => grpOf(i) === ng) : false);
      return { foul, why, cont, assign, win: -1, obj, respot: brk && obj.includes(8) };
    }
    // ---- ko'rinish holati ----
    let hTurn = 0, LY = null, SC = null, aim = 0, pow = 0, keyPow = 0.55, spin = [0, 0], spinOpen = false, drag = null, anim = null, shake = 0, flash = 0, T0 = 0, bannerQ = [];
    const parts = [], tray = [], sinking = [];
    const ORI = Array.from({ length: 16 }, () => { let ax = Math.random() - 0.5, ay = Math.random() - 0.5, az = 1.6; let l = Math.hypot(ax, ay, az); ax /= l; ay /= l; az /= l; let bx = -ay, by = ax, bz = 0; l = Math.hypot(bx, by) || 1; bx /= l; by /= l; const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx; const m = [ax, bx, cx, ay, by, cy, az, bz, cz]; const r0 = Math.random() * 6.28; rotOri(m, ax, ay, az, r0); return m; });
    function rotOri(m, kx, ky, kz, an) { const co = Math.cos(an), si = Math.sin(an), oc = 1 - co; for (let j = 0; j < 3; j++) { const x = m[j], y = m[3 + j], z = m[6 + j], kd = kx * x + ky * y + kz * z; m[j] = x * co + (ky * z - kz * y) * si + kx * kd * oc; m[3 + j] = y * co + (kz * x - kx * z) * si + ky * kd * oc; m[6 + j] = z * co + (kx * y - ky * x) * si + kz * kd * oc; } }
    const SPR = Array.from({ length: 16 }, () => ({ cv: document.createElement('canvas'), dirty: true, img: null }));
    let sprS = 0, sprRad = 0, sprRot = null; const shCv = document.createElement('canvas');
    const DPR = () => Math.min(3, devicePixelRatio || 1);
    function layout() {
      const W = c.W, H = c.H, side = W > H * 1.45 && H < 560; // past landshaft: o'yinchilar chapda, tarnov o'ngda
      const hud = side ? 0 : MULTI ? 58 : 62, trH = side ? 0 : 30, trV = side ? 24 : 0, lw = side ? Math.min(160, Math.max(112, W * 0.17)) : 0, col = 56;
      const ax = 6 + lw, ay = hud + (side ? 4 : 8), aw = W - col - 10 - lw - (trV ? trV + 8 : 0), ah = H - hud - trH - (side ? 8 : 18);
      const OW = TL + 2 * RWD, OH = TW + 2 * RWD, rot = aw < ah * 0.98, s = rot ? Math.min(aw / OH, ah / OW) : Math.min(aw / OW, ah / OH);
      const tw = (rot ? OH : OW) * s, th = (rot ? OW : OH) * s, cx = ax + aw / 2, cy = ay + ah / 2;
      LY = { W, H, hud, side, lw, rot, s, cx, cy, tx0: cx - tw / 2, ty0: cy - th / 2, tw, th, px: W - col + 4, pw: col - 12, py: side ? 14 : cy - th / 2 + 6, ph: side ? H * 0.56 : Math.min(th * 0.62, 320), k: W + 'x' + H + ':' + DPR() };
      LY.tray = side ? { v: 1, x: W - col - trV - 6, y: 8, w: trV, h: H - 16 } : { v: 0, x: 10, y: H - trH - 6, w: W - col - 22, h: trH }; // tarnov: pastda yoki vertikal
      LY.sx = LY.px + LY.pw / 2; LY.sy = LY.py + LY.ph + 40; LY.sr = Math.min(21, LY.pw / 2 + 2);
      SC = null; const d = DPR(), rad = R * s * d, S = Math.ceil(rad * 2) + 2;
      if (S !== sprS || rot !== sprRot) { sprS = S; sprRad = rad; sprRot = rot; SPR.forEach((p) => { p.cv.width = p.cv.height = S; p.img = p.cv.getContext('2d').createImageData(S, S); p.dirty = true; }); }
      const sr = Math.ceil(R * s * 1.6 * d); shCv.width = shCv.height = sr * 2; const q = shCv.getContext('2d'), gr = q.createRadialGradient(sr, sr, 0, sr, sr, sr); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.55, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, sr * 2, sr * 2);
    }
    const toS = (x, y) => LY.rot ? [LY.cx + LY.s * (y - 250), LY.cy - LY.s * (x - 500)] : [LY.cx + LY.s * (x - 500), LY.cy + LY.s * (y - 250)];
    const toT = (X, Y) => { const dx = (X - LY.cx) / LY.s, dy = (Y - LY.cy) / LY.s; return LY.rot ? [500 - dy, 250 + dx] : [500 + dx, 250 + dy]; };
    const tableTf = (q) => { q.translate(LY.cx, LY.cy); if (LY.rot) q.rotate(-Math.PI / 2); q.scale(LY.s, LY.s); q.translate(-500, -250); };
    // ---- statik fon + stol (offscreen keshda) ----
    function buildStatic() {
      const d = DPR(), cv = document.createElement('canvas'); cv.width = c.width; cv.height = c.height; const q = cv.getContext('2d'); q.setTransform(d, 0, 0, d, 0, 0); const { W, H } = LY;
      let gr = q.createRadialGradient(W / 2, H * 0.42, 20, W / 2, H * 0.45, Math.max(W, H) * 0.8); gr.addColorStop(0, '#2B3A52'); gr.addColorStop(0.5, '#141C2B'); gr.addColorStop(1, '#05070B'); q.fillStyle = gr; q.fillRect(0, 0, W, H);
      q.globalAlpha = 0.05; q.strokeStyle = '#fff'; q.lineWidth = 1; for (let x = -H; x < W; x += 18) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x + H, H); q.stroke(); } q.globalAlpha = 1;
      gr = q.createRadialGradient(LY.cx, LY.cy, 10, LY.cx, LY.cy, Math.max(LY.tw, LY.th) * 0.75); gr.addColorStop(0, 'rgba(255,236,190,.16)'); gr.addColorStop(1, 'rgba(255,236,190,0)'); q.fillStyle = gr; q.fillRect(0, 0, W, H);
      q.save(); tableTf(q); drawTable(q, d); q.restore();
      if (LY.hud) { q.fillStyle = 'rgba(0,0,0,.35)'; q.fillRect(0, 0, W, LY.hud); q.fillStyle = 'rgba(255,255,255,.06)'; q.fillRect(0, LY.hud - 1, W, 1); }
      else { q.fillStyle = 'rgba(0,0,0,.3)'; q.fillRect(0, 0, LY.lw + 2, H); q.fillStyle = 'rgba(255,255,255,.06)'; q.fillRect(LY.lw + 2, 0, 1, H); }
      // shar tarnovi (tray)
      const T = LY.tray, v = T.v, lg2 = (a, b, c3) => { const gg = v ? q.createLinearGradient(T.x, 0, T.x + T.w, 0) : q.createLinearGradient(0, T.y, 0, T.y + T.h); gg.addColorStop(0, a); gg.addColorStop(0.5, b); gg.addColorStop(1, c3); return gg; };
      q.fillStyle = lg2('#2a160a', '#5b3218', '#2a160a'); rr(q, T.x - 3, T.y - 3, T.w + 6, T.h + 6, (Math.min(T.w, T.h) + 6) / 2); q.fill();
      q.fillStyle = lg2('#020202', '#1a1a1a', '#333'); rr(q, T.x, T.y, T.w, T.h, Math.min(T.w, T.h) / 2); q.fill();
      q.fillStyle = 'rgba(255,255,255,.12)'; if (v) rr(q, T.x + 3, T.y + 10, 3, T.h - 20, 1.5); else rr(q, T.x + 10, T.y + 2, T.w - 20, 3, 1.5); q.fill();
      SC = cv;
    }
    const CUSH = (() => { const top = [[[40, 0], [470, 0], [472.2, -CU], [27, -CU]], [[530, 0], [960, 0], [973, -CU], [527.8, -CU]]]; const o = []; top.forEach((p) => { o.push(p); o.push(p.map(([x, y]) => [x, TW - y])); }); o.push([[0, 40], [0, 460], [-CU, 473], [-CU, 27]]); o.push([[TL, 40], [TL, 460], [TL + CU, 473], [TL + CU, 27]]); return o; })();
    function drawTable(q, d) {
      let r0 = 9; const rnd2 = () => { r0 = (r0 * 16807) % 2147483647; return r0 / 2147483647; };
      q.save(); q.shadowColor = 'rgba(0,0,0,.75)'; q.shadowBlur = 34; q.shadowOffsetY = 14; rr(q, -RWD, -RWD, TL + 2 * RWD, TW + 2 * RWD, 34); q.fillStyle = '#3a1d0c'; q.fill(); q.restore();
      q.save(); rr(q, -RWD, -RWD, TL + 2 * RWD, TW + 2 * RWD, 34); q.clip();
      const side = (pts, x0, y0, x1, y1) => { const gr = q.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#2b1206'); gr.addColorStop(0.18, '#6e3415'); gr.addColorStop(0.45, '#9a5426'); gr.addColorStop(0.7, '#7a3c18'); gr.addColorStop(1, '#3f1d0a'); q.fillStyle = gr; q.beginPath(); pts.forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y))); q.closePath(); q.fill(); };
      side([[-RWD, -RWD], [TL + RWD, -RWD], [TL + CU, -CU], [-CU, -CU]], 0, -RWD, 0, -CU); side([[-RWD, TW + RWD], [TL + RWD, TW + RWD], [TL + CU, TW + CU], [-CU, TW + CU]], 0, TW + RWD, 0, TW + CU);
      side([[-RWD, -RWD], [-CU, -CU], [-CU, TW + CU], [-RWD, TW + RWD]], -RWD, 0, -CU, 0); side([[TL + RWD, -RWD], [TL + CU, -CU], [TL + CU, TW + CU], [TL + RWD, TW + RWD]], TL + RWD, 0, TL + CU, 0);
      // yog'och tolasi
      q.lineCap = 'round';
      for (let k = 0; k < 90; k++) {
        const sd2 = k % 4, off = -CU - rnd2() * (RWD - CU), amp = 0.6 + rnd2() * 1.6, ph = rnd2() * 6, fr = 0.004 + rnd2() * 0.012; q.strokeStyle = rnd2() < 0.5 ? 'rgba(30,10,2,.35)' : 'rgba(255,200,140,.12)'; q.lineWidth = 0.5 + rnd2() * 1.4; q.beginPath();
        if (sd2 < 2) { const yy = sd2 ? TW - off : off; for (let x = -RWD; x <= TL + RWD; x += 12) { const y = yy + Math.sin(x * fr + ph) * amp; x === -RWD ? q.moveTo(x, y) : q.lineTo(x, y); } }
        else { const xx = sd2 === 3 ? TL - off : off; for (let y = -RWD; y <= TW + RWD; y += 12) { const x = xx + Math.sin(y * fr + ph) * amp; y === -RWD ? q.moveTo(x, y) : q.lineTo(x, y); } }
        q.stroke();
      }
      q.restore();
      q.strokeStyle = 'rgba(255,220,170,.28)'; q.lineWidth = 1.6; rr(q, -RWD + 2, -RWD + 2, TL + 2 * RWD - 4, TW + 2 * RWD - 4, 32); q.stroke();
      q.strokeStyle = 'rgba(0,0,0,.5)'; q.lineWidth = 2; q.strokeRect(-CU - 1, -CU - 1, TL + 2 * CU + 2, TW + 2 * CU + 2);
      // olmoschalar (diamonds)
      const dia = (x, y) => { const gr = q.createRadialGradient(x - 1, y - 1, 0, x, y, 6); gr.addColorStop(0, '#fffdf4'); gr.addColorStop(0.6, '#e7dcc0'); gr.addColorStop(1, '#a8946a'); q.fillStyle = gr; q.beginPath(); q.moveTo(x, y - 5.5); q.lineTo(x + 3.5, y); q.lineTo(x, y + 5.5); q.lineTo(x - 3.5, y); q.closePath(); q.fill(); };
      const dm = -(CU + RWD) / 2; [125, 250, 375, 625, 750, 875].forEach((x) => { dia(x, dm); dia(x, TW - dm); }); [125, 250, 375].forEach((y) => { dia(dm, y); dia(TL - dm, y); });
      // luza qoplamalari
      PK6.forEach(([x, y, r]) => { const gr = q.createRadialGradient(x - 4, y - 4, r * 0.4, x, y, r + 14); gr.addColorStop(0, '#d9d9d9'); gr.addColorStop(0.6, '#8a8a8a'); gr.addColorStop(0.85, '#3d3d3d'); gr.addColorStop(1, '#1a1a1a'); q.fillStyle = gr; q.beginPath(); q.arc(x, y, r + 12, 0, 7); q.fill(); });
      // movut
      let gr = q.createRadialGradient(500, 250, 30, 500, 250, 640); gr.addColorStop(0, '#1FA582'); gr.addColorStop(0.55, '#14876A'); gr.addColorStop(1, '#0A5643'); q.fillStyle = gr; q.fillRect(-CU, -CU, TL + 2 * CU, TW + 2 * CU);
      q.globalAlpha = 0.07; for (let k = 0; k < 3500; k++) { q.fillStyle = k % 2 ? '#000' : '#fff'; q.fillRect(rnd2() * TL, rnd2() * TW, 1.2, 1.2); } q.globalAlpha = 1;
      q.strokeStyle = 'rgba(255,255,255,.1)'; q.lineWidth = 1.2; q.setLineDash([6, 6]); q.beginPath(); q.moveTo(250, 0); q.lineTo(250, TW); q.stroke(); q.setLineDash([]);
      q.fillStyle = 'rgba(255,255,255,.22)'; [[250, 250], [750, 250]].forEach(([x, y]) => { q.beginPath(); q.arc(x, y, 2.6, 0, 7); q.fill(); });
      // luzalar teshigi
      PK6.forEach(([x, y, r]) => { const gr = q.createRadialGradient(x, y, 2, x, y, r + 3); gr.addColorStop(0, '#000'); gr.addColorStop(0.75, '#060606'); gr.addColorStop(1, '#262626'); q.fillStyle = gr; q.beginPath(); q.arc(x, y, r + 3, 0, 7); q.fill(); });
      // bort rezinalari
      q.strokeStyle = 'rgba(0,0,0,.28)'; q.lineWidth = 7; CUSH.forEach((p) => { q.beginPath(); q.moveTo(p[0][0], p[0][1]); q.lineTo(p[1][0], p[1][1]); q.stroke(); });
      CUSH.forEach((p) => { const mx = (p[0][0] + p[1][0]) / 2, my = (p[0][1] + p[1][1]) / 2, bx = (p[2][0] + p[3][0]) / 2, by = (p[2][1] + p[3][1]) / 2; const gr = q.createLinearGradient(mx, my, bx, by); gr.addColorStop(0, '#22B48F'); gr.addColorStop(0.35, '#178C6E'); gr.addColorStop(1, '#0B5B47'); q.fillStyle = gr; q.beginPath(); p.forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y))); q.closePath(); q.fill(); q.strokeStyle = 'rgba(190,255,230,.35)'; q.lineWidth = 1.2; q.beginPath(); q.moveTo(p[0][0], p[0][1]); q.lineTo(p[1][0], p[1][1]); q.stroke(); });
      // nom plastinkasi
      q.save(); q.translate(-(CU + RWD) / 2, 250); q.rotate(-Math.PI / 2); gr = q.createLinearGradient(0, -6, 0, 6); gr.addColorStop(0, '#f6e7b0'); gr.addColorStop(0.5, '#c9a24a'); gr.addColorStop(1, '#8a6a22'); q.fillStyle = gr; rr(q, -34, -7, 68, 14, 4); q.fill(); q.fillStyle = '#4a3410'; q.font = `800 9px ${FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('B I R G A', 0, 0.5); q.restore();
    }
    // ---- shar sprayti (piksel bo'yicha 3D yoritish) ----
    const LX = -0.42, LYd = -0.58, LZ = 0.7, LN = Math.hypot(LX, LYd, LZ), Lx = LX / LN, Ly = LYd / LN, Lz = LZ / LN; let Hx = Lx, Hy = Ly, Hz = Lz + 1; { const h = Math.hypot(Hx, Hy, Hz); Hx /= h; Hy /= h; Hz /= h; }
    function drawSpr(i) {
      const p = SPR[i], S = sprS, rad = sprRad, D = p.img.data, m = ORI[i], rot = LY.rot, base = poolCol(i), h = S / 2;
      for (let py = 0; py < S; py++) {
        const v = (py + 0.5 - h) / rad;
        for (let px = 0; px < S; px++) {
          const u = (px + 0.5 - h) / rad, r2 = u * u + v * v, o = (py * S + px) * 4; if (r2 >= 1 + 2.2 / rad) { D[o + 3] = 0; continue; }
          const rq = Math.sqrt(r2), al = Math.max(0, Math.min(1, (1 - rq) * rad + 0.5)), z = r2 < 1 ? Math.sqrt(1 - r2) : 0;
          const t0 = rot ? -v : u, t1 = rot ? u : v; const lx = m[0] * t0 + m[3] * t1 + m[6] * z, ly = m[1] * t0 + m[4] * t1 + m[7] * z, lz = m[2] * t0 + m[5] * t1 + m[8] * z;
          let cr = 246, cg = 241, cb = 228;
          if (i === 0) { if (Math.abs(lx) > 0.965 || Math.abs(ly) > 0.965 || Math.abs(lz) > 0.965) { cr = 200; cg = 40; cb = 40; } }
          else if (!(Math.abs(lx) > 0.84) && (i <= 8 || Math.abs(lz) < 0.6)) { cr = base[0]; cg = base[1]; cb = base[2]; }
          const dif = Math.max(0, u * Lx + v * Ly + z * Lz), sh = 0.26 + 0.82 * dif, hs = u * Hx + v * Hy + z * Hz; let sp = hs > 0.88 ? Math.pow(hs, 60) * 240 : 0; sp += (1 - z) * (1 - z) * 26 * (v > 0 ? 1 : 0.3);
          D[o] = Math.min(255, cr * sh + sp); D[o + 1] = Math.min(255, cg * sh + sp); D[o + 2] = Math.min(255, cb * sh + sp); D[o + 3] = al * 255;
        }
      }
      const q = p.cv.getContext('2d'); q.putImageData(p.img, 0, 0);
      if (i > 0) {
        const sv = (x, y, z) => (rot ? [y, -x, z] : [x, y, z]); const c0 = sv(m[0], m[3], m[6]), c1 = sv(m[1], m[4], m[7]), c2 = sv(m[2], m[5], m[8]);
        q.fillStyle = '#151515'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.font = `800 ${i > 9 ? 46 : 56}px ${FONT}`;
        for (const sg of [1, -1]) { const pz = c0[2] * sg; if (pz < 0.08) continue; const k = 0.01 * rad; q.setTransform(k * c1[0] * sg, k * c1[1] * sg, k * c2[0], k * c2[1], h + c0[0] * sg * rad * 0.985, h + c0[1] * sg * rad * 0.985); q.fillText(String(i), 0, 3); }
        q.setTransform(1, 0, 0, 1, 0, 0);
      }
      p.dirty = false;
    }
    // ---- zarba yo'nalishi bo'yicha nur (yo'naltiruvchi chiziq) ----
    function cast(Bs, x, y, a) {
      const dx = Math.cos(a), dy = Math.sin(a); let best = 1e9, hit = -1;
      for (let i = 1; i < 16; i++) { const b = Bs[i]; if (!b.on) continue; const fx = b.x - x, fy = b.y - y, t = fx * dx + fy * dy; if (t <= 0) continue; const q = fx * fx + fy * fy - t * t, rr2 = 4 * R * R; if (q > rr2) continue; const tt = t - Math.sqrt(rr2 - q); if (tt < best) { best = tt; hit = i; } }
      let tw = 1e9, nx = 0, ny = 0; if (dx > 1e-6) { const t = (TL - R - x) / dx; if (t < tw) { tw = t; nx = -1; ny = 0; } } if (dx < -1e-6) { const t = (R - x) / dx; if (t < tw) { tw = t; nx = 1; ny = 0; } } if (dy > 1e-6) { const t = (TW - R - y) / dy; if (t < tw) { tw = t; nx = 0; ny = -1; } } if (dy < -1e-6) { const t = (R - y) / dy; if (t < tw) { tw = t; nx = 0; ny = 1; } }
      if (hit >= 0 && best <= tw) return { t: Math.max(0, best), hit, nx, ny }; return { t: Math.max(0, tw), hit: -1, nx, ny };
    }
    // ---- animatsiya effektlari ----
    let sndN = 0;
    const FX = {
      hit(a, b, vn) { if (sndN < 4 && vn > 25) { sndN++; snd(1500 + Math.random() * 500, 0.035, Math.min(0.09, 0.01 + vn / 14000), 'triangle'); } if (vn > 700) { shake = Math.max(shake, Math.min(7, vn / 220)); } if (vn > 300) { const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2; for (let k = 0; k < 5; k++) spark(x, y, '#fff', 60 + vn * 0.1, 0.25); } },
      rail(b, vn) { if (sndN < 4 && vn > 40) { sndN++; snd(120 + Math.random() * 30, 0.07, Math.min(0.07, vn / 16000), 'sine'); } },
      pot(b, p) { sinking.push({ i: b.i, x: b.x, y: b.y, px: p[0], py: p[1], t: 0 }); snd(180, 0.18, 0.08, 'sine'); setTimeout(() => snd(110, 0.12, 0.06, 'triangle'), 120); const col = b.i ? poolCol(b.i) : [255, 255, 255]; for (let k = 0; k < 14; k++) spark(p[0], p[1], `rgb(${col[0]},${col[1]},${col[2]})`, 90, 0.55); if (b.i) addTray(b.i); },
    };
    function spark(x, y, col, sp, life) { const a = Math.random() * 6.283, v = sp * (0.4 + Math.random() * 0.8); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: life, l: life, col }); if (parts.length > 140) parts.shift(); }
    function addTray(i) { if (tray.some((t) => t.i === i)) return; tray.push({ i, x: null, rot: 0 }); }
    function syncTray() { for (let k = tray.length - 1; k >= 0; k--) if (!potted.includes(tray[k].i)) tray.splice(k, 1); potted.forEach((i) => addTray(i)); tray.sort((a, b) => potted.indexOf(a.i) - potted.indexOf(b.i)); }
    function banner(txt, col = '#fff', dur = 1.8) { bannerQ.push({ txt, col, t: dur, d: dur }); if (bannerQ.length > 3) bannerQ.shift(); }
    // ---- yurishni qo'llash ----
    function commit(s, J, after, ev) {
      const out = { msgs: [], hint: '' };
      for (let i = 0; i < 16; i++) { B[i].x = after[i].x; B[i].y = after[i].y; B[i].on = after[i].on; }
      for (const i of ev.pk) if (i > 0 && !potted.includes(i)) potted.push(i);
      lastShooter = s;
      if (!broke) out.msgs.push([ptx('brk'), '#FDE68A']);
      broke = true;
      if (J.respot) { B[8].on = true; const p = free(750, 250, 8); B[8].x = p[0]; B[8].y = p[1]; potted.splice(potted.indexOf(8), 1); }
      if (J.assign) { grp[s] = J.assign; grp[1 - s] = 3 - J.assign; out.msgs.push([`${ctx.names[s] || ''}: ${ptx(J.assign === 1 ? 'solids' : 'stripes')}`, '#A7F3D0']); }
      if (MULTI) { score[s] += J.pts; if (J.pts) out.msgs.push([(J.pts > 0 ? '+' : '') + J.pts + ' ' + ptx('pts'), J.pts > 0 ? '#FDE047' : '#FCA5A5']); }
      if (J.foul) { out.msgs.push([ptx('foul') + ' ' + ptx(J.why), '#FCA5A5']); out.hint = '⚠️ ' + ptx(J.why); }
      if (J.eight && J.win === s) out.msgs.push([ptx('eight') + ' 🏆', '#FDE047']); else if (J.eight) out.msgs.push([ptx('early8'), '#FCA5A5']);
      if (J.win >= 0) { done = true; winner = J.win; }
      else if (MULTI && !B.some((b, i) => i > 0 && b.on)) {
        done = true; const sc = Array.from({ length: N }, (_, i) => (ctx.out?.has(i) ? -1e9 : score[i])); const mx = Math.max(...sc), top = sc.map((v, i) => (v === mx ? i : -1)).filter((i) => i >= 0); winner = top.length > 1 ? ctx.DRAW : top[0];
      }
      if (!done) {
        turn = J.cont ? s : MULTI ? ctx.next(s) : 1 - s;
        if (!MULTI && ctx.out?.has(turn)) turn = s;
        bih = J.foul || !B[0].on ? 1 : 0;
        if (!B[0].on) { const p = free(250, 250, 0); B[0].x = p[0]; B[0].y = p[1]; B[0].on = true; }
        if (J.cont && J.obj?.length) out.msgs.push([ptx('again'), '#BBF7D0']);
      }
      return out;
    }
    function post(res, replay) {
      if (!replay) res.msgs.forEach(([t, col]) => banner(t, col)); if (res.hint && !replay) ctx.hint(res.hint);
      syncTray();
      if (done) { ctx.turn(-1); ctx.over(winner); return; }
      autoAim(); hTurn = turn; ctx.turn(turn);
      if (!replay && turn === ctx.me && bih) setTimeout(() => !done && turn === ctx.me && ctx.hint('✋ ' + ptx('bih')), 1700);
    }
    function autoAim() { const tg = targets(turn); if (!tg.length) return; const cb = B[0]; let bi = tg[0], bd = 1e9; for (const i of tg) { const d = Math.hypot(B[i].x - cb.x, B[i].y - cb.y); if (d < bd) { bd = d; bi = i; } } aim = Math.atan2(B[bi].y - cb.y, B[bi].x - cb.x); }
    function endAnim() {
      if (!anim) return; const a = anim; anim = null; sinking.length = 0;
      for (const b of a.S) if (b.on && (b.vx || b.vy)) SPR[b.i].dirty = true;
      SPR.forEach((p) => (p.dirty = true)); post(a.res, false);
    }
    const canPlay = () => !done && !anim && ctx.me >= 0 && turn === ctx.me && !ctx.isBot?.(ctx.me);
    function mkMove(cp, a, p, sx, sy) {
      const r = poolRun(B, cp, a, p, sx, sy, !broke), m = { a, p, sx, sy, e: [], pk: r.ev.pk, f: r.ev.f, r: r.ev.r };
      if (cp) m.c = [Math.round(cp[0] * 10), Math.round(cp[1] * 10)];
      for (const b of r.S) m.e.push(b.on ? Math.max(0, Math.round(b.x * 10)) : -1, b.on ? Math.max(0, Math.round(b.y * 10)) : -1);
      return m;
    }
    function shoot(p) {
      if (!canPlay()) return; const cp = bih ? [r1(B[0].x), r1(B[0].y)] : null;
      ctx.send(mkMove(cp, +aim.toFixed(5), +Math.max(0.02, Math.min(1, p)).toFixed(3), +spin[0].toFixed(2), +(-spin[1]).toFixed(2)));
      spin = [0, 0]; pow = 0;
    }
    // ---- bot: ko'p burchak/kuchni mahalliy fizika bilan sinab ko'radi ----
    const AIMP = [[10, 10], [500, -4], [990, 10], [10, 490], [500, 504], [990, 490]];
    const clearPath = (Bs, x0, y0, x1, y1, e1, e2) => { const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1; for (let i = 0; i < 16; i++) { if (i === e1 || i === e2 || !Bs[i].on) continue; const b = Bs[i]; let t = ((b.x - x0) * dx + (b.y - y0) * dy) / l2; if (t < 0 || t > 1) continue; const px = x0 + dx * t - b.x, py = y0 + dy * t - b.y; if (px * px + py * py < 4 * R * R - 2) return false; } return true; };
    function shots(Bs, cx, cy, tg) {
      const out = [];
      for (const t of tg) { const b = Bs[t]; for (const P of AIMP) {
        let nx = P[0] - b.x, ny = P[1] - b.y; const dl = Math.hypot(nx, ny); nx /= dl; ny /= dl; const gx = b.x - nx * 2 * R, gy = b.y - ny * 2 * R; if (gx < R || gx > TL - R || gy < R || gy > TW - R) continue;
        const ax = gx - cx, ay = gy - cy, al = Math.hypot(ax, ay); if (al < 1) continue; const cs = (ax * nx + ay * ny) / al; if (cs < 0.2) continue;
        if (P[1] > 0 && P[1] < TW && false) continue; if ((P[0] === 500) && Math.abs(ny) < 0.45) continue; // yon luzaga o'tkir burchakda bo'lmaydi
        if (!clearPath(Bs, cx, cy, gx, gy, 0, t) || !clearPath(Bs, b.x, b.y, P[0], P[1], t, 0)) continue;
        out.push({ a: Math.atan2(ay, ax), dist: al + dl, cut: Math.acos(Math.min(1, cs)), t, cost: al * 0.6 + dl + Math.acos(Math.min(1, cs)) * 420 });
      } }
      return out.sort((a, b) => a.cost - b.cost);
    }
    function evalRes(s, r) {
      const J = judge(s, r.ev); if (J.win === s) return 1e5; if (J.win >= 0) return -1e5;
      const cb = r.S[0], ng = MULTI ? 0 : grp[s] || J.assign || 0;
      const easy = (who, gg) => (cb.on ? shots(r.S, cb.x, cb.y, targets(who, r.S, gg)).filter((x) => x.cut < 0.9).length : 0);
      let v = Math.random() * 4;
      if (MULTI) { v += J.pts * 14 + (J.cont ? 260 + Math.min(4, easy(s)) * 22 : -Math.min(4, easy(s)) * 12) - (J.foul ? 250 : 0); return v; }
      if (J.foul) v -= 420 + (MULTI ? 0 : 60 * Math.min(3, targets(1 - s, r.S, ng ? 3 - ng : 0).length ? 1 : 0));
      if (J.cont) v += 320 + J.obj.filter((i) => grpOf(i) === ng).length * 40 + Math.min(4, easy(s, ng)) * 26;
      else if (!J.foul) v -= Math.min(4, easy(1 - s, ng ? 3 - ng : 0)) * 18;
      return v;
    }
    function botMove(s) {
      const skill = ctx.local ? [0.9, 0.82, 0.74, 0.66][s] || 0.8 : 0.85, sig = (1 - skill) * 0.03 + 0.0012;
      const noise = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.4;
      if (!broke) { const cp = [250, r1(250 + (Math.random() - 0.5) * 90)]; const a = Math.atan2(250 - cp[1], 750 - 250 - R * 0.6) + noise() * 0.004; return mkMove(cp, +a.toFixed(5), +(0.9 + Math.random() * 0.1).toFixed(3), 0, 0); }
      let best = null, n = 0; const tg = targets(s);
      const test = (cp, a, p, sx, sy) => { n++; const r = poolRun(B, cp, a, p, sx, sy, !broke), v = evalRes(s, r); if (!best || v > best.v) best = { v, cp, a, p, sx, sy }; };
      const varied = (cp, list, lim) => list.slice(0, lim).forEach((h) => { const p0 = Math.min(0.95, Math.max(0.16, 0.12 + h.dist / 1450 + h.cut * 0.22)); test(cp, h.a, p0, 0, 0); test(cp, h.a, Math.min(1, p0 * 1.3), 0, -0.45); test(cp, h.a, p0 * 0.92, 0, 0.45); });
      if (bih) { // qo'lda shar: to'g'ri zarba uchun joy tanlaydi
        const pl = []; for (const t of tg) for (const P of AIMP) { const b = B[t]; let nx = P[0] - b.x, ny = P[1] - b.y; const dl = Math.hypot(nx, ny); nx /= dl; ny /= dl; if (P[0] === 500 && Math.abs(ny) < 0.45) continue; if (!clearPath(B, b.x, b.y, P[0], P[1], t, 0)) continue; for (const back of [95, 150]) { const x = b.x - nx * (2 * R + back), y = b.y - ny * (2 * R + back); if (x < R + 2 || x > TL - R - 2 || y < R + 2 || y > TW - R - 2) continue; if (!B.every((q, i) => i === 0 || !q.on || Math.hypot(q.x - x, q.y - y) > 2 * R + 3)) continue; pl.push({ cp: [r1(x), r1(y)], cost: dl + back }); break; } }
        pl.sort((a, b) => a.cost - b.cost).slice(0, 7).forEach((q) => varied(q.cp, shots(B, q.cp[0], q.cp[1], tg), 1));
      }
      const cp0 = bih ? [r1(B[0].x), r1(B[0].y)] : null;
      if (!best || best.v < 200) varied(cp0, shots(B, B[0].x, B[0].y, tg), skill > 0.8 ? 14 : 9);
      if (!best || best.v < 0) { for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; test(cp0, a, 0.32, 0, 0); if (k % 2) test(cp0, a, 0.62, 0, 0); } }
      if (!best) return mkMove(cp0, 0, 0.4, 0, 0);
      const a = +(best.a + noise() * sig).toFixed(5), p = +Math.max(0.05, Math.min(1, best.p * (1 + noise() * (1 - skill) * 0.12))).toFixed(3);
      return mkMove(best.cp, a, p, best.sx, best.sy);
    }
    const api = {
      apply(s, m, replay) {
        if (done || s !== turn || !m || typeof m !== 'object') return false;
        const a = +m.a, p = +m.p, sx = +m.sx || 0, sy = +m.sy || 0;
        if (![a, p, sx, sy].every(Number.isFinite) || p < 0 || p > 1 || Math.abs(sx) > 1 || Math.abs(sy) > 1 || !Array.isArray(m.e) || m.e.length !== 32 || !m.e.every(Number.isFinite) || !Array.isArray(m.pk) || m.pk.length > 16) return false;
        let cp = null; if (m.c) { if (!bih || !Array.isArray(m.c)) return false; cp = [+m.c[0] / 10, +m.c[1] / 10]; if (!(cp[0] >= R - 1 && cp[0] <= TL - R + 1 && cp[1] >= R - 1 && cp[1] <= TW - R + 1)) return false; }
        if (anim) endAnim();
        const start = B.map((b) => ({ x: b.x, y: b.y, on: b.on })); if (cp) { start[0].x = cp[0]; start[0].y = cp[1]; start[0].on = true; }
        const ev = { f: Number.isInteger(m.f) ? m.f : -1, r: m.r ? 1 : 0, pk: m.pk.map((x) => x | 0).filter((x, k, arr) => x >= 0 && x < 16 && arr.indexOf(x) === k), t: 0 };
        const after = Array.from({ length: 16 }, (_, i) => ({ x: m.e[2 * i] / 10, y: m.e[2 * i + 1] / 10, on: m.e[2 * i] >= 0 && m.e[2 * i + 1] >= 0 && !ev.pk.includes(i) }));
        const brk = !broke, J = judge(s, ev), res = commit(s, J, after, ev);
        if (replay) { post(res, true); return true; }
        const S = poolSim(start); poolStrike(S, a, p, sx, sy, brk);
        anim = { S, ev: { f: -1, r: 0, pk: [], t: 0 }, res, ph: s === ctx.me && !ctx.isBot?.(s) ? 1 : 0, t: 0, a0: aim, a, p, acc: 0, st: start };
        return true;
      },
      bot: (s) => (done || s !== turn ? null : botMove(s)),
      quit(s) { if (done || !MULTI || ctx.active().length < 2) return; if (turn === s) { turn = ctx.next(s); bih = 1; if (!anim) { autoAim(); hTurn = turn; ctx.turn(turn); } } },
    };
    // ---- kiritish (sichqoncha/sensor/klaviatura) ----
    const onPow = (X, Y) => X > LY.px - 10 && Y > LY.py - 10 && Y < LY.py + LY.ph + 10;
    c.addEventListener('pointerdown', (e) => {
      const [X, Y] = pos(c, e); try { c.setPointerCapture(e.pointerId); } catch {}
      if (spinOpen) { const cx = LY.W / 2, cy = LY.H / 2, SR = Math.min(LY.W, LY.H) * 0.2; if (Math.hypot(X - cx, Y - cy) <= SR * 1.05) { drag = 'spin'; setSpin(X, Y); } else spinOpen = false; return; }
      if (Math.hypot(X - LY.sx, Y - LY.sy) < LY.sr + 8) { spinOpen = true; return; }
      if (!canPlay()) return;
      if (onPow(X, Y)) { drag = { k: 'pow', y0: Y }; pow = 0; return; }
      const [tx, ty] = toT(X, Y);
      if (bih && Math.hypot(tx - B[0].x, ty - B[0].y) < R * 2.6) { drag = 'cue'; return; }
      drag = 'aim'; aim = Math.atan2(ty - B[0].y, tx - B[0].x);
    });
    function setSpin(X, Y) { const SR = Math.min(LY.W, LY.H) * 0.2; let u = (X - LY.W / 2) / SR, v = (Y - LY.H / 2) / SR; const l = Math.hypot(u, v); if (l > 0.8) { u *= 0.8 / l; v *= 0.8 / l; } spin = [u / 0.8, v / 0.8].map((q) => Math.round(q * 20) / 20); }
    c.addEventListener('pointermove', (e) => {
      if (!drag) return; const [X, Y] = pos(c, e);
      if (drag === 'spin') return setSpin(X, Y);
      if (!canPlay()) { drag = null; return; }
      if (drag.k === 'pow') { pow = Math.max(0, Math.min(1, (Y - drag.y0) / (LY.ph * 0.8))); return; }
      const [tx, ty] = toT(X, Y);
      if (drag === 'aim') { if (Math.hypot(tx - B[0].x, ty - B[0].y) > 4) aim = Math.atan2(ty - B[0].y, tx - B[0].x); return; }
      if (drag === 'cue') { const x = Math.max(R + 1, Math.min(bih === 'k' ? 250 : TL - R - 1, tx)), y = Math.max(R + 1, Math.min(TW - R - 1, ty)); if (B.every((b, i) => i === 0 || !b.on || Math.hypot(b.x - x, b.y - y) > 2 * R + 0.5)) { B[0].x = x; B[0].y = y; } }
    });
    const up = () => { const d = drag; drag = null; if (d === 'spin') { setTimeout(() => (spinOpen = false), 160); return; } if (d?.k === 'pow') { if (pow > 0.03 && canPlay()) shoot(pow); pow = 0; } };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', () => { drag = null; pow = 0; });
    c.addEventListener('wheel', (e) => { if (!canPlay()) return; e.preventDefault(); aim += e.deltaY * 0.0006; }, { passive: false });
    const kd = (e) => {
      if (!canPlay() || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) return; const f = e.shiftKey ? 0.03 : 0.004;
      if (e.key === 'ArrowLeft') aim -= f; else if (e.key === 'ArrowRight') aim += f; else if (e.key === 'ArrowUp') keyPow = Math.min(1, keyPow + 0.05); else if (e.key === 'ArrowDown') keyPow = Math.max(0.05, keyPow - 0.05); else if (e.key === ' ' || e.key === 'Enter') shoot(keyPow); else return; e.preventDefault();
    };
    addEventListener('keydown', kd);
    // ---- chizish ----
    const rgb = (a, k = 1) => `rgb(${(a[0] * k) | 0},${(a[1] * k) | 0},${(a[2] * k) | 0})`;
    function mini(x, y, r, i, dim) {
      g.globalAlpha = dim ? 0.22 : 1; const col = poolCol(i);
      g.fillStyle = i > 8 ? '#f4efe1' : rgb(col); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      if (i > 8) { g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); g.fillStyle = rgb(col); g.fillRect(x - r, y - r * 0.42, r * 2, r * 0.84); g.restore(); }
      const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.45, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(0.35, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      if (r > 6) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * 0.48, 0, 7); g.fill(); text(g, String(i), x, y + 0.5, r * 0.62, '#111', 'center', 800); }
      g.globalAlpha = 1;
    }
    function avatar(x, y, r, s) {
      const col = ctx.col[s] || '#888', on = !done && hTurn === s, t = performance.now() / 1000;
      if (on) { g.save(); g.shadowColor = col; g.shadowBlur = 12 + Math.sin(t * 5) * 5; g.strokeStyle = '#FDE047'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r + 3, 0, 7); g.stroke(); g.restore(); }
      const gr = g.createLinearGradient(x - r, y - r, x + r, y + r); gr.addColorStop(0, col); gr.addColorStop(1, '#0b1220'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.stroke();
      const nm = ctx.names[s] || '?', bot = ctx.isBot?.(s); text(g, bot ? '🤖' : [...nm][0].toUpperCase(), x, y + 1, r * (bot ? 0.95 : 1.05), '#fff');
      if (ctx.out?.has(s)) { g.strokeStyle = '#EF4444'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.stroke(); }
    }
    const clipName = (s, w) => { let t = (ctx.names[s] || '').replace(/\s*🤖/, ''); if (s === ctx.me) t = ptx('you'); g.font = `700 13px ${FONT}`; while (t.length > 1 && g.measureText(t).width > w) t = t.slice(0, -1); return t; };
    function panel(s, x, y, w, h, left) {
      const t = performance.now() / 1000, on = !done && hTurn === s; g.globalAlpha = ctx.out?.has(s) ? 0.45 : 1;
      const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, on ? 'rgba(59,130,246,.35)' : 'rgba(255,255,255,.08)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; rr(g, x, y, w, h, 13); g.fill();
      g.strokeStyle = on ? `rgba(253,224,71,${0.55 + Math.sin(t * 5) * 0.3})` : 'rgba(255,255,255,.12)'; g.lineWidth = on ? 2 : 1; rr(g, x, y, w, h, 13); g.stroke();
      const ar = Math.min(17, h / 2 - 6), axp = left ? x + 6 + ar : x + w - 6 - ar; avatar(axp, y + h / 2, ar, s);
      const tx = left ? axp + ar + 8 : axp - ar - 8, al = left ? 'left' : 'right', iw = w - ar * 2 - 20;
      text(g, clipName(s, iw), tx, y + h * 0.3, MULTI ? 12 : 13, '#fff', al, 700);
      if (MULTI) { text(g, String(score[s]) + ' ' + ptx('pts'), tx, y + h * 0.72, 14, '#FDE047', al, 800); g.globalAlpha = 1; return; }
      const gg = grp[s], br = Math.min(5.6, iw / 17.5);
      if (!gg) text(g, ptx('open'), tx, y + h * 0.72, 11, 'rgba(255,255,255,.6)', al, 600);
      else { const ids = gg === 1 ? [1, 2, 3, 4, 5, 6, 7, 8] : [9, 10, 11, 12, 13, 14, 15, 8]; ids.forEach((i, k) => { const bx = left ? tx + br + k * (br * 2 + 1.6) : tx - br - k * (br * 2 + 1.6); mini(bx, y + h * 0.72, br, i, i === 8 ? ids.slice(0, 7).some((q) => B[q].on) : !B[i].on); }); }
      g.globalAlpha = 1;
    }
    function hud() {
      const { W, H } = LY;
      if (LY.side) { const ph = Math.min(64, (H - 12) / N - 6); for (let s = 0; s < N; s++) panel(s, 6, 6 + s * (ph + 6), LY.lw - 8, ph, true); return; }
      if (!MULTI) { const w = W / 2 - 26; panel(0, 8, 7, w, LY.hud - 14, true); panel(1, W - 8 - w, 7, w, LY.hud - 14, false); const cx = W / 2, cy = LY.hud / 2; g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.arc(cx, cy, 15, 0, 7); g.fill(); mini(cx, cy, 11, 8, false); return; }
      const w = (W - 8) / N; for (let s = 0; s < N; s++) panel(s, 6 + s * w, 6, w - 4, LY.hud - 12, true);
    }
    function drawCue(q, x, y, a, back, alpha) {
      q.save(); q.translate(x, y); q.rotate(a + Math.PI); q.globalAlpha = alpha;
      const t0 = R + 3 + back, len = 600;
      q.save(); q.translate(7, 9); q.fillStyle = 'rgba(0,0,0,.28)'; q.beginPath(); q.moveTo(t0, -2.5); q.lineTo(t0 + len, -6); q.lineTo(t0 + len, 6); q.lineTo(t0, 2.5); q.closePath(); q.fill(); q.restore();
      const wAt = (d) => 2.6 + (d / len) * 3.6; const seg = (d0, d1, fill) => { q.fillStyle = fill; q.beginPath(); q.moveTo(t0 + d0, -wAt(d0)); q.lineTo(t0 + d1, -wAt(d1)); q.lineTo(t0 + d1, wAt(d1)); q.lineTo(t0 + d0, wAt(d0)); q.closePath(); q.fill(); };
      const lg = (c0, c1, c2) => { const gr = q.createLinearGradient(0, -6, 0, 6); gr.addColorStop(0, c0); gr.addColorStop(0.45, c1); gr.addColorStop(1, c2); return gr; };
      seg(0, 4, '#3b6fb6'); seg(4, 11, lg('#fff', '#f2efe6', '#bdb6a5')); seg(11, 330, lg('#f7e3bd', '#e2c28e', '#a88654')); seg(330, 336, lg('#fff', '#c9ccd2', '#6b7078'));
      seg(336, 600, lg('#5a2c14', '#3a1708', '#1b0a03'));
      q.fillStyle = lg('#f4d58d', '#d3a43c', '#8a6417'); for (let k = 0; k < 4; k++) { const d0 = 336, d1 = 430; q.beginPath(); q.moveTo(t0 + d1, 0); q.lineTo(t0 + d0, -wAt(d0) * (k % 2 ? 0.9 : -0.9) * 0.5); q.lineTo(t0 + d0, wAt(d0) * (k % 2 ? 0.9 : -0.9) * 0.2); q.closePath(); q.fill(); }
      seg(470, 560, lg('#2a2a2e', '#141416', '#050505')); q.strokeStyle = 'rgba(255,255,255,.08)'; q.lineWidth = 0.8; for (let d = 474; d < 558; d += 5) { q.beginPath(); q.moveTo(t0 + d, -wAt(d)); q.lineTo(t0 + d + 3, wAt(d)); q.stroke(); }
      seg(560, 564, '#c9ccd2'); seg(592, 600, '#111');
      q.restore();
    }
    function guide(q, x, y, a) {
      const r = cast(B, x, y, a), ex = x + Math.cos(a) * r.t, ey = y + Math.sin(a) * r.t, lw = 1.6 / LY.s, legal = r.hit < 0 || targets(turn).includes(r.hit) || (!broke);
      q.save(); q.lineCap = 'round'; q.strokeStyle = 'rgba(255,255,255,.85)'; q.lineWidth = lw; q.shadowColor = 'rgba(0,0,0,.6)'; q.shadowBlur = 3;
      q.beginPath(); q.moveTo(x + Math.cos(a) * R, y + Math.sin(a) * R); q.lineTo(ex, ey); q.stroke();
      q.beginPath(); q.arc(ex, ey, R, 0, 7); q.stroke(); q.fillStyle = 'rgba(255,255,255,.12)'; q.fill();
      if (r.hit >= 0) {
        const b = B[r.hit]; let nx = b.x - ex, ny = b.y - ey; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl; const dx = Math.cos(a), dy = Math.sin(a), cs = Math.max(0, dx * nx + dy * ny);
        if (!legal) { q.strokeStyle = '#F87171'; q.lineWidth = lw * 1.8; const k = R * 0.55; q.beginPath(); q.moveTo(ex - k, ey - k); q.lineTo(ex + k, ey + k); q.moveTo(ex + k, ey - k); q.lineTo(ex - k, ey + k); q.stroke(); }
        else {
          q.strokeStyle = 'rgba(255,255,255,.9)'; q.beginPath(); q.moveTo(b.x + nx * R, b.y + ny * R); q.lineTo(b.x + nx * (R + 30 + 170 * cs), b.y + ny * (R + 30 + 170 * cs)); q.stroke();
          let tx = dx - cs * nx, ty = dy - cs * ny; const tl = Math.hypot(tx, ty); if (tl > 0.02) { tx /= tl; ty /= tl; q.strokeStyle = 'rgba(190,230,255,.7)'; q.beginPath(); q.moveTo(ex, ey); q.lineTo(ex + tx * (20 + 110 * tl), ey + ty * (20 + 110 * tl)); q.stroke(); }
        }
      } else { const dx = Math.cos(a), dy = Math.sin(a), dn = dx * r.nx + dy * r.ny, rx = dx - 2 * dn * r.nx, ry = dy - 2 * dn * r.ny; q.strokeStyle = 'rgba(255,255,255,.45)'; q.beginPath(); q.moveTo(ex, ey); q.lineTo(ex + rx * 90, ey + ry * 90); q.stroke(); }
      q.restore();
    }
    function slider() {
      const { px, py, pw, ph } = LY, act = canPlay(), t = performance.now() / 1000;
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, px - 2, py - 2, pw + 4, ph + 4, pw / 2 + 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1; rr(g, px - 2, py - 2, pw + 4, ph + 4, pw / 2 + 2); g.stroke();
      const pv = drag?.k === 'pow' ? pow : 0;
      if (pv > 0) { const gr = g.createLinearGradient(0, py, 0, py + ph); gr.addColorStop(0, '#22C55E'); gr.addColorStop(0.55, '#FACC15'); gr.addColorStop(1, '#EF4444'); g.fillStyle = gr; g.save(); rr(g, px + 3, py + 3, pw - 6, ph - 6, (pw - 6) / 2); g.clip(); g.fillRect(px, py, pw, ph * pv); g.restore(); }
      for (let k = 1; k < 10; k++) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(px + 6, py + (ph * k) / 10, pw - 12, 1); }
      // vertikal kiy
      const off = pv * ph * 0.8, cx = px + pw / 2; g.save(); g.beginPath(); rr(g, px, py, pw, ph, pw / 2); g.clip();
      let gr = g.createLinearGradient(cx - 4, 0, cx + 4, 0); gr.addColorStop(0, '#a88654'); gr.addColorStop(0.5, '#f7e3bd'); gr.addColorStop(1, '#a88654'); g.fillStyle = gr; g.fillRect(cx - 3, py + 10 + off, 6, ph * 0.55);
      g.fillStyle = '#3b6fb6'; g.fillRect(cx - 3, py + 8 + off, 6, 3); gr = g.createLinearGradient(cx - 5, 0, cx + 5, 0); gr.addColorStop(0, '#1b0a03'); gr.addColorStop(0.5, '#5a2c14'); gr.addColorStop(1, '#1b0a03'); g.fillStyle = gr; g.fillRect(cx - 4.5, py + 10 + off + ph * 0.55, 9, ph);
      g.restore();
      if (act && !drag) { g.globalAlpha = 0.5 + Math.sin(t * 4) * 0.3; text(g, '▼', cx, py + ph + 12, 12, '#FDE047'); g.globalAlpha = 1; const ky = py + ph * keyPow; g.fillStyle = 'rgba(253,224,71,.5)'; g.fillRect(px - 2, ky - 1, 5, 2); }
      text(g, pv > 0 ? Math.round(pv * 100) + '%' : '', cx, py - 12, 11, '#fff');
      // aylanish tugmasi
      const sx = LY.sx, sy = LY.sy, sr = LY.sr; gr = g.createRadialGradient(sx - sr * 0.35, sy - sr * 0.4, 1, sx, sy, sr); gr.addColorStop(0, '#fff'); gr.addColorStop(0.7, '#e9e4d6'); gr.addColorStop(1, '#a29d8e'); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(sx - sr, sy); g.lineTo(sx + sr, sy); g.moveTo(sx, sy - sr); g.lineTo(sx, sy + sr); g.stroke();
      g.fillStyle = '#DC2626'; g.beginPath(); g.arc(sx + spin[0] * sr * 0.7, sy + spin[1] * sr * 0.7, 4, 0, 7); g.fill(); text(g, ptx('spin'), sx, sy + sr + 10, 9, 'rgba(255,255,255,.7)', 'center', 700);
    }
    function spinPanel() {
      const { W, H } = LY, SR = Math.min(W, H) * 0.2, cx = W / 2, cy = H / 2; g.fillStyle = 'rgba(2,6,15,.72)'; g.fillRect(0, 0, W, H);
      const gr = g.createRadialGradient(cx - SR * 0.35, cy - SR * 0.4, SR * 0.05, cx, cy, SR); gr.addColorStop(0, '#fff'); gr.addColorStop(0.65, '#eee8da'); gr.addColorStop(1, '#8f8a7c'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, SR, 0, 7); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, SR * 0.8, 0, 7); g.moveTo(cx - SR, cy); g.lineTo(cx + SR, cy); g.moveTo(cx, cy - SR); g.lineTo(cx, cy + SR); g.stroke();
      const dx = cx + spin[0] * SR * 0.8, dy = cy + spin[1] * SR * 0.8; g.fillStyle = '#DC2626'; g.beginPath(); g.arc(dx, dy, SR * 0.11, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      text(g, ptx('spin'), cx, cy - SR - 24, 18, '#fff');
    }
    let lastK = '';
    const stop = loop((dt) => {
      if (!LY || c.W !== LY.W || c.H !== LY.H || LY.k !== c.W + 'x' + c.H + ':' + DPR()) layout();
      if (!SC) buildStatic();
      T0 += dt; sndN = 0;
      // animatsiya
      if (anim) {
        const A = anim; A.t += dt;
        if (A.ph === 0) { if (A.t >= 0.85) { A.ph = 1; A.t = 0; } }
        else if (A.ph === 1) { if (A.t >= 0.09) { A.ph = 2; A.t = 0; snd(520, 0.05, 0.03 + A.p * 0.07, 'square'); if (A.p > 0.75 && !lastShooterBroke) shake = 6; lastShooterBroke = true; } }
        else {
          A.acc += dt; let n = 0, mv = true; const st0 = A.ev.t;
          while (A.acc >= PL.DT && n < 60) { A.acc -= PL.DT; n++; mv = poolStep(A.S, A.ev, FX); if (!mv) break; }
          const sdt = A.ev.t - st0;
          for (const b of A.S) { if (!b.on) continue; const w = Math.hypot(b.wx, b.wy); if (w > 0.5) { rotOri(ORI[b.i], -b.wy / w, b.wx / w, 0, (w * sdt) / R); SPR[b.i].dirty = true; } if (Math.abs(b.sz) > 2) { rotOri(ORI[b.i], 0, 0, 1, (-b.sz * sdt) / R * 0.4); SPR[b.i].dirty = true; } }
          if (!mv || A.ev.t > 40) endAnim();
        }
      }
      // chizish
      const d = DPR(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(SC, 0, 0); g.setTransform(d, 0, 0, d, 0, 0);
      shake *= Math.pow(0.02, dt); const shx = (Math.random() - 0.5) * shake, shy = (Math.random() - 0.5) * shake;
      g.save(); g.translate(shx, shy);
      const balls = anim ? anim.S : B, ss = sprS / d, sh = shCv.width / d;
      for (let i = 0; i < 16; i++) { const b = balls[i]; if (!b.on) continue; const [X, Y] = toS(b.x, b.y); g.drawImage(shCv, X - sh / 2 + R * LY.s * 0.28, Y - sh / 2 + R * LY.s * 0.38, sh, sh); }
      for (let k = sinking.length - 1; k >= 0; k--) { const q = sinking[k]; q.t += dt; const f = Math.min(1, q.t / 0.28); if (f >= 1) { sinking.splice(k, 1); continue; } const [X, Y] = toS(q.x + (q.px - q.x) * f, q.y + (q.py - q.y) * f); if (SPR[q.i].dirty) drawSpr(q.i); const z = 1 - f * 0.45; g.globalAlpha = 1 - f * 0.8; g.drawImage(SPR[q.i].cv, X - (ss * z) / 2, Y - (ss * z) / 2, ss * z, ss * z); g.globalAlpha = 1; }
      for (let i = 0; i < 16; i++) { const b = balls[i]; if (!b.on) continue; if (SPR[i].dirty) drawSpr(i); const [X, Y] = toS(b.x, b.y); g.drawImage(SPR[i].cv, X - ss / 2, Y - ss / 2, ss, ss); }
      // qo'lda shar belgisi
      const me = canPlay();
      if (me && bih) { const [X, Y] = toS(B[0].x, B[0].y), pr = R * LY.s * (1.7 + Math.sin(T0 * 5) * 0.2); g.strokeStyle = drag === 'cue' ? '#FDE047' : 'rgba(253,224,71,.75)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.arc(X, Y, pr, 0, 7); g.stroke(); g.setLineDash([]); if (drag !== 'cue') text(g, '✋', X + pr * 0.9, Y - pr * 0.9, 14); }
      if (me && bih === 'k') { g.save(); tableTf(g); g.fillStyle = 'rgba(253,224,71,.05)'; g.fillRect(0, 0, 250, TW); g.restore(); }
      // kiy va yo'naltiruvchi
      g.save(); g.beginPath(); g.rect(LY.lw + 3, LY.hud, (LY.side ? LY.tray.x - 4 : LY.px - 8) - LY.lw - 3, LY.H - LY.hud - (LY.side ? 0 : LY.tray.h + 8)); g.clip(); tableTf(g);
      if (!done) {
        const cb = anim ? anim.st[0] : B[0];
        if (me) { if (drag !== 'cue') guide(g, B[0].x, B[0].y, aim); drawCue(g, B[0].x, B[0].y, aim, (drag?.k === 'pow' ? pow : 0) * 90, 1); }
        else if (anim && anim.ph < 2) { const A = anim, f = A.ph === 0 ? Math.min(1, A.t / 0.5) : 1; let da = A.a - A.a0; da = Math.atan2(Math.sin(da), Math.cos(da)); const an = A.a0 + da * (1 - (1 - f) * (1 - f)); const back = A.ph === 0 ? Math.max(0, (A.t - 0.45) / 0.4) * A.p * 90 : A.p * 90 * (1 - A.t / 0.09); drawCue(g, cb.x, cb.y, an, Math.max(0, back), 1); }
        else if (anim && anim.ph === 1) drawCue(g, cb.x, cb.y, anim.a, Math.max(0, pow * 90 * (1 - anim.t / 0.09)), 1);
        else if (anim && anim.t < 0.35) drawCue(g, cb.x, cb.y, anim.a, -6 + anim.t * 30, 1 - anim.t / 0.35);
        else if (!anim && turn >= 0) drawCue(g, B[0].x, B[0].y, aim, 26 + Math.sin(T0 * 2) * 6, 0.55);
      }
      // zarralar
      for (let k = parts.length - 1; k >= 0; k--) { const p = parts[k]; p.t -= dt; if (p.t <= 0) { parts.splice(k, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; g.globalAlpha = p.t / p.l; g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, 2.4, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.restore();
      g.restore();
      // tarnov
      const T = LY.tray, rS = Math.min((T.v ? T.w : T.h) / 2 - 3, ((T.v ? T.h : T.w) - 10) / 15 / 2 - 1), tEnd = T.v ? T.y + T.h : T.x + T.w;
      tray.forEach((q, k) => { const tx = (T.v ? T.y : T.x) + rS + 4 + k * (rS * 2 + 2); if (q.x == null || q.x > tEnd) q.x = tEnd - rS - 2; if (q.x > tx) { const dx = Math.min(q.x - tx, 340 * dt); q.x -= dx; q.rot -= dx / rS; } else q.x = tx; if (SPR[q.i].dirty) drawSpr(q.i); g.save(); if (T.v) g.translate(T.x + T.w / 2, q.x); else g.translate(q.x, T.y + T.h / 2); g.rotate(q.rot); g.drawImage(SPR[q.i].cv, -rS, -rS, rS * 2, rS * 2); g.restore(); });
      hud(); slider();
      // xabarlar
      if (bannerQ.length) { const bq = bannerQ[0]; bq.t -= dt; if (bq.t <= 0) bannerQ.shift(); else { const f = Math.min(1, (bq.d - bq.t) * 6, bq.t * 3); g.globalAlpha = f; g.font = `800 17px ${FONT}`; const w = g.measureText(bq.txt).width + 36, y = LY.cy - LY.th * 0.18; g.fillStyle = 'rgba(8,12,22,.82)'; rr(g, LY.cx - w / 2, y - 19, w, 38, 19); g.fill(); g.strokeStyle = bq.col; g.lineWidth = 1.5; rr(g, LY.cx - w / 2, y - 19, w, 38, 19); g.stroke(); text(g, bq.txt, LY.cx, y + 1, 17, bq.col); g.globalAlpha = 1; } }
      if (me && !broke && !anim && T0 < 6 && !bannerQ.length) { const ht = ptx('aim'), hy = LY.ty0 + LY.th - 34; g.font = `600 12px ${FONT}`; const hw = g.measureText(ht).width + 24; g.fillStyle = 'rgba(5,10,20,.7)'; rr(g, LY.cx - hw / 2, hy - 13, hw, 26, 13); g.fill(); text(g, ht, LY.cx, hy, 12, '#fff', 'center', 600); }
      if (spinOpen) spinPanel();
      lastK = '';
    });
    let lastShooterBroke = false;
    aim = 0; ctx.turn(0);
    return { ...api, stop: () => { stop(); removeEventListener('keydown', kd); }, resize: () => { fit(); LY = null; } };
  };

  window.BirgaGames = { _dicts: () => ({ g: T, mt: MT, rt: RT_T, race: RACE_T, mode: MODE_T }), openLocal, chooseMode, list: GAMES, start: startGame, renderLobby, tg, openRoom, invite, cardHTML, GameCards, mt, mp: MPL, _room: () => Room };
})();
