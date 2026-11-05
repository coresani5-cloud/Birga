---
name: motion-video
description: Skript (va ixtiyoriy audio mp3) dan Remotion orqali minimalist animatsiyali video (Reels/Instagram, 1:1 yoki 9:16) yasash. Foydalanuvchi "video qil", "reels", "motion video", "animatsiyali video", "montaj", skript yoki ovoz fayl bersa ishlating.
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
