# 🎬 Bisa Nonton

Website streaming film & serial TV favorit berbasis web dengan pemutar video streaming **HLS (.m3u8)**, selector kualitas resolusi, navigasi episode serial TV, auto-play episode selanjutnya, dan panel admin untuk mengelola link video.

---

## 🚀 Fitur Utama

- ☀️ **Light Mode (Default) & 🌙 Dark Mode**: Tampilan default mode terang yang bersih, modern, dan segar dengan tombol toggle instan ke mode gelap bioskop.
- 📺 **Pemutar Streaming HLS (.m3u8)**: Mendukung link streaming `.m3u8` via **Hls.js** dengan kontrol Play, Pause, Stop, Seekbar, Volume/Mute, dan Fullscreen.
- ⚙️ **Quality Selector**: Dropdown dinamis untuk beralih level kualitas resolusi video (Auto, 1080p, 720p, 480p, 360p).
- 📑 **Serial TV & Auto-Play Next Episode**:
  - Drawer daftar episode serial di samping pemutar video.
  - Begitu satu episode selesai (`ended`), countdown overlay 5 detik otomatis memutar episode selanjutnya.
- 🛠️ **Panel Admin Kelola Film (`/admin`)**:
  - Tambah, edit, dan hapus film/serial.
  - Live preview poster cover.
  - Manajemen episode dinamis (tambah, hapus episode beserta nomor dan link stream masing-masing).
- ⚡ **Hybrid Database**: Mendukung database **Supabase** via Environment Variables atau otomatis fallback ke file lokal `data/movies.json`.

---

## 💻 Menjalankan di Lokal (Localhost)

1. **Clone atau buka folder project**:
   ```bash
   cd BisaNonton
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Jalankan server**:
   ```bash
   npm start
   ```
   Akses di browser:
   - Katalog Utama: [http://localhost:3000](http://localhost:3000)
   - Panel Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🗄️ Menghubungkan ke Database Supabase Pribadi

Aplikasi ini dirancang fleksibel. Anda dapat menggunakan akun Supabase pribadi Anda sendiri:

1. Buka dashboard [Supabase](https://supabase.com/) dan buat project baru (atau buka project yang ada).
2. Masuk ke menu **SQL Editor** di sidebar Supabase.
3. Salin seluruh isi file [`supabase_schema.sql`](./supabase_schema.sql), tempel di editor SQL Supabase, lalu klik **Run**.
4. Buka menu **Project Settings** > **API**:
   - Salin **Project URL**
   - Salin **anon public** (atau **service_role**) API Key.
5. Buat atau buka file `.env` di root project dan masukkan kredensial:
   ```env
   PORT=3000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-key
   ```
6. Restart server dengan `npm start`. Backend akan menampilkan pesan:
   `⚡ Menggunakan Database Supabase Kustom`
   Data film dan episode sekarang tersimpan langsung di Supabase!

---

## 📤 Cara Upload ke GitHub (Akun: lemaenang)

1. Buat repository baru di GitHub Anda: [https://github.com/new](https://github.com/new)
   - Beri nama repository, misalnya: `bisa-nonton`
   - Pilih Public atau Private sesuai keinginan.
   - Jangan centang "Add a README file" karena kita sudah menyediakannya.

2. Hubungkan repository lokal dan push kode:
   ```bash
   git remote add origin https://github.com/lemaenang/bisa-nonton.git
   git branch -M main
   git push -u origin main
   ```

---

## ☁️ Cara Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dengan akun Vercel Anda.
2. Klik **Add New...** > **Project**.
3. Import repository GitHub `lemaenang/bisa-nonton`.
4. Pada bagian **Environment Variables**, tambahkan:
   - `SUPABASE_URL` = URL project Supabase Anda
   - `SUPABASE_KEY` = API Key Supabase Anda
5. Klik **Deploy**.
6. Project Anda akan langsung live di domain Vercel (misal: `https://bisa-nonton.vercel.app`)!

---

## 📁 Struktur Folder

```
├── api/
│   └── index.js              # Entrypoint serverless function untuk Vercel
├── data/
│   └── movies.json           # Database lokal (cadangan saat offline)
├── public/
│   ├── css/
│   │   ├── style.css         # Desain sistem (Light Mode default & Dark Mode)
│   │   ├── player.css        # Desain kontrol player & countdown auto-play
│   │   └── admin.css         # Desain dashboard admin
│   ├── js/
│   │   ├── app.js            # Logika katalog, filter, pencarian
│   │   ├── player.js         # Engine pemutar Hls.js & serial auto-play
│   │   ├── admin.js          # Logika form CRUD admin
│   │   └── theme.js          # Pengelola tema (Light/Dark mode)
│   ├── index.html            # Halaman utama katalog & pemutar video
│   └── admin.html            # Halaman dashboard admin kelola film
├── services/
│   └── movieService.js       # Layer database hybrid (Supabase / JSON lokal)
├── .env.example              # Template environment variables
├── .gitignore                # File yang diabaikan oleh Git
├── package.json              # Dependencies Node.js
├── README.md                 # Dokumentasi ini
├── server.js                 # Server Express API & fallback routing
├── supabase_schema.sql       # Skrip SQL untuk setup tabel Supabase
└── vercel.json               # Konfigurasi routing deployment Vercel
```
