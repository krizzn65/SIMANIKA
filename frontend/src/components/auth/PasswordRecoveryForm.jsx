"use client";

import { useState } from "react";
import Link from "next/link";

export default function PasswordRecoveryForm({ mode, token = "", email = "" }) {
  const isReset = mode === "reset";
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "loading") return;
    if (isReset && (!token || !email)) {
      setStatus("error");
      setFeedback("Tautan reset tidak lengkap. Minta tautan baru dari halaman lupa sandi.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const body = isReset
      ? { token, email, password: String(form.get("password") || "") }
      : { email: String(form.get("email") || "").trim() };

    setStatus("loading");
    setFeedback("");
    try {
      const response = await fetch(isReset ? "/api/auth/reset-password" : "/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Layanan sedang bermasalah. Coba lagi nanti.");
      setStatus("success");
      setFeedback(isReset
        ? "Kata sandi berhasil diperbarui. Sekarang kamu bisa masuk dengan sandi baru."
        : "Jika email terdaftar, tautan reset akan dikirim ke kotak masuknya. Periksa juga folder spam.");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Layanan sedang bermasalah. Coba lagi nanti.");
    }
  }

  return (
    <main className="register-page recovery-page">
      <img src="/images/auth/pixel-corner-tl.svg" alt="" aria-hidden="true" className="register-pixel-corner register-pixel-corner--tl" />
      <img src="/images/auth/pixel-corner-br.svg" alt="" aria-hidden="true" className="register-pixel-corner register-pixel-corner--br" />
      <div className="register-card recovery-card">
        <Link className="register-back" href="/login">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 12H4m0 0 6-6m-6 6 6 6" />
          </svg>
          <span>Kembali ke Login</span>
        </Link>

        <div className="register-heading">
          <p className="register-eyebrow">SIMANIKA / {isReset ? "RESET SANDI" : "PEMULIHAN AKUN"}</p>
          <h1>{isReset ? <>Sandi <em>baru.</em></> : <>Lupa <em>sandi?</em></>}</h1>
          <p>{isReset ? "Buat kata sandi baru untuk akunmu." : "Masukkan email akunmu. Kami akan mengirimkan tautan untuk mengatur ulang sandi."}</p>
        </div>

        {isReset && (!token || !email) ? (
          <div className="recovery-notice" role="alert">
            <p>Tautan reset tidak lengkap atau tidak valid.</p>
            <Link href="/forgot-password">Minta tautan baru ↗</Link>
          </div>
        ) : status === "success" ? (
          <div className="recovery-notice recovery-notice--success" role="status">
            <p>{feedback}</p>
            {isReset && <Link href="/login">Masuk ke akun ↗</Link>}
          </div>
        ) : (
          <form className="register-form" onSubmit={handleSubmit}>
            {isReset ? (
              <div className="register-field">
                <label htmlFor="recovery-password">Password baru</label>
                <div className="register-input-wrap">
                  <input id="recovery-password" name="password" type="password" autoComplete="new-password" placeholder="Minimal 8 karakter" minLength={8} required />
                </div>
              </div>
            ) : (
              <div className="register-field">
                <label htmlFor="recovery-email">Email</label>
                <div className="register-input-wrap">
                  <input id="recovery-email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" required />
                </div>
              </div>
            )}
            <button className="register-submit" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Memproses..." : isReset ? "Simpan sandi baru" : "Kirim tautan reset"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        )}

        {status === "error" && <p className="register-feedback" role="alert">{feedback}</p>}
        {!isReset && <p className="register-login">Ingat sandimu? <Link href="/login">Masuk di sini ↗</Link></p>}
      </div>
    </main>
  );
}
