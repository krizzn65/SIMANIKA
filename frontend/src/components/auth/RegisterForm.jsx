"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { register, getGoogleAuthUrl } from "@/services/authClient";
import { registerSchema } from "@/lib/authSchemas";
import { safeNextPath } from "@/lib/safeNextPath";
import AuthFeedbackToast from "@/components/ui/AuthFeedbackToast";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.6C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9Z" />
      <path fill="#FF3D00" d="M6.3 14.7 12.9 19C14.6 14.8 18.9 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.6C34 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7Z" />
      <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.2-5.2C29.1 35.1 26.6 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.2 5.6l6.2 5.2C41.4 35.1 44 29.8 44 24c0-1.3-.1-2.6-.4-3.9Z" />
    </svg>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("idle");
  const [submitState, setSubmitState] = useState("idle");
  const [googleState, setGoogleState] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);
  const feedbackTimer = useRef(null);
  const { register: registerField, handleSubmit } = useForm({ resolver: zodResolver(registerSchema) });

  const clearFeedback = () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
    setFeedback("");
    setFeedbackStatus("idle");
  };

  const showFeedback = (status, message, autoDismiss = status === "loading" ? 0 : 4600) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
    setFeedbackStatus(status);
    setFeedback(message);
    if (autoDismiss > 0) feedbackTimer.current = setTimeout(clearFeedback, autoDismiss);
  };

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const submit = handleSubmit(async ({ nama, email, password }) => {
    setSubmitState("loading");
    showFeedback("loading", "Membuat akun dan menyiapkan profilmu…");
    try {
      const response = await register(email, password, nama);
      setSubmitState("success");
      showFeedback("success", "Akun berhasil dibuat. Verifikasi email untuk mengaktifkannya.");
      await new Promise((resolve) => setTimeout(resolve, 520));
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(response?.data?.emailVerifiedAt ? safeNextPath(next) : "/verify-email");
      router.refresh();
    } catch (error) {
      setSubmitState("error");
      showFeedback("error", error instanceof Error ? error.message : "Pendaftaran belum bisa diproses.");
    }
  }, (errors) => {
    setSubmitState("error");
    showFeedback("error", errors.nama?.message || errors.email?.message || errors.password?.message || errors.passwordConfirmation?.message || "Periksa kembali form pendaftaran.");
  });

  const handleGoogle = () => {
    setGoogleState("loading");
    showFeedback("loading", "Menghubungkan ke Google…");
    try {
      window.location.assign(getGoogleAuthUrl());
    } catch (error) {
      setGoogleState("idle");
      showFeedback("error", error instanceof Error ? error.message : "Login Google belum tersedia.");
    }
  };

  const submitLabel = submitState === "loading"
    ? "Membuat akun…"
    : submitState === "success"
      ? "Periksa email"
      : submitState === "error"
        ? "Coba lagi"
        : "Buat akun";

  return (
    <main className="register-page">
      <AuthFeedbackToast status={feedbackStatus} message={feedback} onDismiss={clearFeedback} />
      {/* Page corner pixel mosaic decorations (top-left & bottom-right) */}
      <img
        src="/images/auth/pixel-corner-tl.svg"
        alt=""
        aria-hidden="true"
        className="register-pixel-corner register-pixel-corner--tl pointer-events-none select-none"
      />
      <img
        src="/images/auth/pixel-corner-br.svg"
        alt=""
        aria-hidden="true"
        className="register-pixel-corner register-pixel-corner--br pointer-events-none select-none"
      />

      <div className="register-card">
          <Link
            className="register-back"
            href="/login"
            onClick={(e) => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                e.preventDefault();
                router.back();
              }
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12H4m0 0 6-6m-6 6 6 6" />
            </svg>
            <span>Kembali</span>
          </Link>

          <div className="register-heading">
            <p className="register-eyebrow">SIMANIKA / AKUN BARU</p>
            <h1>Buat <em>akun.</em></h1>
            <p>Satu akun untuk ikut kegiatan dan melangkah bersama HIMANIKA.</p>
          </div>

          <button
            className="register-google"
            type="button"
            onClick={handleGoogle}
            data-state={googleState}
            aria-busy={googleState === "loading"}
            disabled={googleState === "loading" || submitState === "loading" || submitState === "success"}
          >
            {googleState === "loading" ? <span className="register-state-spinner" aria-hidden="true" /> : <GoogleIcon />}
            <span>{googleState === "loading" ? "Menghubungkan ke Google…" : "Daftar dengan Google"}</span>
          </button>

          <div className="register-divider"><span>ATAU DENGAN EMAIL</span></div>

          <form className="register-form" onSubmit={submit} noValidate>
            <div className="register-field">
              <label htmlFor="register-nama">Nama Lengkap</label>
              <div className="register-input-wrap">
                <input
                  id="register-nama"
                  name="nama"
                  {...registerField("nama")}
                  type="text"
                  autoComplete="name"
                  placeholder="Nama lengkap kamu"
                />
              </div>
            </div>
            <div className="register-field">
              <label htmlFor="register-email">Email</label>
              <div className="register-input-wrap">
                <input
                  id="register-email"
                  name="email"
                  {...registerField("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>
            <div className="register-field">
              <label htmlFor="register-password">Password</label>
              <div className="register-input-wrap">
                <input
                  id="register-password"
                  name="password"
                  {...registerField("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="register-input-toggle"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="register-field">
              <label htmlFor="register-password-confirmation">Konfirmasi Password</label>
              <div className="register-input-wrap">
                <input
                  id="register-password-confirmation"
                  name="passwordConfirmation"
                  {...registerField("passwordConfirmation")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi"
                  required
                />
              </div>
            </div>
            <button
              className="register-submit"
              type="submit"
              data-state={submitState}
              aria-busy={submitState === "loading"}
              disabled={submitState === "loading" || submitState === "success" || googleState === "loading"}
            >
              <span>{submitLabel}</span>
              <span className="register-submit__icon-slot" aria-hidden="true">
                {submitState === "loading" && <span className="register-state-spinner" />}
                {submitState === "success" && <span className="register-state-check">✓</span>}
                {submitState === "error" && <span className="register-state-error">×</span>}
                <svg
                  className={`register-submit__icon register-submit__icon--primary${submitState !== "idle" ? " register-submit__icon--hidden" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12h16" />
                  <path d="m14 6 6 6-6 6" />
                </svg>
                <svg
                  className={`register-submit__icon register-submit__icon--secondary${submitState !== "idle" ? " register-submit__icon--hidden" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12h16" />
                  <path d="m14 6 6 6-6 6" />
                </svg>
              </span>
            </button>
          </form>

        <p className="register-login">Sudah punya akun? <Link href="/login">Masuk di sini <span aria-hidden="true">↗</span></Link></p>
      </div>
  </main>
  );
}
