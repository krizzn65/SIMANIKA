# Halaman Event — kontrak integrasi admin

Implementasi awal mengikuti PRD Phase 1: halaman publik **list + detail**.
Route `/events` dan `/events/[slug]` mengambil data di server melalui
`src/services/eventService.js`. Tidak ada daftar event dummy di UI.

## Menghubungkan Laravel

Set environment frontend lalu restart Next.js:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

`API_BASE_URL` opsional mengoverride URL tersebut untuk koneksi server internal.
Jika keduanya belum diset, daftar menampilkan empty state. Jika API sudah diset
namun gagal, timeout, atau respons tidak valid, tampil error dengan tombol coba lagi.
Request dibatasi 8 detik. Data memakai `cache: "no-store"`: perubahan admin tampil
pada request/navigasi berikutnya, bukan push real-time ke tab yang sedang terbuka.

## List

`GET /api/public/events?search=...&kategori=hi-fest&status=upcoming&page=1&per_page=9`

- `search`: maksimal 100 karakter, pencarian judul/topik; backend wajib validasi.
- `kategori`: `hi-fest | mic | imce | lainnya`; kosong = semua. `lainnya` juga mencakup kategori kustom dan data kategori lama.
- `status`: waktu kegiatan `upcoming | ongoing | selesai`; kosong = semua.
  Ini **berbeda** dengan status publikasi event.
- Upcoming: mulai > sekarang; ongoing: mulai <= sekarang < selesai;
  selesai: selesai <= sekarang atau status publikasi `selesai`.
- Backend melakukan filter/search **sebelum pagination**, maksimum 9 per halaman.
- Urutan: kegiatan mendatang terdekat, berlangsung, kemudian arsip terbaru.
- `meta.total` adalah jumlah seluruh hasil yang cocok, bukan ukuran halaman.
- Backend wajib mengecualikan draft dan data privat. Frontend menolak koleksi
  dengan draft/record tidak valid agar jumlah hasil tidak menyesatkan.
- Halaman di luar rentang: `data: []`, meta tetap valid; UI menyediakan reset.

```json
{
  "data": [],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 9, "total": 0 }
}
```

## Detail dan bentuk event

`GET /api/public/events/{slug}` → `{ "data": { ... } }`.
404 untuk event tidak ditemukan/draft. Contoh kontrak (bukan seed produksi):

```json
{
  "id": 1,
  "slug": "workshop-web",
  "judul": "Workshop Web",
  "deskripsi": "Deskripsi kegiatan.\n\nParagraf berikutnya.",
  "kategori": "workshop",
  "poster": "https://cdn.example.com/events/workshop-web.webp",
  "guidebookType": "link",
  "guidebookUrl": "https://example.com/guidebook.pdf",
  "tanggalMulai": "2026-11-20T09:00:00+07:00",
  "tanggalSelesai": "2026-11-20T16:00:00+07:00",
  "bukaPendaftaran": "2026-10-01T09:00:00+07:00",
  "deadlinePendaftaran": "2026-11-19T23:59:00+07:00",
  "lokasi": "Auditorium Kampus",
  "tipe": "offline",
  "status": "published",
  "tipePendaftaran": "individu",
  "paymentType": "paid",
  "htm": 500000,
  "kuota": 80,
  "sisaKuota": 25,
  "teamSettings": null,
  "syarat": ["Mahasiswa aktif", "Membawa laptop"],
  "hadiah": ["Materi kegiatan", "Sertifikat peserta"],
  "formFields": [{ "name": "nama_lengkap", "label": "Nama lengkap", "type": "text", "required": true, "options": [] }]
}
```

Nama properti mengikuti model logis PRD. Adapter juga menerima snake_case untuk
properti majemuk, misalnya `tanggal_mulai`, `tipe_pendaftaran`, `team_settings`.

- Status publikasi: `draft | published | closed | selesai`; draft tidak boleh publik.
- Slug: huruf kecil/angka dengan pemisah `-`; unik dan stabil.
- Tanggal: ISO 8601 dengan offset timezone. Tampilan konsisten dalam WIB.
- Angka kuota harus JSON number, tidak berupa numeric string. Null = tidak diketahui/
  tak terbatas; nol = habis. `sisaKuota` dihitung **backend** dari registrasi valid.
- Tim: `teamSettings: { minAnggota, maxAnggota, kuotaTim }`; `sisaKuota` dihitung
  dalam satuan **tim**, bukan anggota. Jangan kirim data pribadi peserta.
- Pembayaran: `paymentType` hanya `free | paid`. `htm` berupa integer rupiah tanpa pemisah dan wajib positif bila `paid`; untuk `free`, backend mengembalikan `htm: null`. Card memformatnya menjadi `Free` atau `HTM · Rp500.000`.
- `bukaPendaftaran`, `sisaKuota`, `formFields` adalah tambahan kontrak publik
  untuk tampilan yang belum dirinci pada model awal PRD.
- Tombol `Daftar` hanya tampil ketika event terpublikasi, jadwal dibuka, dan `formFields` tersedia. Untuk event individu, `POST /api/user/events/{id}/enroll` menyimpan keikutsertaan secara idempoten lalu membuka dashboard.
- Untuk competition tim, tombol `Daftar` membuka dialog bertahap. Ketua memilih **Buat tim**, mengisi nama tim, lalu frontend memanggil `POST /api/user/events/{id}/create-team` dengan `{ nama_tim }`. Respons `201` berisi `{ created, teamName, teamCode }`; dialog tetap terbuka agar kode dapat disalin sebelum tombol `Lanjut` membuka dashboard.
- Anggota memilih **Join Tim**, memasukkan kode alfanumerik maksimal 16 karakter, lalu frontend memanggil `POST /api/user/events/{id}/join-team` dengan `{ kode_unik }`. Respons `200` berisi `{ requested: true, membershipStatus: "pending" }` dan membuka dashboard dengan status Menunggu ketua. Retry permintaan pending yang sama idempoten. Kedua endpoint tim melakukan validasi deadline, form tersedia, kapasitas anggota, dan aturan satu user satu tim/permintaan per event dalam transaksi.
- Pembuatan maupun permintaan join tim juga menyimpan `event_enrollments` secara idempoten sehingga card dashboard langsung tersedia. Event keluar dari dashboard setelah tanggal selesai atau status `selesai`.
- Admin membuat event sebagai draft, mengatur field pada `/admin/events/{id}`, lalu mempublikasikannya. Skema terkunci setelah ada pendaftar.
- Jenis field: text, email, tel, number, date, textarea, select, radio, checkbox, dan file. File privat dibatasi 5 MB (PDF/JPG/PNG/WebP).
- `POST /api/user/events/{id}/register` menerima isian multipart dari halaman detail dashboard. Pada event tim, hanya ketua dapat mengirim satu formulir untuk tim yang sudah dibuat; submit tidak membuat tim baru. Anggota aktif dapat membaca jawaban tim, anggota pending tidak bisa. File dibatasi 5 MB per berkas dan total 11 MB di browser/server.
- Backend tetap menjadi otoritas deadline, kuota, dan izin pendaftaran.
- `deskripsi` saat ini ditampilkan sebagai **teks biasa dengan newline**, di-escape
  oleh React. HTML tidak dieksekusi. Editor rich text/Markdown admin perlu renderer
  tersanitasi saat dikembangkan; jangan mengirim markup untuk tampilan awal ini.
- Poster unggahan disimpan pada disk publik, tetapi dibaca lewat `GET /api/public/events/posters/{filename}` sehingga tidak bergantung pada symlink `/storage`. URL poster lama dinormalisasi oleh resource event; file yang tidak ada tetap menghasilkan 404.
- Admin dapat memilih guidebook opsional berupa PDF maksimal 10 MB atau tautan HTTPS. PDF diunggah melalui `POST /api/admin/events/upload-guidebook` dan dibuka melalui `GET /api/public/events/guidebooks/{filename}`. Tombol Guidebook hanya muncul bila sumber valid tersedia.
- Poster disarankan WebP/AVIF, maksimal lebar 1280px, target <200KB. CDN sebaiknya
  menyediakan thumbnail. UI menjaga rasio 16:10, `object-fit: contain` agar isi
  poster tidak terpotong, lazy loading di daftar dan fallback bila gambar rusak.

## Detail pendaftaran dashboard — 24 September 2026

### Timeline event — 25 September 2026

- Event baru membuka editor timeline dalam keadaan kosong. Admin menambah pasangan Pendaftaran/Penutupan Pendaftaran sekaligus, atau memilih Technical Meeting, Pengumpulan Proposal, Babak Penyisihan, Pengumuman Finalis, Grand Final, Awarding & Penutupan, dan Lainnya (judul bebas). Setiap agenda hanya memiliki tanggal; tidak ada input jam.
- Baris editor dan timeline publik selalu diurutkan berdasarkan tanggal; agenda proposal boleh tampil sebelum pembukaan pendaftaran bila tanggalnya lebih awal. Baris pendaftaran satu batch dihapus bersama. Bila ada beberapa batch, judulnya menjadi Batch 1, Batch 2, dan seterusnya.
- Tanggal buka/tutup yang mengendalikan status pendaftaran dan hitung mundur publik berasal dari batch yang sedang berjalan: batch pertama yang tanggal tutupnya belum lewat. Setelah batch itu ditutup, sistem beralih ke batch berikutnya; jika tanggal bukanya belum tiba, statusnya `Segera dibuka`. Setelah semua batch lewat, statusnya ditutup. Pendaftaran aktif sejak awal tanggal buka hingga akhir tanggal tutup WIB. Server menurunkan jadwal dari timeline bertipe; nilai tanggal turunan yang dikirim browser tidak dipercaya. Event lama tanpa tipe agenda tetap dibaca melalui tanggal warisan.
- Server menolak pasangan batch yang tidak lengkap/terbalik/bertumpuk, tanggal tidak valid, dan Awarding & Penutupan pada atau sebelum hari penutupan pendaftaran terakhir. Tes browser lintas viewport masih diperlukan sebelum rilis.
- Ringkasan hero detail publik tidak menampilkan lagi fakta `Pelaksanaan`. Fakta batas pendaftaran memakai label `Batas daftar` untuk satu periode, atau `Batas daftar Batch N` sesuai batch aktif/berikutnya bila timeline memiliki beberapa batch. Nomor batch berasal dari respons backend, bukan ditebak dari tanggal di browser.
- Timeline detail publik memakai garis horizontal bertitik dengan kartu agenda ringkas yang bergantian di atas dan bawah setiap titik. Bingkai putus-putus tetap mengikuti lebar kontainer; bila agenda banyak, hanya jalur di dalamnya yang bergulir. Tombol sebelumnya/berikutnya, scrollbar, fokus keyboard, scroll snap, urutan tanggal, dan pengaturan reduced motion tetap dipertahankan.

### Formulir per grup — 25 September 2026

- Editor `/admin/events/{id}` sekarang menyusun maksimal 20 grup dan 40 pertanyaan total. Setiap grup punya nama, urutan, aturan akses, pertanyaan, dan kontrol lipat/buka. Simpan memakai `PUT /api/admin/events/{id}/form` dengan `form_groups: [{ title, scope, edit_role, fields }]`. Skema terkunci setelah ada pendaftar/tim/enrolment.
- `scope: personal` berarti satu jawaban per pengguna. Hanya pemilik akun melihat dan mengubah jawabannya, termasuk bila ia anggota tim; ketua tidak melihat data anggota lain. `scope: team` berarti satu jawaban per tim, terlihat oleh semua anggota accepted. `edit_role: leader | all` mengatur siapa yang boleh mengirim/mengubah jawaban bersama. Grup tim tidak tersedia pada event individu.
- Workspace peserta memuat `event.formGroups[]` dengan `submitted`, `canEdit`, dan nilai field sesuai identitas sesi. Setiap grup dikirim mandiri melalui `POST /api/user/events/{event}/groups/{group}/submit` sebagai multipart. Tombol kirim berukuran sedang dan berada di kanan bawah grup.
- Berkas grup diunduh melalui `GET /api/user/events/{event}/groups/{group}/files/{field}` dengan pemeriksaan kepemilikan jawaban dan membership accepted; path storage tidak diekspos. Formulir event lama tetap menggunakan endpoint `/register`, sedangkan event dengan grup tidak bisa memakai endpoint legacy tersebut.
- Admin belum memiliki panel peninjauan/validasi jawaban per grup. Status verifikasi dan pembayaran dari penyelenggara tetap pekerjaan terpisah; UI peserta saat ini hanya membedakan sudah/belum dikirim.

- Card dashboard membuka `/dashboard/events/{eventId}`, terpisah dari detail publik.
- `GET /api/user/events/{event}/workspace` memakai Sanctum, hanya pemilik pendaftaran/enrolment atau anggota/pemohon pada event tersebut; respons private/no-store.
- Respons `{ data: { event, team, paymentStatus, htm, form } }`. `team` memuat nama/kode, min/max/count, anggota aktif (nama + role, tanpa email), requests khusus ketua, serta capability `canManage` dan alasan terkunci.
- `POST /api/user/events/{event}/teams/{team}/members/{userId}` menerima `{ action: "accept" | "remove" }`. Hanya ketua tim yang cocok dengan event; ketua tidak boleh menghapus dirinya. Remove pada pending berarti menolak permintaan.
- Join, accept, remove, create, dan submit mengunci baris event dahulu. Accept mengecek ulang kapasitas dalam transaksi; pending tidak mengisi slot atau menaikkan progress. Anggota lama tetap accepted melalui migration.
- Prefix tim adalah huruf kapital 1–6 karakter dan harus unik selama masih dipakai event yang ada. Setelah event tanpa peserta dihapus atau prefix-nya diganti sebelum ada peserta, prefix itu boleh dipakai event baru. Nama/judul yang sama boleh dipakai lagi setelah event lama dihapus; slug tetap unik di antara event yang ada. Kode tim memakai nomor global per prefix (`HACK01`, `HACK02`, …, `HACK100`) yang dicadangkan atomik dan tidak diulang meski prefix dipakai lagi. Preview admin hanya contoh format, bukan nomor aktual. Event lama yang sudah terlanjur berbagi prefix/kode tetap dapat dibaca; kode yang telah dibagikan tidak diubah diam-diam. Join tetap mensyaratkan event yang tepat.
- Setelah ada tim/pendaftar, mode pendaftaran, prefix, minimum, dan maksimum anggota tidak dapat diubah. Backend memeriksa aturan ini ulang di dalam transaksi; browser menampilkan kesalahan validasi dari server.
- Roster terkunci sesudah diterima penyelenggara, sebelum pembukaan, sesudah deadline, atau event ditutup/selesai. Review penyelenggara terpisah dari status membership.
- Remove mencabut membership dan enrolment event tersebut, sehingga akses workspace/berkas hilang. User boleh mendaftar kembali.
- `GET /api/user/events/{event}/files/{field}` memvalidasi membership aktif atau registrasi individu milik sesi, tipe field, serta path disk privat; tidak mengembalikan path storage mentah.
- `form.submitted` berbeda dari review status. Formulir tim diisi ketua satu kali; setelah terkirim tampil ringkasan read-only. Field bersumber dari admin. Tidak ada tugas/verified/payment palsu dari gambar referensi.
- HTM free menghasilkan Free; HTM berbayar menghasilkan Unpaid. Konfirmasi pembayaran admin tetap pekerjaan lanjutan.
- Uji backend: `EventWorkspaceTest` (otorisasi, pending, kapasitas, remove, deadline, form, berkas). Uji browser: `tests/event-workspace.browser.cjs` menggunakan CDP Chrome dan fixture API tanpa menulis data aplikasi; jalankan build pada port 3100 dan Chrome terisolasi pada debugging port 9333.
- UI menggunakan adaptasi pola [Team Access Card](https://21st.dev/@ruixen.ui/components/team-access-card), transisi copy/check dari [Copy Button Variants](https://21st.dev/@zochory/components/copy-button-variants/icon-only), dan ikon [Lucide Animated/pqoqubbw](https://github.com/pqoqubbw/icons) yang terdaftar di 21st.dev. Registry full-source Team Access Card memerlukan login; panel dibuat dari pola/demo publik, tanpa menambah dependency. Lisensi ikon disertakan di `src/components/ui/animated-check.LICENSE`.

## Performa dan interaksi

Server Components untuk daftar, kartu, detail. JS tambahan hanya filter dialog,
fallback poster, countdown (per menit, skip update ketika tab tersembunyi).
Tidak ada scroll listener atau animasi looping tambahan. Pagination maksimal 9 kartu.
Filter tersimpan di URL, reset kembali halaman pertama, navigasi Back/Forward didukung.
Mobile menggunakan native dialog (focus trap, Escape, pengembalian fokus); desktop
utility bar sticky. Navbar dan footer parallax menggunakan komponen homepage.

## Verifikasi lanjutan

- Jalankan `node --test tests/events.test.mjs` dan `npm run build` dari `frontend`.
- Cek `/events` tanpa env, API kosong, API berisi event, error, dan timeout.
- Cek pencarian/kategori/status, kombinasi filter, pagination dan Back/Forward.
- Cek `/events/[slug]` valid/404/draft; deadline lewat, kuota nol, tim/individu.
- Uji keyboard dialog, Escape, fokus, zoom 200%, reduced motion.
- Uji viewport 320/375/768/1024/1280/1440px dan gambar gagal dimuat.

Renderer rich text masih pekerjaan lanjutan. Verifikasi browser lintas viewport
dan end-to-end autentikasi tetap perlu dilakukan sebelum rilis produksi.
