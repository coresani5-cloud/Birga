# Rasm -> 3D model, mahalliy protsessorda (TripoSR, MIT litsenziya). GPU kerak emas.
# Ishlatish: python3 tools/tsr_local.py <rasm.png> <chiqish.glb> [<rasm2> <chiqish2> ...]
# TripoSR kodi /opt/tsr/space da (Hugging Face Space: stabilityai/TripoSR). Uning fayllariga tegilmaydi:
# torchmcubes o'rniga PyMCubes'dan foydalanadigan kichik o'rinbosar modul shu yerda ro'yxatga olinadi.
import os, sys, time, types
import numpy as np, torch, mcubes, trimesh
from PIL import Image

_m = types.ModuleType('torchmcubes')
def _marching_cubes(vol, iso):
    v, f = mcubes.marching_cubes(vol.detach().cpu().numpy().astype(np.float64), iso)
    return torch.from_numpy(v[:, [2, 1, 0]].astype(np.float32)), torch.from_numpy(f.astype(np.int64))
_m.marching_cubes = _marching_cubes
sys.modules['torchmcubes'] = _m

sys.path.insert(0, os.environ.get('TSR_DIR', '/opt/tsr/space'))
from tsr.system import TSR
from tsr.utils import remove_background, resize_foreground
import rembg

torch.set_num_threads(os.cpu_count() or 4)
t0 = time.time()
model = TSR.from_pretrained('stabilityai/TripoSR', config_name='config.yaml', weight_name='model.ckpt')
model.renderer.set_chunk_size(8192); model.to('cpu')
sess = rembg.new_session()
for inp, out in zip(sys.argv[1::2], sys.argv[2::2]):
    img = remove_background(Image.open(inp).convert('RGB'), sess); img = resize_foreground(img, 0.85)
    a = np.array(img).astype(np.float32) / 255.0; a = a[:, :, :3] * a[:, :, 3:4] + (1 - a[:, :, 3:4]) * 0.5
    with torch.no_grad(): codes = model([Image.fromarray((a * 255).astype(np.uint8))], device='cpu')
    mesh = model.extract_mesh(codes, True, resolution=256)[0]
    mesh.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))
    mesh.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
    mesh.export(out); print(out, len(mesh.vertices), 'nuqta,', round(time.time() - t0), 's', flush=True)
