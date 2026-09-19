import { PixelCorner } from "@/components/ui/PixelCorner";

const divisions = [
  {
    index: "01",
    name: "BPH",
    full: "Badan Pengurus Harian",
    badge: "Presidium",
    description:
      "Memimpin, mengoordinasikan, serta mengontrol seluruh arah kebijakan, program kerja, dan tata kelola organisasi HIMANIKA.",
    programs: ["Rapat Pleno", "Manajemen Proker", "Laporan LPJ"],
    icon: "shield",
  },
  {
    index: "02",
    name: "Humas",
    full: "Hubungan Masyarakat",
    description:
      "Membangun dan memelihara citra positif organisasi melalui komunikasi strategis dengan pihak internal maupun eksternal kampus.",
    programs: ["Media Partner", "Studi Banding", "Publikasi Humas"],
    icon: "megaphone",
  },
  {
    index: "03",
    name: "PSDM",
    full: "Pengembangan Sumberdaya Manusia",
    description:
      "Mengembangkan potensi, loyalitas, dan kapasitas anggota melalui program kaderisasi serta pelatihan kepemimpinan berkelanjutan.",
    programs: ["Latihan Kepemimpinan", "Upgrading Pengurus", "Kaderisasi Anggota"],
    icon: "users",
  },
  {
    index: "04",
    name: "Kominfo",
    full: "Komunikasi & Informasi",
    description:
      "Mengelola seluruh kanal informasi digital organisasi, publikasi media sosial, dan memproduksi konten visual kreatif.",
    programs: ["Social Media", "Kreatif & Desain", "Website Portal"],
    icon: "monitor",
  },
  {
    index: "05",
    name: "KWU",
    full: "Kewirausahaan",
    description:
      "Menumbuhkan jiwa entrepreneur dan kemandirian finansial organisasi melalui pengembangan unit usaha kreatif dan merchandise.",
    programs: ["Official Merchandise", "Dana Usaha", "Bazaar Mahasiswa"],
    icon: "rocket",
  },
  {
    index: "06",
    name: "Ristek",
    full: "Riset & Teknologi",
    description:
      "Mendorong inovasi teknologi informasi, eksplorasi riset terapan, dan peningkatan keahlian pemrograman mahasiswa.",
    programs: ["Coding Bootcamp", "Riset Teknologi", "Informatics Hackathon"],
    icon: "terminal",
  },
];

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
            kerja dan membangun ekosistem organisasi.
          </p>
        </header>

        <div className="divisi-bento" role="list" aria-label="Daftar divisi HIMANIKA">
          {divisions.map((div, i) => {
            const isFeatured = i === 0;

            return (
              <article
                className={`divisi-card${isFeatured ? " divisi-card--featured" : ""}`}
                key={div.index}
                role="listitem"
                tabIndex={0}
                aria-label={`${div.name} (${div.full}): ${div.description}`}
              >
                <div className="divisi-card__top">
                  <div className="divisi-card__top-left">
                    <span className="divisi-card__index">{div.index}</span>
                    {div.badge && (
                      <span className="divisi-card__badge">{div.badge}</span>
                    )}
                  </div>
                  <span className="divisi-card__icon">{icons[div.icon]}</span>
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

                <span className="divisi-card__arrow" aria-hidden="true">
                  →
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
