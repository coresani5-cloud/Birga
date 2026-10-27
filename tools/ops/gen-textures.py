"""Birga Strike uchun 1K (1024x1024) tikiluvchi teksturalarni protsedural yaratadi.
Natija: public/ops/tex/*.jpg (rang + normal xarita). Mualliflik: Birga, CC0.
Ishga tushirish: python3 -I tools/ops/gen-textures.py <chiqish_papkasi>"""
import sys, os
import numpy as np
from PIL import Image

S = 1024
rng = np.random.default_rng(7)

def fbm(beta=2.0, seed=0):
    """Tikiluvchi (seamless) shovqin: oq shovqin 1/f^beta bilan filtrlanadi (FFT)."""
    r = np.random.default_rng(seed)
    f = np.fft.fftfreq(S)
    fx, fy = np.meshgrid(f, f)
    k = np.sqrt(fx * fx + fy * fy); k[0, 0] = 1
    spec = np.fft.fft2(r.standard_normal((S, S))) / k ** (beta / 2)
    spec[0, 0] = 0
    n = np.real(np.fft.ifft2(spec))
    return (n - n.min()) / (n.max() - n.min())

def normal_map(h, strength=4.0):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    nz = np.ones_like(h)
    l = np.sqrt(dx * dx + dy * dy + nz * nz)
    n = np.stack([-dx / l, dy / l, nz / l], -1)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)

def blocks(rows, cols, mortar, offset=True, seed=1):
    """Har piksel uchun: blok id, chetgacha masofa (0..1). Tikiluvchi."""
    r = np.random.default_rng(seed)
    y, x = np.mgrid[0:S, 0:S].astype(np.float32)
    bh = S / rows; bw = S / cols
    row = (y // bh).astype(int)
    xo = x + (row % 2) * (bw / 2 if offset else 0)
    col = ((xo // bw) % cols).astype(int)
    fy = (y % bh) / bh; fx = (xo % bw) / bw
    edge = np.minimum(np.minimum(fx, 1 - fx) * bw, np.minimum(fy, 1 - fy) * bh)  # piksel
    ids = row * cols + col
    var = r.uniform(-1, 1, rows * cols)[ids]
    return edge, var, mortar

def save(name, rgb, out):
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(os.path.join(out, name), quality=86, optimize=True)

def mix(a, b, t):
    return a + (b - a) * t[..., None]

def wall(out):  # qumtosh bloklar (de_dust uslubi)
    edge, var, m = blocks(6, 3, 0, seed=3)
    n1, n2, n3 = fbm(2.2, 11), fbm(1.4, 12), fbm(2.8, 13)
    mortar = np.clip((edge - 3) / 5, 0, 1)            # 0 = qorishma, 1 = tosh
    bevel = np.clip(edge / 14, 0, 1) ** 0.6
    base = np.array([196, 163, 118], np.float32); dark = np.array([150, 118, 80], np.float32); mort = np.array([170, 152, 125], np.float32)
    stone = mix(base, dark, np.clip(n1 * 0.9 + var[...] * 0.18 + 0.05, 0, 1))
    stone *= (0.86 + 0.22 * n2)[..., None]
    pits = (n3 > 0.78).astype(np.float32) * 0.18
    stone *= (1 - pits)[..., None]
    rgb = mix(mort * (0.8 + 0.25 * n2)[..., None], stone * (0.82 + 0.18 * bevel)[..., None], mortar)
    grime = np.clip(np.linspace(0.25, 0, S)[::-1], 0, 1)[:, None] * fbm(1.8, 14)  # pastda chang
    rgb *= (1 - grime * 0.35)[..., None]
    save('wall_d.jpg', rgb, out)
    h = mortar * 0.6 + bevel * 0.25 + n3 * 0.15 - pits
    save('wall_n.jpg', normal_map(h, 6), out)

def concrete(out):  # beton panellar
    edge, var, _ = blocks(2, 2, 0, offset=False, seed=5)
    n1, n2, n3 = fbm(2.0, 21), fbm(1.2, 22), fbm(3.0, 23)
    seam = np.clip((edge - 1.5) / 3, 0, 1)
    g = 128 + 38 * (n1 - 0.5) + 14 * var + 18 * (n2 - 0.5)
    rgb = np.stack([g * 1.02, g, g * 0.96], -1)
    stains = np.clip((fbm(1.6, 24) - 0.6) * 3, 0, 1)
    rgb *= (1 - stains * 0.25)[..., None]
    pores = (n3 > 0.82).astype(np.float32)
    rgb *= (1 - pores * 0.25)[..., None]
    rgb *= (0.55 + 0.45 * seam)[..., None]
    # qolip teshiklari
    yy, xx = np.mgrid[0:S, 0:S]
    for cy in (128, 384, 640, 896):
        for cx in (128, 384, 640, 896):
            d = np.hypot(yy - cy, xx - cx); rgb *= (1 - 0.45 * np.clip(1 - d / 9, 0, 1))[..., None]
    save('concrete_d.jpg', rgb, out)
    save('concrete_n.jpg', normal_map(seam * 0.5 + n3 * 0.2 - pores * 0.3, 5), out)

def floor(out):  # katta tosh plitalar + qum
    edge, var, _ = blocks(4, 4, 0, offset=True, seed=9)
    n1, n2, n3 = fbm(2.1, 31), fbm(1.3, 32), fbm(2.9, 33)
    grout = np.clip((edge - 2) / 4, 0, 1)
    tile = mix(np.array([178, 160, 132], np.float32), np.array([132, 114, 90], np.float32), np.clip(n1 * 0.8 + var * 0.15 + 0.1, 0, 1))
    tile *= (0.85 + 0.2 * n2)[..., None]
    sand = np.array([200, 178, 140], np.float32) * (0.85 + 0.2 * n3)[..., None]
    dust = np.clip((fbm(1.5, 34) - 0.55) * 2.5, 0, 1)
    rgb = mix(sand * 0.72, tile, grout)
    rgb = mix(rgb, sand, dust * 0.55)
    cracks = (np.abs(fbm(2.6, 35) - 0.5) < 0.004).astype(np.float32) * grout
    rgb *= (1 - cracks * 0.4)[..., None]
    save('floor_d.jpg', rgb, out)
    save('floor_n.jpg', normal_map(grout * 0.5 + n3 * 0.15 - cracks * 0.3, 5), out)

if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    wall(out); concrete(out); floor(out)
