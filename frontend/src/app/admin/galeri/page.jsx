"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, FolderOpen, Images, Loader2, Pencil, Plus, RefreshCw, Trash2, UploadCloud, X } from "lucide-react";
import { api } from "@/services/api";
import { optimizeGalleryImage } from "@/lib/optimizeOprecImage";
import { formatAlbumDate } from "@/lib/galleryAlbums";
import "../content/content.css";
import "./galeri-admin.css";

const emptyForm = { title: "", event_date: "", description: "", drive_url: "" };

function errorText(error, fallback) {
  const errors = error?.response?.data?.errors;
  return (errors && Object.values(errors).flat()[0]) || error?.response?.data?.message || fallback;
}

function Modal({ title, onClose, busy, children, footer }) {
  return (
    <div className="content-modal-overlay" onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div className="content-modal content-modal--wide" role="dialog" aria-modal="true" aria-label={title}>
        <header className="content-modal-header">
          <div className="content-modal-title"><h3>{title}</h3></div>
          <button type="button" className="content-modal-close" onClick={onClose} disabled={busy} aria-label="Tutup"><X size={18} /></button>
        </header>
        <div className="content-modal-body">{children}</div>
        <footer className="content-modal-footer">{footer}</footer>
      </div>
    </div>
  );
}

function AlbumForm({ album, onClose, onSaved }) {
  const [form, setForm] = useState(album ? {
    title: album.title || "", event_date: album.event_date?.slice(0, 10) || "", description: album.description || "", drive_url: album.drive_url || "",
  } : emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit() {
    if (!form.title.trim()) { setError("Judul kegiatan wajib diisi."); return; }
    setBusy(true);
    setError("");
    try {
      const body = { ...form, event_date: form.event_date || null, drive_url: form.drive_url.trim() || null };
      if (album) await api.put(`/admin/gallery-albums/${album.id}`, body);
      else await api.post("/admin/gallery-albums", body);
      toast.success(album ? "Album berhasil disimpan." : "Album berhasil dibuat. Tambahkan fotonya lewat tombol Foto.");
      await onSaved();
      onClose();
    } catch (cause) {
      setError(errorText(cause, "Album gagal disimpan."));
      setBusy(false);
    }
  }

  return (
    <Modal title={album ? "Ubah Album" : "Album Baru"} onClose={onClose} busy={busy} footer={<>
      <button type="button" className="content-btn content-btn--secondary" onClick={onClose} disabled={busy}>Batal</button>
      <button type="button" className="content-btn content-btn--primary" onClick={submit} disabled={busy}>{busy ? <Loader2 size={15} className="content-spin" /> : null}<span>{busy ? "Menyimpan…" : "Simpan"}</span></button>
    </>}>
      {error && <div className="content-alert content-alert--error" role="alert">{error}</div>}
      <label className="content-field"><span className="content-field-label">Judul kegiatan</span>
        <input className="content-input" value={form.title} onChange={set("title")} maxLength={160} placeholder="Contoh: Makrab HIMANIKA 2026" /></label>
      <label className="content-field"><span className="content-field-label">Tanggal kegiatan</span>
        <input className="content-input" type="date" value={form.event_date} onChange={set("event_date")} /></label>
      <label className="content-field"><span className="content-field-label">Deskripsi singkat</span>
        <textarea className="content-textarea" value={form.description} onChange={set("description")} maxLength={2000} rows={3} /></label>
      <label className="content-field"><span className="content-field-label">Link folder Google Drive (opsional)</span>
        <input className="content-input" type="url" value={form.drive_url} onChange={set("drive_url")} placeholder="https://drive.google.com/drive/folders/…" />
        <span className="content-field-help">Tampil sebagai tombol “Lihat dokumentasi lengkap”. Pastikan folder dibagikan ke “Siapa saja yang memiliki link”.</span></label>
    </Modal>
  );
}

function PhotoManager({ album, onClose, onChanged }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/public/gallery-albums/${album.slug}`);
      setPhotos(data?.data?.photos || []);
    } catch {
      toast.error("Foto album gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [album.slug]);

  useEffect(() => { load(); }, [load]);

  async function upload(files) {
    if (!files.length || uploading) return;
    try {
      setUploading(`Mengoptimalkan ${files.length} foto…`);
      const optimized = await Promise.all(files.map((file) => optimizeGalleryImage(file)));
      setUploading(`Mengunggah ${files.length} foto…`);
      const body = new FormData();
      optimized.forEach((file) => body.append("photos[]", file));
      const { data } = await api.post(`/admin/gallery-albums/${album.id}/photos`, body, { timeout: 120000 });
      setPhotos(data?.data || []);
      toast.success(data?.message || "Foto berhasil ditambahkan.");
      onChanged();
    } catch (cause) {
      toast.error(errorText(cause, "Foto gagal diunggah."));
    } finally {
      setUploading("");
    }
  }

  async function remove(photo) {
    setDeleting(photo.id);
    try {
      await api.delete(`/admin/gallery-albums/${album.id}/photos/${photo.id}`);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      onChanged();
    } catch (cause) {
      toast.error(errorText(cause, "Foto gagal dihapus."));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Modal title={`Foto · ${album.title}`} onClose={onClose} busy={Boolean(uploading)} footer={<button type="button" className="content-btn content-btn--secondary" onClick={onClose} disabled={Boolean(uploading)}>Selesai</button>}>
      <label className="content-dropzone">
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={Boolean(uploading)}
          onChange={(event) => { const files = [...event.target.files]; event.target.value = ""; upload(files); }} />
        <div className="content-dropzone-icon">{uploading ? <Loader2 size={22} className="content-spin" /> : <UploadCloud size={22} />}</div>
        <span className="content-dropzone-title">{uploading || "Klik untuk memilih foto kegiatan"}</span>
        <span className="content-dropzone-desc">JPG, PNG, atau WebP. Foto otomatis dikompres agar ringan tanpa pecah. Maks. 50 foto sekali unggah.</span>
      </label>
      {loading ? <p className="content-field-help">Memuat foto…</p> : photos.length ? (
        <div className="content-gallery-grid" style={{ marginTop: 16 }}>
          {photos.map((photo) => (
            <article key={photo.id} className="content-gallery-card">
              <div className="content-gallery-media"><img src={photo.image_url} alt={photo.alt || ""} loading="lazy" /></div>
              <div className="content-card-actions">
                <button type="button" className="content-card-btn content-card-btn--danger" disabled={deleting === photo.id} onClick={() => remove(photo)}>
                  {deleting === photo.id ? <Loader2 size={13} className="content-spin" /> : <Trash2 size={13} />}<span>Hapus</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="content-field-help" style={{ marginTop: 12 }}>Belum ada foto di album ini.</p>}
    </Modal>
  );
}

export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [photos, setPhotos] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/gallery-albums");
      setAlbums(data?.data || []);
    } catch (cause) {
      toast.error(errorText(cause, "Album gagal dimuat."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function removeAlbum(album) {
    if (!window.confirm(`Hapus album “${album.title}” beserta ${album.photo_count} fotonya?`)) return;
    setDeleting(album.id);
    try {
      await api.delete(`/admin/gallery-albums/${album.id}`);
      toast.success("Album berhasil dihapus.");
      await load();
    } catch (cause) {
      toast.error(errorText(cause, "Album gagal dihapus."));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="content-console">
      <header className="content-hero">
        <div className="content-hero-text">
          <div className="content-eyebrow"><span className="content-eyebrow-dot" /><span>PENGATURAN KONTEN // GALERI KEGIATAN</span></div>
          <h1>Galeri Kegiatan</h1>
          <p>Buat album per kegiatan, unggah foto dokumentasi, dan tautkan folder Google Drive untuk dokumentasi lengkap.</p>
        </div>
        <div className="content-hero-actions">
          <button type="button" className="content-btn content-btn--secondary" onClick={() => { setLoading(true); load(); }} disabled={loading}><RefreshCw size={15} className={loading ? "content-spin" : ""} /><span>Segarkan</span></button>
          <a href="/galeri" target="_blank" rel="noopener noreferrer" className="content-btn content-btn--ghost"><ExternalLink size={15} /><span>Lihat halaman</span></a>
          <button type="button" className="content-btn content-btn--primary" onClick={() => setForm({ album: null })}><Plus size={16} /><span>Album Baru</span></button>
        </div>
      </header>

      {loading ? <p className="content-field-help">Memuat album…</p> : albums.length ? (
        <div className="content-gallery-grid">
          {albums.map((album) => (
            <article key={album.id} className="content-gallery-card">
              <div className="content-gallery-media">
                {album.cover_url ? <img src={album.cover_url} alt="" loading="lazy" /> : <span className="galeri-admin-cover"><Images size={30} /></span>}
              </div>
              <div className="content-gallery-body">
                <div className="content-gallery-info">
                  <strong>{album.title}</strong>
                  <span className="content-gallery-meta">{[album.event_date && formatAlbumDate(album.event_date), `${album.photo_count} foto`].filter(Boolean).join(" · ")}</span>
                  {album.drive_url && <span className="content-gallery-meta galeri-admin-drive"><FolderOpen size={12} aria-hidden="true" /> Google Drive terhubung</span>}
                </div>
                <div className="content-card-actions">
                  <button type="button" className="content-card-btn" onClick={() => setPhotos(album)}><Images size={13} /><span>Foto</span></button>
                  <button type="button" className="content-card-btn" onClick={() => setForm({ album })}><Pencil size={13} /><span>Ubah</span></button>
                  <button type="button" className="content-card-btn content-card-btn--danger" disabled={deleting === album.id} onClick={() => removeAlbum(album)}><Trash2 size={13} /><span>Hapus</span></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="content-empty-box">
          <div className="content-empty-icon"><Images size={28} /></div>
          <span className="content-empty-title">Belum ada album</span>
          <span className="content-empty-desc">Klik “Album Baru” untuk menambahkan dokumentasi kegiatan pertama.</span>
        </div>
      )}

      {form && <AlbumForm album={form.album} onClose={() => setForm(null)} onSaved={load} />}
      {photos && <PhotoManager album={photos} onClose={() => setPhotos(null)} onChanged={load} />}
    </div>
  );
}
