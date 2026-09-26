# OPREC — alur dinamis revisi 21 September 2026

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
- `formFields`: text, email, tel, number, date, textarea, select, radio, checkbox,
  file. Maksimal 40 field; nama unik `[a-z][a-z0-9_]*`, bukan nama reserved.
- NIM (`name: nim`, text required) dan tanggal lahir (`name: tanggal_lahir`, date
  required) wajib ada untuk mencocokkan hasil. Kolom lain dipilih admin; tidak ada
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

## Pengumuman

Browser `POST /api/oprec/result` JSON `{ oprec_id, nim, tanggal_lahir }` diteruskan
ke **endpoint Laravel baru** `POST /api/public/oprec/{id}/result`.
Tidak memerlukan login; kecocokan NIM + tanggal lahir digunakan sesuai arahan user.
Data tidak dimasukkan ke URL, localStorage, daftar peserta publik, atau log aplikasi.
Next memeriksa periode sudah dalam mode pengumuman sebelum meneruskan permintaan.

Respons 200:

```json
{ "data": { "status": "accepted", "divisi": "Kominfo", "pesan": "Petunjuk selanjutnya dari admin." } }
```

Status: `accepted`, `rejected`, `pending`, `not_found`. Kombinasi identitas salah
atau NIM tidak ada menggunakan respons `not_found` yang sama. HTTP 404 dari endpoint
bukan hasil seleksi dan diperlakukan sebagai layanan gagal. Tidak ada hasil simulasi.
Next hanya meneruskan status, divisi untuk accepted, dan pesan; identitas lengkap
serta data internal lain dibuang. Semua respons no-store/private.

Backend **wajib** menerapkan rate limit persisten per periode/identitas serta batas
keseluruhan endpoint, membandingkan pasangan identitas secara tepat, dan mengecek
publication timestamp sebelum merespons. Jangan mengandalkan IP dari header browser;
proxy deployment harus dikonfigurasi sebelum menggunakan forwarded IP. NIM/tanggal
lahir harus di-redact dari access/error/APM logs. Cookie tidak diteruskan untuk lookup.

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
penyimpanan jawaban tes sudah tersedia; penilaian tes masih perlu dibuat.
Alur pencarian hasil pengumuman publik tetap mengikuti kontrak sebelumnya.

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

### Penilaian tes tulis admin — 25 September 2026

- Sidebar Kelola OPREC mempunyai subhalaman Pendaftaran, Tes tulis, Pengumuman, dan Jawaban tes tulis. Halaman jawaban menampilkan kolom sesuai `form_fields`, filter divisi pilihan pertama, dan pagination 20 jawaban per halaman. Jawaban serta NIM hanya lewat API privat admin.
- `GET /api/admin/oprec/{oprec}/stages/{stage}/answers` menerima `division_id`/`page`; `PUT /api/admin/oprec/{oprec}/stages/{stage}/answers/{submission}/score` menerima `score` 0–100 (maksimal dua desimal) dan `note` opsional. Satu penilai memiliki satu skor per jawaban; update mengubah nilai miliknya.
- `oprec_test_scores` menyimpan `reviewer_id` dan timestamps. Rata-rata dibulatkan dua desimal; peringkat dihitung per divisi pilihan pertama sebelum pagination. Nilai sama berbagi peringkat dan jawaban tanpa nilai tidak diperingkatkan. API penilaian kini khusus admin resmi. Akun/role penilai khusus masih pekerjaan selanjutnya.

## Revisi ringkasan admin — 25 September 2026

Halaman `/admin/oprec` sekarang memakai satu kartu ringkasan untuk pendaftaran
beserta tahap lanjutannya. Judul utama kartu adalah Pendaftaran; headline,
deskripsi, jadwal, jumlah berkas, dan divisi berada dalam kartu yang sama.
Label teknis skema dan status mentah tidak tampil pada ringkasan admin.
