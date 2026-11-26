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
  'darvesh': "Full body photograph of an elderly Central Asian dervish, 60, long dark grey beard, large black turban with a scarf wrapped around the neck, long dark robe, cream inner shirt, wide dark sash, leather sandals",
  'olim': "Full body photograph of an elderly Central Asian scholar, 65, long white beard, white turban, long royal blue robe with wide gold embroidered borders, holding a rolled paper scroll in one hand at chest level" ,
  'munajjim': "Full body photograph of a Timurid era astronomer, 40, dark beard, white turban, long brown robe over a teal tunic, cloth sash, soft leather boots",
  'kotib': "Full body photograph of a young Samarkand scribe, 30, short black beard, white turban, long teal robe with red inner tunic, leather satchel at the hip",
  'savdogar2': "Full body photograph of a Silk Road merchant, 45, thick dark beard, grey cloth turban, long multicolored striped chapan robe in green, red and beige, red sash, leather boots",
  'chopon': "Full body photograph of an Uzbek shepherd, 50, grey beard, brown felt hat, long quilted brown chapan, rope belt, leather boots, holding a long wooden staff",
  'ayol3': "Full body photograph of a young Uzbek woman, 24, light blue headscarf framing the face, long open dusty pink robe over a long dark grey dress with a cloth belt, simple sandals",
  'ayol4': "Full body photograph of an Uzbek woman, 30, deep maroon velvet robe with wide gold embroidered borders, matching maroon silk headscarf and face veil showing only the eyes, holding a small woven purse",
  'ayol5': "Full body photograph of a young Uzbek bride, 22, long white silk dress, white headscarf with a golden embroidered band and small gold pendants on the forehead, white robe with gold trim on the sleeves",
  'ayol6': "Full body photograph of an elderly Central Asian woman, 60, long plain black robe with a hood covering the head, long black dress, soft black shoes",
  'ayol7': "Full body photograph of a young Uzbek woman, 26, long emerald green dress, matching green headscarf draped over the shoulders, soft leather shoes",
  'bola_oq': "Full body photograph of an Uzbek boy, 9, long white cotton tunic with embroidered collar and cuffs, white embroidered skullcap, white trousers, soft leather shoes",
  'bola_kok': "Full body photograph of a Central Asian boy, 10, black hair, long navy blue tunic with embroidered collar, navy trousers, barefoot",
  'bola_beqasam': "Full body photograph of an Uzbek boy, 8, short striped beqasam robe in green, red and white, colorful ikat sash tied at the waist, black and white doppi skullcap, black trousers, black leather boots",
  'bola_dutor': "Full body photograph of an Uzbek boy musician, 11, cream shirt, dark red embroidered velvet vest, dark trousers, white felt hat, holding a long-necked two-string dutar lute across his chest",
  'xitoy_qiz': "Full body photograph of a Chinese girl, 9, Qing dynasty style golden and red embroidered silk dress, golden headdress with beaded tassels, embroidered shoes",
  'xitoy_bola': "Full body photograph of a Chinese boy, 10, Qing dynasty style silver-blue brocade jacket with round embroidered medallions, long dark blue skirt-robe, black round hat with a red knot on top, black shoes",
  'bola': "Full body photograph of an Uzbek boy, 10, small striped blue chapan robe, red sash, black doppi skullcap, small leather boots",
  'navkar': "Full body photograph of a Timurid era Central Asian warrior, 30, short black beard, white turban wrapped around a pointed gilded helmet, polished bronze lamellar breastplate with crossed leather straps, blue long coat with gold trim, brown cloak, wide baggy trousers, bronze greaves over leather boots, empty hands",
  'sarboz': "Full body photograph of a 19th century Bukhara emirate soldier, 35, full brown beard, white turban with a turquoise jewel, dark navy knee-length robe with gold embroidered borders, wide red and brown leather sash belt, leather bracers, dark trousers, tall brown leather boots, empty hands",
}
# hayvonlar: yon tomondan, butun tana ko'rinadi (to'rt oyoqli avtomatik skelet uchun)
ATAIL = ", side view profile facing left, standing on all four legs, entire animal visible, plain pure white studio background, soft even lighting, photorealistic, high detail"
A = {
  'ot': "Photograph of a chestnut Akhal-Teke horse with a traditional Central Asian saddle, red and gold embroidered saddle cloth, leather bridle with brass ornaments",
  'ot_yuk': "Photograph of a dark brown pack horse carrying two large woven wicker baskets and a rolled carpet, green cloth cover, rope harness, a small bronze bell on the neck",
  'tuya_yuk': "Photograph of a Bactrian two-humped camel with long woolly fur carrying wooden cargo boxes and sacks, colorful woven bridle with red tassels, a row of bronze bells on the neck",
  'eshak_yuk': "Photograph of a grey donkey carrying a large wicker basket and a bundled sack tied with ropes, colorful woven halter",
  'tuya': "Photograph of a Bactrian two-humped camel with a colorful Central Asian carpet saddle and red woven bridle",
}
for k, v in A.items(): P[k] = v
ANIMALS = set(A)

def run(names):
    flux = Client("https://mcp-tools-flux-1-krea-dev.hf.space/", headers=H, verbose=False)
    tr = Client("https://trellis-community-trellis.hf.space/", headers=H, verbose=False)
    for k in names:
        png, glb = os.path.join(ROOT, 'refs', k + '.png'), os.path.join(ROOT, 'chars', k + '.glb')
        try:
            if not os.path.exists(png):
                r = flux.predict(prompt=P[k] + (ATAIL if k in ANIMALS else TAIL), width=1152 if k in ANIMALS else 768, height=768 if k in ANIMALS else 1152, guidance_scale=4.5, num_inference_steps=28, randomize_seed=True, api_name="/infer")
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
