import { ScrollRevealText } from "@/components/ui/ScrollRevealText";
import { PixelCorner } from "@/components/ui/PixelCorner";
import { landingTextDefaults } from "@/lib/landingText";
import { InView } from "@/components/motion/InView";
import { Parallax } from "@/components/motion/Parallax";

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

export function AboutSection({ about }) {
  const paragraphs = (about || landingTextDefaults.about).split(/\n\s*\n/).filter(Boolean);
  return (
    <section className="about-section" id="tentang" aria-labelledby="about-title">
      <div className="about-shell">
        <PixelCorner position="top-right" />
        <PixelCorner position="bottom-left" />

        <Parallax className="about-code" aria-hidden="true">
          <span>SIMANIKA</span>
        </Parallax>

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
        </div>

        <div className="about-details">
          <InView className="about-copy">
            {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </InView>

          <InView stagger className="about-pillars" role="list" aria-label="Fokus HIMANIKA">
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
          </InView>
        </div>
      </div>
    </section>
  );
}
