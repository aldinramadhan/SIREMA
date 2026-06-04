# Panduan Deploy SIREMA ke Vercel + GitHub

## Prasyarat
- Akun GitHub: https://github.com
- Akun Vercel: https://vercel.com (bisa login pakai akun GitHub)
- Akun Supabase sudah ada dan berjalan

---

## Langkah 1 — Export kode dari Figma Make

1. Buka project SIREMA di Figma Make
2. Klik ikon **Settings** (roda gigi)
3. Pilih **Export** → Download semua file sebagai ZIP
4. Ekstrak ZIP ke folder di komputer Anda (misal: `sirema/`)

---

## Langkah 2 — Push ke GitHub

Buka terminal, arahkan ke folder hasil ekstrak:

```bash
cd sirema

# Inisialisasi git (jika belum ada)
git init
git branch -M main

# Tambahkan semua file
git add .
git commit -m "Initial commit: SIREMA app"

# Buat repository baru di GitHub (jangan centang README/gitignore)
# lalu hubungkan:
git remote add origin https://github.com/USERNAME/sirema.git
git push -u origin main
```

---

## Langkah 3 — Deploy ke Vercel

1. Buka https://vercel.com → **Add New Project**
2. Pilih **Import Git Repository** → pilih repo `sirema`
3. Vercel akan mendeteksi Vite secara otomatis. Biarkan default:
   - **Framework:** Vite
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`
4. Klik **Deploy** → tunggu 1-2 menit

---

## Langkah 4 — Tambah Domain Custom (opsional)

1. Di dashboard Vercel → project sirema → **Settings → Domains**
2. Klik **Add** → ketik domain Anda (misal: `sirema.unilia.ac.id`)
3. Vercel akan memberi dua pilihan record DNS:
   - **A Record:** `76.76.21.21`
   - **CNAME:** `cname.vercel-dns.com`
4. Login ke panel DNS kampus/domain Anda → tambahkan salah satu record di atas
5. Tunggu propagasi DNS (5 menit – 24 jam)
6. SSL otomatis aktif dari Vercel

---

## Langkah 5 — Update CORS di Supabase (jika perlu)

Jika domain custom dipakai, pastikan Supabase mengizinkan origin tersebut:

1. Buka https://supabase.com/dashboard → project Anda
2. **Authentication → URL Configuration**
3. Tambahkan URL app Anda di **Site URL** dan **Redirect URLs**:
   ```
   https://sirema.unilia.ac.id
   https://sirema.unilia.ac.id/**
   ```

---

## Catatan Penting

| Item | Keterangan |
|---|---|
| Data mahasiswa & retensi | Tetap di Supabase — tidak perlu migrasi |
| Edge Functions | Tetap di Supabase — tidak perlu perubahan |
| Akun pengguna | Tetap di Supabase Auth |
| File `.env` | JANGAN di-commit ke GitHub |
| `SERVICE_ROLE_KEY` | Hanya ada di Supabase server, tidak di frontend |

---

## Troubleshooting

**Build gagal karena missing module:**
Pastikan semua dependency terinstall: `pnpm install`

**Halaman kosong / 404 saat refresh:**
Pastikan `vercel.json` ada di root project (sudah disiapkan).

**Login tidak bisa:**
Cek Supabase Dashboard → Authentication → URL Configuration → tambahkan URL Vercel Anda.
