---
name: motion-video
description: Remotion orqali Reels/Instagram video yasash. (A) skript + audio dan oq fonli emoji animatsiya; (B) odam gapirayotgan videoga uning so'zlariga mos motion emoji va subtitr qo'yish. Foydalanuvchi "video qil", "reels", "motion video", "montaj", "emoji qo'y", skript, ovoz yoki video fayl bersa ishlating.
---

# Motion video (skript → mp4)

Loyiha: `tools/motion-video/` (Remotion shabloni). Har video uchun faqat `video.json` yoziladi.
To'liq sxema va sahna turlari: `tools/motion-video/README.md`, tiplar: `tools/motion-video/src/types.ts`.

## Ish tartibi

1. **Ma'lumot yig'ish.** Kerak: skript matni. Ixtiyoriy: audio fayl (mp3/wav/m4a), format
   (standart 1:1 = 1080x1080; Reels uchun 9:16 = 1080x1920), uslub (standart: oq fon,
   qora matn, Montserrat, emojilar, ovoz effektlari). Yetishmagan narsani standart bilan to'ldiring,
   faqat skript bo'lmasa so'rang.
2. **Sahnalarga bo'lish.** Skriptni gap/fikr bo'yicha 5–10 sahnaga bo'ling — har sahna audiodagi
   bitta gapga to'g'ri kelsin (sahna soni = gaplar orasidagi pauzalar soni + 1, shunda avto-vaqt
   aniq bo'ladi). Har sahnaga mos tur tanlang:
   - savol/ochilish → `emoji`
   - "oldin/keyin", "X o'rniga Y" → `compare`
   - sanash, "kerak bo'ladi: ..." → `list`
   - foiz, raqam, natija → `counter`
   - asosiy fikr → `title`
   - chaqiriq (CTA: "izohga X deb yozing") → `typing`
   Ekrandagi matn qisqa bo'lsin (2–6 so'z), skriptni so'zma-so'z ko'chirmang. Emojini ma'noga mos tanlang.
3. **video.json yozish.** `tools/motion-video/examples/montaj.json` ni namuna qilib, scratchpad'ga
   yangi fayl yozing. `sceneStarts: null` qoldiring (audiodan avtomatik topiladi), agar foydalanuvchi
   vaqtlarni bermagan bo'lsa.
4. **Render.**
   ```bash
   bash tools/motion-video/scripts/make-video.sh <video.json> [audio] <chiqish.mp4>
   ```
   Chiqish yo'li `tools/motion-video/` ga nisbatan; scratchpad uchun absolyut yo'l bering.
   Birinchi ishga tushishda `npm i` ~30s, 30 soniyalik video render ~45s.
5. **Tekshirish.** Har sahna o'rtasidan kadr oling va ko'zdan kechiring (matn sig'dimi, emoji
   chiqdimi, sahna gapga mosmi):
   ```bash
   ffmpeg -ss <soniya> -i out.mp4 -frames:v 1 kadr.png
   ```
   Skript chiqargan `sceneStarts` ni audio davomiyligi bilan solishtiring. Matn sig'masa — qisqartiring.
6. **Topshirish.** mp4 ni `SendUserFile` bilan yuboring. `sceneStarts` qiymatlarini aytib qo'ying —
   foydalanuvchi aniqroq vaqt aytsa, `video.json` ga yozib qayta render qiling.

## O'zgartirish so'rovlari

"3-sahnadagi yozuvni kattaroq qil", "klik ovozini pasaytir" kabi so'rovlarni avval `video.json`
(`sfxVolume`, `sfx: "none"`, matn) orqali hal qiling; faqat yangi animatsiya turi kerak bo'lsa
`src/Reels.tsx` + `src/types.ts` ni o'zgartiring va `npx tsc` bilan tekshiring.

## Eslatmalar

- Audio bo'lmasa — ovozsiz video, har sahna `fallbackSceneSeconds` (standart 4s).
- Avto-vaqt ffmpeg `silencedetect` ga asoslangan: eng uzun N-1 pauza = sahna chegaralari.
  Shovqinli yozuvda xato bo'lishi mumkin — kadrlarni tekshiring.
- Linux'da emojilar Noto, Mac'da Apple uslubida chiqadi.
- Bulut muhitida `/opt/pw-browsers` dagi Chromium avtomatik ishlatiladi; boshqa joyda Remotion o'zi yuklaydi
  (`BROWSER=<yo'l>` bilan o'zgartirish mumkin).

---

# B rejim: odam gapirayotgan video → so'zlarga mos motion emoji

Foydalanuvchi o'zi (yoki boshqa odam) gapirayotgan video bersa va "so'zlariga qarab emoji bilan
montaj qil" desa — shu rejim. Skript: `tools/motion-video/scripts/make-talk.sh`, komponent: `src/Talk.tsx`.

1. **So'zlarni olish** (vaqti bilan, `words.json`: `[{word,start,end}]`). Tartib bo'yicha urinib ko'ring:
   - `python3 tools/motion-video/scripts/transcribe.py <video> words.json --lang uz --model small`
     (`pip install faster-whisper`; model HuggingFace'dan yuklanadi — bulut sessiyasida tarmoq
     yopiq bo'lishi mumkin);
   - foydalanuvchida `.srt` bo'lsa — `scripts/srt-to-words.mjs`;
   - ulangan transkripsiya connector'i (ElevenLabs `creative_transcribe_audio`, Descript) — kredit
     sarflaydi, avval foydalanuvchidan so'rang;
   - hech biri bo'lmasa: foydalanuvchidan matnni so'rang, vaqtlarni ffmpeg `silencedetect` bilan
     gaplarga bo'lib, so'zlarga harf soni bo'yicha taqsimlang.
2. **Cues yozish (asosiy AI qadam).** Transkriptni o'qing va emoji'ni ma'noga qarab o'zingiz tanlang —
   lug'at (`auto-cues.mjs`) faqat zaxira. Qoidalar:
   - kalit so'z boshlanganda (`at` = o'sha so'zning `start`i) chiqsin;
   - har 1.5–3 soniyada ko'pi bilan bitta emoji; har gapda 1–2 ta;
   - his-tuyg'u (😱 hayrat, 😂 kulgi), narsa (💰 📱 🚗), harakat (🚀 💪), raqam/natija (📈 🏆) — eng kuchli joylar;
   - urg'uli joyda `anim: "burst"` yoki `"shake"`, muhim so'zga `text` (1–2 so'z, KATTA HARF);
   - yuzni yopmaslik uchun `position: "auto"` yoki tepa burchaklar.
3. **Render:** `bash tools/motion-video/scripts/make-talk.sh <video> <out.mp4> <words.json> <cues.json>`
   (yo'llar absolyut yoki joriy papkaga nisbatan).
4. **Tekshirish:** har cue vaqtidan +0.3s kadr oling — emoji yuzni yopmayaptimi, subtitr o'qiladimi.
5. mp4 ni `SendUserFile` bilan yuboring va qaysi so'zga qaysi emoji qo'yilganini qisqa ro'yxat qiling.
