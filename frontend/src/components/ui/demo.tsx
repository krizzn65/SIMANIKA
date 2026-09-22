"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInPage } from "@/components/ui/sign-in";
import { login } from "@/services/authClient";

export const SignInPageDemo = () => {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFeedback(null);
    try {
      await login(String(form.get("email") || ""), String(form.get("password") || ""), form.get("rememberMe") === "on");
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && /^\/(?!\/)/.test(next) ? next : "/dashboard");
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Login belum bisa diproses.");
    }
  };

  const handleGoogleSignIn = () => {
    setFeedback("Login Google belum tersedia.");
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
