# SP02: "Rezeki yang Mengalir" (planning)

Status: **menunggu persetujuan**. Setelah disetujui, produksi berjalan otomatis (`/buat-video`).

Acuan kualitas dan aturan gerak: `docs/PLAN-SP01.md`. Aturan aset foto website dan urutan scene fleksibel: `docs/guides/09-ASET-WEBSITE-DAN-SCENE.md`.

---

## 1. Tujuan

- Penonton: pemilik usaha dan keluarga yang merasa rezeki "seret" padahal sudah berusaha.
- Perasaan: usaha sudah maksimal, tapi hasilnya tidak mengalir.
- Aksi setelah menonton: chat WhatsApp untuk konsultasi.
- Beda dengan SP01: SP02 memakai **foto asli Shifu Po dari website** (pagoda, konsultasi tatap muka) dan **kolam koi ilustrasi 2D realistis** sebagai simbol rezeki.

## 2. Layanan dan klaim

| Item | Isi |
|---|---|
| Layanan | Feng Shui rumah dan usaha, konsultasi tatap muka |
| Angka resmi | 850+ properti (website) |
| Klaim yang perlu dicek | "850+ properti sudah diselaraskan", "konsultasi tatap muka" (`reviewed: false`) |

## 3. Naskah VO (51 kata, ±28 detik)

| # | Beat | VO | Kata cue |
|---|---|---|---|
| 1 | Hook (kolam keruh) | "Usaha sudah maksimal, tapi rezeki terasa seret?" | maksimal, seret |
| 2 | Simbol (koi mengalir) | "Dalam Feng Shui, koi melambangkan rezeki yang terus mengalir." | koi, mengalir |
| 3 | Foto pagoda | "Shifu Po membaca aliran energi rumah dan usaha Anda." | aliran, rumah |
| 4 | Galeri konsultasi | "Konsultasi tatap muka, dijelaskan sampai Anda benar-benar paham." | tatap, Konsultasi, dijelaskan, paham |
| 5 | Bukti | "Lebih dari delapan ratus lima puluh properti sudah diselaraskan." | delapan |
| 6 | CTA | "Konsultasi via WhatsApp, biar rezeki Anda kembali mengalir." | WhatsApp, mengalir |

## 4. Teks layar

| Scene | Teks | Muncul di kata |
|---|---|---|
| 1 | USAHA SUDAH MAKSIMAL, / REZEKI TERASA **SERET?** | maksimal / seret |
| 2 | SIMBOL FENG SHUI · KOI = / REZEKI **MENGALIR** | koi / mengalir |
| 3 | FENG SHUI & BAZI · BACA ALIRAN **ENERGI** / RUMAH & USAHA | aliran / rumah |
| 4 | KONSULTASI **TATAP MUKA** + 3 foto | tatap; foto di Konsultasi, dijelaskan, paham |
| 5 | 850+ PROPERTI DISELARASKAN | delapan |
| 6 | Logo, "Konsultasi via WhatsApp", "Biar rezeki Anda kembali **mengalir.**" | WhatsApp / mengalir |

## 5. Storyboard

| Scene | Latar | Aksi dan gerak | Penghubung |
|---|---|---|---|
| 1 Hook | Kertas + gunung tinta; jendela bulan (moon gate) berisi kolam | Air gelap dan keruh, 3 koi berenang pelan, daun gugur di permukaan | Koi berbelok ke atas |
| 2 Simbol | Jendela bulan yang sama, air jernih bercahaya | Di "mengalir" kawanan koi berenang deras ke atas, jejak partikel emas, riak | Koi keluar dari atas jendela, percikan tinta |
| 3 Foto | Bingkai lengkung (arch) berisi foto pagoda | Push-in pelan (Ken Burns), pita energi emas melilit foto di "aliran", kilau cahaya menyapu | Pita emas mengalir ke kartu foto berikutnya |
| 4 Galeri | Kertas | 3 kartu polaroid jatuh berurutan dengan pegas dan rotasi, foto di dalam kartu bergerak pelan | Kartu terangkat, koi muncul dari bawah |
| 5 Bukti | Kolam koi (komponen baru) + koin emas | Angka 850+ menghitung, koin jatuh memantul | Riak menjadi sudut bingkai CTA |
| 6 CTA | Bingkai sudut merah | Logo merah resmi, foto Shifu Po berkipas dalam bingkai lengkung, tombol WhatsApp | (akhir) |

## 6. Aset dan geraknya

| Aset | Sumber | Gerak |
|---|---|---|
| `2d/sp02/pagoda.jpg` | website (foto Shifu Po di pagoda) | Ken Burns push-in + parallax, light sweep |
| `2d/sp02/consult-1..3.jpg` | website (galeri konsultasi) | jatuh dengan pegas, goyang halus, Ken Burns di dalam kartu |
| `2d/sp02/shifu-fan.jpg` | website (Shifu Po berkipas) | masuk dari kanan, bernapas |
| `brand/logo-red.png` | website (logo resmi) | pop dengan pegas |
| Koi realistis (`KoiPond.tsx`) | baru, SVG | tubuh meliuk mengikuti gelombang tulang belakang, sirip dada mengepak, ekor mengikuti (follow-through), bayangan di dasar kolam |
| Kolam | baru, SVG | kaustik cahaya bergerak, daun teratai mengapung, riak |
| Pita energi emas | baru, SVG | digambar sepanjang jalur dengan glow |

## 7. Suara

| Lapisan | Rencana |
|---|---|
| VO | ElevenLabs, voice di `.env` |
| SFX | Sintesis; tambah `bubble` untuk koi/air |
| BGM | Tidak ada (belum ada lisensi) |

## 8. Yang perlu manusia

- Cek klaim "850+ properti sudah diselaraskan" dan "tatap muka".
- Izin pemakaian foto klien yang terlihat dari belakang di foto konsultasi (wajah klien tidak terlihat jelas).
