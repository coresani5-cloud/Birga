# Qaydla — ovozli yon daftarcha

Aytganingizni **o'zbek** va **rus** tilida matnga aylantirib, **sana va vaqt** bilan varaqqa yozib boradi.

## Imkoniyatlar
- 🎙 Mikrofon tugmasi: bosing, gapiring, matn jonli paydo bo'ladi va avtomatik saqlanadi
- UZ / RU tilini bir bosishda almashtirish
- Har bir qayd sana/vaqt bilan; har bir yozuv oldiga `[14:32]` vaqt belgisi (sozlamada o'chirsa bo'ladi)
- Avtomatik bosh harf va nuqta, rasmiy imlo: `oʻ`, `gʻ`
- Ovozli buyruqlar: *nuqta, vergul, so'roq belgisi, yangi qator* / *точка, запятая, новая строка*…
- Ovoz yozuvini ham saqlab, keyin qayta eshitish (ixtiyoriy)
- Qidiruv, mixlash, kalendar, haftalik/oylik statistika, TXT/JSON eksport
- Qorong'i / yorug' mavzu, telefonga o'rnatiladi (PWA), internetsiz ochiladi
- 🔒 Kirish kodi (4 xonali PIN): ilovani ochishda va undan chiqqanda qulflanadi, 5 marta xato kiritilsa kutish vaqti qoʻyiladi

## Ishga tushirish
Papkani istalgan statik hostingga qo'ying (GitHub Pages, Netlify, Render static) — HTTPS shart (mikrofon uchun).
Lokal sinash:

```bash
cd qaydla && python3 -m http.server 8080
```

so'ng Chrome'da `http://localhost:8080` ni oching.

## Muhim
Ovozni tanish brauzerning Web Speech API'si orqali ishlaydi: **Chrome, Edge, Samsung Internet** (Android/kompyuter).
Firefox qo'llamaydi. Tanish uchun internet kerak. Qaydlar faqat qurilmada (IndexedDB) saqlanadi.
