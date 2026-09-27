"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Lock, AlertTriangle } from "lucide-react";
import { validateOprecForm, normalizeOprecNim, oprecNimProgramWarning, getDefaultJabatan, isFieldApplicable } from "@/lib/oprec";

function getDivisionPositions(division) {
  if (!division) return [];
  if (Array.isArray(division.jabatan) && division.jabatan.length > 0) {
    return division.jabatan;
  }
  return getDefaultJabatan(division.nama);
}

const DEFAULT_DIVISION_LOGOS = {
  bph: "/images/divisi/bph.webp",
  humas: "/images/divisi/humas.webp",
  psdm: "/images/divisi/psdm.webp",
  kominfo: "/images/divisi/kominfo.webp",
  kwu: "/images/divisi/kwu.webp",
};

const SYSTEM_IDENTIFIERS = ["nama", "nim", "tanggal_lahir", "angkatan"];
const isSystemField = (name) => SYSTEM_IDENTIFIERS.includes(name);
const isDivisionField = (name) => ["divisi_pilihan_1", "divisi_pilihan_2", "divisi_pilihan_3"].includes(name);
const isCustomField = (name) => !isSystemField(name) && !isDivisionField(name);

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

function Field({ field, error, inlineError = error, divisions = [], selectedDivisions = [], onToggleDivision, onNimChange }) {
  const id = `oprec-field-${field.name}`;
  const isWide =
    Boolean(field.wide) ||
    field.name === "divisi_pilihan_1" ||
    field.name === "divisi_pilihan_2" ||
    field.name === "divisi_pilihan_3";

  const description = [
    field.help && `${id}-help`,
    field.type === "file" && `${id}-file`,
    inlineError && `${id}-error`,
  ].filter(Boolean).join(" ") || undefined;

  const common = {
    id,
    name: field.name,
    required: field.required,
    "aria-invalid": Boolean(error),
    "aria-describedby": description,
  };

  const isSpecific =
    (field.targetType === "specific" || field.target_type === "specific") &&
    Array.isArray(field.targetDivisions || field.target_divisions) &&
    (field.targetDivisions || field.target_divisions).length > 0;

  const targetNames = isSpecific
    ? (field.targetDivisions || field.target_divisions)
        .map((target) => {
          const div = divisions.find(
            (d, idx) =>
              String(d.id ?? idx).toLowerCase() === String(target).toLowerCase() ||
              d.nama?.toLowerCase() === String(target).toLowerCase()
          );
          return div?.nama || target;
        })
        .join(", ")
    : null;

  const labelText = (
    <>
      {field.label}
      {isSpecific && targetNames && (
        <span className="oprec-conditional-badge" title={`Pertanyaan ini khusus pendaftar divisi ${targetNames}`}>
          Khusus: {targetNames}
        </span>
      )}
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
        onChange={field.name === "nim" ? onNimChange : undefined}
        inputMode={field.name === "nim" ? "text" : undefined}
        autoCapitalize={field.name === "nim" ? "characters" : undefined}
        maxLength={field.maxLength}
        placeholder={field.placeholder || ""}
        min={field.type === "number" ? field.min ?? undefined : field.name === "tanggal_lahir" ? "1900-01-01" : undefined}
        max={field.type === "number" ? field.max ?? undefined : undefined}
        step={field.type === "number" ? "any" : undefined}
        autoComplete={field.name === "tanggal_lahir" ? "bday" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "url" ? "url" : undefined}
      />
    );
  }

  return (
    <div className={`event-dynamic-field ${isWide ? "event-dynamic-field--wide" : ""}`}>
      {field.type !== "checkbox" && <label htmlFor={id}>{labelText}</label>}
      {field.help && <small id={`${id}-help`}>{field.help}</small>}
      {control}
      {inlineError && (
        <small className="event-dynamic-error" id={`${id}-error`}>
          {inlineError}
        </small>
      )}
    </div>
  );
}

export function OprecForm({ oprec, onSuccess }) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});
  const [nimInputError, setNimInputError] = useState(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [selectedJabatan, setSelectedJabatan] = useState({ 1: "", 2: "", 3: "" });
  const feedback = useRef(null);
  const submitting = useRef(false);
  const pendingForm = useRef(null);
  const pendingBody = useRef(null);
  const confirmCancelRef = useRef(null);

  useEffect(() => {
    setSelectedJabatan((prev) => {
      const next = { ...prev };
      let changed = false;
      [1, 2, 3].forEach((rank) => {
        const divVal = selectedDivisions[rank - 1];
        if (!divVal) {
          if (next[rank] !== "") {
            next[rank] = "";
            changed = true;
          }
        } else {
          const division = (oprec.divisiTersedia || []).find(
            (d, idx) =>
              String(d.id ?? idx) === String(divVal) ||
              d.nama?.toLowerCase() === String(divVal).toLowerCase()
          );
          const positions = getDivisionPositions(division);
          if (positions.length === 1) {
            if (next[rank] !== positions[0]) {
              next[rank] = positions[0];
              changed = true;
            }
          } else if (positions.length > 1) {
            if (next[rank] && !positions.includes(next[rank])) {
              next[rank] = "";
              changed = true;
            }
          } else {
            if (next[rank] !== "") {
              next[rank] = "";
              changed = true;
            }
          }
        }
      });
      return changed ? next : prev;
    });
  }, [selectedDivisions, oprec.divisiTersedia]);

  useEffect(() => {
    if (!confirmOpen) return;
    confirmCancelRef.current?.focus();
    const keydown = (event) => {
      if (event.key === "Escape" && !pending) dismissConfirmation();
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [confirmOpen, pending]);

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

  function dismissConfirmation() {
    if (pending) return;
    pendingForm.current = null;
    pendingBody.current = null;
    setConfirmOpen(false);
  }

  function handleNimChange(event) {
    const normalized = normalizeOprecNim(event.target.value);
    event.target.value = normalized;
    setNimInputError(oprecNimProgramWarning(normalized));
    setErrors((current) => {
      if (!current.nim) return current;
      const next = { ...current };
      delete next.nim;
      return next;
    });
  }

  async function sendRegistration() {
    const form = pendingForm.current;
    const body = pendingBody.current;
    if (!form || !body || submitting.current) return;
    setConfirmOpen(false);
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
      pendingForm.current = null;
      pendingBody.current = null;
      submitting.current = false;
      setPending(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (submitting.current || confirmOpen) return;
    const form = event.currentTarget;
    const body = new FormData(form);
    selectedDivisions.forEach((value, index) => body.set(`divisi_pilihan_${index + 1}`, value));
    [1, 2, 3].forEach((rank) => {
      if (selectedJabatan[rank]) {
        body.set(`jabatan_pilihan_${rank}`, selectedJabatan[rank]);
      } else if (selectedDivisions[rank - 1]) {
        body.set(`jabatan_pilihan_${rank}`, "");
      }
    });
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
    pendingForm.current = form;
    pendingBody.current = body;
    setConfirmOpen(true);
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
    <>
    <form className="event-dynamic-form" onSubmit={submit} noValidate aria-busy={pending || confirmOpen}>
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
              {[1, 2, 3].map((rank) => {
                const err = errors[`jabatan_pilihan_${rank}`];
                if (!err) return null;
                return (
                  <li key={`jabatan-err-${rank}`}>
                    <a href={`#oprec-jabatan-select-${rank}`}>
                      Jabatan Pilihan {rank}: {err}
                    </a>
                  </li>
                );
              })}
              {oprec.formFields
                .filter((field) => isSystemField(field.name) && errors[field.name])
                .map((field) => (
                  <li key={field.name}>
                    <a href={`#oprec-field-${field.name}`}>
                      {field.label}: {errors[field.name]}
                    </a>
                  </li>
                ))}
              {oprec.formFields
                .filter((field) => isCustomField(field.name) && isFieldApplicable(field, selectedDivisions, oprec.divisiTersedia) && errors[field.name])
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
      <fieldset disabled={pending || confirmOpen}>
        <legend className="event-form-sr-only">Formulir pendaftaran OPREC</legend>

        {/* 1. Pertanyaan Sistem (01 s/d 04: identitas wajib) */}
        {oprec.formFields
          .filter((field) => isSystemField(field.name))
          .map((field) => (
            <Field
              key={field.name}
              field={field}
              error={field.name === "nim" ? nimInputError || (Array.isArray(errors.nim) ? errors.nim[0] : errors.nim) : errors[field.name]}
              inlineError={field.name === "nim" ? nimInputError : errors[field.name]}
              onNimChange={handleNimChange}
              divisions={oprec.divisiTersedia}
              selectedDivisions={selectedDivisions}
              onToggleDivision={toggleDivision}
            />
          ))}

        {/* 2. Bagian Pilihan Divisi di Form (Pertanyaan No 05) */}
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
            <div className="oprec-division-toolbar">
              <div
                className={`oprec-division-counter ${
                  selectedDivisions.length === 3
                    ? "oprec-division-counter--complete"
                    : selectedDivisions.length > 0
                    ? "oprec-division-counter--active"
                    : ""
                }`}
                aria-live="polite"
              >
                <span className="oprec-division-counter__dot" aria-hidden="true" />
                <span>{selectedDivisions.length} / 3 divisi dipilih</span>
              </div>
              {selectedDivisions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDivisions([]);
                    setSelectedJabatan({ 1: "", 2: "", 3: "" });
                  }}
                  className="oprec-division-reset-btn"
                  title="Reset semua pilihan divisi"
                >
                  <RotateCcw size={12} className="oprec-division-reset-btn__icon" aria-hidden="true" />
                  <span>Reset Pilihan</span>
                </button>
              )}
            </div>

            {/* 3 Dropdown Jabatan Berjejer Horizontal */}
            <div className="oprec-jabatan-choices-row" role="region" aria-label="Pilihan Jabatan Divisi">
              {[1, 2, 3].map((rank) => {
                const divVal = selectedDivisions[rank - 1];
                const division = divVal
                  ? (oprec.divisiTersedia || []).find(
                      (d, idx) =>
                        String(d.id ?? idx) === String(divVal) ||
                        d.nama?.toLowerCase() === String(divVal).toLowerCase()
                    )
                  : null;
                const isUnlocked = Boolean(division);
                const positions = getDivisionPositions(division);
                const currentChoice = selectedJabatan[rank] || "";
                const slotError = errors[`jabatan_pilihan_${rank}`];

                return (
                  <div
                    key={rank}
                    className={`oprec-jabatan-slot ${
                      isUnlocked
                        ? "oprec-jabatan-slot--active"
                        : "oprec-jabatan-slot--blocked"
                    } ${slotError ? "oprec-jabatan-slot--has-error" : ""}`}
                  >
                    <div className="oprec-jabatan-slot__header">
                      <span className="oprec-jabatan-slot__rank-badge">
                        Pilihan #{rank}
                      </span>
                      {isUnlocked ? (
                        <span className="oprec-jabatan-slot__div-badge" title={division.namaLengkap || division.nama}>
                          {division.nama}
                        </span>
                      ) : (
                        <span className="oprec-jabatan-slot__locked-badge">
                          <Lock size={10} aria-hidden="true" />
                          <span>Terkunci</span>
                        </span>
                      )}
                    </div>

                    <div className="oprec-jabatan-slot__body">
                      <label
                        htmlFor={`oprec-jabatan-select-${rank}`}
                        className="oprec-jabatan-slot__label"
                      >
                        Jabatan {isUnlocked ? `di ${division.nama}` : `Pilihan ${rank}`}
                        {isUnlocked && <b aria-label="wajib"> *</b>}
                      </label>
                      <div className="oprec-jabatan-slot__select-wrap">
                        <select
                          id={`oprec-jabatan-select-${rank}`}
                          name={`jabatan_pilihan_${rank}`}
                          className="oprec-jabatan-slot__select"
                          disabled={!isUnlocked}
                          value={currentChoice}
                          onChange={(e) => {
                            setSelectedJabatan((prev) => ({
                              ...prev,
                              [rank]: e.target.value,
                            }));
                          }}
                        >
                          {!isUnlocked ? (
                            <option value="" disabled>
                              Pilih divisi ke-{rank} terlebih dahulu...
                            </option>
                          ) : positions.length > 1 ? (
                            <>
                              <option value="" disabled>
                                -- Pilih Jabatan di {division.nama} --
                              </option>
                              {positions.map((pos) => (
                                <option key={pos} value={pos}>
                                  {pos}
                                </option>
                              ))}
                            </>
                          ) : (
                            positions.map((pos) => (
                              <option key={pos} value={pos}>
                                {pos}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {isUnlocked && (
                        <small className="oprec-jabatan-slot__hint">
                          {positions.length > 1
                            ? `${positions.length} opsi jabatan dapat dipilih`
                            : "Otomatis terpilih (jabatan tunggal)"}
                        </small>
                      )}
                      {slotError && (
                        <small className="event-dynamic-error oprec-jabatan-slot__error">
                          {slotError}
                        </small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.divisi_pilihan_1 && (
              <small className="event-dynamic-error" id="oprec-divisi-error">
                {errors.divisi_pilihan_1}
              </small>
            )}
          </div>
        )}

        {/* 3. Pertanyaan Tambahan Admin (No 06 dst, berada di bawah divisi) */}
        {oprec.formFields
          .filter((field) => isCustomField(field.name) && isFieldApplicable(field, selectedDivisions, oprec.divisiTersedia))
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
      </fieldset>
      <div className="event-group-submit">
        <button className="event-button" type="submit" disabled={pending || confirmOpen || selectedDivisions.length !== 3}>
          {pending ? "Mengirim…" : "Kirim"}
        </button>
      </div>
    </form>
    {confirmOpen && (
      <div className="oprec-submit-dialog__overlay" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismissConfirmation();
      }}>
        <section className="oprec-submit-dialog" role="dialog" aria-modal="true" aria-labelledby="oprec-submit-dialog-title" aria-describedby="oprec-submit-dialog-description">
          <div className="oprec-submit-dialog__icon" aria-hidden="true"><AlertTriangle size={22} /></div>
          <span className="oprec-submit-dialog__eyebrow">Konfirmasi pengiriman</span>
          <h2 id="oprec-submit-dialog-title">Yakin ingin mengirim formulir?</h2>
          <p id="oprec-submit-dialog-description">Periksa kembali seluruh jawabanmu. Setelah formulir dikirim, data pendaftaran tidak dapat diedit.</p>
          <div className="oprec-submit-dialog__actions">
            <button ref={confirmCancelRef} type="button" onClick={dismissConfirmation} disabled={pending}>Periksa lagi</button>
            <button type="button" onClick={sendRegistration} disabled={pending}>{pending ? "Mengirim..." : "Ya, kirim formulir"}</button>
          </div>
        </section>
      </div>
    )}
    </>
  );
}
