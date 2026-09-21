import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { LazySection } from "@/components/ui/LazySection";

const AboutSection = dynamic(
  () =>
    import("@/components/sections/AboutSection").then(
      (mod) => mod.AboutSection,
    ),
  { ssr: true },
);

const VisiMisiSection = dynamic(
  () =>
    import("@/components/sections/VisiMisiSection").then(
      (mod) => mod.VisiMisiSection,
    ),
  { ssr: true },
);

import { DivisiSection } from "@/components/sections/DivisiSection";

const GallerySection = dynamic(
  () =>
    import("@/components/sections/GallerySection").then(
      (mod) => mod.GallerySection,
    ),
  { ssr: true },
);

const TestimonialsSection = dynamic(
  () =>
    import("@/components/sections/TestimonialsSection").then(
      (mod) => mod.TestimonialsSection,
    ),
  { ssr: true },
);

import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="site-parallax-root">
      {/* 1. Main Page Content (curtain that scrolls over the footer) */}
      <main className="site-main-content">
        <Navbar />
        {/* Hero directly visible on first paint */}
        <HeroSection />

        {/* Off-screen sections rendered dynamically on scroll */}
        <LazySection minHeight="45rem" rootMargin="800px 0px">
          <AboutSection />
        </LazySection>

        <LazySection minHeight="55rem" rootMargin="800px 0px">
          <VisiMisiSection />
        </LazySection>

        <DivisiSection />

        <LazySection minHeight="45rem" rootMargin="800px 0px">
          <GallerySection />
        </LazySection>

        <LazySection minHeight="45rem" rootMargin="800px 0px">
          <TestimonialsSection />
        </LazySection>
      </main>

      {/* 2. Sticky Parallax Reveal Footer (IFEST Unpad style) */}
      <div className="site-footer-sticky-wrap">
        <Footer />
      </div>
    </div>
  );
}

