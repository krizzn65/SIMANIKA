# Backend SIMANIKA

Backend memakai Laravel 11, Sanctum cookie, PostgreSQL 15+, dan PHP 8.2+. Lihat `PRD.md`, `architecture.md`, `frontend/docs/events.md`, `frontend/docs/oprec.md`, dan `frontend/docs/password-recovery.md` di root proyek untuk kontrak lengkap.

## Menjalankan lokal

1. Pasang PHP 8.2+ dengan ekstensi `pgsql`, `pdo_pgsql`, `pdo_sqlite` (untuk test), `mbstring`, `openssl`, `fileinfo`, `xml`, dan Composer 2. PostgreSQL harus tersedia.
2. Di folder `backend`, jalankan `composer install`, salin `.env.example` ke `.env`, isi kredensial database, lalu `php artisan key:generate`.
3. Buat database PostgreSQL `simanika`, jalankan `php artisan migrate`, lalu `php artisan serve --host=localhost --port=8000`.
4. Salin `frontend/.env.example` ke `frontend/.env.local` dan jalankan Next.js. Buka `http://localhost:8000/api/ping` untuk memeriksa API.
5. Untuk reset sandi sungguhan, set `MAIL_MAILER=smtp`, host, port, kredensial, dan `FRONTEND_URL`. Nilai `MAIL_MAILER=log` hanya menulis pesan email ke log lokal. Admin awal dapat dibuat dengan `ADMIN_EMAIL`, `ADMIN_PASSWORD` (minimal 12 karakter), lalu `php artisan db:seed`.

Atur PHP `upload_max_filesize=10M` dan `post_max_size=12M` untuk berkas OPREC. File pendaftar tersimpan di disk privat `storage/app/private`, jangan memakai `storage:link` untuk berkas itu.

Frontend dan backend dengan sesi Sanctum harus memakai host yang sama untuk development (`localhost` di kedua sisi, bukan campuran `localhost`/`127.0.0.1`). Produksi harus memakai subdomain dengan parent domain yang sama, HTTPS, `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`, dan `CORS_ALLOWED_ORIGINS` yang sesuai. Jangan memakai wildcard origin bersama cookie.

## Status implementasi

Tersedia: auth email/password dan reset email, Event publik + CRUD admin dasar, OPREC publik + CRUD admin dasar, submit OPREC dengan validasi ulang serta upload privat, lookup hasil privat, dan skema 20 tabel domain. Google OAuth, pendaftaran Event/tim, dashboard/admin UI lengkap, konten landing, dan merchandise masih tahap berikutnya.

Kerangka ini belum bisa diuji di lingkungan kerja WSL saat ini karena PHP Linux dan Composer yang dapat dijalankan tidak tersedia. Jalankan `composer install`, `php artisan migrate`, `php artisan route:list`, dan `php artisan test` di lingkungan PHP yang berfungsi sebelum menghubungkan data produksi.
