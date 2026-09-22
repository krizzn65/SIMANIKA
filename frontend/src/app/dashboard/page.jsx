"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import "../register/register.css";
import "../reset-password/recovery.css";
import "./dashboard.css";

export default function DashboardPage() {
  const router = useRouter();
  const { user, checked: loadingComplete, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    setErrorMessage("");
    try {
      await logout();
      router.replace("/");
      router.refresh();
    } catch (error) {
      setIsLoggingOut(false);
      setErrorMessage(error instanceof Error ? error.message : "Gagal keluar dari sesi. Silakan coba lagi.");
    }
  }

  const initial = (user?.namaLengkap || user?.email || "U").charAt(0).toUpperCase();

  return (
    <ProtectedRoute><main className="register-page">
      <img src="/images/auth/pixel-corner-tl.svg" alt="" aria-hidden="true" className="register-pixel-corner register-pixel-corner--tl" />
      <img src="/images/auth/pixel-corner-br.svg" alt="" aria-hidden="true" className="register-pixel-corner register-pixel-corner--br" />

      <section className="register-card dashboard-card">
        <div className="register-heading" style={{ margin: "0 0 1.5rem" }}>
          <p className="register-eyebrow">SIMANIKA / DASHBOARD</p>
          <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)" }}>
            {!loadingComplete ? "Memuat akun..." : <>Selamat <em>datang.</em></>}
          </h1>
        </div>

        {user && (
          <div className="dashboard-user-info">
            <div className="dashboard-avatar" aria-hidden="true">{initial}</div>
            <div className="dashboard-meta">
              <p className="dashboard-email">{user.email}</p>
              <span className="dashboard-badge">{user.role || "Anggota"}</span>
            </div>
          </div>
        )}

        <div className="dashboard-actions">
          <Link href="/events" className="dashboard-btn-secondary">
            <span>Lihat Event</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/oprec" className="dashboard-btn-secondary">
            <span>Lihat OPREC</span>
            <span aria-hidden="true">→</span>
          </Link>
          {user && (
            <button
              type="button"
              className="dashboard-btn-logout"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <span className="dashboard-spinner" aria-hidden="true" />
                  <span>Mengeluarkan...</span>
                </>
              ) : (
                <span>Keluar</span>
              )}
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="recovery-error-banner" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p>{errorMessage}</p>
          </div>
        )}
      </section>
    </main></ProtectedRoute>
  );
}
