"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import OprecCreateDialog from "./OprecCreateDialog";
import { CalendarPlusIcon } from "@/components/ui/CalendarPlusIcon";
import { api } from "@/services/api";
import { getOprecTableFields, getRegistrantFieldValue, getRegistrantFormData } from "@/lib/oprecRegistrants";
import { AdminErrorNotice } from "../AdminErrorNotice";
import { Search, X, RefreshCw, Calendar, Pencil, Trash2, AlertTriangle } from "lucide-react";
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
  const fd = getRegistrantFormData(r);
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
  const [registrantPage, setRegistrantPage] = useState(1);
  const [registrantPages, setRegistrantPages] = useState(1);
  const [registrantTotal, setRegistrantTotal] = useState(0);
  const [registrantPerPage, setRegistrantPerPage] = useState(20);
  const requestId = useRef(0);
  const [loading, setLoading] = useState(true);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [registrantError, setRegistrantError] = useState("");
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const deleteCancelRef = useRef(null);
  const [deleteRegistrant, setDeleteRegistrant] = useState(null);
  const [deletingRegistrant, setDeletingRegistrant] = useState(false);
  const deleteRegistrantCancelRef = useRef(null);

  // Form Verification Modal State
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    registrant: null,
  });
  const [registrantEdit, setRegistrantEdit] = useState(null);
  const [savingRegistrant, setSavingRegistrant] = useState(false);
  const [registrantEditError, setRegistrantEditError] = useState("");

  const fetchOprecs = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/admin/oprec");
      const list = res.data?.data || [];
      setOprecs(list);
      const nextSelected = list.find((item) => item.id === selectedOprec?.id) || list[0] || null;
      setSelectedOprec(nextSelected);
    } catch (err) {
      setLoadError(err.message || "Gagal memuat OPREC.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrants = async (oprecId, page = registrantPage, term = search, division = divisionFilter) => {
    if (!oprecId) return;
    const currentRequest = ++requestId.current;
    setLoadingRegistrants(true);
    setRegistrantError("");
    try {
      const res = await api.get(`/admin/oprec/${oprecId}/registrants`, { params: { page, search: term.trim(), division: division === "all" ? undefined : division } });
      if (currentRequest !== requestId.current) return;
      setRegistrants(res.data?.data || []);
      setRegistrantPages(Math.max(1, Number(res.data?.last_page) || 1));
      setRegistrantTotal(Number(res.data?.total) || 0);
      setRegistrantPerPage(Math.max(1, Number(res.data?.per_page) || 20));
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setRegistrants([]);
      setRegistrantTotal(0);
      setRegistrantError(err.message || "Gagal memuat pendaftar OPREC.");
    } finally {
      if (currentRequest === requestId.current) setLoadingRegistrants(false);
    }
  };

  useEffect(() => {
    fetchOprecs();
  }, []);

  useEffect(() => {
    if (!selectedOprec?.id) return;
    setLoadingRegistrants(true);
    const timer = setTimeout(() => fetchRegistrants(selectedOprec.id, registrantPage, search, divisionFilter), 250);
    return () => { clearTimeout(timer); requestId.current += 1; };
  }, [selectedOprec?.id, registrantPage, search, divisionFilter]);

  useEffect(() => {
    if (!deleteTarget) return;
    deleteCancelRef.current?.focus();
    const keydown = (event) => {
      if (event.key === "Escape" && !deleting) setDeleteTarget(null);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [deleteTarget, deleting]);

  useEffect(() => {
    if (!deleteRegistrant) return;
    deleteRegistrantCancelRef.current?.focus();
    const keydown = (event) => {
      if (event.key === "Escape" && !deletingRegistrant) setDeleteRegistrant(null);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [deleteRegistrant, deletingRegistrant]);

  const handleSelectOprec = (oprec) => {
    setSelectedOprec(oprec);
    setRegistrants([]);
    setRegistrantTotal(0);
    setVerifyModal({ isOpen: false, registrant: null });
    setDeleteTarget(null);
    setDeleteRegistrant(null);
    setRegistrantPage(1);
  };

  const handleDeleteOprec = async (oprec) => {
    if (!oprec || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/oprec/${oprec.id}`);
      setSelectedOprec(null);
      setRegistrants([]);
      setRegistrantTotal(0);
      setDeleteTarget(null);
      await fetchOprecs();
    } catch (err) {
      setLoadError(err.response?.data?.message || err.message || "Pendaftaran belum dapat dihapus.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteRegistrant = async () => {
    if (!selectedOprec?.id || !deleteRegistrant || deletingRegistrant) return;
    setDeletingRegistrant(true);
    try {
      await api.delete(`/admin/oprec/${selectedOprec.id}/registrants/${deleteRegistrant.id}`);
      setVerifyModal((current) => current.registrant?.id === deleteRegistrant.id ? { isOpen: false, registrant: null } : current);
      setDeleteRegistrant(null);
      await fetchRegistrants(selectedOprec.id, registrantPage, search, divisionFilter);
    } catch (err) {
      setRegistrantError(err.response?.data?.message || err.message || "Pendaftar belum dapat dihapus.");
    } finally {
      setDeletingRegistrant(false);
    }
  };

  const buildRegistrantEdit = (registrant) => {
    const formData = getRegistrantFormData(registrant);
    const values = {};
    for (const field of selectedOprec?.formFields || []) {
      if (field.type !== "file") values[field.name] = formData[field.name] ?? "";
    }
    values.nim = registrant.nim || values.nim || "";
    values.tanggal_lahir = registrant.tanggalLahir || values.tanggal_lahir || "";
    return {
      values,
      divisi_pilihan_1: String(registrant.divisiPilihan1 || ""),
      divisi_pilihan_2: String(registrant.divisiPilihan2 || ""),
      divisi_pilihan_3: String(registrant.divisiPilihan3 || ""),
      jabatan_pilihan_1: formData.jabatan_pilihan_1 || "",
      jabatan_pilihan_2: formData.jabatan_pilihan_2 || "",
      jabatan_pilihan_3: formData.jabatan_pilihan_3 || "",
    };
  };

  const openRegistrantEditor = (registrant) => {
    setRegistrantEdit(buildRegistrantEdit(registrant));
    setRegistrantEditError("");
    setVerifyModal({ isOpen: true, registrant });
  };

  const closeRegistrantEditor = () => {
    if (savingRegistrant) return;
    setVerifyModal({ isOpen: false, registrant: null });
    setRegistrantEdit(null);
    setRegistrantEditError("");
  };

  const handleSaveRegistrant = async () => {
    if (!selectedOprec?.id || !verifyModal.registrant || !registrantEdit || savingRegistrant) return;
    const choices = [registrantEdit.divisi_pilihan_1, registrantEdit.divisi_pilihan_2, registrantEdit.divisi_pilihan_3];
    if (choices.some((choice) => !choice) || new Set(choices).size !== 3) {
      setRegistrantEditError("Pilih tepat 3 divisi yang berbeda.");
      return;
    }
    setSavingRegistrant(true);
    setRegistrantEditError("");
    try {
      const payload = {
        schema_version: selectedOprec.schemaVersion,
        ...registrantEdit.values,
        divisi_pilihan_1: registrantEdit.divisi_pilihan_1,
        divisi_pilihan_2: registrantEdit.divisi_pilihan_2,
        divisi_pilihan_3: registrantEdit.divisi_pilihan_3,
        jabatan_pilihan_1: registrantEdit.jabatan_pilihan_1,
        jabatan_pilihan_2: registrantEdit.jabatan_pilihan_2,
        jabatan_pilihan_3: registrantEdit.jabatan_pilihan_3,
      };
      const endpoint = "/admin/oprec/" + selectedOprec.id + "/registrants/" + verifyModal.registrant.id + "/form";
      const response = await api.put(endpoint, payload);
      const updated = { ...verifyModal.registrant, ...(response.data?.data || {}) };
      setRegistrants((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setVerifyModal({ isOpen: true, registrant: updated });
      setRegistrantEdit(buildRegistrantEdit(updated));
    } catch (err) {
      const errors = err.response?.data?.errors;
      setRegistrantEditError(Object.values(errors || {})[0]?.[0] || err.response?.data?.message || err.message || "Perubahan belum dapat disimpan.");
    } finally {
      setSavingRegistrant(false);
    }
  };

  const tableFields = getOprecTableFields(selectedOprec?.formFields);
  const tableColumnCount = 7 + tableFields.length;

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
                OPREC · PERIODE {selectedOprec.periode}
              </span>
              <h2 id="oprec-overview-title">Pendaftaran Calon Anggota</h2>
              <p>Informasi pendaftaran dan tahapan seleksi calon anggota HIMANIKA.</p>
            </div>
            <div className="oprec-admin-overview__count">
              <strong>{registrantTotal}</strong>
              <span>{search || divisionFilter !== "all" ? "Hasil filter" : "Berkas masuk"}</span>
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
              <button type="button" className="oprec-admin-overview__delete" onClick={() => setDeleteTarget(selectedOprec)}>
                <Trash2 size={14} aria-hidden="true" />
                <span>Hapus pendaftaran</span>
              </button>
            </div>
          </div>

          {selectedOprec.divisiTersedia?.length > 0 && (
            <div className="oprec-admin-overview__divisions">
              <strong>Divisi dibuka</strong>
              <div>
                {selectedOprec.divisiTersedia.map((division) => (
                  <span key={division.id}>{division.nama}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {deleteTarget && (
        <div
          className="oprec-delete-dialog__overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <section className="oprec-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="oprec-delete-dialog-title" aria-describedby="oprec-delete-dialog-description">
            <div className="oprec-delete-dialog__icon" aria-hidden="true"><AlertTriangle size={22} /></div>
            <span className="oprec-delete-dialog__eyebrow">Konfirmasi tindakan</span>
            <h2 id="oprec-delete-dialog-title">Hapus pendaftaran?</h2>
            <p id="oprec-delete-dialog-description">
              Pendaftaran OPREC periode <strong>{deleteTarget.periode}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="oprec-delete-dialog__actions">
              <button ref={deleteCancelRef} type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</button>
              <button type="button" onClick={() => handleDeleteOprec(deleteTarget)} disabled={deleting}>
                <Trash2 size={15} aria-hidden="true" />
                {deleting ? "Menghapus..." : "Hapus pendaftaran"}
              </button>
            </div>
          </section>
        </div>
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
                maxLength={100}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setRegistrantPage(1); }}
                className="pl-8 pr-3 py-1.5 rounded-none border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 min-w-[200px]"
              />
            </div>

            <select
              value={divisionFilter}
              onChange={(e) => { setDivisionFilter(e.target.value); setRegistrantPage(1); }}
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

        <div className="overflow-x-auto" role="region" aria-label="Tabel pendaftar OPREC; geser ke samping untuk melihat seluruh jawaban" tabIndex={0}>
          <table className="w-full min-w-max text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th scope="col" className="w-14 font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">No.</th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  Nama
                </th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  NIM
                </th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  Tanggal lahir
                </th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  Angkatan
                </th>
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4">
                  Pilihan Divisi
                </th>
                {tableFields.map((field) => <th key={field.name} scope="col" className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4 min-w-44 max-w-64" title={field.label || field.name}>{field.label || field.name}</th>)}
                <th className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500 py-3 px-4 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingRegistrants ? (
                <tr>
                  <td colSpan={tableColumnCount} className="text-center py-12 text-slate-500 font-mono text-xs">
                    Memuat data pendaftar OPREC...
                  </td>
                </tr>
              ) : registrants.length === 0 ? (
                <tr>
                  <td colSpan={tableColumnCount} className="text-center py-12 text-slate-500 font-mono text-xs">
                    Belum ada calon anggota pada filter ini.
                  </td>
                </tr>
              ) : (
                registrants.map((r, index) => {
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
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{(registrantPage - 1) * registrantPerPage + index + 1}</td>
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
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {r.tanggalLahir ? formatOprecDate(`${r.tanggalLahir}T00:00:00`) : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {getRegistrantFormData(r).angkatan || "—"}
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
                      {tableFields.map((field) => {
                        const value = getRegistrantFieldValue(r, field, selectedOprec?.divisiTersedia);
                        return <td key={field.name} className="py-3 px-4 text-xs text-slate-700 min-w-44 max-w-64 break-words" title={value.downloadUrl ? undefined : value.text}>
                          {value.downloadUrl ? <a href={value.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline underline-offset-2">{value.text}</a> : <span className="line-clamp-3 whitespace-pre-wrap">{value.text}</span>}
                        </td>;
                      })}
                      <td className="py-3 px-4 text-right">
                        <div className="oprec-table-actions">
                          <button type="button" onClick={() => openRegistrantEditor(r)} className="oprec-table-btn oprec-table-btn--edit" title="Edit pendaftaran">
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button type="button" onClick={() => setDeleteRegistrant(r)} className="oprec-table-btn oprec-table-btn--delete" title="Hapus pendaftar">
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Hapus</span>
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
        {registrantPages > 1 && <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
          <span>Halaman {registrantPage} dari {registrantPages}</span>
          <button type="button" className="oprec-btn oprec-btn--secondary" disabled={registrantPage <= 1 || loadingRegistrants} onClick={() => setRegistrantPage((page) => page - 1)}>Sebelumnya</button>
          <button type="button" className="oprec-btn oprec-btn--secondary" disabled={registrantPage >= registrantPages || loadingRegistrants} onClick={() => setRegistrantPage((page) => page + 1)}>Berikutnya</button>
        </div>}
      </div>

      <OprecCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchOprecs}
      />

      {deleteRegistrant && (
        <div className="oprec-delete-dialog__overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deletingRegistrant) setDeleteRegistrant(null);
        }}>
          <section className="oprec-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="oprec-delete-registrant-title" aria-describedby="oprec-delete-registrant-description">
            <div className="oprec-delete-dialog__icon" aria-hidden="true"><AlertTriangle size={22} /></div>
            <span className="oprec-delete-dialog__eyebrow">Konfirmasi tindakan</span>
            <h2 id="oprec-delete-registrant-title">Hapus pendaftar?</h2>
            <p id="oprec-delete-registrant-description">Data <strong>{getRegistrantName(deleteRegistrant)}</strong> beserta berkas pendaftarannya akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="oprec-delete-dialog__actions">
              <button ref={deleteRegistrantCancelRef} type="button" onClick={() => setDeleteRegistrant(null)} disabled={deletingRegistrant}>Batal</button>
              <button type="button" onClick={handleDeleteRegistrant} disabled={deletingRegistrant}>
                <Trash2 size={15} aria-hidden="true" />
                {deletingRegistrant ? "Menghapus..." : "Hapus pendaftar"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Modal Detail Pendaftaran */}
      {verifyModal.isOpen && verifyModal.registrant && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeRegistrantEditor();
          }}
        >
          <div className="w-full max-w-2xl bg-white border border-slate-300 rounded-none shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] text-blue-600 uppercase tracking-wider block font-medium">
                  EDIT PENDAFTARAN
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
                onClick={closeRegistrantEditor}
                className="p-1 border border-slate-200 rounded-none hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                aria-label="Tutup popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="p-5 md:p-6 overflow-y-auto flex flex-col gap-6">
              {registrantEdit && (
                <section className="border border-blue-200 bg-blue-50/40 p-4">
                  <div className="mb-4">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-blue-600">Edit pendaftaran</span>
                    <p className="mt-1 text-xs text-slate-600">Ubah data formulir yang diperlukan, lalu simpan perubahan. Data akun dan berkas tetap terlindungi.</p>
                  </div>
                  {registrantEditError && <p role="alert" className="mb-3 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{registrantEditError}</p>}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium text-slate-700">
                      Nama lengkap
                      <input type="text" value={registrantEdit.values.nama || ""} onChange={(event) => setRegistrantEdit((current) => ({ ...current, values: { ...current.values, nama: event.target.value } }))} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600" />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      NIM
                      <input type="text" value={registrantEdit.values.nim || ""} onChange={(event) => setRegistrantEdit((current) => ({ ...current, values: { ...current.values, nim: event.target.value.toUpperCase() } }))} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-blue-600" />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Tanggal lahir
                      <input type="date" value={registrantEdit.values.tanggal_lahir || ""} onChange={(event) => setRegistrantEdit((current) => ({ ...current, values: { ...current.values, tanggal_lahir: event.target.value } }))} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600" />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Angkatan
                      <input type="text" value={registrantEdit.values.angkatan || ""} onChange={(event) => setRegistrantEdit((current) => ({ ...current, values: { ...current.values, angkatan: event.target.value } }))} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600" />
                    </label>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[1, 2, 3].map((rank) => {
                      const divisionKey = "divisi_pilihan_" + rank;
                      const jabatanKey = "jabatan_pilihan_" + rank;
                      const division = selectedOprec?.divisiTersedia?.find((item) => String(item.id) === registrantEdit[divisionKey]);
                      return (
                        <div key={rank} className="border border-slate-200 bg-white p-3">
                          <label className="block text-xs font-medium text-slate-700">Pilihan {rank}
                            <select value={registrantEdit[divisionKey]} onChange={(event) => setRegistrantEdit((current) => ({ ...current, [divisionKey]: event.target.value, [jabatanKey]: "" }))} className="mt-1 block w-full border border-slate-300 bg-white px-2 py-2 text-xs outline-none focus:border-blue-600">
                              <option value="">Pilih divisi</option>
                              {(selectedOprec?.divisiTersedia || []).map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
                            </select>
                          </label>
                          <label className="mt-2 block text-xs font-medium text-slate-700">Jabatan
                            <select value={registrantEdit[jabatanKey]} onChange={(event) => setRegistrantEdit((current) => ({ ...current, [jabatanKey]: event.target.value }))} disabled={!division} className="mt-1 block w-full border border-slate-300 bg-white px-2 py-2 text-xs outline-none disabled:bg-slate-100 focus:border-blue-600">
                              <option value="">Pilih jabatan</option>
                              {(division?.jabatan || []).map((jabatan) => <option key={jabatan} value={jabatan}>{jabatan}</option>)}
                            </select>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(selectedOprec?.formFields || []).filter((field) => !["file", "nama", "nim", "tanggal_lahir", "angkatan"].includes(field.type === "file" ? "file" : field.name)).map((field) => {
                      const value = registrantEdit.values[field.name] ?? "";
                      const setValue = (nextValue) => setRegistrantEdit((current) => ({ ...current, values: { ...current.values, [field.name]: nextValue } }));
                      if (field.type === "checkbox") {
                        return <label key={field.name} className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={value === "on"} onChange={(event) => setValue(event.target.checked ? "on" : "")} /> {field.label || field.name}</label>;
                      }
                      return <label key={field.name} className="text-xs font-medium text-slate-700">{field.label || field.name}
                        {field.type === "textarea" ? <textarea value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 block min-h-24 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600" /> : field.type === "select" || field.type === "radio" ? <select value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600"><option value="">Pilih jawaban</option>{(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label || option.value}</option>)}</select> : <input type={field.type === "tel" || field.type === "email" || field.type === "url" || field.type === "number" || field.type === "date" ? field.type : "text"} value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600" />}
                      </label>;
                    })}
                  </div>
                </section>
              )}

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
                      const downloadUrl = fileInfo?.downloadUrl;
                      if (!downloadUrl) return null;
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
            <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={closeRegistrantEditor}
                disabled={savingRegistrant}
                className="oprec-btn oprec-btn--secondary !min-h-[36px] !py-1.5"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRegistrant}
                disabled={savingRegistrant || !registrantEdit}
                className="oprec-btn oprec-btn--primary !min-h-[36px] !py-1.5"
              >
                {savingRegistrant ? "Menyimpan..." : "Simpan perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
