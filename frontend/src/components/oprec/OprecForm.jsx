"use client";
import { useRef, useState } from "react";
import { validateOprecForm } from "@/lib/oprec";

function Field({ field, error }) {
  const id = `oprec-field-${field.name}`;
  const description = [field.help && `${id}-help`, field.type === "file" && `${id}-file`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const common = { id, name: field.name, required: field.required, "aria-invalid": Boolean(error), "aria-describedby": description };
  const label = <>{field.label}{field.required && <span aria-hidden="true"> *</span>}</>;
  let control;
  if (field.type === "textarea") control = <textarea {...common} rows={4} maxLength={field.maxLength} placeholder={field.placeholder} />;
  else if (field.type === "select") control = <select {...common} defaultValue=""><option value="" disabled={field.required}>Pilih {field.label.toLowerCase()}</option>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  else if (field.type === "radio") control = <div className="oprec-choice-list">{field.options.map((option, index) => <label key={option.value} className="oprec-choice"><input {...common} id={`${id}-${index}`} type="radio" value={option.value} /><span>{option.label}</span></label>)}</div>;
  else if (field.type === "checkbox") control = <label className="oprec-choice"><input {...common} type="checkbox" /><span>{label}</span></label>;
  else if (field.type === "file") control = <><input {...common} type="file" accept={field.accept.join(",")} /><small id={`${id}-file`}>{field.accept.join(", ")} · maksimal {field.maxSizeMB} MB</small></>;
  else control = <input {...common} type={field.type} maxLength={field.maxLength} placeholder={field.placeholder} min={field.type === "number" ? field.min ?? undefined : field.name === "tanggal_lahir" ? "1900-01-01" : undefined} max={field.type === "number" ? field.max ?? undefined : undefined} step={field.type === "number" ? "any" : undefined} autoComplete={field.name === "tanggal_lahir" ? "bday" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : undefined} />;
  return <fieldset className={`oprec-field ${["textarea", "radio", "checkbox", "file"].includes(field.type) ? "oprec-field--wide" : ""}`}>
    {field.type === "radio" ? <legend>{label}</legend> : field.type !== "checkbox" && <label htmlFor={id}>{label}</label>}
    {field.help && <small id={`${id}-help`}>{field.help}</small>}{control}
    {error && <p className="oprec-field-error" id={`${id}-error`}>{error}</p>}
  </fieldset>;
}

export function OprecForm({ oprec }) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const feedback = useRef(null);
  const submitting = useRef(false);
  function showErrors(nextErrors, note) {
    setErrors(nextErrors); setMessage(note);
    requestAnimationFrame(() => feedback.current?.focus());
  }
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const body = new FormData(form);
    const nextErrors = validateOprecForm(oprec.formFields, body);
    if (Object.keys(nextErrors).length) { showErrors(nextErrors, "Periksa kolom yang ditandai sebelum mengirim."); return; }
    let total = 0;
    for (const value of body.values()) if (typeof value !== "string") total += value.size;
    if (total > 11 * 1024 * 1024) { showErrors({}, "Total berkas maksimal 11 MB. Perkecil ukuran berkasmu."); return; }
    body.set("oprec_id", oprec.id); body.set("schema_version", oprec.schemaVersion);
    submitting.current = true; setPending(true); setErrors({}); setMessage("");
    try {
      const response = await fetch("/api/oprec/register", { method: "POST", body, signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok) { showErrors(result.errors || {}, result.message || "Pendaftaran belum berhasil. Coba lagi."); return; }
      if (result.data?.submitted !== true) throw new Error("Invalid response");
      form.reset(); setSuccess(true);
    } catch { showErrors({}, "Koneksi terputus atau layanan belum tersedia. Pastikan status pendaftaran sebelum mencoba kembali."); }
    finally { submitting.current = false; setPending(false); }
  }
  if (success) return <div className="oprec-feedback oprec-feedback--success" role="status"><span aria-hidden="true">✓</span><h3>Pendaftaranmu sudah masuk.</h3><p>Terima kasih sudah mendaftar. Gunakan NIM dan tanggal lahir yang sama untuk mengecek hasil saat pengumuman dibuka.</p></div>;
  if (!oprec.formFields.length) return <div className="oprec-inline-note"><h3>Formulir sedang disiapkan.</h3><p>Form pendaftaran akan tampil di sini setelah tersedia.</p></div>;
  return <form className="oprec-form" onSubmit={submit} noValidate aria-busy={pending}>
    <p className="oprec-form__intro">{oprec.formIntro || "Isi data dengan teliti. Kolom bertanda * wajib diisi."}</p>
    {message && <div ref={feedback} tabIndex={-1} className="oprec-feedback oprec-feedback--error" role="alert"><p>{message}</p>{Object.keys(errors).length > 0 && <ul>{oprec.formFields.filter((field) => errors[field.name]).map((field) => <li key={field.name}><a href={`#oprec-field-${field.name}${field.type === "radio" ? "-0" : ""}`}>{field.label}: {errors[field.name]}</a></li>)}</ul>}</div>}
    <fieldset disabled={pending} className="oprec-form__fields"><legend className="oprec-sr-only">Formulir pendaftaran OPREC</legend>{oprec.formFields.map((field) => <Field key={field.name} field={field} error={errors[field.name]} />)}</fieldset>
    <button className="oprec-button" type="submit" disabled={pending}>{pending ? "Mengirim pendaftaran…" : "Kirim pendaftaran"}<span aria-hidden="true">↗</span></button>
    <p className="oprec-form__foot">Simpan NIM dan tanggal lahir yang kamu gunakan untuk mengecek pengumuman.</p>
  </form>;
}
