# Asosiy qahramon uchun kiyim variantlari: bir xil yuz, boshqa to'n.
# 1) FLUX Kontext hero_ref rasmini tahrirlaydi (faqat kiyim o'zgaradi) -> assets/refs/hero_<nom>.png
# 2) TRELLIS 3D model qiladi -> assets/chars/hero_<nom>.glb  (o'yindagi kiyim do'konida paydo bo'ladi)
# Ishlatish: python3 tools/gen_outfits.py [beqasam_yashil adras zardozi ...]
import os, shutil, sys
from gradio_client import Client, handle_file

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets')
H = {"Authorization": "Bearer proxy-injected"}
KEEP = " Keep the same man, same face, same short black beard, same pose, same black boots and same plain white background. Photorealistic."
O = {
  'beqasam_yashil': "Replace his robe with a long traditional Uzbek beqasam chapan made of emerald green silk with vertical magenta pink, teal and white stripes, horizontal stripes on the sleeves, no sash.",
  'adras': "Replace his robe with a long Uzbek adras ikat chapan with blurred vertical stripes of magenta, white and dark green, horizontal stripes on the sleeves, red sash.",
  'zardozi': "Replace his robe with a long royal Bukhara zardozi robe of deep navy blue velvet densely embroidered with gold thread in large rhombus and flower medallions along the front and the cuffs.",
  'chust': "Replace his hat with a black square Chust doppi skullcap with four large white paisley (almond) motifs and a white geometric border.",
  'iroqi': "Replace his hat with a round Uzbek iroqi skullcap with green and grey cross-stitch embroidery of leaves.",
}

def run(names):
    kon = Client("https://mcp-tools-flux-1-kontext-dev.hf.space/", headers=H, verbose=False)
    tr = Client("https://trellis-community-trellis.hf.space/", headers=H, verbose=False)
    src = os.path.join(ROOT, 'chars', 'hero_ref.png')
    for k in names:
        png, glb = os.path.join(ROOT, 'refs', 'hero_' + k + '.png'), os.path.join(ROOT, 'chars', 'hero_' + k + '.glb')
        try:
            if not os.path.exists(png):
                ep = [e for e in kon.view_api(return_format='dict')['named_endpoints']][0]
                r = kon.predict(handle_file(src), O[k] + KEEP, api_name=ep)
                out = r[0] if isinstance(r, (list, tuple)) else r
                shutil.copy(out['path'] if isinstance(out, dict) else out, png); print(k, 'rasm', flush=True)
            if os.path.exists(glb): continue
            try: tr.predict(api_name="/start_session")
            except Exception: pass
            pre = tr.predict(image=handle_file(png), api_name="/preprocess_image")
            g = tr.predict(image=handle_file(pre), multiimages=[], seed=7, ss_guidance_strength=7.5, ss_sampling_steps=12, slat_guidance_strength=3,
                           slat_sampling_steps=12, multiimage_algo="stochastic", mesh_simplify=0.9, texture_size=2048, api_name="/generate_and_extract_glb")
            shutil.copy(g[2], glb); print(k, '3D tayyor', flush=True)
        except Exception as e:
            print(k, 'XATO', str(e)[:200], flush=True)

if __name__ == '__main__':
    run(sys.argv[1:] or ['beqasam_yashil', 'adras', 'zardozi'])
