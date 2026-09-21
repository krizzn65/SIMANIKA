import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./oprec.css";

export default function OprecLayout({ children }) {
  return <div className="site-root"><div className="site-main-content"><Navbar /><main className="oprec-page" id="oprec-content">{children}</main></div><div className="site-footer-wrap"><Footer /></div></div>;
}
