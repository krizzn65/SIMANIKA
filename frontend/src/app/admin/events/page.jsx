"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { AdminErrorNotice } from "../AdminErrorNotice";
import { toast } from "sonner";
import { AdminGuidebookField } from "./AdminGuidebookField";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Users,
  Trophy,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Clock,
  MapPin,
  Sparkles,
  UploadCloud,
  Image as ImageIcon,
  Check,
} from "lucide-react";

function currencyDigits(value) {
  return String(value || "").replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12);
}

function formatRupiahInput(value) {
  const digits = currencyDigits(value);
  return digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
}

const EVENT_CATEGORY_OPTIONS = [
  ["hi-fest", "HI-FEST"],
  ["mic", "MIC"],
  ["imce", "IMCE"],
];
const EVENT_CATEGORY_KEYS = EVENT_CATEGORY_OPTIONS.map(([value]) => value);

const TIMELINE_OPTIONS = [
  ["registration", "Pendaftaran + penutupan"],
  ["technical_meeting", "Technical Meeting"],
  ["proposal", "Pengumpulan Proposal"],
  ["preliminary", "Babak Penyisihan"],
  ["finalists", "Pengumuman Finalis"],
  ["grand_final", "Grand Final"],
  ["awarding", "Awarding & Penutupan"],
  ["custom", "Lainnya"],
];
const TIMELINE_LABELS = Object.fromEntries(TIMELINE_OPTIONS);
const timelineStamp = (item) => item.tanggal || "9999-99-99";
const timelineOrder = (items) => items.map((item, index) => ({ item, index })).sort((a, b) => timelineStamp(a.item).localeCompare(timelineStamp(b.item)) || a.index - b.index);
const registrationTitle = (type, batch, total) => `${type === "registration_open" ? "Pendaftaran" : "Penutupan Pendaftaran"}${total > 1 ? ` Batch ${batch}` : ""}`;

function hydrateTimeline(items) {
  return items.map((item) => {
    const title = String(item.judul || "");
    let type = item.type;
    if (!type) type = /buka pendaftaran|^pendaftaran(?: batch \d+)?$/i.test(title) ? "registration_open"
      : /batas pendaftaran|penutupan pendaftaran/i.test(title) ? "registration_close" : "custom";
    return { type, batch: type.startsWith("registration_") ? Number(item.batch || 1) : null,
      judul: title || TIMELINE_LABELS[type] || "", tanggal: String(item.tanggal || "").slice(0, 10) };
  });
}

function adminEventCategoryLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return EVENT_CATEGORY_OPTIONS.find(([key]) => key === normalized)?.[1] || value || "Lainnya";
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kategoriFilter, setKategoriFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Poster State
  const [posterFile, setPosterFile] = useState(null);
  const [guidebookFile, setGuidebookFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [posterUploading, setPosterUploading] = useState(false);
  const [isCustomKategori, setIsCustomKategori] = useState(false);
  const [customKategori, setCustomKategori] = useState("");

  // Form Fields
  const [formData, setFormData] = useState({
    judul: "",
    slug: "",
    poster: "",
    guidebook_type: null,
    guidebook_value: null,
    deskripsi: "",
    kategori: "hi-fest",
    status: "draft",
    tipe: "online",
    tipe_pendaftaran: "individu",
    payment_type: "free",
    htm: "",
    timeline: [],
    lokasi: "",
    // Team System Config (PRD 5.7)
    kode_prefix: "",
    min_anggota: 3,
    max_anggota: 5,
  });

  const fetchEvents = () => {
    setLoading(true);
    setError("");
    api.get("/admin/events")
      .then((res) => {
        const items = res.data?.data || [];
        setEvents(items);
      })
      .catch((err) => {
        console.error("Gagal memuat event:", err);
        setError("Gagal memuat data event dari server.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleTitleChange = (e) => {
    const judul = e.target.value;
    if (!editingEventId) {
      const slug = judul
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setFormData((prev) => ({ ...prev, judul, slug }));
    } else {
      setFormData((prev) => ({ ...prev, judul }));
    }
  };

  const handleOpenCreate = () => {
    setEditingEventId(null);
    setFormData({
      judul: "",
      slug: "",
      poster: "",
      guidebook_type: null,
      guidebook_value: null,
      deskripsi: "",
      kategori: "hi-fest",
      status: "draft",
      tipe: "online",
      tipe_pendaftaran: "tim",
      payment_type: "free",
      htm: "",
      timeline: [],
      lokasi: "Online via Zoom & Discord",
      kode_prefix: "",
      min_anggota: 3,
      max_anggota: 5,
    });
    handleRemovePoster();
    setGuidebookFile(null);
    setIsCustomKategori(false);
    setCustomKategori("");
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setFormError("");
    setFormSuccess("");
  };

  const handleEdit = (ev) => {
    setEditingEventId(ev.id);
    const cat = (ev.kategori || "hi-fest").toLowerCase();
    const isKnown = EVENT_CATEGORY_KEYS.includes(cat);
    setIsCustomKategori(!isKnown);
    setCustomKategori(!isKnown ? (ev.kategori || "") : "");

    let initialTimeline = [];
    if (Array.isArray(ev.timeline) && ev.timeline.length > 0) {
      initialTimeline = hydrateTimeline(ev.timeline);
    } else {
      if (ev.buka_pendaftaran || ev.bukaPendaftaran) {
        initialTimeline.push({
          judul: "Buka Pendaftaran",
          tanggal: String(ev.buka_pendaftaran || ev.bukaPendaftaran).slice(0, 10),
        });
      }
      if (ev.deadline_pendaftaran || ev.deadlinePendaftaran) {
        initialTimeline.push({
          judul: "Batas Pendaftaran",
          tanggal: String(ev.deadline_pendaftaran || ev.deadlinePendaftaran).slice(0, 10),
        });
      }
      if (ev.tanggal_mulai || ev.tanggalMulai) {
        initialTimeline.push({
          judul: "Pelaksanaan Event",
          tanggal: String(ev.tanggal_mulai || ev.tanggalMulai).slice(0, 10),
        });
      }
      if (ev.tanggal_selesai || ev.tanggalSelesai) {
        initialTimeline.push({
          judul: "Event Selesai",
          tanggal: String(ev.tanggal_selesai || ev.tanggalSelesai).slice(0, 10),
        });
      }
      initialTimeline = hydrateTimeline(initialTimeline);
    }

    setFormData({
      judul: ev.judul || "",
      slug: ev.slug || "",
      poster: ev.poster || "",
      guidebook_type: ev.guidebookType || null,
      guidebook_value: ev.guidebookValue || null,
      deskripsi: ev.deskripsi || "",
      kategori: isKnown ? cat : "lainnya",
      status: ev.status || "published",
      tipe: ev.tipe || "online",
      tipe_pendaftaran: (ev.tipe_pendaftaran || ev.tipePendaftaran) || "individu",
      payment_type: (ev.payment_type || ev.paymentType) === "paid" ? "paid" : "free",
      htm: ev.htm != null ? String(ev.htm) : "",
      timeline: initialTimeline,
      lokasi: ev.lokasi || "",
      kode_prefix: ev.kode_prefix || "HACK",
      min_anggota: ev.min_anggota != null ? ev.min_anggota : (ev.teamSettings?.minAnggota ?? 3),
      max_anggota: ev.max_anggota != null ? ev.max_anggota : (ev.teamSettings?.maxAnggota ?? 5),
    });

    setPosterFile(null);
    setGuidebookFile(null);
    if (ev.poster) {
      setPosterPreview(ev.poster);
    } else {
      setPosterPreview("");
    }
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const handlePrefixChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, kode_prefix: val }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Ukuran poster maksimal 5MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      setFormError("Format poster harus berupa JPG, PNG, atau WebP.");
      return;
    }

    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
    setFormError("");
  };

  const handleRemovePoster = () => {
    setPosterFile(null);
    setPosterPreview("");
    setFormData((prev) => ({ ...prev, poster: "" }));
  };

  const handleGuidebookTypeChange = (type) => {
    setGuidebookFile(null);
    setFormData((prev) => ({ ...prev, guidebook_type: type === "none" ? null : type, guidebook_value: null }));
    setFormError("");
  };

  const handleGuidebookFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 8 * 1024 * 1024) {
      setFormError("Guidebook harus PDF dengan ukuran maksimal 8 MB.");
      setGuidebookFile(null);
      event.target.value = "";
      return;
    }
    setGuidebookFile(file);
    setFormError("");
  };

  const handleAddTimelineItem = (type) => {
    setFormData((prev) => {
      const timeline = [...prev.timeline];
      if (type === "registration") {
        const batch = Math.max(0, ...timeline.map((item) => Number(item.batch || 0))) + 1;
        timeline.push({ type: "registration_open", batch, judul: "Pendaftaran", tanggal: "" });
        timeline.push({ type: "registration_close", batch, judul: "Penutupan Pendaftaran", tanggal: "" });
      } else {
        timeline.push({ type, batch: null, judul: type === "custom" ? "" : TIMELINE_LABELS[type], tanggal: "" });
      }
      return { ...prev, timeline };
    });
  };

  const handleUpdateTimelineItem = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.timeline || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, timeline: updated };
    });
  };

  const handleRemoveTimelineItem = (index) => {
    setFormData((prev) => {
      const target = prev.timeline[index];
      let timeline = prev.timeline.filter((item, i) => i !== index && (!target.type.startsWith("registration_") || item.batch !== target.batch));
      const batches = [...new Set(timeline.filter((item) => item.type.startsWith("registration_")).map((item) => item.batch))].sort((a, b) => a - b);
      timeline = timeline.map((item) => item.type.startsWith("registration_") ? { ...item, batch: batches.indexOf(item.batch) + 1 } : item);
      return { ...prev, timeline };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      let finalPosterUrl = formData.poster;

      if (posterFile) {
        setPosterUploading(true);
        const uploadData = new FormData();
        uploadData.append("poster", posterFile);
        const uploadRes = await api.post("/admin/events/upload-poster", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (uploadRes.data?.url) {
          finalPosterUrl = uploadRes.data.path || uploadRes.data.url;
        }
      }

      let finalGuidebookValue = formData.guidebook_value;
      if (formData.guidebook_type === "link") {
        try {
          const url = new URL(String(finalGuidebookValue || ""));
          if (url.protocol !== "https:" || url.username || url.password) throw new Error();
          finalGuidebookValue = url.href;
        } catch {
          setFormError("Tautan guidebook harus menggunakan HTTPS yang valid.");
          return;
        }
      }
      if (formData.guidebook_type === "file") {
        if (guidebookFile) {
          const guidebookData = new FormData();
          guidebookData.append("guidebook", guidebookFile);
          const guidebookResponse = await api.post("/admin/events/upload-guidebook", guidebookData, { headers: { "Content-Type": "multipart/form-data" } });
          finalGuidebookValue = guidebookResponse.data?.data?.path;
        }
        if (!finalGuidebookValue) {
          setFormError("Pilih berkas PDF guidebook terlebih dahulu.");
          return;
        }
      }

      const computedSlug = (formData.slug || formData.judul || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const validTimeline = timelineOrder(formData.timeline).map(({ item }) => ({ ...item,
        judul: item.type.startsWith("registration_") ? registrationTitle(item.type, item.batch, formData.timeline.filter((entry) => entry.type === "registration_open").length) : item.judul.trim(),
      }));
      if (!validTimeline.some((item) => item.type === "registration_open") || validTimeline.some((item) => !item.judul || !item.tanggal)) {
        setFormError("Tambahkan pendaftaran dan isi nama serta tanggal semua agenda.");
        return;
      }
      const batches = [...new Set(validTimeline.filter((item) => item.type === "registration_open").map((item) => item.batch))].sort((a, b) => a - b);
      let previousClose = "";
      for (const batch of batches) {
        const open = validTimeline.find((item) => item.type === "registration_open" && item.batch === batch);
        const close = validTimeline.find((item) => item.type === "registration_close" && item.batch === batch);
        if (!close || timelineStamp(open) >= timelineStamp(close) || (previousClose && timelineStamp(open) <= previousClose)) {
          setFormError("Setiap batch harus dibuka sebelum ditutup, dan batch berikutnya sesudah batch sebelumnya.");
          return;
        }
        previousClose = timelineStamp(close);
      }
      if (validTimeline.some((item) => item.type === "awarding" && item.tanggal <= previousClose.slice(0, 10))) {
        setFormError("Awarding & Penutupan harus setelah tanggal penutupan pendaftaran terakhir.");
        return;
      }
      const lastBatch = batches.at(-1);
      const bukaItem = validTimeline.find((item) => item.type === "registration_open" && item.batch === lastBatch);
      const deadlineItem = validTimeline.find((item) => item.type === "registration_close" && item.batch === lastBatch);
      const program = validTimeline.filter((item) => !item.type.startsWith("registration_"));
      const derivedTanggalMulai = (program[0] || validTimeline[0]).tanggal;
      const derivedTanggalSelesai = validTimeline.at(-1).tanggal;

      const finalKategori = (isCustomKategori ? customKategori.trim() : formData.kategori) || "lainnya";
      if (isCustomKategori && !customKategori.trim()) {
        setFormError("Nama kategori kustom tidak boleh kosong.");
        setSubmitting(false);
        return;
      }

      const htm = formData.payment_type === "paid" ? Number(currencyDigits(formData.htm)) : null;
      if (formData.payment_type === "paid" && (!Number.isSafeInteger(htm) || htm <= 0)) {
        setFormError("Masukkan nominal HTM yang valid untuk event berbayar.");
        setSubmitting(false);
        return;
      }

      const eventData = {
        judul: formData.judul,
        slug: computedSlug || `event-${Date.now()}`,
        poster: finalPosterUrl || null,
        guidebook_type: formData.guidebook_type || null,
        guidebook_value: formData.guidebook_type ? finalGuidebookValue : null,
        deskripsi: formData.deskripsi || null,
        kategori: finalKategori,
        status: formData.status,
        tipe: formData.tipe,
        tipe_pendaftaran: formData.tipe_pendaftaran,
        payment_type: formData.payment_type,
        htm,
        tanggal_mulai: derivedTanggalMulai,
        tanggal_selesai: derivedTanggalSelesai,
        buka_pendaftaran: bukaItem ? bukaItem.tanggal : null,
        deadline_pendaftaran: deadlineItem ? deadlineItem.tanggal : null,
        timeline: validTimeline,
        lokasi: formData.lokasi || null,
        kode_prefix: formData.tipe_pendaftaran === "tim" ? formData.kode_prefix : null,
        min_anggota: formData.tipe_pendaftaran === "tim" ? parseInt(formData.min_anggota, 10) : null,
        max_anggota: formData.tipe_pendaftaran === "tim" ? parseInt(formData.max_anggota, 10) : null,
      };

      const payload = {
        ...eventData,
        event: eventData,
      };

      if (editingEventId) {
        await api.put(`/admin/events/${editingEventId}`, payload);
        setFormSuccess("Perubahan event berhasil disimpan!");
      } else {
        const created = await api.post("/admin/events", payload);
        const eventId = created.data?.data?.id;
        if (!eventId) throw new Error("Event tersimpan, tetapi ID event tidak diterima. Muat ulang daftar event.");
        router.push("/admin/events/edit?id=" + encodeURIComponent(eventId));
        return;
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingEventId(null);
        setFormSuccess("");
        handleRemovePoster();
        fetchEvents();
      }, 1000);
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan event. Periksa kembali form input.");
    } finally {
      setSubmitting(false);
      setPosterUploading(false);
    }
  };

  const handleDelete = async (event) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus event "${event.judul}"?`)) return;
    try {
      await api.delete(`/admin/events/${event.id}`);
      fetchEvents();
    } catch (err) {
      toast.error(err.message || "Gagal menghapus event.");
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    const matchSearch = search ? ev.judul?.toLowerCase().includes(search.toLowerCase()) || ev.kategori?.toLowerCase().includes(search.toLowerCase()) : true;
    const matchStatus = statusFilter === "all" ? true : ev.status === statusFilter;
    const matchKategori = kategoriFilter === "all"
      ? true
      : kategoriFilter === "lainnya"
        ? ev.kategori?.toLowerCase() === "lainnya" || !EVENT_CATEGORY_KEYS.includes(ev.kategori?.toLowerCase())
        : ev.kategori?.toLowerCase() === kategoriFilter.toLowerCase();
    return matchSearch && matchStatus && matchKategori;
  });

  // Prefix preview
  const prefix = formData.kode_prefix;
  const previewCodes = prefix ? `${prefix}01, ${prefix}02, ${prefix}03…` : "Isi prefix terlebih dahulu";
  const prefixAlreadyUsed = prefix && events.some((event) => event.kode_prefix === prefix && event.id !== editingEventId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Event & Competition</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen publikasi event, jadwal agenda, dan sistem tim HIMANIKA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchEvents}
            disabled={loading}
            className="admin-btn admin-btn--secondary"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="admin-btn admin-btn--primary"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Event Baru</span>
          </button>
        </div>
      </div>

      <AdminErrorNotice message={error} onRetry={fetchEvents} />
      {/* Filter and Search Bar */}
      <div className="admin-card p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul event atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
              <option value="selesai">Selesai</option>
            </select>

            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Semua Kategori</option>
              {EVENT_CATEGORY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table Card */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Judul Event</th>
                <th>Kategori & Tipe</th>
                <th>Jadwal Pelaksanaan</th>
                <th>Pendaftar / Tim</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Memuat data event...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    {search || statusFilter !== "all" || kategoriFilter !== "all"
                      ? "Tidak ada event yang sesuai dengan filter."
                      : "Belum ada event terdaftar."}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {ev.poster ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                            <img
                              src={ev.poster}
                              alt={ev.judul}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate max-w-[220px]">{ev.judul}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[220px]">/{ev.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="admin-badge admin-badge--neutral text-[10px] uppercase font-mono">
                          {adminEventCategoryLabel(ev.kategori)}
                        </span>
                        <span className="text-[11px] text-slate-500 capitalize">({ev.tipe})</span>
                      </div>
                      <div className="text-[11px] text-blue-600 font-medium mt-1">
                        Mode: {(ev.tipe_pendaftaran || ev.tipePendaftaran) === "tim" ? "Tim Competition" : "Individu"}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-700 font-medium">
                        {(ev.tanggal_mulai || ev.tanggalMulai) ? new Date(ev.tanggal_mulai || ev.tanggalMulai).toLocaleDateString("id-ID") : "-"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ev.lokasi || "Lokasi fleksibel"}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-900">
                        {(ev.tipe_pendaftaran || ev.tipePendaftaran) === "tim"
                          ? `${ev.teams_count || 0} Tim`
                          : `${ev.registrations_count || 0} Peserta`}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${ev.status}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Link href={"/admin/events/edit?id=" + encodeURIComponent(ev.id)} className="admin-btn admin-btn--secondary admin-btn--sm">Atur formulir</Link>
                        <Link
                          href={`/events/detail?slug=${encodeURIComponent(ev.slug)}`}
                          target="_blank"
                          className="admin-icon-btn hover:text-blue-600"
                          title="Lihat Halaman Publik"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleEdit(ev)}
                          className="admin-icon-btn hover:text-blue-600"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ev)}
                          className="admin-icon-btn admin-icon-btn--danger"
                          title="Hapus Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buat Event Baru */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card admin-event-modal">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingEventId ? "Edit Event / Competition" : "Buat Event / Competition Baru"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingEventId
                    ? "Perbarui konfigurasi event, jadwal agenda, dan aturan pendaftaran."
                    : "Konfigurasi event dan aturan pendaftaran tim."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-event-form p-6 flex flex-col gap-4">
              {formError && (
                <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Judul Event <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.judul}
                    onChange={handleTitleChange}
                    placeholder="Contoh: Hackathon HIMANIKA 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Slug URL <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Otomatis dari judul</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Contoh: hackathon-himanika-2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Alamat URL publik: <span className="font-mono text-blue-600 font-semibold">/events/detail?slug={formData.slug || "nama-event"}</span>
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Deskripsi Event
                  </label>
                  <textarea
                    rows={3}
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    placeholder="Deskripsi singkat atau ringkasan informasi event..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500 resize-y"
                  />
                </div>

                {/* Poster / Pamflet Event Field */}
                <div className="admin-event-timeline md:col-span-2 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="mb-2.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Poster / Pamflet Event</span>
                    </label>
                  </div>
                    <div>
                      {posterPreview ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                          <div className="w-24 h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 shadow-xs">
                            <img
                              src={posterPreview}
                              alt="Preview Poster"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {posterFile ? posterFile.name : "Poster Terpilih"}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {posterFile ? `${(posterFile.size / 1024).toFixed(1)} KB` : "Siap dipublikasikan"}
                            </span>
                            <div className="flex items-center gap-2 mt-3">
                              <label className="admin-btn admin-btn--secondary admin-btn--sm cursor-pointer">
                                <span>Ganti Poster</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/jpg"
                                  onChange={handleFileChange}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={handleRemovePoster}
                                className="admin-btn admin-btn--danger admin-btn--sm"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/20 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                          <UploadCloud className="w-8 h-8 text-blue-600 mb-2" />
                          <span className="text-xs font-bold text-slate-800">
                            Klik atau seret file poster ke sini
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1">
                            Format yang didukung: PNG, JPG, JPEG, WebP (Maksimal 5MB)
                          </span>
                          <span className="text-[10px] text-blue-600 font-semibold mt-2 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                            Rasio ideal 3:4 atau 16:9
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                </div>

                <AdminGuidebookField
                  type={formData.guidebook_type}
                  value={formData.guidebook_value}
                  file={guidebookFile}
                  onTypeChange={handleGuidebookTypeChange}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, guidebook_value: value }))}
                  onFileChange={handleGuidebookFileChange}
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Kategori <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    {isCustomKategori && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomKategori(false);
                          setCustomKategori("");
                          setFormData((prev) => ({ ...prev, kategori: "hi-fest" }));
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Pilih opsi standar</span>
                      </button>
                    )}
                  </div>

                  {!isCustomKategori ? (
                    <select
                      value={formData.kategori}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "lainnya") {
                          setIsCustomKategori(true);
                          setCustomKategori("");
                          setFormData((prev) => ({ ...prev, kategori: "" }));
                        } else {
                          setFormData((prev) => ({ ...prev, kategori: val }));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                      {EVENT_CATEGORY_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                      <option value="lainnya">Lainnya...</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        required
                        value={customKategori}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomKategori(val);
                          setFormData((prev) => ({ ...prev, kategori: val }));
                        }}
                        placeholder="Ketik nama kategori lainnya..."
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-blue-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomKategori(false);
                          setCustomKategori("");
                          setFormData((prev) => ({ ...prev, kategori: "hi-fest" }));
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                        title="Batal / Kembali ke pilihan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Tipe Pelaksanaan <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={formData.tipe}
                    onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Status Publikasi <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  {!editingEventId && <p className="text-xs text-slate-500 mb-2">Event disimpan sebagai draft. Publikasikan setelah formulir pendaftaran selesai.</p>}
                  <select
                    value={formData.status}
                    disabled={!editingEventId}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="published">Published (Tampil di Website)</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed (Pendaftaran Tutup)</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Lokasi Event</label>
                  <input
                    type="text"
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    placeholder="Contoh: Gedung Lab Informatika / Zoom Meeting"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Timeline & Agenda Tanggal Dinamis */}
                <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="mb-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>Timeline Event</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tambah agenda dari pilihan di bawah. Daftar otomatis diurutkan menurut tanggal; pendaftaran selalu ditambahkan bersama penutupannya.
                      </p>
                    </div>

                  </div>

                  {/* List Agenda Tanggal */}
                  {formData.timeline && formData.timeline.length > 0 ? (
                    <div className="space-y-2.5">
                      {timelineOrder(formData.timeline).map(({ item, index }, orderIndex) => (
                        <div
                          key={`${item.type}-${item.batch || index}-${index}`}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 border border-blue-100">
                              {orderIndex + 1}
                            </span>
                            {item.type === "custom" ? <input
                              type="text" aria-label="Nama agenda lainnya" maxLength={150}
                              value={item.judul}
                              onChange={(e) => handleUpdateTimelineItem(index, "judul", e.target.value)}
                              placeholder="Nama agenda"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                            /> : <span className="flex-1 text-xs font-semibold text-slate-800">{item.type.startsWith("registration_") ? registrationTitle(item.type, item.batch, formData.timeline.filter((entry) => entry.type === "registration_open").length) : item.judul}</span>}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="date"
                              aria-label={`Tanggal ${item.judul}`}
                              value={item.tanggal ? item.tanggal.slice(0, 10) : ""}
                              onChange={(e) => handleUpdateTimelineItem(index, "tanggal", e.target.value.slice(0, 10))}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveTimelineItem(index)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title={item.type.startsWith("registration_") ? "Hapus kedua tanggal batch ini" : "Hapus agenda ini"}
                              aria-label={item.type.startsWith("registration_") ? `Hapus batch pendaftaran ${item.batch}` : `Hapus ${item.judul}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                      <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-500 font-medium">Timeline masih kosong. Mulai dari Pendaftaran.</p>
                    </div>
                  )}

                  {/* Timeline actions */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/90 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                        Timeline
                      </span>
                      <span className="text-[11px] text-slate-400">
                        · pilih tahap yang ingin ditambahkan
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {TIMELINE_OPTIONS.map(([type, label]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleAddTimelineItem(type)}
                          className="admin-preset-chip group"
                        >
                          <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>



                {/* Mode Pendaftaran */}
                <div className="admin-event-participation md:col-span-2 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wider">
                    Model Kepesertaan
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`admin-option-card p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${formData.tipe_pendaftaran === "individu" ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-slate-200 bg-white"}`}>
                      <input
                        type="radio"
                        name="tipe_pendaftaran"
                        value="individu"
                        checked={formData.tipe_pendaftaran === "individu"}
                        onChange={() => setFormData({ ...formData, tipe_pendaftaran: "individu" })}
                        className="accent-blue-600"
                      />
                      <span className="font-semibold">Individu / Perorangan</span>
                    </label>

                    <label className={`admin-option-card p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${formData.tipe_pendaftaran === "tim" ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-slate-200 bg-white"}`}>
                      <input
                        type="radio"
                        name="tipe_pendaftaran"
                        value="tim"
                        checked={formData.tipe_pendaftaran === "tim"}
                        onChange={() => setFormData({ ...formData, tipe_pendaftaran: "tim" })}
                        className="accent-blue-600"
                      />
                      <span className="font-semibold">Grup / Tim Competition</span>
                    </label>
                  </div>
                </div>

                {/* Team Configuration */}
                {formData.tipe_pendaftaran === "tim" && (
                  <div className="admin-event-team-config md:col-span-2 p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                      <Trophy className="w-4 h-4 text-blue-600" />
                      <span>Konfigurasi Sistem Tim</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">
                          Kode Prefix (Max 6) <span className="text-red-500 font-bold ml-0.5">*</span>
                        </label>
                        <input
                          type="text"
                          required={formData.tipe_pendaftaran === "tim"}
                          value={formData.kode_prefix}
                          onChange={handlePrefixChange}
                          placeholder="HACK"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono uppercase font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">
                          Min. Anggota <span className="text-red-500 font-bold ml-0.5">*</span>
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="20"
                          value={formData.min_anggota}
                          onChange={(e) => setFormData({ ...formData, min_anggota: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">
                          Max. Anggota <span className="text-red-500 font-bold ml-0.5">*</span>
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="20"
                          value={formData.max_anggota}
                          onChange={(e) => setFormData({ ...formData, max_anggota: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Live Preview Box */}
                    <div className="p-2.5 rounded-lg bg-white border border-blue-200 text-xs">
                      <span className="text-slate-500 font-medium">Contoh format kode: </span>
                      <span className="font-mono font-bold text-blue-600">{previewCodes}</span>
                      <p className="mt-1 text-slate-500">Nomor sebenarnya dibuat otomatis dan tidak diulang. Prefix boleh dipakai lagi setelah event lama dihapus.</p>
                      {prefixAlreadyUsed && <p className="mt-1 text-red-600" role="alert">Prefix ini sudah dipakai event lain. Pilih prefix berbeda.</p>}
                    </div>
                  </div>
                )}

                <div className="admin-event-payment md:col-span-2 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wider">
                    Pembayaran HTM
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`admin-option-card p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${formData.payment_type === "free" ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-slate-200 bg-white"}`}>
                      <input
                        type="radio"
                        name="payment_type"
                        value="free"
                        checked={formData.payment_type === "free"}
                        onChange={() => setFormData((current) => ({ ...current, payment_type: "free", htm: "" }))}
                        className="accent-blue-600"
                      />
                      <span className="font-semibold">Free</span>
                    </label>
                    <label className={`admin-option-card p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${formData.payment_type === "paid" ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-slate-200 bg-white"}`}>
                      <input
                        type="radio"
                        name="payment_type"
                        value="paid"
                        checked={formData.payment_type === "paid"}
                        onChange={() => setFormData((current) => ({ ...current, payment_type: "paid" }))}
                        className="accent-blue-600"
                      />
                      <span className="font-semibold">Berbayar</span>
                    </label>
                  </div>

                  {formData.payment_type === "paid" && (
                    <div className="mt-3 max-w-md">
                      <label htmlFor="event-htm" className="text-xs font-semibold text-slate-700 mb-1 block">
                        Nominal HTM <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <div className="flex items-stretch">
                        <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 bg-slate-50 text-slate-600 font-semibold">Rp</span>
                        <input
                          id="event-htm"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          required
                          value={formatRupiahInput(formData.htm)}
                          onChange={(e) => setFormData((current) => ({ ...current, htm: currencyDigits(e.target.value) }))}
                          placeholder="500.000"
                          aria-describedby="event-htm-help"
                          className="w-full px-3 py-2 rounded-none border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <p id="event-htm-help" className="mt-1.5 text-xs text-slate-500">Ketik angka saja. Pemisah ribuan ditambahkan otomatis.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="admin-btn admin-btn--secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn admin-btn--primary"
                >
                  {submitting ? "Memproses..." : editingEventId ? "Simpan Perubahan" : "Selanjutnya"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
