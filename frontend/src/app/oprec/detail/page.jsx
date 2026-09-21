import Link from "next/link";
import { OprecPoster } from "@/components/oprec/OprecPoster";
import { OprecStatus } from "@/components/oprec/OprecStatus";
import { getOprec } from "@/services/oprecService";

export const metadata = {
  title: "Detail OPREC — SIMANIKA",
  description: "Lihat detail open recruitment HIMANIKA, jadwal, formulir pendaftaran, dan pengumuman hasil seleksi.",
};

export default async function OprecDetailPage() {
  const oprec = await getOprec();
  return <div className="oprec-container oprec-detail">
    <Link className="oprec-detail__back" href="/oprec#pendaftaran">← Kembali ke OPREC</Link>
    <header className="oprec-detail__header">
      <span className="oprec-mono">HIMANIKA / OPEN RECRUITMENT</span>
      <h1>{oprec?.headline || "Pendaftaran & pengumuman."}</h1>
      <p>{oprec?.deskripsi || "Lihat jadwal, daftar saat pendaftaran dibuka, dan cek hasil seleksi di sini."}</p>
    </header>
    <div className="oprec-registration-grid">
      <OprecPoster src={oprec?.poster} alt={oprec?.posterAlt} periode={oprec?.periode} />
      <OprecStatus oprec={oprec} initialNow={Date.now()} />
    </div>
  </div>;
}
