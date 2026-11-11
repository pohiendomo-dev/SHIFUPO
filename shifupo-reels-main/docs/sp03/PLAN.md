# SP03: "Pintu Rezeki" (planning, versi 3D)

Status: **menunggu persetujuan**.

Acuan: `docs/PLAN-SP01.md` (kualitas gerak), `docs/guides/05-ASET-3D.md` (3D), `docs/guides/09-ASET-WEBSITE-DAN-SCENE.md` (foto, urutan scene).

---

## 1. Tujuan dan pelajaran dari SP02

- Penonton: pemilik rumah dan usaha yang merasa rezeki "tertahan".
- Aksi: chat WhatsApp.
- Masukan SP02 yang diperbaiki:
  - Scene SP02 terasa seperti slide terpisah. SP03 memakai **satu dunia 3D dan satu kamera yang terus bergerak**: tidak ada potongan, setiap scene adalah gerakan kamera ke "pose" berikutnya.
  - Setiap scene harus **memperagakan kalimatnya** (kalimat tentang pintu = kamera di pintu, energi masuk; kalimat tentang luo pan = luo pan berputar dan jarumnya mengunci).
  - Foto Shifu Po sekarang **potongan tanpa latar** (`assets/shifu/shifu.png`), bukan foto berbingkai.
  - Warna tegas dan tajam: shading toon 3 tingkat + outline tinta, merah segel, emas, giok, langit kertas hangat; kedalaman dari kabut dan 3 lapis gunung 3D.

## 2. Layanan dan klaim

| Item | Isi |
|---|---|
| Layanan | Feng Shui rumah (pintu utama, arah, penataan ruang) |
| Angka resmi | 850+ properti |
| Klaim perlu dicek | pintu utama = gerbang energi; arah salah membuat energi keluar lagi; 850+ properti (`reviewed: false`) |

## 3. Naskah VO (50 kata, ±28 detik)

| # | Shot 3D | VO | Kata cue (aksi) |
|---|---|---|---|
| 1 | Rumah redup | "Rumah sudah bagus, tapi rezeki seperti tertahan?" | koin memantul di pintu tertutup: **tertahan** |
| 2 | Pintu | "Dalam Feng Shui, pintu utama adalah gerbang energi." | pintu terbuka, arus energi emas masuk: **energi** |
| 3 | Energi bocor | "Kalau arah salah, energi cuma berputar lalu keluar." | arus berputar di dalam lalu keluar lewat jendela belakang, rumah meredup: **keluar** |
| 4 | Luo pan | "Shifu Po membaca arahnya dengan luo pan." | Shifu Po masuk di **Shifu**; jarum luo pan mengunci di **arahnya** |
| 5 | Tata ulang | "Lalu menata ulang ruang, tanpa bongkar total." | atap terangkat, perabot bergeser dan mengunci, energi mengalir di tiap ruang: **ruang** |
| 6 | Kota | "Lebih dari delapan ratus lima puluh properti." | kamera naik, ratusan rumah menyala emas satu per satu, angka 850+ |
| 7 | Rumah hangat | "Chat WhatsApp, biar rezeki masuk dan menetap." | Shifu Po, logo resmi, tombol WhatsApp, koin mengalir masuk pintu |

## 4. Teks layar

| # | Teks | Muncul di |
|---|---|---|
| 1 | RUMAH SUDAH BAGUS, / REZEKI **TERTAHAN?** | bagus / rezeki |
| 2 | FENG SHUI RUMAH · **PINTU** UTAMA / = GERBANG **ENERGI** | pintu / gerbang |
| 3 | ARAH **SALAH,** / ENERGI BERPUTAR LALU **KELUAR** | salah / berputar |
| 4 | SHIFU PO · BACA ARAH / DENGAN **LUO PAN** | membaca / luo |
| 5 | TATA ULANG **RUANG** / **TANPA** BONGKAR TOTAL | menata / tanpa |
| 6 | 850+ PROPERTI DISELARASKAN | delapan |
| 7 | Logo, "Biar rezeki masuk dan **menetap.**", tombol "Konsultasi via WhatsApp" | rezeki / WhatsApp |

## 5. Dunia 3D dan aset

| Aset | Dibuat dari | Gerak |
|---|---|---|
| Rumah bergaya oriental (dinding krem, atap merah melengkung, nok emas, pintu merah, jendela, lentera) | primitif three.js, toon + outline | pintu berayun (pegas), jendela menyala, atap terangkat di scene 5 |
| Arus energi (qi) | ratusan partikel emas mengikuti kurva 3D | mengalir masuk, berputar, keluar (abu-abu), lalu mengalir lagi (emas) |
| Koin Tiongkok | koin 3D dengan lubang persegi | menggelinding, memantul, menumpuk |
| Luo pan | piringan emas + tekstur cincin dan trigram, jarum merah | naik, berputar, jarum mengunci dengan overshoot |
| Perabot (sofa, meja, ranjang, tanaman) | balok toon | bergeser lalu mengunci satu per satu (stagger) |
| Kota | ±200 rumah mini (instanced) | menyala emas menyebar dari tengah |
| Latar | langit kertas hangat, 3 lapis gunung 3D, kabut, kelopak jatuh | parallax mengikuti kamera |
| Shifu Po | `shifu.png` (potongan tanpa latar) | masuk dari kanan dengan pegas, bernapas |
| Logo | `brand/logo-red.png` | pop |

Kamera berpindah antar pose dengan easing (tanpa potongan), dan tetap bergerak pelan di setiap pose (tidak pernah diam).

## 6. Suara

VO ElevenLabs; SFX sintesis: whoosh di setiap gerak kamera, koin, gong pintu, tick + lock luo pan, stamp perabot, shimmer energi.

## 7. Yang perlu manusia

- Cek klaim Feng Shui dan angka 850+.
- Foto Shifu Po berasal dari banner website; pastikan boleh dipakai untuk reels.
