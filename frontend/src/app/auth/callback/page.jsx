"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { currentUser } from "@/services/authClient";
import { safeNextPath } from "@/lib/safeNextPath";
import { STAFF_ROLES, adminHome, canAccessAdminPath } from "@/lib/roleAccess";
import AuthFeedbackToast from "@/components/ui/AuthFeedbackToast";

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
          if (!user?.emailVerifiedAt) {
            router.replace("/verify-email");
            return;
          }
          const nextParam = searchParams.get("next");
          const safeNext = nextParam ? safeNextPath(nextParam) : null;
          if (STAFF_ROLES.includes(user?.role)) {
            router.replace(safeNext && canAccessAdminPath(user?.role, safeNext) ? safeNext : adminHome(user?.role));
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
    <main
      style={{
        minHeight: "100dvh",
        background: "#ffffff",
        fontFamily: "'Inter Tight', Inter, sans-serif",
        color: "#07111f",
      }}
    >
      <AuthFeedbackToast
        status={errorMessage ? "error" : "loading"}
        message={errorMessage || "Menghubungkan akun Google dan menyiapkan sesi…"}
      />
    </main>
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
