# Instagram "comment-to-DM" bot (Cloudflare Workers + KV)

@sardorxoon postlariga **"AI"** (ai, Ai, АИ, аи, "AI!", "ai🔥") deb izoh yozilsa:

1. izohga ochiq javob beradi (tasodifiy variant): `Direct'ni tekshiring 📩` / `Yubordim 🔥` / `Qo'llanma Direct'da 👌`
2. Direct'ga **private reply** yuboradi: obuna bo'lish iltimosi va 2 ta tugma
   `[👤 Profilga o'tish]` `[✅ Obuna bo'ldim]`
3. "Obuna bo'ldim" bosilganda `is_user_follow_business` tekshiriladi:
   - obuna bo'lgan → `Rahmat! 🎁 Mana qo'llanma: <QOLLANMA_URL>` (bitta odamga **bir marta**)
   - obuna bo'lmagan → `Obunangizni ko'rmayapman 🙂 ...` + o'sha ikki tugma

Bitta izohga bir marta javob beriladi. Webhook imzosi (`X-Hub-Signature-256`, APP_SECRET) tekshiriladi.
Token har dushanba avtomatik yangilanadi (cron), chunki long-lived token 60 kun yashaydi.

| Fayl | Nima |
|---|---|
| `src/index.js` | Worker kodi |
| `wrangler.toml` | sozlamalar (secretlar yo'q!) |
| `test/worker.test.mjs` | testlar: `npm test` |

---

## 0-qadam. Instagram akkauntni tayyorlash

1. @sardorxoon **Professional** akkaunt bo'lishi kerak (Business yoki Creator):
   Instagram → Sozlamalar → *Account type and tools* → *Switch to professional account*.
2. Direct'ga dastur kirishiga ruxsat:
   Instagram → Sozlamalar → *Messages and story replies* → *Message controls* →
   *Connected tools* → **Allow access to messages** ni yoqing.
   Busiz private reply va tugmalar ishlamaydi.

## 1-qadam. Meta ilova yaratish

1. https://developers.facebook.com/apps → **Create app**.
2. Use case: **"Manage messaging & content on Instagram"** ni tanlang (Facebook sahifa kerak emas).
3. Ilova nomi: masalan `Sardorxoon Bot`, email — o'zingizniki. *Create app*.
4. Chap menyu → **Instagram** → **API setup with Instagram login**.
5. **Permissions** ro'yxatida quyidagilar bo'lsin (odatda o'zi qo'shiladi):
   - `instagram_business_basic` — profil va obunani tekshirish
   - `instagram_business_manage_comments` — izohga javob va comment webhook
   - `instagram_business_manage_messages` — Direct xabar, tugma, postback
6. **"1. Generate access tokens"** bo'limida → *Add account* → @sardorxoon bilan kiring →
   ruxsat bering → **Generate token**. Chiqqan tokenni nusxalang (bu `IG_ACCESS_TOKEN`).
   Tokenni hech kimga ko'rsatmang va hech qayerga yozmang — faqat 3-qadamdagi buyruqqa qo'ying.
7. Shu sahifaning tepasida **Instagram app secret** bor → *Show* → nusxalang (bu `APP_SECRET`).

## 2-qadam. Cloudflare'ga joylash (tekin tarif)

Kompyuteringizda (Node.js 18+ kerak), shu papkada:

```bash
npm i
```

```bash
npx wrangler login
```

KV ombor yaratish — chiqqan `id` ni `wrangler.toml` dagi `KV_NAMESPACE_ID_NI_SHU_YERGA_QOYING` o'rniga qo'ying:

```bash
npx wrangler kv namespace create KV
```

Secretlarni kiriting (har biri qiymatni so'raydi, ekranda ko'rinmaydi):

```bash
npx wrangler secret put IG_ACCESS_TOKEN
```

```bash
npx wrangler secret put APP_SECRET
```

```bash
npx wrangler secret put VERIFY_TOKEN
```

```bash
npx wrangler secret put QOLLANMA_URL
```

`VERIFY_TOKEN` — o'zingiz o'ylab topgan istalgan uzun so'z (masalan `sardor-bot-7f3k29`). 4-qadamda yana kerak bo'ladi.

Joylash:

```bash
npx wrangler deploy
```

Natijada manzil chiqadi: `https://ig-comment-bot.<sizning-nomingiz>.workers.dev`.
Webhook manzili: **`https://ig-comment-bot.<sizning-nomingiz>.workers.dev/webhook`**

Loglarni jonli ko'rish (sinash paytida foydali):

```bash
npx wrangler tail
```

## 3-qadam. Webhook'ni ulash

1. Meta ilova → Instagram → API setup with Instagram login → **"2. Configure webhooks"**.
2. **Callback URL**: `https://ig-comment-bot.<...>.workers.dev/webhook`
3. **Verify token**: `VERIFY_TOKEN` ga yozgan so'zingiz.
4. **Verify and save**. Xato chiqsa — URL oxirida `/webhook` borligini va so'z bir xilligini tekshiring.
5. Webhook fields ro'yxatida **Subscribe** qiling: `comments`, `messages`, `messaging_postbacks`.
6. "1. Generate access tokens" bo'limiga qayting va @sardorxoon yonidagi
   **Webhook subscription** tugmasini yoqing (On).

> Agar `wrangler tail` da `bad signature` (401) ko'rsangiz: `APP_SECRET` ga noto'g'ri secret qo'yilgan.
> Avval *Instagram app secret* ni, bo'lmasa *App settings → Basic → App secret* ni qo'yib ko'ring
> (`npx wrangler secret put APP_SECRET` ni qayta ishga tushiring).

## 4-qadam. Tester qo'shib sinash

Ilova **Development** rejimida bo'lganda webhook faqat ilovaga biriktirilgan akkauntlardan keladi.
Shuning uchun boshqa akkauntni tester qilib qo'shing:

1. Meta ilova → **App roles** → **Roles** → *Add People* → **Instagram Tester** → tester akkaunt nomini yozing.
2. Tester akkauntda: brauzerda https://www.instagram.com/accounts/manage_access/ →
   **Tester Invites** → *Accept*.
3. Sinov:
   - tester akkauntdan @sardorxoon postiga `AI` deb yozing;
   - 2–5 soniyada izohga javob chiqadi va Direct'ga tugmali xabar keladi
     (Direct'da *Requests/So'rovlar* papkasiga tushishi mumkin);
   - obuna bo'lmasdan **✅ Obuna bo'ldim** ni bosing → "Obunangizni ko'rmayapman" kelishi kerak;
   - obuna bo'ling, 5–10 soniya kuting, yana bosing → qo'llanma havolasi keladi;
   - yana bosing → "Qo'llanma sizga avval yuborilgan ✅".
4. Biror narsa ishlamasa — `npx wrangler tail` da xato matnini ko'ring.

Qayta sinash uchun KV'dagi belgilarni o'chirish (Cloudflare dashboard → Workers KV → yozuvlar):
`comment:<izoh_id>` va `sent:<foydalanuvchi_id>`.

## 5-qadam. App Review (hamma uchun ishlashi uchun)

Testerlardan boshqa odamlar uchun ishlashi uchun 3 ta ruxsatga **Advanced Access** kerak.

Oldindan tayyorlang:
- **Privacy Policy URL** (maxfiylik siyosati sahifasi) va **Data deletion** yo'riqnomasi URL'i —
  App settings → Basic ga kiritiladi;
- ilova ikonkasi (1024×1024), kategoriya: *Business and pages*;
- kerak bo'lsa **Business verification** (Meta so'rasa).

Keyin: App Dashboard → **App Review** → **Permissions and features** → har bir ruxsat yonida
*Request advanced access*. Ariza matnlari (Meta inglizcha so'raydi, tayyor matn):

**instagram_business_basic**
> Our app is used only by the owner of the Instagram professional account @sardorxoon. We use instagram_business_basic to read the account's own profile ID and, after a user taps the "I followed" button in our Direct message, to read the is_user_follow_business field of that user's profile. This tells us whether the user follows @sardorxoon, so we can send the free guide they requested. We do not store profile data except the user's Instagram-scoped ID, kept only to avoid sending the guide twice.

**instagram_business_manage_comments**
> When someone comments the keyword "AI" on a post of @sardorxoon, we receive the comment via the comments webhook and post one short public reply to that comment (e.g. "Check your Direct 📩"). Each comment is answered at most once. We do not hide, delete or moderate comments.

**instagram_business_manage_messages**
> After a user comments "AI", we send them a single private reply in Direct containing instructions and two buttons: a link to the @sardorxoon profile and an "I followed" postback button. When the user taps the postback button, we reply in the same conversation either with the requested guide link or with a reminder to follow first. Messages are only sent in response to the user's own comment or button tap, within Instagram's messaging window. No promotional broadcast messages are sent.

**Screencast ssenariysi** (bitta video, 2–3 daqiqa, ekranni yozib olish; inglizcha subtitr qo'shish yaxshi):

1. Meta App Dashboard'da ilova va 3 ta ruxsat ko'rinib turgan sahifani ko'rsating.
2. Brauzerda @sardorxoon bilan Instagram Login oqimini ko'rsating (*Generate token* → login → ruxsatlar oynasi).
3. Telefonda yoki ikkinchi oynada **tester akkaunt** bilan @sardorxoon postini oching → `AI` deb izoh yozing.
4. Izoh ostida bot javobi paydo bo'lganini ko'rsating (**manage_comments**).
5. Tester Direct'ini oching → tugmali xabarni ko'rsating (**manage_messages**).
6. Obuna bo'lmasdan **✅ Obuna bo'ldim** ni bosing → "Obunangizni ko'rmayapman" javobi (**business_basic** — obuna tekshiruvi).
7. *Follow* qiling → yana bosing → qo'llanma havolasi kelganini ko'rsating.
8. Yana bosing → "avval yuborilgan" javobini ko'rsating (takror yuborilmaydi).

Har bir ruxsat arizasiga shu videoni yuklang va matnda qaysi daqiqada ko'rinishini yozing
(masalan *"0:45 — public reply, 1:05 — private reply"*). Tasdiqlangach ilovani **Live** rejimga o'tkazing
(App Dashboard tepasidagi *App Mode* → *Live*).

---

## Cheklovlar va eslatmalar

- **Private reply** izoh yozilganidan keyin 7 kun ichida va bitta izohga faqat bitta yuboriladi (Instagram qoidasi).
  Foydalanuvchi tugmani bosgach 24 soatlik suhbat oynasi ochiladi — shuning uchun javoblar ishlaydi.
- Tekin tarif: Workers — kuniga 100 000 so'rov, KV — kuniga 1 000 yozuv.
  Bitta "AI" izohi = 1 yozuv, bitta yuborilgan qo'llanma = 1 yozuv. Kuniga ~500+ izohgacha yetadi.
- KV tez-tez yangilanmaydigan (eventually consistent) ombor: Meta bir hodisani bir necha soniya ichida
  ikki marta yuborsa, juda kam hollarda ikki javob ketishi mumkin.
- Token: cron uni har hafta `refresh_access_token` bilan yangilab, KV'ga (`token:access`) yozadi.
  Tokenni almashtirmoqchi bo'lsangiz — `wrangler secret put IG_ACCESS_TOKEN` va KV'dagi `token:access` ni o'chiring.
- Matnlarni o'zgartirish: `src/index.js` tepasidagi `PUBLIC_REPLIES`, `TEXT_*` qatorlari.
- Graph API versiyasi: `wrangler.toml` → `GRAPH_VERSION`.
