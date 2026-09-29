"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { api } from "@/services/api";
import { AdminErrorNotice } from "../../../../AdminErrorNotice";
import { toast } from "sonner";
import { WrittenTestPreview } from "./WrittenTestPreview";
import { WrittenTestQuestionEditor } from "./WrittenTestQuestionEditor";
import "../../test.css";

const newQuestion = () => ({
  id: `q_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
  label: "", type: "short_text", required: false, help: "", options: [], targetDivisions: [],
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
      if (["single_choice", "select"].includes(question.type)) {
        const options = question.options.map((option) => option.trim()).filter(Boolean);
        if (options.length < 2 || new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
          setError(`Pertanyaan nomor ${index + 1} memerlukan dua opsi berbeda.`); return;
        }
      }
    }
    setSaving(true); setError("");
    try {
      const response = await api.put(`/admin/oprec/${encodeURIComponent(period)}/written-test`, {
        headline: test.headline,
        deskripsi: test.deskripsi || "",
        tanggal_buka: test.tanggal_buka,
        tanggal_tutup: test.tanggal_tutup,
        questions: questions.map((question) => ({
          ...question,
          label: question.label.trim(),
          options: ["single_choice", "select"].includes(question.type) ? question.options.map((option) => option.trim()).filter(Boolean) : [],
        })),
      });
      setTest(response.data.data);
      toast.success("Soal Tes Tulis berhasil disimpan.", { position: "top-center", description: "Tes akan dibuka otomatis sesuai jadwal." });
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
      {loading ? <p className="oprec-test__empty" role="status">Memuat pertanyaan…</p> : test ? (
        <div className="oprec-test__editor-layout"><form className="oprec-test__editor-panel" onSubmit={save}>
          <div className="oprec-test__schedule"><div><strong>Jadwal pelaksanaan</strong><p>{formatWib(test.tanggal_buka)} – {formatWib(test.tanggal_tutup)}</p></div><span className={`oprec-test__badge ${test.published ? "is-ready" : ""}`}>{test.published ? "Soal siap" : "Belum siap"}</span></div>
          <div className="oprec-test__questions-head"><div><h2>Pertanyaan</h2><p>Teks singkat, paragraf, atau satu pilihan jawaban.</p></div><span>{questions.length} / 40</span></div>
          {questions.map((question, index) => <WrittenTestQuestionEditor key={question.id} question={question} index={index} count={questions.length} divisions={divisions} update={update} move={move} remove={(target) => setQuestions((current) => current.filter((_, i) => i !== target))} />)}
          <button className="oprec-test__add" type="button" disabled={questions.length >= 40} onClick={() => setQuestions((current) => [...current, newQuestion()])}><Plus size={17} aria-hidden="true" /> Tambah pertanyaan</button>
          <footer className="oprec-test__footer"><span>Soal yang tersimpan tersedia saat jadwal tes aktif. Soal terkunci setelah tes dimulai.</span><button type="submit" disabled={saving}><Save size={16} aria-hidden="true" /> {saving ? "Menyimpan…" : "Simpan pertanyaan"}</button></footer>
        </form><WrittenTestPreview questions={questions} divisions={divisions} /></div>
      ) : null}
    </div>
  );
}
