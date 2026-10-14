# OPREC — alur dinamis revisi 21 September 2026

## Pertanyaan bawaan dan ringkasan peserta — 15 Oktober 2026

Periode OPREC baru memiliki delapan pertanyaan wajib sebelum Divisi Pilihan: Nama lengkap, NIM, Tanggal lahir, Angkatan, Golongan (A–E), Nomor WA, unggah KTM/SIM Online, dan unggah Surat Pernyataan. Kedua berkas menerima PDF/JPG/JPEG/PNG hingga 5 MB per berkas; batas gabungan pendaftaran tetap 11 MB. Editor memakai daftar bawaan yang sama saat membuat dan memuat periode. Periode yang sudah memiliki pendaftar tetap mengikuti penguncian skema backend.

Pilihan awal Angkatan adalah 2025 dan 2026. Admin dapat mengubah pilihan Angkatan maupun Golongan, satu nilai per baris; nilai yang sudah tersimpan pada periode tetap dipertahankan saat editor dibuka kembali. Draft lama tanpa pilihan memakai daftar awal tersebut.

Bagian Data & administrasi peserta menampilkan Nama lengkap lalu NIM, jawaban lain menurut urutan formulir, dan jabatan pilihan di dalam kurung setelah divisi terkait. Respons workspace hanya mengirim nama field berkas yang diunggah untuk memberi tanda “Berkas diunggah”, tanpa mengirim path privat.

## Frame dan hover kartu pengumuman — 5 Oktober 2026

Tombol Lihat Pengumuman memakai glow merah 20 px yang menguat menjadi 26 px, naik 1 px, dan panah bergeser 3 px pada hover/fokus keyboard; durasi 200 ms mengikuti tombol pendaftaran. Efek dibatasi ke tombol kartu publik. Tombol sebelum rilis tetap nonaktif tanpa glow/gerakan, dan preferensi pengurangan animasi menonaktifkan transisi/pergeseran. Build produksi/TypeScript serta browser hover/fokus/reset, kondisi nonaktif, pengurangan animasi, dan empat viewport lulus.

Informasi jadwal kartu pengumuman ditampilkan pada dua baris: ikon kalender dengan tanggal, lalu ikon jam dengan waktu WIB. Ikon berukuran 14 px mengikuti gaya pendaftaran dengan warna merah; teks, jarak, dan alignment mengikuti baris fakta pendaftaran. Format tanggal/jam tetap memakai zona `Asia/Jakarta`. Build produksi/TypeScript dan pemeriksaan browser pada 320/390/768/1440 px lulus, termasuk dua baris terpisah dan tanpa overflow.

Kartu pengumuman publik mengikuti kartu pendaftaran: garis putus-putus 2 px, sudut kotak, bayangan kotak, aksen atas, dan sedikit terangkat saat hover/fokus. Pengumuman tetap memakai merah, sedangkan pendaftaran memakai biru. Kolom pamflet dan breakpoint 760 px mengikuti pendaftaran.

Kedua kartu memakai komponen `OprecPoster` dan stylesheet bersama. Grid sisi 20 × 9 dengan 72 blok menghilang bertahap pada hover atau fokus keyboard, disertai zoom pamflet dan judul overlay. Preferensi `prefers-reduced-motion` menonaktifkan transisi. Pamflet kosong/gagal memakai placeholder; gambar yang gagal sebelum hydration juga dideteksi setelah komponen aktif.

Verifikasi: 45 tes frontend serta build produksi/TypeScript lulus. Smoke check browser build produksi memakai API sintetis dan profil terisolasi: frame, hover/fokus/reset, pengurangan animasi, popup/pemulihan fokus, pamflet kosong/gagal, dan tombol pengumuman terjadwal lulus. Viewport 320/390/768/1280/1440 px tanpa overflow; screenshot diperiksa. Skrip dan screenshot sementara berada di `.next`, diabaikan git. Kontrak API, jadwal rilis, lookup hasil, dan kewenangan tetap mengikuti peraturan OPREC.

## Jabatan pendaftaran dan penerimaan — 3 Oktober 2026

Jabatan pendaftaran mengikuti katalog tetap: BPH menyediakan Wakil Ketua Umum, Sekretaris 2, dan Bendahara 2; divisi selain BPH hanya menyediakan `Staff Divisi {nama divisi}`. Ketua Umum, Sekretaris 1, Bendahara 1, petinggi divisi, dan bidang staf tersedia saat penerimaan. Katalog penerimaan tetap terpisah, dan jabatan penerimaan tidak harus sama dengan jabatan saat mendaftar.

Editor Admin menampilkan pilihan jabatan sebagai informasi tanpa kontrol tambah/hapus/reset. Pratinjau, formulir peserta, dan koreksi Admin memakai daftar tetap yang sama. Respons API `jabatan` selalu menurunkan katalog dari nama divisi, termasuk saat membaca metadata lama. Payload pengelolaan yang menyediakan daftar berbeda ditolak 422; daftar yang tidak dikirim memakai default. Pilihan BPH wajib diisi pada submit/koreksi, sedangkan staf umum yang tidak dikirim diisi backend secara otomatis. Jabatan lain yang dikirim ditolak, termasuk bidang staf penerimaan.

Perintah `php artisan oprec:normalize-registration-positions {period} --dry-run` memeriksa koreksi historis tanpa menulis database atau cadangan. Tanpa `--dry-run`, perintah local/testing mengunci periode, memeriksa seluruh pilihan, membuat cadangan terenkripsi pada `oprec/{period}/maintenance`, lalu memperbarui katalog dan tiga field pilihan jabatan dalam transaksi. Pemetaan BPH: Ketua Umum menjadi Wakil Ketua Umum, Sekretaris 1 menjadi Sekretaris 2, dan Bendahara 1 menjadi Bendahara 2. Divisi lain menjadi staf umum. Pemetaan BPH yang tidak dikenal atau referensi divisi yang rusak membatalkan koreksi. Pelaksanaan ulang tidak membuat perubahan atau cadangan tambahan.

Koreksi simulasi pada 3 Oktober memperbarui enam katalog dan 60 formulir; 155 dari 180 pilihan berubah. Nilai, jawaban tes, keputusan 50 diterima/10 ditolak, jabatan penerimaan, jadwal pengumuman, akun asli, modul lain, dan berkas lama tetap identik. CV dan jawaban naratif tetap menjadi dokumen historis sebelum revisi. Waktu koreksi dicatat sesuai waktu sebenarnya. Cadangan berada dalam direktori periode yang sudah tercakup oleh inventory pembersihan; manifest dan laporan privat mencatat koreksi.

Regresi backend mencakup validasi katalog dan submit, koreksi Admin, dry-run, target periode, cadangan terenkripsi, pengulangan, serta penghapusan cadangan saat pembersihan. Regresi browser `node tests/oprec-user.browser.cjs --positions-only` memeriksa editor, pratinjau, formulir peserta, dan empat viewport tanpa memakai akun/database aplikasi.

## Perbaikan perjalanan simulasi — 2 Oktober 2026

Tombol pendaftaran menunggu pemeriksaan sesi selesai. Bila pemeriksaan sesi gagal, peserta dapat mencoba pemeriksaan ulang tanpa diarahkan sebagai pengunjung yang belum login. Regresi browser terisolasi dapat dijalankan dengan `node tests/oprec-user.browser.cjs --enrollment-only`.

Editor formulir menyediakan pertanyaan/jawaban FAQ. Pertanyaan tambahan yang diubah menjadi paragraf menggunakan batas 3.000 karakter, mengikuti kontrak validasi backend. Perbandingan skema di backend mengabaikan urutan properti objek JSONB PostgreSQL, tetapi mempertahankan urutan kolom/soal dan tipe nilainya; status pendaftaran dapat ditutup tanpa menaikkan versi bila skema tidak berubah. Editor Tes Tulis menyediakan kontrol mulai–selesai dalam WIB; jadwal dapat disesuaikan bersama soal sebelum tes dimulai. Jadwal, soal, dan tombol simpan menjadi nonaktif setelah tes dimulai atau sudah ada kiriman peserta. Server tetap memeriksa lock di transaksi. Regresi editor jadwal tersedia melalui `node tests/oprec-user.browser.cjs --schedule-only`.

Detail Tes Tulis pada Penilaian mengikuti tiga pilihan divisi peserta, memakai aturan penyaringan yang sama dengan formulir peserta. Soal divisi lain tidak ditampilkan sebagai “Tidak dijawab”; soal opsional yang memang berlaku tetap terlihat. Jawaban dan tautan berkas yang tidak berlaku dikeluarkan dari respons, dan URL unduh langsungnya ditolak. Regresi API mencakup Super Admin, Admin, serta Pengurus yang ditugaskan.

Jadwal pengumuman mempertahankan offset ISO saat dikirim ke PostgreSQL. Model menormalisasi instan ke UTC dengan offset eksplisit; PostgreSQL dapat menyajikannya sesuai zona koneksi tanpa menggeser waktu rilis. Input UTC dari frontend dan input WIB menghasilkan instan yang sama setelah reload. Regresi memeriksa kerahasiaan satu detik sebelum rilis, akses pada batas rilis, serta penguncian sesudahnya. Integrasi browser PostgreSQL lokal juga memeriksa jadwal yang benar, pagination 50 penerimaan, dan penguncian nilai/keputusan.

Simulasi nyata menggunakan PostgreSQL, sesi Sanctum, upload CV PDF, dan UI aplikasi; skrip serta kredensial berada pada storage privat yang diabaikan git. Data skenario dipertahankan sampai pengguna meminta pembersihan. Perintah lokal `php artisan oprec:simulation-cleanup oprec-20261002 --dry-run` menampilkan target tanpa menghapus. Pembersihan nyata memakai manifest ID, memulihkan cadangan sandi terenkripsi bila diperlukan, menghapus relasi/account/session/file/artefak skenario, dan membandingkan checksum data akun asli serta modul lain sebelum–sesudah penghapusan. Tutup proses browser/server milik skenario sebelum menghapus direktori artefak. Perintah tersedia hanya pada local/testing dan tidak mempunyai endpoint HTTP.

Manifest juga dapat mencatat hash tiket hasil untuk menghapus cache pembatas permintaannya saat pembersihan, tanpa menyimpan tiket mentah. Cache modul lain dan pembatas IP bersama tetap dipertahankan. Dry-run serta penghapusan berulang atas cache tiket diuji pada database pengujian.

## Audit menyeluruh — 2 Oktober 2026

Keputusan terbaru pada bagian ini menggantikan hak Pengurus yang lebih luas dalam catatan lama. Audit mencakup Super Admin, Admin, Pengurus, pengguna biasa, dan pengunjung tanpa sesi. Tidak ada perubahan role KWU atau modul lain.

### Akses dan kontrak

- Super Admin mengelola OPREC, penugasan, nilai, dan keputusan akhir. Admin mengelola pendaftaran/tes/pengumuman, tetapi penilaian hanya baca dan keputusan akhir ditolak.
- Pengurus membaca ringkasan pendaftaran, jadwal tes, dan pengumuman. Peserta, jawaban, berkas, serta penilaian dibuka melalui endpoint `assessment` setelah ditugaskan pada periode tersebut; pencabutan langsung menolak akses berikutnya tanpa menghapus nilai historis.
- Endpoint pengelolaan/berkas lama tetap tersedia bagi admin untuk kompatibilitas, tetapi ditolak untuk Pengurus, termasuk Pengurus yang ditugaskan. Jalur ini tidak boleh menjadi jalan pintas terhadap penyaringan data pada Penilaian.
- `GET /api/admin/oprec/{id}/announcement` menambah `can_read_participants`; bagi Pengurus tanpa penugasan, pagination peserta kosong dan UI menjelaskan perlunya penugasan. Undangan penerimaan tidak dikirim kepada Pengurus. Ringkasan Tes Tulis tidak mengirim `form_fields` kepada Pengurus; editor frontend ditolak.
- Kiriman pendaftaran, masuk periode, dan Tes Tulis memakai rate limit khusus 10 permintaan/menit per akun. IP proxy Next dan email formulir tidak menjadi identitas pembatas, sehingga peserta berbeda tidak saling memblokir.

### Temuan yang diperbaiki

- Pengurus sebelumnya dapat memanggil operasi pengelolaan dan endpoint peserta/berkas di luar pemeriksaan penugasan. Middleware khusus OPREC membatasi jalur tersebut; tombol serta editor frontend mengikuti izin yang sama.
- Jawaban pertanyaan khusus divisi yang tidak dipilih sebelumnya memakai aturan `nullable` saja. Sekarang jawaban tersebut dikeluarkan dari validasi/penyimpanan Laravel dan tidak diteruskan proxy Next, termasuk kiriman array atau berkas palsu.
- Jabatan yang dikirim peserta divalidasi terhadap divisi pilihannya. Tiga pilihan divisi tetap divalidasi meskipun skema terbaru tidak memuat field divisi lama.
- Validasi tanggal lahir frontend menggunakan tanggal WIB, termasuk batas pergantian hari UTC. Batas tahun minimum pendaftaran dan koreksi admin diselaraskan dengan frontend.
- Submit mengulang pemeriksaan skema dan data divisi dalam transaksi; enrollment mengambil lock periode agar konsisten dengan submit. Perubahan formulir setelah pengumuman dijadwalkan ditolak, termasuk ketika versi skema dinaikkan.
- Koreksi NIM duplikat oleh admin mengembalikan 409 dengan rollback, bukan error 500. Menghapus pendaftaran juga membersihkan berkas Tes Tulis yang sebelumnya tertinggal setelah cascade database.
- Hasil di workspace/dashboard memakai aturan rilis bersama dan tidak terbuka pada periode draft. Respons workspace yang sudah dibatalkan tidak lagi menimpa data terbaru.
- Batas gabungan berkas 11 MB diperiksa di backend pendaftaran dan Tes Tulis; Tes Tulis juga menolak request dengan Content-Length di atas 12 MB.

### Pembersihan dan verifikasi

Import ikon `AlertCircle` yang tidak dipakai pada workspace peserta dihapus. Pemeriksaan referensi import/deklarasi OPREC lintas sumber tidak menemukan helper/komponen lain yang terbukti mati; entrypoint App Router, selector dinamis, migrasi historis, lisensi, dan endpoint kompatibilitas dipertahankan.

- Baseline OPREC: 27 tes frontend; 32 tes backend/371 assertion, lulus.
- Suite frontend final: 44 tes lulus. Typecheck dan production build webpack lulus.
- Suite backend final: 82 tes/837 assertion lulus. Database pengujian menggunakan SQLite in-memory; tidak menjalankan migrasi pada database aplikasi.
- Regresi baru `OprecAccessAuditTest` mencakup akses langsung Pengurus, penugasan/pencabutan, login pengguna, perjalanan pendaftaran–tes–keputusan–pengumuman, NIM duplikat, MIME isi upload, batas ukuran, pembersihan berkas, rate limit antar akun, dan penguncian skema.
- `node tests/oprec-user.browser.cjs` menjalankan Chrome terisolasi, production Next, dan API sintetis: validasi/upload pendaftaran, gagal/coba ulang, Tes Tulis gagal/coba ulang/refresh, cookie hasil HttpOnly, diterima/ditolak, sesi kedaluwarsa, dan mode Pengurus hanya baca. Halaman peserta/Pengurus diperiksa pada 320/390/768/1440 px tanpa overflow/error runtime.
- Regresi browser Penilaian dan Pengumuman admin lulus pada 320/390/768/1280/1440 px, termasuk autosave, gagal/coba ulang, penugasan/pencabutan, Escape, pemulihan fokus, dan Admin hanya baca. Skrip lama dijalankan dari salinan artefak dengan port terisolasi; tidak memakai profil browser terlacak.
- Regresi browser Pengumuman publik juga lulus dengan proxy Next nyata/API sintetis: countdown membuka hasil pada batas jadwal tanpa polling API per detik, NIM kapital, cookie HttpOnly, hasil tetap tersedia setelah refresh, tidak ada poster/identitas pada URL, dan lima viewport tanpa overflow.

Runtime Node/PHP Windows tersedia melalui eksekusi di luar sandbox; ekstensi PHP diarahkan lewat argumen proses, tanpa mengubah konfigurasi sistem. Pengujian browser memakai sesi/API fixture, sedangkan pengujian login dan otorisasi Laravel memakai aplikasi testing. Cookie/CSRF antar-origin dengan server terpasang, akses berkas aktual di staging, dan kiriman serentak dengan row lock PostgreSQL tetap memerlukan verifikasi integrasi. Kelulusan SQLite dan fixture browser tidak membuktikan kondisi produksi tersebut.

Arahan pengguna menggantikan susunan halaman lama. Urutannya hanya:

1. Headline dan penjelasan singkat (dapat diisi admin).
2. Kartu ringkas divisi.
3. Kartu pratinjau OPREC bergaya IFEST: status singkat, periode, tanggal, tombol
   detail, dan poster admin yang terlihat sebagian di belakang konten.
4. FAQ paling bawah, lalu footer bersama.

Tombol `Lihat Detail` membuka `/oprec/detail`. Di halaman detail, poster tampil
utuh berdampingan dengan area pendaftaran/pengumuman yang berganti sesuai
status. Jika belum ada periode aktif atau jadwal belum lengkap, halaman utama
menampilkan panel abu-abu `Open Recruitment belum dibuka` dengan aksen garis
bergerak, tanpa ikon, poster, atau tombol detail. Komposisi empty state diadaptasi dari
[Empty State di 21st.dev](https://21st.dev/@serafimcloud/components/empty-state)
untuk tema HIMANIKA; animasi berhenti saat `prefers-reduced-motion` aktif.
Periode yang sudah memiliki
tanggal buka di masa depan tetap menampilkan kartu agar countdown di halaman
detail dapat diakses. Pada halaman detail, poster memakai visual cadangan sampai
admin mengunggahnya.
Kartu memakai `headline`, `periode`, `tanggalBuka`, `poster`, dan status dari
respons publik admin. Status diperbarui pada batas jadwal dan ketika tab aktif.

Tidak ada section terpisah untuk benefit, timeline, persyaratan, maupun CTA penutup.
Instruksi pendaftaran dapat ditulis pada `formIntro` dan `help` tiap kolom.
Jika admin belum mengumumkan divisi untuk periode ini, enam kartu profil divisi
HIMANIKA tetap tampil dengan deskripsi singkat. Kartu tersebut tidak menandakan
pendaftaran sudah dibuka; formulir menunggu divisi periode tersedia. Saat
`divisiTersedia` ada, kartu memakai data admin. Field `namaLengkap` (atau
`nama_lengkap`) menampilkan kepanjangan nama divisi; divisi HIMANIKA yang dikenal
memakai nama lengkap lokal jika admin belum mengisinya. Field `logo` opsional;
logo WebP lokal dipakai untuk divisi yang dikenal. Jika logo belum ada, kartu
menampilkan simbol terminal. Logo tetap diam, sedangkan kartu bergerak saat
hover atau ditekan. `prefers-reduced-motion` menonaktifkan gerak kartu.

## Status dan waktu

`GET /api/public/oprec` mengembalikan `{ "data": null }` jika belum ada periode,
atau `{ "data": { ... } }` sesuai kontrak di bawah. Gunakan environment yang sama
dengan Event: `API_BASE_URL` atau `NEXT_PUBLIC_API_BASE_URL`, berakhiran `/api`.
Tanpa env, halaman menampilkan belum dibuka. HTTP gagal/JSON tidak valid menampilkan
error, bukan status kosong. Fetch memakai no-store, timeout 8 detik.

| Kondisi | Tampilan area utama |
| --- | --- |
| Tidak ada periode / tanggal belum lengkap | Belum dibuka / jadwal menyusul |
| Status open, sekarang sebelum tanggalBuka | Countdown hari, jam, menit, detik |
| Status open, tanggalBuka <= sekarang < tanggalTutup | Form dinamis |
| Admin menutup / waktu tutup telah lewat | Ditutup, menunggu pengumuman |
| Ditutup + pengumuman published dengan tanggal di masa depan | Countdown menuju pengumuman |
| Ditutup + pengumuman published dan waktunya tiba (atau tanggal null) | Form cek hasil NIM + tanggal lahir |

Pengumuman draft tidak ditampilkan meskipun tanggalnya lewat. Backend wajib
menerapkan aturan yang sama. Halaman menyegarkan data setiap 60 detik ketika tab
aktif, saat tab kembali terlihat, dan saat melewati batas jadwal. Countdown berjalan
pada komponen kecil tersendiri dan berhenti saat tab tersembunyi. Polling tidak
mereset form jika id dan schemaVersion tetap sama; perubahan schemaVersion mereset
form karena susunan kolom berubah. Jangan ubah skema periode aktif tanpa alasan.

## Contoh kontrak admin (bukan seed produksi)

```json
{
  "data": {
    "id": 1,
    "periode": "2026/2027",
    "status": "open",
    "headline": "Ambil peran.\nMulai ceritamu.",
    "deskripsi": "Penjelasan singkat rekrutmen dari admin.",
    "poster": "https://cdn.example.com/oprec/2026.webp",
    "posterAlt": "Poster rekrutmen HIMANIKA 2026/2027",
    "tanggalBuka": "2026-10-01T08:00:00+07:00",
    "tanggalTutup": "2026-10-14T23:59:00+07:00",
    "divisiTersedia": [
      { "id": 1, "nama": "Kominfo", "namaLengkap": "Komunikasi & Informasi", "deskripsi": "Penjelasan singkat divisi.", "kuota": 10 }
    ],
    "schemaVersion": "1",
    "formIntro": "Lengkapi data dengan benar. Kolom * wajib diisi.",
    "formFields": [
      { "name": "nim", "type": "text", "label": "NIM", "required": true, "maxLength": 32 },
      { "name": "tanggal_lahir", "type": "date", "label": "Tanggal lahir", "required": true },
      { "name": "nama", "type": "text", "label": "Nama lengkap", "required": true },
      { "name": "email", "type": "email", "label": "Email", "required": true },
      { "name": "divisi_pilihan_1", "type": "select", "label": "Pilihan divisi", "required": true, "options": [{ "value": "1", "label": "Kominfo" }] },
      { "name": "motivasi", "type": "textarea", "label": "Motivasi bergabung", "required": true, "maxLength": 2000 },
      { "name": "cv", "type": "file", "label": "CV", "required": true, "accept": [".pdf"], "maxSizeMB": 2 },
      { "name": "komitmen", "type": "checkbox", "label": "Saya bersedia mengikuti proses seleksi", "required": true }
    ],
    "pengumuman": { "published": false, "tanggal": "2026-10-20T08:00:00+07:00", "pesan": "" },
    "faq": [{ "pertanyaan": "Pertanyaan dari admin?", "jawaban": "Jawabannya." }]
  }
}
```

- ID wajib stabil; tanggal ISO 8601 dengan timezone, akhir setelah awal. Tampilan WIB.
- Poster lazy, object-fit contain dalam frame 3:4 supaya tidak terpotong; fallback
  jika belum ada/gagal. Disarankan WebP <=200KB. Poster tidak menentukan status.
- Kuota adalah kapasitas divisi, bukan jumlah kursi tersisa.
- `formFields`: text, email, tel, url (Link), number, date, textarea, select, radio, checkbox,
  file. Maksimal 40 field; nama unik `[a-z][a-z0-9_]*`, bukan nama reserved.
- NIM (`name: nim`, text required) wajib diawali `E31` (total 3–32 karakter;
  sisanya huruf/angka/titik/tanda hubung). Input dinormalisasi menjadi kapital di
  browser, adapter Next, dan Laravel sebelum validasi serta penyimpanan. Awalan
  yang menyimpang dari `E31` ditandai melalui field invalid dengan pesan inline
  bahwa NIM bukan dari Prodi Manajemen Informatika. Input kosong atau awalan yang
  masih mungkin menjadi `E31` (`E`, `E3`, dan `E31`) tidak menampilkan peringatan;
  adapter Next dan Laravel menolak submit dengan 422.
  Tanggal lahir (`name: tanggal_lahir`, date required) juga wajib ada untuk
  mencocokkan hasil. Kolom lain dipilih admin; tidak ada
  form dummy ketika schema kosong. NIM disimpan sebagai string (leading zero terjaga).
- `required`, `help`, `placeholder`, `maxLength`, `min`/`max` angka, `options`,
  `accept`, `maxSizeMB` ditangani. Pilihan divisi kedua dapat ditambahkan sebagai
  field select opsional; backend memvalidasi pasangan pilihan dan kuotanya.
- File dibatasi pdf/jpg/jpeg/png, maksimal 10MB per file dan total request 12MB
  (UI membatasi total berkas 11MB untuk overhead). Backend harus memvalidasi MIME/
  signature, menyimpan privat, dan menjalankan validasi schema otoritatif.
- `schemaVersion` diubah jika skema berubah, lalu dicocokkan pada submit di Next
  dan backend untuk mencegah kiriman menggunakan formulir lama.
- Snake_case diterima untuk tanggal_buka, tanggal_tutup, divisi_tersedia,
  poster_alt, schema_version, form_fields, form_intro. Teks di-escape oleh React.

## Submit pendaftaran

Browser: `POST /api/oprec/register` multipart berisi `oprec_id`, `schema_version`,
dan nama field dari admin. Route Next membaca schema terbaru, memeriksa status,
identitas periode, versi schema, tipe/pilihan/ukuran field, lalu hanya meneruskan
kolom yang diizinkan ke endpoint arsitektur `POST /api/user/oprec/register`.

Autentikasi Sanctum tetap berlaku. Next meneruskan cookie sesi dan X-XSRF-TOKEN
ke backend yang dikonfigurasi. Login frontend/backend harus menggunakan cookie
yang tersedia pada origin Next (misalnya shared SESSION_DOMAIN sesuai arsitektur).
401/419 menampilkan pesan sesi belum aktif; UI tidak menganggap data tersimpan.
Form login belum diimplementasikan oleh pekerjaan ini.

Backend memvalidasi lagi schema, status, deadline, divisi, upload, serta keunikan
NIM per periode dalam transaksi. Sukses hanya setelah tersimpan:

```json
{ "data": { "submitted": true } }
```

422: `{ "errors": { "nim": ["Pesan validasi"] } }`; 409: duplikat/versi/status
berubah; 429: rate limit. Timeout tidak di-retry otomatis untuk mencegah duplikasi.
Backend harus memastikan retry tidak membuat registrasi kedua untuk periode/NIM sama.

## Pengumuman — kontrak terbaru 30 September 2026

Subhalaman admin adalah `/admin/oprec/pengumuman`. Super Admin/Admin membuat dan memperbarui metadata; Pengurus membaca saja, KWU/User ditolak. Periode harus pernah dibuka, pendaftaran sudah ditutup, Tes Tulis selesai, ada kiriman tes, dan semua pengirim tes telah diputuskan. Peserta diterima harus mempunyai divisi dari periode yang sama dan jabatan penerimaan. Semua pemeriksaan diulang di transaksi dengan row lock periode.

Popup meminta judul, poster JPG/PNG/WebP maksimal 5 MB, tanggal-jam WIB, deskripsi, dan undangan `https://chat.whatsapp.com/...`. Metadata disimpan pada periode yang sama, sehingga tidak membuat pengumuman ganda. Penjadwalan mengunci penilaian/keputusan; metadata masih bisa diedit sebelum waktu rilis, lalu terkunci. Poster disimpan di disk privat; endpoint publik hanya melayaninya setelah rilis. Migrasi aditif `2026_09_30_000001_add_oprec_announcement_metadata` menambah judul, poster, dan tautan grup pengumuman.

Kartu merah muncul di bawah kartu Pendaftaran pada `/oprec`. Sebelum rilis, countdown hari–jam–menit–detik memakai animasi digit ke atas yang diadaptasi dari React Bits Counter, waktu server, dan fallback reduced-motion. Tidak ada polling API setiap detik: status diperiksa saat countdown berakhir atau tab kembali aktif. Primitives popup/kartu/tombol mengadaptasi shadcn/ui yang tersedia melalui 21st.dev, dengan lisensi dan sumber di `src/components/oprec/announcement/SOURCES.md`.

Browser mengirim `POST /api/oprec/result` dengan `{ oprec_id, nim, tanggal_lahir }`. Proxy Next meneruskan ke `POST /api/public/oprec/{id}/announcement/verify`. Laravel menormalisasi NIM, memeriksa jadwal dan kecocokan identitas **pengirim Tes Tulis**, kemudian menerbitkan tiket terenkripsi selama 30 menit. Identitas salah dan bukan pengirim tes sama-sama menghasilkan 404 generik. Tiket hanya disimpan dalam cookie HttpOnly, SameSite=Lax, Secure pada HTTPS, terbatas path hasil periode; respons browser hanya `{ verified: true }`. Tidak ada NIM, tanggal lahir, atau tiket pada URL/localStorage.

Halaman `/oprec/pengumuman/{id}` membaca tiket server-side melalui `POST /api/public/oprec/{id}/announcement/result` dan tetap bekerja setelah refresh selama tiket berlaku. Hasil tidak memuat poster. Peserta diterima melihat nama, NIM, divisi, jabatan, dan tautan grup; peserta ditolak mendapat pesan penyemangat tanpa tautan grup. Respons pribadi no-store, halaman noindex. Tiket palsu, kedaluwarsa, beda periode, atau pendaftaran yang tidak memenuhi syarat ditolak. Endpoint hasil lama menerapkan verifikasi baru untuk pengumuman bermetadata baru; data historis lama tetap kompatibel.

API metadata publik: `GET /api/public/oprec/{id}/announcement` (tanpa tautan grup). API admin: `GET /api/admin/oprec/announcements`, `GET|POST /api/admin/oprec/{id}/announcement`, dan endpoint poster privat. Tabel penerimaan hanya memuat pengirim Tes Tulis yang diterima, 20 per halaman, diurutkan BPH/Humas/PSDM/Kominfo/KWU/Ristek lalu katalog jabatan, nama, dan ID. Tidak mengirim tanggal lahir maupun jawaban tes pada daftar.

## Implementasi dan verifikasi

Frontend, form renderer, poster, state machine, countdown, pencarian hasil dan route
adapter Next sudah diimplementasikan. Status implementasi admin, backend, dan tes
terkini dijelaskan pada bagian Alur tahap admin dan kartu publik di bawah.

- `node --test tests/oprec.test.mjs tests/oprec-submission.test.mjs`
- `npm run build`
- Uji mobile/desktop, semua state, FAQ keyboard, error 422/409/429, upload,
  sukses submit, pasangan NIM/tanggal salah, accepted/rejected/pending, draft hasil.

Verifikasi lokal: 39 pemeriksaan logika murni lulus pada V8 (input form dimodelkan
sebagai getAll); sintaks diperiksa dengan parser Babel bawaan Next. Suite Node,
build Next, dan browser belum dijalankan karena runtime npm menolak WSL 1.

## Revisi pendaftaran — 25 September 2026

### Pilihan divisi — 26 September 2026

Pada satu grid kartu divisi, peserta wajib memilih tepat tiga divisi berbeda.
Urutan klik menetapkan prioritas 1–3; klik ulang membatalkan pilihan. Tombol Kirim
baru aktif setelah tiga pilihan lengkap. Browser/adapter Next dan Laravel sama-sama
memvalidasi ketiga ID terhadap divisi periode, keunikan, dan jumlahnya. Payload
`divisi_pilihan_1`, `divisi_pilihan_2`, `divisi_pilihan_3` tetap dikirim terpisah
agar prioritas tidak hilang; pilihan ketiga disimpan di kolom baru. Form admin tetap
memiliki satu field "Divisi pilihan", bukan tiga form terpisah. Admin hanya dapat
menerima peserta ke salah satu divisi pilihannya. Migrasi
`2026_09_26_000002_add_third_oprec_division_choice` wajib dijalankan sebelum rilis.

Admin kini membuat atau mengedit periode dari `/admin/oprec/create` dan
`/admin/oprec/{id}/edit`. Form pendaftaran selalu dimulai dengan Nama lengkap
(`nama`), NIM (`nim`), Tanggal lahir (`tanggal_lahir`), Angkatan (`angkatan`),
dan Divisi pilihan (`divisi_pilihan_1`). Kelima kolom wajib dan tipe dasarnya
tetap; admin mengisi pilihan angkatan berupa tahun empat digit, mengelola
divisi, logo, kuota, lalu menambahkan maksimal 35 pertanyaan lain. Pilihan
divisi publik dibuat dari ID divisi yang tersimpan, bukan dari label yang
ditulis bebas. Perubahan form setelah ada pendaftar memerlukan kenaikan
`schema_version`; divisi dengan pendaftar tetap tidak dapat diganti.

Pilihan divisi tampil sebagai kartu berlogo. Logo lokal dalam
`/images/divisi/*.webp` dan URL HTTP(S) didukung. Editor menggunakan ikon cek
animasi dari komponen 21st.dev yang sudah ada dan transisi tahap yang
diadaptasi dari React Bits Animated Content, dengan reduced-motion fallback.

Alur tahap terbaru telah menggantikan tab editor ini. Jadwal, skema, dan
penyimpanan jawaban tes sudah tersedia; penilaian tes kini tersedia melalui ruang kerja Penilaian OPREC yang dijelaskan pada bagian terbaru dokumen ini.
Alur pencarian hasil pengumuman publik kini mengikuti kontrak tiket HttpOnly pada bagian Pengumuman.

## Alur tahap admin dan kartu publik — 25 September 2026

Keputusan terbaru: `/admin/oprec` menampilkan daftar periode dan tahap. Tombol Tambah
membuka satu popup untuk memilih Pendaftaran, Tes Tulis, atau Pengumuman. Admin mengisi
headline, jadwal, deskripsi, dan poster terlebih dahulu. Pendaftaran membuat periode
`draft`, kemudian membuka editor form dengan Nama, NIM, Tanggal lahir, Angkatan, dan
Divisi pilihan. Tes tulis membuka editor soal setelah metadata tahap disimpan.
Pengumuman memakai metadata tahap terpisah dan tetap menggunakan lookup hasil yang
memeriksa NIM serta tanggal lahir. Pengumuman hanya dapat terbit setelah pendaftaran
ditutup. Satu periode memiliki paling banyak satu tahap tes tulis dan satu tahap
pengumuman.

Kontrak baru Laravel: `POST /api/admin/oprec/upload-poster` menerima gambar maksimal
5 MB; `POST /api/admin/oprec/{oprec}/stages` dan
`PUT /api/admin/oprec/{oprec}/stages/{stage}` menyimpan metadata tahap;
`PUT /api/admin/oprec/{oprec}/stages/{stage}/form` menyimpan soal tes dan status
publikasinya; `GET|POST /api/user/oprec/stages/{stage}/test` hanya untuk peserta
terdaftar dan memakai autentikasi sesi. GET menahan daftar soal sampai jadwal tes
aktif. POST memvalidasi jawaban terhadap skema server, jadwal, dan unique constraint
satu jawaban per peserta/tahap. Migrasi `oprec_stages` dan
`oprec_test_submissions` diperlukan sebelum endpoint baru dipakai.

Kartu publik mengikuti komposisi IFEST: konten lebar di kiri, poster pada panel
biru di kanan, serta transisi kotak satu per satu saat hover masuk maupun keluar.
Efek ini diadaptasi dari React Bits Pixel Transition. Ikon Calendar Plus dan Check
berasal dari adaptasi komponen animated icons 21st.dev, dengan gerak path SVG,
bukan transformasi seluruh ikon. Semua animasi mematuhi reduced motion.

Verifikasi terakhir: production build Next.js dan suite Laravel (40 tes, 307
assertion) lulus. Kedua migrasi OPREC sudah Ran pada database lokal (batch 19).
Smoke test browser belum dijalankan.

## Revisi ringkasan admin — 25 September 2026

Halaman `/admin/oprec` sekarang memakai satu kartu ringkasan untuk pendaftaran
beserta tahap lanjutannya. Judul utama kartu adalah Pendaftaran; headline,
deskripsi, jadwal, jumlah berkas, dan divisi berada dalam kartu yang sama.
Label teknis skema dan status mentah tidak tampil pada ringkasan admin.

## Revisi UI Admin OPREC (Minimalis Kotak) — 27 September 2026

Halaman `/admin/oprec` telah dirombak total menyelaraskan bahasa desain **Neo-Arcade Editorial** dan formulir peserta:
- Geometri seragam bergaris tajam (`border-radius: 0`), tanpa sudut rounded melengkung atau tebal.
- Tipografi proporsional: heading menggunakan `font-semibold` / `font-medium`, eyebrow teknikal mono (`// KELOLA OPREC`, `// DATA CALON ANGGOTA`), serta menghapus teks gemuk berbobot 800/750.
- Filter toolbar kini dilengkapi dropdown filter divisi (mengaktifkan state `divisionFilter`).
- Status badges dan tabel verifikasi calon anggota ditata minimalis kotak dengan indikator mono.
- Pembersihan dead code: 10 import ikon mati di `page.jsx` dan 2 import mati di `OprecCreateDialog.jsx` telah dihapus total.
- Halaman penyusun formulir (`/admin/oprec/[id]/edit`) dirombak total menggunakan layout 3-tab terstruktur (1. Informasi & Jadwal, 2. Kelola Divisi, 3. Pertanyaan Formulir) serta panel pratinjau formulir interaktif real-time yang dapat di-toggle.

## Perombakan Konsep OPREC Mandiri (Pendaftaran Tunggal) — 27 September 2026

Berdasarkan keputusan pengguna, seluruh konsep pemecahan tahap bertingkat ("Tes tulis" dan "Pengumuman" sebagai tahapan terpisah) telah dirombak dan dihapus ke akar-akarnya agar alur OPREC murni terfokus pada Pendaftaran periode baru:
- **Dialog Pembuatan**: Modal `OprecCreateDialog` tidak lagi menampilkan kartu pemilih 3 jenis tahap. Tombol header "Tambah pendaftaran" langsung membuka formulir pendaftaran periode baru (periode, headline, tanggal buka-tutup, deskripsi, poster) dan berlanjut ke penyusun formulir.
- **Ringkasan Admin**: Bagian "Tahapan berikutnya //" pada overview `/admin/oprec` telah dihapus. Halaman admin kini murni mengelola pendaftaran periode aktif dan verifikasi berkas calon anggota.
- **Sidebar Admin**: Menu "Kelola OPREC" kini merupakan item navigasi tunggal langsung ke `/admin/oprec` tanpa dropdown submenu tahap.
- **Pembersihan Dead Code**: Route `/admin/oprec/test`, `/admin/oprec/announcement`, `/admin/oprec/[id]/stages`, komponen `OprecStageOverview`, `OprecTestBuilder`, stylesheet `oprec-review.css`, controller backend `OprecStageController`, `OprecTestController`, dan route stages telah dihapus tuntas tanpa sisa deadcode.

## Audit kontrak OPREC — 28 September 2026

Bagian lama tentang endpoint tahap `/stages` di atas adalah catatan historis dan **tidak lagi berlaku**. Kontrak aktif hanya pendaftaran tunggal per periode. Periode publik dipilih deterministik dari OPREC non-draft terbaru. Workspace pengguna mengikuti periode tersebut; akses ke periode lama memerlukan `oprec_id` dan kepemilikan pendaftaran/enrollment. Kartu dashboard, enrollment, dan submit hanya membuka periode publik terbaru yang berstatus buka, berada dalam jendela tanggal, serta memiliki minimal tiga divisi. Backend menolak submit langsung ke periode lama atau skema formulir yang sudah berubah.

Tautan grup WhatsApp tidak dikirim melalui resource publik. Pesan pengumuman dan hasil seleksi baru boleh tampil setelah status pengumuman terbit, tanggal rilis tercapai, dan pendaftaran telah ditutup. Lookup hasil menormalisasi NIM ke huruf kapital, konsisten dengan penyimpanan dan pembatas laju. Editor admin mengirim `schema_version` saat menyimpan perubahan jawaban agar pembaruan terhadap skema usang ditolak. Operasi ubah/hapus periode mengambil row lock agar tidak berlomba dengan pendaftaran.

Komponen countdown dan hasil tetap aktif dalam modal detail. Formulir workspace hanya tampil ketika OPREC benar-benar terbuka; draft isian tidak direset oleh render ulang. Kode tahap yang tak terpakai, model `OprecStage`, aturan CSS yatim, dan dependency `date-fns` dihapus. Tabel/migrasi historis tahap dipertahankan karena mungkin sudah diterapkan pada database pengguna; pembersihan fisiknya memerlukan audit data dan rencana migrasi tersendiri.

## Subhalaman admin Pendaftaran dan Tes Tulis — 28 September 2026

Instruksi terbaru pengguna mengganti keputusan “pendaftaran tunggal” di atas. Sidebar Kelola OPREC sekarang membuka subhalaman Pendaftaran (`/admin/oprec`) dan Tes Tulis (`/admin/oprec/test`). Pendaftaran yang sudah ada tidak berubah.

Halaman Tes Tulis memakai pola Pendaftaran: tombol Tambah Tes Tulis, kartu periode yang lebar, lalu tabel jawaban. Popup pembuatan hanya menerima periode serta tanggal/jam mulai–selesai dalam WIB; judul dibuat otomatis. Pembuatan mensyaratkan pendaftaran periode itu pernah diterbitkan (ditandai `first_published_at`) dan belum memiliki tes. Migrasi menandai periode historis yang masih `open` atau memiliki pendaftar; periode `closed` tanpa bukti tidak diasumsikan pernah dibuka. Menyimpan minimal satu soal yang valid melalui editor langsung menandai tes siap (`published=true`), tanpa tombol publikasi terpisah. Soal dan jadwal terkunci setelah tes dimulai atau ada jawaban.

Editor mendukung hingga 40 pertanyaan berurutan: teks singkat, paragraf, atau pilihan satu. Tiap pertanyaan bisa wajib dan diarahkan ke divisi tertentu; tanpa sasaran berlaku bagi semua. Opsi pilihan satu berjumlah 2–10, unik dan tidak kosong. Kartu peserta di bawah Data & administrasi hanya muncul bagi pemilik pendaftaran yang benar-benar sudah dikirim. Sebelum waktu mulai, soal tersembunyi dan countdown ditampilkan. Dalam jendela jadwal, soal yang berlaku dapat dijawab satu kali; setelah terkirim jawaban menjadi hanya-baca. Pengiriman lewat batas waktu ditolak server. Hapus jawaban oleh admin membuka kesempatan kirim ulang hanya selama jadwal masih aktif.

Editor soal menampilkan pratinjau langsung yang terbatas pada formulir Tes Tulis peserta. Admin dapat mensimulasikan hingga tiga divisi; daftar soal mengikuti aturan target divisi yang sama dengan peserta, dan kontrol jawaban memakai renderer yang sama. Tombol kirim pada pratinjau selalu nonaktif dan tidak memanggil API.

Kontrak API memakai sesi Sanctum: `GET /api/admin/oprec/written-tests` (termasuk `eligible_periods`), `POST|GET|PUT /api/admin/oprec/{oprec}/written-test`, `GET /api/admin/oprec/{oprec}/written-test/submissions`, `GET|DELETE /api/admin/oprec/{oprec}/written-test/submissions/{submission}`, serta `GET|POST /api/user/oprec/{oprec}/written-test`. Route admin memerlukan area OPREC: `super_admin`, `admin`, atau `leader` (Pengurus); `kwu` dan `user` ditolak. Server memeriksa kepemilikan pendaftaran, waktu server, soal sesuai tiga pilihan divisi, tipe/kewajiban/panjang jawaban, dan batas satu kiriman. Unique constraint database menjadi pelindung terakhir terhadap kiriman bersamaan. Tabel admin memuat hanya jawaban terkirim, dengan kolom untuk seluruh soal, pratinjau lengkap, hapus berkonfirmasi, serta gulir horizontal pada layar sempit. Penilaian/ranking tidak diubah dalam perombakan ini.

Verifikasi otomatis: suite Laravel (54 tes/460 assertion) dan build produksi Next.js (25 halaman) lulus. Migrasi telah Ran pada PostgreSQL lokal (batch 25). Chrome DevTools menunjukkan tidak ada overflow halaman OPREC publik pada viewport 320, 390, 768, dan 1440 px. Smoke test browser admin/peserta terautentikasi, keyboard/fokus dialog, dan concurrency PostgreSQL masih perlu dilakukan sebelum rilis.

## Halaman Penilaian admin — 29 September 2026

Subhalaman `/admin/oprec/penilaian` menampilkan peserta yang sudah mengirim Tes Tulis saja. Tabel memuat identitas, tiga pilihan divisi beserta jabatan yang dilamar, angkatan, jawaban pendaftaran dinamis tanpa tanggal lahir, tombol detail Tes Tulis, nilai, total, komentar, rata-rata, dan keputusan. Jawaban Tes Tulis tampil pada panel kanan; tabel bergulir horizontal pada layar sempit. Tautan berkas memakai endpoint privat dengan pemeriksaan akses per periode.

Super Admin menunjuk akun Pengurus per periode. Pengurus tanpa penugasan tidak dapat membaca/menulis endpoint penilaian periode itu; Admin hanya membaca, sedangkan KWU/User ditolak. Pengurus baru melihat nilai dan komentar penilai lain setelah enam aspeknya lengkap. Pencabutan akses tidak menghapus nilai historis. Nilai masing-masing aspek (Pemahaman, Kepribadian, Public Speaking, Kejujuran, Problem Solving, Kerja Sama) berkisar 0–10 dengan satu desimal dan menerima koma/titik. Kosong berbeda dari nol. Warna kotak: kurang dari 5 merah, 5–kurang dari 8 kuning, 8–kurang dari 10 hijau, tepat 10 biru. Total penilai = jumlah enam aspek / 60 × 100; Rata-rata = rerata Total semua penilai lengkap. Server menghitung dengan presisi; tampilan dibulatkan dua angka.

Keputusan Terima/Tolak hanya dapat ditetapkan Super Admin sebelum `pengumuman_published`. Penerimaan wajib memilih satu dari tiga divisi pendaftar dan jabatan penerimaan dari katalog organisasi, terpisah dari jabatan yang dilamar. Data penerimaan lama tanpa jabatan tetap ditampilkan sebagai belum ditetapkan. Koreksi keputusan dicatat pada tabel audit; status, nilai, komentar, dan penugasan terkunci setelah publikasi. Jalur keputusan lama dilindungi aturan yang sama; jawaban Tes Tulis dan pendaftaran yang sudah dinilai tidak bisa dihapus.

Endpoint admin baru: `GET /api/admin/oprec/assessments`, `GET /api/admin/oprec/{oprec}/assessment`, `GET /api/admin/oprec/{oprec}/assessment/{submission}`, `PATCH /api/admin/oprec/{oprec}/assessment/registrations/{registration}/review`, `PUT /api/admin/oprec/{oprec}/assessment/registrations/{registration}/decision`, `GET|PUT|DELETE /api/admin/oprec/{oprec}/assessment/assignments[/{reviewer}]`, dan endpoint unduh privat di bawah `assessment/{submission}`. Daftar terpaginasi 20 baris, pencarian dilakukan server sebelum pagination. Migrasi aditif `2026_09_29_000001_create_oprec_assessments` menambah penugasan, ulasan, audit, dan `accepted_position`.

Verifikasi: tes backend dan frontend, typecheck, serta build produksi. Browser desktop/mobile dan keyboard/sesi nyata tetap perlu smoke test terpisah sebelum rilis.


## UI/UX ruang kerja Penilaian — 30 September 2026

Halaman Penilaian memakai lebar area admin khusus, tabel dengan header dan identitas tetap terlihat saat digulir, tombol menuju kolom nilai, serta panduan warna 0–<5 merah, 5–<8 kuning, 8–<10 hijau, dan tepat 10 biru. Nilai kosong belum dinilai; nol tetap dihitung. Desktop mulai 1280 px menampilkan jawaban pada panel kanan. Pada lebar di bawah 1280 px, jawaban memakai dialog; pada HP di bawah 640 px dialog memenuhi layar dan memulihkan fokus tombol pemicu saat ditutup.

Endpoint daftar penilaian menerima filter allowlist `review=all|incomplete|complete` dan `decision=all|pending|accepted|rejected` bersama pencarian dan paginasi. Filter review selalu mengacu penilai yang sedang login, menganggap nol sebagai terisi, dan tidak tersedia bagi Admin hanya-baca. Pengurus tetap memerlukan penugasan periode. Respons PATCH review menambahkan `summary` berisi ulasan yang boleh terlihat, rata-rata, dan status penyembunyian, sehingga penyimpanan memperbarui baris tanpa memuat ulang tabel atau menghilangkan fokus. Keanggotaan hasil filter diterapkan ulang ketika daftar disegarkan atau filter berubah.

Popup penugasan menampilkan kartu nama/inisial/email Pengurus, pencarian, jumlah penilai aktif, status penugasan, serta pending/error per orang. Perubahan langsung tersimpan; pencabutan membutuhkan konfirmasi dalam kartu dan tidak menghapus nilai terdahulu. Pengujian browser fixture tersedia di `frontend/tests/oprec-assessment.browser.cjs`; sesi serta respons API disimulasikan sehingga pengujian tidak mengubah data aplikasi.

## Audit keamanan dan data Penilaian — 30 September 2026

Respons daftar hanya memuat jawaban pendaftaran yang benar-benar menjadi kolom Penilaian. Tanggal lahir, field usang, dan nilai mentah field berkas tidak dikirim; tautan berkas hanya diberikan untuk field file pada skema aktif. Daftar tidak memuat JSON jawaban Tes Tulis maupun email akun yang tidak dipakai. Pencarian menerima variasi nama historis nama_lengkap dan namaLengkap serta nama akun. Detail Tes Tulis memfilter jawaban ke ID soal aktif, dan endpoint unduh Penilaian memeriksa penugasan Pengurus serta field pada skema. Nilai bertipe selain string/angka ditolak dengan 422.

Tidak ditemukan import, komponen, atau selector CSS Penilaian yang pasti mati pada audit ini; sejumlah class dibentuk dinamis. Verifikasi otomatis: tes fitur Penilaian 8 tes/121 assertion, tes fitur terkait 14 tes/150 assertion, tes frontend terkait 4 tes, dan typecheck lulus. Sesi browser nyata, berkas dari data aktual, dan pengeditan dua tab masih menjadi verifikasi terpisah.
