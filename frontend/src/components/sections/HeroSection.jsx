import Link from "next/link";
import { LogoMarquee } from "@/components/ui/LogoMarquee";
import { SplitCta } from "@/components/ui/SplitCta";
import { landingTextDefaults } from "@/lib/landingText";
import { MOTION } from "@/lib/motion";
import { CountUp } from "@/components/motion/CountUp";
import { RevealWords, countWords } from "@/components/motion/RevealWords";

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function HeroSection({ tagline, subtitle }) {
  const title = tagline || landingTextDefaults.hero_tagline;
  const words = countWords(title) + 1;
  // Supporting elements follow the title words, 80ms apart.
  const step = (index) => ({ "data-hero-step": "", style: { "--hero-delay": `${(words * MOTION.stagger + index * MOTION.heroStagger) * 1000}ms` } });
  return (
    <section className="hero" id="hero" aria-labelledby="hero-title" data-motion-active="true">
      <div className="hero-stage">
        <div className="hero-visual" aria-hidden="true">
          <img
            alt="Maskot SIMANIKA di padang rumput"
            decoding="async"
            fetchPriority="high"
            src="/images/simanika-hero-mascot.webp"
          />
          <div className="hero-visual__wash" />
          <div className="hero-visual__scanlines" />
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-eyebrow" {...step(0)}>
              <span className="hero-eyebrow__signal" aria-hidden="true" />
              HIMANIKA / 2026
            </p>
            <h1 id="hero-title">
              <span><RevealWords text={title} /></span>
              <strong><RevealWords text="HIMANIKA" startIndex={words - 1} /></strong>
            </h1>
            <p className="hero-description" {...step(1)}>
              {subtitle || landingTextDefaults.hero_subtitle}
            </p>
            <div className="hero-actions" {...step(2)}>
              <SplitCta href="/events">Jelajahi Event</SplitCta>
              <Link className="hero-text-link" href="/oprec">
                Gabung HIMANIKA
                <ArrowUpRight />
              </Link>
            </div>
          </div>
        </div>

        <div className="trust-strip" {...step(3)}>
          <div className="trust-strip__inner">
            <p>
              <strong><CountUp to={350} suffix="+" /> mahasiswa</strong>
              bertumbuh bersama melalui karya, competition, dan kolaborasi.
            </p>
            <LogoMarquee />
          </div>
        </div>
      </div>
    </section>
  );
}
