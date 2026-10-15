"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { canAccessAdminPath } from "@/lib/roleAccess";

export function AdminRoute({ children }) {
  const pathname = usePathname();
  const { user, checked, isAuthenticated, refresh } = useAuth();

  useEffect(() => {
    if (!checked || !isAuthenticated) return;
    let pending = false;
    const verify = () => {
      if (pending) return;
      pending = true;
      refresh()
        .catch(() => {})
        .finally(() => { pending = false; });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") verify();
    };
    verify();
    window.addEventListener("focus", verify);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
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
