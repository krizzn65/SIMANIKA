"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

export default function DecisionDialog({ row, onClose, onSubmit, saving, error }) {
  const dialog = useRef(null);
  const [division, setDivision] = useState(String(row.decision.division_id || ""));
  const [position, setPosition] = useState(row.decision.position || "");
  useEffect(() => {
    const trigger = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); trigger?.focus?.(); };
  }, []);
  const chosen = row.choices.find((choice) => String(choice.id) === division);
  const validPosition = chosen?.positions.includes(position);
  return <dialog ref={dialog} onClose={(event) => { if (!event.currentTarget.open) onClose(); }} onCancel={(event) => { if (saving) event.preventDefault(); }} aria-labelledby="assessment-decision-title" className="assessment-dialog assessment-decision-dialog">
    <header className="assessment-dialog__header"><div><span className="assessment-eyebrow">KEPUTUSAN PESERTA</span><h2 id="assessment-decision-title">{row.name}</h2><p>NIM {row.nim}</p></div><button type="button" className="assessment-icon-button" aria-label="Tutup keputusan" onClick={onClose} disabled={saving}><X size={20} /></button></header>
    <div className="assessment-dialog__body"><p className="assessment-field-label">Divisi penerimaan</p><p className="assessment-help">Pilih satu dari tiga divisi yang dilamar peserta.</p>
      <div className="assessment-decision-choices">{row.choices.map((choice) => <button type="button" key={choice.order} disabled={saving || !choice.id} aria-pressed={division === String(choice.id)} className={`assessment-division-card ${division === String(choice.id) ? "is-selected" : ""}`} onClick={() => { setDivision(String(choice.id)); setPosition(""); }}>
        <span>Pilihan {choice.order}{division === String(choice.id) && <Check size={16} />}</span><strong>{choice.division || "Tidak tersedia"}</strong><small>Dilamar: {choice.applied_position || "—"}</small>
      </button>)}</div>
      <label className="assessment-field">Jabatan penerimaan<select value={validPosition ? position : ""} onChange={(event) => setPosition(event.target.value)} disabled={!chosen || saving}><option value="">Pilih jabatan penerimaan</option>{chosen?.positions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      {error && <div role="alert" className="assessment-inline-error">{error}</div>}
    </div>
    <footer className="assessment-dialog__footer"><button type="button" className="assessment-button" disabled={saving} onClick={onClose}>Batal</button><div><button type="button" className="assessment-button assessment-button--danger" disabled={saving} onClick={() => onSubmit({ status: "rejected" })}>Tolak peserta</button><button type="button" className="assessment-button assessment-button--primary" disabled={!chosen || !validPosition || saving} onClick={() => onSubmit({ status: "accepted", accepted_division_id: chosen.id, accepted_position: position })}>{saving ? <Loader2 size={16} className="assessment-spin" /> : <Check size={16} />} Terima peserta</button></div></footer>
  </dialog>;
}
