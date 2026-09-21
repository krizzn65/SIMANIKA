import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { VisiMisiSection } from "@/components/sections/VisiMisiSection";
import { DivisiSection } from "@/components/sections/DivisiSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { MotionVisibility } from "@/components/ui/MotionVisibility";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="site-root">
      {/* Main page content */}
      <main className="site-main-content">
        <Navbar />
        {/* Hero directly visible on first paint */}
        <HeroSection />

        <AboutSection />
        <VisiMisiSection />
        <DivisiSection />
        <GallerySection />
        <TestimonialsSection />
        <MotionVisibility />
      </main>

      {/* Footer reveals from behind the main content */}
      <div className="site-footer-wrap">
        <Footer />
      </div>
    </div>
  );
}
