"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Eye, LoaderCircle, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AdminErrorNotice } from "../../AdminErrorNotice";
import "./test.css";

const toIso = (value) => new Date(`${value}:00+07:00`).toISOString();
const formatWib = (value) => value ? new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
}).format(new Date(value)) + " WIB" : "—";
const editHref = (period) => `/admin/oprec/test/${encodeURIComponent(period.periode.replaceAll("/", "-"))}/edit`;
const errorText = (error, fallback) => Object.values(error.response?.data?.errors || {}).flat()[0] || error.response?.data?.message || error.message || fallback;

function useNativeDialog(open, onClose) {
  const ref = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) {
      trigger.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
      trigger.current?.focus?.();
    }
  }, [open]);
  return { ref, onClose };
}

export default function AdminOprecWrittenTestPage() {
  const { user } = useAuth();
  const canManage = ["super_admin", "admin"].includes(user?.role);
  const router = useRouter();
  const [periods, setPeriods] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answerPage, setAnswerPage] = useState(1);
  const [answerPages, setAnswerPages] = useState(1);
  const [answerTotal, setAnswerTotal] = useState(0);
  const [answerPerPage, setAnswerPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [error, setError] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ oprec_id: "", tanggal_buka: "", tanggal_tutup: "" });
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const createDialog = useNativeDialog(createOpen, () => setCreateOpen(false));
  const previewDialog = useNativeDialog(Boolean(preview), () => setPreview(null));
  const deleteDialog = useNativeDialog(Boolean(deleteTarget), () => setDeleteTarget(null));

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/oprec/written-tests", { params: { page } });
      const rows = response.data?.data || [];
      setPeriods(rows);
      setEligible(response.data?.eligible_periods || []);
      setLastPage(Math.max(1, Number(response.data?.last_page) || 1));
      setSelectedId((old) => rows.some((row) => row.id === old) ? old : rows.find((row) => row.written_test)?.id ?? rows[0]?.id ?? null);
      setError("");
    } catch (cause) {
      setError(errorText(cause, "Daftar Tes Tulis gagal dimuat."));
      setPeriods([]);
      setEligible([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const selected = periods.find((period) => period.id === selectedId);
  const test = selected?.written_test;
  const loadAnswers = useCallback(async (signal) => {
    if (!selectedId || !test || !canManage) {
      setSubmissions([]);
      setQuestions([]);
      setAnswerTotal(0);
      return;
    }
    setLoadingAnswers(true);
    try {
      const response = await api.get(`/admin/oprec/${selectedId}/written-test/submissions`, { params: { page: answerPage }, signal });
      if (signal?.aborted) return;
      setSubmissions(response.data?.data || []);
      setQuestions(response.data?.questions || []);
      setAnswerPages(Math.max(1, Number(response.data?.last_page) || 1));
      setAnswerTotal(Number(response.data?.total) || 0);
      setAnswerPerPage(Math.max(1, Number(response.data?.per_page) || 20));
      setAnswerError("");
    } catch (cause) {
      if (signal?.aborted) return;
      setAnswerError(errorText(cause, "Jawaban tes gagal dimuat."));
      setSubmissions([]);
    } finally {
      if (!signal?.aborted) setLoadingAnswers(false);
    }
  }, [selectedId, test?.id, answerPage, canManage]);

  useEffect(() => {
    const controller = new AbortController();
    loadAnswers(controller.signal);
    return () => controller.abort();
  }, [loadAnswers]);

  useEffect(() => { setAnswerPage(1); }, [selectedId]);

  async function createTest(event) {
    event.preventDefault();
    const start = Date.parse(`${form.tanggal_buka}:00+07:00`);
    const end = Date.parse(`${form.tanggal_tutup}:00+07:00`);
    if (!form.oprec_id || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      setError("Pilih periode serta waktu mulai dan selesai yang benar.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      await api.post(`/admin/oprec/${form.oprec_id}/written-test`, {
        tanggal_buka: toIso(form.tanggal_buka),
        tanggal_tutup: toIso(form.tanggal_tutup),
      });
      const period = eligible.find((item) => String(item.id) === String(form.oprec_id));
      setCreateOpen(false);
      router.push(editHref(period));
    } catch (cause) {
      setError(errorText(cause, "Tes Tulis gagal dibuat."));
    } finally {
      setCreating(false);
    }
  }

  async function deleteAnswer() {
    if (!deleteTarget || !selectedId) return;
    setDeleting(true);
    setAnswerError("");
    try {
      await api.delete(`/admin/oprec/${selectedId}/written-test/submissions/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadAnswers();
      await loadPeriods();
    } catch (cause) {
      setAnswerError(errorText(cause, "Jawaban gagal dihapus."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="oprec-test">
      <header className="oprec-test__header">
        <div>
          <span className="oprec-test__eyebrow">OPREC · TES TULIS</span>
          <h1>Kelola Tes Tulis</h1>
          <p>Atur soal dan periksa jawaban peserta OPREC per periode.</p>
        </div>
        <div className="oprec-test__header-actions">
          {canManage && <button className="oprec-test__primary" type="button" onClick={() => { setForm({ oprec_id: String(eligible[0]?.id || ""), tanggal_buka: "", tanggal_tutup: "" }); setCreateOpen(true); }} disabled={!eligible.length || loading}>
            <Plus size={17} aria-hidden="true" /> Tambah Tes Tulis
          </button>}
          <button className="oprec-test__secondary" type="button" onClick={loadPeriods} disabled={loading}><RefreshCw size={16} aria-hidden="true" /> Perbarui</button>
        </div>
      </header>
      {!loading && !eligible.length && !periods.some((period) => period.written_test) && <p className="oprec-test__hint">Buka pendaftaran OPREC terlebih dahulu sebelum membuat Tes Tulis.</p>}
      {error && <AdminErrorNotice message={error} />}
      <div className="oprec-test__selector">
        <label htmlFor="test-period">Periode OPREC</label>
        <select id="test-period" value={selectedId || ""} onChange={(event) => setSelectedId(Number(event.target.value))}>
          {periods.map((period) => <option key={period.id} value={period.id}>{period.periode}</option>)}
        </select>
        {lastPage > 1 && <div className="oprec-test__pager">
          <button type="button" onClick={() => setPage((value) => value - 1)} disabled={page === 1}>Sebelumnya</button>
          <span>{page} / {lastPage}</span>
          <button type="button" onClick={() => setPage((value) => value + 1)} disabled={page === lastPage}>Berikutnya</button>
        </div>}
      </div>

      {loading ? <div className="oprec-test__empty" role="status">Memuat data Tes Tulis…</div> : test ? (
        <>
          <section className="oprec-test__overview" aria-labelledby="test-title">
            <div className="oprec-test__overview-top"><span className="oprec-test__eyebrow">OPREC · PERIODE {selected.periode}</span><strong>{test.submissions_count || 0}<small>JAWABAN MASUK</small></strong></div>
            <div className="oprec-test__overview-main">
              <div>
                <h2 id="test-title">{test.headline}</h2>
                <p><CalendarDays size={16} aria-hidden="true" /> {formatWib(test.tanggal_buka)} – {formatWib(test.tanggal_tutup)}</p>
                <span className={`oprec-test__badge ${test.published ? "is-ready" : ""}`}>{test.published ? "Soal siap" : "Soal belum disimpan"}</span>
              </div>
              {canManage && <button className="oprec-test__primary" type="button" onClick={() => router.push(editHref(selected))}><Pencil size={16} aria-hidden="true" /> Kelola pertanyaan</button>}
            </div>
          </section>
          {canManage ? <section className="oprec-test__answers" aria-labelledby="answers-title">
            <div className="oprec-test__section-head"><div><h2 id="answers-title">Jawaban Tes Tulis</h2><p>Seluruh kolom pertanyaan mengikuti soal pada tes ini.</p></div><span>{answerTotal} jawaban</span></div>
            {answerError && <AdminErrorNotice message={answerError} />}
            {loadingAnswers ? <div className="oprec-test__answers-loading" role="status" aria-live="polite" aria-busy="true"><div className="oprec-test__answers-loading-label"><LoaderCircle size={18} aria-hidden="true" /> Memuat jawaban…</div><div className="oprec-test__answers-skeleton" aria-hidden="true"><span /><span /><span /><span /><span /><span /></div></div> : (
              <div className="oprec-test__table-scroll" tabIndex={0} aria-label="Tabel jawaban dapat digulir mendatar">
                <table><thead><tr><th>No.</th><th>Nama</th><th>NIM</th><th>Pilihan Divisi</th>{questions.map((question) => <th key={question.id}>{question.label}</th>)}<th>Aksi</th></tr></thead>
                  <tbody>{submissions.map((item, index) => <tr key={item.id}>
                    <td>{(answerPage - 1) * answerPerPage + index + 1}</td><td><strong>{item.name}</strong></td><td>{item.nim}</td><td>{item.divisions.join(", ") || "—"}</td>
                    {questions.map((question) => <td key={question.id}>{item.files?.[question.id] ? <a href={item.files[question.id]} target="_blank" rel="noopener noreferrer">Unduh berkas</a> : item.answers?.[question.id] ? <details><summary>{String(item.answers[question.id]).slice(0, 70)}{String(item.answers[question.id]).length > 70 ? "…" : ""}</summary><p>{item.answers[question.id]}</p></details> : "Tidak berlaku / kosong"}</td>)}
                    <td><div className="oprec-test__row-actions"><button type="button" onClick={() => setPreview(item)}><Eye size={15} aria-hidden="true" /> Preview</button><button type="button" className="is-danger" onClick={() => setDeleteTarget(item)}><Trash2 size={15} aria-hidden="true" /> Hapus</button></div></td>
                  </tr>)}{!submissions.length && <tr className="oprec-test__empty-row"><td colSpan={questions.length + 5}>Belum ada peserta yang mengirim Tes Tulis.</td></tr>}</tbody>
                </table>
              </div>
            )}
            {answerPages > 1 && <div className="oprec-test__pager"><button type="button" disabled={answerPage === 1} onClick={() => setAnswerPage((value) => value - 1)}>Sebelumnya</button><span>{answerPage} / {answerPages}</span><button type="button" disabled={answerPage === answerPages} onClick={() => setAnswerPage((value) => value + 1)}>Berikutnya</button></div>}
          </section> : <p className="oprec-test__hint">Mode hanya baca. Jawaban peserta tersedia melalui <Link href="/admin/oprec/penilaian">Penilaian</Link> untuk periode yang ditugaskan.</p>}
        </>
      ) : <div className="oprec-test__empty">Belum ada Tes Tulis untuk periode ini.</div>}

      <dialog ref={createDialog.ref} onClose={createDialog.onClose} className="oprec-test__dialog">
        <form onSubmit={createTest}>
          <span className="oprec-test__eyebrow">BUAT TES TULIS</span><h2>Jadwal Tes Tulis</h2>
          <p>Pilih periode OPREC yang pernah dibuka dan tentukan waktu pelaksanaan dalam WIB.</p>
          {error && <p className="oprec-test__form-error" role="alert">{error}</p>}
          <div className="oprec-test__fields">
            <label className="oprec-test__wide">Periode OPREC<select required value={form.oprec_id} onChange={(event) => setForm((value) => ({ ...value, oprec_id: event.target.value }))}>{eligible.map((period) => <option key={period.id} value={period.id}>{period.periode}</option>)}</select></label>
            <label>Mulai (WIB)<input required type="datetime-local" value={form.tanggal_buka} onChange={(event) => setForm((value) => ({ ...value, tanggal_buka: event.target.value }))} /></label>
            <label>Selesai (WIB)<input required type="datetime-local" value={form.tanggal_tutup} min={form.tanggal_buka} onChange={(event) => setForm((value) => ({ ...value, tanggal_tutup: event.target.value }))} /></label>
          </div>
          <div className="oprec-test__dialog-actions"><button type="button" className="oprec-test__secondary" onClick={() => setCreateOpen(false)} disabled={creating}>Batal</button><button type="submit" className="oprec-test__primary" disabled={creating}>{creating ? "Membuat…" : "Buat & kelola soal"}</button></div>
        </form>
      </dialog>
      <dialog ref={previewDialog.ref} onClose={previewDialog.onClose} className="oprec-test__dialog">
        {preview && <><span className="oprec-test__eyebrow">DETAIL JAWABAN</span><h2>{preview.name}</h2><p>{preview.nim} · {preview.divisions.join(", ")}</p>
          <dl className="oprec-test__preview-list">{questions.map((question) => <div key={question.id}><dt>{question.label}</dt><dd>{preview.files?.[question.id] ? <a href={preview.files[question.id]} target="_blank" rel="noopener noreferrer">Unduh berkas</a> : preview.answers?.[question.id] || "Tidak berlaku / kosong"}</dd></div>)}</dl>
          <div className="oprec-test__dialog-actions"><button type="button" className="oprec-test__secondary" onClick={() => setPreview(null)}>Tutup</button></div>
        </>}
      </dialog>
      <dialog ref={deleteDialog.ref} onClose={deleteDialog.onClose} className="oprec-test__dialog">
        {deleteTarget && <><span className="oprec-test__eyebrow">KONFIRMASI TINDAKAN</span><h2>Hapus jawaban Tes Tulis?</h2><p>Jawaban {deleteTarget.name} akan dihapus. Peserta dapat mengirim ulang selama jadwal tes masih aktif.</p>
          <div className="oprec-test__dialog-actions"><button type="button" className="oprec-test__secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</button><button type="button" className="oprec-test__danger" onClick={deleteAnswer} disabled={deleting}>{deleting ? "Menghapus…" : "Hapus jawaban"}</button></div>
        </>}
      </dialog>
    </div>
  );
}
