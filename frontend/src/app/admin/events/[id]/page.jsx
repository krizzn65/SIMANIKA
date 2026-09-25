"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, ChevronUp, Eye, Plus, Save, Send, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import "../event-builder.css";

const TYPES = [
  ["text", "Isian singkat"], ["textarea", "Paragraf"], ["email", "Email"],
  ["tel", "Nomor telepon"], ["number", "Angka"], ["date", "Tanggal"],
  ["select", "Dropdown"], ["radio", "Pilihan ganda"],
  ["checkbox", "Centang persetujuan"], ["file", "Upload berkas"],
];
const CHOICES = new Set(["select", "radio"]);
const wideTypes = new Set(["textarea", "file", "radio", "checkbox"]);
const editorKey = () => Math.random().toString(36).slice(2);

function newField(type) {
  const key = editorKey();
  return { editorId: key, name: `field_${Date.now().toString(36)}${key.slice(0, 4)}`,
    type, label: "", help: "", placeholder: "", required: false,
    options: CHOICES.has(type) ? [{ value: "pilihan_1", label: "Pilihan 1" }] : [] };
}

function newGroup(scope = "personal") {
  return { editorId: editorKey(), title: "", scope, editRole: scope === "team" ? "leader" : "all",
    fields: [], collapsed: false };
}

function hydrateGroup(group) {
  return { ...group, editorId: editorKey(), collapsed: false,
    fields: (group.fields || []).map((field) => ({ ...field, editorId: editorKey() })) };
}

function PreviewInput({ field }) {
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
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/events/${id}`).then(({ data }) => {
      const item = data?.data;
      if (!item) throw new Error("Event tidak ditemukan.");
      setEvent(item);
      if (item.formGroups?.length) setGroups(item.formGroups.map(hydrateGroup));
      else if (item.formFields?.length) setGroups([hydrateGroup({ title: "Formulir utama", scope: item.tipePendaftaran === "tim" ? "team" : "personal", editRole: item.tipePendaftaran === "tim" ? "leader" : "all", fields: item.formFields })]);
    }).catch((err) => setError(err.message || "Gagal memuat event."))
      .finally(() => setLoading(false));
  }, [id]);

  const locked = Boolean(event?.registrations_count || event?.teams_count || event?.enrollments_count);
  const count = groups.reduce((total, group) => total + group.fields.length, 0);
  const markChanged = () => { setDirty(true); setNotice(""); setError(""); };
  function editGroup(groupIndex, update) {
    setGroups((current) => current.map((group, index) => index === groupIndex ? { ...group, ...update } : group));
    markChanged();
  }
  function editField(groupIndex, fieldIndex, update) {
    setGroups((current) => current.map((group, index) => index !== groupIndex ? group : {
      ...group, fields: group.fields.map((field, position) => position === fieldIndex ? { ...field, ...update } : field),
    }));
    markChanged();
  }
  function moveGroup(index, step) {
    setGroups((current) => { const next = [...current]; [next[index], next[index + step]] = [next[index + step], next[index]]; return next; });
    markChanged();
  }
  function moveField(groupIndex, index, step) {
    setGroups((current) => current.map((group, position) => {
      if (position !== groupIndex) return group;
      const fields = [...group.fields];
      [fields[index], fields[index + step]] = [fields[index + step], fields[index]];
      return { ...group, fields };
    }));
    markChanged();
  }
  function addField(groupIndex, type) {
    if (count >= 40) { setError("Maksimal 40 pertanyaan untuk satu event."); return; }
    setGroups((current) => current.map((group, index) => index === groupIndex
      ? { ...group, collapsed: false, fields: [...group.fields, newField(type)] } : group));
    markChanged();
  }
  function validate() {
    if (!groups.length) return "Tambahkan minimal satu grup.";
    if (groups.length > 20) return "Maksimal 20 grup untuk satu event.";
    if (groups.some((group) => !group.title.trim())) return "Setiap grup perlu nama.";
    if (groups.some((group) => !group.fields.length)) return "Setiap grup perlu minimal satu pertanyaan.";
    if (groups.some((group) => group.fields.some((field) => !field.label.trim()))) return "Setiap pertanyaan perlu label.";
    if (count > 40) return "Maksimal 40 pertanyaan untuk satu event.";
    if (groups.some((group) => group.fields.some((field) => CHOICES.has(field.type) && (!field.options.length || field.options.some((option) => !option.label.trim()))))) return "Lengkapi opsi pilihan pada setiap pertanyaan.";
    return "";
  }
  async function saveForm() {
    const message = validate();
    if (message) { setError(message); return false; }
    setPending(true); setError(""); setNotice("");
    try {
      const payload = groups.map((group) => ({
        title: group.title.trim(), scope: group.scope,
        edit_role: group.scope === "team" ? group.editRole : "all",
        fields: group.fields.map((field) => ({
          name: field.name, label: field.label.trim(), type: field.type, required: Boolean(field.required),
          help: (field.help || "").trim(), placeholder: (field.placeholder || "").trim(),
          options: CHOICES.has(field.type) ? field.options : [],
        })),
      }));
      const { data } = await api.put(`/admin/events/${id}/form`, { form_groups: payload });
      setGroups((data.data.formGroups || []).map(hydrateGroup));
      setDirty(false);
      setNotice("Grup formulir berhasil disimpan.");
      return true;
    } catch (err) { setError(err.message || "Gagal menyimpan formulir."); return false; }
    finally { setPending(false); }
  }
  async function publish() {
    if (!(await saveForm())) return;
    setPending(true);
    try {
      const { data } = await api.post(`/admin/events/${id}/publish`);
      setEvent(data.data);
      setNotice("Event berhasil dipublikasikan.");
      router.refresh();
    } catch (err) { setError(err.message || "Event belum dapat dipublikasikan."); }
    finally { setPending(false); }
  }

  if (loading) return <div className="admin-card admin-card-body" role="status">Memuat editor event…</div>;
  if (!event) return <div className="admin-card admin-card-body" role="alert">{error || "Event tidak ditemukan."} <Link href="/admin/events">Kembali ke daftar</Link></div>;

  return <div className="event-builder event-builder--groups">
    <header className="event-builder-header">
      <Link href="/admin/events" className="event-builder-back"><ArrowLeft size={17} /> Semua event</Link>
      <div className="event-builder-title"><div><span className="event-builder-eyebrow">SIMANIKA / FORMULIR EVENT</span><h1>{event.judul}</h1><p>Susun grup sesuai tahap event, lalu tentukan siapa yang dapat melihat dan mengisi tiap grup.</p></div><span className={`admin-badge admin-badge--${event.status}`}>{event.status.toUpperCase()}</span></div>
      <div className="event-builder-actions">
        <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setPreview((value) => !value)}><Eye size={16} /> {preview ? "Tutup pratinjau" : "Pratinjau"}</button>
        <button type="button" className="admin-btn admin-btn--secondary" disabled={pending || locked || !dirty} onClick={saveForm}><Save size={16} /> Simpan draft</button>
        {event.status === "draft" && <button type="button" className="admin-btn admin-btn--primary" disabled={pending || locked || !count} onClick={publish}><Send size={16} /> Publikasikan</button>}
      </div>
      {locked && <p className="event-builder-note">Formulir dikunci karena event sudah memiliki pendaftar. Jawaban peserta tetap terjaga.</p>}
      {error && <p className="event-builder-error" role="alert">{error}</p>}
      {notice && <p className="event-builder-success" role="status">{notice}</p>}
    </header>

    <div className={`event-builder-grid${preview ? "" : " event-builder-grid--single"}`}>
      <main className="event-builder-canvas">
        {!groups.length && <div className="event-builder-empty"><span>MULAI DI SINI</span><h2>Belum ada grup formulir</h2><p>Tambahkan grup data pribadi atau tugas tim. Setiap grup memiliki pertanyaan dan aturan akses sendiri.</p></div>}
        {groups.map((group, groupIndex) => <section className="event-builder-group" key={group.editorId} aria-label={`Grup ${groupIndex + 1}`}>
          <div className="event-builder-group-head">
            <span className="event-builder-number">{String(groupIndex + 1).padStart(2, "0")}</span>
            <div className="event-builder-group-summary"><h2>{group.title || "Grup baru"}</h2><p>{group.scope === "personal" ? "Pribadi · diisi masing-masing peserta" : `Tim · ${group.editRole === "leader" ? "ketua mengisi" : "semua anggota dapat mengisi"}`} · {group.fields.length} pertanyaan</p></div>
            <div className="event-builder-field-actions">
              <button type="button" aria-label={`Pindah grup ${groupIndex + 1} ke atas`} disabled={locked || groupIndex === 0} onClick={() => moveGroup(groupIndex, -1)}><ArrowUp size={16} /></button>
              <button type="button" aria-label={`Pindah grup ${groupIndex + 1} ke bawah`} disabled={locked || groupIndex === groups.length - 1} onClick={() => moveGroup(groupIndex, 1)}><ArrowDown size={16} /></button>
              <button type="button" aria-label={`Hapus grup ${groupIndex + 1}`} disabled={locked} onClick={() => { setGroups((current) => current.filter((_, index) => index !== groupIndex)); markChanged(); }}><Trash2 size={16} /></button>
              <button type="button" aria-expanded={!group.collapsed} aria-controls={`event-group-${group.editorId}`} aria-label={`${group.collapsed ? "Buka" : "Lipat"} grup ${group.title || groupIndex + 1}`} onClick={() => setGroups((current) => current.map((item, index) => index === groupIndex ? { ...item, collapsed: !item.collapsed } : item))}>{group.collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
            </div>
          </div>
          {!group.collapsed && <div className="event-builder-group-body" id={`event-group-${group.editorId}`}>
            <label className="event-builder-group-label">Nama grup<input value={group.title} disabled={locked} maxLength={150} placeholder="Contoh: Data administrasi / Pengumpulan proposal" onChange={(e) => editGroup(groupIndex, { title: e.target.value })} /></label>
            <div className="event-builder-two">
              <label className="event-builder-group-label">Siapa yang dapat melihat?<select value={group.scope} disabled={locked || event.tipePendaftaran !== "tim"} onChange={(e) => editGroup(groupIndex, { scope: e.target.value, editRole: e.target.value === "personal" ? "all" : "leader" })}><option value="personal">Pribadi · hanya jawaban sendiri</option>{event.tipePendaftaran === "tim" && <option value="team">Tim · jawaban dilihat semua anggota</option>}</select></label>
              {group.scope === "team" && <label className="event-builder-group-label">Siapa yang boleh mengisi/mengubah?<select value={group.editRole} disabled={locked} onChange={(e) => editGroup(groupIndex, { editRole: e.target.value })}><option value="leader">Hanya ketua</option><option value="all">Semua anggota</option></select></label>}
            </div>
            <p className="event-builder-group-help">{group.scope === "personal" ? "Setiap anggota mengirim grup ini sendiri. Anggota lain, termasuk ketua, tidak dapat melihat jawabannya." : "Satu jawaban untuk tim. Semua anggota yang disetujui dapat melihat hasilnya."}</p>
            <div className="event-builder-group-fields">
              {group.fields.map((field, fieldIndex) => <section className="event-builder-field" key={field.editorId} aria-label={`Pertanyaan ${fieldIndex + 1}`}>
                <div className="event-builder-field-head"><span className="event-builder-number">{fieldIndex + 1}</span><h3>{field.label || TYPES.find(([type]) => type === field.type)?.[1]}</h3><div className="event-builder-field-actions">
                  <button type="button" aria-label="Pindah pertanyaan ke atas" disabled={locked || fieldIndex === 0} onClick={() => moveField(groupIndex, fieldIndex, -1)}><ArrowUp size={16} /></button>
                  <button type="button" aria-label="Pindah pertanyaan ke bawah" disabled={locked || fieldIndex === group.fields.length - 1} onClick={() => moveField(groupIndex, fieldIndex, 1)}><ArrowDown size={16} /></button>
                  <button type="button" aria-label="Hapus pertanyaan" disabled={locked} onClick={() => editGroup(groupIndex, { fields: group.fields.filter((_, index) => index !== fieldIndex) })}><Trash2 size={16} /></button>
                </div></div>
                <div className="event-builder-field-body">
                  <label>Pertanyaan / label <span>*</span><input value={field.label} disabled={locked} maxLength={200} onChange={(e) => editField(groupIndex, fieldIndex, { label: e.target.value })} placeholder="Contoh: Nama lengkap, bukti twibbon" /></label>
                  <div className="event-builder-two"><label>Jenis isian<select value={field.type} disabled={locked} onChange={(e) => editField(groupIndex, fieldIndex, { type: e.target.value, options: CHOICES.has(e.target.value) ? [{ value: "pilihan_1", label: "Pilihan 1" }] : [] })}>{TYPES.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></label><label>Teks bantuan<input value={field.help || ""} disabled={locked} maxLength={500} onChange={(e) => editField(groupIndex, fieldIndex, { help: e.target.value })} placeholder="Opsional" /></label></div>
                  {!wideTypes.has(field.type) && field.type !== "select" && <label>Placeholder<input value={field.placeholder || ""} disabled={locked} maxLength={250} onChange={(e) => editField(groupIndex, fieldIndex, { placeholder: e.target.value })} placeholder="Contoh jawaban" /></label>}
                  {CHOICES.has(field.type) && <div className="event-builder-options"><span>Opsi pilihan</span>{field.options.map((option, optionIndex) => <div key={optionIndex}><input aria-label={`Pilihan ${optionIndex + 1}`} value={option.label} disabled={locked} maxLength={150} onChange={(e) => editField(groupIndex, fieldIndex, { options: field.options.map((item, index) => index === optionIndex ? { ...item, label: e.target.value } : item) })} /><button type="button" disabled={locked || field.options.length === 1} aria-label={`Hapus pilihan ${optionIndex + 1}`} onClick={() => editField(groupIndex, fieldIndex, { options: field.options.filter((_, index) => index !== optionIndex).map((item, index) => ({ ...item, value: `pilihan_${index + 1}` })) })}><Trash2 size={16} /></button></div>)}<button type="button" disabled={locked} onClick={() => editField(groupIndex, fieldIndex, { options: [...field.options, { value: `pilihan_${field.options.length + 1}`, label: `Pilihan ${field.options.length + 1}` }] })}><Plus size={16} /> Tambah pilihan</button></div>}
                  {field.type === "file" && <p className="event-builder-hint">PDF, JPG, PNG, WebP · maksimal 5 MB. Berkas tersimpan privat.</p>}
                  <label className="event-builder-required"><input type="checkbox" checked={Boolean(field.required)} disabled={locked} onChange={(e) => editField(groupIndex, fieldIndex, { required: e.target.checked })} /> Wajib diisi</label>
                </div>
              </section>)}
            </div>
            {!locked && <div className="event-builder-add"><p>Tambah pertanyaan ke grup ini</p><div>{TYPES.map(([type, label]) => <button type="button" key={type} onClick={() => addField(groupIndex, type)}><Plus size={15} /> {label}</button>)}</div></div>}
          </div>}
        </section>)}
        {!locked && <button type="button" className="event-builder-add-group" disabled={groups.length >= 20} onClick={() => { setGroups((current) => [...current, newGroup()]); markChanged(); }}><Plus size={18} /> Tambah grup formulir</button>}
      </main>
      {preview && <aside className="event-builder-preview" aria-label="Pratinjau formulir peserta"><header className="event-builder-preview-header"><span className="event-builder-eyebrow">PRATINJAU PESERTA</span><h2>{event.judul}</h2><p>Susunan grup dan pertanyaan yang tampil di dashboard peserta.</p></header>
        {!groups.length && <div className="event-builder-preview-empty">Grup yang ditambahkan akan tampil di sini.</div>}
        {groups.map((group) => <section className="event-builder-preview-group" key={group.editorId}><div className="event-builder-preview-group-head"><h3>{group.title || "Grup baru"}</h3><small>{group.scope === "personal" ? "Pribadi · diisi masing-masing" : group.editRole === "leader" ? "Tim · diisi ketua" : "Tim · dapat diisi semua anggota"}</small></div><div className="event-builder-preview-fields">{group.fields.map((field) => <div className={`event-builder-preview-field${wideTypes.has(field.type) ? " event-builder-preview-field--wide" : ""}`} key={field.editorId}><label>{field.label || "Pertanyaan baru"} {field.required && <b>*</b>}</label>{field.help && <small>{field.help}</small>}<PreviewInput field={field} /></div>)}</div><div className="event-builder-preview-footer"><button type="button" disabled className="admin-btn admin-btn--primary">Kirim</button></div></section>)}
      </aside>}
    </div>
  </div>;
}
