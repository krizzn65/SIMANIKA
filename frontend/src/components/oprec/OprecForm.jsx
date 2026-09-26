"use client";

import { useRef, useState } from "react";
import { validateOprecForm } from "@/lib/oprec";

const DEFAULT_DIVISION_LOGOS = {
  bph: "/images/divisi/bph.webp",
  humas: "/images/divisi/humas.webp",
  psdm: "/images/divisi/psdm.webp",
  kominfo: "/images/divisi/kominfo.webp",
  kwu: "/images/divisi/kwu.webp",
};

function DivisionChoiceItem({ option, division, common, id, selected, onToggle }) {
  const [imgError, setImgError] = useState(false);
  const name = division?.nama || option.label;
  const fullName = division?.namaLengkap;
  const key = name?.toLowerCase()?.trim();
  const logoSrc = (!imgError && (division?.logo || DEFAULT_DIVISION_LOGOS[key])) || null;

  return (
    <label className={`oprec-division-choice ${selected > 0 ? "oprec-division-choice--selected" : ""}`} key={option.value}>
      <input
        {...common}
        id={`${id}-${option.value}`}
        name={undefined}
        type="checkbox"
        className="oprec-division-choice__input"
        checked={selected > 0}
        onChange={() => onToggle(option.value)}
      />
      <span
        className={`oprec-division-choice__indicator ${selected > 0 ? "oprec-division-choice__indicator--selected" : ""}`}
        aria-hidden="true"
      >
        {selected > 0 ? selected : null}
      </span>
      {logoSrc ? (
        <img
          src={logoSrc}
          alt=""
          width="26"
          height="26"
          className="oprec-division-choice__logo"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="oprec-division-choice__fallback" aria-hidden="true">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="oprec-division-choice__text">
        <strong>{name}</strong>
        {fullName && fullName !== name && <small>{fullName}</small>}
      </span>
    </label>
  );
}

function Field({ field, error, divisions = [], selectedDivisions = [], onToggleDivision }) {
  const id = `oprec-field-${field.name}`;
  const isWide =
    ["textarea", "radio", "checkbox", "file"].includes(field.type) ||
    field.name === "divisi_pilihan_1" ||
    field.name === "divisi_pilihan_2" ||
    field.name === "divisi_pilihan_3";

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
  } else if (["divisi_pilihan_1", "divisi_pilihan_2", "divisi_pilihan_3"].includes(field.name)) {
    const availableOptions = (field.options && field.options.length > 0)
      ? field.options
      : divisions.map((item, idx) => ({
          value: String(item.id ?? idx),
          label: item.nama || item.namaLengkap || `Divisi #${item.id ?? idx}`,
        }));

    control = (
      <><small>Pilih tepat 3 divisi. Urutan klik menentukan prioritas.</small><div className="oprec-division-choices">
        {availableOptions.map((option) => {
          const division = divisions.find(
            (item) => String(item.id) === String(option.value) || item.nama?.toLowerCase() === option.label?.toLowerCase()
          );
          return (
            <DivisionChoiceItem
              key={option.value}
              option={option}
              division={division}
              common={common}
              id={id}
              selected={selectedDivisions.indexOf(String(option.value)) + 1}
              onToggle={onToggleDivision}
            />
          );
        })}
      </div><small aria-live="polite">{selectedDivisions.length}/3 divisi dipilih</small></>
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
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const feedback = useRef(null);
  const submitting = useRef(false);
  function toggleDivision(value) {
    setSelectedDivisions((current) => current.includes(String(value))
      ? current.filter((item) => item !== String(value))
      : current.length < 3 ? [...current, String(value)] : current);
  }

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
    selectedDivisions.forEach((value, index) => body.set(`divisi_pilihan_${index + 1}`, value));
    const nextErrors = validateOprecForm(oprec.formFields, body, Date.now(), oprec.divisiTersedia);
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

  if (!oprec.formFields.length && (!oprec.divisiTersedia || !oprec.divisiTersedia.length)) {
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
              {errors.divisi_pilihan_1 && (
                <li>
                  <a href="#oprec-field-divisi_pilihan_1">
                    Divisi Pilihan: {errors.divisi_pilihan_1}
                  </a>
                </li>
              )}
              {oprec.formFields
                .filter((field) => !["divisi_pilihan_1", "divisi_pilihan_2", "divisi_pilihan_3"].includes(field.name))
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

        {oprec.formFields
          .filter((field) => !["divisi_pilihan_1", "divisi_pilihan_2", "divisi_pilihan_3"].includes(field.name))
          .map((field) => (
            <Field
              key={field.name}
              field={field}
              error={errors[field.name]}
              divisions={oprec.divisiTersedia}
              selectedDivisions={selectedDivisions}
              onToggleDivision={toggleDivision}
            />
          ))}

        {/* Bagian Pilihan Divisi di Form Bagian Bawah */}
        {oprec.divisiTersedia && oprec.divisiTersedia.length > 0 && (
          <div className="event-dynamic-field event-dynamic-field--wide oprec-division-section" id="oprec-field-divisi_pilihan_1">
            <label htmlFor="oprec-division-choices-list">
              Divisi Pilihan <b aria-label="wajib"> *</b>
            </label>
            <small>Pilih tepat 3 divisi. Urutan klik menentukan prioritas (Pilihan 1, 2, dan 3).</small>
            <div className="oprec-division-choices" id="oprec-division-choices-list">
              {oprec.divisiTersedia.map((item, idx) => {
                const val = String(item.id ?? idx);
                const option = {
                  value: val,
                  label: item.nama || item.namaLengkap || `Divisi #${val}`,
                };
                return (
                  <DivisionChoiceItem
                    key={val}
                    option={option}
                    division={item}
                    common={{}}
                    id="oprec-divisi"
                    selected={selectedDivisions.indexOf(val) + 1}
                    onToggle={toggleDivision}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-1">
              <small aria-live="polite" className="font-mono text-xs text-slate-500">
                {selectedDivisions.length}/3 divisi dipilih
              </small>
              {selectedDivisions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDivisions([])}
                  className="text-xs text-red-600 hover:underline font-mono"
                >
                  Reset Pilihan
                </button>
              )}
            </div>
            {errors.divisi_pilihan_1 && (
              <small className="event-dynamic-error" id="oprec-divisi-error">
                {errors.divisi_pilihan_1}
              </small>
            )}
          </div>
        )}
      </fieldset>
      <div className="event-group-submit">
        <button className="event-button" type="submit" disabled={pending || selectedDivisions.length !== 3}>
          {pending ? "Mengirim…" : "Kirim"}
        </button>
      </div>
    </form>
  );
}
