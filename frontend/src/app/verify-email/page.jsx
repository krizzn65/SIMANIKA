"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function VerifyEmailPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    currentUser()
      .then((response) => setUser(response?.data ?? null))
      .catch((error) => {
        if (error.response?.status !== 401) setMessage({ tone: "error", text: "Status akun belum dapat diperiksa. Muat ulang halaman ini." });
      })
      .finally(() => setLoading(false));
  }, []);

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

  const verified = Boolean(user?.emailVerifiedAt);

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
        ) : verified ? null : user ? (
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
