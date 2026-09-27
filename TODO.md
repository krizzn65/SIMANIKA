# 📋 TODO — SIMANIKA Progress Tracker

> **Issue Tracker Lokal & Memori Proyek**
> Last Updated: 25 September 2026
> Referensi: [PRD.md](./PRD.md) | [Architecture.md](./architecture.md)

## Aturan NIM OPREC (27 September 2026)

- [x] NIM pendaftaran OPREC wajib diawali `E31`; browser, adapter Next, dan Laravel menormalisasi input ke huruf kapital sebelum validasi/penyimpanan. Peringatan inline hanya muncul jika awalan menyimpang dari `E31` (tidak pada input kosong/`E`/`E3`/`E31`), dan kiriman invalid ditolak dengan 422.
- [ ] Uji manual tampilan input dan pembaca layar di browser dengan sesi peserta nyata.

## Tabel pendaftar OPREC dinamis (27 September 2026)

- [x] Tabel admin menampilkan kolom tetap Nama, NIM, Tanggal lahir, Angkatan, dan Pilihan divisi; semua field tambahan dari skema admin menjadi kolom berurutan, termasuk pertanyaan khusus divisi. Peserta di luar sasaran ditandai "Tidak berlaku", berkas memakai tautan unduh privat.
- [x] Filter pencarian/divisi dan paginasi diproses di server untuk seluruh pendaftar, bukan hanya 20 baris pertama. Respons lama diabaikan saat periode/filter berubah; fallback URL unduh yang tidak valid dihapus.
- [x] Build produksi Next.js serta tes helper tabel dan endpoint OPREC lulus.
- [ ] Uji visual dan unduh berkas memakai sesi admin nyata di browser, termasuk tabel dengan banyak kolom pada layar mobile.

## Tipe input Link OPREC (27 September 2026)

- [x] Builder OPREC menyediakan tipe input `Link`; pratinjau dan formulir peserta memakai kontrol URL dengan autofill URL.
- [x] Validasi browser dan Laravel hanya menerima URL HTTP/HTTPS yang valid. Skema server juga menolak tipe field yang tidak dikenal sebelum menyimpan jawaban.

## Footer sidebar admin desktop (27 September 2026)

- [x] Footer sidebar desktop tidak lagi membaca state drawer mobile. Avatar dan tombol keluar kembali terpusat sebagai ikon ketika sidebar ringkas; label hanya tampil ketika sidebar desktop di-hover/terbuka.

## Floating navigation editor OPREC (27 September 2026)

- [x] Rail navigasi cepat editor OPREC kembali berada di sisi kiri editor. Posisi mengikuti batas sidebar yang terlihat melalui `ResizeObserver`, tanpa membaca konteks sidebar dari luar provider; ini juga memperbaiki runtime error pada halaman edit OPREC.

## Status kartu dashboard OPREC (27 September 2026)

- [x] Badge status seperti “Menunggu proses” dihapus dari kartu Open Recruitment pada dashboard peserta. Kartu event tetap menampilkan badge statusnya.

## Audit kesesuaian `architecture.md` (22 September 2026)

### Perbaikan Bug Hover Sidebar Admin & Pemisahan Mobile Drawer (27 September 2026)

- [x] **Akar Masalah Bug Hover Sidebar Admin**:
  - `DesktopSidebar` dan `MobileSidebar` sebelumnya berbagi state `open` yang sama di `SidebarContext`.
  - Portal `createPortal(..., document.body)` pada `MobileSidebar` me-render backdrop overlay (`fixed inset-0 z-[9990]`) dan drawer kanan tanpa class `md:hidden`.
  - Akibatnya, saat kursor mouse di desktop menyentuh sidebar (`onMouseEnter` -> `setOpen(true)`), portal langsung merender backdrop overlay di `document.body` yang menutupi seluruh layar desktop (termasuk Desktop Sidebar di z-30). Kursor mouse seketika terhalang oleh overlay, memicu `onMouseLeave` -> `setOpen(false)`. Siklus instan ini menyebabkan sidebar desktop tampak tidak mau keluar saat di-hover ("di hover g mau keluar").
- [x] **Pemisahan State & Isolasi Drawer Mobile**:
  - Memisahkan state `open` (desktop hover) dan `mobileOpen` (mobile drawer) pada `SidebarContextProps` dan `SidebarProvider` di `frontend/src/components/ui/sidebar.tsx`.
  - Memasang class `md:hidden` pada wrapper, backdrop overlay, dan mobile drawer di dalam `createPortal` agar mustahil muncul atau mengganggu layar desktop.
  - Memberikan context override di dalam drawer mobile (`open: true, animate: false`) sehingga seluruh teks (logo teks, profile teks, logout teks, label menu) otomatis tampil penuh saat drawer mobile dibuka tanpa bug teks tersembunyi.
- [x] **Refactoring AdminLayout & Pembersihan Dead Code**:
  - Mengekstrak navigasi sidebar ke sub-komponen `AdminSidebarNav` yang membaca `useSidebar()`, menghilangkan re-render seluruh halaman `AdminLayout` saat mouse hover desktop.
  - Menghapus unused import `cn` dan state `open` yang berlebih di `frontend/src/app/admin/layout.jsx`.
  - Otomatis menutup mobile drawer saat item navigasi (`SidebarLink`) diklik.
- [x] **Verifikasi Kualitas**:
  - Build produksi Next.js (`npm run build`, 26 rute) lulus 100% tanpa error TypeScript/lint.
  - Seluruh 40 tes backend Laravel (307 assertions) lulus 100%.

- [x] **Target Penerima Pertanyaan Kustom (Admin Form Builder)**:
  - Pada setiap kartu editor pertanyaan kustom (No 06 dst), admin dapat memilih target pertanyaan:
    - **Semua Divisi** (`all`): pertanyaan berlaku umum bagi semua pendaftar.
    - **Divisi Tertentu** (`specific`): pertanyaan hanya ditujukan bagi pendaftar yang memilih satu atau beberapa divisi sasaran (misal: "Wajib sertakan portofolio" untuk Kominfo).
  - Kontrol antarmuka Neo-Arcade boxy: segmented control "Semua Divisi" vs "Divisi Tertentu", checklist chip divisi aktif dengan kotak centang taktil, serta badge status di header kartu pertanyaan (`SEMUA DIVISI` atau `KHUSUS: [NAMA DIVISI]`).
  - Validasi builder: jika admin memilih "Divisi Tertentu", wajib mencentang minimal 1 divisi sasaran sebelum formulir dapat disimpan.
  - Skema database JSONB backward-compatible: `form_fields` menyimpan `target_type` dan `target_divisions` tanpa memerlukan migrasi tabel baru.
- [x] **Dinamis pada Formulir Pendaftaran Peserta (`OprecForm.jsx`) & Live Preview**:
  - Pertanyaan khusus divisi hanya dimunculkan jika peserta memilih divisi tersebut di salah satu dari 3 pilihan prioritasnya (Pilihan 1, 2, atau 3).
  - Jika peserta tidak memilih divisi sasaran, pertanyaan otomatis disembunyikan dan dilewati dari validasi `required` di sisi frontend (`lib/oprec.js`) maupun server backend (`OprecRegistrationController.php`).
  - Label pertanyaan kondisional dilengkapi badge penanda visual `Khusus: [Nama Divisi]`.
  - Tata letak 2 kolom sejajar (kiri - kanan): pertanyaan tambahan (termasuk upload berkas `file`, link/teks, dan select) mengalir berdampingan dalam grid 2-kolom tanpa dipaksa melebar `1 / -1`.
  - Live Preview builder di admin bereaksi instan saat admin memilih/mengubah simulasi pilihan divisi.
- [x] **Verifikasi & Uji Kualitas**:
  - 10 tes unit frontend Node.js (`tests/oprec.test.mjs`) lulus 100%, mencakup skenario field kondisional yang dilewati vs wajib diisi saat divisi sasaran dipilih.
  - 7 tes integrasi submission frontend (`tests/oprec-submission.test.mjs`) lulus 100%, dengan integrasi parameter `divisiTersedia` pada `validateOprecForm` di route adapter.
  - 41 tes backend PHPUnit (322 assertions) lulus 100%.
  - Build produksi Next.js (`npm run build`, 26 rute) lulus dengan 0 warning/error.
  - Zero dead code / unused code terverifikasi bersih di seluruh stack.

### Rombak Total Kuota Menjadi Sistem Jabatan Divisi (Admin-First) & Zero Dead Code (27 September 2026)

- [x] **Pembersihan Total Kuota OPREC (Zero Dead Code)**:
  - Migrasi Laravel `2026_09_27_000001_replace_kuota_with_jabatan_in_oprec_divisions.php` berhasil dijalankan (`dropColumn('kuota')` dan penambahan kolom `jsonb('jabatan')` pada tabel `oprec_divisions`).
  - Pembersihan total referensi `kuota` di Model (`OprecDivision.php`), Request (`SaveOprecRequest.php`), Admin Controller (`OprecController.php`), Resources (`OprecResource.php`), User Workspace Controller (`OprecWorkspaceController.php`), dan User Registration Controller (`OprecRegistrationController.php`).
  - Pembersihan total sisa logika dan teks `kuota` di frontend (`OprecBuilder.jsx`, `OprecCreateDialog.jsx`, `OprecDetailModal.jsx`, `Oprec.jsx`, `page.jsx`, `lib/oprec.js`, `divisionPreview.js`, dan CSS).
  - Pemeriksaan `grep_search` memastikan 0 hasil `kuota` di seluruh domain OPREC frontend & backend.
- [x] **Sistem Jabatan Divisi (Admin-First)**:
  - Default BPH: otomatis memiliki 3 posisi pimpinan (`"Wakil Ketua Umum"`, `"Sekretaris 2"`, `"Bendahara 2"`).
  - Default Divisi lainnya: otomatis berstatus `"Staff Divisi " + namaDivisi` (misal `"Staff Divisi Humas"`, `"Staff Divisi Kominfo"`).
  - Sinkronisasi dinamis: saat admin mengubah nama divisi, jika jabatannya masih berstatus default, teks jabatan otomatis ikut menyesuaikan nama divisi baru.
  - Subkomponen Neo-Arcade Jabatan Manager di Tab 2 `OprecBuilder.jsx`:
    - List chip interaktif dengan tombol hapus `(×)`.
    - Input tambah jabatan baru dengan dukungan tombol keyboard `Enter` dan tombol klik `+ Tambah`.
    - Tombol `↺ Reset Default` untuk mengembalikan susunan jabatan ke standar sistem.
    - Validasi minimal 1 jabatan pada setiap divisi.
  - Pembaruan live preview kartu divisi (Mode 1 & Mode 2) untuk menampilkan badge jabatan / jumlah jabatan aktif.
- [x] **Pembersihan Teks Jumlah Jabatan Dibuka (User & Admin)**:
  - Menghapus badge/keterangan jumlah jabatan ("X Jabatan", "1 Jabatan", "X Jabatan dibuka") dari seluruh antarmuka sisi user dan admin sesuai permintaan pengguna.
  - Pada Admin OprecBuilder: badge chip ringkasan divisi (`.oprec-builder__chip-badge`) dan badge live preview dihapus; menyisakan nama divisi murni tanpa distraksi kuantitas jabatan.
  - Pada Admin Overview (`page.jsx`): menghapus teks suffix `· ${division.jabatan.length} JABATAN`.
  - Pada Sisi User (`Oprec.jsx` & `OprecDetailModal.jsx`): menghapus badge count jabatan (`.oprec-division__quota`, `.oprec-modal-div-quota`).
  - Pembersihan dead code CSS (`.oprec-builder__chip-badge`, `.oprec-division__quota`, `.oprec-modal-div-quota`, `.oprec-user-preview__div-positions`).
- [x] **3 Dropdown Horizontal Jabatan Divisi Dinamis (User & Live Preview Admin)**:
  - Menyediakan 3 slot dropdown jabatan berjejer horizontal tepat di bawah grid pilihan divisi dan toolbar reset.
  - State Blocked / Terkunci (Divisi belum dipilih): berlatar abu-abu muted (`#f1f5f9`), border dashed tipis, kursor blok `not-allowed`, dengan placeholder informatif dan badge status "Terkunci".
  - State Active / Terbuka Dinamis (Saat divisi dipilih sesuai prioritas #1, #2, #3):
    - Slot otomatis aktif dengan border kontras biru, kursor pointer, dan badge nama divisi terkait.
    - Menampilkan opsi jabatan sesuai pengaturan divisi di admin.
    - Untuk divisi dengan banyak opsi (misal BPH): menampilkan dropdown pilihan lengkap (Wakil Ketua Umum, Sekretaris 2, Bendahara 2) dengan prompt pemilihan.
    - Untuk divisi dengan 1 opsi tunggal (misal PSDM, Humas, Kominfo): dropdown otomatis terisi langsung dengan jabatan tunggal tersebut ("Staff Divisi ...").
    - Saat tombol "Reset Pilihan" ditekan, ketiga dropdown otomatis dikosongkan dan kembali ke status terkunci abu-abu / not-allowed.
  - Live Preview Builder Admin: terintegrasi penuh secara reaktif dengan pilihan divisi simulasi admin di panel pratinjau.
  - Backend & Validasi: controller pendaftaran (`OprecRegistrationController.php`), API forwarder (`oprecSubmission.js`), dan validasi client (`lib/oprec.js`) memvalidasi dan menyimpan `jabatan_pilihan_1`, `jabatan_pilihan_2`, `jabatan_pilihan_3` ke dalam `form_data` (JSONB) pendaftaran.
- [x] **Perapian Styling Kartu Jabatan pada Pratinjau Admin (Live Preview)**:
  - Menyertakan definisi CSS lengkap untuk `.oprec-user-preview .oprec-jabatan-choices-row` dan `.oprec-user-preview .oprec-jabatan-slot` di [oprec-builder.css](file:///d:/Aplikasi/SIMANIKA/frontend/src/app/admin/oprec/oprec-builder.css).
  - Memperbaiki layout flexbox pada header slot (`.oprec-jabatan-slot__header`) sehingga label "Pilihan #X" dan badge "[ 🔒 Terkunci ]" sejajar rapi secara horizontal, bukan terpisah patah per baris.
  - Menghadirkan border boxy, latar abu-abu muted saat terkunci (`#f8fafc`), kursor blok (`cursor: not-allowed`), dan styling select dropdown seragam dengan browser frame pratinjau.
  - Menjaga 3 slot berjejer horizontal pada rentang lebar pratinjau (container query hingga 360px).
- [x] **Verifikasi Menyeluruh**:
  - 41 tes backend PHPUnit (322 assertions) lulus 100%.
  - 20 tes unit frontend Node.js lulus 100%.
  - Build produksi Next.js (`npm run build`, 26 rute) lulus dengan 0 error/lint issue.

### Integrasi Divisi OPREC ke Tab Kelola Divisi & Pembersihan Dead Code (27 September 2026)

- [x] Rombak total arsitektur form divisi: Bagian divisi murni terintegrasi langsung dengan tab "Kelola Divisi". Kartu pertanyaan sistem `05 Divisi pilihan` dikembalikan tetap berada di **form bagian bawah** (setelah pertanyaan identitas/kustom), tanpa input tipe/label yang membingungkan (screenshot 2), melainkan memuat box pemberitahuan integrasi otomatis dan tombol pintas konfigurasi ke tab "Kelola Divisi".
- [x] Pembersihan total dead code backend (BE): Menghapus kewajiban `divisi_pilihan_1` pada `SaveOprecRequest.php`, memfilter legacy `divisi_pilihan_*` pada `OprecResource.php` dan `OprecWorkspaceController.php`, membersihkan Rule::in check pada `OprecRegistrationController.php`, dan memperbarui `OprecThreeDivisionChoicesTest.php`.
- [x] Tombol "Konfigurasi di Formulir" (`Sliders`) terpasang pada header tab "Kelola Divisi" di `OprecBuilder.jsx`, lengkap dengan panel konfigurasi integrasi interaktif Neo-Arcade Editorial, status integrasi sistem, validasi kuota, ringkasan divisi aktif, dan shortcut navigasi.
- [x] Formulir publik (`OprecForm.jsx`) & Live Preview: Pilihan 3 kartu divisi konsisten dirender di **bagian bawah formulir** setelah data diri/pertanyaan formulir, langsung dari `divisiTersedia`.
- [x] Urutan pertanyaan formulir OPREC: Pertanyaan 01–04 adalah identitas wajib sistem (`nama`, `nim`, `tanggal_lahir`, `angkatan`). Pertanyaan **05** adalah **`Divisi pilihan`** (terkunci permanen di nomor 05 sebagai pertanyaan sistem terintegrasi). Setiap penambahan pertanyaan baru oleh admin otomatis dirender **DI BAWAH DIVISI** (dimulai dari nomor **06**, **07**, dst.), sehingga posisi dan nomor urut Divisi tidak tergeser. Logika ini selaras pada Builder Tab 3, Live Preview formulir pendaftaran, dan formulir registrasi peserta publik (`OprecForm.jsx`).
- [x] Desain ulang tombol "Reset Pilihan" Divisi: Mengganti tombol default browser mentah yang beveled abu-abu dengan toolbar terpadu `.oprec-division-toolbar`, badge counter interaktif dengan status dot bercahaya (`.oprec-division-counter`), dan tombol Neo-Arcade boxy `.oprec-division-reset-btn` lengkap dengan ikon `RotateCcw` beranimasi putar halus saat hover, hairline border rose, micro-shadow 2px, serta transisi tactile press.
- [x] Seluruh 41 tes backend (322 assertions) lulus 100%, 20 tes unit frontend lulus 100%, dan build produksi Next.js (`npm run build`) lulus dengan 0 error.

### OPREC: pilih tiga divisi dalam satu grid kartu (26 September 2026)

- [x] Form peserta memilih tepat tiga divisi berbeda melalui kartu yang sudah ada; urutan klik menjadi prioritas. Adapter Next dan Laravel menolak pilihan kurang/duplikat/ID luar periode. Kolom pilihan ketiga dan rekap admin/user ditambahkan. Tes frontend 16 lulus, backend 42 tes/343 assertion lulus, dan build frontend lulus.
- [x] Migrasi `2026_09_26_000002_add_third_oprec_division_choice` dijalankan pada database lokal.
- [ ] Jalankan migrasi yang sama pada database deployment dan smoke test browser dengan sesi sungguhan. Tes SQLite/build belum menggantikan pengujian browser.

### Navigasi admin OPREC (27 September 2026)

- [x] Breadcrumb admin tidak lagi mengekspos ID internal periode pada halaman edit OPREC; label menjadi “Kelola OPREC / Edit Formulir”.
- [x] URL edit memakai slug periode yang terbaca (contoh `2026-2027`), sementara URL numerik lama tetap didukung.
- [x] Admin dapat menghapus pendaftaran OPREC kosong/draft dengan konfirmasi; periode yang sudah memiliki pendaftar dilindungi backend dan mengembalikan 409.

### Formulir event per grup (25 September 2026)

- [x] Editor admin: grup dinamis, nama/urutan, pertanyaan, aturan pribadi atau bersama, hak edit ketua/semua anggota, lipat/buka, dan pratinjau.
- [x] API peserta: submit per grup, isolasi jawaban pribadi per user, jawaban bersama per tim, otorisasi edit/unduh berkas di server. Seluruh suite backend: 31 tes/236 assertion lulus; build Next.js webpack dan TypeScript lulus.
- [ ] Uji browser manual lintas viewport dan sesi nyata untuk editor serta dashboard. Migrasi PostgreSQL lokal `2026_09_25_000001_create_event_form_groups` sudah diterapkan (batch 17); relasi event 15 dan tabel grup berhasil dibaca.
- [ ] Buat panel admin untuk membaca/meninjau jawaban tiap grup dan workflow verifikasi/pembayaran; saat ini grup hanya berstatus sudah/belum dikirim.

### Integritas kode tim dan event (25 September 2026)

- [x] Prefix unik selama event masih ada; boleh digunakan kembali bersama nama/slug setelah event tanpa peserta dihapus. Counter dan kode yang pernah terbit tetap dicadangkan lintas event; generator memakai transaksi dan row lock. Prefix/kode lama dibackfill tanpa mengganti kode yang sudah dibagikan. Pengaturan tim dikunci setelah ada peserta. Update/publish/hapus event memakai lock agar tidak berpacu dengan pendaftaran. Migrasi PostgreSQL lokal batch 18 berhasil; 34 tes backend/266 assertion dan build Next.js/TypeScript lulus.
- [ ] Tinjau dan remediasi dua kode historis `HACK01` pada event 15 dan 16 bersama pemilik tim sebelum mengganti salah satunya; join saat ini selalu dibatasi event yang dipilih, tetapi kode tidak unik secara global pada data historis.
- [ ] Uji dua permintaan create-team simultan pada PostgreSQL nyata dan smoke test browser admin setelah deploy; tes SQLite tidak membuktikan perilaku lock PostgreSQL di bawah beban.

Checklist ini menjadi gerbang tiap sprint. Implementasi kode tidak otomatis berarti sudah teruji.

| Area | Status | Yang perlu diverifikasi/diselesaikan |
|---|---|---|
| Stack FE | 🔄 | Next 16/React 19, Axios, Zustand, React Hook Form, Zod, Tailwind 4, Motion, Lucide, Sonner, date-fns terpasang. Build webpack dan pemeriksaan TypeScript lulus; cek Tailwind/shadcn dan audit UI responsif di browser. |
| Runtime lokal | ✅ | `dev.bat` menjalankan Next dan PHP bersama di Windows; `/login` dan `/api/ping` sama-sama HTTP 200. |
| Auth FE | 🔄 | Form login/daftar/pemulihan memakai Zod; sesi memakai Axios + Zustand; `useAuth`/guard tersedia. Login kini punya state loading/sukses/error, toast animated yang dapat ditutup, dan reduced-motion. Uji cookie, CSRF, 401/419, redirect, Navbar, logout di browser. |
| Auth BE | 🔄 | Laravel 11/Sanctum 4 dan lockfile target PHP 8.2 sesuai arsitektur; route list dan PHPUnit SQLite lulus. Uji sesi/CSRF/reset sandi di browser/PostgreSQL. |
| Email & berkas | ⬜ | Isi SMTP sungguhan untuk email reset; uji tautan dan batas upload privat. `MAIL_MAILER=log` hanya untuk lokal. |
| Database | 🔄 | Tiga migrasi Ran di PostgreSQL (29 tabel: 20 domain + 8 infrastruktur + migrations); cocokkan constraint/index dan uji rollback, seed, relasi. |
| Event & OPREC | 🔄 | Cocokkan halaman dinamis dengan kontrak admin dan API; selesaikan alur pendaftaran Event/tim, OPREC, pengumuman, validasi data, serta test lintas FE↔BE. |
| CMS, merchandise, dashboard | 🔄 | Dashboard peserta kini berupa daftar pendaftaran event/tim/OPREC dari API pribadi. Pendaftaran event/tim, CMS, dashboard admin, dan profil menyusul sesuai sprint. |
| Deployment | ⬜ | Uji build, PHP tests, env produksi, HTTPS/cookie domain, queue, storage, mail, monitoring, dan smoke test dari browser. |
| Dokumentasi | 🔄 | `AGENTS.md` root dan `WORKFLOW.md` mewajibkan semua MD termasuk `architecture.md`; perbarui checklist ini saat kontrak berubah. |

### Gate verifikasi auth

- [x] `npm ci` dan `npm run build` sukses di Windows; halaman login juga berhasil dikompilasi saat `next dev` berjalan di Windows.
- [x] `php artisan route:list` (26 route), PHPUnit (13 test/47 assertion), dan migrasi `add_google_id_to_users_table` Ran di PostgreSQL lokal.
- [x] Google OAuth 2.0 resmi terpasang (`laravel/socialite`, migrasi `google_id`, `GoogleAuthController`, route redirect & callback, unit & feature test lulus 100%, frontend callback di `/auth/callback`).
- [x] Standardisasi kolom `name` pada tabel `users` (menghapus kolom duplikat `nama` dari database; accessor virtual `nama` tetap tersedia pada model dan API resource sehingga kompatibel 100% dengan frontend).
- [x] Pembaruan Navbar: menampilkan nama pengguna saat login dan membuka sub-navbar dropdown interaktif, perbaikan kontras hover icon Admin Console (`nav-account-menu__item--admin`), **pemisahan penuh dashboard vs admin console (menu dan mobile drawer hanya menampilkan `Admin Console` bagi akun admin, dan `Dashboard` hanya bagi pengguna biasa/peserta; penghapusan callout banner admin di halaman `/dashboard` serta auto-redirect admin langsung ke `/admin` sehingga halaman `/dashboard` 100% murni untuk user)**.
- [x] **Rombak Total Navbar (Full Horizontal Edge-to-Edge)**: Transformasi arsitektur navbar dari floating dual-capsule menjadi 1 bar horizontal penuh mentok kiri ke kanan (`width: 100%; top: 0; left: 0; right: 0; position: fixed;`) dengan tinggi kompak (`3.75rem` / 60px desktop, `3.5rem` / 56px mobile), tata letak grid presisi 3 zona: Logo SIMANIKA di kiri, link navigasi (`Home`, `Event`, `OPREC`, `Merchandise`) tepat di tengah viewport, dan tombol Login / menu akun di kanan. Ikon animasi (`AnimatedNavIcon`), logo SIMANIKA, dan ikon user tetap dipertahankan; dropdown subgrid landing page terpusat di bawah tombol Home.
- [x] **Indikator Aktif & Hover Line Bawah Beranimasi Halus**: Mengganti seluruh shape/pill background abu-abu/biru pada hover dan active menjadi underline garis biru di bawah item navigasi (`.nav-link::after` dengan ekspansi halus `transform: scaleX(0)` ke `scaleX(1)` ber-easing `cubic-bezier(0.16, 1, 0.3, 1)` saat hover maupun saat aktif), menjaga warna icon dan teks tetap biru, serta menjalankan animasi ikon secara looping tak terbatas (`infinite`) hanya pada halaman yang sedang aktif/dimasuki (Home, Event, OPREC, Merchandise), tanpa menganimasikan tombol login secara looping. Terverifikasi melalui build dan browser subagent di desktop dan mobile.
- [x] Audit keamanan auth: OAuth Google memakai state sesi dan verifikasi email; taut akun lokal otomatis dinonaktifkan, TLS tetap diverifikasi, OAuth dan auth dibatasi per IP, reset sandi mencabut sesi database/token, redirect `next` dibatasi ke path internal, dan respons CSRF 419 tidak lagi menghapus status login secara keliru.
- [ ] Uji runtime di Windows: PHPUnit auth/OAuth dengan PHP lokal, lalu uji login Google dan reset sandi lewat browser (cookie, CSRF, callback, pencabutan sesi). Akun lokal yang emailnya sama dengan Google kini masuk memakai kata sandi; alur taut akun eksplisit memerlukan fitur tersendiri.
- [x] Navbar dan menu mobile menunggu hasil `/auth/me` sebelum menampilkan aksi akun; kegagalan koneksi menampilkan opsi coba lagi tanpa menganggap sesi berakhir. Guard halaman terlindungi juga menunggu hasil pemeriksaan sesi.
- [x] Perbaikan logout Sanctum: sesi SPA tidak lagi mencoba menghapus `TransientToken`; logout token API hanya mencabut token aktif. UI mencegah submit ganda dan mempertahankan state akun jika server benar-benar gagal.
- [x] **Modul Kelola User (`/admin/users`)**: Backend `UserController` dengan paginasi (maksimal 10 data per halaman secara AJAX), pencarian multi-kolom, filter role & angkatan, statistik ringkasan, update role aman (pencegahan demosi/penghapusan admin tunggal), update profil, serta frontend UI Neo-Arcade Editorial dengan modal ganti role, detail partisipasi event/OPREC, dan edit akun telah terintegrasi dan terverifikasi di build Next.js serta PRD/Architecture. Dilengkapi perbaikan segmented control pill styling dengan padding proporsional dan font-size presisi agar tidak offside.
- [x] **Modul Kelola Event (`/admin/events`)**: Penyelarasan format payload form buat event antara frontend dan backend, dukungan otomatisasi pembuatan slug dari judul event (*auto-slug*), penanganan *nested/root payload*, pencegahan error validasi `slug required` di server, tombol aksi tabel `.admin-icon-btn`, fitur unggah poster/pamflet event (drag & drop gambar maks. 5MB dengan live preview, endpoint `POST /api/admin/events/upload-poster`, thumbnail poster di tabel event, **penghapusan total opsi input Link URL poster sehingga form murni 'Upload Berkas' tanpa link, serta migrasi `2026_09_23_192000_drop_registration_url_from_events_table` yang mendrop kolom `registration_url` dari tabel `events` di PostgreSQL sampai akar-akar**), indikator bintang merah (`*`) pada semua label kolom wajib isi form, **penghapusan kolom input tanggal statis dan penerapan 100% manajemen jadwal/timeline tanggal event dinamis** (kolom database `timeline` jsonb di PostgreSQL, auto-derive tanggal mulai/selesai/buka/deadline di backend & frontend, dynamic form input di admin modal dengan tombol `+ Tambah Tanggal`, kustomisasi nama tahapan/agenda bebas seperti Penyisihan/Technical Meeting/Awarding, tombol hapus, tombol quick preset, dan rendering dinamis di halaman detail publik event `EventDetail.jsx`), **standardisasi tanggal murni (date-only) tanpa jam/pukul** (migrasi database kolom `tanggal_mulai`, `tanggal_selesai`, `buka_pendaftaran`, `deadline_pendaftaran` ke tipe `date` di PostgreSQL, pembersihan time dari JSON `timeline`, input bertipe `date`, format tampilan publik tanggal murni tanpa embel-embel 'pukul ... WIB'), **opsi input kategori kustom** (pilihan 'Lainnya...' langsung bertransformasi menjadi input teks mandiri dengan tombol pembatalan `X` dan autoFocus, migrasi panjang kolom `kategori` varchar(60), validasi backend terbuka, dan filter tabel cerdas), **penyelarasan atribut tabel event** (dukungan format snake_case dan camelCase pada `EventResource` dan baris tabel sehingga status `Tim Competition` dan tanggal pelaksanaan tampil akurat), **kolom Pendaftar / Tim dinamis** (menampilkan `X Tim` jika mode tim, atau `X Peserta` jika mode individu dengan font standar hitam bersih `text-slate-900` tanpa font monospace atau teks ungu bertumpuk), **fitur Edit Event lengkap** (tombol Edit dengan ikon pensil `Edit2` pada kolom AKSI tabel event, modal terintegrasi yang otomatis memuat seluruh data awal event termasuk judul, slug, poster preview, deskripsi, kategori kustom, tipe pelaksanaan, status publikasi, lokasi, agenda timeline dinamis, dan konfigurasi tim, penyesuaian judul modal ke "Edit Event / Competition" & tombol ke "Simpan Perubahan", pengiriman request `PUT /api/admin/events/{id}`, notifikasi sukses, auto-refresh tabel data), serta **penghapusan total sistem kuota sampai akar-akar** (migrasi database `2026_09_23_191500_drop_kuota_from_events_table` mendrop kolom `kuota` dan `kuota_tim` dari PostgreSQL `events`, pembersihan model `Event.php` dari fillable & casts, penghapusan validasi kuota di `Admin\EventController.php`, penghapusan field kuota/sisaKuota di `EventResource.php`, penghapusan input Kuota Peserta dan Kuota Tim di modal form admin `page.jsx`, pembersihan logika kuota penuh & ketersediaan di `events.js`, `EventDetail.jsx`, dan `EventCard.jsx`, serta seluruh test unit lulus 100%).
- [x] **Pembersihan Dead Code & Unused Files Landing Page (26 September 2026)**: Menghapus 5 file tak terpakai (`stagger-testimonials.tsx`, `stagger-testimonials.css`, `sidebar-demo.tsx`, `LazySection.jsx`, `InteractiveSignalGrid.jsx`), membersihkan ~290 baris dead CSS di `globals.css` (`.stagger-*`, `@keyframes nav-link-*`, dan selector sisa), menghapus folder artefak `graphify-out/` dari repo dan mendaftarkannya ke `.gitignore`. Terverifikasi 100% via Next.js production build (`next build --webpack`, 27/27 static & dynamic routes lulus tanpa error).
- [x] **Penyempurnaan Sub-Navbar & Hamburger Mobile Navbar (26 September 2026)**: Mengganti badge nomor `00` sampai `05` dengan ikon vektor modern bergaya 21st.dev (`SubNavIcon.jsx` untuk Beranda, Tentang, Visi & Misi, Divisi, Galeri, dan Testimoni), menengahkan posisi kartu sub-navbar secara proporsional dan simetris di tengah navbar/viewport, serta menghapus shape lingkaran (frame, background putih, dan shadow) pada tombol burger navbar mobile sehingga murni menyisakan ikon burger minimalis yang responsif dan interaktif saat di-hover/tap. Terverifikasi 100% via browser live snapshot desktop/mobile dan Next.js production build.
- [x] **Pembaruan Engine & Logic Live Search Halaman Event (26 September 2026)**: Mengubah pencarian event menjadi instant live search otomatis tanpa harus menekan Enter (debounced 280ms), menghilangkan unmount/loss-of-focus bug dengan menghapus key destruktif pada `EventFilters`, menambahkan tombol clear `✕` instan tanpa duplikasi tombol bawaan browser, memperluas search engine backend ke multi-field (`judul`, `deskripsi`, `kategori`, `lokasi`) dengan case-insensitive dan wildcard escaping yang aman, serta penanganan auto-reset pagination. Terverifikasi 100% via PHPUnit (12 test / 80 assertion), Next.js production build, dan pengujian browser live.
- [x] **Card OPREC & Efek Tirai IFEST (26 September 2026)**: Mentransformasi kartu OPREC (`.oprec-preview`) menyerupai kartu event IFEST (`ifestunpad.com/events`): lebar 100% penuh container dengan tinggi proporsional (`min-height: 380px`), top accent bar gradasi biru 3px, poster kanan dipaskan penuh dan di-crop presisi (`object-fit: cover`) dengan micro-zoom `1.06x` saat hover. Menghapus total `PixelDissolve.jsx` dan selector `.oprec-pixel-dissolve` sampai ke akar-akarnya tanpa menyisakan dead code/unused code. Membangun ulang sistem tirai visual IFEST dengan grid 20 kolom x 9 baris (tirai balok biru solid `#214afe` di sisi kiri cols 0–3 dan sisi kanan cols 16–19 saat initial state; saat hover, balok tirai memudar bertahap *staggered curtain blinds* dari dalam ke luar dan per baris hingga 100% bersih transparan, lalu teks judul dan kicker overlay muncul beranimasi di kiri bawah poster). Baris keterangan kiri dilengkapi 3 icon SVG bergaya IFEST (Kalender, MapPin/Lokasi, Tiket/Kategori), status badge berbingkai dashed, serta tombol aksi bersinar biru (`box-shadow: 0 0 20px rgba(33, 74, 254, 0.3)`). Terverifikasi 100% via Next.js production build (`next build --webpack`, 30 rute lolos tanpa error).
- [x] **Rombak Total Alur OPREC — Pop-up Modal Detail & Dashboard User Form (26 September 2026)**:
  - **Penghapusan Total Route Lama & Dead Code**: Menghapus seluruh folder `/oprec/detail` (`frontend/src/app/oprec/detail/page.jsx`), menghapus komponen mati `OprecPoster.jsx`, `OprecStatus.jsx`, dan `OprecTestForm.jsx`, serta membersihkan seluruh dead CSS selector (`.oprec-detail*`, `.oprec-registration-grid`, `.oprec-poster*`, `.oprec-stage*`) dari `oprec.css` sampai ke akar-akarnya (0 dead code / 0 unused files).
  - **Pop-up Modal Detail OPREC**: Mengganti navigasi tombol "Lihat detail" pada kartu OPREC menjadi trigger pembuka modal dialog modern accessible (`OprecDetailModal.jsx`). Modal menampilkan poster OPREC berbingkai proporsional tanpa terpotong, headline & deskripsi, status badge (`Pendaftaran Dibuka` / `Segera Dibuka` / `Pendaftaran Ditutup`), metadata jadwal (tanggal pendaftaran - penutupan, lokasi, kategori), daftar divisi terbuka dengan info kuota, serta tombol aksi utama "Daftar Sekarang".
  - **Alur Pendaftaran Terintegrasi Persis Seperti Event**:
    - Saat tombol "Daftar Sekarang" ditekan: jika user belum login, diarahkan otomatis ke `/login?next=/dashboard/oprec`.
    - Jika user sudah login: sistem mendaftarkan enrollment user via `POST /api/user/oprec/enroll` (tabel `oprec_enrollments` via migrasi `2026_09_26_000001_create_oprec_enrollments_table.php`), lalu mengarahkan user ke Dashboard User (`/dashboard?oprec={id}`).
    - Di Dashboard User (`/dashboard`), pendaftaran OPREC tampil dengan status "Perlu dilengkapi" (`incomplete`), dengan tautan `Lihat detail ↗` yang mengarahkan ke workspace pengisian formulir di `/dashboard/oprec`.
    - Di workspace `/dashboard/oprec` (`OprecWorkspace.jsx`), user mengisi formulir pendaftaran dinamis (`OprecForm`). Setelah submit, data tersimpan di `oprec_registrations`, status pendaftaran beralih menjadi "Menunggu verifikasi" (`pending`), dan user dapat melihat rekapitulasi data pendaftarannya serta memantau hasil pengumuman ketika tiba waktunya.
    - **Standardisasi Tanggal Tanpa Jam (Date-Only)**: Menghapus format waktu/jam (`pukul HH.mm WIB`) pada kartu "Jadwal Kegiatan" di workspace OPREC (`OprecWorkspace.jsx`) dan fungsi helper `oprecDate` di `frontend/src/lib/oprec.js`. Seluruh tampilan tanggal OPREC kini murni hanya menampilkan tanggal (contoh: `25 September 2026` dan `1 Oktober 2026`) selaras dengan standar event.
    - **Penyelarasan UI Form OPREC dengan Event (2-Kolom Grid Kiri-Kanan & Neo-Brutalist Field Styling)**: Menyamakan komponen form OPREC (`OprecForm.jsx`), teks field, file upload dashed box, label bertanda bintang merah (`*`), teks petunjuk pengisian, layout grid 2 kolom kiri-kanan (`grid-template-columns: repeat(2, minmax(0, 1fr))`), wide span untuk berkas/divisi/textarea, header panel `Data & administrasi` dengan badge `Belum dikirim`/`Terkirim`, serta link toolbar `← Dashboard` dan heading `Informasi OPREC ↗` persis seperti pada Event Workspace.
    - **Standardisasi Button Kompak di Kanan (Konsisten Seperti Dathon)**: Menyamakan seluruh tombol aksi formulir (Event group form Dathon, Event single form Hackathon, OPREC, dan Join Team) menjadi tombol kompak (`width: auto`, `min-width: 132px`) yang selalu terposisi di pojok kanan bawah (`.event-group-submit` dengan `display: flex; justify-content: flex-end; margin-top: 20px;`) dengan teks aksi ringkas ("Kirim"), menghindari inkonsistensi tombol full-width di tengah.
  - **Verifikasi**: 41 tes backend Laravel (336 assertions) lulus 100%, 25 tes frontend unit lulus 100%, Next.js production build (`next build --webpack`, 27 routes) lulus tanpa error, dan uji visual browser subagent terkonfirmasi berhasil.
- [x] **Rombak Total UI/UX Form Pendaftaran OPREC Admin (`/admin/oprec/[id]/edit`) & Komponen Unggah Poster (27 September 2026)**:
  - Mengubah layout `OprecBuilder.jsx` dari scroll panjang tak berujung dengan alien box gelap menjadi arsitektur tab modular 3 tahap (`1. Informasi & Jadwal`, `2. Kelola Divisi`, `3. Pertanyaan Formulir`) bergaya Neo-Arcade Editorial minimalis (`border-radius: 0 !important`, garis batas hairline `#cad5e5`, tipografi hierarkis jelas) dilengkapi live preview panel interaktif yang responsif.
  - Mengganti input teks link/URL poster mentah (`URL POSTER / PAMFLET (OPSIONAL)`) dengan komponen dropzone berkas interaktif (`.oprec-builder__poster-zone` & `.oprec-builder__poster-drop`). Mendukung klik untuk memilih atau drag-and-drop berkas gambar (JPG, PNG, WebP maks. 5 MB), upload otomatis ke endpoint backend `POST /api/admin/oprec/upload-poster`, state loading spinner, kartu pratinjau thumbnail poster terpasang lengkap dengan tombol "Ganti Poster" dan "Hapus", serta rendering pratinjau poster langsung di panel samping Live Preview. 20 unit test lulus dan Next.js production build lulus 100%.
  - Mengganti input teks manual `PERIODE KEPENGURUSAN *` ("2026/2027") dengan komponen pemilih dua tahun khusus (`OprecPeriodPicker`). Memfasilitasi pemilihan tahun sebelum `/` (Tahun Awal) dan tahun sesudah `/` (Tahun Akhir) tanpa tanggal atau bulan, dilengkapi ikon kalender, pembatas slash tegas, otomatisasi tahun akhir saat tahun awal dipilih, badge pratinjau format `YYYY/YYYY`, tombol reset, serta validasi ketat di `OprecBuilder` dan `OprecCreateDialog`. Terverifikasi pada Next.js build dan tes unit.
  - Menghapus teks URL tautan mentah poster pada kartu pratinjau, serta menyamakan ukuran dan tata letak tombol **"Ganti Poster"** persis dengan tombol **"Hapus"** (tinggi 32px, horizontal inline `flex-direction: row`, padding proporsional `0 0.85rem`, tanpa kapitalisasi otomatis dari selector label grid).
  - Mengubah seluruh input tanggal pada admin OPREC (`TANGGAL BUKA *` dan `TANGGAL TUTUP *` pada `OprecBuilder` dan `OprecCreateDialog`) menjadi murni pemilihan tanggal tanpa jam (`type="date"`). Payload ke backend otomatis diselaraskan dengan batas hari penuh (`00:00:00 WIB` untuk tanggal buka, `23:59:59 WIB` untuk tanggal tutup) sehingga pendaftaran berlangsung penuh tanpa kendala waktu dan backend lulus 100% pada feature tests PHPUnit.
- [ ] Browser: daftar → sesi aktif → dashboard, login/logout, 401/403, CSRF 419, reset lewat email, dan pembaruan Navbar.
- [ ] Form menampilkan kesalahan Zod dan backend tetap menolak input tidak valid.

---

## 📊 Summary

Verifikasi terbaru (25 September 2026): penguatan kode tim dan event lulus 34 tes backend/266 assertion serta build frontend. Angka progress sprint di bawah belum dihitung ulang karena audit browser dan remediasi data historis masih terbuka.

| Metrik | Nilai |
|--------|-------|
| **Total Tasks** | 165 |
| **Selesai** | 9 |
| **Dalam Proses** | 51 |
| **Belum Dikerjakan** | 105 |
| **Blocked** | 0 |
| **Progress** | `█░░░░░░░░░░░░░░░░░░░` **5%** |

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

**Status**: 🔄 Stack frontend terpasang, backend Laravel/PHP/PostgreSQL berjalan; browser end-to-end dan SMTP belum diverifikasi
**Target**: 1-2 hari
**Dependency**: Tidak ada

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| FE-0.1 | Init Next.js (`npx create-next-app@latest`) | ✅ | Next.js 16.3.5, React 19.2.8, App Router |
| FE-0.2 | Install FE dependencies (Tailwind, Axios, Zustand, shadcn, Lucide) | 🔄 | Paket stack terpasang dan build webpack lulus; komponen shadcn/UI belum diintegrasikan. |
| FE-0.3 | Setup Tailwind CSS + shadcn/ui config | 🔄 | Tailwind 4 PostCSS dan utilitas aktif; validasi tampilan dan komponen shadcn belum selesai. |
| FE-0.4 | Setup folder structure frontend | ⬜ | `src/app`, `src/components`, `src/lib`, `src/store` |
| FE-0.5 | Setup Next.js App Router dengan layout & route skeleton | ⬜ | — |
| FE-0.6 | Setup Axios instance + interceptors | 🔄 | Instance cookie/CSRF dan error interceptor dibuat; uji browser belum selesai. |
| BE-0.1 | Init Laravel 11 (`composer create-project`) | 🔄 | Laravel 11/vendor terpasang, route list dan PHPUnit lulus; init awal dilakukan manual. |
| BE-0.2 | Install BE packages (Sanctum, CORS) | 🔄 | `backend/vendor` dan lockfile ada; runtime PHP belum dapat diuji dari lingkungan ini. |
| BE-0.3 | Setup `.env` (DB connection, CORS origins) | 🔄 | Nilai lokal berfungsi; nilai produksi dan SMTP masih perlu diisi. |
| BE-0.4 | Configure CORS middleware | 🔄 | Origin terdaftar eksplisit dan credentials aktif; uji browser belum tersedia. |
| BE-0.5 | Setup Sanctum config untuk SPA auth | 🔄 | Middleware stateful API dan CSRF FE siap; perlu uji sesi lintas port. |
| BE-0.6 | Setup folder structure backend | ✅ | Folder, route, model, controller, migration awal dibuat & teruji runtime. |
| DB-0.1 | Install PostgreSQL & create database `simanika` | ✅ | PostgreSQL 18 aktif & database `simanika` selesai dibuat. |
| DB-0.2 | Configure Laravel DB connection | ✅ | Terhubung ke PostgreSQL & migrasi 20 tabel berhasil. |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | `npm run dev` → Next.js app di `localhost:3000` | ✅ |
| 2 | `php artisan serve` → Laravel di `localhost:8000` | ✅ |
| 3 | FE bisa hit BE API (`/api/ping` → ok) | 🔄 | HTTP ping dan header CORS lolos via curl Windows; browser FE belum diuji. |
| 4 | PostgreSQL terkoneksi (`php artisan migrate` sukses) | ✅ |
| 5 | CORS berfungsi (no error di browser) | 🔄 | Header origin/credentials benar via curl Windows; browser belum diuji. |

---

## Sprint 1 — Database Schema & Migrations

**Status**: 🔄 Migrasi PostgreSQL sudah berjalan (29 tabel total: 20 domain, 8 infrastruktur, 1 migrations); rollback belum diuji
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
| 1 | `php artisan migrate` sukses tanpa error | ✅ |
| 2 | `php artisan migrate:rollback` sukses | ⬜ |
| 3 | `php artisan db:seed` sukses | ⬜ |
| 4 | 20 tabel domain terbuat di PostgreSQL (di luar tabel infrastruktur Laravel) | ✅ |
| 5 | Model relationships bisa di-test via `tinker` | ⬜ |

---

## Sprint 2 — Authentication System

**Status**: 🔄 Endpoint auth, form Zod, dan state sesi terhubung; browser cookie/CSRF serta SMTP belum diuji
**Target**: 2-3 hari
**Dependency**: Sprint 1

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-2.1 | Setup Sanctum SPA authentication | 🔄 | Stateful API + cookie/CSRF dikonfigurasi; belum uji runtime. |
| BE-2.2 | `RegisterController` — register + auto-login | 🔄 | Endpoint email/password dibuat; belum uji integrasi. |
| BE-2.3 | `LoginController` — login + session cookie HttpOnly | 🔄 | Endpoint dibuat; belum uji cookie browser. |
| BE-2.4 | `ProfileController` — get/update profile | 🔄 | Profil dasar tersedia; upload foto menyusul. |
| BE-2.5 | `AdminMiddleware` — cek role admin | 🔄 | Guard dibuat; test PHP belum dijalankan. |
| BE-2.6 | Form Requests (Register, Login, UpdateProfile) | 🔄 | Ketiganya dibuat; sintaks valid, uji profil runtime menyusul. |
| BE-2.7 | `UserResource` API Resource | 🔄 | Resource dibuat; belum uji respons. |
| BE-2.8 | Route groups di `routes/api.php` | 🔄 | Auth/public/user/admin core terdaftar; endpoint sprint lanjut belum lengkap. |
| FE-2.1 | `authStore` (Zustand, tanpa menyimpan token) | 🔄 | Store pengguna, status autentikasi/admin, dan pengecekan sesi dibuat. |
| FE-2.2 | `authService` — API calls | 🔄 | `authClient` memakai Axios; belum uji browser. |
| FE-2.3 | Axios `withCredentials`, CSRF cookie, handle 401/419 | 🔄 | Axios cookie/CSRF, clear sesi 401, pesan 419; perlu uji browser. |
| FE-2.4 | `Login.jsx` page | 🔄 | Form React Hook Form + Zod terhubung ke Laravel; uji browser belum selesai. |
| FE-2.5 | `Register.jsx` page | 🔄 | Form email/password memakai React Hook Form + Zod; uji browser belum selesai. |
| FE-2.6 | `ProtectedRoute` component | 🔄 | Guard dashboard dibuat; redirect belum uji browser. |
| FE-2.7 | `AdminRoute` component | 🔄 | Guard role tersedia; halaman admin dan uji belum ada. |
| FE-2.8 | `useAuth` hook | 🔄 | Hook state sesi dan aksi auth dibuat; perlu uji browser. |
| FE-2.9 | Navbar conditional render (Login vs User dropdown) | 🔄 | Tautan Login/Dashboard mengikuti sesi; dropdown belum dibuat. |
| BE-2.9 | Forgot/reset password berbasis email | 🔄 | Broker password dan URL FE dibuat; SMTP belum dikonfigurasi/diuji. |
| FE-2.10 | Halaman forgot/reset password | 🔄 | Form Zod + adapter API tersedia; SMTP/email end-to-end belum diuji. |

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

## Sprint 5 — Team System (Event Competition)

**Status**: ⬜ Belum Dimulai
**Target**: 3-4 hari
**Dependency**: Sprint 4

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-5.1 | `TeamService` — business logic | 🔄 | TeamMembershipService: request join, accept, remove, lock deadline/admin, hitung anggota accepted. Uji backend lulus; fitur leave belum masuk scope. |
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
| FE-5.5 | "Kelola Tim" page (ketua) | 🔄 | Workspace `/dashboard/events/[id]`: nama/kode, anggota, approval/remove, form dinamis compact. Build/typecheck dan browser fixture lulus; E2E sesi nyata FE–BE masih perlu. |
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

**Status**: 🔄 Dalam Proses (Dashboard, Sidebar Biru, Kelola Event & Konfigurasi Tim PRD 5.7, Kelola OPREC, Merchandise, dan Pengaturan telah aktif)
**Target**: 2-3 hari
**Dependency**: Sprint 4, 5, 6, 7

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-8.1 | `AdminDashboardController` — aggregate stats | ✅ | Endpoint `/api/admin/dashboard` mengembalikan total user, event aktif, registrasi, tim, pelamar oprec, pending review, recent events & registrasi. |
| BE-8.2 | `ContentController` — get/update site content | ⬜ | — |
| BE-8.3 | Dashboard: statistik metrik ringkasan sistem | ✅ | Metrik real-time & status OPREC terhubung ke backend. |
| FE-8.1 | `AdminDashboard.jsx` — stat cards, quick actions | ✅ | Halaman `/admin` dengan kartu statistik, status OPREC aktif, aksi cepat, dan tabel event terkini. |
| FE-8.2 | `sidebar.tsx` — navigasi admin (Framer Motion) | ✅ | Terpasang di `@/components/ui/sidebar.tsx` dengan kustomisasi warna tema biru SIMANIKA (`#071328`, `#152e5c`, electric blue), hover collapse/expand, & mobile slide drawer. |
| FE-8.3 | Admin layout wrapper (sidebar + content) | ✅ | Terpasang di `/admin/layout.jsx`, dilindungi `<AdminRoute>`, avatar profil, link publik, & logout admin. |
| FE-8.4 | `admin/events/page.jsx` — Kelola Event & Tim | ✅ | CRUD event dengan filter status/kategori, dan konfigurasi Sistem Tim (PRD 5.7: Prefix kode max 6 huruf, live code preview, min/max anggota tim, kuota). |
| FE-8.5 | `admin/oprec/page.jsx` — Kelola OPREC & Divisi | ✅ | Tabel pelamar OPREC dengan filter status, modal verifikasi & penugasan divisi lolos seleksi. |
| FE-8.6 | `admin/merchandise/page.jsx` & `admin/settings/page.jsx` | ✅ | Katalog stok merchandise dan halaman pengaturan akun admin / arsitektur sistem. |
| FE-8.7 | Polish admin pages (loading, errors, dialogs) | ✅ | Styling tersentralisasi di `admin.css`, transisi mulus, modal responsif, zero typescript/build error. |

**Done Criteria**:
| # | Kriteria | Verified |
|---|----------|----------|
| 1 | Dashboard statistik akurat & real-time dari BE | ✅ |
| 2 | Sidebar navigasi berfungsi dengan animasi & tema biru SIMANIKA | ✅ |
| 3 | Kelola Event mendukung konfigurasi Tim (PRD 5.7) | ✅ |
| 4 | Kelola OPREC mendukung review status & penetapan divisi | ✅ |
| 5 | Guard otentikasi admin (`AdminRoute`) mengamankan seluruh rute `/admin` | ✅ |

---

## Sprint 9 — User Dashboard

**Status**: 🔄 Dalam Proses
**Target**: 2-3 hari
**Dependency**: Sprint 4, 5, 6

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| BE-9.1 | `DashboardController` — aggregate user data | 🔄 | Endpoint pemilik sesi untuk event, tim, OPREC dibuat; PHPUnit/runtime belum dijalankan. |
| BE-9.2 | User notifications endpoint (opsional) | ⬜ | — |
| FE-9.1 | `Dashboard.jsx` — overview cards | 🔄 | Arahan terbaru: dashboard daftar card pendaftaran tanpa kartu profil/statistik; build frontend lulus, uji browser menunggu. |
| FE-9.2 | Section "Event Saya" — list + status | 🔄 | Card event individu tampil dari API; alur daftar event belum tersedia. |
| FE-9.3 | Section "Tim Saya" — list + Bentuk/Join | 🔄 | Keanggotaan tim tampil sebagai card; alur Bentuk/Join menunggu Sprint 5. |
| FE-9.4 | Section "OPREC Saya" — status | 🔄 | Card OPREC tampil; status seleksi ditahan sampai pengumuman terbit. |
| FE-9.5 | `Profile.jsx` — edit + foto + password | ⬜ | — |
| FE-9.6 | Responsive dashboard | 🔄 | Tata letak desktop/mobile disiapkan; audit browser menunggu. |

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
| 2026-09-25 | Sprint 5/8 | Audit kode tim: prefix unik selama event ada dan dapat dipakai lagi setelah penghapusan; nomor global per prefix serta kode terbit tetap dicadangkan, pengaturan tim terkunci sesudah peserta, dan update/hapus event memakai row lock. Data lama tidak diganti diam-diam. | AI |
| 2026-09-23 | Sprint 9 | Dashboard peserta dirombak menjadi daftar card pendaftaran event/tim/OPREC dengan endpoint privat, empty/loading/error state, Navbar bersama, dan status OPREC yang tidak bocor sebelum pengumuman. Arahan desain terbaru menggantikan overview profil lama. | AI |
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
| 2 | Sprint 5 | Dua event historis (15 dan 16) memakai prefix HACK dan kode HACK01 | Medium | Perlu tindak lanjut | Pendaftaran tetap event-scoped; kode baru tidak akan diulang. Penggantian kode lama perlu koordinasi dengan pemilik tim. |
| 1 | Sprint 4 | Build dan pengujian browser belum dapat dijalankan: runtime npm/Node mengembalikan WSL 1 unsupported | Medium | Terbuka | Jalankan build dan smoke test pada Node Linux/WSL 2 atau terminal Windows yang berfungsi |

---

## 💡 Decision Log

Keputusan arsitektur / desain penting yang diambil selama pengembangan.

| Tanggal | Keputusan | Alasan | Impact |
|---------|-----------|--------|--------|
| 2026-09-25 | Prefix tim unik hanya selama dipakai event yang ada; counter/kode terbit permanen, nomor global per prefix minimal dua digit | Klarifikasi terbaru pengguna: HACK dan nama yang sama boleh dipakai setelah event lama dihapus, tanpa menerbitkan ulang kode tim lama; menggantikan keputusan nomor per-event di bawah | Sprint 5/8 |
| 2026-09-13 | Tech stack frontend: Next.js (App Router) | Permintaan user, performa SSR/SSG & SEO bawaan yang lebih optimal | Fundamental |
| 2026-09-12 | Tech stack backend & DB: Laravel + PostgreSQL | Permintaan user | Fundamental |
| 2026-09-12 | Auth: Laravel Sanctum (bukan Firebase) | Selaras dengan Laravel backend | Sprint 2 |
| 2026-09-12 | Team kode: Prefix custom + 2-digit auto-increment | UX mudah diingat & dibagikan | Sprint 5 |
| 2026-09-12 | User pages: Navbar layout (bukan sidebar) | User experience konsisten dengan landing page | Sprint 9 |
| 2026-09-12 | Admin pages: Sidebar layout | Navigasi admin perlu lebih banyak menu | Sprint 8 |
| 2026-09-12 | DB: PostgreSQL (bukan Firestore) | Relational, ACID, permintaan user | Sprint 1 |
| 2026-09-13 | Visual: Bold Editorial Liquid Glass (70/30) | Memadukan identitas biru–kuning dengan material iPhone-style glass tanpa menghilangkan hierarki editorial | Landing page dan komponen interaktif |

---

| 2026-09-24 | Label kapasitas tim di kartu | Label peserta di pojok kartu menampilkan rentang anggota seperti `Tim 3–5` dari konfigurasi event; event individu tetap `Individu`. | AI |
| 2026-09-24 | CTA kartu event | Label tombol pada kartu event disederhanakan menjadi `Detail` agar lebih ringkas; seluruh kartu tetap menuju halaman detail event. | AI |
| 2026-09-24 | Informasi kapasitas kartu | Info kapasitas tim dipindahkan ke baris info bawah kartu; label tim di atas dan tanggal event di kartu dihapus. | AI |
| 2026-09-24 | Frame visual event | Frame dashed ditambahkan pada kotak informasi timeline dan cover poster agar mengikuti bahasa visual referensi; typecheck lulus. | AI |
| 2026-09-24 | Timeline event bergaris | Timeline jadwal memakai satu garis horizontal dengan titik berjarak dan kotak informasi bergantian atas-bawah; nomor urut dihapus, serta mobile menjadi garis vertikal. | AI |
| 2026-09-24 | Kartu daftar event | Kartu event diperkecil menjadi full-poster rasio 4:5 dengan overlay gradasi biru, informasi inti, status, dan CTA Masuk ke Competition; mobile dibatasi 360px. | AI |
| 2026-09-24 | Timeline detail event | Bagian jadwal diubah menjadi timeline horizontal bernomor yang memanfaatkan lebar layar dan otomatis menjadi vertikal di mobile; build frontend lulus. | AI |
| 2026-09-24 | Copy kategori event | Semua label kategori `lomba` yang tampil di kartu, tabel admin, dashboard, dan detail event dirender sebagai `Competition`; value internal tetap `lomba` agar filter dan data lama aman. | AI |
| 2026-09-24 | Detail event About | Bagian About pada detail event memakai heading terpusat, panel deskripsi dinamis, aksen biru, dan grid halus sesuai arah referensi; build frontend lulus. | AI |
| 2026-09-24 | Copy event | Label UI yang terlihat untuk kategori lomba diganti menjadi Competition di halaman event, admin, dashboard, landing copy, dan riwayat user. Value internal `lomba` tetap dipertahankan untuk kompatibilitas API/DB lama. | AI |

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

| 2026-09-23 | Security | Akses admin sekarang fail-closed dan dikunci ke `ADMIN_EMAIL`; konfigurasi lokal saat ini kosong sehingga email akun HIMANIKA harus ditetapkan sebelum akses admin diaktifkan kembali. Route dan UI perubahan role telah dihapus. | AI |

| 2026-09-23 | UI Admin | Menyatukan font admin ke Inter Tight/IBM Plex Mono, ukuran tombol ikon, focus ring, reduced motion, label admin HIMANIKA, dan navigasi mobile yang aksesibel. Seluruh halaman admin memakai token yang sama. | AI |

| 2026-09-23 | Security | Atas otorisasi pengguna, tiga akun database dikunci: `himanikamif.com` admin; `jajaldisek123.com` dan `krisnadewa6565.com` user. Akses admin juga dibatasi runtime oleh `ADMIN_EMAIL`. | AI |

| 2026-09-23 | UI Admin | Skala teks admin dinaikkan: teks UI minimal 14px, form control 16px, dan pilihan Individu/Tim diperbesar agar terbaca konsisten. | AI |
| 2026-09-23 | Dashboard Event | Statistik event tim dihitung dan ditampilkan hanya dalam satuan tim; event individu tetap dalam satuan peserta. | AI |
| 2026-09-23 | Integritas Event Tim | Backend mengunci perubahan mode setelah ada data; trigger PostgreSQL menolak tim pada event individu, registrasi individu pada event tim, dan member yang event-nya tidak cocok. | AI |
| 2026-09-23 | Identitas Akun & OPREC | Kolom akun NIM, jurusan, angkatan, dan avatar dihapus dari users; profil/API hanya nama-email. NIM dan tanggal lahir tetap wajib, privat, dan tersimpan hanya pada oprec_registrations. | AI |
| 2026-09-23 | Tipografi Admin | Poppins menjadi font default seluruh admin; class monospace admin juga dipetakan ke Poppins agar label, tabel, badge, dan sidebar konsisten. | AI |

| 2026-09-23 | Event dinamis | Event baru selalu draft dan membuka builder setelah Selanjutnya. Admin menyusun field pendaftaran, melihat jawaban, lalu publikasi manual; data pendaftaran dan file privat divalidasi di server. Migrasi metadata field sudah dijalankan; smoke test browser autentikasi dan viewport masih perlu sebelum rilis. | AI |

| 2026-09-23 | UX formulir event | Kode field disembunyikan dan tetap otomatis; penamaan tim dipilih lewat centang pada isian teks. Istilah editor diperjelas sebagai isian/opsi pendaftaran, tanpa konsep kunci jawaban. Build frontend lulus. | AI |

| 2026-09-23 | UX formulir event | Tanda wajib pada pratinjau formulir ditempatkan inline di samping label, bukan pada baris terpisah. | AI |

| 2026-09-23 | Poster event | URL poster unggahan baru dan lama diarahkan ke endpoint publik yang membaca disk langsung; ketergantungan pada symlink storage dihilangkan. Verifikasi HTTP browser lokal menunggu backend aktif. | AI |

| 2026-09-23 | Admin event | Panel Data Pendaftar dihapus dari builder agar builder fokus pada konfigurasi formulir; komponen respons dipertahankan untuk subhalaman sidebar khusus. | AI |

| 2026-09-24 | Alur event pengguna | Tombol Daftar mencatat enrolment idempoten dan membuka dashboard; card aktif memuat formulir individu atau aksi buat/gabung tim, lalu otomatis hilang sesudah event selesai. Migrasi `event_enrollments` dan trigger pengunci mode sudah berstatus Ran pada DB lokal; smoke test alur browser masih diperlukan sebelum deploy. Skema formulir terkunci setelah ada enrolment. | AI |

| 2026-09-24 | Detail event & guidebook | Hero detail event mengikuti referensi: poster kiri, judul/status dan tombol Daftar serta Guidebook kanan; admin bisa memilih PDF maksimal 10 MB atau link HTTPS. Migrasi kolom guidebook sudah dijalankan pada DB lokal (batch 14); verifikasi browser unggah dan buka PDF masih diperlukan. | AI |

| 2026-09-24 | Detail event Scale | Skala halaman detail event diperkecil: hero, poster, heading Tentang, panel deskripsi, timeline, dan spacing section dibuat lebih proporsional/profesional. | AI |

| 2026-09-24 | Card competition | Sudut card competition di halaman daftar event diubah menjadi kotak tanpa border radius; frame cover dan tombol Detail tetap menggunakan garis putus-putus. | AI |

| 2026-09-24 | Navigasi detail event | Link Kembali ke semua event ditata sebagai tombol kotak dengan frame putus-putus, hover state, dan focus ring keyboard. | AI |

| 2026-09-24 | Detail event Timeline Heading | Heading `Timline` dan deskripsi jadwal dipusatkan setelah label section dihapus agar komposisi section seimbang. | AI |

| 2026-09-24 | Detail event Frame | Frame putus-putus timeline dan cover poster dipertegas dengan border dashed 2px, warna biru yang lebih kontras, dan shadow ringan agar terlihat di atas grid. | AI |

| 2026-09-24 | Detail event Timeline | Judul section jadwal detail event diganti dari `Catat waktunya.` menjadi `Timline` sesuai arahan UI terbaru. | AI |

| 2026-09-24 | Detail event Section Label | Label bernomor `01 / ABOUT`, `02 / JADWAL`, `03 / PERSYARATAN`, dan `04 / HADIAH` dihapus dari detail event agar heading lebih bersih. | AI |

| 2026-09-24 | Detail event About | Label kecil `// HIMANIKA` di panel tentang event dihapus agar section langsung fokus ke deskripsi event. | AI |

| 2026-09-24 | Penanganan error admin | Migrasi guidebook pada DB aktif berhasil (batch 14). Respons API 5xx disanitasi, error API dinormalisasi di frontend, admin punya error boundary, dan kegagalan muat dashboard/event/OPREC diberi banner dengan aksi coba lagi. Tes browser seluruh jalur gagal masih diperlukan sebelum rilis; `artisan test` saat ini terhenti sebelum assertion karena migrasi lama `alter_event_dates_to_date_only` memakai SQL PostgreSQL yang tidak didukung SQLite in-memory. | AI |

| 2026-09-24 | Alur modal competition tim | Tombol Daftar pada event tim kini membuka modal Buat Tim/Join Tim. Buat tim menghasilkan kode yang dapat disalin sebelum lanjut ke dashboard; join memvalidasi kode lalu langsung membuka dashboard. Backend memakai transaksi, mengunci satu user per tim/event, mencatat enrolment dashboard, dan full suite lulus 20 test/85 assertion; typecheck serta production build frontend lulus. Migrasi tanggal lama dibuat driver-aware agar test SQLite kembali berjalan. Smoke test dialog di browser nyata lintas viewport masih perlu sebelum rilis. | AI |

| 2026-09-24 | HTM event | Admin dapat memilih Free atau Berbayar; nominal rupiah diketik sebagai digit dan diformat otomatis dengan pemisah ribuan. Backend memvalidasi `payment_type`/`htm`, migration batch 15 sudah Ran, dan card publik menampilkan `Free` atau `Bayar · Rp…` di bawah info peserta. Verifikasi lulus: backend 20 test/89 assertion, test event frontend 7/7, typecheck, dan production build. | AI |
| 2026-09-24 | Skala form admin event | Form buat/edit event dipadatkan secara scoped: label 12px, isi kontrol 14px, tinggi input 42px, kartu opsi 52px, serta panel timeline, tim, pembayaran, dan guidebook diseimbangkan. Tampilan mobile mempertahankan input 16px untuk mencegah zoom otomatis. Verifikasi typecheck dan production build lulus. | AI |

| 2026-09-24 | Kategori event | Kategori standar dirombak menjadi HI-FEST, MIC, dan IMCE; Lainnya tetap membuka input kategori kustom. Form/filter admin, filter publik, kartu/detail/dashboard, kontrak dokumentasi, dan fallback data lama diselaraskan. Data kategori lama tidak dimigrasikan dan dikelompokkan sebagai Lainnya. Verifikasi lulus: frontend event test 7/7, backend API integration 12 test/72 assertion, typecheck, dan production build. | AI |

| 2026-09-24 | Label HTM card event | Label pembayaran pada card publik diganti dari `Bayar` menjadi `HTM` dan ukuran teksnya disamakan dengan info Tim agar hierarki visual lebih profesional. Verifikasi lulus: frontend event test 7/7 dan typecheck. | AI |

| 2026-09-24 | HTM detail event | Halaman detail event user sekarang menampilkan informasi HTM di ringkasan fakta hero, memakai helper label yang sama dengan card publik. Verifikasi lulus: frontend event test 7/7 dan typecheck. | AI |

| 2026-09-24 | Card dashboard peserta | Label atas card event memakai kategori; card tim menampilkan nama, kode, serta progres anggota dari jumlah aktual terhadap maksimum dengan warna merah sebelum minimum dan hijau setelah minimum. Bagian bawah event menampilkan Free atau Unpaid; Paid disiapkan untuk status pembayaran saat konfirmasi admin tersedia. Verifikasi: typecheck frontend dan API integration 12 test/72 assertion lulus. Konfirmasi pembayaran admin dan smoke test browser masih tertunda. | AI |

| 2026-09-24 | Workspace pendaftaran & approval tim | Detail dashboard memakai panel tim/kode/anggota di kiri dan form dinamis compact di kanan. Join sekarang pending sampai diterima ketua; pending tidak dihitung. Hanya ketua dapat approve/remove; event/team row lock, deadline/admin lock, satu membership per event, serta berkas privat dijaga di BE. Submit ketua mengisi tim existing, bukan membuat tim kedua. Migrasi approval berhasil di PostgreSQL lokal, anggota lama tetap accepted. Verifikasi: backend 27 test/191 assertion, frontend event 7/7, typecheck, build, dan browser fixture Chrome 320–1440px (approve, remove/cancel, submit, pending, error/retry, reduced motion, tanpa JS exception) lulus. UI diadaptasi dari pola 21st.dev, copy/check animasi, serta ikon pqoqubbw berlisensi MIT. E2E browser sesi nyata FE–BE dan stress concurrency PostgreSQL belum diuji; konfirmasi paid admin tetap tertunda. | AI |
| 2026-09-25 | Feedback login interaktif | Halaman login kini memberi state tombol idle/loading/success/error tanpa layout shift, indikator spinner/check/error, state menghubungkan Google, serta toast animasi yang dapat ditutup dan auto-dismiss. Animasi memakai framer-motion/lucide yang sudah terpasang, mendukung keyboard, `aria-live`, `role=alert/status`, dan `prefers-reduced-motion`. Pola stateful action/toast diadaptasi dari referensi komunitas 21st.dev; tidak menambah dependency. Typecheck, diff check, dan production build lulus. Uji cookie/CSRF/login nyata tetap mengikuti gate auth. | AI |
| 2026-09-25 | Feedback autentikasi lintas halaman | State credential dan Google dipisahkan agar hanya aksi aktif yang loading. Register, lupa sandi, reset sandi, dan callback OAuth memakai panel proses terpusat, toast sukses/gagal yang lebih ekspresif, spinner/check/error, `aria-live`, serta reduced-motion melalui komponen bersama `AuthFeedbackToast`. Verifikasi typecheck, regression test frontend 9/9, dan production build lulus; uji OAuth/cookie nyata tetap mengikuti gate auth. | AI |

| 2026-09-24 | Warna status pembayaran dashboard | Status pembayaran pada card dashboard diberi tone visual: Unpaid merah, Paid hijau, dan Free netral. Verifikasi typecheck frontend lulus. | AI |
| 2026-09-25 | Interaksi autentikasi | Feedback login dibuat eksplisit per fase (memeriksa, berhasil, gagal) agar pengguna selalu mendapat sinyal saat request async berjalan; pesan backend tetap melalui normalisasi `apiErrorMessage` dan tidak menampilkan detail SQL/stack trace. | AI |
| 2026-09-25 | Skala builder formulir event | Builder `/admin/events/{id}` dipadatkan dengan hierarki tipografi dan spacing yang lebih proporsional: kartu field, input, action, preview peserta, dan empty/error state tetap rounded, diberi shadow ringan, focus state, serta animasi masuk yang berhenti pada reduced-motion. Polanya diadaptasi dari koleksi form-builder 21st.dev tanpa dependency baru. Verifikasi typecheck, diff check, dan production build lulus. | AI |
| 2026-09-25 | Hierarki builder formulir | Konflik ukuran global input 16px diperbaiki secara scoped di builder desktop. Skala kini konsisten: metadata 11–12px, label/action 12–13px, kontrol 14px, judul kartu 14px, preview 18px, dan judul event maksimal 33px; mobile tetap 16px untuk mencegah zoom. Rasio editor/pratinjau, surface panel, dan heading semantik tiap field diperbaiki. Verifikasi typecheck, test frontend 9/9, production build, dan focused diff check lulus. | AI |
| 2026-09-25 | Pratinjau builder mengikuti formulir peserta | Panel pratinjau admin kini mengikuti struktur formulir peserta: header event, keterangan model pendaftaran, label bernomor, divider antar-isian, kontrol disabled berpermukaan lembut, unggah berkas, dan CTA. Seluruhnya tetap rounded (panel 20px, kontrol/CTA 14px) agar konsisten dengan arahan admin; editor kiri tetap compact. Verifikasi typecheck, test frontend 9/9, production build, dan focused diff check lulus. | AI |
| 2026-09-25 | Posisi toast proses autentikasi | Toast loading autentikasi tidak lagi menjadi overlay layar atau membesar. Toast compact (maksimal 340px) berada di atas-tengah viewport, sedangkan toast sukses/gagal tetap memakai posisi notifikasi biasa. Aksesibilitas `aria-live`, animasi yang dapat direduksi, dan state tombol tidak diubah. Verifikasi typecheck, tes API-error 2/2, focused diff check, dan production build lulus. | AI |
| 2026-09-25 | Transisi masuk halaman autentikasi | Halaman daftar akun, lupa sandi, dan reset sandi kini memiliki urutan masuk yang ringkas untuk dekorasi, card, navigasi, heading, opsi Google, divider, field, CTA, dan tautan; semua memakai opacity/transform agar tidak menyebabkan layout shift. State sukses/error pemulihan tetap memakai animasi konteksnya sendiri. `prefers-reduced-motion` menonaktifkan seluruh motion. Verifikasi typecheck, tes API-error 2/2, focused diff check, dan production build lulus. | AI |
| 2026-09-25 | Layout pratinjau builder | Pratinjau peserta pada builder kini memakai pola field form user: dua kolom untuk isian ringkas, satu kolom penuh untuk paragraf, upload, radio, dan persetujuan. Panel admin tetap compact dan rounded; lebar preview ditambah secukupnya agar pasangan field terbaca. Di bawah 900px preview kembali satu kolom. Verifikasi typecheck, tes frontend 9/9, focused diff check, dan production build lulus. | AI |
| 2026-09-25 | Timeline event bertipe | Keputusan terakhir pengguna: urutan agenda mengikuti tanggal-jam sepenuhnya, termasuk proposal sebelum pendaftaran. Editor baru kosong, pasangan pendaftaran tak terpisahkan, batch otomatis bernomor, pilihan agenda dan Lainnya tersedia. Backend memvalidasi pasangan/urutan/awarding, menurunkan tanggal secara otoritatif, dan memakai batas jam batch terakhir pada jalur pendaftaran; publik menampilkan jam WIB. Verifikasi: backend 38 tes/278 assertion, frontend event 8 tes, dan build produksi Next.js lulus. Smoke test browser nyata serta uji transaksi tanggal di PostgreSQL masih tertunda sebelum rilis. | AI |
| 2026-09-25 | Koreksi timeline tanpa jam | Instruksi terbaru mengganti aturan jam sebelumnya: admin hanya mengisi tanggal; editor dan publik mengurutkan per tanggal. Jam lama di timeline diabaikan. Batch terakhir membuka pendaftaran pada awal tanggal buka dan menutup pada akhir tanggal tutup WIB; kontrak API dan tes diperbarui. Verifikasi: backend 38 tes/278 assertion, frontend event 8 tes, dan build produksi Next.js lulus. Smoke test browser nyata dan PostgreSQL masih tertunda. | AI |
| 2026-09-25 | Koreksi batch pendaftaran aktif | Instruksi terbaru mengoreksi aturan “batch terakhir”: selama Batch 1 belum melewati akhir tanggal tutup, status dan batas daftar memakai Batch 1. Setelah itu sistem memilih Batch 2; jika belum masuk tanggal bukanya, status `Segera dibuka`. Begitu seterusnya hingga semua batch lewat. Respons publik dan seluruh penjaga pendaftaran memakai fungsi pemilihan yang sama; tes fase dan jeda antarbatch ditambahkan. Verifikasi: backend 39 tes/290 assertion dan frontend event 8 tes lulus; build frontend sebelumnya lulus tanpa perubahan kode frontend pada koreksi ini. Smoke test browser nyata dan PostgreSQL masih tertunda. | AI |
| 2026-09-25 | Ringkasan detail per batch | Fakta Pelaksanaan di hero detail event dihapus. Label Batas daftar polos untuk satu periode, atau Batas daftar Batch N untuk banyak batch berdasarkan metadata batch acuan dari backend. Verifikasi: backend 39 tes/292 assertion, frontend event 9 tes, dan build produksi Next.js lulus. Smoke test browser nyata masih tertunda. | AI |
| 2026-09-25 | Timeline horizontal detail event | Timeline publik diubah menjadi satu baris kartu horizontal di dalam bingkai tetap; overflow bergulir di dalamnya dengan tombol panah, scrollbar, fokus keyboard, dan scroll snap. Desain mengikuti jumlah agenda tanpa memperlebar halaman. Verifikasi: frontend event 9 tes, diff check, dan build produksi Next.js lulus. Smoke test browser lintas viewport masih tertunda. | AI |
| 2026-09-25 | Timeline titik selang-seling | Keputusan desain terbaru: timeline publik berupa garis horizontal dengan titik tiap agenda dan kartu ringkas berselang-seling di atas/bawah. Bingkai dan pengguliran horizontal tetap, judul panjang dibatasi dua baris agar tinggi stabil. Verifikasi: 9 tes event frontend, build produksi Next.js, dan diff check lulus; smoke test browser lintas viewport masih tertunda. | AI |

### OPREC bertahap — 25 September 2026
- [x] Admin menambah tahap melalui popup: pilih Pendaftaran, Tes Tulis, atau Pengumuman; isi headline, jadwal, deskripsi, dan poster sebelum editor form. Pendaftaran dimulai sebagai draft dengan template identitas dan divisi.
- [x] Kartu publik dibuat melebar sesuai referensi IFEST, dengan poster di panel biru dan transisi kotak bertahap saat hover masuk/keluar. Ikon Calendar Plus dan Check memakai animasi path komponen 21st.dev; efek pixel diadaptasi dari React Bits. Build frontend lulus.
- [x] Tes tulis mempunyai editor pertanyaan, jadwal, publikasi, validasi browser/server, dan penyimpanan jawaban satu kali untuk peserta terdaftar. Soal terkunci setelah jawaban pertama.
- [x] Tahap pengumuman mempunyai metadata dan jadwal sendiri; publikasi memakai lookup hasil NIM/tanggal lahir yang sudah ada, dengan penjaga penutupan pendaftaran.
- [x] Migrasi `oprec_stages` dan `oprec_test_submissions` sudah Ran pada database lokal (batch 19); tes integrasi OPREC 1 tes/15 assertion dan suite backend 40 tes/307 assertion lulus.
- [ ] Uji integrasi lengkap untuk pilihan divisi, unggah poster, publikasi pengumuman, dan hasil aktual.
- [ ] Uji browser nyata pada mobile/desktop, keyboard, reduced motion, serta unggah poster.
- [x] Submenu Kelola OPREC memisahkan Pendaftaran, Tes Tulis, Pengumuman, dan Jawaban Tes Tulis. Tabel jawaban memakai soal dinamis, filter divisi, dialog penilaian, rata-rata dan peringkat per divisi. Migrasi tabel nilai sudah Ran pada DB lokal; 41 tes backend/328 assertion, 14 tes OPREC frontend, dan build Next.js lulus. Tes OPREC lama diselaraskan dengan periode draft yang valid.
- [ ] Provisioning dan otorisasi akun penilai khusus, termasuk pembatasan akses per periode/divisi. Saat ini hanya admin resmi yang dapat memberi nilai, tetapi struktur skor sudah memakai `reviewer_id` dan unique satu skor per penilai/jawaban.
- [ ] Smoke test browser OPREC baru pada 320–1440px, keyboard/dialog, sesi Sanctum nyata, dan uji dua penilai aktif secara bersamaan setelah akun khusus tersedia.

| 2026-09-25 | Ringkasan admin OPREC | Dua kartu ringkasan digabung menjadi satu kartu Pendaftaran yang lebih ringkas. Label teknis `STATUS: OPEN` dan `Skema v1` dihilangkan dari tampilan; headline, deskripsi, jadwal, jumlah berkas, divisi, dan tahap berikutnya diberi hierarki serta kontras teks yang jelas. Build frontend lulus; pemeriksaan visual browser masih perlu. | AI |
| 2026-09-25 | Penilaian tes OPREC | Subhalaman OPREC dan API penilaian privat ditambahkan; skor per penilai, rata-rata dan peringkat divisi dihitung server. Tabel `oprec_test_scores` bermigrasi pada DB lokal; tes backend 41/328 dan build frontend lulus. Akun penilai khusus serta smoke test browser masih tertunda. | AI |
| 2026-09-27 | Warna merah tanda wajib (*) formulir OPREC | Seluruh simbol asterisk (*) penanda kolom wajib diisi pada form builder OPREC (OprecBuilder) dan dialog tambah tahap OPREC (OprecCreateDialog) diberi warna merah tegas (#ef4444 / rose-500) melalui class scoped .oprec-builder__required dan .oprec-dialog__required. Verifikasi lulus: tes frontend 20/20 lulus dan Next.js production build lulus 26/26 routes. | AI |
| 2026-09-27 | Upload gambar/logo divisi OPREC | Input teks URL logo divisi (/images/divisi/...) di OprecBuilder diganti total dengan komponen upload gambar interaktif: dilengkapi tombol upload eksplisit "Pilih Berkas" (.oprec-builder__logo-pick-btn), drag-and-drop & file picker, batas 5MB, format JPG/PNG/WebP, endpoint backend POST /api/admin/oprec/upload-logo, thumbnail pratinjau 32x32px, nama logo mono, tombol Ganti & Hapus, serta rendering dinamis di Live Preview. Dropzone poster juga dilengkapi tombol "Pilih Berkas Poster". Verifikasi lulus: tes frontend 20/20, backend Oprec 4 test/32 assertions, dan Next.js production build 26/26 routes. | AI |
| 2026-09-27 | Perombakan OPREC: Pendaftaran Tunggal Tanpa Tahapan Terpisah | Seluruh alur OPREC dirombak untuk murni mengelola pendaftaran periode rekrutmen: modal tambah tahap 3-opsi (Pendaftaran, Tes tulis, Pengumuman) diganti langsung dengan formulir Buat Pendaftaran Baru; bagian tahapan berikutnya di overview admin dihilangkan; submenu sidebar dihilangkan agar Kelola OPREC mengarah langsung ke /admin/oprec; deadcode frontend (test, announcement, stages form, OprecStageOverview, OprecTestBuilder, oprec-review.css) dan deadcode backend (OprecStageController, OprecTestController, OprecStagesTest, dan route stages) dihapus tuntas. Verifikasi: 40 tes backend (307 assertions) lulus 100%, dan Next.js production build 24/24 routes lulus tanpa error. | AI |
