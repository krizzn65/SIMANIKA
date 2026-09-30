# Aturan kerja SIMANIKA

Sebelum mengubah kode, baca **seluruh file MD proyek** di root, `frontend/docs/`, dan `backend/docs/`, ditambah `README.md`/`AGENTS.md`/`CLAUDE.md` pada folder yang disentuh. Abaikan dokumentasi vendor, `node_modules`, plugin, dan artefak hasil generasi. Selaraskan keputusan implementasi dengan seluruh dokumen tersebut, terutama kontrak API, stack, keamanan, struktur folder, dan kriteria selesai dalam `architecture.md`.

Instruksi terbaru pengguna mengungguli dokumen lama bila ada konflik. Catat perubahan keputusan dan pekerjaan yang tertunda di `TODO.md`; jangan menandai tugas selesai sebelum terverifikasi. Pertahankan aturan khusus di `frontend/AGENTS.md`, termasuk membaca dokumentasi Next.js lokal sebelum mengubah frontend.

Untuk setiap perubahan frontend/backend, periksa kontrak kedua sisi, validasi input di browser dan server, otorisasi, state sesi, serta hasil build/test yang relevan. Jangan mencetak nilai rahasia dari `.env` atau memasukkan kredensial ke git.
