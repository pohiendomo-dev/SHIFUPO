# Aset 3D

Satu folder per aset, `3d/<nama-aset>/`, berisi salah satu dari:

- **3D langsung** (`@remotion/three`): `model.glb` (di bawah 5 MB, di bawah 50 ribu poligon), dimuat dengan `useLoader(GLTFLoader, staticFile(...))`.
- **Hasil render**: `0001.png, 0002.png, ...` (urutan PNG RGBA transparan, 30 fps).

Setiap folder wajib punya `README.md` berisi sumber (`.blend` atau asal model), lisensi, rentang frame kalau ada, dan pembuatnya.

Gaya wajib toon shading, outline tinta, dan palet brand supaya menyatu dengan dunia 2D. Spesifikasi lengkap: `docs/guides/05-ASET-3D.md`.
