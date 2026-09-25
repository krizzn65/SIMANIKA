"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { AnimatedCheckIcon } from "@/components/ui/AnimatedCheckIcon";
import { api } from "@/services/api";
import "./oprec-builder.css";

const types = [["text", "Jawaban singkat"], ["textarea", "Jawaban panjang"], ["number", "Angka"], ["select", "Dropdown"], ["radio", "Pilihan satu"], ["checkbox", "Persetujuan"]];
const newField = () => ({ name: `soal_${Date.now()}`, label: "", type: "textarea", required: true, help: "", maxLength: 2000, options: [] });
const optionLines = (options) => (options || []).map((item) => item.label).join("\n");
const optionsFromLines = (value) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).map((item) => ({ label: item, value: item }));

export default function OprecTestBuilder({ oprecId, stageId }) {
  const router = useRouter();
  const [stage, setStage] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api.get(`/admin/oprec/${oprecId}`).then(({ data }) => {
      const item = data.data?.stages?.find((entry) => String(entry.id) === String(stageId) && entry.type === "test_tulis");
      if (!item) throw new Error("Tahap tes tulis tidak ditemukan.");
      setStage(item); setFields(item.formFields || []);
    }).catch((err) => setError(err.message || "Gagal memuat tes tulis.")).finally(() => setLoading(false));
  }, [oprecId, stageId]);
  const setField = (index, patch) => { setFields((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item)); setSaved(false); };
  const save = async (published) => {
    if (!fields.length) { setError("Tambahkan minimal satu pertanyaan."); return; }
    const names = new Set();
    for (const field of fields) {
      if (!field.label?.trim() || !/^[a-z][a-z0-9_]{0,49}$/.test(field.name) || names.has(field.name)) { setError("Setiap soal membutuhkan label dan kode unik."); return; }
      names.add(field.name);
      if (["select", "radio"].includes(field.type) && !field.options?.length) { setError(`Isi pilihan untuk ${field.label}.`); return; }
    }
    setBusy(true); setError("");
    try {
      await api.put(`/admin/oprec/${oprecId}/stages/${stageId}/form`, {
        published,
        form_fields: fields.map((field) => ({
          name: field.name, label: field.label.trim(), type: field.type, required: Boolean(field.required),
          help: field.help || null, maxLength: Number(field.maxLength || (field.type === "textarea" ? 2000 : 255)),
          ...(["select", "radio"].includes(field.type) ? { options: field.options || [] } : {}),
        })),
      });
      setStage((current) => ({ ...current, published })); setSaved(true);
      if (published) router.refresh();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : err.message || "Form tes belum tersimpan.");
    } finally { setBusy(false); }
  };
  if (loading) return <div className="oprec-builder__loading">Memuat formulir tes tulis…</div>;
  return <div className="oprec-builder oprec-test-builder"><Link href="/admin/oprec" className="oprec-builder__back"><ArrowLeft size={18} aria-hidden="true" /> Kembali ke OPREC</Link><header className="oprec-builder__hero"><div><span className="oprec-builder__eyebrow">// TAHAP 02 · TES TULIS</span><h1>Susun soal tes tulis</h1><p>{stage?.headline || "Pertanyaan tes untuk peserta yang sudah mendaftar."}</p></div><div className="oprec-builder__hero-actions"><button className="oprec-builder__save" type="button" disabled={busy} onClick={() => save(false)}><Save size={18} aria-hidden="true" /> Simpan draft</button><button className="oprec-builder__publish" type="button" disabled={busy} onClick={() => save(true)}>{stage?.published ? "Perbarui tes" : "Terbitkan tes"}</button></div></header>
  {error && <div className="oprec-builder__error" role="alert">{error}</div>}{saved && <div className="oprec-builder__success" role="status"><AnimatedCheckIcon size={18} active /> Form tes tersimpan.</div>}
  <section className="oprec-builder__card"><div className="oprec-builder__section-head"><span className="oprec-builder__number">02</span><div><h2>Pertanyaan tes</h2><p>Jawaban peserta tersimpan satu kali. Soal terkunci setelah jawaban pertama masuk.</p></div></div><div className="oprec-builder__fields">{fields.map((field, index) => <div className="oprec-builder__field" key={field.name + index}><div className="oprec-builder__field-head"><span className="oprec-builder__field-index">{String(index + 1).padStart(2, "0")}</span><strong>{field.label || "Soal baru"}</strong><button type="button" aria-label={`Hapus ${field.label || "soal"}`} onClick={() => setFields(fields.filter((_, i) => i !== index))}><Trash2 size={17} /></button></div><div className="oprec-builder__grid"><label>Soal / label <input value={field.label} onChange={(event) => setField(index, { label: event.target.value })} maxLength={200} /></label><label>Tipe jawaban <select value={field.type} onChange={(event) => setField(index, { type: event.target.value, options: [] })}>{types.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></label><label>Kode soal <input value={field.name} onChange={(event) => setField(index, { name: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} maxLength={50} /></label><label>Batas karakter <input type="number" min="1" max="5000" value={field.maxLength || 255} onChange={(event) => setField(index, { maxLength: Number(event.target.value) })} /></label>{["select", "radio"].includes(field.type) && <label className="wide">Pilihan (satu per baris) <textarea rows={4} value={optionLines(field.options)} onChange={(event) => setField(index, { options: optionsFromLines(event.target.value) })} /></label>}<label className="wide">Petunjuk (opsional) <input value={field.help || ""} onChange={(event) => setField(index, { help: event.target.value })} maxLength={500} /></label><label className="oprec-builder__check"><input type="checkbox" checked={Boolean(field.required)} onChange={(event) => setField(index, { required: event.target.checked })} /> Wajib dijawab</label></div></div>)}</div><button className="oprec-builder__add" type="button" onClick={() => setFields([...fields, newField()])} disabled={fields.length >= 40}><Plus size={17} aria-hidden="true" /> Tambah pertanyaan</button></section></div>;
}
