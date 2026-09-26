"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { oprecDate, oprecState } from "@/lib/oprec";
import { OprecEmptyState } from "./OprecEmptyState";
import { PixelDissolve } from "./PixelDissolve";
import { CalendarPlusIcon } from "@/components/ui/CalendarPlusIcon";

const previewStatus = {
  soon: "Segera Dibuka",
  open: "Pendaftaran Dibuka",
  closed: "Pendaftaran Ditutup",
  announcement: "Pengumuman Tersedia",
};

export function OprecPreview({ oprec, initialNow, stage = null }) {
  const [now, setNow] = useState(initialNow);
  const [posterFailed, setPosterFailed] = useState(false);
  const [active, setActive] = useState(false);
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
  if (!stage && state.key === "empty") {
    return <OprecEmptyState />;
  }

  const start = stage?.tanggalBuka || oprec?.tanggalBuka;
  const dateLabel = start ? oprecDate(start) : "Jadwal menyusul";

  const description = {
    soon: "Rekrutmen berikutnya sudah dekat. Kenali jadwal dan siapkan langkah pertamamu.",
    open: "Saatnya ambil bagian. Lihat ketentuan dan lengkapi formulir pendaftaranmu.",
    closed: "Pendaftaran periode ini sudah selesai. Ikuti informasi hasil seleksi di halaman detail.",
    announcement: "Hasil seleksi sudah tersedia. Cek hasilmu menggunakan NIM dan tanggal lahir.",
  }[state.key];

  const title = stage?.headline || oprec?.headline || "Open recruitment.";
  const image = stage?.poster || oprec?.poster;
  const kind = stage?.type === "test_tulis" ? "Tes tulis" : stage?.type === "pengumuman" ? "Pengumuman" : "Pendaftaran";
  return <article className="oprec-preview" onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)} onFocus={() => setActive(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(false); }} aria-labelledby={`oprec-preview-title-${stage?.id || "registration"}`}>
    <div className="oprec-preview__content">
      <span className="oprec-preview__eyebrow">// {kind.toUpperCase()} · {oprec?.periode}</span>
      <h3 id={`oprec-preview-title-${stage?.id || "registration"}`}>{title}</h3>
      <div className="oprec-preview__facts"><span><CalendarPlusIcon size={16} loop={false} /> {dateLabel}</span><span className={`oprec-preview__status oprec-preview__status--${state.key}`} aria-live="polite"><span aria-hidden="true" />{stage ? kind : previewStatus[state.key]}</span></div>
      <p className="oprec-preview__description">{stage?.deskripsi || oprec?.deskripsi || description}</p>
      <div className="oprec-preview__footer">
        <Link className="oprec-preview__button" href={stage ? `/oprec/detail?stage=${stage.type}` : "/oprec/detail"} prefetch={false}>Lihat detail <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
      </div>
    </div>
    <div className="oprec-preview__art" aria-hidden="true">
      <div className={`oprec-preview__sheet ${!image || posterFailed ? "oprec-preview__sheet--empty" : ""}`}>
        {image && !posterFailed ? <img src={image} alt="" width="600" height="800" loading="lazy" decoding="async" onError={() => setPosterFailed(true)} /> : <div className="oprec-preview__placeholder"><span className="oprec-mono">HIMPUNAN MAHASISWA<br />MANAJEMEN INFORMATIKA</span><strong>OP<span>REC.</span></strong><span className="oprec-preview__poster-note">Ruang untuk tumbuh.<br />Tempat untuk berkontribusi.</span><span className="oprec-mono">{oprec?.periode || "COMING SOON"}</span></div>}
      </div>
      <PixelDissolve active={active} />
    </div>
  </article>;
}
