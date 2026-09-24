# 📘 MASTER TECHNICAL GUIDE: APLIKASI DESKTOP BROADCAST CG
*Arsitektur & Spesifikasi Pengembangan Software Character Generator Windows Mandiri*

---

## 1. Visi Produk & Filosofi Sistem

- **100% Dedicated Character Generator (CG):**
  Bukan video switcher (membuang modul video transisi seperti Cut, Fade, T-Bar). Seluruh daya prosesor (CPU) dan kartu grafis (GPU) didedikasikan penuh untuk ketajaman tipografi, kelancaran animasi 60fps, serta efisiensi pemutaran layer video transparan.
- **Solusi Anti-Lag & Hemat RAM (Mengatasi Kelemahan vMix):**
  Menggantikan pemutaran ribuan file *PNG sequence* mentah dan *MOV ProRes uncompressed* yang boros memori dengan teknologi hardware decoding modern (**WebM VP9/AV1 Alpha** dan **Lottie Vector JSON**).
- **Distribusi Siap Pakai untuk Klien:**
  Didistribusikan sebagai aplikasi desktop Windows mandiri dalam bentuk satu file installer (`Setup.exe` / `.msi`), tanpa mengharuskan pengguna akhir menginstal dependensi manual.

---

## 2. Diagram Arsitektur Sistem

```
┌────────────────────────────────────────────────────────────────────────┐
│               APLIKASI DESKTOP WINDOWS MANDIRI (.EXE)                  │
├────────────────────────────────────────────────────────────────────────┤
│  [ UI WORKSPACE (DUAL-MODE) ]                                          │
│  • 🎨 Designer Studio Mode  (Timeline, Masking, Properties Inspector)   │
│  • ⚡ Playout Console Mode   (Preview/Program, Rundown, Quick Forms)    │
├────────────────────────────────────────────────────────────────────────┤
│  [ GRAPHIC & MOTION ENGINE ]                                           │
│  • Timeline Multi-Track dengan State Markers (Intro, Hold, Outro)     │
│  • Hardware-Accelerated Masking & Alpha Matte (WebGL / Canvas)         │
│  • Multi-Layer Compositor (WebM Alpha, Lottie, PNG, Live Dynamic Text) │
│  • Auto-Fit Typography & Dynamic Anchor System                         │
├────────────────────────────────────────────────────────────────────────┤
│  [ SMART DATA HUB ]                                                    │
│  • Component Repeater Engine (Template 1-Baris Otomatis Melipat Ganda) │
│  • Drag-and-Drop Column Mapping dari Header Spreadsheet                │
│  • Local Spreadsheet Editor + Excel / CSV Live File Watcher            │
├────────────────────────────────────────────────────────────────────────┤
│  [ BROADCAST PLAYOUT ENGINE ]                                          │
│  • NDI Output SDK (1080p60 Video dengan Alpha Channel Murni via LAN)   │
│  • Secondary Display Playout (Fullscreen HDMI / DisplayPort Window)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Spesifikasi Modul Teknis

### Modul A: Motion Engine & Timeline (After Effects Style)

1. **Multi-Track Timeline:**
   - Menyediakan layer track terpisah untuk Text, Media Gambar (PNG/SVG), Video Alpha (WebM/MOV), Shape, dan Mask.
   - Jarum penunjuk waktu (*Playhead*) interaktif dengan kemampuan zoom skala waktu (satuan detik dan frame).
2. **State Markers (Standar Penyiaran TV):**
   - **`INTRO` Marker (In-Transition):** Animasi masuk saat grafis di-*take* ke layar.
   - **`HOLD / LOOP` Marker (On-Air Idle):** Titik tahan saat grafis sedang tayang langsung. Dapat berupa posisi diam stabil atau animasi berulang halus (*subtle loop* seperti partikel atau kilau cahaya).
   - **`OUTRO` Marker (Out-Transition):** Animasi keluar saat operator menekan tombol *Clear / Off-Air*. Grafis melipat atau mundur ke balik mask.
3. **Sistem Masking (Clip Path & Alpha Matte):**
   - **Shape / Rectangle Mask:** Membatasi area kemunculan elemen. Teks atau foto meluncur keluar dari balik batas garis tak terlihat (*mask reveal*).
   - **Alpha Matte:** Memanfaatkan layer bentuk atau video transparan sebagai cetakan transparansi untuk layer di bawahnya.
4. **Keyframe Dinamis & Kurva Easing:**
   - Penempatan keyframe independen pada atribut: *Position X/Y*, *Scale*, *Opacity*, *Rotation*, dan *Blur*.
   - Kurva akselerasi (*Bézier Curves* / Easing: Cubic, Elastic, Bounce) agar pergerakan grafis luwes dan organik.
5. **Tipografi Dinamis & Auto-Shrink:**
   - Teks bersifat dinamis (dapat diganti kapan saja tanpa perlu merender ulang animasi).
   - Fitur *Auto-Shrink / Auto-Fit*: Jika teks nama narasumber terlalu panjang, ukuran font otomatis mengecil agar tidak keluar dari kotak batas visual.

---

### Modul B: Multi-Layer Stacking (Ultra Ringan & Bebas Lag)

Struktur tumpukan grafis per halaman (*Page Template*):
- **Layer 1 (Background Motion Plate):** Video transparan WebM Alpha / MOV beresolusi 1080p60 dengan akselerasi GPU hardware decoding.
- **Layer 2 (Graphic Mask):** Batas ruang potong animasi teks/foto.
- **Layer 3 (Aset Gambar PNG):** Foto cutout pemain, logo tim sepak bola, badge sponsor transparan.
- **Layer 4 (Live Dynamic Text):** Judul headline, subtitle keterangan, badge kategori, dengan efek bayangan (*drop shadow*) dan font kustom.

---

### Modul C: Smart Data Hub & Auto-Repeater (Leaderboard Pintar)

Menghilangkan keharusan input baris manual satu per satu seperti di vMix:
1. **Component Repeater (Desain 1 Baris):**
   - Operator hanya mendesain **satu baris template** di kanvas (contoh: Peringkat, Nama Atlet, Bendera/Klub, Catatan Waktu).
   - Begitu data tabel dihubungkan, engine otomatis melipatgandakan baris tersebut ke bawah sebanyak jumlah peserta secara dinamis, lengkap dengan animasi beruntun (*stagger effect*).
2. **Drag-and-Drop Column Mapping:**
   - Kolom data dari tabel spreadsheet muncul sebagai chip label (contoh: `[Posisi]`, `[Nama]`, `[Poin]`).
   - Cukup seret (*drag*) chip `[Nama]` dan lepaskan (*drop*) ke atas elemen teks di kanvas. Seluruh baris di bawahnya otomatis membaca data kolom tersebut.
3. **Live Auto-Reload & Local Table:**
   - Tersedia tabel spreadsheet internal di dalam aplikasi untuk edit cepat saat siaran langsung.
   - Mendukung integrasi file luar (Excel `.xlsx` / `.csv`). Saat file luar di-*save*, grafis on-air seketika memperbarui isinya (*hot-reload*).

---

### Modul D: Dual-Mode Workspace

1. **🎨 Designer Mode (Untuk Tahap Desain & Pengaturan):**
   - Kanvas WYSIWYG Full HD (1920x1080) dengan panduan garis batas aman (*Title-Safe & Action-Safe Guides*).
   - Panel Timeline & Keyframe lengkap di bagian bawah layar.
   - Properties Inspector di sisi kanan (Font, Warna, Gradasi, Masking, Easing, dan Durasi).
2. **⚡ Playout Mode (Untuk Operator Saat Siaran Live):**
   - Timeline disembunyikan agar antarmuka bersih dan ergonomis.
   - **Dual Screen:** Monitor *Preview* (PVW - Hijau) dan Monitor *Program* (PGM - Merah).
   - **Playlist Rundown:** Daftar antrean grafis acara yang siap dipanggil (*Lower Third Host* $\rightarrow$ *Lower Third Tamu* $\rightarrow$ *Klasemen* $\rightarrow$ *Ticker*).
   - Tombol On-Air terdedikasi: **`▶ TAKE`**, **`⏹ CLEAR`**, dan **`⚡ TAKE ALL`**.

---

### Modul E: Output Penyiaran (Broadcast Playout)

1. **NDI Output (Alpha Channel Transparan via LAN):**
   - Mengirimkan sinyal video 1080p60 dengan transparansi murni melalui kabel jaringan LAN.
   - Di software penyiaran (vMix, OBS Studio, TriCaster), operator cukup menambahkan input sumber `NDI` tanpa perlu konfigurasi kabel fisik tambahan.
2. **Secondary Display / Fullscreen HDMI:**
   - Mengeluarkan tampilan grafis fullscreen ke port HDMI / DisplayPort pada monitor sekunder atau kartu capture eksternal.

---

## 4. Rencana Tahapan Pengembangan (Development Roadmap)

```
FASE 1: CORE ENGINE & CANVAS RUNTIME
├── Setup basis aplikasi desktop Electron / Tauri
├── Multi-layer visual renderer (WebM Alpha + PNG + Dynamic Text)
└── Masking & clipping engine berbasis hardware acceleration (WebGL)

FASE 2: TIMELINE & KEYFRAME SYSTEM
├── Pembuatan antarmuka Timeline Ruler & Playhead
├── Implementasi State Markers: [INTRO] -> [HOLD] -> [OUTRO]
├── Interpolasi Keyframe & Kurva Akselerasi Easing Bézier
└── Injeksi teks dan aset dinamis tanpa interupsi timeline

FASE 3: SMART DATA HUB & AUTO-REPEATER
├── Tabel spreadsheet internal & parser file Excel / CSV
├── Engine Component Repeater (kloning otomatis template 1 baris)
└── Fitur drag-and-drop kolom spreadsheet ke elemen visual

FASE 4: BROADCAST OUTPUT & DUAL-MODE UI
├── Integrasi modul NDI Playout SDK (1080p60 Alpha Channel)
├── Antarmuka Dual-Mode: Designer Mode vs Playout Mode
└── Sistem manajemen file proyek template (.mcg / .mks)

FASE 5: WINDOWS PACKAGING & INSTALLER
├── Kompilasi aplikasi mandiri Windows (.exe)
├── Pembuatan file wizard installer via electron-builder / Inno Setup
└── Pengujian ketahanan sistem (CPU, RAM, dan uji performa 60fps)
```

---

## 5. Ringkasan Keunggulan Dibandingkan vMix CG

| Parameter | vMix (GT Title Designer) | Aplikasi CG Baru Kita |
| :--- | :--- | :--- |
| **Beban Animasi PNG Sequence** | Boros RAM (uncompressed bitmap di-load di awal) | **Sangat Ringan** (streaming buffer on-demand) |
| **Video Transparan (.MOV)** | Berat di CPU (DirectShow legacy decoder) | **Akselerasi GPU** via WebM VP9/AV1 Alpha & Lottie |
| **Kebebasan Animasi** | Terbatas pada preset panah dasar | **Bebas Tanpa Batas** via Timeline Keyframe & Masking |
| **Teknik Mask Reveal** | Sangat rumit dan kaku | **Native** (cukup gambar kotak mask) |
| **Data Leaderboard** | Harus pilih kolom & baris manual satu per satu | **Auto-Repeater & Drag-and-Drop Mapping** |
| **Kebutuhan Lisensi** | Mahal ($700 - $1.200 per lisensi) | **Milik Sendiri / Bebas Lisensi Pihak Ketiga** |
