"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

// Themed replacement for window.confirm in the admin area:
//   const [confirmDialog, confirm] = useConfirmDialog();
//   if (!(await confirm({ title, message, confirmLabel, tone: "danger" }))) return;
//   ...and render {confirmDialog} once in the component.
export function useConfirmDialog() {
  const [request, setRequest] = useState(null);
  const confirmRef = useRef(null);

  const confirm = useCallback((options) => new Promise((resolve) => setRequest({ ...options, resolve })), []);
  const close = useCallback((answer) => {
    setRequest((current) => { current?.resolve(answer); return null; });
  }, []);

  useEffect(() => {
    if (!request) return;
    confirmRef.current?.focus();
    const onKey = (event) => { if (event.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request, close]);

  const danger = request?.tone === "danger";
  const dialog = request && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4" role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) close(false); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-message"
        className={`w-full max-w-md border border-slate-200 border-t-4 bg-white p-6 shadow-[6px_6px_0_rgba(16,27,45,0.12)] ${danger ? "border-t-[#c42b3a]" : "border-t-[#155eef]"}`}>
        <div className="mb-4 flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center border ${danger ? "border-red-200 bg-red-50 text-[#c42b3a]" : "border-blue-200 bg-blue-50 text-[#155eef]"}`} aria-hidden="true">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <span className="font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0f48c2]">Konfirmasi</span>
        </div>
        <h2 id="admin-confirm-title" className="mb-2 text-lg font-bold text-slate-900">{request.title}</h2>
        <p id="admin-confirm-message" className="mb-6 text-sm leading-relaxed text-slate-600">{request.message}</p>
        <div className="flex flex-wrap justify-end gap-2.5">
          <button type="button" className="admin-btn admin-btn--secondary" onClick={() => close(false)}>Batal</button>
          <button ref={confirmRef} type="button" className={`admin-btn ${danger ? "admin-btn--danger" : "admin-btn--primary"}`} onClick={() => close(true)}>
            {request.confirmLabel || "Ya, lanjutkan"}
          </button>
        </div>
      </section>
    </div>
  );

  return [dialog, confirm];
}
