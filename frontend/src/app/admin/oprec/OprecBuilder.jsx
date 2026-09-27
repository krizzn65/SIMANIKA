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
  Sliders,
  ExternalLink,
  ArrowRight,
  Globe,
  FileText,
  MapPin,
  Ticket,
  RotateCcw,
  X,
  Lock,
} from "lucide-react";
import { api } from "@/services/api";
import { divisionPreview } from "@/components/oprec/divisionPreview";
import { getDefaultJabatan, isFieldApplicable } from "@/lib/oprec";
import { OprecPeriodPicker } from "./OprecPeriodPicker";
import "./oprec-create-dialog.css";
import "./oprec-builder.css";

function DivisionJabatanAdder({ onAdd, placeholder }) {
  const [val, setVal] = useState("");

  const handleAdd = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setVal("");
  };

  return (
    <div className="oprec-builder__jabatan-add-row">
      <input
        type="text"
        className="oprec-builder__jabatan-input"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder={placeholder || "Ketik nama jabatan baru..."}
        maxLength={100}
      />
      <button
        type="button"
        className="oprec-btn oprec-btn--primary oprec-builder__jabatan-add-btn"
        onClick={handleAdd}
        disabled={!val.trim()}
      >
        <Plus size={13} />
        <span>Tambah</span>
      </button>
    </div>
  );
}

const DEFAULT_DIVISION_LOGOS = {
  bph: "/images/divisi/bph.webp",
  humas: "/images/divisi/humas.webp",
  psdm: "/images/divisi/psdm.webp",
  kominfo: "/images/divisi/kominfo.webp",
  kwu: "/images/divisi/kwu.webp",
};

const fixed = [
  { name: "nama", type: "text", label: "Nama lengkap", required: true, maxLength: 150 },
  { name: "nim", type: "text", label: "NIM", required: true, maxLength: 32 },
  { name: "tanggal_lahir", type: "date", label: "Tanggal lahir", required: true },
  { name: "angkatan", type: "select", label: "Angkatan", required: true, options: [] },
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
  target_type: "all",
  target_divisions: [],
});

const emptyDivision = () => ({
  nama: "",
  nama_lengkap: "",
  deskripsi: "",
  logo: "",
  jabatan: [],
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
    jabatan: Array.isArray(item.jabatan) && item.jabatan.length > 0 ? item.jabatan : getDefaultJabatan(item.nama),
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

const formatDisplayDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
};

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
  const [showDivisionConfig, setShowDivisionConfig] = useState(false);
  const [previewMode, setPreviewMode] = useState("page"); // "page" | "form"
  const [previewSelectedDivisions, setPreviewSelectedDivisions] = useState([]);
  const [previewSelectedJabatan, setPreviewSelectedJabatan] = useState({ 1: "", 2: "", 3: "" });

  useEffect(() => {
    setPreviewSelectedJabatan((prev) => {
      const next = { ...prev };
      let changed = false;
      [1, 2, 3].forEach((rank) => {
        const divVal = previewSelectedDivisions[rank - 1];
        if (!divVal) {
          if (next[rank] !== "") {
            next[rank] = "";
            changed = true;
          }
        } else {
          const division = (data.divisi_tersedia || []).find(
            (d, idx) =>
              String(d.nama) === String(divVal) ||
              String(idx) === String(divVal)
          );
          const positions = division
            ? (Array.isArray(division.jabatan) && division.jabatan.length > 0
                ? division.jabatan
                : getDefaultJabatan(division.nama))
            : [];
          if (positions.length === 1) {
            if (next[rank] !== positions[0]) {
              next[rank] = positions[0];
              changed = true;
            }
          } else if (positions.length > 1) {
            if (next[rank] && !positions.includes(next[rank])) {
              next[rank] = "";
              changed = true;
            }
          } else {
            if (next[rank] !== "") {
              next[rank] = "";
              changed = true;
            }
          }
        }
      });
      return changed ? next : prev;
    });
  }, [previewSelectedDivisions, data.divisi_tersedia]);

  const togglePreviewDivision = (val) => {
    setPreviewSelectedDivisions((current) => {
      const strVal = String(val);
      if (current.includes(strVal)) {
        return current.filter((item) => item !== strVal);
      }
      if (current.length < 3) {
        return [...current, strVal];
      }
      return current;
    });
  };
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [dragOverPoster, setDragOverPoster] = useState(false);
  const [uploadingLogoIndex, setUploadingLogoIndex] = useState(null);
  const [dragOverLogoIndex, setDragOverLogoIndex] = useState(null);
  const posterInputRef = useRef(null);
  const containerRef = useRef(null);
  const [previewWidth, setPreviewWidth] = useState(540);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("simanika_oprec_preview_width");
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 320 && val <= 850) {
          setPreviewWidth(val);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);

    const onPointerMove = (moveEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.round(rect.right - moveEvent.clientX);
      const minW = 320;
      const maxW = Math.max(minW, Math.floor(rect.width - 420));
      const clamped = Math.min(Math.max(newWidth, minW), maxW);
      setPreviewWidth(clamped);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      try {
        setPreviewWidth((current) => {
          localStorage.setItem("simanika_oprec_preview_width", String(current));
          return current;
        });
      } catch {
        // ignore
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleResetWidth = () => {
    setPreviewWidth(420);
    try {
      localStorage.setItem("simanika_oprec_preview_width", "420");
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPreviewWidth((w) => {
        const max = containerRef.current
          ? Math.max(320, containerRef.current.getBoundingClientRect().width - 420)
          : 800;
        return Math.min(w + 24, max);
      });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPreviewWidth((w) => Math.max(w - 24, 320));
    } else if (e.key === "Home" || e.key === "Escape") {
      e.preventDefault();
      handleResetWidth();
    }
  };

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
              target_type: "all",
              target_divisions: [],
              ...(item.formFields || []).find((field) => field.name === template.name),
            })),
            ...(item.formFields || []).filter(
              (field) =>
                !fixed.some((template) => template.name === field.name) &&
                !["divisi_pilihan_1", "divisi_pilihan_2", "divisi_pilihan_3"].includes(field.name)
            ).map((field) => ({
              ...field,
              target_type: field.targetType || field.target_type || "all",
              target_divisions: Array.isArray(field.targetDivisions || field.target_divisions)
                ? (field.targetDivisions || field.target_divisions).map(String)
                : [],
            })),
          ],
          divisi_tersedia: (item.divisiTersedia || []).map((division) => ({
            nama: division.nama,
            nama_lengkap: division.namaLengkap || "",
            deskripsi: division.deskripsi || "",
            logo: division.logo || "",
            jabatan:
              Array.isArray(division.jabatan) && division.jabatan.length > 0
                ? division.jabatan
                : getDefaultJabatan(division.nama),
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

  const handleDivisionNameChange = (index, newNama) => {
    const currentDivision = data.divisi_tersedia[index] || {};
    const oldNama = (currentDivision.nama || "").trim();
    const cleanNew = (newNama || "").trim();
    const currentJabatan = currentDivision.jabatan || [];

    const isDefaultBph =
      oldNama.toLowerCase() === "bph" &&
      JSON.stringify(currentJabatan) ===
        JSON.stringify(["Wakil Ketua Umum", "Sekretaris 2", "Bendahara 2"]);
    const isDefaultOther =
      currentJabatan.length === 1 &&
      currentJabatan[0] === `Staff Divisi ${oldNama}`;
    const isEmpty = currentJabatan.length === 0;

    let updatedJabatan = currentJabatan;
    if (isEmpty || isDefaultOther || isDefaultBph) {
      updatedJabatan = getDefaultJabatan(cleanNew);
    }

    setDivision(index, { nama: newNama, jabatan: updatedJabatan });
  };

  const addDivisionJabatan = (divisionIndex, title) => {
    const trimmed = (title || "").trim();
    if (!trimmed) return;
    const currentDivision = data.divisi_tersedia[divisionIndex] || {};
    const currentJabatan = currentDivision.jabatan || [];
    if (currentJabatan.includes(trimmed)) return;
    setDivision(divisionIndex, { jabatan: [...currentJabatan, trimmed] });
  };

  const removeDivisionJabatan = (divisionIndex, jabatanIndex) => {
    const currentDivision = data.divisi_tersedia[divisionIndex] || {};
    const currentJabatan = currentDivision.jabatan || [];
    setDivision(divisionIndex, {
      jabatan: currentJabatan.filter((_, idx) => idx !== jabatanIndex),
    });
  };

  const resetDivisionJabatan = (divisionIndex) => {
    const currentDivision = data.divisi_tersedia[divisionIndex] || {};
    setDivision(divisionIndex, {
      jabatan: getDefaultJabatan(currentDivision.nama),
    });
  };

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
    if (data.divisi_tersedia.some((item) => !Array.isArray(item.jabatan) || item.jabatan.length === 0))
      return "Setiap divisi wajib memiliki minimal satu jabatan.";
    if (!data.form_fields[3].options?.length) return "Isi minimal satu pilihan angkatan.";
    if (data.form_fields[3].options.some((option) => !/^(19|20)\d{2}$/.test(option.value)))
      return "Pilihan angkatan harus tahun empat digit, misalnya 2024.";
    if (data.form_fields.length > 40) return "Maksimal 40 kolom.";
    const names = new Set();
    for (let i = 0; i < data.form_fields.length; i++) {
      const field = data.form_fields[i];
      if (!field.label?.trim()) {
        return "Setiap kolom pertanyaan membutuhkan label pertanyaan.";
      }
      if (!field.name || !/^[a-z][a-z0-9_]{0,49}$/.test(field.name) || names.has(field.name)) {
        field.name = `pertanyaan_${Date.now()}_${i}`;
      }
      names.add(field.name);
      if (
        ["select", "radio"].includes(field.type) &&
        !field.options?.length
      )
        return `Isi pilihan untuk ${field.label}.`;
      if (
        field.target_type === "specific" &&
        (!Array.isArray(field.target_divisions) || field.target_divisions.length === 0)
      ) {
        return `Pilih minimal satu divisi target untuk pertanyaan "${field.label || `No. ${i + 1}`}".`;
      }
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
        logo: item.logo?.trim() || null,
        jabatan: Array.isArray(item.jabatan)
          ? item.jabatan.map(String).map((s) => s.trim()).filter(Boolean)
          : getDefaultJabatan(item.nama),
      })),
      form_fields: data.form_fields.map((field) => ({
        name: field.name,
        label: field.label.trim(),
        type: field.type,
        required: Boolean(field.required),
        help: field.help || null,
        placeholder: field.placeholder || null,
        target_type: field.target_type === "specific" ? "specific" : "all",
        target_divisions:
          field.target_type === "specific" && Array.isArray(field.target_divisions)
            ? field.target_divisions.map(String).map((s) => s.trim()).filter(Boolean)
            : [],
        ...(["select", "radio"].includes(field.type)
          ? { options: field.options || [] }
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

  const renderPreviewField = (f, i) => {
    const isWide = Boolean(f.wide);
    const questionNumber = i >= fixed.length ? i + 2 : i + 1;
    const isSpecific =
      (f.target_type === "specific" || f.targetType === "specific") &&
      Array.isArray(f.target_divisions || f.targetDivisions) &&
      (f.target_divisions || f.targetDivisions).length > 0;
    const targetText = isSpecific
      ? (f.target_divisions || f.targetDivisions).join(", ")
      : null;

    return (
      <div
        className={`oprec-user-preview__field-item ${
          isWide ? "oprec-user-preview__field-item--wide" : ""
        }`}
        key={f.name + i}
      >
        <label className="oprec-user-preview__field-label">
          {f.label || `Pertanyaan ${questionNumber}`}
          {isSpecific && targetText && (
            <span className="oprec-conditional-badge" title={`Pertanyaan ini khusus pendaftar divisi ${targetText}`}>
              Khusus: {targetText}
            </span>
          )}
          {f.required && <b aria-label="wajib"> *</b>}
        </label>

        {f.type === "textarea" ? (
          <textarea
            className="oprec-user-preview__field-textarea"
            rows={3}
            placeholder={f.placeholder || "Jawaban calon anggota..."}
            readOnly
          />
        ) : f.type === "select" ? (
          <select
            className="oprec-user-preview__field-select"
            defaultValue=""
          >
            <option value="" disabled>
              Pilih {f.label?.toLowerCase() || "jawaban"}
            </option>
            {f.options?.map((opt, optIdx) => (
              <option key={optIdx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : f.type === "file" ? (
          <div className="oprec-user-preview__field-file">
            <UploadCloud
              size={16}
              className="text-blue-600 flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-slate-700">
                Pilih atau seret berkas pendaftaran
              </span>
              <span className="text-[10px] text-slate-400">
                PDF, JPG, PNG · maksimal 5 MB
              </span>
            </div>
          </div>
        ) : (
          <input
            type={
              f.type === "date"
                ? "date"
                : f.type === "number"
                ? "number"
                : "text"
            }
            className="oprec-user-preview__field-input"
            placeholder={
              f.type === "date"
                ? "HH / BB / TTTT"
                : f.placeholder || "Jawaban calon anggota..."
            }
            readOnly
          />
        )}

        {f.help && (
          <small className="oprec-user-preview__field-help">
            {f.help}
          </small>
        )}
      </div>
    );
  };

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
          <span className="oprec-builder__tab-badge">{data.form_fields.length + 1}</span>
        </button>
      </nav>

      {/* Main Layout (Editor + Live Preview) */}
      <div
        ref={containerRef}
        className={`oprec-builder__layout ${
          !showPreview ? "oprec-builder__layout--full" : ""
        } ${isDragging ? "oprec-builder__layout--dragging" : ""}`}
        style={
          showPreview
            ? {
                gridTemplateColumns: `minmax(0, 1fr) 14px ${previewWidth}px`,
              }
            : undefined
        }
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
                    Kelola divisi dan susunan jabatan yang dapat dipilih oleh calon anggota.
                  </p>
                </div>
                <div className="oprec-builder__section-actions">
                  <button
                    type="button"
                    className={`oprec-btn ${showDivisionConfig ? "oprec-btn--primary" : "oprec-btn--secondary"}`}
                    onClick={() => setShowDivisionConfig((prev) => !prev)}
                    title="Pengaturan dan status integrasi divisi di formulir pendaftaran"
                  >
                    <Sliders size={14} />
                    <span>Konfigurasi di Formulir</span>
                  </button>
                </div>
              </div>

              {showDivisionConfig && (
                <div className="oprec-builder__division-config-panel">
                  <div className="oprec-builder__division-config-header">
                    <div className="flex items-center gap-2">
                      <Sliders size={16} className="text-blue-600" />
                      <h3>Konfigurasi Integrasi Divisi di Formulir</h3>
                    </div>
                    <span className="oprec-builder__badge-active">
                      ● Terintegrasi Otomatis
                    </span>
                  </div>

                  <div className="oprec-builder__division-config-body">
                    <div className="oprec-builder__division-config-grid">
                      <div className="oprec-builder__division-config-item">
                        <span className="oprec-builder__config-label">Mekanisme Pemilihan Prioritas</span>
                        <p className="oprec-builder__config-desc">
                          Formulir pendaftaran mewajibkan setiap pendaftar memilih tepat <b>3 divisi berbeda</b>. Urutan klik pendaftar pada kartu divisi otomatis menentukan <b>Prioritas 1, 2, dan 3</b>.
                        </p>
                      </div>

                      <div className="oprec-builder__division-config-item">
                        <span className="oprec-builder__config-label">Jabatan dalam Divisi</span>
                        <p className="oprec-builder__config-desc">
                          Setiap divisi memiliki susunan jabatan yang dapat disesuaikan. Default BPH mencakup 3 posisi pimpinan, sedangkan divisi lainnya adalah Staff Divisi.
                        </p>
                      </div>
                    </div>

                    <div className="oprec-builder__division-config-summary">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold">
                          Divisi Aktif di Formulir ({data.divisi_tersedia.filter((d) => d.nama?.trim()).length})
                        </span>
                        {data.divisi_tersedia.filter((d) => d.nama?.trim()).length < 3 ? (
                          <span className="text-xs text-amber-700 font-mono font-medium">
                            ⚠️ Perlu minimal 3 divisi agar formulir pendaftaran valid
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-700 font-mono font-medium">
                            ✓ Syarat minimal 3 divisi terpenuhi
                          </span>
                        )}
                      </div>
                      <div className="oprec-builder__division-pills">
                        {data.divisi_tersedia.filter((d) => d.nama?.trim()).length > 0 ? (
                          data.divisi_tersedia
                            .filter((d) => d.nama?.trim())
                            .map((d, i) => (
                              <div key={i} className="oprec-builder__division-chip">
                                <span className="font-mono text-blue-600 font-bold">#{i + 1}</span>
                                <strong>{d.nama}</strong>
                              </div>
                            ))
                        ) : (
                          <div className="text-xs text-slate-500 italic py-1">
                            Belum ada divisi yang dibuat. Tambahkan divisi pada form di bawah.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="oprec-builder__division-config-footer">
                      <span className="text-xs text-slate-500">
                        Sinkronisasi langsung: Setiap penambahan, penghapusan, atau perubahan divisi di bawah otomatis tercermin di formulir pendaftaran.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="oprec-btn oprec-btn--secondary oprec-btn--sm"
                          onClick={() => setActiveTab("fields")}
                        >
                          Lihat Tab Formulir
                        </button>
                        <button
                          type="button"
                          className="oprec-btn oprec-btn--secondary oprec-btn--sm"
                          onClick={() => setShowDivisionConfig(false)}
                        >
                          Tutup Panel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                            handleDivisionNameChange(index, e.target.value)
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

                      {/* JABATAN DIVISI SECTION */}
                      <div className="oprec-builder__jabatan-section wide">
                        <div className="oprec-builder__jabatan-head">
                          <div>
                            <span className="oprec-builder__label">
                              Jabatan / Posisi Divisi <span className="oprec-builder__required">*</span>
                            </span>
                            <small className="oprec-builder__jabatan-desc">
                              Posisi yang dibuka untuk dipilih calon anggota pada divisi ini.
                            </small>
                          </div>
                          <button
                            type="button"
                            className="oprec-btn oprec-btn--secondary oprec-btn--xs"
                            onClick={() => resetDivisionJabatan(index)}
                            title="Kembalikan susunan jabatan ke standar sistem"
                          >
                            <RotateCcw size={12} />
                            <span>Reset Default</span>
                          </button>
                        </div>

                        {/* List of Chips */}
                        <div className="oprec-builder__jabatan-chips">
                          {division.jabatan && division.jabatan.length > 0 ? (
                            division.jabatan.map((pos, posIdx) => (
                              <div key={posIdx} className="oprec-builder__jabatan-chip">
                                <span className="oprec-builder__jabatan-chip-text">{pos}</span>
                                <button
                                  type="button"
                                  className="oprec-builder__jabatan-chip-del"
                                  onClick={() => removeDivisionJabatan(index, posIdx)}
                                  title={`Hapus jabatan ${pos}`}
                                  aria-label={`Hapus ${pos}`}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="oprec-builder__jabatan-empty">
                              Belum ada jabatan. Tambahkan minimal satu jabatan untuk divisi ini.
                            </div>
                          )}
                        </div>

                        {/* Inline Add Jabatan Form */}
                        <DivisionJabatanAdder
                          onAdd={(newTitle) => addDivisionJabatan(index, newTitle)}
                          placeholder={`Tambah jabatan baru untuk ${division.nama || "divisi ini"}...`}
                        />
                      </div>
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
                    Empat pertanyaan awal adalah identitas wajib sistem. Divisi terintegrasi otomatis dari tab Kelola Divisi.
                  </p>
                </div>
              </div>

              <div className="oprec-builder__fields">
                {/* 1. Pertanyaan Sistem (01 s/d 04) */}
                {data.form_fields.slice(0, fixed.length).map((field, index) => {
                  return (
                    <div
                      key={field.name + index}
                      className="oprec-builder__field oprec-builder__field--fixed"
                    >
                      <div className="oprec-builder__field-head">
                        <span className="oprec-builder__field-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <strong>{field.label || "Pertanyaan Baru"}</strong>
                        <span className="oprec-builder__field-tag oprec-builder__field-tag--fixed">
                          WAJIB · SISTEM
                        </span>
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
                      </div>
                    </div>
                  );
                })}

                {/* 2. Card Divisi Pilihan (Permanen Pertanyaan No 05 · WAJIB · SISTEM) */}
                <div className="oprec-builder__field oprec-builder__field--fixed oprec-builder__field--division">
                  <div className="oprec-builder__field-head">
                    <span className="oprec-builder__field-index">
                      05
                    </span>
                    <strong>Divisi pilihan</strong>
                    <span className="oprec-builder__field-tag oprec-builder__field-tag--fixed">
                      WAJIB · SISTEM
                    </span>
                  </div>

                  <div className="oprec-builder__division-integrated-card">
                    <p className="oprec-builder__hint wide" style={{ margin: 0 }}>
                      Pilihan divisi otomatis diambil dari tab "Kelola Divisi" di atas.
                    </p>
                    <div className="oprec-builder__division-integrated-details">
                      <p>
                        Calon anggota akan memilih tepat 3 divisi berbeda (Prioritas 1, 2, dan 3) langsung dari daftar divisi yang Anda aktifkan pada tab <b>Kelola Divisi</b>.
                      </p>
                      <div className="oprec-builder__division-integrated-actions">
                        <span className="text-xs font-mono text-slate-500">
                          Divisi aktif: <b>{data.divisi_tersedia.filter((d) => d.nama?.trim()).length} divisi</b>
                        </span>
                        <button
                          type="button"
                          className="oprec-btn oprec-btn--secondary oprec-btn--sm"
                          onClick={() => setActiveTab("divisions")}
                        >
                          <Sliders size={13} />
                          <span>Konfigurasi di Kelola Divisi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Pertanyaan Tambahan Admin (Mulai dari No 06 dst, berada di bawah divisi) */}
                {data.form_fields.slice(fixed.length).map((field, customIdx) => {
                  const actualIndex = fixed.length + customIdx;
                  const displayIndex = actualIndex + 2; // 4 + 2 = 6 ("06"), 5 + 2 = 7 ("07"), dst.
                  const isSpecific = field.target_type === "specific";
                  const targetDivs = Array.isArray(field.target_divisions) ? field.target_divisions : [];

                  return (
                    <div
                      key={field.name + actualIndex}
                      className="oprec-builder__field"
                    >
                      <div className="oprec-builder__field-head">
                        <span className="oprec-builder__field-index">
                          {String(displayIndex).padStart(2, "0")}
                        </span>
                        <strong>{field.label || "Pertanyaan Baru"}</strong>
                        {isSpecific ? (
                          <span
                            className="oprec-builder__field-tag oprec-builder__field-tag--specific"
                            title={`Khusus pendaftar divisi: ${targetDivs.join(", ") || "(belum ada)"}`}
                          >
                            KHUSUS: {targetDivs.length ? targetDivs.join(", ") : "PILIH DIVISI"}
                          </span>
                        ) : (
                          <span className="oprec-builder__field-tag oprec-builder__field-tag--all">
                            SEMUA DIVISI
                          </span>
                        )}
                        <span className="oprec-builder__field-tag">
                          TAMBAHAN
                        </span>

                        <div className="oprec-builder__field-actions">
                          <button
                            type="button"
                            title="Pindahkan ke atas"
                            aria-label={`Naikkan ${field.label}`}
                            disabled={actualIndex === fixed.length}
                            onClick={() => moveField(actualIndex, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            title="Pindahkan ke bawah"
                            aria-label={`Turunkan ${field.label}`}
                            disabled={actualIndex === data.form_fields.length - 1}
                            onClick={() => moveField(actualIndex, 1)}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            title="Hapus pertanyaan"
                            aria-label={`Hapus ${field.label}`}
                            onClick={() => removeField(actualIndex)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="oprec-builder__grid">
                        <label>
                          <span>Label Pertanyaan <span className="oprec-builder__required">*</span></span>
                          <input
                            value={field.label}
                            onChange={(e) =>
                              setField(actualIndex, { label: e.target.value })
                            }
                            maxLength={200}
                          />
                        </label>

                        <label>
                          Tipe Input
                          <select
                            value={field.type}
                            onChange={(e) =>
                              setField(actualIndex, {
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

                        {/* Target Penerima Pertanyaan */}
                        <div className="oprec-builder__target-section wide">
                          <div className="oprec-builder__target-head">
                            <span className="oprec-builder__label">
                              Target Divisi Calon Anggota
                            </span>
                            <small className="oprec-builder__target-hint">
                              Tentukan apakah pertanyaan ini wajib/muncul untuk semua pendaftar atau hanya untuk pendaftar divisi tertentu (misal: Kominfo).
                            </small>
                          </div>

                          <div className="oprec-builder__target-segmented" role="radiogroup" aria-label="Target Divisi">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={!isSpecific}
                              className={`oprec-builder__target-opt ${!isSpecific ? "oprec-builder__target-opt--active" : ""}`}
                              onClick={() => setField(actualIndex, { target_type: "all" })}
                            >
                              <span className="oprec-builder__target-opt-title">Semua Divisi</span>
                              <span className="oprec-builder__target-opt-desc">Muncul untuk semua pendaftar</span>
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={isSpecific}
                              className={`oprec-builder__target-opt ${isSpecific ? "oprec-builder__target-opt--active" : ""}`}
                              onClick={() => {
                                const defaultDiv = data.divisi_tersedia.find((d) => d.nama?.trim())?.nama?.trim();
                                setField(actualIndex, {
                                  target_type: "specific",
                                  target_divisions: targetDivs.length > 0
                                    ? targetDivs
                                    : (defaultDiv ? [defaultDiv] : [])
                                });
                              }}
                            >
                              <span className="oprec-builder__target-opt-title">Divisi Tertentu</span>
                              <span className="oprec-builder__target-opt-desc">Hanya tampil jika memilih divisi sasaran</span>
                            </button>
                          </div>

                          {isSpecific && (
                            <div className="oprec-builder__target-divisions">
                              <span className="oprec-builder__target-divisions-label">
                                Centang Divisi Sasaran: <span className="oprec-builder__required">*</span>
                              </span>
                              <div className="oprec-builder__target-chips">
                                {data.divisi_tersedia.map((d, dIdx) => {
                                  const divName = d.nama?.trim();
                                  if (!divName) return null;
                                  const isChecked = targetDivs.some(
                                    (t) =>
                                      String(t).toLowerCase() === divName.toLowerCase() ||
                                      String(t) === String(d.id ?? dIdx)
                                  );
                                  return (
                                    <label
                                      key={divName + dIdx}
                                      className={`oprec-builder__target-chip ${
                                        isChecked ? "oprec-builder__target-chip--checked" : ""
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isChecked}
                                        onChange={() => {
                                          let nextDivs;
                                          if (isChecked) {
                                            nextDivs = targetDivs.filter(
                                              (t) =>
                                                String(t).toLowerCase() !== divName.toLowerCase() &&
                                                String(t) !== String(d.id ?? dIdx)
                                            );
                                          } else {
                                            nextDivs = [...targetDivs, divName];
                                          }
                                          setField(actualIndex, { target_divisions: nextDivs });
                                        }}
                                      />
                                      <span className="oprec-builder__target-chip-box" aria-hidden="true">
                                        {isChecked ? "✓" : ""}
                                      </span>
                                      <span className="oprec-builder__target-chip-name">{divName}</span>
                                      {d.nama_lengkap && d.nama_lengkap !== divName && (
                                        <span className="oprec-builder__target-chip-sub">({d.nama_lengkap})</span>
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                              {targetDivs.length === 0 && (
                                <small className="oprec-builder__target-error">
                                  ⚠️ Pilih minimal satu divisi sasaran untuk pertanyaan ini.
                                </small>
                              )}
                            </div>
                          )}
                        </div>

                        {["select", "radio"].includes(field.type) && (
                          <label className="wide">
                            Opsi Pilihan (Satu opsi per baris)
                            <textarea
                              rows={3}
                              value={fromOptions(field.options)}
                              onChange={(e) =>
                                setField(actualIndex, { options: toOptions(e.target.value) })
                              }
                              placeholder={"Pilihan A\nPilihan B\nPilihan C"}
                            />
                          </label>
                        )}

                        <label className="wide">
                          Petunjuk / Teks Bantuan (Opsional)
                          <input
                            value={field.help || ""}
                            onChange={(e) =>
                              setField(actualIndex, { help: e.target.value })
                            }
                            placeholder="Contoh: Lampirkan berkas dalam format PDF..."
                            maxLength={500}
                          />
                        </label>

                        <label className="oprec-builder__check">
                          <input
                            type="checkbox"
                            checked={Boolean(field.required)}
                            onChange={(e) =>
                              setField(actualIndex, { required: e.target.checked })
                            }
                          />
                          <span>Wajib diisi oleh pendaftar</span>
                        </label>
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

        {/* ASIDE: Pratinjau Halaman User (Neo-Arcade Browser Frame) */}
        {showPreview && (
          <>
            {/* Split Resizer Divider */}
            <div
              className={`oprec-builder__resizer ${
                isDragging ? "oprec-builder__resizer--active" : ""
              }`}
              onPointerDown={handlePointerDown}
              onDoubleClick={handleResetWidth}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="separator"
              aria-orientation="vertical"
              aria-label="Pengatur ukuran kartu form dan pratinjau"
              aria-valuenow={previewWidth}
              aria-valuemin={320}
              title="Tarik ke kiri: Lebarkan Pratinjau · Tarik ke kanan: Lebarkan Form (Klik 2x untuk reset)"
            >
              <div className="oprec-builder__resizer-rail" />
              <div className="oprec-builder__resizer-knob">
                <span className="oprec-builder__resizer-arrow">◀</span>
                <span className="oprec-builder__resizer-dots">⋮</span>
                <span className="oprec-builder__resizer-arrow">▶</span>
              </div>

              {isDragging && (
                <div className="oprec-builder__resizer-indicator">
                  <span>Pratinjau: {previewWidth}px</span>
                </div>
              )}
            </div>

            <aside className="oprec-builder__aside">
            <div className="oprec-user-preview">
              {/* Browser Chrome Header */}
              <div className="oprec-user-preview__chrome">
                <div className="oprec-user-preview__dots" aria-hidden="true">
                  <span className="oprec-user-preview__dot oprec-user-preview__dot--red" />
                  <span className="oprec-user-preview__dot oprec-user-preview__dot--yellow" />
                  <span className="oprec-user-preview__dot oprec-user-preview__dot--green" />
                </div>

                <div className="oprec-user-preview__url-pill">
                  <span className="text-[10px]" aria-hidden="true">🔒</span>
                  <span className="oprec-user-preview__url-text">
                    simanika.id/oprec{previewMode === "form" ? "#formulir" : ""}
                  </span>
                </div>

                <a
                  href="/oprec"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="oprec-user-preview__external-link"
                  title="Buka halaman publik /oprec di tab baru"
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  <span className="sr-only">Buka di tab baru</span>
                </a>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="oprec-user-preview__tabs">
                <button
                  type="button"
                  className={`oprec-user-preview__tab-btn ${
                    previewMode === "page" ? "oprec-user-preview__tab-btn--active" : ""
                  }`}
                  onClick={() => setPreviewMode("page")}
                >
                  <Globe size={13} aria-hidden="true" />
                  <span>Halaman /oprec</span>
                </button>
                <button
                  type="button"
                  className={`oprec-user-preview__tab-btn ${
                    previewMode === "form" ? "oprec-user-preview__tab-btn--active" : ""
                  }`}
                  onClick={() => setPreviewMode("form")}
                >
                  <FileText size={13} aria-hidden="true" />
                  <span>Form Pendaftaran</span>
                </button>
              </div>

              {/* Scrollable Preview Body */}
              <div className="oprec-user-preview__body">
                {previewMode === "page" ? (
                  /* ======================================================== */
                  /* MODE 1: HALAMAN PUBLIK /oprec                           */
                  /* ======================================================== */
                  <div className="oprec-user-preview__page-view">
                    {/* Hero Section */}
                    <div className="oprec-user-preview__hero">
                      <div className="oprec-user-preview__eyebrow">
                        <span aria-hidden="true" />
                        <span>HIMANIKA / OPEN RECRUITMENT</span>
                      </div>
                      <h3 className="oprec-user-preview__headline">
                        {data.headline || "Ambil peran.\nMulai ceritamu."}
                      </h3>
                      <p className="oprec-user-preview__deskripsi">
                        {data.deskripsi ||
                          "Ada tempat untuk idemu, ruang untuk belajar, dan teman untuk melangkah bersama. Temukan peranmu di HIMANIKA."}
                      </p>
                    </div>

                    {/* Registration Card (IFEST style) */}
                    <div className="oprec-user-preview__card">
                      <div className="oprec-user-preview__card-accent" />
                      {data.poster && (
                        <div className="oprec-user-preview__card-poster">
                          <img src={data.poster} alt={data.poster_alt || "Poster OPREC"} />
                        </div>
                      )}
                      <div className="oprec-user-preview__card-inner">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="oprec-user-preview__card-title">
                            {data.headline || `OPREC HIMANIKA ${data.periode || ""}`}
                          </h4>
                          <span
                            className={`oprec-user-preview__badge oprec-user-preview__badge--${
                              data.status === "open"
                                ? "open"
                                : data.status === "closed"
                                ? "closed"
                                : "soon"
                            }`}
                          >
                            <span className="oprec-user-preview__badge-dot" />
                            {data.status === "open"
                              ? "Pendaftaran Dibuka"
                              : data.status === "closed"
                              ? "Pendaftaran Ditutup"
                              : "Segera Dibuka"}
                          </span>
                        </div>

                        {/* Facts list */}
                        <div className="oprec-user-preview__facts">
                          <div className="oprec-user-preview__fact">
                            <Calendar size={13} aria-hidden="true" />
                            <span>
                              {data.tanggal_buka && data.tanggal_tutup
                                ? `${formatDisplayDate(data.tanggal_buka)} – ${formatDisplayDate(
                                    data.tanggal_tutup
                                  )}`
                                : formatDisplayDate(data.tanggal_buka) ||
                                  formatDisplayDate(data.tanggal_tutup) ||
                                  "Jadwal menyusul"}
                            </span>
                          </div>
                          <div className="oprec-user-preview__fact">
                            <MapPin size={13} aria-hidden="true" />
                            <span>Online (SIMANIKA Portal)</span>
                          </div>
                          <div className="oprec-user-preview__fact">
                            <Ticket size={13} aria-hidden="true" />
                            <span>Pendaftaran Calon Anggota</span>
                          </div>
                        </div>

                        <p className="oprec-user-preview__card-desc">
                          {data.status === "open"
                            ? "Saatnya ambil bagian. Lengkapi formulir pendaftaran dan tentukan divisi impianmu."
                            : data.status === "closed"
                            ? "Pendaftaran periode ini sudah selesai. Pantau hasil seleksi pada portal SIMANIKA."
                            : "Rekrutmen calon anggota baru akan segera dibuka. Siapkan dirimu sekarang."}
                        </p>

                        <button
                          type="button"
                          className="oprec-user-preview__cta-btn"
                          onClick={() => setPreviewMode("form")}
                        >
                          <span>Daftar Sekarang</span>
                          <ArrowRight size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Divisi Section */}
                    <div className="oprec-user-preview__divisions-sec">
                      <div className="oprec-user-preview__sec-head">
                        <h4>Temukan Tempatmu</h4>
                        <span>
                          {data.divisi_tersedia.length} Divisi dibuka pada periode OPREC ini
                        </span>
                      </div>

                      <div className="oprec-user-preview__div-grid">
                        {data.divisi_tersedia.map((d, i) => (
                          <div className="oprec-user-preview__div-card" key={d.nama + i}>
                            <div className="oprec-user-preview__div-top">
                              <div className="oprec-user-preview__div-logo">
                                {d.logo ? (
                                  <img src={d.logo} alt={d.nama} />
                                ) : (
                                  <span className="font-mono text-[10px] font-bold text-blue-600">
                                    {d.nama ? d.nama.slice(0, 2).toUpperCase() : "//"}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <div>
                              <h5 className="oprec-user-preview__div-name">
                                {d.nama || `Divisi ${i + 1}`}
                              </h5>
                              {d.nama_lengkap && (
                                <span className="oprec-user-preview__div-full">
                                  {d.nama_lengkap}
                                </span>
                              )}
                            </div>
                            <p className="oprec-user-preview__div-desc">
                              {d.deskripsi || "Informasi fokus dan peran divisi."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ======================================================== */
                  /* MODE 2: FORMULIR PENDAFTARAN CALON ANGGOTA             */
                  /* ======================================================== */
                  <div className="oprec-user-preview__form-view">
                    <button
                      type="button"
                      className="oprec-user-preview__back-link"
                      onClick={() => setPreviewMode("page")}
                    >
                      <ArrowLeft size={12} aria-hidden="true" />
                      <span>Kembali ke Halaman Oprec</span>
                    </button>

                    <div className="oprec-user-preview__form-header">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-blue-600 font-semibold">
                        // OPREC {data.periode || "2026/2027"}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {data.headline || "Formulir Pendaftaran Calon Anggota"}
                      </h3>
                      <p className="oprec-user-preview__form-intro">
                        {data.form_intro ||
                          "Kolom bertanda * wajib diisi. Isilah sesuai petunjuk penyelenggara."}
                      </p>
                    </div>

                    {/* Question Fields Grid (Textfield Kiri & Kanan) */}
                    <div className="oprec-user-preview__fields-grid">
                      {/* 1. Empat Field Sistem Awal (Identitas Diri: 01 s/d 04) */}
                      {data.form_fields.slice(0, fixed.length).map((f, i) =>
                        renderPreviewField(f, i)
                      )}

                      {/* 2. Divisi Choice Tiles (Pertanyaan no 05) */}
                      {data.divisi_tersedia && data.divisi_tersedia.length > 0 && (
                        <div className="oprec-user-preview__field-item oprec-user-preview__field-item--wide oprec-user-preview__division-section">
                          <label className="oprec-user-preview__field-label">
                            Divisi Pilihan <b aria-label="wajib"> *</b>
                          </label>
                          <small className="oprec-user-preview__field-help">
                            Pilih tepat 3 divisi. Urutan klik menentukan prioritas (Pilihan 1, 2, dan 3).
                          </small>

                          <div className="oprec-division-choices">
                            {data.divisi_tersedia.map((d, idx) => {
                              const val = d.nama || `divisi_${idx}`;
                              const selected =
                                previewSelectedDivisions.indexOf(val) + 1;
                              const key = d.nama?.toLowerCase()?.trim();
                              const logoSrc =
                                d.logo || DEFAULT_DIVISION_LOGOS[key] || null;

                              return (
                                <div
                                  key={val}
                                  className={`oprec-division-choice ${
                                    selected > 0
                                      ? "oprec-division-choice--selected"
                                      : ""
                                  }`}
                                  onClick={() => togglePreviewDivision(val)}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <span
                                    className={`oprec-division-choice__indicator ${
                                      selected > 0
                                        ? "oprec-division-choice__indicator--selected"
                                        : ""
                                    }`}
                                    aria-hidden="true"
                                  >
                                    {selected > 0 ? selected : null}
                                  </span>

                                  {logoSrc ? (
                                    <img
                                      src={logoSrc}
                                      alt=""
                                      width="26"
                                      height="26"
                                      className="oprec-division-choice__logo"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span
                                      className="oprec-division-choice__fallback"
                                      aria-hidden="true"
                                    >
                                      {d.nama
                                        ? d.nama.slice(0, 2).toUpperCase()
                                        : "//"}
                                    </span>
                                  )}

                                  <span className="oprec-division-choice__text">
                                    <strong>
                                      {d.nama || `Divisi #${idx + 1}`}
                                    </strong>
                                    {d.nama_lengkap &&
                                      d.nama_lengkap !== d.nama && (
                                        <small>{d.nama_lengkap}</small>
                                      )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="oprec-division-toolbar">
                            <div
                              className={`oprec-division-counter ${
                                previewSelectedDivisions.length === 3
                                  ? "oprec-division-counter--complete"
                                  : previewSelectedDivisions.length > 0
                                  ? "oprec-division-counter--active"
                                  : ""
                              }`}
                            >
                              <span className="oprec-division-counter__dot" aria-hidden="true" />
                              <span>{previewSelectedDivisions.length} / 3 divisi dipilih</span>
                            </div>
                            {previewSelectedDivisions.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewSelectedDivisions([]);
                                  setPreviewSelectedJabatan({ 1: "", 2: "", 3: "" });
                                }}
                                className="oprec-division-reset-btn"
                                title="Reset semua pilihan divisi"
                              >
                                <RotateCcw size={12} className="oprec-division-reset-btn__icon" aria-hidden="true" />
                                <span>Reset Pilihan</span>
                              </button>
                            )}
                          </div>

                          {/* 3 Dropdown Jabatan Berjejer Horizontal di Live Preview */}
                          <div className="oprec-jabatan-choices-row" role="region" aria-label="Pratinjau Pilihan Jabatan Divisi">
                            {[1, 2, 3].map((rank) => {
                              const divVal = previewSelectedDivisions[rank - 1];
                              const division = divVal
                                ? (data.divisi_tersedia || []).find(
                                    (d, idx) =>
                                      String(d.nama) === String(divVal) ||
                                      String(idx) === String(divVal)
                                  )
                                : null;
                              const isUnlocked = Boolean(division);
                              const positions = division
                                ? (Array.isArray(division.jabatan) && division.jabatan.length > 0
                                    ? division.jabatan
                                    : getDefaultJabatan(division.nama))
                                : [];
                              const currentChoice = previewSelectedJabatan[rank] || "";

                              return (
                                <div
                                  key={rank}
                                  className={`oprec-jabatan-slot ${
                                    isUnlocked
                                      ? "oprec-jabatan-slot--active"
                                      : "oprec-jabatan-slot--blocked"
                                  }`}
                                >
                                  <div className="oprec-jabatan-slot__header">
                                    <span className="oprec-jabatan-slot__rank-badge">
                                      Pilihan #{rank}
                                    </span>
                                    {isUnlocked ? (
                                      <span
                                        className="oprec-jabatan-slot__div-badge"
                                        title={division.nama_lengkap || division.nama}
                                      >
                                        {division.nama}
                                      </span>
                                    ) : (
                                      <span className="oprec-jabatan-slot__locked-badge">
                                        <Lock size={10} aria-hidden="true" />
                                        <span>Terkunci</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="oprec-jabatan-slot__body">
                                    <label
                                      htmlFor={`preview-jabatan-select-${rank}`}
                                      className="oprec-jabatan-slot__label"
                                    >
                                      Jabatan {isUnlocked ? `di ${division.nama}` : `Pilihan ${rank}`}
                                      {isUnlocked && <b aria-label="wajib"> *</b>}
                                    </label>
                                    <div className="oprec-jabatan-slot__select-wrap">
                                      <select
                                        id={`preview-jabatan-select-${rank}`}
                                        className="oprec-jabatan-slot__select"
                                        disabled={!isUnlocked}
                                        value={currentChoice}
                                        onChange={(e) => {
                                          setPreviewSelectedJabatan((prev) => ({
                                            ...prev,
                                            [rank]: e.target.value,
                                          }));
                                        }}
                                      >
                                        {!isUnlocked ? (
                                          <option value="" disabled>
                                            Pilih divisi ke-{rank} terlebih dahulu...
                                          </option>
                                        ) : positions.length > 1 ? (
                                          <>
                                            <option value="" disabled>
                                              -- Pilih Jabatan di {division.nama} --
                                            </option>
                                            {positions.map((pos) => (
                                              <option key={pos} value={pos}>
                                                {pos}
                                              </option>
                                            ))}
                                          </>
                                        ) : (
                                          positions.map((pos) => (
                                            <option key={pos} value={pos}>
                                              {pos}
                                            </option>
                                          ))
                                        )}
                                      </select>
                                    </div>

                                    {isUnlocked && (
                                      <small className="oprec-jabatan-slot__hint">
                                        {positions.length > 1
                                          ? `${positions.length} opsi jabatan dapat dipilih`
                                          : "Otomatis terpilih (jabatan tunggal)"}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 3. Pertanyaan Tambahan Admin (No 06 dst, berada di bawah divisi) */}
                      {data.form_fields
                        .slice(fixed.length)
                        .filter((f) =>
                          isFieldApplicable(f, previewSelectedDivisions, data.divisi_tersedia)
                        )
                        .map((f, customIdx) => {
                          const actualIndex = fixed.length + customIdx;
                          return renderPreviewField(f, actualIndex);
                        })}
                    </div>

                    {/* Submit Button di Sebelah Kanan (Sesuai Layout User) */}
                    <div className="oprec-user-preview__form-submit-row">
                      <small className="text-[11px] text-slate-400 font-mono">
                        [ Mode Pratinjau · Input simulasi ]
                      </small>
                      <button
                        type="button"
                        className="oprec-user-preview__submit-btn"
                        disabled={previewSelectedDivisions.length !== 3}
                        title={
                          previewSelectedDivisions.length !== 3
                            ? "Pilih tepat 3 divisi terlebih dahulu"
                            : "Simulasi Kirim Pendaftaran"
                        }
                      >
                        Kirim Pendaftaran
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
      </div>
    </div>
  );
}
