"""'Tayyor' shartlari №2 va №3 ni bot papkasida tekshirish.

    python test_bots.py chat                 # Hamrongiz: bitta test xabar
    python test_bots.py receipt chek.jpg     # Jarvis: bitta test chek
"""
import asyncio
import mimetypes
import sys

from ai_client import ask, read_receipt


async def main():
    if len(sys.argv) >= 2 and sys.argv[1] == "chat":
        print(await ask([{"role": "user", "content": "Salom! O'zingni bir jumlada tanishtir."}]))
    elif len(sys.argv) >= 3 and sys.argv[1] == "receipt":
        path = sys.argv[2]
        mime = mimetypes.guess_type(path)[0] or "image/jpeg"
        with open(path, "rb") as f:
            print(await read_receipt(f.read(), mime))
    else:
        print(__doc__)


asyncio.run(main())
