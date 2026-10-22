"use client";

import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/services/api";
import { FileUploadInput } from "@/components/ui/FileUploadInput";

export function EventGroupForm({ eventId, group, onSuccess }) {
  const errorRef = useRef(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  async function submit(submission) {
    submission.preventDefault();
    if (pending) return;
    const form = submission.currentTarget;
    if (!form.reportValidity()) return;
    const body = new FormData(form);
    for (const [key, value] of body.entries()) if (value instanceof File && !value.size) body.delete(key);
    const files = [...body.values()].filter((value) => value instanceof File);
    const invalid = files.find((file) => file.size > 5 * 1024 * 1024 || !/\.(pdf|jpe?g|png|webp)$/i.test(file.name));
    if (invalid || files.reduce((sum, file) => sum + file.size, 0) > 11 * 1024 * 1024) {
      setMessage("Gunakan PDF/JPG/PNG/WebP, maksimal 5 MB per berkas dan 11 MB total.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setPending(true); setMessage(""); setErrors({});
    try {
      const response = await api.post(`/user/events/${eventId}/groups/${group.id}/submit`, body, { timeout: 30000 });
      if (response.data?.data?.submitted !== true) throw new Error("Respons pengiriman tidak valid.");
      onSuccess?.();
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
      setMessage(error.response?.status === 401 ? "Masuk kembali untuk melanjutkan." : error.message || "Grup belum berhasil dikirim.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { setPending(false); }
  }

  return <form className="event-dynamic-form" onSubmit={submit} aria-busy={pending}>
    {message && <div className="event-form-feedback" tabIndex={-1} ref={errorRef} role="alert">{message}</div>}
    <fieldset disabled={pending}>
      <legend className="event-form-sr-only">Jawaban {group.title}</legend>
      {group.fields.map((field) => {
        const id = `group-${group.id}-${field.name}`;
        const required = field.required && !(field.type === "file" && field.downloadUrl);
        return <div className="event-dynamic-field" key={field.name}>
          {field.type !== "checkbox" && <label htmlFor={id}>{field.label}{field.required && <b aria-label="wajib"> *</b>}</label>}
          {field.help && <small>{field.help}</small>}
          {field.type === "textarea" ? <textarea id={id} name={field.name} rows={4} required={required} defaultValue={field.value || ""} placeholder={field.placeholder || ""} /> :
            field.type === "select" ? <select id={id} name={field.name} required={required} defaultValue={field.value || ""}><option value="">Pilih jawaban</option>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> :
            field.type === "radio" ? <div className="event-dynamic-choices">{field.options.map((option, index) => <label key={option.value}><input type="radio" id={index === 0 ? id : undefined} name={field.name} value={option.value} defaultChecked={field.value === option.value} required={required} /> {option.label}</label>)}</div> :
            field.type === "checkbox" ? <label className="event-dynamic-check"><input id={id} name={field.name} type="checkbox" value="on" defaultChecked={Boolean(field.value)} required={required} /> {field.label}{field.required && <b aria-label="wajib"> *</b>}</label> :
            field.type === "file" ? <><FileUploadInput id={id} name={field.name} required={required} accept=".pdf,.jpg,.jpeg,.png,.webp" invalid={Boolean(errors[field.name])} emptyText={field.downloadUrl ? "Belum memilih berkas baru" : undefined} onChange={() => setErrors((current) => { if (!current[field.name]) return current; const next = { ...current }; delete next[field.name]; return next; })} /><small>PDF, JPG, PNG, WebP · maksimal 5 MB</small>{field.downloadUrl && <a href={field.downloadUrl} target="_blank" rel="noopener noreferrer">Lihat berkas tersimpan <ArrowUpRight size={14} aria-hidden="true" /></a>}</> :
            <input id={id} name={field.name} type={field.type} required={required} defaultValue={field.value || ""} placeholder={field.placeholder || ""} />}
          {errors[field.name] && <small className="event-dynamic-error">{Array.isArray(errors[field.name]) ? errors[field.name][0] : errors[field.name]}</small>}
        </div>;
      })}
    </fieldset>
    <div className="event-group-submit"><button className="event-button" type="submit" disabled={pending}>{pending ? "Mengirim…" : group.submitted ? "Simpan perubahan" : "Kirim"}</button></div>
  </form>;
}
