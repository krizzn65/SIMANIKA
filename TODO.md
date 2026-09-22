# 📋 TODO — SIMANIKA Progress Tracker

> **Issue Tracker Lokal & Memori Proyek**
> Last Updated: 22 September 2026
> Referensi: [PRD.md](./PRD.md) | [Architecture.md](./architecture.md)

---

## 📊 Summary

| Metrik | Nilai |
|--------|-------|
| **Total Tasks** | 165 |
| **Selesai** | 6 |
| **Dalam Proses** | 44 |
| **Belum Dikerjakan** | 115 |
| **Blocked** | 0 |
| **Progress** | `█░░░░░░░░░░░░░░░░░░░` **4%** |

### Status Legend

| Emoji | Status | Deskripsi |
|-------|--------|-----------|
| ⬜ | Belum | Belum dikerjakan |
| 🔄 | Proses | Sedang dikerjakan |
| ✅ | Selesai | Sudah selesai & verified |
| ❌ | Blocked | Terhalang / ada masalah |
| ⏭️ | Skipped | Dilewati / tidak relevan |

---

## Sprint 0 — Project Setup & Boilerplate

**Status**: 🔄 Kerangka Laravel dan integrasi frontend disiapkan; instalasi dependency serta verifikasi runtime menunggu lingkungan PHP/PostgreSQL
**Target**: 1-2 hari
**Dependency**: Tidak ada

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| FE-0.1 | Init Next.js (`npx create-next-app@latest`) | ✅ | Next.js 16.3.5, React 19.2.8, App Router |
| FE-0.2 | Install FE dependencies (Tailwind, Axios, Zustand, shadcn, Lucide) | ⬜ | Tailwind, Lucide React, clsx, twMerge |
| FE-0.3 | Setup Tailwind CSS + shadcn/ui config | ⬜ | Konfigurasi CSS variables & tokens |
| FE-0.4 | Setup folder structure frontend | ⬜ | `src/app`, `src/components`, `src/lib`, `src/store` |
| FE-0.5 | Setup Next.js App Router dengan layout & route skeleton | ⬜ | — |
| FE-0.6 | Setup Axios instance + interceptors | ⬜ | — |
| BE-0.1 | Init Laravel 11 (`composer create-project`) | 🔄 | Kerangka Laravel 11 dibuat manual; Composer/vendor belum dapat dijalankan di WSL. |
| BE-0.2 | Install BE packages (Sanctum, CORS) | 🔄 | Dependensi tercantum di composer.json; belum terinstal. |
| BE-0.3 | Setup `.env` (DB connection, CORS origins) | 🔄 | Template `.env.example` siap; nilai lokal/produksi perlu diisi. |
| BE-0.4 | Configure CORS middleware | 🔄 | Origin terdaftar eksplisit dan credentials aktif; uji browser belum tersedia. |
| BE-0.5 | Setup Sanctum config untuk SPA auth | 🔄 | Middleware stateful API dan CSRF FE siap; perlu uji sesi lintas port. |
| BE-0.6 | Setup folder structure backend | 🔄 | Folder, route, model, controller, migration awal dibuat; belum teruji runtime. |
| DB-0.1 | Install PostgreSQL & create database `simanika` | ⬜ | — |
| DB-0.2 | Configure Laravel DB connection | 🔄 | Konfigurasi PostgreSQL di template; koneksi belum diuji. |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | `npm run dev` → Next.js app di `localhost:3000` | ⬜ |
| 2 | `php artisan serve` → Laravel di `localhost:8000` | ⬜ |
| 3 | FE bisa hit BE API (`/api/ping` → ok) | ⬜ |
| 4 | PostgreSQL terkoneksi (`php artisan migrate` sukses) | ⬜ |
| 5 | CORS berfungsi (no error di browser) | ⬜ |

---

## Sprint 1 — Database Schema & Migrations

**Status**: 🔄 Migrasi 20 tabel domain dan tabel infrastruktur ditulis; migrate/rollback belum dijalankan
**Target**: 1-2 hari
**Dependency**: Sprint 0

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| DB-1.1 | Migration `users` (extend default Laravel) | 🔄 | Migrasi dibuat; belum diuji. |
| DB-1.2 | Migration `events` | 🔄 | Migrasi dibuat; belum diuji. |
| DB-1.3 | Migration `event_form_fields` | 🔄 | Migrasi dan model dibuat; belum diuji. |
| DB-1.4 | Migration `event_prizes` | ⬜ | — |
| DB-1.5 | Migration `event_requirements` | ⬜ | — |
| DB-1.6 | Migration `teams` | ⬜ | — |
| DB-1.7 | Migration `team_members` | ⬜ | — |
| DB-1.8 | Migration `event_registrations` | ⬜ | — |
| DB-1.9 | Migration `file_uploads` | ⬜ | — |
| DB-1.10 | Migration `oprecs` | 🔄 | Migrasi dibuat; belum diuji. |
| DB-1.11 | Migration `oprec_divisions` | ⬜ | — |
| DB-1.12 | Migration `oprec_registrations` | 🔄 | Migrasi dibuat; belum diuji. |
| DB-1.13 | Migration `merchandises` | ⬜ | — |
| DB-1.14 | Migration `merchandise_inquiries` | ⬜ | — |
| DB-1.15 | Migration `site_contents` + tabel terkait | ⬜ | struktur, divisi, proker, gallery, testimonials |
| DB-1.16 | Buat semua Eloquent Models + relationships | 🔄 | Model inti auth/Event/OPREC/tim dibuat; model konten dan merchandise menyusul. |
| DB-1.17 | Buat Seeders (admin user, sample content) | 🔄 | Seeder admin berbasis env dan site content kosong; belum diuji. |
| DB-1.18 | Buat Factories untuk testing data | ⬜ | — |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | `php artisan migrate` sukses tanpa error | ⬜ |
| 2 | `php artisan migrate:rollback` sukses | ⬜ |
| 3 | `php artisan db:seed` sukses | ⬜ |
| 4 | 20 tabel domain terbuat di PostgreSQL (di luar tabel infrastruktur Laravel) | ⬜ |
| 5 | Model relationships bisa di-test via `tinker` | ⬜ |

---

## Sprint 2 — Authentication System

**Status**: 🔄 Endpoint auth dan FE terhubung secara kode; sesi, email, serta alur lengkap belum diuji
**Target**: 2-3 hari
**Dependency**: Sprint 1

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-2.1 | Setup Sanctum SPA authentication | 🔄 | Stateful API + cookie/CSRF dikonfigurasi; belum uji runtime. |
| BE-2.2 | `RegisterController` — register + auto-login | 🔄 | Endpoint email/password dibuat; belum uji integrasi. |
| BE-2.3 | `LoginController` — login + session cookie HttpOnly | 🔄 | Endpoint dibuat; belum uji cookie browser. |
| BE-2.4 | `ProfileController` — get/update profile | 🔄 | Profil dasar tersedia; upload foto menyusul. |
| BE-2.5 | `AdminMiddleware` — cek role admin | 🔄 | Guard dibuat; test PHP belum dijalankan. |
| BE-2.6 | Form Requests (Register, Login, UpdateProfile) | 🔄 | Register/Login dibuat; profil masih validasi controller. |
| BE-2.7 | `UserResource` API Resource | 🔄 | Resource dibuat; belum uji respons. |
| BE-2.8 | Route groups di `routes/api.php` | 🔄 | Auth/public/user/admin core terdaftar; endpoint sprint lanjut belum lengkap. |
| FE-2.1 | `authStore` (Zustand, tanpa menyimpan token) | ⬜ | — |
| FE-2.2 | `authService` — API calls | 🔄 | Fetch credentials + service authClient; belum uji browser. |
| FE-2.3 | Axios `withCredentials`, CSRF cookie, handle 401/419 | 🔄 | Implementasi Fetch setara di authClient; 401/419 dibaca, belum uji browser. |
| FE-2.4 | `Login.jsx` page | 🔄 | Form terhubung ke login Laravel; verifikasi browser belum selesai. |
| FE-2.5 | `Register.jsx` page | 🔄 | Form email/password sesuai arahan terbaru; terhubung ke register Laravel. |
| FE-2.6 | `ProtectedRoute` component | ⬜ | — |
| FE-2.7 | `AdminRoute` component | ⬜ | — |
| FE-2.8 | `useAuth` hook | ⬜ | — |
| FE-2.9 | Navbar conditional render (Login vs User dropdown) | 🔄 | Tautan Login/Dashboard mengikuti sesi; dropdown belum dibuat. |
| BE-2.9 | Forgot/reset password berbasis email | 🔄 | Broker password dan URL FE dibuat; SMTP belum dikonfigurasi/diuji. |
| FE-2.10 | Halaman forgot/reset password | 🔄 | Halaman + adapter API tersedia; email end-to-end belum diuji. |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | Register → auto-login → redirect dashboard | ⬜ |
| 2 | Login → session aktif → Navbar berubah | ⬜ |
| 3 | Logout → session dicabut → redirect home | ⬜ |
| 4 | Protected route redirect ke login | ⬜ |
| 5 | Admin route redirect jika bukan admin | ⬜ |
| 6 | API menolak tanpa auth (401) | ⬜ |
| 7 | API menolak non-admin ke `/admin/*` (403) | ⬜ |

---

## Sprint 3 — Landing Page (Home)

**Status**: ⬜ Belum Dimulai
**Target**: 3-5 hari
**Dependency**: Sprint 0 (bisa paralel dengan Sprint 1 & 2)

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-3.1 | `HomeController` — GET `/api/public/home` | ⬜ | — |
| BE-3.2 | Return semua site_content data | ⬜ | — |
| FE-3.1 | `Navbar.jsx` — sticky, responsive, mobile menu | ✅ | Capsule navbar, accessible mobile menu, SVG pixel icons |
| FE-3.2 | `Footer.jsx` — kontak, sosmed, quick links | ⬜ | — |
| FE-3.3 | `HeroSection.jsx` — tagline, CTA, bg animasi | ✅ | Inset hero, CRT visual, split CTA, masked logo marquee, game cursor |
| FE-3.4 | `AboutSection.jsx` | ✅ | Editorial intro, scroll-linked text reveal, organization copy, three focus pillars |
| FE-3.5 | `VisiMisiSection.jsx` | ✅ | Editorial title, animated logo video panel, interactive mission accordion |
| FE-3.6 | `StrukturSection.jsx` — grid pengurus | ⬜ | — |
| FE-3.7 | `DivisiSection.jsx` — card grid | ✅ | Bento 12-col grid (7-5 / 4-4-4), pixel icons, hover-reveal program tags |
| FE-3.8 | `ProkerSection.jsx` | ⬜ | — |
| FE-3.9 | `StatistikSection.jsx` — counter animasi | ⬜ | Intersection Observer |
| FE-3.10 | `UpcomingEventsSection.jsx` — preview cards | ⬜ | — |
| FE-3.11 | `GallerySection.jsx` — grid + lightbox | ⬜ | — |
| FE-3.12 | `TestimonialSection.jsx` — slider | ⬜ | — |
| FE-3.13 | `CTASection.jsx` — ajakan bergabung | ⬜ | — |
| FE-3.14 | Compose semua section di `Home.jsx` | ⬜ | — |
| FE-3.15 | Scroll animations (Framer Motion InView) | ⬜ | — |
| FE-3.16 | Responsive design (mobile, tablet, desktop) | ⬜ | — |
| FE-3.17 | SEO metadata via Next.js Metadata API | ⬜ | — |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | 13 section ter-render dengan konten dari API | ⬜ |
| 2 | Navbar sticky + responsive + hamburger | ⬜ |
| 3 | Scroll animation smooth | ⬜ |
| 4 | Counter statistik animate on scroll | ⬜ |
| 5 | Responsive di 3 breakpoint | ⬜ |
| 6 | Lighthouse Performance ≥ 85 | ⬜ |

---

## Sprint 4 — Event System

**Status**: 🔄 Frontend publik diimplementasikan; integrasi backend dan verifikasi browser menunggu runtime
**Target**: 3-4 hari
**Dependency**: Sprint 1, Sprint 2

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-4.1 | `PublicEventController` — list + detail | 🔄 | Filter, pagination, draft guard disiapkan; belum uji Laravel. |
| BE-4.2 | `EventRegistrationController` — register individu | ⬜ | — |
| BE-4.3 | `EventResource` + `EventCollection` | 🔄 | Resource dan meta pagination dibuat; belum uji kontrak runtime. |
| BE-4.4 | Form Requests event registration | ⬜ | — |
| BE-4.5 | Handle file upload saat registrasi | ⬜ | — |
| BE-4.6 | Admin `EventController` — CRUD event | 🔄 | CRUD dasar dibuat; upload dan form builder belum lengkap. |
| BE-4.7 | Admin create event: nested form fields, prizes | 🔄 | API menerima nested fields/prizes/requirements; belum uji runtime. |
| BE-4.8 | `EventRegistrantController` — list, accept/reject | ⬜ | — |
| BE-4.9 | `ExportController` — export CSV | ⬜ | — |
| FE-4.1 | `EventList.jsx` — grid, filter, search, pagination | 🔄 | Route `/events`: grid, pencarian, filter URL, dialog mobile, pagination, empty/loading/error. Menunggu uji browser dan API nyata. |
| FE-4.2 | `EventCard.jsx` component | 🔄 | Kartu server, poster lazy dengan fallback, kategori, tanggal WIB, tipe peserta, status dan kuota. Menunggu verifikasi visual. |
| FE-4.3 | `EventDetail.jsx` — banner, deskripsi, countdown | 🔄 | Route `/events/[slug]`: poster, deskripsi teks biasa, timeline, syarat, hadiah, countdown per menit. Rich text dan alur registrasi belum dibuat. |
| FE-4.4 | `EventRegister.jsx` — dynamic form | ⬜ | — |
| FE-4.5 | `eventService.js` — API calls | 🔄 | Service GET list/detail siap `/api/public/events`, no-store, timeout, normalisasi data. CRUD/admin belum dibuat; kontrak di `frontend/docs/events.md`. |
| FE-4.6 | Admin: `ManageEvents.jsx` — tabel + CRUD | ⬜ | — |
| FE-4.7 | Admin: `CreateEvent.jsx` — form + form field builder | ⬜ | — |
| FE-4.8 | Admin: `EditEvent.jsx` | ⬜ | — |
| FE-4.9 | Admin: `EventRegistrants.jsx` — tabel, accept/reject | ⬜ | — |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | User bisa browse, filter, search event | ⬜ |
| 2 | User bisa daftar event individu | ⬜ |
| 3 | Admin bisa CRUD event lengkap | ⬜ |
| 4 | Admin bisa accept/reject & export CSV | ⬜ |
| 5 | File upload berfungsi | ⬜ |
| 6 | Countdown timer jalan | ⬜ |

---

## Sprint 5 — Team System (Event Lomba)

**Status**: ⬜ Belum Dimulai
**Target**: 3-4 hari
**Dependency**: Sprint 4

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-5.1 | `TeamService` — business logic | ⬜ | create, join, leave, kick |
| BE-5.2 | `TeamController` (User) — create + generate kode | ⬜ | — |
| BE-5.3 | Kode generation logic (DB transaction) | ⬜ | `lockForUpdate` + increment |
| BE-5.4 | Join team endpoint + validasi | ⬜ | `event_id` + kode, slot, no duplicate |
| BE-5.5 | Leave team endpoint | ⬜ | handle ketua leave |
| BE-5.6 | Kick member endpoint (ketua only) | ⬜ | — |
| BE-5.7 | Auto-update `completion_status` | ⬜ | `review_status` dikelola terpisah |
| BE-5.8 | Admin `TeamManagementController` | ⬜ | — |
| FE-5.1 | Update `EventDetail.jsx` — "Bentuk Tim" button | ⬜ | — |
| FE-5.2 | Modal/page "Bentuk Tim" | ⬜ | — |
| FE-5.3 | Modal "Join Tim" — pilih event + input kode | ⬜ | — |
| FE-5.4 | `MyTeams.jsx` (Dashboard) — list tim | ⬜ | — |
| FE-5.5 | "Kelola Tim" page (ketua) | ⬜ | — |
| FE-5.6 | Copy-to-clipboard kode tim | ⬜ | — |
| FE-5.7 | `teamService.js` — API calls | ⬜ | — |
| FE-5.8 | Admin: `EventTeams.jsx` — tabel tim | ⬜ | — |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | Ketua bentuk tim → kode ter-generate (`PREFIX` + nomor minimum 2 digit) | ⬜ |
| 2 | Kode case-insensitive dan dipasangkan dengan `event_id` saat join | ⬜ |
| 3 | Anggota join via kode → muncul di list | ⬜ |
| 4 | Validasi: 1 user = 1 tim per event | ⬜ |
| 5 | Validasi: tidak bisa join tim penuh | ⬜ |
| 6 | Ketua bisa kick, anggota bisa leave | ⬜ |
| 7 | `completion_status` auto-update tanpa menimpa `review_status` | ⬜ |
| 8 | Roster terkunci setelah accepted atau deadline | ⬜ |
| 9 | Admin bisa lihat & accept/reject tim | ⬜ |
| 10 | Copy kode ke clipboard berfungsi | ⬜ |

---

## Sprint 6 — OPREC System

**Status**: 🔄 Halaman publik dan service tersedia; menunggu integrasi backend dan verifikasi browser
**Target**: 2-3 hari
**Dependency**: Sprint 2

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-6.1 | `PublicOprecController` — periode dan lookup hasil | 🔄 | Payload publik, lookup privat, rate limit database siap; belum uji runtime. |
| BE-6.2 | `OprecRegistrationController` — submit + upload | 🔄 | Validasi schema, transaksi, file privat; belum uji upload/integrasi. |
| BE-6.3 | Admin `OprecController` — CRUD oprec + divisions | 🔄 | Create/update/list dan schema guard dibuat; delete belum ada. |
| BE-6.4 | Admin `OprecRegistrantController` — list, accept/reject | 🔄 | Endpoint review tersedia; belum uji runtime. |
| BE-6.5 | Form Requests oprec registration | ⬜ | — |
| FE-6.1 | `Oprec.jsx` — headline, divisi, pendaftaran/pengumuman, FAQ | 🔄 | Alur revisi pengguna: poster admin, countdown jadwal, state pengumuman, FAQ paling bawah. Menunggu browser dan API nyata. |
| FE-6.2 | Form OPREC dinamis + cek hasil inline | 🔄 | Renderer schema admin, validasi isian/berkas, submit via adapter Next, lookup NIM/tanggal lahir. Persistence Laravel dan auth/login belum tersedia. |
| FE-6.3 | `oprecService.js` — API calls | 🔄 | GET periode dan adapter POST register/result dengan status/schema guard, no-store, timeout dan respons minimal. Kontrak `frontend/docs/oprec.md`. Integrasi backend belum diverifikasi. |
| FE-6.4 | Dashboard section "OPREC Saya" | ⬜ | — |
| FE-6.5 | Admin: `ManageOprec.jsx` — CRUD | ⬜ | — |
| FE-6.6 | Admin: `OprecRegistrants.jsx` — tabel, accept/reject | ⬜ | — |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | Halaman OPREC tampil status + divisi | ⬜ |
| 2 | User bisa daftar OPREC + upload berkas | ⬜ |
| 3 | Status muncul di dashboard | ⬜ |
| 4 | Admin CRUD OPREC berfungsi | ⬜ |
| 5 | Admin accept/reject + export | ⬜ |
| 6 | Validasi: 1 user = 1 pendaftaran per OPREC | ⬜ |

---

## Sprint 7 — merchandise System

**Status**: ⬜ Halaman sementara Coming Soon tersedia; fitur merchandise penuh belum dimulai
**Target**: 1-2 hari
**Dependency**: Sprint 2

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-7.1 | `PublicmerchandiseController` — list merchandises | ⬜ | — |
| BE-7.2 | Submit merchandise inquiry endpoint | ⬜ | — |
| BE-7.3 | Admin `merchandiseController` — CRUD | ⬜ | — |
| BE-7.4 | Admin manage inquiries | ⬜ | — |
| FE-7.1 | `merchandise.jsx` — full page | ⬜ | Route `/merchandise` menampilkan Coming Soon sesuai scope sementara pengguna; halaman penuh belum dikerjakan. |
| FE-7.2 | Form kolaborasi | ⬜ | — |
| FE-7.3 | `merchandiseService.js` | ⬜ | — |
| FE-7.4 | Admin: `Managemerchandise.jsx` — CRUD | ⬜ | — |
| FE-7.5 | Admin: Manage inquiries | ⬜ | — |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | merchandise page menampilkan data | ⬜ |
| 2 | Form kolaborasi submit berhasil | ⬜ |
| 3 | Admin CRUD merchandise (+ logo upload) | ⬜ |
| 4 | Admin kelola inquiries | ⬜ |

---

## Sprint 8 — Admin Dashboard & CMS

**Status**: ⬜ Belum Dimulai
**Target**: 2-3 hari
**Dependency**: Sprint 4, 5, 6, 7

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-8.1 | `AdminDashboardController` — aggregate stats | ⬜ | — |
| BE-8.2 | `ContentController` — get/update site content | ⬜ | — |
| BE-8.3 | Dashboard: grafik tren pendaftar per bulan | ⬜ | — |
| FE-8.1 | `AdminDashboard.jsx` — stat cards, grafik | ⬜ | — |
| FE-8.2 | `AdminSidebar.jsx` — navigasi admin | ⬜ | — |
| FE-8.3 | Admin layout wrapper (sidebar + content) | ⬜ | — |
| FE-8.4 | `ManageContent.jsx` — CMS form | ⬜ | — |
| FE-8.5 | CRUD struktur organisasi | ⬜ | — |
| FE-8.6 | CRUD divisi, proker, gallery, testimonials | ⬜ | — |
| FE-8.7 | Polish admin pages (loading, errors, dialogs) | ⬜ | — |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | Dashboard statistik akurat | ⬜ |
| 2 | Grafik tren ter-render | ⬜ |
| 3 | CMS edit konten Home berfungsi | ⬜ |
| 4 | Perubahan CMS langsung terrefleksi di landing | ⬜ |
| 5 | Sidebar navigasi berfungsi | ⬜ |

---

## Sprint 9 — User Dashboard

**Status**: ⬜ Belum Dimulai
**Target**: 2-3 hari
**Dependency**: Sprint 4, 5, 6

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-9.1 | `DashboardController` — aggregate user data | ⬜ | — |
| BE-9.2 | User notifications endpoint (opsional) | ⬜ | — |
| FE-9.1 | `Dashboard.jsx` — overview cards | ⬜ | — |
| FE-9.2 | Section "Event Saya" — list + status | ⬜ | — |
| FE-9.3 | Section "Tim Saya" — list + Bentuk/Join | ⬜ | — |
| FE-9.4 | Section "OPREC Saya" — status | ⬜ | — |
| FE-9.5 | `Profile.jsx` — edit + foto + password | ⬜ | — |
| FE-9.6 | Responsive dashboard | ⬜ | — |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | Dashboard overview ringkasan user | ⬜ |
| 2 | Semua status pendaftaran visible | ⬜ |
| 3 | Tim Saya berfungsi (Bentuk/Join/Kelola) | ⬜ |
| 4 | Profil updateable + foto upload | ⬜ |
| 5 | Responsive di mobile | ⬜ |

---

## Sprint 10 — Polish, Testing & Deployment

**Status**: ⬜ Belum Dimulai
**Target**: 3-5 hari
**Dependency**: Semua sprint sebelumnya

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| QA-10.1 | E2E testing semua user flows | ⬜ | — |
| QA-10.2 | Responsive test multi device/browser | ⬜ | — |
| QA-10.3 | Edge cases (validation, errors, empty states) | ⬜ | — |
| QA-10.4 | Concurrent team join (race condition) | ⬜ | — |
| QA-10.5 | Security testing (SQLi, XSS, CSRF) | ⬜ | — |
| PL-10.1 | Loading skeleton semua page | ⬜ | — |
| PL-10.2 | Error boundary & 404 page | ⬜ | — |
| PL-10.3 | Empty state illustrations | ⬜ | — |
| PL-10.4 | Toast notifications semua aksi | ⬜ | — |
| PL-10.5 | Konfirmasi dialog destructive actions | ⬜ | — |
| PL-10.6 | Optimisasi gambar (lazy load, WebP) | ⬜ | — |
| PL-10.7 | Accessibility audit | ⬜ | — |
| SEO-10.1 | Meta tags semua page | ⬜ | — |
| SEO-10.2 | sitemap.xml & robots.txt | ⬜ | — |
| SEO-10.3 | Structured data / JSON-LD (opsional) | ⬜ | — |
| DEP-10.1 | Setup env variables production | ⬜ | — |
| DEP-10.2 | Build frontend (`npm run build`) | ⬜ | — |
| DEP-10.3 | Deploy FE ke Vercel/Netlify | ⬜ | — |
| DEP-10.4 | Setup VPS/Railway untuk Laravel | ⬜ | — |
| DEP-10.5 | Setup PostgreSQL production | ⬜ | — |
| DEP-10.6 | Configure Laravel production | ⬜ | — |
| DEP-10.7 | Setup domain & SSL | ⬜ | — |
| DEP-10.8 | Setup CI/CD pipeline (opsional) | ⬜ | — |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | Semua user flows berjalan tanpa error | ⬜ |
| 2 | Responsive di Chrome, Firefox, Safari | ⬜ |
| 3 | Lighthouse: Perf ≥ 85, A11y ≥ 90, SEO ≥ 90 | ⬜ |
| 4 | Backend production stabil | ⬜ |
| 5 | Frontend ter-deploy via domain | ⬜ |
| 6 | HTTPS aktif | ⬜ |

---

## 📝 Changelog

Log perubahan signifikan selama pengembangan.

| Tanggal | Sprint | Perubahan | Oleh |
|---------|--------|-----------|------|
| 2026-09-21 | Sprint 7 | Tambah route `/merchandise` Coming Soon sesuai permintaan, metadata, navigasi Home/Event, navbar dan footer parallax bersama. Tanpa dependency atau animasi tambahan. | AI |
| 2026-09-22 | Sprint 0/1/2/4/6 | Siapkan kerangka Laravel 11, migrasi domain, Sanctum, auth/reset email, API Event/OPREC, adapter login/register FE. Verifikasi runtime menunggu PHP/Composer/PostgreSQL. | AI |
| 2026-09-21 | Sprint 6 | Rombak OPREC sesuai arahan: headline → divisi → poster + countdown/form/pengumuman → FAQ. Form schema admin dan lookup NIM/tanggal lahir, adapter API Next. 39 pemeriksaan logika V8 lulus; runtime build/browser WSL masih terhalang. | AI |
| 2026-09-21 | Sprint 6 | Halaman OPREC publik siap data admin, status berbasis jadwal, divisi, timeline, persyaratan, benefit dan FAQ. 18 pemeriksaan logika V8 lulus; build/browser terhalang runtime WSL 1. | AI |
| 2026-09-21 | Sprint 4 | Implementasi frontend daftar/detail event dinamis, service API, kontrak admin, filter dan pagination. 13 pemeriksaan logika V8 lulus; build/browser belum terverifikasi karena Node Windows tidak berjalan pada WSL 1. | AI |
| 2026-09-12 | — | PRD v1.0 selesai | AI |
| 2026-09-12 | — | Architecture v1.0 selesai | AI |
| 2026-09-12 | — | TODO tracker dibuat | AI |
| 2026-09-13 | — | Update seluruh dokumentasi arsitektur, workflow, skill prompt, dan TODO: migrasi frontend ke Next.js (App Router) | AI |
| 2026-09-13 | — | Sinkronisasi PRD, arsitektur, dan TODO: Laravel/PostgreSQL/Sanctum cookie, route `/events`, model status tim, serta koreksi statistik backlog | AI |
| 2026-09-13 | — | Menambahkan `DESIGN.md` sebagai sumber kebenaran visual: bold editorial neo-brutalism dengan palet biru royal dan kuning hangat | AI |
| 2026-09-13 | Sprint 0/3 | Inisialisasi Next.js dan implementasi Hero Section + Navbar responsif sesuai `DESIGN.md`; lint dan production build lulus | AI |
| 2026-09-13 | Sprint 3 | Refactor Hero + Navbar ke konsep Bold Editorial Liquid Glass; adaptasi pola Liquid Glass Card dan Glassmorphism Navigation dari 21st.dev | AI |

---

## 🐛 Known Issues

Daftar bug / masalah yang ditemukan selama pengembangan.

| # | Sprint | Issue | Severity | Status | Resolusi |
|---|--------|-------|----------|--------|----------|
| 1 | Sprint 4 | Build dan pengujian browser belum dapat dijalankan: runtime npm/Node mengembalikan WSL 1 unsupported | Medium | Terbuka | Jalankan build dan smoke test pada Node Linux/WSL 2 atau terminal Windows yang berfungsi |

---

## 💡 Decision Log

Keputusan arsitektur / desain penting yang diambil selama pengembangan.

| Tanggal | Keputusan | Alasan | Impact |
|---------|-----------|--------|--------|
| 2026-09-13 | Tech stack frontend: Next.js (App Router) | Permintaan user, performa SSR/SSG & SEO bawaan yang lebih optimal | Fundamental |
| 2026-09-12 | Tech stack backend & DB: Laravel + PostgreSQL | Permintaan user | Fundamental |
| 2026-09-12 | Auth: Laravel Sanctum (bukan Firebase) | Selaras dengan Laravel backend | Sprint 2 |
| 2026-09-12 | Team kode: Prefix custom + 2-digit auto-increment | UX mudah diingat & dibagikan | Sprint 5 |
| 2026-09-12 | User pages: Navbar layout (bukan sidebar) | User experience konsisten dengan landing page | Sprint 9 |
| 2026-09-12 | Admin pages: Sidebar layout | Navigasi admin perlu lebih banyak menu | Sprint 8 |
| 2026-09-12 | DB: PostgreSQL (bukan Firestore) | Relational, ACID, permintaan user | Sprint 1 |
| 2026-09-13 | Visual: Bold Editorial Liquid Glass (70/30) | Memadukan identitas biru–kuning dengan material iPhone-style glass tanpa menghilangkan hierarki editorial | Landing page dan komponen interaktif |

---

> [!IMPORTANT]
> **Cara Update File Ini:**
> 1. Ganti status emoji di kolom **Status** sesuai progress
> 2. Isi kolom **Catatan** jika ada info tambahan
> 3. Update **Summary** di bagian atas (total selesai, progress bar)
> 4. Tambah entry di **Changelog** untuk perubahan besar
> 5. Tambah entry di **Known Issues** saat menemukan bug
> 6. Tambah entry di **Decision Log** saat ada keputusan penting
>
> Progress bar update: Setiap 5 task selesai, update progress bar (`█` per ~5 task).
> Contoh 10/165 selesai: `██░░░░░░░░░░░░░░░░░░` **6%**
