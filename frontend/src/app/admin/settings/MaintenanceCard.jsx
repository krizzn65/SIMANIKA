"use client";

import { useEffect, useState } from "react";
import { Construction } from "lucide-react";
import { api } from "@/services/api";

export function MaintenanceCard() {
  const [state, setState] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    api.get("/admin/maintenance")
      .then(({ data }) => { setState(data.data); setMessage(data.data.message || ""); })
      .catch((error) => setFeedback({ tone: "error", text: error.message }));
  }, []);

  const save = async (maintenance) => {
    if (maintenance && !window.confirm("Aktifkan mode maintenance? Pengunjung dan peserta akan melihat halaman 503 sampai mode ini dimatikan.")) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { data } = await api.put("/admin/maintenance", { maintenance, message: message.trim() || null });
      setState(data.data);
      setFeedback({ tone: "success", text: maintenance ? "Mode maintenance aktif." : "Mode maintenance dimatikan. Website kembali normal." });
    } catch (error) {
      setFeedback({ tone: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const active = Boolean(state?.maintenance);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="flex items-center gap-2">
          <Construction className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900">Mode Maintenance</h2>
        </div>
        {state && <span className={`admin-badge ${active ? "admin-badge--draft" : "admin-badge--published"}`}>{active ? "AKTIF" : "NONAKTIF"}</span>}
      </div>
      <div className="admin-card-body flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          Saat aktif, pengunjung dan peserta melihat halaman <strong>503 · Sedang Perbaikan</strong>. Admin, Super Admin, dan staf lain tetap bisa masuk dan memakai dashboard.
        </p>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
          Pesan untuk pengunjung (opsional)
          <input
            type="text"
            maxLength={300}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Kami sedang merapikan beberapa hal. SIMANIKA akan kembali sebentar lagi."
            className="w-full min-h-[44px] border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {active ? (
            <button type="button" className="admin-btn admin-btn--primary" disabled={saving || !state} onClick={() => save(false)}>{saving ? "Menyimpan..." : "Matikan maintenance"}</button>
          ) : (
            <button type="button" className="admin-btn admin-btn--danger" disabled={saving || !state} onClick={() => save(true)}>{saving ? "Menyimpan..." : "Aktifkan maintenance"}</button>
          )}
          {active && <button type="button" className="admin-btn admin-btn--secondary" disabled={saving} onClick={() => save(true)}>Perbarui pesan</button>}
        </div>
        {feedback && <p role="status" className={`text-sm ${feedback.tone === "error" ? "text-red-700" : "text-emerald-700"}`}>{feedback.text}</p>}
      </div>
    </div>
  );
}
