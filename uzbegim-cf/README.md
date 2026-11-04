# Uzbegim — uzbegim.pages.dev (Cloudflare Pages)

Bu papka saytning bepul qisqa manzili uchun: `_worker.js` har bir so'rovni Render'dagi asosiy serverga
(`https://uzbegim-hvhk.onrender.com`) uzatadi. Sayt, buyurtma, oshxona paneli va jonli kuzatuv shu manzilda ishlaydi.

## Ulash (bir marta)

1. https://dash.cloudflare.com/sign-up — bepul ro'yxatdan o'ting.
2. **Workers & Pages → Create → Pages → Connect to Git** → GitHub'ni ulang va `coresani5-cloud/Birga` omborini tanlang.
3. **Project name:** `uzbegim` (manzil shundan bo'ladi: `uzbegim.pages.dev`).
4. **Production branch:** Render qaysi tarmoqdan ishlayotgan bo'lsa, o'sha.
5. **Framework preset:** None · **Build command:** bo'sh · **Build output directory:** `uzbegim-cf`
6. **Save and Deploy.** Bir daqiqadan keyin `https://uzbegim.pages.dev` ochiladi.

So'ng Render → Environment'da `PUBLIC_URL=https://uzbegim.pages.dev` qo'yiladi — Google, ulashish rasmi va
Telegram bot shu manzilni ishlatadi.

## Eslatma

- Cloudflare bepul rejasida kuniga 100 000 so'rovgacha. Oddiy fast food uchun yetarli. Oshxona va kuryerlar
  (GPS har 5 soniyada yuboriladi) to'g'ridan-to'g'ri `uzbegim-hvhk.onrender.com` havolasidan foydalansin.
- Asosiy server manzili o'zgarsa: Pages → Settings → Environment variables → `ORIGIN`.
