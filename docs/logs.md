# Log Sistem SIMANIKA

Halaman `/admin/logs` dan API `GET /api/admin/logs`, `GET /api/admin/logs/{id}` hanya tersedia untuk akun **Super Admin resmi** (`role=super_admin` dan email sesuai `ADMIN_EMAIL`). Admin, Pengurus, KWU, dan User ditolak oleh server. Belum ada backfill untuk aktivitas sebelum migrasi `2026_10_13_000001_create_audit_entries.php`.

## Cakupan dan data

- Middleware mencatat permintaan API yang mengubah data, unduhan berkas privat, login/logout, akses ditolak, dan respons server 5xx. Pencatatan berada di luar transaksi operasi utama dan kegagalan menulis log tidak mengubah hasil operasi pengguna.
- Setiap baris menyimpan waktu, jenis (`activity`, `security`, `error`), modul, tindakan, hasil, snapshot nama/role pelaku, jenis/ID objek, IP, metode, pola route, status HTTP, dan ID permintaan. URL query tidak disimpan.
- Rincian perubahan hanya memuat nama kolom yang diizinkan serta nilai lama/baru untuk role pengguna atau status periode OPREC. Sandi, token, jawaban formulir, NIM, tanggal lahir, isi berkas, body request, dan pesan exception tidak dicatat.
- Error 5xx menyimpan kategori aman (`HTTP_500` atau jenis exception bila tersedia) dan fingerprint untuk mengelompokkan kejadian. Detail stack tetap berada di log server dan tidak dikirim ke UI.

## Halaman

Ringkasan menghitung peristiwa 24 jam terakhir. Tabel dapat difilter menurut jenis dan hasil, serta pencarian pelaku/tindakan/ID. Pilihan filter langsung memperbarui data; pencarian diperbarui setelah jeda singkat saat mengetik. Hasil dipaginasi 20 baris. Panel rincian menampilkan metadata aman. UI mengikuti gaya Kelola User dan [DESIGN.md](./DESIGN.md): biru untuk aksi, status dengan warna dan teks, fokus keyboard, serta tabel yang bisa digeser pada layar kecil.

Tabel `audit_entries` tidak memiliki endpoint edit/hapus. Sesuai keputusan pengelola, sistem menghapus log sebelum awal hari yang jatuh lima tanggal kalender sebelum hari ini dalam zona `Asia/Jakarta`. Contoh: pada 1 November, log sebelum 27 Oktober pukul 00.00 WIB dihapus; log tanggal 27 Oktober dan setelahnya tetap ada. Semua jenis log mengikuti aturan yang sama. Perintah `php artisan audit:prune --dry-run` menampilkan jumlah target tanpa menghapus, sedangkan `php artisan audit:prune` menghapusnya. Laravel menjadwalkan perintah ini setiap hari pukul 00.05 WIB; hosting harus menjalankan `php artisan schedule:run` tiap menit melalui cron agar otomatisasi benar-benar aktif.
