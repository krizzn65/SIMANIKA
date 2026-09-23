"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { toast } from "sonner";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  AlertTriangle,
  ArrowUpDown,
  Sparkles,
  Award,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalRegular: 0,
    newThisWeek: 0,
  });
  const [meta, setMeta] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestSeqRef = useRef(0);
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  // Modals state
  const [detailModalUser, setDetailModalUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editModalUser, setEditModalUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "user",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Robust fetchUsers with explicit query parameter and race-condition safeguard
  const fetchUsers = useCallback((page = 1, searchQuery = debouncedSearch, role = roleFilter) => {
    const currentSeq = ++requestSeqRef.current;
    setLoading(true);

    const params = {
      page,
      per_page: 10,
      sort_by: sortBy,
      sort_dir: sortDir,
    };

    const trimmed = typeof searchQuery === "string" ? searchQuery.trim() : "";
    if (trimmed) {
      params.q = trimmed;
    }
    if (role && role !== "all") {
      params.role = role;
    }

    api.get("/admin/users", { params })
      .then((res) => {
        // Discard response if a newer request was dispatched
        if (currentSeq !== requestSeqRef.current) return;
        if (res.data?.status === "success") {
          setUsers(res.data.data || []);
          setStats(res.data.stats || stats);
          setMeta(res.data.meta || meta);
        }
      })
      .catch((err) => {
        if (currentSeq !== requestSeqRef.current) return;
        console.error("Gagal memuat data pengguna:", err);
        toast.error("Gagal memuat daftar pengguna");
      })
      .finally(() => {
        if (currentSeq === requestSeqRef.current) {
          setLoading(false);
        }
      });
  }, [debouncedSearch, roleFilter, sortBy, sortDir]);

  // Auto-fetch on debounced search, role filter, or sorting changes
  useEffect(() => {
    fetchUsers(1, debouncedSearch, roleFilter);
  }, [debouncedSearch, roleFilter, sortBy, sortDir]);

  // Immediate form submission on Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(search);
    fetchUsers(1, search, roleFilter);
  };

  // Immediate and clear reset of search
  const handleClearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    fetchUsers(1, "", roleFilter);
  };

  // Open Detail Modal
  const handleOpenDetail = (userId) => {
    setDetailLoading(true);
    setDetailModalUser(null);
    api.get(`/admin/users/${userId}`)
      .then((res) => {
        if (res.data?.status === "success") {
          setDetailModalUser(res.data.data);
        }
      })
      .catch((err) => {
        toast.error("Gagal mengambil detail pengguna.");
      })
      .finally(() => {
        setDetailLoading(false);
      });
  };

  // Open Edit Modal
  const handleOpenEditModal = (userItem) => {
    setEditModalUser(userItem);
    setEditFormData({
      name: userItem.name || "",
      email: userItem.email || "",
    });
  };

  // Submit Edit User
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editModalUser) return;
    setEditSubmitting(true);

    const payload = {
      name: editFormData.name,
      email: editFormData.email,
    };

    api.put(`/admin/users/${editModalUser.id}`, payload)
      .then((res) => {
        toast.success(res.data.message || "Data pengguna berhasil diperbarui.");
        setEditModalUser(null);
        fetchUsers(meta.currentPage);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Gagal memperbarui pengguna.";
        toast.error(msg);
      })
      .finally(() => {
        setEditSubmitting(false);
      });
  };

  // Submit Delete User
  const handleDeleteSubmit = () => {
    if (!deleteModalUser) return;
    setDeleteSubmitting(true);
    api.delete(`/admin/users/${deleteModalUser.id}`)
      .then((res) => {
        toast.success(res.data.message || "Pengguna berhasil dihapus.");
        setDeleteModalUser(null);
        fetchUsers(meta.currentPage);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Gagal menghapus pengguna.";
        toast.error(msg);
      })
      .finally(() => {
        setDeleteSubmitting(false);
      });
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Kelola Pengguna
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pantau akun mahasiswa, manajemen profil, dan atur hak akses role di SIMANIKA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchUsers(meta.currentPage)}
            disabled={loading}
            className="admin-btn admin-btn--secondary"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Stat Cards - Neo Arcade Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="admin-stat-card">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                TOTAL_USERS
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? "..." : stats.totalUsers}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Akun terdaftar</span>
          </div>
          <div className="admin-stat-icon">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="admin-stat-card border-blue-200/80 bg-gradient-to-br from-white to-blue-50/40">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
                ADMIN_ROLE
              </span>
            </div>
            <div className="text-2xl font-black text-[#155eef]">
              {loading ? "..." : stats.totalAdmins}
            </div>
            <span className="text-xs text-blue-600/80 font-medium mt-1 block">Super Administrator</span>
          </div>
          <div className="admin-stat-icon bg-blue-100 text-[#155eef]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                USER_ROLE
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? "..." : stats.totalRegular}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Mahasiswa umum</span>
          </div>
          <div className="admin-stat-icon text-slate-700 bg-slate-100">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 font-semibold">
                NEW_7_DAYS
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600">
              +{loading ? "..." : stats.newThisWeek}
            </div>
            <span className="text-xs text-emerald-700 font-medium mt-1 block">Bergabung minggu ini</span>
          </div>
          <div className="admin-stat-icon text-emerald-600 bg-emerald-50">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        {/* Table Filter & Search Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Role Filter Tabs */}
          <div className="admin-filter-tabs">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`admin-filter-tab ${roleFilter === "all" ? "active" : ""}`}
            >
              <span>Semua</span>
              <span className="admin-filter-badge">{stats.totalUsers}</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("admin")}
              className={`admin-filter-tab ${roleFilter === "admin" ? "active" : ""}`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
              <span className="admin-filter-badge">{stats.totalAdmins}</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("user")}
              className={`admin-filter-tab ${roleFilter === "user" ? "active" : ""}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User</span>
              <span className="admin-filter-badge">{stats.totalRegular}</span>
            </button>
          </div>

          {/* Search Bar Form */}
          <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, atau NIM..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer p-0"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* User Directory Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>Pengguna</th>
                <th>Partisipasi</th>
                <th>Hak Akses (Role)</th>
                <th>Bergabung</th>
                <th className="text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4"><div className="h-4 bg-slate-200 rounded w-4" /></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-slate-200 rounded w-32" />
                          <div className="h-3 bg-slate-100 rounded w-48" />
                        </div>
                      </div>
                    </td>
                    <td><div className="h-4 bg-slate-200 rounded w-20" /></td>
                    <td><div className="h-6 bg-slate-200 rounded-full w-16" /></td>
                    <td><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="text-right"><div className="h-8 bg-slate-200 rounded w-28 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-500">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">Tidak Ada Pengguna Ditemukan</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {debouncedSearch ? `Tidak ada hasil pencarian untuk "${debouncedSearch}".` : "Belum ada data pengguna yang terdaftar."}
                      </p>
                      {debouncedSearch && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100/70 rounded-lg transition-colors border border-blue-200/50 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset Pencarian</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((item, idx) => {
                  const isCurrent = currentUser?.id === item.id;
                  const isAdmin = item.role === "admin";
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="font-mono text-xs text-slate-400">
                        {(meta.currentPage - 1) * meta.perPage + idx + 1}
                      </td>

                      {/* User Info */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                            <UserAvatar
                              src={item.fotoProfil}
                              name={item.name}
                              email={item.email}
                              className="w-full h-full text-xs"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm truncate max-w-[200px]">
                                {item.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 rounded border border-emerald-200">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 block truncate max-w-[220px]">
                              {item.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Participation Stats */}
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60"
                            title="Partisipasi Event"
                          >
                            <Calendar className="w-3 h-3 text-blue-500" />
                            {item.eventRegistrationsCount}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60"
                            title="Partisipasi OPREC"
                          >
                            <ClipboardList className="w-3 h-3 text-purple-500" />
                            {item.oprecRegistrationsCount}
                          </span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#155eef]/10 text-[#155eef] border border-blue-200 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#155eef]" />
                            <span>ADMIN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>USER</span>
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>

                      {/* Actions */}
                      <td>
                        {isAdmin ? (
                          <div className="flex items-center justify-end">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold text-slate-400 bg-slate-50 border border-slate-200/60">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-500/70" />
                              <span>ADMIN HIMANIKA</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Detail Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(item.id)}
                              className="admin-btn admin-btn--secondary admin-btn--sm"
                              title="Lihat Detail Pengguna"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span className="hidden sm:inline">Detail</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="admin-btn admin-btn--secondary admin-btn--sm !px-2"
                              title="Edit Data Pengguna"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-600" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteModalUser(item)}
                              disabled={isCurrent}
                              className="admin-btn admin-btn--danger admin-btn--sm !px-2 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.total > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan{" "}
                <span className="font-semibold text-slate-800">
                  {(meta.currentPage - 1) * meta.perPage + 1}
                </span>
                –
                <span className="font-semibold text-slate-800">
                  {Math.min(meta.currentPage * meta.perPage, meta.total)}
                </span>{" "}
                dari <span className="font-semibold text-slate-800">{meta.total}</span> data pengguna (maks. 10 per halaman)
              </span>
            </div>

            {meta.lastPage > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fetchUsers(meta.currentPage - 1)}
                  disabled={meta.currentPage <= 1 || loading}
                  className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>

                {Array.from({ length: meta.lastPage }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    meta.lastPage > 7 &&
                    pageNum !== 1 &&
                    pageNum !== meta.lastPage &&
                    Math.abs(pageNum - meta.currentPage) > 1
                  ) {
                    if (pageNum === 2 || pageNum === meta.lastPage - 1) {
                      return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  }

                  const isActive = pageNum === meta.currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => fetchUsers(pageNum)}
                      disabled={loading}
                      className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-200/70 bg-white border border-slate-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => fetchUsers(meta.currentPage + 1)}
                  disabled={meta.currentPage >= meta.lastPage || loading}
                  className="admin-btn admin-btn--secondary admin-btn--sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: DETAIL PENGGUNA & RIWAYAT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {(detailModalUser || detailLoading) && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card max-w-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Detail Profil Pengguna</h3>
                  <p className="text-xs text-slate-500">Informasi bio akun dan riwayat partisipasi program</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                <span className="text-xs font-mono">Memuat detail profil pengguna...</span>
              </div>
            ) : detailModalUser && (
              <div className="py-4 space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                {/* Profile Card Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-slate-50 to-blue-50/30 border border-blue-200/50">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                    <UserAvatar
                      src={detailModalUser.fotoProfil}
                      name={detailModalUser.name}
                      email={detailModalUser.email}
                      className="w-full h-full text-lg"
                    />
                  </div>
                  <div className="text-center sm:text-left min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="text-lg font-black text-slate-900">{detailModalUser.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        detailModalUser.role === "admin"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {detailModalUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{detailModalUser.email}</p>
                  </div>
                </div>

                {/* Event Participations */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Riwayat Pendaftaran Event ({detailModalUser.eventRegistrations?.length || 0})</span>
                    </h5>
                  </div>
                  {detailModalUser.eventRegistrations?.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                      Belum pernah mendaftar pada event atau lomba SIMANIKA.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detailModalUser.eventRegistrations.map((reg) => (
                        <div key={reg.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{reg.event?.judul || "Event #"+reg.id}</span>
                            <span className="text-[11px] text-slate-400 font-mono">Didaftar: {formatDate(reg.createdAt)}</span>
                          </div>
                          <span className="admin-badge admin-badge--blue capitalize">
                            {reg.status || "Terdaftar"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* OPREC Participations */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-purple-600" />
                      <span>Riwayat Pendaftaran OPREC ({detailModalUser.oprecRegistrations?.length || 0})</span>
                    </h5>
                  </div>
                  {detailModalUser.oprecRegistrations?.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                      Belum pernah mendaftar pada open recruitment kepengurusan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detailModalUser.oprecRegistrations.map((reg) => (
                        <div key={reg.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{reg.oprec?.judul || "OPREC Kepengurusan"}</span>
                            <span className="text-[11px] text-purple-700 font-medium block">Pilihan Divisi: {reg.division}</span>
                            <span className="text-[11px] text-slate-400 font-mono">Didaftar: {formatDate(reg.createdAt)}</span>
                          </div>
                          <span className={`admin-badge capitalize ${
                            reg.status === "accepted" ? "admin-badge--accepted" :
                            reg.status === "rejected" ? "admin-badge--rejected" : "admin-badge--pending"
                          }`}>
                            {reg.status || "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalUser(null)}
                className="admin-btn admin-btn--secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 3: EDIT DATA PENGGUNA */}
      {/* ───────────────────────────────────────────────────────────── */}
      {editModalUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card max-w-lg p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Edit Data Pengguna</h3>
                  <p className="text-xs text-slate-500">Perbarui profil biodata atau hak akses pengguna</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="admin-btn admin-btn--secondary"
                  disabled={editSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="admin-btn admin-btn--primary"
                >
                  {editSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 4: KONFIRMASI HAPUS PENGGUNA */}
      {/* ───────────────────────────────────────────────────────────── */}
      {deleteModalUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hapus Akun Pengguna?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-800">{deleteModalUser.name}</span> ({deleteModalUser.email})? Seluruh data profil dan pendaftaran terkait akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="admin-btn admin-btn--secondary flex-1"
                disabled={deleteSubmitting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteSubmitting}
                className="admin-btn admin-btn--danger flex-1"
              >
                {deleteSubmitting ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
