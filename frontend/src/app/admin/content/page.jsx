"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Images,
  MessageSquare,
  Type,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit3,
  Trash2,
  UploadCloud,
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  Quote,
  Eye,
  EyeOff,
  Check,
  Clock,
  User,
} from "lucide-react";
import { api } from "@/services/api";
import { landingTextDefaults } from "@/lib/landingText";
import { optimizeGalleryImage } from "@/lib/optimizeOprecImage";
import "./content.css";

function getErrorMessage(error, defaultMsg = "Terjadi kesalahan saat memproses data.") {
  const validation = Object.values(error.response?.data?.errors || {}).flat()[0];
  return validation || error.response?.data?.message || error.message || defaultMsg;
}

function calculateNextOrder(list = []) {
  if (!Array.isArray(list) || list.length === 0) return 1;
  const numbers = list.map((item) => Number(item.sort_order)).filter((n) => !isNaN(n));
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return Math.max(max + 1, list.length + 1);
}

function formatFilenameToCaption(name = "") {
  const withoutExt = name.replace(/\.[^/.]+$/, "");
  return withoutExt
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ─────────────────────────────────────────────────────────────
   Modal: Tambah Foto Galeri (Mendukung Banyak Foto Sekaligus)
   ───────────────────────────────────────────────────────────── */
function AddGalleryBatchModal({ existingGallery = [], onClose, onSaved }) {
  const nextOrder = useMemo(() => calculateNextOrder(existingGallery), [existingGallery]);
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      queue.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [queue]);

  const addFilesToQueue = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const validFiles = Array.from(fileList).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );

    if (validFiles.length === 0) {
      setError("Berkas yang dipilih harus berformat JPG, PNG, atau WebP.");
      return;
    }

    setQueue((prevQueue) => {
      const currentHighestOrder = prevQueue.length > 0
        ? Math.max(...prevQueue.map((q) => Number(q.order) || 0))
        : nextOrder - 1;

      const newEntries = validFiles.map((file, idx) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
        file,
        previewUrl: URL.createObjectURL(file),
        alt: formatFilenameToCaption(file.name),
        order: String(currentHighestOrder + 1 + idx),
      }));

      return [...prevQueue, ...newEntries];
    });

    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeItem = (idToRemove) => {
    setQueue((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const updateItemAlt = (id, newAlt) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, alt: newAlt } : item))
    );
  };

  const updateItemOrder = (id, newOrder) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, order: newOrder } : item))
    );
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (queue.length === 0) {
      setError("Silakan pilih minimal satu foto untuk diunggah.");
      return;
    }
    setBusy(true);
    setError("");

    try {
      setUploadProgress(`Mengoptimalkan ${queue.length} foto…`);
      const files = await Promise.all(queue.map((item) => optimizeGalleryImage(item.file)));
      const formData = new FormData();
      queue.forEach((item, index) => {
        formData.append(`images[${index}]`, files[index]);
        formData.append(`alts[${index}]`, item.alt.trim() || `Foto Galeri ${item.order}`);
        formData.append(`sort_orders[${index}]`, String(parseInt(item.order, 10) || 0));
      });

      setUploadProgress(`Mengunggah ${queue.length} foto ke galeri…`);
      await api.post("/admin/home-content/gallery/batch", formData);

      toast.success(`Berhasil menambahkan ${queue.length} foto ke galeri!`);
      await onSaved();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Gagal mengunggah foto galeri.");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
      setUploadProgress("");
    }
  }

  return (
    <div
      className="content-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="content-modal content-modal--wide">
        <header className="content-modal-header">
          <div className="content-modal-title">
            <h3>Tambah Foto Galeri (Bisa Banyak Sekaligus)</h3>
            <p>Unggah satu atau banyak foto dokumentasi kegiatan untuk ditampilkan pada landing page.</p>
          </div>
          <button type="button" className="content-modal-close" onClick={onClose} disabled={busy} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="content-modal-body">
            {error && (
              <div className="content-alert content-alert--error" role="alert">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Hidden Input for Selecting Files */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => addFilesToQueue(e.target.files)}
              disabled={busy}
            />

            {/* Dropzone for Multi-select */}
            {queue.length === 0 ? (
              <div
                className={`content-dropzone ${isDragging ? "content-dropzone--active" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  addFilesToQueue(e.dataTransfer.files);
                }}
              >
                <div className="content-dropzone-icon">
                  <UploadCloud size={24} />
                </div>
                <span className="content-dropzone-title">Klik atau seret beberapa foto kegiatan ke sini</span>
                <span className="content-dropzone-desc">
                  Pilih sekaligus banyak gambar (JPG, PNG, atau WebP). Maksimal 5 MB per foto.
                </span>
              </div>
            ) : (
              <div
                className={`content-dropzone content-dropzone--compact ${isDragging ? "content-dropzone--active" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  addFilesToQueue(e.dataTransfer.files);
                }}
              >
                <UploadCloud size={18} style={{ color: "var(--cc-blue-600)" }} />
                <span className="content-dropzone-title" style={{ fontSize: 13 }}>
                  Klik atau seret untuk menambah foto lainnya
                </span>
              </div>
            )}

            {/* Queued Photos List */}
            {queue.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                <div className="content-batch-toolbar">
                  <span>{queue.length} foto siap diunggah</span>
                  <button
                    type="button"
                    className="content-btn content-btn--secondary"
                    style={{ minHeight: 30, padding: "4px 10px", fontSize: 11 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                  >
                    <Plus size={13} /> Tambah Foto Lagi
                  </button>
                </div>

                <div className="content-batch-list">
                  {queue.map((item, index) => (
                    <div key={item.id} className="content-batch-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.previewUrl} alt="" className="content-batch-thumb" />

                      <div className="content-batch-info">
                        <div className="content-batch-row">
                          <span className="content-batch-badge">Foto #{item.order}</span>
                          <span className="content-batch-filename">{item.file.name}</span>
                          <span style={{ fontSize: 11, color: "var(--cc-ink-muted)", marginLeft: "auto" }}>
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: 4 }}>
                          <input
                            type="text"
                            className="content-batch-input"
                            placeholder="Deskripsi foto (alt text)"
                            value={item.alt}
                            maxLength={200}
                            onChange={(e) => updateItemAlt(item.id, e.target.value)}
                            disabled={busy}
                          />
                          <input
                            type="number"
                            min="0"
                            max="9999"
                            className="content-batch-order-input"
                            title="Posisi urutan tampil"
                            value={item.order}
                            onChange={(e) => updateItemOrder(item.id, e.target.value)}
                            disabled={busy}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="content-batch-remove"
                        onClick={() => removeItem(item.id)}
                        disabled={busy}
                        title="Hapus dari daftar unggah"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer className="content-modal-footer">
            <button type="button" className="content-btn content-btn--secondary" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button
              type="submit"
              className="content-btn content-btn--primary"
              disabled={busy || queue.length === 0}
            >
              {busy ? (
                <>
                  <RefreshCw size={15} className="content-spin" />
                  <span>{uploadProgress || "Mengunggah…"}</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Unggah Semua Foto ({queue.length} Foto)</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Modal: Ubah Satu Foto Galeri (Edit Mode)
   ───────────────────────────────────────────────────────────── */
function EditGalleryModal({ item, onClose, onSaved }) {
  const [alt, setAlt] = useState(item?.alt || "");
  const [order, setOrder] = useState(String(item?.sort_order ?? 1));
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return item?.image_url || null;
  }, [file, item]);

  useEffect(() => {
    return () => {
      if (file && previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, previewUrl]);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const body = new FormData();
    body.append("alt", alt.trim());
    body.append("sort_order", String(parseInt(order, 10) || 0));
    try {
      if (file) body.append("image", await optimizeGalleryImage(file));
      await api.post(`/admin/home-content/gallery/${item.id}`, body);
      toast.success("Foto galeri berhasil diperbarui.");
      await onSaved();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Gagal memperbarui foto galeri.");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="content-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="content-modal">
        <header className="content-modal-header">
          <div className="content-modal-title">
            <h3>Ubah Foto Galeri</h3>
            <p>Perbarui deskripsi, gambar, atau urutan tampil foto kegiatan.</p>
          </div>
          <button type="button" className="content-modal-close" onClick={onClose} disabled={busy} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="content-modal-body">
            {error && (
              <div className="content-alert content-alert--error" role="alert">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Preview Frame */}
            <div className="content-field">
              <label className="content-field-label">
                <span>Gambar Galeri</span>
                <span className="content-field-counter">Opsional jika tidak diganti</span>
              </label>

              <div className="content-image-preview-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview Foto" />
                <span className="content-order-badge">FOTO #{String(order || "0").padStart(2, "0")}</span>
                <button
                  type="button"
                  className="content-image-preview-change"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  <UploadCloud size={14} /> Ganti Gambar
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Alt text */}
            <div className="content-field">
              <label htmlFor="edit-gallery-alt" className="content-field-label">
                <span>Deskripsi Foto (Alt Text) *</span>
                <span className="content-field-counter">{alt.length} / 200</span>
              </label>
              <input
                id="edit-gallery-alt"
                type="text"
                className="content-input"
                maxLength={200}
                required
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                disabled={busy}
              />
            </div>

            {/* Sort order */}
            <div className="content-field">
              <label htmlFor="edit-gallery-order" className="content-field-label">
                <span>Urutan Tampil *</span>
                <span className="content-field-counter">Nilai 0 - 9999</span>
              </label>
              <input
                id="edit-gallery-order"
                type="number"
                min="0"
                max="9999"
                className="content-input"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                required
                disabled={busy}
              />
            </div>
          </div>

          <footer className="content-modal-footer">
            <button type="button" className="content-btn content-btn--secondary" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button type="submit" className="content-btn content-btn--primary" disabled={busy}>
              {busy ? (
                <>
                  <RefreshCw size={15} className="content-spin" />
                  <span>Menyimpan…</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Modal: Tambah / Ubah Testimoni
   ───────────────────────────────────────────────────────────── */
function TestimonialModal({ item, existingTestimonials = [], onClose, onSaved }) {
  const isEditing = Boolean(item);
  const nextOrder = useMemo(() => calculateNextOrder(existingTestimonials), [existingTestimonials]);
  const defaultOrder = isEditing ? (item?.sort_order ?? 1) : nextOrder;

  const [name, setName] = useState(item?.nama || "");
  const [role, setRole] = useState(item?.angkatan || "");
  const [quote, setQuote] = useState(item?.quote || "");
  const [photoUrl, setPhotoUrl] = useState(item?.foto_url || "");
  const [photo, setPhoto] = useState(null);
  const [order, setOrder] = useState(String(defaultOrder));
  const [isVisible, setIsVisible] = useState(item ? Boolean(item.is_visible) : true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const localPreview = useMemo(() => {
    if (photo) return URL.createObjectURL(photo);
    if (photoUrl && photoUrl.trim()) return photoUrl.trim();
    return null;
  }, [photo, photoUrl]);

  useEffect(() => {
    return () => {
      if (photo && localPreview && localPreview.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [photo, localPreview]);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const body = new FormData();
    body.append("nama", name.trim());
    body.append("angkatan", role.trim());
    body.append("quote", quote.trim());
    body.append("sort_order", String(parseInt(order, 10) || 0));
    body.append("status", "approved");
    body.append("is_visible", isVisible ? "1" : "0");
    if (photo) {
      body.append("photo", photo);
    } else if (photoUrl && photoUrl.trim()) {
      body.append("photo_url", photoUrl.trim());
    }

    try {
      if (isEditing) {
        await api.post(`/admin/home-content/testimonials/${item.id}`, body);
        toast.success("Testimoni berhasil diperbarui.");
      } else {
        await api.post("/admin/home-content/testimonials", body);
        toast.success(`Testimoni ke-${order} berhasil ditambahkan.`);
      }
      await onSaved();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Gagal menyimpan testimoni.");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="content-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="content-modal">
        <header className="content-modal-header">
          <div className="content-modal-title">
            <h3>{isEditing ? "Ubah Testimoni" : "Tambah Testimoni"}</h3>
            <p>
              {isEditing
                ? "Perbarui data kutipan, profil, atau urutan tampil testimoni."
                : "Tambahkan testimoni alumni atau anggota aktif untuk ditampilkan di landing page."}
            </p>
          </div>
          <button type="button" className="content-modal-close" onClick={onClose} disabled={busy} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="content-modal-body">
            {error && (
              <div className="content-alert content-alert--error" role="alert">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Avatar */}
            <div className="content-field">
              <label className="content-field-label">
                <span>Foto Profil (Opsional)</span>
                <span className="content-field-counter">JPG, PNG, atau WebP</span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {localPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={localPreview} alt="Avatar Preview" className="content-avatar" style={{ width: 56, height: 56 }} />
                ) : (
                  <div className="content-avatar-fallback" style={{ width: 56, height: 56, fontSize: 20 }}>
                    {name ? name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <button
                    type="button"
                    className="content-btn content-btn--secondary"
                    style={{ minHeight: 36, padding: "6px 14px", fontSize: 13 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                  >
                    <UploadCloud size={15} /> Pilih Foto
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      setPhoto(e.target.files?.[0] || null);
                      setPhotoUrl("");
                    }}
                    disabled={busy}
                  />
                </div>
              </div>
              <span className="content-field-help">Atau masukkan URL foto eksternal:</span>
              <input
                type="url"
                className="content-input"
                placeholder="https://example.com/avatar.jpg"
                maxLength={2048}
                value={photoUrl}
                onChange={(e) => {
                  setPhotoUrl(e.target.value);
                  setPhoto(null);
                }}
                disabled={busy}
              />
            </div>

            {/* Nama */}
            <div className="content-field">
              <label htmlFor="testi-nama" className="content-field-label">
                <span>Nama Lengkap *</span>
                <span className="content-field-counter">{name.length} / 120</span>
              </label>
              <input
                id="testi-nama"
                type="text"
                className="content-input"
                placeholder="Contoh: Muhammad Raihan Pratama"
                maxLength={120}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
              />
            </div>

            {/* Angkatan / Jabatan */}
            <div className="content-field">
              <label htmlFor="testi-role" className="content-field-label">
                <span>Angkatan / Jabatan / Instansi</span>
                <span className="content-field-counter">{role.length} / 160</span>
              </label>
              <input
                id="testi-role"
                type="text"
                className="content-input"
                placeholder="Contoh: MIF '21 / Software Engineer di Startup"
                maxLength={160}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={busy}
              />
            </div>

            {/* Kutipan Quote */}
            <div className="content-field">
              <label htmlFor="testi-quote" className="content-field-label">
                <span>Kutipan Testimoni *</span>
                <span className="content-field-counter">{quote.length} / 1500</span>
              </label>
              <textarea
                id="testi-quote"
                className="content-textarea"
                rows={4}
                placeholder="Ceritakan pengalaman berorganisasi di HIMANIKA..."
                maxLength={1500}
                required
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                disabled={busy}
              />
            </div>

            {/* Order */}
            <div className="content-field">
              <label htmlFor="testi-order" className="content-field-label">
                <span>Urutan Tampil *</span>
                <span className="content-field-counter">Nilai 0 - 9999</span>
              </label>

              <div className="content-autodetect-badge">
                <Sparkles size={16} />
                <span>
                  {isEditing
                    ? `Posisi saat ini: Testimoni ke-${order}`
                    : `Otomatis terdeteksi: Testimoni ke-${order} (slot paling baru)`}
                </span>
              </div>

              <input
                id="testi-order"
                type="number"
                min="0"
                max="9999"
                className="content-input"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                required
                disabled={busy}
              />
            </div>

            {/* Visibilitas Publik */}
            <div className="content-field">
              <label className="content-checkbox-label">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  disabled={busy}
                />
                <div>
                  <strong>Tampilkan ke Publik</strong>
                  <div style={{ fontSize: "12px", color: "var(--cc-ink-muted)", marginTop: "2px" }}>
                    Centang untuk mempublikasikan testimoni ini di Landing Page & Halaman Testimoni.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <footer className="content-modal-footer">
            <button type="button" className="content-btn content-btn--secondary" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button type="submit" className="content-btn content-btn--primary" disabled={busy}>
              {busy ? (
                <>
                  <RefreshCw size={15} className="content-spin" />
                  <span>Menyimpan…</span>
                </>
              ) : (
                <span>{isEditing ? "Simpan Perubahan" : "Simpan Testimoni"}</span>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Modal: Konfirmasi Hapus
   ───────────────────────────────────────────────────────────── */
function DeleteConfirmModal({ kind, item, onClose, onConfirm, busy }) {
  const isGallery = kind === "gallery";
  const title = isGallery ? "Hapus Foto Galeri?" : "Hapus Testimoni?";
  const desc = isGallery
    ? `Foto “${item?.alt || "Foto galeri"}” akan dihapus secara permanen dari landing page.`
    : `Testimoni dari “${item?.nama || "Alumni"}” akan dihapus secara permanen dari landing page.`;

  return (
    <div
      className="content-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="content-modal" style={{ maxWidth: 440 }}>
        <header className="content-modal-header">
          <div className="content-modal-title">
            <h3 style={{ color: "var(--cc-danger-700)" }}>{title}</h3>
            <p>{desc}</p>
          </div>
          <button type="button" className="content-modal-close" onClick={onClose} disabled={busy}>
            <X size={18} />
          </button>
        </header>

        <div className="content-modal-body">
          <p style={{ margin: 0, fontSize: "13px", color: "var(--cc-ink-muted)", lineHeight: 1.6 }}>
            Tindakan ini tidak dapat dibatalkan. Jika seluruh {isGallery ? "foto galeri" : "testimoni"} dihapus, landing page akan otomatis kembali menampilkan konten bawaan default.
          </p>
        </div>

        <footer className="content-modal-footer">
          <button type="button" className="content-btn content-btn--secondary" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button
            type="button"
            className="content-btn content-btn--danger"
            style={{ background: "#c42b3a", color: "#fff", borderColor: "#c42b3a" }}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <>
                <RefreshCw size={15} className="content-spin" />
                <span>Menghapus…</span>
              </>
            ) : (
              <span>Ya, Hapus</span>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Form Teks Landing Page (Hero, Tentang, Visi-Misi)
   ───────────────────────────────────────────────────────────── */
function TextManager({ content, onSaved }) {
  const [values, setValues] = useState(() => ({
    hero_tagline: content.hero_tagline || landingTextDefaults.hero_tagline,
    hero_subtitle: content.hero_subtitle || landingTextDefaults.hero_subtitle,
    about: content.about || landingTextDefaults.about,
    visi: content.visi || landingTextDefaults.visi,
    misi: Array.isArray(content.misi) && content.misi.length === 4 ? content.misi : landingTextDefaults.misi,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setValues({
      hero_tagline: content.hero_tagline || landingTextDefaults.hero_tagline,
      hero_subtitle: content.hero_subtitle || landingTextDefaults.hero_subtitle,
      about: content.about || landingTextDefaults.about,
      visi: content.visi || landingTextDefaults.visi,
      misi: Array.isArray(content.misi) && content.misi.length === 4 ? content.misi : landingTextDefaults.misi,
    });
  }, [content]);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api.put("/admin/home-content/text", values);
      await onSaved();
      setNotice("Teks landing page berhasil diperbarui dan tersimpan.");
      toast.success("Teks landing page berhasil disimpan!");
    } catch (err) {
      const msg = getErrorMessage(err, "Gagal menyimpan teks landing page.");
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function handleResetDefault() {
    if (!window.confirm("Kembalikan seluruh teks ke konfigurasi standar bawaan sistem?")) return;
    setValues({
      hero_tagline: landingTextDefaults.hero_tagline,
      hero_subtitle: landingTextDefaults.hero_subtitle,
      about: landingTextDefaults.about,
      visi: landingTextDefaults.visi,
      misi: [...landingTextDefaults.misi],
    });
    toast.info("Teks dikembalikan ke nilai default. Klik 'Simpan Teks Landing Page' untuk menyimpan.");
  }

  return (
    <form className="content-text-container" onSubmit={handleSubmit}>
      {notice && (
        <div className="content-alert content-alert--success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="content-alert content-alert--error" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Hero */}
      <div className="content-editorial-card">
        <div className="content-card-tagline">
          <span className="content-tag">// 01 HERO SECTION</span>
          <span className="content-field-counter">Headline & pengantar utama</span>
        </div>
        <div className="content-editorial-body">
          <div className="content-field">
            <label htmlFor="hero-tagline" className="content-field-label">
              <span>Judul Hero (Baris Pertama / Headline) *</span>
              <span className="content-field-counter">{values.hero_tagline.length} / 255</span>
            </label>
            <input
              id="hero-tagline"
              type="text"
              className="content-input"
              maxLength={255}
              required
              value={values.hero_tagline}
              onChange={(e) => setValues({ ...values, hero_tagline: e.target.value })}
              disabled={busy}
            />
          </div>

          <div className="content-field">
            <label htmlFor="hero-subtitle" className="content-field-label">
              <span>Deskripsi Singkat Hero *</span>
              <span className="content-field-counter">{values.hero_subtitle.length} / 1000</span>
            </label>
            <textarea
              id="hero-subtitle"
              className="content-textarea"
              rows={3}
              maxLength={1000}
              required
              value={values.hero_subtitle}
              onChange={(e) => setValues({ ...values, hero_subtitle: e.target.value })}
              disabled={busy}
            />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="content-editorial-card">
        <div className="content-card-tagline">
          <span className="content-tag">// 02 TENTANG HIMANIKA</span>
          <span className="content-field-counter">Narasi profil organisasi</span>
        </div>
        <div className="content-editorial-body">
          <div className="content-field">
            <label htmlFor="about-text" className="content-field-label">
              <span>Narasi Tentang HIMANIKA *</span>
              <span className="content-field-counter">{values.about.length} / 5000</span>
            </label>
            <textarea
              id="about-text"
              className="content-textarea"
              rows={6}
              maxLength={5000}
              required
              value={values.about}
              onChange={(e) => setValues({ ...values, about: e.target.value })}
              disabled={busy}
            />
            <span className="content-field-help">
              Pisahkan antarparagraf dengan satu baris kosong (tekan Enter dua kali) agar tata letak rapi.
            </span>
          </div>
        </div>
      </div>

      {/* Visi & Misi */}
      <div className="content-editorial-card">
        <div className="content-card-tagline">
          <span className="content-tag">// 03 VISI & MISI HIMANIKA</span>
          <span className="content-field-counter">1 Visi dan 4 Misi terstruktur</span>
        </div>
        <div className="content-editorial-body">
          <div className="content-field">
            <label htmlFor="visi-text" className="content-field-label">
              <span>Visi *</span>
              <span className="content-field-counter">{values.visi.length} / 1500</span>
            </label>
            <textarea
              id="visi-text"
              className="content-textarea"
              rows={3}
              maxLength={1500}
              required
              value={values.visi}
              onChange={(e) => setValues({ ...values, visi: e.target.value })}
              disabled={busy}
            />
          </div>

          <div className="content-field">
            <label className="content-field-label">
              <span>4 Butir Misi HIMANIKA *</span>
              <span className="content-field-counter">Tepat 4 Butir Misi</span>
            </label>

            <div className="content-misi-grid">
              {values.misi.map((misiItem, idx) => (
                <div key={idx} className="content-misi-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="content-tag" style={{ fontSize: 10 }}>// MISI 0{idx + 1}</span>
                    <span className="content-field-counter">{misiItem.length} / 1000</span>
                  </div>
                  <textarea
                    rows={3}
                    className="content-textarea"
                    style={{ minHeight: 80 }}
                    maxLength={1000}
                    required
                    value={misiItem}
                    onChange={(e) => {
                      const updated = [...values.misi];
                      updated[idx] = e.target.value;
                      setValues({ ...values, misi: updated });
                    }}
                    disabled={busy}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="content-text-actions">
        <button
          type="button"
          className="content-btn content-btn--ghost"
          onClick={handleResetDefault}
          disabled={busy}
        >
          Kembalikan Teks Standar
        </button>

        <button type="submit" className="content-btn content-btn--primary" disabled={busy}>
          {busy ? (
            <>
              <RefreshCw size={15} className="content-spin" />
              <span>Menyimpan Teks…</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>Simpan Teks Landing Page</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Admin Content Console Page
   ───────────────────────────────────────────────────────────── */
export default function AdminContentPage() {
  const [content, setContent] = useState({
    gallery: [],
    testimonials: [],
    hero_tagline: null,
    hero_subtitle: null,
    about: null,
    visi: null,
    misi: [],
    gallery_managed: false,
    testimonials_managed: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("gallery");
  const [testiFilter, setTestiFilter] = useState("all");
  const [actionBusyId, setActionBusyId] = useState(null);

  // Modals state
  const [addGalleryOpen, setAddGalleryOpen] = useState(false);
  const [editGalleryItem, setEditGalleryItem] = useState(null);
  const [testiModal, setTestiModal] = useState({ open: false, item: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, kind: null, item: null, busy: false });

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const response = await api.get("/admin/home-content");
      if (response.data?.data) {
        setContent(response.data.data);
      }
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat konten landing page."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const nextGalleryOrder = useMemo(() => calculateNextOrder(content.gallery), [content.gallery]);
  const nextTestiOrder = useMemo(() => calculateNextOrder(content.testimonials), [content.testimonials]);

  const visibleTestiCount = useMemo(() => {
    return (content.testimonials || []).filter((t) => Boolean(t.is_visible)).length;
  }, [content.testimonials]);

  const hiddenTestiCount = useMemo(() => {
    return (content.testimonials || []).filter((t) => !t.is_visible).length;
  }, [content.testimonials]);

  const filteredTestimonials = useMemo(() => {
    const list = content.testimonials || [];
    if (testiFilter === "visible") return list.filter((t) => Boolean(t.is_visible));
    if (testiFilter === "hidden") return list.filter((t) => !t.is_visible);
    return list;
  }, [content.testimonials, testiFilter]);

  async function handleToggleVisibility(testi) {
    setActionBusyId(testi.id);
    try {
      const res = await api.patch(`/admin/home-content/testimonials/${testi.id}/visibility`);
      toast.success(res.data?.message || "Visibilitas berhasil diperbarui.");
      await load(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengubah visibilitas testimoni."));
    } finally {
      setActionBusyId(null);
    }
  }

  // Handle Delete
  async function handleDeleteConfirm() {
    const { kind, item } = deleteModal;
    if (!kind || !item) return;

    setDeleteModal((prev) => ({ ...prev, busy: true }));
    try {
      await api.delete(`/admin/home-content/${kind}/${item.id}`);
      toast.success(kind === "gallery" ? "Foto galeri berhasil dihapus." : "Testimoni berhasil dihapus.");
      await load(true);
      setDeleteModal({ open: false, kind: null, item: null, busy: false });
    } catch (err) {
      const msg = getErrorMessage(err, "Gagal menghapus konten.");
      toast.error(msg);
      setDeleteModal((prev) => ({ ...prev, busy: false }));
    }
  }

  return (
    <div className="content-console">
      {/* Hero Header */}
      <header className="content-hero">
        <div className="content-hero-text">
          <div className="content-eyebrow">
            <span className="content-eyebrow-dot" />
            <span>PENGATURAN KONTEN // LANDING PAGE</span>
          </div>
          <h1>Pengaturan Landing Page</h1>
          <p>
            Kelola foto galeri kegiatan mahasiswa, testimoni alumni & anggota, serta teks narasi utama yang tampil
            pada landing page SIMANIKA.
          </p>
        </div>

        <div className="content-hero-actions">
          <button
            type="button"
            className="content-btn content-btn--secondary"
            onClick={() => load(false)}
            disabled={refreshing || loading}
            title="Segarkan data dari server"
          >
            <RefreshCw size={15} className={refreshing ? "content-spin" : ""} />
            <span>Segarkan</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="content-btn content-btn--primary"
            title="Buka halaman utama di tab baru"
          >
            <span>Lihat Landing Page</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </header>

      {/* Global Error Notice */}
      {error && (
        <div className="content-alert content-alert--error" role="alert">
          <AlertTriangle size={18} />
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{error}</span>
            <button
              type="button"
              className="content-btn content-btn--secondary"
              style={{ minHeight: 32, padding: "4px 10px", fontSize: 12 }}
              onClick={() => load(false)}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="content-nav-tabs" aria-label="Tab Pengaturan Landing Page">
        <button
          type="button"
          className={`content-tab-btn ${activeTab === "gallery" ? "active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          <Images size={16} />
          <span>Galeri Kegiatan</span>
          <span className="content-tab-badge">{content.gallery.length}</span>
        </button>

        <button
          type="button"
          className={`content-tab-btn ${activeTab === "testimonials" ? "active" : ""}`}
          onClick={() => setActiveTab("testimonials")}
        >
          <MessageSquare size={16} />
          <span>Testimoni</span>
          <span className="content-tab-badge">{content.testimonials.length}</span>
        </button>

        <button
          type="button"
          className={`content-tab-btn ${activeTab === "text" ? "active" : ""}`}
          onClick={() => setActiveTab("text")}
        >
          <Type size={16} />
          <span>Teks Halaman Utama</span>
          <span className="content-tab-badge">Hero / Visi</span>
        </button>
      </nav>

      {/* Loading State */}
      {loading ? (
        <div className="content-empty-box">
          <RefreshCw size={28} className="content-spin" style={{ color: "var(--cc-blue-600)" }} />
          <p className="content-empty-title">Memuat data konten landing page…</p>
          <p className="content-empty-desc">Mengambil konfigurasi galeri, testimoni, dan teks narasi dari sistem.</p>
        </div>
      ) : (
        <>
          {/* TAB 1: GALERI KEGIATAN */}
          {activeTab === "gallery" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Summary Stats */}
              <div className="content-stats-grid">
                <div className="content-stat-card">
                  <div className="content-stat-info">
                    <span className="content-stat-tag">TOTAL FOTO GALERI</span>
                    <span className="content-stat-val">{content.gallery.length} Foto</span>
                    <span className="content-stat-desc">Dokumentasi kegiatan aktif</span>
                  </div>
                  <div className="content-stat-icon">
                    <Images size={22} />
                  </div>
                </div>

                <div className="content-stat-card">
                  <div className="content-stat-info">
                    <span className="content-stat-tag">STATUS GALERI</span>
                    <span className="content-stat-val">
                      {content.gallery.length > 0 ? "Galeri Kustom" : "Foto Bawaan"}
                    </span>
                    <span className="content-stat-desc">
                      {content.gallery.length > 0 ? "Menampilkan foto unggahanmu" : "Menggunakan galeri default"}
                    </span>
                  </div>
                  <div className="content-stat-icon">
                    <Layers size={22} />
                  </div>
                </div>

                <div className="content-stat-card">
                  <div className="content-stat-info">
                    <span className="content-stat-tag">URUTAN BERIKUTNYA</span>
                    <span className="content-stat-val">Foto ke-{nextGalleryOrder}</span>
                    <span className="content-stat-desc">Otomatis dideteksi sistem</span>
                  </div>
                  <div className="content-stat-icon">
                    <Sparkles size={22} />
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="content-section-header">
                <div className="content-section-title">
                  <h2>Daftar Foto Galeri Kegiatan</h2>
                  <p>Unggah satu atau banyak foto sekaligus. Urutan angka terkecil tampil lebih awal di halaman depan.</p>
                </div>
                <button
                  type="button"
                  className="content-btn content-btn--primary"
                  onClick={() => setAddGalleryOpen(true)}
                >
                  <Plus size={16} />
                  <span>Tambah Foto Galeri</span>
                </button>
              </div>

              {/* Gallery Grid */}
              {content.gallery.length > 0 ? (
                <div className="content-gallery-grid">
                  {content.gallery.map((photo) => (
                    <article key={photo.id} className="content-gallery-card">
                      <div className="content-gallery-media">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.image_url} alt={photo.alt || "Foto Galeri"} loading="lazy" />
                        <span className="content-order-badge">FOTO #{String(photo.sort_order).padStart(2, "0")}</span>
                      </div>

                      <div className="content-gallery-body">
                        <div className="content-gallery-info">
                          <strong className="content-gallery-alt" title={photo.alt}>
                            {photo.alt || "Tanpa deskripsi"}
                          </strong>
                          <span className="content-gallery-meta">Posisi Urutan: {photo.sort_order}</span>
                        </div>

                        <div className="content-card-actions">
                          <button
                            type="button"
                            className="content-card-btn"
                            onClick={() => setEditGalleryItem(photo)}
                            title="Ubah foto"
                          >
                            <Edit3 size={13} />
                            <span>Ubah</span>
                          </button>
                          <button
                            type="button"
                            className="content-card-btn content-card-btn--danger"
                            onClick={() => setDeleteModal({ open: true, kind: "gallery", item: photo, busy: false })}
                            title="Hapus foto"
                          >
                            <Trash2 size={13} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="content-empty-box">
                  <div className="content-empty-icon">
                    <Images size={26} />
                  </div>
                  <h3 className="content-empty-title">Belum Ada Foto Galeri Kustom</h3>
                  <p className="content-empty-desc">
                    Landing page saat ini menggunakan foto bawaan template HIMANIKA. Tambahkan foto dokumentasi kegiatan untuk
                    menampilkan galeri terbaru.
                  </p>
                  <button
                    type="button"
                    className="content-btn content-btn--primary"
                    onClick={() => setAddGalleryOpen(true)}
                  >
                    <Plus size={16} />
                    <span>Tambah Foto Pertama</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TESTIMONI */}
          {activeTab === "testimonials" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Summary Stats */}
              <div className="content-stats-grid">
                <div className="content-stat-card">
                  <div className="content-stat-info">
                    <span className="content-stat-tag">TOTAL TESTIMONI</span>
                    <span className="content-stat-val">{content.testimonials.length} Testimoni</span>
                    <span className="content-stat-desc">Kutipan alumni & pengguna</span>
                  </div>
                  <div className="content-stat-icon">
                    <MessageSquare size={22} />
                  </div>
                </div>

                <div className="content-stat-card">
                  <div className="content-stat-info">
                    <span className="content-stat-tag">DITAMPILKAN PUBLIK</span>
                    <span className="content-stat-val">{visibleTestiCount} Testimoni Aktif</span>
                    <span className="content-stat-desc">Tayang di Landing Page & /testimoni</span>
                  </div>
                  <div className="content-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                    <CheckCircle2 size={22} />
                  </div>
                </div>

                <div
                  className="content-stat-card"
                  style={hiddenTestiCount > 0 ? { borderColor: "#cbd5e1", background: "#f8fafc" } : {}}
                >
                  <div className="content-stat-info">
                    <span className="content-stat-tag">DISEMBUNYIKAN</span>
                    <span className="content-stat-val">{hiddenTestiCount} Disembunyikan</span>
                    <span className="content-stat-desc">
                      {hiddenTestiCount > 0 ? "Disembunyikan oleh admin dari publik" : "Semua testimoni sedang aktif"}
                    </span>
                  </div>
                  <div className="content-stat-icon">
                    <EyeOff size={22} />
                  </div>
                </div>

                <div className="content-stat-card">
                  <div className="content-stat-info">
                    <span className="content-stat-tag">URUTAN BERIKUTNYA</span>
                    <span className="content-stat-val">Testimoni ke-{nextTestiOrder}</span>
                    <span className="content-stat-desc">Otomatis dideteksi sistem</span>
                  </div>
                  <div className="content-stat-icon">
                    <Sparkles size={22} />
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="content-section-header">
                <div className="content-section-title">
                  <h2>Daftar Testimoni Landing Page & Publik</h2>
                  <p>
                    Testimoni dari pengguna otomatis langsung tayang. Anda dapat mengatur visibilitas (sembunyikan/tampilkan)
                    kapan saja dengan satu kali klik.
                  </p>
                </div>
                <button
                  type="button"
                  className="content-btn content-btn--primary"
                  onClick={() => setTestiModal({ open: true, item: null })}
                >
                  <Plus size={16} />
                  <span>Tambah Testimoni</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div className="content-testi-filters" role="tablist" aria-label="Filter status testimoni">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={testiFilter === "all"}
                    className={`content-filter-btn ${testiFilter === "all" ? "content-filter-btn--active" : ""}`}
                    onClick={() => setTestiFilter("all")}
                  >
                    <span>Semua</span>
                    <span className="content-filter-count">{content.testimonials.length}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={testiFilter === "visible"}
                    className={`content-filter-btn ${testiFilter === "visible" ? "content-filter-btn--active" : ""}`}
                    onClick={() => setTestiFilter("visible")}
                  >
                    <span>🟢 Ditampilkan Publik</span>
                    <span className="content-filter-count">{visibleTestiCount}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={testiFilter === "hidden"}
                    className={`content-filter-btn ${testiFilter === "hidden" ? "content-filter-btn--active" : ""}`}
                    onClick={() => setTestiFilter("hidden")}
                  >
                    <span>⚪ Disembunyikan</span>
                    <span className="content-filter-count">{hiddenTestiCount}</span>
                  </button>
                </div>

                <span style={{ fontSize: "12px", color: "var(--cc-ink-muted)" }}>
                  Menampilkan {filteredTestimonials.length} dari {content.testimonials.length} testimoni
                </span>
              </div>

              {/* Testimonials Grid */}
              {filteredTestimonials.length > 0 ? (
                <div className="content-testimonials-grid">
                  {filteredTestimonials.map((testi) => (
                    <article key={testi.id} className="content-testimonial-card">
                      <div>
                        {/* Header: User Avatar & Role */}
                        <div className="content-testimonial-header">
                          <div className="content-author-box">
                            {testi.foto_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={testi.foto_url} alt="" className="content-avatar" />
                            ) : (
                              <div className="content-avatar-fallback">
                                {testi.nama ? testi.nama.charAt(0).toUpperCase() : "A"}
                              </div>
                            )}
                            <div className="content-author-meta">
                              <span className="content-author-name">{testi.nama}</span>
                              <span className="content-author-role">{testi.angkatan || "HIMANIKA"}</span>
                            </div>
                          </div>

                          <span className="content-order-badge" style={{ position: "static" }} title="Urutan tampilan">
                            #{String(testi.sort_order).padStart(2, "0")}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div style={{ marginTop: "10px", marginBottom: "8px" }}>
                          {testi.is_visible ? (
                            <span className="content-testi-badge content-testi-badge--visible">
                              <CheckCircle2 size={12} />
                              <span>Ditampilkan Publik</span>
                            </span>
                          ) : testi.status === "pending" ? (
                            <span className="content-testi-badge content-testi-badge--hidden">
                              <Clock size={12} />
                              <span>Menunggu Persetujuan</span>
                            </span>
                          ) : (
                            <span className="content-testi-badge content-testi-badge--hidden">
                              <EyeOff size={12} />
                              <span>Disembunyikan</span>
                            </span>
                          )}
                        </div>

                        {/* User Sender Attribution */}
                        {testi.user_account_name ? (
                          <div className="content-testi-sender" title={`Dikirim dari akun user ID: ${testi.user_id}`}>
                            <User size={13} style={{ flexShrink: 0 }} />
                            <span>
                              Pengirim: <strong>{testi.user_account_name}</strong> {testi.user_email ? `(${testi.user_email})` : ""}
                            </span>
                          </div>
                        ) : (
                          <div className="content-testi-sender" style={{ opacity: 0.75 }}>
                            <Sparkles size={13} style={{ flexShrink: 0 }} />
                            <span>Dibuat langsung oleh Admin</span>
                          </div>
                        )}

                        <p className="content-quote-text" style={{ marginTop: "12px" }}>
                          {testi.quote}
                        </p>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="content-card-actions" style={{ flexWrap: "wrap", marginTop: "12px" }}>
                        <button
                          type="button"
                          className={`content-card-btn ${!testi.is_visible ? "content-card-btn--approve" : ""}`}
                          onClick={() => handleToggleVisibility(testi)}
                          disabled={actionBusyId === testi.id}
                          title={testi.is_visible ? "Sembunyikan dari publik" : "Tampilkan ke publik"}
                        >
                          {testi.is_visible ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{testi.is_visible ? "Sembunyikan" : testi.status === "pending" ? "Setujui & Tampilkan" : "Tampilkan"}</span>
                        </button>

                        <button
                          type="button"
                          className="content-card-btn"
                          onClick={() => setTestiModal({ open: true, item: testi })}
                          disabled={actionBusyId === testi.id}
                          title="Ubah testimoni"
                        >
                          <Edit3 size={13} />
                          <span>Ubah</span>
                        </button>

                        <button
                          type="button"
                          className="content-card-btn content-card-btn--danger"
                          onClick={() => setDeleteModal({ open: true, kind: "testimonials", item: testi, busy: false })}
                          disabled={actionBusyId === testi.id}
                          title="Hapus testimoni"
                        >
                          <Trash2 size={13} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="content-empty-box">
                  <div className="content-empty-icon">
                    <MessageSquare size={26} />
                  </div>
                  <h3 className="content-empty-title">
                    {testiFilter === "visible"
                      ? "Tidak Ada Testimoni yang Sedang Ditampilkan"
                      : testiFilter === "hidden"
                      ? "Tidak Ada Testimoni yang Disembunyikan"
                      : "Belum Ada Testimoni"}
                  </h3>
                  <p className="content-empty-desc">
                    {testiFilter === "hidden"
                      ? "Semua testimoni saat ini aktif dan dapat dibaca oleh publik."
                      : "Belum ada testimoni tersimpan. Anda dapat menambahkannya secara manual atau menunggu inputan dari pengguna."}
                  </p>
                  {testiFilter === "all" && (
                    <button
                      type="button"
                      className="content-btn content-btn--primary"
                      onClick={() => setTestiModal({ open: true, item: null })}
                    >
                      <Plus size={16} />
                      <span>Tambah Testimoni Pertama</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEKS HALAMAN UTAMA */}
          {activeTab === "text" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="content-section-header">
                <div className="content-section-title">
                  <h2>Teks Narasi Landing Page</h2>
                  <p>Sesuaikan headline hero, pengantar organisasi tentang HIMANIKA, serta butir visi & 4 misi.</p>
                </div>
              </div>

              <TextManager content={content} onSaved={() => load(true)} />
            </div>
          )}
        </>
      )}

      {/* Add Multiple Gallery Photos Modal */}
      {addGalleryOpen && (
        <AddGalleryBatchModal
          existingGallery={content.gallery}
          onClose={() => setAddGalleryOpen(false)}
          onSaved={() => load(true)}
        />
      )}

      {/* Edit Single Gallery Photo Modal */}
      {editGalleryItem && (
        <EditGalleryModal
          item={editGalleryItem}
          onClose={() => setEditGalleryItem(null)}
          onSaved={() => load(true)}
        />
      )}

      {/* Testimonial Modal */}
      {testiModal.open && (
        <TestimonialModal
          key={testiModal.item?.id || "new-testi"}
          item={testiModal.item}
          existingTestimonials={content.testimonials}
          onClose={() => setTestiModal({ open: false, item: null })}
          onSaved={() => load(true)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <DeleteConfirmModal
          kind={deleteModal.kind}
          item={deleteModal.item}
          busy={deleteModal.busy}
          onClose={() => setDeleteModal({ open: false, kind: null, item: null, busy: false })}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
