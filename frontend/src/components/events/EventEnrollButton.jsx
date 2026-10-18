"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, UserPlus, Users, X } from "lucide-react";
import { api } from "@/services/api";

const initialTeamState = { step: "choose", name: "", code: "", error: "", copied: false };

export function EventEnrollButton({ event }) {
  const router = useRouter();
  const dialogRef = useRef(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [team, setTeam] = useState(initialTeamState);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      if (team.step !== "code") setTeam(initialTeamState);
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [team.step]);

  function goToLogin() {
    router.push(`/login?next=${encodeURIComponent(`/events/detail?slug=${encodeURIComponent(event.slug)}`)}`);
  }

  async function enrollIndividual() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const { data } = await api.post(`/user/events/${event.id}/enroll`);
      if (data?.data?.enrolled !== true) throw new Error("Pendaftaran belum dapat dipastikan.");
      router.push(`/dashboard?event=${event.id}`);
    } catch (err) {
      if (err.response?.status === 401) return goToLogin();
      setError(err.message || "Pendaftaran belum berhasil. Coba lagi.");
      setPending(false);
    }
  }

  function openTeamDialog() {
    setError("");
    dialogRef.current?.showModal();
  }

  function closeTeamDialog() {
    if (!pending) dialogRef.current?.close();
  }

  function selectStep(step) {
    setTeam((current) => ({ ...current, step, error: "", copied: false }));
  }

  function fieldError(err, field, fallback) {
    const value = err.response?.data?.errors?.[field];
    return (Array.isArray(value) ? value[0] : value) || err.message || fallback;
  }

  async function createTeam(submission) {
    submission.preventDefault();
    const name = team.name.trim();
    if (!name || pending) return;
    setPending(true);
    setTeam((current) => ({ ...current, error: "", copied: false }));
    try {
      const { data } = await api.post(`/user/events/${event.id}/create-team`, { nama_tim: name });
      if (data?.data?.created !== true || !data?.data?.teamCode) throw new Error("Tim belum dapat dipastikan.");
      setTeam((current) => ({ ...current, step: "code", code: data.data.teamCode, name: data.data.teamName || name }));
    } catch (err) {
      if (err.response?.status === 401) return goToLogin();
      setTeam((current) => ({ ...current, error: fieldError(err, "nama_tim", "Tim belum berhasil dibuat.") }));
    } finally {
      setPending(false);
    }
  }

  async function joinTeam(submission) {
    submission.preventDefault();
    const code = team.code.trim().toUpperCase();
    if (!code || pending) return;
    setPending(true);
    setTeam((current) => ({ ...current, error: "" }));
    try {
      const { data } = await api.post(`/user/events/${event.id}/join-team`, { kode_unik: code });
      if (data?.data?.requested !== true) throw new Error("Status bergabung belum dapat dipastikan.");
      router.push(`/dashboard?event=${event.id}`);
    } catch (err) {
      if (err.response?.status === 401) return goToLogin();
      setTeam((current) => ({ ...current, error: fieldError(err, "kode_unik", "Belum berhasil bergabung ke tim.") }));
      setPending(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(team.code);
      setTeam((current) => ({ ...current, copied: true }));
      window.setTimeout(() => setTeam((current) => ({ ...current, copied: false })), 1500);
    } catch {
      setTeam((current) => ({ ...current, error: "Kode belum tersalin. Blok lalu salin kode secara manual." }));
    }
  }

  if (event.tipePendaftaran !== "tim") {
    return <div>
      <button type="button" className="event-button" onClick={enrollIndividual} disabled={pending} aria-busy={pending}>
        {pending ? "Memproses…" : "Daftar"}
      </button>
      {error && <p className="event-registration__notice" role="alert">{error}</p>}
    </div>;
  }

  return <div>
    <button type="button" className="event-button" onClick={openTeamDialog}>Daftar</button>
    <dialog ref={dialogRef} className="event-team-dialog" aria-labelledby="event-team-dialog-title">
      <div className="event-team-dialog__panel">
        <header className="event-team-dialog__header">
          <div>
            <span className="event-team-dialog__eyebrow">PENDAFTARAN TIM</span>
            <h2 id="event-team-dialog-title">{team.step === "code" ? "Tim berhasil dibuat" : team.step === "create" ? "Buat tim baru" : team.step === "join" ? "Join Tim" : "Pilih cara bergabung"}</h2>
          </div>
          <button type="button" className="event-team-dialog__close" onClick={closeTeamDialog} disabled={pending} aria-label="Tutup pendaftaran tim"><X aria-hidden="true" size={20} /></button>
        </header>

        {team.step === "choose" && <div className="event-team-dialog__choices">
          <button type="button" onClick={() => selectStep("create")}>
            <Users aria-hidden="true" size={22} />
            <span><b>Buat tim</b><small>Jadi ketua dan bagikan kode kepada rekan tim.</small></span>
          </button>
          <button type="button" onClick={() => selectStep("join")}>
            <UserPlus aria-hidden="true" size={22} />
            <span><b>Join Tim</b><small>Masukkan kode yang diberikan ketua tim.</small></span>
          </button>
        </div>}

        {team.step === "create" && <form className="event-team-dialog__form" onSubmit={createTeam}>
          <p>Masukkan nama tim. Kamu akan terdaftar sebagai ketua tim.</p>
          <label htmlFor={`team-name-${event.id}`}>Nama tim <b aria-label="wajib">*</b></label>
          <input id={`team-name-${event.id}`} value={team.name} onChange={(e) => setTeam((current) => ({ ...current, name: e.target.value.slice(0, 100), error: "" }))} required maxLength={100} autoComplete="off" placeholder="Contoh: Byte Builders" aria-describedby={team.error ? `team-error-${event.id}` : undefined} autoFocus />
          {team.error && <p id={`team-error-${event.id}`} className="event-team-dialog__error" role="alert">{team.error}</p>}
          <footer className="event-team-dialog__footer"><button type="button" className="event-team-dialog__secondary" onClick={() => selectStep("choose")} disabled={pending}>Kembali</button><button type="submit" className="event-team-dialog__primary" disabled={pending}>{pending ? "Membuat tim…" : "Lanjut"}</button></footer>
        </form>}

        {team.step === "join" && <form className="event-team-dialog__form" onSubmit={joinTeam}>
          <p>Masukkan kode tim. Permintaan bergabung akan diperiksa oleh ketua tim.</p>
          <label htmlFor={`team-code-${event.id}`}>Kode tim <b aria-label="wajib">*</b></label>
          <input id={`team-code-${event.id}`} value={team.code} onChange={(e) => setTeam((current) => ({ ...current, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16), error: "" }))} required minLength={3} maxLength={16} autoComplete="off" spellCheck="false" placeholder="Contoh: HACK01" aria-describedby={team.error ? `team-error-${event.id}` : undefined} autoFocus />
          {team.error && <p id={`team-error-${event.id}`} className="event-team-dialog__error" role="alert">{team.error}</p>}
          <footer className="event-team-dialog__footer"><button type="button" className="event-team-dialog__secondary" onClick={() => selectStep("choose")} disabled={pending}>Kembali</button><button type="submit" className="event-team-dialog__primary" disabled={pending}>{pending ? "Memeriksa kode…" : "Kirim permintaan"}</button></footer>
        </form>}

        {team.step === "code" && <div className="event-team-dialog__success">
          <p><b>{team.name}</b> sudah dibuat. Bagikan kode ini kepada rekan tim agar mereka dapat join.</p>
          <div className="event-team-code">
            <code>{team.code}</code>
            <button type="button" onClick={copyCode}><Copy aria-hidden="true" size={18} /> {team.copied ? "Tersalin" : "Salin kode"}</button>
          </div>
          <p className="event-team-dialog__hint" role="status" aria-live="polite">{team.copied ? "Kode tim berhasil disalin." : "Simpan kode ini sebelum melanjutkan ke dashboard."}</p>
          {team.error && <p className="event-team-dialog__error" role="alert">{team.error}</p>}
          <footer className="event-team-dialog__footer event-team-dialog__footer--end"><button type="button" className="event-team-dialog__primary" onClick={() => router.push(`/dashboard?event=${event.id}`)}>Lanjut</button></footer>
        </div>}
      </div>
    </dialog>
  </div>;
}
