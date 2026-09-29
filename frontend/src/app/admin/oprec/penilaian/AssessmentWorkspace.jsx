"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardCheck, Eye, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { api } from "@/services/api";
import { scoreTone, validScore } from "@/lib/oprecAssessment.mjs";
import AssignmentDialog from "./AssignmentDialog";
import { getOprecTableFields, getRegistrantFieldValue } from "@/lib/oprecRegistrants";

const CRITERIA = [
  ["pemahaman", "Pemahaman"], ["kepribadian", "Kepribadian"],
  ["public_speaking", "Public Speaking"], ["kejujuran", "Kejujuran"],
  ["problem_solving", "Problem Solving"], ["kerja_sama", "Kerja Sama"],
];
const numberFormat = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const scoreText = (value) => value === null || value === undefined ? "" : String(value).replace(".", ",");
const formattedTotal = (value) => value === null || value === undefined ? "—" : numberFormat.format(value);
const errorMessage = (error, fallback) => Object.values(error.response?.data?.errors || {}).flat()[0] || error.response?.data?.message || error.message || fallback;

function ScoreInput({ row, criterion, value, onChange, onSave, disabled, state }) {
  const label = `${criterion[1]} untuk ${row.name}`;
  return <div className="space-y-1">
    <input aria-label={label} inputMode="decimal" type="text" value={value}
      onChange={(event) => onChange(event.target.value)} onBlur={() => onSave(value)}
      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
      disabled={disabled} className={`h-10 w-[78px] border px-2 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${scoreTone(value)}`} />
    {state && <span className="block text-[11px] text-slate-600" role="status">{state}</span>}
  </div>;
}

function DecisionDialog({ row, onClose, onSubmit, saving, error }) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [division, setDivision] = useState("");
  const [position, setPosition] = useState("");
  useEffect(() => {
    trigger.current = document.activeElement;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); trigger.current?.focus?.(); };
  }, []);
  const chosen = row.choices.find((choice) => String(choice.id) === division);
  return <dialog ref={dialog} onClose={onClose} className="m-auto w-[min(94vw,680px)] max-h-[90vh] overflow-y-auto border border-slate-300 bg-white p-0 shadow-2xl backdrop:bg-slate-950/60">
    <div className="flex items-start justify-between border-b border-slate-200 p-5">
      <div><p className="font-mono text-xs font-semibold uppercase tracking-wide text-blue-600">Keputusan akhir</p><h2 className="mt-1 text-xl font-semibold">{row.name}</h2><p className="text-sm text-slate-600">{row.nim}</p></div>
      <button type="button" aria-label="Tutup keputusan" onClick={onClose} className="border border-slate-200 p-2 focus-visible:outline-blue-600"><X size={20} /></button>
    </div>
    <div className="space-y-5 p-5">
      <div><p className="mb-2 text-sm font-semibold">Pilih divisi penerimaan</p><div className="grid gap-2 sm:grid-cols-3">
        {row.choices.map((choice) => <button key={choice.order} type="button" onClick={() => { setDivision(String(choice.id)); setPosition(""); }}
          aria-pressed={division === String(choice.id)} className={`min-h-20 border p-3 text-left focus-visible:outline-blue-600 ${division === String(choice.id) ? "border-blue-600 bg-blue-50" : "border-slate-300"}`}>
          <span className="font-mono text-xs text-blue-600">PILIHAN {choice.order}</span><strong className="mt-1 block text-sm">{choice.division || "—"}</strong>
          <span className="block text-xs text-slate-600">Dilamar: {choice.applied_position || "—"}</span>
        </button>)}
      </div></div>
      <label className="block text-sm font-semibold">Jabatan penerimaan
        <select value={position} onChange={(event) => setPosition(event.target.value)} disabled={!chosen} className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 font-normal disabled:bg-slate-100">
          <option value="">Pilih jabatan</option>{chosen?.positions.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
        <button type="button" onClick={onClose} className="min-h-11 border border-slate-300 px-4">Batal</button>
        <button type="button" disabled={saving} onClick={() => onSubmit({ status: "rejected" })} className="min-h-11 border border-red-300 bg-red-50 px-4 text-red-800 disabled:opacity-50">Tolak peserta</button>
        <button type="button" disabled={!chosen || !position || saving} onClick={() => onSubmit({ status: "accepted", accepted_division_id: chosen.id, accepted_position: position })}
          className="min-h-11 bg-blue-600 px-4 text-white disabled:cursor-not-allowed disabled:opacity-50">Terima peserta</button>
      </div>
    </div>
  </dialog>;
}

export default function AssessmentWorkspace() {
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [periodLoading, setPeriodLoading] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState({});
  const [saveState, setSaveState] = useState({});
  const [dialogRow, setDialogRow] = useState(null);
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const [assignments, setAssignments] = useState(null);
  const [assignError, setAssignError] = useState("");
  const queue = useRef(new Map());
  const commentTimers = useRef(new Map());
  const dataRequest = useRef(0);
  const activePeriod = useRef("");

  const loadPeriods = useCallback(async () => {
    setPeriodLoading(true);
    try {
      const result = await api.get("/admin/oprec/assessments");
      const list = result.data?.data || [];
      setPeriods(list);
      setPeriodId((current) => { const next = list.some((item) => String(item.id) === current) ? current : String(list[0]?.id || ""); activePeriod.current = next; return next; });
      setError("");
    } catch (cause) { setError(errorMessage(cause, "Periode gagal dimuat.")); }
    finally { setPeriodLoading(false); }
  }, []);
  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const loadData = useCallback(async () => {
    if (!periodId || activePeriod.current !== periodId) { setData(null); return; }
    const token = ++dataRequest.current;
    setLoading(true);
    try {
      const result = await api.get(`/admin/oprec/${periodId}/assessment`, { params: { page, search: search.trim() } });
      if (token !== dataRequest.current || activePeriod.current !== periodId) return;
      setData(result.data); setError("");
    } catch (cause) {
      if (token !== dataRequest.current || activePeriod.current !== periodId) return;
      setData(null); setError(errorMessage(cause, "Penilaian gagal dimuat."));
    } finally { if (token === dataRequest.current) setLoading(false); }
  }, [periodId, page, search]);
  useEffect(() => {
    const timer = setTimeout(loadData, search ? 250 : 0);
    return () => { clearTimeout(timer); dataRequest.current += 1; };
  }, [loadData]);

  useEffect(() => {
    if (!selected || !periodId) { setDetail(null); return; }
    const controller = new AbortController();
    setDetail(null); setDetailLoading(true); setDetailError("");
    api.get(`/admin/oprec/${periodId}/assessment/${selected.id}`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setDetail(result.data?.data); })
      .catch((cause) => { if (!controller.signal.aborted) setDetailError(errorMessage(cause, "Jawaban gagal dimuat.")); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selected, periodId]);
  useEffect(() => { setPage(1); setSelected(null); setAssignments(null); setDraft({}); }, [periodId]);
  useEffect(() => () => { commentTimers.current.forEach(clearTimeout); }, []);

  async function loadAssignments() {
    try { const result = await api.get(`/admin/oprec/${periodId}/assessment/assignments`); setAssignments(result.data.data); setAssignError(""); }
    catch (cause) { setAssignError(errorMessage(cause, "Penugasan gagal dimuat.")); }
  }
  async function toggleAssignment(reviewerId, assigned) {
    setAssignError("");
    try {
      const url = `/admin/oprec/${periodId}/assessment/assignments/${reviewerId}`;
      if (assigned) await api.delete(url); else await api.put(url);
      await loadAssignments();
    } catch (cause) { setAssignError(errorMessage(cause, "Penugasan gagal disimpan.")); }
  }

  function updateDraft(row, field, value) { setDraft((current) => ({ ...current, [`${row.registration_id}:${field}`]: value })); }
  function saveReview(row, field, raw) {
    const key = `${row.registration_id}:${field}`;
    const original = field === "comment" ? row.review?.comment || "" : scoreText(row.review?.scores?.[field]);
    if (raw === original) return;
    if (field !== "comment" && !validScore(raw)) {
      setSaveState((current) => ({ ...current, [key]: "Nilai 0–10, maksimal satu desimal" })); return;
    }
    setSaveState((current) => ({ ...current, [key]: "Menyimpan…" }));
    const previous = queue.current.get(row.registration_id) || Promise.resolve();
    const pending = previous.catch(() => {}).then(async () => {
      const result = await api.patch(`/admin/oprec/${periodId}/assessment/registrations/${row.registration_id}/review`, { field, value: raw === "" ? null : raw });
      if (activePeriod.current !== periodId) return;
      setData((current) => current && ({ ...current, data: current.data.map((item) => item.id === row.id ? { ...item, review: result.data.data } : item) }));
      setDraft((current) => { const next = { ...current }; if (next[key] === raw) delete next[key]; return next; });
      setSaveState((current) => ({ ...current, [key]: "Tersimpan" }));
      if (result.data.data?.total !== null && activePeriod.current === periodId) await loadData();
    }).catch((cause) => setSaveState((current) => ({ ...current, [key]: errorMessage(cause, "Gagal menyimpan") })));
    queue.current.set(row.registration_id, pending);
  }
  function onCommentChange(row, value) {
    updateDraft(row, "comment", value);
    const key = row.registration_id;
    clearTimeout(commentTimers.current.get(key));
    commentTimers.current.set(key, setTimeout(() => saveReview(row, "comment", value), 650));
  }
  async function decide(payload) {
    setDecisionSaving(true); setDecisionError("");
    try {
      await api.put(`/admin/oprec/${periodId}/assessment/registrations/${dialogRow.registration_id}/decision`, payload);
      setDialogRow(null); await loadData();
    } catch (cause) { setDecisionError(errorMessage(cause, "Keputusan gagal disimpan.")); }
    finally { setDecisionSaving(false); }
  }

  const rows = data?.data || [];
  const fields = getOprecTableFields(data?.form_fields).filter((field) => !/^jabatan_pilihan_[123]$/.test(field.name));
  const fieldValue = (row, field) => getRegistrantFieldValue({ ...row, divisiPilihan1: row.choices[0]?.id,
    divisiPilihan2: row.choices[1]?.id, divisiPilihan3: row.choices[2]?.id }, field,
  row.choices.map((choice) => ({ id: String(choice.id), nama: choice.division })));
  return <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="font-mono text-xs font-semibold uppercase tracking-wide text-blue-600">OPREC · PENILAIAN</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Penilaian OPREC</h1>
        <p className="mt-1 text-sm text-slate-600">Nilai dan keputusan peserta yang telah mengirim Tes Tulis.</p></div>
      <button type="button" onClick={() => { loadPeriods(); loadData(); }} className="flex min-h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm"><RefreshCw size={16} /> Perbarui</button>
    </header>
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm font-semibold">Periode OPREC
        <select value={periodId} onChange={(event) => { activePeriod.current = event.target.value; setPeriodId(event.target.value); }} className="mt-1 block h-11 min-w-48 border border-slate-300 bg-white px-3 font-normal">
          {periods.map((item) => <option key={item.id} value={item.id}>{item.periode}</option>)}
        </select></label>
      <label className="text-sm font-semibold">Cari peserta
        <span className="mt-1 flex h-11 items-center gap-2 border border-slate-300 bg-white px-3"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nama atau NIM" className="min-w-40 outline-none font-normal" /></span>
      </label>
      {data?.can_decide && <button type="button" onClick={loadAssignments} className="min-h-11 border border-blue-300 bg-blue-50 px-4 text-sm text-blue-700"><ShieldCheck size={16} className="mr-2 inline" />Tugaskan penilai</button>}
    </div>
    {error && <div role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    {periodLoading ? <p role="status" className="border border-slate-200 bg-white p-6">Memuat periode…</p>
      : periods.length === 0 ? <p className="border border-slate-200 bg-white p-6">Belum ada periode Tes Tulis yang dapat dinilai.</p>
      : <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,.8fr)]">
        <section aria-label="Tabel penilaian" className="min-w-0 border border-slate-200 bg-white">
          <div className="flex justify-between gap-3 border-b border-slate-200 p-4"><div><h2 className="font-semibold">Daftar peserta</h2><p className="text-sm text-slate-600">{data?.total ?? 0} kiriman Tes Tulis</p></div>{data?.period?.locked && <span className="self-start border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">Penilaian terkunci</span>}</div>
          {loading ? <p role="status" className="p-6 text-sm text-slate-600">Memuat peserta…</p> : <div className="max-w-full overflow-x-auto">
            <table className="min-w-max border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>
              {['No.', 'Nama', 'NIM', 'Pilihan 1', 'Pilihan 2', 'Pilihan 3', 'Angkatan', ...fields.map((field) => field.label), 'Tes Tulis', ...CRITERIA.map(([, label]) => label), 'Total', 'Komentar', 'Rata-rata', 'Keputusan'].map((head, index) => <th key={`${head}:${index}`} scope="col" className="whitespace-nowrap border-b border-slate-200 px-3 py-3">{head}</th>)}
            </tr></thead><tbody>{rows.map((row, index) => <tr key={row.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
              <td className="px-3 py-3 font-mono text-xs">{(data.current_page - 1) * data.per_page + index + 1}</td>
              <td className="min-w-40 px-3 py-3 font-semibold">{row.name}</td><td className="px-3 py-3 font-mono">{row.nim}</td>
              {row.choices.map((choice) => <td key={choice.order} className="min-w-40 px-3 py-3"><strong className="block">{choice.division || "—"}</strong><span className="text-xs text-slate-600">{choice.applied_position || "Jabatan tidak tercatat"}</span></td>)}
              <td className="px-3 py-3">{row.angkatan || "—"}</td>
              {fields.map((field) => { const value = fieldValue(row, field); return <td key={field.name} className="min-w-32 max-w-64 px-3 py-3 break-words">{value.downloadUrl ? <a href={value.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Unduh berkas</a> : value.text}</td>; })}
              <td className="px-3 py-3"><button type="button" onClick={() => setSelected({ id: row.id, name: row.name })} aria-label={`Lihat jawaban Tes Tulis ${row.name}`} className="flex min-h-10 items-center gap-1 border border-blue-300 px-3 text-blue-700"><Eye size={15} /> Lihat</button></td>
              {CRITERIA.map((criterion) => { const key = `${row.registration_id}:${criterion[0]}`; const value = draft[key] ?? scoreText(row.review?.scores?.[criterion[0]]); return <td key={criterion[0]} className="px-3 py-3"><ScoreInput row={row} criterion={criterion} value={value} onChange={(next) => updateDraft(row, criterion[0], next)} onSave={(next) => saveReview(row, criterion[0], next)} disabled={!data.can_review} state={saveState[key]} /></td>; })}
              <td className="px-3 py-3 font-semibold tabular-nums">{formattedTotal(row.review?.total)}</td>
              <td className="px-3 py-3"><textarea aria-label={`Komentar untuk ${row.name}`} rows={2} maxLength={2000} disabled={!data.can_review} value={draft[`${row.registration_id}:comment`] ?? row.review?.comment ?? ""}
                onChange={(event) => onCommentChange(row, event.target.value)} onBlur={(event) => { clearTimeout(commentTimers.current.get(row.registration_id)); saveReview(row, "comment", event.target.value); }} className="w-48 border border-slate-300 p-2 text-sm disabled:bg-slate-50" />
                <span className="block text-xs text-slate-600" role="status">{saveState[`${row.registration_id}:comment`]}</span>
                {!row.reviews_hidden && row.reviews?.length > 0 && <details className="mt-1"><summary className="cursor-pointer text-xs text-blue-700">{row.reviews.length} penilai</summary><div className="mt-1 max-h-48 overflow-y-auto text-xs">{row.reviews.map((review) => <p key={review.id} className="border-t py-1"><strong>{review.reviewer_name}: {formattedTotal(review.total)}</strong><br />{CRITERIA.map(([field, label]) => `${label}: ${review.scores?.[field] === null || review.scores?.[field] === undefined ? "—" : scoreText(review.scores[field])}`).join(" · ")}<br />{review.comment || "Tanpa komentar"}</p>)}</div></details>}
              </td>
              <td className="px-3 py-3 font-semibold tabular-nums">{row.reviews_hidden ? "Terkunci" : formattedTotal(row.average)}</td>
              <td className="min-w-44 px-3 py-3"><span className="block font-semibold">{row.decision.status === "accepted" ? "Diterima" : row.decision.status === "rejected" ? "Ditolak" : "Belum diputuskan"}</span>
                {row.decision.status === "accepted" && <span className="block text-xs text-slate-600">{row.decision.division} · {row.decision.position || "Jabatan belum ditetapkan"}</span>}
                {data.can_decide && <button type="button" onClick={() => { setDialogRow(row); setDecisionError(""); }} className="mt-2 min-h-9 border border-blue-300 px-3 text-xs text-blue-700">{row.decision.status === "pending" ? "Putuskan" : "Ubah keputusan"}</button>}
              </td>
            </tr>)}</tbody></table>
            {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-600">Belum ada peserta yang mengirim Tes Tulis.</p>}
          </div>}
          {(data?.last_page || 1) > 1 && <div className="flex items-center justify-end gap-3 border-t p-3 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="border px-3 py-2 disabled:opacity-40">Sebelumnya</button><span>{page} / {data.last_page}</span><button disabled={page >= data.last_page} onClick={() => setPage(page + 1)} className="border px-3 py-2 disabled:opacity-40">Berikutnya</button></div>}
        </section>
        <aside aria-label="Jawaban Tes Tulis peserta" className="min-w-0 self-start border border-slate-200 bg-white xl:sticky xl:top-20">
          <div className="border-b border-slate-200 p-4"><h2 className="font-semibold">Jawaban Tes Tulis</h2><p className="text-sm text-slate-600">{selected?.name || "Pilih peserta dari tabel untuk melihat jawabannya."}</p></div>
          <div className="max-h-[72vh] space-y-3 overflow-y-auto p-4">{detailLoading ? <p role="status">Memuat jawaban…</p> : detailError ? <p role="alert" className="text-red-700">{detailError}</p> : detail ? detail.questions.map((question, index) => <div key={question.id} className="border border-slate-200 p-3"><h3 className="text-sm font-semibold">{index + 1}. {question.label}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{detail.answers?.[question.id] || "Tidak dijawab"}</p>{detail.files?.[question.id] && <a href={detail.files[question.id]} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-700 underline">Unduh berkas</a>}</div>) : <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-slate-500"><ClipboardCheck size={25} /><p>Belum ada jawaban yang dipilih.</p></div>}</div>
        </aside>
      </div>}
    {assignments && <AssignmentDialog assignments={assignments} error={assignError} onClose={() => setAssignments(null)} onToggle={toggleAssignment} />}
    {dialogRow && <DecisionDialog row={dialogRow} onClose={() => setDialogRow(null)} onSubmit={decide} saving={decisionSaving} error={decisionError} />}
  </div>;
}
