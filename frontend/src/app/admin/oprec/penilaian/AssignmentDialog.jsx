"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function AssignmentDialog({ assignments, error, onClose, onToggle }) {
  const ref = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    trigger.current = document.activeElement;
    ref.current?.showModal();
    return () => { ref.current?.close(); trigger.current?.focus?.(); };
  }, []);
  return <dialog ref={ref} onClose={onClose} aria-label="Penugasan penilai"
    className="m-auto w-[min(94vw,560px)] max-h-[85vh] overflow-y-auto border border-slate-300 bg-white p-0 shadow-2xl backdrop:bg-slate-950/60">
    <div className="flex justify-between border-b p-4"><h2 className="text-lg font-semibold">Penilai periode</h2>
      <button type="button" onClick={onClose} aria-label="Tutup penugasan" className="min-h-10 min-w-10"><X size={20} /></button></div>
    <div className="p-4">{error && <p role="alert" className="mb-3 text-red-700">{error}</p>}
      {assignments.reviewers.map((person) => {
        const assigned = assignments.assigned_ids.includes(person.id);
        return <div key={person.id} className="flex items-center justify-between gap-3 border-b py-3">
          <div><strong className="block text-sm">{person.name}</strong><span className="text-xs text-slate-600">{person.email}</span></div>
          <button type="button" onClick={() => onToggle(person.id, assigned)}
            className={`min-h-10 border px-3 text-sm ${assigned ? "border-red-300 text-red-700" : "border-blue-300 text-blue-700"}`}>
            {assigned ? "Cabut" : "Tugaskan"}
          </button>
        </div>;
      })}
      {assignments.reviewers.length === 0 && <p>Belum ada akun Pengurus.</p>}
    </div>
  </dialog>;
}
