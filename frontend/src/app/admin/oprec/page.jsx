"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OprecCreateDialog from "./OprecCreateDialog";
import { CalendarPlusIcon } from "@/components/ui/CalendarPlusIcon";
import { api } from "@/services/api";
import { AdminErrorNotice } from "../AdminErrorNotice";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  Check,
  X,
  Pencil,
} from "lucide-react";
import "./oprec-create-dialog.css";

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
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);

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
      const nextSelected = list.find((item) => item.id === selectedOprec?.id) || list[0] || null;
      setSelectedOprec(nextSelected);
      if (nextSelected) fetchRegistrants(nextSelected.id);
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
      const defaultDiv = reg.divisiPilihan1 || selectedOprec?.divisiTersedia?.[0]?.id || "";
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] tracking-wider text-blue-600 uppercase block font-medium">
            // KELOLA OPREC · PENDAFTARAN
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 mt-0.5">
            Kelola Pendaftaran OPREC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen seleksi calon anggota pengurus dan verifikasi berkas per divisi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {oprecs.length > 1 && (
            <label className="oprec-admin-period">
              Periode
              <select
                value={selectedOprec?.id || ""}
                onChange={(event) => {
                  const item = oprecs.find((entry) => String(entry.id) === event.target.value);
                  if (item) handleSelectOprec(item);
                }}
              >
                {oprecs.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.periode}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => {
              setEditingStage(null);
              setCreateOpen(true);
            }}
            className="oprec-btn oprec-btn--primary"
          >
            <CalendarPlusIcon size={16} loopDelay={2300} />
            <span>Tambah tahap</span>
          </button>
          <button
            type="button"
            onClick={() => {
              fetchOprecs();
              if (selectedOprec) fetchRegistrants(selectedOprec.id);
            }}
            disabled={loading || loadingRegistrants}
            className="oprec-btn oprec-btn--secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingRegistrants ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <AdminErrorNotice message={loadError} onRetry={fetchOprecs} />

      {/* OPREC Overview Section */}
      {selectedOprec && (
        <section className="oprec-admin-overview" aria-labelledby="oprec-overview-title">
          <div className="oprec-admin-overview__top">
            <div>
              <span className="oprec-admin-overview__eyebrow">
                // OPREC · PERIODE {selectedOprec.periode}
              </span>
              <h2 id="oprec-overview-title">Pendaftaran Calon Anggota</h2>
              <p>Informasi pendaftaran dan tahapan seleksi calon anggota HIMANIKA.</p>
            </div>
            <div className="oprec-admin-overview__count">
              <strong>{registrants.length}</strong>
              <span>Berkas masuk</span>
            </div>
          </div>

          <div className="oprec-admin-overview__registration">
            <div className="oprec-admin-overview__registration-main">
              <span className="oprec-admin-overview__step">01 // PENDAFTARAN</span>
              <h3>{selectedOprec.headline || "Pendaftaran calon anggota HIMANIKA"}</h3>
              <p>{selectedOprec.deskripsi || "Pendaftaran calon anggota pengurus HIMANIKA untuk periode ini."}</p>
              <div className="oprec-admin-overview__meta">
                <span>
                  {selectedOprec.status === "draft"
                    ? "STATUS: DRAFT"
                    : selectedOprec.status === "open"
                    ? "STATUS: BERLANGSUNG"
                    : "STATUS: SELESAI"}
                </span>
                {selectedOprec.tanggalBuka && (
                  <span>
                    MULAI:{" "}
                    {new Date(selectedOprec.tanggalBuka).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
                {selectedOprec.tanggalTutup && (
                  <span>
                    BERAKHIR:{" "}
                    {new Date(selectedOprec.tanggalTutup).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/admin/oprec/${selectedOprec.id}/edit`}
              className="oprec-admin-overview__edit"
            >
              <Pencil size={14} aria-hidden="true" />
              <span>Kelola formulir</span>
            </Link>
          </div>

          {selectedOprec.divisiTersedia?.length > 0 && (
            <div className="oprec-admin-overview__divisions">
              <strong>Divisi dibuka //</strong>
              <div>
                {selectedOprec.divisiTersedia.map((division) => (
                  <span key={division.id}>{division.nama}</span>
                ))}
              </div>
            </div>
          )}

          {(selectedOprec.stages || []).length > 0 && (
            <div className="oprec-admin-overview__next">
              <h3>Tahapan berikutnya //</h3>
              <div className="oprec-admin-overview__stage-list">
                {selectedOprec.stages.map((stage, index) => (
                  <div className="oprec-admin-overview__stage" key={stage.id}>
                    <span className="oprec-admin-overview__stage-number">
                      {String(index + 2).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>
                        {stage.type === "test_tulis" ? "TES TULIS" : "PENGUMUMAN"}
                      </strong>
                      <p>{stage.headline}</p>
                    </div>
                    <span className="oprec-admin-overview__stage-state">
                      {stage.published ? "TERBIT" : "BELUM TERBIT"}
                    </span>
                    <div className="oprec-admin-overview__stage-actions">
                      {stage.type === "test_tulis" && (
                        <Link href={`/admin/oprec/${selectedOprec.id}/stages/${stage.id}/form`}>
                          Kelola soal
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStage(stage);
                          setCreateOpen(true);
                        }}
                      >
                        Edit informasi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <AdminErrorNotice message={registrantError} onRetry={() => fetchRegistrants(selectedOprec?.id)} />

      {/* Filter and Registrants Table (Minimalist Boxy Layout) */}
      <div className="border border-slate-300 bg-white rounded-none">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[11px] text-blue-600 uppercase tracking-wider block font-medium">
              // DATA CALON ANGGOTA
            </span>
            <h2 className="text-base font-semibold text-slate-900 mt-0.5">
              Daftar Berkas Calon Anggota
            </h2>
            <p className="text-xs text-slate-500">
              Verifikasi kelengkapan berkas dan tentukan hasil seleksi calon anggota.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari NIM atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-none border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 min-w-[200px]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-none border border-slate-300 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Review</option>
              <option value="accepted">Diterima</option>
              <option value="rejected">Belum Diterima</option>
            </select>

            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-none border border-slate-300 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="all">Semua Divisi</option>
              {selectedOprec?.divisiTersedia?.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  Calon Anggota
                </th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  NIM
                </th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  Pilihan Divisi
                </th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  Tanggal Masuk
                </th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  Status
                </th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4 text-right">
                  Aksi Verifikasi
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingRegistrants ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-mono text-xs">
                    Memuat data pendaftar OPREC...
                  </td>
                </tr>
              ) : filteredRegistrants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-mono text-xs">
                    Belum ada calon anggota pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredRegistrants.map((r) => {
                  const div1 =
                    selectedOprec?.divisiTersedia?.find((d) => d.id === r.divisiPilihan1)?.nama ||
                    `Divisi #${r.divisiPilihan1}`;
                  const div2 = r.divisiPilihan2
                    ? selectedOprec?.divisiTersedia?.find((d) => d.id === r.divisiPilihan2)?.nama ||
                      `Divisi #${r.divisiPilihan2}`
                    : null;
                  const div3 = r.divisiPilihan3
                    ? selectedOprec?.divisiTersedia?.find((d) => d.id === r.divisiPilihan3)?.nama ||
                      `Divisi #${r.divisiPilihan3}`
                    : null;
                  const acceptedDiv = r.acceptedDivisionId
                    ? selectedOprec?.divisiTersedia?.find((d) => d.id === r.acceptedDivisionId)?.nama
                    : null;

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 hover:bg-blue-50/25 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 text-sm">
                          {r.user?.name || "Peserta"}
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">
                          {r.user?.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-none inline-block">
                          {r.nim}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-800">
                          1. {div1}
                        </div>
                        {div2 && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            2. {div2}
                          </div>
                        )}
                        {div3 && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            3. {div3}
                          </div>
                        )}
                        {acceptedDiv && (
                          <div className="mt-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-300 inline-block">
                            DITERIMA: {acceptedDiv}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {r.status === "accepted" ? (
                          <span className="font-mono text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-none border border-emerald-300 bg-emerald-50 text-emerald-800 inline-block">
                            Diterima
                          </span>
                        ) : r.status === "rejected" ? (
                          <span className="font-mono text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-none border border-rose-300 bg-rose-50 text-rose-800 inline-block">
                            Ditolak
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-none border border-amber-300 bg-amber-50 text-amber-800 inline-block">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r, "accepted")}
                            disabled={actionLoading === r.id}
                            className="oprec-table-btn oprec-table-btn--accept"
                            title="Terima Calon Anggota"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Terima</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r, "rejected")}
                            disabled={actionLoading === r.id}
                            className="oprec-table-btn oprec-table-btn--reject"
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

      <OprecCreateDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditingStage(null);
        }}
        onCreated={fetchOprecs}
        selectedOprec={selectedOprec}
        editingStage={editingStage}
      />

      {/* Review & Acceptance Modal (Minimalist Boxy) */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-300 rounded-none shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-blue-600 uppercase tracking-wider block font-medium">
                  // KEPUTUSAN SELEKSI
                </span>
                <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                  Konfirmasi Kelulusan OPREC
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReviewModal({ ...reviewModal, isOpen: false })}
                className="p-1 border border-slate-200 rounded-none hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                aria-label="Tutup popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitReview} className="p-5 flex flex-col gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-none">
                <span className="text-[11px] font-mono uppercase text-slate-500 block">
                  Calon Anggota
                </span>
                <div className="text-sm font-medium text-slate-900 mt-0.5">
                  {reviewModal.registrant?.user?.name}{" "}
                  <span className="font-mono text-slate-500 text-xs">
                    ({reviewModal.registrant?.nim})
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block uppercase tracking-wider font-mono">
                  Pilih Divisi Diterima *
                </label>
                <select
                  required
                  value={reviewModal.accepted_division_id}
                  onChange={(e) =>
                    setReviewModal({ ...reviewModal, accepted_division_id: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-none border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="">-- Pilih Divisi --</option>
                  {selectedOprec?.divisiTersedia?.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block uppercase tracking-wider font-mono">
                  Catatan / Pesan Pengumuman
                </label>
                <textarea
                  rows={3}
                  value={reviewModal.catatan}
                  onChange={(e) =>
                    setReviewModal({ ...reviewModal, catatan: e.target.value })
                  }
                  placeholder="Selamat telah diterima di divisi..."
                  className="w-full px-3 py-2 rounded-none border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ ...reviewModal, isOpen: false })}
                  className="oprec-btn oprec-btn--secondary !min-h-[36px] !py-1.5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="oprec-btn oprec-btn--primary !min-h-[36px] !py-1.5"
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
