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

`GET /api/public/events?search=...&kategori=lomba&status=upcoming&page=1&per_page=9`

- `search`: maksimal 100 karakter, pencarian judul/topik; backend wajib validasi.
- `kategori`: `lomba | seminar | workshop | lainnya`; kosong = semua.
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
- `bukaPendaftaran`, `sisaKuota`, `formFields` adalah tambahan kontrak publik
  untuk tampilan yang belum dirinci pada model awal PRD.
- Tombol `Daftar` hanya tampil ketika event terpublikasi, jadwal dibuka, dan `formFields` tersedia. `POST /api/user/events/{id}/enroll` menyimpan keikutsertaan secara idempoten dan mengarahkan pengguna ke dashboard.
- Card dashboard muncul segera setelah enrolment. Formulir individu serta pilihan buat/gabung tim ditampilkan di card. Event keluar dari dashboard setelah tanggal selesai atau status `selesai`.
- Admin membuat event sebagai draft, mengatur field pada `/admin/events/{id}`, lalu mempublikasikannya. Skema terkunci setelah ada pendaftar.
- Jenis field: text, email, tel, number, date, textarea, select, radio, checkbox, dan file. File privat dibatasi 5 MB (PDF/JPG/PNG/WebP).
- `POST /api/user/events/{id}/register` menerima isian multipart dari dashboard; anggota tim bergabung melalui `POST .../join-team` memakai kode tim.
- Backend tetap menjadi otoritas deadline, kuota, dan izin pendaftaran.
- `deskripsi` saat ini ditampilkan sebagai **teks biasa dengan newline**, di-escape
  oleh React. HTML tidak dieksekusi. Editor rich text/Markdown admin perlu renderer
  tersanitasi saat dikembangkan; jangan mengirim markup untuk tampilan awal ini.
- Poster unggahan disimpan pada disk publik, tetapi dibaca lewat `GET /api/public/events/posters/{filename}` sehingga tidak bergantung pada symlink `/storage`. URL poster lama dinormalisasi oleh resource event; file yang tidak ada tetap menghasilkan 404.
- Admin dapat memilih guidebook opsional berupa PDF maksimal 10 MB atau tautan HTTPS. PDF diunggah melalui `POST /api/admin/events/upload-guidebook` dan dibuka melalui `GET /api/public/events/guidebooks/{filename}`. Tombol Guidebook hanya muncul bila sumber valid tersedia.
- Poster disarankan WebP/AVIF, maksimal lebar 1280px, target <200KB. CDN sebaiknya
  menyediakan thumbnail. UI menjaga rasio 16:10, `object-fit: contain` agar isi
  poster tidak terpotong, lazy loading di daftar dan fallback bila gambar rusak.

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
