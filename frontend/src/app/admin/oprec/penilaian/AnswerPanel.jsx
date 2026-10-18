"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ClipboardCheck, Download, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { downloadAuthenticatedFile, downloadErrorMessage } from "@/lib/downloadFile";

export default function AnswerPanel({ selected, detail, loading, error, onRetry, onClose, compact, triggerRef }) {
  const dialog = useRef(null);
  const [downloadingFile, setDownloadingFile] = useState("");
  async function downloadFile(url) {
    if (!url || downloadingFile) return;
    setDownloadingFile(url);
    try { await downloadAuthenticatedFile(url); }
    catch (cause) { toast.error(downloadErrorMessage(cause)); }
    finally { setDownloadingFile(""); }
  }
  useEffect(() => {
    if (!compact || !selected) return;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); triggerRef.current?.focus?.(); };
  }, [compact, selected?.id, triggerRef]);

  const content = <>
    <header className="assessment-answer__header">
      <div><span className="assessment-eyebrow">TES TULIS</span><h2 id={compact ? "answer-dialog-title" : "answer-panel-title"}>{selected?.name || "Jawaban peserta"}</h2>
        <p>{selected ? `NIM ${selected.nim}` : "Pilih “Lihat jawaban” pada peserta untuk mulai membaca."}</p></div>
      {selected && <button type="button" className="assessment-icon-button" aria-label="Tutup jawaban" onClick={onClose}><X size={18} /></button>}
    </header>
    <div className="assessment-answer__body" aria-busy={loading}>
      {loading ? <div role="status" className="assessment-skeleton-list"><span className="sr-only">Memuat jawaban peserta…</span>{[1, 2, 3].map((n) => <div className="assessment-skeleton" key={n} />)}</div>
        : error ? <div className="assessment-state"><p role="alert">{error}</p><button type="button" className="assessment-button" onClick={onRetry}><RefreshCw size={16} /> Coba lagi</button></div>
          : detail ? <><p className="assessment-answer__count">{detail.questions.length} pertanyaan · Jawaban hanya dapat dibaca</p>{detail.questions.map((question, index) => <article key={question.id} className="assessment-answer__question">
            <span className="assessment-question-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{question.label}</h3>
              <p>{detail.answers?.[question.id] ?? "Tidak dijawab"}</p>
              {detail.files?.[question.id] && <button type="button" className="assessment-file-link" disabled={Boolean(downloadingFile)} onClick={() => downloadFile(detail.files[question.id])} aria-label={`Unduh berkas untuk ${question.label}`}>{downloadingFile === detail.files[question.id] ? <Loader2 size={15} className="assessment-spin" aria-hidden="true" /> : <Download size={15} aria-hidden="true" />} {downloadingFile === detail.files[question.id] ? "Mengunduh…" : "Unduh Berkas"}</button>}
            </div></article>)}</>
            : <div className="assessment-state assessment-state--quiet"><ClipboardCheck size={30} aria-hidden="true" /><h3>Baca, lalu beri penilaian</h3><p>Jawaban peserta akan tampil di sini. Pilihan peserta aktif ditandai pada tabel.</p></div>}
    </div>
    {compact && <footer className="assessment-dialog__footer"><button type="button" className="assessment-button" onClick={onClose}><ArrowLeft size={16} /> Kembali ke tabel</button></footer>}
  </>;
  if (compact) return selected ? <dialog ref={dialog} aria-labelledby="answer-dialog-title" className="assessment-dialog assessment-answer-dialog" onClose={(event) => { if (!event.currentTarget.open) onClose(); }}>{content}</dialog> : null;
  return <aside className="assessment-answer" aria-labelledby="answer-panel-title">{content}</aside>;
}
