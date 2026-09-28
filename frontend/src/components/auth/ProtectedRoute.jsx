"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { adminHome, canAccessAdminPath } from "@/lib/roleAccess";

export function ProtectedRoute({ children, admin = false }) {
  const { checked, checkError, retryCheck, isAuthenticated, isAdmin, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!checked || checkError) return;
    if (!isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (admin && (!isAdmin || !canAccessAdminPath(user?.role, pathname))) router.replace(isAdmin ? adminHome(user?.role) : "/");
  }, [checked, checkError, isAuthenticated, isAdmin, user?.role, admin, pathname, router]);

  if (checkError) return <div role="alert">Sesi akun belum dapat diperiksa. <button type="button" onClick={retryCheck}>Coba lagi</button></div>;
  if (!checked || !isAuthenticated || (admin && (!isAdmin || !canAccessAdminPath(user?.role, pathname)))) return null;
  return children;
}
