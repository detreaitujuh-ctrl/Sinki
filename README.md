# SINKI Parfums — Web App & Katalog Interaktif 👑

Platform web resmi **SINKI Parfums** (`https://sinkiparfum.my.id`), dibangun dengan teknologi modern React 19, TypeScript, Tailwind CSS, dan Vite.

---

## 🌟 Arsitektur & Alur Kerja Sistem (Workflow)

Untuk memastikan sistem berjalan rapi dan tidak membingungkan, alur publikasi dibagi menjadi 2 layer:

```
┌────────────────────────┐      Git Push       ┌───────────────────────────────────┐
│ Google AI Studio Build │ ──────────────────> │ GitHub (detreaitujuh-ctrl/sinki)  │
└────────────────────────┘                     └───────────────────────────────────┘
                                                                  │
                                                        CI/CD Auto-Deploy
                                                                  ▼
┌────────────────────────┐   Custom Domain     ┌───────────────────────────────────┐
│   sinkiparfum.my.id    │ <────────────────── │    Cloudflare Pages (Project: sinki)│
└────────────────────────┘                     └───────────────────────────────────┘
```

### 1. Alur Kode & Tampilan Website (Frontend Hosting)
* **Repositori Tunggal**: `detreaitujuh-ctrl/sinki` (Branch utama: `main`).
* **Deploy Otomatis**: Setiap perubahan kode yang di-push ke branch `main` akan langsung di-compile oleh Cloudflare Pages dan terbit ke domain `sinkiparfum.my.id`.
* **Konfigurasi Routing Cloudflare**: Terdaftar di `wrangler.jsonc` mengarah ke folder output `dist/`.

### 2. Alur Data & Media Real-time (Supabase Storage Cloud)
Perubahan harian dari dashboard Pemilik (**Dimensi Sinki**) TIDAK memerlukan deploy ulang kode di GitHub:
```
┌─────────────────────────────────┐
│ Dashboard Admin: /dimensi-sinki │
└─────────────────────────────────┘
                │
         Direct Cloud Upsert
                ▼
┌────────────────────────────────────────────────────────┐
│ Supabase Storage Cloud (Bucket: sinki-media)           │
│  - top_perfumes.json    (Urutan Top 1 s/d Top 50)     │
│  - perfumes_catalog.json (68 Varian Katalog Koleksi)   │
│  - ticker_config.json   (Teks Berjalan Promo)          │
│  - pricing_config.json  (Konfigurasi Harga Per Ml)     │
│  - reviews.json         (Ulasan Pelanggan)             │
│  - social_links.json    (Tautan Akun Medsos)           │
│  - top11/*.jpg          (Foto Botol Varian)            │
└────────────────────────────────────────────────────────┘
                ▲
          Auto-Fetch (Anti-Cache)
                │
┌─────────────────────────────────┐
│ Pengunjung Publik sinkiparfum   │
└─────────────────────────────────┘
```

---

## 📁 Struktur Direktori Utama

* `src/components/` — Komponen antarmuka (Home, Collection, Top11, Order, Review, Dimensi Sinki Admin, BottomNavBar).
* `src/data/` — Data master bawaan (`perfumes.ts` untuk 68 varian katalog, `top11.ts` untuk 11 juara bestseller).
* `src/utils/` — Logika sinkronisasi data langsung ke Supabase Cloud:
  * `topPerfumesStorage.ts` : Tambah, edit, dan hapus Top Bestseller dengan sinkronisasi instan ke Supabase.
  * `perfumeStorage.ts` : Kelola katalog parfum koleksi publik.
  * `assetStorage.ts` : Kelola logo, chibi, barcode QRIS, dan foto botol parfum.
  * `tickerStorage.ts` : Kelola running text di beranda.
  * `pricingStorage.ts` : Konfigurasi harga per mL botol & gratis ongkir.
* `.github/workflows/deploy.yml` — Workflow otomatis build & deploy ke Cloudflare.
* `wrangler.jsonc` — Konfigurasi routing domain `sinkiparfum.my.id` di Cloudflare.
* `public/_headers` — Aturan anti-stale cache Cloudflare agar browser selalu memuat data terbaru.

---

## 🔐 Keamanan & Akses Admin
* Rute Rahasia Pemilik: `/dimensi-sinki`
* PIN Pemilik Standar: `241026` / `1995`

---

## 🛠️ Perintah Pengembangan Lokal

```bash
# Pasang dependensi
npm install

# Jalankan server lokal
npm run dev

# Tes compile & linting
npm run lint

# Build aset produksi
npm run build
```
