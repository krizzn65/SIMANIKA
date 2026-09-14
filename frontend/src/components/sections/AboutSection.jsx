import { ScrollRevealText } from "@/components/ui/ScrollRevealText";
import { InteractiveSignalGrid } from "@/components/ui/InteractiveSignalGrid";

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

        <div className="about-interactive">
          <InteractiveSignalGrid />
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

        <footer className="about-status">
          <span>ORGANIZATION INFORMATION SYSTEM</span>
          <span className="about-status__line" aria-hidden="true">
            <span />
          </span>
          <span className="about-status__state">
            <span aria-hidden="true" />
            CONNECTED
          </span>
        </footer>
      </div>
    </section>
  );
}
