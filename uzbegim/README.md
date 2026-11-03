# Uzbegim — fast food yetkazib berish sayti

```bash
node uzbegim/server.js
```

Qo'shimcha paket kerak emas (Node 18+).

| Sahifa | Kim uchun |
|---|---|
| `/` | Mijozlar: ro'yxatdan o'tish, buyurtma, jonli kuzatuv, bekor qilish, baho |
| `/admin.html` | Oshxona: buyurtmalar, stop-list, hisobot, xodimlar |
| `/courier.html` | Kuryerlar: buyurtmani olish, GPS, yetkazdim |

## Sozlamalar (environment)

| O'zgaruvchi | Vazifasi |
|---|---|
| `ADMIN_PIN` | Bosh admin PIN. Shu bilan kirib, Xodimlar bo'limida oshxona xodimlari va kuryerlarni qo'shasiz |
| `COURIER_PIN` | Ixtiyoriy: umumiy kuryer PIN (ism + telefon bilan kiriladi) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Berilsa, ma'lumotlar Supabase'da saqlanadi va server qayta ishga tushganda o'chmaydi |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Berilsa, har yangi buyurtma Telegram guruhga keladi |
| `OPEN_FROM`, `OPEN_TO` | Ish vaqti, Toshkent vaqti bo'yicha soat (standart 9 va 3) |

Supabase jadvali:

```sql
create table uz_store (coll text not null, id text not null, data jsonb not null, primary key (coll, id));
alter table uz_store enable row level security;  -- faqat server (service key) kira oladi
```

## Qoidalar

- Narx, yetkazish va chegirmani server hisoblaydi.
- Yetkazishda xaritada nuqta majburiy. Buyurtma eng yaqin filialga tushadi. Yetkazish narxi: 3 km gacha 10 000, 6 km — 14 000, 10 km — 18 000, 15 km — 24 000 so'm; 15 km dan uzoq qabul qilinmaydi; 150 000 so'mdan yuqori bepul.
- Ish vaqtidan tashqari buyurtma qabul qilinmaydi.
- UZBEGIM10 faqat birinchi buyurtmaga, SALOM va BEPUL har mijozga bir marta.
- Mijoz buyurtmani oshxona qabul qilguncha bekor qila oladi; oshxona sabab bilan rad etadi.
- Kuryer faqat "Tayyor" buyurtmani oladi va faqat o'z buyurtmasining GPS'ini yuboradi.
- Filialga biriktirilgan xodim faqat o'z filiali buyurtmalarini ko'radi.
