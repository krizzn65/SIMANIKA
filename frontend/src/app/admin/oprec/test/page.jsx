"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { AdminErrorNotice } from "../../AdminErrorNotice";
import "./test.css";

const blankForm = () => ({
  headline: "",
  deskripsi: "",
  tanggal_buka: "",
  tanggal_tutup: "",
  questions: [],
});

function wibDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

const wibTimestamp = (value) => Date.parse(`${value}:00+07:00`);

function newQuestion() {
  return {
    id: `q_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
    label: "",
    type: "paragraph",
    required: true,
    options: [],
    targetDivisions: [],
  };
}

function validate(form) {
  if (!form.headline.trim()) return "Judul tes tulis wajib diisi.";
  const start = wibTimestamp(form.tanggal_buka);
  const end = wibTimestamp(form.tanggal_tutup);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "Jadwal tes harus lengkap dan waktu tutup setelah waktu buka.";
  if (!form.questions.length) return "Tambahkan minimal satu pertanyaan.";
  for (const [index, question] of form.questions.entries()) {
    if (!question.label.trim()) return `Isi pertanyaan nomor ${index + 1}.`;
    if (question.type === "single_choice") {
      const options = question.options.map((option) => option.trim()).filter(Boolean);
      if (options.length < 2 || new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
        return `Pertanyaan nomor ${index + 1} memerlukan minimal dua opsi berbeda.`;
      }
    }
  }
  return "";
}

export default function AdminOprecWrittenTestPage() {
  const [periods, setPeriods] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingTest, setLoadingTest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saved, setSaved] = useState(false);

  const loadPeriods = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await api.get("/admin/oprec/written-tests", { params: { page } });
      const rows = response.data?.data || [];
      setPeriods(rows);
      setLastPage(Math.max(1, Number(response.data?.last_page) || 1));
      setSelectedId((previous) => rows.some((row) => row.id === previous) ? previous : rows[0]?.id ?? null);
      setError("");
    } catch (cause) {
      setError(cause.message || "Daftar periode OPREC tidak dapat dimuat.");
      setPeriods([]);
      setSelectedId(null);
    } finally {
      setLoadingList(false);
    }
  }, [page]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  useEffect(() => {
    if (!selectedId) {
      setForm(blankForm());
      setDivisions([]);
      return;
    }
    let active = true;
    setLoadingTest(true);
    setForm(blankForm());
    setDivisions([]);
    setSaved(false);
    setError("");
    setSuccess("");
    api.get(`/admin/oprec/${selectedId}/written-test`).then((response) => {
      if (!active) return;
      const data = response.data?.data;
      setDivisions(data?.divisions || []);
      setSaved(Boolean(data?.test));
      setForm(data?.test ? {
        headline: data.test.headline || "",
        deskripsi: data.test.deskripsi || "",
        tanggal_buka: wibDateTime(data.test.tanggal_buka),
        tanggal_tutup: wibDateTime(data.test.tanggal_tutup),
        questions: (data.test.questions || []).map((question) => ({
          ...question,
          options: question.options || [],
          targetDivisions: (question.targetDivisions || []).map(Number),
        })),
      } : blankForm());
    }).catch((cause) => {
      if (active) setError(cause.message || "Tes tulis tidak dapat dimuat.");
    }).finally(() => { if (active) setLoadingTest(false); });
    return () => { active = false; };
  }, [selectedId]);

  const selected = periods.find((item) => item.id === selectedId);
  const updateQuestion = (index, changes) => setForm((current) => ({
    ...current,
    questions: current.questions.map((question, itemIndex) => itemIndex === index ? { ...question, ...changes } : question),
  }));
  const removeQuestion = (index) => setForm((current) => ({
    ...current,
    questions: current.questions.filter((_, itemIndex) => itemIndex !== index),
  }));
  const moveQuestion = (index, step) => setForm((current) => {
    const questions = [...current.questions];
    [questions[index], questions[index + step]] = [questions[index + step], questions[index]];
    return { ...current, questions };
  });

  async function saveTest(event) {
    event.preventDefault();
    const message = validate(form);
    if (message) { setError(message); setSuccess(""); return; }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/admin/oprec/${selectedId}/written-test`, {
        headline: form.headline.trim(),
        deskripsi: form.deskripsi.trim(),
        tanggal_buka: new Date(wibTimestamp(form.tanggal_buka)).toISOString(),
        tanggal_tutup: new Date(wibTimestamp(form.tanggal_tutup)).toISOString(),
        questions: form.questions.map((question) => ({
          ...question,
          label: question.label.trim(),
          options: question.type === "single_choice" ? question.options.map((option) => option.trim()).filter(Boolean) : [],
        })),
      });
      setSaved(true);
      setSuccess("Draf tes tulis berhasil disimpan.");
      await loadPeriods();
    } catch (cause) {
      const firstFieldError = Object.values(cause.response?.data?.errors || {}).flat()[0];
      setError(firstFieldError || cause.message || "Draf tes tulis gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="oprec-test">
      <header className="oprec-test__header">
        <div>
          <span className="oprec-test__eyebrow">OPREC / TES TULIS</span>
          <h1>Kelola Tes Tulis</h1>
          <p>Buat soal untuk satu periode rekrutmen. Tes tersimpan sebagai draf admin dan belum tampil bagi peserta.</p>
        </div>
        <button type="button" className="oprec-test__secondary" onClick={loadPeriods} disabled={loadingList || saving}><RefreshCw size={16} aria-hidden="true" /> Muat ulang</button>
      </header>

      {error && <AdminErrorNotice message={error} />}
      {success && <p className="oprec-test__success" role="status">{success}</p>}

      <div className="oprec-test__layout">
        <aside className="oprec-test__periods" aria-label="Daftar periode OPREC">
          <div className="oprec-test__section-head"><h2>Periode OPREC</h2><span>{loadingList ? "Memuat..." : `Halaman ${page} / ${lastPage}`}</span></div>
          {!loadingList && !periods.length && <p className="oprec-test__empty">Belum ada pendaftaran OPREC. Buat periode di halaman Pendaftaran terlebih dahulu.</p>}
          {periods.map((period) => (
            <button key={period.id} type="button" className={`oprec-test__period ${selectedId === period.id ? "is-active" : ""}`} onClick={() => { if (period.id !== selectedId) { setLoadingTest(true); setSelectedId(period.id); } }} aria-pressed={selectedId === period.id}>
              <strong>{period.periode}</strong>
              <small>{period.written_test ? "Draf tes tersedia" : "Belum ada tes"}</small>
            </button>
          ))}
          {lastPage > 1 && <div className="oprec-test__pager">
            <button type="button" disabled={page === 1 || loadingList} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button>
            <button type="button" disabled={page === lastPage || loadingList} onClick={() => setPage((value) => value + 1)}>Berikutnya</button>
          </div>}
        </aside>

        <section className="oprec-test__editor" aria-label="Editor tes tulis">
          {selectedId && !loadingTest ? (
            <form onSubmit={saveTest}>
              <div className="oprec-test__section-head"><div><h2>{saved ? "Edit Draf Tes Tulis" : "Buat Tes Tulis"}</h2><p>Periode {selected?.periode || ""}</p></div><span className="oprec-test__badge">Draf</span></div>
              <div className="oprec-test__fields">
                <label className="oprec-test__wide">Judul tes <span aria-hidden="true">*</span><input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} maxLength={300} required placeholder="Contoh: Tes Tulis OPREC 2026/2027" /></label>
                <label className="oprec-test__wide">Petunjuk peserta<textarea value={form.deskripsi} onChange={(event) => setForm({ ...form, deskripsi: event.target.value })} maxLength={5000} rows={3} placeholder="Instruksi pengerjaan tes..." /></label>
                <label>Waktu mulai (WIB) <span aria-hidden="true">*</span><input type="datetime-local" value={form.tanggal_buka} onChange={(event) => setForm({ ...form, tanggal_buka: event.target.value })} required /></label>
                <label>Waktu selesai (WIB) <span aria-hidden="true">*</span><input type="datetime-local" value={form.tanggal_tutup} onChange={(event) => setForm({ ...form, tanggal_tutup: event.target.value })} required /></label>
              </div>

              <div className="oprec-test__questions-head"><div><h2>Pertanyaan</h2><p>Tambah teks singkat, paragraf, atau pilihan satu jawaban.</p></div><span>{form.questions.length} / 40</span></div>
              {form.questions.map((question, index) => (
                <fieldset className="oprec-test__question" key={question.id}>
                  <legend>Pertanyaan {index + 1}</legend>
                  <div className="oprec-test__question-actions">
                    <button type="button" aria-label={`Naikkan pertanyaan ${index + 1}`} disabled={index === 0} onClick={() => moveQuestion(index, -1)}><ArrowUp size={16} /></button>
                    <button type="button" aria-label={`Turunkan pertanyaan ${index + 1}`} disabled={index === form.questions.length - 1} onClick={() => moveQuestion(index, 1)}><ArrowDown size={16} /></button>
                    <button type="button" aria-label={`Hapus pertanyaan ${index + 1}`} onClick={() => removeQuestion(index)}><Trash2 size={16} /></button>
                  </div>
                  <div className="oprec-test__fields">
                    <label className="oprec-test__wide">Teks pertanyaan <span aria-hidden="true">*</span><input value={question.label} onChange={(event) => updateQuestion(index, { label: event.target.value })} maxLength={300} required /></label>
                    <label>Tipe jawaban<select value={question.type} onChange={(event) => updateQuestion(index, { type: event.target.value, options: event.target.value === "single_choice" ? ["", ""] : [] })}><option value="short_text">Teks singkat</option><option value="paragraph">Paragraf</option><option value="single_choice">Pilihan satu</option></select></label>
                    <label className="oprec-test__check"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(index, { required: event.target.checked })} /> Wajib dijawab</label>
                    {question.type === "single_choice" && <label className="oprec-test__wide">Opsi jawaban <small>Satu opsi per baris, minimal dua opsi berbeda.</small><textarea rows={4} value={question.options.join("\n")} onChange={(event) => updateQuestion(index, { options: event.target.value.split("\n") })} /></label>}
                  </div>
                  {divisions.length > 0 && <div className="oprec-test__targets">
                    <strong>Ditujukan untuk divisi</strong><small>Jika tidak ada yang dicentang, pertanyaan berlaku untuk semua divisi.</small>
                    <div>{divisions.map((division) => <label key={division.id}><input type="checkbox" checked={question.targetDivisions.includes(Number(division.id))} onChange={(event) => updateQuestion(index, { targetDivisions: event.target.checked ? [...question.targetDivisions, Number(division.id)] : question.targetDivisions.filter((id) => id !== Number(division.id)) })} /> {division.nama}</label>)}</div>
                  </div>}
                </fieldset>
              ))}
              <button className="oprec-test__add" type="button" disabled={form.questions.length >= 40} onClick={() => setForm((current) => ({ ...current, questions: [...current.questions, newQuestion()] }))}><Plus size={17} aria-hidden="true" /> Tambah pertanyaan</button>
              <footer className="oprec-test__footer"><span>Draf ini belum dipublikasikan kepada peserta.</span><button type="submit" disabled={saving || loadingTest}><Save size={16} aria-hidden="true" /> {saving ? "Menyimpan..." : "Simpan tes tulis"}</button></footer>
            </form>
          ) : <p className="oprec-test__empty">{loadingTest ? "Memuat tes tulis..." : "Pilih periode untuk membuat tes tulis."}</p>}
        </section>
      </div>
    </div>
  );
}
