# Pemulihan sandi

- Frontend dibangun sebagai static export. Halaman `/forgot-password` langsung mengirim `POST` ke `${NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password`; tidak ada route server Next.js pada hosting FTP.
- Laravel mengirim tautan ke `${FRONTEND_URL}/reset-password?token=<token>&email=<email>`. Token dibuat, disimpan, dibatasi masa berlakunya, dan diverifikasi oleh backend.
- Halaman `/reset-password` mengirim `token`, `email`, `password`, dan `password_confirmation` langsung ke `${NEXT_PUBLIC_API_BASE_URL}/auth/reset-password`.
- `NEXT_PUBLIC_API_BASE_URL` harus berakhiran `/api` dan diisi sebelum `next build`. Untuk produksi sekarang: `https://himanika.wsmif.myhost.id/api`. Tanpa konfigurasi itu, frontend menampilkan kegagalan layanan dan tidak memakai alamat lokal.
- Respons permintaan email sengaja generik agar keberadaan akun tidak terbuka ke pengunjung. Backend perlu menerapkan pembatasan percobaan, masa berlaku token, dan pengiriman email.
- `ADMIN_EMAIL` menunjukkan akun Super Admin. Pengirim ditentukan oleh `MAIL_FROM_ADDRESS`; pada hosting kedua nilai disamakan menjadi `himanikamif@gmail.com`. Pengiriman memerlukan SMTP dan kredensial yang disimpan hanya dalam `.env` hosting.
