"use client";

import { useEffect, useState } from "react";
import "../event-builder.css";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, Save, Send, Trash2 } from "lucide-react";
import { api } from "@/services/api";

const TYPES = [
  ["text", "Isian singkat"], ["textarea", "Paragraf"], ["email", "Email"],
  ["tel", "Nomor telepon"], ["number", "Angka"], ["date", "Tanggal"],
  ["select", "Dropdown"], ["radio", "Pilihan ganda"],
  ["checkbox", "Centang persetujuan"], ["file", "Upload berkas"],
];
const CHOICES = new Set(["select", "radio"]);

function newField(type) {
  return {
    editorId: Math.random().toString(36).slice(2),
    name: "field_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type, label: "", help: "", placeholder: "", required: false,
    options: CHOICES.has(type) ? [{ value: "pilihan_1", label: "Pilihan 1" }] : [],
  };
}

function PreviewField({ field }) {
  const common = { disabled: true, placeholder: field.placeholder || "Isian peserta" };
  if (field.type === "textarea") return <textarea {...common} rows={3} />;
  if (field.type === "select") return <select disabled><option>Pilih opsi</option>{field.options.map((option, index) => <option key={index}>{option.label}</option>)}</select>;
  if (field.type === "radio") return <div className="event-builder-choices">{field.options.map((option, index) => <label key={index}><input type="radio" disabled /> {option.label}</label>)}</div>;
  if (field.type === "checkbox") return <label className="event-builder-choice"><input type="checkbox" disabled /> Ya, saya setuju</label>;
  if (field.type === "file") return <input type="file" disabled />;
  return <input {...common} type={field.type} />;
}

export default function EventBuilderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get("/admin/events/" + id).then(({ data }) => {
      const item = data?.data;
      if (!item) throw new Error("Event tidak ditemukan.");
      setEvent(item);
      setFields(Array.isArray(item.formFields) ? item.formFields.map((field) => ({ ...field, editorId: Math.random().toString(36).slice(2) })) : []);
    }).catch((err) => setError(err.message || "Gagal memuat event."))
      .finally(() => setLoading(false));
  }, [id]);

  const locked = Boolean(event?.registrations_count || event?.teams_count || event?.enrollments_count);
  function change(index, update) {
    setFields((current) => current.map((field, position) => position === index ? { ...field, ...update } : field));
    setDirty(true);
    setNotice("");
  }
  function move(index, step) {
    const next = [...fields];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFields(next); setDirty(true);
  }
  function add(type) {
    setFields((current) => [...current, newField(type)]);
    setDirty(true); setNotice("");
  }
  function validate() {
    if (!fields.length) return "Tambahkan minimal satu kolom sebelum menyimpan.";
    if (fields.some((field) => !field.label.trim())) return "Setiap kolom harus memiliki pertanyaan atau label.";
    if (fields.some((field) => CHOICES.has(field.type) && (!field.options.length || field.options.some((option) => !option.label.trim() || !option.value.trim())))) return "Lengkapi semua opsi pilihan.";
    return "";
  }
  async function saveForm() {
    const message = validate();
    if (message) { setError(message); return false; }
    setPending(true); setError(""); setNotice("");
    try {
      const payload = fields.map((field) => ({
        name: field.name, label: field.label.trim(), type: field.type,
        required: Boolean(field.required), help: (field.help || "").trim(),
        placeholder: (field.placeholder || "").trim(),
        options: CHOICES.has(field.type) ? field.options : [],
      }));
      const { data } = await api.put("/admin/events/" + id + "/form", { form_fields: payload });
      setFields((data.data.formFields || payload).map((field) => ({ ...field, editorId: fields.find((old) => old.name === field.name)?.editorId || Math.random().toString(36).slice(2) })));
      setDirty(false);
      setNotice("Draft formulir tersimpan.");
      return true;
    } catch (err) {
      setError(err.message || "Gagal menyimpan formulir.");
      return false;
    } finally { setPending(false); }
  }
  async function publish() {
    if (!(await saveForm())) return;
    setPending(true);
    try {
      const { data } = await api.post("/admin/events/" + id + "/publish");
      setEvent(data.data);
      setNotice("Event berhasil dipublikasikan. Formulir kini tersedia untuk peserta.");
      router.refresh();
    } catch (err) { setError(err.message || "Event belum dapat dipublikasikan."); }
    finally { setPending(false); }
  }

  if (loading) return <div className="admin-card admin-card-body" role="status">Memuat editor event…</div>;
  if (!event) return <div className="admin-card admin-card-body" role="alert">{error || "Event tidak ditemukan."} <Link href="/admin/events">Kembali ke daftar</Link></div>;

  return <div className="event-builder">
    <div className="event-builder-header">
      <Link href="/admin/events" className="event-builder-back"><ArrowLeft size={18} /> Semua event</Link>
      <div className="event-builder-title">
        <div><span className="event-builder-eyebrow">SIMANIKA / FORMULIR EVENT</span><h1>{event.judul}</h1><p>Susun pertanyaan peserta sesuai kebutuhan event, lalu terbitkan ketika siap.</p></div>
        <span className={"admin-badge admin-badge--" + event.status}>{event.status === "draft" ? "DRAFT" : event.status.toUpperCase()}</span>
      </div>
      <div className="event-builder-actions">
        <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setPreview((value) => !value)}><Eye size={17} /> {preview ? "Tutup pratinjau" : "Pratinjau"}</button>
        <button type="button" className="admin-btn admin-btn--secondary" disabled={pending || locked || !dirty} onClick={saveForm}><Save size={17} /> Simpan draft</button>
        {event.status === "draft" && <button type="button" className="admin-btn admin-btn--primary" disabled={pending || locked || !fields.length} onClick={publish}><Send size={17} /> Publikasikan event</button>}
      </div>
      {locked && <p className="event-builder-note">Formulir dikunci karena event sudah memiliki pendaftar. Data pendaftaran peserta tetap terjaga.</p>}
      {error && <p className="event-builder-error" role="alert">{error}</p>}
      {notice && <p className="event-builder-success" role="status">{notice}</p>}
    </div>

    <div className={"event-builder-grid" + (preview ? "" : " event-builder-grid--single")}>
      <main className="event-builder-canvas">
        {fields.length === 0 && <div className="event-builder-empty"><span>01 / MULAI DI SINI</span><h2>Formulirmu masih kosong.</h2><p>Pilih jenis pertanyaan dari panel sebelah. Setiap kolom dapat disusun dari awal sesuai kebutuhan event.</p></div>}
        {fields.map((field, index) => <section className="event-builder-field" key={field.editorId} aria-label={"Kolom " + (index + 1)}>
          <div className="event-builder-field-head"><span className="event-builder-number">{String(index + 1).padStart(2, "0")}</span><strong>{TYPES.find(([type]) => type === field.type)?.[1] || field.type}</strong><div className="event-builder-field-actions">
            <button type="button" aria-label={"Geser kolom " + (index + 1) + " ke atas"} disabled={locked || index === 0} onClick={() => move(index, -1)}><ArrowUp size={17} /></button>
            <button type="button" aria-label={"Geser kolom " + (index + 1) + " ke bawah"} disabled={locked || index === fields.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17} /></button>
            <button type="button" aria-label={"Hapus kolom " + (index + 1)} disabled={locked} onClick={() => { setFields(fields.filter((_, position) => position !== index)); setDirty(true); }}><Trash2 size={17} /></button>
          </div></div>
          <div className="event-builder-field-body">
            <label>Pertanyaan / label <span>*</span><input value={field.label} disabled={locked} maxLength={200} onChange={(e) => change(index, { label: e.target.value })} placeholder="Contoh: Nama lengkap, bukti twibbon, asal kampus" /></label>
            {event.tipePendaftaran === "tim" && field.type === "text" && <label className="event-builder-required"><input type="checkbox" checked={field.name === "nama_tim"} disabled={locked} onChange={(e) => { setFields((current) => current.map((item, position) => ({ ...item, name: position === index ? (e.target.checked ? "nama_tim" : "field_" + item.editorId) : (e.target.checked && item.name === "nama_tim" ? "field_" + item.editorId : item.name) }))); setDirty(true); setNotice(""); }} /> Gunakan isian ini sebagai nama tim</label>}
            <div className="event-builder-two">
              <label>Jenis isian<select value={field.type} disabled={locked} onChange={(e) => change(index, { type: e.target.value, options: CHOICES.has(e.target.value) ? [{ value: "pilihan_1", label: "Pilihan 1" }] : [] })}>{TYPES.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></label>
              <label>Teks bantuan<input value={field.help || ""} disabled={locked} maxLength={500} onChange={(e) => change(index, { help: e.target.value })} placeholder="Petunjuk untuk peserta (opsional)" /></label>
            </div>
            {!["file", "checkbox", "select", "radio"].includes(field.type) && <label>Placeholder<input value={field.placeholder || ""} disabled={locked} maxLength={250} onChange={(e) => change(index, { placeholder: e.target.value })} placeholder="Contoh isian singkat" /></label>}
            {CHOICES.has(field.type) && <div className="event-builder-options"><span>Opsi pilihan</span>{field.options.map((option, optionIndex) => <div key={optionIndex}>
              <input aria-label={"Pilihan " + (optionIndex + 1)} value={option.label} disabled={locked} maxLength={150} onChange={(e) => {
                const options = [...field.options]; options[optionIndex] = { value: "pilihan_" + (optionIndex + 1), label: e.target.value };
                change(index, { options });
              }} />
              <button type="button" disabled={locked || field.options.length === 1} aria-label={"Hapus pilihan " + (optionIndex + 1)} onClick={() => change(index, { options: field.options.filter((_, position) => position !== optionIndex).map((item, position) => ({ ...item, value: "pilihan_" + (position + 1) })) })}><Trash2 size={16} /></button>
            </div>)}<button type="button" disabled={locked} onClick={() => change(index, { options: [...field.options, { value: "pilihan_" + (field.options.length + 1), label: "Pilihan " + (field.options.length + 1) }] })}><Plus size={16} /> Tambah pilihan</button></div>}
            {field.type === "file" && <p className="event-builder-hint">PDF, JPG, PNG, atau WebP · maksimal 5 MB. Berkas peserta tersimpan privat.</p>}
            <label className="event-builder-required"><input type="checkbox" checked={Boolean(field.required)} disabled={locked} onChange={(e) => change(index, { required: e.target.checked })} /> Wajib diisi</label>
          </div>
        </section>)}
        {!locked && <div className="event-builder-add"><p>Tambah pertanyaan</p><div>{TYPES.map(([type, label]) => <button type="button" key={type} onClick={() => add(type)}><Plus size={16} /> {label}</button>)}</div></div>}
      </main>
      {preview && <aside className="event-builder-preview" aria-label="Pratinjau formulir"><span className="event-builder-eyebrow">PRATINJAU PESERTA</span><h2>{event.judul}</h2><p>Formulir pendaftaran · {event.tipePendaftaran === "tim" ? "Tim" : "Individu"}</p>
        {fields.length ? fields.map((field, index) => <div className="event-builder-preview-field" key={field.name}><label>{index + 1}. {field.label || "Pertanyaan tanpa judul"} {field.required && <b>*</b>}</label>{field.help && <small>{field.help}</small>}<PreviewField field={field} /></div>) : <div className="event-builder-preview-empty">Pertanyaan akan tampil di sini setelah ditambahkan.</div>}
        <button type="button" disabled className="admin-btn admin-btn--primary">Kirim pendaftaran</button>
      </aside>}
    </div>
  </div>;
}
