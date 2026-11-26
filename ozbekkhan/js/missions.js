// Topshiriqlar. Har biri async funksiya: G (o'yin API) orqali bosqichma-bosqich yoziladi.
// G.fail(sabab) — topshiriqni to'xtatadi. Mukofot: { tanga, obro }.

const near = (A, n = 4, r) => A.doors.slice().sort(() => r() - 0.5).slice(0, n);
const stallOf = (A, g) => A.stalls.filter((s) => s.goods === g);

export const MISSIONS = {
  /* ===================== VILOYATLAR TOPSHIRIQLARI ===================== */
  lazgi: { region: 'xorazm', title: 'Lazgi to\'yi', giver: { name: 'Qudag\'ay ota', at: (A) => ({ x: 6, z: 18 }) }, reward: { tanga: 60, obro: 15 },
    intro: 'O\'g\'lim, bugun nevaramning to\'yi! Sozandalar keldi, lekin raqsga tushadigan yigit yo\'q. Lazgini bilasizmi? Yuring, maydonga!',
    async run(G) {
      G.obj('Lazgi to\'yi', 'Maydondagi to\'yga boring.'); G.setTime(20.2);
      const dance = G.party(0, 4); await G.reach(0, 4, 4);
      G.obj('Lazgi to\'yi', 'Doira ritmiga mos tugmalarni bosing!'); G.radioTo(2);
      const s = await G.qte('rhythm', { bpm: 132, notes: 28, title: 'Lazgi' }); dance.stop?.();
      if (s < 0.55) G.fail('Ritm adashdi... To\'y egasi kuldi: "Yana mashq qiling, bolam!"');
      await G.say('Qudag\'ay ota', s > 0.85 ? 'Barakalla! Xivada bunaqa lazgini yigirma yildan beri ko\'rmagandim!' : 'Yaxshi tushdingiz, xalq xursand!', ['Rahmat, ota']);
    } },
  kaptar: { region: 'buxoro', title: 'Kaptarbozning kaptarlari', giver: { name: 'Kaptarboz Rustam', at: (A) => ({ x: A.choyxona.x - 6, z: A.choyxona.z - 12 }) }, reward: { tanga: 50, obro: 10, unlock: 'qanot' },
    intro: 'Voy-dod, uchta kaptarim tomlarga qochib ketdi! Narvon bilan chiqib, ushlab bering. Keyin sizga atlas qanot sovg\'a qilaman — Kalon minorasidan uchasiz!',
    async run(G) {
      const roofs = G.A.ladderRoofs.slice().sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z)).slice(0, 3);
      if (roofs.length < 3) G.fail('Tomlarga narvon topilmadi');
      await G.collect(roofs.map((r) => ({ x: r.x, y: r.y, z: r.z })), { model: 'pigeon', title: 'Kaptarlarni tuting', text: 'Narvon orqali tomga chiqing va kaptarni ushlang (E).', radius: 1.6, needE: true });
      G.obj('Kaptarlar', 'Kaptarlarni Rustamga qaytaring.'); const gv = G.giverPos(); await G.reach(gv.x, gv.z, 3);
      await G.say('Kaptarboz Rustam', 'Mana, atlas qanot! Kalon minorasiga chiqing, sakrang, havoda PROBEL bosing. Labi hovuz yoniga qo\'ning — ana shunda haqiqiy Buxorolik bo\'lasiz!', ['Qani, ketdik']);
      G.unlock('qanot'); const m = G.A.minaretTop; G.obj('Atlas qanot', 'Kalon minorasiga chiqing (E).'); await G.until(() => G.P.pos.y > m.y - 1);
      G.obj('Atlas qanot', 'Sakrang (PROBEL), havoda yana PROBEL — qanotni oching. Hovuz yoniga qo\'ning!');
      const h = G.A.hovuz; await G.reach(h.x, h.z - h.d / 2 - 4, 9, { landed: true });
    } },
  karvon: { region: 'navoiy', title: 'Tuya karvoni', giver: { name: 'Karvonboshi Sobir', at: (A) => ({ x: 8, z: 104 }) }, reward: { tanga: 70, obro: 10 },
    intro: 'Karvon Raboti Malikka ketyapti, lekin yo\'lboshchi kasal bo\'ldi. Tuyani yetaklab, cho\'ldagi belgilar bo\'ylab olib boring. Sardobada suv olishni unutmang!',
    async run(G) {
      G.mount('tuya'); G.obj('Tuya karvoni', 'Tuyaga mindingiz. Belgilar bo\'ylab yuring.', { timer: 200 });
      const pts = [[0, 150], [-70, 190], [-150, 120], [-170, 20], [-120, -80], [-40, -150], [0, -125]];
      await G.route(pts, { title: 'Tuya karvoni', r: 7 });
      G.obj('Tuya karvoni', 'Karvonsaroyga kiring.'); const rb = G.A.extras.rabot || { x: 0, z: -8 }; await G.reach(rb.x, rb.z, 8);
    } },
  non: { region: 'samarqand', title: 'Samarqand noni', giver: { name: 'Novvoy Zokir', at: (A) => ({ x: A.tandir.x + 2, z: A.tandir.z + 2 }) }, reward: { tanga: 45, obro: 12 },
    intro: 'Tandirdan issiq non chiqdi! To\'rt xonadonga yetkazib bering — non sovimasin, Samarqand noni issiqligida yeyiladi!',
    async run(G) {
      G.carry('non'); const doors = near(G.A, 4, G.rnd).map((d) => ({ x: d.x, y: 0, z: d.z }));
      await G.collect(doors, { model: 'door', title: 'Non sovimasin!', text: 'Nonni eshiklarga yetkazing.', radius: 2.2, timer: 130, verb: 'yetkazildi' });
      G.carry(null);
    } },
  gilam: { region: 'qashqadaryo', title: 'Kesh gilami', giver: { name: 'Gilamdo\'z Oysha opa', at: (A) => ({ x: 12, z: 22 }) }, reward: { tanga: 65, obro: 12 },
    intro: 'Qizimning sepiga to\'qigan gilamlarni Oqsaroy yonidagi bozorga eltish kerak. Aravaning g\'ildiragi chiqib ketdi — avval tuzatib oling.',
    async run(G) {
      const c = G.prop('cart', 16, 0, 24); G.obj('Kesh gilami', 'Aravani tuzating (E).'); await G.reach(16, 24, 3, { needE: true });
      const s = await G.qte('meter', { rounds: 4, title: 'G\'ildirakni urib joyiga soling', zone: 0.22 }); if (s < 0.5) G.fail('G\'ildirak yana chiqib ketdi...');
      G.removeProp(c); G.mount('arava'); G.obj('Kesh gilami', 'Aravani Oqsaroyga haydang.', { timer: 120 });
      const o = G.A.extras.oqsaroy || { x: 0, z: -6 }; await G.reach(o.x, o.z, 7);
    } },
  chopar: { region: 'surxondaryo', title: 'Chopar', giver: { name: 'Beklik mirzosi', at: (A) => ({ x: -10, z: 14 }) }, reward: { tanga: 60, obro: 10 },
    intro: 'Muhim xat bor! Boysun yo\'lidagi qorovulxonalardan o\'tib, darvozaga qaytib keling. Otni tez choptiring, lekin xatni ho\'l qilmang!',
    async run(G) {
      G.mount('ot'); G.obj('Chopar', 'Belgilardan o\'ting!', { timer: 150 });
      await G.route([[0, 150], [130, 150], [170, 40], [150, -120], [0, -160], [-150, -120], [-170, 40], [-120, 150], [0, 125]], { title: 'Chopar', r: 8 });
    } },
  kopkari: { region: 'jizzax', title: 'Ko\'pkari', giver: { name: 'Ko\'pkari boshlig\'i', at: (A) => ({ x: 10, z: 130 }) }, reward: { tanga: 90, obro: 20 },
    intro: 'Dashtda ko\'pkari! Uloqni ilib olib, oq doiraga tashlang. Uch marta tashlagan chavandoz — bosh sovrin egasi!',
    async run(G) {
      const K = G.A.extras.kopkari; G.mount('ot', { x: K.x - 10, z: K.z }); G.obj('Ko\'pkari', 'Maydonga kiring.'); await G.reach(K.x, K.z, 40);
      const r = await G.kopkari(K); if (!r) G.fail('Raqiblar uloqni sizdan oldin olib ketishdi.');
    } },
  paxta: { region: 'sirdaryo', title: 'Paxta terimi', giver: { name: 'Brigadir Ergash aka', at: (A) => ({ x: -55, z: 128 }) }, reward: { tanga: 50, obro: 15 },
    intro: 'Oq oltin pishdi! Hasharga chiqqan yoshlar bilan bellashing: vaqt tugaguncha 15 ta ko\'sakni teribe bering.',
    async run(G) {
      const P = G.A.extras.paxta || { x0: -90, z0: 135, x1: -30, z1: 185 }, pts = [];
      for (let i = 0; i < 15; i++) pts.push({ x: P.x0 + 4 + G.rnd() * (P.x1 - P.x0 - 8), y: 0.6, z: P.z0 + 4 + G.rnd() * (P.z1 - P.z0 - 8) });
      await G.collect(pts, { model: 'cotton', title: 'Paxta terimi', text: 'Ko\'saklarni tering (E).', radius: 1.4, timer: 110, needE: true, pose: 'pick' });
    } },
  osh: { region: 'toshkent', title: 'Osh sovimasin', giver: { name: 'Usta oshpaz Aziz', at: (A) => ({ x: A.qozon.x + 2, z: A.qozon.z + 2.5 }) }, reward: { tanga: 70, obro: 20 },
    intro: 'Mahallada hashar osh! Chorsudan sabzi, guruch, go\'sht va ziravor olib keling, keyin qozonga qarab turasiz. So\'ng laganni to\'kmasdan tapchanga eltasiz.',
    async run(G) {
      const want = [['qovun', 'Sabzi (qovun rastasidan)'], ['ziravor', 'Zira va ziravor'], ['non', 'Non'], ['kiyim', 'Go\'sht (qassob — kiyim rastasi yonida)']];
      const pts = want.map(([g]) => { const s = stallOf(G.A, g)[0] || G.A.stalls[0]; return { x: s.x - Math.sin(s.ry) * 1.6, y: 0, z: s.z - Math.cos(s.ry) * 1.6 }; });
      await G.collect(pts, { model: 'sack', title: 'Masalliq', text: 'Rastalardan masalliq oling (E).', radius: 2.0, needE: true, cost: 2 });
      G.obj('Osh sovimasin', 'Oshpazga qayting.'); await G.reach(G.A.qozon.x, G.A.qozon.z + 2, 2.5);
      const s = await G.qte('meter', { rounds: 5, title: 'Olovni me\'yorda ushlang — o\'tin qo\'shing', zone: 0.2, speed: 1.3 }); if (s < 0.5) G.fail('Osh kuyib qoldi! Oshpaz boshini ushladi.');
      const b = G.A.benches[0]; G.carry('lagan'); G.obj('Lagan ko\'tarish', 'Oshni to\'kmasdan tapchanga yetkazing. Yugurmang!');
      await G.balance(b.x, b.z, 2.2);
      G.carry(null);
    } },
  gullar: { region: 'namangan', title: 'Gullar bayrami', giver: { name: 'Bog\'bon Hojiakbar', at: (A) => ({ x: 8, z: 22 }) }, reward: { tanga: 45, obro: 15 },
    intro: 'Gullar bayramiga tayyorgarlik! Gulzordan 8 ta gul terib, uchta xonadonga guldasta eltib bering.',
    async run(G) {
      const g = G.A.extras.gulbog || { x: 0, z: 17 }, pts = []; for (let i = 0; i < 8; i++) pts.push({ x: g.x - 18 + (i % 4) * 12 + G.rnd() * 3, y: 0.4, z: g.z - 5 + Math.floor(i / 4) * 10 });
      await G.collect(pts, { model: 'flower', title: 'Gul terish', text: 'Gullarni tering (E).', radius: 1.5, needE: true, pose: 'pick' });
      G.carry('gul'); await G.collect(near(G.A, 3, G.rnd).map((d) => ({ x: d.x, y: 0, z: d.z })), { model: 'door', title: 'Guldasta', text: 'Guldastalarni eshiklarga yetkazing.', radius: 2.2, timer: 120 }); G.carry(null);
    } },
  pilla: { region: 'fargona', title: 'Pilladan atlasgacha', giver: { name: 'Usta to\'quvchi Mahbuba', at: (A) => ({ x: 12, z: 24 }) }, reward: { tanga: 60, obro: 15, item: 'atlas_0' },
    intro: 'Marg\'ilon atlasini to\'qish uchun pilla kerak. Shahar tashqarisidagi tutzordan 8 ta pilla yig\'ing. Keyin Rishton laganlarini bozorga eltasiz.',
    async run(G) {
      const tz = G.A.extras.tutzor || [{ x: 50, z: 140 }], pts = tz.slice(0, 8).map((t) => ({ x: t.x + 1.2, y: 1.2, z: t.z + 0.6 }));
      await G.collect(pts, { model: 'pilla', title: 'Pilla', text: 'Tut daraxtlaridan pilla yig\'ing (E).', radius: 2.0, needE: true });
      G.obj('Rishton laganlari', 'Kulolchilik ustaxonasidan laganlarni oling.'); const r = G.A.extras.rishton || G.A.stalls[0]; await G.reach(r.x, r.z, 3, { needE: true });
      G.carry('lagan'); G.obj('Rishton laganlari', 'Laganlarni sindirmasdan bozordagi rastaga yetkazing.');
      const s = stallOf(G.A, 'lagan')[0] || G.A.stalls[0]; await G.balance(s.x - Math.sin(s.ry) * 1.6, s.z - Math.cos(s.ry) * 1.6, 2.2, 'Laganlar sindi!'); G.carry(null);
    } },
  kurash: { region: 'andijon', title: 'Kurash turniri', giver: { name: 'Hakam Odil polvon', at: (A) => ({ x: (A.extras.kurash?.x || 0) + 9, z: (A.extras.kurash?.z || 0) }) }, reward: { tanga: 80, obro: 25, item: 'kamar' },
    intro: 'Andijon kurash turniri! Uchta polvonni halol yengib, kumush kamarni oling. Raqibni yoqtirmasangiz ham, salom bering — kurash odobdan boshlanadi.',
    async run(G) {
      const k = G.A.extras.kurash || { x: 0, z: 0 }; G.obj('Kurash turniri', 'Gilamga chiqing.'); await G.reach(k.x, k.z, 3);
      for (let i = 0; i < 3; i++) { const w = await G.kurash(k, i); if (!w) G.fail('Raqib halol yutdi. Ertaga yana urinib ko\'ring!'); G.toast(`G'alaba ${i + 1}/3!`); }
    } },

  /* ===================== MAHALLA TOPSHIRIQLARI (har joyda) ===================== */
  mehmon: { side: true, title: 'Mehmon kutish va dasturxon', giver: { name: 'Qo\'shni Malika opa', at: (A) => A.doors[3] }, reward: { tanga: 30, obro: 15 },
    intro: 'Voy, uyimga kutilmagan mehmonlar keldi, erim bozorda! Tezda dasturxon yozishga yordam bering: issiq non, meva, qand-novvot va choy kerak!',
    async run(G) {
      const d = G.giverPos(); G.prop('dasturxon', d.x, 0, d.z);
      const want = [['non', 'Issiq non'], ['qovun', 'Meva'], ['ziravor', 'Qand-novvot']].map(([g]) => { const s = stallOf(G.A, g)[0] || G.A.stalls[0]; return { x: s.x - Math.sin(s.ry) * 1.6, y: 0, z: s.z - Math.cos(s.ry) * 1.6 }; });
      want.push({ x: G.A.choyxona.x, y: 0, z: G.A.choyxona.z }); want.push({ x: d.x, y: 0, z: d.z });
      await G.collect(want, { model: 'sack', title: 'Mehmon kutish va dasturxon', text: 'Mehmonlar keldi, dasturxonni yozing!', radius: 2.0, needE: true, timer: 150, ordered: true });
    } },
  obod: { side: true, title: 'Mahalla obodonchiligi', giver: { name: 'Mahalla oqsoqoli', at: (A) => ({ x: -18, z: 18 }) }, reward: { tanga: 20, obro: 25 },
    intro: 'Ertaga Navro\'z! Ko\'chalarni supurib, ariqni tozalab, daraxtlarni oqlaymiz. Obod mahallada odam ham obod bo\'ladi.',
    async run(G) {
      const pts = G.A.trees.filter((t) => Math.abs(t[0]) < 100 && Math.abs(t[1]) < 100).slice(0, 4).map((t) => ({ x: t[0] + 0.8, y: 0, z: t[1] + 0.8 }));
      for (const d of G.A.doors.slice(6, 10)) pts.push({ x: d.x, y: 0, z: d.z });
      await G.collect(pts, { model: 'leaves', title: 'Mahalla obodonchiligi', text: 'Ko\'chani supuring va daraxtlarni oqlang (E).', radius: 1.8, needE: true, pose: 'work', hold: 1.2 });
    } },
  bozor: { side: true, title: 'Bozor narxini ushlash', giver: { name: 'Savdogar Qodir', at: (A) => ({ x: 3, z: 100 }) }, reward: { tanga: 0, obro: 5 },
    intro: 'Ertaga katta bozor! Hozir rastalardan arzon mol yig\'ib oling — har biri 2 tangadan. Keyin menga 5 tangadan sotasiz. Foyda — sizniki!',
    async run(G) {
      const pts = G.A.stalls.filter((_, i) => i % 2 === 0).slice(0, 6).map((s) => ({ x: s.x - Math.sin(s.ry) * 1.6, y: 0, z: s.z - Math.cos(s.ry) * 1.6 }));
      await G.collect(pts, { model: 'sack', title: 'Bozor narxini ushlash', text: 'Rastalardagi mahsulotlarni yig\'ing (2 tanga).', radius: 2.0, needE: true, cost: 2, timer: 150 });
      G.obj('Bozor narxini ushlash', 'Savdogarga soting.'); const gv = G.giverPos(); await G.reach(gv.x, gv.z, 3); G.give(30, 0); G.toast('Foyda: +18 tanga');
    } },
  koriz: { side: true, title: 'Qadimiy koriz siri', giver: { name: 'Keksa quduqchi', at: (A) => ({ x: -96, z: -96 }) }, reward: { tanga: 75, obro: 10 },
    intro: 'Shahar ostida qadimiy koriz bor — bobolarimiz suvni yer ostidan olib kelgan. U yerda bir vaqflar hujjati yo\'qolgan. Chiroqni oling, ehtiyot bo\'ling!',
    async run(G) {
      await G.koriz();
    } },
  arava: { side: true, title: 'Arava poygasi', giver: { name: 'Aravakash Bahrom', at: (A) => ({ x: 10, z: 124 }) }, reward: { tanga: 55, obro: 10 },
    intro: 'Eshak aravalar poygasi! Shahar atrofini aylanib, birinchi bo\'lib darvozaga qayting. Eshagim sho\'x, qamchini ko\'p ishlatmang!',
    async run(G) { G.mount('arava', { x: 4, z: 130 }); const ok = await G.race([[0, 150], [130, 150], [150, 0], [130, -150], [0, -150], [-130, -150], [-150, 0], [-130, 150], [0, 128]]); if (!ok) G.fail('Bahrom aka birinchi keldi! "Eshak — eshak-da" dedi.'); } },
  xat: { side: true, title: 'Omonat yetkazish', giver: { name: 'Pochtachi chol', at: (A) => ({ x: -6, z: 104 }) }, reward: { tanga: 35, obro: 10 },
    intro: 'Qishloqdagi onadan o\'g\'liga qurt va xat bor. Uning uyi shaharning narigi chetida. Qisqa yo\'ldan o\'ting — kech qolmang!',
    async run(G) { G.carry('tugun'); const d = G.A.doors.slice().sort((a, b) => a.z - b.z)[0]; await G.collect([{ x: d.x, y: 0, z: d.z }], { model: 'door', title: 'Omonat yetkazish', text: 'Omonatni yetkazing. Qisqa yo\'ldan o\'ting!', radius: 2.2, timer: 75 }); G.carry(null); } },
};
export const SIDE = Object.keys(MISSIONS).filter((k) => MISSIONS[k].side);
