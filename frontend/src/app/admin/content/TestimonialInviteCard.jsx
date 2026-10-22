"use client";

import { useEffect, useState } from "react";
import { Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useConfirmDialog } from "@/app/admin/useConfirmDialog";

const inviteUrl = (token) => `${window.location.origin}/testimoni/undangan?k=${token}`;
const formatDate = (value) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : null;

// Admins share one link; only accounts that open it get the dashboard testimonial form.
export function TestimonialInviteCard() {
  const [invite, setInvite] = useState(undefined);
  const [quota, setQuota] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDialog, confirm] = useConfirmDialog();

  useEffect(() => {
    api.get("/admin/home-content/testimonial-invite").then(({ data }) => setInvite(data?.data ?? null)).catch(() => setInvite(null));
  }, []);

  async function createLink() {
    if (invite && !(await confirm({ title: "Buat link baru?", message: "Link yang sekarang langsung tidak berlaku. User yang sudah membuka link lama dan belum mengirim akan kehilangan akses form.", confirmLabel: "Ya, buat link baru" }))) return;
    setBusy(true);
    try {
      const { data } = await api.post("/admin/home-content/testimonial-invite", {
        quota: quota ? Number(quota) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      setInvite(data.data);
      toast.success("Link testimoni dibuat. Salin dan bagikan.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Link belum bisa dibuat.");
    } finally { setBusy(false); }
  }

  async function revoke() {
    if (!(await confirm({ title: "Nonaktifkan link?", message: "Link langsung tidak berlaku dan form testimoni hilang dari dashboard user yang belum mengirim.", confirmLabel: "Ya, nonaktifkan", tone: "danger" }))) return;
    setBusy(true);
    try {
      await api.delete("/admin/home-content/testimonial-invite");
      setInvite(null);
      toast.success("Link testimoni dinonaktifkan.");
    } catch (error) {
      toast.error(error.message || "Link belum bisa dinonaktifkan.");
    } finally { setBusy(false); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(inviteUrl(invite.token)); toast.success("Link disalin."); }
    catch { toast.error("Salin manual link di kolom."); }
  }

  const full = invite?.quota != null && invite.joined >= invite.quota;
  const status = !invite ? "TIDAK ADA LINK" : invite.expired ? "KEDALUWARSA" : full ? "KUOTA PENUH" : "AKTIF";

  return (
    <div className="admin-card">
      {confirmDialog}
      <div className="admin-card-header">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900">Link Testimoni untuk User</h2>
        </div>
        {invite !== undefined && <span className={`admin-badge ${status === "AKTIF" ? "admin-badge--published" : "admin-badge--draft"}`}>{status}</span>}
      </div>
      <div className="admin-card-body flex flex-col gap-4">
        <p className="text-xs text-slate-500">Bagikan link ini. Hanya akun yang membukanya yang mendapat form testimoni di dashboard, satu kali kirim per akun. Kiriman masuk sebagai &quot;Menunggu Persetujuan&quot;.</p>

        {invite && (
          <>
            <div className="flex flex-wrap gap-2">
              <input readOnly value={inviteUrl(invite.token)} onFocus={(event) => event.target.select()} aria-label="Link testimoni"
                className="min-h-[40px] min-w-0 flex-1 border border-slate-300 bg-slate-50 px-3 font-mono text-xs text-slate-700" />
              <button type="button" className="admin-btn admin-btn--primary" onClick={copy}><Copy className="h-4 w-4" aria-hidden="true" /> Salin link</button>
            </div>
            <dl className="m-0 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4 [&_dd]:m-0">
              <div><dt className="text-slate-500">Dibuka oleh</dt><dd className="text-base font-bold text-slate-900">{invite.joined}{invite.quota != null && <span className="text-xs font-medium text-slate-500"> / {invite.quota}</span>}</dd></div>
              <div><dt className="text-slate-500">Sudah mengirim</dt><dd className="text-base font-bold text-slate-900">{invite.submitted}</dd></div>
              <div><dt className="text-slate-500">Kuota</dt><dd className="font-semibold text-slate-800">{invite.quota ?? "Tanpa batas"}</dd></div>
              <div><dt className="text-slate-500">Berlaku sampai</dt><dd className="font-semibold text-slate-800">{formatDate(invite.expires_at) ?? "Tanpa batas"}</dd></div>
            </dl>
          </>
        )}

        <div className="flex flex-wrap items-end gap-3 border-t border-slate-200 pt-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
            Kuota (opsional)
            <input type="number" min={1} max={1000} value={quota} onChange={(event) => setQuota(event.target.value)} placeholder="Tanpa batas"
              className="min-h-[40px] w-36 border border-slate-300 bg-white px-3 text-sm font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
            Berlaku sampai (opsional)
            <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)}
              className="min-h-[40px] border border-slate-300 bg-white px-3 text-sm font-normal" />
          </label>
          <button type="button" className="admin-btn admin-btn--primary" disabled={busy || invite === undefined} onClick={createLink}>{invite ? "Buat link baru" : "Buat link"}</button>
          {invite && <button type="button" className="admin-btn admin-btn--danger" disabled={busy} onClick={revoke}>Nonaktifkan</button>}
        </div>
      </div>
    </div>
  );
}
