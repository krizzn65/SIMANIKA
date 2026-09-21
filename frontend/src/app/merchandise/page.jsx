import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import styles from "./merchandise.module.css";

export const metadata = {
  title: "Merchandise — Coming Soon | SIMANIKA",
  description: "Merchandise HIMANIKA segera hadir. Pantau halaman ini untuk informasi koleksi dan pemesanan terbaru.",
};

export default function MerchandisePage() {
  return (
    <div className="site-root">
      <div className="site-main-content">
        <Navbar />
        <main className={styles.page}>
          <section className={styles.content} aria-labelledby="merchandise-title">
            <span className={styles.eyebrow}>HIMANIKA / MERCHANDISE</span>
            <div className={styles.illustration} aria-hidden="true">
              <svg viewBox="0 0 160 160" fill="none">
                <path d="m80 26 49 26-49 27-49-27 49-26Z" fill="#DBEAFE" />
                <path d="M31 52v55l49 27V79L31 52Z" fill="#155EEF" />
                <path d="m80 79 49-27v55l-49 27V79Z" fill="#0F4BCB" />
                <path d="m56 39 49 27v21l-15 8V74L41 47l15-8Z" fill="#F4F7FB" />
                <path d="m80 26 49 26v55l-49 27-49-27V52l49-26Z" stroke="#0A1020" strokeWidth="3" strokeLinejoin="round" />
                <path d="m31 52 49 27 49-27M80 79v55" stroke="#0A1020" strokeWidth="3" strokeLinejoin="round" />
                <path d="M133 15v18m-9-9h18M18 114v12m-6-6h12" stroke="#155EEF" strokeWidth="3" />
              </svg>
              <span className={styles.sticker}>SEGERA HADIR</span>
            </div>
            <h1 id="merchandise-title">Coming <span>soon.</span></h1>
            <p>Merchandise HIMANIKA sedang disiapkan.<br />Pantau halaman ini untuk kabar koleksi dan pemesanan berikutnya.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/">Kembali ke beranda <span aria-hidden="true">↗</span></Link>
              <Link className={styles.secondary} href="/events">Jelajahi event <span aria-hidden="true">→</span></Link>
            </div>
            <span className={styles.footnote}>DARI HIMANIKA, UNTUK KAMU.</span>
          </section>
        </main>
      </div>
      <div className="site-footer-wrap"><Footer /></div>
    </div>
  );
}
