# 05. Aset 3D

Gaya dasar proyek ini adalah **2D**: tinta di atas kertas krem. 3D dipakai kalau sebuah benda atau gerak kamera memang lebih kuat ditampilkan dalam ruang, misalnya luo pan yang dimiringkan dan berputar, koin emas yang berjatuhan dengan perspektif, atau denah yang berdiri menjadi rumah. Hasil 3D harus terlihat menyatu dengan dunia tinta dan kertas, bukan seperti render produk yang menempel.

Sebelumnya: [04-ASET-2D.md](04-ASET-2D.md) · Lanjut ke: [06-PENEMPATAN-ASET.md](06-PENEMPATAN-ASET.md)

---

## 1. Kapan memakai 3D

| Pakai 3D | Tetap 2D |
|---|---|
| Benda berputar 360° atau kamera mengelilinginya | Benda yang hanya masuk, bergeser, atau menyala |
| Perspektif ruangan (denah menjadi rumah 3D) | Ikon, ornamen, partikel, teks |
| Banyak benda bergerak dalam kedalaman (hujan koin, lentera melayang) | Latar dunia (gunung, bambu, kertas) |
| Material yang harus berkilau nyata (emas, giok) dalam close-up | Foto Shifu Po |

Kalau ragu, buat 2D dulu. Rotasi semu (`scaleX` seperti koin di `Koi.tsx`) sering sudah cukup. Teks di layar selalu 2D (HTML/SVG), tidak pernah di dalam kanvas 3D.

## 2. Dua cara: langsung di Remotion, atau render dulu

| | A. Langsung (`@remotion/three`) | B. Render dulu (urutan PNG dari Blender) |
|---|---|---|
| Cocok untuk | Benda geometris yang bisa dibangun dari kode atau model `.glb` sederhana: luo pan, koin, maket rumah dari balok, kamera bergerak | Benda pahatan atau organik yang rumit (kodok emas, patung), simulasi kain/air, shading yang diatur manual per frame |
| Kelebihan | Bisa diubah lewat kode dan diikat ke cue, tanpa software tambahan | Hasil frame identik di semua laptop, render video ringan |
| Kekurangan | Butuh WebGL; render lebih berat; hasil bisa sedikit berbeda antar GPU | Perlu Blender, file PNG besar, revisi berarti render ulang |
| Paket | `@remotion/three`, `three`, `@react-three/fiber` (sudah terpasang) | Tidak ada, cukup `<Img>` |

Pilih A sebagai default. Pakai B kalau bendanya tidak masuk akal dibuat dengan kode, atau kalau A terlihat berbeda di laptop lain (lihat bagian 6).

## 3. Gaya agar menyatu dengan 2D (berlaku untuk A dan B)

| Aspek | Aturan |
|---|---|
| Shading | Toon/cel 2–3 tingkat terang, bukan realistis. Bayangan diwarnai `inkSoft`, bukan hitam |
| Garis | Outline tinta warna `ink`, ketebalan sedikit bervariasi |
| Warna | Hanya palet `src/lib/brand.ts` (`COLORS`): gold `#C9A45C` / `#9C7A35` / `#F1DDA8`, seal `#A8161D`, ink `#12100E`, jade `#2E7D63` |
| Cahaya | Satu cahaya utama dari kiri atas (sama dengan bayangan di aset 2D), rim light emas tipis |
| Latar | Transparan. Kertas, gunung, dan bayangan jatuh tetap lapisan 2D di belakang/depan kanvas |
| Gerak | Tidak boleh linear: pakai `EASE.*` / `springAt` dari `src/lib/motion.ts`, antisipasi, overshoot, dan tidak pernah diam total, sesuai [07-ANIMASI.md](07-ANIMASI.md) |

## 4. Cara A: 3D langsung dengan `@remotion/three`

### Aturan wajib

| Boleh | Dilarang |
|---|---|
| `<ThreeCanvas>` dari `@remotion/three` | `<Canvas>` dari `@react-three/fiber` langsung |
| Rotasi, posisi, kamera dihitung dari `useCurrentFrame()` | `useFrame`, `THREE.Clock`, `requestAnimationFrame` |
| Model `.glb` lewat `useLoader(GLTFLoader, staticFile(...))` | `OrbitControls` atau kontrol interaktif apa pun |
| Video sebagai tekstur lewat `useOffthreadVideoTexture` | Tekstur dari `<video>` biasa |
| Ukuran kanvas, warna, kamera sebagai konstanta | Angka langsung di JSX |

`useFrame` dari React Three Fiber berjalan mengikuti jam layar, bukan nomor frame. Remotion merender frame secara acak dan paralel, jadi gerak dari `useFrame` akan patah dan berbeda setiap render.

### Contoh: luo pan berputar dan miring

```tsx
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/brand";
import { EASE, breathe, lerp, prog, springAt, SPRING } from "../lib/motion";

// Sizes and camera live in brand.ts in real code; inlined here for reading.
const LUOPAN_3D = { size: 720, radius: 1.6, thickness: 0.18, tiltDeg: 62, fov: 30, cameraZ: 8 };

export const LuoPan3D: React.FC<{ start: number; out: number }> = ({ start, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = springAt(frame, start, fps, SPRING.heavy);       // overshoot on arrival
  const spin = prog(frame, start, out, EASE.inOut) * Math.PI * 2;  // one eased turn
  const tilt = lerp(0, (LUOPAN_3D.tiltDeg * Math.PI) / 180, enter);
  const s = enter * breathe(frame, fps);                          // never dead still

  return (
    <ThreeCanvas width={LUOPAN_3D.size} height={LUOPAN_3D.size} camera={{ fov: LUOPAN_3D.fov, position: [0, 0, LUOPAN_3D.cameraZ] }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[-3, 4, 5]} intensity={1.2} />
      <group rotation={[tilt, 0, spin]} scale={s}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[LUOPAN_3D.radius, LUOPAN_3D.radius, LUOPAN_3D.thickness, 96]} />
          <meshToonMaterial color={COLORS.gold} />
        </mesh>
      </group>
    </ThreeCanvas>
  );
};
```

Waktu masuk dan keluar (`start`, `out`) datang dari cue, misalnya `cue("arah")`, bukan detik.

### Supaya terlihat seperti tinta, bukan render produk

| Teknik | Cara |
|---|---|
| Toon 3 tingkat | `meshToonMaterial` dengan `gradientMap` (tekstur 3×1 piksel, `NearestFilter`) |
| Outline tinta | Salinan mesh sedikit lebih besar, `side={THREE.BackSide}`, `meshBasicMaterial` warna `COLORS.ink` |
| Tanpa sudut tajam digital | Aktifkan `antialias` (bawaan), hindari tepi sangat tipis yang berkedip |
| Bayangan | Bayangan jatuh sebagai elips 2D blur di bawah kanvas, bukan shadow map |

### Model dan file

Model `.glb` disimpan di `public/assets/3d/<nama>/model.glb`, ditambah `README.md` (sumber, lisensi, pembuat). Usahakan di bawah 5 MB dan di bawah 50 ribu poligon. Hanya model buatan sendiri atau berlisensi komersial.

### Render

`remotion.config.ts` memakai renderer WebGL `angle` (`Config.setChromiumOpenGlRenderer("angle")`), jadi `npm run render`, `npm run stills`, dan Studio langsung bisa menampilkan 3D. Kalau kanvas 3D terlihat kosong atau hitam di laptop tanpa GPU yang memadai, render dengan `--gl=swangle` (pakai CPU, lebih lambat).

## 5. Cara B: render dulu di Blender, lalu tempel

Benda dimodelkan dan dirender di Blender menjadi urutan PNG transparan, lalu dimainkan sebagai lapisan di scene. Gaya mengikuti bagian 3 (shading toon, outline Freestyle atau Line Art, Color Management: Standard).

### Spesifikasi ekspor

| Item | Nilai |
|---|---|
| Format | Urutan PNG RGBA 8-bit, sRGB (Color Management: Standard, bukan Filmic/AgX) |
| Frame rate | 30 fps, sama dengan video |
| Resolusi | Sebesar ukuran tampil × 1,25 (misalnya benda 600 px di layar → render 750 px persegi) |
| Durasi | Sepanjang aksi yang dibutuhkan saja (biasanya 30–90 frame). Bagian diam bisa diulang di Remotion |
| Penamaan | `0001.png`, `0002.png`, ... (4 digit, mulai 1) |
| Ukuran | Usahakan total di bawah 40 MB per aset; kompres dengan `oxipng` atau ekspor WebP lossless kalau perlu |

Simpan file `.blend` sumbernya di luar repo (Drive tim), dan catat lokasinya di `README.md` folder asetnya.

### Lokasi dan pemutar

```
public/assets/3d/<nama-aset>/
├─ README.md        sumber .blend, frame awal-akhir, siapa pembuatnya
├─ 0001.png
├─ 0002.png
└─ ...
```

```tsx
import { Img, staticFile, useCurrentFrame } from "remotion";

// Plays public/assets/3d/<name>/0001.png... from `start`, holding the last frame.
export const Sequence3D: React.FC<{ name: string; frames: number; start: number; size: number }> = ({
  name,
  frames,
  start,
  size,
}) => {
  const frame = useCurrentFrame();
  const i = Math.min(frames, Math.max(1, frame - start + 1));
  const file = `assets/3d/${name}/${String(i).padStart(4, "0")}.png`;
  return <Img src={staticFile(file)} style={{ width: size, height: size }} />;
};
```

Jumlah frame dan ukuran tampil ditaruh sebagai konstanta (di `src/lib/brand.ts` atau di atas file scene), bukan angka langsung di JSX. Posisi di frame mengikuti aturan [06-PENEMPATAN-ASET.md](06-PENEMPATAN-ASET.md).

## 6. Cek hasil 3D

```bash
npm run stills -- <id> <frame-awal> <frame-tengah> <frame-akhir> --scale 1
```

| Gejala | Penyebab | Solusi |
|---|---|---|
| Kanvas kosong/hitam saat render | WebGL tidak tersedia | `--gl=swangle`, atau pindah ke cara B |
| Gerak patah atau melompat | Memakai `useFrame` atau jam | Hitung dari `useCurrentFrame()` |
| Terlihat seperti plastik | `meshStandardMaterial` realistis | `meshToonMaterial` + outline tinta |
| Tepi berkedip antar frame | Garis atau bidang terlalu tipis | Tebalkan outline, kurangi detail kecil |
| Render jauh lebih lambat | Model berat, kanvas terlalu besar | Kurangi poligon, kanvas sebesar ukuran tampil saja |

## 7. Checklist aset 3D

- [ ] Benar-benar butuh 3D (lihat bagian 1), dan cara A atau B sudah dipilih (bagian 2)
- [ ] Shading toon, outline tinta, palet brand
- [ ] Semua gerak dari `useCurrentFrame()` dan cue, tanpa `useFrame` atau jam (cara A)
- [ ] PNG transparan, 30 fps, penamaan 4 digit (cara B)
- [ ] Tepi bersih (tidak ada halo putih atau hitam di atas kertas krem)
- [ ] Tiba di pose kunci tepat di frame cue
- [ ] Teks tetap 2D dan di dalam `SAFE_AREA`
- [ ] `README.md` di folder aset diisi (sumber, lisensi, pembuat)
