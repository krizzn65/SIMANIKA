# Peraturan OPREC SIMANIKA

Tanggal penyusunan: **5 Oktober 2026 (WIB)**.

Dokumen ini menghimpun aturan OPREC sejak rancangan awal sampai revisi terbaru yang tercatat di dokumentasi proyek, serta mencocokkannya dengan implementasi saat penyusunan. Aturan lama yang sudah diganti dicatat pada bagian riwayat, agar tidak digunakan kembali sebagai aturan aktif. Arahan terbaru pengguna tetap mengungguli dokumen ini; perubahan berikutnya perlu dicatat di sini dan di `TODO.md`.

## 1. Prinsip dan alur utama

1. OPREC dikelola berdasarkan **periode kepengurusan**. Alur aktif adalah **Pendaftaran → Tes Tulis → Penilaian → Keputusan → Pengumuman → Pemeriksaan hasil**.
2. Area admin memisahkan Pendaftaran (`/admin/oprec`), Tes Tulis (`/admin/oprec/test`), Penilaian (`/admin/oprec/penilaian`), dan Pengumuman (`/admin/oprec/pengumuman`).
3. Setiap periode mempunyai paling banyak satu Tes Tulis dan satu konfigurasi pengumuman. Mengubah pengumuman memperbarui periode yang sama.
4. Pendaftaran dan Tes Tulis membutuhkan akun serta sesi aktif. Informasi umum OPREC dan pemeriksaan hasil melalui identitas dapat diakses dari halaman publik sesuai aturan rilis.
5. Izin harus diperiksa oleh server pada setiap operasi, termasuk akses URL langsung, unduhan berkas, dan endpoint kompatibilitas. Menyembunyikan tombol saja tidak cukup.
6. Keputusan penerimaan, jabatan organisasi, role akun, dan penugasan penilai adalah data yang berbeda. Masing-masing mengikuti kewenangannya sendiri.

## 2. Hierarki akun dan pengangkatan Pengurus

### 2.1 Super Admin

- Hanya ada **satu Super Admin resmi**. Akun harus memiliki role `super_admin` dan email yang cocok dengan konfigurasi `ADMIN_EMAIL` resmi HIMANIKA.
- Indeks unik database mencegah Super Admin kedua. Role `admin`, `leader`, `kwu`, dan `user` dapat dimiliki banyak akun.
- Hanya Super Admin resmi boleh membuka Kelola User dan mengubah role akun lain.
- **Hanya Super Admin boleh mengangkat atau mencabut Pengurus**, melalui perubahan role akun menjadi atau dari `leader`.
- Hanya Super Admin boleh memberi atau mencabut role Admin dan KWU, serta mengembalikan akun ke role User.
- `super_admin` bukan pilihan role yang boleh diberikan melalui pengelolaan akun biasa.
- Akun Super Admin dilindungi dari perubahan/penghapusan melalui API Kelola User; email resminya tidak dapat diganti melalui profil.
- Akun dengan nilai role `super_admin` tetapi tidak cocok dengan email resmi tidak memperoleh kewenangan Super Admin.

### 2.2 Role lain

| Role | Nama pada aplikasi | Lingkup konsol |
| --- | --- | --- |
| `super_admin` | Super Admin | Semua area, termasuk Kelola User dan seluruh kewenangan OPREC |
| `admin` | Admin | Area admin selain Kelola User; pengelolaan OPREC mengikuti pembatasan penilaian/keputusan |
| `leader` | Pengurus | Area OPREC dengan akses ringkasan dan akses penilaian berdasarkan penugasan |
| `kwu` | KWU | Area Merchandise; tidak boleh mengakses konsol OPREC |
| `user` | User/peserta | Halaman publik dan dashboard miliknya; tidak boleh mengakses konsol OPREC |

**Divisi KWU pada OPREC berbeda dari role akun `kwu`.** Memilih atau diterima pada divisi KWU tidak dengan sendirinya memberikan akses konsol Merchandise.

**Diterima OPREC tidak otomatis mengubah role akun menjadi Pengurus.** Keputusan menyimpan status, divisi, dan jabatan penerimaan. Pengangkatan role `leader` tetap tindakan tersendiri oleh Super Admin.

## 3. Matriks kewenangan OPREC

| Tindakan | Super Admin | Admin | Pengurus |
| --- | --- | --- | --- |
| Membaca ringkasan periode, jadwal tes, dan metadata pengumuman | Ya | Ya | Ya |
| Membuat/mengubah/membuka/menutup periode dan formulir | Ya | Ya | Tidak |
| Mengunggah poster pendaftaran dan logo divisi | Ya | Ya | Tidak |
| Membaca tabel pendaftar, koreksi formulir, unduh berkas melalui jalur pengelolaan | Ya | Ya | Tidak |
| Menghapus periode/pendaftar sesuai syarat penghapusan | Ya | Ya | Tidak |
| Membuat/mengubah soal dan jadwal Tes Tulis | Ya | Ya | Tidak |
| Membaca/menghapus kiriman Tes Tulis melalui jalur pengelolaan | Ya | Ya, dengan syarat | Tidak |
| Membaca peserta, jawaban, dan berkas melalui Penilaian | Ya | Ya | Hanya pada periode yang ditugaskan |
| Mengisi nilai dan komentar miliknya | Ya | Tidak | Hanya pada periode yang ditugaskan |
| Menunjuk/mencabut penilai periode | Ya | Tidak | Tidak |
| Menetapkan/mengoreksi Terima atau Tolak | Ya | Tidak | Tidak |
| Menentukan divisi dan jabatan penerimaan | Ya | Tidak | Tidak |
| Membuat/menjadwalkan/mengubah pengumuman | Ya | Ya | Tidak |
| Membaca daftar penerimaan pada pengumuman admin | Ya | Ya | Hanya pada periode yang ditugaskan |
| Membaca undangan grup penerimaan pada metadata admin | Ya | Ya | Tidak |

Semua izin menulis di atas tetap tunduk pada jadwal, status, penguncian, dan validasi. KWU/User/pengunjung tidak mendapat akses konsol OPREC. Peserta hanya mendapat akses data miliknya melalui jalur peserta atau hasil yang telah diverifikasi.

Pengurus yang ditugaskan tetap **tidak boleh** memakai endpoint pengelolaan pendaftar, editor, tabel jawaban tes lama, atau unduhan lama. Akses jawaban dan berkas untuk penilaian harus melalui endpoint `assessment` yang memeriksa penugasan dan menyaring data.

## 4. Periode, jadwal, dan status

- Label periode pada editor memakai format `YYYY/YYYY`, melalui pilihan tahun awal dan tahun akhir. Nama periode harus unik.
- Status periode adalah `draft`, `open`, atau `closed`. Periode draft tidak ditampilkan sebagai periode publik dan tidak membuka hasil.
- Periode publik dipilih secara deterministik dari periode **non-draft terbaru**, dengan urutan waktu pembuatan lalu ID.
- Enrollment dan pendaftaran baru hanya boleh dilakukan pada periode publik terbaru yang benar-benar terbuka. Mengirim ID periode lama langsung ke API tidak boleh melewati aturan ini.
- Pendaftaran aktif membutuhkan status `open`, jadwal lengkap, waktu server dalam jendela pendaftaran, dan minimal **tiga divisi**.
- Batas waktu aktif adalah **waktu mulai ≤ sekarang < waktu tutup**. Pada waktu tutup, kiriman baru ditolak.
- Editor tanggal pendaftaran memakai tanggal tanpa jam: tanggal buka menjadi **00.00.00 WIB**, tanggal tutup menjadi **23.59.59 WIB**. Tanggal penutupan harus setelah tanggal pembukaan.
- Tampilan tanggal pendaftaran mengikuti tanggal WIB. Tes Tulis dan pengumuman memakai tanggal **dan jam WIB**; data waktu dikirim dengan zona/offset eksplisit agar instan rilis tidak bergeser saat disimpan dan dibaca ulang.
- Saat periode pertama kali dibuka, sistem menyimpan `first_published_at`. Penanda ini menjadi bukti untuk membuat Tes Tulis.
- Akses workspace periode lama membutuhkan ID periode yang jelas serta kepemilikan pendaftaran/enrollment; akses tersebut tidak membuka pendaftaran baru pada periode lama.

| Kondisi | Perilaku peserta/publik |
| --- | --- |
| Belum ada periode atau jadwal belum lengkap | Informasi belum dibuka/jadwal menyusul |
| Periode `open`, sebelum waktu buka | Jadwal/countdown; belum dapat mengirim |
| Periode `open`, dalam jadwal, divisi memenuhi syarat | Enrollment dan formulir dapat digunakan |
| Periode ditutup atau batas tutup tercapai | Tidak dapat mendaftar; menunggu proses berikutnya |
| Pengumuman dipublikasikan untuk waktu mendatang | Countdown pengumuman; hasil tetap rahasia |
| Pengumuman dirilis dan pendaftaran telah ditutup | Pemeriksaan hasil dapat digunakan |

Gagal memuat API harus tampil sebagai kegagalan dengan kesempatan mencoba lagi, bukan dianggap sebagai periode kosong atau kiriman berhasil.

## 5. Perjalanan pendaftaran peserta

1. Peserta membuka `/oprec`. Tombol **Lihat Detail** membuka modal detail yang memuat informasi, poster, divisi, dan jadwal.
2. Tombol **Daftar Sekarang** menunggu pemeriksaan sesi selesai. Peserta tanpa sesi diarahkan login; kegagalan pemeriksaan sesi menyediakan coba ulang.
3. Enrollment mencatat bahwa akun masuk ke periode. Enrollment **belum merupakan formulir yang terkirim**; dashboard menampilkan kebutuhan melengkapi data.
4. Peserta mengisi formulir pada workspace `/dashboard/oprec` untuk periode terkait.
5. Data divalidasi sebelum popup konfirmasi kirim. Peserta dapat kembali memeriksa data, atau menyetujui pengiriman dengan penjelasan bahwa data yang tersimpan tidak dapat diedit sendiri.
6. Kiriman dianggap berhasil hanya setelah server menyimpan formulir dan berkas. Setelah itu peserta melihat rekap hanya-baca dan dapat mengikuti Tes Tulis ketika tersedia.

Aturan tambahan:

- Satu akun hanya boleh mempunyai satu pendaftaran per periode; satu NIM juga hanya boleh digunakan satu kali pada periode yang sama.
- Pengiriman ulang atau kiriman serentak tidak boleh membuat duplikasi; constraint database menjadi pelindung terakhir.
- Peserta tidak boleh membaca/mengubah data akun lain dengan mengganti ID.
- Draft teks, pilihan divisi, dan jabatan dipulihkan pada tab yang sama melalui `sessionStorage`, dengan kunci akun/periode/versi skema. Draft dihapus setelah kiriman berhasil.
- Berkas lokal tidak dipulihkan setelah refresh; peserta harus memilih ulang berkas.
- Render ulang/polling dengan periode dan versi skema yang sama tidak boleh mereset isian. Perubahan versi skema membutuhkan pemuatan formulir terbaru.
- Respons request lama yang sudah dibatalkan tidak boleh menimpa workspace terbaru.
- Sesi kedaluwarsa atau kegagalan penyimpanan harus memberi pesan dan kesempatan pemulihan; UI tidak boleh mengaku data sudah terkirim.

## 6. Formulir, identitas, dan tiga pilihan divisi

### 6.1 Identitas wajib

- Formulir dimulai dengan **Nama lengkap, NIM, Tanggal lahir, Angkatan, dan Pilihan divisi**. Pilihan divisi menjadi satu kelompok yang menyimpan prioritas 1–3.
- Nama, NIM, tanggal lahir, dan angkatan memiliki tipe dasar dan sifat wajib yang tetap. Pilihan angkatan berasal dari admin dan berupa tahun empat digit.
- NIM wajib diawali **`E31`**, panjang total 3–32 karakter; karakter berikutnya hanya huruf, angka, titik, atau tanda hubung.
- NIM dipangkas dan dinormalisasi ke huruf kapital di browser, proxy Next, dan Laravel. NIM disimpan sebagai string agar angka nol tidak hilang.
- Peringatan inline awalan NIM muncul saat awalan sudah menyimpang dari `E31`. Input kosong atau awalan yang masih mungkin dilengkapi (`E`, `E3`, `E31`) tidak langsung diberi peringatan awalan; kiriman tetap wajib lolos validasi lengkap.
- Tanggal lahir harus tanggal valid dalam format `YYYY-MM-DD`, minimal **1 Januari 1900** dan tidak melebihi hari berjalan menurut WIB.
- NIM dan tanggal lahir adalah data privat pendaftaran, bukan atribut wajib profil akun umum. Keduanya digunakan untuk mencocokkan hasil.

### 6.2 Divisi dan prioritas

- Peserta wajib memilih **tepat tiga divisi berbeda** dari divisi periode itu.
- Urutan pilihan menetapkan prioritas 1, 2, dan 3. Klik ulang membatalkan pilihan; pengiriman menunggu tiga pilihan lengkap.
- Ketiga ID disimpan terpisah sebagai `divisi_pilihan_1`, `divisi_pilihan_2`, dan `divisi_pilihan_3`.
- Browser, proxy, dan backend memvalidasi jumlah, keunikan, serta keanggotaan ketiga divisi pada periode yang sama, termasuk jika skema lama berubah.
- Pilihan divisi menggunakan ID tersimpan. Label bebas atau ID dari periode lain tidak sah.
- Divisi yang sudah mempunyai pendaftar tidak boleh diganti melalui pengelolaan periode.

### 6.3 Pertanyaan dinamis

- Formulir pendaftaran maksimal **40 field**, dengan paling banyak 35 pertanyaan tambahan di luar lima kelompok awal.
- Tipe yang didukung: teks, email, telepon, Link/URL, angka, tanggal, paragraf, select, radio, checkbox, dan berkas.
- Nama field harus unik, mengikuti `[a-z][a-z0-9_]*`, maksimal 50 karakter, dan tidak memakai nama terlarang seperti `oprec_id`, `schema_version`, `__proto__`, `constructor`, atau `prototype`.
- Sifat wajib, petunjuk, placeholder, panjang teks, batas angka, opsi, format berkas, dan ukuran berkas mengikuti skema admin; server tetap menjadi pemeriksa otoritatif.
- Link hanya menerima URL HTTP/HTTPS yang valid. Nilai pilihan harus berasal dari opsi sah; opsi tidak boleh duplikat dan batas minimum angka tidak boleh melebihi maksimum.
- Paragraf memakai batas bawaan 3.000 karakter; batas field yang dikonfigurasi tetap diperiksa server.
- Pertanyaan boleh berlaku untuk semua divisi atau divisi tertentu. Peserta hanya menjawab pertanyaan yang sesuai dengan salah satu dari tiga pilihannya.
- Jawaban/berkas pada pertanyaan yang tidak berlaku dikeluarkan dari kiriman dan penyimpanan, termasuk payload palsu yang dikirim langsung ke API.
- Tabel admin memakai kolom identitas tetap lalu field tambahan sesuai urutan skema. Pertanyaan di luar sasaran ditampilkan sebagai **Tidak berlaku**.

## 7. Jabatan pendaftaran dan jabatan penerimaan

Aturan aktif mengikuti revisi **3 Oktober 2026**. Katalog pendaftaran tetap dan berbeda dari katalog penerimaan.

### 7.1 Katalog pendaftaran

| Divisi | Jabatan yang boleh dilamar |
| --- | --- |
| BPH | Wakil Ketua Umum; Sekretaris 2; Bendahara 2 |
| Humas | Staff Divisi Humas |
| PSDM | Staff Divisi PSDM |
| Kominfo | Staff Divisi Kominfo |
| KWU | Staff Divisi KWU |
| Ristek | Staff Divisi Ristek |
| Divisi lain | `Staff Divisi {nama divisi}` |

- Jabatan disimpan sesuai prioritas dalam `jabatan_pilihan_1`, `jabatan_pilihan_2`, dan `jabatan_pilihan_3`.
- Jika BPH dipilih, jabatan BPH wajib ditentukan peserta. Untuk divisi yang hanya mempunyai satu jabatan staf umum, backend mengisinya otomatis jika tidak dikirim.
- Ketua Umum, Sekretaris 1, Bendahara 1, petinggi divisi, dan bidang staf khusus tidak boleh dilamar melalui formulir pendaftaran.
- Editor menampilkan katalog sebagai informasi. Admin tidak boleh menambah, menghapus, mereset, atau memasukkan katalog jabatan bebas.
- API menurunkan katalog dari nama divisi, termasuk ketika membaca metadata lama. Payload katalog yang berbeda ditolak; katalog yang tidak dikirim memakai default.
- Formulir peserta, pratinjau, dan koreksi Admin memakai katalog yang sama.

### 7.2 Katalog penerimaan

Hanya Super Admin menetapkan jabatan penerimaan. Jabatan penerimaan **tidak wajib sama** dengan jabatan yang dilamar.

| Divisi | Jabatan penerimaan yang tersedia |
| --- | --- |
| BPH | Ketua Umum; Wakil Ketua Umum; Sekretaris 1; Sekretaris 2; Bendahara 1; Bendahara 2 |
| Humas | Ketua Divisi Humas; Wakil Ketua Divisi Humas; Sekretaris Divisi Humas; Staff Bidang Internal; Staff Bidang External |
| PSDM | Ketua Divisi PSDM; Wakil Divisi PSDM; Sekretaris Divisi PSDM; Staff Bidang Akademik; Staff Bidang Non-Akademik |
| Kominfo | Koordinator Kominfo; Wakil Koordinator Kominfo; Staff Media Growth; Staff Copywriting; Staff Kreatif & Desain; Staff Video Profile |
| KWU | Ketua Divisi Kewirausahaan; Wakil Divisi KWU; Sekretaris Divisi KWU; Staff Bidang Kewirausahaan; Staff Bidang Kemitraan |
| Ristek | Ketua Divisi Riset & Teknologi; Wakil Divisi Ristek; Sekretaris Divisi Ristek; Staff Bidang Riset Keilmuan; Staff Bidang Pengembangan Teknologi |
| Divisi lain | `Staff Divisi {nama divisi}` |

Nama jabatan di tabel mengikuti nilai katalog aplikasi, termasuk ejaan `Staff` dan `External`.

## 8. Koreksi dan penghapusan oleh pengelola

- Super Admin/Admin dapat mengoreksi isian formulir melalui jalur pengelolaan; peserta dan Pengurus tidak mendapat izin tersebut.
- Koreksi wajib menyertakan `schema_version` terbaru dan menjalankan kembali validasi identitas, tiga pilihan divisi, jabatan, serta pertanyaan yang berlaku.
- Berkas unggahan tidak boleh diganti lewat request JSON koreksi formulir.
- Koreksi pilihan peserta yang sudah diterima tidak boleh menghapus divisi penerimaannya dari tiga pilihan.
- NIM koreksi yang duplikat pada periode sama menghasilkan konflik dengan rollback, bukan perubahan parsial.
- Setelah ada pendaftar, perubahan skema membutuhkan kenaikan versi. Perbedaan urutan properti objek JSON saja tidak dihitung sebagai perubahan, tetapi urutan field/soal dan tipe nilai tetap diperhatikan.
- Setelah pengumuman dipublikasikan/dijadwalkan, skema dan koreksi formulir terkunci; menaikkan versi tidak boleh melewati lock. Pendaftaran tetap ditutup.
- Periode tidak boleh dihapus jika sudah mempunyai pendaftar.
- Pendaftar hanya boleh dihapus sebelum pengumuman, selama status masih `pending` dan belum memiliki ulasan penilaian.
- Jawaban Tes Tulis tidak boleh dihapus jika sudah memiliki ulasan, keputusan sudah ditetapkan, atau pengumuman sudah dipublikasikan.
- Penghapusan pendaftar/jawaban yang sah harus membersihkan berkas privat terkait, termasuk berkas Tes Tulis yang ikut terhapus relasinya.
- Penghapusan memerlukan popup konfirmasi yang menunjukkan sasaran, menyediakan Batal, dan mencegah klik ganda selama proses.

## 9. Tes Tulis

### 9.1 Pembuatan dan soal

- Hanya Super Admin/Admin boleh membuat dan mengelola Tes Tulis.
- Periode harus pernah dibuka, dibuktikan oleh `first_published_at`, dan belum memiliki Tes Tulis.
- Periode historis yang `open` atau mempunyai pendaftar diberi bukti oleh migrasi; periode `closed` tanpa bukti tidak diasumsikan pernah dibuka.
- Popup pembuatan meminta periode dan tanggal/jam mulai–selesai WIB; judul dibuat otomatis. Waktu akhir harus setelah awal.
- Editor mendukung maksimal **40 soal**, ID unik, teks pertanyaan tidak kosong, dan pengaturan wajib/opsional.
- Implementasi mendukung teks singkat, paragraf, email, telepon, URL, angka, tanggal, select, pilihan satu, checkbox, dan berkas.
- Soal select/pilihan satu membutuhkan **2–10 opsi unik yang tidak kosong**.
- Sasaran divisi harus berasal dari periode itu dan tidak duplikat. Tanpa sasaran, soal berlaku untuk semua peserta.
- Menyimpan minimal satu soal valid membuat tes siap (`published=true`), mengikuti jadwal; tidak ada tombol publikasi tes terpisah.
- Jadwal dan soal boleh disesuaikan sebelum tes dimulai. Setelah tes yang siap dimulai atau sudah ada kiriman, soal dan jadwal terkunci, termasuk pada pemeriksaan ulang server dalam transaksi.
- Pratinjau editor dapat mensimulasikan hingga tiga pilihan divisi dan memakai aturan/renderer peserta. Tombol kirim pratinjau nonaktif.

### 9.2 Peserta dan kiriman

- Tes Tulis hanya tersedia bagi pemilik **pendaftaran yang sudah dikirim**. Enrollment saja tidak cukup.
- Kartu Tes Tulis muncul di bawah Data & administrasi. Sebelum mulai, soal dirahasiakan dan countdown ditampilkan.
- Dalam jendela aktif, peserta hanya mendapat soal yang berlaku untuk salah satu dari tiga pilihan divisinya.
- Satu peserta hanya boleh mengirim satu jawaban Tes Tulis untuk periode itu. Jawaban tersimpan menjadi hanya-baca dan dapat dibaca kembali setelah refresh.
- Server memeriksa kepemilikan, kesiapan tes, waktu, pertanyaan yang berlaku, tipe, kewajiban, panjang jawaban, dan berkas. Constraint unik mencegah kiriman ganda serentak.
- Batas jawaban tes: teks singkat maksimal **500 karakter**, paragraf **5.000 karakter**, dan tipe teks lain **200 karakter**. Berkas Tes Tulis maksimal **5 MB per berkas**.
- Payload jawaban tes yang memuat ID pertanyaan di luar soal yang berlaku ditolak; peserta tidak boleh menyisipkan jawaban untuk divisi lain.
- Setelah waktu tutup tercapai, kiriman baru ditolak meskipun formulir sudah dibuka sebelumnya.
- Jika pengelola menghapus jawaban sesuai syarat, peserta boleh mengirim ulang hanya selama tes masih aktif.
- Detail pada Penilaian hanya menampilkan soal yang berlaku; soal divisi lain tidak dilabeli Tidak dijawab. Soal opsional yang berlaku tetap ditampilkan.
- Jawaban, tautan berkas, dan unduhan langsung untuk soal yang tidak berlaku tidak boleh diberikan melalui Penilaian.

## 10. Penugasan dan penilaian

### 10.1 Penugasan penilai

- **Hanya Super Admin** boleh menunjuk atau mencabut penilai, dan sasaran penugasan harus akun ber-role **Pengurus (`leader`)**.
- Penugasan berlaku per periode; role Pengurus saja tidak memberi akses peserta/jawaban/berkas Penilaian semua periode.
- Pengurus tanpa penugasan ditolak pada endpoint Penilaian dan unduhan privat periode itu. Daftar penerimaan pengumuman juga kosong, dengan penjelasan perlunya penugasan.
- Pencabutan langsung menolak akses berikutnya, tetapi **tidak menghapus nilai dan komentar historis**.
- Penugasan/pencabutan terkunci setelah pengumuman dipublikasikan, termasuk ketika rilis masih dijadwalkan untuk masa depan.
- Super Admin dapat menilai tanpa penugasan Pengurus. Admin mempunyai akses Penilaian **hanya baca**.

### 10.2 Peserta, aspek, dan perhitungan

- Tabel Penilaian hanya mencakup peserta yang sudah mengirim Tes Tulis.
- Penilai mengisi enam aspek: **Pemahaman, Kepribadian, Public Speaking, Kejujuran, Problem Solving, dan Kerja Sama**.
- Setiap aspek bernilai **0–10**, maksimal satu angka desimal; koma/titik desimal diterima dan dinormalisasi.
- Nilai kosong berarti belum dinilai; **nol adalah nilai sah**. Array, objek, boolean, nilai di luar rentang, atau desimal berlebih ditolak.
- Komentar maksimal **2.000 karakter**. Setiap penilai hanya mengubah ulasan miliknya.
- Total baru tersedia ketika enam aspek lengkap: **jumlah enam nilai / 60 × 100**.
- Rata-rata adalah rerata Total semua penilai yang enam aspeknya lengkap. Ulasan belum lengkap tidak dimasukkan; ulasan lengkap historis tetap dipertahankan ketika akses dicabut.
- Perhitungan dilakukan server; tampilan Total dan Rata-rata dibulatkan menjadi dua angka desimal.
- Warna skor: **0–<5 merah; 5–<8 kuning; 8–<10 hijau; tepat 10 biru**.
- Pengurus baru dapat melihat nilai/komentar penilai lain dan rata-rata **untuk peserta tersebut** setelah enam aspek miliknya lengkap. Super Admin/Admin dapat membaca sesuai izin mereka.
- Nilai tinggi atau rata-rata tidak otomatis menetapkan penerimaan. Keputusan tetap milik Super Admin.
- Autosave mempertahankan input saat gagal, memberikan status serta coba ulang, dan tidak menghilangkan fokus dengan memuat ulang seluruh tabel.

### 10.3 Tabel dan kerahasiaan

- Penilaian menampilkan identitas, angkatan, tiga pilihan divisi/jabatan, isian pendaftaran yang relevan, berkas melalui tautan privat, detail Tes Tulis, ulasan, rata-rata, dan keputusan.
- Daftar Penilaian tidak mengirim tanggal lahir, field usang, path mentah berkas, JSON lengkap jawaban tes, atau email akun yang tidak diperlukan.
- Pagination menggunakan **20 baris per halaman**. Pencarian/filter dijalankan server sebelum pagination.
- Urutan peserta berdasarkan Pilihan 1: **BPH → Humas → PSDM → Kominfo → KWU → Ristek → divisi lain**, lalu ID pendaftaran untuk urutan tetap.
- Filter keputusan: semua, pending, diterima, ditolak. Filter kelengkapan: semua, belum lengkap, lengkap; kelengkapan selalu mengacu penilai yang sedang login dan tidak tersedia bagi Admin hanya-baca.
- Panel jawaban menggunakan panel samping pada desktop mulai 1280 px, dialog di bawahnya, dan dialog layar penuh pada HP di bawah 640 px. Respons detail lama tidak boleh menimpa peserta yang baru dipilih.

## 11. Keputusan penerimaan

- **Hanya Super Admin** boleh menetapkan atau mengoreksi **Terima/Tolak**, termasuk melalui endpoint keputusan lama.
- Keputusan hanya berlaku untuk pendaftaran pada periode itu yang sudah mengirim Tes Tulis.
- Status awal `pending`; keputusan menggunakan `accepted` atau `rejected`.
- Penerimaan wajib memilih **satu dari tiga divisi pilihan peserta**, dari periode yang sama, dan **jabatan penerimaan yang sah** dari katalog divisi tersebut.
- Penolakan tidak menyimpan divisi/jabatan penerimaan.
- Keputusan yang berubah dicatat dalam riwayat audit: pelaku, waktu, status lama/baru, divisi lama/baru, dan jabatan lama/baru.
- Penerimaan historis yang belum mempunyai jabatan ditampilkan sebagai belum ditetapkan dan perlu dilengkapi sebelum pengumuman.
- Keputusan terkunci sejak `pengumuman_published=true`, bukan hanya setelah waktu rilis tiba.
- Pengangkatan role akun Pengurus tetap mengikuti bagian 2; menetapkan jabatan penerimaan tidak memberikan izin konsol secara otomatis.

## 12. Pengumuman, penguncian, dan hasil

### 12.1 Syarat publikasi

Super Admin/Admin dapat membuat atau menjadwalkan pengumuman hanya jika:

1. Pendaftaran periode itu pernah dibuka.
2. Periode bukan draft dan pendaftaran sudah ditutup secara manual atau waktunya telah berakhir.
3. Tes Tulis tersedia, siap/published, dan waktunya sudah selesai.
4. Ada peserta yang mengirim Tes Tulis.
5. **Seluruh pengirim Tes Tulis** sudah mempunyai keputusan Terima atau Tolak.
6. Semua peserta diterima mempunyai divisi pada periode yang sama dan jabatan penerimaan.

Server memeriksa ulang syarat dalam transaksi dengan lock periode. Aturan saat ini tidak mensyaratkan seluruh Pengurus menyelesaikan semua ulasan untuk publikasi; syarat keputusan lengkap tetap wajib.

### 12.2 Metadata dan waktu penguncian

- Pengumuman meminta judul, deskripsi, poster JPG/PNG/WebP maksimal **5 MB**, tanggal/jam WIB, dan undangan grup dengan format `https://chat.whatsapp.com/...`.
- Poster wajib tersedia saat pertama kali menyimpan pengumuman; pembaruan dapat mempertahankan poster yang ada. Jadwal baru tidak boleh berada di masa lalu.
- Poster pengumuman disimpan privat; endpoint publik baru melayaninya setelah rilis.
- Menyimpan/menjadwalkan pengumuman menandai `pengumuman_published=true` dan menutup pendaftaran.

| Data/operasi | Mulai terkunci |
| --- | --- |
| Soal dan jadwal Tes Tulis | Tes siap telah dimulai atau sudah ada kiriman |
| Nilai, komentar, keputusan, dan penugasan penilai | Pengumuman dipublikasikan/dijadwalkan |
| Skema dan koreksi formulir, penghapusan jawaban/pendaftar | Pengumuman dipublikasikan/dijadwalkan; syarat penghapusan dapat mengunci lebih awal |
| Membuka kembali pendaftaran | Pengumuman dipublikasikan/dijadwalkan |
| Metadata pengumuman | Waktu rilis telah tercapai dan pengumuman dirilis |

- Metadata pengumuman masih dapat diperbarui **sebelum rilis**, dengan syarat tetap valid. Menggeser jadwal tidak membuka kembali penilaian/keputusan.
- Hasil baru boleh keluar ketika periode bukan draft, pengumuman published, waktu rilis tercapai, dan pendaftaran telah ditutup. Aturan ini juga berlaku pada dashboard/workspace.
- Pesan hasil, identitas hasil, divisi/jabatan penerimaan, dan tautan grup tidak boleh bocor sebelum rilis.

### 12.3 Pemeriksaan hasil

- Kartu pengumuman muncul di bawah kartu Pendaftaran pada `/oprec`; sebelum rilis menampilkan countdown memakai waktu server.
- Countdown tidak melakukan request API tiap detik; pemeriksaan status dilakukan saat batas jadwal tercapai atau tab kembali aktif.
- Setelah rilis, pemeriksaan meminta **NIM + tanggal lahir**, dicocokkan dengan data pendaftaran **pengirim Tes Tulis** yang sudah diputuskan.
- Identitas salah dan peserta yang tidak memenuhi syarat menghasilkan respons gagal generik yang sama, agar tidak menjadi sarana enumerasi peserta.
- Verifikasi menghasilkan tiket terenkripsi yang berlaku **30 menit**, terbatas pada periode dan pendaftaran terkait.
- Browser menyimpan tiket hanya pada cookie **HttpOnly, SameSite=Lax, Secure pada HTTPS**, dengan path terbatas pada hasil periode. NIM, tanggal lahir, dan tiket tidak dimasukkan ke URL atau localStorage.
- Halaman `/oprec/pengumuman/{id}` tetap dapat di-refresh selama tiket sah. Tiket palsu, kedaluwarsa, atau beda periode ditolak; peserta perlu memverifikasi ulang saat tiket berakhir.
- Peserta diterima melihat nama, NIM, divisi, jabatan, dan tautan grup. Peserta ditolak mendapat pesan penyemangat tanpa tautan grup.
- Halaman hasil **tidak memuat poster**, menggunakan respons pribadi `no-store`, dan `noindex`.
- Tautan grup tidak dikirim melalui resource OPREC publik, kepada Pengurus pada metadata admin, maupun kepada peserta ditolak.
- Tabel penerimaan admin berisi 20 baris per halaman, diurutkan menurut divisi BPH–Ristek, urutan katalog jabatan, nama, lalu ID. Ini bukan daftar hasil publik yang dapat dibaca tanpa verifikasi.
- Endpoint hasil lama tetap mengikuti aturan verifikasi baru untuk pengumuman bermetadata baru; kompatibilitas data historis dipertahankan.

## 13. Berkas, keamanan API, dan konsistensi data

- Berkas pendaftaran menerima PDF/JPG/JPEG/PNG sesuai skema, maksimal **10 MB per berkas** atau batas field yang lebih kecil. Berkas Tes Tulis menerima format yang sama dengan batas **5 MB per berkas**. Jumlah berkas dalam satu kiriman maksimal **11 MB**; request maksimal **12 MB** untuk menyediakan overhead multipart.
- Batas gabungan berkas diperiksa backend pada pendaftaran dan Tes Tulis. Tes Tulis juga menolak Content-Length di atas 12 MB.
- Poster pendaftaran/logo divisi menerima JPG/PNG/WebP maksimal **5 MB** dan digunakan sebagai aset publik. Berkas peserta dan poster pengumuman memakai penyimpanan privat sesuai aturan akses masing-masing.
- Server memvalidasi tipe/MIME isi berkas, bukan hanya nama ekstensi. Path internal storage tidak boleh dikirim sebagai pengganti tautan unduh yang terotorisasi.
- Unduhan memeriksa periode, pendaftaran/kiriman, field yang sah, dan izin. Jalur Penilaian memeriksa skema aktif serta penugasan Pengurus; soal Tes Tulis yang tidak berlaku tidak dapat diunduh lewat URL langsung.
- API peserta/admin memakai autentikasi Sanctum dan pemeriksaan CSRF sesuai kontrak sesi. Proxy Next meneruskan sesi/CSRF hanya ke backend yang dikonfigurasi.
- Proxy hanya meneruskan field yang diizinkan. Server memvalidasi ulang skema, versi, status, jadwal, tiga pilihan, jabatan, kepemilikan, dan berkas.
- Enrollment, submit, koreksi, perubahan/penghapusan periode, penilaian, keputusan, penugasan, dan publikasi memakai transaksi/row lock pada operasi terkait. Pemeriksaan sebelum transaksi harus diulang pada data terkini.
- Kiriman enrollment, pendaftaran, dan Tes Tulis berbagi limiter **10 permintaan per menit per akun terautentikasi**. IP proxy dan email formulir tidak menjadi identitas pembatas sehingga peserta berbeda tidak saling memblokir lewat limiter ini.
- Verifikasi pengumuman baru dibatasi **5 permintaan/menit per kunci NIM/periode** dan **600/menit per IP**. Pembacaan hasil dibatasi **30/menit per tiket/periode** dan **1.200/menit per IP**. Jalur lookup historis dibatasi **5/menit per kunci NIM/periode** dan **20/menit per IP**.
- Respons hasil dan data pribadi tidak boleh masuk cache bersama. Respons error server tidak boleh mengungkap rahasia konfigurasi atau stack internal.
- Respons penting: `401/419` untuk masalah sesi/CSRF, `403` untuk izin ditolak, `404` untuk data tidak ditemukan sesuai kebijakan privasi, `409` untuk konflik/lock/versi/jadwal, `422` untuk validasi, dan `429` untuk batas permintaan.
- Kegagalan tidak boleh meninggalkan data parsial atau berkas baru yatim; rollback dan pembersihan mengikuti transaksi yang gagal.

## 14. Aturan tampilan dan interaksi

- Halaman publik memakai urutan: headline/deskripsi → kartu divisi → kartu pratinjau pendaftaran → kartu pengumuman bila tersedia → FAQ → footer bersama.
- Detail OPREC memakai modal; poster tampil utuh. Tidak ada kewajiban mengembalikan halaman `/oprec/detail` lama.
- Jika belum ada periode/jadwal, tampilkan informasi belum dibuka tanpa formulir dummy. Kartu profil divisi cadangan tidak menandakan divisi pendaftaran sudah dibuka.
- Info instruksi dapat ditempatkan pada pengantar formulir dan petunjuk tiap field; tidak perlu mengembalikan section benefit/timeline/persyaratan/CTA lama yang sudah dihapus.
- Formulir peserta dan editor/pratinjau harus konsisten. Field wajib ditandai bintang merah dan pesan invalid jelas.
- Tabel dengan banyak kolom memakai gulir horizontal di area tabel, tanpa menyebabkan halaman meluap pada HP. Nomor baris mengikuti halaman dan ukuran pagination.
- Pencarian dan filter pendaftar diproses server pada seluruh data, bukan hanya halaman pertama. Respons lama diabaikan ketika periode/filter berubah.
- Dialog konfirmasi, penugasan, detail, dan pengumuman mendukung keyboard, Escape, pengembalian fokus, loading/error, serta pencegahan kiriman ganda.
- Animasi menghormati `prefers-reduced-motion`. Perubahan jadwal/status tidak boleh membocorkan soal atau hasil lebih awal.

## 15. Data historis, maintenance, dan simulasi

- Tabel/migrasi historis yang pernah diterapkan tidak boleh dihapus langsung hanya karena alur UI lama sudah diganti. Penghapusan fisik memerlukan audit data dan rencana migrasi.
- Normalisasi jabatan pendaftaran lama tersedia melalui `php artisan oprec:normalize-registration-positions {period} --dry-run`; dry-run tidak menulis database atau cadangan.
- Koreksi nyata hanya pada local/testing, terkunci pada periode sasaran, dengan cadangan terenkripsi dan transaksi. BPH lama dipetakan Ketua Umum → Wakil Ketua Umum, Sekretaris 1 → Sekretaris 2, Bendahara 1 → Bendahara 2; divisi lain menjadi staf umum.
- Pemetaan BPH tidak dikenal atau referensi divisi rusak membatalkan koreksi. Pengulangan tidak membuat perubahan/cadangan tambahan.
- Normalisasi pendaftaran tidak boleh mengubah nilai, jawaban tes, keputusan, jabatan penerimaan, jadwal pengumuman, akun asli, modul lain, atau berkas historis. CV/jawaban naratif lama tetap dokumen historis.
- Data simulasi dipertahankan sampai pengguna meminta pembersihan. Menulis dokumen aturan ini tidak mengotorisasi penghapusan data simulasi.
- Pembersihan simulasi memakai manifest ID, dry-run, dan verifikasi checksum akun asli/modul lain; hanya tersedia pada local/testing tanpa endpoint HTTP.
- Kredensial, manifest privat, cadangan sandi, profil browser, serta artefak simulasi tidak boleh dimasukkan ke git atau dicetak ke dokumentasi publik.

## 16. Riwayat keputusan dan aturan yang digantikan

| Tanggal | Keputusan | Dampak pada aturan aktif |
| --- | --- | --- |
| 21 September 2026 | Formulir dinamis, jadwal, poster admin, dan pencocokan NIM/tanggal lahir | Dasar identitas dan skema; detail/alur hasil mengikuti revisi berikutnya |
| 25 September 2026 | Identitas awal dan konsep tahap pendaftaran/tes/pengumuman | Bukan alasan menghidupkan endpoint `/stages` lama |
| 26 September 2026 | Tepat tiga divisi, enrollment, modal detail, dan workspace peserta | Menggantikan pilihan kedua opsional dan navigasi detail lama |
| 27 September 2026 | NIM `E31`, draft tab, konfirmasi kirim, pengelolaan pendaftaran mandiri, jabatan menggantikan kuota | Kuota bukan dasar aktif pemilihan divisi/jabatan; pendaftaran mandiri kemudian dilengkapi subhalaman tes/penilaian/pengumuman |
| 28 September 2026 | Periode publik terbaru, Tes Tulis satu per periode, hierarki role, Super Admin tunggal | Menggantikan sidebar OPREC satu halaman dan hak Kelola User untuk Admin biasa |
| 29 September 2026 | Penilaian, penugasan Pengurus, enam aspek, keputusan khusus Super Admin | Pengurus tidak otomatis menjadi penilai semua periode; Admin tidak boleh memberi nilai/keputusan |
| 30 September 2026 | Urutan peserta, pengumuman terjadwal, tiket hasil HttpOnly, penguncian | Menggantikan penyajian hasil inline lama untuk pengumuman baru |
| 2 Oktober 2026 | Audit akses/privasi/validasi dan perbaikan simulasi | Menggantikan catatan lama yang membolehkan Pengurus mengelola OPREC atau memakai endpoint peserta/berkas lama |
| 3 Oktober 2026 | Katalog pendaftaran tetap BPH/staf umum, terpisah dari penerimaan | Menggantikan katalog jabatan pendaftaran bebas atau lamaran langsung ke seluruh jabatan petinggi/bidang staf |

Catatan yang **tidak boleh dianggap sebagai aturan umum**:

- Jumlah peserta, jumlah penilai, jumlah penerimaan/penolakan, dan pembagian kursi pada simulasi adalah data skenario; bukan kuota atau syarat penerimaan permanen.
- Jabatan petinggi unik pada skenario simulasi tidak membuktikan adanya constraint unik jabatan di fitur keputusan saat ini. Jangan menyatakan larangan duplikasi jabatan sebagai aturan sistem yang sudah terverifikasi tanpa keputusan dan implementasi tambahan.
- Hasil tes/build lama adalah bukti pada saat pengujian tersebut dilakukan, bukan jaminan bahwa seluruh integrasi produksi telah diverifikasi.

## 17. Referensi dan batas verifikasi

Sumber konsolidasi:

- [Dokumentasi teknis dan riwayat OPREC](../frontend/docs/oprec.md).
- [Keputusan dan progres proyek](TODO.md), terutama revisi 28 September–3 Oktober 2026.
- [Audit OPREC 2 Oktober 2026](AUDIT_OPREC_2026-10-02.md).
- [Role akun dan area akses](../backend/app/Models/User.php) serta [pengelolaan role](../backend/app/Http/Controllers/Admin/UserController.php).
- [Middleware akses Pengurus](../backend/app/Http/Middleware/OprecAccessMiddleware.php).
- [Validasi pengelolaan periode](../backend/app/Http/Requests/Oprec/SaveOprecRequest.php), [pengelolaan periode](../backend/app/Http/Controllers/Admin/OprecController.php), dan [koreksi/penghapusan pendaftar](../backend/app/Http/Controllers/Admin/OprecRegistrantController.php).
- [Katalog jabatan pendaftaran](../backend/app/Models/OprecDivision.php) dan [katalog penerimaan/perhitungan/keputusan](../backend/app/Services/OprecAssessmentService.php).
- [Penugasan dan penilaian](../backend/app/Http/Controllers/Admin/OprecAssessmentController.php).
- [Pengelolaan Tes Tulis](../backend/app/Http/Controllers/Admin/OprecWrittenTestController.php) dan [penghapusan kiriman tes](../backend/app/Http/Controllers/Admin/OprecWrittenTestSubmissionController.php).
- [Syarat rilis dan tiket pengumuman](../backend/app/Services/OprecAnnouncementService.php), [publikasi pengumuman](../backend/app/Http/Controllers/Admin/OprecAnnouncementController.php), dan [pembatas permintaan](../backend/app/Providers/AppServiceProvider.php).

Penyusunan dokumen ini memeriksa dokumentasi dan implementasi; tidak mengubah kode, role akun, database, atau jadwal. Verifikasi deployment yang masih tercatat perlu dikerjakan meliputi konfigurasi sesi Sanctum/cookie/CSRF antar-origin, berkas aktual pada staging, beban/concurrency dan row lock PostgreSQL, serta migrasi pada lingkungan deployment. Bukti simulasi lokal dan browser fixture tidak menggantikan pengujian lingkungan tersebut.
