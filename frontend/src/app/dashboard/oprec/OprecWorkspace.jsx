"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, RefreshCw, User, CheckCircle2, FileText, Calendar, Clock3, BookOpen } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OprecForm } from "@/components/oprec/OprecForm";
import { WrittenTestCard } from "./WrittenTestCard";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { STAFF_ROLES, adminHome } from "@/lib/roleAccess";
import { normalizeOprec, oprecState } from "@/lib/oprec";
import { getOprecSummaryRows } from "@/lib/oprecWorkspaceSummary";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
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

function WorkspaceContent({ oprecId }) {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [workingOnTest, setWorkingOnTest] = useState(false);
  const [whatsAppDialogLink, setWhatsAppDialogLink] = useState("");
  const abortRef = useRef(null);
  const whatsAppDialogRef = useRef(null);
  const whatsAppCloseRef = useRef(null);
  const whatsAppCardLinkRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRefreshing(true);
    try {
      const response = await api.get("/user/oprec/workspace", { signal: controller.signal, params: oprecId ? { oprec_id: oprecId } : undefined });
      if (controller.signal.aborted) return;
      if (!response.data?.data?.oprec) throw new Error("Data OPREC belum dapat dimuat.");
      setData(response.data.data);
      setError("");
      return response.data.data;
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
  }, [oprecId]);

  const handleRegistrationSuccess = useCallback(async () => {
    const workspace = await load();
    if (!workspace?.registration) return;
    const link = workspace.oprec?.link_grup_wa || workspace.oprec?.linkGrupWa
      || workspace.registration.link_grup_wa || workspace.registration.linkGrupWa;
    if (link) setWhatsAppDialogLink(link);
  }, [load]);

  useEffect(() => {
    if (!whatsAppDialogLink) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    whatsAppCloseRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setWhatsAppDialogLink("");
      } else if (event.key === "Tab") {
        const focusable = [...(whatsAppDialogRef.current?.querySelectorAll('button:not([disabled]), a[href]') || [])];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
      else whatsAppCardLinkRef.current?.focus();
    };
  }, [whatsAppDialogLink]);

  useEffect(() => {
    if (STAFF_ROLES.includes(user?.role)) {
      router.replace(adminHome(user?.role));
      return;
    }
    if (!user) return;
    load();
    return () => abortRef.current?.abort();
  }, [load, user?.id, user?.role, router]);

  const normalizedOprec = useMemo(() => {
    if (!data?.oprec) return null;
    const rawOprec = {
      ...data.oprec,
      divisiTersedia: data.oprec.divisiTersedia || data.oprec.divisions || [],
    };
    try {
      return normalizeOprec(rawOprec);
    } catch {
      return rawOprec;
    }
  }, [data?.oprec]);

  if (STAFF_ROLES.includes(user?.role)) return null;

  const registration = data?.registration;
  const isSubmitted = Boolean(registration);
  const announced = Boolean(data?.announced);
  const oprecInfo = data?.oprec;
  const waLink = oprecInfo?.link_grup_wa || oprecInfo?.linkGrupWa || registration?.link_grup_wa || registration?.linkGrupWa || normalizedOprec?.link_grup_wa || normalizedOprec?.linkGrupWa || "";

  const userFullName =
    registration?.formData?.nama_lengkap ||
    registration?.formData?.nama ||
    registration?.formData?.namaLengkap ||
    user?.namaLengkap ||
    user?.nama ||
    user?.name ||
    "—";

  const divisionMap = new Map();
  for (const div of data?.oprec?.divisions || data?.oprec?.divisiTersedia || []) {
    divisionMap.set(Number(div.id), div.namaLengkap || div.nama);
  }
  const summaryRows = getOprecSummaryRows(
    registration,
    normalizedOprec?.formFields,
    divisionMap,
    userFullName,
    formatDate(registration?.tanggalLahir)
  );

  return (
    <main className={styles.workspace}>
      <div className={styles.container}>
        {!workingOnTest && <nav className={styles.toolbar} aria-label="Navigasi workspace OPREC">
          <Link className={styles.button} href="/dashboard">
            <ArrowLeft size={16} aria-hidden="true" /> Dashboard
          </Link>
          <button className={styles.button} type="button" onClick={load} disabled={refreshing}>
            <RefreshCw size={15} aria-hidden="true" className={refreshing ? styles.spinning : ""} /> Perbarui
          </button>
        </nav>}

        {error && <div className={styles.error} role="alert">{error}</div>}

        {loading ? (
          <div className={styles.loading} role="status">Memuat workspace pendaftaran…</div>
        ) : !data?.oprec ? (
          <div className={styles.loading}>Belum ada periode OPREC aktif yang dibuka saat ini.</div>
        ) : (
          <>
            {!workingOnTest && <header className={styles.heading}>
              <p className={styles.eyebrow}>HIMANIKA / OPEN RECRUITMENT</p>
              <h1>{oprecInfo?.headline || "Open Recruitment HIMANIKA"}</h1>
              <Link href="/oprec">
                Informasi OPREC <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </header>}

            <div className={`${styles.columns} ${workingOnTest ? styles.testFocusLayout : ""}`}>
              {/* Left Sidebar */}
              {!workingOnTest && <aside className={styles.sidebar} aria-label="Status & Informasi Pendaftar">
                {/* Account Card */}
                <section className={styles.panel}>
                  <h2><User size={18} aria-hidden="true" /> Data Akun</h2>
                  <div className={styles.metaList}>
                    <div className={styles.metaItem}>
                      <span>Nama Lengkap</span>
                      <span>{userFullName}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span>Email</span>
                      <span>{user?.email || "—"}</span>
                    </div>
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
                        Terkirim
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
                      data?.writtenTestSubmitted
                        ? "Jawaban tes tulismu terkirim. Tunggu info dari panitia untuk tahap selanjutnya. Simpan NIM dan tanggal lahir untuk melihat hasil."
                        : "Pendaftaranmu terkirim. Tunggu info dari panitia untuk tahap selanjutnya."
                    ) : (
                      "Lengkapi formulir pendaftaran di samping, lalu kirim untuk mengikuti tahapan seleksi."
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

                {oprecInfo?.guidebook && (
                  <section className={styles.panel}>
                    <h2><BookOpen size={18} aria-hidden="true" /> Guidebook OPREC</h2>
                    <a href={oprecInfo.guidebook} target="_blank" rel="noopener noreferrer" className={styles.guidebookButton}>
                      <BookOpen size={16} aria-hidden="true" /> <span>Buka Guidebook</span>
                    </a>
                  </section>
                )}

                {/* WhatsApp Group Card (only appears after registration is submitted) */}
                {isSubmitted && waLink && (
                  <section className={`${styles.panel} ${styles.waCard}`}>
                    <div className={styles.waCardHeader}>
                      <div className={styles.waIconBadge}>
                        <WhatsAppIcon size={20} />
                      </div>
                      <div>
                        <h2 className={styles.waTitle}>Grup WhatsApp</h2>
                        <span className={styles.waSubtitle}>Koordinasi Peserta</span>
                      </div>
                    </div>
                    <p className={styles.waDesc}>
                      Bergabunglah ke grup WhatsApp resmi untuk mendapatkan arahan teknis, tanya jawab, dan info tahapan seleksi selanjutnya.
                    </p>
                    <a
                      ref={whatsAppCardLinkRef}
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.waButton}
                    >
                      <WhatsAppIcon size={17} />
                      <span>Masuk Grup WhatsApp</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  </section>
                )}
              </aside>}

              {/* Main Content Area */}
              <div className={styles.mainColumn}>
              {!workingOnTest && <section className={styles.panel} aria-labelledby="form-section-title">
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
                      {summaryRows.map(({ key, label, value }) => (
                        <div key={key}><dt>{label}</dt><dd>{value}</dd></div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  normalizedOprec && oprecState(normalizedOprec).key === "open" ? (
                    <OprecForm oprec={normalizedOprec} onSuccess={handleRegistrationSuccess} draftScope={user?.id} />
                  ) : <p className={styles.loading}>Formulir pendaftaran belum dibuka atau sudah ditutup.</p>
                )}
              </section>}
              {isSubmitted && <WrittenTestCard oprecId={oprecInfo.id} onSubmitted={load} working={workingOnTest} onWorkingChange={setWorkingOnTest} />}
              </div>
            </div>
          </>
        )}
      </div>
      {whatsAppDialogLink && (
        <div className={styles.waDialogOverlay} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setWhatsAppDialogLink("");
        }}>
          <section ref={whatsAppDialogRef} className={styles.waDialog} role="dialog" aria-modal="true" aria-labelledby="oprec-wa-dialog-title" aria-describedby="oprec-wa-dialog-description">
            <div className={styles.waDialogIcon}><WhatsAppIcon size={26} /></div>
            <span className={styles.waDialogEyebrow}>PENDAFTARAN BERHASIL</span>
            <h2 id="oprec-wa-dialog-title">Data sudah tersimpan. Yuk, gabung grup peserta!</h2>
            <p id="oprec-wa-dialog-description">Masuk ke grup WhatsApp resmi untuk menerima arahan teknis, tanya jawab, dan informasi tahapan seleksi. Tautannya juga tersedia di halaman ini jika kamu ingin bergabung nanti.</p>
            <div className={styles.waDialogActions}>
              <button ref={whatsAppCloseRef} type="button" onClick={() => setWhatsAppDialogLink("")}>Nanti saja</button>
              <a href={whatsAppDialogLink} target="_blank" rel="noopener noreferrer" onClick={() => setWhatsAppDialogLink("")}>
                <WhatsAppIcon size={17} /> Masuk Grup WhatsApp <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export function OprecWorkspace({ oprecId }) {
  return (
    <div className="site-root">
      <Navbar />
      <ProtectedRoute>
        <WorkspaceContent oprecId={oprecId} />
      </ProtectedRoute>
    </div>
  );
}
