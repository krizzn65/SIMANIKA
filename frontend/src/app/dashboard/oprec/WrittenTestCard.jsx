"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, FileText } from "lucide-react";
import { api } from "@/services/api";
import { WrittenTestFields } from "@/components/oprec/WrittenTestFields";
import styles from "./oprec-workspace.module.css";

function formatWib(value) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value)) + " WIB";
}

function countdown(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days} hari ${hours} jam ${minutes} menit ${seconds % 60} detik`;
}

export function WrittenTestCard({ oprecId }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);
  const offset = useRef(0);
  const confirmRef = useRef(null);
  const lastPhase = useRef("");

  const load = useCallback(async (signal) => {
    try {
      const response = await api.get(`/user/oprec/${oprecId}/written-test`, { signal });
      if (signal?.aborted) return;
      const next = response.data?.data || null;
      setTest(next);
      if (next?.server_now) offset.current = Date.parse(next.server_now) - Date.now();
      setError("");
    } catch (cause) {
      if (!signal?.aborted) setError(cause.response?.data?.message || cause.message || "Tes Tulis gagal dimuat.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [oprecId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const now = (tick || Date.now()) + offset.current;
  const start = test ? Date.parse(test.tanggal_buka) : 0;
  const end = test ? Date.parse(test.tanggal_tutup) : 0;
  const phase = !test ? "" : now < start ? "upcoming" : now >= end ? "closed" : "active";

  useEffect(() => {
    if (test && lastPhase.current && lastPhase.current !== phase) load();
    lastPhase.current = phase;
  }, [phase, test, load]);

  async function submit() {
    if (!test || saving) return;
    setSaving(true); setError("");
    try {
      const hasFile = Object.values(answers).some((value) => value instanceof File);
      const payload = hasFile ? new FormData() : { answers };
      if (hasFile) Object.entries(answers).forEach(([id, value]) => { if (value !== null && value !== "") payload.append(`answers[${id}]`, value); });
      await api.post(`/user/oprec/${oprecId}/written-test`, payload);
      confirmRef.current?.close();
      await load();
    } catch (cause) {
      const validation = Object.values(cause.response?.data?.errors || {}).flat()[0];
      setError(validation || cause.response?.data?.message || cause.message || "Jawaban gagal dikirim.");
      confirmRef.current?.close();
    } finally {
      setSaving(false);
    }
  }

  if (loading || !test) return loading ? <section className={styles.panel} role="status">Memuat Tes Tulis…</section> : error ? <section className={styles.panel}><p className={styles.testError} role="alert">{error}</p><button type="button" onClick={() => { setLoading(true); load(); }}>Coba lagi</button></section> : null;

  const submitted = Boolean(test.submission);
  const active = phase === "active" && test.ready && test.active && !submitted;
  const questions = test.questions || [];

  return <section className={styles.panel} aria-labelledby="written-test-title">
    <header className={styles.panelHeader}>
      <h2 id="written-test-title"><FileText size={19} aria-hidden="true" /> Tes Tulis</h2>
      <span className={`${styles.badge} ${submitted ? styles.success : active ? styles.amber : styles.neutral}`}>
        {submitted ? "Terkirim" : active ? "Sedang berlangsung" : phase === "upcoming" ? "Segera dibuka" : "Belum tersedia"}
      </span>
    </header>
    <div className={styles.testSchedule}>
      <div><span>Mulai</span><strong>{formatWib(test.tanggal_buka)}</strong></div>
      <div><span>Selesai</span><strong>{formatWib(test.tanggal_tutup)}</strong></div>
    </div>
    {error && <p className={styles.testError} role="alert">{error}</p>}
    {submitted ? <>
      <div className={styles.notice}><CheckCircle2 size={20} aria-hidden="true" /><div><h3>Jawaban Tes Tulis Terkirim</h3><p>Dikirim pada {formatWib(test.submission.submitted_at)}. Jawaban tidak dapat diubah.</p></div></div>
      <dl className={styles.testReview}>{questions.map((question) => <div key={question.id}><dt>{question.label}</dt><dd>{test.submission.files?.[question.id] ? <a href={test.submission.files[question.id]} target="_blank" rel="noopener noreferrer">Unduh berkas</a> : test.submission.answers?.[question.id] || "Tidak dijawab"}</dd></div>)}</dl>
    </> : phase === "upcoming" ? <>
      <p className={styles.testCountdown}><Clock3 size={17} aria-hidden="true" /> Dibuka dalam {countdown(start - now)}</p>
      {!test.ready && <p className={styles.testNote}>Soal sedang disiapkan oleh admin.</p>}
    </> : !test.ready ? <p className={styles.testNote}>Soal Tes Tulis belum siap. Silakan periksa kembali nanti.</p>
      : phase === "closed" ? <p className={styles.testNote}>Waktu pengerjaan Tes Tulis telah berakhir.</p>
      : active ? <form className={styles.testForm} onSubmit={(event) => {
        event.preventDefault();
        const missing = questions.find((question) => question.required && !String(answers[question.id] || "").trim());
        if (missing) { setError(`Jawab pertanyaan “${missing.label}” terlebih dahulu.`); return; }
        confirmRef.current?.showModal();
      }}>
        <WrittenTestFields
          questions={questions}
          answers={answers}
          onAnswerChange={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))}
        />
        <div className={styles.testActions}><button type="submit" disabled={saving}>Kirim jawaban</button></div>
      </form> : <p className={styles.testNote}>Tes sedang diperbarui. Silakan periksa kembali.</p>}
    <dialog ref={confirmRef} className={styles.testDialog}>
      <h3>Kirim jawaban Tes Tulis?</h3>
      <p>Periksa semua jawabanmu. Setelah dikirim, jawaban tidak dapat diedit.</p>
      <div><button type="button" onClick={() => confirmRef.current?.close()} disabled={saving}>Periksa lagi</button><button type="button" onClick={submit} disabled={saving}>{saving ? "Mengirim…" : "Ya, kirim jawaban"}</button></div>
    </dialog>
  </section>;
}
