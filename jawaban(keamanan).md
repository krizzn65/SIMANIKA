# Laporan Analisis & Kesiapan Keamanan Sistem SIMANIKA

Dokumen ini merangkum evaluasi kesiapan keamanan sistem **SIMANIKA** untuk penerapan (*deployment*) ke lingkungan publik, mencakup daftar mekanisme proteksi siber yang sudah aktif di tingkat aplikasi (*application level*), serta *checklist hardening* yang wajib dipenuhi di tingkat *environment* / server produksi.

---

## 1. Kesimpulan Kesiapan Publik

Secara umum, arsitektur aplikasi SIMANIKA telah dirancang dengan **standar keamanan yang sangat baik (*defense-in-depth*)**. Kerentanan umum seperti **SQL Injection**, **IDOR (Insecure Direct Object Reference)**, **CSRF**, **Brute Force**, dan **File Upload Malicious Execution** sudah dicegah di tingkat kode dan framework.

Namun, dalam standar keamanan siber, tidak ada sistem yang "100% aman tanpa celah" (*no silver bullet*). Keamanan di lingkungan produksi sangat ditentukan oleh konfigurasi server (HTTPS, `APP_DEBUG`, persistent storage, dan konfigurasi environment).

---

## 2. Daftar Mekanisme Keamanan yang Sudah Diterapkan

Berikut adalah rincian proteksi siber yang telah aktif di dalam codebase SIMANIKA:

### A. Pencegahan SQL Injection (SQLi)
* **Eloquent ORM & Query Builder:** Hampir seluruh operasi basis data menggunakan Eloquent ORM dan Laravel Query Builder yang secara default mengimplementasikan *PDO Parameter Binding* (prepared statements). Input pengguna tidak digabungkan langsung (*string concatenation*) ke dalam query SQL.
* **Escaping pada Raw Query:** Pada logika kalkulasi kompleks seperti di `OprecAssessmentController.php` (`COUNT(CASE WHEN ...)`), query parameter tetap dibinding dan di-escape secara aman.
* **Sanitasi Pesan Error (Anti Data Leakage):** Di sisi frontend (`frontend/src/services/apiError.js`), respon error yang mengandung detail driver database (`SQLSTATE`, nama tabel, kolom) disaring agar tidak pernah terekspos ke pengguna publik saat terjadi kegagalan server.

### B. Anti-IDOR (*Insecure Direct Object References*) & Otorisasi Ketat
* **User Context Scoping:** Pengambilan dan pembaruan data pengguna selalu diikat langsung ke entitas user yang terautentikasi (`$request->user()->id`), bukan mengambil ID langsung dari parameter URL atau payload JSON yang dapat dimanipulasi pihak luar.
* **Akses Dokumen Peserta:** Endpoint dokumen (seperti berkas pendaftaran OPREC) hanya memvalidasi dan menyajikan berkas milik akun peserta yang sedang aktif login.
* **Anti-Path Traversal:** Pada unduh/baca berkas dokumen, sistem memvalidasi nama berkas menggunakan *whitelist regex* (hanya karakter alfanumerik, *dash*, dan *underscore*) serta memastikan jalur berkas (*canonical path*) berada di dalam direktori penyimpanan yang diizinkan.

### C. Autentikasi, Manajemen Sesi & Proteksi CSRF
* **Laravel Sanctum SPA Authentication:** Menggunakan autentikasi berbasis *cookie session* dengan atribut `HttpOnly`, `SameSite=Lax/Strict`, sehingga *session cookie* tidak dapat diakses atau dicuri oleh skrip JavaScript berbahaya (*Anti-XSS token theft*).
* **Proteksi CSRF (Cross-Site Request Forgery):** Rute non-GET dilindungi oleh middleware verifikasi token CSRF bawaan Laravel (`XSRF-TOKEN`).
* **Sesi Idle Timeout (2 Jam):** Sistem menerapkan batas waktu tidak aktif selama 120 menit (2 jam). Frontend dilengkapi modal dialog interaktif yang memperingatkan user ketika sesi telah kedaluwarsa dan mengarahkan kembali ke halaman login.
* **Pengecualian Fitur "Ingat Saya" (*Remember Me*):** Pengguna yang secara sadar mencentang "Ingat Saya" diberikan sesi panjang (hingga 5 tahun) tanpa terblokir oleh timeout idle harian.
* **Password Hashing:** Kata sandi disimpan menggunakan algoritma *Bcrypt* dengan *work factor* adaptif bawaan Laravel.
* **Super Admin Fallback Verification:** Mencegah pengambilalihan akun administratif melalui verifikasi kredensial ganda lingkungan (*environment variables*).

### D. Keamanan Unggah Berkas (*File Upload Security*)
* **Verifikasi MIME Type Nyata:** Pemeriksaan berkas tidak hanya melihat ekstensi nama berkas (misal `.pdf` atau `.png`), melainkan memeriksa *magic bytes* / MIME type konten asli menggunakan PHP Fileinfo (`finfo`).
* **Penyimpanan di Luar Web Root:** Berkas pendaftar disimpan di `storage/app/private/oprec/documents/` yang berada di luar folder `public/`. Berkas tidak dapat dieksekusi langsung oleh web server (mencegah eksekusi script PHP/webshell berbahaya).
* **Penyajian Terproteksi (*Private File Streaming*):** Setiap unduhan atau tampilan berkas harus melalui rute API controller yang memeriksa autentikasi dan otorisasi terlebih dahulu.
* **Pembatasan Ukuran:** Dibatasi maksimal 5 MB – 10 MB per berkas, serta total *request payload* maksimum 11 MB.

### E. *Rate Limiting* & Proteksi *Brute Force* (`AppServiceProvider.php`)
Sistem telah menerapkan pembatasan laju permintaan (*rate limit*) untuk mencegah serangan *Denial of Service* (DoS) skala aplikasi dan serangan tebak kredensial (*brute force*):
1. **Autentikasi / Login:** Membatasi frekuensi percobaan login per IP/kredensial untuk mencegah *password guessing*.
2. **Reset Kata Sandi:** Membatasi pengiriman token/email reset password guna mencegah *spamming* dan penyalahgunaan layanan surat.
3. **Pendaftaran OPREC:** Membatasi pengiriman formulir pendaftaran untuk mencegah *bot spamming*.
4. **Verifikasi Pengumuman:** Membatasi pencarian status kelulusan peserta.

### F. Anti-Enumerasi & Privasi Data
* **Respons Generik Pengumuman:** Saat pencarian hasil seleksi, sistem mengembalikan pesan umum jika data tidak ditemukan guna mencegah penyerang melakukan *user enumeration* (memindai seluruh NIM mahasiswa).
* **Tiket Hasil Terenkripsi:** Hasil verifikasi pengumuman menggunakan token tiket terenkripsi dengan masa kedaluwarsa singkat (30 menit).

### G. Audit Trail & Logging Keamanan
* **Middleware Jejak Audit (`AuditTrailMiddleware.php`):** Setiap aksi krusial, perubahan data OPREC, dan akses administratif dicatat ke dalam log audit (meliputi User ID, IP address, metode HTTP, URL, dan *user agent*).
* **Header Keamanan Tambahan:**
  * `X-Content-Type-Options: nosniff` (mencegah MIME-type sniffing).
  * `Cache-Control: private, no-store` pada dokumen sensitif agar tidak tersimpan pada proxy perantara atau browser publik.

### H. Kontrol Akses Berbasis Peran (*Role-Based Access Control / RBAC*)
* Pembagian peran yang jelas: **Guest**, **Member / Peserta**, **Pengurus (Leader)**, **Admin**, dan **Super Admin**.
* Setiap endpoint penting dilindungi middleware khusus (`OprecAccessMiddleware.php`, `AdminMiddleware.php`) yang memverifikasi apakah akun memiliki wewenang sebelum mengeksekusi operasi.

---

## 3. Checklist Wajib Sebelum Deploy ke Publik (*Production Hardening*)

Sebelum server SIMANIKA dibuka ke jaringan publik/internet, lakukan verifikasi konfigurasi berikut:

| No | Pengaturan | Konfigurasi Target | Keterangan |
|---|---|---|---|
| 1 | **APP_DEBUG** | `false` | **Sangat Kritis.** Jangan pernah menyalakan debug di produksi karena error stack trace membocorkan struktur database dan kode. |
| 2 | **APP_ENV** | `production` | Mengoptimalkan performa dan mematikan rute/alat pengujian. |
| 3 | **HTTPS / SSL** | Aktif (Port 443) | Enkripsi seluruh lalu lintas data antara klien dan server. |
| 4 | **SESSION_SECURE_COOKIE** | `true` | Memastikan cookie sesi hanya dikirim melalui koneksi terenkripsi HTTPS. |
| 5 | **CORS_ALLOWED_ORIGINS** | `https://domain-resmi.ac.id` | Kunci asal domain frontend; jangan biarkan `*` (wildcard) di produksi. |
| 6 | **SANCTUM_STATEFUL_DOMAINS** | Domain frontend resmi | Konfigurasi domain SPA agar cookie sesi Sanctum terverifikasi. |
| 7 | **ADMIN_EMAIL** | Email resmi pengelola | Mengamankan jalur akses akun super admin darurat. |
| 8 | **Kredensial Database** | Sandi acak & kuat | Jangan gunakan user `root` tanpa password seperti di lingkungan lokal. |
| 9 | **Penyimpanan Berkas (Storage)** | Persistent Disk / S3 | Pastikan direktori `storage/app/private` di-*mount* ke persistent volume atau cloud storage agar berkas unggahan peserta tidak terhapus saat re-deploy atau CI/CD container. |

---
*Laporan ini digenerate secara otomatis berdasarkan analisis kode sumber SIMANIKA.*
