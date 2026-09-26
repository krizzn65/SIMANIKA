"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { oprecDate, oprecState } from "@/lib/oprec";
import { OprecEmptyState } from "./OprecEmptyState";
import { PixelDissolve } from "./PixelDissolve";

const previewStatus = {
  soon: "Segera Dibuka",
  open: "Pendaftaran Dibuka",
  closed: "Pendaftaran Ditutup",
  announcement: "Pengumuman Tersedia",
};

function CalendarIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function MapPinIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function TicketIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </svg>
  );
}

function ArrowRightIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function OprecPreview({ oprec, initialNow, stage = null }) {
  const [now, setNow] = useState(initialNow);
  const [posterFailed, setPosterFailed] = useState(false);
  const [active, setActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const update = () => { if (!document.hidden) { setNow(Date.now()); router.refresh(); } };
    const dates = [oprec?.tanggalBuka, oprec?.tanggalTutup, oprec?.pengumuman?.tanggal]
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

  const title = stage?.headline || oprec?.headline || "Open Recruitment";
  const image = stage?.poster || oprec?.poster;
  const kind = stage?.type === "test_tulis" ? "Tes tulis" : stage?.type === "pengumuman" ? "Pengumuman" : "Pendaftaran";
  const lokasi = stage?.lokasi || "Online (SIMANIKA Portal)";
  const kategori = stage ? (stage.type === "test_tulis" ? "Ujian Seleksi Daring" : stage.type === "pengumuman" ? "Hasil Seleksi" : "Tahap Pendaftaran") : "Rekrutmen Anggota Baru";

  return (
    <article
      className={`oprec-preview ${active ? "oprec-preview--active" : ""}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(false);
      }}
      aria-labelledby={`oprec-preview-title-${stage?.id || "registration"}`}
    >
      {/* Top 3px IFEST accent bar */}
      <div className="oprec-preview__top-bar" aria-hidden="true" />

      {/* LEFT: Information & actions */}
      <div className="oprec-preview__content">
        <span className="oprec-preview__eyebrow">// {kind.toUpperCase()} · {oprec?.periode}</span>
        <h3 id={`oprec-preview-title-${stage?.id || "registration"}`}>{title}</h3>

        {/* Facts with 3 icons matching IFEST */}
        <div className="oprec-preview__facts">
          <div className="oprec-preview__fact-item">
            <span className="oprec-preview__fact-icon" aria-hidden="true"><CalendarIcon size={14} /></span>
            <span>{dateLabel}</span>
          </div>
          <div className="oprec-preview__fact-item">
            <span className="oprec-preview__fact-icon" aria-hidden="true"><MapPinIcon size={14} /></span>
            <span>{lokasi}</span>
          </div>
          <div className="oprec-preview__fact-item">
            <span className="oprec-preview__fact-icon" aria-hidden="true"><TicketIcon size={14} /></span>
            <span>{kategori}</span>
          </div>
        </div>

        {/* Status badge in IFEST style */}
        <div className="oprec-preview__badge-wrapper">
          <span className={`oprec-preview__badge oprec-preview__badge--${state.key}`} aria-live="polite">
            <span className="oprec-preview__badge-dot" aria-hidden="true" />
            {stage ? kind : previewStatus[state.key]}
          </span>
        </div>

        <p className="oprec-preview__description">
          {stage?.deskripsi || oprec?.deskripsi || description}
        </p>

        <div className="oprec-preview__footer">
          <Link
            className="oprec-preview__button"
            href={stage ? `/oprec/detail?stage=${stage.type}` : "/oprec/detail"}
            prefetch={false}
          >
            <span>Lihat detail</span>
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>

      {/* RIGHT: Poster with crop, blue pixel dissolve & on-hover text reveal */}
      <div className="oprec-preview__art">
        {image && !posterFailed ? (
          <img
            src={image}
            alt={title}
            className="oprec-preview__poster-img"
            loading="lazy"
            decoding="async"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <div className="oprec-preview__fallback-wrap">
            <div className="oprec-preview__placeholder">
              <span className="oprec-mono">HIMPUNAN MAHASISWA<br />MANAJEMEN INFORMATIKA</span>
              <strong>OP<span>REC.</span></strong>
              <span className="oprec-preview__poster-note">Ruang untuk tumbuh.<br />Tempat untuk berkontribusi.</span>
              <span className="oprec-mono">{oprec?.periode || "COMING SOON"}</span>
            </div>
          </div>
        )}

        {/* IFEST gradient & radial glow overlay */}
        <div className="oprec-preview__art-vignette" aria-hidden="true" />
        <div className="oprec-preview__art-glow" aria-hidden="true" />

        {/* Pixel Dissolve Blocks (React Bits style) */}
        <PixelDissolve active={active} />

        {/* Text appears on hover over the poster (like IFEST) */}
        <div className="oprec-preview__art-overlay" aria-hidden="true">
          <span className="oprec-preview__art-kicker">// {kind.toUpperCase()}</span>
          <h4 className="oprec-preview__art-title">{title}</h4>
        </div>
      </div>
    </article>
  );
}
