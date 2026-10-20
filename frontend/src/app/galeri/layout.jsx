import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "./galeri.css";

export default function GaleriLayout({ children }) {
  return (
    <div className="site-root">
      <div className="site-main-content">
        <SmoothScroll />
        <Navbar />
        <main className="galeri-page" id="galeri-content">{children}</main>
      </div>
      <div className="site-footer-wrap"><Footer /></div>
    </div>
  );
}
