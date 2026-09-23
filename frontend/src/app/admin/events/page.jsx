"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
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
} from "lucide-react";

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kategoriFilter, setKategoriFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Form Fields
  const [formData, setFormData] = useState({
    judul: "",
    slug: "",
    deskripsi: "",
    kategori: "lomba",
    status: "published",
    tipe: "online",
    tipe_pendaftaran: "individu",
    tanggal_mulai: "",
    tanggal_selesai: "",
    buka_pendaftaran: "",
    deadline_pendaftaran: "",
    kuota: "",
    lokasi: "",
    // Team System Config (PRD 5.7)
    kode_prefix: "HACK",
    min_anggota: 3,
    max_anggota: 5,
    kuota_tim: 30,
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
    const slug = judul
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setFormData((prev) => ({ ...prev, judul, slug }));
  };

  const handlePrefixChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, kode_prefix: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        event: {
          judul: formData.judul,
          slug: formData.slug,
          deskripsi: formData.deskripsi || null,
          kategori: formData.kategori,
          status: formData.status,
          tipe: formData.tipe,
          tipe_pendaftaran: formData.tipe_pendaftaran,
          tanggal_mulai: formData.tanggal_mulai,
          tanggal_selesai: formData.tanggal_selesai,
          buka_pendaftaran: formData.buka_pendaftaran || null,
          deadline_pendaftaran: formData.deadline_pendaftaran || null,
          kuota: formData.kuota ? parseInt(formData.kuota, 10) : null,
          lokasi: formData.lokasi || null,
          kode_prefix: formData.tipe_pendaftaran === "tim" ? formData.kode_prefix : null,
          min_anggota: formData.tipe_pendaftaran === "tim" ? parseInt(formData.min_anggota, 10) : null,
          max_anggota: formData.tipe_pendaftaran === "tim" ? parseInt(formData.max_anggota, 10) : null,
          kuota_tim: formData.tipe_pendaftaran === "tim" && formData.kuota_tim ? parseInt(formData.kuota_tim, 10) : null,
        },
      };

      await api.post("/admin/events", payload);
      setFormSuccess("Event baru berhasil disimpan!");
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess("");
        fetchEvents();
      }, 1000);
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan event. Periksa kembali form input.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (event) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus event "${event.judul}"?`)) return;
    try {
      await api.delete(`/admin/events/${event.id}`);
      fetchEvents();
    } catch (err) {
      alert(err.message || "Gagal menghapus event.");
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    const matchSearch = search ? ev.judul?.toLowerCase().includes(search.toLowerCase()) || ev.kategori?.toLowerCase().includes(search.toLowerCase()) : true;
    const matchStatus = statusFilter === "all" ? true : ev.status === statusFilter;
    const matchKategori = kategoriFilter === "all" ? true : ev.kategori === kategoriFilter;
    return matchSearch && matchStatus && matchKategori;
  });

  // Prefix preview
  const prefix = formData.kode_prefix || "TEAM";
  const previewCodes = `${prefix}01, ${prefix}02, ${prefix}03, ${prefix}04...`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Event & Lomba</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen publikasi event, kuota peserta, dan sistem tim HIMANIKA.
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
            onClick={() => {
              setFormData({
                judul: "",
                slug: "",
                deskripsi: "",
                kategori: "lomba",
                status: "published",
                tipe: "online",
                tipe_pendaftaran: "tim",
                tanggal_mulai: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
                tanggal_selesai: new Date(Date.now() + 86400000 * 8).toISOString().slice(0, 16),
                buka_pendaftaran: new Date().toISOString().slice(0, 16),
                deadline_pendaftaran: new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 16),
                kuota: "100",
                lokasi: "Online via Zoom & Discord",
                kode_prefix: "HACK",
                min_anggota: 3,
                max_anggota: 5,
                kuota_tim: 25,
              });
              setFormError("");
              setFormSuccess("");
              setIsModalOpen(true);
            }}
            className="admin-btn admin-btn--primary"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Event Baru</span>
          </button>
        </div>
      </div>

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
              <option value="lomba">Lomba / Kompetisi</option>
              <option value="seminar">Seminar</option>
              <option value="workshop">Workshop</option>
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
                      <div className="font-semibold text-slate-900">{ev.judul}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">/{ev.slug}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="admin-badge admin-badge--neutral text-[10px] uppercase font-mono">
                          {ev.kategori}
                        </span>
                        <span className="text-[11px] text-slate-500 capitalize">({ev.tipe})</span>
                      </div>
                      <div className="text-[11px] text-blue-600 font-medium mt-1">
                        Mode: {ev.tipe_pendaftaran === "tim" ? "Kompetisi Tim" : "Individu"}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-700 font-medium">
                        {ev.tanggal_mulai ? new Date(ev.tanggal_mulai).toLocaleDateString("id-ID") : "-"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ev.lokasi || "Lokasi fleksibel"}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-800 font-mono">
                        {ev.registrations_count || 0} Peserta
                      </div>
                      {ev.tipe_pendaftaran === "tim" && (
                        <div className="text-[11px] text-purple-600 font-medium">
                          {ev.teams_count || 0} Tim terdaftar
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${ev.status}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/events/${ev.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600"
                          title="Lihat Halaman Publik"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(ev)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Hapus Event"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="admin-modal-card">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Buat Event / Lomba Baru</h2>
                <p className="text-xs text-slate-500">Konfigurasi info event dan aturan pendaftaran tim.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
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
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Judul Event *</label>
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
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Slug URL *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="hackathon-himanika-2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Kategori *</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="lomba">Lomba / Kompetisi</option>
                    <option value="seminar">Seminar</option>
                    <option value="workshop">Workshop</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Tipe Pelaksanaan *</label>
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
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Status Publikasi *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="published">Published (Tampil di Website)</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed (Pendaftaran Tutup)</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Tanggal Mulai *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Tanggal Selesai *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.tanggal_selesai}
                    onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Buka Pendaftaran</label>
                  <input
                    type="datetime-local"
                    value={formData.buka_pendaftaran}
                    onChange={(e) => setFormData({ ...formData, buka_pendaftaran: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Batas Pendaftaran</label>
                  <input
                    type="datetime-local"
                    value={formData.deadline_pendaftaran}
                    onChange={(e) => setFormData({ ...formData, deadline_pendaftaran: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                  />
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

                {/* Mode Pendaftaran */}
                <div className="md:col-span-2 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-800 mb-2 block uppercase tracking-wider">
                    Model Kepesertaan
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${formData.tipe_pendaftaran === "individu" ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-slate-200 bg-white"}`}>
                      <input
                        type="radio"
                        name="tipe_pendaftaran"
                        value="individu"
                        checked={formData.tipe_pendaftaran === "individu"}
                        onChange={() => setFormData({ ...formData, tipe_pendaftaran: "individu" })}
                        className="accent-blue-600"
                      />
                      <span className="text-sm font-semibold">Individu / Perorangan</span>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${formData.tipe_pendaftaran === "tim" ? "border-blue-500 bg-blue-50/50 text-blue-700" : "border-slate-200 bg-white"}`}>
                      <input
                        type="radio"
                        name="tipe_pendaftaran"
                        value="tim"
                        checked={formData.tipe_pendaftaran === "tim"}
                        onChange={() => setFormData({ ...formData, tipe_pendaftaran: "tim" })}
                        className="accent-blue-600"
                      />
                      <span className="text-sm font-semibold">Grup / Tim Lomba</span>
                    </label>
                  </div>
                </div>

                {/* Team Configuration (PRD 5.7) */}
                {formData.tipe_pendaftaran === "tim" && (
                  <div className="md:col-span-2 p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                      <Trophy className="w-4 h-4 text-blue-600" />
                      <span>Konfigurasi Sistem Tim (PRD 5.7)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">Kode Prefix (Max 6)</label>
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
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">Min. Anggota</label>
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
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">Max. Anggota</label>
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
                      <span className="text-slate-500 font-medium">Live Preview Kode Tim: </span>
                      <span className="font-mono font-bold text-blue-600">{previewCodes}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="admin-btn admin-btn--secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn admin-btn--primary"
                >
                  {submitting ? "Menyimpan..." : "Simpan & Publikasikan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
