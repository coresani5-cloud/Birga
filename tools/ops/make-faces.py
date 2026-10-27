"""O'yinchilar suratidan yuz teksturalarini tayyorlaydi (public/ops/faces/).
Har bir yuz: qirqiladi, rang muvozanati to'g'rilanadi (yashil chiroq ta'siri olib tashlanadi),
oval shaklda yumshoq chetli alfa qo'shiladi. faces.json — modelning teri rangi uchun o'rtacha rang.
Ishga tushirish: python3 -I tools/ops/make-faces.py <surat> <chiqish_papkasi>"""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter

# (chap, tepa, o'ng, past) — qosh ustidan iyakkacha, quloqdan quloqqacha
BOXES = [(50, 682, 148, 790), (254, 668, 347, 768), (461, 652, 549, 750), (744, 654, 842, 752)]
W, H = 256, 288
SKIN = np.array([184, 138, 108], np.float32)  # maqsad: tabiiy bug'doyrang teri

def oval():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = ((x - W / 2) / (W * 0.41)) ** 2 + ((y - H * 0.5) / (H * 0.48)) ** 2
    a = np.clip((1 - d) / 0.22, 0, 1)  # chetga yaqin yumshoq o'tish
    return a ** 1.3

def main(src, out):
    os.makedirs(out, exist_ok=True)
    im = Image.open(src).convert('RGB'); A = oval(); meta = []
    for i, b in enumerate(BOXES):
        f = np.asarray(im.crop(b).resize((W, H), Image.LANCZOS), np.float32)
        y, x = np.mgrid[0:H, 0:W]
        core = (((x - W / 2) / (W * 0.25)) ** 2 + ((y - H * 0.55) / (H * 0.25)) ** 2) < 1  # yonoq/burun sohasi
        m = f[core].mean(0)
        f = f * (SKIN / m)                                  # rang muvozanati (yashil tus yo'qoladi)
        g = f.mean(2, keepdims=True); f = g + (f - g) * 0.9  # biroz kamroq to'yinganlik
        f = np.clip((f - 128) * 1.12 + 128, 0, 255)
        rgb = Image.fromarray(f.astype(np.uint8)).filter(ImageFilter.UnsharpMask(1.0, 40, 2))
        rgba = np.dstack([np.asarray(rgb), (A * 255).astype(np.uint8)])
        Image.fromarray(rgba, 'RGBA').save(os.path.join(out, f'face{i + 1}.png'), optimize=True)
        sk = np.asarray(rgb, np.float32)[core].mean(0)
        meta.append({'file': f'face{i + 1}.png', 'skin': '#%02x%02x%02x' % tuple(int(v) for v in sk)})
    json.dump(meta, open(os.path.join(out, 'faces.json'), 'w'), indent=1)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
