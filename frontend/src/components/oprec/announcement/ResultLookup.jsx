"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button, Input, Modal } from "./Primitives";
import { normalizeOprecNim, validBirthDate } from "@/lib/oprec";

export function ResultLookup({ periodId, open, onOpenChange, triggerRef }) {
  const router = useRouter();
  const [nim, setNim] = useState("");
  const [birth, setBirth] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    if (!/^E31[A-Z0-9.\-]{0,29}$/.test(nim) || !validBirthDate(birth)) { setError("Periksa kembali NIM dan tanggal lahir sesuai pendaftaran."); return; }
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/oprec/result", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oprec_id: String(periodId), nim, tanggal_lahir: birth }), signal: AbortSignal.timeout(20000), cache: "no-store" });
      const body = await response.json();
      if (!response.ok) { setError(body.message || "Hasil belum dapat diperiksa. Silakan coba lagi."); return; }
      router.push(`/oprec/pengumuman/${encodeURIComponent(String(periodId))}`);
      onOpenChange(false); setNim(""); setBirth("");
    } catch { setError("Koneksi terputus. Data belum terkirim; silakan coba kembali."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <Modal open={open} onOpenChange={(next) => { setError(""); onOpenChange(next); }} busy={busy} triggerRef={triggerRef}
    title="Lihat hasil seleksimu" description="Masukkan NIM dan tanggal lahir yang kamu isi saat mendaftar OPREC.">
    <form onSubmit={submit} autoComplete="off" aria-busy={busy}>
      <div className="oa-dialog-body oa-form">
        <label className="oa-field" htmlFor="announcement-nim">NIM<Input id="announcement-nim" value={nim} onChange={(e) => setNim(normalizeOprecNim(e.target.value))} autoCapitalize="characters" spellCheck={false} maxLength={32} required disabled={busy} placeholder="NIM saat pendaftaran" /></label>
        <label className="oa-field" htmlFor="announcement-birth">Tanggal lahir<Input id="announcement-birth" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} min="1900-01-01" required disabled={busy} /></label>
        {error && <p className="oa-error" role="alert">{error}</p>}
      </div>
      <footer className="oa-dialog-footer"><Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Batal</Button><Button variant="red" type="submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="oa-spin" /> : null}{busy ? "Memeriksa…" : "Lihat hasil"}{!busy && <ArrowRight size={16} />}</Button></footer>
    </form>
  </Modal>;
}
