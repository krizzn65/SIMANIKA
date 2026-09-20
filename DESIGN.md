# SIMANIKA Design System

> **Arah visual:** Neo-Arcade Editorial  
> **Versi:** 1.0  
> **Tanggal:** 14 September 2026  
> **Status:** Design direction — siap menjadi acuan UI implementation  
> **Referensi visual:** [Spartan AI — Framer Template](https://spartanai.framer.website/)

---

## 1. Ringkasan Arah Desain

SIMANIKA menggunakan bahasa visual **Neo-Arcade Editorial**: layout editorial yang luas, bersih, dan premium dipadukan dengan detail antarmuka bergaya game 8-bit. Hasil akhirnya harus terasa muda, teknikal, aktif, dan khas mahasiswa Informatika tanpa terlihat seperti website game penuh.

Komposisi visual ditetapkan dengan rasio:

- **80% editorial modern:** grid rapi, tipografi besar, ruang kosong, fotografi kegiatan, hitam-putih, hierarchy yang kuat.
- **20% retro digital:** pixel icon, nomor section, cursor, status bar, hard shadow, sprite kecil, dan micro-interaction.
- **Biru sebagai signal color:** dipakai untuk CTA, link aktif, fokus, status penting, glow, dan detail ilustrasi.

### Tujuan desain

1. Membuat HIMANIKA terlihat kredibel sekaligus dekat dengan mahasiswa.
2. Mengarahkan pengunjung dengan cepat ke Event, OPREC, dan merchandise.
3. Menampilkan banyak informasi tanpa terasa seperti portal administrasi lama.
4. Memiliki identitas 8-bit yang konsisten tetapi tetap mudah dibaca dan diakses.
5. Dapat diterapkan konsisten pada public site, user dashboard, dan admin dashboard.

---

## 2. DNA Referensi dan Adaptasi SIMANIKA

| Elemen referensi | Karakter yang diambil | Adaptasi untuk SIMANIKA |
|---|---|---|
| Hero besar | Headline dominan, visual atmosferik, CTA tunggal yang kuat | Headline HIMANIKA di kiri, scene digital kampus di tengah/bawah, kartu event unggulan di kanan |
| Monokrom editorial | Putih, hitam, abu-abu; kontras tinggi | Dasar monokrom tetap dipakai, ditambah biru elektrik dan biru muda |
| Modular cards | Kartu besar, border tipis, informasi padat tetapi rapi | Event, divisi, proker, statistik, dan merchandise memakai sistem kartu yang sama |
| Technical labels | Nomor, slash, kode versi, teks mono | Label seperti `// 01`, `STATUS: OPEN`, `EVENT_ID`, dan tahun kepengurusan |
| Retro imagery | Objek teknologi lama dan karakter bergaya digital | Pixel mascot, monitor CRT, cursor, terminal, trophy, calendar, dan item game bertema kampus |
| Alternating sections | Perpindahan light ke dark untuk membentuk ritme | Section utama terang, section statistik/proker/CTA memakai mode gelap |
| Marquee/ticker | Informasi bergerak sebagai pemisah section | Ticker agenda, deadline, prestasi, dan pengumuman HIMANIKA |
| Motion berlapis | Reveal, counter, marquee, card movement | Motion singkat, responsif, dan memiliki fallback `prefers-reduced-motion` |

### Batas inspirasi

- Jangan menyalin logo, gambar, copywriting, atau aset milik referensi.
- Jangan menduplikasi susunan halaman secara identik.
- Ambil prinsip komposisi, ritme, typography hierarchy, dan karakter motion.
- Identitas akhir harus terbaca sebagai **HIMANIKA**, bukan template AI agency.

---

## 3. Prinsip Visual

### 3.1 Editorial first

Headline besar, alignment yang tegas, garis pemisah, dan whitespace adalah fondasi. Elemen pixel tidak boleh mengganggu keterbacaan konten utama.

### 3.2 Blue means action

Biru pekat menandai hal yang dapat dilakukan: tombol utama, link, tab aktif, progress, focus ring, dan status pendaftaran. Biru muda dipakai untuk highlight informatif dan dekorasi.

### 3.3 Pixel with purpose

Gaya 8-bit hanya digunakan pada:

- Ikon kategori dan ilustrasi dekoratif.
- Label kecil, nomor section, badge, dan status.
- Cursor, loading state, empty state, serta transition ornament.
- Hard shadow dan sudut bertingkat pada komponen khusus.

Pixel font tidak digunakan untuk paragraf, form panjang, tabel, atau seluruh headline.

### 3.4 Motion communicates state

Animasi harus menjelaskan perubahan: item masuk, tab berpindah, pendaftaran berhasil, countdown berjalan, atau kartu dipilih. Hindari animasi yang hanya menjadi gangguan visual.

### 3.5 Accessible by default

Teks normal minimum 16 px, focus ring selalu terlihat, target sentuh minimum 44 × 44 px, dan informasi status tidak hanya bergantung pada warna.

---

## 4. Color System

### 4.1 Core palette

| Token | Nilai | Peran |
|---|---:|---|
| `--background` | `#F4F7FB` | Canvas utama dengan bias biru yang sangat tipis |
| `--surface` | `#FFFFFF` | Card, navbar, dialog, form |
| `--surface-subtle` | `#EFF6FF` | Panel informatif, selected row, secondary section |
| `--ink` | `#0A1020` | Teks utama dan dark outline |
| `--ink-muted` | `#4A5568` | Teks sekunder; rasio 7.0:1 di atas background |
| `--night` | `#07111F` | Dark section dan footer |
| `--blue-900` | `#0B2559` | Dark blue surface dan pressed state |
| `--blue-700` | `#0F4BCB` | CTA hover; putih di atasnya 7.27:1 |
| `--blue-600` | `#155EEF` | Primary CTA; putih di atasnya 5.41:1 |
| `--blue-400` | `#5B9CFF` | Glow, chart, dekorasi di atas dark surface |
| `--blue-100` | `#DBEAFE` | Badge dan selected background |
| `--border` | `#CAD5E5` | Border pada light surface |
| `--border-dark` | `rgba(255,255,255,.14)` | Border pada dark surface |
| `--success` | `#16875C` | Status diterima/tersedia |
| `--warning` | `#B35C00` | Deadline dekat/pending |
| `--danger` | `#C42B3A` | Error/ditolak/destructive |
| `--focus` | `#2563EB` | Keyboard focus ring |

### 4.2 Rasio penggunaan warna

- **60%** off-white dan white.
- **25%** ink dan night.
- **10%** primary blue.
- **5%** status colors dan visual accents.

Gunakan biru untuk membimbing perhatian, bukan sebagai background setiap section.

### 4.3 Color combinations

| Konteks | Background | Foreground | Accent |
|---|---|---|---|
| Light default | `#F4F7FB` | `#0A1020` | `#155EEF` |
| White card | `#FFFFFF` | `#0A1020` | `#0F4BCB` |
| Dark section | `#07111F` | `#FFFFFF` | `#5B9CFF` |
| Blue CTA | `#155EEF` | `#FFFFFF` | `#DBEAFE` focus/halo |
| Selected item | `#DBEAFE` | `#0A1020` | `#155EEF` border/icon |

### 4.4 Gradient dan texture

Gradient tidak menjadi background generik. Gunakan hanya sebagai cahaya atmosferik:

```css
--hero-glow: radial-gradient(circle at 70% 36%, rgba(91,156,255,.34), transparent 34%);
--night-glow: radial-gradient(circle at 50% 0%, rgba(21,94,239,.25), transparent 46%);
--scanline: repeating-linear-gradient(
  to bottom,
  rgba(7,17,31,0) 0,
  rgba(7,17,31,0) 3px,
  rgba(7,17,31,.045) 4px
);
```

Scanline hanya boleh dipakai pada media/illustration frame dengan opacity rendah, bukan menutupi teks.

---

## 5. Typography

### 5.1 Font families

| Peran | Font | Fallback | Penggunaan |
|---|---|---|---|
| Display & UI | **Inter Tight** | Inter, Arial, sans-serif | Hero, heading, body, button, navigation |
| Technical mono | **IBM Plex Mono** | ui-monospace, monospace | Label, date, counter, ID event, metadata |
| Pixel accent | **Press Start 2P** | monospace | Badge khusus, angka dekoratif, loading, maksimal 1 baris pendek |

Jika Inter Tight tidak tersedia, gunakan Inter. Jangan mengganti body dengan pixel font.

### 5.2 Type scale

| Style | Desktop | Mobile | Weight | Line height | Tracking |
|---|---:|---:|---:|---:|---:|
| Hero XL | `clamp(3.5rem, 7.5vw, 7.5rem)` | otomatis | 500 | .90 | `-0.055em` |
| Display L | `clamp(2.75rem, 5vw, 5rem)` | otomatis | 500 | .95 | `-0.045em` |
| H2 | `clamp(2.25rem, 4vw, 4rem)` | otomatis | 500 | 1.0 | `-0.04em` |
| H3 | `clamp(1.5rem, 2.2vw, 2.25rem)` | otomatis | 550 | 1.1 | `-0.025em` |
| Lead | 22 px | 18 px | 400 | 1.45 | `-0.01em` |
| Body | 16 px | 16 px | 400 | 1.6 | normal |
| Small | 14 px | 14 px | 450 | 1.5 | normal |
| Mono label | 12 px | 11 px | 500 | 1.3 | `.08em` |
| Pixel label | 10–12 px | 9–10 px | 400 | 1.5 | normal |

### 5.3 Typography rules

- Hero idealnya 2–3 baris; batasi lebar sekitar 10–12 karakter rata-rata per baris besar.
- Heading memakai sentence case. Technical label memakai uppercase.
- Gunakan angka tabular untuk countdown, statistik, kode tim, dan tabel.
- Body text maksimum 65–72 karakter per baris.
- Hindari paragraph center-aligned lebih dari dua baris.
- Press Start 2P maksimal sekitar 24 karakter per label agar tetap terbaca di mobile.

---

## 6. Layout System

### 6.1 Breakpoints

| Nama | Lebar | Perilaku |
|---|---:|---|
| Mobile | `320–639px` | 1 kolom, horizontal gutter 20 px |
| Tablet | `640–1023px` | 6 kolom, gutter 24 px |
| Desktop | `1024–1439px` | 12 kolom, gutter 32 px |
| Wide | `1440px+` | 12 kolom, content max-width 1440 px |

### 6.2 Container dan spacing

```css
--container-max: 1440px;
--gutter-mobile: 20px;
--gutter-tablet: 32px;
--gutter-desktop: 48px;

--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
--space-10: 144px;
```

- Section desktop: 112–160 px vertikal.
- Section mobile: 72–96 px vertikal.
- Jarak eyebrow ke heading: 16–24 px.
- Jarak heading ke description: 20–32 px.
- Jarak header section ke content: 48–72 px.

### 6.3 Grid behavior

- Hero desktop: 12 kolom; copy 5 kolom, visual 4 kolom, featured card 3 kolom.
- Informasi editorial: gunakan asymmetrical split 7/5 atau 8/4.
- Event grid: 3 kolom desktop, 2 tablet, 1 mobile.
- Divisi dan proker: bento 12 kolom dengan span 4/4/4 atau 7/5.
- Hindari semua card memiliki tinggi dan komposisi identik; variasikan ukuran, bukan style.

### 6.4 Section rhythm

Gunakan pergantian ini untuk membentuk ritme halaman:

```text
LIGHT HERO
  └── DARK SIGNAL STRIP
      └── LIGHT EDITORIAL CONTENT
          └── DARK PROOF / STATS
              └── LIGHT EVENTS / GALLERY
                  └── DARK CTA + FOOTER
```

---

## 7. Shape, Border, dan Elevation

### 7.1 Radius

| Token | Nilai | Penggunaan |
|---|---:|---|
| `--radius-xs` | 2 px | Pixel accent, small tag |
| `--radius-sm` | 8 px | Button, input, badge |
| `--radius-md` | 14 px | Standard card |
| `--radius-lg` | 20 px | Featured card, dialog |
| `--radius-pill` | 999 px | Nav capsule, status pill |

### 7.2 Borders

- Standard card: `1px solid var(--border)`.
- Pixel card: `2px solid var(--ink)` dengan sudut 2–4 px.
- Dark card: `1px solid var(--border-dark)`.
- Selected card: `2px solid var(--blue-600)`.

### 7.3 Shadows

```css
--shadow-soft: 0 18px 50px rgba(7,17,31,.10);
--shadow-float: 0 28px 80px rgba(7,17,31,.16);
--shadow-pixel: 5px 5px 0 #0A1020;
--shadow-pixel-blue: 5px 5px 0 #155EEF;
```

Gunakan soft shadow pada card editorial dan hard pixel shadow hanya pada tombol/komponen aksen. Jangan memakai dua jenis shadow pada komponen yang sama.

---

## 8. Icon dan Illustration System

### 8.1 Icon families

Gunakan dua lapis sistem ikon:

1. **Pixel icons** untuk identitas dan komunikasi kategori.
2. **Lucide icons** untuk utility UI yang harus langsung dikenali.

### 8.2 Pixel icon specification

- Grid master: 16 × 16 atau 24 × 24.
- Bentuk dibuat pada integer pixel; tidak ada half-pixel.
- Stroke visual setara 2 px pada ukuran 24 px.
- Maksimum 3 warna: ink, blue, dan white/transparent.
- Tidak ada blur, feather, atau gradient di dalam icon.
- Sudut diagonal dibuat seperti tangga pixel.
- SVG memakai `shape-rendering="crispEdges"` jika bentuk benar-benar pixel-based.
- Decorative icons harus memakai `aria-hidden="true"`; icon-only button wajib memiliki `aria-label`.

### 8.3 Icon map

| Konteks | Pixel motif |
|---|---|
| Event | Calendar + spark |
| Lomba | Trophy |
| Workshop | Terminal window |
| Seminar | Microphone |
| OPREC | Open door + cursor |
| Divisi | Folder/module/chip sesuai fungsi |
| merchandise | Handshake/link blocks |
| Tim | Party/three avatars |
| Kode tim | Key/cartridge |
| Success | Blue flag/check tile |
| Empty state | Sleeping cursor/empty inventory slot |
| Loading | 4-frame pixel runner atau progress blocks |

### 8.4 Photography treatment

- Foto kegiatan harus menjadi sumber emosi utama; pixel art berfungsi sebagai overlay/ornament.
- Color grading sedikit dingin dengan black point kuat dan highlight netral.
- Gunakan rasio 16:10, 4:3, dan 1:1 secara konsisten.
- Featured image boleh memakai frame seperti monitor/terminal dengan blue status light.
- Hover media: scale maksimum 1.03, durasi 500–700 ms.

---

## 9. Core Components

### 9.1 Navbar

- Sticky, tinggi 72 px desktop dan 64 px mobile.
- Desktop berbentuk capsule putih tipis di atas hero atau full-width transparan dengan inner capsule.
- Logo di kiri, menu utama di tengah, login/profile di kanan.
- Active link memiliki blue dot atau underline 2 px; jangan hanya berubah warna.
- Setelah scroll 24 px: background menjadi `rgba(255,255,255,.88)` dengan backdrop blur 16 px.
- Mobile memakai sheet/menu penuh dengan item setinggi minimum 52 px.

### 9.2 Buttons

| Variant | Visual | Penggunaan |
|---|---|---|
| Primary | Blue fill, white text, optional pixel arrow tile | CTA utama: Daftar, Gabung, Bentuk Tim |
| Secondary | White/transparent, ink border | CTA pendamping |
| Dark | Night fill, white text | Light section alternatif |
| Ghost | Transparent, underline/icon motion | Card link dan navigation action |
| Destructive | Danger fill atau danger outline | Hapus, keluar tim, tolak |

Rules:

- Tinggi 48 px default dan 44 px minimum.
- Padding horizontal 20–24 px.
- Satu area hanya memiliki satu primary action yang paling dominan.
- Hover pixel button: berpindah `translate(-2px,-2px)` sementara hard shadow bertambah.
- Active: kembali ke posisi awal; jangan mengecilkan tombol hingga label terasa bergerak.
- Loading mempertahankan lebar tombol dan menampilkan progress blocks + label.

### 9.3 Cards

**Editorial card**

- Radius 14–20 px, border tipis, media besar, whitespace lega.
- Cocok untuk event, gallery, article, dan merchandise.
- Hover menaikkan media dan menggeser arrow 4 px.

**Pixel card**

- Radius 2–4 px, border 2 px, hard shadow.
- Cocok untuk status, kode tim, countdown, badge, dan featured widget.
- Dipakai maksimal satu atau dua card per viewport agar tetap terasa spesial.

**Dark card**

- Surface sedikit lebih terang dari `--night`.
- Gunakan blue light sebagai edge/glow, bukan shadow putih besar.

### 9.4 Badges dan status

Badge harus menggabungkan warna, icon, dan teks:

- `OPEN`: blue dot + label.
- `SEGERA`: clock icon + warning label.
- `SELESAI`: check icon + neutral label.
- `DITERIMA`: check tile + success label.
- `DITOLAK`: cross tile + danger label.
- `PENDING`: progress blocks + warning label.

Gunakan mono 11–12 px, uppercase, letter spacing `.06em`.

### 9.5 Forms

- Label selalu terlihat di atas input; placeholder bukan pengganti label.
- Input minimum tinggi 48 px, textarea minimum 128 px.
- Border default `#AEBCCF`; focus `2px solid #2563EB` plus outer ring 3 px `rgba(37,99,235,.18)`.
- Error muncul dekat field, menyebut masalah dan cara memperbaikinya.
- Upload memakai dropzone dengan tombol alternatif; tidak boleh bergantung pada drag-and-drop.
- Multi-step form menunjukkan `STEP 02 / 04`, nama langkah, dan progress bar.
- Autosave/status sistem menggunakan teks seperti `TERSIMPAN 14:32`, bukan spinner tanpa akhir.

### 9.6 Accordion

- Header minimum tinggi 60 px.
- Nomor `01`, pertanyaan, lalu pixel plus/minus di kanan.
- Border bottom 1 px; panel terbuka diberi blue left rail 3 px.
- Hanya tinggi konten dan opacity yang dianimasikan; keyboard `Enter` dan `Space` harus berfungsi.

### 9.7 Team code panel

- Menjadi satu komponen pixel card yang ikonik.
- Kode seperti `HACK01` memakai IBM Plex Mono bold, bukan pixel font kecil.
- Tombol copy memberi feedback `TERSALIN` selama 1.5 detik.
- Status anggota ditulis `3 / 5 SLOT TERISI` dan ditampilkan juga sebagai segmented progress blocks.

---

## 10. Landing Page Blueprint

### 10.1 Navbar

Isi: logo SIMANIKA, Home, Event, OPREC, merchandise, login/profile. Navbar mengambang di atas hero dan berubah menjadi glass surface saat scroll.

### 10.2 Hero — “Build Your Next Chapter”

**Layout desktop**

- Kiri 5 kolom: eyebrow, headline besar, deskripsi, dua CTA.
- Tengah/bawah 4 kolom: foto/3D scene kegiatan dengan CRT atau portal kampus sebagai focal object.
- Kanan 3 kolom: featured event card dengan tanggal, status, dan arrow.
- Dasar hero: logo partner atau highlight unit kegiatan dalam strip gelap.

**Contoh content direction**

```text
// HIMANIKA 2026

Build ideas.
Ship impact.

Ruang tumbuh, berkarya, dan berkolaborasi
bagi mahasiswa Informatika.

[JELAJAHI EVENT] [GABUNG HIMANIKA]
```

Mobile menyusun copy → visual → featured event. Featured card tidak boleh menutupi CTA atau headline.

### 10.3 Signal ticker

Ticker full-width untuk pengumuman penting:

```text
OPREC DIBUKA  •  HACKATHON REGISTRATION  •  12 PROGRAM KERJA  •  350+ ANGGOTA
```

Kecepatan 32–46 detik per loop, pause saat hover/focus, dan menjadi teks statis jika reduced motion aktif.

### 10.4 About + Visi/Misi

- Eyebrow di kiri, statement besar 7–8 kolom di kanan.
- Kata kunci pada statement berubah menjadi blue saat masuk viewport.
- Visi ditempatkan dalam dark editorial card.
- Misi menjadi numbered list dengan `// 01`, `// 02`, dan seterusnya.

### 10.5 Struktur organisasi

- Pengurus inti tampil sebagai horizontal editorial portraits.
- Jabatan menggunakan mono label.
- Desktop boleh memakai horizontal carousel; mobile memakai snap carousel dengan indikator teks `01 / 06`.
- Tidak melakukan auto-slide ketika user sedang berinteraksi.

### 10.6 Divisi

- Bento grid dengan satu featured division card 7 kolom dan cards sekunder 5/4 kolom.
- Setiap divisi memiliki pixel icon unik, nomor, nama, deskripsi singkat, dan link detail.
- Hover memperlihatkan 2–3 program kerja utama, bukan mengganti seluruh card secara mendadak.

### 10.7 Program kerja

- Dark section dengan tab vertikal bernomor di kiri dan media/details di kanan.
- Active tab memakai blue fill dan white label.
- Perubahan media memakai crossfade 300 ms + offset 12 px.
- Pada mobile menjadi accordion agar tidak memerlukan horizontal interaction.

### 10.8 Statistik

- Satu angka utama sangat besar, tiga statistik pendamping.
- Counter hanya berjalan satu kali ketika 60% elemen masuk viewport.
- Tambahkan pixel avatars atau small sprite sebagai social proof, bukan emoji.
- Nilai final harus tetap langsung terbaca ketika JavaScript mati/reduced motion aktif.

### 10.9 Upcoming events

- Header kiri: label dan title. Kanan: filter mini + link semua event.
- Tiga event cards; featured event boleh memiliki lebar dua kolom.
- Informasi wajib: kategori, tanggal, lokasi, tipe peserta, status, slot, CTA.
- Countdown tampil sebagai segmented mono digits; jangan menjadi fokus utama setelah event ditutup.

### 10.10 Gallery

- Editorial mosaic, bukan grid foto seragam.
- 6–8 gambar dengan kombinasi rasio 16:10, 4:3, dan portrait.
- Caption muncul tanpa menghalangi wajah/subjek.
- Lightbox mendukung keyboard, close button, swipe mobile, dan focus trap.

### 10.11 Testimonial

- Quote besar 2–4 baris, identitas dan peran di bawah.
- Back/next berupa pixel arrow, masing-masing 44 × 44 px.
- Auto-advance opsional minimum 7 detik dan harus pause saat hover/focus.
- Gunakan live region secara hati-hati; jangan membacakan setiap auto-slide ke screen reader.

### 10.12 CTA — “Ready Player: You”

- Dark full-bleed section dengan blue radial glow.
- Headline 2 baris, satu CTA utama menuju OPREC dan link kedua ke Event.
- Pixel cursor/character berjalan menuju CTA hanya sebagai decorative motion.
- Footer langsung menyatu setelah CTA agar halaman memiliki penutup kuat.

### 10.13 Footer

- Dark surface, layout 12 kolom.
- Kolom logo/statement lebih besar; quick links dan social links lebih kecil.
- Newsletter hanya dipakai jika memang ada workflow pengiriman.
- Tambahkan system label seperti `SIMANIKA // ONLINE` dan tahun aktif.

---

## 11. Page-Level Direction

### 11.1 Events

- Header editorial + live count event.
- Filter berada dalam sticky utility bar, tetapi menjadi bottom sheet di mobile.
- Active filter memakai blue surface, icon, dan text; hasil filter diumumkan secara aksesibel.
- Empty state memakai pixel inventory slot dan CTA untuk reset filter.

### 11.2 Event detail

- Hero split: poster/media 7 kolom, metadata dan CTA 5 kolom.
- CTA registration tetap terlihat di sidebar desktop, tetapi tidak menutupi konten di mobile.
- Timeline memakai vertical rail dengan checkpoint pixel.
- Syarat, hadiah, dan FAQ memakai accordion/cards agar mudah dipindai.

### 11.3 OPREC

- Status `DIBUKA` atau `DITUTUP` menjadi signal utama di hero.
- Timeline rekrutmen divisualkan seperti level progression tanpa menyamarkan tanggal nyata.
- Division choice memakai selectable cards dengan checkmark, bukan hanya border color.
- CTA daftar nonaktif harus menjelaskan kapan pendaftaran dibuka kembali.

### 11.4 merchandise

- Nada lebih formal: kurangi pixel accent menjadi sekitar 10%.
- Gunakan statistik, audience reach, benefit, tier sponsorship, dan logo partners.
- Tier sponsorship tetap memakai editorial cards; featured tier ditandai blue border dan label “RECOMMENDED”, bukan dibuat jauh lebih besar.

### 11.5 Authentication

- Split layout: form yang tenang + visual HIMANIKA.
- Jangan memakai animasi kompleks di sekitar input.
- Error, password requirements, dan success feedback selalu eksplisit.
- Mobile hanya menampilkan form dan small brand motif agar fokus tetap tinggi.

### 11.6 User dashboard

- Rasa retro diturunkan menjadi 10–15%; prioritaskan keterbacaan dan task completion.
- Pixel motif hanya pada empty state, badges, progress, dan achievement.
- Kartu utama: status pendaftaran, tim, upcoming event, dan notification.

### 11.7 Admin dashboard

- Gunakan Inter Tight + IBM Plex Mono; Press Start 2P tidak digunakan di tabel/form.
- Sidebar dan table harus stabil, ringkas, serta memiliki visible focus.
- Status tetap memakai sistem badge yang sama dengan public site.
- Animasi dibatasi pada transition 150–220 ms dan feedback state.

---

## 12. Motion System

Stack implementasi mengikuti `architecture.md`: **Framer Motion** untuk React/Next.js. Tidak perlu menambah library motion baru.

### 12.1 Motion tokens

```ts
export const motion = {
  duration: {
    instant: 0.12,
    fast: 0.2,
    base: 0.35,
    reveal: 0.55,
    cinematic: 0.8,
  },
  ease: {
    standard: [0.22, 1, 0.36, 1],
    enter: [0.16, 1, 0.3, 1],
    exit: [0.4, 0, 1, 1],
  },
};
```

### 12.2 Animation recipes

| Motion | Trigger | Nilai | Catatan |
|---|---|---|---|
| Hero copy reveal | Initial load | `opacity 0→1`, `y 24→0`, 550 ms, stagger 70 ms | Maksimum 5 children |
| Featured card entrance | Setelah copy | `opacity`, `scale .96→1`, 600 ms | Tidak memakai bounce berlebihan |
| Section reveal | Viewport 15–20% | `opacity`, `y 16→0`, 350–500 ms | Sekali saja untuk long page |
| Grid stagger | Viewport | 40–70 ms per item | Maksimum 8 item per group |
| Image hover | Pointer hover | `scale 1→1.03`, 600 ms | Overflow hidden |
| Pixel button hover | Pointer hover | `x/y 0→-2`, 160 ms | Shadow menyesuaikan |
| Counter | 60% in viewport | 700–1100 ms | Nilai final tersedia di DOM |
| Tab change | User input | Crossfade + `x 12→0`, 300 ms | Height container stabil |
| Accordion | User input | Height + opacity, 220–300 ms | Icon rotate 90° |
| Page transition | Route change | Fade 180 ms | Hindari menahan navigasi |
| Success feedback | Submit success | 4-frame pixel check, 600 ms | Setelahnya menjadi static check |

### 12.3 Pixel-specific motion

- Sprite memakai `steps(4)` atau frame swapping, bukan smooth interpolation.
- Blinking cursor maksimal 1.2 Hz dan berhenti setelah 5–8 detik.
- Progress indicator bergerak per blok, bukan continuous glow.
- Hindari glitch berkedip, parallax berat, custom cursor, dan scroll-jacking.

### 12.4 Reduced motion

Saat `prefers-reduced-motion: reduce` aktif:

- Semua konten langsung masuk final state.
- Marquee menjadi baris statis yang dapat wrap.
- Counter langsung menampilkan nilai akhir.
- Carousel tidak auto-play.
- Sprite dan cursor berhenti pada frame pertama/final.
- Hover state tetap memiliki perubahan warna/border tanpa transform besar.

---

## 13. Interaction dan Feedback

- Semua clickable card memiliki pointer cursor dan focus style yang setara dengan hover.
- Tombol submit menampilkan progress tanpa menghapus label konteks.
- Loading pertama memakai skeleton dengan rasio yang sama seperti konten akhir untuk mencegah layout shift.
- Toast hanya untuk feedback global; error form tetap muncul dekat field.
- Copy code, join team, delete, accept, dan reject selalu memberi feedback teks yang jelas.
- Destructive confirmation menyebut objek spesifik, misalnya “Hapus Event UI/UX Challenge?”
- Jangan menonaktifkan tombol tanpa menjelaskan syarat yang belum terpenuhi.

---

## 14. Responsive Rules

### Mobile

- Hero headline maksimum sekitar `56px`; gunakan `clamp` agar tidak overflow.
- Semua split layout berubah menjadi single column.
- Carousel menggunakan native horizontal scroll + snap.
- Tidak ada hover-only content.
- Sticky bottom CTA boleh digunakan pada event detail, dengan ruang safe-area.
- Pixel decoration dikurangi 30–50% untuk menjaga fokus dan performa.

### Tablet

- Bento kompleks disederhanakan menjadi 2 kolom.
- Navbar dapat beralih ke menu mobile jika link tidak muat secara nyaman.
- Side-by-side form/media hanya dipertahankan jika setiap kolom minimal 320 px.

### Desktop dan wide screen

- Konten dibatasi `max-width: 1440px`.
- Background/glow boleh full-bleed, tetapi teks tetap mengikuti container.
- Jangan memperbesar body copy setelah 1440 px; tambah whitespace saja.

### Test viewport wajib

`320`, `375`, `768`, `1024`, `1280`, dan `1440` px.

---

## 15. Accessibility Requirements

- Contrast teks normal minimum 4.5:1; teks besar minimum 3:1.
- `#FFFFFF` di atas `#155EEF` memiliki contrast sekitar 5.41:1.
- `#0A1020` di atas `#F4F7FB` memiliki contrast sekitar 17.64:1.
- `#4A5568` di atas `#F4F7FB` memiliki contrast sekitar 7.0:1.
- Focus ring minimum 2 px dengan offset yang terlihat di light dan dark surface.
- Semua interactive target minimum 44 × 44 px dengan jarak aman antartarget.
- Heading mengikuti urutan semantik; ukuran visual tidak menentukan level HTML.
- Setiap foto informatif memiliki alt text kontekstual. Decorative pixel art menggunakan alt kosong.
- Form selalu memiliki label, instruction, error association, dan keyboard order yang logis.
- Status memakai icon + teks + warna.
- Animasi mematuhi `prefers-reduced-motion`.
- Jangan menggunakan autoplay audio atau video tanpa kontrol.

---

## 16. Content Voice

Suara SIMANIKA adalah **aktif, cerdas, inklusif, dan lugas**.

### Gunakan

- “Bangun ide. Ciptakan dampak.”
- “Temukan event yang cocok untukmu.”
- “Bentuk tim dan mulai tantangan.”
- “Pendaftaran ditutup 3 hari lagi.”
- `STATUS: PENDAFTARAN DIBUKA`

### Hindari

- Istilah AI/teknis generik yang tidak relevan dengan organisasi.
- Copy terlalu korporat atau menjanjikan hal abstrak.
- Semua teks ditulis uppercase.
- Gimmick game yang membuat tugas nyata terasa tidak serius.
- Emoji sebagai pengganti icon UI.

---

## 17. Implementation Tokens

Contoh fondasi CSS untuk `frontend/src/app/globals.css`:

```css
:root {
  --background: #F4F7FB;
  --surface: #FFFFFF;
  --surface-subtle: #EFF6FF;
  --ink: #0A1020;
  --ink-muted: #4A5568;
  --night: #07111F;
  --blue-900: #0B2559;
  --blue-700: #0F4BCB;
  --blue-600: #155EEF;
  --blue-400: #5B9CFF;
  --blue-100: #DBEAFE;
  --border: #CAD5E5;
  --success: #16875C;
  --warning: #B35C00;
  --danger: #C42B3A;
  --focus: #2563EB;

  --radius-xs: 2px;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;

  --shadow-soft: 0 18px 50px rgba(7, 17, 31, .10);
  --shadow-float: 0 28px 80px rgba(7, 17, 31, .16);
  --shadow-pixel: 5px 5px 0 #0A1020;
  --shadow-pixel-blue: 5px 5px 0 #155EEF;
}

::selection {
  color: #FFFFFF;
  background: #155EEF;
}

:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

Font loading direkomendasikan melalui `next/font/google` agar tidak menambah blocking request dan mengurangi layout shift.

---

## 18. Asset Checklist

Sebelum implementasi landing page, siapkan:

- Logo HIMANIKA versi dark, light, dan monochrome.
- Pixel mark SIMANIKA ukuran 16, 24, 32, dan 64 px.
- Set minimal 12 pixel icons dalam SVG.
- 1 hero visual utama bertema mahasiswa Informatika.
- 8–12 foto kegiatan dengan resolusi dan hak penggunaan yang jelas.
- Portrait pengurus dengan treatment konsisten.
- Logo partner dalam versi monochrome.
- Poster event dengan aspect ratio yang disepakati.
- Empty state dan success state dalam gaya pixel.

---

## 19. Acceptance Checklist

### Visual consistency

- [ ] Tampilan terbaca editorial modern terlebih dahulu, retro 8-bit sebagai aksen.
- [ ] Blue signal color digunakan konsisten untuk action dan active state.
- [ ] Pixel font tidak digunakan untuk body, form, atau tabel.
- [ ] Card memakai salah satu style: editorial, pixel, atau dark—tidak dicampur tanpa aturan.
- [ ] Semua pixel icons mengikuti grid, stroke, dan palet yang sama.

### UX dan responsive

- [ ] CTA utama hero langsung terlihat pada 375 × 667 px tanpa tertutup visual.
- [ ] Tidak ada horizontal overflow pada viewport wajib.
- [ ] Filter, accordion, carousel, dialog, dan menu dapat digunakan dengan keyboard.
- [ ] Semua state memiliki loading, empty, success, dan error treatment.
- [ ] Tidak ada konten penting yang hanya tersedia melalui hover.

### Motion dan performance

- [ ] Reduced-motion menghasilkan halaman yang tetap lengkap dan terbaca.
- [ ] Tidak ada lebih dari satu continuous decorative animation per viewport.
- [ ] Image container memiliki aspect ratio/size sebelum gambar selesai dimuat.
- [ ] Motion menggunakan transform dan opacity jika memungkinkan.
- [ ] Landing page diuji pada perangkat mobile kelas menengah.

### Accessibility

- [ ] Contrast minimum terpenuhi.
- [ ] Visible focus tidak dihapus.
- [ ] Interactive target minimum 44 × 44 px.
- [ ] Status tidak bergantung pada warna saja.
- [ ] Icon-only button memiliki accessible name.
- [ ] Struktur heading dan landmark valid.

---

## 20. Keputusan Final

1. **Nama direction:** Neo-Arcade Editorial.
2. **Primary color:** `#155EEF` dengan dark blue `#07111F` dan off-white `#F4F7FB`.
3. **Primary typography:** Inter Tight; IBM Plex Mono untuk data; Press Start 2P hanya sebagai aksen.
4. **Primary layout:** asymmetrical 12-column editorial grid + selected bento sections.
5. **Primary visual motif:** pixel cursor, terminal, trophy, calendar, progress blocks, dan blue status light.
6. **Primary motion:** short reveal, card stagger, ticker, counter, tab crossfade, dan stepped sprite.
7. **Implementation library:** Framer Motion yang sudah tercantum dalam arsitektur proyek.

Dokumen ini menjadi sumber acuan visual utama. Keputusan page-specific boleh menambah detail, tetapi tidak boleh mengganti color, typography, icon grammar, atau motion principles tanpa memperbarui dokumen ini.
