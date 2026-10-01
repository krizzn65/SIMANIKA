# Rincian audit, perbaikan, dan pembersihan OPREC

Tanggal laporan: **2 Oktober 2026**. Proyek: **SIMANIKA**.

## 1. Status pekerjaan

Perbaikan dalam cakupan audit telah diterapkan dan pemeriksaan lokal yang dijalankan lulus. Verifikasi integrasi pada staging masih diperlukan untuk sesi/CSRF antar-origin, penyimpanan berkas aktual, dan kiriman serentak pada PostgreSQL.

Hasil pengujian menunjukkan perilaku yang diperiksa bekerja pada lingkungan pengujian. Laporan ini tidak menyatakan bahwa sistem bebas seluruh celah atau bahwa konfigurasi produksi sudah terverifikasi.

## 2. Cakupan dan batas

Audit mencakup pendaftaran, Tes Tulis, Penilaian, dan Pengumuman OPREC pada frontend, proxy Next.js, serta backend Laravel. Peran yang diperiksa adalah Super Admin, Admin, Pengurus, pengguna biasa, dan pengunjung tanpa sesi.

- Role KWU tidak diubah dan tidak dilibatkan dalam matriks otorisasi audit ini.
- Tidak mengubah data produksi, melakukan deployment, atau menjalankan migrasi pada database aplikasi dalam audit ini.
- Perubahan pada kode bersama dibatasi pada kebutuhan OPREC.
- Migrasi historis, lisensi, dan endpoint kompatibilitas tetap dipertahankan.
- Pengujian backend menggunakan database SQLite in-memory; browser menggunakan data/API sintetis dan profil terisolasi.

## 3. Hak akses akhir

| Kemampuan | Super Admin | Admin | Pengurus | Pengguna biasa |
| --- | --- | --- | --- | --- |
| Membaca ringkasan OPREC | Ya | Ya | Ya | Melalui halaman publik/peserta |
| Mengelola pendaftaran, tes, pengumuman | Ya | Ya | Tidak | Tidak |
| Menugaskan/mencabut penilai | Ya | Tidak | Tidak | Tidak |
| Membaca peserta, jawaban, berkas penilaian | Ya | Ya | Hanya periode yang ditugaskan | Hanya data sendiri melalui alur peserta |
| Memberikan nilai | Ya | Tidak | Hanya periode yang ditugaskan | Tidak |
| Menentukan keputusan akhir | Ya | Tidak | Tidak | Tidak |
| Membaca hasil pribadi | Sesuai alur dan waktu rilis | Sesuai alur dan waktu rilis | Sesuai alur dan waktu rilis | Setelah rilis sesuai verifikasi |

Pengurus menggunakan endpoint Penilaian untuk akses peserta, jawaban, dan berkas setelah ditugaskan. Endpoint pengelolaan peserta/berkas lama tetap ditolak untuk Pengurus meskipun sudah ditugaskan. Pencabutan penugasan menolak permintaan berikutnya; nilai historis tidak dihapus.

## 4. Temuan dan perbaikan

### 4.1. Pengurus dapat melewati pembatasan penugasan

**Temuan:** akses pada jalur admin OPREC terlalu luas sehingga endpoint pengelolaan dan peserta/berkas lama dapat menjadi jalan pintas di luar pemeriksaan penugasan.

**Perbaikan:** middleware khusus OPREC membatasi jalur backend. Frontend memakai daftar halaman Pengurus yang diperbolehkan dan menyembunyikan operasi tambah, ubah, serta hapus. Editor langsung juga ditolak.

**Bukti:** regresi akses API mencakup sebelum penugasan, setelah penugasan, dan setelah pencabutan, termasuk akses berkas dan pemberian nilai. Browser memeriksa halaman Pengurus hanya baca tanpa permintaan tersembunyi ke endpoint peserta pengelolaan.

### 4.2. Ringkasan pengumuman mengirim data yang terlalu luas

**Temuan:** respons pengumuman admin dapat mengirim daftar peserta diterima dan tautan grup kepada Pengurus tanpa pembatasan yang sesuai.

**Perbaikan:** respons menambahkan `can_read_participants`. Pengurus tanpa penugasan memperoleh pagination peserta kosong dan pemberitahuan UI. Tautan undangan tidak dikirim kepada Pengurus. Ringkasan Tes Tulis juga tidak mengirim `form_fields` kepada Pengurus dan tidak menawarkan pembuatan tes.

**Bukti:** regresi memeriksa respons sebelum/sesudah penugasan, daftar peserta, serta tidak adanya undangan penerimaan pada respons Pengurus.

### 4.3. Jawaban pertanyaan divisi yang tidak dipilih tetap dapat disimpan

**Temuan:** aturan `nullable` tidak cukup untuk membuang jawaban field divisi yang tidak berlaku; kiriman langsung dapat berisi nilai atau struktur yang tidak sesuai.

**Perbaikan:** Laravel menggunakan aturan `exclude` untuk field tersebut. Proxy Next.js menyaringnya dengan `isFieldApplicable` sebelum meneruskan data.

**Bukti:** pengujian memastikan field divisi tidak aktif dikeluarkan dari penyimpanan, termasuk kiriman dengan struktur yang tidak semestinya.

### 4.4. Pilihan jabatan dan tiga divisi belum konsisten

**Temuan:** jabatan yang dikirim belum divalidasi terhadap divisi pilihannya. Pemeriksaan browser juga menemukan bahwa validasi tiga divisi dapat terlewati ketika skema tidak lagi memuat field divisi lama dan request tidak menyertakan kunci pilihan divisi.

**Perbaikan:** backend dan frontend memeriksa jabatan terhadap daftar jabatan divisi yang dipilih. Frontend tetap mewajibkan tiga divisi valid dan berbeda walaupun field lama tidak ada. Kompatibilitas jabatan opsional pada formulir lama dipertahankan.

**Bukti:** tes mencakup jabatan tidak valid, pilihan divisi tidak lengkap, dan skema tanpa field legacy.

### 4.5. Validasi tanggal lahir berbeda pada batas hari WIB

**Temuan:** pembandingan frontend berbasis UTC dapat memberikan hasil yang berbeda dari tanggal kalender WIB.

**Perbaikan:** validasi tanggal memakai tanggal WIB. Batas tanggal minimum pendaftaran dan koreksi admin diselaraskan menjadi `1900-01-01`.

**Bukti:** tes frontend mencakup validasi tanggal dan pergantian hari WIB.

### 4.6. Enrollment dan submit memerlukan pemeriksaan konsisten dalam transaksi

**Temuan:** enrollment berpotensi berjalan bersamaan dengan perubahan status atau submit. Form yang masih terbuka juga perlu ditolak jika skema/divisi berubah sebelum penyimpanan.

**Perbaikan:** enrollment memakai transaksi dan `lockForUpdate` pada periode. Submit memeriksa kembali status, jadwal, versi/skema formulir, serta snapshot divisi dalam transaksi sebelum menyimpan.

**Bukti:** regresi mencakup enrollment idempoten, skema kedaluwarsa, dan pendaftaran ganda. Efektivitas row lock terhadap kiriman serentak PostgreSQL masih perlu diuji di staging.

### 4.7. Koreksi NIM duplikat menghasilkan error server

**Temuan:** pelanggaran keunikan NIM saat koreksi admin dapat menjadi respons 500.

**Perbaikan:** tangkap `UniqueConstraintViolationException`, rollback transaksi, lalu kembalikan respons konflik 409.

**Bukti:** regresi koreksi NIM duplikat memeriksa respons 409 dan konsistensi data.

### 4.8. Penghapusan peserta meninggalkan berkas Tes Tulis

**Temuan:** cascade database menghapus record tes, tetapi berkas privat Tes Tulis dapat tertinggal di storage.

**Perbaikan:** kumpulkan path berkas tes dengan pembatasan prefix yang aman sebelum menghapus record. Setelah transaksi berhasil, hapus berkas tes bersama berkas pendaftaran.

**Bukti:** regresi menggunakan storage fake dan memeriksa pembersihan kedua jenis berkas.

### 4.9. Aturan rilis hasil dan respons workspace perlu diselaraskan

**Temuan:** workspace/dashboard dapat memperlakukan periode draft sebagai hasil yang sudah tersedia. Respons request workspace yang dibatalkan juga berpotensi menimpa data dari request lebih baru.

**Perbaikan:** workspace/dashboard memakai aturan rilis bersama `OprecAnnouncementService::released`, yang mengecualikan draft. Frontend memeriksa status pembatalan setelah respons API diterima.

**Bukti:** tes memeriksa hasil tidak terbuka pada draft dan alur pending sampai waktu rilis. Browser memeriksa hasil, refresh, dan sesi kedaluwarsa.

### 4.10. Batas upload perlu ditegakkan di backend

**Perbaikan:** batas gabungan berkas **11 MB** diperiksa pada pendaftaran dan Tes Tulis. Tes Tulis menolak request dengan `Content-Length` lebih dari **12 MB**. Validasi MIME dan ukuran per field tetap diberlakukan oleh Laravel.

**Bukti:** tes memakai berkas dengan isi nyata untuk memeriksa MIME palsu, ukuran berlebih, unggahan valid, serta pembersihan unggahan baru pada submit duplikat tanpa menghapus berkas asli.

### 4.11. Rate limit antar peserta dapat saling mengganggu

**Temuan:** pembatas berbasis IP/email formulir kurang sesuai untuk kiriman melalui proxy bersama; peserta dapat berbagi IP proxy dan email formulir dapat diubah.

**Perbaikan:** tiga jalur OPREC—enrollment, pendaftaran, dan Tes Tulis—memakai limiter `oprec-submission`: **10 permintaan per menit per akun terautentikasi**.

**Bukti:** mengganti email formulir tidak melewati batas akun; akun kedua dengan IP sama tetap dapat melakukan kiriman.

### 4.12. Kenaikan versi skema dapat melewati penguncian pengumuman

**Temuan:** perubahan `form_fields` setelah penjadwalan pengumuman dapat lolos melalui perubahan versi skema.

**Perbaikan:** perubahan formulir ditolak dengan 422 saat pengumuman sudah dijadwalkan, termasuk saat versi dinaikkan. Penguncian nilai, keputusan, dan penghapusan yang sudah ada dipertahankan.

**Bukti:** regresi memeriksa respons 422 dan skema lama tetap tersimpan.

## 5. Kontrak API dan respons UI

Endpoint yang digunakan aplikasi tetap dipertahankan. Perubahan yang perlu diketahui pemanggil:

| Perubahan | Perilaku akhir |
| --- | --- |
| `can_read_participants` pada respons pengumuman admin | Field tambahan untuk menampilkan izin akses peserta |
| Pengurus pada jalur pengelolaan lama | Ditolak 403; gunakan alur Penilaian pada periode penugasan |
| Koreksi NIM duplikat | Konflik 409, dengan rollback |
| Field/skema tidak valid atau terkunci | Ditolak sesuai validasi; perubahan formulir terkunci menghasilkan 422 |
| Rate limit kiriman OPREC | 429 setelah batas akun tercapai |
| Request Tes Tulis terlalu besar | 413 untuk `Content-Length` di atas batas |
| Ringkasan Pengurus | Tidak memuat undangan grup atau skema soal yang tidak diperlukan |

UI menampilkan kondisi hanya baca, kebutuhan penugasan, validasi kiriman, dan kesempatan mencoba ulang ketika API gagal. Halaman hasil mempertahankan cookie tiket HttpOnly yang terbatas pada periode dan tidak menampilkan undangan bagi peserta ditolak.

## 6. Pembersihan unused/dead code

Yang dihapus dalam audit ini: import ikon **`AlertCircle`** yang tidak digunakan pada [OprecWorkspace.jsx](../frontend/src/app/dashboard/oprec/OprecWorkspace.jsx).

Inventaris referensi import/deklarasi OPREC diperiksa lintas sumber, termasuk entrypoint routing otomatis dan penggunaan dinamis. Tidak ada helper atau komponen lain yang terbukti aman dihapus dalam audit ini. Selector dinamis, migrasi historis, lisensi, dan endpoint kompatibilitas dipertahankan.

Pembersihan dilakukan berdasarkan bukti tidak digunakan, bukan sekadar karena kode jarang terlihat pada alur yang diuji.

## 7. Lokasi implementasi dan bukti

Lokasi utama perubahan backend:

- [OprecAccessMiddleware.php](../backend/app/Http/Middleware/OprecAccessMiddleware.php): pembatas jalur OPREC.
- [routes/api.php](../backend/routes/api.php) dan [AppServiceProvider.php](../backend/app/Providers/AppServiceProvider.php): middleware dan limiter kiriman OPREC.
- Controller admin OPREC: [OprecController.php](../backend/app/Http/Controllers/Admin/OprecController.php), [OprecRegistrantController.php](../backend/app/Http/Controllers/Admin/OprecRegistrantController.php), [OprecWrittenTestController.php](../backend/app/Http/Controllers/Admin/OprecWrittenTestController.php), [OprecAnnouncementController.php](../backend/app/Http/Controllers/Admin/OprecAnnouncementController.php).
- Controller peserta: [OprecEnrollmentController.php](../backend/app/Http/Controllers/User/OprecEnrollmentController.php), [OprecRegistrationController.php](../backend/app/Http/Controllers/User/OprecRegistrationController.php), [OprecWrittenTestController.php](../backend/app/Http/Controllers/User/OprecWrittenTestController.php), [OprecWorkspaceController.php](../backend/app/Http/Controllers/User/OprecWorkspaceController.php), dan cabang OPREC pada [DashboardController.php](../backend/app/Http/Controllers/User/DashboardController.php).
- [SaveOprecRequest.php](../backend/app/Http/Requests/Oprec/SaveOprecRequest.php), [OprecResource.php](../backend/app/Http/Resources/OprecResource.php), [OprecWrittenTestAnswers.php](../backend/app/Support/OprecWrittenTestAnswers.php).

Lokasi utama perubahan frontend:

- [oprec.js](../frontend/src/lib/oprec.js), [roleAccess.js](../frontend/src/lib/roleAccess.js), dan [oprecSubmission.js](../frontend/src/services/oprecSubmission.js): validasi, izin halaman, dan penyaringan kiriman.
- Halaman admin [pendaftaran](../frontend/src/app/admin/oprec/page.jsx), [Tes Tulis](../frontend/src/app/admin/oprec/test/page.jsx), dan [pengumuman](../frontend/src/app/admin/oprec/pengumuman/page.jsx).
- [OprecWorkspace.jsx](../frontend/src/app/dashboard/oprec/OprecWorkspace.jsx): pemulihan request dan pembersihan import.

Bukti regresi:

- [OprecAccessAuditTest.php](../backend/tests/Feature/OprecAccessAuditTest.php): delapan tes audit backend baru.
- [OprecAnnouncementTest.php](../backend/tests/Feature/OprecAnnouncementTest.php): fixture Pengurus disesuaikan dengan penugasan yang wajib.
- [oprec.test.mjs](../frontend/tests/oprec.test.mjs), [oprec-submission.test.mjs](../frontend/tests/oprec-submission.test.mjs), dan [oprec-access.test.mjs](../frontend/tests/oprec-access.test.mjs).
- [oprec-user.browser.cjs](../frontend/tests/oprec-user.browser.cjs): perjalanan peserta dan Pengurus melalui production Next dengan backend sintetis.

## 8. Hasil pengujian

| Pemeriksaan | Hasil |
| --- | --- |
| Baseline frontend OPREC | 27 tes lulus |
| Baseline backend OPREC | 32 tes, 371 assertion lulus |
| Suite frontend akhir | 44 tes lulus |
| Suite backend akhir | 82 tes, 837 assertion lulus |
| Typecheck frontend | Lulus |
| Production build Next.js dengan webpack | Lulus; 27 halaman statis |
| Pemeriksaan whitespace diff | `git diff --check` lulus pada verifikasi implementasi |
| Browser peserta/Pengurus | Lulus pada 320, 390, 768, 1440 px |
| Browser Penilaian dan Pengumuman admin | Lulus pada 320, 390, 768, 1280, 1440 px |
| Browser Pengumuman publik | Lulus pada lima viewport yang sama dengan pengumuman admin |

### Skenario backend

- Akses langsung Pengurus sebelum penugasan, sesudah penugasan, dan setelah pencabutan; nilai historis tetap tersedia bagi pihak berwenang.
- Admin tidak dapat memberi nilai atau menetapkan keputusan akhir; pengguna biasa tidak dapat masuk API admin.
- Pengguna tanpa sesi ditolak pada endpoint privat; login diuji pada aplikasi Laravel testing.
- Enrollment idempoten, skema lama, pilihan jabatan tidak valid, field divisi tidak aktif, dan pendaftaran duplikat.
- Workspace/jawaban peserta dibatasi pada kepemilikan; field tes tidak dikenal dan submit tes ganda ditolak.
- Perjalanan pendaftaran, tes, keputusan Super Admin, penjadwalan pengumuman, pending, rilis, dan hasil melalui tiket.
- Koreksi NIM duplikat, MIME upload, ukuran berkas, pembersihan storage, limiter per akun, dan penguncian formulir.

### Skenario browser

- Mengisi identitas dan NIM kapital, validasi divisi tidak lengkap, unggah CV, kegagalan API 503, dan retry pendaftaran.
- Kegagalan Tes Tulis 503, retry, lalu refresh dengan status sudah dikirim dan hanya baca.
- Hasil diterima menampilkan undangan; hasil ditolak tidak menampilkannya; sesi kedaluwarsa mengarah ke login.
- Cookie hasil HttpOnly terbatas pada path periode, refresh hasil, dan identitas/poster tidak berada di URL.
- Countdown membuka hasil pada waktu rilis tanpa polling API setiap detik.
- Penilaian: autosave cepat, gagal/retry, penugasan/pencabutan, respons jawaban kedaluwarsa, filter server, dan Admin hanya baca.
- Dialog: Escape, pemulihan fokus, serta tampilan mobile; tidak ditemukan overflow dokumen atau error runtime pada viewport yang diperiksa.

Skrip browser Penilaian/Pengumuman yang sudah ada dijalankan dari salinan artefak dengan port terisolasi. Perubahan salinan hanya untuk konfigurasi lingkungan; profil browser terlacak tidak digunakan.

## 9. Lingkungan dan cara mengulang

Runtime Linux Node/PHP tidak tersedia langsung pada shell awal. Pengujian berhasil memakai runtime Windows melalui eksekusi di luar sandbox: **Node 22.19.0**, **PHP 8.4.12**, dan **Next.js 16.3.5**. Ekstensi PHP diarahkan dengan argumen proses tanpa mengubah konfigurasi sistem.

Pada lingkungan dengan runtime dan dependensi tersedia, jalankan dari direktori yang disebutkan:

```bash
# Dari backend; gunakan konfigurasi testing, bukan database aplikasi.
php vendor/bin/phpunit
```

```bash
# Dari frontend.
node --test tests/*.test.mjs
npm run typecheck
npm run build
node tests/oprec-user.browser.cjs
```

Pengujian browser peserta memerlukan Chrome yang dapat dijalankan; path dapat disesuaikan melalui `CHROME_PATH`. Skrip memulai production Next dan API sintetis pada port pengujian serta memakai profil browser terisolasi. Skrip browser lama memiliki kebutuhan server/port tersendiri; jangan menganggap semuanya dapat dijalankan tanpa menyiapkan fixture tersebut.

Pengujian login Laravel memakai aplikasi testing. Browser memakai sesi fixture; pengujian ini belum membuktikan konfigurasi cookie/CSRF pada deployment antar-origin yang sesungguhnya.

## 10. Verifikasi yang masih diperlukan

- [ ] Uji staging dengan akun/data uji: login Sanctum, cookie, CSRF, sesi kedaluwarsa, dan pemulihan sesi pada origin frontend/backend terpasang.
- [ ] Uji upload, download berkas privat, kegagalan storage, dan pembersihan berkas pada storage staging aktual.
- [ ] Uji kiriman serentak dan perubahan jadwal/skema saat request berjalan pada PostgreSQL, termasuk efektivitas row lock.
- [ ] Lakukan pemeriksaan integrasi staging sebelum menyatakan kesiapan deployment.

SQLite in-memory tidak membuktikan perilaku locking PostgreSQL. API/storage sintetis tidak membuktikan konfigurasi infrastruktur aktual. Tidak dilakukan perubahan data produksi untuk menutup pemeriksaan tersebut.

## 11. Dokumentasi terkait

- [Dokumentasi teknis OPREC](../frontend/docs/oprec.md): kontrak dan perilaku fitur, termasuk keputusan audit terbaru.
- [TODO proyek](TODO.md): hasil pekerjaan dan verifikasi integrasi yang masih tertunda.

Angka pengujian pada laporan ini berasal dari verifikasi implementasi audit, bukan pengujian ulang ketika file laporan dibuat.
