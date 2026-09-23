"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { currentUser } from "@/services/authClient";
import { safeNextPath } from "@/lib/safeNextPath";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const status = searchParams.get("status");
    const error = searchParams.get("error");

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (status === "success") {
      currentUser()
        .then((response) => {
          const user = response?.data;
          const nextParam = searchParams.get("next");
          const safeNext = nextParam ? safeNextPath(nextParam) : null;
          if (user?.role === "admin") {
            router.replace(safeNext && safeNext !== "/dashboard" ? safeNext : "/admin");
          } else {
            router.replace(safeNext || "/dashboard");
          }
          router.refresh();
        })
        .catch((err) => {
          console.error("Gagal memverifikasi sesi Google:", err);
          setErrorMessage("Sesi login Google tidak dapat diverifikasi.");
          setTimeout(() => {
            router.replace("/login?error=google_session_failed");
          }, 2000);
        });
    } else {
      router.replace("/login?error=google_failed");
    }
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#ffffff",
        fontFamily: "'Inter Tight', Inter, sans-serif",
        color: "#07111f",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "3px solid #eff6ff",
          borderTopColor: "#155eef",
          borderRadius: "50%",
          animation: "simanika-spin 0.8s linear infinite",
          marginBottom: "1.5rem",
        }}
      />
      <style>{`
        @keyframes simanika-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
        Menghubungkan Akun Google
      </h2>
      <p style={{ color: "#475467", fontSize: "0.95rem", margin: 0 }}>
        {errorMessage || "Mohon tunggu sebentar, kami sedang menyiapkan sesi Anda..."}
      </p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
          }}
        >
          <p style={{ color: "#475467", fontSize: "0.95rem" }}>Memuat...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
