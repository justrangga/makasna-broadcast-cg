# 📺 Makasna Broadcast CG Desktop Engine
> *Aplikasi Desktop Character Generator (CG) Windows Mandiri Berkinerja Tinggi untuk Penyiaran Live Televisi & Streaming.*

---

## 🚀 Fitur Utama (Sesuai Master Technical Guide)

- **100% Dedicated Character Generator Engine:** Didedikasikan penuh untuk tipografi tajam, rendering 60fps, dan pemutaran video transparan (*WebM VP9/AV1 Alpha & Lottie*). Bebas dari lag dan konsumsi memori berlebih seperti pada pemutaran *PNG sequence / ProRes MOV* vMix.
- **Dual-Mode Workspace:**
  1. **🎨 Designer Studio Mode:**
     - Timeline Multi-Track dengan **State Markers** penyiaran (`[INTRO]` $\rightarrow$ `[HOLD/LOOP]` $\rightarrow$ `[OUTRO]`).
     - Interpolasi Keyframe dinamis dengan kurva akselerasi (*Bézier Easing: Cubic, Back, Elastic, Bounce*).
     - Kanvas WYSIWYG 1920x1080 dengan panduan batas aman standar EBU/SMPTE (*Action-Safe 90%* & *Title-Safe 80%*).
     - Hardware-Accelerated Masking & Clip-Path untuk animasi kemunculan elemen (*mask reveal*).
     - Tipografi dinamis dengan fitur *Auto-Shrink / Auto-Fit*.
  2. **⚡ Playout Console Mode:**
     - Dual Tally Monitor: **Preview (PVW - Hijau)** & **Program (PGM - Merah Glowing)**.
     - Master Transition Deck: Tombol **`▶ TAKE`** (Spasi) dan **`⏹ CLEAR ALL`** (Esc) serta selective layer dump (`CLR L1` - `CLR L4`).
     - Playlist Rundown dengan live status badges (`CUED`, `ON AIR`) dan form quick-edit on-the-fly.
- **Smart Data Hub & Auto-Repeater Engine:**
  - Component Repeater: Desain 1 baris template di kanvas, otomatis melipat ganda sesuai jumlah peserta leaderboard secara dinamis dengan *stagger entrance animation*.
  - Pemetaan kolom (*Column Mapping*) dari header data.
  - Editor tabel spreadsheet internal + live file watcher untuk Excel (`.xlsx`) & `.csv`.
- **Broadcast Output Playout:**
  - NDI 1080p60 Alpha Channel Broadcast via LAN.
  - Secondary Display Output: Jendela fullscreen tanpa border (transparent) untuk port HDMI / DisplayPort.
  - Built-in Browser Source Server (`http://localhost:4989/?output=pgm`) untuk integrasi langsung ke vMix / OBS Studio.

---

## 🛠️ Panduan Instalasi & Menjalankan di Windows

### 1. Kebutuhan Sistem
- **Node.js** (Versi 20 LTS atau 22 LTS) $\rightarrow$ Unduh di [nodejs.org](https://nodejs.org)
- **Git** $\rightarrow$ Unduh di [git-scm.com](https://git-scm.com)
- **VS Code** (Disarankan)

### 2. Clone Repositori & Instal Dependensi
Buka Terminal / PowerShell / Command Prompt di laptop Evelyn:

```bash
git clone https://github.com/justrangga/makasna-broadcast-cg.git
cd makasna-broadcast-cg
npm install
```

### 3. Menjalankan Aplikasi (Mode Pengembangan)
```bash
npm run dev
```
*Aplikasi desktop akan terbuka secara otomatis dengan hot-reload aktif.*

### 4. Build File Installer Windows (.exe)
Untuk mengompilasi aplikasi menjadi satu file installer mandiri:
```bash
npm run dist:win
```
File installer akan tersimpan di dalam folder `release/` sebagai `Makasna Broadcast CG-Setup-1.0.0.exe`.

---

## ⌨️ Shortcut Keyboard Playout
| Tombol | Fungsi Siaran |
| :--- | :--- |
| **`Spacebar`** | **`TAKE`** (Menayangkan grafis yang sedang di-*CUE* ke *Program*, lalu otomatis menggeser fokus ke item berikutnya) |
| **`Escape`** | **`CLEAR ALL`** (Memicu animasi *Outro* pada seluruh layer dan membersihkan layar) |

---

## 📂 Struktur Proyek
```
makasna-broadcast-cg/
├── docs/
│   └── BROADCAST_CG_MASTER_GUIDE.md    # Spesifikasi teknis master
├── src/
│   ├── main/
│   │   ├── main.ts                     # Electron main process & GPU flags
│   │   └── output-server.ts            # Local broadcast HTTP/WebSocket server
│   ├── preload/
│   │   └── preload.ts                  # Secure IPC bridge
│   ├── shared/
│   │   ├── types.ts                    # Tipe data Project, Layer, Keyframe, Rundown
│   │   └── defaultProject.ts           # Template bawaan (News Lower Third, Leaderboard, Scorebug)
│   └── renderer/
│       ├── components/
│       │   ├── Header.tsx              # Workspace switcher & status telemetry
│       │   ├── designer/               # Designer Studio (Canvas, Timeline, Inspector, Hierarchy)
│       │   ├── playout/                # Playout Console (Dual Screen, Rundown, Transition Deck)
│       │   ├── datahub/                # Smart Data Hub modal & spreadsheet editor
│       │   ├── engine/                 # Animation engine, Bezier easings, Compositor stage
│       │   └── output/                 # Pure 1080p transparent output view
│       ├── store/                      # Zustand state stores (useCGStore, usePlayoutStore)
│       └── App.tsx
├── package.json
└── electron-builder.json               # Konfigurasi NSIS Windows Installer
```

---

## 📄 Lisensi
MIT License © Makasna - Rengga Pratama
