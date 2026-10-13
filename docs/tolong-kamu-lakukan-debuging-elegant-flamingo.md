# Debugging OPREC lintas role — analisis terkoreksi dan pelaksanaan

Tanggal revisi: **5 Oktober 2026 (WIB)**.
Acuan: [PERATURAN_OPREC.md](PERATURAN_OPREC.md).

## Konteks dan batas pekerjaan

Dokumen ini menggantikan kesimpulan draf sebelumnya yang belum didukung bukti. Pengguna telah meminta agar analisis diperbaiki, kemudian perbaikan yang valid dieksekusi. Status hasil aktual dicatat pada bagian F; rencana tidak boleh dianggap sebagai hasil yang sudah lulus.

Cakupan: OPREC publik, peserta, Pengurus (`leader`), Admin, dan Super Admin. Role KWU/User tetap ditolak pada konsol OPREC. Pekerjaan tidak mengubah kontrak API, katalog jabatan, aturan rilis, atau data aplikasi. Instruksi terbaru pengguna mengungguli catatan historis.

Baseline OPREC dijalankan ulang sebelum perbaikan: 54 tes backend lulus/1 gagal dan 45 tes frontend lulus. Jumlah akhir pada bagian F memakai hasil eksekusi terbaru, termasuk regresi tambahan.

## A. Aturan yang harus dipertahankan

- **§2:** hanya Super Admin resmi boleh mengangkat/mencabut role Pengurus dan mengubah role akun lain. Diterima OPREC tidak otomatis mengubah role akun.
- **§3 dan §10.1:** Admin dapat mengelola pendaftaran/tes/pengumuman, tetapi Penilaian hanya baca. Pengurus hanya menilai pada periode penugasannya dan memakai endpoint `assessment`; jalur peserta/berkas pengelolaan lama tetap ditolak.
- **§7:** katalog pendaftaran BPH tetap Wakil Ketua Umum, Sekretaris 2, Bendahara 2; divisi lain hanya staf umum. Katalog penerimaan terpisah. Accessor `OprecDivision::getJabatanAttribute()` yang menurunkan katalog dari nama divisi adalah penegakan aturan, bukan kode mati.
- **§11:** keputusan Terima/Tolak dan divisi/jabatan penerimaan hanya milik Super Admin. Endpoint keputusan lama tetap dipertahankan dan memanggil layanan keputusan yang sama.
- **§12.2:** nilai, komentar, keputusan, penugasan, serta koreksi/skema formulir terkunci sejak pengumuman dipublikasikan/dijadwalkan. Metadata pengumuman terkunci saat rilis.
- **§12.3:** alur hasil tiket untuk pengumuman baru dan kompatibilitas hasil historis tetap dipertahankan. Delegasi `PublicOprecController::result()` ke verifikasi baru bukan alasan menghapus endpoint.
- **§15:** tabel/migrasi/kolom historis dan query kompatibilitas tidak dibuang tanpa bukti serta pemeriksaan data. Data simulasi tetap dipertahankan sampai pengguna secara khusus meminta pembersihannya.
- Pasangan penamaan snake_case/camelCase dan route redirect bookmark lama tetap didukung. Export helper yang dipakai runtime atau tes bukan kode mati.

## B. Temuan dan tindakan yang dipilih

### B1 — Fixture waktu Tes Tulis bergantung pada tanggal komputer

Sumber: [OprecAnnouncementTest.php](../backend/tests/Feature/OprecAnnouncementTest.php), metode `test_utc_and_wib_schedule_inputs_keep_the_same_instant_after_reload`.

Draf lama membuat fixture relatif terhadap waktu komputer, kemudian memindahkan waktu tes ke `2026-10-02T17:00:00+07:00`. Jika tanggal tutup fixture berada setelah waktu simulasi itu, syarat Tes Tulis selesai gagal. Ini masalah determinisme tes; pemeriksaan waktu pada kode produksi harus tetap berlaku.

Tindakan: tetapkan waktu simulasi sebelum membuat fixture. Pertahankan pemeriksaan instan UTC/WIB, satu detik sebelum rilis, tepat saat rilis, dan penguncian setelah rilis. Batas tanggal kegagalan bergantung pada jam/zona yang digunakan; jangan menyatakan tanggal kegagalan permanen tanpa syarat tersebut.

### B2 — Penguatan guard penyimpanan builder

Sumber: [OprecBuilder.jsx](../frontend/src/app/admin/oprec/OprecBuilder.jsx), fungsi `save()`.

Tombol sudah memakai `disabled={busy}`, sedangkan fungsi belum mempunyai guard sinkron untuk pemanggilan ulang ketika request masih berjalan. Pembaruan state React yang tidak langsung tersedia bukan bukti bahwa dua klik pengguna pasti menghasilkan dua request.

Nama periode sudah dilindungi validasi unik dan indeks unik database. Dua request dengan periode yang sama tidak boleh dianggap dapat membuat dua periode identik. Request kedua dapat ditolak oleh validasi/constraint; status error saat balapan perlu dibuktikan, bukan diasumsikan selalu 422.

Tindakan: tambahkan guard `useRef` di awal fungsi dan lepaskan melalui `finally`, termasuk ketika persiapan payload gagal. Pertahankan state loading, validasi, error, dan retry. Verifikasi pemanggilan berulang saat request ditahan, serta penyimpanan kembali setelah gagal.

### B3 — Lengkapi cakupan endpoint keputusan lama

Sumber: [OprecAssessmentTest.php](../backend/tests/Feature/OprecAssessmentTest.php), metode `test_only_super_admin_decides_and_publication_locks_all_writes`.

Klaim sebelumnya bahwa endpoint lama belum mempunyai tes adalah **keliru**. Tes tersebut sudah memanggil `putJson($legacy, $payload)` dan memastikan Admin mendapat 403. Pengujian endpoint keputusan baru tidak otomatis membuktikan seluruh cabang endpoint lama.

Tindakan: tambahkan regresi endpoint lama untuk Pengurus sebelum/sesudah penugasan, KWU/User, Super Admin dengan data valid, divisi di luar pilihan/periode, jabatan di luar katalog, audit perubahan, dan lock setelah pengumuman dijadwalkan. Admin 403 tetap diperiksa. Jangan menghapus endpoint atau melonggarkan service keputusan.

### B4 — Query pembersihan historis dipertahankan

Sumber: [OprecSimulationCleanup.php](../backend/app/Services/OprecSimulationCleanup.php).

Tidak ditemukan penulis `file_uploads.owner_type = oprec` pada alur OPREC saat ini; path unggahan baru disimpan di JSON pendaftaran. Temuan ini **tidak membuktikan** bahwa tabel tidak mempunyai baris historis, impor, atau data yang dibuat oleh alat lain.

Tindakan: **tidak menghapus query** yang membersihkan baris terkait ID pendaftaran simulasi. Ini bukan kode mati yang sudah terbukti. Audit data hanya-baca dan regresi atas baris historis diperlukan sebelum mempertimbangkan perubahan berikutnya. Menjalankan tes cleanup dengan storage/database testing tidak mengotorisasi pembersihan data simulasi aplikasi.

### B5 — Penomoran pratinjau dipertahankan

Sumber: [OprecBuilder.jsx](../frontend/src/app/admin/oprec/OprecBuilder.jsx), penyaringan pertanyaan tambahan sebelum `renderPreviewField()`.

Indeks setelah penyaringan memberikan nomor yang runut untuk pertanyaan yang tampil. Nomor cadangan hanya terlihat ketika label kosong; formulir peserta memakai label, tanpa kebutuhan mempertahankan nomor indeks skema tersembunyi. Contoh patch draf lama memakai indeks sebelum filter, sehingga nomor bisa melompat dan bertentangan dengan target verifikasi runut di dokumen yang sama.

Tindakan: **tidak menerapkan patch penomoran**. Periksa bahwa pertanyaan, label, urutan relatif, dan sasaran divisi cocok dengan formulir peserta. §9.1 membahas pratinjau Tes Tulis; aturan yang langsung relevan untuk pratinjau pendaftaran adalah §14. Jangan mengubah renderer Tes Tulis atas dasar temuan ini.

### B6 — Satukan katalog logo default

Sumber: [OprecBuilder.jsx](../frontend/src/app/admin/oprec/OprecBuilder.jsx) dan [OprecForm.jsx](../frontend/src/components/oprec/OprecForm.jsx).

Katalog logo default sama didefinisikan dua kali. Ini refactoring kecil untuk menjaga konsistensi, bukan bug keamanan atau pelanggaran aturan yang sudah terbukti.

Tindakan: pindahkan konstanta ke [lib/oprec.js](../frontend/src/lib/oprec.js) dan gunakan import bersama. Pertahankan semua nilai/fallback dan prioritas logo admin; jangan menambah aset atau mengubah katalog jabatan.

### B7 — Validasi identitas pada koreksi Admin

Sumber: [admin/oprec/page.jsx](../frontend/src/app/admin/oprec/page.jsx), `handleSaveRegistrant()`.

Sebelumnya klien hanya memeriksa tiga divisi berbeda sebelum menyimpan. Backend sudah memvalidasi NIM dan tanggal lahir. Menambahkan pemeriksaan klien memperjelas feedback tanpa mengganti otoritas backend.

Tindakan: gunakan `oprecNimError()`, `normalizeOprecNim()`, dan `validBirthDate()` bersama. Tolak NIM kosong/invalid dan tanggal lahir tidak sah sebelum request; tampilkan pesan dekat field dengan `aria-invalid`/`aria-describedby`. Batas tanggal tetap 1900 sampai hari berjalan WIB. Saat error server terjadi, pertahankan isian dan kesempatan retry. Jangan mengubah status keputusan atau berkas lewat koreksi JSON.

## C. Yang tidak termasuk perubahan

- Penambahan jalur tulis untuk `catatan` tidak diminta dan tidak dilaksanakan. Kolom serta pembacaan historisnya tetap dipertahankan; kewenangan fitur baru perlu dirancang terpisah.
- Optimasi `pg_trgm` ditunda sampai ada pengukuran query/beban. Penggunaan `LIKE` saja tidak membuktikan execution plan tertentu tanpa `EXPLAIN`.
- Tidak menghapus/mengubah endpoint, migrasi, skema database, atau dependency.
- Tidak membuka penilaian/keputusan setelah publikasi, tidak mengangkat akun otomatis, dan tidak memberi Pengurus izin pengelolaan.

## D. Urutan pelaksanaan

1. Revisi analisis dan ambil baseline tes sebelum perubahan.
2. Perbaiki B1 agar waktu fixture deterministik.
3. Lengkapi regresi B3 untuk keputusan lama dan pertahanan aturan.
4. Terapkan B2, B6, dan B7.
5. Jalankan tes backend, tes frontend, typecheck, build produksi, dan regresi browser yang relevan.
6. Periksa diff dan catat hasil aktual serta batas verifikasi di dokumen ini dan `TODO.md`.

B4/B5 selesai ditinjau dengan keputusan mempertahankan perilaku saat ini; keduanya bukan pekerjaan penghapusan/perubahan yang masih harus dieksekusi.

## E. Kriteria verifikasi

- Baseline backend memakai `php artisan test --filter=Oprec`; setelah perbaikan, jalankan suite penuh. Database pengujian adalah SQLite in-memory, bukan database aplikasi.
- Frontend memakai `node --test tests/*.test.mjs`, `npm run typecheck`, dan `npm run build`. Targetnya semua tes aktual lulus; jangan mengunci target pada jumlah tes sebelum regresi tambahan.
- B1 memeriksa UTC/WIB tetap menunjukkan instan yang sama dan akses tetap tertutup sebelum rilis.
- B2 menguji request yang ditahan, pemanggilan berulang, error, dan retry. Jumlah request dicek langsung; tidak menyimpulkan duplikasi baris dari ketiadaan guard saja.
- B3 memeriksa role, divisi/jabatan, status/audit tersimpan, dan penolakan setelah jadwal publikasi lewat endpoint lama.
- B6 memeriksa logo tetap sama pada builder/pratinjau/peserta; B7 memeriksa pesan inline dan tidak adanya request untuk identitas invalid, lalu penyimpanan valid/retry.
- Periksa route/middleware, layanan role/penugasan/keputusan/pengumuman, katalog jabatan, dan query cleanup terhadap snapshot sebelum pekerjaan. Perubahan yang diizinkan tidak mencakup file-file aturan tersebut.
- Browser menggunakan API/sesi sintetis dan profil terisolasi. Jangan memakai akun aplikasi atau profil browser terlacak untuk pemeriksaan ini.
- Kelulusan SQLite/browser fixture tidak membuktikan row lock PostgreSQL atau konfigurasi sesi/CSRF pada staging. Pemeriksaan deployment yang sudah tertunda tetap dicatat.

## F. Hasil pelaksanaan

**Selesai dieksekusi dan diverifikasi pada 5 Oktober 2026 (WIB).**

- **B1:** waktu simulasi dipasang sebelum fixture; pemeriksaan jadwal UTC/WIB serta batas rilis tetap berlaku.
- **B2:** guard sinkron `useRef` menahan penyimpanan ulang sampai request/persiapan payload selesai; `finally` membuka retry.
- **B3:** regresi endpoint keputusan lama ditambahkan untuk seluruh role, penugasan Pengurus, validasi penempatan, audit, keputusan diterima/ditolak, role peserta yang tetap `user`, dan lock saat pengumuman dijadwalkan.
- **B4/B5:** query historis dan penomoran pratinjau dipertahankan sesuai hasil analisis.
- **B6:** kedua komponen memakai `DEFAULT_DIVISION_LOGOS` bersama; nilai logo, fallback, dan prioritas logo admin tetap.
- **B7:** koreksi Admin memakai helper identitas bersama, pesan inline yang terhubung ke input, fokus field invalid, normalisasi NIM, serta retry dengan isian dipertahankan.

| Pemeriksaan | Hasil aktual |
| --- | --- |
| Baseline backend OPREC (`artisan test --filter=Oprec`) | 54 lulus, 1 gagal; 666 assertion. Kegagalan jadwal 422 berasal dari fixture waktu B1. |
| Baseline frontend (`node --test tests/*.test.mjs`) | 45 lulus. |
| Backend akhir (`artisan test --compact`) | **98 lulus, 1.034 assertion**, SQLite in-memory. |
| Frontend akhir (`node --test --test-reporter=dot tests/*.test.mjs`) | **45 lulus**. |
| Typecheck (`node node_modules/typescript/bin/tsc --noEmit`) | Lulus. |
| Build produksi (`node node_modules/next/dist/bin/next build --webpack`) | Lulus; kompilasi, TypeScript, dan 27 halaman statis selesai. |
| Browser (`node tests/oprec-user.browser.cjs --admin-forms-only`) | Lulus: klik berulang dengan request ditahan menghasilkan satu request; gagal/retry builder; NIM invalid dan tanggal kosong/sebelum 1900/masa depan tidak mengirim request; pesan inline, fokus, `aria-invalid`, normalisasi NIM, koreksi gagal/retry; 320/390/768/1440 px tanpa overflow. |
| Browser (`node tests/oprec-user.browser.cjs --positions-only`) | Lulus: katalog tetap pada editor/pratinjau/peserta, logo default/fallback sama, tanpa kontrol jabatan bebas; 320/390/768/1440 px tanpa overflow. |
| Diff dan referensi dokumen | Tidak ada whitespace error; tautan relatif valid. Route API, model User/divisi, layanan penilaian/pengumuman, dan layanan cleanup sama dengan snapshot awal pekerjaan. |

Runtime lokal memakai executable PHP/Node Windows dari WSL. Browser menjalankan build produksi dengan API/sesi sintetis dan profil Chrome terisolasi. Tidak menjalankan migrasi, pembersihan simulasi, atau perubahan akun/data aplikasi.

Verifikasi staging yang sudah tercatat pada [TODO.md](TODO.md) tetap terpisah: sesi Sanctum/cookie/CSRF antar-origin, berkas aktual, dan concurrency/row lock PostgreSQL tidak dibuktikan oleh SQLite maupun fixture browser. Hasil ini menyelesaikan perbaikan dalam cakupan dokumen; bukan klaim deployment staging sudah diuji.
