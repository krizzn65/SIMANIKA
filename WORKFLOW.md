# 🤖 Aturan Main AI (AI Workflow & Guidelines)

Dokumen ini berisi aturan main (aturan perilaku) untuk AI (saya) selama mengerjakan proyek **SIMANIKA**. Aturan ini dibuat agar alur kerja tetap terkontrol, aman, dan meminimalisir kesalahan besar.

---

## 1. Kapan AI Harus Meminta Izin (Blokir Eksekusi)

AI **TIDAK BOLEH** langsung mengambil tindakan (harus berhenti dan menunggu konfirmasi/izin dari user) dalam kondisi berikut:

1. **Perubahan Arsitektur Besar**: Mengubah stack teknologi, mengganti database, atau mengubah struktur folder utama yang sudah disepakati di `architecture.md`.
2. **Menjalankan Perintah Destruktif**: 
   - `drop table`, `migrate:fresh` (di database non-testing).
   - Menghapus folder/file penting (`rm -rf`).
3. **Instalasi Package/Dependency Besar**: Menambahkan package npm atau composer yang berdampak besar (misal: mengganti library UI, mengganti state management).
4. **Refactoring Masif**: Mengubah lebih dari 3 file inti sekaligus atau mengubah flow utama aplikasi (misalnya flow login atau pendaftaran).
5. **Menemukan Ambiguitas**: Jika instruksi user tidak jelas atau bertentangan dengan `PRD.md`, AI harus bertanya untuk klarifikasi.

---

## 2. Kapan AI Boleh Jalan Sendiri (Otonom)

AI **DIPERSILAKAN** untuk langsung mengambil tindakan dan membuat perubahan tanpa perlu menunggu izin user dalam kondisi berikut:

1. **Membuat/Mengedit Komponen UI Kecil**: Membuat tombol, form, card, memperbaiki styling (Tailwind), atau memperbaiki layout.
2. **Membuat Endpoint API Sederhana**: Membuat route, controller, resource, dan form request untuk operasi CRUD standar (sesuai spesifikasi di `PRD.md`).
3. **Memperbaiki Bug Kecil (Minor Fixes)**: Bug typo, error syntax, console error, atau perbaikan logic yang perubahannya kurang dari 5 baris kode.
4. **Menulis/Memperbarui Test**: Menulis unit test atau component test untuk fitur yang sedang dikerjakan.
5. **Membuat File Migrasi Baru**: Membuat file migrasi untuk menambah tabel atau kolom baru (selama sesuai dengan skema di `PRD.md`).
6. **Update Dokumentasi Progress**: Secara mandiri mengupdate `TODO.md` (mengubah status task) setelah berhasil menyelesaikan fitur.

---

## 3. Alur Kerja Standar (Standard Operating Procedure)

Setiap kali menerima tugas dari user, ikuti urutan berikut:

### 3.1 Mengerjakan Fitur Baru (General Flow)
1. **Analisis Konteks**: Baca `PRD.md` (untuk requirements), `architecture.md` (untuk arsitektur & folder `frontend/` atau `backend/`), dan `TODO.md` (untuk progress saat ini).
2. **Gunakan SKILL.md**: Jika melakukan testing, refactoring, atau membuat API, **selalu rujuk template di `.agents/skills/simanika-prompts/SKILL.md`**.
3. **Cek Ketergantungan**: Pastikan fitur yang menjadi syarat (dependency) sudah selesai.
4. **Rencanakan Tindakan**: Buat rencana singkat di dalam pikiran (thought process).
5. **Izin (Jika Perlu)**: Jika rencana melibatkan perubahan besar (lihat Poin 1), ajukan rencana ke user dan tunggu persetujuan.
6. **Eksekusi & Tes**: Tulis kode dan langsung jalankan testing (PHPUnit/Vitest) jika memungkinkan.
7. **Update Progress**: Ubah status task di `TODO.md` menjadi ✅ dan update summary.
8. **Laporan Singkat**: Berikan laporan singkat ke user tentang apa yang sudah diselesaikan.

### 3.2 Membuat Fitur Backend (API Endpoint)
1. Konfirmasi spesifikasi: endpoint, method, request/response shape.
2. Buat migration (jika tabel baru).
3. Buat Model dengan relasi & fillable.
4. Buat Controller dengan validasi & FormRequest (jika kompleks).
5. Tambah route di `routes/api.php`.
6. Buat API Resource untuk formatting response.
7. Jalankan test (jika ada).
8. Laporkan selesai.

### 3.3 Membuat Fitur Frontend (Next.js Component/Page)
1. Konfirmasi spesifikasi: UI/UX, interaksi, Client Component (`'use client'`) vs Server Component.
2. Buat component di folder yang tepat (`src/components/` atau `src/app/`).
3. Hubungkan ke API via Axios/Fetch + custom hook/service.
4. Tambah route di Next.js App Router (buat `page.jsx` di `src/app/...`).
5. Pastikan responsive (Tailwind classes).
6. Laporkan selesai.

### 3.4 Memperbaiki Bug
1. Analisis pesan error / laporan user.
2. Identifikasi root cause.
3. Jika fix kecil (< 5 baris), langsung perbaiki.
4. Jika fix besar, jelaskan masalah dan rencana perbaikan, tunggu izin.
5. Terapkan fix dan laporkan hasil.

---

## 4. Kapan Fitur Dianggap SELESAI (Done Criteria)

Sebuah fitur atau task dinyatakan **SELESAI (✅)** hanya jika memenuhi SEMUA kriteria berikut:

### Backend (Laravel)
- [ ] Endpoint mereturn HTTP status code yang benar (200, 201, 404, 422, dll).
- [ ] Format response JSON konsisten (menggunakan API Resource).
- [ ] Validasi input berfungsi (mengembalikan pesan error yang jelas).
- [ ] Endpoint dilindungi middleware (auth/role) jika diperlukan.
- [ ] Tidak ada logic berat di Controller (dipindah ke Service).

### Frontend (Next.js)
- [ ] Komponen me-render data dari API tanpa error.
- [ ] UI tidak pecah di layar mobile dan desktop (Responsive).
- [ ] State loading (skeleton/spinner) dan error (pesan error) ditangani.
- [ ] Interaksi tombol/form berfungsi dan memberikan feedback (misal: toast/alert).
- [ ] Console bersih dari error/warning (kecuali warning bawaan library tertentu yang aman diabaikan).

### Umum
- [ ] Semua test (jika ada) harus PASS (sesuai panduan di `SKILL.md`).
- [ ] Tidak ada variabel dummy atau hardcoded text yang seharusnya dinamis.
- [ ] File `TODO.md` telah diperbarui (status diubah jadi ✅, dan summary bar di-update).
- [ ] Struktur file dan penamaan sesuai dengan panduan di `architecture.md`.

---

## 5. Komunikasi dengan User

- **Ringkas dan Padat**: Jangan mengulang instruksi panjang dari user.
- **Jangan Menggurui**: Hindari penjelasan teknis yang terlalu mendasar kecuali ditanya.
- **Format yang Jelas**: Gunakan markdown (bold, list, code block) agar pesan mudah dibaca.
- **Fokus pada Hasil**: Saat melaporkan progress, fokus pada **apa yang sudah jalan** dan **apa langkah selanjutnya**.
- **Proaktif Memperbaiki Diri**: Jika ada tool call yang gagal (misal: file not found), langsung coba perbaiki di langkah berikutnya tanpa perlu meminta maaf panjang lebar.
