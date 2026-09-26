"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { X, UploadCloud } from "lucide-react";
import { CalendarPlusIcon } from "@/components/ui/CalendarPlusIcon";
import { AnimatedCheckIcon } from "@/components/ui/AnimatedCheckIcon";
import { api } from "@/services/api";
import { divisionPreview } from "@/components/oprec/divisionPreview";
import "./oprec-create-dialog.css";

const firstFields = [
  { name: "nama", label: "Nama lengkap", type: "text", required: true, maxLength: 150 },
  { name: "nim", label: "NIM", type: "text", required: true, maxLength: 32 },
  { name: "tanggal_lahir", label: "Tanggal lahir", type: "date", required: true },
  { name: "angkatan", label: "Angkatan", type: "select", required: true, options: [] },
  { name: "divisi_pilihan_1", label: "Divisi pilihan", type: "select", required: true, options: [] },
];
const initial = { type: "", periode: "", headline: "", deskripsi: "", tanggal_buka: "", tanggal_tutup: "", poster: "", published: false };
const dateTime = (value) => value ? new Date(`${value}:00+07:00`).toISOString() : null;

function TestIcon({ active = false }) {
  const reduced = useReducedMotion();
  return <motion.svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" initial={false} animate={reduced ? "rest" : active ? "draw" : "rest"}>
    <motion.path d="M8 3h8l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3Z" variants={{ rest: { pathLength: 1 }, draw: { pathLength: [0, 1] } }} transition={{ duration: .5 }} />
    <motion.path d="M8 11h8M8 15h6" variants={{ rest: { pathLength: 1 }, draw: { pathLength: [0, 1] } }} transition={{ duration: .35, delay: .15 }} />
  </motion.svg>;
}

export default function OprecCreateDialog({ open, onClose, onCreated, selectedOprec, editingStage = null, initialType = "" }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [hoveredType, setHoveredType] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const stage = editingStage;
    setData(stage ? {
      type: stage.type, periode: selectedOprec?.periode || "", headline: stage.headline || "", deskripsi: stage.deskripsi || "",
      tanggal_buka: stage.tanggalBuka ? new Date(stage.tanggalBuka).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(" ", "T").slice(0, 16) : "",
      tanggal_tutup: stage.tanggalTutup ? new Date(stage.tanggalTutup).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(" ", "T").slice(0, 16) : "",
      poster: stage.poster || "", published: Boolean(stage.published),
    } : { ...initial, type: initialType });
    setPosterFile(null); setPosterPreview(""); setError("");
  }, [open, editingStage, selectedOprec, initialType]);
  useEffect(() => () => { if (posterPreview) URL.revokeObjectURL(posterPreview); }, [posterPreview]);
  useEffect(() => {
    if (!open) return;
    const keydown = (event) => { if (event.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [open, busy, onClose]);
  if (!open) return null;
  const set = (key, value) => setData((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!data.type) { setError("Pilih jenis tahap terlebih dahulu."); return; }
    if (data.type !== "pendaftaran" && !selectedOprec) { setError("Buat pendaftaran periode terlebih dahulu sebelum menambah tahap berikutnya."); return; }
    if (!data.headline.trim() || !data.tanggal_buka) { setError("Isi headline dan tanggal tahap."); return; }
    if (data.type !== "pengumuman" && (!data.tanggal_tutup || Date.parse(data.tanggal_tutup) <= Date.parse(data.tanggal_buka))) { setError("Tanggal selesai harus setelah tanggal mulai."); return; }
    if (data.type === "pendaftaran" && !data.periode.trim()) { setError("Isi periode kepengurusan."); return; }
    setBusy(true); setError("");
    try {
      let poster = data.poster.trim() || null;
      if (posterFile) {
        const body = new FormData(); body.set("poster", posterFile);
        const response = await api.post("/admin/oprec/upload-poster", body, { headers: { "Content-Type": "multipart/form-data" } });
        poster = response.data?.url;
        if (!poster) throw new Error("Poster gagal diunggah.");
      }
      if (data.type === "pendaftaran") {
        const response = await api.post("/admin/oprec", {
          periode: data.periode.trim(), status: "draft", headline: data.headline.trim(), deskripsi: data.deskripsi.trim(), poster,
          tanggal_buka: dateTime(data.tanggal_buka), tanggal_tutup: dateTime(data.tanggal_tutup),
          schema_version: "1", form_intro: "", form_fields: firstFields,
          divisi_tersedia: divisionPreview.map((item) => ({ nama: item.nama, nama_lengkap: item.namaLengkap, deskripsi: item.deskripsi, logo: item.logo || null, kuota: null })),
          faq: [], pengumuman: { published: false, tanggal: null, pesan: "" },
        });
        onClose(); router.push(`/admin/oprec/${response.data.data.id}/edit`);
      } else {
        const payload = { type: data.type, headline: data.headline.trim(), deskripsi: data.deskripsi.trim(), poster,
          tanggal_buka: dateTime(data.tanggal_buka), tanggal_tutup: dateTime(data.tanggal_tutup), published: data.type === "pengumuman" ? Boolean(data.published) : Boolean(editingStage?.published) };
        const response = editingStage
          ? await api.put(`/admin/oprec/${selectedOprec.id}/stages/${editingStage.id}`, payload)
          : await api.post(`/admin/oprec/${selectedOprec.id}/stages`, payload);
        onCreated?.(); onClose();
        if (data.type === "test_tulis" && !editingStage) router.push(`/admin/oprec/${selectedOprec.id}/stages/${response.data.data.id}/form`);
      }
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : err.message || "Tahap belum berhasil disimpan.");
    } finally { setBusy(false); }
  };
  return <div className="oprec-dialog__overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="oprec-dialog" role="dialog" aria-modal="true" aria-labelledby="oprec-dialog-title">
      <header className="oprec-dialog__header"><div><span>// TAHAP OPREC</span><h2 id="oprec-dialog-title">{editingStage ? "Edit informasi tahap" : data.type ? `Tambah ${data.type === "test_tulis" ? "tes tulis" : data.type}` : "Tambah tahap baru"}</h2><p>{data.type ? "Isi informasi utama terlebih dahulu. Pendaftaran berlanjut ke penyusun formulir." : "Pilih tahap yang akan ditambahkan ke periode OPREC."}</p></div><button type="button" onClick={onClose} disabled={busy} aria-label="Tutup popup"><X size={20} /></button></header>
      {!data.type ? <div className="oprec-dialog__types">
        <button type="button" onClick={() => set("type", "pendaftaran")}><span className="oprec-dialog__type-icon"><CalendarPlusIcon size={28} loopDelay={2200} /></span><strong>Pendaftaran</strong><small>Buat periode baru, lalu susun form calon anggota.</small></button>
        <button type="button" onMouseEnter={() => setHoveredType("test_tulis")} onMouseLeave={() => setHoveredType("")} onFocus={() => setHoveredType("test_tulis")} onBlur={() => setHoveredType("")} onClick={() => set("type", "test_tulis")} disabled={!selectedOprec}><span className="oprec-dialog__type-icon"><TestIcon active={hoveredType === "test_tulis"} /></span><strong>Tes tulis</strong><small>Tambahkan tahap tes pada periode yang dipilih.</small></button>
        <button type="button" onClick={() => set("type", "pengumuman")} disabled={!selectedOprec}><span className="oprec-dialog__type-icon"><AnimatedCheckIcon size={28} active /></span><strong>Pengumuman</strong><small>Atur waktu dan pesan hasil seleksi.</small></button>
      </div> : <form onSubmit={submit} className="oprec-dialog__form">
        {error && <div className="oprec-dialog__error" role="alert">{error}</div>}
        {data.type !== "pendaftaran" && <p className="oprec-dialog__context">Periode: <strong>{selectedOprec?.periode || "Belum ada pendaftaran"}</strong></p>}
        {data.type === "pendaftaran" && <label>Periode kepengurusan <input autoFocus required value={data.periode} onChange={(event) => set("periode", event.target.value)} placeholder="2026/2027" maxLength={40} /></label>}
        <label>Headline <input autoFocus={data.type !== "pendaftaran"} required value={data.headline} onChange={(event) => set("headline", event.target.value)} placeholder={data.type === "pendaftaran" ? "Saatnya menjadi bagian dari HIMANIKA" : "Judul tahap yang akan tampil di kartu"} maxLength={300} /></label>
        <div className="oprec-dialog__dates"><label>{data.type === "pengumuman" ? "Tanggal pengumuman" : "Tanggal mulai"}<input required type="datetime-local" value={data.tanggal_buka} onChange={(event) => set("tanggal_buka", event.target.value)} /></label>{data.type !== "pengumuman" && <label>Tanggal selesai<input required type="datetime-local" value={data.tanggal_tutup} onChange={(event) => set("tanggal_tutup", event.target.value)} /></label>}</div>
        <label>Deskripsi <textarea rows={4} value={data.deskripsi} onChange={(event) => set("deskripsi", event.target.value)} placeholder="Ceritakan tahap ini dengan singkat dan jelas." maxLength={5000} /></label>
        {data.type === "pengumuman" && <label className="oprec-dialog__publish"><input type="checkbox" checked={Boolean(data.published)} onChange={(event) => set("published", event.target.checked)} /> Terbitkan pengumuman sesuai tanggal yang dipilih</label>}
        <label className="oprec-dialog__poster">Poster / pamflet <span className="oprec-dialog__upload">{posterPreview || data.poster ? <img src={posterPreview || data.poster} alt="Pratinjau poster" /> : <UploadCloud size={30} aria-hidden="true" />}<span><strong>{posterFile ? posterFile.name : data.poster ? "Ganti poster" : "Pilih poster"}</strong><small>JPG, PNG, atau WebP · maksimal 5 MB</small></span></span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Poster harus JPG, PNG, atau WebP maksimal 5 MB."); return; } setPosterFile(file); setPosterPreview(URL.createObjectURL(file)); setError(""); }} /></label>
        <footer><button type="button" onClick={onClose} disabled={busy}>Batal</button><button type="submit" disabled={busy}>{busy ? "Menyimpan…" : editingStage ? "Simpan perubahan" : data.type === "pendaftaran" ? "Buat & lanjut ke formulir" : "Simpan tahap"}</button></footer>
      </form>}
    </div>
  </div>;
}
