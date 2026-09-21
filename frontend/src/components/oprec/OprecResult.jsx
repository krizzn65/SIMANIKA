"use client";
import { useRef, useState } from "react";
import { validBirthDate } from "@/lib/oprec";

const resultCopy = {
  accepted: ["DITERIMA", "Selamat, kamu diterima!", "Perjalanan barumu bersama HIMANIKA dimulai di sini."],
  rejected: ["BELUM DITERIMA", "Terima kasih sudah berpartisipasi.", "Kamu belum diterima pada periode ini. Tetap semangat berkarya dan mengembangkan dirimu."],
  pending: ["DALAM PROSES", "Hasilmu masih diproses.", "Keputusan seleksi belum tersedia. Silakan cek kembali nanti."],
  not_found: ["DATA BELUM DITEMUKAN", "Periksa kembali datamu.", "Kombinasi NIM dan tanggal lahir belum ditemukan pada periode ini. Pastikan sesuai dengan data pendaftaran."],
};

export function OprecResult({ oprecId }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const resultRef = useRef(null);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nim = String(data.get("nim") || "").trim();
    const tanggal_lahir = String(data.get("tanggal_lahir") || "");
    setError(""); setResult(null);
    if (!/^[a-zA-Z0-9.-]{3,32}$/.test(nim) || !validBirthDate(tanggal_lahir)) { setError("Masukkan NIM dan tanggal lahir yang valid."); return; }
    submitting.current = true; setPending(true);
    try {
      const response = await fetch("/api/oprec/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oprec_id: oprecId, nim, tanggal_lahir }), cache: "no-store", signal: AbortSignal.timeout(25000) });
      const body = await response.json();
      if (!response.ok) { setError(body.message || "Hasil belum dapat diperiksa."); return; }
      if (!Object.hasOwn(resultCopy, body.data?.status)) throw new Error("Invalid result");
      setResult(body.data); form.reset();
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch { setError("Layanan belum dapat dihubungi. Silakan coba lagi sebentar."); }
    finally { submitting.current = false; setPending(false); }
  }
  return <div className="oprec-result">
    <form onSubmit={submit} aria-busy={pending} autoComplete="off">
      <fieldset disabled={pending}><legend className="oprec-sr-only">Cek hasil seleksi</legend>
        <label htmlFor="result-nim">NIM<input id="result-nim" name="nim" type="text" required minLength={3} maxLength={32} placeholder="NIM saat pendaftaran" autoCapitalize="none" spellCheck={false} /></label>
        <label htmlFor="result-birth">Tanggal lahir<input id="result-birth" name="tanggal_lahir" type="date" min="1900-01-01" required /></label>
      </fieldset>
      {error && <p className="oprec-feedback oprec-feedback--error" role="alert">{error}</p>}
      <button className="oprec-button" type="submit" disabled={pending}>{pending ? "Memeriksa hasil…" : "Lihat hasil seleksi"}<span aria-hidden="true">↗</span></button>
    </form>
    {result && <div ref={resultRef} tabIndex={-1} className={`oprec-feedback oprec-feedback--${result.status === "accepted" ? "success" : "neutral"}`} role="status"><span className="oprec-mono">{resultCopy[result.status][0]}</span><h3>{resultCopy[result.status][1]}</h3><p>{resultCopy[result.status][2]}</p>{result.divisi && <p><strong>Divisi: {result.divisi}</strong></p>}{result.pesan && <p className="oprec-preserve-lines">{result.pesan}</p>}</div>}
  </div>;
}
