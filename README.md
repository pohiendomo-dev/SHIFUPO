# SHIFUPO: pabrik Reels Instagram Shifu Po

Semua bahan untuk membuat video Reels promosi **Shifu Po (Feng Shui & BaZi)**: kode video (Remotion), aset, foto, alat, dan video yang sudah jadi. Satu perintah mengubah naskah menjadi video final 1080×1920 siap unggah.

| Episode | Judul | Gaya | File |
|---|---|---|---|
| SP01 | Kerja Keras Punya Arah | 2D tinta | `Video/SP01 - Kerja Keras Punya Arah.mp4` |
| SP02 | Rezeki yang Mengalir | 2D + foto website + kolam koi | `Video/SP02 - Rezeki yang Mengalir.mp4` |
| SP03 | Pintu Rezeki | 3D toon, rumah modern | `Video/SP03 - Pintu Rezeki.mp4` |
| SP04 | Benang Merah Jodoh | 3D semi-realistis, senja | `Video/SP04 - Benang Merah Jodoh.mp4` |

---

## Isi repo

```
SHIFUPO/
├─ shifupo-reels-main/   Proyek video (Remotion). Semua pekerjaan dimulai di sini
│  ├─ data/episodes/     Naskah tiap episode (spXX.json): VO, teks layar, scene
│  ├─ docs/              Panduan langkah demi langkah + planning tiap episode
│  ├─ src/               Kode video (2D: scenes/, components/; 3D: three/)
│  ├─ scripts/           Pipeline: suara, render, loudness, QA, unduh aset
│  ├─ public/            Aset: foto, logo, model 3D CC0, tekstur, SFX, suara VO
│  └─ tests/             Test otomatis, termasuk gerbang kualitas 3D
├─ Video/                HANYA video final, nama = "SPxx - Judul.mp4"
├─ site-assets/          Unduhan asli dari shifupofengshui.com + potongan foto
├─ tools/bg-remove/      Alat hapus latar foto (lokal, tanpa upload)
└─ Prompt/               MASTER-PROMPT-SHIFUPO.txt (cara memberi brief ke Claude)
```

Tidak ada di repo (dibuat ulang otomatis di tiap laptop): `node_modules/`, cache npm, model whisper (`.whisper/`, 1,5 GB), folder kerja `out/`.

---

## Setup laptop baru (sekali saja, ±15 menit)

### 1. Pasang alat

| Alat | Cara pasang (Windows) | Cek |
|---|---|---|
| Node.js 20 atau lebih baru | https://nodejs.org (LTS) | `node -v` |
| ffmpeg + ffprobe | `winget install Gyan.FFmpeg` | `ffmpeg -version` |
| Git | `winget install Git.Git` atau GitHub Desktop | `git --version` |
| Claude Code (opsional) | https://claude.com/claude-code | untuk membuat episode baru dengan satu prompt |

Tutup dan buka lagi terminal setelah memasang ffmpeg.

### 2. Ambil repo

```powershell
cd D:\
git clone https://github.com/pohiendomo-dev/SHIFUPO.git
cd SHIFUPO\shifupo-reels-main
```

Taruh di `D:\SHIFUPO` kalau bisa: hasil video otomatis masuk ke `D:\SHIFUPO\Video`. Di lokasi lain juga jalan; video masuk ke folder `Video` di sebelah `shifupo-reels-main`.

### 3. Pasang paket

```powershell
npm install
```

Model 3D, tekstur, dan HDRI sudah ikut di repo. Kalau suatu saat hilang: `npm run assets` (mengunduh ulang dari Poly Haven, CC0).

### 4. File `.env` (kunci ElevenLabs)

Suara narasi dibuat dengan ElevenLabs. Kuncinya ada di `shifupo-reels-main/.env`:

| Variabel | Isi |
|---|---|
| `ELEVENLABS_API_KEY` | API key dari dashboard ElevenLabs (menu API Keys) |
| `ELEVENLABS_VOICE_ID` | ID voice Shifu Po |
| `ELEVENLABS_MODEL_ID` | Kosongkan (bawaan `eleven_multilingual_v2`) |

- Kalau repo ini **private**, `.env` ikut di repo dan langsung terpakai setelah clone.
- Kalau `.env` belum ada: `Copy-Item .env.example .env`, lalu isi dari pengelola akun ElevenLabs.
- **Jangan pernah** mem-push `.env` ke repo public, menempelnya di chat, atau di screenshot.

### 5. Cek semuanya

```powershell
npm run setup
npm run check
```

`setup` mengecek Node, ffmpeg, `.env`, SFX, dan foto Shifu Po. `check` menjalankan semua test (harus lolos semua).

---

## Membuat video

### Render ulang episode yang sudah ada

```powershell
cd D:\SHIFUPO\shifupo-reels-main
npm run produce -- sp04
```

Urutan otomatisnya: suara VO (dilewati kalau sudah ada), level suara, SFX, render, loudness -14 LUFS, cek suara dengan whisper, laporan QA. Kalau semua cek lolos, video disalin ke `D:\SHIFUPO\Video\SP04 - Benang Merah Jodoh.mp4`. Semua file kerja (laporan, lembar frame, draft) ada di `shifupo-reels-main/out/`.

| Perintah | Fungsi |
|---|---|
| `npm run produce -- <id>` | Video final (contoh `sp01` sampai `sp04`) |
| `npm run produce -- <id> --draft` | Draft setengah ukuran untuk cek cepat |
| `npm run produce -- <id> --from render` | Lanjut dari satu langkah (`tts`, `vo-level`, `sfx`, `render`, `postprocess`, `verify`) |
| `npm run studio` | Preview interaktif di browser |
| `npm run stills -- <id> 60 300 600 --scale 0.5` | Gambar frame tertentu untuk dicek |
| `npm run check` | Test + lint + typecheck |
| `npm run assets` | Unduh ulang aset 3D CC0 |

Durasi render final: 2D ±3 menit, 3D ±6–10 menit (tergantung GPU). Render pertama di laptop baru mengunduh model whisper 1,5 GB sekali.

### Episode baru

Dengan Claude Code, buka folder `shifupo-reels-main`, lalu:

```
/buat-video topik: feng shui dapur untuk kesehatan keluarga
```

Claude menulis planning (`docs/<id>/PLAN.md`), bertanya **sekali** (setuju/revisi), lalu memproduksi sampai video final. Cara memberi brief yang detail ada di `Prompt/MASTER-PROMPT-SHIFUPO.txt`.

Tanpa Claude: salin `data/episodes/sp04.json` menjadi `sp05.json`, ubah naskahnya, lalu `npm run produce -- sp05`. Aturan isinya ada di `docs/guides/02-PLANNING-KONTEN.md`.

---

## Panduan (folder `shifupo-reels-main/docs/guides/`)

| # | Panduan | Untuk |
|---|---|---|
| 01–02 | Planning ide dan konten | Topik, hook, naskah VO, file episode |
| 03 | Scene per scene | Storyboard, menambah tipe scene |
| 04–05 | Aset 2D dan 3D | Ilustrasi, model |
| 06 | Penempatan aset | Area aman Instagram, folder |
| 07 | Animasi | Gerak halus "anime smooth" |
| 08 | QA hasil bersih | Checklist sebelum unggah |
| 09 | Aset website dan urutan scene | Foto yang boleh/tidak, foto tanpa latar, scene fleksibel |
| 10 | 3D semi-realistis | Alat, aturan render 3D, gerbang kualitas (tidak ada aset tabrakan, kamera tidak menembus dinding) |

Aturan proyek untuk Claude: `shifupo-reels-main/CLAUDE.md`.

---

## Aset dan lisensi

| Aset | Sumber | Lisensi |
|---|---|---|
| Foto Shifu Po, logo, foto konsultasi | shifupofengshui.com (milik Shifu Po) | Internal Shifu Po |
| Model, tekstur, HDRI 3D | Poly Haven (`public/assets/3d/polyhaven/*/README.md`) | CC0, bebas komersial |
| SFX | Disintesis sendiri (`npm run sfx`) | Milik sendiri |
| Suara VO | ElevenLabs | Butuh paket berbayar untuk konten komersial |
| Remotion | remotion.dev | Gratis untuk perusahaan ≤3 karyawan; di atas itu butuh Company License |

Tidak dipakai di video: screenshot chat testimoni (data pribadi klien), logo pihak ketiga, video reels lama yang berisi sponsor.

### Hapus latar foto (tools/bg-remove)

```powershell
cd D:\SHIFUPO\tools\bg-remove
npm install
npm install-scripts approve onnxruntime-node sharp
npm rebuild onnxruntime-node sharp
node cut.mjs D:\SHIFUPO\site-assets\cutout "D:\SHIFUPO\site-assets\<foto>.jpeg"
```

Hasil PNG transparan ada di `site-assets/cutout/`. Foto Shifu Po yang dipakai video: `shifupo-reels-main/public/assets/shifu/shifu.png`.

---

## Masalah umum

| Gejala | Solusi |
|---|---|
| `ffmpeg was not found` | Pasang ffmpeg, buka ulang terminal |
| Video tanpa suara / `401` saat TTS | `.env` kosong atau key salah. Jalankan `npm run setup` |
| Frame 3D kosong atau hitam | Pastikan driver GPU terbaru; atau render dengan `--gl=swangle` (lebih lambat) |
| `npm run check` gagal di `layout3d` | Ada aset yang bertabrakan atau kamera menembus dinding setelah mengubah `src/three/shots.ts`. Perbaiki posisinya, jangan longgarkan test |
| Render berhenti di tengah | Tutup Studio/browser lain, lalu `npm run produce -- <id> --from render` |
| File di atas 30 MB | Otomatis dikompres ulang di langkah `postprocess` |
