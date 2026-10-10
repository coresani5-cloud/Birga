# OmniRoute → Claude: Jarvis va Hamrongiz uchun

Hamma narsa serverda bajariladi. Fayllarni serverga ko'chiring:
`scp -r omniroute USER@SERVER_IP:~/`

## 1–3. Docker + OmniRoute

```bash
cd ~/omniroute && sudo bash setup.sh
```

- Docker yo'q bo'lsa o'rnatiladi.
- Konteyner **faqat `127.0.0.1:20128`** da ochiladi (internetga yopiq). Asl buyruqdagi `-p 20128:20128` portni hamma uchun ochib qo'yardi.
- Dashboard paroli va maxfiy kalitlar `/opt/omniroute/omniroute.env` ga yoziladi (chmod 600). Bularsiz OmniRoute standart `CHANGEME` parolidan foydalanardi.
- Agar `omniroute` konteynerini avval o'zingiz ishga tushirgan bo'lsangiz, skript unga tegmaydi. Kalitlar bilan qayta yaratish uchun avval `docker rm -f omniroute` ni o'zingiz bajaring. `omniroute-data` volume'idagi ma'lumotlar o'chmaydi.

Dashboard'ni kompyuteringizdan SSH tunnel orqali oching:

```bash
ssh -L 20128:127.0.0.1:20128 USER@SERVER_IP
# brauzerda: http://localhost:20128   (parol: sudo grep INITIAL_PASSWORD /opt/omniroute/omniroute.env)
```

Birinchi kirgandan keyin parolni **Settings → Security** bo'limida almashtiring.

## 4. Anthropic provayderini qo'shish

1. Dashboard → **Providers** → **Anthropic** ni tanlang (API key bilan ulanadigan turini).
2. `sk-ant-...` kalitni o'zingiz kiriting → **Save** → **Test**. Yashil belgi chiqishi kerak.
   Kalit https://console.anthropic.com → API Keys sahifasida olinadi. Hisobda kredit bo'lishi kerak.

## 5. Har bir bot uchun alohida API kalit

Dashboard → **Endpoints** (API Keys) → **Create key**:
- `jarvis` nomli kalit → Jarvis'ning `.env` fayliga
- `hamrongiz` nomli kalit → Hamrongiz'ning `.env` fayliga

Alohida kalit bo'lsa, har bir botning sarfini ko'rib turasiz va kerak bo'lsa bittasini o'chirib qo'yishingiz mumkin. Ixtiyoriy ravishda kalitga kunlik limit ham qo'yish mumkin.

## 6. Claude modelining aniq nomi + curl testi

```bash
bash test_curl.sh          # kalit yashirin so'raladi, Claude modellari ro'yxati + test javob
```

Ro'yxatdan kerakli modelni tanlang (masalan `cc/claude-sonnet-4-6` ko'rinishida bo'ladi; aniq nom sizning provayderingizga bog'liq) va uni `.env` dagi `OMNIROUTE_MODEL` ga yozing.

## 7–8. Bot kodini o'tkazish

Har bir bot papkasida:

```bash
bash ~/omniroute/find_claude_calls.sh /yo'l/jarvis   # chaqiruv joylarini ko'rsatadi + .backup-SANA/ ga zaxira oladi
cp ~/omniroute/ai_client.py ~/omniroute/test_bots.py /yo'l/jarvis/
cat ~/omniroute/env.example >> /yo'l/jarvis/.env     # keyin kalit va model nomini o'zingiz yozasiz
/yo'l/jarvis/venv/bin/pip install "openai>=1.40" python-dotenv
```

Topilgan joylarni quyidagicha almashtiring:

| Oldin (anthropic) | Keyin (OmniRoute) |
|---|---|
| `from anthropic import AsyncAnthropic`<br>`client = AsyncAnthropic(api_key=...)` | `from ai_client import ask, read_receipt` |
| `r = await client.messages.create(model=..., system=SYS, messages=msgs, max_tokens=N)`<br>`text = r.content[0].text` | `text = await ask(msgs, system=SYS, max_tokens=N)` |
| Vision: `{"type":"image","source":{"type":"base64","media_type":"image/jpeg","data":b64}}` | `text = await read_receipt(image_bytes)`, yoki o'z promptingiz bilan `await ask_with_image(prompt, image_bytes)` |

`.env` dagi `ANTHROPIC_API_KEY` endi kerak emas. Bot ishlashini tekshirib bo'lgach, uni o'zingiz olib tashlaysiz.

## "Tayyor" tekshiruvi

```bash
bash ~/omniroute/test_curl.sh                         # 1) curl → Claude javob qaytaradi
cd /yo'l/jarvis    && venv/bin/python test_bots.py receipt chek.jpg   # 2) chek o'qiladi
cd /yo'l/hamrongiz && venv/bin/python test_bots.py chat               # 3) test xabarga javob
sudo systemctl restart jarvis hamrongiz   # (xizmat nomlari sizda boshqacha bo'lishi mumkin)
```

Ortga qaytarish: `.backup-SANA/` dagi fayllarni joyiga ko'chirib, botni qayta ishga tushiring.
