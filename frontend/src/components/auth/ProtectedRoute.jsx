"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { adminHome, canAccessAdminPath } from "@/lib/roleAccess";

export function ProtectedRoute({ children, admin = false }) {
  const { checked, checkError, retryCheck, isAuthenticated, isAdmin, user } = useAuth();
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!checked || checkError || sessionExpired) return;
    if (!isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (admin && (!isAdmin || !canAccessAdminPath(user?.role, pathname))) router.replace(isAdmin ? adminHome(user?.role) : "/");
  }, [checked, checkError, sessionExpired, isAuthenticated, isAdmin, user?.role, admin, pathname, router]);

  if (checkError) return <div role="alert">Sesi akun belum dapat diperiksa. <button type="button" onClick={retryCheck}>Coba lagi</button></div>;
  if (sessionExpired) return null;
  if (!checked || !isAuthenticated || (admin && (!isAdmin || !canAccessAdminPath(user?.role, pathname)))) return null;
  return children;
}
