import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AlbumList } from "@/components/gallery/AlbumList";

export const metadata = {
  title: "Galeri Kegiatan — SIMANIKA",
  description: "Dokumentasi kegiatan, event, dan kolaborasi HIMANIKA.",
};

export default function GaleriPage() {
  return (
    <div className="galeri-container galeri-directory">
      <Link className="galeri-back" href="/#gallery"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke beranda</Link>
      <header className="galeri-header">
        <span className="galeri-mono galeri-eyebrow"><span aria-hidden="true" />HIMANIKA / GALERI KEGIATAN</span>
        <h1>Momen yang <em>terukir.</em></h1>
        <p>Dokumentasi kegiatan, event, dan kolaborasi HIMANIKA. Pilih kegiatan untuk melihat foto-fotonya.</p>
      </header>
      <AlbumList />
    </div>
  );
}
