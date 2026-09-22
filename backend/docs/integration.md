# Integrasi Next.js ↔ Laravel

## Konfigurasi lokal

Backend: `APP_URL=http://localhost:8000`, `FRONTEND_URL=http://localhost:3000`, `SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:8000`, `CORS_ALLOWED_ORIGINS=http://localhost:3000`. Frontend: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api` dan `API_BASE_URL=http://localhost:8000/api`.

Gunakan host `localhost` secara konsisten. Browser mengirim cookie sesi langsung ke Laravel dengan `credentials: include`; `authClient.js` lebih dulu meminta `/sanctum/csrf-cookie`, lalu mengirim `X-XSRF-TOKEN` untuk mutasi. Token tidak disimpan di localStorage. Adapter server Next.js untuk OPREC meneruskan cookie sesi dan CSRF; adapter reset sandi tidak memerlukan sesi.

## Kontrak yang tersedia

| Frontend | Backend | Catatan |
| --- | --- | --- |
| `/login`, `/register`, Navbar, `/dashboard` | `/api/auth/register`, `/login`, `/logout`, `/me` | Email/password; sesi Sanctum. Google OAuth belum ada. |
| `/forgot-password`, `/reset-password` | `/api/auth/forgot-password`, `/reset-password` | Email reset memakai broker Laravel; backend mengirim tautan ke halaman Next.js. SMTP harus diisi. |
| `/events`, `/events/[slug]` | `/api/public/events`, `/api/public/events/{slug}` | Hanya event non-draft, maksimal 9 per halaman, meta total, kuota dihitung server. |
| `/oprec`, `/oprec/detail` | `/api/public/oprec` | Payload jadwal, divisi, schema form, poster, FAQ, dan publikasi pengumuman. |
| Form OPREC | `/api/user/oprec/register` | Next adapter `/api/oprec/register`, cookie Sanctum, validasi backend, berkas privat. |
| Cek hasil OPREC | `/api/public/oprec/{id}/result` | Next adapter `/api/oprec/result`; NIM/tanggal lahir dikirim lewat POST, tidak di URL. |
| Pengelolaan admin (UI belum dibuat) | `/api/admin/events`, `/api/admin/oprec`, review pendaftar | Semua route memakai `auth:sanctum` + role admin. |

## Batas tahap ini

Skema database mengikuti 20 tabel domain PRD, tetapi route untuk pendaftaran Event individu/tim, merchandise, CMS Home, dan dashboard agregat belum dibuat. Event publik tetap hanya baca data; `registrationUrl` kosong sampai alur pendaftaran nyata tersedia. Halaman merchandise tetap Coming Soon sesuai arahan terbaru. Dashboard frontend saat ini hanya memverifikasi sesi dan memberi navigasi dasar.

Sebelum produksi: jalankan migration/rollback dan PHPUnit di lingkungan PHP/PostgreSQL, uji cookie/CSRF dari browser, pasang SMTP, uji upload PDF/gambar di batas ukuran, dan uji dua submit OPREC serentak. Konfigurasi host produksi harus memakai domain induk yang sama untuk cookie Sanctum atau perlu arsitektur proxy sesi terpisah.
