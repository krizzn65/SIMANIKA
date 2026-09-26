"use client";

import { useRef, useState } from "react";
import { validateOprecForm } from "@/lib/oprec";

function Field({ field, error, divisions = [] }) {
  const id = `oprec-field-${field.name}`;
  const isWide =
    ["textarea", "radio", "checkbox", "file"].includes(field.type) ||
    field.name === "divisi_pilihan_1" ||
    field.name === "divisi_pilihan_2";

  const description = [
    field.help && `${id}-help`,
    field.type === "file" && `${id}-file`,
    error && `${id}-error`,
  ].filter(Boolean).join(" ") || undefined;

  const common = {
    id,
    name: field.name,
    required: field.required,
    "aria-invalid": Boolean(error),
    "aria-describedby": description,
  };

  const labelText = (
    <>
      {field.label}
      {field.required && <b aria-label="wajib"> *</b>}
    </>
  );

  let control;
  if (field.type === "textarea") {
    control = (
      <textarea
        {...common}
        rows={4}
        maxLength={field.maxLength}
        placeholder={field.placeholder || ""}
      />
    );
  } else if (field.name === "divisi_pilihan_1" || field.name === "divisi_pilihan_2") {
    control = (
      <div className="oprec-division-choices">
        {field.options.map((option) => {
          const division = divisions.find((item) => item.id === option.value);
          return (
            <label className="oprec-division-choice" key={option.value}>
              <input {...common} id={`${id}-${option.value}`} type="radio" value={option.value} />
              <span className="oprec-division-choice__content">
                {division?.logo ? (
                  <img src={division.logo} alt="" width="36" height="36" />
                ) : (
                  <span className="oprec-division-choice__fallback" aria-hidden="true">//</span>
                )}
                <span>
                  <strong>{division?.namaLengkap || option.label}</strong>
                  <small>{division?.deskripsi || option.label}</small>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    );
  } else if (field.type === "select") {
    control = (
      <select {...common} defaultValue="">
        <option value="" disabled={field.required}>
          Pilih {field.label.toLowerCase()}
        </option>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "radio") {
    control = (
      <div className="event-dynamic-choices">
        {field.options.map((option, index) => (
          <label key={option.value}>
            <input {...common} id={`${id}-${index}`} type="radio" value={option.value} />{" "}
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  } else if (field.type === "checkbox") {
    control = (
      <label className="event-dynamic-check">
        <input {...common} type="checkbox" value="on" /> <span>{labelText}</span>
      </label>
    );
  } else if (field.type === "file") {
    control = (
      <>
        <input
          {...common}
          type="file"
          accept={field.accept.join(",")}
        />
        <small id={`${id}-file`}>
          {field.accept.map((ext) => ext.replace(".", "").toUpperCase()).join(", ")} · maksimal {field.maxSizeMB} MB
        </small>
      </>
    );
  } else {
    control = (
      <input
        {...common}
        type={field.type}
        maxLength={field.maxLength}
        placeholder={field.placeholder || ""}
        min={field.type === "number" ? field.min ?? undefined : field.name === "tanggal_lahir" ? "1900-01-01" : undefined}
        max={field.type === "number" ? field.max ?? undefined : undefined}
        step={field.type === "number" ? "any" : undefined}
        autoComplete={field.name === "tanggal_lahir" ? "bday" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : undefined}
      />
    );
  }

  return (
    <div className={`event-dynamic-field ${isWide ? "event-dynamic-field--wide" : ""}`}>
      {field.type !== "checkbox" && <label htmlFor={id}>{labelText}</label>}
      {field.help && <small id={`${id}-help`}>{field.help}</small>}
      {control}
      {error && (
        <small className="event-dynamic-error" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}

export function OprecForm({ oprec, onSuccess }) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const feedback = useRef(null);
  const submitting = useRef(false);

  function showErrors(nextErrors, note) {
    setErrors(nextErrors);
    setMessage(note);
    requestAnimationFrame(() => feedback.current?.focus());
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const body = new FormData(form);
    const nextErrors = validateOprecForm(oprec.formFields, body);
    if (Object.keys(nextErrors).length) {
      showErrors(nextErrors, "Periksa kolom yang ditandai sebelum mengirim.");
      return;
    }
    let total = 0;
    for (const value of body.values()) {
      if (typeof value !== "string") total += value.size;
    }
    if (total > 11 * 1024 * 1024) {
      showErrors({}, "Total berkas maksimal 11 MB. Perkecil ukuran berkasmu.");
      return;
    }
    body.set("oprec_id", oprec.id);
    body.set("schema_version", oprec.schemaVersion);
    submitting.current = true;
    setPending(true);
    setErrors({});
    setMessage("");
    try {
      const response = await fetch("/api/oprec/register", {
        method: "POST",
        body,
        signal: AbortSignal.timeout(25000),
      });
      const result = await response.json();
      if (!response.ok) {
        showErrors(result.errors || {}, result.message || "Pendaftaran belum berhasil. Coba lagi.");
        return;
      }
      if (result.data?.submitted !== true) throw new Error("Invalid response");
      form.reset();
      setSuccess(true);
      onSuccess?.();
    } catch {
      showErrors({}, "Koneksi terputus atau layanan belum tersedia. Pastikan status pendaftaran sebelum mencoba kembali.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="event-form-feedback" style={{ background: "#e4f7ed", color: "var(--ws-green)", borderColor: "#abdbc3" }} role="status">
        <h3 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700 }}>Pendaftaran Berhasil Dikirim</h3>
        <p style={{ margin: 0, fontSize: "13px" }}>Data pendaftaranmu sudah tersimpan. Halaman sedang diperbarui...</p>
      </div>
    );
  }

  if (!oprec.formFields.length) {
    return (
      <div className="event-form-feedback" role="status">
        <h3 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700 }}>Formulir sedang disiapkan.</h3>
        <p style={{ margin: 0, fontSize: "13px" }}>Form pendaftaran akan tampil di sini setelah tersedia.</p>
      </div>
    );
  }

  return (
    <form className="event-dynamic-form" onSubmit={submit} noValidate aria-busy={pending}>
      <p>Kolom bertanda * wajib diisi. Isilah sesuai petunjuk penyelenggara.</p>
      {message && (
        <div ref={feedback} tabIndex={-1} className="event-form-feedback" role="alert">
          <p>{message}</p>
          {Object.keys(errors).length > 0 && (
            <ul>
              {oprec.formFields
                .filter((field) => errors[field.name])
                .map((field) => (
                  <li key={field.name}>
                    <a href={`#oprec-field-${field.name}`}>
                      {field.label}: {errors[field.name]}
                    </a>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
      <fieldset disabled={pending}>
        <legend className="event-form-sr-only">Formulir pendaftaran OPREC</legend>
        {oprec.formFields.map((field) => (
          <Field
            key={field.name}
            field={field}
            error={errors[field.name]}
            divisions={oprec.divisiTersedia}
          />
        ))}
      </fieldset>
      <div className="event-group-submit">
        <button className="event-button" type="submit" disabled={pending}>
          {pending ? "Mengirim…" : "Kirim"}
        </button>
      </div>
    </form>
  );
}
