# motion-video — skriptdan animatsiyali video (avtomatik)

"AI bilan motion video: qadamma-qadam qo'llanma"ning avtomatlashtirilgan varianti.
Qo'llanmadagi 5 qadam (o'rnatish, fayllarni joylash, shrift, SFX, vaqtni to'g'rilash, render)
bitta buyruqqa aylantirilgan. Har yangi video uchun faqat **`video.json`** yoziladi —
`Reels.tsx` ni qayta yozish shart emas.

## Bitta buyruq

```bash
bash scripts/make-video.sh examples/montaj.json ~/Downloads/ovoz.mp3 out/reels.mp4
```

Skript o'zi:
1. `npm i` qiladi (birinchi marta);
2. `video.json` ni `src/` ga, audioni `public/` ga qo'yadi;
3. ovoz effektlarini (`pop`, `ding`, `click`, `whoosh`) ffmpeg bilan yasaydi — `sfx.zip` kerak emas;
4. audiodagi pauzalardan har sahna boshlanish vaqtini topadi (qo'llanmadagi `SCENE_STARTS` ni qo'lda yozish o'rniga);
5. video uzunligini audioga tenglaydi va `out/reels.mp4` ni render qiladi.

Audio berilmasa — ovozsiz video, har sahna `fallbackSceneSeconds` soniya.
Ko'rib chiqish uchun: `npm run dev` (Remotion Studio).

Kerak: Node.js 18+, ffmpeg (`brew install ffmpeg`).

## video.json

| Maydon | Ma'nosi |
|---|---|
| `width`/`height` | 1080x1080 (1:1) yoki 1080x1920 (9:16 Reels) |
| `background`, `color`, `accent` | fon, matn, urg'u rangi |
| `sceneStarts` | `null` = audiodan avtomatik; yoki `[0, 4.2, 9.5, ...]` soniyalar |
| `sfxVolume` | effektlar ovozi (0–1), standart 0.35 |
| `scenes` | sahnalar ro'yxati (pastda) |

Sahna turlari (`type`):

- `emoji` — katta emoji "pop" bilan + matn. `{ "emoji": "🎬", "text": "..." }`
- `title` — katta sarlavha + `sub`. Effekt: whoosh
- `typing` — so'z harfma-harf yoziladi, klaviatura ovozi bilan. `{ "text": "MONTAJ", "sub": "..." }`
- `counter` — 0 dan `to` gacha sanash + progress chiziq, oxirida "ding". `{ "to": 100, "suffix": "%" }`
- `list` — `title` + `items: [{ "emoji", "text" }]`, ketma-ket chiqadi
- `compare` — `left` → `right` (oldin/keyin)

Har sahnaga `"sfx": "pop" | "ding" | "click" | "whoosh" | "none"` bilan effektni almashtirish mumkin.
Barcha sahnalarda ixtiyoriy `emoji` bor (`list`/`compare` dan tashqari).

## Xatolar

| Muammo | Yechim |
|---|---|
| Animatsiya gapdan oldin/keyin chiqadi | `sceneStarts` ni qo'lda yozing yoki pauzalar aniqroq bo'lishi uchun gaplar orasida 0.3s+ to'xtang |
| Video juda qisqa/uzun | audio yo'li to'g'riligini tekshiring |
| Effekt ovozlari yo'q | `bash scripts/make-sfx.sh` |

---

# Odam gapirayotgan video + so'zlariga mos motion emoji

Video ichidagi gapni so'zma-so'z vaqti bilan aniqlaydi va har mos so'z chiqqanda ustiga
sakrab chiquvchi emoji (pop/shake/burst + ovoz effekti) hamda Reels uslubidagi subtitr
(joriy so'z sariq bilan ajratiladi) qo'yadi.

```bash
bash scripts/make-talk.sh ~/Downloads/video.mp4 out/natija.mp4
```

Bosqichlar:
1. **Transkripsiya** — `scripts/transcribe.py` (faster-whisper, so'z vaqtlari bilan).
   Bir marta: `pip install faster-whisper`. Til: `LANG_CODE=uz` (standart), model: `WHISPER_MODEL=small`
   (o'zbekcha uchun `medium` aniqroq). Internet yo'q bo'lsa — tayyor `.srt` yoki `words.json` bering:
   `bash scripts/make-talk.sh video.mp4 out.mp4 subs.srt`
2. **Emoji tanlash** — `scripts/auto-cues.mjs` (o'zbek/rus/ingliz lug'ati) yoki o'zingiz yozgan
   `cues.json` (4-argument). Claude odatda transkriptni o'qib, cues'ni ma'noga qarab o'zi yozadi.
3. **Render** — o'lcham, fps va uzunlik videodan olinadi.

`cues.json` namunasi:
```json
[
  { "at": 0.3, "emoji": "👋" },
  { "at": 2.1, "emoji": "💰", "anim": "burst", "text": "PUL" },
  { "at": 4.0, "emoji": "😱", "anim": "shake", "position": "topLeft", "duration": 1.8 }
]
```
`position`: `auto | top | topLeft | topRight | left | right | center | bottomLeft | bottomRight`
(`auto` yuzni yopmaslik uchun tepa/yon burchaklarni almashtirib turadi). `sfx`: `pop | ding | click | whoosh | none`.
Subtitrni o'chirish: `CAPTIONS=0`.
