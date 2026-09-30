"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LockKeyhole, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import { validScore } from "@/lib/oprecAssessment.mjs";
import { errorMessage, scoreText } from "./assessmentFormat";
import AssignmentDialog from "./AssignmentDialog";
import AssessmentTable from "./AssessmentTable";
import AnswerPanel from "./AnswerPanel";
import ScoreGuide from "./ScoreGuide";
import DecisionDialog from "./DecisionDialog";
import "./assessment.css";

export default function AssessmentWorkspace() {
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodError, setPeriodError] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailReload, setDetailReload] = useState(0);
  const [compact, setCompact] = useState(false);
  const [draft, setDraft] = useState({});
  const [saveState, setSaveState] = useState({});
  const [dialogRow, setDialogRow] = useState(null);
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const queue = useRef(new Map());
  const scheduled = useRef(new Map());
  const saveSequence = useRef(0);
  const draftValues = useRef({});
  const commentTimers = useRef(new Map());
  const dataRequest = useRef(0);
  const periodRequest = useRef(0);
  const activePeriod = useRef("");
  const answerTrigger = useRef(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const media = window.matchMedia("(max-width: 1279px)");
    const update = () => setCompact(media.matches);
    update(); media.addEventListener("change", update);
    return () => { alive.current = false; media.removeEventListener("change", update); commentTimers.current.forEach(clearTimeout); dataRequest.current += 1; periodRequest.current += 1; };
  }, []);

  const loadPeriods = useCallback(async () => {
    const token = ++periodRequest.current;
    setPeriodLoading(true);
    try {
      const result = await api.get("/admin/oprec/assessments");
      if (!alive.current || token !== periodRequest.current) return;
      const list = result.data?.data || [];
      setPeriods(list); setPeriodError("");
      const next = list.some((item) => String(item.id) === activePeriod.current) ? activePeriod.current : String(list[0]?.id || "");
      if (next !== activePeriod.current) { activePeriod.current = next; setPeriodId(next); setData(null); setSelected(null); setPage(1); }
    } catch (cause) { if (alive.current && token === periodRequest.current) setPeriodError(errorMessage(cause, "Periode gagal dimuat.")); }
    finally { if (alive.current && token === periodRequest.current) setPeriodLoading(false); }
  }, []);
  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const loadData = useCallback(async () => {
    if (!periodId || activePeriod.current !== periodId) return;
    const token = ++dataRequest.current;
    setLoading(true); setError("");
    try {
      const result = await api.get(`/admin/oprec/${periodId}/assessment`, { params: { page, search: search.trim(), review: reviewFilter, decision: decisionFilter } });
      if (!alive.current || token !== dataRequest.current || activePeriod.current !== periodId) return;
      if (page > result.data.last_page) { setPage(Math.max(1, result.data.last_page)); return; }
      setData(result.data);
      setSelected((current) => current && result.data.data.some((row) => row.id === current.id) ? current : null);
    } catch (cause) {
      if (!alive.current || token !== dataRequest.current || activePeriod.current !== periodId) return;
      if ([401, 403, 404].includes(cause.response?.status)) { setData(null); setSelected(null); }
      setError(errorMessage(cause, "Peserta gagal dimuat. Isian yang belum tersimpan tetap tersedia."));
    } finally { if (alive.current && token === dataRequest.current) setLoading(false); }
  }, [periodId, page, search, reviewFilter, decisionFilter]);
  useEffect(() => {
    const timer = setTimeout(loadData, search ? 250 : 0);
    return () => { clearTimeout(timer); dataRequest.current += 1; };
  }, [loadData]);

  useEffect(() => {
    if (!selected || !periodId) { setDetail(null); setDetailError(""); setDetailLoading(false); return; }
    const controller = new AbortController();
    setDetail(null); setDetailLoading(true); setDetailError("");
    api.get(`/admin/oprec/${periodId}/assessment/${selected.id}`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setDetail(result.data.data); })
      .catch((cause) => { if (!controller.signal.aborted) setDetailError(errorMessage(cause, "Jawaban gagal dimuat.")); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selected?.id, periodId, detailReload]);

  function updateDraft(row, field, value) {
    const key = `${row.registration_id}:${field}`;
    draftValues.current[key] = value;
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveState((current) => ({ ...current, [key]: field !== "comment" && !validScore(value) ? { kind: "error", message: "0–10, maks. 1 desimal" } : undefined }));
  }
  function saveReview(row, field, raw) {
    if (field === "comment") { clearTimeout(commentTimers.current.get(row.registration_id)); commentTimers.current.delete(row.registration_id); }
    const key = `${row.registration_id}:${field}`;
    if (field !== "comment" && !validScore(raw)) {
      setSaveState((current) => ({ ...current, [key]: { kind: "error", message: "0–10, maks. 1 desimal" } })); return;
    }
    const existing = scheduled.current.get(key);
    const original = field === "comment" ? row.review?.comment || "" : scoreText(row.review?.scores?.[field]);
    if (existing?.raw === raw || (!existing && raw === original)) return;
    const version = ++saveSequence.current;
    scheduled.current.set(key, { raw, version });
    setSaveState((current) => ({ ...current, [key]: { kind: "saving", message: "Menyimpan…" } }));
    const previous = queue.current.get(row.registration_id) || Promise.resolve();
    const pending = previous.catch(() => {}).then(async () => {
      const result = await api.patch(`/admin/oprec/${periodId}/assessment/registrations/${row.registration_id}/review`, { field, value: raw === "" ? null : raw });
      if (!alive.current) return;
      if (activePeriod.current === periodId) setData((current) => current && ({ ...current, data: current.data.map((item) => item.id === row.id ? { ...item, review: result.data.data, ...result.data.summary } : item) }));
      if (scheduled.current.get(key)?.version !== version) return;
      if (draftValues.current[key] === raw) {
        delete draftValues.current[key];
        setDraft((current) => { const next = { ...current }; delete next[key]; return next; });
        setSaveState((current) => ({ ...current, [key]: { kind: "saved", message: "Tersimpan" } }));
      }
    }).catch((cause) => {
      if (alive.current && scheduled.current.get(key)?.version === version) setSaveState((current) => ({ ...current, [key]: { kind: "error", message: errorMessage(cause, "Gagal menyimpan"), retry: true } }));
    }).finally(() => { if (scheduled.current.get(key)?.version === version) scheduled.current.delete(key); if (queue.current.get(row.registration_id) === pending) queue.current.delete(row.registration_id); });
    queue.current.set(row.registration_id, pending);
  }
  function onCommentChange(row, value) {
    updateDraft(row, "comment", value);
    clearTimeout(commentTimers.current.get(row.registration_id));
    commentTimers.current.set(row.registration_id, setTimeout(() => saveReview(row, "comment", value), 650));
  }
  async function decide(payload) {
    if (decisionSaving) return;
    setDecisionSaving(true); setDecisionError("");
    try {
      await api.put(`/admin/oprec/${periodId}/assessment/registrations/${dialogRow.registration_id}/decision`, payload);
      setDialogRow(null); await loadData();
    } catch (cause) { setDecisionError(errorMessage(cause, "Keputusan gagal disimpan.")); }
    finally { setDecisionSaving(false); }
  }
  function resetFilters() { setSearch(""); setReviewFilter("all"); setDecisionFilter("all"); setPage(1); setSelected(null); }
  function changeFilter(setter, value) { setter(value); setPage(1); setSelected(null); }
  const filtered = Boolean(search.trim() || reviewFilter !== "all" || decisionFilter !== "all");
  const periodName = periods.find((period) => String(period.id) === periodId)?.periode || "";
  return <div className="assessment-workspace">
    <header className="assessment-page-header"><div><h1>Penilaian OPREC</h1><p>Baca jawaban, beri nilai, dan tentukan hasil seleksi peserta.</p></div><div className="assessment-page-actions">
      {data?.can_decide && <button type="button" className="assessment-button assessment-button--primary" onClick={() => setAssignOpen(true)}><ShieldCheck size={16} /> Tugaskan penilai</button>}
      <button type="button" className="assessment-button" disabled={periodLoading || loading} onClick={() => { loadPeriods(); loadData(); }}><RefreshCw size={16} className={periodLoading || loading ? "assessment-spin" : ""} /> Perbarui</button>
    </div></header>
    <ScoreGuide />
    <div className="assessment-toolbar">
      <label className="assessment-field">Periode OPREC<select value={periodId} disabled={periodLoading || periods.length === 0} onChange={(event) => { dataRequest.current += 1; activePeriod.current = event.target.value; setPeriodId(event.target.value); setData(null); setSelected(null); setAssignOpen(false); setDialogRow(null); setPage(1); setReviewFilter("all"); setError(""); }}>
        {!periods.length && <option value="">{periodLoading ? "Memuat periode…" : "Belum tersedia"}</option>}{periods.map((period) => <option key={period.id} value={period.id}>{period.periode}</option>)}</select></label>
      <label className="assessment-field assessment-field--search">Cari peserta<span className="assessment-search"><Search size={16} aria-hidden="true" /><input type="search" value={search} maxLength={100} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Nama atau NIM" /></span></label>
      {data?.is_reviewer && <label className="assessment-field">Penilaian saya<select value={reviewFilter} onChange={(event) => changeFilter(setReviewFilter, event.target.value)}><option value="all">Semua penilaian</option><option value="incomplete">Belum lengkap</option><option value="complete">Sudah lengkap</option></select></label>}
      <label className="assessment-field">Keputusan<select value={decisionFilter} onChange={(event) => changeFilter(setDecisionFilter, event.target.value)}><option value="all">Semua keputusan</option><option value="pending">Belum diputuskan</option><option value="accepted">Diterima</option><option value="rejected">Ditolak</option></select></label>
      {filtered && <button type="button" className="assessment-reset" onClick={resetFilters}>Reset filter</button>}
    </div>
    {periodError && <div role="alert" className="assessment-inline-error"><span>{periodError}</span><button type="button" onClick={loadPeriods}>Coba lagi</button></div>}
    {data?.period?.locked && <div className="assessment-lock-notice"><LockKeyhole size={17} /><span>Pengumuman sudah dipublikasikan. Nilai, komentar, dan keputusan hanya dapat dibaca.</span></div>}
    {!periodLoading && !periodError && !periods.length ? <div className="assessment-empty-period"><ShieldCheck size={28} /><h2>Belum ada periode penilaian</h2><p>Periode Tes Tulis yang dapat Anda akses akan muncul di sini.</p></div> : <div className="assessment-columns">
      <AssessmentTable data={data} loading={loading || periodLoading} error={error} filtered={filtered} selectedId={selected?.id} draft={draft} saveState={saveState} onChange={updateDraft} onSave={saveReview} onCommentChange={onCommentChange} onSelect={(row, trigger) => { answerTrigger.current = trigger; setSelected({ id: row.id, name: row.name, nim: row.nim }); }} onDecide={(row) => { setDialogRow(row); setDecisionError(""); }} onRetry={loadData} onReset={resetFilters} page={page} onPageChange={(next) => { setPage(next); setSelected(null); }} />
      <AnswerPanel selected={selected} detail={detail} loading={detailLoading} error={detailError} onRetry={() => setDetailReload((n) => n + 1)} onClose={() => setSelected(null)} compact={compact} triggerRef={answerTrigger} />
    </div>}
    {assignOpen && <AssignmentDialog key={periodId} periodId={periodId} periodName={periodName} onClose={() => setAssignOpen(false)} />}
    {dialogRow && <DecisionDialog row={dialogRow} onClose={() => { if (!decisionSaving) setDialogRow(null); }} onSubmit={decide} saving={decisionSaving} error={decisionError} />}
  </div>;
}
