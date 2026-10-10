"""OmniRoute orqali Claude'ga ulanish (Jarvis va Hamrongiz uchun umumiy).

Botning papkasiga nusxalang va eski anthropic chaqiruvlari o'rniga ishlating:

    from ai_client import ask, read_receipt

Sozlamalar .env dan olinadi (kalit kodda yo'q):
    OMNIROUTE_BASE_URL=http://127.0.0.1:20128/v1
    OMNIROUTE_API_KEY=...        # har bir bot uchun alohida kalit
    OMNIROUTE_MODEL=...          # /v1/models dan topilgan aniq nom
"""
import base64
import os

from openai import AsyncOpenAI

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

MODEL = os.getenv("OMNIROUTE_MODEL", "")

client = AsyncOpenAI(
    base_url=os.getenv("OMNIROUTE_BASE_URL", "http://127.0.0.1:20128/v1"),
    api_key=os.environ["OMNIROUTE_API_KEY"],
    timeout=float(os.getenv("OMNIROUTE_TIMEOUT", "120")),
    max_retries=2,
)


async def ask(messages, system=None, max_tokens=1024, model=None):
    """Matnli so'rov. messages — [{"role": "user"|"assistant", "content": "..."}]."""
    if system:
        messages = [{"role": "system", "content": system}, *messages]
    resp = await client.chat.completions.create(
        model=model or MODEL, messages=messages, max_tokens=max_tokens
    )
    return resp.choices[0].message.content or ""


def image_part(data: bytes, mime="image/jpeg"):
    """Rasm baytlarini OpenAI formatidagi image_url qismiga aylantiradi."""
    b64 = base64.b64encode(data).decode()
    return {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}


async def ask_with_image(prompt, data: bytes, mime="image/jpeg", system=None, max_tokens=2048, model=None):
    """Vision so'rov: matn + bitta rasm."""
    content = [image_part(data, mime), {"type": "text", "text": prompt}]
    return await ask([{"role": "user", "content": content}], system=system, max_tokens=max_tokens, model=model)


RECEIPT_PROMPT = (
    "Bu chek rasmi. Do'kon nomi, sana, har bir mahsulot (nomi, soni, narxi) va "
    "umumiy summani JSON ko'rinishida qaytar: "
    '{"store": "", "date": "", "items": [{"name": "", "qty": 0, "price": 0}], "total": 0}. '
    "Faqat JSON yoz."
)


async def read_receipt(data: bytes, mime="image/jpeg", prompt=RECEIPT_PROMPT):
    """Jarvis: chek rasmini o'qish."""
    return await ask_with_image(prompt, data, mime)


# aiogram 3.x da rasmni baytga olish namunasi:
#
#   from io import BytesIO
#   @router.message(F.photo)
#   async def on_photo(message: Message, bot: Bot):
#       buf = BytesIO()
#       await bot.download(message.photo[-1], destination=buf)
#       text = await read_receipt(buf.getvalue())
#       await message.answer(text)
