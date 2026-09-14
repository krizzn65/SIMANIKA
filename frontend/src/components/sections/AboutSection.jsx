import { ScrollRevealText } from "@/components/ui/ScrollRevealText";
import { HaloReel } from "@/components/ui/HaloReel";

const haloItems = [
  {
    src: "/images/simanika-hero-crt.png",
    alt: "Komputer retro di lanskap biru SIMANIKA",
    variant: "photo",
  },
  {
    eyebrow: "01 / HIMANIKA",
    title: "TERHUBUNG",
    subtitle: "Satu ruang, banyak gagasan",
    variant: "blue",
  },
  {
    src: "/images/logos/Logo MIF 2020.png",
    alt: "Logo Manajemen Informatika",
    variant: "logo",
  },
  {
    eyebrow: "02 / KOLABORASI",
    title: "BERKARYA",
    subtitle: "Tumbuh melalui pengalaman",
    variant: "night",
  },
  {
    eyebrow: "03 / MAHASISWA",
    title: "BERDAMPAK",
    subtitle: "Ide bergerak menjadi aksi",
    variant: "paper",
  },
  {
    src: "/images/simanika-hero-crt.png",
    alt: "Visual teknologi retro HIMANIKA",
    variant: "photo-alt",
  },
];

const pillars = [
  {
    index: "01",
    title: "Terhubung",
    description: "Informasi organisasi hadir lebih dekat, jelas, dan mudah dijangkau.",
  },
  {
    index: "02",
    title: "Berkarya",
    description: "Gagasan mendapat ruang untuk diuji, dikembangkan, dan diwujudkan bersama.",
  },
  {
    index: "03",
    title: "Berdampak",
    description: "Setiap proses diarahkan menjadi pengalaman yang berarti bagi mahasiswa.",
  },
];

export function AboutSection() {
  return (
    <section className="about-section" id="tentang" aria-labelledby="about-title">
      <div className="about-shell">
        <div className="about-code" aria-hidden="true">
          <span>SIMANIKA</span>
        </div>

        <div className="about-intro">
          <header className="about-header">
            <p className="about-kicker">
              <span aria-hidden="true" />
              01 / TENTANG HIMANIKA
            </p>
            <ScrollRevealText
              id="about-title"
              lines={[
                "Bukan sekadar organisasi.",
                "Ruang untuk tumbuh bersama.",
              ]}
            />
          </header>

          <div className="about-halo">
            <HaloReel
              ariaLabel="Galeri identitas HIMANIKA. Gunakan tombol panah kiri dan kanan untuk memutar kartu."
              centerXRatio={1.02}
              frontSide="left"
              items={haloItems}
              radiusXRatio={0.52}
              radiusYRatio={0.32}
            />
          </div>
        </div>

        <div className="about-details">
          <div className="about-copy">
            <p>
              HIMANIKA adalah ruang bagi mahasiswa Manajemen Informatika untuk
              bertemu, belajar, dan membangun pengalaman yang relevan di dalam
              maupun di luar kampus.
            </p>
            <p>
              Melalui SIMANIKA, informasi organisasi, kolaborasi, dan pengembangan
              anggota hadir dalam satu ekosistem yang lebih terbuka dan terhubung.
            </p>
          </div>

          <div className="about-pillars" role="list" aria-label="Fokus HIMANIKA">
            {pillars.map((pillar) => (
              <article className="about-pillar" role="listitem" key={pillar.index}>
                <span className="about-pillar__index">// {pillar.index}</span>
                <div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </div>
                <span className="about-pillar__signal" aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
