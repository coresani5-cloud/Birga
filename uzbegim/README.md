# Uzbegim — fast food yetkazib berish sayti

## Ishga tushirish

```bash
node uzbegim/server.js
```

Qo'shimcha paket o'rnatish shart emas (Node 18+). Keyin brauzerda:

| Sahifa | Manzil | Kim uchun |
|---|---|---|
| Sayt | http://localhost:8080/ | Mijozlar: ro'yxatdan o'tish, buyurtma, kuzatuv |
| Oshxona paneli | http://localhost:8080/admin.html | Xodimlar (PIN: `1234`) |
| Kuryer | http://localhost:8080/courier.html | Kuryerlar (PIN: `0000`) |

PIN va portni o'zgartirish: `PORT=80 ADMIN_PIN=... COURIER_PIN=... node uzbegim/server.js`

## Buyurtma qanday yuradi

1. Mijoz ro'yxatdan o'tadi (ism, telefon, parol), manzilni yozadi va xaritada belgilaydi.
2. Oshxona panelida buyurtma ovozli signal bilan chiqadi. Xodim bosadi: **Qabul qilish → Tayyorlashni boshlash → Tayyor**.
3. Kuryer sahifasida "Olib ketishga tayyor" ro'yxatidan **Oldim, yo'lga chiqdim** ni bosadi — telefon GPS'i yoqiladi.
4. Mijoz xaritada kuryerni, masofa va qolgan vaqtni ko'radi; 350 m qolganda "Kuryer yetib kelay dedi" chiqadi.
5. Kuryer **Yetkazdim** ni bosadi.

Mijozdagi holat belgilari faqat xodim yoki kuryer bosgandagina yonadi.

## Muhim

- Telefonlarda GPS faqat **https://** manzilda ishlaydi. Serverni HTTPS bilan (masalan Render, Railway yoki Nginx + Let's Encrypt) joylang.
- Ma'lumotlar `uzbegim/data/` papkasida JSON fayllarda saqlanadi (git'ga kirmaydi).
- SMS orqali tasdiqlash yo'q: ro'yxatdan o'tish telefon + parol bilan.
- `index.html` faylini serversiz ochsangiz, sayt **demo rejimda** ishlaydi: holatlar avtomatik o'zgaradi.
- Narxlar Toshkent fast food tarmoqlarining odatiy narxlari asosida qo'yilgan namuna. `index.html` ichidagi `P` ro'yxatida o'zgartiriladi.
