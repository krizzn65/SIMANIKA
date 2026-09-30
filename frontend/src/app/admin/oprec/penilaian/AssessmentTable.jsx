"use client";

import { useRef } from "react";
import { AlertCircle, Check, Eye, Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import { getOprecTableFields, getRegistrantFieldValue } from "@/lib/oprecRegistrants";
import { scoreTone, validScore } from "@/lib/oprecAssessment.mjs";
import { CRITERIA, formattedTotal, scoreText } from "./assessmentFormat";

function SaveFeedback({ state, onRetry }) {
  if (!state) return <span className="assessment-save" aria-hidden="true">&nbsp;</span>;
  const Icon = state.kind === "saving" ? Loader2 : state.kind === "error" ? AlertCircle : Check;
  return <span className={`assessment-save assessment-save--${state.kind}`} role="status"><Icon size={12} aria-hidden="true" className={state.kind === "saving" ? "assessment-spin" : ""} />
    <span>{state.message}</span>{state.kind === "error" && state.retry && <button type="button" onClick={onRetry} aria-label="Coba simpan lagi"><RefreshCw size={13} /></button>}</span>;
}

export default function AssessmentTable({ data, loading, error, filtered, selectedId, draft, saveState, onChange, onSave, onCommentChange, onSelect, onDecide, onRetry, onReset, page, onPageChange }) {
  const scroll = useRef(null);
  function goToScores() {
    const viewport = scroll.current;
    const heading = viewport?.querySelector("th[data-section=score]");
    const pinnedWidth = [...(viewport?.querySelectorAll("thead tr:last-child .assessment-pin") || [])].filter((cell) => getComputedStyle(cell).left !== "auto").reduce((sum, cell) => sum + cell.getBoundingClientRect().width, 0);
    if (heading) viewport.scrollTo({ left: viewport.scrollLeft + heading.getBoundingClientRect().left - viewport.getBoundingClientRect().left - pinnedWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  const rows = data?.data || [];
  const fields = getOprecTableFields(data?.form_fields).filter((field) => !/^jabatan_pilihan_[123]$/.test(field.name));
  const headers = ['No.', 'Nama', 'NIM', 'Pilihan 1', 'Pilihan 2', 'Pilihan 3', 'Angkatan', ...fields.map((field) => field.label), 'Tes Tulis', ...CRITERIA.map(([, label]) => label), 'Total', 'Komentar', 'Rata-rata', 'Keputusan'];
  const fieldValue = (row, field) => getRegistrantFieldValue({ ...row, divisiPilihan1: row.choices[0]?.id, divisiPilihan2: row.choices[1]?.id, divisiPilihan3: row.choices[2]?.id }, field, row.choices.map((choice) => ({ id: String(choice.id), nama: choice.division })));
  return <section className="assessment-table-card" aria-labelledby="assessment-table-title" aria-busy={loading}>
    <header className="assessment-table-card__header"><div><h2 id="assessment-table-title">Daftar peserta <span className="assessment-count">{data?.total ?? "—"}</span></h2><p>Geser tabel untuk melihat seluruh data dan aspek penilaian.</p></div>
      <span className="assessment-table-activity" role="status">{loading ? <><Loader2 size={14} className="assessment-spin" /> Memuat…</> : data?.period?.locked ? <><LockKeyhole size={14} /> Terkunci</> : data?.can_review ? "Nilai tersimpan otomatis" : "Mode hanya baca"}</span>
      <div className="assessment-table-navigation"><button type="button" className="assessment-button assessment-button--small" onClick={() => scroll.current?.scrollTo({ left: 0 })}>Data pendaftaran</button><button type="button" className="assessment-button assessment-button--small assessment-button--selected" onClick={goToScores}>Ke kolom nilai →</button></div>
    </header>
    {error && <div className="assessment-inline-error" role="alert"><span>{error}</span><button type="button" onClick={onRetry}>Coba lagi</button></div>}
    <div ref={scroll} className="assessment-table-scroll" tabIndex={0} aria-label="Tabel peserta, dapat digulir horizontal dan vertikal">
      <table className="assessment-table"><thead>
        <tr className="assessment-table__groups"><th colSpan={3} scope="colgroup">Identitas peserta</th><th colSpan={5 + fields.length} scope="colgroup">Pendaftaran & Tes Tulis</th><th colSpan={8} scope="colgroup">{data?.is_reviewer === false ? "Nilai per penilai · skala 0–10" : "Penilaian saya · skala 0–10"}</th><th colSpan={2} scope="colgroup">Hasil bersama</th></tr>
        <tr>{headers.map((head, index) => <th key={`${head}:${index}`} scope="col" data-section={index === 8 + fields.length ? "score" : undefined} className={index < 3 ? `assessment-pin assessment-pin--${index}` : ""}>{head}</th>)}</tr>
      </thead><tbody>
        {!data && loading ? [1, 2, 3, 4].map((n) => <tr key={n}><td colSpan={headers.length}><div className="assessment-skeleton assessment-skeleton--row" /></td></tr>) : rows.map((row, index) => {
          const completed = CRITERIA.filter(([field]) => row.review?.scores?.[field] !== null && row.review?.scores?.[field] !== undefined).length;
          return <tr key={row.id} className={selectedId === row.id ? "assessment-row--selected" : ""}>
            <td className="assessment-pin assessment-pin--0">{(data.current_page - 1) * data.per_page + index + 1}</td>
            <td className="assessment-pin assessment-pin--1"><strong className="assessment-participant-name">{row.name}</strong><span className="assessment-participant-meta">{data.is_reviewer === false ? "Hanya baca" : row.review ? `${completed}/6 aspek terisi` : "Belum dinilai oleh Anda"}</span>{selectedId === row.id && <span className="assessment-selected-label">Jawaban dibuka</span>}</td>
            <td className="assessment-pin assessment-pin--2"><span className="assessment-nim">{row.nim}</span></td>
            {row.choices.map((choice) => <td key={choice.order} className="assessment-choice"><strong>{choice.division || "—"}</strong><span>{choice.applied_position || "Jabatan tidak tercatat"}</span></td>)}
            <td>{row.angkatan || "—"}</td>
            {fields.map((field) => { const value = fieldValue(row, field); return <td key={field.name} className="assessment-answer-cell">{value.downloadUrl ? <a className="assessment-file-link" href={value.downloadUrl} target="_blank" rel="noopener noreferrer">Unduh berkas</a> : <div>{value.text}</div>}</td>; })}
            <td><button type="button" className={`assessment-button assessment-button--small ${selectedId === row.id ? "assessment-button--selected" : ""}`} onClick={(event) => onSelect(row, event.currentTarget)} aria-label={`Lihat jawaban Tes Tulis ${row.name}`} aria-pressed={selectedId === row.id}><Eye size={15} /> Lihat jawaban</button></td>
            {CRITERIA.map(([field, label]) => {
              const key = `${row.registration_id}:${field}`;
              const value = draft[key] ?? scoreText(row.review?.scores?.[field]);
              return <td key={field} className="assessment-score-cell"><input type="text" inputMode="decimal" aria-label={`${label} untuk ${row.name}`} aria-invalid={!validScore(value)}
                value={value} disabled={!data.can_review} className={`assessment-score ${scoreTone(value)} ${!validScore(value) ? "assessment-score--invalid" : ""}`} placeholder="—" onChange={(event) => onChange(row, field, event.target.value)} onBlur={(event) => onSave(row, field, event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
                <SaveFeedback state={saveState[key]} onRetry={() => onSave(row, field, value)} /></td>;
            })}
            <td className="assessment-total"><strong>{formattedTotal(row.review?.total)}</strong><span>/100</span></td>
            <td className="assessment-comment"><textarea aria-label={`Komentar untuk ${row.name}`} rows={2} maxLength={2000} placeholder={data.can_review ? "Catatan penilaian…" : "—"} disabled={!data.can_review} value={draft[`${row.registration_id}:comment`] ?? row.review?.comment ?? ""}
              onChange={(event) => onCommentChange(row, event.target.value)} onBlur={(event) => onSave(row, "comment", event.target.value)} />
              <SaveFeedback state={saveState[`${row.registration_id}:comment`]} onRetry={() => onSave(row, "comment", draft[`${row.registration_id}:comment`] ?? row.review?.comment ?? "")} />
              {!row.reviews_hidden && row.reviews?.length > 0 && <details className="assessment-reviews"><summary>{row.reviews.length} penilai · Lihat rincian</summary>{row.reviews.map((review) => <article key={review.id}><strong>{review.reviewer_name} <span>{formattedTotal(review.total)}</span></strong><dl>{CRITERIA.map(([field, label]) => <div key={field}><dt>{label}</dt><dd>{scoreText(review.scores?.[field]) || "—"}</dd></div>)}</dl><p>{review.comment || "Tanpa komentar"}</p></article>)}</details>}
            </td>
            <td className="assessment-total">{row.reviews_hidden ? <span className="assessment-locked-hint"><LockKeyhole size={14} /> Lengkapi 6 aspek untuk melihat</span> : <><strong>{formattedTotal(row.average)}</strong><span>/100</span></>}</td>
            <td className="assessment-decision"><span className={`assessment-status assessment-status--${row.decision.status}`}>{row.decision.status === "accepted" ? "Diterima" : row.decision.status === "rejected" ? "Ditolak" : "Belum diputuskan"}</span>
              {row.decision.status === "accepted" && <p>{row.decision.division}<span>{row.decision.position || "Jabatan belum ditetapkan"}</span></p>}
              {data.can_decide && <button type="button" className="assessment-button assessment-button--small" onClick={() => onDecide(row)}>{row.decision.status === "pending" ? "Beri keputusan" : "Ubah keputusan"}</button>}
            </td>
          </tr>;
        })}
      </tbody></table>
    </div>
    {!loading && rows.length === 0 && !error && <div className="assessment-state"><h3>{filtered ? "Peserta tidak ditemukan" : "Belum ada peserta untuk dinilai"}</h3><p>{filtered ? "Coba kata pencarian atau filter yang berbeda." : "Peserta muncul setelah mengirim jawaban Tes Tulis."}</p>{filtered && <button type="button" className="assessment-button" onClick={onReset}>Reset pencarian & filter</button>}</div>}
    <footer className="assessment-pagination"><span>{data?.total ? `${(data.current_page - 1) * data.per_page + 1}–${Math.min(data.current_page * data.per_page, data.total)} dari ${data.total} peserta` : "0 peserta"}</span><div><button type="button" className="assessment-button assessment-button--small" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)}>Sebelumnya</button><span>{page} / {data?.last_page || 1}</span><button type="button" className="assessment-button assessment-button--small" disabled={loading || page >= (data?.last_page || 1)} onClick={() => onPageChange(page + 1)}>Berikutnya</button></div></footer>
  </section>;
}
