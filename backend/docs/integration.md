# Integrasi Next.js ↔ Laravel

## Konfigurasi lokal

Backend: `APP_URL=http://localhost:8000`, `FRONTEND_URL=http://localhost:3000`, `SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:8000`, `CORS_ALLOWED_ORIGINS=http://localhost:3000`. Frontend: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api` dan `API_BASE_URL=http://localhost:8000/api`.

Gunakan host `localhost` secara konsisten. Browser mengirim cookie sesi langsung ke Laravel melalui Axios `withCredentials`; `authClient.js` lebih dulu meminta `/sanctum/csrf-cookie`, lalu Axios mengirim `X-XSRF-TOKEN` untuk mutasi. Zustand menyimpan identitas pengguna di memori, tanpa token di localStorage. Form auth memakai React Hook Form + Zod; Laravel tetap memvalidasi input melalui FormRequest. Adapter server Next.js untuk OPREC meneruskan cookie sesi dan CSRF; adapter reset sandi tidak memerlukan sesi.

## Kontrak yang tersedia

| Frontend | Backend | Catatan |
| --- | --- | --- |
| `/login`, `/register`, Navbar, `/dashboard` | `/api/auth/register`, `/login`, `/logout`, `/me` | Email/password; sesi Sanctum. |
| Tombol Google di `/login` & `/register`, `/auth/callback` | `/api/auth/google/redirect`, `/api/auth/google/callback` | Google OAuth 2.0 via `laravel/socialite`, tautkan `google_id` dan login sesi Sanctum. |
| `/forgot-password`, `/reset-password` | `/api/auth/forgot-password`, `/reset-password` | Email reset memakai broker Laravel; backend mengirim tautan ke halaman Next.js. SMTP harus diisi. |
| `/events`, `/events/[slug]` | `/api/public/events`, `/api/public/events/{slug}` | Hanya event non-draft, maksimal 9 per halaman; kontrak menyertakan `paymentType` dan nominal integer `htm`. |
| Dialog pendaftaran competition tim | `/api/user/events/{event}/create-team`, `/join-team` | Transaksi autentikasi; buat tim menghasilkan kode, join membuat permintaan pending, keduanya mencatat enrolment dashboard. Ketua menerima/menolak di workspace; hanya anggota accepted dihitung. |
| `/dashboard/events/{id}` | `/api/user/events/{event}/workspace`, `/teams/{team}/members/{userId}`, `/files/{field}` | Detail pendaftaran privat, formulir tim milik ketua, approval/remove ketua-only, berkas hanya untuk anggota aktif. |
| Editor grup `/admin/events/{id}` | `PUT /api/admin/events/{event}/form` (`form_groups`) | Maksimal 20 grup/40 kolom; `scope=personal|team`, `edit_role=leader|all`; terkunci sesudah pendaftar. |
| Grup dashboard peserta | `GET /api/user/events/{event}/workspace`, `POST /api/user/events/{event}/groups/{group}/submit`, `GET /api/user/events/{event}/groups/{group}/files/{field}` | Jawaban personal per user, jawaban tim per tim. Hanya anggota accepted dapat mengakses grup tim; izin edit dan unduh dicek di server. |

Aturan kode tim terbaru (menggantikan nomor urut per-event pada PRD lama): `team_code_sequences.prefix` menyimpan counter global per prefix secara permanen; `team_code_reservations.code` mencegah kode baru diulang. Prefix hanya eksklusif selama dipakai event yang masih ada: pembuatan/pembaruan admin mengunci baris sequence lalu mengecek event aktif dalam satu transaksi. Setelah event tanpa peserta dihapus, prefix dan nama/slug boleh digunakan lagi; counter/kode lama tetap dicadangkan. Migrasi membackfill kode/prefix lama tanpa mengganti kode yang sudah dibagikan. Pengaturan tim tidak dapat diubah sesudah ada peserta. Generator mengunci event lalu baris sequence, mencadangkan kode, dan membuat tim dalam satu transaksi. Kode tetap dicari dalam event yang dipilih saat join. Data historis dengan dua `HACK01` perlu remediasi eksplisit bila ingin sepenuhnya unik secara global; keduanya tidak diubah otomatis.
| `/oprec`, `/oprec/detail` | `/api/public/oprec` | Payload jadwal, divisi, schema form, poster, FAQ, dan publikasi pengumuman. |
| Form OPREC | `/api/user/oprec/register` | Next adapter `/api/oprec/register`, cookie Sanctum, validasi backend, berkas privat. |
| Cek hasil OPREC | `/api/public/oprec/{id}/result` | Next adapter `/api/oprec/result`; NIM/tanggal lahir dikirim lewat POST, tidak di URL. |
| Pengelolaan admin (UI belum dibuat) | `/api/admin/events`, `/api/admin/oprec`, review pendaftar | Semua route memakai `auth:sanctum` + role admin. |

## Batas tahap ini

Timeline bertipe pada `POST/PUT /api/admin/events` memakai `timeline: [{ type, batch, judul, tanggal }]`; `tanggal` berformat `YYYY-MM-DD`, tanpa jam. Jenis: `registration_open`, `registration_close`, `technical_meeting`, `proposal`, `preliminary`, `finalists`, `grand_final`, `awarding`, `custom`. Dua jenis pendaftaran wajib berpasangan per batch berurutan mulai 1; batch tidak boleh bertumpuk. Server mengurutkan berdasarkan tanggal dan menurunkan ulang empat tanggal event dari timeline, sehingga klien tidak dapat menimpa jadwal pendaftaran. Pendaftaran berlaku sejak awal tanggal buka hingga akhir tanggal tutup batch terakhir dalam zona Asia/Jakarta. Jam lama pada data timeline diabaikan. Data event lama tanpa tipe tetap memakai tanggal warisan.

Skema database mengikuti domain PRD. Pendaftaran event individu, pembuatan/join tim, serta agregat dashboard user sudah tersedia dan dilindungi `auth:sanctum`; merchandise dan CMS Home masih di luar implementasi tahap ini. Event publik tetap hanya membaca data terpublikasi. Halaman merchandise tetap Coming Soon sesuai arahan terbaru.

Verifikasi 22 September 2026: lockfile Composer menargetkan PHP 8.2 dan valid, 24 route API terdaftar, PHPUnit 8 test/32 assertion lulus di SQLite memori, tiga migrasi tercatat `Ran` di PostgreSQL lokal, dan HTTP `/api/ping` memberi 200 dengan origin serta credentials CORS yang sesuai. Build frontend webpack dan pemeriksaan TypeScript juga lulus di Node Linux sementara. Masih perlu uji cookie/CSRF dari browser, rollback migrasi di database testing, pasang SMTP, uji upload PDF/gambar di batas ukuran, dan uji dua submit OPREC serentak. Konfigurasi host produksi harus memakai domain induk yang sama untuk cookie Sanctum atau perlu arsitektur proxy sesi terpisah.
