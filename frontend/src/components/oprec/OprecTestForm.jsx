"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";

export function OprecTestForm({ stageId }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const errorRef = useRef(null);
  useEffect(() => {
    let active = true;
    api.get(`/user/oprec/stages/${stageId}/test`).then(({ data }) => { if (active) { setTest(data.data); setSubmitted(data.data.submitted); } })
      .catch((err) => { if (active) setError(err.response?.status === 403 ? "Tes tulis hanya untuk peserta yang sudah mendaftar pada periode ini." : err.response?.status === 401 ? "Masuk ke akunmu terlebih dahulu untuk mengikuti tes." : err.message || "Tes belum dapat dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [stageId]);
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || pending) return;
    const answers = Object.fromEntries(new FormData(form));
    setPending(true); setError(""); setErrors({});
    try {
      const response = await api.post(`/user/oprec/stages/${stageId}/test`, answers);
      if (response.data?.data?.submitted !== true) throw new Error("Jawaban belum terkonfirmasi.");
      setSubmitted(true); form.reset();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setError(err.response?.status === 409 ? "Jawaban sudah tersimpan atau waktu tes telah berakhir. Muat ulang untuk melihat status terbaru." : err.message || "Jawaban belum berhasil dikirim.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { setPending(false); }
  };
  if (loading) return <div className="oprec-inline-note" role="status">Memuat soal tes tulis…</div>;
  if (error && !test) return <div className="oprec-feedback oprec-feedback--error" role="alert"><p>{error}</p><Link href="/login">Masuk ke akun</Link></div>;
  if (submitted) return <div className="oprec-feedback oprec-feedback--success" role="status"><h3>Jawaban tes sudah tersimpan.</h3><p>Terima kasih. Hasil seleksi akan tersedia pada tahap pengumuman.</p></div>;
  if (!test?.available) return <div className="oprec-inline-note"><h3>Tes belum dapat diisi.</h3><p>Periksa kembali jadwal tes tulis.</p></div>;
  return <form className="oprec-form oprec-test-form" onSubmit={submit} aria-busy={pending}><p className="oprec-form__intro">Jawab setiap pertanyaan dengan teliti. Jawaban hanya dapat dikirim satu kali.</p>{error && <div className="oprec-feedback oprec-feedback--error" role="alert" tabIndex={-1} ref={errorRef}>{error}</div>}<fieldset className="oprec-form__fields" disabled={pending}><legend className="oprec-sr-only">Soal tes tulis</legend>{test.formFields.map((field, index) => <div className="oprec-field" key={field.name}><label htmlFor={`test-${field.name}`}>{String(index + 1).padStart(2, "0")}. {field.label}{field.required && <span aria-hidden="true"> *</span>}</label>{field.help && <small>{field.help}</small>}{field.type === "textarea" ? <textarea id={`test-${field.name}`} name={field.name} rows={5} required={field.required} maxLength={field.maxLength || 5000} /> : field.type === "select" ? <select id={`test-${field.name}`} name={field.name} required={field.required} defaultValue=""><option value="">Pilih jawaban</option>{(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "radio" ? <div className="oprec-choice-list">{(field.options || []).map((option, i) => <label className="oprec-choice" key={option.value}><input type="radio" id={i === 0 ? `test-${field.name}` : undefined} name={field.name} value={option.value} required={field.required} />{option.label}</label>)}</div> : field.type === "checkbox" ? <label className="oprec-choice"><input type="checkbox" name={field.name} value="on" required={field.required} /> Saya setuju</label> : <input id={`test-${field.name}`} name={field.name} type={field.type} required={field.required} maxLength={field.maxLength || 5000} />}{errors[field.name] && <span className="oprec-field-error">{Array.isArray(errors[field.name]) ? errors[field.name][0] : errors[field.name]}</span>}</div>)}</fieldset><button className="oprec-button" type="submit" disabled={pending}>{pending ? "Mengirim jawaban…" : "Kirim jawaban tes"}</button></form>;
}
