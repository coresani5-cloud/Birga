# Birga — messenjer

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/coresani5-cloud/birga)


Telegram / WhatsApp / Max uslubidagi mustaqil messenjer. Boshqa hech qanday ilovaga bog'liq emas:
foydalanuvchi faqat telefon raqami va SMS kod bilan ro'yxatdan o'tadi.

## Imkoniyatlar
- **Barcha davlatlar**: 240+ davlat ro'yxati, qidiruv, bayroq, raqamni avtomatik formatlash va tekshirish (libphonenumber). Davlat foydalanuvchi joylashuviga qarab avtomatik tanlanadi.
- **SMS kod** → tasdiqlash → ro'yxatdan o'tish (ism, @username, rasm). Android'da kod SMS'dan avtomatik o'qiladi.
- **3 til**: o'zbek, rus, ingliz (brauzer tiliga qarab avtomatik, menyudan almashtiriladi). SMS matni ham tanlangan tilda.
- **Ovozli xabar** — haqiqiy yozib olish: bosib turing; chapga suring = bekor; yuqoriga suring = qulflash.
- **Yumaloq video xabar** — haqiqiy kamera: tugmani bir marta bosing → kamera rejimi, bosib turing. Yozish davomida old/orqa kamerani almashtirish mumkin.
- Server ovozli/video xabarlarni **ffmpeg** orqali universal formatga o'tkazadi (M4A/MP4) — Android, iPhone va kompyuterda bir xil ochiladi.
- Rasm, video, istalgan fayl (izoh bilan, sudrab tashlash, Ctrl+V).
- **Audio va video qo'ng'iroqlar (xalqaro)**: o'z TURN serveringiz (coturn) orqali turli davlat va mobil operatorlar orasida ham ulanadi; tarmoq uzilsa avtomatik qayta ulanadi; audio qo'ng'iroq davomida kamerani yoqish mumkin.
- **Push bildirishnomalar**: ilova yopiq bo'lsa ham xabar va kiruvchi qo'ng'iroq keladi. Ilovasi yopiq odamga qo'ng'iroq qilinsa, u bildirishnomani bosib ochganda qo'ng'iroq unga yetkaziladi.
- Maxfiylik: telefon raqami boshqa foydalanuvchilarga ko'rsatilmaydi.
- Himoya: SMS firibgarligidan ("SMS pumping") himoya — raqam/IP/davlat bo'yicha limitlar, kod 5 daqiqa amal qiladi, 5 ta urinish.

## SMS haqida (muhim)
Har qanday davlatdagi oddiy telefonga SMS yuborish **dunyoning hech qayerida butunlay bepul emas** — har bir SMS uchun
operator pul oladi. Birga uchun eng arzon variantlar:

| Usul | Narx | Qaysi davlatlar |
|---|---|---|
| **O'z Android telefoningiz + SIM** ([SMS Gateway for Android](https://sms-gate.app), ochiq kodli) | faqat SIM tarifi (cheksiz SMS paketi bilan deyarli bepul) | asosan o'z davlatingiz |
| Eskiz.uz | arzon | O'zbekiston |
| Twilio | davlatga qarab | barcha davlatlar |

Bir vaqtda bir nechtasini ishlatish mumkin:
```
SMS_ROUTES=998:gateway,*:twilio
```
(O'zbekiston raqamlari — o'z SIM kartangiz orqali, boshqa davlatlar — Twilio orqali.)

### Android telefonni SMS shlyuzga aylantirish
1. Eski Android telefonga SIM karta qo'ying (cheksiz SMS tarifi bilan).
2. https://sms-gate.app dan "SMS Gateway for Android" ilovasini o'rnating.
3. Ilovada **Cloud server** rejimini yoqing — login va parol beradi.
4. `.env` ga yozing: `SMS_PROVIDER=gateway`, `GATEWAY_USER=…`, `GATEWAY_PASS=…`
5. Telefon zaryadda va internetga ulangan holda tursin.

## Serverga o'rnatish (Ubuntu 22.04 / 24.04 VPS)
```bash
unzip birga.zip && cd birga
sudo bash install.sh
```
Skript hammasini o'rnatadi: Node.js, ffmpeg, HTTPS (Caddy + bepul Let's Encrypt), TURN server (coturn), avtomatik ishga tushish.
Domen bo'lmasa, bepul manzil beriladi: `1-2-3-4.sslip.io`.

Bulut provayderingiz panelida shu portlarni oching: **80, 443 (TCP), 3478 (TCP+UDP), 49152–65535 (UDP)**.

Server talabi: 1–2 vCPU, 2 GB RAM boshlanishi uchun yetarli (bir necha ming foydalanuvchi). Qo'ng'iroqlar to'g'ridan-to'g'ri
foydalanuvchilar orasida o'tadi; faqat to'g'ridan-to'g'ri ulanib bo'lmaganda TURN orqali.

### Docker
```bash
docker build -t birga .
docker run -d -p 3000:3000 -v birga-data:/data --env-file .env birga
```
(HTTPS uchun oldiga Caddy/Nginx qo'ying, TURN uchun coturn alohida.)

## Render.com orqali bepul sinab ko'rish (bir tugma)
Yuqoridagi **Deploy to Render** tugmasini bosing → Render hisobi bilan kiring → **Apply**. Bir necha daqiqada
`https://birga-xxxx.onrender.com` ko'rinishidagi havola tayyor bo'ladi.

Bepul rejaning cheklovlari: 15 daqiqa hech kim kirmasa server "uxlaydi" (keyingi ochilish ~1 daqiqa), qayta ishga
tushganda ma'lumotlar (foydalanuvchilar, xabarlar) o'chadi, TURN server yo'q. Shuning uchun bu faqat **sinov** uchun;
haqiqiy foydalanuvchilar uchun VPS + `install.sh` ishlating.

## Telefonda ilova sifatida
- **Android (Chrome)**: saytni oching → "Ilovani o'rnatish".
- **iPhone (Safari)**: Ulashish → "Bosh ekranga qo'shish". Push bildirishnomalar iOS 16.4+ da faqat shu tarzda o'rnatilganda ishlaydi.

## Tuzilma
```
server.js      API, Socket.IO, qo'ng'iroq signallari, SQLite, limitlar
sms.js         SMS: gateway / eskiz / twilio / test, davlat bo'yicha yo'naltirish
media.js       ffmpeg: ovoz -> M4A, video xabar -> 480x480 MP4
push.js        Web Push (VAPID kalitlari avtomatik yaratiladi)
public/        index.html, styles.css, app.js, i18n.js, sw.js
install.sh     bir buyruqli o'rnatish
```

## Keyingi bosqichlar
Guruhlar va kanallar, end-to-end shifrlash, Android/iOS native ilova (Flutter), stikerlar,
katta yuklama uchun PostgreSQL + Redis + bir nechta server, fayllar uchun S3/obyekt saqlash.
