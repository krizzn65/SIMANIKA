"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OprecCreateDialog from "./OprecCreateDialog";
import { CalendarPlusIcon } from "@/components/ui/CalendarPlusIcon";
import { api } from "@/services/api";
import { AdminErrorNotice } from "../AdminErrorNotice";
import { Search, X, FileText, RefreshCw, Calendar, Pencil, Trash2 } from "lucide-react";
import "./oprec-create-dialog.css";

function formatOprecDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}
const oprecEditHref = (oprec) => `/admin/oprec/${encodeURIComponent(String(oprec.periode || oprec.id).replace(/\//g, "-"))}/edit`;

function getRegistrantName(r) {
  if (!r) return "Peserta";
  let fd = r.formData;
  if (typeof fd === "string") {
    try {
      fd = JSON.parse(fd);
    } catch {
      fd = null;
    }
  }
  const fromForm =
    fd?.nama ||
    fd?.nama_lengkap ||
    fd?.namaLengkap ||
    r.name;
  if (typeof fromForm === "string" && fromForm.trim()) {
    return fromForm.trim();
  }
  return r.user?.name || "Peserta";
}

export default function AdminOprecPage() {
  const [oprecs, setOprecs] = useState([]);
  const [selectedOprec, setSelectedOprec] = useState(null);
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [registrantError, setRegistrantError] = useState("");
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  // Form Verification Modal State
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    registrant: null,
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

  const handleDeleteOprec = async (oprec) => {
    if (!oprec || !window.confirm(`Hapus pendaftaran OPREC periode ${oprec.periode}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/admin/oprec/${oprec.id}`);
      setSelectedOprec(null);
      setRegistrants([]);
      await fetchOprecs();
    } catch (err) {
      setLoadError(err.response?.data?.message || err.message || "Pendaftaran belum dapat dihapus.");
    }
  };

  // Filter registrants
  const filteredRegistrants = registrants.filter((r) => {
    const candidateName = getRegistrantName(r);
    const matchSearch = search
      ? r.nim?.toLowerCase().includes(search.toLowerCase()) ||
        candidateName.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchDiv =
      divisionFilter === "all"
        ? true
        : r.divisiPilihan1 === parseInt(divisionFilter, 10) ||
          r.divisiPilihan2 === parseInt(divisionFilter, 10) ||
          r.divisiPilihan3 === parseInt(divisionFilter, 10);
    return matchSearch && matchDiv;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
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
            onClick={() => setCreateOpen(true)}
            className="oprec-btn oprec-btn--primary"
          >
            <CalendarPlusIcon size={16} loopDelay={2300} />
            <span>Tambah pendaftaran</span>
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
                {(selectedOprec.tanggalBuka || selectedOprec.tanggalTutup) && (
                  <span className="oprec-admin-overview__date-range">
                    <Calendar size={13} aria-hidden="true" />
                    <span>
                      {selectedOprec.tanggalBuka && selectedOprec.tanggalTutup
                        ? `${formatOprecDate(selectedOprec.tanggalBuka)} - ${formatOprecDate(selectedOprec.tanggalTutup)}`
                        : formatOprecDate(selectedOprec.tanggalBuka || selectedOprec.tanggalTutup)}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div className="oprec-admin-overview__actions">
              <Link href={oprecEditHref(selectedOprec)} className="oprec-admin-overview__edit">
                <Pencil size={14} aria-hidden="true" />
                <span>Kelola formulir</span>
              </Link>
              <button type="button" className="oprec-admin-overview__delete" onClick={() => handleDeleteOprec(selectedOprec)}>
                <Trash2 size={14} aria-hidden="true" />
                <span>Hapus pendaftaran</span>
              </button>
            </div>
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
        </section>
      )}

      <AdminErrorNotice message={registrantError} onRetry={() => fetchRegistrants(selectedOprec?.id)} />

      {/* Filter and Registrants Table (Minimalist Boxy Layout) */}
      <div className="border border-slate-300 bg-white rounded-none">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Daftar Berkas Calon Anggota
            </h2>
            <p className="text-xs text-slate-500">
              Periksa kelengkapan isian formulir dan berkas calon anggota.
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
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-none border border-slate-300 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="all">Semua Pilihan Divisi</option>
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
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4 text-right">
                  Verifikasi Formulir
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingRegistrants ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 font-mono text-xs">
                    Memuat data pendaftar OPREC...
                  </td>
                </tr>
              ) : filteredRegistrants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 font-mono text-xs">
                    Belum ada calon anggota pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredRegistrants.map((r) => {
                  const div1 =
                    selectedOprec?.divisiTersedia?.find((d) => String(d.id) === String(r.divisiPilihan1))?.nama ||
                    `Divisi #${r.divisiPilihan1}`;
                  const div2 = r.divisiPilihan2
                    ? selectedOprec?.divisiTersedia?.find((d) => String(d.id) === String(r.divisiPilihan2))?.nama ||
                      `Divisi #${r.divisiPilihan2}`
                    : null;
                  const div3 = r.divisiPilihan3
                    ? selectedOprec?.divisiTersedia?.find((d) => String(d.id) === String(r.divisiPilihan3))?.nama ||
                      `Divisi #${r.divisiPilihan3}`
                    : null;

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 hover:bg-blue-50/25 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 text-sm">
                          {getRegistrantName(r)}
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
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setVerifyModal({ isOpen: true, registrant: r })}
                          className="oprec-table-btn oprec-table-btn--verify"
                          title="Periksa kelengkapan formulir pendaftaran"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Verifikasi Form</span>
                        </button>
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
        onClose={() => setCreateOpen(false)}
        onCreated={fetchOprecs}
      />

      {/* Modal Verifikasi Formulir Pendaftaran (Minimalist Boxy Editorial) */}
      {verifyModal.isOpen && verifyModal.registrant && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setVerifyModal({ isOpen: false, registrant: null });
          }}
        >
          <div className="w-full max-w-2xl bg-white border border-slate-300 rounded-none shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] text-blue-600 uppercase tracking-wider block font-medium">
                  // VERIFIKASI FORMULIR PENDAFTARAN
                </span>
                <h2 className="text-lg font-semibold text-slate-900 mt-1">
                  {getRegistrantName(verifyModal.registrant)}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  NIM: <span className="font-mono text-slate-700 font-medium">{verifyModal.registrant.nim}</span> · Terdaftar pada {formatOprecDate(verifyModal.registrant.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModal({ isOpen: false, registrant: null })}
                className="p-1 border border-slate-200 rounded-none hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                aria-label="Tutup popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="p-5 md:p-6 overflow-y-auto flex flex-col gap-6">
              {/* Section 1: Data Akun & Identitas */}
              <div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 mb-3">
                  1. Informasi Identitas Calon Anggota
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-200 p-3.5">
                  <div>
                    <span className="text-slate-500 font-mono text-[11px] block">NAMA LENGKAP FORM</span>
                    <span className="font-medium text-slate-900 text-sm">
                      {getRegistrantName(verifyModal.registrant)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[11px] block">NIM</span>
                    <span className="font-mono font-medium text-slate-900 text-sm">
                      {verifyModal.registrant.nim}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[11px] block">EMAIL AKUN</span>
                    <span className="font-mono text-slate-800">
                      {verifyModal.registrant.user?.email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[11px] block">NAMA AKUN PROFIL</span>
                    <span className="text-slate-800">
                      {verifyModal.registrant.user?.name || "-"}
                    </span>
                  </div>
                  {verifyModal.registrant.formData?.tanggal_lahir && (
                    <div>
                      <span className="text-slate-500 font-mono text-[11px] block">TANGGAL LAHIR</span>
                      <span className="font-mono text-slate-800">
                        {formatOprecDate(verifyModal.registrant.formData.tanggal_lahir)}
                      </span>
                    </div>
                  )}
                  {verifyModal.registrant.formData?.angkatan && (
                    <div>
                      <span className="text-slate-500 font-mono text-[11px] block">ANGKATAN</span>
                      <span className="font-mono text-slate-800">
                        {verifyModal.registrant.formData.angkatan}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Pilihan Divisi & Jabatan */}
              <div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 mb-3">
                  2. Pilihan Divisi & Jabatan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((rank) => {
                    const divId = verifyModal.registrant[`divisiPilihan${rank}`];
                    const division = selectedOprec?.divisiTersedia?.find((d) => String(d.id) === String(divId));
                    const jabatan = verifyModal.registrant.formData?.[`jabatan_pilihan_${rank}`];
                    return (
                      <div
                        key={rank}
                        className="p-3 border border-slate-200 bg-white"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                            Pilihan {rank}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            Prioritas #{rank}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {division?.nama || (divId ? `Divisi #${divId}` : "—")}
                        </div>
                        {division?.namaLengkap && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {division.namaLengkap}
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-mono text-slate-500 block uppercase">
                            Jabatan Dilamar:
                          </span>
                          <span className="text-xs font-medium text-slate-800">
                            {jabatan || "Staff Divisi"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Jawaban Formulir Tambahan */}
              {(() => {
                const fd = verifyModal.registrant.formData || {};
                const excluded = [
                  "nama",
                  "nim",
                  "tanggal_lahir",
                  "angkatan",
                  "divisi_pilihan_1",
                  "divisi_pilihan_2",
                  "divisi_pilihan_3",
                  "jabatan_pilihan_1",
                  "jabatan_pilihan_2",
                  "jabatan_pilihan_3",
                ];
                const dynamicEntries = Object.entries(fd).filter(([key]) => !excluded.includes(key));
                if (dynamicEntries.length === 0) return null;

                return (
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 mb-3">
                      3. Isian & Jawaban Formulir
                    </h3>
                    <div className="flex flex-col gap-3">
                      {dynamicEntries.map(([key, val]) => {
                        const fieldMeta = selectedOprec?.formFields?.find((f) => f.name === key);
                        const label = fieldMeta?.label || key;
                        const isLong = typeof val === "string" && val.length > 80;
                        return (
                          <div key={key} className="p-3 border border-slate-200 bg-white">
                            <span className="text-xs font-semibold text-slate-700 block mb-1">
                              {label}
                            </span>
                            <div className={`text-xs text-slate-900 ${isLong ? "whitespace-pre-wrap leading-relaxed bg-slate-50 p-2.5 border border-slate-100 font-sans" : "font-medium"}`}>
                              {typeof val === "boolean" ? (val ? "Ya" : "Tidak") : String(val || "—")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Section 4: Berkas Dokumen (Upload) */}
              {verifyModal.registrant.fileUploads && Object.keys(verifyModal.registrant.fileUploads).length > 0 && (
                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 mb-3">
                    4. Berkas / Dokumen Terlampir
                  </h3>
                  <div className="flex flex-col gap-2">
                    {Object.entries(verifyModal.registrant.fileUploads).map(([key, fileInfo]) => {
                      const fieldMeta = selectedOprec?.formFields?.find((f) => f.name === key);
                      const label = fieldMeta?.label || key;
                      const downloadUrl = fileInfo?.downloadUrl || `/api/admin/oprec/${selectedOprec.id}/registrants/${verifyModal.registrant.id}/download/${key}`;
                      return (
                        <div key={key} className="p-3 border border-slate-200 bg-white flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-slate-800">{label}</span>
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="oprec-btn oprec-btn--secondary !min-h-[32px] !py-1 !text-xs"
                          >
                            Unduh Berkas
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setVerifyModal({ isOpen: false, registrant: null })}
                className="oprec-btn oprec-btn--secondary !min-h-[36px] !py-1.5"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
