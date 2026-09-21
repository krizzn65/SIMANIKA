import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./events.css";

export default function EventsLayout({ children }) {
  return (
    <div className="site-root">
      <div className="site-main-content">
        <Navbar />
        <main id="event-content" className="events-page">{children}</main>
      </div>
      <div className="site-footer-wrap"><Footer /></div>
    </div>
  );
}
