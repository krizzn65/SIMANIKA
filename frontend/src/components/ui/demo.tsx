"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInPage } from "@/components/ui/sign-in";
import { login, getGoogleAuthUrl } from "@/services/authClient";
import { loginSchema } from "@/lib/authSchemas";
import { safeNextPath } from "@/lib/safeNextPath";

export const SignInPageDemo = () => {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<{ email: string; password: string; rememberMe: boolean }>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "google_cancelled") {
      setFeedback("Login dengan akun Google dibatalkan.");
    } else if (error === "google_not_configured") {
      setFeedback("Google OAuth belum dikonfigurasi di server (.env).");
    } else if (error === "google_failed" || error === "google_session_failed") {
      setFeedback("Gagal memproses otentikasi Google. Silakan coba lagi.");
    } else if (error === "google_no_email") {
      setFeedback("Akun Google tidak memiliki alamat email publik.");
    } else if (error === "google_unverified_email") {
      setFeedback("Alamat email akun Google belum terverifikasi.");
    } else if (error === "google_account_exists") {
      setFeedback("Email ini sudah memiliki akun. Masuk dengan kata sandi untuk mengaksesnya.");
    }
  }, []);

  const handleSignIn = handleSubmit(async ({ email, password, rememberMe }) => {
    setFeedback(null);
    try {
      await login(email, password, rememberMe);
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(safeNextPath(next));
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Login belum bisa diproses.");
    }
  }, (errors) => setFeedback(errors.email?.message || errors.password?.message || "Periksa kembali form login."));

  const handleGoogleSignIn = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <div className="bg-background text-foreground">
      {feedback && (
        <div
          role="alert"
          style={{
            position: "fixed",
            top: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            backgroundColor: "#ffffff",
            color: "#0a1020",
            border: "1px solid #cad5e5",
            padding: "0.85rem 1.25rem",
            borderRadius: "6px",
            boxShadow: "3px 3px 0 #cad5e5",
            maxWidth: "min(400px, calc(100vw - 3rem))",
            fontSize: "0.9rem",
            fontFamily: "inherit",
          }}
        >
          {feedback}
        </div>
      )}
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
      />
    </div>
  );
};

export default SignInPageDemo;

import Component from "@/components/ui/testimonial-v2";

export function DemoOne() {
  return <Component />;
}
