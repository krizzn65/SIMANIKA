"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Clock3, FileSearch2, RefreshCw, Search, ShieldAlert, X } from "lucide-react";
import { api } from "@/services/api";
import { ROLE_LABELS } from "@/lib/roleAccess";
import "./logs.css";

const initialFilters = { kind: "all", result: "all", q: "" };
const modules = { auth: "Akun", oprec: "OPREC", events: "Event", users: "Pengguna", merchandise: "Merchandise", settings: "Pengaturan", public: "Publik", system: "Sistem" };
const kinds = { activity: "Aktivitas", security: "Keamanan", error: "Error sistem" };
const dateTime = (value) => value ? new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
}).format(new Date(value)) + " WIB" : "—";

function StatCard({ label, value, icon: Icon, tone }) {
  return <div className={`syslog-stat syslog-stat--${tone}`}>
    <div><span className="syslog-stat__label">{label}</span><strong>{value}</strong><small>24 jam terakhir</small></div>
    <span className="syslog-stat__icon"><Icon size={20} aria-hidden="true" /></span>
  </div>;
}

function StatusBadge({ entry }) {
  return <span className={`syslog-badge syslog-badge--${entry.result === "failed" ? "failed" : entry.kind}`}>
    <span aria-hidden="true" className="syslog-badge__dot" />
    {entry.result === "failed" ? "Gagal" : "Berhasil"}
  </span>;
}

export default function LogsWorkspace() {
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, activity: 0, security: 0, errors: 0, failed: 0 });
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const closeRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = search.trim();
      setFilters((current) => current.q === q ? current : { ...current, q });
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (signal) => {
    setLoading(true);
    try {
      const params = { page };
      for (const [key, value] of Object.entries(filters)) if (value && value !== "all") params[key] = value;
      const response = await api.get("/admin/logs", { params, signal });
      if (signal.aborted) return;
      setRows(response.data?.data || []);
      setStats(response.data?.stats || { total: 0, activity: 0, security: 0, errors: 0, failed: 0 });
      setMeta(response.data?.meta || { page: 1, lastPage: 1, total: 0 });
      setError("");
    } catch (cause) {
      if (!signal.aborted) {
        setError(cause.message || "Log gagal dimuat.");
        setRows([]);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [filters, page, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!detail && !detailLoading) return;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeDetail();
      if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detail, detailLoading]);

  const closeDetail = () => {
    setDetail(null);
    setDetailLoading(false);
    setDetailError("");
    triggerRef.current?.focus();
  };

  const openDetail = async (entry, trigger) => {
    triggerRef.current = trigger;
    setDetail(entry);
    setDetailLoading(true);
    setDetailError("");
    try {
      const response = await api.get(`/admin/logs/${entry.id}`);
      setDetail(response.data?.data || entry);
    } catch (cause) {
      setDetailError(cause.message || "Rincian log gagal dimuat.");
    } finally {
      setDetailLoading(false);
    }
  };

  const changeFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  return <main className="syslog-page">
    <header className="syslog-hero">
      <div>
        <h1>Log Sistem</h1>
        <p>Telusuri perubahan penting, akses yang ditolak, dan gangguan layanan dari satu tempat.</p>
      </div>
      <button type="button" className="syslog-refresh" onClick={() => setRefresh((value) => value + 1)} disabled={loading}>
        <RefreshCw size={17} className={loading ? "syslog-spin" : ""} aria-hidden="true" /> Perbarui log
      </button>
    </header>

    <section className="syslog-stats" aria-label="Ringkasan 24 jam terakhir">
      <StatCard label="Seluruh peristiwa" value={stats.total} icon={Activity} tone="blue" />
      <StatCard label="Aktivitas" value={stats.activity} icon={FileSearch2} tone="neutral" />
      <StatCard label="Keamanan" value={stats.security} icon={ShieldAlert} tone="amber" />
      <StatCard label="Error sistem" value={stats.errors} icon={AlertTriangle} tone="red" />
    </section>

    <section className="syslog-panel" aria-labelledby="syslog-list-title">
      <div className="syslog-panel__heading">
        <div><h2 id="syslog-list-title">Riwayat peristiwa</h2><p>Data baru tampil setelah suatu peristiwa terjadi. Catatan lama tidak dibuat ulang.</p></div>
        <span className="syslog-count">{meta.total} catatan</span>
      </div>

      <div className="syslog-filters">
        <label className="syslog-search"><span>Cari</span><div><Search size={16} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} placeholder="Pelaku, tindakan, ID objek..." /></div></label>
        <label><span>Jenis</span><select value={filters.kind} onChange={(event) => changeFilter("kind", event.target.value)}><option value="all">Semua jenis</option><option value="activity">Aktivitas</option><option value="security">Keamanan</option><option value="error">Error sistem</option></select></label>
        <label><span>Hasil</span><select value={filters.result} onChange={(event) => changeFilter("result", event.target.value)}><option value="all">Semua hasil</option><option value="success">Berhasil</option><option value="failed">Gagal</option></select></label>
      </div>

      {error && <div className="syslog-error" role="alert"><AlertTriangle size={17} aria-hidden="true" />{error}<button type="button" onClick={() => setRefresh((value) => value + 1)}>Coba lagi</button></div>}
      <div className="syslog-table-wrap" role="region" aria-label="Tabel log sistem" tabIndex={0}>
        <table className="syslog-table"><thead><tr><th scope="col">Waktu WIB</th><th scope="col">Peristiwa</th><th scope="col">Pelaku</th><th scope="col">Objek</th><th scope="col">Hasil</th><th scope="col" aria-label="Rincian" /></tr></thead>
          <tbody>{loading ? <tr><td colSpan={6} className="syslog-state"><span className="syslog-loading" /> Memuat log sistem…</td></tr>
            : rows.length === 0 ? <tr><td colSpan={6} className="syslog-state"><FileSearch2 size={28} aria-hidden="true" /><strong>Belum ada catatan pada filter ini.</strong><span>Ubah filter atau periksa kembali nanti.</span></td></tr>
              : rows.map((entry) => <tr key={entry.id}>
                <td className="syslog-mono"><Clock3 size={14} aria-hidden="true" /> {dateTime(entry.createdAt)}</td>
                <td><span className={`syslog-kind syslog-kind--${entry.kind}`}>{kinds[entry.kind] || "Aktivitas"}</span><strong>{entry.summary}</strong><small>{modules[entry.module] || entry.module} · {entry.action}</small></td>
                <td><strong>{entry.actor?.name || "Sistem / pengunjung"}</strong><small>{entry.actor?.role ? ROLE_LABELS[entry.actor.role] || entry.actor.role : "Tanpa akun"}</small></td>
                <td className="syslog-mono">{entry.target ? `${entry.target.type} #${entry.target.id}` : "—"}</td>
                <td><StatusBadge entry={entry} /><small>HTTP {entry.httpStatus}</small></td>
                <td><button type="button" className="syslog-detail-button" onClick={(event) => openDetail(entry, event.currentTarget)} aria-label={`Lihat rincian ${entry.summary}`}><ArrowRight size={17} aria-hidden="true" /></button></td>
              </tr>)}</tbody></table>
      </div>
      <div className="syslog-pagination"><span>Halaman {meta.page} dari {meta.lastPage}</span><div><button type="button" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Halaman sebelumnya"><ChevronLeft size={18} aria-hidden="true" /></button><button type="button" disabled={loading || page >= meta.lastPage} onClick={() => setPage((value) => value + 1)} aria-label="Halaman berikutnya"><ChevronRight size={18} aria-hidden="true" /></button></div></div>
    </section>

    {detail && <div className="syslog-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetail(); }}>
      <section className="syslog-modal" role="dialog" aria-modal="true" aria-labelledby="syslog-detail-title">
        <header><div><span className="syslog-eyebrow">// RINCIAN PERISTIWA</span><h2 id="syslog-detail-title">{detail.summary}</h2></div><button ref={closeRef} type="button" className="syslog-close" onClick={closeDetail} aria-label="Tutup rincian"><X size={20} aria-hidden="true" /></button></header>
        {detailLoading ? <p className="syslog-detail-state">Memuat rincian…</p> : detailError ? <p className="syslog-detail-state" role="alert">{detailError}</p> : <div className="syslog-modal__body">
          <div className="syslog-modal__lead"><span className={`syslog-kind syslog-kind--${detail.kind}`}>{kinds[detail.kind]}</span><StatusBadge entry={detail} /></div>
          <dl className="syslog-details">
            <div><dt>Waktu</dt><dd>{dateTime(detail.createdAt)}</dd></div>
            <div><dt>Pelaku</dt><dd>{detail.actor?.name || "Sistem / pengunjung"}{detail.actor?.role ? ` · ${ROLE_LABELS[detail.actor.role] || detail.actor.role}` : ""}</dd></div>
            <div><dt>Modul / tindakan</dt><dd>{modules[detail.module] || detail.module} / {detail.action}</dd></div>
            <div><dt>Objek</dt><dd>{detail.target ? `${detail.target.type} #${detail.target.id}` : "—"}</dd></div>
            <div><dt>Alamat IP</dt><dd>{detail.ipAddress || "—"}</dd></div>
            <div><dt>Permintaan</dt><dd>{detail.method} {detail.route} · HTTP {detail.httpStatus}</dd></div>
            <div className="syslog-details__wide"><dt>ID permintaan</dt><dd className="syslog-mono">{detail.requestId || "—"}</dd></div>
          </dl>
          {detail.context?.fields?.length > 0 && <div className="syslog-context"><h3>Kolom yang dikirim</h3><div className="syslog-chips">{detail.context.fields.map((field) => <span key={field}>{field}</span>)}</div></div>}
          {(detail.context?.before || detail.context?.after) && <div className="syslog-context"><h3>Perubahan aman</h3><div className="syslog-change">{Object.keys({ ...detail.context.before, ...detail.context.after }).map((key) => <div key={key}><span>{key}</span><strong>{String(detail.context.before?.[key] ?? "—")}</strong><ArrowRight size={15} aria-hidden="true" /><strong>{String(detail.context.after?.[key] ?? "—")}</strong></div>)}</div></div>}
          {detail.context?.error_type && <div className="syslog-context"><h3>Rujukan error</h3><p>{detail.context.error_type} · {detail.context.fingerprint}</p></div>}
          {!detail.context?.fields?.length && !detail.context?.before && !detail.context?.error_type && <p className="syslog-detail-note">Tidak ada nilai formulir atau isi berkas yang disimpan dalam log ini.</p>}
        </div>}
      </section>
    </div>}
  </main>;
}
