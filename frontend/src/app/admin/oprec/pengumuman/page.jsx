"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, LoaderCircle, Megaphone, Pencil, Plus, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Button, Card, Input, Modal, Select, Table, Textarea } from "@/components/oprec/announcement/Primitives";
import { formatAnnouncementDate, fromWibInput, toWibInput } from "@/lib/oprecAnnouncement.mjs";
import { optimizeOprecImage } from "@/lib/optimizeOprecImage";

const message = (error) => Object.values(error.response?.data?.errors || {}).flat()[0] || error.response?.data?.message || error.message || "Data belum dapat dimuat.";

function AnnouncementEditor({ data, onClose, onSaved, triggerRef }) {
  const current = data.announcement;
  const [form, setForm] = useState({ title: current.title, description: current.description, release_at: toWibInput(current.release_at), whatsapp_url: current.whatsapp_url });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(current.poster_url);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!file) { setPreview(current.poster_url); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, current.poster_url]);
  async function save(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const body = new FormData();
      body.set("title", form.title.trim()); body.set("description", form.description.trim());
      body.set("release_at", fromWibInput(form.release_at)); body.set("whatsapp_url", form.whatsapp_url.trim());
      if (file) body.set("poster", await optimizeOprecImage(file));
      await api.post(`/admin/oprec/${data.period.id}/announcement`, body);
      toast.success(current.exists ? "Pengumuman berhasil diperbarui." : "Pengumuman berhasil dijadwalkan.", { position: "top-center" });
      onSaved();
    } catch (cause) { setError(message(cause)); }
    finally { lock.current = false; setBusy(false); }
  }
  const change = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));
  return <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title={current.exists ? "Ubah pengumuman" : "Buat pengumuman"}
    description={`Periode ${data.period.periode}. Hasil akan terbuka otomatis sesuai jadwal.`} busy={busy} triggerRef={triggerRef}>
    <form onSubmit={save} aria-busy={busy}>
      <div className="oa-dialog-body oa-form">
        <label className="oa-field">Judul pengumuman <Input value={form.title} onChange={change("title")} maxLength={200} required disabled={busy} /></label>
        <label className="oa-field">Poster <Input type="file" accept="image/jpeg,image/png,image/webp" required={!current.poster_url} disabled={busy} onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected && (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 5 * 1024 * 1024)) { setError("Gunakan JPG, PNG, atau WebP maksimal 5 MB."); event.target.value = ""; setFile(null); return; }
          setError(""); setFile(selected || null);
        }} /><small>JPG, PNG, atau WebP · maksimal 5 MB. Gambar besar dioptimalkan otomatis. Poster hanya tampil pada kartu pengumuman.</small></label>
        {preview && <img className="oa-file-preview" src={preview} alt="Pratinjau poster pengumuman" />}
        <label className="oa-field">Tanggal dan jam rilis (WIB)<Input type="datetime-local" value={form.release_at} onChange={change("release_at")} required disabled={busy} /><small>Gunakan waktu Indonesia Barat (UTC+7).</small></label>
        <label className="oa-field">Deskripsi <Textarea value={form.description} onChange={change("description")} maxLength={2000} required disabled={busy} /></label>
        <label className="oa-field">Tautan grup WhatsApp <Input type="url" value={form.whatsapp_url} onChange={change("whatsapp_url")} placeholder="https://chat.whatsapp.com/…" maxLength={500} required disabled={busy} /><small>Hanya ditampilkan kepada peserta yang diterima setelah pengumuman dibuka.</small></label>
        <div className="oa-notice">Setelah dijadwalkan, nilai dan keputusan peserta terkunci. Informasi pengumuman masih dapat diperbaiki sebelum waktu rilis.</div>
        {error && <p className="oa-error" role="alert">{error}</p>}
      </div>
      <footer className="oa-dialog-footer"><Button variant="outline" disabled={busy} onClick={onClose}>Batal</Button><Button type="submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="oa-spin" /> : <Upload size={16} />}{busy ? "Menyimpan…" : current.exists ? "Simpan perubahan" : "Jadwalkan pengumuman"}</Button></footer>
    </form>
  </Modal>;
}

export default function AdminAnnouncementsPage() {
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(false);
  const trigger = useRef(null);
  const reload = useCallback(() => setRefresh((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    api.get("/admin/oprec/announcements", { signal: controller.signal }).then((response) => {
      if (controller.signal.aborted) return;
      const rows = response.data.data || []; setPeriods(rows); setCanManage(response.data.can_manage === true);
      setPeriodId((old) => rows.some((row) => String(row.id) === old) ? old : String(rows[0]?.id || ""));
      if (!rows.length) setLoading(false);
    }).catch((cause) => { if (!controller.signal.aborted) { setError(message(cause)); setLoading(false); } });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    if (!periodId) return;
    const controller = new AbortController(); setLoading(true); setError("");
    api.get(`/admin/oprec/${periodId}/announcement`, { params: { page }, signal: controller.signal }).then((response) => {
      if (controller.signal.aborted) return;
      if (page > response.data.participants.last_page) { setPage(response.data.participants.last_page); return; }
      setData(response.data);
    }).catch((cause) => { if (!controller.signal.aborted) setError(message(cause)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [periodId, page, refresh]);
  const current = data?.period.id === Number(periodId) ? data : null;
  const announcement = current?.announcement;
  const participants = current?.participants;
  const blocked = !current || loading || Boolean(error) || announcement.released || current.blockers.length > 0;
  return <div className="oa-page">
    <header className="oa-page-header"><div><h1>Kelola Pengumuman OPREC</h1><p className="oa-muted">Jadwalkan hasil seleksi dan lihat susunan peserta yang diterima.</p></div>
      <div className="oa-actions">{canManage && <Button ref={trigger} disabled={blocked} onClick={() => setEditor(true)}>{announcement?.exists ? <Pencil size={16} /> : <Plus size={16} />}{announcement?.exists ? "Ubah pengumuman" : "Buat pengumuman"}</Button>}<Button variant="outline" disabled={loading} onClick={reload}><RefreshCw size={16} />Segarkan</Button></div></header>
    {periods.length > 0 && <div className="oa-period-picker"><label htmlFor="announcement-period">Periode OPREC</label><Select id="announcement-period" value={periodId} onChange={(e) => { setPeriodId(e.target.value); setPage(1); setData(null); setEditor(false); }}>{periods.map((period) => <option key={period.id} value={period.id}>{period.periode}</option>)}</Select></div>}
    {error && <p className="oa-error" role="alert">{error} <button type="button" onClick={reload}>Coba lagi</button></p>}
    {!current && loading ? <Card><div className="oa-skeleton" role="status" aria-label="Memuat pengumuman" /></Card> : !periodId && !error ? <Card><div className="oa-state">Belum ada periode OPREC. Buat pendaftaran terlebih dahulu.</div></Card> : null}
    {current && <>
      {announcement.exists ? <Card><header className="oa-card-header"><span className="oa-eyebrow">OPREC · Periode {current.period.periode}</span><span className={`oa-badge ${announcement.released ? "oa-badge--live" : ""}`}>{announcement.released ? "Sudah dirilis" : "Terjadwal"}</span></header><div className="oa-card-body oa-summary">{announcement.poster_url && <img className="oa-card-poster" src={announcement.poster_url} alt="Poster pengumuman" />}<div className="oa-summary-content"><h2>{announcement.title}</h2><p className="oa-muted"><CalendarDays size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> {formatAnnouncementDate(announcement.release_at)}</p><p className="oa-muted">{announcement.description}</p></div></div></Card>
        : <Card><div className="oa-card-body"><h2><Megaphone size={19} style={{ display: "inline", verticalAlign: "-3px", marginRight: 8 }} />Pengumuman belum dibuat</h2><p className="oa-muted">Selesaikan tahap seleksi, lalu tentukan waktu peserta dapat melihat hasilnya.</p>{current.blockers.length > 0 && <div className="oa-notice" style={{ marginTop: 16 }}><strong>Persiapan yang perlu diselesaikan</strong><ul>{current.blockers.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>}</div></Card>}
      {current.can_read_participants === false ? <Card><div className="oa-notice">Mode hanya baca. Daftar peserta tersedia setelah kamu ditugaskan sebagai penilai pada periode ini.</div></Card> : <Card aria-busy={loading}><header className="oa-card-header"><div><h2>Peserta Diterima</h2><p className="oa-muted">Urutan divisi dan jabatan mengikuti susunan organisasi.</p></div><div><strong className="oa-count">{participants.total}</strong><span className="oa-eyebrow">Peserta</span></div></header>
        <Table><thead><tr>{['No.', 'Nama', 'NIM', 'Divisi penerimaan', 'Jabatan'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={5}><div className="oa-state" role="status">Memuat peserta…</div></td></tr> : participants.data.length ? participants.data.map((row, index) => <tr key={row.id}><td>{(participants.current_page - 1) * participants.per_page + index + 1}</td><td>{row.name}</td><td>{row.nim}</td><td>{row.division}</td><td>{row.position}</td></tr>) : <tr><td colSpan={5}><div className="oa-state">Belum ada peserta yang diputuskan diterima.</div></td></tr>}</tbody></Table>
        <footer className="oa-pagination"><span className="oa-muted">{participants.total} peserta diterima</span><div className="oa-actions"><Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage((v) => v - 1)}>Sebelumnya</Button><span>{page} / {participants.last_page}</span><Button variant="outline" disabled={loading || page >= participants.last_page} onClick={() => setPage((v) => v + 1)}>Berikutnya</Button></div></footer>
      </Card>}
    </>}
    {editor && current && <AnnouncementEditor data={current} triggerRef={trigger} onClose={() => setEditor(false)} onSaved={() => { setEditor(false); reload(); }} />}
  </div>;
}
