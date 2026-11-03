"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Copy, UserX } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

const formatDate = (value) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";

// Accounts that pressed "Daftar" but never sent the form. They are not in the
// registrant list, which is why a search for them finds nothing.
export function PendingEnrollments({ oprecId }) {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!oprecId) return;
    setRows(null);
    api.get(`/admin/oprec/${oprecId}/registrants/pending`).then(({ data }) => setRows(data?.data || [])).catch(() => setRows([]));
  }, [oprecId]);

  if (!rows?.length) return null;

  async function copyEmails() {
    try { await navigator.clipboard.writeText(rows.map((row) => row.email).join(", ")); toast.success("Email disalin."); }
    catch { toast.error("Email belum bisa disalin."); }
  }

  return (
    <div className="mb-4 border border-amber-300 bg-amber-50">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 border-0 bg-transparent px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <UserX className="h-4 w-4" aria-hidden="true" />
          {rows.length} akun sudah menekan &quot;Daftar&quot; tapi belum mengirim formulir
        </span>
        <ChevronDown className={`h-4 w-4 text-amber-800 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-amber-200 bg-white px-4 py-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-xs text-slate-600">Mereka belum tercatat sebagai pendaftar, jadi tidak muncul di pencarian di bawah. Hubungi untuk melengkapi formulir.</p>
            <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={copyEmails}><Copy className="h-3.5 w-3.5" aria-hidden="true" /> Salin semua email</button>
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="text-slate-500"><th className="py-1.5 pr-3 font-semibold">Nama akun</th><th className="py-1.5 pr-3 font-semibold">Email</th><th className="py-1.5 font-semibold">Menekan Daftar</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.email} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-800">{row.name || "-"}</td>
                    <td className="py-1.5 pr-3 font-mono text-slate-700">{row.email}</td>
                    <td className="py-1.5 text-slate-500">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
