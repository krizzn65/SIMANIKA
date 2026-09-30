"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, Search, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { api } from "@/services/api";
import { errorMessage } from "./assessmentFormat";

export default function AssignmentDialog({ periodId, periodName, onClose }) {
  const dialog = useRef(null);
  const pendingIds = useRef(new Set());
  const alive = useRef(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    alive.current = true;
    const trigger = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => { alive.current = false; element?.close(); trigger?.focus?.(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    api.get(`/admin/oprec/${periodId}/assessment/assignments`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result.data.data); })
      .catch((cause) => { if (!controller.signal.aborted) setError(errorMessage(cause, "Daftar Pengurus gagal dimuat.")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [periodId, reload]);

  function focusReviewer(id) { requestAnimationFrame(() => dialog.current?.querySelector(`[data-reviewer-id="${id}"]`)?.focus()); }

  async function toggle(person, assigned) {
    if (pendingIds.current.has(person.id)) return;
    pendingIds.current.add(person.id);
    setPending((current) => ({ ...current, [person.id]: true }));
    setRowErrors((current) => ({ ...current, [person.id]: "" }));
    try {
      const url = `/admin/oprec/${periodId}/assessment/assignments/${person.id}`;
      if (assigned) await api.delete(url); else await api.put(url);
      if (!alive.current) return;
      setData((current) => ({ ...current, assigned_ids: assigned ? current.assigned_ids.filter((id) => id !== person.id) : [...new Set([...current.assigned_ids, person.id])] }));
      setConfirm(null);
      setNotice(`${person.name} ${assigned ? "tidak lagi ditugaskan pada periode ini." : "berhasil ditugaskan sebagai penilai."}`);
    } catch (cause) {
      if (alive.current) setRowErrors((current) => ({ ...current, [person.id]: errorMessage(cause, "Perubahan belum tersimpan. Silakan coba lagi.") }));
    } finally {
      pendingIds.current.delete(person.id);
      if (alive.current) {
        setPending((current) => ({ ...current, [person.id]: false }));
        if (document.activeElement === document.body || document.activeElement?.closest(`[data-reviewer-card="${person.id}"]`)) focusReviewer(person.id);
      }
    }
  }
  const busy = Object.values(pending).some(Boolean);
  const assignedIds = data?.assigned_ids || [];
  const assignedCount = (data?.reviewers || []).filter((person) => assignedIds.includes(person.id)).length;
  const people = (data?.reviewers || []).filter((person) => `${person.name} ${person.email}`.toLocaleLowerCase('id-ID').includes(query.trim().toLocaleLowerCase('id-ID')))
    .sort((a, b) => Number(assignedIds.includes(b.id)) - Number(assignedIds.includes(a.id)) || a.name.localeCompare(b.name, 'id-ID'));
  return <dialog ref={dialog} onClose={(event) => { if (!event.currentTarget.open) onClose(); }} onCancel={(event) => { if (busy) event.preventDefault(); }} aria-labelledby="assignment-title" className="assessment-dialog assessment-assignment-dialog">
    <header className="assessment-dialog__header"><div><span className="assessment-eyebrow">PERIODE {periodName}</span><h2 id="assignment-title">Tugaskan penilai</h2><p>Pilih Pengurus yang dapat menilai peserta pada periode ini.</p></div><button type="button" className="assessment-icon-button" aria-label="Tutup penugasan" onClick={onClose} disabled={busy}><X size={20} /></button></header>
    <div className="assessment-assignment-toolbar"><div className="assessment-assigned-count"><ShieldCheck size={20} /><span><strong>{loading ? "—" : assignedCount} Pengurus</strong> ditugaskan</span></div><label className="assessment-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Cari Pengurus</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau email Pengurus" /></label></div>
    <div className="assessment-assignment-list" aria-busy={loading}>
      {loading ? <div className="assessment-skeleton-list" role="status"><span className="sr-only">Memuat daftar Pengurus…</span>{[1, 2, 3].map((n) => <div className="assessment-skeleton" key={n} />)}</div>
        : error ? <div className="assessment-state"><p role="alert">{error}</p><button type="button" className="assessment-button" onClick={() => setReload((n) => n + 1)}>Coba lagi</button></div>
          : people.length ? people.map((person) => {
            const assigned = assignedIds.includes(person.id);
            return <article className={`assessment-reviewer ${assigned ? "is-assigned" : ""}`} key={person.id} data-reviewer-card={person.id} aria-busy={pending[person.id] || false}>
              <div className="assessment-reviewer__main"><span className="assessment-initials" aria-hidden="true">{person.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}</span><div className="assessment-reviewer__identity"><h3>{person.name}</h3><p>{person.email}</p><span className={`assessment-status ${assigned ? "assessment-status--active" : "assessment-status--pending"}`}>{assigned && <Check size={12} />}{assigned ? "Ditugaskan" : "Belum ditugaskan"}</span></div>
                <button type="button" data-reviewer-id={person.id} disabled={pending[person.id]} className={`assessment-button assessment-button--small ${assigned ? "" : "assessment-button--primary"}`} onClick={() => assigned ? setConfirm(person.id) : toggle(person, false)}>{pending[person.id] ? <Loader2 size={15} className="assessment-spin" /> : assigned ? null : <UserPlus size={15} />}{pending[person.id] ? "Menyimpan…" : assigned ? "Cabut akses" : "Tugaskan"}</button></div>
              {confirm === person.id && <div className="assessment-revoke"><p>Cabut akses penilaian {person.name}? Nilai yang sudah diberikan tetap tersimpan dan dihitung.</p><div><button type="button" className="assessment-button assessment-button--small" disabled={pending[person.id]} onClick={() => { setConfirm(null); focusReviewer(person.id); }}>Batal</button><button type="button" className="assessment-button assessment-button--small assessment-button--danger" disabled={pending[person.id]} onClick={() => toggle(person, true)}>Ya, cabut akses</button></div></div>}
              {rowErrors[person.id] && <p className="assessment-reviewer__error" role="alert"><AlertCircle size={15} />{rowErrors[person.id]}</p>}
            </article>;
          }) : <div className="assessment-state"><Users size={28} /><h3>{query ? "Pengurus tidak ditemukan" : "Belum ada akun Pengurus"}</h3><p>{query ? "Coba nama atau email lain." : "Akun dengan role Pengurus akan tersedia pada daftar ini."}</p></div>}
    </div>
    <footer className="assessment-assignment-footer"><p><ShieldCheck size={16} />Super Admin selalu dapat menilai. Perubahan penugasan langsung tersimpan.</p><p role="status" className="assessment-assignment-notice">{notice}</p><button type="button" className="assessment-button" disabled={busy} onClick={onClose}>Selesai</button></footer>
  </dialog>;
}
