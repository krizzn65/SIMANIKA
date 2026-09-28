"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { AdminErrorNotice } from "../../../../AdminErrorNotice";
import "../../test.css";

const newQuestion = () => ({
  id: `q_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
  label: "", type: "paragraph", required: true, options: [], targetDivisions: [],
});
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat()[0] || error.response?.data?.message || error.message || "Tes Tulis gagal disimpan.";
const formatWib = (value) => value ? new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric",
  hour: "2-digit", minute: "2-digit",
}).format(new Date(value)) + " WIB" : "—";

export default function EditWrittenTestPage() {
  const params = useParams();
  const period = params.period;
  const [test, setTest] = useState(null);
  const [oprec, setOprec] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/oprec/${encodeURIComponent(period)}/written-test`);
      const data = response.data?.data;
      if (!data?.test) throw new Error("Tes Tulis belum dibuat untuk periode ini.");
      setTest(data.test);
      setOprec(data.oprec);
      setDivisions(data.divisions || []);
      setQuestions((data.test.questions || []).map((question) => ({
        ...question, options: question.options || [], targetDivisions: (question.targetDivisions || []).map(Number),
      })));
      setError("");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const update = (index, values) => setQuestions((current) => current.map((item, i) => i === index ? { ...item, ...values } : item));
  const move = (index, offset) => setQuestions((current) => {
    const next = [...current];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    return next;
  });

  async function save(event) {
    event.preventDefault();
    if (!test || !questions.length) { setError("Tambahkan minimal satu pertanyaan."); return; }
    for (const [index, question] of questions.entries()) {
      if (!question.label.trim()) { setError(`Isi pertanyaan nomor ${index + 1}.`); return; }
      if (question.type === "single_choice") {
        const options = question.options.map((option) => option.trim()).filter(Boolean);
        if (options.length < 2 || new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
          setError(`Pertanyaan nomor ${index + 1} memerlukan dua opsi berbeda.`); return;
        }
      }
    }
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await api.put(`/admin/oprec/${encodeURIComponent(period)}/written-test`, {
        headline: test.headline,
        deskripsi: test.deskripsi || "",
        tanggal_buka: test.tanggal_buka,
        tanggal_tutup: test.tanggal_tutup,
        questions: questions.map((question) => ({
          ...question,
          label: question.label.trim(),
          options: question.type === "single_choice" ? question.options.map((option) => option.trim()).filter(Boolean) : [],
        })),
      });
      setTest(response.data.data);
      setSuccess("Soal tersimpan. Tes akan dibuka otomatis sesuai jadwal.");
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="oprec-test oprec-test--editor">
      <Link href="/admin/oprec/test" className="oprec-test__back"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke Tes Tulis</Link>
      <header className="oprec-test__header"><div><span className="oprec-test__eyebrow">OPREC · PERIODE {oprec?.periode || ""}</span><h1>Kelola Pertanyaan Tes Tulis</h1><p>Susun soal yang akan dijawab peserta sesuai pilihan divisinya.</p></div></header>
      {error && <AdminErrorNotice message={error} />}
      {success && <p className="oprec-test__success" role="status">{success}</p>}
      {loading ? <p className="oprec-test__empty" role="status">Memuat pertanyaan…</p> : test ? (
        <form className="oprec-test__editor-panel" onSubmit={save}>
          <div className="oprec-test__schedule"><div><strong>Jadwal pelaksanaan</strong><p>{formatWib(test.tanggal_buka)} – {formatWib(test.tanggal_tutup)}</p></div><span className={`oprec-test__badge ${test.published ? "is-ready" : ""}`}>{test.published ? "Soal siap" : "Belum siap"}</span></div>
          <div className="oprec-test__questions-head"><div><h2>Pertanyaan</h2><p>Teks singkat, paragraf, atau satu pilihan jawaban.</p></div><span>{questions.length} / 40</span></div>
          {questions.map((question, index) => <fieldset className="oprec-test__question" key={question.id}>
            <legend>Pertanyaan {index + 1}</legend>
            <div className="oprec-test__question-actions">
              <button type="button" aria-label={`Naikkan pertanyaan ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button>
              <button type="button" aria-label={`Turunkan pertanyaan ${index + 1}`} disabled={index === questions.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button>
              <button type="button" aria-label={`Hapus pertanyaan ${index + 1}`} onClick={() => setQuestions((current) => current.filter((_, i) => i !== index))}><Trash2 size={16} /></button>
            </div>
            <div className="oprec-test__fields">
              <label className="oprec-test__wide">Teks pertanyaan <span aria-hidden="true">*</span><input required maxLength={300} value={question.label} onChange={(event) => update(index, { label: event.target.value })} /></label>
              <label>Tipe jawaban<select value={question.type} onChange={(event) => update(index, { type: event.target.value, options: event.target.value === "single_choice" ? ["", ""] : [] })}><option value="short_text">Teks singkat</option><option value="paragraph">Paragraf</option><option value="single_choice">Pilihan satu</option></select></label>
              <label className="oprec-test__check"><input type="checkbox" checked={question.required} onChange={(event) => update(index, { required: event.target.checked })} /> Wajib dijawab</label>
              {question.type === "single_choice" && <label className="oprec-test__wide">Opsi jawaban <small>Satu opsi per baris, minimal dua opsi berbeda.</small><textarea rows={4} value={question.options.join("\n")} onChange={(event) => update(index, { options: event.target.value.split("\n") })} /></label>}
            </div>
            {divisions.length > 0 && <div className="oprec-test__targets"><strong>Ditujukan untuk divisi</strong><small>Tanpa pilihan berarti berlaku untuk semua divisi.</small><div>{divisions.map((division) => <label key={division.id}><input type="checkbox" checked={question.targetDivisions.includes(Number(division.id))} onChange={(event) => update(index, { targetDivisions: event.target.checked ? [...question.targetDivisions, Number(division.id)] : question.targetDivisions.filter((id) => id !== Number(division.id)) })} /> {division.nama}</label>)}</div></div>}
          </fieldset>)}
          <button className="oprec-test__add" type="button" disabled={questions.length >= 40} onClick={() => setQuestions((current) => [...current, newQuestion()])}><Plus size={17} aria-hidden="true" /> Tambah pertanyaan</button>
          <footer className="oprec-test__footer"><span>Soal yang tersimpan tersedia saat jadwal tes aktif. Soal terkunci setelah tes dimulai.</span><button type="submit" disabled={saving}><Save size={16} aria-hidden="true" /> {saving ? "Menyimpan…" : "Simpan pertanyaan"}</button></footer>
        </form>
      ) : null}
    </div>
  );
}
