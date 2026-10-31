# Backend SIMANIKA

Backend memakai Laravel 12, Sanctum cookie, PostgreSQL 15+ atau MySQL 8.0.30, dan PHP 8.2+. `composer.lock` dikunci untuk platform PHP 8.2 agar instalasi produksi sesuai arsitektur. Lihat `PRD.md`, `architecture.md`, `frontend/docs/events.md`, `frontend/docs/oprec.md`, dan `frontend/docs/password-recovery.md` di root proyek untuk kontrak lengkap.

Untuk hosting kampus dengan MySQL 8.0.30, phpMyAdmin, dan FTP tanpa terminal, gunakan [panduan impor MySQL](deploy/README.md). Kode backend kini mendukung `DB_CONNECTION=mysql`; konfigurasi PostgreSQL lokal tetap tersedia.

## Menjalankan lokal

1. Pasang PHP 8.2+ dengan ekstensi `pgsql`, `pdo_pgsql`, `pdo_sqlite` (untuk test), `mbstring`, `openssl`, `fileinfo`, `xml`, dan Composer 2. PostgreSQL harus tersedia.
2. Di folder `backend`, jalankan `composer install`, salin `.env.example` ke `.env`, isi kredensial database, lalu `php artisan key:generate`.
3. Buat database PostgreSQL `simanika`, jalankan `php artisan migrate`, lalu `php artisan serve --host=localhost --port=8000`.
4. Salin `frontend/.env.example` ke `frontend/.env.local` dan jalankan Next.js. Buka `http://localhost:8000/api/ping` untuk memeriksa API.
5. Untuk reset sandi sungguhan, set `MAIL_MAILER=smtp`, host, port, kredensial, dan `FRONTEND_URL`. Nilai `MAIL_MAILER=log` hanya menulis pesan email ke log lokal. Admin awal dapat dibuat dengan `ADMIN_EMAIL`, `ADMIN_PASSWORD` (minimal 12 karakter), lalu `php artisan db:seed`.

Di Windows, jalankan `dev.bat` dari root proyek. Script tersebut membuat konfigurasi PHP sementara dengan `extension_dir` sesuai lokasi `php.exe` di PATH; ini mengatasi instalasi PHP lokal yang masih menunjuk ke direktori ekstensi lama tanpa mengubah `php.ini` global.

Hosting saat ini mengatur PHP melalui cPanel: `upload_max_filesize=8M`, `post_max_size=32M`, `max_input_time=60`, `max_execution_time=30`, dan `memory_limit=128M`. Pendaftaran OPREC membatasi 8 MB per berkas, 20 MB gabungan berkas, dan 22 MB per request. `max_input_time=60` dapat memutus unggahan besar pada koneksi lambat. File pendaftar tersimpan di disk privat `storage/app/private`, jangan memakai `storage:link` untuk berkas itu.

Frontend dan backend dengan sesi Sanctum harus memakai host yang sama untuk development (`localhost` di kedua sisi, bukan campuran `localhost`/`127.0.0.1`). Produksi harus memakai subdomain dengan parent domain yang sama, HTTPS, `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`, dan `CORS_ALLOWED_ORIGINS` yang sesuai. Jangan memakai wildcard origin bersama cookie.

## Status implementasi

Tersedia: auth email/password dan reset email, Event publik + CRUD admin dasar, OPREC publik + CRUD admin dasar, submit OPREC dengan validasi ulang serta upload privat, lookup hasil privat, dan skema 20 tabel domain. Google OAuth, pendaftaran Event/tim, dashboard/admin UI lengkap, konten landing, dan merchandise masih tahap berikutnya.

Pada 22 September 2026, route API dan PHPUnit berhasil dijalankan dengan PHP Windows 8.4 yang dikonfigurasi memakai path ekstensi yang benar. Tiga migrasi terdeteksi `Ran` di PostgreSQL lokal. Pengiriman email SMTP dan alur cookie/CSRF dari browser tetap perlu diuji sebelum produksi.
