"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { AdminErrorNotice } from "./AdminErrorNotice";
import { eventCategoryLabel } from "@/lib/events";
import {
  Users,
  Calendar,
  CheckCircle2,
  Trophy,
  ClipboardList,
  AlertCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    setError(false);
    api.get("/admin/dashboard")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Failed to load admin dashboard:", err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = data?.stats || {
    totalUsers: 0,
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    totalTeams: 0,
    totalOprecRegistrations: 0,
    pendingOprecReviews: 0,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider font-mono">
              SYSTEM ONLINE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Dashboard Administrator
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ringkasan metrik sistem pendaftaran, event, dan kepengurusan HIMANIKA.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchDashboard}
            disabled={loading}
            className="admin-btn admin-btn--secondary"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link href="/admin/events" className="admin-btn admin-btn--primary">
            <Plus className="w-4 h-4" />
            <span>Kelola Event</span>
          </Link>
        </div>
      </div>

      <AdminErrorNotice message={error ? "Ringkasan admin belum bisa dimuat. Periksa koneksi lalu coba lagi." : ""} onRetry={fetchDashboard} />
      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pengguna</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{loading ? "..." : stats.totalUsers}</div>
            <span className="text-xs text-slate-400 mt-0.5 block">Akun terdaftar</span>
          </div>
          <div className="admin-stat-icon">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Event Aktif</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{loading ? "..." : stats.activeEvents}</div>
            <span className="text-xs text-blue-600 font-medium mt-0.5 block">Dari {stats.totalEvents} total event</span>
          </div>
          <div className="admin-stat-icon">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pendaftar Event</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{loading ? "..." : stats.totalRegistrations}</div>
            <span className="text-xs text-slate-400 mt-0.5 block">Peserta individu</span>
          </div>
          <div className="admin-stat-icon">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tim Terdaftar</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{loading ? "..." : stats.totalTeams}</div>
            <span className="text-xs text-slate-400 mt-0.5 block">Grup competition</span>
          </div>
          <div className="admin-stat-icon">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pendaftar OPREC</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{loading ? "..." : stats.totalOprecRegistrations}</div>
            <span className="text-xs text-amber-600 font-medium mt-0.5 block">
              {stats.pendingOprecReviews} perlu verifikasi
            </span>
          </div>
          <div className="admin-stat-icon">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Events (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="text-base font-bold text-slate-900">Event & Competition Terbaru</h2>
                <p className="text-xs text-slate-500">Daftar event yang terdaftar di dalam sistem.</p>
              </div>
              <Link href="/admin/events" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Judul Event</th>
                    <th>Kategori</th>
                    <th>Status</th>
                    <th>Peserta / Tim</th>
                    <th>Tipe</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        Memuat data event...
                      </td>
                    </tr>
                  ) : !data?.recentEvents?.length ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        Belum ada event yang dibuat.
                      </td>
                    </tr>
                  ) : (
                    data.recentEvents.map((e) => (
                      <tr key={e.id}>
                        <td className="font-semibold text-slate-800">
                          <Link href="/admin/events" className="hover:text-blue-600 transition-colors">
                            {e.judul}
                          </Link>
                        </td>
                        <td>
                          <span className="admin-badge admin-badge--neutral uppercase text-[10px]">
                            {eventCategoryLabel(e.kategori)}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-badge admin-badge--${e.status}`}>
                            {e.status}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {e.totalPendaftar} {e.tipePendaftaran === "tim" ? "Tim" : "Peserta"}
                          </span>
                        </td>
                        <td className="capitalize text-xs text-slate-500">
                          {e.tipePendaftaran}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Active OPREC status & quick links */}
        <div className="flex flex-col gap-6">
          {/* Active OPREC Panel */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="text-base font-bold text-slate-900">Status OPREC</h2>
              <Link href="/admin/oprec" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                <span>Kelola</span><ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="admin-card-body flex flex-col gap-4">
              {data?.activeOprec ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{data.activeOprec.judul}</span>
                    <span className={`admin-badge admin-badge--${data.activeOprec.status === "open" ? "published" : "closed"}`}>
                      {data.activeOprec.status === "open" ? "Dibuka" : "Ditutup"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                    <span className="text-xs text-blue-900 font-medium">Total Berkas Masuk</span>
                    <span className="font-bold text-base text-blue-700 font-mono">
                      {data.activeOprec.totalPendaftar} Pendaftar
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Pengumuman Hasil:</span>
                    <span className={`font-semibold ${data.activeOprec.pengumumanPublished ? "text-emerald-600" : "text-amber-600"}`}>
                      {data.activeOprec.pengumumanPublished ? "Dipublikasikan" : "Belum Rilis"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs">
                  Belum ada periode OPREC yang disiapkan.
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="text-base font-bold text-slate-900">Aksi Cepat</h2>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <Link
                href="/admin/events"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">Buat / Edit Event</div>
                    <div className="text-[11px] text-slate-500">Atur pendaftaran & sistem tim</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/admin/oprec"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">Verifikasi Berkas OPREC</div>
                    <div className="text-[11px] text-slate-500">Terima / tolak calon anggota</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/admin/settings"
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">Pengaturan Sistem</div>
                    <div className="text-[11px] text-slate-500">Konfigurasi akun dan portal</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
