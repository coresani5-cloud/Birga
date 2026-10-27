# Birga Strike 3D assetlari (`public/ops/`)

Bu papkadagi skriptlar `public/ops/` fayllarini qayta yaratadi. Manbalar va litsenziyalar `public/ops/LICENSES.txt` da.

1. **Modellar.** Manba: npm paketi `@netforge/asset-library-files@0.2.0` (Quaternius modellari, CC0, meshopt bilan siqilgan).
   Brauzerda WASM dekoder kerak bo'lmasligi uchun modellar oddiy GLB ga ochiladi va faqat kerakli animatsiyalar qisqa nom bilan qoldiriladi:
   ```sh
   npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer
   L=node_modules/@netforge/asset-library-files/library/lowpoly
   node tools/ops/convert-models.mjs $L/soldier.glb public/ops/models/soldier.glb \
     '{"idle":"CharacterArmature|Idle","run":"CharacterArmature|Run_Gun","shoot":"CharacterArmature|Idle_Shoot","death":"CharacterArmature|Death","hit":"CharacterArmature|HitReact"}' \
     'Revolver,Sniper,Revolver_Small,Pistol,SMG,GrenadeLauncher,ShortCannon,Shotgun,Sniper_2,RocketLauncher,Shovel,Knife_2,Knife_1'
   node tools/ops/convert-models.mjs $L/adventurer.glb public/ops/models/rebel.glb \
     '{"idle":"CharacterArmature|Idle_Gun","run":"CharacterArmature|Run_Shoot","shoot":"CharacterArmature|Idle_Gun_Shoot","death":"CharacterArmature|Death","hit":"CharacterArmature|HitRecieve"}'
   ```
   Manba fayllar allaqachon GLB bo'lgani uchun Blender kerak emas: FBX/OBJ dan aylantirish talab qilinmadi.
2. **Three.js.** r148 dan boshlab `examples/js` olib tashlangan, shuning uchun three@0.149.0 va uning `examples/jsm` dagi GLTFLoader, RGBELoader, SkeletonUtils bitta IIFE faylga yig'iladi (global `THREE`, `THREE.GLTFLoader` …):
   ```sh
   npm i three@0.149.0 esbuild@0.24
   npx esbuild tools/ops/three-entry.js --bundle --minify --format=iife --target=es2018 --banner:js="/* three.js r149 — MIT License, Copyright © 2010-2023 three.js authors */" --outfile=public/ops/three-ops.min.js
   ```
3. **Teksturalar** (1024×1024, tikiluvchi, rang + normal): `python3 -I tools/ops/gen-textures.py public/ops/tex`
4. **Osmon (HDRI):** `quarry_01_1k.hdr` (Poly Haven, CC0), three.js repozitoriyasidagi `examples/textures/equirectangular/` dan olingan.
5. **Askarlar yuzi:** `python3 -I tools/ops/make-faces.py <guruh_surati.jpg> public/ops/faces` — `BOXES` dagi yuz koordinatalari shu suratga moslangan.
   Yuz `faces.json` dagi tartibda: duel/FFA da o'rin raqami bo'yicha, Strike'da dushman rangi bo'yicha tanlanadi. Fayllar bo'lmasa askarlar model yuzi bilan chiqadi.
