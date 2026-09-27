"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, MapPin, Tag, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { oprecState } from "@/lib/oprec";

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

const statusBadgeLabels = {
  soon: "Segera Dibuka",
  open: "Pendaftaran Dibuka",
  closed: "Pendaftaran Ditutup",
  announcement: "Pengumuman Tersedia",
};

export function OprecDetailModal({ isOpen, onClose, oprec, stage = null }) {
  const router = useRouter();
  const { user } = useAuth();
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [posterFailed, setPosterFailed] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !enrolling) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, enrolling, onClose]);

  if (!isOpen) return null;

  const state = oprecState(oprec);
  const isOpenPhase = state.key === "open";
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

  const title = stage?.headline || oprec?.headline || "Open Recruitment HIMANIKA";
  const image = stage?.poster || oprec?.poster;
  const lokasi = stage?.lokasi || "Online (SIMANIKA Portal)";
  const kategori = stage
    ? (stage.type === "test_tulis" ? "Ujian Seleksi Daring" : stage.type === "pengumuman" ? "Hasil Seleksi" : "Tahap Pendaftaran")
    : "Rekrutmen Anggota Baru";

  const deskripsi = stage?.deskripsi || oprec?.deskripsi || "Buka potensi diri dan bergabung bersama Himpunan Mahasiswa Manajemen Informatika. Siapkan dirimu untuk menjadi bagian dari perjalanan kepengurusan berikutnya.";
  const divisions = oprec?.divisiTersedia || [];

  async function handleDaftar() {
    if (enrolling) return;

    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/dashboard/oprec")}`);
      return;
    }

    setEnrolling(true);
    setError("");

    try {
      const response = await api.post("/user/oprec/enroll", { oprec_id: oprec?.id });
      onClose();
      router.push(`/dashboard?oprec=${oprec?.id || ""}`);
    } catch (err) {
      if (err.response?.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/dashboard/oprec")}`);
        return;
      }
      if (err.response?.status === 409) {
        onClose();
        router.push("/dashboard/oprec");
        return;
      }
      setError(err.response?.data?.message || err.message || "Pendaftaran belum dapat diproses. Coba lagi.");
      setEnrolling(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget && !enrolling) {
      onClose();
    }
  }

  return (
    <div
      className="oprec-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="oprec-modal-title"
    >
      <div className="oprec-modal-card" ref={modalRef}>
        {/* Close Button */}
        <button
          type="button"
          className="oprec-modal-close"
          onClick={onClose}
          disabled={enrolling}
          aria-label="Tutup detail OPREC"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Modal Content Grid */}
        <div className="oprec-modal-grid">
          {/* Left: Poster */}
          <div className="oprec-modal-poster-wrap">
            {image && !posterFailed ? (
              <img
                src={image}
                alt={title}
                className="oprec-modal-poster-img"
                onError={() => setPosterFailed(true)}
              />
            ) : (
              <div className="oprec-modal-poster-fallback">
                <span className="oprec-mono">HIMANIKA</span>
                <strong>OPREC</strong>
                <span className="oprec-modal-poster-sub">Periode {oprec?.periode || "2026/2027"}</span>
              </div>
            )}
            <div className="oprec-modal-poster-badge">
              <span className="oprec-mono">PERIODE {oprec?.periode || "2026/2027"}</span>
            </div>
          </div>

          {/* Right: Detail Information */}
          <div className="oprec-modal-body">
            <div className="oprec-modal-eyebrow">
              <span className="oprec-mono">HIMANIKA / OPEN RECRUITMENT</span>
              <span className={`oprec-modal-status oprec-modal-status--${state.key}`}>
                <span className="oprec-modal-status-dot" aria-hidden="true" />
                {statusBadgeLabels[state.key] || "Informasi"}
              </span>
            </div>

            <h2 id="oprec-modal-title" className="oprec-modal-title">{title}</h2>

            {/* Quick Metadata */}
            <div className="oprec-modal-meta">
              <div className="oprec-modal-meta-item">
                <Calendar size={16} className="oprec-modal-meta-icon" aria-hidden="true" />
                <span>{dateLabel}</span>
              </div>
              <div className="oprec-modal-meta-item">
                <MapPin size={16} className="oprec-modal-meta-icon" aria-hidden="true" />
                <span>{lokasi}</span>
              </div>
              <div className="oprec-modal-meta-item">
                <Tag size={16} className="oprec-modal-meta-icon" aria-hidden="true" />
                <span>{kategori}</span>
              </div>
            </div>

            {/* Description */}
            <div className="oprec-modal-desc">
              <p>{deskripsi}</p>
            </div>

            {/* Open Divisions List */}
            {divisions.length > 0 && (
              <div className="oprec-modal-divisions">
                <h4 className="oprec-modal-divisions-title">Divisi yang Dibuka:</h4>
                <div className="oprec-modal-divisions-list">
                  {divisions.map((div, idx) => (
                    <div key={div.id || idx} className="oprec-modal-div-chip">
                      <span className="oprec-modal-div-name">{div.nama}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="oprec-modal-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="oprec-modal-footer">
              {isOpenPhase ? (
                <button
                  type="button"
                  className="oprec-modal-cta-btn"
                  onClick={handleDaftar}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <>
                      <Loader2 size={18} className="oprec-spin-icon" aria-hidden="true" />
                      <span>Mempersiapkan pendaftaran…</span>
                    </>
                  ) : (
                    <>
                      <span>Daftar Sekarang</span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </>
                  )}
                </button>
              ) : state.key === "soon" ? (
                <div className="oprec-modal-notice oprec-modal-notice--soon">
                  <Calendar size={18} aria-hidden="true" />
                  <span>Pendaftaran akan dibuka sesuai tanggal yang tertera. Pantau terus halaman ini!</span>
                </div>
              ) : (
                <div className="oprec-modal-notice oprec-modal-notice--closed">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Pendaftaran periode ini telah berakhir. Hasil seleksi dapat dipantau di dashboard akunmu.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
