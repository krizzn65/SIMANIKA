"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { oprecDate, oprecState } from "@/lib/oprec";
import { OprecEmptyState } from "./OprecEmptyState";

const previewStatus = {
  soon: "Segera Dibuka",
  open: "Pendaftaran Dibuka",
  closed: "Pendaftaran Ditutup",
  announcement: "Pengumuman Tersedia",
};

export function OprecPreview({ oprec, initialNow }) {
  const [now, setNow] = useState(initialNow);
  const [posterFailed, setPosterFailed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const update = () => { if (!document.hidden) { setNow(Date.now()); router.refresh(); } };
    const dates = [oprec?.tanggalBuka, oprec?.tanggalTutup, oprec?.pengumuman.tanggal]
      .filter(Boolean).map(Date.parse).filter((value) => value > Date.now());
    const nextDate = dates.length ? Math.min(...dates) : null;
    const boundary = nextDate ? setTimeout(update, Math.min(nextDate - Date.now() + 50, 2147483647)) : null;
    const interval = setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    return () => { clearTimeout(boundary); clearInterval(interval); document.removeEventListener("visibilitychange", update); };
  }, [oprec, router]);

  const state = oprecState(oprec, now);
  if (state.key === "empty") {
    return <OprecEmptyState />;
  }

  const dateLabel = state.key === "announcement" && oprec?.pengumuman.tanggal
    ? `Pengumuman ${oprecDate(oprec.pengumuman.tanggal)}`
    : oprec?.tanggalBuka ? `Mulai ${oprecDate(oprec.tanggalBuka)}` : "Jadwal menyusul";

  const description = {
    soon: "Rekrutmen berikutnya sudah dekat. Kenali jadwal dan siapkan langkah pertamamu.",
    open: "Saatnya ambil bagian. Lihat ketentuan dan lengkapi formulir pendaftaranmu.",
    closed: "Pendaftaran periode ini sudah selesai. Ikuti informasi hasil seleksi di halaman detail.",
    announcement: "Hasil seleksi sudah tersedia. Cek hasilmu menggunakan NIM dan tanggal lahir.",
  }[state.key];

  return <article className="oprec-preview" aria-labelledby="oprec-preview-title">
    <div className="oprec-preview__content">
      <span className={`oprec-preview__status oprec-preview__status--${state.key}`} aria-live="polite"><span aria-hidden="true" />{previewStatus[state.key]}</span>
      <h3 id="oprec-preview-title">{oprec?.headline || "Open recruitment."}</h3>
      <p className="oprec-preview__description">{description}</p>
      <div className="oprec-preview__footer">
        <div className="oprec-preview__meta"><span className="oprec-mono">{oprec ? `PERIODE ${oprec.periode}` : "PERIODE BERIKUTNYA"}</span><span>{dateLabel}</span></div>
        <Link className="oprec-preview__button" href="/oprec/detail" prefetch={false}>Lihat detail <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
      </div>
    </div>
    <div className="oprec-preview__art" aria-hidden="true">
      <span className="oprec-preview__art-label oprec-mono">HIMANIKA / RECRUITMENT</span>
      <div className="oprec-preview__sheet">
        {oprec?.poster && !posterFailed ? <img src={oprec.poster} alt="" width="600" height="800" loading="lazy" decoding="async" onError={() => setPosterFailed(true)} /> : <div className="oprec-preview__placeholder"><span className="oprec-mono">HIMPUNAN MAHASISWA<br />MANAJEMEN INFORMATIKA</span><strong>OP<span>REC.</span></strong><span className="oprec-preview__poster-note">Ruang untuk tumbuh.<br />Tempat untuk berkontribusi.</span><span className="oprec-mono">{oprec?.periode || "COMING SOON"}</span></div>}
      </div>
      <svg className="oprec-preview__corner" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M0 0h12v4H4v8H0zm20 20h12v12H20z" /></svg>
    </div>
  </article>;
}
