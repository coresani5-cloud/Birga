# 🎬 AI_SARDORXOON video zavodi

Google Flow'da yasalgan 8 soniyalik kliplarni avtomatik yig'adi, montaj qiladi
(9:16, subtitr, suv belgisi, ixtiyoriy ElevenLabs ovozi), tayyor videoni
**Telegram'ga** yuboradi va siz **✅ Joylash** tugmasini bosganingizdan keyin
uni rasmiy Instagram Graph API orqali **Reels** qilib joylaydi.

```
Flow → Downloads → [kuzatuvchi] → episodes\<nom>\clips\1.mp4, 2.mp4 …
                                        ↓  /yasash yoki zavod.bat build --send
                         final.mp4 + cover.jpg → Telegram [✅] [🕐] [❌]
                                        ↓  ✅
                 Cloudflare R2 (vaqtincha) → Instagram Reels → havola Telegram'ga
```

Hech narsa sizning tasdig'ingizsiz joylanmaydi.

---

## 1. Kompyuterga o'rnatish (bir marta)

1. **Python 3.11+** — <https://www.python.org/downloads/> dan o'rnating.
   O'rnatishda **"Add python.exe to PATH"** belgisini qo'ying.
2. **ffmpeg** — PowerShell'ni oching va yozing:
   ```
   winget install Gyan.FFmpeg
   ```
   Keyin PowerShell'ni yopib qayta oching va `ffmpeg -version` ishlashini tekshiring.
3. Shu `ai_sardorxoon` papkasini kompyuterga ko'chiring, masalan
   `C:\Users\User\AI_SARDORXOON_zavod\`.
4. `start.bat` ni ikki marta bosing. Birinchi marta u:
   - `.venv` virtual muhitini yaratadi va kutubxonalarni o'rnatadi;
   - `.env` faylini yaratib, Notepad'da ochadi. Kalitlarni quyidagi 2–4-bo'limlar
     bo'yicha kiriting, saqlang va `start.bat` ni qayta ishga tushiring.
5. Tekshirish:
   ```
   zavod.bat check
   ```

Epizodlar shu yerda saqlanadi: `C:\Users\User\Videos\AI_SARDORXOON\episodes\`
(`config.yaml` → `paths.base_dir` da o'zgartirish mumkin).

> 🔐 **Xavfsizlik:** barcha token va parollar faqat `.env` faylida turadi.
> Ularni hech kimga yubormang, chatga yozmang. `.env` Git'ga yuklanmaydi.

---

## 2. Telegram bot ochish

1. Telegram'da **@BotFather** ga yozing → `/newbot` → nom va username bering.
2. Bergan tokenni `.env` dagi `TELEGRAM_BOT_TOKEN=` ga qo'ying.
3. `chat_id` ni bilish: `.env` da `TELEGRAM_CHAT_ID=0` qilib turing,
   `start.bat` ni ishga tushiring, botingizga `/chatid` yozing — u raqamni qaytaradi.
   Shu raqamni `TELEGRAM_CHAT_ID=` ga yozing va `start.bat` ni qayta ishga tushiring.

Bot faqat shu `chat_id` dan kelgan buyruq va tugmalarni qabul qiladi.

---

## 3. Instagram API (Meta ilova)

**Talab:** @ai_sardorxoon **Professional** akkaunt bo'lishi kerak
(Instagram → Sozlamalar → Akkaunt turi → *Creator* yoki *Business*).

1. <https://developers.facebook.com/apps> → **Create app**.
2. Use case sifatida **"Manage messaging & content on Instagram"** ni tanlang
   (Instagram API with Instagram Login).
3. Ilova ichida **Instagram → API setup with Instagram login** bo'limiga o'ting.
4. **Permissions** ro'yxatida quyidagilar bo'lishi kerak:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
5. **Generate access tokens** → **Add account** → @ai_sardorxoon bilan kiring va
   ruxsat bering. Ilova *Development* rejimida bo'lsa, akkauntingiz ilovaga
   *Instagram Tester* sifatida qo'shilgan va taklifni qabul qilgan bo'lishi kerak
   (App roles → Roles). Faqat o'z akkauntingizga joylash uchun App Review shart emas.
6. Hosil bo'lgan tokenni `.env` dagi `INSTAGRAM_ACCESS_TOKEN=` ga qo'ying.
7. `zavod.bat check` ni ishga tushiring — u `@username` va **user_id** ni ko'rsatadi.
   O'sha raqamni `INSTAGRAM_USER_ID=` ga yozing.

**Token 60 kun amal qiladi.** Muddati tugashidan oldin yangilang:
```
zavod.bat refresh-token
```
(yangi token avtomatik `.env` ga yoziladi).

> ℹ️ **"AI bilan yaratilgan" belgisi.** Graph API'da hozircha bu belgini qo'yadigan
> alohida maydon yo'q. Shuning uchun zavod caption oxiriga
> `🤖 AI bilan yaratilgan` matnini qo'shadi (`config.yaml` → `instagram.ai_disclosure_text`).
> Rasmiy "AI info" yorlig'ini xohlasangiz, joylangandan keyin ilovada postni
> tahrirlab qo'shishingiz mumkin.

---

## 4. Cloudflare R2 (tekin, 10 GB)

Instagram videoni sizning kompyuteringizdan emas, ochiq internet havolasidan
yuklab oladi. Shuning uchun video bir necha daqiqaga R2'ga qo'yiladi va
joylangandan keyin o'chiriladi.

1. <https://dash.cloudflare.com> → ro'yxatdan o'ting → chap menyuda **R2**
   (karta ma'lumoti so'ralishi mumkin, lekin 10 GB gacha tekin).
2. **Create bucket** → nom bering, masalan `sardorxoon-reels` → `.env` dagi `R2_BUCKET=`.
3. R2 bosh sahifasida **Account ID** ni nusxalang → `R2_ACCOUNT_ID=`.
4. **Manage R2 API Tokens** → **Create API token** → ruxsat: *Object Read & Write*,
   faqat shu bucket → yarating.
   **Access Key ID** → `R2_ACCESS_KEY_ID=`, **Secret Access Key** → `R2_SECRET_ACCESS_KEY=`.
5. `R2_PUBLIC_BASE_URL` ni bo'sh qoldiring — zavod 1 soatlik maxfiy (presigned)
   havola yasaydi. Agar Instagram bu havolani o'qiy olmasa, bucket sozlamalarida
   **Public access → r2.dev subdomain** ni yoqing va `https://pub-....r2.dev`
   manzilini `R2_PUBLIC_BASE_URL=` ga yozing.

---

## 5. Kundalik ish tartibi

1. **Yangi epizod oching** (Telegram'da yoki kompyuterda):
   ```
   /yangi sobir_osh            (Telegram)
   zavod.bat new sobir_osh     (kompyuter)
   ```
   U joriy epizod bo'ladi.
2. **Flow'dan kliplarni yuklab oling.** Downloads'ga tushgan har bir `.mp4`
   avtomatik `episodes\sobir_osh\clips\1.mp4`, `2.mp4`, … ga ko'chadi va
   Telegram'ga "📥 qabul qilindi" xabari keladi. **Tartib muhim** — 1-klipni birinchi yuklang.
3. **`script.json` ni to'ldiring** (subtitr va ovoz uchun):
   ```json
   {
     "title": "Sobir aka oshda",
     "clips": [
       {"file": "1.mp4", "lines": [
         {"speaker": "Xotini",    "text": "Sobir aka, qo'shnilar oshga chaqirdi!", "start": 0.3, "end": 3.8},
         {"speaker": "Sobir aka", "text": "Oshga? Hozir kostyumimni kiyaman!",     "start": 4.0, "end": 7.8}
       ]},
       {"file": "2.mp4", "lines": [
         {"speaker": "Sobir aka", "text": "Osh qani?"}
       ]}
     ]
   }
   ```
   - `start`/`end` — shu klip ichidagi soniyalar. Yozilmasa, vaqt teng bo'linadi
     (ovoz yoqilgan bo'lsa, ovoz uzunligiga qarab).
   - `"voice": false` — shu satrga ElevenLabs ovozi yaratilmaydi (Flow'ning o'z ovozi qoladi).
4. **`caption.txt`** — Instagram matni va hashtaglar.
5. **Montaj va tasdiq:**
   ```
   /yasash                     (Telegram)
   zavod.bat build --send      (kompyuter)
   ```
   Telegram'ga video keladi: **[✅ Joylash] [🕐 Rejalashtirish] [❌ Bekor]**.
   - ✅ — darhol joylaydi va post havolasini qaytaradi.
   - 🕐 — tayyor vaqtlar (Bugun 20:00, +1 soat …) yoki o'zingiz yozasiz:
     `20:30` yoki `2026-11-27 20:30` (Toshkent vaqti).
   - ❌ — bekor qiladi.

### Telegram buyruqlari
| Buyruq | Vazifasi |
|---|---|
| `/epizodlar` | barcha epizodlar va klip soni |
| `/epizod <nom>` | joriy epizodni almashtirish |
| `/yangi <nom>` | yangi epizod |
| `/yasash [nom]` | montaj + tasdiqqa yuborish |
| `/navbat` | rejalashtirilgan postlar (navbatdan olish tugmasi bilan) |
| `/qayta <id>` | xato bo'lgan postni qayta joylash |
| `/chatid` | chat_id ni ko'rsatish |

### Kompyuter buyruqlari (`zavod.bat ...`)
`new`, `use`, `list`, `build [nom] [--send]`, `send [nom]`, `run`, `watch`,
`demo [--send]`, `check`, `refresh-token`.

---

## 6. Ovoz (ElevenLabs, ixtiyoriy)

1. <https://elevenlabs.io> → Profile → **API Keys** → kalitni `.env` dagi
   `ELEVENLABS_API_KEY=` ga qo'ying.
2. Voices bo'limida har qahramon uchun ovoz tanlang, **voice_id** ni
   `config.yaml` → `voice.voices` ga yozing:
   ```yaml
   voice:
     enabled: true
     voices:
       "Sobir aka": "xxxxxxxxxxxxxxxxxxxx"
       "Xotini":    "yyyyyyyyyyyyyyyyyyyy"
   ```
3. `original_volume` — Flow klipining o'z ovozi qancha qolishi (0.25 = 25%).

Bir xil matn uchun ovoz qayta yaratilmaydi (kesh: `episodes\<nom>\voice\`), kredit tejaladi.

---

## 7. Avtomatik ishga tushirish

- `install_autostart.bat` — o'ng tugma → **Run as administrator**.
  Windows'ga kirganingizda zavod o'zi ishga tushadi (Task Scheduler,
  vazifa nomi: *AI_SARDORXOON zavodi*).
- `uninstall_autostart.bat` — o'chirish.
- `start.bat` zavod to'xtab qolsa, 15 soniyadan keyin qayta ishga tushiradi.
- Jurnal: `C:\Users\User\Videos\AI_SARDORXOON\logs\zavod.log`.

---

## 8. Sinov (Instagram'ga joylamasdan)

```
zavod.bat demo            ← rangli sinov kliplaridan 24 soniyalik video yasaydi
zavod.bat demo --send     ← va Telegram'ga yuboradi
```
Sinov videosini Telegram'da ko'ring, lekin **✅ ni bosmang** — **❌ Bekor** ni bosing.

---

## 9. Sozlamalar (`config.yaml`)

| Bo'lim | Nima o'zgartiriladi |
|---|---|
| `video.fit_mode` | `blur` — gorizontal klip atrofida xira fon; `crop` — ekranni to'ldirib kesadi |
| `subtitles` | shrift o'lchami, ranglar (`speaker_colors`), joyi (`position_y`) |
| `watermark` | matn, burchak, shaffoflik |
| `telegram.quick_times` | rejalashtirishdagi tayyor vaqtlar |
| `instagram.ai_disclosure_text` | caption oxiridagi AI belgisi (bo'sh — o'chadi) |

## Muammolar
| Belgisi | Yechim |
|---|---|
| `ffmpeg xatosi` / `ffmpeg topilmadi` | `winget install Gyan.FFmpeg`, keyin terminalni qayta oching |
| Klip ko'chirilmadi | Joriy epizod tanlanmagan: `/epizod <nom>` |
| Tugmalar javob bermaydi | `start.bat` (bot) ishlab turishi kerak |
| `Invalid OAuth access token` | token eskirgan → Meta'da yangi token oling yoki `refresh-token` |
| `Konteyner holati ERROR` | video URL o'qilmadi → `R2_PUBLIC_BASE_URL` ni sozlang (4-bo'lim, 5-qadam) |
| Subtitrda emoji ko'rinmaydi | ataylab olib tashlanadi (shrift emoji chiqarmaydi); caption'da emoji ishlaydi |

Shrift: DejaVu Sans Bold (`fonts/`, erkin litsenziya).
