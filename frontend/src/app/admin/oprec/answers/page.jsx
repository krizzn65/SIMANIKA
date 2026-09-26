"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList, RefreshCw, Save, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { AdminErrorNotice } from "../../AdminErrorNotice";
import "./answers.css";

function answerText(value) {
  if (value === null || value === undefined || value === "") return "Belum diisi";
  if (Array.isArray(value)) return value.map(answerText).join(", ");
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export default function OprecAnswersPage() {
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState(null);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);

  const period = periods.find((item) => String(item.id) === periodId);
  const stage = period?.stages?.find((item) => item.type === "test_tulis");

  useEffect(() => {
    let alive = true;
    api.get("/admin/oprec").then((response) => {
      if (!alive) return;
      const list = response.data?.data || [];
      setPeriods(list);
      setPeriodId(list.length ? String(list[0].id) : "");
    }).catch((reason) => { if (alive) setError(reason.message || "Gagal memuat periode OPREC."); })
      .finally(() => { if (alive) setLoadingPeriods(false); });
    return () => { alive = false; };
  }, []);

  const loadAnswers = useCallback(async (signal) => {
    if (!periodId || !stage?.id) { setPayload(null); return; }
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/admin/oprec/${periodId}/stages/${stage.id}/answers`, {
        params: { page, ...(divisionId ? { division_id: divisionId } : {}) }, signal,
      });
      setPayload(response.data);
    } catch (reason) {
      if (reason.code !== "ERR_CANCELED") setError(reason.message || "Gagal memuat jawaban tes tulis.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [periodId, stage?.id, divisionId, page]);

  useEffect(() => {
    const controller = new AbortController();
    loadAnswers(controller.signal);
    return () => controller.abort();
  }, [loadAnswers]);

  useEffect(() => {
    if (selected && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [selected]);

  const openScore = (row) => {
    setSelected(row);
    setScore(row.myScore === null ? "" : String(row.myScore));
    setNote(row.myNote || "");
  };

  const closeScore = () => {
    dialogRef.current?.close();
    setSelected(null);
  };

  const saveScore = async (event) => {
    event.preventDefault();
    if (!/^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/.test(score)) {
      toast.error("Nilai harus 0–100, maksimal dua angka desimal.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/oprec/${periodId}/stages/${stage.id}/answers/${selected.id}/score`, {
        score: Number(score), note: note.trim() || null,
      });
      closeScore();
      toast.success("Nilai tersimpan. Rata-rata dan peringkat diperbarui.");
      await loadAnswers();
    } catch (reason) {
      toast.error(reason.message || "Gagal menyimpan nilai.");
    } finally {
      setSaving(false);
    }
  };

  const rows = payload?.data || [];
  const fields = payload?.fields || [];
  const divisions = payload?.divisions || period?.divisiTersedia || [];
  const meta = payload?.meta;

  return <section className="oprec-review">
    <div className="oprec-review__header">
      <div><span className="oprec-review__eyebrow">OPREC / PENILAIAN</span><h1>Jawaban tes tulis</h1><p>Jawaban dipisahkan menurut divisi pilihan pertama. Nilai rata-rata dan peringkat dihitung otomatis dari seluruh penilai.</p></div>
      <Link href="/admin/oprec" className="oprec-review__back"><ClipboardList aria-hidden="true" size={17} /> Kelola tahapan</Link>
    </div>

    <div className="oprec-review__filters">
      <label>Periode<select value={periodId} disabled={loadingPeriods} onChange={(event) => { setPeriodId(event.target.value); setDivisionId(""); setPage(1); setPayload(null); }}>
        {!periods.length && <option value="">Belum ada periode</option>}
        {periods.map((item) => <option value={item.id} key={item.id}>{item.periode}</option>)}
      </select></label>
      <label>Divisi pilihan pertama<select value={divisionId} disabled={!stage} onChange={(event) => { setDivisionId(event.target.value); setPage(1); setPayload(null); }}>
        <option value="">Semua divisi</option>
        {divisions.map((item) => <option value={item.id} key={item.id}>{item.nama}</option>)}
      </select></label>
      <button type="button" onClick={() => loadAnswers()} disabled={!stage || loading} className="oprec-review__refresh"><RefreshCw aria-hidden="true" size={16} className={loading ? "animate-spin" : ""} /> Muat ulang</button>
    </div>

    <AdminErrorNotice message={error} onRetry={() => { if (!periods.length) window.location.reload(); else loadAnswers(); }} />
    {!loadingPeriods && !periods.length && !error && <div className="oprec-review__empty">Belum ada periode OPREC. Buat periode dan tes tulis terlebih dahulu.</div>}
    {period && !stage && <div className="oprec-review__empty">Periode ini belum mempunyai tahap tes tulis. <Link href="/admin/oprec">Tambahkan tahap tes tulis</Link>.</div>}
    {stage && <div className="oprec-review__panel">
      <div className="oprec-review__panel-head"><div><h2>{stage.headline || "Tes tulis"}</h2><p>{loading ? "Memuat jawaban…" : `${meta?.total ?? 0} jawaban · ${fields.length} pertanyaan`}</p></div><span className="oprec-review__legend">Peringkat per divisi</span></div>
      <div className="oprec-review__table-scroll"><table className="oprec-review__table"><thead><tr>
        <th scope="col">Peringkat</th><th scope="col">Peserta</th><th scope="col">Divisi</th>
        {fields.map((field) => <th scope="col" key={field.name}>{field.label}</th>)}
        <th scope="col">Rata-rata</th><th scope="col">Penilai</th><th scope="col">Nilai saya</th><th scope="col">Aksi</th>
      </tr></thead><tbody>
        {loading && !payload ? <tr><td colSpan={fields.length + 7}>Memuat jawaban tes tulis…</td></tr> : rows.length === 0 ? <tr><td colSpan={fields.length + 7}>Belum ada jawaban pada divisi atau halaman ini.</td></tr> : rows.map((row) => <tr key={row.id}>
          <td><span className={row.rank ? "oprec-review__rank" : ""}>{row.rank ? `#${row.rank}` : "—"}</span></td>
          <td><strong>{row.name}</strong><small>{row.nim}</small></td>
          <td>{divisions.find((division) => Number(division.id) === Number(row.divisionId))?.nama || `Divisi #${row.divisionId}`}</td>
          {fields.map((field) => <td key={field.name}><span className="oprec-review__answer-preview" title={answerText(row.answers?.[field.name])}>{answerText(row.answers?.[field.name])}</span></td>)}
          <td><strong>{row.averageScore === null ? "—" : Number(row.averageScore).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
          <td>{row.scoreCount}</td><td>{row.myScore === null ? "—" : row.myScore}</td>
          <td><button type="button" className="oprec-review__score-button" onClick={() => openScore(row)}>{row.myScore === null ? "Beri nilai" : "Ubah nilai"}</button></td>
        </tr>)}
      </tbody></table></div>
      {meta && meta.lastPage > 1 && <div className="oprec-review__pagination"><span>Halaman {meta.currentPage} dari {meta.lastPage}</span><div><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} aria-label="Halaman sebelumnya"><ChevronLeft size={18} /></button><button type="button" onClick={() => setPage((value) => value + 1)} disabled={page >= meta.lastPage} aria-label="Halaman berikutnya"><ChevronRight size={18} /></button></div></div>}
    </div>}

    {selected && <dialog ref={dialogRef} className="oprec-review__dialog" onClose={() => setSelected(null)}>
      <div className="oprec-review__dialog-head"><div><span className="oprec-review__eyebrow">PENILAIAN TES TULIS</span><h2>{selected.name}</h2><p>{selected.nim} · {divisions.find((item) => Number(item.id) === Number(selected.divisionId))?.nama}</p></div><button type="button" onClick={closeScore} aria-label="Tutup penilaian"><X size={18} /></button></div>
      <div className="oprec-review__dialog-answers">{fields.map((field, index) => <div key={field.name}><span>{String(index + 1).padStart(2, "0")} / {field.label}</span><p>{answerText(selected.answers?.[field.name])}</p></div>)}</div>
      <form onSubmit={saveScore} className="oprec-review__form"><label>Nilai saya (0–100)<input autoFocus required inputMode="decimal" type="number" min="0" max="100" step="0.01" value={score} onChange={(event) => setScore(event.target.value)} /></label><label>Catatan penilai (opsional)<textarea maxLength={1000} rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label><div><button type="button" onClick={closeScore}>Batal</button><button type="submit" disabled={saving}><Save aria-hidden="true" size={16} /> {saving ? "Menyimpan…" : "Simpan nilai"}</button></div></form>
    </dialog>}
  </section>;
}
