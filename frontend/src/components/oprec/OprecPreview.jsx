"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { oprecState } from "@/lib/oprec";
import { OprecEmptyState } from "./OprecEmptyState";

function formatOprecDate(value) {
  if (!value) return null;
  const dateObj = new Date(value);
  if (isNaN(dateObj.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(dateObj);
}

// IFEST-style curtain grid: 20 columns x 9 rows.
// Left (cols 0-3: 0%, 5%, 10%, 15%) and Right (cols 16-19: 80%, 85%, 90%, 95%) have solid blue blocks.
// Center (cols 4-15: 20% to 80%) remains open to showcase the poster.
// On hover, blocks fade out sequentially like a curtain per row & column.
const CURTAIN_BLOCKS = (() => {
  const blocks = [];
  let key = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 20; col++) {
      if (col >= 4 && col < 16) continue;
      const distFromInner = col < 4 ? 3 - col : col - 16;
      // Stagger: distinct row-by-row cascade (75ms per row) + inner-to-outer flow (55ms per col)
      // Provides a smooth, luxurious, highly visible curtain blinds dissolve effect
      const delay = Number((row * 0.075 + distFromInner * 0.055).toFixed(3));
      blocks.push({
        key: key++,
        top: (row / 9) * 100,
        left: (col / 20) * 100,
        width: 5,
        height: 100 / 9,
        delay,
      });
    }
  }
  return blocks;
})();

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
  const deadline = stage?.tanggalTutup || oprec?.tanggalTutup;

  const startFormatted = formatOprecDate(start);
  const deadlineFormatted = formatOprecDate(deadline);

  let dateLabel = "Jadwal menyusul";
  if (startFormatted && deadlineFormatted) {
    dateLabel = startFormatted === deadlineFormatted
      ? startFormatted
      : `${startFormatted} - ${deadlineFormatted}`;
  } else if (startFormatted) {
    dateLabel = startFormatted;
  } else if (deadlineFormatted) {
    dateLabel = deadlineFormatted;
  }

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

        {/* IFEST-style Curtain Grid (left & right blue blocks that fade on hover) */}
        <div className="oprec-preview__curtain" aria-hidden="true">
          {CURTAIN_BLOCKS.map((block) => (
            <div
              key={block.key}
              className="oprec-curtain-block"
              style={{
                top: `${block.top}%`,
                left: `${block.left}%`,
                width: `${block.width}%`,
                height: `${block.height}%`,
                transitionDelay: active ? `${block.delay}s` : `${Number((block.delay * 0.25).toFixed(3))}s`,
              }}
            />
          ))}
        </div>

        {/* Text appears on hover over the poster (like IFEST) */}
        <div className="oprec-preview__art-overlay" aria-hidden="true">
          <h4 className="oprec-preview__art-title">{title}</h4>
        </div>
      </div>
    </article>
  );
}
