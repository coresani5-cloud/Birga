# Uzbegim — Namangan fast food yetkazib berish sayti

```bash
node uzbegim/server.js
```

Qo'shimcha paket kerak emas (Node 18+).

| Sahifa | Kim uchun |
|---|---|
| `/` | Mijozlar: ro'yxatdan o'tish, buyurtma, jonli kuzatuv, bekor qilish, baho, parolni o'zgartirish |
| `/admin.html` | Oshxona: buyurtmalar, menyu (narx, yangi mahsulot, o'chirish, rasm, stop-list), hisobot va Excel, sozlamalar, filiallar, xodimlar |
| `/courier.html` | Kuryerlar: tayyor buyurtmani olish, filial va mijoz manzili, navigator, GPS, "yetkazdim" |

## Sozlamalar (environment)

| O'zgaruvchi | Vazifasi |
|---|---|
| `ADMIN_PIN` | Bosh admin PIN (kamida 8 raqam tavsiya etiladi). Berilmasa, birinchi ishga tushishda tasodifiy PIN yaratiladi va server logida ko'rsatiladi |
| `COURIER_PIN` | Ixtiyoriy: umumiy kuryer PIN (ism + telefon bilan kiriladi). `ADMIN_PIN` bilan bir xil bo'lmasin |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `UZ_DB_SECRET` | Ma'lumotlar Supabase'da (maxfiy kalit bilan himoyalangan `uz_load`/`uz_upsert` funksiyalari orqali) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Muqobil: to'g'ridan-to'g'ri jadvalga |
| `TELEGRAM_BOT_TOKEN` | Telegram bot (@BotFather'dan). Bot menyusida «Menyu» tugmasi saytni Telegram ichida ochadi, /start ga javob beradi, guruhda /chatid — guruh raqamini aytadi |
| `TELEGRAM_CHAT_ID` | Oshxona guruhi raqami (/chatid bilan olinadi) — har yangi buyurtma shu guruhga keladi |
| `OPEN_FROM`, `OPEN_TO` | Boshlang'ich ish vaqti (O'zbekiston vaqti, standart 9 va 3). Keyin panelning "Sozlamalar" bo'limida o'zgartiriladi |
| `PUBLIC_URL` | Ixtiyoriy: saytning to'liq manzili (masalan `https://uzbegim.uz`) — havola ulashilganda rasm uchun |

Supabase jadvali:

```sql
create table uz_store (coll text not null, id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (coll, id));
alter table uz_store enable row level security;  -- to'g'ridan-to'g'ri kirish yo'q, faqat funksiyalar orqali
```

## Oshxonaga o'rnatish

1. **Filial**: panel → "Filiallar" → "Markaziy filial"ni oching, aniq manzilni yozing va xaritada joyini belgilang. Boshqa filiallar bo'lsa qo'shing.
2. **Menyu**: panel → "Menyu" → narxlarni o'zingiznikiga moslang, o'z rasmlaringizni yuklang, kerakmas taomni yashiring, yangi taom qo'shing.
3. **Sozlamalar**: ish vaqti, yetkazish narxi va bepul yetkazish chegarasi.
4. **Xodimlar**: har bir kuryer va oshxona xodimiga shaxsiy telefon + PIN bering (umumiy PIN o'rniga).
5. **Oshxona planshet/kompyuteri**: `admin.html`ni oching, kirgach ekranga bir marta bosing (ovoz yoqiladi). "Sozlamalar → Shu qurilma"da takroriy signal, ekran o'chmasligi va avtomatik chekni yoqing. 80 mm termoprinter; Chrome `--kiosk-printing` bilan ochilsa chek oynasiz chiqadi.
6. **Telegram** (tavsiya): @BotFather'da bot yarating va `TELEGRAM_BOT_TOKEN`ni kiriting — mijozlar t.me/<bot> orqali menyuni ochadi. Botni oshxona guruhiga qo'shib, guruhda /chatid yozing va chiqqan raqamni `TELEGRAM_CHAT_ID`ga kiriting — panel yopiq bo'lsa ham buyurtma telefoningizga keladi.
7. Saytdagi telefon raqami, Instagram/Telegram va oferta rekvizitlarini haqiqiysiga almashtiring.

## Qoidalar

- Narx, yetkazish va chegirmani server hisoblaydi (paneldagi menyu va sozlamalar asosida).
- Yetkazishda xaritada nuqta majburiy. Buyurtma eng yaqin ochiq filialga tushadi. Standart yetkazish narxi: 3 km gacha 10 000, 6 km — 14 000, 10 km — 18 000, 15 km — 24 000 so'm; 15 km dan uzoq qabul qilinmaydi; 150 000 so'mdan yuqori bepul.
- Ish vaqtidan tashqari va "pauza" paytida buyurtma qabul qilinmaydi. Bitta filial to'xtatilsa, yetkazish keyingi eng yaqin filialga tushadi.
- UZBEGIM10 faqat birinchi buyurtmaga, SALOM va BEPUL har mijozga bir marta.
- Bir mijozda bir vaqtda 3 tagacha faol buyurtma. Birinchi buyurtmada "Yangi mijoz" belgisi chiqadi — qo'ng'iroq qilib tasdiqlang.
- Mijoz buyurtmani oshxona qabul qilguncha bekor qila oladi; oshxona sabab bilan rad etadi.
- Kuryer faqat "Tayyor" buyurtmani oladi va faqat o'z buyurtmasining GPS'ini yuboradi.
- Filialga biriktirilgan xodim faqat o'z filiali buyurtmalarini ko'radi va faqat o'z filialini to'xtata oladi.
- Noto'g'ri parol/PIN: bitta telefonga 15 daqiqada 8 ta, bosh admin PIN'iga 10 daqiqada 20 ta urinishdan keyin vaqtincha blok.
- Mijoz parolini unutsa, oshxona "Sozlamalar → Mijoz parolini tiklash"da vaqtinchalik parol beradi.
