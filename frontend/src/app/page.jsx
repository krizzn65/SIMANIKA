import "./landing.css";
import { Navbar } from "@/components/layout/Navbar";
import { LandingManagedSections } from "@/components/sections/LandingManagedSections";
import { MotionVisibility } from "@/components/ui/MotionVisibility";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

export default function HomePage() {
  return (
    <div className="site-root">
      {/* Main page content */}
      <main className="site-main-content">
        <SmoothScroll />
        <Navbar />
        {/* Hero directly visible on first paint */}
        <LandingManagedSections />
        <MotionVisibility />
      </main>

      {/* Footer reveals from behind the main content */}
      <div className="site-footer-wrap">
        <Footer />
      </div>
    </div>
  );
}
