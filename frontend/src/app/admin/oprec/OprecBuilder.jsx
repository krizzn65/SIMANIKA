"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedCheckIcon } from "@/components/ui/AnimatedCheckIcon";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Layers,
  ListChecks,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { api } from "@/services/api";
import { divisionPreview } from "@/components/oprec/divisionPreview";
import { OprecPeriodPicker } from "./OprecPeriodPicker";
import "./oprec-create-dialog.css";
import "./oprec-builder.css";

const fixed = [
  { name: "nama", type: "text", label: "Nama lengkap", required: true, maxLength: 150 },
  { name: "nim", type: "text", label: "NIM", required: true, maxLength: 32 },
  { name: "tanggal_lahir", type: "date", label: "Tanggal lahir", required: true },
  { name: "angkatan", type: "select", label: "Angkatan", required: true, options: [] },
  { name: "divisi_pilihan_1", type: "select", label: "Divisi pilihan", required: true, options: [] },
];

const fieldTypes = [
  ["text", "Teks singkat"],
  ["textarea", "Paragraf"],
  ["email", "Email"],
  ["tel", "Nomor telepon"],
  ["number", "Angka"],
  ["date", "Tanggal"],
  ["select", "Pilihan dropdown"],
  ["radio", "Pilihan satu"],
  ["checkbox", "Persetujuan"],
  ["file", "Unggah berkas"],
];

const newField = (index) => ({
  name: `pertanyaan_${index}`,
  label: "",
  type: "text",
  required: false,
  help: "",
  maxLength: 255,
});

const emptyDivision = () => ({
  nama: "",
  nama_lengkap: "",
  deskripsi: "",
  logo: "",
  kuota: "",
});

const initial = () => ({
  periode: "",
  status: "closed",
  headline: "",
  deskripsi: "",
  poster: "",
  poster_alt: "",
  tanggal_buka: "",
  tanggal_tutup: "",
  schema_version: "1",
  form_intro: "",
  form_fields: fixed,
  divisi_tersedia: divisionPreview.map((item) => ({
    nama: item.nama,
    nama_lengkap: item.namaLengkap,
    deskripsi: item.deskripsi,
    logo: item.logo || "",
    kuota: "",
  })),
  faq: [],
  pengumuman: { published: false, tanggal: null, pesan: "" },
});

const localDateOnly = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
};

const apiDateStart = (value) => {
  if (!value) return null;
  if (value.includes("T")) return new Date(value).toISOString();
  return new Date(`${value}T00:00:00+07:00`).toISOString();
};

const apiDateEnd = (value) => {
  if (!value) return null;
  if (value.includes("T")) return new Date(value).toISOString();
  return new Date(`${value}T23:59:59+07:00`).toISOString();
};

const toOptions = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ value: line, label: line }));

const fromOptions = (options) => (options || []).map((item) => item.label).join("\n");

export default function OprecBuilder({ oprecId }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(oprecId));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [showPreview, setShowPreview] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [dragOverPoster, setDragOverPoster] = useState(false);
  const [uploadingLogoIndex, setUploadingLogoIndex] = useState(null);
  const [dragOverLogoIndex, setDragOverLogoIndex] = useState(null);
  const posterInputRef = useRef(null);

  useEffect(() => {
    if (!oprecId) return;
    let active = true;
    api
      .get(`/admin/oprec/${oprecId}`)
      .then(({ data: response }) => {
        const item = response.data;
        if (!item) throw new Error("Periode OPREC tidak ditemukan.");
        if (!active) return;
        setData({
          periode: item.periode,
          status: item.status,
          headline: item.headline || "",
          deskripsi: item.deskripsi || "",
          poster: item.poster || "",
          poster_alt: item.posterAlt || "",
          tanggal_buka: localDateOnly(item.tanggalBuka),
          tanggal_tutup: localDateOnly(item.tanggalTutup),
          schema_version: String(item.schemaVersion || "1"),
          form_intro: item.formIntro || "",
          form_fields: [
            ...fixed.map((template) => ({
              ...template,
              ...(item.formFields || []).find((field) => field.name === template.name),
            })),
            ...(item.formFields || []).filter(
              (field) => !fixed.some((template) => template.name === field.name)
            ),
          ],
          divisi_tersedia: (item.divisiTersedia || []).map((division) => ({
            nama: division.nama,
            nama_lengkap: division.namaLengkap || "",
            deskripsi: division.deskripsi || "",
            logo: division.logo || "",
            kuota: division.kuota ?? "",
          })),
          faq: item.faq || [],
          pengumuman: item.pengumuman || { published: false, tanggal: null, pesan: "" },
        });
      })
      .catch((err) => active && setError(err.message || "Gagal memuat periode."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [oprecId]);

  const set = (key, value) => {
    setData((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const setField = (index, patch) =>
    set(
      "form_fields",
      data.form_fields.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );

  const setDivision = (index, patch) =>
    set(
      "divisi_tersedia",
      data.divisi_tersedia.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );

  const handlePosterFile = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran berkas poster maksimal 5 MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format poster harus berupa JPG, PNG, atau WebP.");
      return;
    }

    setUploadingPoster(true);
    setError("");

    try {
      const body = new FormData();
      body.append("poster", file);
      const res = await api.post("/admin/oprec/upload-poster", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.url;
      if (!url) throw new Error("Gagal mengunggah poster.");
      set("poster", url);
    } catch (err) {
      const msg =
        err.response?.data?.errors?.poster?.[0] ||
        err.response?.data?.message ||
        err.message ||
        "Gagal mengunggah poster.";
      setError(msg);
    } finally {
      setUploadingPoster(false);
    }
  };

  const handlePosterInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePosterFile(file);
    }
    event.target.value = "";
  };

  const handlePosterDrop = (event) => {
    event.preventDefault();
    setDragOverPoster(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handlePosterFile(file);
    }
  };

  const handleDivisionLogoUpload = async (index, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran logo maksimal 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format logo harus berupa JPG, PNG, atau WebP.");
      return;
    }

    setUploadingLogoIndex(index);
    setError("");

    try {
      const body = new FormData();
      body.append("logo", file);
      const res = await api.post("/admin/oprec/upload-logo", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.url;
      if (!url) throw new Error("Gagal mengunggah logo divisi.");
      setDivision(index, { logo: url });
    } catch (err) {
      const msg =
        err.response?.data?.errors?.logo?.[0] ||
        err.response?.data?.errors?.poster?.[0] ||
        err.response?.data?.message ||
        err.message ||
        "Gagal mengunggah logo divisi.";
      setError(msg);
    } finally {
      setUploadingLogoIndex(null);
    }
  };

  const removeField = (index) =>
    set(
      "form_fields",
      data.form_fields.filter((_, i) => i !== index)
    );

  const moveField = (index, offset) => {
    const next = [...data.form_fields];
    const target = index + offset;
    if (index < fixed.length || target < fixed.length || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("form_fields", next);
  };

  const validate = () => {
    if (
      !data.periode.trim() ||
      data.periode.startsWith("/") ||
      data.periode.endsWith("/")
    )
      return "Pilih tahun awal dan tahun akhir periode kepengurusan.";
    if (
      !data.tanggal_buka ||
      !data.tanggal_tutup ||
      data.tanggal_tutup < data.tanggal_buka
    )
      return "Tanggal tutup tidak boleh sebelum tanggal buka.";
    if (!data.divisi_tersedia.length || data.divisi_tersedia.some((item) => !item.nama.trim()))
      return "Tambahkan divisi dan isi nama setiap divisi.";
    if (!data.form_fields[3].options?.length) return "Isi minimal satu pilihan angkatan.";
    if (data.form_fields[3].options.some((option) => !/^(19|20)\d{2}$/.test(option.value)))
      return "Pilihan angkatan harus tahun empat digit, misalnya 2024.";
    if (data.form_fields.length > 40) return "Maksimal 40 kolom.";
    const names = new Set();
    for (const field of data.form_fields) {
      if (
        !field.label?.trim() ||
        !/^[a-z][a-z0-9_]{0,49}$/.test(field.name) ||
        names.has(field.name)
      )
        return "Setiap kolom membutuhkan label dan kode unik (huruf kecil, angka, garis bawah).";
      names.add(field.name);
      if (
        ["select", "radio"].includes(field.type) &&
        field.name !== "divisi_pilihan_1" &&
        !field.options?.length
      )
        return `Isi pilihan untuk ${field.label}.`;
    }
    return "";
  };

  const save = async (nextStatus = data.status) => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    const payload = {
      ...data,
      status: nextStatus,
      periode: data.periode.trim(),
      tanggal_buka: apiDateStart(data.tanggal_buka),
      tanggal_tutup: apiDateEnd(data.tanggal_tutup),
      poster: data.poster.trim() || null,
      poster_alt: data.poster_alt.trim() || null,
      divisi_tersedia: data.divisi_tersedia.map((item) => ({
        ...item,
        logo: item.logo.trim() || null,
        kuota: item.kuota === "" ? null : Number(item.kuota),
      })),
      form_fields: data.form_fields.map((field) => ({
        name: field.name,
        label: field.label.trim(),
        type: field.type,
        required: Boolean(field.required),
        help: field.help || null,
        placeholder: field.placeholder || null,
        ...(["select", "radio"].includes(field.type)
          ? { options: field.name === "divisi_pilihan_1" ? [] : field.options || [] }
          : {}),
        ...(field.type === "file"
          ? {
              accept: field.accept?.length
                ? field.accept
                : [".pdf", ".jpg", ".jpeg", ".png"],
              maxSizeMB: Number(field.maxSizeMB || 5),
            }
          : {}),
        ...(["text", "email", "tel", "textarea"].includes(field.type)
          ? {
              maxLength: Number(
                field.maxLength || (field.type === "textarea" ? 3000 : 255)
              ),
            }
          : {}),
      })),
      pengumuman: {
        published: Boolean(data.pengumuman?.published),
        tanggal: data.pengumuman?.tanggal || null,
        pesan: data.pengumuman?.pesan || "",
      },
    };
    try {
      const response = oprecId
        ? await api.put(`/admin/oprec/${oprecId}`, payload)
        : await api.post("/admin/oprec", payload);
      setSaved(true);
      setData((current) => ({ ...current, status: nextStatus }));
      if (!oprecId) router.replace(`/admin/oprec/${response.data.data.id}/edit`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors ? Object.values(errors).flat().join(" ") : err.message || "Gagal menyimpan formulir."
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="oprec-builder__loading">Memuat formulir OPREC…</div>;

  return (
    <div className="oprec-builder">
      {/* Back navigation */}
      <Link href="/admin/oprec" className="oprec-builder__back">
        <ArrowLeft aria-hidden="true" size={16} />
        <span>Kembali ke Kelola OPREC</span>
      </Link>

      {/* Hero Header */}
      <header className="oprec-builder__hero">
        <div>
          <span className="oprec-builder__eyebrow">// TAHAP 01 · FORM BUILDER</span>
          <h1>Susun Formulir Pendaftaran</h1>
          <div className="oprec-builder__hero-meta">
            <span>PERIODE: {data.periode || "BELUM DIISI"}</span>
            <span>
              STATUS:{" "}
              {data.status === "draft"
                ? "DRAFT"
                : data.status === "open"
                ? "TERBIT"
                : "DITUTUP"}
            </span>
          </div>
        </div>

        <div className="oprec-builder__hero-actions">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="oprec-btn oprec-btn--secondary"
            title={showPreview ? "Sembunyikan pratinjau" : "Tampilkan pratinjau"}
          >
            {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{showPreview ? "Tutup Pratinjau" : "Lihat Pratinjau"}</span>
          </button>

          {data.status === "draft" && (
            <button
              type="button"
              onClick={() => save("open")}
              disabled={busy}
              className="oprec-btn oprec-btn--secondary"
            >
              <span>Publikasikan</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => save(data.status)}
            disabled={busy}
            className="oprec-btn oprec-btn--primary"
          >
            <Save size={15} aria-hidden="true" />
            <span>{busy ? "Menyimpan…" : "Simpan Formulir"}</span>
          </button>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="oprec-builder__error" role="alert">
          {error}
        </div>
      )}
      {saved && (
        <div className="oprec-builder__success" role="status">
          <AnimatedCheckIcon size={16} active />
          <span>Formulir pendaftaran berhasil disimpan.</span>
        </div>
      )}

      {/* Segmented Tabs Navigation */}
      <nav className="oprec-builder__tabs" aria-label="Bagian formulir">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`oprec-builder__tab-btn ${
            activeTab === "info" ? "oprec-builder__tab-btn--active" : ""
          }`}
        >
          <Calendar size={15} />
          <span>1. Informasi & Jadwal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("divisions")}
          className={`oprec-builder__tab-btn ${
            activeTab === "divisions" ? "oprec-builder__tab-btn--active" : ""
          }`}
        >
          <Layers size={15} />
          <span>2. Kelola Divisi</span>
          <span className="oprec-builder__tab-badge">{data.divisi_tersedia.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fields")}
          className={`oprec-builder__tab-btn ${
            activeTab === "fields" ? "oprec-builder__tab-btn--active" : ""
          }`}
        >
          <ListChecks size={15} />
          <span>3. Pertanyaan Formulir</span>
          <span className="oprec-builder__tab-badge">{data.form_fields.length}</span>
        </button>
      </nav>

      {/* Main Layout (Editor + Live Preview) */}
      <div
        className={`oprec-builder__layout ${
          !showPreview ? "oprec-builder__layout--full" : ""
        }`}
      >
        <div className="oprec-builder__main">
          {/* TAB 1: INFORMASI & JADWAL */}
          {activeTab === "info" && (
            <section className="oprec-builder__card">
              <div className="oprec-builder__section-head">
                <div>
                  <h2>Informasi Utama & Jadwal</h2>
                  <p>Atur headline, jadwal buka-tutup, deskripsi, dan poster pendaftaran.</p>
                </div>
              </div>

              <div className="oprec-builder__grid">
                <div className="oprec-builder__field-group">
                  <span className="oprec-builder__label">
                    Periode Kepengurusan <span className="oprec-builder__required">*</span>
                  </span>
                  <OprecPeriodPicker
                    value={data.periode}
                    onChange={(val) => set("periode", val)}
                  />
                </div>

                <label>
                  Status Seleksi
                  <select
                    value={data.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="draft">Draft (Belum dibuka)</option>
                    <option value="open">Terbit (Pendaftaran dibuka)</option>
                    <option value="closed">Ditutup (Pendaftaran selesai)</option>
                  </select>
                </label>

                <label>
                  <span>Tanggal Buka <span className="oprec-builder__required">*</span></span>
                  <input
                    type="date"
                    value={data.tanggal_buka}
                    onChange={(e) => set("tanggal_buka", e.target.value)}
                  />
                </label>

                <label>
                  <span>Tanggal Tutup <span className="oprec-builder__required">*</span></span>
                  <input
                    type="date"
                    value={data.tanggal_tutup}
                    onChange={(e) => set("tanggal_tutup", e.target.value)}
                  />
                </label>

                <label className="wide">
                  Headline Pendaftaran
                  <input
                    value={data.headline}
                    onChange={(e) => set("headline", e.target.value)}
                    placeholder="Saatnya menjadi bagian dari HIMANIKA"
                    maxLength={300}
                  />
                </label>

                <label className="wide">
                  Pengantar Formulir (Tampil di atas form calon anggota)
                  <textarea
                    rows={2}
                    value={data.form_intro}
                    onChange={(e) => set("form_intro", e.target.value)}
                    placeholder="Isi data diri dengan teliti. Kolom bertanda * wajib diisi."
                    maxLength={2000}
                  />
                </label>

                <label className="wide">
                  Deskripsi Lengkap
                  <textarea
                    rows={4}
                    value={data.deskripsi}
                    onChange={(e) => set("deskripsi", e.target.value)}
                    placeholder="Jelaskan tujuan dan persyaratan umum OPREC periode ini."
                    maxLength={5000}
                  />
                </label>

                <div className="oprec-builder__poster-zone">
                  <div className="flex items-center justify-between mb-1">
                    <span className="oprec-builder__poster-label">
                      Poster / Pamflet OPREC (Opsional)
                    </span>
                    {uploadingPoster && (
                      <span className="text-xs font-mono text-blue-600 flex items-center gap-1.5">
                        <RefreshCw size={12} className="animate-spin" />
                        Mengunggah...
                      </span>
                    )}
                  </div>

                  {data.poster ? (
                    <div className="oprec-builder__poster-preview-card">
                      <img
                        src={data.poster}
                        alt="Poster OPREC"
                        className="oprec-builder__poster-thumb"
                      />
                      <div className="oprec-builder__poster-meta">
                        <strong className="text-slate-800">Poster Terpasang</strong>
                        <span className="text-xs text-slate-500">Berkas gambar poster aktif dan siap ditampilkan.</span>
                        <div className="oprec-builder__poster-actions mt-2">
                          <input
                            ref={posterInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handlePosterInputChange}
                            disabled={uploadingPoster}
                          />
                          <button
                            type="button"
                            className="oprec-btn oprec-btn--secondary"
                            onClick={() => posterInputRef.current?.click()}
                            disabled={uploadingPoster}
                          >
                            <RefreshCw size={13} />
                            <span>Ganti Poster</span>
                          </button>
                          <button
                            type="button"
                            className="oprec-btn oprec-btn--danger"
                            onClick={() => set("poster", "")}
                            disabled={uploadingPoster}
                          >
                            <Trash2 size={13} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      className={`oprec-builder__poster-drop ${dragOverPoster ? "is-dragging" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverPoster(true);
                      }}
                      onDragLeave={() => setDragOverPoster(false)}
                      onDrop={handlePosterDrop}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePosterInputChange}
                        disabled={uploadingPoster}
                      />
                      {uploadingPoster ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <RefreshCw size={26} className="animate-spin text-blue-600" />
                          <span className="text-xs font-mono text-blue-600">
                            Mengunggah poster ke server...
                          </span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={28} className="text-slate-400" />
                          <span className="oprec-builder__poster-pick-btn">
                            Pilih Berkas Poster
                          </span>
                          <small>atau seret gambar ke sini · JPG, PNG, WebP maks. 5 MB</small>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Advanced Technical Settings */}
              <div className="oprec-builder__advanced">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="oprec-builder__advanced-toggle"
                >
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>Pengaturan Teknis Lanjutan</span>
                </button>
                {showAdvanced && (
                  <div className="mt-3">
                    <label className="text-xs font-mono text-slate-700 block mb-1">
                      Versi Skema Formulir
                    </label>
                    <input
                      className="w-48 px-3 py-1.5 border border-slate-300 font-mono text-xs"
                      value={data.schema_version}
                      onChange={(e) => set("schema_version", e.target.value)}
                      maxLength={20}
                    />
                    <small className="text-slate-500 block text-xs mt-1">
                      Naikkan nomor versi jika pertanyaan formulir diubah setelah ada pendaftar masuk.
                    </small>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB 2: KELOLA DIVISI */}
          {activeTab === "divisions" && (
            <section className="oprec-builder__card">
              <div className="oprec-builder__section-head">
                <div>
                  <h2>Divisi yang Dibuka</h2>
                  <p>
                    Kelola divisi yang dapat dipilih oleh calon anggota beserta kuotanya.
                  </p>
                </div>
              </div>

              <div className="oprec-builder__divisions">
                {data.divisi_tersedia.map((division, index) => (
                  <div className="oprec-builder__division" key={index}>
                    <div className="oprec-builder__division-head">
                      <span className="oprec-builder__logo">
                        {division.logo ? (
                          <img src={division.logo} alt="" />
                        ) : (
                          division.nama?.slice(0, 2).toUpperCase() || "//"
                        )}
                      </span>
                      <strong>
                        Divisi {index + 1}: {division.nama || "Tanpa Nama"}
                      </strong>
                      <button
                        type="button"
                        aria-label={`Hapus divisi ${division.nama || index + 1}`}
                        onClick={() =>
                          set(
                            "divisi_tersedia",
                            data.divisi_tersedia.filter((_, i) => i !== index)
                          )
                        }
                        title="Hapus divisi"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="oprec-builder__grid">
                      <label>
                        <span>Nama Singkat <span className="oprec-builder__required">*</span></span>
                        <input
                          value={division.nama}
                          onChange={(e) =>
                            setDivision(index, { nama: e.target.value })
                          }
                          placeholder="Contoh: BPH, HUMAS, KOMINFO"
                          maxLength={150}
                        />
                      </label>

                      <label>
                        Nama Lengkap
                        <input
                          value={division.nama_lengkap}
                          onChange={(e) =>
                            setDivision(index, { nama_lengkap: e.target.value })
                          }
                          placeholder="Contoh: Badan Pengurus Harian"
                          maxLength={200}
                        />
                      </label>

                      <label>
                        Kuota Calon Anggota
                        <input
                          type="number"
                          min="0"
                          value={division.kuota}
                          onChange={(e) =>
                            setDivision(index, { kuota: e.target.value })
                          }
                          placeholder="Kosongkan jika tanpa batas"
                        />
                      </label>

                      <div className="oprec-builder__division-logo-zone">
                        <span className="oprec-builder__label">Logo / Ikon Divisi</span>
                        {division.logo ? (
                          <div className="oprec-builder__logo-preview-card">
                            <div className="oprec-builder__logo-thumb-wrapper">
                              <img
                                src={division.logo}
                                alt={`Logo ${division.nama || "divisi"}`}
                                className="oprec-builder__logo-thumb"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                            <div className="oprec-builder__logo-meta">
                              <span
                                className="oprec-builder__logo-name truncate"
                                title={division.logo}
                              >
                                {division.logo.startsWith("/images/divisi/")
                                  ? division.logo.split("/").pop()
                                  : "Logo Terpasang"}
                              </span>
                              <div className="oprec-builder__logo-actions">
                                <label
                                  className="oprec-btn oprec-btn--secondary oprec-builder__logo-btn"
                                  title="Ganti logo divisi"
                                >
                                  <RefreshCw
                                    size={12}
                                    className={
                                      uploadingLogoIndex === index ? "animate-spin" : ""
                                    }
                                  />
                                  <span>
                                    {uploadingLogoIndex === index ? "Mengunggah..." : "Ganti"}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    disabled={uploadingLogoIndex === index}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleDivisionLogoUpload(index, file);
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="oprec-btn oprec-btn--danger oprec-builder__logo-btn"
                                  onClick={() => setDivision(index, { logo: "" })}
                                  disabled={uploadingLogoIndex === index}
                                  title="Hapus logo divisi"
                                >
                                  <Trash2 size={12} />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <label
                            className={`oprec-builder__logo-drop ${
                              dragOverLogoIndex === index ? "is-dragging" : ""
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverLogoIndex(index);
                            }}
                            onDragLeave={() => setDragOverLogoIndex(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverLogoIndex(null);
                              const file = e.dataTransfer?.files?.[0];
                              if (file) handleDivisionLogoUpload(index, file);
                            }}
                          >
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDivisionLogoUpload(index, file);
                                e.target.value = "";
                              }}
                              disabled={uploadingLogoIndex === index}
                            />
                            {uploadingLogoIndex === index ? (
                              <div className="flex items-center justify-center gap-1.5 py-1 text-blue-600 font-mono text-xs w-full">
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Mengunggah logo...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5 text-slate-500 w-full min-w-0">
                                <span className="oprec-builder__logo-pick-btn">
                                  <UploadCloud size={13} />
                                  <span>Pilih Berkas</span>
                                </span>
                                <span className="text-xs text-slate-500 font-normal truncate">
                                  atau seret ke sini
                                </span>
                                <small className="text-[10px] text-slate-400 font-mono ml-auto shrink-0 hidden sm:inline">
                                  Maks 5 MB
                                </small>
                              </div>
                            )}
                          </label>
                        )}
                      </div>

                      <label className="wide">
                        Deskripsi Singkat Divisi
                        <input
                          value={division.deskripsi}
                          onChange={(e) =>
                            setDivision(index, { deskripsi: e.target.value })
                          }
                          placeholder="Deskripsi tugas dan fungsi divisi..."
                          maxLength={500}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="oprec-builder__add"
                onClick={() =>
                  set("divisi_tersedia", [...data.divisi_tersedia, emptyDivision()])
                }
              >
                <Plus size={15} aria-hidden="true" />
                <span>Tambah Divisi Baru</span>
              </button>
            </section>
          )}

          {/* TAB 3: PERTANYAAN FORMULIR */}
          {activeTab === "fields" && (
            <section className="oprec-builder__card">
              <div className="oprec-builder__section-head">
                <div>
                  <h2>Pertanyaan Formulir</h2>
                  <p>
                    Lima pertanyaan awal adalah standar sistem. Anda dapat menambahkan
                    pertanyaan kustom di bawahnya.
                  </p>
                </div>
              </div>

              <div className="oprec-builder__fields">
                {data.form_fields.map((field, index) => {
                  const isFixed = index < fixed.length;
                  return (
                    <div
                      key={field.name + index}
                      className={`oprec-builder__field ${
                        isFixed ? "oprec-builder__field--fixed" : ""
                      }`}
                    >
                      <div className="oprec-builder__field-head">
                        <span className="oprec-builder__field-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <strong>{field.label || "Pertanyaan Baru"}</strong>
                        <span
                          className={`oprec-builder__field-tag ${
                            isFixed ? "oprec-builder__field-tag--fixed" : ""
                          }`}
                        >
                          {isFixed ? "WAJIB · SISTEM" : "TAMBAHAN"}
                        </span>

                        {!isFixed && (
                          <div className="oprec-builder__field-actions">
                            <button
                              type="button"
                              title="Pindahkan ke atas"
                              aria-label={`Naikkan ${field.label}`}
                              onClick={() => moveField(index, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              title="Pindahkan ke bawah"
                              aria-label={`Turunkan ${field.label}`}
                              onClick={() => moveField(index, 1)}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              title="Hapus pertanyaan"
                              aria-label={`Hapus ${field.label}`}
                              onClick={() => removeField(index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="oprec-builder__grid">
                        <label>
                          <span>Label Pertanyaan <span className="oprec-builder__required">*</span></span>
                          <input
                            value={field.label}
                            onChange={(e) =>
                              setField(index, { label: e.target.value })
                            }
                            maxLength={200}
                          />
                        </label>

                        {!isFixed ? (
                          <label>
                            Tipe Input
                            <select
                              value={field.type}
                              onChange={(e) =>
                                setField(index, {
                                  type: e.target.value,
                                  options: ["select", "radio"].includes(e.target.value)
                                    ? []
                                    : undefined,
                                })
                              }
                            >
                              {fieldTypes.map(([val, lbl]) => (
                                <option key={val} value={val}>
                                  {lbl}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <label>
                            Tipe Input
                            <input
                              value={
                                fieldTypes.find(([type]) => type === field.type)?.[1] ||
                                field.type
                              }
                              disabled
                            />
                          </label>
                        )}

                        {!isFixed && (
                          <label>
                            Kode Kolom (Unik)
                            <input
                              value={field.name}
                              onChange={(e) =>
                                setField(index, {
                                  name: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_]/g, "_"),
                                })
                              }
                              maxLength={50}
                            />
                          </label>
                        )}

                        {field.name === "angkatan" && (
                          <label className="wide">
                            Pilihan Angkatan (Satu tahun per baris)
                            <textarea
                              rows={3}
                              value={fromOptions(field.options)}
                              onChange={(e) =>
                                setField(index, { options: toOptions(e.target.value) })
                              }
                              placeholder={"2023\n2024\n2025\n2026"}
                            />
                          </label>
                        )}

                        {["select", "radio"].includes(field.type) &&
                          field.name !== "angkatan" &&
                          field.name !== "divisi_pilihan_1" && (
                            <label className="wide">
                              Opsi Pilihan (Satu opsi per baris)
                              <textarea
                                rows={3}
                                value={fromOptions(field.options)}
                                onChange={(e) =>
                                  setField(index, { options: toOptions(e.target.value) })
                                }
                                placeholder={"Pilihan A\nPilihan B\nPilihan C"}
                              />
                            </label>
                          )}

                        {field.name === "divisi_pilihan_1" && (
                          <p className="oprec-builder__hint wide">
                            Pilihan divisi otomatis diambil dari tab "Kelola Divisi" di atas.
                          </p>
                        )}

                        <label className="wide">
                          Petunjuk / Teks Bantuan (Opsional)
                          <input
                            value={field.help || ""}
                            onChange={(e) =>
                              setField(index, { help: e.target.value })
                            }
                            placeholder="Contoh: Lampirkan berkas dalam format PDF..."
                            maxLength={500}
                          />
                        </label>

                        {!isFixed && (
                          <label className="oprec-builder__check">
                            <input
                              type="checkbox"
                              checked={Boolean(field.required)}
                              onChange={(e) =>
                                setField(index, { required: e.target.checked })
                              }
                            />
                            <span>Wajib diisi oleh pendaftar</span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="oprec-builder__add"
                onClick={() =>
                  set("form_fields", [...data.form_fields, newField(Date.now())])
                }
                disabled={data.form_fields.length >= 40}
              >
                <Plus size={15} aria-hidden="true" />
                <span>Tambah Pertanyaan Baru</span>
              </button>
            </section>
          )}
        </div>

        {/* ASIDE: Live Preview Panel */}
        {showPreview && (
          <aside className="oprec-builder__aside">
            <div className="oprec-builder__preview">
              <div className="oprec-builder__preview-head">
                <span>// PRATINJAU REAL-TIME</span>
                <span className="font-mono text-xs text-slate-500">Form Calon Anggota</span>
              </div>

              <div className="oprec-builder__preview-body">
                {data.poster && (
                  <div className="oprec-builder__preview-poster">
                    <img src={data.poster} alt="Poster OPREC" />
                  </div>
                )}
                <div>
                  <span className="font-mono text-[10px] text-blue-600 uppercase tracking-wider block">
                    OPREC {data.periode}
                  </span>
                  <h3>{data.headline || "Pendaftaran Calon Anggota HIMANIKA"}</h3>
                  <p className="oprec-builder__preview-intro mt-1">
                    {data.form_intro ||
                      "Isi data diri dengan teliti. Kolom bertanda * wajib diisi."}
                  </p>
                </div>

                {/* Divisi choices preview */}
                <div>
                  <span className="text-[11px] font-mono text-slate-600 uppercase tracking-wide block mb-1">
                    Pilihan Divisi ({data.divisi_tersedia.length} Tersedia)
                  </span>
                  <div className="oprec-builder__preview-divisions">
                    {data.divisi_tersedia.map((d, i) => (
                      <div className="oprec-builder__preview-division" key={i}>
                        {d.logo ? (
                          <img src={d.logo} alt="" />
                        ) : (
                          <span className="font-mono text-[10px] text-blue-600">
                            {d.nama?.slice(0, 2) || "//"}
                          </span>
                        )}
                        <span className="truncate">{d.nama || `Divisi ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form inputs preview */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[11px] font-mono text-slate-600 uppercase tracking-wide block">
                    Kolom Pertanyaan ({data.form_fields.length})
                  </span>

                  {data.form_fields.map((f, i) => (
                    <div className="oprec-builder__preview-field" key={f.name + i}>
                      <label>
                        {f.label || "Pertanyaan"}
                        {f.required && <span className="text-rose-500"> *</span>}
                      </label>
                      <div className="oprec-builder__preview-input">
                        {f.type === "select"
                          ? "-- Pilih jawaban --"
                          : f.type === "file"
                          ? "Unggah berkas (PDF / Gambar)..."
                          : f.type === "date"
                          ? "HH / BB / TTTT"
                          : f.placeholder || "Jawaban calon anggota..."}
                      </div>
                      {f.help && <small className="text-slate-400 text-[10px]">{f.help}</small>}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="w-full py-2 bg-blue-600 text-white text-center text-xs font-medium cursor-not-allowed opacity-80">
                    Kirim Pendaftaran
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
