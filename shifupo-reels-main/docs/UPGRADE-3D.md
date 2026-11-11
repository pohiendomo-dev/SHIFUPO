# Upgrade 3D: dari "toon polos" ke semi-realistis yang hidup

Status: **menunggu persetujuan**. Dipakai pertama kali untuk SP04 (jodoh), lalu SP03 bisa dirender ulang dengan dunia yang sama.

## 1. Gap saat ini (SP03)

| # | Gap | Akibat di layar | Penyebab |
|---|---|---|---|
| 1 | Semua aset dari balok, silinder, kerucut polos | Terlihat seperti mainan; tidak ada corak (kayu, beton, aspal, rumput) | Belum ada tekstur PBR dan model asli |
| 2 | Tidak ada bayangan jatuh dan oklusi | Benda terlihat "melayang", tidak menapak | Shadow map, contact shadow dan AO belum dipakai |
| 3 | Cahaya datar (hemisphere + 1 directional) | Tidak ada nuansa jam (pagi, senja), kaca tidak memantulkan langit | Belum ada HDRI environment |
| 4 | Tanpa post-processing | Lampu dan energi tidak "berpendar", warna kurang sinematik | Belum ada bloom, grading, vignette, SMAA |
| 5 | Dunia sepi | Jalan kosong, tidak ada yang bergerak selain aksi utama | Belum ada "kehidupan sekunder": mobil lewat, burung, awan, daun, tirai, kucing, asap |
| 6 | Halaman depan minim | Rumah tidak terasa "dihuni" | Belum ada kotak surat, lampu taman, pot, rumput liar, bunga, pagar, mobil di carport |
| 7 | Tidak ada pengecekan otomatis tabrakan dan framing | Aset bisa menembus aset lain atau keluar frame tanpa ketahuan | QA hanya dari mata (stills) |

Catatan soal model: pemilihan model (misalnya Fable 5.2) bisa diganti dari pemilih model di app, tapi gap di atas adalah **gap pipeline dan aset**, bukan gap model. Model mana pun hanya sebagus bahan, cahaya, dan pengecekan yang tersedia di proyek.

## 2. Alat pihak ketiga (gratis) yang diusulkan

### Library (npm, ±12 MB di node_modules)

| Paket | Versi | Lisensi | Dipakai untuk |
|---|---|---|---|
| `@react-three/drei` | 10.7.9 | MIT | `useGLTF` (model), `useTexture`, `Environment` (HDRI lokal), `ContactShadows`, `MeshReflectorMaterial` (lantai/genangan), `Instances` (rumput, daun, kelopak dalam jumlah besar dengan ringan) |
| `@react-three/postprocessing` | 3.2.2 | MIT | Bloom (lampu, energi), N8AO (oklusi sudut), Vignette, SMAA (tepi tajam), ToneMapping |
| `postprocessing` | 6.39.6 | Zlib | Mesin efek di bawah paket di atas |

Semua efek tetap frame-driven: tidak ada efek yang memakai waktu (noise/grain beranimasi) supaya render identik dan tidak patah. Kompatibilitas dengan `@remotion/three` dibuktikan dulu dengan probe sebelum dipakai.

### Aset CC0 (Poly Haven, bebas dipakai komersial tanpa atribusi), total ±40 MB

| Jenis | Aset | Ukuran |
|---|---|---|
| HDRI langit | `kloofendal_48d_partly_cloudy_puresky` (siang), `venice_sunset` (senja) | 1,4 + 1,4 MB |
| Tekstur PBR 1K | `asphalt_02`, `concrete_floor_worn_001`, `white_plaster_02`, `laminate_floor_02`, `wood_planks`, `aerial_grass_rock`, `fabric_pattern_07` | ±10,5 MB |
| Model 1K | `Sofa_01`, `ArmChair_01`, `coffee_table_round_01`, `dining_chair_02`, `potted_plant_04`, `fern_02`, `cardboard_box_01`, `wooden_crate_01`, `street_lamp_01`, `lantern_chandelier_01`, `fancy_picture_frame_01` | ±16 MB |

Disimpan di `public/assets/3d/<nama>/` + `README.md` (sumber, lisensi CC0). Benda khas yang tidak ada di Poly Haven (pohon bunga persik, luo pan, benang merah, pasangan bebek mandarin, rumah modern) tetap dibuat dari kode, tapi memakai tekstur PBR yang sama supaya gayanya konsisten.

## 3. Gaya "semi-realistis" yang konsisten

| Aturan | Isi |
|---|---|
| Material | PBR (`meshStandardMaterial`) dengan tekstur asli untuk permukaan besar; warna brand (merah segel, emas) tetap jadi aksen |
| Garis | Outline tinta tipis hanya pada objek utama (rumah, luo pan, Shifu Po), bukan semua benda |
| Cahaya | HDRI + 1 matahari dengan bayangan lembut; lampu interior hangat; jam berubah sesuai cerita (redup → hangat) |
| Post | Bloom ringan, AO, vignette tipis, grading hangat; tidak berlebihan |
| Kepadatan detail | Detail di latar dekat (halaman, jalan) tapi tidak di jalur pandang kamera ke subjek |

## 4. Gerbang kualitas otomatis (agar tidak ada cacat)

1. **Tabrakan**: setiap benda di layout punya kotak batas (`Box3`); test memastikan tidak ada dua benda yang saling menembus (toleransi 1 cm), termasuk perabot dalam posisi berantakan dan rapi.
2. **Tetap di dalam area**: perabot di dalam dinding, rumah di dalam kavling, mobil di jalur jalan.
3. **Framing**: untuk tiap shot, titik penting (pintu, luo pan, wajah Shifu Po) diproyeksikan ke layar di awal, tengah, akhir gerak kamera; test gagal kalau keluar frame atau masuk area caption/judul.
4. **Jalur kamera bebas halangan**: tidak ada benda di antara kamera dan subjek (raycast di beberapa titik jalur).
5. **Stills wajib**: frame awal, tengah, akhir tiap scene dicek sebelum render final.

## 5. "Hidup" (kehidupan sekunder)

Mobil melintas di jalan, burung terbang di kejauhan, awan bergerak, daun dan kelopak berjatuhan, tirai bergoyang, lampu jalan menyala saat senja, kucing di teras, asap teh dari cangkir. Semua deterministik (frame + seed) dan dijauhkan dari subjek utama.
