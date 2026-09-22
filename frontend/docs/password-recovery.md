# Pemulihan sandi

- Halaman `/forgot-password` menerima email dan mengirim `POST /api/auth/forgot-password` pada aplikasi Next.js. Route server meneruskan `{ "email": "..." }` ke `${API_BASE_URL}/auth/forgot-password`.
- Email dari backend harus berisi tautan ke `${PUBLIC_SITE_URL}/reset-password?token=<token>&email=<email>`. Token dibuat, disimpan, dibatasi masa berlakunya, dan diverifikasi oleh backend. Frontend tidak membuat atau mengirim token sendiri.
- Halaman `/reset-password` membaca token dan email dari tautan, lalu mengirim `POST /api/auth/reset-password` pada aplikasi Next.js. Route server meneruskan `token`, `email`, `password`, dan `password_confirmation` ke backend.
- `API_BASE_URL` atau `NEXT_PUBLIC_API_BASE_URL` harus berakhiran `/api`, sesuai kontrak API proyek. Tanpa backend yang dikonfigurasi, halaman menampilkan pesan layanan belum tersedia dan tidak mengklaim email telah terkirim.
- Respons permintaan email sengaja generik agar keberadaan akun tidak terbuka ke pengunjung. Backend perlu menerapkan pembatasan percobaan, masa berlaku token, dan pengiriman email.
