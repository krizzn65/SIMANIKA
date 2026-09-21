import Link from "next/link";
import { BackToTopButton } from "@/components/ui/BackToTopButton";

const MENU_LINKS = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Event" },
  { href: "/oprec", label: "OPREC" },
  { href: "/merchandise", label: "Merchandise" },
];

const NAVIGATION_LINKS = [
  { href: "/#tentang", label: "Tentang HIMANIKA" },
  { href: "/#visi-misi", label: "Visi & Misi" },
  { href: "/#divisi", label: "Struktur Divisi" },
  { href: "/#gallery", label: "Galeri Kegiatan" },
  { href: "/#testimoni", label: "Apa Kata Mereka" },
];

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/sobatmif_polije",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="site-footer__icon"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@himanikapolije",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="site-footer__icon"
        aria-hidden="true"
      >
        <path d="M9 12a4 4 0 1 0 4 4V4h5a3 3 0 0 1-3 3h-2v5a4 4 0 0 1-4 4z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@himanikapolije6995",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="site-footer__icon"
        aria-hidden="true"
      >
        <path d="M22 8.6a3.5 3.5 0 0 0-2.4-2.4C17.5 5.6 12 5.6 12 5.6s-5.5 0-7.6.6A3.5 3.5 0 0 0 2 8.6C1.6 10 1.6 12 1.6 12s0 2 .4 3.4a3.5 3.5 0 0 0 2.4 2.4c2.1.6 7.6.6 7.6.6s5.5 0 7.6-.6a3.5 3.5 0 0 0 2.4-2.4c.4-1.4.4-3.4.4-3.4s0-2-.4-3.4z" />
        <polygon points="10 9.5 16 12 10 14.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <div className="site-footer-wrapper">
      <footer className="site-footer" aria-label="Informasi Footer dan Tautan">
        {/* Main Columns Grid */}
        <div className="site-footer__grid">
          {/* Column 1: MENU */}
          <div className="site-footer__col">
            <span className="site-footer__tag">MENU</span>
            <nav className="site-footer__nav" aria-label="Menu Utama">
              {MENU_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="site-footer__link"
                >
                  <span className="site-footer__link-arrow" aria-hidden="true">▸</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 2: JELAJAHI / NAVIGASI */}
          <div className="site-footer__col">
            <span className="site-footer__tag">JELAJAHI</span>
            <nav className="site-footer__nav" aria-label="Navigasi Halaman">
              {NAVIGATION_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="site-footer__link"
                >
                  <span className="site-footer__link-arrow" aria-hidden="true">▸</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: ABOUT (Wide Column like IFEST Unpad) */}
          <div className="site-footer__col site-footer__col--about">
            <span className="site-footer__tag">ABOUT</span>

            <h2 className="site-footer__headline">
              Empowering the next generation of{" "}
              <span className="site-footer__highlight">digital pioneers.</span>
            </h2>

            <p className="site-footer__desc">
              Dari ruang belajar hingga gelanggang inovasi, HIMANIKA Politeknik Negeri Jember hadir sebagai wadah eksplorasi, kolaborasi, dan akselerasi mahasiswa Manajemen Informatika untuk mengasah potensi, membangun karya nyata, dan mencetak talenta teknologi berdaya saing.
            </p>

            <div className="site-footer__meta">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Politeknik+Negeri+Jember+Jl.+Mastrip+Sumbersari+Kabupaten+Jember+Jawa+Timur+68121"
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer__meta-item site-footer__meta-item--link"
                title="Buka lokasi di Google Maps"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="site-footer__meta-icon"
                  aria-hidden="true"
                >
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Jl. Mastrip, Sumbersari, Kabupaten Jember, Jawa Timur 68121</span>
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  width="11"
                  height="11"
                  className="site-footer__external-icon"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="site-footer__bottom">
          <div className="site-footer__copy-wrap">
            <p className="site-footer__copyright">
              Copyright © 2026 HIMANIKA - D3 Manajemen Informatika Polije. All rights reserved.
            </p>
            <p className="site-footer__subtext">
              SIMANIKA · Sistem Informasi Himpunan Mahasiswa Manajemen Informatika - Polije
            </p>
          </div>

          <div className="site-footer__actions">
            {/* Social Media Buttons (IFEST style: square bordered with hover invert) */}
            <div className="site-footer__socials" aria-label="Media Sosial">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  title={item.name}
                  className="site-footer__social-btn"
                >
                  {item.icon}
                </a>
              ))}
            </div>

            {/* Back To Top Button */}
            <BackToTopButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
