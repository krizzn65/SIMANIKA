"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Clock, LogIn } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { INACTIVITY_TIMEOUT_MS } from "@/lib/sessionConstants";

export { INACTIVITY_TIMEOUT_MS };
const THROTTLE_MS = 10 * 1000; // Throttle pencatatan aktivitas maksimal tiap 10 detik

export function SessionTimeoutModal() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const setSessionExpired = useAuthStore((state) => state.setSessionExpired);
  const clear = useAuthStore((state) => state.clear);

  const lastRecordedRef = useRef(0);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordedRef.current >= THROTTLE_MS) {
      lastRecordedRef.current = now;
      if (typeof window !== "undefined") {
        localStorage.setItem("simanika_last_activity", String(now));
      }
    }
  }, []);

  const checkInactivity = useCallback(() => {
    if (typeof window === "undefined") return;
    const { isAuthenticated: isAuth, sessionExpired: isExpired } = useAuthStore.getState();
    if (!isAuth || isExpired) return;

    // Jika user mengaktifkan "Ingat Saya" (Remember Me), batas inaktivitas 2 jam tidak berlaku
    if (localStorage.getItem("simanika_remember_me") === "true") return;

    const stored = localStorage.getItem("simanika_last_activity");
    if (!stored) {
      localStorage.setItem("simanika_last_activity", String(Date.now()));
      return;
    }

    const lastActivity = Number(stored);
    if (Number.isFinite(lastActivity) && Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
      setSessionExpired(true);
      clear();
      localStorage.removeItem("simanika_last_activity");
      localStorage.setItem("simanika_session_expired", "true");
      api.post("/auth/logout").catch(() => {});
    }
  }, [clear, setSessionExpired]);

  // Pasang listener aktivitas saat user terotentikasi tanpa remember-me
  useEffect(() => {
    if (!isAuthenticated || sessionExpired) return;
    if (typeof window !== "undefined" && localStorage.getItem("simanika_remember_me") === "true") {
      return;
    }

    const now = Date.now();
    lastRecordedRef.current = now;
    if (typeof window !== "undefined" && !localStorage.getItem("simanika_last_activity")) {
      localStorage.setItem("simanika_last_activity", String(now));
    }

    const onUserInteraction = () => recordActivity();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkInactivity();
    };
    const onWindowFocus = () => checkInactivity();
    const onStorage = (event) => {
      if (event.key === "simanika_session_expired" && event.newValue === "true") {
        setSessionExpired(true);
        clear();
      }
    };

    window.addEventListener("mousedown", onUserInteraction);
    window.addEventListener("keydown", onUserInteraction);
    window.addEventListener("scroll", onUserInteraction, { passive: true });
    window.addEventListener("touchstart", onUserInteraction, { passive: true });
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const interval = setInterval(checkInactivity, 15000);

    return () => {
      window.removeEventListener("mousedown", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
      window.removeEventListener("scroll", onUserInteraction);
      window.removeEventListener("touchstart", onUserInteraction);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(interval);
    };
  }, [isAuthenticated, sessionExpired, recordActivity, checkInactivity, setSessionExpired, clear]);

  const handleReturnToLogin = () => {
    setSessionExpired(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("simanika_session_expired");
      localStorage.removeItem("simanika_last_activity");
      const target =
        pathname && pathname !== "/login"
          ? `/login?reason=session_expired&next=${encodeURIComponent(pathname)}`
          : "/login?reason=session_expired";
      window.location.href = target;
    }
  };

  if (!sessionExpired) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center">
        {/* Icon Badge */}
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-5 shadow-sm">
          <Clock className="w-8 h-8" aria-hidden="true" />
        </div>

        {/* Eyebrow */}
        <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 mb-3">
          Sesi Kedaluwarsa
        </span>

        {/* Title */}
        <h2 id="session-timeout-title" className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Sesi Anda Telah Berakhir
        </h2>

        {/* Description */}
        <p id="session-timeout-desc" className="text-sm text-slate-600 leading-relaxed mb-6">
          Anda telah melewati batas waktu <strong>2 jam</strong> tanpa aktivitas. Demi keamanan akun Anda, sesi login telah dinonaktifkan secara otomatis.
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleReturnToLogin}
          className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Halaman Login</span>
        </button>
      </div>
    </div>
  );
}
