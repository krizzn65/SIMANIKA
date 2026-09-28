"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { canAccessAdminPath } from "@/lib/roleAccess";

export function AdminRoute({ children }) {
  const pathname = usePathname();
  const { user, checked, isAuthenticated, refresh } = useAuth();
  const [verifiedPath, setVerifiedPath] = useState(null);
  const [verificationError, setVerificationError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const onFocus = () => {
      setVerifiedPath(null);
      setAttempt((value) => value + 1);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!checked || !isAuthenticated) return;
    let active = true;
    setVerifiedPath(null);
    setVerificationError(false);
    refresh()
      .then(() => {
        if (active) setVerifiedPath(pathname);
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 401) useAuthStore.getState().clear();
        else setVerificationError(true);
      });
    return () => { active = false; };
  }, [checked, isAuthenticated, pathname, attempt, refresh]);

  return (
    <ProtectedRoute admin>
      {verificationError ? (
        <div role="alert">
          Hak akses belum dapat diverifikasi.{" "}
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>Coba lagi</button>
        </div>
      ) : verifiedPath === pathname && canAccessAdminPath(user?.role, pathname) ? children : null}
    </ProtectedRoute>
  );
}
