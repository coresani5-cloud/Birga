# O'zbekkhan

O'n ikki viloyatdan iborat tarixiy (XIX asr) O'zbekistonda erkin harakatlanadigan 3D o'yin. Brauzerda ishlaydi va build talab qilmaydi.

## Ishga tushirish

```bash
cd ozbekkhan && python3 -m http.server 8080
```

So'ng brauzerda `http://localhost:8080` ni oching. Statik xosting (GitHub Pages, Render static site) ham yetadi.

## Boshqaruv

WASD — yurish, Shift — yugurish, sichqoncha — kamera, Probel — sakrash yoki atlas qanot, E — harakat, F — ulovga minish yoki ulovni tortib olish, G — o'g'irlash, LKM — musht, Q — salom berish, M — xarita, R — radio, Esc — pauza. Telefonda joystik va tugmalar bor.

## Tuzilma

- `js/build.js` — shahar quruvchi: devorlar, mahallalar, bozor, hovuz, choyxona va har viloyat yodgorliklari.
- `js/lighting.js` — HDRI osmon, kun-tun almashinuvi, oy, fonuslar, ob-havo (chang bo'roni, yomg'ir) va rang korreksiyasi.
- `js/rig.js` — AI yaratgan statik personajlarga avtomatik skelet ulaydi.
- `js/actors.js` — animatsiya; sodda (zaxira) odam va hayvon modellari.
- `js/props.js` — Poly Haven buyumlari (instancing orqali).
- `js/missions.js` — viloyat va mahalla topshiriqlari.
- `js/audio.js` — sintez qilingan milliy cholg'ular va radio to'lqinlari. `music/playlist.json` faylida o'zingiz huquqiga ega bo'lgan mp3 qo'shiqlar ro'yxatini bersangiz, radio ularni ham chaladi.
- `tools/gen_chars.py` — personaj yaratish: FLUX bilan rasm, TRELLIS bilan 3D. Hugging Face tokeni talab qilinadi.
- `assets/` — teksturalar, HDRI osmon, modellar. Litsenziyalar `assets/LICENSES.txt` faylida.
