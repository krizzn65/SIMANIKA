"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Copy, Crown, UsersRound, UserPlus, Trash2, X } from "lucide-react";
import { api } from "@/services/api";
import { AnimatedCheckIcon } from "@/components/ui/AnimatedCheckIcon";
import styles from "./workspace.module.css";

// Team management pattern: 21st.dev/@ruixen.ui/components/team-access-card.
// Copy/check crossfade adapted from 21st.dev/@zochory/components/copy-button-variants/icon-only.
export function TeamAccessPanel({ team, eventId, paymentStatus, htm, onRefresh }) {
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const dialogRef = useRef(null);
  const copyTimer = useRef(null);
  const mutationRef = useRef(false);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  useEffect(() => { if (selected) dialogRef.current?.showModal(); }, [selected]);

  async function copyCode() {
    setError("");
    try {
      await navigator.clipboard.writeText(team.code);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch { setError("Kode belum tersalin. Pilih teks kode lalu salin secara manual."); }
  }

  async function manage(member, action) {
    if (mutationRef.current) return;
    mutationRef.current = true;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data } = await api.post(`/user/events/${eventId}/teams/${team.id}/members/${member.id}`, { action });
      if (!data?.data?.updated) throw new Error("Perubahan belum dapat dipastikan. Perbarui halaman.");
      setMessage(action === "accept" ? `${member.name} berhasil diterima.` : `${member.name} ${member.status === "pending" ? "ditolak" : "dikeluarkan dari tim"}.`);
      dialogRef.current?.close(); setSelected(null);
      await onRefresh();
    } catch (err) {
      setError(err.message || "Perubahan belum berhasil. Coba lagi.");
      dialogRef.current?.close(); setSelected(null);
      await onRefresh();
    } finally { mutationRef.current = false; setBusy(false); }
  }

  const ready = team.memberCount >= team.minMembers;
  const full = team.memberCount >= team.maxMembers;
  const motionProps = reduced ? {} : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.18 } };

  function memberRow(member, pending = false) {
    return <motion.li key={member.id} {...motionProps} className={styles.member}>
      <span className={styles.avatar} aria-hidden="true">{member.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
      <div className={styles.memberInfo}><h3>{member.name}{member.isYou && <small> (kamu)</small>}</h3>
        <p>{member.role === "leader" ? <><Crown size={13} aria-hidden="true" /> Ketua tim</> : pending ? "Menunggu persetujuan" : "Anggota"}</p>
      </div>
      {!pending && <span className={styles.memberState} title="Anggota aktif"><AnimatedCheckIcon /><span>Aktif</span></span>}
      {team.canManage && member.role !== "leader" && <div className={styles.memberActions}>
        {pending && <button type="button" className={styles.acceptButton} disabled={busy || full} title={full ? "Tim sudah penuh" : undefined} onClick={() => manage(member, "accept")}><AnimatedCheckIcon active /> Terima</button>}
        <button type="button" className={styles.removeButton} disabled={busy} onClick={() => setSelected(member)} aria-label={`${pending ? "Tolak" : "Hapus"} ${member.name}`}>{pending ? <X size={14} aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}{pending ? "Tolak" : "Hapus"}</button>
      </div>}
    </motion.li>;
  }

  return <>
    <section className={styles.panel}>
      <p className={styles.eyebrow}>TIM KAMU</p>
      <h2 className={styles.teamName}>{team.name}</h2>
      {team.code && <><div className={styles.codeBox}><code>{team.code}</code><button className={styles.copyButton} type="button" onClick={copyCode}>
        <span className={styles.copyIcons} aria-hidden="true"><span style={{ opacity: copied ? 0 : 1, transform: copied ? "scale(.6)" : "scale(1)" }}><Copy size={16} /></span><span style={{ opacity: copied ? 1 : 0, transform: copied ? "scale(1)" : "scale(.6)" }}><AnimatedCheckIcon active={copied} /></span></span>
        {copied ? "Tersalin" : "Salin"}</button></div><p className={styles.hint}>Bagikan kode kepada rekanmu. Ketua menyetujui setiap permintaan bergabung.</p></>}
      <span className={styles.srOnly} role="status">{copied ? "Kode tim berhasil disalin" : ""}</span>
      <div className={styles.payment}><span>Administrasi{htm ? <small>Rp{new Intl.NumberFormat("id-ID").format(htm)}</small> : null}</span><strong className={paymentStatus === "paid" ? styles.paid : paymentStatus === "unpaid" ? styles.unpaid : styles.free}>{paymentStatus === "paid" ? "Paid" : paymentStatus === "unpaid" ? "Unpaid" : "Free"}</strong></div>
    </section>
    {team.membershipStatus === "accepted" && <section className={styles.panel} aria-label="Anggota tim">
      <div className={styles.panelHeader}><h2><UsersRound size={18} aria-hidden="true" /> Anggota tim</h2><span className={styles.count}>{team.memberCount}/{team.maxMembers}</span></div>
      <div className={styles.progress} role="progressbar" aria-label="Jumlah anggota tim" aria-valuenow={team.memberCount} aria-valuemin={0} aria-valuemax={team.maxMembers}><span className={ready ? styles.progressReady : styles.progressWaiting} style={{ width: `${Math.min(100, team.memberCount / team.maxMembers * 100)}%` }} /></div>
      <p className={styles.hint}>{ready ? "Minimum anggota terpenuhi" : `Perlu ${team.minMembers - team.memberCount} anggota lagi`} · Min. {team.minMembers}, maks. {team.maxMembers}</p>
      <ul className={styles.members}><AnimatePresence initial={false}>{team.members.map((member) => memberRow(member))}</AnimatePresence></ul>
      {team.isLeader && <div className={styles.requests}><h3><UserPlus size={16} aria-hidden="true" /> Permintaan bergabung <span>{team.requests.length}</span></h3>
        {team.requests.length ? <><ul className={styles.members}><AnimatePresence initial={false}>{team.requests.map((member) => memberRow(member, true))}</AnimatePresence></ul>{full && <p className={styles.hint}>Tim penuh. Permintaan belum bisa diterima.</p>}</> : <p className={styles.hint}>Belum ada permintaan baru.</p>}
      </div>}
      {team.lockReason && <p className={styles.hint}>{team.lockReason}</p>}
    </section>}
    {message && <p className={styles.feedback} role="status">{message}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="remove-title" onCancel={(event) => { if (busy) event.preventDefault(); else setSelected(null); }} onClose={() => setSelected(null)}>
      <h2 id="remove-title">{selected?.status === "pending" ? "Tolak permintaan?" : "Hapus anggota?"}</h2>
      <p>{selected?.name} {selected?.status === "pending" ? "tidak akan bergabung dengan tim ini." : "akan dikeluarkan dari tim dan kehilangan akses ke formulir tim."}</p>
      <footer><button type="button" className={styles.button} disabled={busy} onClick={() => dialogRef.current?.close()} autoFocus>Batal</button><button type="button" className={styles.dangerButton} disabled={busy || !selected} onClick={() => manage(selected, "remove")}>{busy ? "Memproses…" : selected?.status === "pending" ? "Tolak permintaan" : "Hapus anggota"}</button></footer>
    </dialog>
  </>;
}
