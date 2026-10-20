"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Mail, RotateCw } from "lucide-react";
import { currentUser, resendVerification } from "@/services/authClient";
import "../register/register.css";
import "./verify-email.css";

const RESEND_COOLDOWN = 60;

const steps = [
  "Buka kotak masuk email kamu (cek juga folder spam).",
  "Klik tombol verifikasi pada email dari SIMANIKA.",
  "Kembali ke sini, akunmu siap digunakan.",
];

const CHANNEL = "simanika-auth";
const VERIFIED_KEY = "simanika_email_verified_at";
const RECHECK_MS = 8000;

// Email apps always open the verification link in a new tab. That tab tells
// the original SIMANIKA tab (BroadcastChannel, with a storage-event fallback)
// so the original tab can continue on its own.
function announceVerified() {
  try { new BroadcastChannel(CHANNEL).postMessage("email-verified"); } catch {}
  try { localStorage.setItem(VERIFIED_KEY, String(Date.now())); } catch {}
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState(null);
  const [fromEmailLink, setFromEmailLink] = useState(false);

  const refresh = useCallback(() => currentUser()
    .then((response) => setUser(response?.data ?? null))
    .catch((error) => {
      if (error.response?.status !== 401) setMessage({ tone: "error", text: "Status akun belum dapat diperiksa. Muat ulang halaman ini." });
    })
    .finally(() => setLoading(false)), []);

  useEffect(() => {
    const linked = new URLSearchParams(window.location.search).get("status") === "success";
    setFromEmailLink(linked);
    if (linked) announceVerified();
    refresh();
  }, [refresh]);

  const verified = Boolean(user?.emailVerifiedAt) || fromEmailLink;

  // Original tab: re-check when the other tab reports success, when the user
  // comes back to this tab, and periodically while waiting.
  useEffect(() => {
    if (verified || !user) return undefined;
    let channel;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = (event) => { if (event.data === "email-verified") refresh(); };
    } catch {}
    const onStorage = (event) => { if (event.key === VERIFIED_KEY) refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    const timer = window.setInterval(refresh, RECHECK_MS);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      channel?.close();
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [verified, user, refresh]);

  // Once verified in the tab the user was already using, continue for them.
  useEffect(() => {
    if (fromEmailLink || !user?.emailVerifiedAt) return undefined;
    const timer = window.setTimeout(() => router.replace("/dashboard"), 2500);
    return () => window.clearTimeout(timer);
  }, [fromEmailLink, user, router]);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    if (sending || cooldown) return;
    setSending(true);
    setMessage(null);
    try {
      await resendVerification();
      setMessage({ tone: "success", text: "Tautan baru sudah dikirim. Periksa kotak masuk dan folder spam." });
      setCooldown(RESEND_COOLDOWN);
    } catch (error) {
      setMessage({ tone: "error", text: error?.response?.status === 404
        ? "Layanan kirim ulang verifikasi belum tersedia. Hubungi pengelola situs."
        : error instanceof Error ? error.message : "Email belum dapat dikirim. Coba lagi nanti." });
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="register-page verify-page">
      <img src="/images/auth/pixel-corner-tl.svg" alt="" aria-hidden="true" className="register-pixel-corner register-pixel-corner--tl" />
      <img src="/images/auth/pixel-corner-br.svg" alt="" aria-hidden="true" className="register-pixel-corner register-pixel-corner--br" />

      <div className="register-card verify-card">
        <div className={`verify-badge${verified ? " verify-badge--done" : ""}`} aria-hidden="true">
          {verified ? <Check size={30} strokeWidth={2.5} /> : <Mail size={30} strokeWidth={2} />}
        </div>

        <div className="register-heading">
          <p className="register-eyebrow">SIMANIKA / VERIFIKASI EMAIL</p>
          <h1>{verified ? <>Email <em>terverifikasi.</em></> : <>Periksa <em>emailmu.</em></>}</h1>
          <p>{verified ? "Terima kasih! Akunmu sudah aktif dan siap digunakan." : "Satu langkah lagi sebelum akunmu bisa digunakan."}</p>
        </div>

        {loading ? (
          <div className="verify-skeleton" role="status" aria-label="Memeriksa akun"><span /><span /><span /></div>
        ) : verified ? (
          <p className="verify-message verify-message--success" role="status">
            {fromEmailLink
              ? "Tab SIMANIKA yang tadi kamu buka sudah diperbarui otomatis. Kamu boleh menutup tab ini dan kembali ke sana."
              : "Mengalihkan ke dashboard…"}
          </p>
        ) : user ? (
          <>
            <div className="verify-address">
              <span>Tautan dikirim ke</span>
              <strong>{user.email}</strong>
            </div>
            <ol className="verify-steps">
              {steps.map((step, index) => (
                <li key={step}><span className="verify-steps__index">{String(index + 1).padStart(2, "0")}</span>{step}</li>
              ))}
            </ol>
          </>
        ) : (
          <p className="verify-hint">Masuk ke akunmu untuk mengirim ulang tautan verifikasi.</p>
        )}

        {message && <p className={`verify-message verify-message--${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}

        {!loading && !verified && user && (
          <button className="register-submit verify-resend" type="button" disabled={sending || cooldown > 0} onClick={resend}>
            <RotateCw size={17} aria-hidden="true" className={sending ? "verify-spin" : undefined} />
            {sending ? "Mengirim..." : cooldown ? `Kirim ulang dalam ${cooldown} detik` : "Kirim ulang tautan"}
          </button>
        )}

        <p className="register-login">
          <Link href={verified && user ? "/dashboard" : "/login"}>
            {verified && user ? "Lanjut ke dashboard" : "Masuk ke akun"} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </p>
      </div>
    </main>
  );
}
