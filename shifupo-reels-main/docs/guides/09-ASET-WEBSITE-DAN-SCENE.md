# 09. Aset dari website, urutan scene, dan animasi realistis

Panduan ini melengkapi 04–08 untuk episode yang memakai **foto asli dari website Shifu Po** (https://shifupofengshui.com/) dan **ilustrasi 2D yang bergerak realistis** (hewan, air, cahaya). Contoh lengkapnya: SP02 (`data/episodes/sp02.json`, `docs/sp02/PLAN.md`).

Sebelumnya: [08-QA-HASIL-BERSIH.md](08-QA-HASIL-BERSIH.md)

---

## 1. Mengambil aset dari website

### Boleh dipakai

| Jenis | Contoh di website | Catatan |
|---|---|---|
| Foto Shifu Po | foto pagoda, foto berkipas, foto konsultasi | Pilih yang wajahnya jelas dan resolusi ≥ 1200 px sisi terpendek |
| Foto suasana konsultasi | `gallery-*.jpg` | Hanya kalau wajah klien **tidak terlihat jelas** (dari belakang/samping) |
| Logo resmi Shifu Po | `Logo-Shifu-Po-Red-.png` | Simpan di `public/assets/brand/`, pakai lewat `brand.logo` |

### Tidak boleh dipakai

| Jenis | Alasan |
|---|---|
| Screenshot chat/testimoni WhatsApp | Berisi data pribadi klien |
| Logo pihak ketiga (sponsor, partner, klien) | Bukan milik Shifu Po; butuh izin pemiliknya |
| Video reels lama dengan logo sponsor | Ada merek lain dan stok footage berlisensi pihak lain |
| Gambar di bawah 800 px sisi terpendek | Pecah di layar 1080 × 1920 (contoh: ilustrasi `ChatGPT-Image-*` 343 × 251) |
| Poster yang teksnya sudah tertanam | Teks harus dari JSON episode (aturan 5 CLAUDE.md) |

### Cara menyiapkan

1. Unduh file ukuran **asli** (tanpa akhiran `-300x225` dan sejenisnya) ke folder staging di luar proyek (`D:\SHIFUPO\site-assets\`).
2. Periksa satu per satu: wajah, resolusi, ada teks/logo lain atau tidak.
3. Potong dan perkecil dengan ffmpeg ke folder episode. Sisi panjang maksimal **1800 px**, JPG kualitas `-q:v 3`:

   ```powershell
   ffmpeg -i "D:\SHIFUPO\site-assets\gallery-1-scaled.jpg" -vf "scale=1600:1200" -q:v 3 public/assets/2d/sp02/consult-1.jpg
   ffmpeg -i "D:\SHIFUPO\site-assets\gallery-6-scaled.jpg" -vf "crop=1500:2000:300:0,scale=1050:1400" -q:v 3 public/assets/2d/sp02/shifu-fan.jpg
   ```

4. Nama file deskriptif, huruf kecil, tanda hubung: `pagoda.jpg`, `consult-1.jpg`, `shifu-fan.jpg`.
5. Path di JSON selalu relatif terhadap `public/`: `"assets/2d/sp02/pagoda.jpg"`. Schema menolak URL dan path di luar `assets/`, dan test mengecek bahwa filenya ada.

## 2. Urutan scene (fleksibel)

SP01 memakai urutan tetap. Mulai SP02 urutan bebas, dengan aturan yang dicek `src/schema.ts` (`EPISODE_RULES`):

| Aturan | Nilai |
|---|---|
| Jumlah scene | 4 sampai 7 |
| Scene pertama | `hook` atau `pond` (harus membuka dengan masalah penonton) |
| Scene terakhir | `cta`, dan hanya satu `cta` |
| Tipe yang boleh berulang | Semua kecuali `cta` (SP02 memakai `pond` dua kali) |
| Durasi | 20–29 detik pada 2,05 kata/detik (test episode) |

Alur yang disarankan:

```
Hook (masalah) → Insight/Simbol (sudut pandang baru) → Bukti siapa (foto Shifu Po)
→ Cara kerja (galeri/konsultasi) → Angka resmi (proof) → CTA (WhatsApp)
```

### Tipe scene

| Tipe | Isi utama | Field penting |
|---|---|---|
| `hook`, `insight`, `bazi`, `fengshui` | Ilustrasi SP01 | lihat `docs/PLAN-SP01.md` |
| `pond` | Kolam koi di jendela bulan | `mood`: `still` (keruh, pelan) atau `flow` (jernih, koi melesat ke atas di `flowCueWord`); `lines` 1–2 baris, `accent` 1 kata |
| `photo` | Satu foto di bingkai lengkung emas | `src`, `focus` (posisi wajah dalam %, pusat push-in), `kicker`, `lines`, `energyCueWord` (pita emas mulai digambar) |
| `gallery` | 3 kartu foto polaroid | `title`, `photos` (3 × `src`, `orientation`, `cueWord`) |
| `proof` | Angka resmi + koin | `koi`: `ink` (SP01), `pond` (kolam realistis), atau `none` (episode 3D) |
| `stage3d` | Pose kamera di dunia 3D (episode `"world": "3d"`, contoh SP03) | `shot`: `house-dim`, `door`, `leak`, `luopan`, `rearrange`; `actionCueWord` (aksi utama shot), `shifuCueWord` opsional |
| `cta` | Logo, tagline, tombol WhatsApp | `photo` opsional: foto Shifu Po di bingkai lengkung; `brand.logo` untuk logo resmi |

Cara menambah tipe baru: schema di `src/schema.ts` (+ `sceneCues`), komponen di `src/scenes/Scenes.tsx`, lalu `WIPE_ORIGIN`, `WORLD_POSE` dan `SceneBody` di `src/compositions/Reel.tsx`, dan SFX di `src/components/Sfx.tsx`.

## 3. Foto harus "hidup"

Gaya yang dituju: seperti template animasi Canva yang rapi, tapi geraknya halus dan berbobot.

| Aturan | Implementasi |
|---|---|
| Tidak ada foto diam | Ken Burns push-in `PHOTO.kenBurns` (1,06 → 1,16) sepanjang scene, ditambah drift kecil |
| Masuk dengan bobot | Pegas `SPRING.heavy` (bingkai) atau `SPRING.pop` (kartu), dengan overshoot |
| Keluar dengan gerak | Terangkat dan pudar 14 frame sebelum scene berakhir (`EXIT_LEAD`) |
| Menyatu dengan dunia tinta-emas | Bingkai emas, vinyet gelap, satu kali light sweep di kata cue |
| Wajah tidak tertutup | `focus` menunjuk wajah; teks tetap di area judul, foto di panggung |
| Kartu galeri | Jatuh berurutan sesuai kata cue, rotasi berbeda (−6°, 5°, −3°), selotip emas, goyang halus |

## 4. Hewan dan air yang realistis (koi)

Komponen: `src/components/KoiPond.tsx`. Aturan untuk hewan baru (burung bangau, naga, kura-kura, dll.):

1. **Tulang belakang, bukan gambar kaku.** Tubuh dibangun dari titik-titik spine yang digerakkan gelombang berjalan (`sin(phase − s·k)`), amplitudo kecil di kepala dan besar di ekor.
2. **Pola ikut menekuk.** Bercak warna diletakkan dalam koordinat tubuh (posisi sepanjang spine + jarak dari sumbu), lalu di-clip ke garis tubuh.
3. **Follow-through.** Sirip ekor tertinggal fase ±0,9 rad dari ujung tubuh; sirip dada mengepak dengan fase berbeda kiri dan kanan.
4. **Kecepatan menentukan tenaga.** Semakin cepat hewan bergerak, semakin besar `effort` (amplitudo) dan semakin cepat fase renangnya.
5. **Arah dari lintasan.** Rotasi tubuh selalu dihitung dari selisih posisi frame ini dan berikutnya, jadi belokan terlihat alami.
6. **Kedalaman.** Bayangan lembut di dasar (blur, offset menjauhi cahaya), ikan yang lebih dalam diberi tint air dan bayangan lebih kecil.
7. **Lingkungan bergerak.** Kaustik cahaya dua lapis yang bergeser berlawanan, riak acak tapi deterministik (`random(seed)`), daun teratai terombang-ambing, bunga lotus bernapas.
8. **Deterministik.** Hanya `random(seed)`, `noise2D` dan `drift`; tidak ada `Math.random`.
9. **Warna dari `COLORS`** (`koiCream`, `koiRed`, `koiInk`, `koiGold`, `pond*`, `lily*`, `lotus*`).

## 5. Foto Shifu Po tanpa latar

`public/assets/shifu/shifu.png` dibuat dari banner website (kemeja merah-hitam, kipas bulu) dengan alat lokal `D:\SHIFUPO\tools\bg-remove` (tidak mengunggah foto ke internet):

```powershell
cd D:\SHIFUPO\tools\bg-remove
node cut.mjs D:\SHIFUPO\site-assets\cutout "D:\SHIFUPO\site-assets\<foto>.jpeg"
```

Pilih foto dengan latar polos atau ilustrasi lembut; foto dengan latar ramai (pagoda) gagal dipotong. Setelah dipotong: buang piksel alfa < 48, potong ke batas figur, simpan sebagai `shifu.png`. Di scene, Shifu Po selalu menghadap ke dalam frame (`mirror`).

## 6. Dunia 3D (SP03)

Kode: `src/three/` (`World3D.tsx`, `House.tsx`, `Qi.tsx`, `Props3D.tsx`, `Landscape.tsx`, semua angka di `shots.ts`).

| Aturan | Isi |
|---|---|
| Satu dunia, tanpa potongan | Satu `<ThreeCanvas>` untuk seluruh reel; tiap scene = gerak kamera `from → to` (`SHOTS` di `shots.ts`), transisi = kamera berpindah dengan easing (`CAMERA.blendBefore/After`) |
| Kamera menarik | Tiap shot punya gerak bermakna: low angle mendorong maju, masuk lewat pintu, sudut dari dalam ruangan, crane naik ke peta, arc turun ke CTA. Jangan ada pohon/objek di antara kamera dan subjek |
| Rumah modern | Dua lantai, kaca penuh, pintu pivot merah, panel kayu, atap datar dengan list emas (`House.tsx`). Interior asli terlihat dari pintu dan kaca; warnanya menggelap saat energi buruk (`light`) |
| Peta | Blok, jalan aspal dengan garis emas, trotoar, taman, rumah modern kecil; saat angka berjalan jendela menyala dan pin peta muncul (`Landscape.tsx`) |
| Partikel dekat kamera | Partikel energi memudar di dekat kamera (`QI.nearFade`) supaya tidak menjadi bulatan besar di layar |
| Scene memperagakan kalimat | Setiap `shot` punya aksi yang terikat `actionCueWord` (koin memantul di pintu, energi masuk, energi bocor, jarum luo pan mengunci, perabot ditata) |
| Gaya | Toon 3 tingkat + outline tinta (`src/three/toon.tsx`), palet `COLORS`, `flat` (tanpa tone mapping) supaya warna tegas |
| Kedalaman | 3 cincin gunung, kabut, pohon dan bambu dekat rumah, kelopak jatuh, kota di kejauhan |
| Framing 9:16 | `fov` kamera itu vertikal; lebar pandang horizontal hanya ±56%, jadi pakai fov 46–52 dan kamera agak jauh |
| Teks | Tetap 2D di atas kanvas, dengan kabut kertas di kolom judul |

## 7. Output

Semua file kerja di `out/`. Hanya video final yang lolos semua cek disalin ke `D:\SHIFUPO\Video\` dengan nama `"SPxx - <judul>.mp4"`.

## 8. Checklist QA tambahan (selain 08)

- [ ] Semua foto berasal dari website Shifu Po atau dari user, dan tercatat di `docs/<id>/PLAN.md`.
- [ ] Tidak ada screenshot chat, logo pihak ketiga, atau wajah klien yang jelas.
- [ ] Foto tidak pecah di frame ukuran penuh (`npm run stills -- <id> <frame> --scale 1`).
- [ ] Wajah Shifu Po tidak tertutup teks, caption, atau pita emas.
- [ ] Koi tidak saling tumpuk lama dan tidak keluar jendela kecuali saat `flow`.
- [ ] Klaim angka sudah ditandai `reviewed: false` sampai dicek manusia.
