"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, RefreshCw, User, CheckCircle2, FileText, Calendar, AlertCircle, Clock3 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OprecForm } from "@/components/oprec/OprecForm";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { normalizeOprec } from "@/lib/oprec";
import styles from "./oprec-workspace.module.css";
import "../../oprec/oprec.css";

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

function WorkspaceContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRefreshing(true);
    try {
      const response = await api.get("/user/oprec/workspace", { signal: controller.signal });
      if (!response.data?.data?.oprec) throw new Error("Data OPREC belum dapat dimuat.");
      setData(response.data.data);
      setError("");
    } catch (err) {
      if (!controller.signal.aborted) {
        if (err.response?.status === 404) setData(null);
        setError(err.response?.status === 404 ? "Periode rekrutmen belum tersedia." : err.message || "Gagal memuat data OPREC.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      router.replace("/admin");
      return;
    }
    if (!user) return;
    load();
    return () => abortRef.current?.abort();
  }, [load, user?.id, user?.role, router]);

  if (user?.role === "admin") return null;

  let normalizedOprec = null;
  if (data?.oprec) {
    try {
      normalizedOprec = normalizeOprec(data.oprec);
    } catch (e) {
      normalizedOprec = data.oprec;
    }
  }

  const registration = data?.registration;
  const isSubmitted = Boolean(registration);
  const announced = Boolean(data?.announced);
  const oprecInfo = data?.oprec;

  const divisionMap = new Map();
  if (data?.oprec?.divisions) {
    for (const div of data.oprec.divisions) {
      divisionMap.set(Number(div.id), div.namaLengkap || div.nama);
    }
  }

  return (
    <main className={styles.workspace}>
      <div className={styles.container}>
        <nav className={styles.toolbar} aria-label="Navigasi workspace OPREC">
          <Link className={styles.button} href="/dashboard">
            <ArrowLeft size={16} aria-hidden="true" /> Dashboard
          </Link>
          <button className={styles.button} type="button" onClick={load} disabled={refreshing}>
            <RefreshCw size={15} aria-hidden="true" className={refreshing ? styles.spinning : ""} /> Perbarui
          </button>
        </nav>

        {error && <div className={styles.error} role="alert">{error}</div>}

        {loading ? (
          <div className={styles.loading} role="status">Memuat workspace pendaftaran…</div>
        ) : !data?.oprec ? (
          <div className={styles.loading}>Belum ada periode OPREC aktif yang dibuka saat ini.</div>
        ) : (
          <>
            <header className={styles.heading}>
              <p className={styles.eyebrow}>HIMANIKA / OPEN RECRUITMENT</p>
              <h1>{oprecInfo?.headline || "Open Recruitment HIMANIKA"}</h1>
              <Link href="/oprec">
                Informasi OPREC <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </header>

            <div className={styles.columns}>
              {/* Left Sidebar */}
              <aside className={styles.sidebar} aria-label="Status & Informasi Pendaftar">
                {/* Account Card */}
                <section className={styles.panel}>
                  <h2><User size={18} aria-hidden="true" /> Data Akun</h2>
                  <div className={styles.metaList}>
                    <div className={styles.metaItem}>
                      <span>Nama Lengkap</span>
                      <span>{user?.namaLengkap || user?.name || "—"}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span>Email</span>
                      <span>{user?.email || "—"}</span>
                    </div>
                    {registration?.nim && (
                      <div className={styles.metaItem}>
                        <span>NIM Terdaftar</span>
                        <span>{registration.nim}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Status Card */}
                <section className={styles.panel}>
                  <h2><Clock3 size={18} aria-hidden="true" /> Status Pendaftaran</h2>
                  <div style={{ marginBottom: "14px" }}>
                    {announced ? (
                      <span className={`${styles.badge} ${registration?.status === "accepted" ? styles.success : registration?.status === "rejected" ? styles.danger : styles.neutral}`}>
                        {registration?.status === "accepted" ? "Diterima" : registration?.status === "rejected" ? "Belum Diterima" : "Menunggu Hasil"}
                      </span>
                    ) : isSubmitted ? (
                      <span className={`${styles.badge} ${styles.success}`}>
                        Terkirim · Menunggu Verifikasi
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.amber}`}>
                        Perlu Dilengkapi
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--ws-muted)", lineHeight: 1.6 }}>
                    {announced ? (
                      registration?.status === "accepted" ? (
                        `Selamat! Kamu dinyatakan lolos seleksi OPREC di divisi ${registration.acceptedDivision || "pilihan"}.`
                      ) : registration?.status === "rejected" ? (
                        "Terima kasih atas partisipasimu. Jangan berkecil hati dan terus berkembang!"
                      ) : (
                        "Hasil seleksi sedang diproses."
                      )
                    ) : isSubmitted ? (
                      "Pendaftaranmu telah berhasil tercatat. Simpan NIM dan tanggal lahir untuk pengumuman."
                    ) : (
                      "Kamu sudah terdaftar di sistem. Silakan lengkapi formulir pendaftaran di samping agar berkasmu dapat diverifikasi."
                    )}
                  </p>
                </section>

                {/* Timeline Card */}
                <section className={styles.panel}>
                  <h2><Calendar size={18} aria-hidden="true" /> Jadwal Kegiatan</h2>
                  <div className={styles.metaList}>
                    <div className={styles.metaItem}>
                      <span>Buka Pendaftaran</span>
                      <span>{formatDate(oprecInfo?.tanggalBuka) || "—"}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span>Batas Pendaftaran</span>
                      <span>{formatDate(oprecInfo?.tanggalTutup) || "—"}</span>
                    </div>
                    {oprecInfo?.pengumuman?.tanggal && (
                      <div className={styles.metaItem}>
                        <span>Pengumuman Hasil</span>
                        <span>{formatDate(oprecInfo.pengumuman.tanggal)}</span>
                      </div>
                    )}
                  </div>
                </section>
              </aside>

              {/* Main Content Area */}
              <section className={styles.panel} aria-labelledby="form-section-title">
                <header className={styles.panelHeader}>
                  <h2 id="form-section-title">
                    <FileText size={19} aria-hidden="true" /> Data & administrasi
                  </h2>
                  <span className={`${styles.badge} ${isSubmitted ? styles.success : styles.neutral}`}>
                    {isSubmitted ? "Terkirim" : "Belum dikirim"}
                  </span>
                </header>

                {isSubmitted ? (
                  <div>
                    <div className={styles.notice}>
                      <CheckCircle2 size={20} aria-hidden="true" />
                      <div>
                        <h3>Pendaftaran Berhasil Dikirim</h3>
                        <p>
                          Data pendaftaranmu telah kami terima pada {formatDate(registration.registeredAt)}.
                          Kamu dapat memantau status seleksi dan pengumuman divisi melalui halaman ini.
                        </p>
                      </div>
                    </div>

                    <dl className={styles.answers}>
                      <div>
                        <dt>NIM</dt>
                        <dd>{registration.nim}</dd>
                      </div>
                      <div>
                        <dt>Tanggal Lahir</dt>
                        <dd>{formatDate(registration.tanggalLahir)}</dd>
                      </div>
                      <div>
                        <dt>Divisi Pilihan 1</dt>
                        <dd>{divisionMap.get(Number(registration.divisiPilihan1)) || `Divisi #${registration.divisiPilihan1 || "—"}`}</dd>
                      </div>
                      {registration.divisiPilihan2 && (
                        <div>
                          <dt>Divisi Pilihan 2</dt>
                          <dd>{divisionMap.get(Number(registration.divisiPilihan2)) || `Divisi #${registration.divisiPilihan2}`}</dd>
                        </div>
                      )}
                      {registration.formData && Object.entries(registration.formData).map(([key, val]) => {
                        if (["nim", "tanggal_lahir", "divisi_pilihan_1", "divisi_pilihan_2"].includes(key)) return null;
                        const fieldMeta = normalizedOprec?.formFields?.find((f) => f.name === key);
                        const label = fieldMeta?.label || key;
                        return (
                          <div key={key}>
                            <dt>{label}</dt>
                            <dd>{typeof val === "boolean" ? (val ? "Ya" : "Tidak") : String(val || "—")}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                ) : (
                  normalizedOprec && (
                    <OprecForm oprec={normalizedOprec} onSuccess={load} />
                  )
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export function OprecWorkspace() {
  return (
    <div className="site-root">
      <Navbar />
      <ProtectedRoute>
        <WorkspaceContent />
      </ProtectedRoute>
    </div>
  );
}
