"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ShieldCheck, Server, Key, User, CheckCircle2 } from "lucide-react";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const displayName = user?.nama || user?.name || user?.email?.split("@")[0] || "Admin";

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Sistem & Akun</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Informasi kredensial administrator dan status konfigurasi backend SIMANIKA.
        </p>
      </div>

      {/* Admin Profile Information */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Profil Administrator</h2>
          </div>
          <span className="admin-badge admin-badge--published">AKSES AKTIF</span>
        </div>
        <div className="admin-card-body flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-500/20 shadow-sm flex-shrink-0">
            <UserAvatar
              name={displayName}
              email={user?.email}
              size="100%"
              borderRadius="16px"
              fontSize="1.35rem"
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-lg font-bold text-slate-900">{displayName}</div>
            <div className="text-xs font-mono text-slate-500">{user?.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="admin-badge admin-badge--blue text-[10px] uppercase font-mono">
                ROLE: {user?.role || "ADMIN"}
              </span>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Session Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System & Architecture Info */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Konfigurasi Arsitektur (PRD & Tech Stack)</h2>
          </div>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <tbody>
              <tr>
                <td className="w-1/3 font-semibold text-slate-700">Framework Frontend</td>
                <td className="font-mono text-xs text-blue-700">Next.js 16 (App Router) + React 19 + Tailwind CSS</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-700">Backend API Engine</td>
                <td className="font-mono text-xs text-blue-700">Laravel 11 + PHP 8.2+</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-700">Database Engine</td>
                <td className="font-mono text-xs text-blue-700">PostgreSQL (20 domain tables + infrastructure)</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-700">Autentikasi & Guard</td>
                <td className="font-mono text-xs text-blue-700">Laravel Sanctum SPA + HttpOnly Cookie + CSRF protection</td>
              </tr>
              <tr>
                <td className="font-semibold text-slate-700">Sistem Tim</td>
                <td className="font-mono text-xs text-emerald-700 font-semibold">Tersedia & Terintegrasi (Prefix generator)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
