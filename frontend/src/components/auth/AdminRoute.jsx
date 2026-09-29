"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { canAccessAdminPath } from "@/lib/roleAccess";

export function AdminRoute({ children }) {
  const pathname = usePathname();
  const { user, checked, isAuthenticated, refresh } = useAuth();

  useEffect(() => {
    if (!checked || !isAuthenticated) return;
    let active = true;
    let pending = false;
    const verify = () => {
      if (pending) return;
      pending = true;
      refresh()
        .catch((error) => {
          if (active && error.response?.status === 401) useAuthStore.getState().clear();
        })
        .finally(() => { pending = false; });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") verify();
    };
    verify();
    window.addEventListener("focus", verify);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.removeEventListener("focus", verify);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [checked, isAuthenticated, pathname, refresh]);

  return (
    <ProtectedRoute admin>
      {canAccessAdminPath(user?.role, pathname) ? children : null}
    </ProtectedRoute>
  );
}
