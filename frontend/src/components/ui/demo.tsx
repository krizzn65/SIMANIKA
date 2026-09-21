"use client";

import React, { useState } from "react";
import { SignInPage } from "@/components/ui/sign-in";

export const SignInPageDemo = () => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("Layanan login belum tersedia. Silakan coba lagi setelah layanan diaktifkan.");
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
