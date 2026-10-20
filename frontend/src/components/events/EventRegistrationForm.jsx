"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { FileUploadInput } from "@/components/ui/FileUploadInput";

export function EventRegistrationForm({ event, onSuccess, compact = false }) {
  const errorRef = useRef(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  async function submit(submission) {
    submission.preventDefault();
    if (pending) return;
    const form = submission.currentTarget;
    if (!form.reportValidity()) return;
    const body = new FormData(form);
    for (const [key, value] of body.entries()) if (value instanceof File && value.size === 0) body.delete(key);
    let total = 0;
    const fileErrors = {};
    for (const [name, value] of body.entries()) {
      if (!(value instanceof File)) continue;
      if (value.size > 5 * 1024 * 1024) fileErrors[name] = ["Berkas maksimal 5 MB."];
      else if (!/\.(pdf|jpe?g|png|webp)$/i.test(value.name)) fileErrors[name] = ["Gunakan PDF, JPG, PNG, atau WebP."];
    }
    if (Object.keys(fileErrors).length) { setErrors(fileErrors); setMessage("Periksa berkas yang dipilih."); requestAnimationFrame(() => errorRef.current?.focus()); return; }
    for (const value of body.values()) if (value instanceof File) total += value.size;
    if (total > 11 * 1024 * 1024) { setMessage("Total berkas maksimal 11 MB."); return; }
    setPending(true); setMessage(""); setErrors({});
    try {
      const response = await api.post("/user/events/" + event.id + "/register", body, { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 });
      if (response.data?.data?.submitted !== true) throw new Error("Respons pendaftaran tidak valid.");
      setSuccess(true); form.reset(); onSuccess?.();
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
      setMessage(error.response?.status === 401 ? "Masuk ke akun terlebih dahulu untuk mendaftar." : error.message || "Pendaftaran belum berhasil.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { setPending(false); }
  }

  if (success) return <div className="event-form-feedback" role="status"><h3>Pendaftaran terkirim.</h3><p>{event.tipePendaftaran === "tim" ? "Formulir tim sudah tersimpan." : "Data pendaftaranmu sudah tersimpan."}</p><Link href="/dashboard">Lihat dashboard</Link></div>;
  return <form id={"form-pendaftaran-" + event.id} className="event-dynamic-form" onSubmit={submit} aria-busy={pending}>
    {!compact && <><span className="event-mono">FORMULIR PENDAFTARAN</span><h2>Daftar {event.judul}</h2></>}
    <p>Kolom bertanda * wajib diisi. Isilah sesuai petunjuk penyelenggara.</p>
    {message && <div ref={errorRef} tabIndex={-1} role="alert" className="event-form-feedback">{message}{Object.keys(errors).length > 0 && <ul>{Object.entries(errors).map(([name, value]) => <li key={name}>{event.formFields.find((field) => field.name === name)?.label || "Pendaftaran"}: {Array.isArray(value) ? value[0] : value}</li>)}</ul>}</div>}
    <fieldset disabled={pending}>
      <legend className="event-form-sr-only">Jawaban pendaftaran</legend>
      {event.formFields.map((field) => {
        const id = "event-" + event.id + "-field-" + field.name;
        return <div className="event-dynamic-field" key={field.name}>
          {field.type !== "checkbox" && <label htmlFor={id}>{field.label}{field.required && <b aria-label="wajib"> *</b>}</label>}
          {field.help && <small>{field.help}</small>}
          {field.type === "textarea" ? <textarea id={id} name={field.name} rows={4} required={field.required} placeholder={field.placeholder || ""} /> :
            field.type === "select" ? <select id={id} name={field.name} required={field.required} defaultValue=""><option value="">Pilih jawaban</option>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> :
            field.type === "radio" ? <div className="event-dynamic-choices">{field.options.map((option, index) => <label key={option.value}><input type="radio" id={index === 0 ? id : undefined} name={field.name} value={option.value} required={field.required} /> {option.label}</label>)}</div> :
            field.type === "checkbox" ? <label className="event-dynamic-check"><input id={id} name={field.name} type="checkbox" value="on" required={field.required} /> {field.label}{field.required && <b aria-label="wajib"> *</b>}</label> :
            field.type === "file" ? <><FileUploadInput id={id} name={field.name} required={field.required} accept=".pdf,.jpg,.jpeg,.png,.webp" invalid={Boolean(errors[field.name])} onChange={() => setErrors((current) => { if (!current[field.name]) return current; const next = { ...current }; delete next[field.name]; return next; })} /><small>PDF, JPG, PNG, WebP · maksimal 5 MB</small></> :
            <input id={id} name={field.name} type={field.type} required={field.required} placeholder={field.placeholder || ""} />}
          {errors[field.name] && <small className="event-dynamic-error">{Array.isArray(errors[field.name]) ? errors[field.name][0] : errors[field.name]}</small>}
        </div>;
      })}
    </fieldset>
    <div className="event-group-submit">
      <button className="event-button" type="submit" disabled={pending}>{pending ? "Mengirim…" : "Kirim"}</button>
    </div>
  </form>;
}
