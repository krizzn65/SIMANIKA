import Image from "next/image";
import Link from "next/link";
import { LogoMarquee } from "@/components/ui/LogoMarquee";
import { SplitCta } from "@/components/ui/SplitCta";

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-stage">
        <div className="hero-visual" aria-hidden="true">
          <Image
            alt="Visual komputer retro SIMANIKA"
            fill
            priority
            quality={90}
            sizes="100vw"
            src="/images/simanika-hero-crt.png"
          />
          <div className="hero-visual__wash" />
          <div className="hero-visual__scanlines" />
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-eyebrow">
              <span className="hero-eyebrow__signal" aria-hidden="true" />
              HIMANIKA / 2026
            </p>
            <h1 id="hero-title">
              <span>Sistem Informasi</span>
              <strong>HIMANIKA</strong>
            </h1>
            <p className="hero-description">
              Ruang tumbuh, berkarya, dan berkolaborasi bagi mahasiswa Manajemen
              Informatika dalam satu ekosistem.
            </p>
            <div className="hero-actions">
              <SplitCta href="/events">Jelajahi Event</SplitCta>
              <Link className="hero-text-link" href="/oprec">
                Gabung HIMANIKA
                <ArrowUpRight />
              </Link>
            </div>
          </div>
        </div>

        <div className="trust-strip">
          <div className="trust-strip__inner">
            <p>
              <strong>350+ mahasiswa</strong>
              bertumbuh bersama melalui karya, kompetisi, dan kolaborasi.
            </p>
            <LogoMarquee />
          </div>
        </div>
      </div>
    </section>
  );
}
