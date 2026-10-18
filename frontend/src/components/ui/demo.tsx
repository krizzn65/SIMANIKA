"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInPage } from "@/components/ui/sign-in";
import { login, getGoogleAuthUrl } from "@/services/authClient";
import { loginSchema } from "@/lib/authSchemas";
import { safeNextPath } from "@/lib/safeNextPath";
import { STAFF_ROLES, adminHome, canAccessAdminPath } from "@/lib/roleAccess";
import AuthFeedbackToast from "@/components/ui/AuthFeedbackToast";

export const SignInPageDemo = () => {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [googleState, setGoogleState] = useState<"idle" | "loading">("idle");
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { register, handleSubmit } = useForm<{ email: string; password: string; rememberMe: boolean }>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const clearFeedback = () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
    setFeedback(null);
    setFeedbackStatus("idle");
  };

  const showFeedback = (status: "loading" | "success" | "error", message: string, autoDismiss = status === "loading" ? 0 : 4600) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
    setFeedbackStatus(status);
    setFeedback(message);
    if (autoDismiss > 0) {
      feedbackTimer.current = setTimeout(clearFeedback, autoDismiss);
    }
  };

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (params.get("reason") === "session_expired" || error === "session_expired") {
      showFeedback("error", "Sesi Anda telah berakhir karena tidak ada aktivitas selama 2 jam. Silakan masuk kembali.");
    } else if (error === "google_cancelled") {
      showFeedback("error", "Login dengan akun Google dibatalkan.");
    } else if (error === "google_not_configured") {
      showFeedback("error", "Google OAuth belum dikonfigurasi di server (.env).");
    } else if (error === "google_failed" || error === "google_session_failed") {
      showFeedback("error", "Gagal memproses otentikasi Google. Silakan coba lagi.");
    } else if (error === "google_no_email") {
      showFeedback("error", "Akun Google tidak memiliki alamat email publik.");
    } else if (error === "google_unverified_email") {
      showFeedback("error", "Alamat email akun Google belum terverifikasi.");
    } else if (error === "google_account_exists") {
      showFeedback("error", "Email ini sudah memiliki akun. Masuk dengan kata sandi untuk mengaksesnya.");
    } else if (error === "google_link_password_required") {
      showFeedback("error", "Masuk sekali dengan email dan kata sandi akun yang sama untuk menghubungkan Google. Setelah itu, login Google bisa digunakan.", 0);
    } else if (error === "google_account_conflict") {
      showFeedback("error", "Akun ini sudah terhubung ke Google lain atau terdapat konflik data. Hubungi pengelola akun.", 0);
    } else if (error === "google_email_changed") {
      showFeedback("error", "Email akun Google berubah. Hubungi pengelola untuk memperbarui akun dengan aman.");
    }
  }, []);

  const handleSignIn = handleSubmit(async ({ email, password, rememberMe }) => {
    setSubmitState("loading");
    showFeedback("loading", "Memeriksa akun dan menyiapkan sesi…");
    try {
      const response = await login(email, password, rememberMe);
      const user = response?.data;
      setSubmitState("success");
      showFeedback("success", response?.googleLinkedNow
        ? "Akun Google berhasil dihubungkan. Login berikutnya bisa memakai Google."
        : "Berhasil masuk. Menyiapkan halamanmu…");
      await new Promise((resolve) => setTimeout(resolve, 520));
      const nextParam = new URLSearchParams(window.location.search).get("next");
      const safeNext = nextParam ? safeNextPath(nextParam) : null;
      if (!user?.emailVerifiedAt) {
        router.replace("/verify-email");
        router.refresh();
        return;
      }
      if (STAFF_ROLES.includes(user?.role)) {
        router.replace(safeNext && canAccessAdminPath(user?.role, safeNext) ? safeNext : adminHome(user?.role));
      } else {
        router.replace(safeNext || "/dashboard");
      }
      router.refresh();
    } catch (error) {
      setSubmitState("error");
      showFeedback("error", error instanceof Error ? error.message : "Login belum bisa diproses.");
    }
  }, (errors) => {
    setSubmitState("error");
    showFeedback("error", errors.email?.message || errors.password?.message || "Periksa kembali form login.");
  });

  const handleGoogleSignIn = () => {
    setGoogleState("loading");
    showFeedback("loading", "Menghubungkan ke Google…");
    try {
      window.location.assign(getGoogleAuthUrl());
    } catch (error) {
      setGoogleState("idle");
      showFeedback("error", error instanceof Error ? error.message : "Login Google belum tersedia.");
    }
  };

  return (
    <div className="bg-background text-foreground">
      <AuthFeedbackToast status={feedbackStatus} message={feedback} onDismiss={clearFeedback} />
      <SignInPage
        title={
          <span>
            Selamat <em>datang.</em>
          </span>
        }
        description="Satu pintu untuk mengambil peran, mengikuti kegiatan, dan terhubung dengan perjalanan HIMANIKA."
        heroImageSrc="/images/auth/minka-login.webp?v=2"
        onSignIn={handleSignIn}
        fieldRegister={register}
        onGoogleSignIn={handleGoogleSignIn}
        submitState={submitState}
        googleState={googleState}
      />
    </div>
  );
};

export default SignInPageDemo;

import Component from "@/components/ui/testimonial-v2";

export function DemoOne() {
  return <Component />;
}
