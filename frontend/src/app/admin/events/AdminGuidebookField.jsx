"use client";

import { BookOpen, FileText, Link2 } from "lucide-react";

export function AdminGuidebookField({ type, value, file, onTypeChange, onValueChange, onFileChange }) {
  return <div className="admin-event-guidebook md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-3 flex items-center gap-2 text-slate-800">
      <BookOpen size={18} className="text-blue-600" aria-hidden="true" />
      <span className="font-semibold">Guidebook event</span>
      <span className="text-slate-500">(opsional)</span>
    </div>
    <label className="mb-1 block font-medium text-slate-700" htmlFor="event-guidebook-type">Sumber guidebook</label>
    <select id="event-guidebook-type" value={type || "none"} onChange={(event) => onTypeChange(event.target.value)} className="mb-3 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900">
      <option value="none">Tidak ada guidebook</option>
      <option value="file">Unggah PDF</option>
      <option value="link">Tautan HTTPS</option>
    </select>
    {type === "file" && <div className="rounded-lg border border-slate-300 bg-white p-3">
      <label className="mb-2 flex items-center gap-2 font-medium text-slate-700" htmlFor="event-guidebook-file"><FileText size={18} aria-hidden="true" /> Berkas PDF</label>
      <input id="event-guidebook-file" type="file" accept=".pdf,application/pdf" onChange={onFileChange} required={!value} className="block min-h-11 w-full text-slate-800" />
      <p className="mt-2 text-slate-600">PDF maksimal 8 MB. {file ? `Dipilih: ${file.name}` : value ? "Berkas tersimpan. Pilih file baru untuk mengganti." : "Pilih berkas untuk diunggah."}</p>
    </div>}
    {type === "link" && <div>
      <label className="mb-1 flex items-center gap-2 font-medium text-slate-700" htmlFor="event-guidebook-url"><Link2 size={18} aria-hidden="true" /> Tautan guidebook</label>
      <input id="event-guidebook-url" type="url" inputMode="url" required value={value || ""} onChange={(event) => onValueChange(event.target.value)} placeholder="https://contoh.com/guidebook.pdf" className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900" />
      <p className="mt-1 text-slate-600">Gunakan tautan HTTPS yang dapat dibuka peserta.</p>
    </div>}
  </div>;
}
