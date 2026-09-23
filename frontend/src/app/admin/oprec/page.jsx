"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { AdminErrorNotice } from "../AdminErrorNotice";
import { toast } from "sonner";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

export default function AdminOprecPage() {
  const [oprecs, setOprecs] = useState([]);
  const [selectedOprec, setSelectedOprec] = useState(null);
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [registrantError, setRegistrantError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");

  // Review Modal State
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    registrant: null,
    status: "accepted",
    accepted_division_id: "",
    catatan: "",
  });

  const fetchOprecs = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/admin/oprec");
      const list = res.data?.data || [];
      setOprecs(list);
      if (list.length > 0 && !selectedOprec) {
        setSelectedOprec(list[0]);
        fetchRegistrants(list[0].id);
      }
    } catch (err) {
      setLoadError(err.message || "Gagal memuat OPREC.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrants = async (oprecId) => {
    if (!oprecId) return;
    setLoadingRegistrants(true);
    setRegistrantError("");
    try {
      const res = await api.get(`/admin/oprec/${oprecId}/registrants`);
      setRegistrants(res.data?.data || []);
    } catch (err) {
      setRegistrantError(err.message || "Gagal memuat pendaftar OPREC.");
    } finally {
      setLoadingRegistrants(false);
    }
  };

  useEffect(() => {
    fetchOprecs();
  }, []);

  const handleSelectOprec = (oprec) => {
    setSelectedOprec(oprec);
    fetchRegistrants(oprec.id);
  };

  const handleUpdateStatus = async (reg, newStatus) => {
    if (newStatus === "accepted") {
      // Open modal to choose accepted division
      const defaultDiv = reg.divisiPilihan1 || selectedOprec?.divisions?.[0]?.id || "";
      setReviewModal({
        isOpen: true,
        registrant: reg,
        status: "accepted",
        accepted_division_id: defaultDiv,
        catatan: "",
      });
      return;
    }

    if (!confirm(`Tolak berkas calon anggota ${reg.user?.name || reg.nim}?`)) return;

    setActionLoading(reg.id);
    try {
      await api.put(`/admin/oprec/${selectedOprec.id}/registrants/${reg.id}`, {
        status: "rejected",
        catatan: "Belum memenuhi kriteria seleksi saat ini.",
      });
      fetchRegistrants(selectedOprec.id);
    } catch (err) {
      toast.error(err.message || "Gagal memperbarui status.");
    } finally {
      setActionLoading(null);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const { registrant, status, accepted_division_id, catatan } = reviewModal;
    if (!registrant) return;

    setActionLoading(registrant.id);
    try {
      await api.put(`/admin/oprec/${selectedOprec.id}/registrants/${registrant.id}`, {
        status,
        accepted_division_id: status === "accepted" ? parseInt(accepted_division_id, 10) : null,
        catatan: catatan || null,
      });
      setReviewModal({ isOpen: false, registrant: null, status: "accepted", accepted_division_id: "", catatan: "" });
      fetchRegistrants(selectedOprec.id);
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan review.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter registrants
  const filteredRegistrants = registrants.filter((r) => {
    const matchSearch = search
      ? r.nim?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchStatus = statusFilter === "all" ? true : r.status === statusFilter;
    const matchDiv = divisionFilter === "all" ? true : (r.divisiPilihan1 === parseInt(divisionFilter, 10) || r.acceptedDivisionId === parseInt(divisionFilter, 10));
    return matchSearch && matchStatus && matchDiv;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Open Recruitment (OPREC)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen seleksi calon anggota pengurus dan verifikasi berkas per divisi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchOprecs();
            if (selectedOprec) fetchRegistrants(selectedOprec.id);
          }}
          disabled={loading || loadingRegistrants}
          className="admin-btn admin-btn--secondary"
        >
          <RefreshCw className={`w-4 h-4 ${loading || loadingRegistrants ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      <AdminErrorNotice message={loadError} onRetry={fetchOprecs} />
      <AdminErrorNotice message={registrantError} onRetry={() => fetchRegistrants(selectedOprec?.id)} />
      {/* Oprec Period Selector & Division Badges */}
      {selectedOprec && (
        <div className="admin-card p-5 bg-gradient-to-r from-blue-900 to-[#071328] text-white border-blue-950">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`admin-badge text-xs ${selectedOprec.status === "open" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-red-500/20 text-red-300 border-red-500/40"}`}>
                  STATUS: {selectedOprec.status?.toUpperCase()}
                </span>
                <span className="text-xs text-blue-300 font-mono">
                  Skema v{selectedOprec.schema_version || 1}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{selectedOprec.judul}</h2>
              <p className="text-xs text-blue-200/80 mt-1 max-w-2xl">{selectedOprec.deskripsi || "Seleksi kepengurusan resmi HIMANIKA."}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-center">
                <div className="text-xs text-blue-200">Total Berkas Masuk</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">{registrants.length}</div>
              </div>
            </div>
          </div>

          {/* Divisions Pill List */}
          {selectedOprec.divisions?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
              <span className="text-xs text-blue-200 font-semibold mr-1">Divisi Tersedia:</span>
              {selectedOprec.divisions.map((div) => (
                <span
                  key={div.id}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-400/25 text-xs text-blue-100 flex items-center gap-1.5"
                >
                  <span className="font-medium">{div.nama}</span>
                  {div.kuota && <span className="text-[10px] text-blue-300 font-mono">({div.kuota} Kuota)</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter and Registrants Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daftar Berkas Calon Anggota</h2>
            <p className="text-xs text-slate-500">Verifikasi kelengkapan berkas dan tentukan hasil seleksi.</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari NIM atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Review</option>
              <option value="accepted">Diterima</option>
              <option value="rejected">Belum Diterima</option>
            </select>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Calon Anggota</th>
                <th>NIM</th>
                <th>Pilihan Divisi</th>
                <th>Tanggal Masuk</th>
                <th>Status</th>
                <th className="text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {loadingRegistrants ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Memuat data pendaftar OPREC...
                  </td>
                </tr>
              ) : filteredRegistrants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Belum ada calon anggota pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredRegistrants.map((r) => {
                  const div1 = selectedOprec?.divisions?.find((d) => d.id === r.divisiPilihan1)?.nama || `Divisi #${r.divisiPilihan1}`;
                  const div2 = r.divisiPilihan2 ? selectedOprec?.divisions?.find((d) => d.id === r.divisiPilihan2)?.nama || `Divisi #${r.divisiPilihan2}` : null;
                  const acceptedDiv = r.acceptedDivisionId ? selectedOprec?.divisions?.find((d) => d.id === r.acceptedDivisionId)?.nama : null;

                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="font-semibold text-slate-900">{r.user?.name || "Peserta"}</div>
                        <div className="text-xs text-slate-400">{r.user?.email}</div>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {r.nim}
                        </span>
                      </td>
                      <td>
                        <div className="text-xs font-medium text-slate-800">
                          1. {div1}
                        </div>
                        {div2 && (
                          <div className="text-[11px] text-slate-500">
                            2. {div2}
                          </div>
                        )}
                        {acceptedDiv && (
                          <div className="mt-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            Diterima di: {acceptedDiv}
                          </div>
                        )}
                      </td>
                      <td className="text-xs text-slate-500">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge--${r.status}`}>
                          {r.status === "accepted" ? "Diterima" : r.status === "rejected" ? "Ditolak" : "Pending"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r, "accepted")}
                            disabled={actionLoading === r.id}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs flex items-center gap-1 transition-colors"
                            title="Terima Calon Anggota"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Terima</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r, "rejected")}
                            disabled={actionLoading === r.id}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-xs flex items-center gap-1 transition-colors"
                            title="Tolak Calon Anggota"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Acceptance Modal */}
      {reviewModal.isOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card max-w-md">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Konfirmasi Kelulusan OPREC</h2>
              <button
                type="button"
                onClick={() => setReviewModal({ ...reviewModal, isOpen: false })}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitReview} className="p-5 flex flex-col gap-4">
              <div>
                <span className="text-xs text-slate-500">Nama Calon Anggota:</span>
                <div className="text-sm font-bold text-slate-800">
                  {reviewModal.registrant?.user?.name} ({reviewModal.registrant?.nim})
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Pilih Divisi Diterima *
                </label>
                <select
                  required
                  value={reviewModal.accepted_division_id}
                  onChange={(e) => setReviewModal({ ...reviewModal, accepted_division_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">-- Pilih Divisi --</option>
                  {selectedOprec?.divisions?.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.nama} {div.kuota ? `(Kuota: ${div.kuota})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Catatan / Pesan Pengumuman</label>
                <textarea
                  rows={3}
                  value={reviewModal.catatan}
                  onChange={(e) => setReviewModal({ ...reviewModal, catatan: e.target.value })}
                  placeholder="Selamat telah diterima di divisi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ ...reviewModal, isOpen: false })}
                  className="admin-btn admin-btn--secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="admin-btn admin-btn--primary"
                >
                  Simpan Keputusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
