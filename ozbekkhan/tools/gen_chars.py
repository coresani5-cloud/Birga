# Personaj modellari: FLUX (rasm) -> TRELLIS (3D GLB). Hugging Face ZeroGPU kvotasi kerak (token).
# Ishlatish: python3 tools/gen_chars.py <nom> [<nom> ...]   -> assets/chars/<nom>.glb, assets/refs/<nom>.png
# Uslub manbai: assets/refs/3.webp, 4.webp, 5.webp (miniatyura uslubidagi bozor/qish sahnalari):
#   rangli sallalar (oq, qizil, sariq, ko'k), uzun rangdor to'nlar oltin hoshiya bilan, sariq/rangli belbog',
#   qalin mo'ylov va soqol, mo'ynali telpak, ro'mol o'ragan ayollar.
import os, shutil, sys
from gradio_client import Client, handle_file

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets')
H = {"Authorization": "Bearer proxy-injected"}  # token tarmoq proksisi orqali qo'shiladi
TAIL = (", 19th century Central Asian Silk Road town, standing straight in a relaxed A-pose with arms slightly away from the body, "
        "empty hands, facing the camera, entire body visible from head to feet, plain pure white studio background, soft even lighting, "
        "50mm lens, photorealistic, high detail")
P = {
  'hero': "Full body photograph of a handsome young Uzbek man, 25, short neat black beard, long deep blue chapan robe with gold and crimson stripes, red sash belt, black Chust doppi skullcap with white pattern, dark trousers, black leather boots",
  'oqsoqol': "Full body photograph of an elderly Uzbek man, 70, long white beard, large white turban, long dark green striped chapan robe with gold trim, white sash, soft black leather mahsi boots",
  'ayol': "Full body photograph of a young Uzbek woman, 28, long Margilan atlas ikat silk dress in red, yellow and blue, short dark velvet vest, white headscarf tied under chin, two long black braids, soft leather shoes",
  'savdogar': "Full body photograph of a middle-aged Uzbek bazaar merchant, 45, thick black moustache and short beard, red turban, long teal robe with gold embroidered trim, yellow sash, soft leather boots",
  'ishchi': "Full body photograph of a young Central Asian craftsman, 22, thin moustache, simple white cotton tunic shirt, long sleeveless brown quilted robe, wide dark trousers, cloth sash, black doppi skullcap, soft leather boots",
  'posbon': "Full body photograph of a 19th century Bukhara city night guard, 35, thick black moustache and beard, tall black lambskin hat, long dark crimson robe, wide leather belt, tall leather riding boots",
  'chavandoz': "Full body photograph of a Central Asian horseman, 30, bushy moustache, brown fur trimmed hat, quilted red and green striped chapan, yellow sash, tall leather boots",
  'qishki': "Full body photograph of an Uzbek man in winter clothes, 40, black beard, fur hat, thick long sheepskin-lined brown coat with fur collar, wool sash, felt boots",
  'ayol2': "Full body photograph of a middle-aged Uzbek woman, 45, long dark green velvet dress with gold embroidery, colorful patterned headscarf, long robe over shoulders, leather shoes",
  'bola': "Full body photograph of an Uzbek boy, 10, small striped blue chapan robe, red sash, black doppi skullcap, small leather boots",
}

def run(names):
    flux = Client("https://mcp-tools-flux-1-krea-dev.hf.space/", headers=H, verbose=False)
    tr = Client("https://trellis-community-trellis.hf.space/", headers=H, verbose=False)
    for k in names:
        png, glb = os.path.join(ROOT, 'refs', k + '.png'), os.path.join(ROOT, 'chars', k + '.glb')
        try:
            if not os.path.exists(png):
                r = flux.predict(prompt=P[k] + TAIL, width=768, height=1152, guidance_scale=4.5, num_inference_steps=28, randomize_seed=True, api_name="/infer")
                shutil.copy(r[0]['path'] if isinstance(r[0], dict) else r[0], png); print(k, 'rasm', flush=True)
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
    run(sys.argv[1:] or [k for k in P if k != 'hero'])
