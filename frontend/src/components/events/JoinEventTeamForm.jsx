"use client";

import { useState } from "react";
import { api } from "@/services/api";

export function JoinEventTeamForm({ event }) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [joined, setJoined] = useState(false);

  async function submit(submission) {
    submission.preventDefault();
    if (pending) return;
    setPending(true); setMessage("");
    try {
      const { data } = await api.post("/user/events/" + event.id + "/join-team", { kode_unik: code.trim().toUpperCase() });
      if (data?.data?.joined !== true) throw new Error("Respons bergabung tidak valid.");
      setJoined(true); setCode("");
    } catch (error) { setMessage(error.response?.status === 401 ? "Masuk ke akun terlebih dahulu." : error.message || "Belum bisa bergabung ke tim."); }
    finally { setPending(false); }
  }

  return <form className="event-dynamic-form" onSubmit={submit}>
    <h2>Sudah punya kode tim?</h2>
    <p>Masukkan kode yang dibagikan ketua tim untuk bergabung.</p>
    {joined ? <p role="status" className="event-form-feedback">Berhasil bergabung ke tim. Lihat statusnya di dashboard akunmu.</p> : <>
      <label htmlFor="join-team-code">Kode tim</label>
      <input id="join-team-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16))} required maxLength={16} placeholder="Contoh: HACK01" />
      {message && <p role="alert" className="event-form-feedback">{message}</p>}
      <button className="event-button" type="submit" disabled={pending}>{pending ? "Memproses…" : "Gabung tim"}</button>
    </>}
  </form>;
}
