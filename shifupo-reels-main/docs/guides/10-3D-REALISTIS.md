# 10. 3D semi-realistis: aturan, alat, dan gerbang kualitas

Lanjutan dari [05-ASET-3D.md](05-ASET-3D.md) dan [09-ASET-WEBSITE-DAN-SCENE.md](09-ASET-WEBSITE-DAN-SCENE.md). Contoh lengkap: SP04 (`data/episodes/sp04.json`, `src/three/WorldJodoh.tsx`). Latar belakang keputusan: `docs/UPGRADE-3D.md`.

## 1. Alat yang dipakai (dan yang tidak)

| Alat | Status | Catatan |
|---|---|---|
| `@react-three/drei` 10.7.9 (MIT) | Dipakai | `useGLTF`, `useTexture`, `Environment` (HDRI lokal), `ContactShadows` |
| Aset CC0 Poly Haven | Dipakai | `npm run assets` mengunduh ke `public/assets/3d/polyhaven/<id>/` (README berisi sumber + lisensi). Tambah aset: tambahkan id di `scripts/fetch-polyhaven.ts` |
| `@react-three/postprocessing` / `postprocessing` | **Tidak bisa** | `EffectComposer` membuat frame kosong di renderer Remotion. Ganti: bayangan asli + `ContactShadows` (oklusi), halo aditif (pendar), `FilmGrade` CSS (vignette + warna), `dpr={1.5}` (tepi tajam) |

## 2. Aturan wajib render 3D di Remotion

1. **Semua loader di dalam `<AssetGate>`** (`src/three/gate.tsx`). Tanpa itu Remotion memotret frame sebelum model/tekstur/HDRI selesai dimuat (hasil: frame kosong).
2. **HDRI dan tekstur selalu file lokal** lewat `staticFile()`, tidak pernah preset CDN (`Environment preset="..."`), supaya render tidak bergantung internet.
3. **Tidak ada efek "sekali hitung"** (`ContactShadows frames={1}`, cache per tab): frame dirender paralel di beberapa tab, jadi hasilnya akan berbeda antar frame.
4. Gerak tetap dari `useCurrentFrame()`; `useFrame` hanya boleh dipakai library untuk menggambar (bukan untuk animasi).

## 3. Gaya semi-realistis

| Bagian | Aturan |
|---|---|
| Mode | `<Realism.Provider value>` membuat `Toon` memakai material PBR, bayangan, tanpa outline. Tanpa provider: tampilan toon (SP03) |
| Tekstur | `pbr={{ id, repeat }}`; `repeat` = ukuran permukaan ÷ ukuran ubin nyata (plester ±1,4 m, lantai ±1,2 m, aspal ±3 m) supaya skala tekstur benar |
| Cahaya | HDRI untuk pantulan + 1 matahari dengan bayangan (`shadow-camera` ±14 m), lampu interior hangat, cahaya jendela dingin saat ruangan "mati" |
| Model | Pilih model yang gayanya sama (modern). Poly Haven punya banyak furnitur klasik: sofa/armchair/lampu gantung antik **tidak dipakai** di rumah modern |
| Detail hidup | Mobil di jalan yang tidak dilewati kamera, burung di langit jauh, lampu jalan, bedeng bunga, kotak surat, mobil parkir, kelopak jatuh |

## 4. Tata letak = data + test (agar tidak ada yang menabrak)

Semua posisi ada di `src/three/shots.ts`, bukan di JSX:

| Data | Isi |
|---|---|
| `YARD` | Setiap benda di halaman sebagai jejak (x, z, lebar, dalam) |
| `INTERIOR`, `BEDROOM` | Posisi tiap perabot saat berantakan dan rapi (`tilt` jatuh, `roll` miring, `y` di atas perabot lain, `gone`/`appear`) |
| `FOOTPRINT`, `FALLEN_LENGTH` | Ukuran jejak per jenis perabot |
| `THREAD`, `PEACH` | Jalur benang merah, posisi pohon |
| `SHOTS`, `JODOH_SHOTS` | Gerak kamera tiap shot |

`tests/layout3d.test.ts` (bagian dari `npm run check`) gagal kalau:

- dua benda saling menembus (halaman, perabot berantakan, perabot rapi; termasuk daun pintu yang terbuka);
- perabot keluar dinding, benda keluar kavling;
- benda yang diangkat (`y`) tidak berdiri di atas sesuatu;
- benang merah keluar rumah selain lewat pintu, atau menyentuh daun pintu;
- **jalur kamera** (gerak di dalam shot dan transisi antar shot) menembus dinding, kaca, atau lantai atas; masuk/keluar rumah hanya lewat pintu;
- subjek shot keluar frame atau masuk area judul/caption (diproyeksikan di awal, tengah, akhir gerak).

Kalau test gagal: **pindahkan bendanya atau ubah pose kamera**, jangan longgarkan test.

## 5. Kamera

- Tiap shot adalah gerak `from → to` yang bermakna (mendorong maju, masuk lewat pintu, crane naik, pull-back).
- Masuk ke dalam rumah: pose akhir shot luar berada di ambang pintu, atau gerak shot-nya melewati pintu. Keluar juga lewat pintu (pull-back).
- Partikel dan benda kecil yang terlalu dekat kamera dipudarkan (`QI.nearFade`), supaya tidak jadi bulatan besar.
- Shot di dalam ruangan memakai pita gelap + teks terang (`SHOT_BACKDROP` / `JODOH_BACKDROP` = `dark`).

## 6. Urutan kerja episode 3D

1. Planning (`docs/<id>/PLAN.md`), satu persetujuan.
2. Tulis layout di `shots.ts`, lalu `npm run check` sampai semua gerbang lolos **sebelum** render.
3. Stills tiap scene (`npm run stills -- <id> <frame...> --scale 0.5`); `--every` sedang error di renderer, pakai daftar frame.
4. Draft (`npm run produce -- <id> --draft`), cek lembar frame.
5. Final (`npm run produce -- <id>`), hasil otomatis ke folder Video dengan nama judul.
