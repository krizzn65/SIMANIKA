"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Clock3, FileText, RefreshCw, UsersRound } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { eventCategoryLabel } from "@/lib/events";
import { TeamAccessPanel } from "./TeamAccessPanel";
import styles from "./workspace.module.css";

const reviewLabels = { pending: "Menunggu verifikasi", accepted: "Diterima", rejected: "Belum diterima" };

function WorkspaceContent({ eventId }) {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const requestRef = useRef(null);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setRefreshing(true);
    try {
      const response = await api.get(`/user/events/${eventId}/workspace`, { signal: controller.signal });
      if (!response.data?.data?.event) throw new Error("Data pendaftaran belum dapat dimuat.");
      setData(response.data.data);
      setError("");
    } catch (err) {
      if (!controller.signal.aborted) {
        if ([403, 404].includes(err.response?.status)) setData(null);
        setError(err.response?.status === 404 ? "Pendaftaran tidak ditemukan atau kamu tidak lagi tergabung dalam tim ini." : err.message);
      }
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, [eventId]);

  useEffect(() => {
    if (user?.role === "admin") { router.replace("/admin"); return; }
    if (!user) return;
    load();
    return () => requestRef.current?.abort();
  }, [load, user?.id, user?.role, router]);

  if (user?.role === "admin") return null;

  return <main className={styles.workspace}>
    <div className={styles.container}>
      <nav className={styles.toolbar} aria-label="Navigasi pendaftaran">
        <Link className={styles.button} href="/dashboard"><ArrowLeft size={16} aria-hidden="true" /> Dashboard</Link>
        <button className={styles.button} type="button" onClick={load} disabled={refreshing}><RefreshCw size={15} aria-hidden="true" className={refreshing ? styles.spinning : ""} /> Perbarui</button>
      </nav>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {loading ? <div className={styles.loading} role="status">Memuat detail pendaftaran…</div> : data && <>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>{eventCategoryLabel(data.event.kategori)}</p>
          <h1>{data.event.judul}</h1>
          <Link href={`/events/${data.event.slug}`}>Informasi event <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </header>
        <div className={styles.columns}>
          <aside className={styles.sidebar} aria-label="Informasi pendaftaran">
            {data.team ? <TeamAccessPanel team={data.team} eventId={data.event.id} paymentStatus={data.paymentStatus} htm={data.htm} onRefresh={load} /> :
              <section className={styles.panel}>
                <h2><UsersRound size={18} aria-hidden="true" /> Pendaftaranmu</h2>
                <p>{user?.namaLengkap || user?.name || "Peserta"}</p>
                <div className={styles.payment}><span>Administrasi</span><PaymentStatus status={data.paymentStatus} /></div>
              </section>}
          </aside>
          <section className={styles.panel} aria-labelledby="registration-title">
            <header className={styles.panelHeader}>
              <h2 id="registration-title"><FileText size={19} aria-hidden="true" /> Data & administrasi</h2>
              <span className={`${styles.badge} ${data.form.reviewStatus === "accepted" ? styles.success : styles.neutral}`}>
                {data.form.submitted ? (reviewLabels[data.form.reviewStatus] || "Terkirim") : "Belum dikirim"}
              </span>
            </header>
            {data.team?.membershipStatus === "pending" ? <div className={styles.notice}><Clock3 size={20} aria-hidden="true" /><div><h3>Menunggu persetujuan ketua</h3><p>Permintaan bergabung sudah terkirim. Informasi anggota dan formulir tersedia setelah ketua menyetujuinya.</p></div></div> :
              data.form.submitted ? <>
                <p className={styles.description}><Check size={16} aria-hidden="true" /> Formulir sudah tersimpan{data.team ? " untuk tim ini" : ""}.</p>
                {data.form.note && <p className={styles.notice}>Catatan penyelenggara: {data.form.note}</p>}
                <dl className={styles.answers}>{data.form.answers.map((answer) => <div key={answer.name}>
                  <dt>{answer.label}</dt>
                  <dd>{answer.type === "file" ? (answer.downloadUrl ? <a href={answer.downloadUrl} target="_blank" rel="noopener noreferrer">Lihat berkas <ArrowUpRight size={14} aria-hidden="true" /></a> : "—") : answer.type === "checkbox" ? (answer.value ? "Ya" : "Tidak") : String(answer.value ?? "—")}</dd>
                </div>)}</dl>
              </> : data.form.canSubmit ? <EventRegistrationForm event={data.event} onSuccess={load} compact /> :
                <div className={styles.notice}><FileText size={20} aria-hidden="true" /><div><h3>Formulir pendaftaran</h3><p>{data.form.lockReason || (data.team ? "Ketua tim mengisi dan mengirim satu formulir untuk seluruh tim. Jawaban akan tampil di sini setelah dikirim." : data.event.tipePendaftaran === "tim" ? "Buat atau gabung tim melalui halaman event untuk melanjutkan." : "Penyelenggara belum menyiapkan formulir.")}</p>{!data.team && data.event.tipePendaftaran === "tim" && <Link href={`/events/${data.event.slug}`}>Buka event <ArrowUpRight size={14} aria-hidden="true" /></Link>}</div></div>}
          </section>
        </div>
      </>}
    </div>
  </main>;
}

export function PaymentStatus({ status }) {
  return <strong className={status === "paid" ? styles.paid : status === "unpaid" ? styles.unpaid : styles.free}>{status === "paid" ? "Paid" : status === "unpaid" ? "Unpaid" : "Free"}</strong>;
}

export default function EventWorkspace({ eventId }) {
  return <div className="site-root"><Navbar /><ProtectedRoute><WorkspaceContent eventId={eventId} /></ProtectedRoute></div>;
}
