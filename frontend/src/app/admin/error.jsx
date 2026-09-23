"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({ reset }) {
  return <main className="mx-auto my-10 max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm" role="alert">
    <AlertTriangle className="mb-4 h-8 w-8 text-red-600" aria-hidden="true" />
    <h1 className="text-xl font-semibold text-slate-900">Halaman admin belum dapat ditampilkan</h1>
    <p className="mt-2 text-slate-600">Data Anda tidak berubah. Coba muat ulang halaman. Jika masalah berlanjut, hubungi pengelola sistem.</p>
    <button type="button" onClick={reset} className="admin-btn admin-btn--primary mt-5 inline-flex min-h-11 items-center gap-2">
      <RefreshCw className="h-4 w-4" aria-hidden="true" /> Coba lagi
    </button>
  </main>;
}
