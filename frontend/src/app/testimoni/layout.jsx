import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "./testimoni.css";

export default function TestimoniLayout({ children }) {
  return (
    <div className="site-root">
      <div className="site-main-content">
        <SmoothScroll />
        <Navbar />
        <main className="testimoni-page" id="testimoni-content">
          {children}
        </main>
      </div>
      <div className="site-footer-wrap">
        <Footer />
      </div>
    </div>
  );
}
