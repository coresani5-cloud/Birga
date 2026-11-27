# Claude Cowork uchun topshiriq: BEK o'yini uchun 3D modellarni yaratish

Sen Claude Cowork'san va foydalanuvchining kompyuterida, uning brauzerida ishlaysan. Vazifang — "BEK" (XIX asr O'zbekistonida bo'lib o'tadigan 3D brauzer o'yini) uchun personaj va hayvonlarning **3D modellarini (.glb)** bepul xizmatlarda yaratish va ularni GitHub repozitoriyasiga joylash. O'yinning qolgan qismi (kod, skelet ulash, joylashtirish) boshqa Claude sessiyasi tomonidan qilinadi.

## Xavfsizlik qoidalari (majburiy)
- **Hech qanday to'lov qilma**, karta ma'lumotini kiritma, obunani yoqma. Biror narsa pul so'rasa — to'xta va foydalanuvchidan so'ra.
- Hisob ochish yoki kirish kerak bo'lsa, foydalanuvchining Google hisobi orqali kir. Parol, SMS yoki captcha so'ralsa, foydalanuvchiga topshir.
- API kalitlarini **chatga, faylga yoki GitHub'ga yozma**. Kalit yaratilsa, faqat foydalanuvchiga qayerda turganini ayt.
- Xizmat shartlarini buzma: kuniga ruxsat etilgan bepul limitdan oshma, bir nechta soxta hisob ochma.
- Foydalanuvchi bergan rasmlardan boshqa rasm ishlatma. Do'konlardagi pullik modellarni yuklab olma.

## Manba rasmlar
GitHub: `coresani5-cloud/birga`, tarmoq `claude/admiring-brown-wc6zjg`, papka `ozbekkhan/assets/refs/`.
(GitHub'da faylni ochib "Download raw file" tugmasi bilan yukla.)

Muhimlik tartibida:
1. `hero_v2.png` — **asosiy qahramon** (yo'l-yo'l chopon, qizil belbog', do'ppi, etik). Eng muhimi.
2. `oqsoqol.png`, `ayol.png`
3. Hayvonlar: `echki.png`, `qoy.png`, `qoy2.png`, `tovuq.png`, `40.png` (eshak), `41.png` (tuya), `10.png` (yuk eshak), `9.png` (yuk tuya), `8.png` (yuk ot)
4. Personajlar: `6.png`/`7.png` (navkar, sarboz), `12.webp`, `13.png`, `14.webp`, `15.webp`, `16.webp`, `22.png`–`26.webp` (bolalar, ayollar, xitoylik bolalar), `3.webp`, `4.webp`, `5.webp`

Agar rasmda fon (bino, odamlar) bo'lsa yoki odam to'liq bo'yi bilan ko'rinmasa, 3D'dan oldin **fonni olib tashla** (xizmatning o'z "Remove background" funksiyasi bilan) — boshqa o'zgartirish qilma.

## 1-qadam. Tripo (skelet + animatsiya bilan) — faqat asosiy qahramon va 2–3 muhim personaj
Sayt: https://www.tripo3d.ai (Google bilan kir). Bepul oylik kreditdan foydalan.
1. "Image to 3D" → rasmni yukla → model sifati eng yuqori bepul variant → Generate.
2. Tayyor bo'lgach "Rig" / "Auto Rig" (humanoid) → keyin "Animate" bo'limidan quyidagilarni qo'sh: **Idle, Walk, Run, Punch (yoki Attack), Sit, Jump**.
3. **Export → GLB** (animatsiyalar bilan birga). Fayl nomi: `<rasm_nomi>_tripo.glb` (masalan `hero_v2_tripo.glb`).
4. Kreditlar tugasa — to'xta, 2-qadamga o't.

## 2-qadam. Hunyuan3D (Tencent) — qolgan hamma personaj va hayvonlar
Sayt: https://3d.hunyuan.tencent.com (xalqaro versiya; Google yoki email bilan kir). Kuniga ~20 ta bepul.
1. "Image to 3D" → rasmni yukla → teksturali (Textured) variant → Generate.
2. **Download → GLB**. Fayl nomi: rasm nomi bilan bir xil, kengaytmasi `.glb` (masalan `oqsoqol.glb`, `echki.glb`). Hayvonlar uchun nomlar: `eshak.glb`, `tuya_gilam.glb`, `eshak_yuk.glb`, `tuya_yuk.glb`, `ot_yuk.glb`, `echki.glb`, `qoy.glb`, `qoy2.glb`, `tovuq.glb`.
3. Kunlik limit tugasa — to'xta va qaysilari tayyor, qaysilari qolganini yoz.

## 3-qadam (ixtiyoriy). Mixamo — Tripo bo'lmagan odamsimon personajlarga harakat
Sayt: https://www.mixamo.com (bepul Adobe hisobi).
Hunyuan'dan olingan odam modelini (GLB'ni avval https://products.aspose.app/3d/conversion/glb-to-fbx kabi bepul konvertor bilan FBX ga o'tkazib) yukla → markerlarni qo'y → animatsiyalar: Idle, Walking, Running, Punching, Sitting Idle — **FBX Binary, In Place yoqilgan**. Nomi: `<nom>_<animatsiya>.fbx`.

## 4-qadam. Natijani joylash
Tayyor fayllarni GitHub'ga yukla: `coresani5-cloud/birga` → tarmoq `claude/admiring-brown-wc6zjg` → papka `ozbekkhan/assets/incoming/` → "Add file → Upload files". Commit xabari: `BEK: yangi 3D modellar (<ro'yxat>)`.
Agar GitHub'ga yuklash imkoni bo'lmasa — fayllarni bitta papkaga to'plab, foydalanuvchiga "Claude Code chatiga tashlang" deb ayt.

## Oxirida hisobot ber
- Qaysi modellar tayyor bo'ldi (fayl nomlari, qaysi xizmatda).
- Qaysilari qoldi va nima uchun (limit, xato, rasm mos kelmadi).
- Ertaga davom ettirish uchun qolgan ro'yxat.
