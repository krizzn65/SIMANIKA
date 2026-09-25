"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedCheckIcon } from "@/components/ui/AnimatedCheckIcon";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { divisionPreview } from "@/components/oprec/divisionPreview";
import "./oprec-builder.css";

const fixed = [
  { name: "nama", type: "text", label: "Nama lengkap", required: true, maxLength: 150 },
  { name: "nim", type: "text", label: "NIM", required: true, maxLength: 32 },
  { name: "tanggal_lahir", type: "date", label: "Tanggal lahir", required: true },
  { name: "angkatan", type: "select", label: "Angkatan", required: true, options: [] },
  { name: "divisi_pilihan_1", type: "select", label: "Divisi pilihan", required: true, options: [] },
];
const fieldTypes = [["text", "Teks singkat"], ["textarea", "Paragraf"], ["email", "Email"], ["tel", "Nomor telepon"], ["number", "Angka"], ["date", "Tanggal"], ["select", "Pilihan dropdown"], ["radio", "Pilihan satu"], ["checkbox", "Persetujuan"], ["file", "Unggah berkas"]];
const newField = (index) => ({ name: `pertanyaan_${index}`, label: "", type: "text", required: false, help: "", maxLength: 255 });
const emptyDivision = () => ({ nama: "", nama_lengkap: "", deskripsi: "", logo: "", kuota: "" });
const initial = () => ({
  periode: "", status: "closed", headline: "", deskripsi: "", poster: "", poster_alt: "",
  tanggal_buka: "", tanggal_tutup: "", schema_version: "1", form_intro: "", form_fields: fixed,
  divisi_tersedia: divisionPreview.map((item) => ({ nama: item.nama, nama_lengkap: item.namaLengkap, deskripsi: item.deskripsi, logo: item.logo || "", kuota: "" })),
  faq: [], pengumuman: { published: false, tanggal: null, pesan: "" },
});
const localDate = (value) => value ? new Date(value).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(" ", "T").slice(0, 16) : "";
const apiDate = (value) => value ? new Date(`${value}:00+07:00`).toISOString() : null;
const toOptions = (value) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => ({ value: line, label: line }));
const fromOptions = (options) => (options || []).map((item) => item.label).join("\n");

export default function OprecBuilder({ oprecId }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(oprecId));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!oprecId) return;
    let active = true;
    api.get(`/admin/oprec/${oprecId}`).then(({ data: response }) => {
      const item = response.data;
      if (!item) throw new Error("Periode OPREC tidak ditemukan.");
      if (!active) return;
      setData({
        periode: item.periode, status: item.status, headline: item.headline || "", deskripsi: item.deskripsi || "",
        poster: item.poster || "", poster_alt: item.posterAlt || "",
        tanggal_buka: localDate(item.tanggalBuka), tanggal_tutup: localDate(item.tanggalTutup),
        schema_version: String(item.schemaVersion || "1"), form_intro: item.formIntro || "",
        form_fields: [...fixed.map((template) => ({ ...template, ...(item.formFields || []).find((field) => field.name === template.name) })), ...(item.formFields || []).filter((field) => !fixed.some((template) => template.name === field.name))],
        divisi_tersedia: (item.divisiTersedia || []).map((division) => ({ nama: division.nama, nama_lengkap: division.namaLengkap || "", deskripsi: division.deskripsi || "", logo: division.logo || "", kuota: division.kuota ?? "" })),
        faq: item.faq || [], pengumuman: item.pengumuman || { published: false, tanggal: null, pesan: "" },
      });
    }).catch((err) => active && setError(err.message || "Gagal memuat periode.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [oprecId]);

  const set = (key, value) => { setData((current) => ({ ...current, [key]: value })); setSaved(false); };
  const setField = (index, patch) => set("form_fields", data.form_fields.map((item, i) => i === index ? { ...item, ...patch } : item));
  const setDivision = (index, patch) => set("divisi_tersedia", data.divisi_tersedia.map((item, i) => i === index ? { ...item, ...patch } : item));
  const removeField = (index) => set("form_fields", data.form_fields.filter((_, i) => i !== index));
  const moveField = (index, offset) => {
    const next = [...data.form_fields];
    const target = index + offset;
    if (index < fixed.length || target < fixed.length || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("form_fields", next);
  };
  const validate = () => {
    if (!data.periode.trim()) return "Isi periode kepengurusan.";
    if (!data.tanggal_buka || !data.tanggal_tutup || Date.parse(data.tanggal_tutup) <= Date.parse(data.tanggal_buka)) return "Isi tanggal buka dan tutup yang berurutan.";
    if (!data.divisi_tersedia.length || data.divisi_tersedia.some((item) => !item.nama.trim())) return "Tambahkan divisi dan isi nama setiap divisi.";
    if (!data.form_fields[3].options?.length) return "Isi minimal satu pilihan angkatan.";
    if (data.form_fields[3].options.some((option) => !/^(19|20)\d{2}$/.test(option.value))) return "Pilihan angkatan harus tahun empat digit, misalnya 2024.";
    if (data.form_fields.length > 40) return "Maksimal 40 kolom.";
    const names = new Set();
    for (const field of data.form_fields) {
      if (!field.label?.trim() || !/^[a-z][a-z0-9_]{0,49}$/.test(field.name) || names.has(field.name)) return "Setiap kolom membutuhkan label dan kode unik (huruf kecil, angka, garis bawah).";
      names.add(field.name);
      if (["select", "radio"].includes(field.type) && field.name !== "divisi_pilihan_1" && !field.options?.length) return `Isi pilihan untuk ${field.label}.`;
    }
    return "";
  };
  const save = async (nextStatus = data.status) => {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setBusy(true); setError("");
    const payload = {
      ...data, status: nextStatus, periode: data.periode.trim(), tanggal_buka: apiDate(data.tanggal_buka), tanggal_tutup: apiDate(data.tanggal_tutup),
      poster: data.poster.trim() || null, poster_alt: data.poster_alt.trim() || null,
      divisi_tersedia: data.divisi_tersedia.map((item) => ({ ...item, logo: item.logo.trim() || null, kuota: item.kuota === "" ? null : Number(item.kuota) })),
      form_fields: data.form_fields.map((field) => ({
        name: field.name, label: field.label.trim(), type: field.type, required: Boolean(field.required),
        help: field.help || null, placeholder: field.placeholder || null,
        ...(["select", "radio"].includes(field.type) ? { options: field.name === "divisi_pilihan_1" ? [] : field.options || [] } : {}),
        ...(field.type === "file" ? { accept: field.accept?.length ? field.accept : [".pdf", ".jpg", ".jpeg", ".png"], maxSizeMB: Number(field.maxSizeMB || 5) } : {}),
        ...(["text", "email", "tel", "textarea"].includes(field.type) ? { maxLength: Number(field.maxLength || (field.type === "textarea" ? 3000 : 255)) } : {}),
      })),
      pengumuman: { published: Boolean(data.pengumuman?.published), tanggal: data.pengumuman?.tanggal || null, pesan: data.pengumuman?.pesan || "" },
    };
    try {
      const response = oprecId ? await api.put(`/admin/oprec/${oprecId}`, payload) : await api.post("/admin/oprec", payload);
      setSaved(true); setData((current) => ({ ...current, status: nextStatus }));
      if (!oprecId) router.replace(`/admin/oprec/${response.data.data.id}/edit`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : err.message || "Gagal menyimpan formulir.");
    } finally { setBusy(false); }
  };

  if (loading) return <div className="oprec-builder__loading">Memuat formulir OPREC…</div>;
  return <div className="oprec-builder">
    <Link href="/admin/oprec" className="oprec-builder__back"><ArrowLeft aria-hidden="true" size={18} /> Kembali ke OPREC</Link>
    <header className="oprec-builder__hero">
      <div><span className="oprec-builder__eyebrow">// TAHAP 01 · PENDAFTARAN</span><h1>Susun formulir pendaftaran</h1><p>{data.headline || "Lengkapi pertanyaan yang akan dijawab calon anggota."}</p></div>
      <div className="oprec-builder__hero-actions"><button type="button" onClick={() => save(data.status)} disabled={busy} className="oprec-builder__save"><Save size={18} aria-hidden="true" />{busy ? "Menyimpan…" : "Simpan formulir"}</button>{data.status === "draft" && <button type="button" onClick={() => save("open")} disabled={busy} className="oprec-builder__publish">Terbitkan pendaftaran</button>}</div>
    </header>
    {error && <div className="oprec-builder__error" role="alert">{error}</div>}
    {saved && <div className="oprec-builder__success" role="status"><AnimatedCheckIcon size={18} active /> Pendaftaran tersimpan.</div>}
    <div className="oprec-builder__layout">
        <div className="oprec-builder__main">
          <section className="oprec-builder__card oprec-builder__summary"><div><span>// INFORMASI TAHAP</span><h2>{data.headline || "Pendaftaran"}</h2><p>{data.deskripsi || "Deskripsi belum diisi."}</p><small>Periode {data.periode} · {data.status === "draft" ? "Draft" : data.status === "open" ? "Terbit" : "Ditutup"}</small><button type="button" className="oprec-builder__edit-info" onClick={() => setShowInfo((value) => !value)} aria-expanded={showInfo}>{showInfo ? "Tutup informasi" : "Edit informasi tahap"}</button></div><label>Versi skema<input value={data.schema_version} onChange={(event) => set("schema_version", event.target.value)} maxLength={20} /><small>Naikkan versi jika pertanyaan berubah setelah ada pendaftar.</small></label></section>
          {showInfo && <section className="oprec-builder__card"><div className="oprec-builder__section-head"><span className="oprec-builder__number">01</span><div><h2>Informasi pendaftaran</h2><p>Perubahan tersimpan bersama formulir.</p></div></div><div className="oprec-builder__grid"><label>Periode <input value={data.periode} onChange={(event) => set("periode", event.target.value)} maxLength={40} /></label><label>Status <select value={data.status} onChange={(event) => set("status", event.target.value)}><option value="draft">Draft</option><option value="open">Terbit sesuai jadwal</option><option value="closed">Tutup pendaftaran</option></select></label><label>Tanggal mulai <input type="datetime-local" value={data.tanggal_buka} onChange={(event) => set("tanggal_buka", event.target.value)} /></label><label>Tanggal selesai <input type="datetime-local" value={data.tanggal_tutup} onChange={(event) => set("tanggal_tutup", event.target.value)} /></label><label className="wide">Headline <input value={data.headline} onChange={(event) => set("headline", event.target.value)} maxLength={300} /></label><label className="wide">Deskripsi <textarea rows={3} value={data.deskripsi} onChange={(event) => set("deskripsi", event.target.value)} maxLength={5000} /></label><label className="wide">URL poster <input value={data.poster} onChange={(event) => set("poster", event.target.value)} placeholder="https://..." /></label><label className="wide">Pengantar form <textarea rows={2} value={data.form_intro} onChange={(event) => set("form_intro", event.target.value)} maxLength={2000} /></label></div></section>}
          <section className="oprec-builder__card"><div className="oprec-builder__section-head"><span className="oprec-builder__number">02</span><div><h2>Divisi yang tersedia</h2><p>Nama dan logo tampil saat calon anggota memilih divisi.</p></div></div>
            <div className="oprec-builder__divisions">{data.divisi_tersedia.map((division, index) => <div className="oprec-builder__division" key={index}><div className="oprec-builder__division-head"><span className="oprec-builder__logo">{division.logo ? <img src={division.logo} alt="" /> : "//"}</span><strong>Divisi {index + 1}</strong><button type="button" aria-label={`Hapus divisi ${division.nama || index + 1}`} onClick={() => set("divisi_tersedia", data.divisi_tersedia.filter((_, i) => i !== index))}><Trash2 size={17} /></button></div><div className="oprec-builder__grid"><label>Nama singkat <input value={division.nama} onChange={(e) => setDivision(index, { nama: e.target.value })} maxLength={150} /></label><label>Nama lengkap <input value={division.nama_lengkap} onChange={(e) => setDivision(index, { nama_lengkap: e.target.value })} maxLength={200} /></label><label className="wide">URL logo <input type="url" value={division.logo} onChange={(e) => setDivision(index, { logo: e.target.value })} placeholder="https://... atau /images/divisi/..." /></label><label className="wide">Deskripsi singkat <input value={division.deskripsi} onChange={(e) => setDivision(index, { deskripsi: e.target.value })} maxLength={500} /></label><label>Kuota <input type="number" min="0" value={division.kuota} onChange={(e) => setDivision(index, { kuota: e.target.value })} placeholder="Tanpa batas" /></label></div></div>)}</div>
            <button type="button" className="oprec-builder__add" onClick={() => set("divisi_tersedia", [...data.divisi_tersedia, emptyDivision()])}><Plus size={17} aria-hidden="true" /> Tambah divisi</button>
          </section>
          <section className="oprec-builder__card"><div className="oprec-builder__section-head"><span className="oprec-builder__number">03</span><div><h2>Pertanyaan pendaftaran</h2><p>Lima pertanyaan pertama selalu ada. Tambahkan pertanyaan sesuai kebutuhan.</p></div></div>
            <div className="oprec-builder__fields">{data.form_fields.map((field, index) => <div key={field.name + index} className="oprec-builder__field"><div className="oprec-builder__field-head"><span className="oprec-builder__field-index">{String(index + 1).padStart(2, "0")}</span><strong>{field.label || "Pertanyaan baru"}</strong><span className="oprec-builder__field-tag">{index < fixed.length ? "WAJIB" : "TAMBAHAN"}</span>{index >= fixed.length && <div className="oprec-builder__field-actions"><button type="button" title="Naikkan" aria-label={`Naikkan ${field.label}`} onClick={() => moveField(index, -1)}>↑</button><button type="button" title="Turunkan" aria-label={`Turunkan ${field.label}`} onClick={() => moveField(index, 1)}>↓</button><button type="button" title="Hapus" aria-label={`Hapus ${field.label}`} onClick={() => removeField(index)}><Trash2 size={16} /></button></div>}</div>
              <div className="oprec-builder__grid"><label>Label <input value={field.label} onChange={(e) => setField(index, { label: e.target.value })} maxLength={200} /></label>{index >= fixed.length ? <label>Tipe <select value={field.type} onChange={(e) => setField(index, { type: e.target.value, options: ["select", "radio"].includes(e.target.value) ? [] : undefined })}>{fieldTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : <label>Tipe <input value={fieldTypes.find(([type]) => type === field.type)?.[1] || field.type} disabled /></label>}
              {index >= fixed.length && <label>Kode kolom <input value={field.name} onChange={(e) => setField(index, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} maxLength={50} /></label>}
              {field.name === "angkatan" && <label className="wide">Pilihan angkatan <textarea rows={4} value={fromOptions(field.options)} onChange={(e) => setField(index, { options: toOptions(e.target.value) })} placeholder={"2024\n2025\n2026"} /><small>Satu tahun per baris. NIM tetap disimpan sebagai teks.</small></label>}
              {["select", "radio"].includes(field.type) && field.name !== "angkatan" && field.name !== "divisi_pilihan_1" && <label className="wide">Pilihan <textarea rows={3} value={fromOptions(field.options)} onChange={(e) => setField(index, { options: toOptions(e.target.value) })} placeholder={"Pilihan A\nPilihan B"} /></label>}
              {field.name === "divisi_pilihan_1" && <p className="oprec-builder__hint wide">Pilihan diambil otomatis dari daftar divisi di atas, lengkap dengan logo.</p>}
              <label className="wide">Petunjuk (opsional) <input value={field.help || ""} onChange={(e) => setField(index, { help: e.target.value })} maxLength={500} /></label>
              {index >= fixed.length && <label className="oprec-builder__check"><input type="checkbox" checked={Boolean(field.required)} onChange={(e) => setField(index, { required: e.target.checked })} /> Wajib diisi</label>}
              </div></div>)}</div>
            <button type="button" className="oprec-builder__add" onClick={() => set("form_fields", [...data.form_fields, newField(Date.now())])} disabled={data.form_fields.length >= 40}><Plus size={17} aria-hidden="true" /> Tambah pertanyaan</button>
          </section>
        </div>
        <aside className="oprec-builder__aside"><div className="oprec-builder__preview"><span>// PRATINJAU FORM</span><h2>Siap bergabung?</h2><p>{data.form_intro || "Isi data dengan teliti. Kolom bertanda * wajib diisi."}</p>{data.form_fields.map((field) => <div key={field.name} className="oprec-builder__preview-row"><strong>{field.label || "Pertanyaan baru"}{field.required && " *"}</strong><span>{field.name === "divisi_pilihan_1" ? `${data.divisi_tersedia.length} divisi tersedia` : field.type === "select" ? `${field.options?.length || 0} pilihan` : fieldTypes.find(([type]) => type === field.type)?.[1]}</span></div>)}</div></aside>
      </div>
  </div>;
}
