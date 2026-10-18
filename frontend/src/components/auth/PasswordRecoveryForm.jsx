"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/authSchemas";
import AuthFeedbackToast from "@/components/ui/AuthFeedbackToast";
import { publicApi } from "@/services/publicApi";

export default function PasswordRecoveryForm({ mode, token = "", email = "" }) {
  const isReset = mode === "reset";
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("idle");
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(isReset ? resetPasswordSchema : forgotPasswordSchema),
    defaultValues: { email, token },
  });

  const submitLabel = status === "loading"
    ? "Memproses…"
    : status === "error"
      ? "Coba lagi"
      : isReset
        ? "Simpan sandi baru"
        : "Kirim tautan reset";

  const submit = handleSubmit(async (values) => {
    if (status === "loading") return;
    if (isReset && (!token || !email)) {
      setStatus("error");
      setFeedback("Tautan reset tidak lengkap. Minta tautan baru dari halaman lupa sandi.");
      return;
    }

    const body = isReset
      ? { token, email: values.email, password: values.password }
      : { email: values.email };

    setStatus("loading");
    setFeedback("");
    try {
      await publicApi.post(isReset ? "/auth/reset-password" : "/auth/forgot-password", isReset ? { ...body, password_confirmation: values.password } : body);
      setStatus("success");
      setFeedback(isReset
        ? "Kata sandi berhasil diperbarui. Sekarang kamu bisa masuk dengan sandi baru."
        : "Jika email terdaftar, tautan reset akan dikirim ke kotak masuknya. Periksa juga folder spam.");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Layanan sedang bermasalah. Coba lagi nanti.");
    }
  }, (errors) => {
    setStatus("error");
    setFeedback(errors.email?.message || errors.password?.message || "Periksa kembali form.");
  });

  return (
    <main className="register-page recovery-page">
      <AuthFeedbackToast status={status} message={feedback} onDismiss={() => { setStatus("idle"); setFeedback(""); }} />
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
          <div className="recovery-notice recovery-notice--warning" role="alert">
            <p className="recovery-notice__text">Tautan reset tidak lengkap atau tidak valid. Minta tautan baru dari halaman lupa sandi.</p>
            <div className="recovery-notice__actions">
              <Link href="/forgot-password" className="recovery-btn-primary">
                <span>Minta Tautan Baru</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ) : status === "success" ? (
          <div className="recovery-notice recovery-notice--success" role="status">
            <div className="recovery-notice__icon-center" aria-hidden="true">
              <div className="recovery-icon-wrapper">
                <span className="recovery-icon-ping" />
                <span className="recovery-icon-sparkle">
                  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
                    <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
                  </svg>
                </span>
                <span className="recovery-icon-sparkle recovery-icon-sparkle--secondary">
                  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
                    <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
                  </svg>
                </span>
                <svg viewBox="0 0 24 24" className="recovery-notice__check-icon" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.2" className="recovery-check-circle" />
                  <path d="M7.5 12.5L10.5 15.5L16.5 9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="recovery-check-path" />
                </svg>
              </div>
            </div>
            <h3 className="recovery-notice__title">
              {isReset ? "Kata sandi berhasil diperbarui" : "Tautan berhasil dikirim"}
            </h3>
            <p className="recovery-notice__text">{feedback}</p>
          </div>
        ) : (
          <form className="register-form" onSubmit={submit} noValidate>
            {isReset ? (
              <><input type="hidden" {...register("email")} /><input type="hidden" {...register("token")} /><div className="register-field">
                <label htmlFor="recovery-password">Password baru</label>
                <div className="register-input-wrap">
                  <input id="recovery-password" {...register("password")} type="password" autoComplete="new-password" placeholder="Minimal 8 karakter" minLength={8} required />
                </div>
              </div></>
            ) : (
              <div className="register-field">
                <label htmlFor="recovery-email">Email</label>
                <div className="register-input-wrap">
                  <input id="recovery-email" {...register("email")} type="email" autoComplete="email" placeholder="nama@email.com" required />
                </div>
              </div>
            )}
            <button
              className="register-submit"
              type="submit"
              data-state={status}
              aria-busy={status === "loading"}
              disabled={status === "loading"}
            >
              <span>{submitLabel}</span>
              <span className="register-submit__icon-slot" aria-hidden="true">
                {status === "loading" && <span className="register-state-spinner" />}
                {status === "error" && <span className="register-state-error">×</span>}
                {status === "idle" && <span className="register-submit__arrow">→</span>}
              </span>
            </button>
          </form>
        )}

        {!isReset && status !== "success" && (
          <p className="register-login">Ingat sandimu? <Link href="/login">Masuk di sini ↗</Link></p>
        )}
      </div>
    </main>
  );
}
