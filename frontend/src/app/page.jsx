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

export default function HomePage() {
  return (
    <main>
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
    </main>
  );
}

