"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, UploadCloud } from "lucide-react";
import { api } from "@/services/api";
import { divisionPreview } from "@/components/oprec/divisionPreview";
import { getDefaultJabatan } from "@/lib/oprec";
import { OprecPeriodPicker } from "./OprecPeriodPicker";
import "./oprec-create-dialog.css";

const firstFields = [
  { name: "nama", label: "Nama lengkap", type: "text", required: true, maxLength: 150 },
  { name: "nim", label: "NIM", type: "text", required: true, maxLength: 32 },
  { name: "tanggal_lahir", label: "Tanggal lahir", type: "date", required: true },
  { name: "angkatan", label: "Angkatan", type: "select", required: true, options: [] },
];

const initial = {
  periode: "",
  headline: "Open Recruitment HIMANIKA",
  deskripsi: "",
  tanggal_buka: "",
  tanggal_tutup: "",
  poster: "",
};

const apiDateStart = (value) =>
  value ? (value.includes("T") ? new Date(value).toISOString() : new Date(`${value}T00:00:00+07:00`).toISOString()) : null;
const apiDateEnd = (value) =>
  value ? (value.includes("T") ? new Date(value).toISOString() : new Date(`${value}T23:59:59+07:00`).toISOString()) : null;

export default function OprecCreateDialog({ open, onClose, onCreated }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setData(initial);
    setPosterFile(null);
    setPosterPreview("");
    setError("");
  }, [open]);

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
    if (!data.periode.trim() || data.periode.startsWith("/") || data.periode.endsWith("/")) {
      setError("Pilih tahun awal dan tahun akhir periode kepengurusan.");
      return;
    }
    if (!data.headline.trim() || !data.tanggal_buka || !data.tanggal_tutup) {
      setError("Isi headline dan tanggal periode pendaftaran.");
      return;
    }
    if (data.tanggal_tutup < data.tanggal_buka) {
      setError("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      let poster = data.poster.trim() || null;
      if (posterFile) {
        const body = new FormData();
        body.set("poster", posterFile);
        const response = await api.post("/admin/oprec/upload-poster", body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        poster = response.data?.url;
        if (!poster) throw new Error("Poster gagal diunggah.");
      }

      const response = await api.post("/admin/oprec", {
        periode: data.periode.trim(),
        status: "draft",
        headline: data.headline.trim(),
        deskripsi: data.deskripsi.trim(),
        poster,
        tanggal_buka: apiDateStart(data.tanggal_buka),
        tanggal_tutup: apiDateEnd(data.tanggal_tutup),
        schema_version: "1",
        form_intro: "",
        form_fields: firstFields,
        divisi_tersedia: divisionPreview.map((item) => ({
          nama: item.nama,
          nama_lengkap: item.namaLengkap,
          deskripsi: item.deskripsi,
          logo: item.logo || null,
          jabatan:
            Array.isArray(item.jabatan) && item.jabatan.length > 0
              ? item.jabatan
              : getDefaultJabatan(item.nama),
        })),
        faq: [],
        pengumuman: { published: false, tanggal: null, pesan: "" },
      });

      onCreated?.();
      onClose();
      router.push(`/admin/oprec/${response.data.data.id}/edit`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : err.message || "Pendaftaran belum berhasil dibuat.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="oprec-dialog__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="oprec-dialog" role="dialog" aria-modal="true" aria-labelledby="oprec-dialog-title">
        <header className="oprec-dialog__header">
          <div>
            <span>// PENDAFTARAN OPREC</span>
            <h2 id="oprec-dialog-title">Buat Pendaftaran OPREC Baru</h2>
            <p>Tentukan periode dan jadwal pendaftaran. Setelah dibuat, kamu akan diarahkan ke penyusun formulir.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Tutup popup">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={submit} className="oprec-dialog__form">
          {error && <div className="oprec-dialog__error" role="alert">{error}</div>}

          <div className="oprec-dialog__field-group">
            <span className="oprec-dialog__label">
              Periode kepengurusan <span className="oprec-dialog__required">*</span>
            </span>
            <OprecPeriodPicker value={data.periode} onChange={(val) => set("periode", val)} />
          </div>

          <label>
            <span className="oprec-dialog__label">
              Headline Pendaftaran <span className="oprec-dialog__required">*</span>
            </span>
            <input
              autoFocus
              required
              value={data.headline}
              onChange={(event) => set("headline", event.target.value)}
              placeholder="Open Recruitment HIMANIKA"
              maxLength={300}
            />
          </label>

          <div className="oprec-dialog__dates">
            <label>
              <span className="oprec-dialog__label">
                Tanggal mulai <span className="oprec-dialog__required">*</span>
              </span>
              <input
                required
                type="date"
                value={data.tanggal_buka}
                onChange={(event) => set("tanggal_buka", event.target.value)}
              />
            </label>
            <label>
              <span className="oprec-dialog__label">
                Tanggal selesai <span className="oprec-dialog__required">*</span>
              </span>
              <input
                required
                type="date"
                value={data.tanggal_tutup}
                onChange={(event) => set("tanggal_tutup", event.target.value)}
              />
            </label>
          </div>

          <label>
            <span className="oprec-dialog__label">Deskripsi</span>
            <textarea
              rows={4}
              value={data.deskripsi}
              onChange={(event) => set("deskripsi", event.target.value)}
              placeholder="Informasi singkat mengenai pendaftaran calon anggota untuk periode ini."
              maxLength={5000}
            />
          </label>

          <label className="oprec-dialog__poster">
            <span className="oprec-dialog__label">Poster / pamflet</span>
            <span className="oprec-dialog__upload">
              {posterPreview || data.poster ? (
                <img src={posterPreview || data.poster} alt="Pratinjau poster" />
              ) : (
                <UploadCloud size={30} aria-hidden="true" />
              )}
              <span>
                <strong>{posterFile ? posterFile.name : data.poster ? "Ganti poster" : "Pilih poster"}</strong>
                <small>JPG, PNG, atau WebP · maksimal 5 MB</small>
              </span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                  setError("Poster harus JPG, PNG, atau WebP maksimal 5 MB.");
                  return;
                }
                setPosterFile(file);
                setPosterPreview(URL.createObjectURL(file));
                setError("");
              }}
            />
          </label>

          <footer>
            <button type="button" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Buat & lanjut ke formulir"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
