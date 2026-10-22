"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FileUploadInput } from "@/components/ui/FileUploadInput";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import "../../events/events.css";
import "../dashboard.css";
import "./testimoni-form.css";

const QUOTE_MAX = 600;
const LABELS = { nama: "Nama", angkatan: "Angkatan / jabatan", quote: "Testimoni", photo: "Foto profil" };

function TestimonialForm() {
  const { user } = useAuth();
  const errorRef = useRef(null);
  const [state, setState] = useState(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    api.get("/user/testimonial").then(({ data }) => setState(data?.data ?? { open: false })).catch(() => setState({ open: false, error: true }));
  }, []);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function pickPhoto(event) {
    const file = event.currentTarget.files?.[0];
    setErrors(({ photo, ...rest }) => rest);
    setPreview(file && /^image\//.test(file.type) ? URL.createObjectURL(file) : null);
  }

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const body = new FormData(form);
    const photo = body.get("photo");
    if (photo instanceof File && photo.size > 5 * 1024 * 1024) {
      setErrors({ photo: ["Foto maksimal 5 MB."] }); setMessage("Periksa foto yang dipilih.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setPending(true); setMessage(""); setErrors({});
    try {
      await api.post("/user/testimonial", body, { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 });
      setDone(true);
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
      setMessage(error.message || "Testimoni belum berhasil dikirim.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { setPending(false); }
  }

  if (!state) return <div className="dashboard-state" role="status"><span className="dashboard-state__loading" aria-hidden="true" /><p>Memuat formulir...</p></div>;
  if (done || state.submitted) return <div className="event-form-feedback" role="status"><h3>Testimoni terkirim.</h3><p>Terima kasih sudah berbagi cerita tentang HIMANIKA.</p><Link href="/dashboard/">Kembali ke dashboard</Link></div>;
  if (!state.open) return <div className="event-form-feedback" role="status"><h3>Pengisian testimoni sedang ditutup.</h3><p>{state.error ? "Formulir belum bisa dimuat. Coba lagi nanti." : "Formulir akan muncul di dashboard saat dibuka kembali oleh pengurus."}</p><Link href="/dashboard/">Kembali ke dashboard</Link></div>;

  return (
    <form className="event-dynamic-form testimonial-form" onSubmit={submit} aria-busy={pending}>
      <span className="event-mono">FORMULIR TESTIMONI</span>
      <h2>Ceritakan pengalamanmu</h2>
      <p>Kolom bertanda * wajib diisi. Testimoni dapat ditampilkan di website SIMANIKA.</p>
      {message && <div ref={errorRef} tabIndex={-1} role="alert" className="event-form-feedback">{message}{Object.keys(errors).length > 0 && <ul>{Object.entries(errors).map(([name, value]) => <li key={name}>{LABELS[name] || "Testimoni"}: {Array.isArray(value) ? value[0] : value}</li>)}</ul>}</div>}
      <fieldset disabled={pending}>
        <legend className="event-form-sr-only">Isi testimoni</legend>
        <div className="event-dynamic-field">
          <label htmlFor="testimoni-nama">Nama<b aria-label="wajib"> *</b></label>
          <small>Nama yang tampil bersama testimonimu.</small>
          <input id="testimoni-nama" name="nama" required maxLength={120} defaultValue={user?.name || user?.nama || ""} autoComplete="name" />
        </div>
        <div className="event-dynamic-field">
          <label htmlFor="testimoni-angkatan">Angkatan / jabatan<b aria-label="wajib"> *</b></label>
          <small>Contoh: Anggota 2025, Ketua Divisi Ristek 2024.</small>
          <input id="testimoni-angkatan" name="angkatan" required maxLength={120} />
        </div>
        <div className="event-dynamic-field">
          <label htmlFor="testimoni-quote">Testimoni<b aria-label="wajib"> *</b></label>
          <small>Kesan atau pengalamanmu bersama HIMANIKA, 20–{QUOTE_MAX} karakter.</small>
          <textarea id="testimoni-quote" name="quote" rows={5} required minLength={20} maxLength={QUOTE_MAX} value={quote} onChange={(event) => setQuote(event.target.value)} />
          <small className="testimonial-form__count" aria-live="polite">{quote.length}/{QUOTE_MAX}</small>
        </div>
        <div className="event-dynamic-field">
          <label htmlFor="testimoni-photo">Foto profil<b aria-label="wajib"> *</b></label>
          <small>Foto wajah yang jelas. JPG, PNG, atau WebP · maksimal 5 MB.</small>
          <div className="testimonial-form__photo">
            <span className="testimonial-form__preview" aria-hidden="true">{preview ? <img src={preview} alt="" /> : <span>Foto</span>}</span>
            <FileUploadInput id="testimoni-photo" name="photo" required accept=".jpg,.jpeg,.png,.webp" invalid={Boolean(errors.photo)} onChange={pickPhoto} emptyText="Belum ada foto dipilih" />
          </div>
        </div>
      </fieldset>
      <div className="event-group-submit">
        <button className="event-button" type="submit" disabled={pending}>{pending ? "Mengirim…" : "Kirim testimoni"}</button>
      </div>
    </form>
  );
}

export default function DashboardTestimonialPage() {
  return (
    <div className="site-root dashboard-root">
      <Navbar />
      <ProtectedRoute>
        <main className="dashboard-page" id="dashboard-content">
          <div className="dashboard-container testimonial-page">
            <Link href="/dashboard/" className="testimonial-page__back">← Dashboard</Link>
            <TestimonialForm />
          </div>
        </main>
      </ProtectedRoute>
    </div>
  );
}
