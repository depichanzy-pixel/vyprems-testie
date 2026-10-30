# Devitads Testimoni — Vercel + Supabase

Website galeri testimoni dengan login owner, upload screenshot, kategori, pencarian, hapus testimoni, serta backup/restore JSON yang menyertakan metadata dan file gambar. Tampilan royal white kitty dengan nuansa blue aesthetic dan GIF kucing original.

## A. Buat project Supabase (penyimpanan online permanen)
1. Buka https://supabase.com lalu buat project baru.
2. Masuk ke **Project Settings → API** (atau **Connect**) dan salin Project URL serta anon/public key (publishable key juga bisa).
3. Buka file `config.js`. Ganti:
   - `https://YOUR-PROJECT.supabase.co` dengan Project URL.
   - `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY` dengan anon/publishable key.
   Jangan pernah memakai `service_role` key di website.
4. Buka **SQL Editor → New query**, tempel seluruh isi `supabase-setup.sql`, tetapi lakukan langkah akun owner berikut dahulu.

## B. Buat akun owner dan kunci akses
1. Di Supabase buka **Authentication → Users → Add user**. Buat akun email + password milikmu. Aktifkan email confirmed jika diminta.
2. Klik user yang baru dibuat, salin **UID**.
3. Di `supabase-setup.sql`, ganti SEMUA teks `PASTE_OWNER_USER_UUID_HERE` dengan UID tersebut (ada 5 tempat).
4. Jalankan SQL tersebut di SQL Editor.
   - Jangan bagikan password owner.
   - Kebijakan database memastikan hanya UID owner itu yang dapat upload, edit, dan hapus.
   - Login lewat tombol Owner Login di website.

## C. Deploy ke Vercel
1. Ekstrak ZIP ini.
2. Buat repository GitHub baru dan upload seluruh isi folder ini (pastikan `index.html`, `app.js`, `style.css`, `config.js` berada di root repository).
3. Buka https://vercel.com → Add New → Project → Import repository.
4. Framework Preset pilih **Other**. Build Command dan Output Directory dikosongkan; Root Directory `./`.
5. Klik Deploy. Website akan mendapatkan URL `*.vercel.app`.

## D. Cara memakai
- Buka URL website → Owner Login → masuk dengan akun Supabase.
- Isi judul, kategori, keterangan, pilih screenshot → Upload.
- Testimoni langsung muncul di halaman utama.
- Hapus dari dashboard bila diperlukan.
- Klik **Backup data** untuk mengunduh JSON berisi seluruh data dan gambar. Simpan file backup di perangkat/cloud pribadi.
- Klik **Restore backup** untuk menambahkan kembali data dan gambar dari file JSON. Restore menambahkan item (tidak menghapus data yang sudah ada).
- File gambar tersimpan di Supabase Storage dan metadata di database, sehingga tidak hilang hanya karena redeploy Vercel.

## Catatan keamanan & privasi
- Jangan unggah screenshot sebelum menyamarkan nomor telepon, alamat, email, username pribadi, ID transaksi sensitif, atau data pembayaran buyer.
- `config.js` berisi anon/publishable key yang memang boleh ada di frontend. Keamanan upload ditentukan oleh Row Level Security (RLS) dan UID owner di SQL.
- Jika ingin mengganti owner, ubah policy SQL dengan UID baru secara sengaja.
- Upload dibatasi maksimal 8 MB per gambar, format JPG/PNG/WEBP.


## GIF dekorasi
Tiga GIF kucing putih bertema kerajaan dibuat khusus untuk project ini dan disimpan lokal di `assets/`, jadi tidak bergantung pada link GIF eksternal.
