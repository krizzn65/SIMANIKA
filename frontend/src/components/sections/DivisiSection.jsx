"use client";

import { useState } from "react";
import { PixelCorner } from "@/components/ui/PixelCorner";
import { DivisiModal } from "@/components/ui/DivisiModal";

const divisions = [
  {
    index: "01",
    name: "BPH",
    full: "Badan Pengurus Harian",
    badge: "Presidium",
    description:
      "Memimpin, mengoordinasikan, serta mengontrol seluruh arah kebijakan, program kerja, dan tata kelola organisasi HIMANIKA.",
    programs: ["Rapat 100 Hari Kerja", "Manajemen Proker", "Upgrading Divisi"],
    logo: "/images/divisi/bph.webp",
  },
  {
    index: "02",
    name: "Humas",
    full: "Hubungan Masyarakat",
    description:
      "Membangun dan memelihara citra positif organisasi melalui komunikasi strategis dengan pihak internal maupun eksternal kampus.",
    programs: ["Media Partner", "Anjangsana", "Advokasi"],
    logo: "/images/divisi/humas.webp",
  },
  {
    index: "03",
    name: "PSDM",
    full: "Pengembangan Sumberdaya Manusia",
    description:
      "Mengembangkan potensi dan prestasi seluruh mahasiswa manajemen informatika",
    programs: ["Pameran Project IT", "Ospek Prodi", "Management Informatic Competition"],
    logo: "/images/divisi/psdm.webp",
  },
  {
    index: "04",
    name: "Kominfo",
    full: "Komunikasi & Informasi",
    description:
      "Mengelola seluruh kanal informasi digital organisasi, publikasi media sosial, dan memproduksi konten visual kreatif.",
    programs: ["Media Growth", "Kreatif & Desain", "Video Profile"],
    logo: "/images/divisi/kominfo.webp",
  },
  {
    index: "05",
    name: "KWU",
    full: "Kewirausahaan",
    description:
      "Menumbuhkan jiwa entrepreneur dan kemandirian finansial organisasi melalui pengembangan unit usaha kreatif dan merchandise.",
    programs: ["Official Merchandise", "Dana Usaha", "Partnership"],
    logo: "/images/divisi/kwu.webp",
  },
  {
    index: "06",
    name: "Ristek",
    full: "Riset & Teknologi",
    description:
      "Mendorong inovasi teknologi informasi, eksplorasi riset terapan, dan peningkatan keahlian pemrograman mahasiswa.",
    programs: ["Simanika", "Information Competition", "Research and Development"],
    icon: "terminal",
  },
];

/* ── Organizational Flowchart Structures for Each Division ── */
const divisionStructures = {
  /* 01. BPH: Ketua -> Wakil -> [Sekretariat: Sekre 1, Sekre 2] & [Kebendaharaan: Bendahara 1, Bendahara 2] */
  "01": {
    leader: {
      role: "Ketua",
      title: "Ketua Umum HIMANIKA",
      tag: "PIMPINAN UTAMA",
    },
    vice: {
      role: "Wakil",
      title: "Wakil Ketua HIMANIKA",
      tag: "WAKIL PIMPINAN",
    },
    branches: [
      {
        branchName: "SEKRETARIAT",
        roles: [
          {
            role: "Sekretaris 1",
            title: "Administrasi Internal & Notulensi",
            desc: "Pengarsipan dokumen dinas, agenda rapat presidium, dan tata kelola surat internal.",
          },
          {
            role: "Sekretaris 2",
            title: "Administrasi Eksternal & Birokrasi",
            desc: "Penerbitan surat dinas kampus, legalitas SK kepengurusan, dan proposal eksternal.",
          },
        ],
      },
      {
        branchName: "KEBENDAHARAAN",
        roles: [
          {
            role: "Bendahara 1",
            title: "Pengelolaan Kas & Kas Operasional",
            desc: "Pencatatan sirkulasi kas himpunan, iuran berkala, dan alokasi budgeting kegiatan.",
          },
          {
            role: "Bendahara 2",
            title: "Laporan Keuangan & Verifikasi LPJ",
            desc: "Audit transparansi anggaran proker, pembukuan digital, dan penyusunan LPJ resmi.",
          },
        ],
      },
    ],
  },

  /* 02. Humas */
  "02": {
    leader: {
      role: "Koordinator",
      title: "Koordinator Hubungan Masyarakat",
      tag: "KOORDINATOR DIVISI",
    },
    vice: {
      role: "Wakil Koordinator",
      title: "Wakil Koordinator Humas",
      tag: "SUB-KOORDINATOR",
    },
    branches: [
      {
        branchName: "KERJASAMA & RELASI",
        roles: [
          {
            role: "Staff Media Partner",
            title: "Kerjasama Media & Komunitas",
            desc: "Menjalin kolaborasi publikasi dengan media partner dan institusi eksternal.",
          },
          {
            role: "Staff Anjangsana",
            title: "Silaturahmi & Studi Banding",
            desc: "Menginisiasi kunjungan kelembagaan dan forum komunikasi antarhimpunan mahasiswa.",
          },
        ],
      },
      {
        branchName: "PELAYANAN & ADVOKASI",
        roles: [
          {
            role: "Staff Advokasi",
            title: "Penyerapan Aspirasi Mahasiswa",
            desc: "Menyalurkan aspirasi dan pengawalan kebijakan akademik program studi.",
          },
          {
            role: "Staff Hubungan Internal",
            title: "Komunikasi Internal Kampus",
            desc: "Menghubungkan komunikasi aktif antar-angkatan, alumni, dan dosen pembina.",
          },
        ],
      },
    ],
  },

  /* 03. PSDM */
  "03": {
    leader: {
      role: "Koordinator",
      title: "Koordinator PSDM",
      tag: "KOORDINATOR DIVISI",
    },
    vice: {
      role: "Wakil Koordinator",
      title: "Wakil Koordinator PSDM",
      tag: "SUB-KOORDINATOR",
    },
    branches: [
      {
        branchName: "KADERISASI & PENGEMBANGAN",
        roles: [
          {
            role: "Staff Ospek Prodi",
            title: "Orientasi Mahasiswa Baru",
            desc: "Merancang kurikulum pembinaan, adaptasi kampus, dan regenerasi anggota baru.",
          },
          {
            role: "Staff Upgrading Divisi",
            title: "Pelatihan & Softskills",
            desc: "Meningkatkan kapabilitas manajerial, kepemimpinan, dan soliditas pengurus.",
          },
        ],
      },
      {
        branchName: "EVENT & PRESTASI",
        roles: [
          {
            role: "Staff Pameran Project IT",
            title: "Showcase Karya Mahasiswa",
            desc: "Pameran tahunan hasil proyek aplikasi dan kreativitas teknologi mahasiswa.",
          },
          {
            role: "Staff IT Competition",
            title: "Manajemen Kompetisi Informatika",
            desc: "Menyelenggarakan Management Informatic Competition serta pembinaan kontingen lomba.",
          },
        ],
      },
    ],
  },

  /* 04. Kominfo */
  "04": {
    leader: {
      role: "Koordinator",
      title: "Koordinator Kominfo",
      tag: "KOORDINATOR DIVISI",
    },
    vice: {
      role: "Wakil Koordinator",
      title: "Wakil Koordinator Kominfo",
      tag: "SUB-KOORDINATOR",
    },
    branches: [
      {
        branchName: "MEDIA & PUBLIKASI",
        roles: [
          {
            role: "Staff Media Growth",
            title: "Pengelolaan Media Sosial",
            desc: "Strategi distribusi konten di Instagram, TikTok, dan kanal resmi himpunan.",
          },
          {
            role: "Staff Copywriting",
            title: "Redaksi & Jurnalistik",
            desc: "Penulisan siaran pers, artikel berita, dan caption promosi kegiatan.",
          },
        ],
      },
      {
        branchName: "KREATIF & MULTIMEDIA",
        roles: [
          {
            role: "Staff Kreatif & Desain",
            title: "Desain Grafis & Visual Asset",
            desc: "Pembuatan identitas grafis, poster proker, dan layout feeds media sosial.",
          },
          {
            role: "Staff Video Profile",
            title: "Videografi & Motion Graphic",
            desc: "Produksi video profil, aftermovie kegiatan, dan dokumentasi sinematik.",
          },
        ],
      },
    ],
  },

  /* 05. KWU */
  "05": {
    leader: {
      role: "Koordinator",
      title: "Koordinator Kewirausahaan",
      tag: "KOORDINATOR DIVISI",
    },
    vice: {
      role: "Wakil Koordinator",
      title: "Wakil Koordinator KWU",
      tag: "SUB-KOORDINATOR",
    },
    branches: [
      {
        branchName: "UNIT USAHA MERCHANDISE",
        roles: [
          {
            role: "Staff Official Merchandise",
            title: "Produk & Desain Merchandise",
            desc: "Riset tren pasar, desain PDH, lanyard, t-shirt himpunan, dan packaging.",
          },
          {
            role: "Staff Distribusi & Penjualan",
            title: "Operasional Toko & Logistik",
            desc: "Manajemen order online, stand penjualan bazar, dan inventaris barang.",
          },
        ],
      },
      {
        branchName: "DANA USAHA & KEMITRAAN",
        roles: [
          {
            role: "Staff Dana Usaha",
            title: "Inisiatif Pendanaan Mandiri",
            desc: "Eksplorasi peluang bisnis kuliner, paid promote, dan bazar kampus.",
          },
          {
            role: "Staff Partnership Vendor",
            title: "Relasi Vendor & Sponsor",
            desc: "Menjalin kontrak produksi dengan vendor konveksi dan mitra sponsorship.",
          },
        ],
      },
    ],
  },

  /* 06. Ristek */
  "06": {
    leader: {
      role: "Koordinator",
      title: "Koordinator Riset & Teknologi",
      tag: "KOORDINATOR DIVISI",
    },
    vice: {
      role: "Wakil Koordinator",
      title: "Wakil Koordinator Ristek",
      tag: "SUB-KOORDINATOR",
    },
    branches: [
      {
        branchName: "ENGINEERING & PLATFORM",
        roles: [
          {
            role: "Staff SIMANIKA Platform",
            title: "Lead Engineering Portal",
            desc: "Pengembangan sistem web portal SIMANIKA dan arsitektur database.",
          },
          {
            role: "Staff UI/UX & Web Dev",
            title: "Frontend & Desain Interaksi",
            desc: "Perancangan UI modern, responsiveness antarmuka, dan optimasi performa web.",
          },
        ],
      },
      {
        branchName: "RISET & KOMPETISI IT",
        roles: [
          {
            role: "Staff Research & Dev",
            title: "Riset Teknologi Baru",
            desc: "Eksplorasi AI, IoT, cloud computing, dan workshop teknis pemrograman.",
          },
          {
            role: "Staff Information Competition",
            title: "Mentor Lomba IT & Hackathon",
            desc: "Pembinaan delegasi hackathon, UI/UX contest, dan competitive programming.",
          },
        ],
      },
    ],
  },
};

/* ── Pixel icons inlined as SVG — 16x16 grid, crispEdges ── */
const icons = {
  shield: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="3" y="2" width="10" height="2" fill="currentColor" />
      <rect x="2" y="4" width="12" height="6" fill="currentColor" />
      <rect x="3" y="10" width="10" height="2" fill="currentColor" />
      <rect x="4" y="12" width="8" height="2" fill="currentColor" />
      <rect x="6" y="14" width="4" height="1" fill="currentColor" />
      <rect x="7" y="15" width="2" height="1" fill="currentColor" />
      <rect x="4" y="4" width="8" height="6" fill="var(--surface)" />
      <rect x="7" y="4" width="2" height="6" fill="var(--blue)" />
      <rect x="5" y="6" width="6" height="2" fill="var(--blue)" />
    </svg>
  ),
  megaphone: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="2" y="4" width="2" height="6" fill="currentColor" />
      <rect x="4" y="3" width="2" height="8" fill="currentColor" />
      <rect x="6" y="2" width="2" height="10" fill="currentColor" />
      <rect x="8" y="3" width="2" height="8" fill="currentColor" />
      <rect x="10" y="5" width="2" height="4" fill="currentColor" />
      <rect x="12" y="6" width="2" height="2" fill="var(--blue)" />
      <rect x="3" y="11" width="2" height="3" fill="var(--blue)" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="2" y="3" width="4" height="4" fill="currentColor" />
      <rect x="1" y="8" width="6" height="6" fill="currentColor" />
      <rect x="9" y="2" width="5" height="4" fill="var(--blue)" />
      <rect x="8" y="7" width="7" height="7" fill="var(--blue)" />
      <rect x="7" y="8" width="1" height="6" fill="var(--surface)" />
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="2" width="14" height="10" fill="currentColor" />
      <rect x="2" y="3" width="12" height="8" fill="var(--surface)" />
      <rect x="6" y="12" width="4" height="1" fill="currentColor" />
      <rect x="4" y="13" width="8" height="1" fill="currentColor" />
      <rect x="4" y="5" width="3" height="2" fill="var(--blue)" />
      <rect x="8" y="5" width="4" height="1" fill="#CAD5E5" />
      <rect x="8" y="7" width="3" height="1" fill="#CAD5E5" />
    </svg>
  ),
  rocket: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="7" y="1" width="2" height="2" fill="currentColor" />
      <rect x="6" y="3" width="4" height="2" fill="currentColor" />
      <rect x="5" y="5" width="6" height="4" fill="currentColor" />
      <rect x="6" y="9" width="4" height="2" fill="currentColor" />
      <rect x="7" y="11" width="2" height="2" fill="var(--blue)" />
      <rect x="3" y="7" width="2" height="4" fill="var(--blue)" />
      <rect x="11" y="7" width="2" height="4" fill="var(--blue)" />
      <rect x="7" y="4" width="2" height="2" fill="var(--surface)" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="2" width="14" height="12" fill="currentColor" />
      <rect x="2" y="3" width="12" height="10" fill="var(--night)" />
      <rect x="4" y="6" width="2" height="2" fill="var(--blue)" />
      <rect x="6" y="8" width="2" height="2" fill="var(--blue)" />
      <rect x="9" y="10" width="4" height="1" fill="#4A5568" />
    </svg>
  ),
};

export function DivisiSection() {
  const [selectedDivision, setSelectedDivision] = useState(null);

  return (
    <section className="divisi-section" id="divisi" aria-labelledby="divisi-title">
      <div className="divisi-shell">
        <PixelCorner position="top-right" />

        <header className="divisi-header">
          <p className="divisi-eyebrow">
            <span aria-hidden="true" />
            03 / DIVISI KAMI
          </p>
          <h2 className="divisi-title" id="divisi-title">
            Enam divisi.{" "}
            <span className="divisi-title__accent">Satu tujuan.</span>
          </h2>
          <p className="divisi-lead">
            Setiap divisi memiliki peran strategis dalam menggerakkan program
            kerja dan membangun ekosistem organisasi. Klik kartu untuk melihat bagan struktur organisasi.
          </p>
        </header>

        <div className="divisi-bento" role="list" aria-label="Daftar divisi HIMANIKA">
          {divisions.map((div, i) => {
            const isFeatured = i === 0;

            return (
              <article
                className={`divisi-card${isFeatured ? " divisi-card--featured" : ""}`}
                key={div.index}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDivision(div)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDivision(div);
                  }
                }}
                aria-label={`Buka bagan struktur organisasi ${div.name} (${div.full}): ${div.description}`}
              >
                <div className="divisi-card__top">
                  <div className="divisi-card__top-left">
                    <span className="divisi-card__index">{div.index}</span>
                    {div.badge && (
                      <span className="divisi-card__badge">{div.badge}</span>
                    )}
                  </div>
                  <span className="divisi-card__icon">
                    {div.logo ? (
                      <img
                        src={div.logo}
                        alt={`Logo ${div.name}`}
                        width={32}
                        height={32}
                        loading="lazy"
                        decoding="async"
                        className="divisi-card__logo-img"
                      />
                    ) : (
                      icons[div.icon]
                    )}
                  </span>
                </div>

                <div className="divisi-card__body">
                  <h3 className="divisi-card__name">{div.name}</h3>
                  <p className="divisi-card__full">{div.full}</p>
                  <p className="divisi-card__desc">{div.description}</p>
                </div>

                <div className="divisi-card__programs" aria-label="Program utama">
                  {div.programs.map((p) => (
                    <span className="divisi-card__tag" key={p}>
                      {p}
                    </span>
                  ))}
                </div>

                <span className="divisi-card__arrow" aria-hidden="true" title="Buka bagan struktur">
                  →
                </span>
              </article>
            );
          })}
        </div>
      </div>

      {/* Organizational Flowchart Modal */}
      <DivisiModal
        division={selectedDivision}
        structure={selectedDivision ? divisionStructures[selectedDivision.index] : null}
        onClose={() => setSelectedDivision(null)}
        icons={icons}
      />
    </section>
  );
}
